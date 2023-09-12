asyncTests({
  "getBrowserInfo returns a Promise": async () => {
    try {
      return getType(browser.runtime?.getBrowserInfo()) === 'Promise'
    } catch (e) {
      return false
    }
  }
})
