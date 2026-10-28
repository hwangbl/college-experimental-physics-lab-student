/* Count loaded experiments with an anonymous browser identifier, never lab data. */
(() => {
  'use strict';
  const config=window.PHYSICS_LAB_ANALYTICS||{};
  const labs=new Set(['young','resistance','rings','polarization','oscilloscope','hall','spectrometer']);
  const idKey='physics-lab-anonymous-browser-v1',cacheKey='physics-lab-visit-receipts-v1';
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const pending=new Map();
  let endpoint='',browserId;
  try {
    const url=new URL(config.endpoint);
    if(config.enabled===true&&location.origin===config.origin&&url.protocol==='https:'&&!url.username&&!url.password&&!url.hash&&!url.search)endpoint=url.href;
  }catch{}

  function dayInShanghai(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value=type=>parts.find(part=>part.type===type).value;
    return value('year')+'-'+value('month')+'-'+value('day');
  }
  function storedIdentity(){
    if(browserId)return browserId;
    try {
      const old=localStorage.getItem(idKey);
      if(uuid.test(old||''))return browserId=old;
      const generated=crypto.randomUUID();
      localStorage.setItem(idKey,generated);
      const saved=localStorage.getItem(idKey);
      return uuid.test(saved||'')?(browserId=saved):null;
    }catch{return null;}
  }
  function identity(){
    if(navigator.locks?.request)return navigator.locks.request(idKey,storedIdentity);
    return Promise.resolve(storedIdentity());
  }
  function readReceipt(day){
    try {
      const receipt=JSON.parse(localStorage.getItem(cacheKey)||'null');
      return receipt?.day===day&&receipt.endpoint===endpoint&&Array.isArray(receipt.labs)?receipt.labs.filter(lab=>labs.has(lab)):[];
    }catch{return [];}
  }
  function acknowledge(day,lab){
    try {localStorage.setItem(cacheKey,JSON.stringify({day,endpoint,labs:[...new Set([...readReceipt(day),lab])]}));}catch{}
  }
  function validDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T00:00:00Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  async function send(lab){
    const id=await identity();
    // Without persistent storage, skip instead of inventing a new visitor each time.
    if(!id)return false;
    for(let attempt=0;attempt<3;attempt++){
      try {
        const response=await fetch(endpoint,{
          method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'collect',lab,browser_id:id})
        });
        if(response.ok){
          const result=await response.json();
          if(result?.ok===true&&result.lab===lab&&validDay(result.day)){
            acknowledge(result.day,lab);
            return true;
          }
          return false;
        }
        if(response.status<500&&response.status!==429)return false;
      }catch{}
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
    }
    return false;
  }
  function visit(lab){
    if(!endpoint||!labs.has(lab)||navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return Promise.resolve(false);
    const day=dayInShanghai(),key=day+':'+lab;
    if(readReceipt(day).includes(lab))return Promise.resolve(true);
    if(pending.has(key))return pending.get(key);
    const request=send(lab).catch(()=>false).finally(()=>pending.delete(key));
    pending.set(key,request);
    return request;
  }
  window.PhysicsLabAnalytics=Object.freeze({visit,enabled:!!endpoint});
})();
