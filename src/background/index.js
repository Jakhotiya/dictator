
class Recorder {

  constructor () {
    this.isRunning = false;
    this.recording = [];
    this.tabId = null;
    this.lastUrl
  }


  start () {

    chrome.contextMenus.create({
      id: "wait-for-visible",
      title: 'Wait for visible',
      contexts: ["selection"]
    }, function(){
      console.log('context menu added')
    });

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
      switch (info.menuItemId) {
        case "wait-for-visible":
          console.log(info);
          break;
      }
    })

    chrome.webNavigation.onCompleted.addListener(this.handleCompletedNavigation.bind(this))
  }

  handleCommittedNavigation ({ transitionQualifiers, url }) {
    if (transitionQualifiers.includes('from_address_bar') || url === this.lastUrl) {
      this.handleMessage({ action: 'goto', url })
    }
  }

  handleMessage (message) {
    if (message.action === 'url') {
      this.lastUrl = message.value
    }
  }


  stop () {
    chrome.webNavigation.onCommitted.removeListener();
    //@TODO check if menu exists before trying to remove
    chrome.contextMenus.remove('wait-for-visible');
  }

  handleCompletedNavigation ({ url, frameId }) {
    if (frameId === 0 && this.tabId && this.isRunning) {
      chrome.tabs.executeScript(this.tabId,{ file: 'content-script.js' });
    }
  }



  boot () {

    let that = this;

    let openPorts = {};

    chrome.runtime.onConnect.addListener((port)=> {


      port.onDisconnect.addListener(function(){
        console.log('Port disconnected : ',port.name)
      })


      if(port.name==='devtools'){

        openPorts.devtools = port;
        console.log('Devtools connected')

        //handle messages comming from devtools
        port.onMessage.addListener((message)=>{

          if(message.action==='START_RECORDING'){
            that.isRunning = true;
            that.tabId = message.tabId;
            chrome.tabs.executeScript(that.tabId,{ file: 'content-script.js' });
            that.start();
            port.postMessage({'started':true});
          }
          else if(message.action==='STOP_RECORDING'){
            that.isRunning = false;
            that.stop()
            openPorts = {}
            port.postMessage({'stopped':true});
          }

        })

        //handle port disconnect

      }

      //handle messages comming from content script

      if(port.name==='contentScript'){
        console.log('contentScript port connnected')
        openPorts.contentScript = port;

        port.onMessage.addListener(message=>{
          if(message.action==='MOUSE' || message.action==='INPUT' || message.action==='ASSERTION'){
            //Devtools port will be always be available because content script is injected only when background script connects with devtools
            openPorts.devtools.postMessage(message);
            //For recording message in background script uncomment following line.
            // that.recording.push(message);
          }
        });
      }

    });
  }
}


const recorder = new Recorder()
recorder.boot()
