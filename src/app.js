import { analyze, filterFeedback } from './analysis.js';
const $ = s => document.querySelector(s);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = v => `${Math.round(v * 100)}%`;
const growthText = p => p.growth === null ? '新增' : `${p.growth > 0 ? '+' : ''}${Math.round(p.growth * 100)}%`;
let rows = [], selected = [], report, page = 1;
const pageSize = 10;
function getFilters() { return {...Object.fromEntries(new FormData($('#filters'))), query: $('#search').value.trim()}; }
function render() {
  const filters = getFilters();
  selected = filterFeedback(rows, filters);
  const invalid = filters.start && filters.end && filters.start > filters.end;
  report = analyze(selected, '2026-10-04');
  const completeWeeks = (!filters.start || filters.start <= '2026-09-21') && (!filters.end || filters.end >= '2026-10-04');
  $('#status').textContent = invalid ? '开始日期不能晚于结束日期，请调整日期。' : `当前显示 ${selected.length} / ${rows.length} 条反馈 · 所有分析随筛选同步更新${completeWeeks ? '' : ' · 日期未覆盖完整两周，增长仅表示筛选内样本变化'}`;
  $('#metrics').innerHTML = [
    ['总反馈量', report.total, '条用户声音', '◫', `当前样本覆盖 ${report.channels.length} 个渠道`],
    ['负面反馈比例', pct(report.total ? report.negative/report.total : 0), `${report.negative} 条负面反馈`, '↘', '关注用户体验中的阻力'],
    ['高严重度反馈', report.high, '条需要重点排查', '⚑', '按模拟数据严重程度标签统计'],
    ['已识别问题主题', report.pains.length, '个痛点进入决策队列', '◎', '正面反馈与功能建议不计为痛点'],
  ].map(([label,value,sub,icon,note],i)=>`<article class="metric"><div>${label}<span class="metric-icon">${icon}</span></div><strong ${i===1?'class="negative-number"':''}>${value}</strong><p>${sub}</p><small>${note}</small></article>`).join('');
  renderTrend();
  $('#channels').innerHTML = report.channels.length ? report.channels.map((c,i)=>`<div class="channel"><div><span><i style="background:var(--channel-${i})"></i>${esc(c.label)}</span><b>${c.count} <small>${pct(c.count/report.total)}</small></b></div><div class="bar-track"><div style="width:${100*c.count/report.total}%;background:var(--channel-${i})"></div></div></div>`).join('') : '<p class="empty">没有匹配的渠道数据</p>';
  $('#category-summary').innerHTML = '<span>问题分类</span><div>'+report.categories.map(c=>`<span class="category-chip">${esc(c.label)} <b>${c.count}</b></span>`).join('')+'</div>';
  $('#pains').innerHTML = report.pains.length ? report.pains.map((p,i)=>`<article class="panel pain-card ${i===0?'leading':''}"><div class="panel-heading"><span class="rank">${String(i+1).padStart(2,'0')}</span><span class="priority ${p.priority}">${p.priority} · ${p.priority==='P0'?'优先排查':p.priority==='P1'?'近期处理':'持续观察'}</span></div><h3>${esc(p.category)}</h3><p class="pain-desc">主要影响 ${esc(p.segments[0].label)} · ${esc(p.platforms[0].label)}</p><div class="pain-stats"><div><strong>${p.count}</strong><span>相关反馈 · ${pct(p.share)}</span></div><div><strong class="${p.now>p.before?'growth-up':''}">${growthText(p)}</strong><span>近 7 天 / 前 7 天</span></div><div><strong>${p.score}<small>/100</small></strong><span>优先级分数</span></div></div><div class="reason"><span>负面 ${pct(p.negativeRatio)}</span><span>高严重度 ${pct(p.severityRatio)}</span><span>近 / 前期 ${p.now} / ${p.before}</span></div><details class="score-details"><summary>查看分数依据</summary><p>反馈量 ${p.parts.volume.toFixed(1)} + 负面 ${p.parts.negative.toFixed(1)} + 严重度 ${p.parts.severity.toFixed(1)} + 增长 ${p.parts.growth.toFixed(1)} + 用户群 ${p.parts.segment.toFixed(1)} = ${p.score}（四舍五入）</p></details><details class="evidence"><summary>查看原始证据 <span>${Math.min(5,p.count)} 条样例 ↗</span></summary><p class="muted">样例按日期从新到旧选取，来自当前筛选后的反馈。演示数据中的用户表达。</p>${[...p.evidence].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(r=>`<blockquote><p>“${esc(r.feedback_text)}”</p><small>${esc(r.feedback_id)} · ${esc(r.date)} · ${esc(r.channel)}<br>${esc(r.user_segment)} · ${esc(r.platform)} · v${esc(r.app_version)}</small></blockquote>`).join('')}</details></article>`).join('') : '<div class="panel empty">当前筛选下没有问题主题。可以重置筛选查看全部反馈。</div>';
  $('#recommendation-list').innerHTML = report.pains.length ? report.pains.slice(0,3).map((p,i)=>`<article class="panel recommendation"><div class="rec-title"><span class="action-icon">↗</span><div><span class="priority ${p.priority}">${p.priority}</span><h3>${esc(p.category)}：${esc(p.action)}</h3><span class="muted">建议协作团队：${esc(p.owner)}</span></div><span class="rec-number">ACTION 0${i+1}</span></div><div class="rec-columns"><div><p class="label">USER FACT / EVIDENCE</p><p>${p.count} 条相关反馈，${pct(p.negativeRatio)} 为负面；近 7 天 ${p.now} 条，前 7 天 ${p.before} 条。</p></div><div><p class="label hypothesis">待验证假设 · RULE INTERPRETATION</p><p>${esc(p.hypothesis)}</p></div><div><p class="label">EXPERIMENT / VALIDATION</p><p>${esc(p.experiment)}</p><small>验证指标：${esc(p.metric)}。当前样本没有实际业务指标。</small></div></div></article>`).join('') : '<div class="panel empty">暂无建议：需要相关问题反馈作为证据。</div>';
  renderTable();
}
function renderTrend() {
  const data = report.trend;
  const width=700, height=210, left=30, top=20, bottom=175, right=680;
  const max=Math.max(5,...data.map(d=>d.total));
  const x=i=>left+i*(right-left)/27;
  const y=n=>bottom-n/max*(bottom-top);
  const path=key=>data.map((d,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const ticks=[0,Math.ceil(max/2),max];
  $('#trend').innerHTML = `<svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="最近28天总反馈与支付失败反馈趋势图"><title>反馈量趋势：9月28日后支付失败反馈增长，模拟数据</title>${ticks.map(n=>`<line x1="${left}" y1="${y(n)}" x2="${right}" y2="${y(n)}" stroke="#edf0f3"/><text x="8" y="${y(n)+4}">${n}</text>`).join('')}<path d="${path('total')} L${right},${bottom} L${left},${bottom} Z" fill="#eff3ff"/><line x1="${x(21)}" y1="${top}" x2="${x(21)}" y2="${bottom}" stroke="#afb9d0" stroke-dasharray="4 4"/><text x="${x(21)-5}" y="12" text-anchor="end">v3.8.0 发布</text><path d="${path('total')}" fill="none" stroke="#b1bedc" stroke-width="2.5"/><path d="${path('payment')}" fill="none" stroke="#5268ed" stroke-width="3"/>${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.payment)}" r="3" fill="#5268ed"><title>${d.date}：总反馈 ${d.total} 条，支付失败 ${d.payment} 条，负面 ${d.negative} 条</title></circle>`).join('')}${[0,7,14,21,27].map(i=>`<text x="${x(i)}" y="200" text-anchor="${i===0?'start':i===27?'end':'middle'}">${data[i].date.slice(5).replace('-','/')}</text>`).join('')}</svg>`;
}
function renderTable() {
  const pages=Math.max(1,Math.ceil(selected.length/pageSize)); page=Math.min(page,pages);
  const view=selected.slice().sort((a,b)=>b.date.localeCompare(a.date)||a.feedback_id.localeCompare(b.feedback_id)).slice((page-1)*pageSize,page*pageSize);
  $('#feedback-rows').innerHTML = view.length ? view.map(r=>`<tr><td><p>${esc(r.feedback_text)}</p><small>${esc(r.feedback_id)} · ${esc(r.user_segment)} · ${esc(r.platform)} · v${esc(r.app_version)}</small></td><td><span class="issue-tag">${esc(r.issue_category)}</span><small>${esc(r.product_area)}</small></td><td>${esc(r.channel)}</td><td><span class="sentiment ${r.sentiment==='负面'?'bad':r.sentiment==='正面'?'good':'neutral'}">${esc(r.sentiment)}</span></td><td><span class="severity ${r.severity==='高'?'high':''}">${esc(r.severity)}</span></td><td class="date-cell">${esc(r.date)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">没有匹配的反馈，请调整筛选或搜索词。</td></tr>';
  $('#page-label').textContent=`共 ${selected.length} 条 · 第 ${page} / ${pages} 页 · 每页 ${pageSize} 条`;
  $('#prev').disabled=page===1; $('#next').disabled=page===pages;
}
$('#filters').addEventListener('change',()=>{page=1;render();});
$('#filters').addEventListener('submit',e=>e.preventDefault());
$('#filters').addEventListener('reset',()=>{ $('#search').value=''; page=1; setTimeout(render,0); });
$('#search').addEventListener('input',()=>{page=1;render();});
$('#prev').addEventListener('click',()=>{page--;renderTable();});
$('#next').addEventListener('click',()=>{page++;renderTable();});
$('#method-toggle').addEventListener('click',()=>{const open=$('#method').hidden; $('#method').hidden=!open; $('#method-toggle').setAttribute('aria-expanded',String(open));});
$('nav').addEventListener('click',e=>{const link=e.target.closest('a'); if(link){document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a===link));}});
$('#export').addEventListener('click',()=>{
  if(!report)return;
  const body=['# SignalFlow AI · 产品决策摘要','', 'Phase 1 - Rule-based MVP · 全部反馈为模拟数据；根因为待验证假设。',`筛选条件：${JSON.stringify(getFilters())}`,`当前反馈 ${report.total} 条，负面 ${report.negative} 条，高严重度 ${report.high} 条。`, '比较窗口：2026-09-28 至 2026-10-04 / 2026-09-21 至 2026-09-27；日期筛选会改变窗口内样本。', '',...report.pains.flatMap(p=>[`## ${p.category} · ${p.priority} · ${p.score}/100`,`证据：${p.count} 条；负面 ${pct(p.negativeRatio)}；高严重度 ${pct(p.severityRatio)}；增长 ${growthText(p)}（${p.now}/${p.before}）。`,`待验证假设：${p.hypothesis}`,`行动：${p.action}`,`实验：${p.experiment}`,`指标：${p.metric}（当前没有业务指标实测值）`,'原始证据：',...p.evidence.slice(0,5).map(r=>`- ${r.feedback_id} | ${r.date} | ${r.channel} | ${r.platform} ${r.app_version} | ${r.feedback_text}`),''])].join('\n');
  const url=URL.createObjectURL(new Blob([body],{type:'text/markdown;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='signalflow-decision-summary.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try {
  const response=await fetch('./data/feedback.json');
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const data=await response.json();rows=data.feedback;
  for(const key of ['channel','product_area','sentiment','severity']) {
    const select=$(`[name="${key}"]`); [...new Set(rows.map(r=>r[key]))].forEach(value=>select.add(new Option(value,value)));
  }
  render();
} catch(error) {
  $('#status').textContent='数据加载失败。请使用 python3 server.py 启动，并通过 localhost 地址打开页面。';
  $('#status').classList.add('error');$('#export').disabled=true;console.error(error);
}
