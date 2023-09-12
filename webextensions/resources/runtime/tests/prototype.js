const props = [{
    "name": "connect"
  },{
    "name": "ContextType"
  },{
    "name": "getBackgroundClient",
    "backgroundOnly": true
  },{
    "name": "getBrowserInfo"
  },{
    "name": "getContexts",
    "backgroundOnly": true
  },{
    "name": "getFrameId",
  },{
    "name": "getManifest"
  },{
    "name": "getPlatformInfo",
    "backgroundOnly": true
  },{
    "name": "getURL"
  },{
    "name": "id"
  },{
    "name": "openOptionsPage",
    "backgroundOnly": true
  },{
    "name": "PlatformArch"
  },{
    "name": "PlatformNaclArch"
  },{
    "name": "PlatformOs"
  },{
    "name": "reload",
    "backgroundOnly": true
  },{
    "name": "requestUpdateCheck",
    "backgroundOnly": true
  },{
    "name": "RequestUpdateCheckStatus"
  },{
    "name": "restart",
    "backgroundOnly": true
  },{
    "name": "restartAfterDelay",
    "backgroundOnly": true
  },{
    "name": "sendMessage"
  },{
    "name": "setUninstallURL",
    "backgroundOnly": true
}]



const events = [{
    "name": "onConnect"
  },{
    "name": "onConnectExternal",
    "backgroundOnly": true
  },{
    "name": "onInstalled",
    "backgroundOnly": true
  },{
    "name": "onMessage"
  },{
    "name": "onMessageExternal",
    "backgroundOnly": true
  }, {
    "name": "OnInstalledReason"
  },{
    "name": "OnRestartRequiredReason"
  },{
    "name": "onStartup",
    "backgroundOnly": true
  },{
    "name": "onSuspend",
    "backgroundOnly": true
  },{
    "name": "onSuspendCanceled",
    "backgroundOnly": true
  },{
    "name": "onUpdateAvailable",
    "backgroundOnly": true
  },{
    "name": "onUserScriptConnect",
    "backgroundOnly": true
  },{
    "name": "onUserScriptMessage",
    "backgroundOnly": true
}]

emitTestResult(`browser.runtimeExists`, 'runtime' in browser)
emitTestResult(`browser.runtime.lastError Exists at all times`, 'lastError' in browser?.runtime)

const testingInForeground = isForeground();

for (const prop of props) {
  if (testingInForeground && !prop.backgroundOnly) {
    emitTestResult(`${prop.name}Exists`, prop.name in browser?.runtime)
  }
}

for (const e of events ) {
  if (testingInForeground && !e.backgroundOnly) {
    emitTestResult(`${e.name}Exists`, e.name in browser?.runtime)
  }
}
