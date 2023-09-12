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

function requestIframeTest() {
  return new Promise((resolve, reject) => {
    const iframe = document.querySelector('iframe');
    if (!iframe.dataset.loaded) {
      iframe.src = chrome.runtime.getURL('utility_page.html');
      iframe.dataset.loaded = true;
      iframe.onload = () => {
        resolve(iframe);
      };
    } else {
      return resolve(iframe);
    }
  })
}

function emitAsyncTest(name, result) {
  const _thisTest = tests[name];
  emitTestResult(name, null, true, result)
}

let tests = {};

window.addEventListener("message", async (event) => {
  // in order for the main window to track the result of the async tests,
  // we do not run the test until a signal is sent from outside the iframe to
  // inside of the iframe.
  if (insideIframe) {
  console.log(`event - ${event.data} - ${location.href}`)
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
  // WPT's async_test, which won't completly // resolve until we call it again
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
    const iframe = await requestIframeTest()
    // send a test name to the iframe via postMessage, which will trigger
    // that test to be run
    for (const _test in _tests) {
      iframe.contentWindow.postMessage(_test, '*')
    }
  }
}

function getType(obj) {
  return Object.prototype.toString.call(obj).match(/\[object\s(.*?)\]/)?.[1]
}
