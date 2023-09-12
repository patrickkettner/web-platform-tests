asyncTests({
  "requestUpdateCheck returns a Promise": async () => {
    try {
      return getType(browser.runtime?.requestUpdateCheck()) === 'Promise'
    } catch (e) {
      return false
    }
  }
})
