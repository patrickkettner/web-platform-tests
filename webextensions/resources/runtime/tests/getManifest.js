const manifest = browser.runtime.getManifest();

emitTestResult(`browser.runtime.getManifest works`, (() => {
  return typeof(manifest) === 'object'
})())

emitTestResult(`browser.runtime.getManifest returns all properties, including non standard ones`, (() => {
  return 'nonStandardProp' in manifest
})())

emitTestResult(`browser.runtime.getManifest marks non provided values as undefined, rather than null`, (() => {
  return manifest.action === undefined
})())

// TODO current_locale is added to the object returned by getManifest, presumably if a locale is provided
// TODO update_url is hidden in Chrome when installed from the store, not sure how to test that
// TODO getManifest is only available in background scripts in safari
