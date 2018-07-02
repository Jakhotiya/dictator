import React, { Component } from 'react'

const Button = ({isRecording,start,stop})=>{
  if(isRecording){
    return (<button onClick={stop}>Stop</button>);
  }else{
    return (<button onClick={start}>Start</button>)
  }
}

/**
 *
 * @param Message item
 * @returns {*}
 * @constructor
 */
const Recording = ({item})=>{
  if(item.action==='MOUSE'){
    return (
      <li>
        <div><strong>Clicked on</strong></div>
        <div>Text : {item.elementText}</div>
        <div>Selector : {item.selector}</div>
        <div>Event Type : {item.eventType}</div>
      </li>
    );
  }

  if(item.action==='INPUT'){
    return (
      <li>
        <div><strong>Fill field</strong></div>
        <div>Field name : {item.name}</div>
        <div>Selector : {item.selector}</div>
        <div>Value : {item.value}</div>
      </li>
    );
  }

  if(item.action==='ASSERTION'){
    return (
      <li>
        <div><strong>Expect to see</strong></div>
        <div>Text : {item.expectedText}</div>
        <div>Selector : {item.selector}</div>
      </li>
    );
  }



}

const View = ({recording})=>{
  if(recording.length===0){
    return <h5>No recordings yet</h5>
  }
  return (
    <ol>
      {recording.map((item,index) => <Recording key={index} item={item}/>)}
    </ol>
  );
}

export default class AppContainer extends Component {

  constructor (props) {
    super(props)

    this.state = {
      isRecording:false,
      recording: []
    }

    this.backgroundPageConnection = null;

    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.cleanUp = this.cleanUp.bind(this)
  }

  render () {
    return (
      <div>
        <Button isRecording={this.state.isRecording} start={this.start} stop={this.stop}/>
        <View recording={this.state.recording}/>
      </div>
    )
  }


  componentWillMount(){
    this.backgroundPageConnection = chrome.runtime.connect({
      name: 'devtools'
    })
  }

  componentDidMount () {
    window.addEventListener("beforeunload", this.cleanUp);

  }

  cleanUp(){
    console.log('cleanup')
    this.stop();
  }

  start(){
    this.backgroundPageConnection.postMessage({action: "START_RECORDING",tabId:chrome.devtools.inspectedWindow.tabId});
    this.setState({isRecording:true});

    this.backgroundPageConnection.onMessage.addListener(message=>{
      console.log(message)
      if(message.action==='MOUSE' || message.action==='INPUT' || message.action==='ASSERTION'){
        let records = [...this.state.recording,message];
        this.setState({recording:records})
      }

    });
  }

   stop() {
     this.backgroundPageConnection.postMessage({action: "STOP_RECORDING"}, (response)=>{
       console.log(response)
     })
     this.setState({isRecording:false});

  }
}
