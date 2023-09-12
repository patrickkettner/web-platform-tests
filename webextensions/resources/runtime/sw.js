chrome.runtime.onConnect.addListener(
  function(a) {
    console.log(a.name);
  }
)
