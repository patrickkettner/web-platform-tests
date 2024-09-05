# mypy: allow-untyped-defs

import collections
import os
import re
import time
from typing import Mapping, MutableMapping, Type

from webdriver import error

from .base import (
    CrashtestExecutor,
    TestharnessExecutor,
)
from .executorwebdriver import (
    WebDriverCrashtestExecutor,
    WebDriverFedCMProtocolPart,
    WebDriverPrintRefTestExecutor,
    WebDriverProtocol,
    WebDriverRefTestExecutor,
    WebDriverTestharnessExecutor,
    WebDriverTestharnessProtocolPart,
)
from .protocol import LeakProtocolPart, ProtocolPart

here = os.path.dirname(__file__)


def make_sanitizer_mixin(crashtest_executor_cls: Type[CrashtestExecutor]):  # type: ignore[no-untyped-def]
    class SanitizerMixin:
        def __new__(cls, logger, browser, **kwargs):
            # Overriding `__new__` is the least worst way we can force tests to run
            # as crashtests at runtime while still supporting:
            #   * Class attributes (e.g., `extra_timeout`)
            #   * Pickleability for `multiprocessing` transport
            #   * The `__wptrunner__` product interface
            #
            # These requirements rule out approaches with `functools.partial(...)`
            # or global variables.
            if kwargs.get("sanitizer_enabled"):
                executor = crashtest_executor_cls(logger, browser, **kwargs)

                def convert_from_crashtest_result(test, result):
                    if issubclass(cls, TestharnessExecutor):
                        status = result["status"]
                        if status == "PASS":
                            status = "OK"
                        harness_result = test.make_result(status, result["message"])
                        # Don't report subtests.
                        return harness_result, []
                    # `crashtest` statuses are a subset of `(print-)reftest`
                    # ones, so no extra conversion necessary.
                    return cls.convert_result(executor, test, result)

                executor.convert_result = convert_from_crashtest_result
                return executor
            return super().__new__(cls)
    return SanitizerMixin


_SanitizerMixin = make_sanitizer_mixin(WebDriverCrashtestExecutor)


class ChromeDriverLeakProtocolPart(LeakProtocolPart):
    def get_counters(self) -> Mapping[str, int]:
        response = self.parent.cdp.execute_cdp_command("Memory.getDOMCountersForLeakDetection")
        counters: MutableMapping[str, int] = collections.Counter({
            counter["name"]: counter["count"]
            for counter in response["counters"]
        })
        # Exclude resources associated with User Agent CSS from leak detection,
        # since they are persisted through page navigation.
        counters["live_resources"] -= counters.pop("live_ua_css_resources", 0)
        return counters


class ChromeDriverTestharnessProtocolPart(WebDriverTestharnessProtocolPart):
    """Implementation of `testharness.js` tests controlled by ChromeDriver.

    The main difference from the default WebDriver testharness implementation is
    that the test window can be reused between tests for better performance.
    """
    def reset_browser_state(self):
        # TODO(web-platform-tests/wpt#48078): Find a cross-vendor way to clear
        # cookies for all domains.
        self.parent.cdp.execute_cdp_command("Network.clearBrowserCookies")
        # Reset default permissions that `test_driver.set_permission(...)` may
        # have altered.
        self.parent.cdp.execute_cdp_command("Browser.resetPermissions")
        # Chromium requires the `background-sync` permission for reporting APIs
        # to work. Not all embedders (notably, `chrome --headless=old`) grant
        # `background-sync` by default, so this CDP call ensures the permission
        # is granted for all origins, in line with the background sync spec's
        # recommendation [0].
        #
        # WebDriver's "Set Permission" command can only act on the test's
        # origin, which may be too limited.
        #
        # [0]: https://wicg.github.io/background-sync/spec/#permission
        params = {
            "permission": {"name": "background-sync"},
            "setting": "granted",
        }
        self.parent.cdp.execute_cdp_command("Browser.setPermission", params)


class ChromeDriverFedCMProtocolPart(WebDriverFedCMProtocolPart):
    def confirm_idp_login(self):
        return self.webdriver.send_session_command("POST",
                                                   f"{self.parent.vendor_prefix}/fedcm/confirmidplogin")


class ChromeDriverDevToolsProtocolPart(ProtocolPart):
    """A low-level API for sending Chrome DevTools Protocol [0] commands directly to the browser.

    Prefer using standard APIs where possible.

    [0]: https://chromedevtools.github.io/devtools-protocol/
    """
    name = "cdp"

    def setup(self):
        self.webdriver = self.parent.webdriver

    def execute_cdp_command(self, command, params=None):
        body = {"cmd": command, "params": params or {}}
        return self.webdriver.send_session_command("POST",
                                                   f"{self.parent.vendor_prefix}/cdp/execute",
                                                   body=body)

class ChromeDriverWebExtensionProtocolPart(WebDriverFedCMProtocolPart):
    def setup(self):
        self.webdriver = self.parent.webdriver

    def load_unpacked_extension(self, path):
        return self.webdriver.load_extension(path)



class ChromeDriverProtocol(WebDriverProtocol):
    implements = [
        ChromeDriverDevToolsProtocolPart,
        ChromeDriverFedCMProtocolPart,
        ChromeDriverTestharnessProtocolPart,
    ]
    for base_part in WebDriverProtocol.implements:
        if base_part.name not in {part.name for part in implements}:
            implements.append(base_part)

    # Prefix to apply to vendor-specific WebDriver extension commands.
    vendor_prefix = "goog"

    def __init__(self, executor, browser, capabilities, **kwargs):
        self.implements = list(ChromeDriverProtocol.implements)
        if getattr(browser, "leak_check", False):
            self.implements.append(ChromeDriverLeakProtocolPart)
        super().__init__(executor, browser, capabilities, **kwargs)


def _evaluate_leaks(executor_cls):
    if hasattr(executor_cls, "base_convert_result"):
        # Don't wrap more than once, which can cause unbounded recursion.
        return executor_cls
    executor_cls.base_convert_result = executor_cls.convert_result

    def convert_result(self, test, result, **kwargs):
        test_result, subtest_results = self.base_convert_result(test, result, **kwargs)
        if test_result.extra.get("leak_counters"):
            test_result = test.make_result("CRASH",
                                           test_result.message,
                                           test_result.expected,
                                           test_result.extra,
                                           test_result.stack,
                                           test_result.known_intermittent)
        return test_result, subtest_results

    executor_cls.convert_result = convert_result
    return executor_cls


@_evaluate_leaks
class ChromeDriverCrashTestExecutor(WebDriverCrashtestExecutor):
    protocol_cls = ChromeDriverProtocol


@_evaluate_leaks
class ChromeDriverRefTestExecutor(WebDriverRefTestExecutor, _SanitizerMixin):  # type: ignore
    protocol_cls = ChromeDriverProtocol


@_evaluate_leaks
class ChromeDriverTestharnessExecutor(WebDriverTestharnessExecutor, _SanitizerMixin):  # type: ignore
    protocol_cls = ChromeDriverProtocol

    def __init__(self, *args, reuse_window=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.reuse_window = reuse_window

    def get_or_create_test_window(self, protocol):
        test_window = self.protocol.testharness.persistent_test_window
        if test_window:
            try:
                # Mimic the "new window" WebDriver command by loading `about:blank`
                # with no other browsing history.
                protocol.base.set_window(test_window)
                protocol.base.load("about:blank")
                protocol.cdp.execute_cdp_command("Page.resetNavigationHistory")
            except error.NoSuchWindowException:
                test_window = self.protocol.testharness.persistent_test_window = None
        if not test_window:
            test_window = super().get_or_create_test_window(protocol)
        if self.reuse_window:
            self.protocol.testharness.persistent_test_window = test_window
        return test_window

    def _get_next_message_classic(self, protocol, url, test_window):
        try:
            return super()._get_next_message_classic(protocol, url, test_window)
        except error.JavascriptErrorException as js_error:
            # TODO(crbug.com/340662810): Cycle testdriver event loop to work
            # around `testharnessreport.js` flakily not loaded.
            if re.search(r'window\.__wptrunner_process_next_event is not a function',
                         js_error.message):
                time.sleep(0.05)
                return None
            raise


@_evaluate_leaks
class ChromeDriverPrintRefTestExecutor(WebDriverPrintRefTestExecutor,
                                       _SanitizerMixin):  # type: ignore
    protocol_cls = ChromeDriverProtocol
