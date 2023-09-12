// This value can be hardcoded because we are setting the non standard `key` value in the manifest file
const chromeExtensionId = "lpfbbdfbioogmholbgopencanjfnedge"

function isPortObject(potentialPortObj) {
  const props = [{
    "name": "sender"
  },{
    "name": "onMessage",
    "type": "object"
  },{
    "name": "onDisconnect",
    "type": "object"
  },{
    "name": "name",
    "type": "string"
  },{
    "name": "disconnect",
    "type": "function"
  },{
    "name": "postMessage",
    "type": "function"
  }]

  return props.every((prop) => {
    const propExists = prop.name in potentialPortObj
    let correctType = true // default to true for cases of undefined
    if (prop.type) {
      correctType = typeof(potentialPortObj[prop.name]) === prop.type
    }

    return propExists && correctType;
  })
}


emitTestResult(`connect returns an object when called with no arguments`, (() => {
  const result = chrome.runtime.connect();
  return typeof(result) === 'object'
})())

emitTestResult(`connect returns a valid Port object`, (() => {
  const result = chrome.runtime.connect();
  return isPortObject(result)
})())

emitTestResult(`connect returns an object when called with an extension ID`, (() => {
  const result = chrome.runtime.connect(chromeExtensionId);
  return typeof(result) === 'object'
})())

emitTestResult(`Port object returned from connect sets the name when provided`, (() => {
  const name = "NAME_HAS_BEEN_SET";
  const result = chrome.runtime.connect(chromeExtensionId, {name});
  return result.name === name
})())

// TODO something for options includeTlsChannelId

emitTestResult(`connect `, (() => {
  const result = chrome.runtime.connect(chromeExtensionId);
  return typeof(result) === 'object'
})())

// TODO contetxt is invalidated when reloaded
