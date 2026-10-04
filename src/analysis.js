// Pure rule-based aggregation: replace this boundary with AI-assisted classification later.
export const DAY = 86400000;
export const RULES = {
  支付失败: { hypothesis: '新版 Android 支付流程与优惠券校验可能存在兼容问题。版本与平台的关联不能证明因果。', action: '复现 Android 3.8.0 的结账路径，优先检查优惠券校验与支付错误日志。', experiment: '在测试环境覆盖有券 / 无券、不同支付方式；修复后小流量灰度，对照旧版。', metric: '支付成功率、优惠券使用成功率、支付相关负反馈率', owner: '支付产品 × Android 工程' },
  登录异常: { hypothesis: '验证码送达或会话保持可能异常，需要结合认证日志确认。', action: '排查验证码送达率和登录会话过期逻辑，补充清晰的重试指引。', experiment: '对照优化前后的登录漏斗，覆盖弱网和换设备场景。', metric: '登录成功率、验证码送达率、登录耗时', owner: '账户产品 × 客户端工程' },
  搜索不准确: { hypothesis: '相关性排序、纠错或筛选行为可能未满足用户意图。', action: '建立失败查询样本集，检查排序与筛选，再验证纠错需求。', experiment: '用标注查询做离线相关性评测，再对排序方案进行 A/B 测试。', metric: '搜索点击率、无结果率、搜索后转化率', owner: '搜索产品 × 搜索工程' },
  会员退款困难: { hypothesis: '续费告知、退款入口和处理时效可能不够透明。', action: '检查续费提醒与退款链路，提供可见的入口和处理进度。', experiment: '小范围测试提前续费提醒与自助退款入口，访谈退款用户。', metric: '退款处理时长、退款重复咨询率、续费投诉率', owner: '会员产品 × 客服运营' },
  订单状态延迟: { hypothesis: '订单状态同步或前端刷新可能存在延迟。', action: '比对订单事件时间与页面展示时间，检查同步任务。', experiment: '监控状态更新延迟，灰度缩短刷新间隔。', metric: '状态同步延迟、订单重复咨询率', owner: '交易产品 × 后端工程' },
  通知过多: { hypothesis: '推送频控和用户订阅偏好可能未有效生效。', action: '检查营销消息频控和关闭开关，拆分交易与营销通知。', experiment: '对部分用户降低营销频次，观察退订与互动变化。', metric: '推送关闭率、通知投诉率、有效点击率', owner: '增长产品 × 运营' },
};
export function filterFeedback(rows, filters) {
  return rows.filter(r => (!filters.start || r.date >= filters.start) && (!filters.end || r.date <= filters.end) && ['channel','product_area','sentiment','severity'].every(k => !filters[k] || r[k] === filters[k]) && (!filters.query || [r.feedback_text, r.feedback_id, r.issue_category, r.platform, r.user_segment].join(' ').toLowerCase().includes(filters.query.toLowerCase())));
}
const percent = (n, d) => d ? n / d : 0;
const top = (rows, key) => {
  const map = new Map(); rows.forEach(r => map.set(r[key], (map.get(r[key]) || 0) + 1));
  return [...map].sort((a,b) => b[1]-a[1]).map(([label,count])=>({label,count}));
};
export function analyze(rows, anchorDate) {
  const anchor = Date.parse(anchorDate + 'T00:00:00Z');
  const offset = r => Math.round((anchor - Date.parse(r.date + 'T00:00:00Z')) / DAY);
  const current = rows.filter(r => offset(r) >= 0 && offset(r) < 7);
  const previous = rows.filter(r => offset(r) >= 7 && offset(r) < 14);
  const pains = Object.entries(RULES).map(([category, rule]) => {
    const evidence = rows.filter(r => r.issue_category === category);
    const count = evidence.length;
    const now = current.filter(r => r.issue_category === category).length;
    const before = previous.filter(r => r.issue_category === category).length;
    const growth = before ? (now-before)/before : now ? null : 0;
    const negativeRatio = percent(evidence.filter(r => r.sentiment === '负面').length,count);
    const severityRatio = percent(evidence.filter(r => r.severity === '高').length,count);
    const riskRatio = percent(evidence.filter(r => ['付费用户','流失风险用户'].includes(r.user_segment)).length,count);
    const parts = { volume: 25 * Math.min(count/40,1), negative: 25*negativeRatio, severity: 25*severityRatio, growth: 15*(growth === null ? 1 : Math.max(0,Math.min(growth,1))), segment: 10*riskRatio };
    const score = Math.round(Object.values(parts).reduce((a,b)=>a+b,0));
    let recommendation = rule;
    if (category === '支付失败' && !evidence.some(r => r.platform === 'Android' && r.app_version === '3.8.0')) {
      recommendation = { ...rule,
        hypothesis: '当前筛选没有新版 Android 支付反馈；支付错误可能与校验、网络或支付通道有关，需要日志验证。',
        action: '按当前样本的平台和版本复现支付失败，检查校验、错误码及支付通道日志。',
        owner: '支付产品 × 客户端工程' };
    }
    return { category, evidence, count, share:percent(count, rows.length), now,before,growth,negativeRatio,severityRatio,riskRatio,parts,score,priority:score>=75?'P0':score>=50?'P1':'P2', segments:top(evidence,'user_segment'), platforms:top(evidence,'platform'), ...recommendation };
  }).filter(p=>p.count).sort((a,b)=>b.score-a.score || b.count-a.count);
  const dates = Array.from({length:28},(_,i)=>new Date(anchor-(27-i)*DAY).toISOString().slice(0,10));
  return { total:rows.length, negative:rows.filter(r=>r.sentiment==='负面').length, high:rows.filter(r=>r.severity==='高').length, pains, channels:top(rows,'channel'), categories:top(rows,'issue_category'), trend:dates.map(date=>({date,total:rows.filter(r=>r.date===date).length,negative:rows.filter(r=>r.date===date&&r.sentiment==='负面').length,payment:rows.filter(r=>r.date===date&&r.issue_category==='支付失败').length})), currentCount:current.length, previousCount:previous.length };
}
