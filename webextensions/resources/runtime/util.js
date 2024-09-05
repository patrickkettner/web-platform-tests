const browser = globalThis.browser || globalThis.chrome

const insideIframe = window.top !== window

function emitTestResult(name, result, isAsyncTest, asyncResult, ...more) {
  let detail = {
    WPTTestResults: true,
    name,
    result,
    isAsyncTest,
    asyncResult,
    more: [...more]
  };

  if ('cloneInto' in window) {
    detail = cloneInto(detail, window)
  }

  window.top.postMessage(detail, '*');
}

function isForeground() {
  // not accurate for firefox, but I can't find anything they have that is foreground only
  return 'window' in globalThis
}

function requestIframeTest(testName) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.id = testName.replace(/\s/g, '_');
    iframe.src = chrome.runtime.getURL(`utility_page.html?${testName}`);
    iframe.dataset.loaded = true;
    iframe.onload = () => {
      resolve(iframe);
    }
    document.body.appendChild(iframe);
  })
}

function emitAsyncTest(testName, result) {
  const _thisTest = tests[testName];
  emitTestResult(testName, null, true, result)
}

let tests = {};

window.addEventListener("message", async (event) => {
  // in order for the main window to track the result of the async tests,
  // we do not run the test until a signal is sent from outside the iframe to
  // inside of the iframe.
  if (insideIframe) {
    const testName = event.data
    // if a lookup testName in our tests object, and then execute the
    // relevant test function.
    const result = await tests[testName]()

    // once the test has resolved, emit the result from the iframe back
    // to the main frame, so WPT's async_test can resolve
    return emitAsyncTest(testName, result);
  }
})

async function asyncTests(_tests) {
  // for every test, we call emitAsyncTest with the test name this will start
  // WPT's async_test, which won't completly resolve until we call it again
  // with the same test name and test result
  for (const _test in _tests) {
    if (!(_test in tests)) {
      tests[_test] = _tests[_test]

      if (!insideIframe) {
        emitAsyncTest(_test)
      }

    }
  }
  if (!insideIframe) {
    // ensure that the iframe where we will actually execute the test is loaded
    // send a test name to the iframe via postMessage, which will trigger
    // that test to be run

    for (const _test in _tests) {
      const iframe = await requestIframeTest(_test)
      iframe.contentWindow.postMessage(_test, '*')
    }
  }
}

function getType(obj) {
  return Object.prototype.toString.call(obj).match(/\[object\s(.*?)\]/)?.[1]
}
