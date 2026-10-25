/* Connect each original lab to the unified navigation without altering its storage or calculations. */
(() => {
  'use strict';
  if (window.parent === window) return;
  const id = document.currentScript?.dataset.lab;
  if (!id) return;
  if(window.__physicsLabHubBridge?.id===id){window.__physicsLabHubBridge.report();return;}
  const selectors={young:'#progressText',resistance:'#progress-text',rings:'#progressText',polarization:'#progress-count',oscilloscope:'#progress-text'};
  let timer,last='';
  function report() {
    const text=document.querySelector(selectors[id])?.textContent||'';
    const count=text.match(/(\d+)\s*\/\s*(\d+)/);
    const data={type:'physics-lab-state',id,hash:location.hash};
    if(count){data.completed=Number(count[1]);data.total=Number(count[2]);}
    const serialized=JSON.stringify(data);if(serialized===last)return;last=serialized;
    window.parent.postMessage(data,location.origin);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(report,150);}
  window.__physicsLabHubBridge={id,report};
  for(const method of ['replaceState','pushState']) {
    const original=history[method];
    history[method]=function(...args){const result=original.apply(this,args);schedule();return result;};
  }
  function initialize(){
    const progress=document.querySelector(selectors[id]);
    if(progress)new MutationObserver(schedule).observe(progress,{childList:true,characterData:true,subtree:true});
    report();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
  window.addEventListener('hashchange',schedule);
  window.addEventListener('popstate',schedule);
  window.addEventListener('pagehide',report);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){window.parent.postMessage({type:'physics-lab-escape',id},location.origin);}});
})();
