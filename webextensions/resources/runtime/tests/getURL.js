emitTestResult(`browser.runtime.getURL will error when called with no arguments`, (() => {
  let erred = false
  try {
    browser.runtime.getURL()
  } catch (e) {
    erred = true
  }
  return erred
})())

emitTestResult(`browser.runtime.getURL returns a valid URL when give a string`, (() => {
  let erred = false
  let url;

  try {
    url = browser.runtime.getURL('asset')
    new URL(url);
  } catch (e) {
    erred = true
  }

  return typeof(url) === 'string' && erred === false
})())
