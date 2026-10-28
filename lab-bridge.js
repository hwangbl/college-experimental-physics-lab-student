/* Connect each original lab to the unified navigation without altering its storage or calculations. */
(() => {
  'use strict';
  if (window.parent === window) return;
  const bridgeScript = document.currentScript;
  const id = bridgeScript?.dataset.lab;
  if (!id) return;
  if(window.__physicsLabHubBridge?.id===id){window.__physicsLabHubBridge.report();return;}
  const selectors={young:'#progressText',resistance:'#progress-text',rings:'#progressText',polarization:'#progress-count',oscilloscope:'#progress-text',hall:'.progress-row small',spectrometer:'#progress-text'};
  const mastheads={rings:'header.site-header > .masthead.site-wrap',polarization:'header.site-header#sidebar > .masthead.page-wrap',oscilloscope:'body.academic-theme > header.academic-masthead',hall:'body > header > .masthead.wrap',spectrometer:'body > header.sp-masthead'};
  const navigations={young:'#nav',resistance:'.module-nav > nav',rings:'#mainNavigation > .nav-row',polarization:'#main-nav',oscilloscope:'#navigation',hall:'header > nav > .nav-row',spectrometer:'#spectrometer-nav'};
  const brands={young:'header.sidebar.site-header > .masthead > a.brand',resistance:'header.sidebar.site-header > .academic-masthead > a.brand',rings:'header.site-header > .masthead.site-wrap > a.brand',polarization:'header.site-header#sidebar > .masthead.page-wrap > a.brand',oscilloscope:'body.academic-theme > header.academic-masthead > a.academic-brand',hall:'body > header > .masthead.wrap > a.brand',spectrometer:'header.sp-masthead > a.sp-brand'};
  let timer,last='',progressView;
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
    if(progressView&&Number.isInteger(data.completed)&&Number.isInteger(data.total)&&data.total>0&&data.total<=50) {
      const completed=Math.max(0,Math.min(data.completed,data.total));
      progressView.hidden=false;
      progressView.querySelector('b').textContent=`${completed} / ${data.total}`;
      const track=progressView.querySelector('.progress-track');
      track.setAttribute('aria-valuemax',String(data.total));
      track.setAttribute('aria-valuenow',String(completed));
      track.querySelector('i').style.width=`${100*completed/data.total}%`;
    }
    const serialized=JSON.stringify(data);if(serialized===last)return;last=serialized;
    const nav=document.querySelector(navigations[id]),active=nav?.querySelector?.('.active');
    if(active&&nav.scrollWidth>nav.clientWidth) {
      nav.scrollLeft+=active.getBoundingClientRect().left-nav.getBoundingClientRect().left-(nav.clientWidth-active.getBoundingClientRect().width)/2;
    }
    window.parent.postMessage(data,location.origin);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(report,150);}
  window.__physicsLabHubBridge={id,report,snapshot};
  for(const method of ['replaceState','pushState']) {
    const original=history[method];
    history[method]=function(...args){const result=original.apply(this,args);schedule();return result;};
  }
  function initialize(){
    const brand=document.querySelector(brands[id]);
    if(brand) {
      const logoUrl=new URL('assets/favicon.svg',bridgeScript.src);
      const version=new URL(bridgeScript.src).searchParams.get('v');
      if(version)logoUrl.searchParams.set('v',version);
      const mark=document.createElement('img');
      mark.className='platform-brand-mark';mark.src=logoUrl.href;mark.alt='';mark.width=56;mark.height=59;
      const copy=document.createElement('span');
      copy.className='platform-brand-copy';
      const title=document.createElement('strong');title.textContent='大学物理实验';
      const subtitle=document.createElement('small');subtitle.textContent='PHYSICS LABORATORY';
      copy.append(title,subtitle);
      brand.classList.add('platform-lab-brand');
      brand.setAttribute('aria-label','大学物理实验，返回本实验概览');
      brand.replaceChildren(mark,copy);
    }
    const masthead=mastheads[id]&&document.querySelector(mastheads[id]);
    if(masthead) {
      progressView=document.createElement('div');
      progressView.className='platform-lab-progress';
      progressView.hidden=true;
      progressView.innerHTML='<div><span>预习进度</span><b></b></div><div class="progress-track" role="progressbar" aria-label="预习进度" aria-valuemin="0"><i></i></div><p>一步一步，把原理变成经验。</p>';
      masthead.appendChild(progressView);
    }
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
