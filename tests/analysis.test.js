import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, filterFeedback } from '../src/analysis.js';
const {feedback: rows} = JSON.parse(readFileSync(new URL('../data/feedback.json',import.meta.url),'utf8'));
const base = {feedback_id:'TEST',date:'2026-10-04',channel:'客服',product_area:'支付',sentiment:'负面',severity:'高',user_segment:'付费用户',platform:'Android',issue_category:'支付失败',feedback_text:'支付出错'};
test('synthetic fixture contains 240 valid rows with unique IDs and required fields',()=>{
  assert.equal(rows.length,240);assert.equal(new Set(rows.map(r=>r.feedback_id)).size,240);
  for(const r of rows) for(const key of ['feedback_id','date','channel','user_segment','platform','app_version','product_area','feedback_text','sentiment','issue_category','severity']) assert.ok(r[key]);
});
test('release scenario is reflected in score, evidence and growth',()=>{
  const r=analyze(rows,'2026-10-04');const p=r.pains[0];
  assert.equal(p.category,'支付失败'); assert.equal(p.priority,'P0');assert.ok(p.now>p.before);
  assert.ok(p.score>=75);assert.equal(p.count,p.evidence.length);
  assert.equal(r.channels.reduce((n,c)=>n+c.count,0),240);
  assert.equal(r.trend.reduce((n,d)=>n+d.total,0),240);
  for(const pain of r.pains) assert.ok(pain.score>=0&&pain.score<=100);
});
test('all filters combine and date boundaries are inclusive',()=>{
  const r=filterFeedback([base,{...base,feedback_id:'NO',channel:'问卷'}],{start:'2026-10-04',end:'2026-10-04',channel:'客服',product_area:'支付',sentiment:'负面',severity:'高',query:'android'});
  assert.equal(r.length,1);assert.equal(r[0].feedback_id,'TEST');
  assert.equal(filterFeedback(rows,{start:'2026-10-04',end:'2026-09-07'}).length,0);
});
test('empty results and positive feedback do not invent pain points',()=>{
  const empty=analyze([],'2026-10-04');assert.equal(empty.total,0);assert.deepEqual(empty.pains,[]);assert.equal(empty.trend.length,28);
  assert.equal(analyze(rows.filter(r=>r.issue_category==='体验认可'),'2026-10-04').pains.length,0);
});
test('zero-baseline growth is new rather than Infinity; fixed week windows exclude old data',()=>{
  const r=analyze([base,{...base,date:'2026-09-07'}],'2026-10-04');
  assert.equal(r.pains[0].growth,null);assert.equal(r.pains[0].now,1);assert.equal(r.pains[0].before,0);
  assert.equal(r.pains[0].parts.growth,15);assert.ok(Number.isFinite(r.pains[0].score));
});
test('decline receives no growth points and priority uses every component',()=>{
  const r=analyze([{...base,date:'2026-09-27'}],'2026-10-04').pains[0];
  assert.equal(r.growth,-1);assert.equal(r.parts.growth,0);
  assert.equal(r.score,Math.round(25/40+25+25+10)); assert.equal(r.priority,'P1');
});
test('payment interpretation does not assume a new Android release without matching evidence',()=>{
  const p=analyze([{...base,app_version:'3.7.2',platform:'iOS'}],'2026-10-04').pains[0];
  assert.ok(p.hypothesis.includes('当前筛选没有新版 Android'));
  assert.ok(!p.action.includes('Android 3.8.0'));
});
