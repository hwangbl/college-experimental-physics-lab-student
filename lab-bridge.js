/* Connect each original lab to the unified navigation without altering its storage or calculations. */
(() => {
  'use strict';
  if (window.parent === window) return;
  const id = document.currentScript?.dataset.lab;
  if (!id) return;
  if(window.__physicsLabHubBridge?.id===id){window.__physicsLabHubBridge.report();return;}
  const selectors={young:'#progressText',resistance:'#progress-text',rings:'#progressText',polarization:'#progress-count',oscilloscope:'#progress-text',hall:'.progress-row small'};
  let timer,last='';
  function snapshot() {
    const data={type:'physics-lab-state',id,hash:location.hash};
    if(id==='hall') {
      try {
        const progress=JSON.parse(localStorage.getItem('hall-progress')||'{}');
        data.completed=['principle','apparatus','simulation','data'].filter(key=>progress?.[key]===true).length;
        data.total=4;
      } catch {data.completed=0;data.total=4;}
    } else {
      const text=document.querySelector(selectors[id])?.textContent||'';
      const count=text.match(/(\d+)\s*\/\s*(\d+)/);
      if(count){data.completed=Number(count[1]);data.total=Number(count[2]);}
    }
    return data;
  }
  function report() {
    const data=snapshot();
    const serialized=JSON.stringify(data);if(serialized===last)return;last=serialized;
    window.parent.postMessage(data,location.origin);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(report,150);}
  window.__physicsLabHubBridge={id,report,snapshot};
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
  if(id==='hall') {
    document.addEventListener('click',schedule);
    window.addEventListener('storage',event=>{if(event.key===null||event.key==='hall-progress')schedule();});
  }
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){window.parent.postMessage({type:'physics-lab-escape',id},location.origin);}});
})();
