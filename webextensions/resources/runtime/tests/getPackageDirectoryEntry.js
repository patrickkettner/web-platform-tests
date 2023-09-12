asyncTests({
  "getPackageDirectoryEntry returns a DirectoryEntry object": () => {
    return new Promise((resolve, reject) => {
      if ('getPackageDirectoryEntry' in browser.runtime) {
        browser.runtime?.getPackageDirectoryEntry((directoryEntry) => {
          resolve(getType(directoryEntry) === 'DirectoryEntry')
        })
      } else {
        reject(false);
      }
    })
  }
})
