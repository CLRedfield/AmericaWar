/** A fictional northern signal mystery, separate from the historical political routes. */
const WestRussiaSecrets = (() => {
    const sealed = {
        id: 'ONE_zero_sealed', factionId: 'ONE', title: '白海守灯人', mechanic: 'commerce',
        playstyle: '封存异常电报，发展海港贸易、稳固北疆海岸防线。',
        payoff: '每个港口金钱 +3/回合；金钱 +2.5/回合；PP +1.8/回合；防御 +18%；免维护 8 兵；征兵费用 -0.35；维护费率 -4%',
        tradeoff: '进攻 -3%',
        effects: [{ type: 'taggedIncome', tag: '港口', amount: 3 }, { type: 'moneyIncome', amount: 2.5 },
            { type: 'ppIncome', amount: 1.8 }, { type: 'globalDefense', amount: 0.18 },
            { type: 'globalAttack', amount: -0.03 }, { type: 'freeTroops', amount: 8 },
            { type: 'recruitCost', amount: -0.35 }, { type: 'maintenanceRate', amount: -0.04 }]
    };
    const broadcast = {
        id: 'ONE_zero_broadcast', factionId: 'ONE', title: '第零潮汐共同体', mechanic: 'levies',
        playstyle: '接受海底的援军，以战养战掀起无休止的北方攻势。',
        payoff: '进攻 +35%；占领补兵 +2、得钱 +6；每次征兵 +4；征兵费用 -0.5；免维护 10 兵',
        tradeoff: '金钱 -1/回合；PP -0.8/回合；维护费率 +3%',
        effects: [{ type: 'globalAttack', amount: 0.35 }, { type: 'captureTroops', amount: 2 },
            { type: 'recruitAmount', amount: 4 }, { type: 'recruitCost', amount: -0.5 },
            { type: 'moneyIncome', amount: -1 }, { type: 'ppIncome', amount: -0.8 },
            { type: 'maintenanceRate', amount: 0.03 }, { type: 'captureMoney', amount: 6 },
            { type: 'freeTroops', amount: 10 }]
    };
    function extend(profile, design) {
        if (profile.faction.id !== 'ONE') return design;
        const reveal = 'wr_one_assembly';
        const nodes = [
            { key: 'zeroListen', name: '海底来信', lane: 1, secretReveal: reveal,
                requires: ['assembly'], steps: 1,
                description: '一封电报来自不可能有人居住的海底。',
                effects: [{ type: 'pp', amount: 4 }, { type: 'money', amount: 8 }],
                story: { title: '署名日期是明天', text: '值班员把两部收音机接在不同的蓄电池上。声音仍在同一个字停顿。第二天的潮汐表已经抄完，最后一行却写着值班员母亲小时候叫他的名字。' } },
            { key: 'zeroSeal', name: '封存第零频道', lane: 0, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroReply', 'zeroBroadcast'], steps: 1,
                description: '拒绝回声的邀请，建立守灯人共和国。', routeOutcome: sealed,
                effects: [{ type: 'ideology', id: 'wr_armed_neutrality', name: '白海守灯人共和国', shortName: '守灯人' }, { type: 'routeSettlement', id: sealed.id }],
                story: { title: '第一个由人签字的早晨', text: '灯塔守夜人把发射线圈埋进干燥的砂土。潮汐表从此只记录已经发生的事。海面偶尔仍有灯光，一亮一灭，但岸上的人约好只回答写在值班簿里的船名。' } },
            { key: 'zeroReply', name: '回应来信', lane: 2, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroSeal'], steps: 1,
                description: '接受来历不明的援军编队。',
                effects: [{ type: 'capitalTroops', amount: 6 }],
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
            description: '虚构超自然彩蛋。回声赋予强劲攻势与源源不断的援兵，但持续消耗和平财政。',
            bonuses: [{ type: 'globalAttack', amount: 0.25 }, { type: 'capitalTroopsPerTurn', amount: 2 }, { type: 'globalDefense', amount: -0.03 }, { type: 'moneyIncome', amount: -2 }] };
    }
    return { extend, registerIdeologies, getById: id => [sealed, broadcast].find(item => item.id === id) || null };
})();
