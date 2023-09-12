emitTestResult(`browser.runtime.getFrameId works`, (() => {
  return typeof(browser.runtime.getFrameId(self)) === 'number'
})())
