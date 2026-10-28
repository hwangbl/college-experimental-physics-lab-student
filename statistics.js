/* Teacher report: credentials remain in this page's closure, never persistent storage. */
(() => {
  'use strict';
  const TIMEZONE = 'Asia/Shanghai';
  const DAY = 86400000;
  const MAX_DAYS = 366;
  const REFRESH_MS = 60000;
  const LABS = Object.freeze([
    {id:'young',name:'杨氏模量'},
    {id:'resistance',name:'非线性电阻'},
    {id:'rings',name:'牛顿环'},
    {id:'polarization',name:'光的偏振'},
    {id:'oscilloscope',name:'示波器的使用'},
    {id:'hall',name:'霍尔效应'},
    {id:'spectrometer',name:'分光计'}
  ]);
  const LAB_IDS = new Set(LABS.map(lab => lab.id));
  const $ = id => document.getElementById(id);
  const number = new Intl.NumberFormat('zh-CN');
  let endpoint = '';
  let managementKey = '';
  let report = null;
  let requestId = 0;
  let pendingRequest = null;
  let loading = false;
  let refreshTimer = null;
  let lastSuccessfulAt = 0;
  let calendarDay = '';

  function shanghaiToday() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part = name => parts.find(item => item.type === name).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function validDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
  }
  function dayTime(value) { return new Date(`${value}T00:00:00Z`).getTime(); }
  function addDays(value, count) { return new Date(dayTime(value) + count * DAY).toISOString().slice(0,10); }
  function refreshCalendarBounds() {
    const today = shanghaiToday();
    if (today === calendarDay) return;
    const followsDefault = $('date-from').value === addDays(calendarDay,-6) && $('date-to').value === calendarDay;
    $('date-from').max = today;
    $('date-to').max = today;
    if (followsDefault) {
      $('date-from').value = addDays(today,-6);
      $('date-to').value = today;
    }
    calendarDay = today;
  }
  function dateRange() {
    refreshCalendarBounds();
    const from = $('date-from').value;
    const to = $('date-to').value;
    if (!validDay(from) || !validDay(to)) throw new Error('请选择有效的开始日期和结束日期。');
    if (from > to) throw new Error('开始日期不能晚于结束日期。');
    if (to > shanghaiToday()) throw new Error('结束日期不能晚于今天（北京时间）。');
    const days = (dayTime(to) - dayTime(from)) / DAY + 1;
    if (days > MAX_DAYS) throw new Error('一次最多查询 366 天，请缩小日期范围。');
    return {from,to,days};
  }
  function setMessage(text, error = false) {
    const element = $('report-message');
    element.textContent = text;
    element.classList.toggle('error', error);
    element.setAttribute('role', error ? 'alert' : 'status');
    element.hidden = !text;
  }
  function clearReport() {
    report = null;
    lastSuccessfulAt = 0;
    $('report-results').hidden = true;
    $('empty-state').hidden = true;
    $('stat-grid').replaceChildren();
    $('daily-table-body').replaceChildren();
    $('daily-table-foot').replaceChildren();
  }
  function setLoading(value) {
    loading = value;
    $('unlock-button').disabled = value;
    $('unlock-button').textContent = value ? '正在查询…' : '查看统计 →';
    $('query-button').disabled = value || !managementKey || !endpoint;
    $('query-button').textContent = value ? '正在查询…' : '更新查询';
    $('export-button').disabled = value || !report;
    $('report-results').setAttribute('aria-busy', String(value));
  }
  function setUnlocked(value) {
    $('access-panel').hidden = value;
    $('access-session').hidden = !value;
    $('query-button').disabled = loading || !value;
  }
  function stopRefresh() {
    if (refreshTimer !== null) clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  function scheduleRefresh() {
    stopRefresh();
    if (!endpoint || !managementKey || loading || document.hidden) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      queryReport({automatic:true});
    },REFRESH_MS);
  }
  function lock() {
    stopRefresh();
    requestId += 1;
    pendingRequest?.abort();
    pendingRequest = null;
    managementKey = '';
    $('management-key').value = '';
    clearReport();
    setMessage('');
    setLoading(false);
    if (endpoint) {
      setUnlocked(false);
      $('service-status').textContent = '统计查询已锁定。输入管理密钥后可重新查看。';
      $('management-key').focus();
    }
  }
  function addCount(a,b) {
    const sum = a + b;
    if (!Number.isSafeInteger(sum)) throw new Error('统计响应中的计数超出可读取范围，请联系统计服务管理员。');
    return sum;
  }
  function validateReport(data, range) {
    const invalid = () => new Error('统计服务返回的数据格式不正确，未展示统计结果。请联系统计服务管理员。');
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.timezone !== TIMEZONE || data.from !== range.from || data.to !== range.to || !Array.isArray(data.rows) || data.rows.length > range.days * LABS.length) throw invalid();
    const counts = new Map();
    const totals = new Map(LABS.map(lab => [lab.id,0]));
    let total = 0;
    for (const row of data.rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row) || !validDay(row.day) || row.day < range.from || row.day > range.to || !LAB_IDS.has(row.lab) || !Number.isSafeInteger(row.visitors) || row.visitors < 0) throw invalid();
      const key = `${row.day}/${row.lab}`;
      if (counts.has(key)) throw invalid();
      counts.set(key,row.visitors);
      totals.set(row.lab,addCount(totals.get(row.lab),row.visitors));
      total = addCount(total,row.visitors);
    }
    const daily = [];
    for (let index = 0; index < range.days; index += 1) {
      const day = addDays(range.from,index);
      const visitors = LABS.map(lab => counts.get(`${day}/${lab.id}`) || 0);
      const sum = visitors.reduce(addCount,0);
      daily.push({day,visitors,total:sum});
    }
    return {...range,total,totals,daily};
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function renderReport(value) {
    clearReport();
    report = value;
    lastSuccessfulAt = Date.now();
    if (value.total === 0) {
      $('empty-description').textContent = `${value.from} 至 ${value.to} 没有已记录的访问。可以尝试选择其他日期；统计服务接入前的访问不会补录。`;
      $('empty-state').hidden = false;
      return;
    }
    $('range-summary').textContent = `${value.from} 至 ${value.to} · ${value.days} 天 · 按实验与日期累加 ${number.format(value.total)} 人次`;
    const cards = document.createDocumentFragment();
    for (const lab of LABS) {
      const card = element('article',undefined,'stat-card');
      card.append(element('h3',lab.name),element('strong',number.format(value.totals.get(lab.id))),element('p','区间累计 · 人次'));
      cards.append(card);
    }
    $('stat-grid').replaceChildren(cards);
    const rows = document.createDocumentFragment();
    for (const day of [...value.daily].reverse()) {
      const row = element('tr');
      const heading = element('th',day.day);
      heading.scope = 'row';
      row.append(heading);
      for (const visitors of day.visitors) row.append(element('td',number.format(visitors)));
      row.append(element('td',number.format(day.total)));
      rows.append(row);
    }
    $('daily-table-body').replaceChildren(rows);
    const totalRow = element('tr');
    const totalHeading = element('th','区间累计人次');
    totalHeading.scope = 'row';
    totalRow.append(totalHeading);
    for (const lab of LABS) totalRow.append(element('td',number.format(value.totals.get(lab.id))));
    totalRow.append(element('td',number.format(value.total)));
    $('daily-table-foot').replaceChildren(totalRow);
    $('report-updated').textContent = `查询时间：${formatTime(lastSuccessfulAt)}（北京时间）。当日数据会随新的访问继续增加。`;
    $('report-results').hidden = false;
  }
  function formatTime(time) {
    return new Intl.DateTimeFormat('zh-CN',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(time));
  }
  async function queryReport({automatic = false} = {}) {
    if (!endpoint || loading) return;
    if (!managementKey) {
      setMessage('请先输入管理密钥。',true);
      $('management-key').focus();
      return;
    }
    let range;
    try { range = dateRange(); }
    catch (error) { setMessage(error.message,true); if (automatic) scheduleRefresh(); return; }
    stopRefresh();
    const preserveReport = automatic && report?.from === range.from && report?.to === range.to;
    const currentRequest = ++requestId;
    const controller = new AbortController();
    pendingRequest = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); },20000);
    if (!preserveReport) clearReport();
    setMessage(automatic ? '正在自动更新访问统计…' : '正在读取所选日期的访问统计…');
    setLoading(true);
    try {
      const response = await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${managementKey}`},
        body:JSON.stringify({action:'report',from:range.from,to:range.to,catalog:2}),
        credentials:'omit',
        cache:'no-store',
        redirect:'error',
        referrerPolicy:'no-referrer',
        signal:controller.signal
      });
      if (currentRequest !== requestId) return;
      if (response.status === 401 || response.status === 403) {
        managementKey = '';
        setUnlocked(false);
        throw new Error(response.status === 401 ? '管理密钥不正确，请重新输入。' : '当前管理密钥无权读取统计，请检查统计服务的访问配置。');
      }
      if (response.status === 429) throw new Error('查询过于频繁，请稍后再试。');
      if (!response.ok) throw new Error('统计服务暂时无法读取，请稍后重试。');
      let data;
      try { data = await response.json(); }
      catch { throw new Error('统计服务返回了无法读取的响应，未展示统计结果。'); }
      if (currentRequest !== requestId) return;
      const value = validateReport(data,range);
      renderReport(value);
      setUnlocked(true);
      $('service-status').textContent = '统计服务已连接。页面可见时每分钟自动更新；管理密钥仅保留在当前页面内存中。';
      setMessage('');
    } catch (error) {
      if (currentRequest !== requestId) return;
      const message = error.name === 'AbortError' ? (timedOut ? '统计查询超时，请稍后重试。' : '统计查询已取消。')
        : error instanceof TypeError ? '无法连接统计服务，请检查网络或统计服务配置后重试。'
        : error.message || '统计查询失败，请稍后重试。';
      if (preserveReport && managementKey && report && lastSuccessfulAt) {
        setMessage(`${message} 当前显示的是 ${formatTime(lastSuccessfulAt)}（北京时间）成功查询的旧数据。`,true);
      } else {
        clearReport();
        setMessage(message,true);
      }
      if (!managementKey) $('management-key').focus();
    } finally {
      clearTimeout(timeout);
      if (currentRequest === requestId) {
        pendingRequest = null;
        setLoading(false);
        scheduleRefresh();
      }
    }
  }
  function exportCsv() {
    if (!report || loading || report.total === 0) return;
    const lines = [['日期（北京时间）',...LABS.map(lab => `${lab.name}（每日人数）`),'合计（人次）']];
    for (const row of report.daily) lines.push([row.day,...row.visitors,row.total]);
    lines.push(['区间累计人次',...LABS.map(lab => report.totals.get(lab.id)),report.total]);
    const csv = '\uFEFF' + lines.map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(',')).join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link = element('a');
    link.href = url;
    link.download = `实验访问统计_${report.from}_${report.to}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  const today = shanghaiToday();
  calendarDay = today;
  $('date-from').value = addDays(today,-6);
  $('date-to').value = today;
  $('date-from').max = today;
  $('date-to').max = today;
  $('access-form').addEventListener('submit',event => {
    event.preventDefault();
    if (loading) return;
    const key = $('management-key').value.trim();
    $('management-key').value = '';
    if (!key || key.length > 4096) {
      setMessage('请输入有效的管理密钥。',true);
      $('management-key').focus();
      return;
    }
    managementKey = key;
    queryReport();
  });
  $('report-form').addEventListener('submit',event => { event.preventDefault(); queryReport(); });
  $('lock-button').addEventListener('click',lock);
  $('export-button').addEventListener('click',exportCsv);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) stopRefresh();
    else if (managementKey && endpoint && !loading) queryReport({automatic:true});
  });
  window.addEventListener('pagehide',() => {
    stopRefresh();
    requestId += 1;
    managementKey = '';
    $('management-key').value = '';
    pendingRequest?.abort();
  });
  window.addEventListener('pageshow',event => { if (event.persisted) lock(); });
  const config = window.PHYSICS_LAB_ANALYTICS;
  if (config?.enabled === true && typeof config.endpoint === 'string') {
    try {
      const url = new URL(config.endpoint);
      const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
      if ((url.protocol === 'https:' || (url.protocol === 'http:' && local)) && !url.username && !url.password && !url.hash) endpoint = url.href;
    } catch { /* An invalid or absent configuration keeps the report locked. */ }
  }
  if (!endpoint) {
    $('service-status').textContent = '统计服务尚未连接，暂不产生全站统计。';
    $('service-status').classList.add('unavailable');
    $('range-fields').disabled = true;
    $('access-panel').hidden = true;
    clearReport();
  } else {
    $('service-status').textContent = '统计服务已配置。输入管理密钥后查询访问统计。';
    $('range-fields').disabled = false;
    setUnlocked(false);
  }
})();
