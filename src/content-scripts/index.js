/**
 * Record user actions.
 *
 * For Click events find closest button element to event target if possible.
 *
 * @TODO try to find an input's label. See if label exists, if not, use place holder or title
 *
 * @TODO if url changes add a wait for page load action
 *
 */

import unique from 'unique-selector';
import {closest} from 'dom-utils';
import jQuery from 'jquery';

let options = {
  attributesToIgnore:['id']
}

let backgroundPageConnection = chrome.runtime.connect({
  name: 'contentScript'
});




function trackNodes(nodes,event,handler){
    nodes.forEach(node=>{
      node.addEventListener(event,handler);
    })
}




class EventRecorder {

  start () {
    console.log('content script starts execution now!!')
    const inputElements = document.querySelectorAll('input,textarea,select');
    const clickElements = document.querySelectorAll('a,button');

    trackNodes(inputElements,'change',this.handleChange.bind(this));
    trackNodes(clickElements,'click',this.handleChange.bind(this));

      document.addEventListener('copy',()=>{
        let selection = window.getSelection().toString();
        let message = {
          action:'ASSERTION',
          eventType: 'copy',
          selector: unique(e.target,options),
          expectedText : selection
        }
        sendMessage(message);
      });

    this.setupDomWatcher();

  }

  setupDomWatcher(){
    let that = this;
    let callback = function(mutationsList) {
      for(var mutation of mutationsList) {
        mutation.addedNodes.forEach((node)=>{
          if(node.nodeType===1){
            if(['SELECT','INPUT','TEXTAREA'].includes(node.nodeName)){
              jQuery(node).change(that.handleChange);
            }else if(['BUTTON','A'].includes(node.nodeName)){
              jQuery(node).find('a,button').click(that.handleClick);
            }
            else{
              jQuery(node).find('input,textarea,select').change(that.handleChange);
              jQuery(node).find('a,button').click(that.handleClick);
            }

          }
        })
      }
    };

    let observer = new MutationObserver(callback);

    observer.observe(document.body, {childList: true,subtree:true});
  }


  handleChange(e){

    let uniqueSelector =  unique(e.target,options);

    let message = {
      action: 'INPUT',
      eventType:'change',
      inputType:e.target.type,
      name:e.target.name,
      value: e.target.value,
      selector : uniqueSelector,
      inputLabel:''
    }
    sendMessage(message)
  }

  handleClick (e) {

    let element = closest(e.target,'button',true) || e.target;
    let uniqueSelector = unique(element,options);
    let message = {
      action: 'MOUSE',
      eventType:'click',
      selector : uniqueSelector,
      elementText: element.textContent
    }
    sendMessage(message)
  }
}


function sendMessage (message) {
  backgroundPageConnection.postMessage(message)
}

let eventRecorder = new EventRecorder();
eventRecorder.start();