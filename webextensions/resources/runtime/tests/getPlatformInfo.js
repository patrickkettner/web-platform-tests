function validPlatformInfoSchema(platformInfo) {
  const keys = {
    "arch": [
      "",
      "arm",
      "arm64",
      "mips",
      "mips64",
      "x86-32",
      "x86-64"
    ],
    "nacl_arch": [
      "",
      "arm",
      "mips",
      "mips64",
      "x86-32",
      "x86-64"
    ],
    "os": [
      "",
      "android",
      "cros",
      "fuchsia",
      "linux",
      "mac",
      "openbsd",
      "win"
    ]
  }
  return Object.keys(keys).every(k => {
    const propExists = k in platformInfo;
    const validValue = keys[k].includes(platformInfo[k])

    return propExists && validValue;
  })
}

asyncTests({
  "getPlatformInfo resolves a valid object": async () => {
    const info = await browser.runtime?.getPlatformInfo();
    return validPlatformInfoSchema(info)
  },
  "getPlatformInfo returns a Promise": async () => {
    return getType(browser.runtime?.getPlatformInfo()) === 'Promise'
  }
})
