(() => {
  'use strict';
  const labs = [
    {id:'young',n:'01',name:'杨氏模量',en:'YOUNG’S MODULUS',category:'力学',description:'从金属丝的微小伸长出发，探索光杠杆放大与材料的弹性。',tags:['光杠杆','仪器读数','不确定度'],keywords:'拉伸法 金属丝 弹性模量 逐差法'},
    {id:'resistance',n:'02',name:'非线性电阻',en:'NONLINEAR RESISTANCE',category:'电学',description:'搭建伏安测量电路，在曲线中发现非线性元件的电学特征。',tags:['伏安特性','电路搭建','曲线分析'],keywords:'伏安法 测电阻 二极管 灯泡'},
    {id:'rings',n:'03',name:'牛顿环',en:'NEWTON’S RINGS',category:'光学',description:'走近明暗相间的干涉条纹，用精密读数测量透镜曲率。',tags:['等厚干涉','读数显微镜','图像分析'],keywords:'劈尖 干涉 环径 曲率半径'},
    {id:'polarization',n:'04',name:'光的偏振',en:'POLARIZATION OF LIGHT',category:'光学',description:'旋转偏振片、调整波片，让看不见的振动方向变得直观。',tags:['三维光路','马吕斯定律','偏振态'],keywords:'布儒斯特角 波片 线偏振 圆偏振 椭圆偏振'},
    {id:'oscilloscope',n:'05',name:'示波器的使用',en:'THE OSCILLOSCOPE',category:'电学',description:'调节真实感仪器面板，在波形与李萨如图形中读懂信号。',tags:['双通道波形','李萨如图形','频率测量'],keywords:'信号发生器 周期 校正 振幅 电压'}
  ];
  const sourceRepositories = {
    young:'young-modulus-lab-students',
    resistance:'nonlinear-resistance-lab-students',
    rings:'newton-rings-lab-students',
    polarization:'polarization-light-lab-students',
    oscilloscope:'oscilloscope-instrument-lab-students'
  };
  const liveSourceOrigin='https://hwangbl.github.io';
  const useLiveSources=location.origin===liveSourceOrigin;
  const sharedThemeUrl=new URL('hku-labs.css',document.baseURI).href;
  const bridgeUrl=new URL('lab-bridge.js',document.baseURI).href;
  function labUrl(lab,hash='') {
    const url=useLiveSources
      ? new URL(`${sourceRepositories[lab.id]}/index.html`,`${liveSourceOrigin}/`)
      : new URL(`labs/${lab.id}/index.html`,document.baseURI);
    url.hash=validHash(hash);
    return url.href;
  }
  const $ = s => document.querySelector(s);
  const storageKey = 'physics-lab-hub-v1';
  let records = {}, storageAvailable = true, category = '全部', query = '', currentLab = null, frame = null, frameTimer = null, toastTimer;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const lab of labs) {
      const r = value[lab.id];
      if (!r || typeof r !== 'object') continue;
      records[lab.id] = {lastVisited:Number.isFinite(r.lastVisited) ? r.lastVisited : 0,hash:validHash(r.hash),completed:Math.max(0,Number(r.completed)||0),total:Math.max(0,Number(r.total)||0)};
    }
    localStorage.setItem('physics-lab-hub-check','1');localStorage.removeItem('physics-lab-hub-check');
  } catch {storageAvailable=false;}
  function validHash(value) {return typeof value === 'string' && value.length < 220 && /^#[a-zA-Z0-9_\-/]*$/.test(value) ? value : '';}
  function save() {try {localStorage.setItem(storageKey,JSON.stringify(records));} catch {storageAvailable=false;showStorage();}}
  function showStorage() {$('#storage-status').textContent=storageAvailable?'学习记录保存在本机':'当前浏览器无法保存记录';}
  function toast(text) {$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
  function lastLab() {return labs.filter(l=>records[l.id]?.lastVisited).sort((a,b)=>records[b.id].lastVisited-records[a.id].lastVisited)[0];}
  function stateText(lab) {const r=records[lab.id];return r?.total ? `学习进度 ${Math.min(r.completed,r.total)} / ${r.total}` : r?.lastVisited ? '已开始探索' : '等待你的第一次探索';}
  function progressPercent(lab) {const r=records[lab.id];return r?.total ? Math.min(100,100*r.completed/r.total) : 0;}
  const arrow = '<span aria-hidden="true">↗</span>';
  $('#lab-nav').innerHTML=labs.map(l=>`<a href="#lab/${l.id}" data-lab-nav="${l.id}"><span class="lab-num">${l.n}</span>${l.name}<span class="small-arrow" aria-hidden="true">↗</span></a>`).join('');
  function heroArt() {return `<svg class="hero-art" viewBox="0 0 560 320" fill="none" aria-hidden="true"><defs><linearGradient id="wave" x1="20" x2="550"><stop stop-color="#00deff" stop-opacity="0"/><stop offset=".35" stop-color="#00deff" stop-opacity=".75"/><stop offset="1" stop-color="#00deff" stop-opacity=".2"/></linearGradient></defs><g stroke="#6fb7dd" stroke-opacity=".12"><ellipse cx="340" cy="161" rx="118" ry="118"/><ellipse cx="340" cy="161" rx="95" ry="95"/><ellipse cx="340" cy="161" rx="72" ry="72"/><ellipse cx="340" cy="161" rx="49" ry="49"/><path d="M100 160H545M340 15V305"/><path d="M256 77L425 246M256 245L425 77"/></g><g stroke="#6fb7dd" stroke-opacity=".09"><path d="M60 100H530M60 220H530M160 25V295M220 25V295M460 25V295"/></g><path d="M8 161C45 161 52 116 80 116S112 207 142 207S172 72 203 72S233 250 264 250S294 48 326 48S356 273 388 273S417 84 449 84S481 227 511 227S540 161 559 161" stroke="url(#wave)" stroke-width="1.6"/><path d="M8 161C45 161 52 135 80 135S112 187 142 187S172 110 203 110S233 211 264 211S294 96 326 96S356 224 388 224S417 117 449 117S481 199 511 199S540 161 559 161" stroke="#91ddff" stroke-opacity=".18"/><circle cx="340" cy="161" r="5" fill="#00deff"/><circle cx="340" cy="161" r="13" stroke="#00deff" stroke-opacity=".3"/><path d="M204 75V100M192 87H217M449 245V262M441 253H458" stroke="#c6edff" stroke-opacity=".6"/><g fill="#c5e4f3" fill-opacity=".6" font-family="Georgia,serif" font-style="italic"><text x="135" y="68" font-size="15">y = A sin(ωt + φ)</text><text x="442" y="46" font-size="15">λ</text><text x="276" y="295" font-size="12">observe · explore · understand</text></g></svg>`;}
  function renderHome() {
    const last=lastLab();
    $('#main').innerHTML=`<div class="overview"><div class="page-kicker"><span class="eyebrow">EXPLORE · EXPERIMENT · UNDERSTAND</span><span class="issue">INTERACTIVE LEARNING CENTRE</span></div><section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="hero-label">大学物理实验 · 交互学习平台</span><h1 id="hero-title"><span>在实验中，</span><span>理解物理。</span></h1><p>从观察现象，到亲手验证。<br>连接原理、仪器与数据，探索五个物理实验。</p><div class="hero-actions"><a class="hero-link hero-primary" href="#experiments">探索实验<span aria-hidden="true">→</span></a>${last?`<a class="hero-link hero-resume" href="#lab/${last.id}"><span>继续上次学习<small>${last.name}</small></span><span aria-hidden="true">↗</span></a>`:''}</div></div>${heroArt()}<span class="hero-index">LEARN PHYSICS. BY DOING.</span></section><div class="stats" aria-label="平台内容"><div class="stat"><strong>05<small>项</small></strong><span><b>交互实验</b>完整学习与实践</span></div><div class="stat"><strong>03<small>类</small></strong><span><b>物理领域</b>力学 · 电学 · 光学</span></div><div class="stat"><strong>∞</strong><span><b>探索的可能</b>反复操作，自主发现</span></div><div class="stat"><span class="stat-icon" aria-hidden="true">⌁</span><span><b>你的专属学习记录</b>在这台设备上，接续上次探索</span></div></div><section id="experiments" aria-labelledby="experiments-title"><div class="section-heading"><div><h2 id="experiments-title">探索实验</h2><p>从一个现象开始，走向背后的物理规律。</p></div><label class="search-box"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5"/></svg><input id="lab-search" type="search" placeholder="搜索实验、仪器或关键词" aria-label="搜索实验、仪器或关键词" autocomplete="off"></label></div><div class="filters-bar"><div class="filters" aria-label="按物理领域筛选">${['全部','力学','电学','光学'].map(c=>`<button class="filter${category===c?' active':''}" data-category="${c}" aria-pressed="${category===c}">${c}<small>${c==='全部'?5:labs.filter(l=>l.category===c).length}</small></button>`).join('')}</div><span id="result-count" class="result-count" aria-live="polite"></span></div><div class="lab-grid" id="lab-grid"></div></section><p class="overview-note"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor"/><path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="currentColor"/></svg>学习进度与实验数据保存在当前浏览器。实验结果请及时使用各实验的数据导出功能保存。</p></div>`;
    $('#lab-search').value=query;
    $('#lab-search').addEventListener('input',e=>{query=e.target.value;renderCards();});
    document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.category===category);btn.setAttribute('aria-pressed',String(btn.dataset.category===category));});renderCards();});
    renderCards();
  }
  function renderCards() {
    const term=query.trim().toLocaleLowerCase();
    const selected=labs.filter(l=>(category==='全部'||l.category===category)&&[l.name,l.en,l.category,l.description,...l.tags,l.keywords].join(' ').toLocaleLowerCase().includes(term));
    $('#result-count').textContent=`${selected.length} 个实验`;
    $('#lab-grid').innerHTML=selected.length?selected.map(l=>`<article class="lab-card"><a class="card-image" href="#lab/${l.id}" aria-label="进入${l.name}实验"><img src="assets/${l.id}.svg" alt="${l.name}实验示意图" width="800" height="460" loading="lazy"><span class="card-number">EXPERIMENT ${l.n}</span><span class="category-tag">${l.category}实验</span></a><div class="card-body"><div class="card-title-line"><h3><a href="#lab/${l.id}">${l.name}</a></h3><i class="card-dot" aria-hidden="true"></i></div><p class="card-en">${l.en}</p><p class="card-description">${l.description}</p><div class="card-tags">${l.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="card-bottom"><span class="card-state ${records[l.id]?'started':''}">${stateText(l)}</span><a class="enter-link" href="#lab/${l.id}">${records[l.id]?'继续实验':'进入实验'}${arrow}</a></div></div></article>`).join('')+(category==='全部'&&!term?`<aside class="guide-card"><span class="guide-icon" aria-hidden="true">⌁</span><h3>不止于知道，<br>更在于做到。</h3><p>每个实验都是一段完整的学习旅程。<br>按自己的节奏，一步一步探索。</p><div class="guide-sequence"><span>1</span>理解原理 <i>→</i><span>2</span>操作仪器</div><div class="guide-sequence" style="margin-top:9px"><span>3</span>动手实验 <i>→</i><span>4</span>处理数据</div><button id="guide-help">了解如何使用 <span aria-hidden="true">↗</span></button></aside>`:''):`<div class="empty-state"><h3>还没有找到对应的实验</h3><p>试试“干涉”“电路”或“波形”，也可以切换其他学科。</p><button class="button" id="clear-search">查看全部实验 →</button></div>`;
    $('#guide-help')?.addEventListener('click',openHelp);
    $('#clear-search')?.addEventListener('click',()=>{category='全部';query='';renderHome();$('#lab-search').focus();});
  }
  function renderRecent() {
    const recent=labs.filter(l=>records[l.id]?.lastVisited).sort((a,b)=>records[b.id].lastVisited-records[a.id].lastVisited);
    $('#main').innerHTML=`<div class="overview"><div class="recent-header"><span class="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h1>接续你的探索</h1><p>每一次动手，都让理解更进一步。这里保留着你在这台设备上的学习足迹。</p></div><div class="recent-list">${recent.length?recent.map(l=>`<article class="recent-row"><a href="#lab/${l.id}" aria-label="继续${l.name}"><img src="assets/${l.id}.svg" alt="${l.name}实验示意图" width="120" height="75"></a><div><h2>${l.name}</h2><p>上次学习：${new Date(records[l.id].lastVisited).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})} · ${stateText(l)}</p><div class="recent-progress" role="progressbar" aria-label="${l.name}学习进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progressPercent(l))}"><i style="width:${progressPercent(l)}%"></i></div></div><a class="button" href="#lab/${l.id}">继续学习 <span>→</span></a></article>`).join(''):`<div class="empty-state"><h3>第一段探索，正等你开启。</h3><p>进入任意实验后，你的学习足迹会出现在这里。</p><a href="#home" class="button primary">去选择实验 →</a></div>`}</div></div>`;
  }
  function renderLab(lab) {
    if(currentLab?.id===lab.id&&frame)return;
    clearTimeout(frameTimer);
    currentLab=lab;
    records[lab.id]={...records[lab.id],lastVisited:Date.now()};save();
    const url=labUrl(lab,records[lab.id].hash);
    $('#main').innerHTML=`<section class="lab-workspace" aria-label="${lab.name}实验工作区"><div class="lab-toolbar"><div class="lab-toolbar-left"><button class="lab-back" id="lab-back">← 实验总览</button><span class="toolbar-divider"></span><strong>${lab.name}</strong><select id="lab-switch" aria-label="切换实验">${labs.map(l=>`<option value="${l.id}" ${l.id===lab.id?'selected':''}>${l.n} · ${l.name}</option>`).join('')}</select></div><div class="lab-actions"><button id="focus-button" aria-pressed="false">⛶ 专注模式</button><a href="${url}" target="_blank" rel="noopener" id="standalone-link"><span class="standalone-text">独立打开 </span>↗</a></div></div><div class="frame-loading" id="frame-loading"><div><div class="spinner"></div><span id="frame-loading-label">正在准备${lab.name}实验…</span><div id="load-note" class="load-note"></div></div></div><iframe class="lab-frame" id="lab-frame" title="${lab.name}完整交互实验" allow="fullscreen" src="${url}"></iframe></section>`;
    frame=$('#lab-frame');
    const openedFrame=frame;
    let attempt=0;
    function isCurrent(){return frame===openedFrame&&currentLab?.id===lab.id;}
    function showFailure(message) {
      if(!isCurrent())return;
      const loading=$('#frame-loading'),note=$('#load-note');
      if(!loading||!note)return;
      loading.hidden=false;
      loading.querySelector('.spinner').hidden=true;
      const label=$('#frame-loading-label');if(label)label.textContent='实验暂时未能载入';
      const recovery=document.createElement('a');
      recovery.href=labUrl(lab,records[lab.id].hash);recovery.target='_blank';recovery.rel='noopener';
      recovery.className='button';recovery.textContent='打开原实验页面 ↗';
      const retry=document.createElement('button');retry.type='button';retry.className='button';retry.textContent='重新载入';
      retry.onclick=()=>{if(!isCurrent())return;attempt++;clearTimeout(frameTimer);loading.querySelector('.spinner').hidden=false;if(label)label.textContent=`正在准备${lab.name}实验…`;note.replaceChildren();openedFrame.src=labUrl(lab,records[lab.id].hash);frameTimer=setTimeout(()=>showFailure('载入时间较长。你可以重新载入，或直接打开原实验页面。'),12000);};
      const detail=document.createElement('p');detail.textContent=message;
      note.replaceChildren(detail,recovery,document.createTextNode(' '),retry);
    }
    openedFrame.addEventListener('load',async()=>{
      if(!isCurrent())return;
      const loadedAttempt=++attempt;
      clearTimeout(frameTimer);
      try {
        if(useLiveSources)await connectLiveLab(openedFrame,lab);
        if(isCurrent()&&loadedAttempt===attempt)$('#frame-loading')?.setAttribute('hidden','');
      }catch(error){if(loadedAttempt===attempt)showFailure('原实验或统一样式暂时不可用。请重新载入，或直接打开原实验页面。');}
    });
    openedFrame.addEventListener('error',()=>{clearTimeout(frameTimer);showFailure('网络连接失败。请检查连接后重新载入。');});
    frameTimer=setTimeout(()=>showFailure('载入时间较长。你可以重新载入，或直接打开原实验页面。'),12000);
    $('#lab-back').onclick=()=>{location.hash='home';};
    $('#lab-switch').onchange=e=>{location.hash='lab/'+e.target.value;};
    $('#focus-button').onclick=toggleFocus;
    $('#standalone-link').setAttribute('aria-label',`独立打开${lab.name}实验`);
    if(document.body.classList.contains('focus-mode')){$('#focus-button').setAttribute('aria-pressed','true');$('#focus-button').textContent='⊡ 退出专注';}
  }
  async function connectLiveLab(openedFrame,lab) {
    const expected=new URL(labUrl(lab));
    const actual=new URL(openedFrame.contentWindow.location.href);
    if(actual.origin!==location.origin||actual.origin!==liveSourceOrigin||actual.pathname!==expected.pathname)throw new Error('Unexpected experiment location');
    const doc=openedFrame.contentDocument;
    if(!doc?.head||!doc.body||/^(?:site not found|page not found|404)/i.test(doc.title))throw new Error('Experiment is unavailable');
    doc.body.setAttribute('data-platform-theme','hku');
    let link=doc.getElementById('physics-hub-theme');
    if(!link) {
      link=doc.createElement('link');link.id='physics-hub-theme';link.rel='stylesheet';link.href=sharedThemeUrl;
      const themeLoaded=new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error('Theme loading timed out')),10000);
        link.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});
        link.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Theme failed to load'));},{once:true});
      });
      doc.head.appendChild(link);
      await themeLoaded;
    }
    if(openedFrame!==frame||currentLab?.id!==lab.id)return;
    if(!doc.getElementById('physics-hub-bridge')) {
      const bridge=doc.createElement('script');bridge.id='physics-hub-bridge';bridge.src=bridgeUrl;bridge.dataset.lab=lab.id;
      doc.head.appendChild(bridge);
    }
    captureFrameState();
  }
  function toggleFocus() {const on=document.body.classList.toggle('focus-mode');const button=$('#focus-button');if(button){button.setAttribute('aria-pressed',String(on));button.textContent=on?'⊡ 退出专注':'⛶ 专注模式';}}
  function closeMenu() {$('#sidebar').classList.remove('open');$('#sidebar-shade').hidden=true;$('#menu-button').setAttribute('aria-expanded','false');}
  function captureFrameState() {
    if(!frame||!currentLab)return;
    try {
      const selector={young:'#progressText',resistance:'#progress-text',rings:'#progressText',polarization:'#progress-count',oscilloscope:'#progress-text'}[currentLab.id];
      const text=frame.contentDocument.querySelector(selector)?.textContent||'';
      const count=text.match(/(\d+)\s*\/\s*(\d+)/),r=records[currentLab.id];
      r.hash=validHash(frame.contentWindow.location.hash);
      if(count){r.completed=Number(count[1]);r.total=Number(count[2]);}
      save();
    }catch{}
  }
  function route() {
    captureFrameState();
    const hash=location.hash.slice(1),parts=hash.split('/'),lab=parts[0]==='lab'?labs.find(l=>l.id===parts[1]):null;
    if(parts[0]==='lab'&&!lab){location.replace('#home');toast('该实验入口不存在，已返回实验总览。');return;}
    const view=lab?'lab':hash==='recent'?'recent':'home';
    if(!lab){clearTimeout(frameTimer);currentLab=null;frame=null;document.body.classList.remove('focus-mode');}
    document.body.classList.toggle('lab-mode',!!lab);$('#footer').hidden=!!lab;
    $('#breadcrumb').textContent=lab?lab.name:view==='recent'?'最近学习':'实验总览';
    document.title=lab?`${lab.name} · 弦知实验中心`:'弦知 · 大学物理实验中心';
    document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===view;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.querySelectorAll('[data-lab-nav]').forEach(a=>{const active=a.dataset.labNav===lab?.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(lab)renderLab(lab);else if(view==='recent')renderRecent();else renderHome();
    closeMenu();
    if(hash==='experiments'){$('#experiments').scrollIntoView({behavior:'auto',block:'start'});}else{window.scrollTo(0,0);}
  }
  function openHelp() {if(!$('#help-dialog').open)$('#help-dialog').showModal();}
  $('#help-button').onclick=openHelp;$('#help-close').onclick=()=>$('#help-dialog').close();$('#help-start').onclick=()=>$('#help-dialog').close();
  $('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('#menu-button').onclick=()=>{const on=$('#sidebar').classList.toggle('open');$('#sidebar-shade').hidden=!on;$('#menu-button').setAttribute('aria-expanded',String(on));};
  $('#sidebar-shade').onclick=closeMenu;
  $('.skip').onclick=e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.body.classList.contains('focus-mode'))toggleFocus();closeMenu();}});
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||!frame||e.source!==frame.contentWindow||e.data?.id!==currentLab?.id)return;
    if(e.data.type==='physics-lab-escape'){if(document.body.classList.contains('focus-mode'))toggleFocus();return;}
    if(e.data.type!=='physics-lab-state')return;
    const d=e.data,r=records[currentLab.id];
    r.hash=validHash(d.hash);
    if(Number.isInteger(d.completed)&&Number.isInteger(d.total)&&d.total>0&&d.total<=50){r.completed=Math.max(0,Math.min(d.completed,d.total));r.total=d.total;}
    save();const standalone=$('#standalone-link');if(standalone)standalone.href=labUrl(currentLab,r.hash);
  });
  window.addEventListener('hashchange',route);
  window.addEventListener('pagehide',captureFrameState);
  window.addEventListener('beforeunload',captureFrameState);
  window.addEventListener('storage',e=>{if(e.key===storageKey&&!currentLab){try{const newRecords=JSON.parse(e.newValue||'{}');for(const l of labs){if(newRecords[l.id]&&typeof newRecords[l.id]==='object')records[l.id]={lastVisited:Number(newRecords[l.id].lastVisited)||0,hash:validHash(newRecords[l.id].hash),completed:Math.max(0,Number(newRecords[l.id].completed)||0),total:Math.max(0,Number(newRecords[l.id].total)||0)};}route();}catch{}}});
  showStorage();route();
})();
