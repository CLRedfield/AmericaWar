/** A fictional northern signal mystery, separate from the historical political routes. */
const WestRussiaSecrets = (() => {
    const sealed = {
        id: 'ONE_zero_sealed', factionId: 'ONE', title: '白海守灯人', mechanic: 'commerce',
        playstyle: '封存异常电报，发展贸易、守住海岸。',
        payoff: '每个港口金钱 +1.4/回合；PP +1.5/回合；防御 +12%',
        tradeoff: '进攻 -15%',
        effects: [{ type: 'taggedIncome', tag: '港口', amount: 1.4 }, { type: 'ppIncome', amount: 1.5 },
            { type: 'globalDefense', amount: 0.12 }, { type: 'globalAttack', amount: -0.15 }]
    };
    const broadcast = {
        id: 'ONE_zero_broadcast', factionId: 'ONE', title: '第零潮汐共同体', mechanic: 'levies',
        playstyle: '接受海底的援军，以高昂军费换取攻势。',
        payoff: '进攻 +35%；占领补兵 +2；每次征兵 +3',
        tradeoff: '金钱 -4/回合；PP -2/回合；维护费率 +6%',
        effects: [{ type: 'globalAttack', amount: 0.35 }, { type: 'captureTroops', amount: 2 },
            { type: 'recruitAmount', amount: 3 }, { type: 'moneyIncome', amount: -4 },
            { type: 'ppIncome', amount: -2 }, { type: 'maintenanceRate', amount: 0.06 }]
    };
    function extend(profile, design) {
        if (profile.faction.id !== 'ONE') return design;
        const reveal = 'wr_one_assembly';
        const nodes = [
            { key: 'zeroListen', name: '海底来信', lane: 1, secretReveal: reveal,
                requires: ['assembly'], steps: 1,
                description: '一封电报来自不可能有人居住的海底。',
                effects: [{ type: 'pp', amount: 3 }],
                story: { title: '署名日期是明天', text: '值班员把两部收音机接在不同的蓄电池上。声音仍在同一个字停顿。第二天的潮汐表已经抄完，最后一行却写着值班员母亲小时候叫他的名字。' } },
            { key: 'zeroSeal', name: '封存第零频道', lane: 0, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroReply', 'zeroBroadcast'], steps: 1,
                description: '拒绝回声的邀请，建立守灯人共和国。', routeOutcome: sealed,
                effects: [{ type: 'ideology', id: 'wr_armed_neutrality', name: '白海守灯人共和国', shortName: '守灯人' }, { type: 'routeSettlement', id: sealed.id }],
                story: { title: '第一个由人签字的早晨', text: '灯塔守夜人把发射线圈埋进干燥的砂土。潮汐表从此只记录已经发生的事。海面偶尔仍有灯光，一亮一灭，但岸上的人约好只回答写在值班簿里的船名。' } },
            { key: 'zeroReply', name: '回应来信', lane: 2, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroSeal'], steps: 1,
                description: '接受来历不明的四支援军。',
                effects: [{ type: 'capitalTroops', amount: 4 }],
                story: { title: '没有开过门的营房', text: '点名时多了四声回答。门上的积雪没有脚印，值班员却在名册上找到了四个人完整的履历。他们的入伍日期比这座城的建城日期还早。' } },
            { key: 'zeroBroadcast', name: '让所有灯塔同时开口', lane: 2, secretReveal: reveal,
                requires: ['zeroReply'], excludes: ['zeroSeal'], steps: 1,
                description: '让回声接管政府，建立第零潮汐共同体。', routeOutcome: broadcast,
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
