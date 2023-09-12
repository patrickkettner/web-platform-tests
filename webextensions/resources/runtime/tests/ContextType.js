const validKeys = [
  "BACKGROUND",
  "OFFSCREEN_DOCUMENT",
  "POPUP",
  "SIDE_PANEL",
  "TAB"
]

emitTestResult(`ContextType is an object`, (() => {
  return typeof(browser.runtime.ContextType) === 'object'
})())

emitTestResult(`ContextType has all valid keys`, (() => {
  return !!browser.runtime.ContextType && validKeys.every(k => k in browser.runtime.ContextType && browser.runtime.ContextType[k] === k)
})())
