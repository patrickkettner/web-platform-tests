emitTestResult(`browser.runtime.getFrameId works`, (() => {
  if (typeof(browser.runtime.getFrameId) !== 'function') {
    return false
  }
  return typeof(browser.runtime.getFrameId(self)) === 'number'
})())
