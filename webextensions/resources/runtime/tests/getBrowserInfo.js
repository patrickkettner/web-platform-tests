asyncTests({
  "getBrowserInfo is a function": async () => {
    return getType(browser.runtime?.getBrowserInfo) === 'Function'
  },
  "getBrowserInfo returns a Promise": async () => {
    try {
      return getType(browser.runtime?.getBrowserInfo()) === 'Promise'
    } catch (e) {
      return false
    }
  }
})
