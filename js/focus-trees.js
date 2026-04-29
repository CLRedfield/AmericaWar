/**
 * Extended national focus authoring.
 * Each faction gets a hand-crafted political tree with distinctive mechanics.
 * Inspirations come from KX civil-war content (workers' councils, Long-Pelley,
 * MacArthur's caesar, Hughes-Olson Pacific, Patton's western district,
 * Lone-Star revival) and Lovecraft's New England (Providence Society leading
 * to Cthulhu / Yog-Sothoth / Nyarlathotep endings).
 */

(function extendNationalFocusTrees() {
    if (typeof GameState === 'undefined') return;

    const E = {
        money: a => ({ type: 'money', amount: a }),
        pp: a => ({ type: 'pp', amount: a }),
        ppIncome: a => ({ type: 'ppIncome', amount: a }),
        moneyIncome: a => ({ type: 'moneyIncome', amount: a }),
        ppCap: a => ({ type: 'ppCapBonus', amount: a }),
        capT: a => ({ type: 'capitalTroops', amount: a }),
        capI: a => ({ type: 'capitalIndustry', amount: a }),
        allT: a => ({ type: 'allTroops', amount: a }),
        allI: (a, max) => ({ type: 'allIndustry', amount: a, maxNodes: max }),
        nodeI: (id, a) => ({ type: 'nodeIndustry', nodeId: id, amount: a }),
        tagT: (tag, a) => ({ type: 'taggedTroops', tag, amount: a }),
        tagD: (tag, a) => ({ type: 'taggedDefense', tag, amount: a }),
        tagInc: (tag, a) => ({ type: 'taggedIncome', tag, amount: a }),
        tagMoney: (tag, a) => ({ type: 'taggedNodeMoney', tag, amount: a }),
        actionCost: (action, a) => ({ type: 'actionCost', action, amount: a }),
        recruitAmount: a => ({ type: 'recruitAmount', amount: a }),
        recruitCost: a => ({ type: 'recruitCost', amount: a }),
        maint: a => ({ type: 'maintenanceRate', amount: a }),
        freeT: a => ({ type: 'freeTroops', amount: a }),
        gAtk: a => ({ type: 'globalAttack', amount: a }),
        gDef: a => ({ type: 'globalDefense', amount: a }),
        capMoney: a => ({ type: 'captureMoney', amount: a }),
        capTroop: a => ({ type: 'captureTroops', amount: a }),
        crisis: a => ({ type: 'crisisPP', amount: a }),
        capBoost: (a, max) => ({ type: 'industryCapBonus', amount: a, maxNodes: max }),
        damage: (a, max) => ({ type: 'damageEnemyIndustry', amount: a, maxNodes: max }),
        bonds: (amount, penalty, turns) => ({ type: 'warBonds', amount, penalty, turns }),
        allCapT: a => ({ type: 'allCapitalsTroops', amount: a }),
        badge: label => ({ type: 'badge', label }),
        ideo: id => ({ type: 'ideology', id })
    };

    function f(id, name, branch, x, y, cost, description, effects = [], prerequisites = [], extra = {}) {
        const item = { id, name, branch, x, y, cost, description, effects };
        if (prerequisites && prerequisites.length) item.prerequisites = prerequisites;
        return Object.assign(item, extra);
    }

    function addUnique(tree, items) {
        const ids = new Set(tree.map(item => item.id));
        items.forEach(item => {
            if (!item || ids.has(item.id)) return;
            tree.push(item);
            ids.add(item.id);
        });
    }

    // ============================================================
    // USA: Macarthur military government - rebuild political depth
    // ============================================================
    function rebuildUsaPoliticalDepth() {
        const tree = GameState.focusTrees.USA;
        addUnique(tree, [
            // 民主修复: 行政效率 + PP 上限 + 战后过渡
            f('usa_loyal_state_governors', '忠诚州长会议', '民主修复', 0, 4, 7, '把仍承认联邦的州长重新纳入战时咨议程序。', [E.money(8), E.ppCap(2)], ['usa_special_elections']),
            f('usa_wartime_civil_service', '战时文官署', '民主修复', 1, 5, 7, '用可追责的文官系统接管征税、运输和征募文书。', [E.actionCost('focus', -1), E.moneyIncome(1)], ['usa_loyal_state_governors']),
            f('usa_provisional_bill', '临时权利法案', '民主修复', 0, 6, 8, '以战时限制为边界，公开承诺战后权利恢复。', [E.ppCap(2), E.pp(4)], ['usa_wartime_civil_service']),
            f('usa_constitutional_continuity', '宪法连续性', '民主修复', 1, 7, 9, '宣布军政府只是联邦连续性的临时外壳。', [E.maint(-0.03), E.freeT(3)], ['usa_provisional_bill']),
            f('usa_national_reconciliation_board', '全国和解委员会', '民主修复', 2, 8, 10, '为投降州和战后政党重组预留合法出口。', [E.ppIncome(1), E.moneyIncome(2), E.ideo('wartime_democracy')], ['usa_constitutional_continuity']),

            // 军政府: 攻击力 + 缴获 + 强势进攻
            f('usa_command_proconsuls', '战区总督', '军政府', 3, 4, 7, '把前线州交给军政总督快速决断。', [E.capT(3), E.gAtk(0.05)], ['usa_government_by_decree']),
            f('usa_military_censors', '军事新闻审查', '军政府', 4, 5, 7, '统一战时广播口径，压制失败主义。', [E.pp(4), E.crisis(3)], ['usa_command_proconsuls']),
            f('usa_presidential_general_staff', '总统总参谋部', '军政府', 3, 6, 8, '把行政、情报、补给和作战并入一张命令表。', [E.actionCost('move', -1), E.allT(1)], ['usa_military_censors']),
            f('usa_army_state', '军队国家', '军政府', 4, 7, 9, '承认军队是联邦生存期间最稳定的国家骨架。', [E.capMoney(3), E.capTroop(1)], ['usa_presidential_general_staff']),
            f('usa_supreme_war_authority', '最高战争权威', '军政府', 3, 8, 10, '让所有政治争议暂时服从战争胜利目标。', [E.allCapT(3), E.gAtk(0.05), E.ideo('military_junta')], ['usa_army_state']),

            // 技术官僚: 工业上限 + 行动效率 + 总动员
            f('usa_engineers_cabinet', '工程师内阁', '技术官僚', 5, 4, 7, '由工程军官、铁路经理和预算专家组成执行内阁。', [E.capI(1), E.actionCost('build', -1)], ['usa_balanced_restoration']),
            f('usa_state_planning_boards', '州际计划委员会', '技术官僚', 6, 5, 7, '用配给表和运输优先级替代派系协商。', [E.capBoost(1, 2)], ['usa_engineers_cabinet']),
            f('usa_regulated_parties', '受监管政党', '技术官僚', 5, 6, 8, '允许有限政治活动，但一切组织须接受战时登记。', [E.pp(3), E.moneyIncome(1)], ['usa_state_planning_boards']),
            f('usa_emergency_charter', '紧急宪章草案', '技术官僚', 6, 7, 9, '写下从军政过渡到文官政治的程序。', [E.allI(1, 4)], ['usa_regulated_parties']),
            f('usa_managed_transition', '受控过渡', '技术官僚', 5, 8, 10, '把军政效率和合法性修复装进同一个过渡方案。', [E.actionCost('focus', -1), E.allI(1, 3), E.moneyIncome(2), E.ideo('technocracy')], ['usa_emergency_charter']),

            // 政治终局
            f('usa_federal_identity_campaign', '联邦身份运动', '政治路线', 3, 9, 8, '用学校、广播和军报重申"一个联邦"的身份。', [E.pp(5), E.tagT('港口', 1)], [], { prerequisiteAny: [['usa_national_reconciliation_board'], ['usa_supreme_war_authority'], ['usa_managed_transition']] }),
            f('usa_union_restored_in_war', '战火中的联邦', '政治路线', 3, 10, 10, '把所选择的政治路线转化为可长期维持的战时国家。', [E.actionCost('all', -1), E.ppCap(3), E.pp(6)], ['usa_federal_identity_campaign'])
        ]);
    }

    // ============================================================
    // CSA - 美利坚联合工团：四条路线 + 异端的卡彭机器
    // 工业革命 / 中央计划 / 革命赤卫军 / 卡彭黑色社会主义
    // ============================================================
    function buildCsaTree() {
        const tree = [];
        addUnique(tree, [
            f('CSA_emergency_council', '芝加哥紧急代表会', '战时统合', 11, 0, 4, '让工会、民兵和城市委员会承认同一个战时中枢。', [E.pp(4), E.capT(2)]),

            // ============== 政治路线 ==============
            f('CSA_workers_congress', '工团代表大会', '政治路线', 4, 1, 5, '召开全国工团代表大会以选定革命国家的形态。', [E.pp(3), E.ppCap(2)], ['CSA_emergency_council']),

            // 路线 1: 工会民主 (Browder/Foster) - x=0
            f('CSA_union_democracy', '工会民主路线', '工会民主', 0, 2, 6, '让车间代表保留革命的基层发言权。', [E.pp(2), E.freeT(2)], ['CSA_workers_congress'], { mutuallyExclusive: ['CSA_central_planners', 'CSA_red_guards', 'CSA_capone_machine'] }),
            f('CSA_shop_stewards', '车间代表制', '工会民主', 0, 3, 6, '把车间代表纳入军工配给讨论。', [E.tagInc('港口', 1), E.money(8)], ['CSA_union_democracy']),
            f('CSA_workers_arbitration', '工人仲裁庭', '工会民主', 0, 4, 7, '用仲裁替代随意清洗和报复。', [E.maint(-0.03), E.pp(3)], ['CSA_shop_stewards']),
            f('CSA_red_council', '红色议会', '工会民主', 0, 5, 7, '允许各工会在战时大会中竞争席位。', [E.ppIncome(1)], ['CSA_workers_arbitration']),
            f('CSA_industrial_communes', '工业公社章程', '工会民主', 0, 6, 8, '把地方公社义务写入战时法。', [E.actionCost('focus', -1), E.freeT(3)], ['CSA_red_council']),
            f('CSA_federal_syndicate_assembly', '联邦工团大会', '工会民主', 0, 7, 9, '工团大会成为革命合法性的最终来源。', [E.ppCap(3), E.pp(5), E.ideo('syndicalism')], ['CSA_industrial_communes']),

            // 路线 2: 中央总工团 (Reed/Lovestone) - x=2 - 工业最大化
            f('CSA_central_planners', '中央总工团路线', '中央总工团', 2, 2, 6, '把松散工会压成一台统一战争机器。', [E.capI(1), E.actionCost('build', -1)], ['CSA_workers_congress'], { mutuallyExclusive: ['CSA_union_democracy', 'CSA_red_guards', 'CSA_capone_machine'] }),
            f('CSA_secretariat', '总工团书记处', '中央总工团', 2, 3, 6, '所有重要工厂按中央会议纪要执行。', [E.money(12), E.capBoost(1, 1)], ['CSA_central_planners']),
            f('CSA_lakes_planning', '五大湖计划局', '中央总工团', 2, 4, 7, '把汽车厂与钢厂统一调度。', [E.nodeI('DET', 1), E.nodeI('CLE', 1)], ['CSA_secretariat']),
            f('CSA_red_rationing', '红色配给', '中央总工团', 2, 5, 7, '用硬指标替代地方讨价还价。', [E.allI(1, 4), E.money(10)], ['CSA_lakes_planning']),
            f('CSA_steel_belt_command', '钢铁带统筹', '中央总工团', 2, 6, 8, '匹兹堡和密尔沃基进入计划委员会直辖。', [E.nodeI('PIT', 1), E.nodeI('MIL', 1), E.capBoost(1, 2)], ['CSA_red_rationing']),
            f('CSA_planned_revolution', '计划化革命', '中央总工团', 2, 7, 9, '以计划委员会定义革命的下一阶段。', [E.allI(1, 5), E.actionCost('all', -1), E.ideo('central_planning')], ['CSA_steel_belt_command']),

            // 路线 3: 革命赤卫军 (Butler/Reed-military) - x=5 - 全民武装
            f('CSA_red_guards', '革命赤卫军路线', '革命赤卫军', 5, 2, 6, '把街垒民兵改造成可调动的赤卫队。', [E.capT(3), E.recruitAmount(1)], ['CSA_workers_congress'], { mutuallyExclusive: ['CSA_union_democracy', 'CSA_central_planners', 'CSA_capone_machine'] }),
            f('CSA_barricade_militia', '街垒民兵', '革命赤卫军', 5, 3, 6, '城市街区组建武装民兵网。', [E.tagT('港口', 1), E.allT(1)], ['CSA_red_guards']),
            f('CSA_factory_red_guards', '工厂赤卫队', '革命赤卫军', 5, 4, 7, '让工厂工人轮值守备生产线。', [E.allCapT(2), E.freeT(3)], ['CSA_barricade_militia']),
            f('CSA_combat_commissars', '战斗政委', '革命赤卫军', 5, 5, 7, '前线赤卫队设立常设政委。', [E.actionCost('move', -1), E.maint(-0.02)], ['CSA_factory_red_guards']),
            f('CSA_lakes_offensive_doctrine', '湖区冲击学说', '革命赤卫军', 5, 6, 8, '把湖区工人编成快速冲击纵队。', [E.gAtk(0.08), E.recruitCost(-1)], ['CSA_combat_commissars']),
            f('CSA_revolutionary_garrison', '革命卫戍司令部', '革命赤卫军', 5, 7, 9, '把赤卫军和正规军合编为联合战团。', [E.allCapT(4), E.capTroop(1), E.ideo('military_junta')], ['CSA_lakes_offensive_doctrine']),

            // 路线 4: 卡彭主义 (KX 异端 - 黑社会社会主义) - x=8 - 黑市经济
            f('CSA_capone_machine', '卡彭机器路线', '卡彭机器', 8, 2, 6, '把芝加哥地下行会拉进革命联盟，承认现实。', [E.money(15), E.capT(1)], ['CSA_workers_congress'], { mutuallyExclusive: ['CSA_union_democracy', 'CSA_central_planners', 'CSA_red_guards'] }),
            f('CSA_underground_unions', '地下工会', '卡彭机器', 8, 3, 6, '让地下网络承担征兵和情报。', [E.recruitCost(-2), E.recruitAmount(1)], ['CSA_capone_machine']),
            f('CSA_black_market_economy', '黑市经济', '卡彭机器', 8, 4, 7, '用走私、私酒和保护费补充财政。', [E.bonds(20, 3, 3)], ['CSA_underground_unions']),
            f('CSA_street_payroll', '街道工资', '卡彭机器', 8, 5, 7, '把工资以现金兑付，绕过财政审计。', [E.moneyIncome(2), E.maint(-0.02)], ['CSA_black_market_economy']),
            f('CSA_speakeasy_arsenal', '私酒兵工厂', '卡彭机器', 8, 6, 8, '把私酒厂改造成弹药与小型武器作坊。', [E.capMoney(3), E.damage(1, 2)], ['CSA_street_payroll']),
            f('CSA_crime_commissariat', '黑道委员会', '卡彭机器', 8, 7, 9, '让卡彭一系成为革命国家的"灰色部委"。', [E.gAtk(0.05), E.capTroop(1), E.badge('黑道委员会'), E.ideo('plutocracy')], ['CSA_speakeasy_arsenal']),

            // 共通政治节点
            f('CSA_red_intelligence', '红色情报局', '政治路线', 3, 3, 5, '建立横跨工厂和码头的情报体系。', [E.maint(-0.02), E.crisis(2)], ['CSA_workers_congress']),
            f('CSA_world_revolution_radio', '新世界广播网', '政治路线', 6, 3, 5, '把革命口号广播到大平原和阿巴拉契亚。', [E.pp(4), E.money(8)], ['CSA_workers_congress']),
            f('CSA_red_compromise', '芝加哥妥协', '政治路线', 4, 5, 7, '即便派系分歧巨大，也要把战时大会保留下来。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['CSA_union_democracy'], ['CSA_central_planners'], ['CSA_red_guards'], ['CSA_capone_machine']] }),
            f('CSA_socialist_america', '美利坚社会主义', '政治路线', 4, 8, 11, '把所选择的革命路线塑造成可长期统治的国家。', [E.ppIncome(1), E.allI(1, 3), E.allCapT(3)], [], { prerequisiteAny: [['CSA_federal_syndicate_assembly'], ['CSA_planned_revolution'], ['CSA_revolutionary_garrison'], ['CSA_crime_commissariat']] }),

            // ============== 军事路线 ==============
            f('CSA_general_staff', '五大湖总参', '军事路线', 11, 1, 5, '以湖区工业和铁路枢纽重建革命军指挥。', [E.capT(3)], ['CSA_emergency_council']),
            f('CSA_militia_doctrine', '民兵海洋', '军事路线', 10, 2, 6, '用城市民兵和工厂卫队填满前线。', [E.recruitAmount(1), E.freeT(2)], ['CSA_general_staff'], { mutuallyExclusive: ['CSA_mechanized_doctrine'] }),
            f('CSA_mechanized_doctrine', '机械化突击', '军事路线', 13, 2, 6, '汽车厂与钢厂转向装甲和机动战。', [E.nodeI('DET', 1), E.gAtk(0.05)], ['CSA_general_staff'], { mutuallyExclusive: ['CSA_militia_doctrine'] }),
            f('CSA_militia_training', '民兵教导营', '军事路线', 10, 3, 7, '把民兵训成可上前线的步兵纵队。', [E.allT(1), E.recruitCost(-1)], ['CSA_militia_doctrine']),
            f('CSA_barricade_command', '街垒指挥网', '军事路线', 10, 4, 8, '让街区指挥员能直接调动周边工厂民兵。', [E.actionCost('move', -1), E.tagD('港口', 0.10)], ['CSA_militia_training']),
            f('CSA_mech_training', '汽车工人装甲队', '军事路线', 13, 3, 7, '用底特律工人作为装甲连骨干。', [E.nodeI('DET', 1), E.capT(3)], ['CSA_mechanized_doctrine']),
            f('CSA_rapid_columns', '快速纵队司令部', '军事路线', 13, 4, 8, '为装甲纵队配套高优先军列。', [E.gAtk(0.05), E.actionCost('move', -1)], ['CSA_mech_training']),
            f('CSA_industrial_reserves', '产业预备队', '军事路线', 11, 5, 7, '轮换疲惫部队，保留一支随时能补洞的预备队。', [E.maint(-0.02), E.allT(1)], ['CSA_general_staff']),
            f('CSA_lakes_battle_plan', '湖区战役计划', '军事路线', 11, 6, 10, '完成适合本势力的长期内战作战方案。', [E.capT(4), E.allCapT(2), E.gAtk(0.05)], [], { prerequisiteAny: [['CSA_barricade_command'], ['CSA_rapid_columns']] }),

            // ============== 经济路线 ==============
            f('CSA_economic_board', '工团经济委员会', '经济路线', 16, 1, 5, '把钢铁、汽车、粮食和湖运压入一张计划表。', [E.money(16), E.capI(1)], ['CSA_emergency_council']),
            f('CSA_steel_program', '钢铁优先', '经济路线', 15, 2, 6, '优先保障芝加哥、底特律和克利夫兰的军工链。', [E.allI(1, 2), E.capBoost(1, 1)], ['CSA_economic_board'], { mutuallyExclusive: ['CSA_commune_program'] }),
            f('CSA_commune_program', '公社配给', '经济路线', 17, 2, 6, '用地方公社网络稳定粮食和劳动力。', [E.moneyIncome(1), E.freeT(2)], ['CSA_economic_board'], { mutuallyExclusive: ['CSA_steel_program'] }),
            f('CSA_steel_quotas', '钢厂定额', '经济路线', 15, 3, 7, '把钢厂、铸造厂全部纳入计划。', [E.money(18), E.nodeI('PIT', 1)], ['CSA_steel_program']),
            f('CSA_lakes_arsenal_expansion', '湖区兵工扩建', '经济路线', 15, 4, 8, '扩建最有价值的湖区军工产能。', [E.allI(1, 3), E.actionCost('build', -1)], ['CSA_steel_quotas']),
            f('CSA_commune_warehouses', '公社仓储', '经济路线', 17, 3, 7, '让地方公社把粮食和燃料登记入册。', [E.moneyIncome(1), E.money(10)], ['CSA_commune_program']),
            f('CSA_cooperative_workshops', '合作社工坊', '经济路线', 17, 4, 8, '让合作社承担更多战时小件生产。', [E.allI(1, 3), E.tagInc('港口', 1)], ['CSA_commune_warehouses']),
            f('CSA_lakes_rail_priority', '湖区军运优先', '经济路线', 16, 5, 7, '给军列、煤炭、粮食设置优先级。', [E.maint(-0.02), E.money(12)], ['CSA_economic_board']),
            f('CSA_total_syndicate_mobilization', '总工团动员', '经济路线', 16, 6, 10, '把经济路线转化为支撑长期内战的生产制度。', [E.moneyIncome(2), E.ppIncome(1), E.allI(1, 4)], [], { prerequisiteAny: [['CSA_lakes_arsenal_expansion'], ['CSA_cooperative_workshops']] }),

            // ============== 地区外交 ==============
            f('CSA_regional_office', '革命输出局', '地区外交', 20, 1, 5, '决定革命先向平原扩张还是争夺东部城市。', [E.money(10), E.pp(3)], ['CSA_emergency_council']),
            f('CSA_plains_front', '平原煽动', '地区外交', 19, 2, 6, '向爱荷华、密苏里和堪萨斯工人派出组织员。', [E.pp(3), E.recruitAmount(1)], ['CSA_regional_office'], { mutuallyExclusive: ['CSA_atlantic_front'] }),
            f('CSA_atlantic_front', '东部城市战线', '地区外交', 21, 2, 6, '争取匹兹堡、纽约和费城的工人网络。', [E.money(12), E.tagT('港口', 1)], ['CSA_regional_office'], { mutuallyExclusive: ['CSA_plains_front'] }),
            f('CSA_rail_organizers', '铁路组织员', '地区外交', 19, 3, 7, '把铁路工人变成跨州组织节点。', [E.tagT('港口', 1), E.capMoney(2)], ['CSA_plains_front']),
            f('CSA_mississippi_corridor', '密西西比走廊', '地区外交', 19, 4, 8, '沿密西西比中游建立稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['CSA_rail_organizers']),
            f('CSA_secret_city_cells', '城市秘密小组', '地区外交', 21, 3, 7, '在敌方城市建立潜伏小组。', [E.damage(1, 2), E.crisis(2)], ['CSA_atlantic_front']),
            f('CSA_pennsylvania_corridor', '宾州交通线', '地区外交', 21, 4, 8, '在另一条战略方向上建立防御和渗透节点。', [E.allT(1), E.moneyIncome(1)], ['CSA_secret_city_cells']),
            f('CSA_continental_revolution', '大陆革命战略', '地区外交', 20, 5, 10, '把地区政策纳入最终统一战争。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['CSA_mississippi_corridor'], ['CSA_pennsylvania_corridor']] })
        ]);
        return tree;
    }

    // ============================================================
    // AUS - 美利坚联盟国 (Long)：朗派民粹 / 州权 / 国家动员 / 银军团
    // 主打 PP 上限、油田/粮食税收、王朝动员
    // ============================================================
    function buildAusTree() {
        const tree = [];
        addUnique(tree, [
            f('AUS_emergency_cabinet', '联盟国紧急内阁', '战时统合', 11, 0, 4, '把朗派机器、州长和民兵队长聚到同一间战争办公室。', [E.pp(4), E.capT(2)]),

            // ============== 政治路线 ==============
            f('AUS_baton_rouge_pact', '巴吞鲁日政治协议', '政治路线', 4, 1, 5, '联盟国必须在民粹机器、州权派、动员派和银军团之间定型。', [E.pp(3), E.moneyIncome(1)], ['AUS_emergency_cabinet']),

            // 路线 1: 朗派民粹 - PP cap + ppIncome + recruitAmount
            f('AUS_longist_populism', '朗派民粹路线', '朗派机器', 0, 2, 6, '以分享财富和个人号召稳住联盟国群众基础。', [E.pp(3), E.ppCap(2)], ['AUS_baton_rouge_pact'], { mutuallyExclusive: ['AUS_states_compact', 'AUS_national_mobilizer', 'AUS_silver_legion'] }),
            f('AUS_share_wealth_clubs', '分享财富俱乐部', '朗派机器', 0, 3, 6, '让俱乐部成为动员和征募节点。', [E.recruitAmount(1), E.recruitCost(-1)], ['AUS_longist_populism']),
            f('AUS_radio_firesides', '炉边广播', '朗派机器', 0, 4, 7, '让朗的广播覆盖整个密西西比流域。', [E.pp(4), E.ppIncome(1)], ['AUS_share_wealth_clubs']),
            f('AUS_county_captains', '县级队长', '朗派机器', 0, 5, 7, '用地方队长管理粮食和兵员。', [E.moneyIncome(1), E.freeT(3)], ['AUS_radio_firesides']),
            f('AUS_peoples_budget', '人民预算', '朗派机器', 0, 6, 8, '把预算解释成对普通人的战争契约。', [E.ppCap(3), E.money(20)], ['AUS_county_captains']),
            f('AUS_kingfish_dynasty', '王鱼王朝', '朗派机器', 0, 7, 10, '把朗家族塑造成战时合法性的化身。', [E.ppCap(4), E.allCapT(3), E.actionCost('focus', -1), E.ideo('populism')], ['AUS_peoples_budget']),

            // 路线 2: 州权联盟 - 资源税 + 港口/油田 income
            f('AUS_states_compact', '州权协商路线', '州权联盟', 2, 2, 6, '让各州保留发言权，避免联盟国被单一派系吞没。', [E.money(12), E.tagInc('油田', 1)], ['AUS_baton_rouge_pact'], { mutuallyExclusive: ['AUS_longist_populism', 'AUS_national_mobilizer', 'AUS_silver_legion'] }),
            f('AUS_governors_table', '州长圆桌', '州权联盟', 2, 3, 6, '设立州长例会处理征税和兵役争议。', [E.maint(-0.02), E.moneyIncome(1)], ['AUS_states_compact']),
            f('AUS_county_home_rule', '县自治承诺', '州权联盟', 2, 4, 7, '以地方自治换取稳定供给。', [E.tagInc('港口', 1), E.freeT(2)], ['AUS_governors_table']),
            f('AUS_southern_bargain', '南方交易', '州权联盟', 2, 5, 7, '给地方精英保留战后地位。', [E.pp(4), E.tagMoney('油田', 6)], ['AUS_county_home_rule']),
            f('AUS_guard_compacts', '州卫队协定', '州权联盟', 2, 6, 8, '明确州卫队归属和战时调动程序。', [E.allT(1), E.tagD('油田', 0.10)], ['AUS_southern_bargain']),
            f('AUS_federalism_reborn', '再造联邦主义', '州权联盟', 2, 7, 9, '把州权包装成统一之后的新秩序。', [E.ppIncome(1), E.moneyIncome(2), E.money(15), E.ideo('federalism')], ['AUS_guard_compacts']),

            // 路线 3: 国家动员 - capT, allCapT, gAtk, actionCost
            f('AUS_national_mobilizer', '国家动员路线', '动员派', 5, 2, 6, '压低地方阻力，把联盟国做成一台进攻机器。', [E.capT(3), E.recruitAmount(1)], ['AUS_baton_rouge_pact'], { mutuallyExclusive: ['AUS_longist_populism', 'AUS_states_compact', 'AUS_silver_legion'] }),
            f('AUS_emergency_levies', '紧急征召', '动员派', 5, 3, 6, '让各县按人口和粮食产量承担征召。', [E.recruitAmount(1), E.recruitCost(-1)], ['AUS_national_mobilizer']),
            f('AUS_security_ministry', '安全部', '动员派', 5, 4, 7, '清理破坏者和不服从的地方队长。', [E.pp(3), E.maint(-0.02)], ['AUS_emergency_levies']),
            f('AUS_river_authority', '河运管理局', '动员派', 5, 5, 7, '统一密西西比河运输优先级。', [E.actionCost('move', -1), E.tagInc('港口', 1)], ['AUS_security_ministry']),
            f('AUS_war_governors', '战时州督', '动员派', 5, 6, 8, '中央任命的州督接管关键区域。', [E.allCapT(3), E.gAtk(0.05)], ['AUS_river_authority']),
            f('AUS_national_union_state', '全国联盟国', '动员派', 5, 7, 10, '把临时联盟变成真正的国家机器。', [E.gAtk(0.05), E.capT(4), E.actionCost('all', -1), E.ideo('military_junta')], ['AUS_war_governors']),

            // 路线 4: 银军团 (Pelley/Coughlin) - 极端民族主义
            f('AUS_silver_legion', '银军团路线', '银军团', 8, 2, 6, '把皮利和神职煽动者拉进政府的右翼极端路线。', [E.capT(2), E.gAtk(0.05)], ['AUS_baton_rouge_pact'], { mutuallyExclusive: ['AUS_longist_populism', 'AUS_states_compact', 'AUS_national_mobilizer'] }),
            f('AUS_silver_shirts', '银衫纵队', '银军团', 8, 3, 6, '把退伍军人和右翼民兵编成银衫纵队。', [E.allT(1), E.freeT(2)], ['AUS_silver_legion']),
            f('AUS_radio_priest_hour', '神父电台时间', '银军团', 8, 4, 7, '让全国广播变成右翼宣传机器。', [E.pp(5), E.ppCap(2)], ['AUS_silver_shirts']),
            f('AUS_purity_committees', '纯化委员会', '银军团', 8, 5, 7, '在县和教会建立审查与告密制度。', [E.maint(-0.03), E.crisis(2)], ['AUS_radio_priest_hour']),
            f('AUS_blood_soil_fronts', '血与土战线', '银军团', 8, 6, 8, '把农村民兵塑造成专属于银军团的核心力量。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_purity_committees']),
            f('AUS_national_revolution', '银色国民革命', '银军团', 8, 7, 10, '宣布联盟国进入持续的国民革命。', [E.gAtk(0.05), E.capTroop(1), E.damage(1, 2), E.badge('银军团'), E.ideo('fascism')], ['AUS_blood_soil_fronts']),

            // 共通节点
            f('AUS_county_archives', '县档案处', '政治路线', 3, 3, 5, '建立战时档案和安全审查流程。', [E.maint(-0.02), E.crisis(2)], ['AUS_baton_rouge_pact']),
            f('AUS_southern_radio', '南方广播团', '政治路线', 6, 3, 5, '让报纸、广播和集会服务于同一套战争叙事。', [E.pp(3), E.money(8)], ['AUS_baton_rouge_pact']),
            f('AUS_baton_rouge_compromise', '巴吞鲁日调停', '政治路线', 4, 5, 7, '把互相警惕的政治集团拉回同一张战时桌面。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['AUS_longist_populism'], ['AUS_states_compact'], ['AUS_national_mobilizer'], ['AUS_silver_legion']] }),
            f('AUS_mandate_of_union', '联盟国授权', '政治路线', 4, 8, 11, '将政治路线制度化，成为长期内战中的统治授权。', [E.ppIncome(1), E.ppCap(3), E.pp(6)], [], { prerequisiteAny: [['AUS_kingfish_dynasty'], ['AUS_federalism_reborn'], ['AUS_national_union_state'], ['AUS_national_revolution']] }),

            // ============== 军事路线 ==============
            f('AUS_general_staff', '密西西比总司令部', '军事路线', 11, 1, 5, '围绕河流、铁路和平原纵深建设战役指挥。', [E.capT(3)], ['AUS_emergency_cabinet']),
            f('AUS_river_doctrine', '河线作战', '军事路线', 10, 2, 6, '沿密西西比水道集中补给和炮兵。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['AUS_general_staff'], { mutuallyExclusive: ['AUS_cavalry_doctrine'] }),
            f('AUS_cavalry_doctrine', '机动骑兵', '军事路线', 13, 2, 6, '用卡车、骑兵和地方向导执行纵深机动。', [E.actionCost('move', -1), E.gAtk(0.05)], ['AUS_general_staff'], { mutuallyExclusive: ['AUS_river_doctrine'] }),
            f('AUS_river_training', '河防训练营', '军事路线', 10, 3, 7, '把河防训练写进训练手册。', [E.allT(1), E.tagD('港口', 0.05)], ['AUS_river_doctrine']),
            f('AUS_river_artillery', '河运炮兵群', '军事路线', 10, 4, 8, '为河防部队配齐重炮。', [E.tagT('港口', 1), E.gDef(0.05)], ['AUS_river_training']),
            f('AUS_motorized_recon', '机动侦察队', '军事路线', 13, 3, 7, '把另一套作战思路压进部队编成。', [E.recruitAmount(1), E.actionCost('move', -1)], ['AUS_cavalry_doctrine']),
            f('AUS_deep_raid_command', '纵深袭扰司令部', '军事路线', 13, 4, 8, '为机动部队建立长程袭扰指挥。', [E.capT(4), E.gAtk(0.05)], ['AUS_motorized_recon']),
            f('AUS_river_reserve', '河谷预备队', '军事路线', 11, 5, 7, '轮换疲惫部队，保留预备队。', [E.maint(-0.02), E.allT(1)], ['AUS_general_staff']),
            f('AUS_central_breakthrough', '中央突破计划', '军事路线', 11, 6, 10, '完成适合本势力的长期内战作战方案。', [E.pp(5), E.capT(4), E.gAtk(0.05)], [], { prerequisiteAny: [['AUS_river_artillery'], ['AUS_deep_raid_command']] }),

            // ============== 经济路线 ==============
            f('AUS_economic_board', '南方战时经济局', '经济路线', 16, 1, 5, '把农产品、石油、河运和地方金融纳入战争预算。', [E.money(16), E.tagInc('油田', 1)], ['AUS_emergency_cabinet']),
            f('AUS_agrarian_program', '农业配给', '经济路线', 15, 2, 6, '以粮食和棉花换取现金和稳定。', [E.moneyIncome(1), E.freeT(2)], ['AUS_economic_board'], { mutuallyExclusive: ['AUS_oil_program'] }),
            f('AUS_oil_program', '油田合同', '经济路线', 17, 2, 6, '优先控制路易斯安那和德州边缘油料。', [E.tagT('油田', 1), E.tagInc('油田', 1)], ['AUS_economic_board'], { mutuallyExclusive: ['AUS_agrarian_program'] }),
            f('AUS_grain_levy', '粮食征购', '经济路线', 15, 3, 7, '把粮食征购写成战时律令。', [E.money(18), E.tagInc('港口', 1)], ['AUS_agrarian_program']),
            f('AUS_township_workshops', '乡镇修械厂', '经济路线', 15, 4, 8, '让乡镇承接小件军工生产。', [E.allI(1, 3), E.actionCost('build', -1)], ['AUS_grain_levy']),
            f('AUS_oil_advance', '油料预支', '经济路线', 17, 3, 7, '以未来油税预支战费。', [E.bonds(25, 4, 3), E.tagMoney('油田', 8)], ['AUS_oil_program']),
            f('AUS_refinery_expansion', '炼油设备扩建', '经济路线', 17, 4, 8, '把炼油线扩建到极限。', [E.allI(1, 3), E.tagInc('油田', 1)], ['AUS_oil_advance']),
            f('AUS_river_rail_priority', '河谷铁路时刻表', '经济路线', 16, 5, 7, '给军列、棉花、粮食和军械运输设置优先级。', [E.maint(-0.02), E.money(12)], ['AUS_economic_board']),
            f('AUS_total_mobilization', '联盟国总动员', '经济路线', 16, 6, 10, '把经济路线转化为支撑长期内战的生产制度。', [E.moneyIncome(2), E.allCapT(2), E.allI(1, 3)], [], { prerequisiteAny: [['AUS_township_workshops'], ['AUS_refinery_expansion']] }),

            // ============== 地区外交 ==============
            f('AUS_regional_office', '南方联盟外交', '地区外交', 20, 1, 5, '选择向德州、深南方或中西部寻找突破口。', [E.money(10), E.pp(3)], ['AUS_emergency_cabinet']),
            f('AUS_texas_front', '德州接触', '地区外交', 19, 2, 6, '用石油和边界安全换取德州派系的合作。', [E.money(12), E.tagInc('油田', 1)], ['AUS_regional_office'], { mutuallyExclusive: ['AUS_lakes_front'] }),
            f('AUS_lakes_front', '北上工团战线', '地区外交', 21, 2, 6, '把反工团宣传推向圣路易斯和芝加哥方向。', [E.pp(3), E.recruitAmount(1)], ['AUS_regional_office'], { mutuallyExclusive: ['AUS_texas_front'] }),
            f('AUS_oilfield_negotiators', '油田谈判员', '地区外交', 19, 3, 7, '派出常驻德州与墨西哥湾油田的谈判员。', [E.tagMoney('油田', 6), E.money(10)], ['AUS_texas_front']),
            f('AUS_red_river_corridor', '红河通道', '地区外交', 19, 4, 8, '红河沿线建立稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['AUS_oilfield_negotiators']),
            f('AUS_missouri_outpost', '密苏里联络站', '地区外交', 21, 3, 7, '在密苏里-堪萨斯走廊设立联络站。', [E.damage(1, 2), E.crisis(2)], ['AUS_lakes_front']),
            f('AUS_st_louis_front', '圣路易斯前线', '地区外交', 21, 4, 8, '把圣路易斯方向变成可用的进攻起点。', [E.allT(1), E.gAtk(0.05)], ['AUS_missouri_outpost']),
            f('AUS_southern_unification', '南方统一战略', '地区外交', 20, 5, 10, '把地区政策纳入最终统一战争。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['AUS_red_river_corridor'], ['AUS_st_louis_front']] })
        ]);
        return tree;
    }

    // ============================================================
    // CON - 美利坚宪政国：宪章 / 财阀 / 安全统制 / 法西斯化
    // 主打防御 + 财政债券 + 缴获
    // ============================================================
    function buildConTree() {
        const tree = [];
        addUnique(tree, [
            f('CON_emergency_regency', '亚特兰大摄政府', '战时统合', 11, 0, 4, '在深南方危局中把摄政官、州议会和军队绑成同一套政府。', [E.pp(4), E.capT(2)]),

            // ============== 政治路线 ==============
            f('CON_constitutional_convention', '南方宪政会议', '政治路线', 4, 1, 5, '宪政国必须决定是恢复文官秩序、依靠财阀，还是走向安全统制甚至法西斯化。', [E.pp(3), E.maint(-0.02)], ['CON_emergency_regency']),

            // 路线 1: 宪章复归 (legalist) - 行政效率 + 维护降低
            f('CON_charter_path', '宪章复归路线', '宪章派', 0, 2, 6, '把摄政府塑造成旧宪政的临时保护者。', [E.pp(3), E.ppCap(2)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_planter_path', 'CON_security_path', 'CON_fascist_path'] }),
            f('CON_state_senates', '州参议会', '宪章派', 0, 3, 6, '重开州参议会渠道安抚地方。', [E.money(8), E.maint(-0.02)], ['CON_charter_path']),
            f('CON_legal_oaths', '法统宣誓', '宪章派', 0, 4, 7, '官员和军官公开宣誓效忠宪章。', [E.pp(4), E.crisis(3)], ['CON_state_senates']),
            f('CON_civilian_review', '文官审查', '宪章派', 0, 5, 7, '给军事命令设置战时文官复核。', [E.maint(-0.03), E.actionCost('focus', -1)], ['CON_legal_oaths']),
            f('CON_charter_courts', '宪章法院', '宪章派', 0, 6, 8, '恢复可执行的司法层级。', [E.ppIncome(1), E.moneyIncome(1)], ['CON_civilian_review']),
            f('CON_restored_commonwealth', '复归共和国', '宪章派', 0, 7, 9, '宣布摄政府只是重建共和国的过渡。', [E.ppCap(3), E.pp(5), E.actionCost('focus', -1), E.ideo('constitutional')], ['CON_charter_courts']),

            // 路线 2: 财阀协调 (Plantation/Bank) - 战争债券 + 资本income
            f('CON_planter_path', '财阀协调路线', '财阀协调', 2, 2, 6, '由银行家、铁路公司和军工承包商承担国家职能。', [E.money(14), E.moneyIncome(1)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_charter_path', 'CON_security_path', 'CON_fascist_path'] }),
            f('CON_atlanta_bankers', '亚特兰大银行团', '财阀协调', 2, 3, 6, '用银行团维持现金流。', [E.bonds(25, 4, 3)], ['CON_planter_path']),
            f('CON_rail_boards', '铁路董事会', '财阀协调', 2, 4, 7, '把铁路董事会纳入战时内阁。', [E.maint(-0.02), E.tagInc('港口', 1)], ['CON_atlanta_bankers']),
            f('CON_contract_state', '合同国家', '财阀协调', 2, 5, 7, '用合同义务替代冗长行政程序。', [E.actionCost('build', -1), E.allI(1, 2)], ['CON_rail_boards']),
            f('CON_managed_labor', '受控劳工', '财阀协调', 2, 6, 8, '在军需部门实行强制劳务登记。', [E.recruitAmount(1), E.freeT(2)], ['CON_contract_state']),
            f('CON_corporate_regency', '公司摄政', '财阀协调', 2, 7, 9, '让财阀体系成为摄政府的财政脊梁。', [E.moneyIncome(2), E.bonds(35, 5, 4), E.ideo('plutocracy')], ['CON_managed_labor']),

            // 路线 3: 安全统制 (Security state) - gDef + crisis + freeT
            f('CON_security_path', '安全统制路线', '安全统制', 5, 2, 6, '以叛乱、游击和破坏为理由扩张安全权力。', [E.capT(2), E.gDef(0.05)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_charter_path', 'CON_planter_path', 'CON_fascist_path'] }),
            f('CON_provost_network', '宪兵网络', '安全统制', 5, 3, 6, '在铁路和城市部署宪兵检查站。', [E.allT(1), E.maint(-0.02)], ['CON_security_path']),
            f('CON_press_licenses', '报刊许可', '安全统制', 5, 4, 7, '用许可制度控制政治宣传。', [E.pp(3), E.crisis(3)], ['CON_provost_network']),
            f('CON_counter_guerrillas', '反游击队', '安全统制', 5, 5, 7, '训练适合南方林地和沼泽的清剿部队。', [E.actionCost('move', -1), E.tagD('港口', 0.10)], ['CON_press_licenses']),
            f('CON_emergency_detention', '紧急拘押令', '安全统制', 5, 6, 8, '允许军方拘押破坏交通线的嫌疑人。', [E.maint(-0.03), E.gDef(0.05)], ['CON_counter_guerrillas']),
            f('CON_order_above_all', '秩序高于一切', '安全统制', 5, 7, 9, '把安全统制包装成胜利前提。', [E.ppIncome(1), E.allCapT(3), E.gDef(0.05), E.ideo('security_state')], ['CON_emergency_detention']),

            // 路线 4: 法西斯化 (Pelley-style) - gAtk + capture + damage
            f('CON_fascist_path', '南方法西斯化', '南方国民党', 8, 2, 6, '把摄政府交给一个新政党，承认强人统治。', [E.capT(3), E.gAtk(0.05)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_charter_path', 'CON_planter_path', 'CON_security_path'] }),
            f('CON_blackshirt_columns', '黑衫纵队', '南方国民党', 8, 3, 6, '组建党直属的黑衫纵队执行政治军事任务。', [E.allT(1), E.freeT(2)], ['CON_fascist_path']),
            f('CON_party_press_offices', '党办报社', '南方国民党', 8, 4, 7, '用党办报刊统一全国宣传。', [E.pp(5), E.ppCap(2)], ['CON_blackshirt_columns']),
            f('CON_corporate_chambers', '行业公会', '南方国民党', 8, 5, 7, '把企业、农会和工人编进党控行业公会。', [E.moneyIncome(1), E.recruitAmount(1)], ['CON_party_press_offices']),
            f('CON_total_state', '一体化国家', '南方国民党', 8, 6, 8, '把行政、经济、军事都收进党国体系。', [E.actionCost('all', -1), E.capMoney(3)], ['CON_corporate_chambers']),
            f('CON_crusade_against_north', '反工团十字军', '南方国民党', 8, 7, 9, '把战争塑造成反工团反联邦的圣战。', [E.gAtk(0.05), E.capTroop(1), E.damage(1, 2), E.badge('南方国民党'), E.ideo('fascism')], ['CON_total_state']),

            // 共通节点
            f('CON_archives', '摄政府档案室', '政治路线', 3, 3, 5, '建立战时档案和安全审查流程。', [E.maint(-0.02), E.crisis(2)], ['CON_constitutional_convention']),
            f('CON_southern_order_radio', '南方秩序广播', '政治路线', 6, 3, 5, '统一战时叙事。', [E.pp(3), E.money(8)], ['CON_constitutional_convention']),
            f('CON_atlanta_compromise', '亚特兰大妥协', '政治路线', 4, 5, 7, '即便派系激烈对立，也要保住战时行政能继续运转。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['CON_charter_path'], ['CON_planter_path'], ['CON_security_path'], ['CON_fascist_path']] }),
            f('CON_regency_mandate', '摄政授权', '政治路线', 4, 8, 11, '把所选的政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.gDef(0.05), E.allCapT(3)], [], { prerequisiteAny: [['CON_restored_commonwealth'], ['CON_corporate_regency'], ['CON_order_above_all'], ['CON_crusade_against_north']] }),

            // ============== 军事 ==============
            f('CON_general_staff', '亚特兰大总参', '军事路线', 11, 1, 5, '用内线交通和南方城市群建立指挥体系。', [E.capT(3)], ['CON_emergency_regency']),
            f('CON_guard_doctrine', '州卫队体系', '军事路线', 10, 2, 6, '强化地方守备和州卫队编成。', [E.recruitAmount(1), E.tagD('港口', 0.05)], ['CON_general_staff'], { mutuallyExclusive: ['CON_regular_doctrine'] }),
            f('CON_regular_doctrine', '正规军核心', '军事路线', 13, 2, 6, '把精锐集中到少数可控军团。', [E.capT(4), E.gAtk(0.05)], ['CON_general_staff'], { mutuallyExclusive: ['CON_guard_doctrine'] }),
            f('CON_guard_training', '州卫队教导团', '军事路线', 10, 3, 7, '把州卫队整训到能上前线的水平。', [E.allT(1), E.freeT(2)], ['CON_guard_doctrine']),
            f('CON_local_defense_command', '地方防卫司令部', '军事路线', 10, 4, 8, '让州卫队、宪兵和地方民兵共用指挥。', [E.gDef(0.05), E.tagD('港口', 0.10)], ['CON_guard_training']),
            f('CON_regular_school', '正规军学校', '军事路线', 13, 3, 7, '建立面向集团军级的军官学校。', [E.capT(3), E.allT(1)], ['CON_regular_doctrine']),
            f('CON_corps_command', '集团军指挥所', '军事路线', 13, 4, 8, '在亚特兰大建立可以运转集团军的指挥所。', [E.gAtk(0.05), E.actionCost('move', -1)], ['CON_regular_school']),
            f('CON_state_reserve_rotation', '州卫队轮换', '军事路线', 11, 5, 7, '保留预备队。', [E.maint(-0.02), E.allT(1)], ['CON_general_staff']),
            f('CON_carolina_battle_plan', '卡罗来纳战役计划', '军事路线', 11, 6, 10, '完成深南方守势-反击作战方案。', [E.gDef(0.05), E.capT(4), E.allCapT(2)], [], { prerequisiteAny: [['CON_local_defense_command'], ['CON_corps_command']] }),

            // ============== 经济 ==============
            f('CON_war_committee', '亚特兰大战时委员会', '经济路线', 16, 1, 5, '协调铁路、钢铁、港口和内陆工坊。', [E.money(16), E.tagInc('港口', 1)], ['CON_emergency_regency']),
            f('CON_railroad_capital', '铁路资本', '经济路线', 15, 2, 6, '以铁路资本推动军运和维修。', [E.moneyIncome(1), E.maint(-0.02)], ['CON_war_committee'], { mutuallyExclusive: ['CON_arsenal_program'] }),
            f('CON_arsenal_program', '内陆兵工', '经济路线', 17, 2, 6, '把伯明翰和亚特兰大变成稳定兵工链。', [E.allI(1, 2), E.capBoost(1, 1)], ['CON_war_committee'], { mutuallyExclusive: ['CON_railroad_capital'] }),
            f('CON_railroad_bonds', '铁路债券', '经济路线', 15, 3, 7, '发行铁路债券支持军运。', [E.bonds(25, 4, 3), E.tagInc('港口', 1)], ['CON_railroad_capital']),
            f('CON_machine_shop_expansion', '机修厂扩建', '经济路线', 15, 4, 8, '扩建关键铁路机修厂。', [E.allI(1, 3), E.actionCost('build', -1)], ['CON_railroad_bonds']),
            f('CON_steel_contracts', '钢铁合同', '经济路线', 17, 3, 7, '对伯明翰钢厂下达战时合同。', [E.nodeI('BHM', 1), E.money(15)], ['CON_arsenal_program']),
            f('CON_inland_arsenal', '内陆兵工厂', '经济路线', 17, 4, 8, '在内陆建立稳定的弹药与火炮生产线。', [E.allI(1, 3), E.capI(1)], ['CON_steel_contracts']),
            f('CON_southern_rail_priority', '南方铁路优先', '经济路线', 16, 5, 7, '给军列与军需运输设置优先级。', [E.maint(-0.02), E.money(12)], ['CON_war_committee']),
            f('CON_deep_south_production', '深南方总生产', '经济路线', 16, 6, 10, '把经济路线转化为可支撑长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 3), E.tagInc('港口', 1)], [], { prerequisiteAny: [['CON_machine_shop_expansion'], ['CON_inland_arsenal']] }),

            // ============== 地区 ==============
            f('CON_regional_office', '南大西洋政策', '地区外交', 20, 1, 5, '决定重心放在海岸港口还是内陆边界。', [E.money(10), E.pp(3)], ['CON_emergency_regency']),
            f('CON_coast_front', '海岸安全', '地区外交', 19, 2, 6, '优先掌控萨凡纳、杰克逊维尔和诺福克方向。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['CON_regional_office'], { mutuallyExclusive: ['CON_inland_front'] }),
            f('CON_inland_front', '内陆缓冲', '地区外交', 21, 2, 6, '在阿巴拉契亚和密西西比边缘建立缓冲。', [E.money(12), E.allT(1)], ['CON_regional_office'], { mutuallyExclusive: ['CON_coast_front'] }),
            f('CON_port_liaisons', '港口联络官', '地区外交', 19, 3, 7, '在沿海各港派出长期联络官。', [E.tagInc('港口', 1), E.tagMoney('港口', 6)], ['CON_coast_front']),
            f('CON_coastal_supply', '海岸补给线', '地区外交', 19, 4, 8, '让港口构成稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['CON_port_liaisons']),
            f('CON_mountain_scouts', '山地斥候', '地区外交', 21, 3, 7, '在阿巴拉契亚雇佣山地斥候。', [E.crisis(3), E.damage(1, 2)], ['CON_inland_front']),
            f('CON_inland_defense_line', '内陆防线', '地区外交', 21, 4, 8, '把内陆河谷打造成防御纵深。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['CON_mountain_scouts']),
            f('CON_south_atlantic_strategy', '南大西洋战略', '地区外交', 20, 5, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['CON_coastal_supply'], ['CON_inland_defense_line']] })
        ]);
        return tree;
    }

    // ============================================================
    // NEN - 新英格兰：自由州 / 商贸委员会 / 加拿大保护协定 / 普罗维登斯学社（洛夫克拉夫特）
    // 普罗维登斯路线最后分裂为 克苏鲁 / 犹格-索托斯 / 奈亚拉托提普 三大分支
    // ============================================================
    function buildNenTree() {
        const tree = [];
        addUnique(tree, [
            f('NEN_defense_council', '波士顿防务委员会', '战时统合', 11, 0, 4, '小而富裕的新英格兰需要把港口、议会和民兵组织起来。', [E.pp(4), E.capT(2)]),

            // ============== 政治路线 ==============
            f('NEN_compact_convention', '新英格兰公约', '政治路线', 4, 1, 5, '新英格兰要在自由州传统、商贸寡头、外部保护与普罗维登斯学社之间选择重心。', [E.pp(3), E.tagD('港口', 0.05)], ['NEN_defense_council']),

            // ----- 路线 1: 自由州路线 (Town Meeting) - x=0
            f('NEN_liberal_path', '自由州路线', '自由州', 0, 2, 6, '保持镇会、州议会和公民民兵传统。', [E.pp(3), E.ppCap(2)], ['NEN_compact_convention'], { mutuallyExclusive: ['NEN_merchant_path', 'NEN_protectorate_path', 'NEN_providence_path'] }),
            f('NEN_town_meetings', '镇会网络', '自由州', 0, 3, 6, '把镇会改造成战时动员节点。', [E.money(8), E.freeT(2)], ['NEN_liberal_path']),
            f('NEN_civic_militia', '公民民兵', '自由州', 0, 4, 7, '让公民民兵承担海岸和仓库守备。', [E.recruitAmount(1), E.tagT('港口', 1)], ['NEN_town_meetings']),
            f('NEN_civil_liberties', '保留公民自由', '自由州', 0, 5, 7, '用透明程序保持小国合法性。', [E.ppIncome(1), E.crisis(3)], ['NEN_civic_militia']),
            f('NEN_state_compacts', '州际契约', '自由州', 0, 6, 8, '把各州的战争义务写成公开契约。', [E.maint(-0.03), E.actionCost('focus', -1)], ['NEN_civil_liberties']),
            f('NEN_republic_of_towns', '镇会共和国', '自由州', 0, 7, 9, '以地方自治定义新英格兰政体。', [E.ppCap(3), E.pp(5), E.tagD('港口', 0.10), E.ideo('wartime_democracy')], ['NEN_state_compacts']),

            // ----- 路线 2: 商贸委员会 (Merchant) - x=2
            f('NEN_merchant_path', '商贸委员会路线', '商贸委员会', 2, 2, 6, '让航运商、银行和军需承包商承担国家能力。', [E.money(14), E.tagInc('港口', 1)], ['NEN_compact_convention'], { mutuallyExclusive: ['NEN_liberal_path', 'NEN_protectorate_path', 'NEN_providence_path'] }),
            f('NEN_harbor_banks', '港口银行', '商贸委员会', 2, 3, 6, '用港口金融维持战争信用。', [E.moneyIncome(1), E.bonds(20, 3, 3)], ['NEN_merchant_path']),
            f('NEN_shipping_registry', '船运登记', '商贸委员会', 2, 4, 7, '所有船运进入战时登记。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['NEN_harbor_banks']),
            f('NEN_insurance_pool', '保险共济池', '商贸委员会', 2, 5, 7, '分摊海运和港口损失。', [E.maint(-0.03), E.tagD('港口', 0.05)], ['NEN_shipping_registry']),
            f('NEN_merchant_cabinet', '商人内阁', '商贸委员会', 2, 6, 8, '由商贸集团协调外交和采购。', [E.pp(4), E.tagMoney('港口', 8)], ['NEN_insurance_pool']),
            f('NEN_atlantic_ledger', '大西洋账簿', '商贸委员会', 2, 7, 9, '以贸易账簿支撑国家运转。', [E.moneyIncome(2), E.actionCost('build', -1), E.allI(1, 2), E.ideo('plutocracy')], ['NEN_merchant_cabinet']),

            // ----- 路线 3: 加拿大保护协定 - x=5
            f('NEN_protectorate_path', '保护协定路线', '保护协定', 5, 2, 6, '接受加拿大-英联邦影响，换取安全和物资。', [E.capT(2), E.money(12)], ['NEN_compact_convention'], { mutuallyExclusive: ['NEN_liberal_path', 'NEN_merchant_path', 'NEN_providence_path'] }),
            f('NEN_foreign_liaison', '外部联络团', '保护协定', 5, 3, 6, '设立与境外势力沟通的常设渠道。', [E.money(10), E.freeT(3)], ['NEN_protectorate_path']),
            f('NEN_advisory_mission', '军事顾问团', '保护协定', 5, 4, 7, '邀请顾问帮助整训小型军队。', [E.allT(1), E.gDef(0.05)], ['NEN_foreign_liaison']),
            f('NEN_joint_harbor_watch', '联合港口巡防', '保护协定', 5, 5, 7, '让港口情报共享制度化。', [E.maint(-0.02), E.tagD('港口', 0.10)], ['NEN_advisory_mission']),
            f('NEN_import_controls', '进口管制', '保护协定', 5, 6, 8, '以进口配额换取战略物资。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['NEN_joint_harbor_watch']),
            f('NEN_shielded_commonwealth', '受保护共同体', '保护协定', 5, 7, 9, '把保护协定转化为长期安全框架。', [E.ppIncome(1), E.allCapT(3), E.tagD('港口', 0.10), E.ideo('security_state')], ['NEN_import_controls']),

            // ----- 路线 4: 普罗维登斯学社 (Lovecraft) - x=8
            // 这条线一开始很神秘，进度比一般路线慢；后期分裂为三个相互排斥的"诸神"分支
            f('NEN_providence_path', '普罗维登斯学社', '普罗维登斯学社', 8, 2, 6, '一群作家、神秘学者和反战名流聚集在普罗维登斯，宣称看见了人类历史之外的事物。', [E.pp(3), E.crisis(3)], ['NEN_compact_convention'], { mutuallyExclusive: ['NEN_liberal_path', 'NEN_merchant_path', 'NEN_protectorate_path'] }),
            f('NEN_arkham_commission', '阿卡姆调查委员会', '普罗维登斯学社', 8, 3, 6, '阿卡姆和密斯卡塔尼克大学的学者公开承认：他们正在阅读不该被阅读的文本。', [E.pp(3), E.capI(1)], ['NEN_providence_path']),
            f('NEN_innsmouth_files', '印斯茅斯档案', '普罗维登斯学社', 8, 4, 7, '海岸渔村的真实情况被秘密整理成内部档案，决策圈震动。', [E.tagT('港口', 1), E.tagD('港口', 0.10), E.crisis(3)], ['NEN_arkham_commission']),
            f('NEN_dunwich_excavations', '敦威治发掘', '普罗维登斯学社', 8, 5, 7, '在敦威治山丘下出土了一些不属于人类的物件，普罗维登斯学社开始公开"研究"。', [E.actionCost('build', -1), E.allI(1, 2)], ['NEN_innsmouth_files']),
            f('NEN_dreams_in_witch_house', '巫宅之梦', '普罗维登斯学社', 8, 6, 8, '巫宅里出现的梦境被作为情报证据，新英格兰高层进入半神秘状态。', [E.ppCap(3), E.maint(-0.02)], ['NEN_dunwich_excavations']),
            f('NEN_eldritch_revelation', '古旧启示', '普罗维登斯学社', 8, 7, 9, '洛夫克拉夫特公开宣布"另一些存在"已经回到地球，并要求新英格兰为最后选择做好准备。', [E.pp(6), E.ppCap(2), E.allCapT(2), E.badge('普罗维登斯学社')], ['NEN_dreams_in_witch_house'], { progressRequired: 5 }),

            // 三大终结分支：克苏鲁 / 犹格-索托斯 / 奈亚拉托提普
            f('NEN_branch_cthulhu', '克苏鲁觉醒（黄衣之王）', '克苏鲁觉醒', 6, 9, 11, '海中沉眠的存在被唤醒。新英格兰成为旧日支配者的祭坛，所有敌人都将在恐惧前后撤。', [E.gAtk(0.10), E.allCapT(4), E.capTroop(2), E.damage(2, 3), E.badge('克苏鲁觉醒'), E.ideo('cthulhu_cult')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_yog', 'NEN_branch_nyarl'], progressRequired: 6 }),
            f('NEN_cthulhu_dread_fleet', '深潜者舰队', '克苏鲁觉醒', 5, 10, 9, '深潜者从海中浮出，主动攻击邻近港口。', [E.tagT('港口', 2), E.gAtk(0.05), E.capMoney(2)], ['NEN_branch_cthulhu']),
            f('NEN_cthulhu_kingdom_in_yellow', '黄衣之国', '克苏鲁觉醒', 7, 10, 12, '洛夫克拉夫特宣布自己为黄衣之王。新英格兰转入永远的战争状态。', [E.gAtk(0.05), E.capMoney(4), E.damage(2, 3), E.ppCap(3), E.badge('黄衣之王')], ['NEN_branch_cthulhu']),

            f('NEN_branch_yog', '犹格-索托斯之钥（无所不知）', '犹格-索托斯之钥', 8, 9, 11, '密斯卡塔尼克的学者打开了"知道一切"的钥匙。新英格兰的工业和行政以一种不该有的速度展开。', [E.allI(2, 5), E.capBoost(2, 3), E.actionCost('all', -1), E.ppCap(4), E.badge('犹格-索托斯之钥'), E.ideo('eldritch_knowledge')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_cthulhu', 'NEN_branch_nyarl'], progressRequired: 6 }),
            f('NEN_yog_silver_key', '银钥', '犹格-索托斯之钥', 7, 10, 9, '兰多夫·卡特的银钥被找到。计划无须执行就已完成。', [E.actionCost('focus', -1), E.actionCost('build', -1), E.capI(2)], ['NEN_branch_yog']),
            f('NEN_yog_emperor_scientist', '圣人皇帝政体', '犹格-索托斯之钥', 9, 10, 12, '洛夫克拉夫特建立由"知者"组成的寡头共和。无知被视为犯罪。', [E.allI(1, 6), E.moneyIncome(2), E.ppIncome(1), E.capBoost(1, 4), E.badge('圣人皇帝政体')], ['NEN_branch_yog']),

            f('NEN_branch_nyarl', '奈亚拉托提普化身（爬行混沌）', '奈亚拉托提普化身', 10, 9, 11, '"千面"出现在波士顿、奥尔巴尼和缅因。所有政治都不再透明，但所有命令都被执行。', [E.ppIncome(2), E.recruitAmount(2), E.freeT(6), E.crisis(6), E.badge('爬行混沌'), E.ideo('crawling_chaos')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_cthulhu', 'NEN_branch_yog'], progressRequired: 6 }),
            f('NEN_nyarl_black_pharaoh', '黑色法老', '奈亚拉托提普化身', 9, 10, 9, '黑色法老的形象出现在每一面镜子里。地方治安成本骤减。', [E.maint(-0.05), E.actionCost('move', -1), E.allT(1)], ['NEN_branch_nyarl']),
            f('NEN_nyarl_haunter_in_dark', '黑暗中的潜伏者', '奈亚拉托提普化身', 11, 10, 12, '敌人首都开始流传出"被人在睡梦中看见"的报告，新英格兰几乎不需要直接进攻。', [E.damage(2, 4), E.crisis(5), E.allCapT(3), E.gAtk(0.05), E.badge('黑暗中的潜伏者')], ['NEN_branch_nyarl']),

            // 共通节点
            f('NEN_archives', '港口档案处', '政治路线', 3, 3, 5, '建立战时档案和安全审查流程。', [E.maint(-0.02), E.crisis(2)], ['NEN_compact_convention']),
            f('NEN_public_radio', '波士顿公共广播', '政治路线', 6, 3, 5, '统一战时叙事。', [E.pp(3), E.money(8)], ['NEN_compact_convention']),
            f('NEN_state_compromise', '州际调停会', '政治路线', 4, 5, 7, '在派系之间维持最低限度的合作。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['NEN_liberal_path'], ['NEN_merchant_path'], ['NEN_protectorate_path'], ['NEN_providence_path']] }),
            f('NEN_commonwealth_mandate', '共同体授权', '政治路线', 4, 8, 11, '把所选政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.tagD('港口', 0.05), E.allCapT(2)], [], { prerequisiteAny: [['NEN_republic_of_towns'], ['NEN_atlantic_ledger'], ['NEN_shielded_commonwealth'], ['NEN_eldritch_revelation']] }),

            // ============== 军事路线 ==============
            f('NEN_general_staff', '新英格兰防务参谋部', '军事路线', 11, 1, 5, '围绕港口、山地和城市纵深建立小型精锐防务。', [E.capT(3)], ['NEN_defense_council']),
            f('NEN_coastal_doctrine', '海岸堡垒', '军事路线', 10, 2, 6, '把港口和海岸线做成迟滞敌人的堡垒网。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['NEN_general_staff'], { mutuallyExclusive: ['NEN_ranger_doctrine'] }),
            f('NEN_ranger_doctrine', '山林游骑', '军事路线', 13, 2, 6, '利用缅因和阿巴拉契亚山林实施机动作战。', [E.actionCost('move', -1), E.gAtk(0.05)], ['NEN_general_staff'], { mutuallyExclusive: ['NEN_coastal_doctrine'] }),
            f('NEN_coastal_artillery', '海岸炮兵学校', '军事路线', 10, 3, 7, '把炮兵和港防写进训练手册。', [E.allT(1), E.tagD('港口', 0.05)], ['NEN_coastal_doctrine']),
            f('NEN_harbor_command', '港防司令部', '军事路线', 10, 4, 8, '用海岸要塞链锁住港口接近线。', [E.gDef(0.05), E.tagD('港口', 0.10)], ['NEN_coastal_artillery']),
            f('NEN_ranger_training', '游骑训练营', '军事路线', 13, 3, 7, '把游骑兵编成小队精锐。', [E.recruitAmount(1), E.actionCost('move', -1)], ['NEN_ranger_doctrine']),
            f('NEN_ranger_command', '山林指挥站', '军事路线', 13, 4, 8, '为游骑队建立长程指挥。', [E.capT(4), E.gAtk(0.05)], ['NEN_ranger_training']),
            f('NEN_town_reserve', '镇民预备队', '军事路线', 11, 5, 7, '保留预备队。', [E.maint(-0.02), E.freeT(3)], ['NEN_general_staff']),
            f('NEN_northeast_battle_plan', '东北防御计划', '军事路线', 11, 6, 10, '完成最适合小国的内战作战方案。', [E.gDef(0.05), E.allCapT(2), E.tagD('港口', 0.10)], [], { prerequisiteAny: [['NEN_harbor_command'], ['NEN_ranger_command']] }),

            // ============== 经济路线 ==============
            f('NEN_treasury', '波士顿财政局', '经济路线', 16, 1, 5, '把银行、港口、大学实验室和工坊纳入战时账本。', [E.money(16), E.moneyIncome(1)], ['NEN_defense_council']),
            f('NEN_finance_program', '金融信用', '经济路线', 15, 2, 6, '用银行信用换取短期战争资源。', [E.money(18), E.bonds(20, 3, 3)], ['NEN_treasury'], { mutuallyExclusive: ['NEN_workshop_program'] }),
            f('NEN_workshop_program', '精密工坊', '经济路线', 17, 2, 6, '发挥新英格兰小型工坊和大学技术。', [E.capI(1), E.capBoost(1, 1)], ['NEN_treasury'], { mutuallyExclusive: ['NEN_finance_program'] }),
            f('NEN_war_notes', '战争票据', '经济路线', 15, 3, 7, '发行高频低额的战争票据。', [E.bonds(25, 4, 3), E.moneyIncome(1)], ['NEN_finance_program']),
            f('NEN_procurement_office', '军需采购局', '经济路线', 15, 4, 8, '由商人和官员混合编成的统一采购局。', [E.allI(1, 2), E.actionCost('build', -1)], ['NEN_war_notes']),
            f('NEN_university_contracts', '大学合同', '经济路线', 17, 3, 7, '让密斯卡塔尼克与哈佛承担小型军用研究。', [E.capI(1), E.capBoost(1, 2)], ['NEN_workshop_program']),
            f('NEN_precision_arsenal', '精密军工厂', '经济路线', 17, 4, 8, '把精密机械投入军工生产。', [E.allI(1, 2), E.tagInc('港口', 1)], ['NEN_university_contracts']),
            f('NEN_northeast_rail_priority', '东北铁路优先', '经济路线', 16, 5, 7, '协调铁路、港口和工坊节奏。', [E.maint(-0.02), E.money(12)], ['NEN_treasury']),
            f('NEN_efficient_economy', '小国高效经济', '经济路线', 16, 6, 10, '把经济路线转化为可支撑长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 2), E.tagInc('港口', 1)], [], { prerequisiteAny: [['NEN_procurement_office'], ['NEN_precision_arsenal']] }),

            // ============== 地区 ==============
            f('NEN_regional_office', '东北边界政策', '地区外交', 20, 1, 5, '决定向纽约走廊施压还是维持北方安全。', [E.money(10), E.pp(3)], ['NEN_defense_council']),
            f('NEN_newyork_front', '纽约走廊', '地区外交', 19, 2, 6, '尝试影响奥尔巴尼、纽约和康涅狄格交通线。', [E.money(12), E.crisis(3)], ['NEN_regional_office'], { mutuallyExclusive: ['NEN_north_front'] }),
            f('NEN_north_front', '北方安全', '地区外交', 21, 2, 6, '把缅因和边境森林变成战略缓冲。', [E.allT(1), E.gDef(0.05)], ['NEN_regional_office'], { mutuallyExclusive: ['NEN_newyork_front'] }),
            f('NEN_hudson_liaisons', '哈德逊联络站', '地区外交', 19, 3, 7, '在奥尔巴尼-纽约交通线设立联络站。', [E.tagT('港口', 1), E.damage(1, 2)], ['NEN_newyork_front']),
            f('NEN_hudson_corridor', '哈德逊走廊', '地区外交', 19, 4, 8, '把哈德逊河沿线变成可机动的走廊。', [E.actionCost('move', -1), E.capT(2)], ['NEN_hudson_liaisons']),
            f('NEN_border_patrols', '边境巡防队', '地区外交', 21, 3, 7, '在缅因和山口设巡防队。', [E.maint(-0.02), E.allT(1)], ['NEN_north_front']),
            f('NEN_north_supply_line', '北方补给线', '地区外交', 21, 4, 8, '巩固北部补给线。', [E.tagInc('港口', 1), E.gDef(0.05)], ['NEN_border_patrols']),
            f('NEN_survival_strategy', '东北存续战略', '地区外交', 20, 5, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.tagD('港口', 0.10)], [], { prerequisiteAny: [['NEN_hudson_corridor'], ['NEN_north_supply_line']] })
        ]);
        return tree;
    }

    // ============================================================
    // PAC - 太平洋国：进步民主 / 技术内阁 / 防务联盟 / 太平洋帝国
    // ============================================================
    function buildPacTree() {
        const tree = [];
        addUnique(tree, [
            f('PAC_emergency_assembly', '萨克拉门托紧急议会', '战时统合', 11, 0, 4, '太平洋国必须把西海岸城市、山口防线和进步派联盟整合。', [E.pp(4), E.capT(2)]),

            f('PAC_west_convention', '西海岸政治大会', '政治路线', 4, 1, 5, '太平洋国在进步民主、技术官僚、防务联盟和殖民扩张派之间寻找稳定形态。', [E.pp(3), E.tagInc('港口', 1)], ['PAC_emergency_assembly']),

            // 路线 1: 进步民主 - PP cap, ppIncome, civic
            f('PAC_progressive_path', '进步民主路线', '进步民主', 0, 2, 6, '以西海岸改革传统争取城市中产和劳工。', [E.pp(3), E.ppCap(2)], ['PAC_west_convention'], { mutuallyExclusive: ['PAC_technocrat_path', 'PAC_defense_path', 'PAC_imperial_path'] }),
            f('PAC_labor_peace', '劳资和平', '进步民主', 0, 3, 6, '用仲裁稳住港口和城市劳资关系。', [E.maint(-0.02), E.tagInc('港口', 1)], ['PAC_progressive_path']),
            f('PAC_civic_guard', '市民卫队', '进步民主', 0, 4, 7, '建立城市志愿卫队。', [E.recruitAmount(1), E.freeT(2)], ['PAC_labor_peace']),
            f('PAC_public_ballots', '公开选票', '进步民主', 0, 5, 7, '承诺战争期间仍保留有限选举。', [E.ppIncome(1), E.crisis(3)], ['PAC_civic_guard']),
            f('PAC_social_relief', '社会救济署', '进步民主', 0, 6, 8, '用救济和配给维持后方稳定。', [E.moneyIncome(1), E.maint(-0.02)], ['PAC_public_ballots']),
            f('PAC_pacific_republicanism', '太平洋共和主义', '进步民主', 0, 7, 9, '把改革传统升格为国家身份。', [E.actionCost('focus', -1), E.ppCap(3), E.pp(5), E.ideo('wartime_democracy')], ['PAC_social_relief']),

            // 路线 2: 技术内阁 - 工业 + cap + actionCost
            f('PAC_technocrat_path', '技术内阁路线', '技术内阁', 2, 2, 6, '让工程师、港务官和军需专家主导战争。', [E.capI(1), E.capBoost(1, 1)], ['PAC_west_convention'], { mutuallyExclusive: ['PAC_progressive_path', 'PAC_defense_path', 'PAC_imperial_path'] }),
            f('PAC_water_boards', '水电委员会', '技术内阁', 2, 3, 6, '统筹水、电和港口能源。', [E.moneyIncome(1), E.actionCost('build', -1)], ['PAC_technocrat_path']),
            f('PAC_port_authority', '港务总署', '技术内阁', 2, 4, 7, '统一西海岸港口管理。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['PAC_water_boards']),
            f('PAC_logistics_tables', '物流表格', '技术内阁', 2, 5, 7, '把山口、铁路和港口写进统一表格。', [E.actionCost('move', -1), E.maint(-0.02)], ['PAC_port_authority']),
            f('PAC_aero_contracts', '航空合同', '技术内阁', 2, 6, 8, '推动西海岸航空和机械工坊。', [E.allI(1, 3), E.capBoost(1, 2)], ['PAC_logistics_tables']),
            f('PAC_engineered_state', '工程化国家', '技术内阁', 2, 7, 9, '把技术官僚体系变成太平洋国的日常政府。', [E.actionCost('build', -1), E.allI(1, 3), E.pp(4), E.ideo('technocracy')], ['PAC_aero_contracts']),

            // 路线 3: 防务联盟 - gDef + tagD + capT
            f('PAC_defense_path', '防务联盟路线', '防务联盟', 5, 2, 6, '以山口威胁和内陆敌人为由集中防务权。', [E.capT(2), E.gDef(0.05)], ['PAC_west_convention'], { mutuallyExclusive: ['PAC_progressive_path', 'PAC_technocrat_path', 'PAC_imperial_path'] }),
            f('PAC_coast_guard', '海岸警备队', '防务联盟', 5, 3, 6, '把港口、海岸和城市警备合并。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['PAC_defense_path']),
            f('PAC_mountain_passes', '山口司令', '防务联盟', 5, 4, 7, '让内华达山口成为前线指挥核心。', [E.allT(1), E.maint(-0.02)], ['PAC_coast_guard']),
            f('PAC_security_permits', '安全许可', '防务联盟', 5, 5, 7, '对铁路和港口关键岗位实行许可制度。', [E.pp(3), E.crisis(3)], ['PAC_mountain_passes']),
            f('PAC_western_command', '西部司令部', '防务联盟', 5, 6, 8, '把军队和州府纳入统一司令部。', [E.actionCost('move', -1), E.allCapT(2)], ['PAC_security_permits']),
            f('PAC_fortress_pacific', '太平洋堡垒', '防务联盟', 5, 7, 9, '确认太平洋国优先自保，再谋统一。', [E.maint(-0.03), E.gDef(0.05), E.tagD('港口', 0.10), E.ideo('security_state')], ['PAC_western_command']),

            // 路线 4: 太平洋帝国 (Hughes-style colonial expansion) - 缴获 + 攻击 + 港口扩张
            f('PAC_imperial_path', '太平洋帝国路线', '太平洋帝国', 8, 2, 6, '把太平洋国塑造成一个面向海外的扩张共和国。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_west_convention'], { mutuallyExclusive: ['PAC_progressive_path', 'PAC_technocrat_path', 'PAC_defense_path'] }),
            f('PAC_pacific_squadrons', '太平洋分舰队', '太平洋帝国', 8, 3, 6, '把民用船团改造成可调度的分舰队。', [E.tagT('港口', 1), E.tagD('港口', 0.05)], ['PAC_imperial_path']),
            f('PAC_island_protectorates', '岛屿保护地', '太平洋帝国', 8, 4, 7, '与西太平洋小国签订保护条约。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['PAC_pacific_squadrons']),
            f('PAC_marine_expansion', '陆战队扩编', '太平洋帝国', 8, 5, 7, '扩充海岸突击与登陆部队。', [E.recruitAmount(1), E.allCapT(2)], ['PAC_island_protectorates']),
            f('PAC_overseas_revenue', '海外岁入', '太平洋帝国', 8, 6, 8, '把海外港口岁入纳入战时预算。', [E.tagMoney('港口', 8), E.bonds(20, 3, 3)], ['PAC_marine_expansion']),
            f('PAC_pacific_imperium', '太平洋帝国', '太平洋帝国', 8, 7, 9, '太平洋国宣布自己是西太平洋的核心政治力量。', [E.gAtk(0.05), E.capMoney(3), E.capTroop(1), E.badge('太平洋帝国'), E.ideo('expansionism')], ['PAC_overseas_revenue']),

            // 共通节点
            f('PAC_archives', '西海岸档案局', '政治路线', 3, 3, 5, '建立战时档案和安全审查流程。', [E.maint(-0.02), E.crisis(2)], ['PAC_west_convention']),
            f('PAC_pacific_radio', '太平洋广播网', '政治路线', 6, 3, 5, '统一战时叙事。', [E.pp(3), E.money(8)], ['PAC_west_convention']),
            f('PAC_sacramento_compromise', '萨克拉门托妥协', '政治路线', 4, 5, 7, '把互相警惕的政治集团拉回同一张战时桌面。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['PAC_progressive_path'], ['PAC_technocrat_path'], ['PAC_defense_path'], ['PAC_imperial_path']] }),
            f('PAC_west_mandate', '西海岸授权', '政治路线', 4, 8, 11, '把所选政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.tagInc('港口', 1), E.allCapT(3)], [], { prerequisiteAny: [['PAC_pacific_republicanism'], ['PAC_engineered_state'], ['PAC_fortress_pacific'], ['PAC_pacific_imperium']] }),

            // ============== 军事 ==============
            f('PAC_general_staff', '西海岸防务参谋部', '军事路线', 11, 1, 5, '以山口、港口和长距离机动作战保卫太平洋国。', [E.capT(3)], ['PAC_emergency_assembly']),
            f('PAC_passes_doctrine', '山口防线', '军事路线', 10, 2, 6, '让山地和沙漠成为天然防御。', [E.maint(-0.02), E.gDef(0.05)], ['PAC_general_staff'], { mutuallyExclusive: ['PAC_marines_doctrine'] }),
            f('PAC_marines_doctrine', '太平洋陆战队', '军事路线', 13, 2, 6, '围绕港口和机动登陆建立精锐部队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_general_staff'], { mutuallyExclusive: ['PAC_passes_doctrine'] }),
            f('PAC_passes_training', '山地守备营', '军事路线', 10, 3, 7, '把山地步兵训成精锐守备。', [E.allT(1), E.maint(-0.02)], ['PAC_passes_doctrine']),
            f('PAC_passes_command', '山口防务司令部', '军事路线', 10, 4, 8, '把山口指挥并入统一防务。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['PAC_passes_training']),
            f('PAC_marine_training', '港口突击训练', '军事路线', 13, 3, 7, '把陆战队训练成可登陆部队。', [E.recruitAmount(1), E.tagT('港口', 1)], ['PAC_marines_doctrine']),
            f('PAC_marine_command', '海岸机动司令部', '军事路线', 13, 4, 8, '为陆战队建立长程指挥。', [E.actionCost('move', -1), E.gAtk(0.05)], ['PAC_marine_training']),
            f('PAC_coast_reserve', '海岸预备队', '军事路线', 11, 5, 7, '保留预备队。', [E.maint(-0.02), E.freeT(3)], ['PAC_general_staff']),
            f('PAC_rocky_outflank_plan', '落基山外线计划', '军事路线', 11, 6, 10, '完成最适合本势力的长期内战作战方案。', [E.gAtk(0.05), E.capT(4), E.tagD('港口', 0.05)], [], { prerequisiteAny: [['PAC_passes_command'], ['PAC_marine_command']] }),

            // ============== 经济 ==============
            f('PAC_production_board', '西海岸生产委员会', '经济路线', 16, 1, 5, '整合港口、农场、水电和航空工坊。', [E.money(16), E.tagInc('港口', 1)], ['PAC_emergency_assembly']),
            f('PAC_ports_program', '港口经济', '经济路线', 15, 2, 6, '让洛杉矶和旧金山承担更多现金流。', [E.moneyIncome(1), E.tagMoney('港口', 8)], ['PAC_production_board'], { mutuallyExclusive: ['PAC_aerospace_program'] }),
            f('PAC_aerospace_program', '航空工坊', '经济路线', 17, 2, 6, '发展西海岸航空和机械生产。', [E.capI(1), E.capBoost(1, 1)], ['PAC_production_board'], { mutuallyExclusive: ['PAC_ports_program'] }),
            f('PAC_port_bonds', '港口债券', '经济路线', 15, 3, 7, '发行港口债券。', [E.bonds(25, 4, 3), E.tagInc('港口', 1)], ['PAC_ports_program']),
            f('PAC_coastal_arsenal', '海岸兵工厂', '经济路线', 15, 4, 8, '让港口承担更多军工生产。', [E.allI(1, 3), E.actionCost('build', -1)], ['PAC_port_bonds']),
            f('PAC_aero_orders', '航空订单', '经济路线', 17, 3, 7, '为本国与海外发出航空订单。', [E.money(15), E.capI(1)], ['PAC_aerospace_program']),
            f('PAC_aero_factories', '飞机零件厂', '经济路线', 17, 4, 8, '把零件厂扩建到极限。', [E.allI(1, 3), E.capBoost(1, 2)], ['PAC_aero_orders']),
            f('PAC_pass_rail_priority', '山口铁路优先', '经济路线', 16, 5, 7, '协调山口、港口和铁路。', [E.maint(-0.02), E.money(12)], ['PAC_production_board']),
            f('PAC_total_pacific_production', '太平洋总生产', '经济路线', 16, 6, 10, '把经济路线转化为长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 3), E.tagInc('港口', 1)], [], { prerequisiteAny: [['PAC_coastal_arsenal'], ['PAC_aero_factories']] }),

            // ============== 地区 ==============
            f('PAC_regional_office', '西部外交局', '地区外交', 20, 1, 5, '决定向落基山推进还是巩固太平洋海岸。', [E.money(10), E.pp(3)], ['PAC_emergency_assembly']),
            f('PAC_rockies_front', '落基山接触', '地区外交', 19, 2, 6, '向丹佛和盐湖城方向寻找突破口。', [E.pp(3), E.recruitAmount(1)], ['PAC_regional_office'], { mutuallyExclusive: ['PAC_coast_front'] }),
            f('PAC_coast_front', '海岸优先', '地区外交', 21, 2, 6, '保持海岸城市与港口绝对安全。', [E.money(12), E.tagD('港口', 0.10)], ['PAC_regional_office'], { mutuallyExclusive: ['PAC_rockies_front'] }),
            f('PAC_mountain_liaisons', '山地联络队', '地区外交', 19, 3, 7, '在山口设联络队。', [E.allT(1), E.crisis(2)], ['PAC_rockies_front']),
            f('PAC_nevada_corridor', '内华达通道', '地区外交', 19, 4, 8, '内华达走廊变成稳定补给线。', [E.actionCost('recruit', -1), E.capT(2)], ['PAC_mountain_liaisons']),
            f('PAC_port_diplomats', '港务外交官', '地区外交', 21, 3, 7, '在港口设常驻外交官。', [E.tagInc('港口', 1), E.tagMoney('港口', 6)], ['PAC_coast_front']),
            f('PAC_coast_supply', '海岸补给走廊', '地区外交', 21, 4, 8, '海岸补给走廊。', [E.tagT('港口', 1), E.gDef(0.05)], ['PAC_port_diplomats']),
            f('PAC_west_unification', '西部统一战略', '地区外交', 20, 5, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.allCapT(2)], [], { prerequisiteAny: [['PAC_nevada_corridor'], ['PAC_coast_supply']] })
        ]);
        return tree;
    }

    // ============================================================
    // WDC - 西部军区：军官 / 边疆 / 西部共和国 / 长程远征
    // ============================================================
    function buildWdcTree() {
        const tree = [];
        addUnique(tree, [
            f('WDC_command_post', '丹佛军区司令部', '战时统合', 11, 0, 4, '西部军区需要在荒漠、山地和稀薄工业中维持一支能打的军队。', [E.pp(4), E.capT(3)]),

            f('WDC_rocky_council', '落基山紧急议事会', '政治路线', 4, 1, 5, '军区必须决定是继续军官统治、拉拢边疆州长，还是走向自治共和国，亦或主动出击。', [E.pp(3), E.allT(1)], ['WDC_command_post']),

            // 路线 1: 军官委员会 (Patton-style junta) - capT, freeT, allT
            f('WDC_junta_path', '军官委员会路线', '军官委员会', 0, 2, 6, '维持军区本色，由军官直接处理战争和行政。', [E.capT(3), E.freeT(3)], ['WDC_rocky_council'], { mutuallyExclusive: ['WDC_frontier_path', 'WDC_republic_path', 'WDC_expedition_path'] }),
            f('WDC_staff_orders', '参谋命令', '军官委员会', 0, 3, 6, '所有地区命令必须经过丹佛参谋部。', [E.pp(3), E.maint(-0.02)], ['WDC_junta_path']),
            f('WDC_provost_posts', '宪兵岗哨', '军官委员会', 0, 4, 7, '在铁路和山口设置宪兵。', [E.maint(-0.03), E.crisis(3)], ['WDC_staff_orders']),
            f('WDC_officer_governors', '军官州督', '军官委员会', 0, 5, 7, '由军官兼任关键州行政长官。', [E.actionCost('move', -1), E.allT(1)], ['WDC_provost_posts']),
            f('WDC_desert_discipline', '荒漠纪律', '军官委员会', 0, 6, 8, '以严格纪律维持稀薄补给线。', [E.allCapT(3), E.freeT(3)], ['WDC_officer_governors']),
            f('WDC_command_state', '司令部国家', '军官委员会', 0, 7, 9, '承认军区司令部就是西部国家。', [E.gDef(0.05), E.capT(4), E.actionCost('focus', -1), E.ideo('military_junta')], ['WDC_desert_discipline']),

            // 路线 2: 边疆州长 - money + recruitAmount
            f('WDC_frontier_path', '边疆州长路线', '边疆州长', 2, 2, 6, '让各州长和地方治安官参与军区统治。', [E.money(12), E.recruitAmount(1)], ['WDC_rocky_council'], { mutuallyExclusive: ['WDC_junta_path', 'WDC_republic_path', 'WDC_expedition_path'] }),
            f('WDC_sheriff_compacts', '治安官协定', '边疆州长', 2, 3, 6, '利用地方治安网络维护后方。', [E.maint(-0.02), E.freeT(2)], ['WDC_frontier_path']),
            f('WDC_rancher_councils', '牧场主委员会', '边疆州长', 2, 4, 7, '以牧场补给换取政治承认。', [E.moneyIncome(1), E.tagInc('油田', 1)], ['WDC_sheriff_compacts']),
            f('WDC_frontier_levies', '边疆征召', '边疆州长', 2, 5, 7, '允许地方自行组织守备队。', [E.recruitAmount(1), E.recruitCost(-1)], ['WDC_rancher_councils']),
            f('WDC_state_bargains', '州际交易', '边疆州长', 2, 6, 8, '以道路和水权换取州府支持。', [E.money(18), E.bonds(20, 3, 3)], ['WDC_frontier_levies']),
            f('WDC_mountain_compact', '山地契约', '边疆州长', 2, 7, 9, '把边疆自治写入军区新秩序。', [E.ppIncome(1), E.moneyIncome(2), E.allCapT(2), E.ideo('federalism')], ['WDC_state_bargains']),

            // 路线 3: 西部自治 (Republic) - PP cap, civic
            f('WDC_republic_path', '西部自治路线', '西部自治', 5, 2, 6, '把临时军区改造成独立的西部政治共同体。', [E.pp(3), E.ppCap(2)], ['WDC_rocky_council'], { mutuallyExclusive: ['WDC_junta_path', 'WDC_frontier_path', 'WDC_expedition_path'] }),
            f('WDC_denver_assembly', '丹佛大会', '西部自治', 5, 3, 6, '召集山地和荒漠城市代表。', [E.actionCost('focus', -1), E.pp(3)], ['WDC_republic_path']),
            f('WDC_water_rights', '水权章程', '西部自治', 5, 4, 7, '用水权和土地承诺安抚地方。', [E.moneyIncome(1), E.maint(-0.02)], ['WDC_denver_assembly']),
            f('WDC_settler_militias', '拓荒民兵', '西部自治', 5, 5, 7, '把拓荒者组织成轻装守备。', [E.allT(1), E.freeT(3)], ['WDC_water_rights']),
            f('WDC_western_bill', '西部权利法案', '西部自治', 5, 6, 8, '给新政体一个不同于东部的合法性。', [E.ppIncome(1), E.pp(4)], ['WDC_settler_militias']),
            f('WDC_rocky_republic', '落基山共和国', '西部自治', 5, 7, 9, '宣布西部将以自己的方式重建秩序。', [E.ppCap(3), E.allCapT(2), E.crisis(4), E.ideo('wartime_democracy')], ['WDC_western_bill']),

            // 路线 4: 西部远征派 (aggressive Patton) - gAtk, capture, damage
            f('WDC_expedition_path', '西部远征路线', '远征派', 8, 2, 6, '只靠防御没有未来，必须主动出击夺取资源。', [E.capT(2), E.gAtk(0.05)], ['WDC_rocky_council'], { mutuallyExclusive: ['WDC_junta_path', 'WDC_frontier_path', 'WDC_republic_path'] }),
            f('WDC_long_range_columns', '长程纵队', '远征派', 8, 3, 6, '把骑兵、机动步兵和卡车混编成长程纵队。', [E.actionCost('move', -1), E.allT(1)], ['WDC_expedition_path']),
            f('WDC_seizure_protocols', '缴获条令', '远征派', 8, 4, 7, '凡占领的城镇要立刻征用粮、油、马、车。', [E.capMoney(3), E.capTroop(1)], ['WDC_long_range_columns']),
            f('WDC_demolition_teams', '爆破队', '远征派', 8, 5, 7, '在敌方铁路与水站设置爆破队。', [E.damage(1, 3), E.crisis(3)], ['WDC_seizure_protocols']),
            f('WDC_oil_grab', '油田突袭', '远征派', 8, 6, 8, '把德州、俄克拉荷马的油田作为远征首要目标。', [E.tagT('油田', 1), E.tagInc('油田', 1)], ['WDC_demolition_teams']),
            f('WDC_western_warpath', '西部战路', '远征派', 8, 7, 9, '把"主动出击"写成军区国家原则。', [E.gAtk(0.10), E.capMoney(3), E.capTroop(1), E.badge('西部战路'), E.ideo('expansionism')], ['WDC_oil_grab']),

            // 共通节点
            f('WDC_archives', '山地档案处', '政治路线', 3, 3, 5, '建立战时档案。', [E.maint(-0.02), E.crisis(2)], ['WDC_rocky_council']),
            f('WDC_radio', '丹佛军区广播', '政治路线', 6, 3, 5, '统一战时叙事。', [E.pp(3), E.money(8)], ['WDC_rocky_council']),
            f('WDC_frontier_compromise', '边疆调停会', '政治路线', 4, 5, 7, '在派系之间维持最低限度合作。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['WDC_junta_path'], ['WDC_frontier_path'], ['WDC_republic_path'], ['WDC_expedition_path']] }),
            f('WDC_rocky_mandate', '落基山授权', '政治路线', 4, 8, 11, '把所选政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.allCapT(3), E.allT(1)], [], { prerequisiteAny: [['WDC_command_state'], ['WDC_mountain_compact'], ['WDC_rocky_republic'], ['WDC_western_warpath']] }),

            // 军事
            f('WDC_general_staff', '落基山总参', '军事路线', 11, 1, 5, '用少量兵力控制山口、铁路和荒漠道路。', [E.capT(3)], ['WDC_command_post']),
            f('WDC_mountain_doctrine', '山地防御', '军事路线', 10, 2, 6, '依靠地形和山口构筑弹性防线。', [E.maint(-0.02), E.gDef(0.05)], ['WDC_general_staff'], { mutuallyExclusive: ['WDC_raider_doctrine'] }),
            f('WDC_raider_doctrine', '荒漠游击', '军事路线', 13, 2, 6, '用小股机动部队扰乱敌方补给。', [E.actionCost('move', -1), E.gAtk(0.05)], ['WDC_general_staff'], { mutuallyExclusive: ['WDC_mountain_doctrine'] }),
            f('WDC_mountain_school', '山地步兵学校', '军事路线', 10, 3, 7, '训练山地步兵。', [E.allT(1), E.tagD('油田', 0.05)], ['WDC_mountain_doctrine']),
            f('WDC_pass_command', '山口防务司令部', '军事路线', 10, 4, 8, '把山口指挥并入统一防务。', [E.gDef(0.05), E.maint(-0.02)], ['WDC_mountain_school']),
            f('WDC_desert_recon', '荒漠侦察队', '军事路线', 13, 3, 7, '建立荒漠侦察网。', [E.recruitAmount(1), E.damage(1, 2)], ['WDC_raider_doctrine']),
            f('WDC_long_range_command', '长程巡逻司令部', '军事路线', 13, 4, 8, '为荒漠袭扰建立长程指挥。', [E.gAtk(0.05), E.capMoney(2)], ['WDC_desert_recon']),
            f('WDC_mountain_reserve', '山地预备队', '军事路线', 11, 5, 7, '保留预备队。', [E.maint(-0.02), E.freeT(3)], ['WDC_general_staff']),
            f('WDC_western_battle_plan', '西部纵深计划', '军事路线', 11, 6, 10, '完成最适合本势力的长期内战作战方案。', [E.gDef(0.05), E.allCapT(2), E.allT(1)], [], { prerequisiteAny: [['WDC_pass_command'], ['WDC_long_range_command']] }),

            // 经济
            f('WDC_supply_office', '西部补给局', '经济路线', 16, 1, 5, '在低工业地区尽可能榨出道路、水源和矿产价值。', [E.money(14), E.tagInc('油田', 1)], ['WDC_command_post']),
            f('WDC_mines_program', '矿区征用', '经济路线', 15, 2, 6, '征用山地矿场支持军需。', [E.capI(1), E.capBoost(1, 1)], ['WDC_supply_office'], { mutuallyExclusive: ['WDC_ranches_program'] }),
            f('WDC_ranches_program', '牧场补给', '经济路线', 17, 2, 6, '让牧场承担粮食和运输动物。', [E.moneyIncome(1), E.freeT(2)], ['WDC_supply_office'], { mutuallyExclusive: ['WDC_mines_program'] }),
            f('WDC_mine_contracts', '矿石合同', '经济路线', 15, 3, 7, '对铜矿与铅矿下达战时合同。', [E.money(15), E.actionCost('build', -1)], ['WDC_mines_program']),
            f('WDC_mountain_workshops', '山地工坊', '经济路线', 15, 4, 8, '在丹佛和盐湖城扩建小型工坊。', [E.allI(1, 2), E.capBoost(1, 1)], ['WDC_mine_contracts']),
            f('WDC_ranch_quotas', '牧场配给', '经济路线', 17, 3, 7, '把牧场粮食配给给前线部队。', [E.tagInc('油田', 1), E.freeT(3)], ['WDC_ranches_program']),
            f('WDC_local_arsenals', '地方修械所', '经济路线', 17, 4, 8, '在小镇建立简单修械所。', [E.allI(1, 2), E.maint(-0.02)], ['WDC_ranch_quotas']),
            f('WDC_desert_rail_priority', '荒漠军运表', '经济路线', 16, 5, 7, '协调荒漠和山口的有限运力。', [E.maint(-0.02), E.money(10)], ['WDC_supply_office']),
            f('WDC_thrift_economy', '西部节约经济', '经济路线', 16, 6, 10, '把经济路线转化为可支撑长期内战的生产制度。', [E.moneyIncome(1), E.allI(1, 2), E.allCapT(2)], [], { prerequisiteAny: [['WDC_mountain_workshops'], ['WDC_local_arsenals']] }),

            // 地区
            f('WDC_regional_office', '西部边境政策', '地区外交', 20, 1, 5, '选择向太平洋、德州或中部平原寻找机会。', [E.money(10), E.pp(3)], ['WDC_command_post']),
            f('WDC_pacific_front', '太平洋接触', '地区外交', 19, 2, 6, '与西海岸交换山口安全和贸易通道。', [E.money(12), E.tagInc('港口', 1)], ['WDC_regional_office'], { mutuallyExclusive: ['WDC_plains_front'] }),
            f('WDC_plains_front', '平原缓冲', '地区外交', 21, 2, 6, '在奥马哈、堪萨斯方向建立预警纵深。', [E.allT(1), E.crisis(3)], ['WDC_regional_office'], { mutuallyExclusive: ['WDC_pacific_front'] }),
            f('WDC_pass_negotiators', '山口谈判员', '地区外交', 19, 3, 7, '与西海岸和落基山州签订山口协议。', [E.actionCost('move', -1), E.tagInc('港口', 1)], ['WDC_pacific_front']),
            f('WDC_nevada_corridor', '内华达走廊', '地区外交', 19, 4, 8, '把通往太平洋国的山口变成稳定走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['WDC_pass_negotiators']),
            f('WDC_plains_outposts', '平原哨站', '地区外交', 21, 3, 7, '在平原边缘设哨站。', [E.damage(1, 2), E.allT(1)], ['WDC_plains_front']),
            f('WDC_eastern_line', '丹佛东线', '地区外交', 21, 4, 8, '把丹佛东线变成可机动防线。', [E.capT(2), E.gDef(0.05)], ['WDC_plains_outposts']),
            f('WDC_west_survival', '西部存续战略', '地区外交', 20, 5, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.allCapT(2)], [], { prerequisiteAny: [['WDC_nevada_corridor'], ['WDC_eastern_line']] })
        ]);
        return tree;
    }

    // ============================================================
    // TEX - 德克萨斯：石油 / 牧场民粹 / 共和国 / 大德州
    // ============================================================
    function buildTexTree() {
        const tree = [];
        addUnique(tree, [
            f('TEX_provisional_government', '达拉斯临时政府', '战时统合', 11, 0, 4, '德克萨斯必须用石油、民兵和边境政治撑起独立战争机器。', [E.pp(4), E.capT(2)]),

            f('TEX_state_convention', '德州紧急大会', '政治路线', 4, 1, 5, '临时政府要在石油寡头、牧场民粹、共和制度和大德州扩张派之间定型。', [E.pp(3), E.tagInc('油田', 1)], ['TEX_provisional_government']),

            // 路线 1: 石油委员会 - tagInc(油田), money, bonds
            f('TEX_oilmen_path', '石油委员会路线', '石油委员会', 0, 2, 6, '让油田、银行和运输公司成为国家支柱。', [E.money(14), E.tagInc('油田', 1)], ['TEX_state_convention'], { mutuallyExclusive: ['TEX_rancher_path', 'TEX_republic_path', 'TEX_greater_path'] }),
            f('TEX_well_registry', '油井登记', '石油委员会', 0, 3, 6, '所有油井进入战时登记。', [E.moneyIncome(1), E.tagInc('油田', 1)], ['TEX_oilmen_path']),
            f('TEX_pipeline_guards', '管线卫队', '石油委员会', 0, 4, 7, '为油井和管线部署守备。', [E.tagT('油田', 1), E.tagD('油田', 0.10)], ['TEX_well_registry']),
            f('TEX_fuel_rationing', '燃油配给', '石油委员会', 0, 5, 7, '用燃油配额控制军队和工业。', [E.maint(-0.03), E.actionCost('move', -1)], ['TEX_pipeline_guards']),
            f('TEX_oil_credit', '石油信用', '石油委员会', 0, 6, 8, '以未来油税发行战争信用。', [E.bonds(35, 5, 4), E.tagMoney('油田', 8)], ['TEX_fuel_rationing']),
            f('TEX_petroleum_state', '石油国家', '石油委员会', 0, 7, 9, '承认石油就是德州的财政宪法。', [E.moneyIncome(2), E.actionCost('build', -1), E.tagInc('油田', 2), E.ideo('plutocracy')], ['TEX_oil_credit']),

            // 路线 2: 牧场民粹 - recruit, freeT, civic
            f('TEX_rancher_path', '牧场民粹路线', '牧场民粹', 2, 2, 6, '让牧场主、地方民兵和小城镇获得政治发言权。', [E.pp(3), E.recruitAmount(1)], ['TEX_state_convention'], { mutuallyExclusive: ['TEX_oilmen_path', 'TEX_republic_path', 'TEX_greater_path'] }),
            f('TEX_county_roundups', '县级集结', '牧场民粹', 2, 3, 6, '用县级集结组织民兵和补给。', [E.recruitAmount(1), E.recruitCost(-1)], ['TEX_rancher_path']),
            f('TEX_ranger_myth', '游骑兵神话', '牧场民粹', 2, 4, 7, '用边疆传统鼓舞士气。', [E.allT(1), E.gAtk(0.05)], ['TEX_county_roundups']),
            f('TEX_smallholder_relief', '小农救济', '牧场民粹', 2, 5, 7, '用救济稳住后方小农和牧场。', [E.moneyIncome(1), E.freeT(3)], ['TEX_ranger_myth']),
            f('TEX_popular_courts', '人民法庭', '牧场民粹', 2, 6, 8, '快速处理土地和征用纠纷。', [E.maint(-0.02), E.crisis(3)], ['TEX_smallholder_relief']),
            f('TEX_lone_star_populism', '孤星民粹', '牧场民粹', 2, 7, 9, '把边疆民粹写成德州国家理念。', [E.ppIncome(1), E.ppCap(3), E.pp(5), E.ideo('populism')], ['TEX_popular_courts']),

            // 路线 3: 共和国派 - PP cap, civic, ppIncome
            f('TEX_republic_path', '共和国路线', '共和国派', 5, 2, 6, '以临时宪法和议会制度争取广泛承认。', [E.pp(3), E.ppCap(2)], ['TEX_state_convention'], { mutuallyExclusive: ['TEX_oilmen_path', 'TEX_rancher_path', 'TEX_greater_path'] }),
            f('TEX_provisional_constitution', '临时宪法', '共和国派', 5, 3, 6, '给临时政府明确权力边界。', [E.actionCost('focus', -1), E.pp(3)], ['TEX_republic_path']),
            f('TEX_senate_of_counties', '县参议院', '共和国派', 5, 4, 7, '让各县在战时政府中保留席位。', [E.ppIncome(1), E.moneyIncome(1)], ['TEX_provisional_constitution']),
            f('TEX_civil_registry', '公民登记', '共和国派', 5, 5, 7, '建立纳税、兵役和投票登记。', [E.money(15), E.recruitCost(-1)], ['TEX_senate_of_counties']),
            f('TEX_judicial_rangers', '司法游骑兵', '共和国派', 5, 6, 8, '让游骑兵执行临时法院命令。', [E.capT(3), E.maint(-0.02)], ['TEX_civil_registry']),
            f('TEX_lone_star_republic', '孤星共和国', '共和国派', 5, 7, 9, '宣布德州不只是临时政府，而是可延续共和国。', [E.ppCap(3), E.pp(5), E.allCapT(2), E.ideo('constitutional')], ['TEX_judicial_rangers']),

            // 路线 4: 大德州 (Greater Texas) - 扩张, gAtk, capture, damage
            f('TEX_greater_path', '大德州路线', '大德州派', 8, 2, 6, '德克萨斯不该停留在自己的边境，而是向墨西哥湾、新墨西哥和大平原扩张。', [E.capT(2), E.gAtk(0.05)], ['TEX_state_convention'], { mutuallyExclusive: ['TEX_oilmen_path', 'TEX_rancher_path', 'TEX_republic_path'] }),
            f('TEX_border_legions', '边境军团', '大德州派', 8, 3, 6, '把退伍军人、牛仔和移民编成边境军团。', [E.allT(1), E.recruitAmount(1)], ['TEX_greater_path']),
            f('TEX_oil_warpath', '石油战路', '大德州派', 8, 4, 7, '把扩张的目标对准沿海与平原油田。', [E.tagT('油田', 1), E.tagInc('油田', 1)], ['TEX_border_legions']),
            f('TEX_seizure_doctrine', '缴获条令', '大德州派', 8, 5, 7, '凡占领的城镇立刻征用粮、油、马、车。', [E.capMoney(3), E.capTroop(1)], ['TEX_oil_warpath']),
            f('TEX_border_demolitions', '边境爆破队', '大德州派', 8, 6, 8, '在敌方铁路、油井设爆破队。', [E.damage(1, 3), E.crisis(3)], ['TEX_seizure_doctrine']),
            f('TEX_greater_texas', '大德克萨斯', '大德州派', 8, 7, 9, '宣布德州是所有讲英语和西班牙语的牛仔国家。', [E.gAtk(0.05), E.allCapT(3), E.tagMoney('油田', 8), E.badge('大德克萨斯'), E.ideo('expansionism')], ['TEX_border_demolitions']),

            // 共通节点
            f('TEX_archives', '达拉斯档案处', '政治路线', 3, 3, 5, '建立战时档案。', [E.maint(-0.02), E.crisis(2)], ['TEX_state_convention']),
            f('TEX_radio', '孤星广播台', '政治路线', 6, 3, 5, '统一战时叙事。', [E.pp(3), E.money(8)], ['TEX_state_convention']),
            f('TEX_state_compromise', '县际调停会', '政治路线', 4, 5, 7, '在派系之间维持最低限度合作。', [E.actionCost('focus', -1), E.pp(3)], [], { prerequisiteAny: [['TEX_oilmen_path'], ['TEX_rancher_path'], ['TEX_republic_path'], ['TEX_greater_path']] }),
            f('TEX_lone_star_mandate', '孤星授权', '政治路线', 4, 8, 11, '把所选政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.tagInc('油田', 1), E.allCapT(3)], [], { prerequisiteAny: [['TEX_petroleum_state'], ['TEX_lone_star_populism'], ['TEX_lone_star_republic'], ['TEX_greater_texas']] }),

            // 军事
            f('TEX_general_staff', '德州战争司令部', '军事路线', 11, 1, 5, '以辽阔边境、油料和机动队为基础组织战争。', [E.capT(3)], ['TEX_provisional_government']),
            f('TEX_rangers_doctrine', '游骑兵战争', '军事路线', 10, 2, 6, '依靠游骑兵和机动作战控制边境。', [E.actionCost('move', -1), E.gAtk(0.05)], ['TEX_general_staff'], { mutuallyExclusive: ['TEX_oil_army_doctrine'] }),
            f('TEX_oil_army_doctrine', '燃油军队', '军事路线', 13, 2, 6, '以充足燃油支撑卡车化部队。', [E.tagT('油田', 1), E.actionCost('move', -1)], ['TEX_general_staff'], { mutuallyExclusive: ['TEX_rangers_doctrine'] }),
            f('TEX_ranger_school', '游骑兵学校', '军事路线', 10, 3, 7, '把游骑兵训练成精锐小队。', [E.allT(1), E.recruitCost(-1)], ['TEX_rangers_doctrine']),
            f('TEX_long_patrol_command', '长程骑巡司令部', '军事路线', 10, 4, 8, '为游骑兵建立长程指挥。', [E.gAtk(0.05), E.capMoney(2)], ['TEX_ranger_school']),
            f('TEX_truck_training', '卡车化训练', '军事路线', 13, 3, 7, '把卡车化训练写进训练手册。', [E.actionCost('move', -1), E.tagT('油田', 1)], ['TEX_oil_army_doctrine']),
            f('TEX_fuel_columns', '燃油纵队', '军事路线', 13, 4, 8, '为机动部队配齐燃油。', [E.capT(4), E.gAtk(0.05)], ['TEX_truck_training']),
            f('TEX_ranger_reserve', '游骑兵预备队', '军事路线', 11, 5, 7, '保留预备队。', [E.maint(-0.02), E.freeT(3)], ['TEX_general_staff']),
            f('TEX_red_river_battle_plan', '红河战役计划', '军事路线', 11, 6, 10, '完成最适合本势力的长期内战作战方案。', [E.gAtk(0.05), E.capT(4), E.tagD('油田', 0.10)], [], { prerequisiteAny: [['TEX_long_patrol_command'], ['TEX_fuel_columns']] }),

            // 经济
            f('TEX_resource_board', '德州资源委员会', '经济路线', 16, 1, 5, '用油田、牧场和边境贸易维持现金流。', [E.money(16), E.tagInc('油田', 1)], ['TEX_provisional_government']),
            f('TEX_oil_program', '油田扩产', '经济路线', 15, 2, 6, '把休斯敦和达拉斯周边油田推向战时产量。', [E.moneyIncome(1), E.tagInc('油田', 1)], ['TEX_resource_board'], { mutuallyExclusive: ['TEX_border_trade_program'] }),
            f('TEX_border_trade_program', '边境贸易', '经济路线', 17, 2, 6, '通过边境市场获取短缺物资。', [E.money(18), E.bonds(20, 3, 3)], ['TEX_resource_board'], { mutuallyExclusive: ['TEX_oil_program'] }),
            f('TEX_oil_advance', '油税预支', '经济路线', 15, 3, 7, '以油税预支战费。', [E.bonds(30, 4, 4), E.tagMoney('油田', 6)], ['TEX_oil_program']),
            f('TEX_refinery_expansion', '炼油扩建', '经济路线', 15, 4, 8, '扩建炼油线到极限。', [E.allI(1, 3), E.capBoost(1, 1)], ['TEX_oil_advance']),
            f('TEX_border_caravans', '边境商队', '经济路线', 17, 3, 7, '组织常驻边境商队。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['TEX_border_trade_program']),
            f('TEX_border_workshops', '边城工坊', '经济路线', 17, 4, 8, '在边境城市扩建小型工坊。', [E.allI(1, 2), E.actionCost('build', -1)], ['TEX_border_caravans']),
            f('TEX_oil_rail_priority', '油料运输优先', '经济路线', 16, 5, 7, '协调油田与铁路运输节奏。', [E.maint(-0.02), E.money(10)], ['TEX_resource_board']),
            f('TEX_lone_star_war_economy', '孤星战争经济', '经济路线', 16, 6, 10, '把经济路线转化为长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 3), E.tagInc('油田', 1)], [], { prerequisiteAny: [['TEX_refinery_expansion'], ['TEX_border_workshops']] }),

            // 地区
            f('TEX_regional_office', '孤星外交局', '地区外交', 20, 1, 5, '决定向联盟国、西部军区或墨西哥边境投放资源。', [E.money(10), E.pp(3)], ['TEX_provisional_government']),
            f('TEX_aus_front', '联盟国谈判', '地区外交', 19, 2, 6, '用油料换取东部边境安全。', [E.pp(3), E.tagInc('油田', 1)], ['TEX_regional_office'], { mutuallyExclusive: ['TEX_west_front'] }),
            f('TEX_west_front', '西部纵深', '地区外交', 21, 2, 6, '向新墨西哥和丹佛方向建立缓冲。', [E.allT(1), E.crisis(3)], ['TEX_regional_office'], { mutuallyExclusive: ['TEX_aus_front'] }),
            f('TEX_red_river_negotiators', '红河谈判员', '地区外交', 19, 3, 7, '在红河沿线设常驻谈判员。', [E.tagMoney('油田', 6), E.money(10)], ['TEX_aus_front']),
            f('TEX_red_river_supply', '红河补给线', '地区外交', 19, 4, 8, '把红河变成稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['TEX_red_river_negotiators']),
            f('TEX_border_outposts', '边境哨站', '地区外交', 21, 3, 7, '在西部边境设哨站。', [E.damage(1, 2), E.allT(1)], ['TEX_west_front']),
            f('TEX_el_paso_corridor', '埃尔帕索通道', '地区外交', 21, 4, 8, '把埃尔帕索通道做成可机动走廊。', [E.actionCost('move', -1), E.gDef(0.05)], ['TEX_border_outposts']),
            f('TEX_texas_unification', '德州统一战略', '地区外交', 20, 5, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.tagInc('油田', 1)], [], { prerequisiteAny: [['TEX_red_river_supply'], ['TEX_el_paso_corridor']] })
        ]);
        return tree;
    }

    // ============================================================
    // 入口
    // ============================================================
    rebuildUsaPoliticalDepth();
    GameState.focusTrees.CSA = buildCsaTree();
    GameState.focusTrees.AUS = buildAusTree();
    GameState.focusTrees.CON = buildConTree();
    GameState.focusTrees.NEN = buildNenTree();
    GameState.focusTrees.PAC = buildPacTree();
    GameState.focusTrees.WDC = buildWdcTree();
    GameState.focusTrees.TEX = buildTexTree();
})();
