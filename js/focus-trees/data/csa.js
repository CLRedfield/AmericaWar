// Auto-split national focus data: CSA (Combined Syndicates of America / 美利坚联合工团).
// 手工布局：每条线一种独立轮廓 + 线下子分叉（KX 路线）。坐标在此即最终位置
// （CSA 已从 applyReadableFocusTreeLayouts 的通用布局中排除，且不再走
//  extendSignatureArcs / addStrategicDetours / applyPoliticalBranching /
//  rebalancePoliticalFocusEffects 的 CSA 分支——全部就地定稿）。
//
// KX 联合工团：名义总书记海伍德(IWW)，实际由里德主持，内部领导权之争决定走向。
// 政治主线（互斥，四选一）：
//   里德工团  · 横向工人委员会格栅 · 工团主义  → 子分叉 海伍德正统IWW / 德里昂自由工团
//   总工团托派· 中央方尖碑+对称肋   · 集权共产  → 子分叉 白劳德人民共产 / 福斯特列宁主义
//   激进社会主义· 圆顶/拱           · 托马斯    → 子分叉 托马斯民主社会 / 贝拉米国家主义
//   卡彭机器  · 去中心蛛网          · 黑帮社会主义 → 子分叉 卡彭本人 / 科萨诺斯特拉委员会
// 支线（可全做，各有形状）：
//   美国赤军(巴特勒) · 三叉戟 ｜ 五大湖工业带 · 网格/梯子 ｜ 第三国际 · 轮辐/星
// 终局：四条政治主线合流 → 美利坚社会主义 → 委员会大陆 → 世界公社。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.CSA = function (f, E) {
        const POL_ME = ['CSA_syndicalist_path', 'CSA_totalist_path', 'CSA_radical_socialist_path', 'CSA_capone_machine'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 工团代表大会 =====================
            f('CSA_emergency_council', '芝加哥紧急代表会', '战时统合', 11, 0, 4, '让工会、民兵和城市委员会承认同一个战时中枢。', [E.pp(4), E.capT(2)]),
            f('CSA_workers_congress', '工团代表大会', '政治路线', 11, 1, 5, '召开全国工团代表大会，决定革命国家的形态。', [E.pp(3), E.ppCap(2)], ['CSA_emergency_council']),

            // ===================== 线 A：里德工团主义｜形状＝横向工人委员会格栅 ＋ 海伍德/德里昂子分叉 =====================
            f('CSA_syndicalist_path', '革命工团主义', '里德工团', 2, 2, 6, '以里德为旗帜，把全国工会拧成第三国际正统的革命工团。', [E.pp(3), E.freeT(2)], ['CSA_workers_congress'], meOthers('CSA_syndicalist_path')),
            // 三股委员会
            f('CSA_shop_stewards', '车间代表制', '里德工团', 0, 3, 6, '把车间代表纳入军工配给讨论。', [E.freeT(2), E.recruitCost(-1)], ['CSA_syndicalist_path']),
            f('CSA_dock_committees', '码头委员会', '里德工团', 2, 3, 6, '让码头工人委员会掌握港口与转运。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['CSA_syndicalist_path']),
            f('CSA_miners_federation', '矿工联合会', '里德工团', 4, 3, 6, '阿巴拉契亚矿工带枪入会。', [E.money(10), E.allT(1)], ['CSA_syndicalist_path']),
            // 格栅横档（双亲交织）
            f('CSA_workers_arbitration', '工人仲裁庭', '里德工团', 1, 4, 7, '用仲裁替代随意清洗和报复。', [E.maint(-0.03), E.pp(3)], ['CSA_shop_stewards', 'CSA_dock_committees']),
            f('CSA_red_council', '红色议会', '里德工团', 3, 4, 7, '允许各工会在战时大会中竞争席位。', [E.ppIncome(1), E.freeT(2)], ['CSA_dock_committees', 'CSA_miners_federation']),
            f('CSA_workers_militia_clubs', '工人民兵俱乐部', '里德工团', 4, 4, 7, '每个工会都自带一支随叫随到的民兵。', [E.freeT(3), E.recruitAmount(1)], ['CSA_miners_federation']),
            // 委员会总会
            f('CSA_factory_assemblies', '车间总会议', '里德工团', 0, 5, 7, '每周由工人投票直接处理冲突。', [E.recruitAmount(1), E.freeT(3)], ['CSA_workers_arbitration']),
            f('CSA_industrial_communes', '工业公社章程', '里德工团', 2, 5, 7, '把地方公社义务写入战时法。', [E.actionCost('focus', -1), E.freeT(3)], ['CSA_workers_arbitration', 'CSA_red_council']),
            f('CSA_pan_union_congress', '泛工会大会', '里德工团', 4, 5, 7, '重演 1925 泛工会大会，凝聚革命合法性。', [E.ppCap(2), E.pp(4)], ['CSA_red_council', 'CSA_workers_militia_clubs']),
            // 里德中央脊（直达基底）
            f('CSA_reed_leadership', '里德的领导', '里德工团', 2, 6, 8, '海伍德病退后，里德实际主持革命。', [E.pp(4), E.ppCap(2)], ['CSA_industrial_communes']),
            f('CSA_syndicalist_press', '工团报刊网', '里德工团', 2, 7, 8, '《群众》等报刊把革命叙事铺到全国。', [E.pp(3), E.crisis(2)], ['CSA_reed_leadership']),
            f('CSA_general_strike', '总罢工传统', '里德工团', 2, 8, 8, '总罢工成为随时可动用的政治武器，确立革命工团主义。', [E.recruitAmount(1), E.crisis(2), E.ideo('syndicalism', '美利坚联合工团', '联合工团')], ['CSA_syndicalist_press']),
            // 子分叉：海伍德正统IWW（左）vs 德里昂自由工团（右）
            f('CSA_haywood_iww', '海伍德正统IWW', '里德工团', 1, 6, 8, '老海伍德的产业工会主张去中心化的工人委员会。', [E.freeT(4), E.recruitCost(-1)], ['CSA_factory_assemblies', 'CSA_industrial_communes'], { mutuallyExclusive: ['CSA_deleon_industrial'] }),
            f('CSA_deleon_industrial', '德里昂产业工会', '里德工团', 3, 6, 8, '德里昂的遗产主张中央集权的产业工会。', [E.allI(1, 3), E.actionCost('build', -1)], ['CSA_industrial_communes', 'CSA_pan_union_congress'], { mutuallyExclusive: ['CSA_haywood_iww'] }),
            // 海伍德臂
            f('CSA_decentralized_militia', '去中心民兵网', '里德工团', 0, 7, 8, '武装直接归车间与街区，没有常备军官团。', [E.freeT(3), E.allCapT(2)], ['CSA_haywood_iww']),
            f('CSA_free_soviets', '自由苏维埃', '里德工团', 1, 7, 8, '各地自治苏维埃自下而上管理革命。', [E.ppIncome(1), E.ppCap(2)], ['CSA_haywood_iww']),
            f('CSA_iww_commonwealth', '世界产业工人共和国', '里德工团', 0, 8, 9, '把所有公社并入横跨大陆的产业工人网络。', [E.recruitCost(-1), E.freeT(5), E.ideo('anarcho_syndicalism', '世界产业工人共和国', '工人共和国')], ['CSA_decentralized_militia', 'CSA_free_soviets']),
            // 德里昂臂
            f('CSA_socialist_labor_union', '社会主义劳工联盟', '里德工团', 3, 7, 8, '以社会主义劳工党为骨架统一产业工会。', [E.allI(1, 3), E.money(12)], ['CSA_deleon_industrial']),
            f('CSA_one_big_union', '一个大工会', '里德工团', 4, 7, 8, '把所有行业并进"一个大工会"。', [E.allI(1, 3), E.capBoost(1, 2)], ['CSA_deleon_industrial']),
            f('CSA_free_syndicates', '美利坚自由工团', '里德工团', 4, 8, 9, '中央集权的产业工会成为国家形态。', [E.allI(1, 3), E.ppCap(3), E.ideo('de_leonism', '美利坚自由工团', '自由工团')], ['CSA_socialist_labor_union', 'CSA_one_big_union']),
            // 基底汇流（线 A capstone）
            f('CSA_federal_syndicate_assembly', '联邦工团大会', '里德工团', 2, 9, 10, '无论自治还是集权，工团大会都成为革命合法性的最终来源。', [E.ppCap(3), E.pp(5), E.ppIncome(1)], [], { prerequisiteAny: [['CSA_iww_commonwealth'], ['CSA_free_syndicates'], ['CSA_general_strike']] }),

            // ===================== 线 B：总工团托派｜形状＝中央方尖碑+对称肋 ＋ 白劳德/福斯特子分叉 =====================
            f('CSA_totalist_path', '总工团托派', '总工团', 8, 2, 6, '把松散工会压成一台集权的战争机器。', [E.capI(1), E.actionCost('build', -1)], ['CSA_workers_congress'], meOthers('CSA_totalist_path')),
            // 碑身 + 双肋
            f('CSA_secretariat', '总工团书记处', '总工团', 8, 3, 6, '所有重要工厂按中央会议纪要执行。', [E.money(12), E.capBoost(1, 1)], ['CSA_totalist_path']),
            f('CSA_lakes_planning', '五大湖计划局', '总工团', 6, 3, 6, '把汽车厂与钢厂统一调度。', [E.nodeI('DET', 1), E.nodeI('CLE', 1)], ['CSA_totalist_path']),
            f('CSA_vanguard_party', '先锋党组织', '总工团', 10, 3, 6, '建立纪律严明的先锋党核心。', [E.pp(3), E.maint(-0.02)], ['CSA_totalist_path']),
            f('CSA_central_committee', '中央委员会', '总工团', 8, 4, 7, '中央委员会取得对一切的最终裁决权。', [E.ppCap(2), E.pp(3)], ['CSA_secretariat']),
            // 肋横档
            f('CSA_red_rationing', '红色配给', '总工团', 6, 4, 7, '用硬指标替代地方讨价还价。', [E.allI(1, 4), E.money(10)], ['CSA_lakes_planning', 'CSA_secretariat']),
            f('CSA_political_commissars', '政治委员制', '总工团', 10, 4, 7, '前线与工厂都设常设政委。', [E.maint(-0.03), E.allCapT(2)], ['CSA_vanguard_party', 'CSA_secretariat']),
            f('CSA_steel_belt_command', '钢铁带统筹', '总工团', 6, 5, 8, '匹兹堡和密尔沃基进入计划委员会直辖。', [E.nodeI('PIT', 1), E.nodeI('MIL', 1), E.capBoost(1, 2)], ['CSA_red_rationing']),
            f('CSA_planned_economy', '计划经济总局', '总工团', 8, 5, 8, '把整个经济纳入单一计划。', [E.allI(1, 4), E.actionCost('build', -1)], ['CSA_central_committee']),
            f('CSA_cheka_security', '契卡式保卫局', '总工团', 10, 5, 8, '保卫局用恐惧维持纪律。', [E.maint(-0.03), E.crisis(2), E.damage(1, 2)], ['CSA_political_commissars']),
            // 子分叉：白劳德人民共产（左，温和）vs 福斯特列宁主义（右，硬核）
            f('CSA_browder_path', '白劳德人民共产主义', '总工团', 6, 6, 8, '白劳德用"美国价值观"赢人心，而非清洗与恐怖。', [E.ppIncome(1), E.ppCap(2), E.crisis(2)], ['CSA_steel_belt_command', 'CSA_planned_economy'], { mutuallyExclusive: ['CSA_foster_path'] }),
            f('CSA_foster_path', '福斯特列宁主义', '总工团', 10, 6, 8, '福斯特是真正的先锋队员，最接近斯大林。', [E.allCapT(2), E.gAtk(0.05), E.damage(1, 2)], ['CSA_planned_economy', 'CSA_cheka_security'], { mutuallyExclusive: ['CSA_browder_path'] }),
            // 碑身中央脊（直达基底）
            f('CSA_gosplan_america', '美国国家计委', '总工团', 8, 6, 8, '仿苏式国家计委直辖一切产业。', [E.allI(1, 3), E.capBoost(1, 2)], ['CSA_planned_economy']),
            f('CSA_five_year_plan', '五年计划', '总工团', 8, 7, 8, '把战争、生产和城市粮票写成五年表。', [E.allI(1, 4), E.money(15)], ['CSA_gosplan_america']),
            f('CSA_total_planning', '总体计划化', '总工团', 8, 8, 8, '计划委员会定义革命的下一阶段，确立中央计划体制。', [E.allI(1, 3), E.actionCost('build', -1), E.ideo('central_planning', '美利坚计划公社', '计划公社')], ['CSA_five_year_plan']),
            // 白劳德臂
            f('CSA_popular_front', '人民阵线', '总工团', 6, 7, 8, '与小资产阶级和农民结成人民阵线。', [E.pp(4), E.ppIncome(1)], ['CSA_browder_path']),
            f('CSA_americanized_communism', '美国化共产主义', '总工团', 7, 7, 8, '把共产主义包装进传统美国价值。', [E.ppCap(2), E.money(12)], ['CSA_browder_path']),
            f('CSA_popular_communist_state', '人民共产主义国', '总工团', 6, 8, 9, '白劳德式渐进社会改造成为国家路线。', [E.ppIncome(1), E.allI(1, 3), E.ideo('popular_communism', '美利坚人民共和国', '人民共和国')], ['CSA_popular_front', 'CSA_americanized_communism']),
            // 福斯特臂（拉夫斯通/伯纳姆极端）
            f('CSA_party_purges', '党内大清洗', '总工团', 10, 7, 8, '拉夫斯通式清洗肃清一切异己。', [E.maint(-0.03), E.crisis(3), E.damage(1, 2)], ['CSA_foster_path']),
            f('CSA_managerial_state', '伯纳姆管理国家', '总工团', 11, 7, 8, '伯纳姆的管理主义把革命交给技术官僚。', [E.allI(1, 3), E.allCapT(2)], ['CSA_foster_path']),
            f('CSA_leninist_vanguard', '列宁主义先锋国', '总工团', 10, 8, 9, '先锋队专政成为国家机器。', [E.gAtk(0.05), E.allCapT(3), E.actionCost('all', -1), E.ideo('totalism', '美利坚先锋共和国', '先锋共和国')], ['CSA_party_purges', 'CSA_managerial_state']),
            // 基底汇流（线 B capstone）
            f('CSA_planned_revolution', '计划化革命', '总工团', 8, 9, 10, '无论温和还是强硬，革命都被纳入单一计划。', [E.allI(1, 5), E.actionCost('all', -1), E.allCapT(2)], [], { prerequisiteAny: [['CSA_popular_communist_state'], ['CSA_leninist_vanguard'], ['CSA_total_planning']] }),

            // ===================== 线 C：激进社会主义（托马斯）｜形状＝圆顶/拱 ＋ 托马斯/贝拉米子分叉 =====================
            f('CSA_radical_socialist_path', '激进社会主义', '激进社会主义', 14, 2, 6, '托马斯领导的自治改良派，主张民主、和平地走向社会主义。', [E.pp(3), E.crisis(2)], ['CSA_workers_congress'], meOthers('CSA_radical_socialist_path')),
            // 宽厚底盘（4）
            f('CSA_autonomous_unions', '自治工会', '激进社会主义', 12, 3, 6, '保留独立于革命大会的自治工会。', [E.freeT(2), E.maint(-0.02)], ['CSA_radical_socialist_path']),
            f('CSA_ballot_socialism', '选票社会主义', '激进社会主义', 14, 3, 6, '坚持用选票而非街垒推进社会主义。', [E.pp(3), E.ppCap(2)], ['CSA_radical_socialist_path']),
            f('CSA_civil_liberties', '公民自由保障', '激进社会主义', 16, 3, 6, '革命时期仍保留有限选举与司法。', [E.ppIncome(1), E.crisis(2)], ['CSA_radical_socialist_path']),
            f('CSA_pacifist_league', '和平主义同盟', '激进社会主义', 17, 3, 6, '托马斯的反战信念组织成和平同盟。', [E.gDef(0.05), E.maint(-0.02)], ['CSA_radical_socialist_path']),
            // 收拢（3，拱形曲线）
            f('CSA_cooperative_commonwealth', '合作共同体', '激进社会主义', 13, 4, 7, '以合作社网络组织生产与分配。', [E.moneyIncome(1), E.freeT(2)], ['CSA_autonomous_unions', 'CSA_ballot_socialism']),
            f('CSA_social_insurance', '社会保险', '激进社会主义', 15, 4, 7, '推行养老、医疗与失业保险。', [E.moneyIncome(1), E.maint(-0.02)], ['CSA_ballot_socialism', 'CSA_civil_liberties']),
            f('CSA_temperance_reform', '禁酒与改良', '激进社会主义', 16, 4, 7, '把道德改良与社会立法结合。', [E.crisis(2), E.money(8)], ['CSA_civil_liberties', 'CSA_pacifist_league']),
            // 拱顶中央脊
            f('CSA_bread_and_roses', '面包与玫瑰', '激进社会主义', 14, 5, 7, '"我们要面包，也要玫瑰"成为运动口号。', [E.moneyIncome(1), E.crisis(2)], ['CSA_social_insurance']),
            f('CSA_peoples_referendum', '人民公投', '激进社会主义', 14, 6, 8, '重大决策交由人民公投。', [E.ppIncome(1), E.ppCap(2)], ['CSA_bread_and_roses']),
            f('CSA_council_of_unions', '工会理事会', '激进社会主义', 14, 7, 9, '由各工会理事会自下而上共同执政。', [E.pp(4), E.ppIncome(1), E.ideo('council_socialism', '美利坚议会公社', '议会公社')], ['CSA_peoples_referendum']),
            // 子分叉：托马斯民主社会（左）vs 贝拉米国家主义（右）
            f('CSA_thomas_democratic', '托马斯民主社会主义', '激进社会主义', 13, 5, 8, '托马斯坚持民主社会主义与公民自由。', [E.ppIncome(1), E.ppCap(2)], ['CSA_cooperative_commonwealth', 'CSA_social_insurance'], { mutuallyExclusive: ['CSA_bellamy_nationalism'] }),
            f('CSA_bellamy_nationalism', '贝拉米国家主义', '激进社会主义', 16, 5, 8, '贝拉米式乌托邦把社会组织成有序的"产业军队"。', [E.moneyIncome(1), E.allI(1, 2)], ['CSA_social_insurance', 'CSA_temperance_reform'], { mutuallyExclusive: ['CSA_thomas_democratic'] }),
            // 托马斯臂
            f('CSA_workers_education', '工人教育运动', '激进社会主义', 12, 6, 8, '用教育与文化提升工人觉悟。', [E.ppIncome(1), E.crisis(2)], ['CSA_thomas_democratic']),
            f('CSA_democratic_planning', '民主计划', '激进社会主义', 13, 6, 8, '把计划经济置于民主监督之下。', [E.moneyIncome(1), E.allI(1, 2)], ['CSA_thomas_democratic']),
            f('CSA_social_democracy', '社会民主国', '激进社会主义', 12, 7, 9, '建立民主、和平、福利完善的社会主义国家。', [E.ppIncome(1), E.ppCap(3), E.ideo('radical_socialism', '美利坚社会民主联邦', '社会民主联邦')], ['CSA_workers_education', 'CSA_democratic_planning']),
            // 贝拉米臂
            f('CSA_nationalist_clubs', '贝拉米俱乐部', '激进社会主义', 16, 6, 8, '遍布全国的"民族主义俱乐部"组织群众。', [E.moneyIncome(1), E.freeT(2)], ['CSA_bellamy_nationalism']),
            f('CSA_industrial_army', '产业军队', '激进社会主义', 17, 6, 8, '把劳动力编成有序的"产业军队"。', [E.allI(1, 2), E.recruitAmount(1)], ['CSA_bellamy_nationalism']),
            f('CSA_bellamyist_union', '人民民族联盟', '激进社会主义', 17, 7, 9, '贝拉米式乌托邦民族联盟成为国家形态。', [E.allI(1, 3), E.allCapT(2), E.ideo('bellamyism', '人民民族联盟', '民族联盟')], ['CSA_nationalist_clubs', 'CSA_industrial_army']),
            // 拱顶汇流（线 C capstone）
            f('CSA_radical_commonwealth', '激进社会主义共和国', '激进社会主义', 14, 8, 10, '无论民主社会主义还是贝拉米乌托邦，都建成温和的革命共和国。', [E.ppIncome(1), E.moneyIncome(1), E.pp(5)], [], { prerequisiteAny: [['CSA_social_democracy'], ['CSA_bellamyist_union'], ['CSA_council_of_unions']] }),

            // ===================== 线 D：卡彭机器｜形状＝去中心蛛网（大量交叉）＋ 卡彭/科萨诺斯特拉子分叉 =====================
            f('CSA_capone_machine', '卡彭机器', '卡彭机器', 20, 2, 6, '把芝加哥地下行会拉进革命联盟，承认现实。', [E.money(15), E.capT(1)], ['CSA_workers_congress'], meOthers('CSA_capone_machine')),
            // 蛛网三结点
            f('CSA_underground_unions', '地下工会', '卡彭机器', 18, 3, 6, '让地下网络承担征兵和情报。', [E.recruitCost(-2), E.recruitAmount(1)], ['CSA_capone_machine']),
            f('CSA_speakeasy_network', '私酒网络', '卡彭机器', 20, 3, 6, '私酒与赌场提供稳定现金流。', [E.moneyIncome(2), E.bonds(20, 3, 3)], ['CSA_capone_machine']),
            f('CSA_protection_rackets', '保护费体系', '卡彭机器', 22, 3, 6, '把街区保护费做成稳定财源。', [E.capMoney(2), E.moneyIncome(1)], ['CSA_capone_machine']),
            // 蛛网交织（双亲交叉）
            f('CSA_black_market_economy', '黑市经济', '卡彭机器', 18, 4, 7, '用走私、私酒和保护费补充财政。', [E.bonds(25, 4, 3), E.money(12)], ['CSA_underground_unions', 'CSA_speakeasy_network']),
            f('CSA_street_payroll', '街道工资', '卡彭机器', 20, 4, 7, '工资以现金兑付，绕过财政审计。', [E.moneyIncome(2), E.maint(-0.02)], ['CSA_speakeasy_network']),
            f('CSA_smuggling_rings', '走私网', '卡彭机器', 22, 4, 7, '码头走私网把物资运到任何需要的地方。', [E.capMoney(3), E.tagT('港口', 1)], ['CSA_speakeasy_network', 'CSA_protection_rackets']),
            f('CSA_speakeasy_arsenal', '私酒兵工厂', '卡彭机器', 18, 5, 8, '把私酒厂改造成弹药与小型武器作坊。', [E.capMoney(3), E.damage(1, 2)], ['CSA_black_market_economy']),
            f('CSA_numbers_racket', '数字博彩', '卡彭机器', 20, 5, 8, '地下博彩成为隐形的战争税。', [E.moneyIncome(2), E.money(15)], ['CSA_black_market_economy', 'CSA_smuggling_rings']),
            f('CSA_dockside_outfit', '码头帮会', '卡彭机器', 22, 5, 8, '码头帮会控制港口装卸与走私。', [E.tagT('港口', 1), E.capMoney(2)], ['CSA_smuggling_rings']),
            // 卡彭中央脊
            f('CSA_chicago_outfit_core', '芝加哥帮会核心', '卡彭机器', 20, 6, 8, '卡彭的"帮会"成为革命国家的现实权力核心。', [E.moneyIncome(2), E.capT(2)], ['CSA_numbers_racket']),
            f('CSA_gun_runners', '军火走私', '卡彭机器', 20, 7, 8, '军火走私把武器源源不断送上前线。', [E.damage(1, 2), E.recruitCost(-1)], ['CSA_chicago_outfit_core']),
            f('CSA_grey_ministries', '灰色部委', '卡彭机器', 20, 8, 8, '帮会变成革命国家的"灰色部委"，黑帮工团主义成型。', [E.moneyIncome(2), E.capMoney(3), E.ideo('gangster_syndicalism', '芝加哥辛迪加', '辛迪加')], ['CSA_gun_runners']),
            // 子分叉：卡彭本人（左，享乐财阀）vs 科萨诺斯特拉委员会（右，高压清洗）
            f('CSA_capone_himself', '卡彭独裁', '卡彭机器', 18, 6, 8, '卡彭本人把革命国家当成自家生意。', [E.moneyIncome(2), E.capMoney(3)], ['CSA_speakeasy_arsenal', 'CSA_numbers_racket'], { mutuallyExclusive: ['CSA_cosa_nostra_council'] }),
            f('CSA_cosa_nostra_council', '科萨诺斯特拉委员会', '卡彭机器', 22, 6, 8, '卡彭死后由黑帮委员会接管，走向毛式高压专政。', [E.maint(-0.03), E.crisis(3), E.damage(1, 2)], ['CSA_numbers_racket', 'CSA_dockside_outfit'], { mutuallyExclusive: ['CSA_capone_himself'] }),
            // 卡彭臂
            f('CSA_gilded_revolution', '镀金革命', '卡彭机器', 18, 7, 8, '革命领袖过上奢靡生活，照样维持统治。', [E.moneyIncome(2), E.money(20)], ['CSA_capone_himself']),
            f('CSA_outfit_economy', '帮会经济', '卡彭机器', 19, 7, 8, '整个经济围绕帮会现金流运转。', [E.bonds(30, 5, 3), E.capMoney(3)], ['CSA_capone_himself']),
            f('CSA_caponist_state', '卡彭社会主义国', '卡彭机器', 18, 8, 9, '黑帮社会主义成为一种独特的国家形态。', [E.moneyIncome(2), E.capMoney(4), E.gAtk(0.05), E.ideo('caponeism', '卡彭辛迪加国', '卡彭辛迪加')], ['CSA_gilded_revolution', 'CSA_outfit_economy']),
            // 科萨诺斯特拉臂
            f('CSA_great_terror', '黑帮大清洗', '卡彭机器', 22, 7, 8, '委员会以恐怖肃清一切威胁。', [E.crisis(3), E.damage(1, 3), E.maint(-0.03)], ['CSA_cosa_nostra_council']),
            f('CSA_iron_discipline', '铁的纪律', '卡彭机器', 23, 7, 8, '帮规变成军纪，违令者死。', [E.allCapT(2), E.gAtk(0.05)], ['CSA_cosa_nostra_council']),
            f('CSA_syndicate_dictatorship', '辛迪加专政', '卡彭机器', 22, 8, 9, '黑帮委员会建立高度集权的专政。', [E.gAtk(0.05), E.allCapT(3), E.damage(1, 2), E.ideo('mafia_state', '科萨诺斯特拉国', '黑帮辛迪加')], ['CSA_great_terror', 'CSA_iron_discipline']),
            // 基底汇流（线 D capstone）
            f('CSA_outfit_national_union', '地下组织全国化', '卡彭机器', 20, 9, 10, '卡彭机器把走私、码头和现金工资铺到所有城市。', [E.moneyIncome(2), E.capMoney(4), E.capTroop(1), E.badge('黑道委员会')], [], { prerequisiteAny: [['CSA_caponist_state'], ['CSA_syndicate_dictatorship'], ['CSA_grey_ministries']] }),

            // ===================== 支线·军事：美国赤军（巴特勒）｜形状＝三叉戟（民兵/机械化/陆战）=====================
            f('CSA_general_staff', '赤军总参谋部', '美国赤军', 27, 1, 5, '以湖区工业和铁路枢纽重建革命军指挥。', [E.capT(3)], ['CSA_emergency_council']),
            f('CSA_butler_command', '巴特勒统帅部', '美国赤军', 27, 2, 6, '最能打的巴特勒将军出任赤军元帅。', [E.allT(1), E.gAtk(0.05)], ['CSA_general_staff']),
            // 三叉
            f('CSA_militia_doctrine', '民兵海洋', '美国赤军', 25, 3, 7, '用城市民兵和工厂卫队填满前线。', [E.recruitAmount(1), E.freeT(2)], ['CSA_butler_command']),
            f('CSA_mechanized_doctrine', '机械化突击', '美国赤军', 27, 3, 7, '汽车厂与钢厂转向装甲和机动战。', [E.nodeI('DET', 1), E.gAtk(0.05)], ['CSA_butler_command']),
            f('CSA_red_marines', '红色陆战队', '美国赤军', 29, 3, 7, '围绕五大湖与河海建立红色陆战队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['CSA_butler_command']),
            // 横档（相邻兵种协同）
            f('CSA_political_education', '部队政治教育', '美国赤军', 26, 4, 8, '政委把民兵与装甲兵拧成有信念的队伍。', [E.maint(-0.02), E.allCapT(2)], ['CSA_militia_doctrine', 'CSA_mechanized_doctrine']),
            f('CSA_combined_arms', '诸兵种协同', '美国赤军', 28, 4, 8, '让装甲与陆战协同突击。', [E.gAtk(0.05), E.actionCost('move', -1)], ['CSA_mechanized_doctrine', 'CSA_red_marines']),
            // 三叉加深
            f('CSA_militia_training', '民兵教导营', '美国赤军', 25, 4, 8, '把民兵训成可上前线的步兵纵队。', [E.allT(1), E.recruitCost(-1)], ['CSA_militia_doctrine']),
            f('CSA_rapid_columns', '快速纵队司令部', '美国赤军', 27, 5, 8, '为装甲纵队配套高优先军列。', [E.gAtk(0.05), E.actionCost('move', -1)], ['CSA_mechanized_doctrine']),
            f('CSA_amphibious_assault', '两栖突击', '美国赤军', 29, 4, 8, '把陆战队训练成可登陆部队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['CSA_red_marines']),
            f('CSA_workers_army', '工人军团', '美国赤军', 25, 5, 8, '把工厂赤卫队合编成正规工人军团。', [E.allCapT(2), E.freeT(3)], ['CSA_militia_training']),
            f('CSA_armored_corps', '装甲军', '美国赤军', 27, 6, 8, '底特律工人组成赤军装甲军。', [E.nodeI('DET', 1), E.capT(3)], ['CSA_rapid_columns']),
            f('CSA_marine_command', '陆战司令部', '美国赤军', 29, 5, 8, '把陆战队纳入统一登陆指挥。', [E.tagT('港口', 1), E.allT(1)], ['CSA_amphibious_assault']),
            // 戟柄汇流（支线 capstone）
            f('CSA_american_red_army', '美国赤军', '美国赤军', 27, 7, 10, '巴特勒把三支劲旅合编成统一的美国赤军。', [E.gAtk(0.05), E.allCapT(3), E.capT(4), E.ideo('military_junta')], [], { prerequisiteAny: [['CSA_workers_army'], ['CSA_armored_corps'], ['CSA_marine_command']] }),
            f('CSA_partisan_command', '游击司令部', '美国赤军', 25, 6, 8, '工人军团抽出精锐编成敌后游击队。', [E.damage(1, 2), E.actionCost('move', -1)], ['CSA_workers_army']),
            f('CSA_red_air_corps', '红色航空队', '美国赤军', 29, 6, 8, '把民用机队改成赤军航空队，支援登陆。', [E.tagT('港口', 1), E.gAtk(0.05)], ['CSA_marine_command']),
            f('CSA_red_officer_schools', '红军军官学校', '美国赤军', 27, 8, 9, '赤卫队不再只是民兵，而是革命军官阶层。', [E.gAtk(0.05), E.allCapT(2)], ['CSA_american_red_army']),
            f('CSA_red_fleet', '红色湖区舰队', '美国赤军', 29, 7, 9, '把五大湖航运改造成红色舰队。', [E.tagT('港口', 1), E.tagD('港口', 0.05)], ['CSA_red_air_corps']),

            // ===================== 支线·经济：五大湖工业带｜形状＝网格/梯子（城市轨 + 横档）=====================
            f('CSA_economic_board', '工团经济委员会', '五大湖工业', 33, 1, 5, '把钢铁、汽车、粮食和湖运压入一张计划表。', [E.money(16), E.capI(1)], ['CSA_emergency_council']),
            // 双轨：钢铁（左）/ 汽车（右），中央脊 = 计划
            f('CSA_steel_program', '钢铁优先', '五大湖工业', 31, 2, 6, '优先保障匹兹堡、克利夫兰的军工链。', [E.nodeI('PIT', 1), E.allI(1, 2)], ['CSA_economic_board']),
            f('CSA_lakes_logistics', '湖运调度', '五大湖工业', 33, 2, 6, '把湖运现金流与铁路时刻表统一。', [E.maint(-0.02), E.money(12)], ['CSA_economic_board']),
            f('CSA_auto_program', '汽车工业', '五大湖工业', 35, 2, 6, '把底特律汽车产能转向军工。', [E.nodeI('DET', 1), E.allI(1, 2)], ['CSA_economic_board']),
            f('CSA_steel_quotas', '钢厂定额', '五大湖工业', 31, 3, 7, '把钢厂、铸造厂全部纳入计划。', [E.nodeI('PIT', 1), E.nodeI('CLE', 1)], ['CSA_steel_program']),
            f('CSA_war_production_board', '战时生产委员会', '五大湖工业', 33, 3, 7, '把钢铁与汽车并入统一生产委员会（横档）。', [E.allI(1, 3), E.capBoost(1, 2)], ['CSA_steel_program', 'CSA_auto_program']),
            f('CSA_assembly_lines', '流水装配线', '五大湖工业', 35, 3, 7, '把流水线推广到所有军工厂。', [E.nodeI('DET', 1), E.actionCost('build', -1)], ['CSA_auto_program']),
            f('CSA_arsenal_expansion', '湖区兵工扩建', '五大湖工业', 31, 4, 8, '扩建最有价值的湖区军工产能。', [E.allI(1, 3), E.actionCost('build', -1)], ['CSA_steel_quotas']),
            f('CSA_rail_priority', '湖区军运优先', '五大湖工业', 33, 4, 8, '给军列、煤炭、粮食设置优先级（脊）。', [E.maint(-0.02), E.money(12)], ['CSA_war_production_board']),
            f('CSA_tank_factories', '坦克工厂', '五大湖工业', 35, 4, 8, '底特律与密尔沃基转产坦克。', [E.nodeI('DET', 1), E.nodeI('MIL', 1)], ['CSA_assembly_lines']),
            f('CSA_coal_steel_pool', '煤钢联营', '五大湖工业', 31, 5, 8, '把煤矿与钢厂并成联营体。', [E.nodeI('CLE', 1), E.moneyIncome(1)], ['CSA_arsenal_expansion']),
            f('CSA_central_arsenal', '中央军械总厂', '五大湖工业', 33, 5, 8, '把兵工扩建与坦克厂并成中央军械（横档）。', [E.allI(1, 3), E.capBoost(1, 2)], ['CSA_arsenal_expansion', 'CSA_tank_factories']),
            f('CSA_motor_pool', '机动车辆池', '五大湖工业', 35, 5, 8, '统一调度全国卡车与机动车辆。', [E.nodeI('DET', 1), E.actionCost('move', -1)], ['CSA_tank_factories']),
            // 底部横档（支线 capstone）
            f('CSA_total_syndicate_mobilization', '总工团动员', '五大湖工业', 33, 6, 10, '把经济线转化为支撑长期内战的生产制度。', [E.moneyIncome(2), E.ppIncome(1), E.allI(1, 4)], [], { prerequisiteAny: [['CSA_coal_steel_pool'], ['CSA_central_arsenal'], ['CSA_motor_pool']] }),
            f('CSA_great_lakes_convoys', '五大湖运输队', '五大湖工业', 31, 6, 8, '湖运工会承担煤炭、粮食和武器的闭环调度。', [E.maint(-0.03), E.tagInc('港口', 1)], ['CSA_coal_steel_pool']),
            f('CSA_cooperative_workshops', '合作社工坊', '五大湖工业', 35, 6, 8, '让合作社承担更多战时小件生产。', [E.allI(1, 3), E.freeT(2)], ['CSA_motor_pool']),
            f('CSA_electrification', '全面电气化', '五大湖工业', 33, 7, 9, '"社会主义＝苏维埃＋电气化"，把电网铺满工业带。', [E.allI(1, 3), E.capBoost(1, 2)], ['CSA_total_syndicate_mobilization']),
            f('CSA_atomic_project', '曼哈顿工团分部', '五大湖工业', 33, 8, 10, '把革命工业投入秘密的原子能研究。', [E.allI(1, 3), E.capBoost(1, 3)], ['CSA_electrification']),

            // ===================== 支线·外交：第三国际/世界革命｜形状＝轮辐/星 =====================
            f('CSA_regional_office', '革命输出局', '第三国际', 39, 1, 5, '决定革命先向平原、东部城市还是国际方向扩张。', [E.money(10), E.pp(3)], ['CSA_emergency_council']),
            // 三根辐条
            f('CSA_plains_front', '平原煽动', '第三国际', 37, 2, 6, '向爱荷华、密苏里和堪萨斯工人派出组织员。', [E.pp(3), E.recruitAmount(1)], ['CSA_regional_office']),
            f('CSA_atlantic_front', '东部城市战线', '第三国际', 39, 2, 6, '争取匹兹堡、纽约和费城的工人网络。', [E.money(12), E.tagT('港口', 1)], ['CSA_regional_office']),
            f('CSA_internationale_aid', '第三国际援助', '第三国际', 41, 2, 6, '向法兰西公社与不列颠联盟求援。', [E.money(15), E.recruitAmount(1)], ['CSA_regional_office']),
            // 辐条加深
            f('CSA_rail_organizers', '铁路组织员', '第三国际', 37, 3, 7, '把铁路工人变成跨州组织节点。', [E.tagT('港口', 1), E.capMoney(2)], ['CSA_plains_front']),
            f('CSA_secret_city_cells', '城市秘密小组', '第三国际', 39, 3, 7, '在敌方城市建立潜伏小组。', [E.damage(1, 2), E.crisis(2)], ['CSA_atlantic_front']),
            f('CSA_french_brigades', '法兰西志愿旅', '第三国际', 41, 3, 7, '第三国际派来志愿旅与顾问。', [E.allT(1), E.gAtk(0.05)], ['CSA_internationale_aid']),
            // 轮缘（相邻辐条交汇）
            f('CSA_agitprop_trains', '鼓动宣传列车', '第三国际', 38, 4, 7, '宣传列车把革命口号开进每个车站。', [E.crisis(2), E.pp(3)], ['CSA_rail_organizers', 'CSA_secret_city_cells']),
            f('CSA_dockworker_intl', '码头工人国际', '第三国际', 40, 4, 7, '码头工人国际封锁敌港、接应援助。', [E.tagT('港口', 1), E.money(10)], ['CSA_secret_city_cells', 'CSA_french_brigades']),
            // 辐条末端
            f('CSA_mississippi_corridor', '密西西比走廊', '第三国际', 37, 4, 8, '沿密西西比中游建立稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['CSA_rail_organizers']),
            f('CSA_pennsylvania_corridor', '宾州交通线', '第三国际', 39, 4, 8, '在东部建立防御和渗透节点。', [E.allT(1), E.moneyIncome(1)], ['CSA_secret_city_cells']),
            f('CSA_red_aid_shipments', '红色援助船运', '第三国际', 41, 4, 8, '第三国际的物资经海路源源送来。', [E.money(15), E.tagT('港口', 1)], ['CSA_french_brigades']),
            f('CSA_prairie_soviets', '草原苏维埃', '第三国际', 37, 5, 8, '在大平原建立农业苏维埃。', [E.recruitAmount(1), E.capTroop(1)], ['CSA_mississippi_corridor']),
            f('CSA_eastern_uprising', '东部起义', '第三国际', 39, 5, 8, '在东部城市策动同步起义。', [E.damage(1, 2), E.gAtk(0.05)], ['CSA_pennsylvania_corridor']),
            f('CSA_internationale_pact', '第三国际公约', '第三国际', 41, 5, 8, '正式加入第三国际共同防御。', [E.money(15), E.recruitAmount(1)], ['CSA_red_aid_shipments']),
            // 轮毂汇流（支线 capstone）
            f('CSA_world_revolution', '世界革命战略', '第三国际', 39, 6, 10, '把地区政策与国际援助纳入最终统一战争。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['CSA_prairie_soviets'], ['CSA_eastern_uprising'], ['CSA_internationale_pact']] }),
            f('CSA_comintern_congress', '第三国际大会', '第三国际', 39, 7, 9, '在芝加哥召开新的第三国际大会。', [E.ppIncome(1), E.pp(5)], ['CSA_world_revolution']),
            f('CSA_red_dawn', '红色黎明', '第三国际', 39, 8, 9, '把革命浪潮推过国境，点燃整个大陆。', [E.crisis(3), E.recruitAmount(1)], ['CSA_comintern_congress']),

            // ===================== 终局：四条政治主线合流 =====================
            f('CSA_socialist_america', '美利坚社会主义', '工团终局', 11, 10, 12, '把所选择的革命路线塑造成可长期统治的国家。', [E.ppIncome(1), E.allI(1, 3), E.allCapT(3)], [], { prerequisiteAny: [['CSA_federal_syndicate_assembly'], ['CSA_planned_revolution'], ['CSA_radical_commonwealth'], ['CSA_outfit_national_union']] }),
            f('CSA_continent_of_councils', '委员会大陆', '工团终局', 11, 11, 13, '无论由工会、计划局、议会还是帮会执行，旧美国都将被委员会替代。', [E.actionCost('all', -1), E.ppIncome(1), E.allCapT(3), E.badge('委员会大陆')], ['CSA_socialist_america']),
            f('CSA_world_commune', '世界公社', '工团终局', 11, 12, 14, '美利坚革命成为席卷大陆、连通第三国际的世界公社。', [E.moneyIncome(2), E.allI(1, 4), E.gAtk(0.05), E.badge('世界公社')], ['CSA_continent_of_councils'])
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
