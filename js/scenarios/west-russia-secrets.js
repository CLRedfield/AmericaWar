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
                requires: ['assembly'], steps: 2,
                description: '一封电报来自不可能有人居住的白海海槽深处。',
                effects: [{ type: 'pp', amount: 6 }, { type: 'money', amount: 10 }],
                story: { title: '机密附件 · 零号水听频段', text: '奥涅加湾水听站在 0.00 赫兹基准带截获一组旧帝国海军密码。信号源位于索洛韦茨基以北百米冰海之下——那里自西俄罗斯战争期间沉没过三艘无编号潜艇后便再无航迹。芬兰军事顾问要求立即销毁磁带；但电文末尾准确报出了次日德国空军侦察机的航向与返航时刻。' } },
            { key: 'zeroSeal', name: '封存第零频道', lane: 0, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroReply', 'zeroBroadcast'], steps: 4,
                description: '炸毁深海测向天线，拒绝异常回声，建立严守北疆海岸的守灯人共和国。', routeOutcome: sealed,
                effects: [{ type: 'ideology', id: 'wr_armed_neutrality', name: '白海守灯人共和国', shortName: '守灯人' }, { type: 'routeSettlement', id: sealed.id }],
                story: { title: '白海封缄令', text: '工兵营用三吨水泥灌封了岬角地下的测向机房，所有涉密报务员宣誓终身不得离开白海沿岸。奥涅加防卫军司令部发布第 19 号戒严公报：从今往后，北境舰桥只接收赫尔辛基与沿岸灯塔的明码灯号。冰面之下的敲击声在冬至夜彻底沉寂——人类守住了自己的边界。' } },
            { key: 'zeroReply', name: '回应来信', lane: 2, secretReveal: reveal, requires: ['zeroListen'],
                excludes: ['zeroSeal'], steps: 3,
                description: '向深海发回确认呼号，接收从冰雾中登岸的无番号成建制编队。',
                effects: [{ type: 'capitalTroops', amount: 7 }, { type: 'pp', amount: 5 }],
                story: { title: '浓雾登岸编队', text: '零下三十度的白海未结冰面上驶来四艘涂抹掉舷号的灰色登陆驳船。走下跳板的士兵身着浸满盐霜的旧式海军步兵呢大衣，武器膛线崭新，却无人开口交谈。他们在军需官的接收令上按下冰冷的指印，当夜便接管了通往普列谢茨克的前沿哨位。' } },
            { key: 'zeroBroadcast', name: '让所有灯塔同时开口', lane: 2, secretReveal: reveal,
                requires: ['zeroReply'], excludes: ['zeroSeal'], steps: 4,
                description: '将全境长波电台并入第零频道，建立席卷北俄的第零潮汐共同体。', routeOutcome: broadcast,
                effects: [{ type: 'ideology', id: 'wr_zero_tide', name: '第零潮汐共同体', shortName: '第零潮汐' }, { type: 'routeSettlement', id: broadcast.id }],
                story: { title: '北极星坠入深海之夜', text: '白海沿岸十七座灯塔在同一秒钟熄灭对海光束，改以高频载波向俄罗斯内陆全功率广播。芬兰边境哨所惊恐地报告：奥涅加全境无线电静默，唯有整齐划一的行军靴声正踏碎冻土向南推进。“大海终将漫过一切干涸的国境线——第零潮汐已经涨潮。”' } }
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
