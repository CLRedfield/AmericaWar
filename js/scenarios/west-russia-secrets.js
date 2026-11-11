/** A fictional northern signal mystery, separate from the historical political routes. */
const WestRussiaSecrets = (() => {
    const sealed = {
        id: 'ONE_zero_sealed', factionId: 'ONE', title: '白海守灯人', mechanic: 'commerce', goalNodes: 12,
        playstyle: '关闭异常频段，把监听站改成民用导航站。港口贸易维持一个克制的北境国家。',
        payoff: '港口每省收入 +1.4、政治收入 +1.5、全局防御 +12%；开放特许贸易。',
        tradeoff: '全局进攻 -15%，放弃深海回声与强制征集路线。',
        goal: '完成3次特许贸易并控制12省，留下守灯人的终局记录。',
        effects: [{ type: 'taggedIncome', tag: '港口', amount: 1.4 }, { type: 'ppIncome', amount: 1.5 },
            { type: 'globalDefense', amount: 0.12 }, { type: 'globalAttack', amount: -0.15 }]
    };
    const broadcast = {
        id: 'ONE_zero_broadcast', factionId: 'ONE', title: '第零潮汐共同体', mechanic: 'levies', goalNodes: 12,
        playstyle: '海底的点名册取代征召令。靠异常兵员与夺取新领土维持扩张，工业和政治不断付出代价。',
        payoff: '全局进攻 +35%、占领补兵 +2、征兵数量 +3；开放战时征集。',
        tradeoff: '每回合收入 -4、政治收入 -2、维护率 +6%；与封存结局互斥。',
        goal: '完成3次战时征集并控制12省，记录回声扩散后的世界。',
        effects: [{ type: 'globalAttack', amount: 0.35 }, { type: 'captureTroops', amount: 2 },
            { type: 'recruitAmount', amount: 3 }, { type: 'moneyIncome', amount: -4 },
            { type: 'ppIncome', amount: -2 }, { type: 'maintenanceRate', amount: 0.06 }]
    };
    function extend(profile, design) {
        if (profile.faction.id !== 'ONE') return design;
        const reveal = 'wr_one_shortwaveReceivers';
        const nodes = [
            { key: 'zeroListen', name: '无人值守的频段', lane: 1, notBeforeTurn: 6, secretReveal: reveal,
                requires: ['shortwaveReceivers', 'nightLights'], steps: 2, war: true,
                description: '第六回合之后，两部短波台开始同时收到明天的潮汐表。修好短波台与夜间灯号后，调查这份不可能的电报。',
                effects: [{ type: 'pp', amount: 3 }],
                story: { title: '署名日期是明天', text: '值班员把两部收音机接在不同的蓄电池上。声音仍在同一个字停顿。第二天的潮汐表已经抄完，最后一行却写着值班员母亲小时候叫他的名字。' } },
            { key: 'zeroSeal', name: '封存第零频道', lane: 0, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroReply', 'zeroBroadcast'], steps: 3, war: true,
                description: '拆下发射线圈，保存记录。把港务机构变成有人值守、可以追责的灯塔网络。', routeOutcome: sealed,
                effects: [{ type: 'ideology', id: 'wr_armed_neutrality', name: '白海守灯人共和国', shortName: '守灯人' }, { type: 'routeSettlement', id: sealed.id }],
                story: { title: '第一个由人签字的早晨', text: '灯塔守夜人把发射线圈埋进干燥的砂土。潮汐表从此只记录已经发生的事。海面偶尔仍有灯光，一亮一灭，但岸上的人约好只回答写在值班簿里的船名。' } },
            { key: 'zeroReply', name: '向海底回报', lane: 2, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroSeal'], steps: 3, war: true,
                description: '风险分支：每回合财政与政治将受到严重侵蚀。允许监听站按那份名单点名，继续追查声音的源头。',
                effects: [{ type: 'money', amount: -10 }, { type: 'capitalTroops', amount: 4 }],
                story: { title: '没有开过门的营房', text: '点名时多了四声回答。门上的积雪没有脚印，值班员却在名册上找到了四个人完整的履历。他们的入伍日期比这座城的建城日期还早。' } },
            { key: 'zeroBroadcast', name: '让所有灯塔同时开口', lane: 2, secretReveal: reveal,
                requires: ['zeroReply'], excludes: ['zeroSeal'], steps: 4, notBeforeTurn: 9, war: true,
                description: '虚构超自然彩蛋终局。放弃当前政治制度，获得巨量兵员和进攻优势，承担持续财政、政治与维护代价。', routeOutcome: broadcast,
                effects: [{ type: 'ideology', id: 'wr_zero_tide', name: '第零潮汐共同体', shortName: '第零潮汐' }, { type: 'routeSettlement', id: broadcast.id }],
                story: { title: '海不再需要岸', text: '午夜，所有灯塔都向内陆亮起。前线送来的报告说新兵不需要被告知道路，城镇却开始遗忘自己的名字。地图上的边界仍能推进，唯独没人说得清，最后将由谁来宣布统一。' } }
        ];
        return { ...design, chapters: [...design.chapters, { title: '封存附件 · 第零频道', category: 'politics', nodes }] };
    }
    function registerIdeologies() {
        GameState.ideologies.wr_zero_tide = { id: 'wr_zero_tide', name: '第零潮汐', color: '#577e7d',
            description: '虚构超自然彩蛋。回声赋予进攻优势，持续侵蚀生产与政治。',
            bonuses: [{ type: 'globalAttack', amount: 0.15 }, { type: 'globalDefense', amount: -0.1 }, { type: 'moneyIncome', amount: -2 }] };
    }
    return { extend, registerIdeologies, getById: id => [sealed, broadcast].find(item => item.id === id) || null };
})();
