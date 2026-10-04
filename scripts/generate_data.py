"""Reproducible synthetic feedback. No network, no user data."""
import json
import random
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
rng = random.Random(42)
COPY = {
    '支付失败': ('支付', [
        '用优惠券结账一直提示校验失败，取消券又能付款。',
        '更新以后付款转圈很久，最后说支付失败，我都不敢再点了。',
        '安卓这次更新后买不了东西了，换了两张银行卡还是不行。',
        '结账页面卡住了。退出重新进去，券还在但订单没生成。',
        '平时都用这个买日用品，今天付款连试三次都失败，太耽误事。',
        '客服让我重新安装，但重新登录后用了满减券还是付不了款。',
        '金额显示没问题，点确认后提示异常，没有说明下一步怎么办。',
        '付钱这么麻烦？折腾半天干脆不买了。',
    ]),
    '登录异常': ('登录', [
        '验证码等了五分钟也没收到，重发还要等。', '换手机后登录不上，账户里还有余额。',
        '每次打开都要重新登录，真的很烦。', '网络正常但提示登录超时，晚上更明显。',
        '密码重置后还是提示账号异常，不知道找谁处理。', '指纹验证过去后又跳回登录页，循环了三次。',
    ]),
    '搜索不准确': ('搜索', [
        '搜无糖饮料，前面一大半都是含糖的。', '品牌名输错一个字就完全搜不到，希望能纠错。',
        '明明昨天买过的东西，今天用同样的词搜不到。', '筛选选了价格低到高，结果还是乱的。',
        '搜索出来很多不相关的推广，真正要找的在很后面。', '想找小规格，结果推荐的全是家庭装。',
    ]),
    '会员退款困难': ('会员', [
        '自动续费前没看到提醒，扣款后找了很久都没找到退款入口。',
        '会员退费要联系客服，客服又让我去设置，来回踢皮球。',
        '不小心续了一年，退款申请三天还没处理。', '想取消续费，入口藏得太深了。',
        '会员权益没用过，为什么退款规则说不清楚？', '提醒只有站内消息，没打开就直接扣款了。',
    ]),
    '订单状态延迟': ('订单', [
        '东西已经到了，订单还写着待发货。', '退款到账了但页面一直显示处理中。',
        '物流信息一天没更新，问客服才知道在派送。', '付款后没立即看到订单，以为没买成功。',
        '订单列表刷新好几次才有，状态不一致。',
    ]),
    '通知过多': ('消息通知', [
        '一天十几条促销通知，重要消息反而看不到。', '关掉营销推送后还是会收到。',
        '凌晨发活动消息，把我吵醒了。', '只想要订单通知，能不能分开设置？',
        '同一个优惠活动连着提醒三次，准备关全部通知。',
    ]),
    '体验认可': ('综合体验', [
        '订单查起来很方便，这次购物挺顺利。', '客服这次解决得很快，感谢。',
        '搜索比之前快了，喜欢最近的界面。', '常用商品直接复购很省时间。',
        '会员优惠确实省了钱，希望继续保持。', '支付很顺畅，一次就成功了。',
    ]),
    '功能建议': ('综合体验', [
        '希望能把常买的商品分组收藏。', '能加一个到货提醒吗？',
        '想在订单里直接导出发票，不用每次找客服。', '如果支持深色模式就更好了。',
        '界面还行，有些按钮第一次用不太理解。', '希望消息可以批量标成已读。',
    ]),
}
rows = []
start = date(2026, 9, 7)
for day in range(28):
    recent = day >= 21
    count = 9 if day < 16 else 8  # 240 rows
    for j in range(count):
        if recent and j < 5:
            category = '支付失败'
        elif not recent and j == 0 and day % 3 == 0:
            category = '支付失败'
        else:
            category = rng.choices(list(COPY)[1:], weights=[15, 17, 16, 12, 12, 18, 10])[0]
        area, variants = COPY[category]
        platform = 'Android' if recent and category == '支付失败' else rng.choice(['Android', 'iOS'])
        version = '3.8.0' if recent else '3.7.2'
        segment = '付费用户' if category == '会员退款困难' else rng.choice(['新用户', '活跃用户', '付费用户', '流失风险用户'])
        sentiment = '正面' if category == '体验认可' else '中性' if category == '功能建议' else rng.choices(['负面', '中性'], [9, 1])[0]
        severity = '低' if category in ['体验认可', '功能建议'] else '高' if category in ['支付失败', '会员退款困难'] else rng.choice(['中', '中', '高'])
        content = variants[(day + j + rng.randrange(len(variants))) % len(variants)]
        # Natural context additions, alongside short / emotional comments.
        if j % 4 == 0:
            content += rng.choice([' 上班路上用的，赶时间。', ' 已经截图给客服了。', ' 家人用另一部手机倒是正常。', ' 希望下个版本修一下。', ''])
        rows.append(dict(feedback_id=f'FB-{len(rows)+1:04d}', date=str(start + timedelta(days=day)), channel=rng.choice(['App Store', '客服', '问卷', '社交媒体', '用户访谈']), user_segment=segment, platform=platform, app_version=version, product_area=area, feedback_text=content, sentiment=sentiment, issue_category=category, severity=severity))
output = ROOT / 'data' / 'feedback.json'
output.write_text(json.dumps({'metadata': {'synthetic': True, 'seed': 42, 'release_date': '2026-09-28', 'release_version': '3.8.0', 'description': '虚构消费 App，固定 28 天样本。新版 Android 支付失败是人为设计的演示场景。'}, 'feedback': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Generated {len(rows)} rows: {output}')
