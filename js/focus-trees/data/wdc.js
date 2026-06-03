// 国策数据：WDC（西部指挥军区 / Western Command Center，控制落基山区的联邦军事力量）。
// 手工布局：每条线一种独立轮廓，坐标在此即最终位置（WDC 已从所有后处理器中排除）。
// 政治线＝4 选 1 互斥：山地军政(山峰) / 德塞雷特(摩门蜂巢) / 矿业财阀(矿井竖坑) / 边疆联邦(星辐邦联)。
// 支线：山地防务(盾形) / 矿牧经济(梯子-H) / 西部边境(菱形) / 拓荒社会(篷车小径)。终局合流落基山授权。
// 意识形态守卫：每条线子分叉的臂带各自意识形态，合流节点不带 ideo（避免覆盖玩家的领袖选择）。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.WDC = function (f, E) {
        const POL_ME = ['WDC_junta_path', 'WDC_deseret_path', 'WDC_mining_barons', 'WDC_frontier_federation'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 紧急议事会（4 线分叉柄） =====================
            f('WDC_command_post', '丹佛军区司令部', '战时统合', 13, 0, 4, '西部军区要在荒漠、山地和稀薄工业中维持一支能打的军队。', [E.pp(4), E.capT(3)]),
            f('WDC_rocky_council', '落基山紧急议事会', '政治路线', 13, 1, 5, '军区必须在军官统治、盐湖神权、矿业财阀与边疆邦联之间定型。', [E.pp(3), E.allT(1)], ['WDC_command_post']),

            // ===================== 线 A：山地军政｜形状＝山峰/金字塔 =====================
            f('WDC_junta_path', '军官委员会', '山地军政', 2, 2, 6, '维持军区本色，由军官直接处理战争与行政。', [E.capT(3), E.freeT(3)], ['WDC_rocky_council'], meOthers('WDC_junta_path')),
            f('WDC_staff_orders', '参谋命令', '山地军政', 2, 3, 6, '所有地区命令必须经过丹佛参谋部。', [E.pp(3), E.maint(-0.02)], ['WDC_junta_path']),
            f('WDC_provost_posts', '宪兵岗哨', '山地军政', 1, 4, 6, '在铁路与山口设置宪兵。', [E.maint(-0.03), E.crisis(3)], ['WDC_staff_orders']),
            f('WDC_mountain_garrisons', '山地驻防', '山地军政', 3, 4, 6, '在关键山口部署常驻守备。', [E.gDef(0.05), E.allT(1)], ['WDC_staff_orders']),
            f('WDC_frontier_provosts', '边疆宪兵', '山地军政', 0, 5, 6, '把宪兵网铺到边疆小镇。', [E.maint(-0.02), E.allT(1)], ['WDC_provost_posts']),
            f('WDC_officer_governors', '军官州督', '山地军政', 2, 5, 7, '由军官兼任关键州行政长官。', [E.actionCost('move', -1), E.allT(1)], ['WDC_staff_orders']),
            f('WDC_redoubt_line', '堡垒线', '山地军政', 4, 5, 6, '沿落基山脊构筑堡垒线。', [E.gDef(0.05), E.freeT(2)], ['WDC_mountain_garrisons']),
            f('WDC_mountain_militia', '山地民兵', '山地军政', 0, 6, 6, '组织熟悉地形的山地民兵。', [E.recruitAmount(1), E.freeT(2)], ['WDC_frontier_provosts']),
            f('WDC_supply_redoubt', '补给堡垒', '山地军政', 4, 6, 6, '把补给囤进设防的山地堡垒。', [E.maint(-0.02), E.allT(1)], ['WDC_redoubt_line']),
            // 山峰分叉：个人强人 vs 参谋技术官僚
            f('WDC_personalist_command', '个人强人', '山地军政', 1, 6, 7, '军区交给一位个人化的强人指挥官。', [E.capT(3), E.allCapT(2)], ['WDC_officer_governors'], { mutuallyExclusive: ['WDC_staff_technocracy'] }),
            f('WDC_staff_technocracy', '参谋技术官僚', '山地军政', 3, 6, 7, '由参谋与工程军官组成技术统帅。', [E.actionCost('build', -1), E.capI(1)], ['WDC_officer_governors'], { mutuallyExclusive: ['WDC_personalist_command'] }),
            f('WDC_desert_discipline', '荒漠纪律', '山地军政', 1, 7, 8, '以严格纪律维持稀薄补给线。', [E.allCapT(3), E.freeT(3)], ['WDC_personalist_command']),
            f('WDC_command_state', '司令部国家', '山地军政', 1, 8, 9, '承认军区司令部就是西部国家。', [E.gDef(0.05), E.capT(4), E.ideo('military_junta', '落基山军政府', '军政府')], ['WDC_desert_discipline']),
            f('WDC_engineer_corps', '工程兵团', '山地军政', 3, 7, 8, '工程兵团修筑道路、水站与工事。', [E.allI(1, 2), E.actionCost('build', -1)], ['WDC_staff_technocracy']),
            f('WDC_technocratic_command', '技术统帅部', '山地军政', 3, 8, 9, '由工程师与技术军官统治的统帅部。', [E.allI(1, 2), E.capBoost(1, 2), E.ideo('technocracy', '西部参谋统合区', '参谋统合区')], ['WDC_engineer_corps']),
            f('WDC_western_command_state', '西部军政', '山地军政', 2, 9, 11, '无论强人还是技术官僚，军区都凝成一套西部军政。', [E.gDef(0.05), E.capT(4), E.allCapT(2), E.badge('西部军政')], [], { prerequisiteAny: [['WDC_command_state'], ['WDC_technocratic_command']] }),

            // ===================== 线 B：德塞雷特（摩门神权）｜形状＝蜂巢 =====================
            f('WDC_deseret_path', '德塞雷特之路', '德塞雷特', 9, 2, 6, '盐湖城的圣徒把信仰共同体抬上政治舞台。', [E.ppIncome(1), E.crisis(2)], ['WDC_rocky_council'], meOthers('WDC_deseret_path')),
            f('WDC_salt_lake_assembly', '盐湖大会', '德塞雷特', 9, 3, 6, '召集教会长老与各定居点代表。', [E.pp(3), E.ppCap(2)], ['WDC_deseret_path']),
            f('WDC_colonization', '拓殖团', '德塞雷特', 7, 4, 6, '派出拓殖团在荒漠建立定居点。', [E.recruitAmount(1), E.moneyIncome(1)], ['WDC_salt_lake_assembly']),
            f('WDC_ward_network', '教区网络', '德塞雷特', 8, 4, 6, '用教区网络组织后方与互助。', [E.recruitAmount(1), E.freeT(2)], ['WDC_salt_lake_assembly']),
            f('WDC_tithing_houses', '什一税仓', '德塞雷特', 10, 4, 6, '设立什一税仓集中物资。', [E.moneyIncome(1), E.money(10)], ['WDC_salt_lake_assembly']),
            f('WDC_perpetual_fund', '永久移民基金', '德塞雷特', 11, 4, 6, '用永久移民基金吸纳信众。', [E.money(10), E.moneyIncome(1)], ['WDC_salt_lake_assembly']),
            f('WDC_quorum_twelve', '十二使徒定额组', '德塞雷特', 7, 5, 7, '由十二使徒定额组掌握最高决策。', [E.ppCap(2), E.ppIncome(1)], ['WDC_colonization']),
            f('WDC_bishops_courts', '主教法庭', '德塞雷特', 8, 5, 7, '用主教法庭维持社区秩序。', [E.maint(-0.02), E.crisis(2)], ['WDC_ward_network']),
            f('WDC_deseret_council', '德塞雷特议会', '德塞雷特', 9, 5, 7, '德塞雷特议会成为政教中枢。', [E.pp(3), E.ppCap(2)], ['WDC_ward_network']),
            f('WDC_cooperative_zion', '锡安合作社', '德塞雷特', 10, 5, 7, '以合作社组织生产与分配。', [E.moneyIncome(1), E.allI(1, 2)], ['WDC_tithing_houses']),
            f('WDC_relief_society', '妇女互助会', '德塞雷特', 11, 5, 7, '妇女互助会承担护理与后方动员。', [E.recruitAmount(1), E.freeT(2)], ['WDC_perpetual_fund']),
            // 蜂巢分叉：正统教会 vs 圣徒民兵
            f('WDC_orthodox_church', '正统教会', '德塞雷特', 8, 6, 7, '正统教会主张温和的政教合一。', [E.ppIncome(1), E.crisis(3)], ['WDC_deseret_council'], { mutuallyExclusive: ['WDC_militant_saints'] }),
            f('WDC_militant_saints', '圣徒民兵', '德塞雷特', 10, 6, 7, '激进圣徒把信众武装成纳府军团。', [E.allT(1), E.freeT(3)], ['WDC_deseret_council'], { mutuallyExclusive: ['WDC_orthodox_church'] }),
            f('WDC_deseret_schools', '教会学校', '德塞雷特', 8, 7, 8, '兴办教会学校培养顺从而能干的信众。', [E.moneyIncome(1), E.ppCap(2)], ['WDC_orthodox_church']),
            f('WDC_nauvoo_legion', '纳府军团', '德塞雷特', 10, 7, 8, '重建纳府军团作为教会的武装。', [E.allT(1), E.gAtk(0.05)], ['WDC_militant_saints']),
            f('WDC_state_of_deseret', '德塞雷特国', '德塞雷特', 9, 8, 11, '盐湖城建立政教合一的德塞雷特国。', [E.ppCap(3), E.gDef(0.05), E.allCapT(2), E.ideo('deseret', '德塞雷特神权国', '德塞雷特'), E.badge('德塞雷特国')], [], { prerequisiteAny: [['WDC_deseret_schools'], ['WDC_nauvoo_legion']] }),

            // ===================== 线 C：矿业财阀（银 vs 铜）｜形状＝矿井竖坑+巷道 =====================
            f('WDC_mining_barons', '矿业寡头', '矿业财阀', 16, 2, 6, '让科罗拉多白银与犹他铜矿的财团掌权。', [E.money(14), E.capI(1)], ['WDC_rocky_council'], meOthers('WDC_mining_barons')),
            f('WDC_ore_levies', '矿产征税', '矿业财阀', 16, 3, 6, '对每吨矿石课征战时税。', [E.money(12), E.moneyIncome(1)], ['WDC_mining_barons']),
            f('WDC_silver_camps', '白银矿营', '矿业财阀', 14, 4, 6, '把白银矿营纳入战时生产。', [E.money(10), E.tagInc('油田', 1)], ['WDC_ore_levies']),
            f('WDC_smelter_trust', '冶炼托拉斯', '矿业财阀', 16, 4, 6, '把冶炼厂并进单一托拉斯。', [E.allI(1, 2), E.capBoost(1, 1)], ['WDC_ore_levies']),
            f('WDC_copper_lodes', '铜矿脉', '矿业财阀', 18, 4, 6, '开采蒙大拿与犹他的铜矿脉。', [E.capI(1), E.money(10)], ['WDC_ore_levies']),
            f('WDC_mine_drift_a', '矿巷甲', '矿业财阀', 15, 5, 6, '掘进银矿巷道扩大产量。', [E.moneyIncome(1), E.allI(1, 2)], ['WDC_silver_camps']),
            f('WDC_deep_shaft', '深竖井', '矿业财阀', 16, 5, 6, '下掘深竖井触及富矿层。', [E.capI(1), E.money(12)], ['WDC_smelter_trust']),
            f('WDC_mine_drift_b', '矿巷乙', '矿业财阀', 17, 5, 6, '掘进铜矿巷道扩大产量。', [E.moneyIncome(1), E.capBoost(1, 1)], ['WDC_copper_lodes']),
            f('WDC_pithead_works', '井口工场', '矿业财阀', 16, 6, 6, '在井口建起选矿与修械工场。', [E.allI(1, 2), E.maint(-0.02)], ['WDC_deep_shaft']),
            // 竖坑分叉：白银民粹 vs 铜业托拉斯
            f('WDC_silver_populists', '白银民粹', '矿业财阀', 14, 6, 7, '矿工与白银派要求自由铸银与平民政治。', [E.recruitAmount(1), E.money(10)], ['WDC_mine_drift_a'], { mutuallyExclusive: ['WDC_copper_trust'] }),
            f('WDC_copper_trust', '铜业托拉斯', '矿业财阀', 18, 6, 7, '铜业财团把矿场、铁路与银行拧成托拉斯。', [E.moneyIncome(2), E.bonds(30, 4, 3)], ['WDC_mine_drift_b'], { mutuallyExclusive: ['WDC_silver_populists'] }),
            f('WDC_assay_office', '验金所', '矿业财阀', 16, 7, 6, '设立验金所统一矿产估价。', [E.money(10), E.moneyIncome(1)], ['WDC_pithead_works']),
            f('WDC_free_silver', '自由铸银', '矿业财阀', 14, 7, 8, '推行自由铸银救济矿工与小农。', [E.moneyIncome(1), E.recruitCost(-1)], ['WDC_silver_populists']),
            f('WDC_silver_commonwealth', '白银公社', '矿业财阀', 14, 8, 9, '把白银民粹写成矿工共同体的国家理念。', [E.ppIncome(1), E.money(12), E.ideo('populism', '白银民粹共和国', '白银共和国')], ['WDC_free_silver']),
            f('WDC_anaconda_trust', '阿纳康达财团', '矿业财阀', 18, 7, 8, '阿纳康达式铜业财团垄断矿政。', [E.moneyIncome(2), E.tagMoney('油田', 6)], ['WDC_copper_trust']),
            f('WDC_copper_oligarchy', '铜业寡头国', '矿业财阀', 18, 8, 9, '把军区变成铜业财团运营的寡头政体。', [E.moneyIncome(2), E.actionCost('build', -1), E.ideo('plutocracy', '铜业托拉斯国', '铜业托拉斯')], ['WDC_anaconda_trust']),
            f('WDC_mountain_mineral_state', '山地矿业国', '矿业财阀', 16, 9, 11, '无论白银还是铜业，矿产都成了军区的财政命脉。', [E.moneyIncome(2), E.allI(1, 2), E.capI(1), E.badge('山地矿业国')], [], { prerequisiteAny: [['WDC_silver_commonwealth'], ['WDC_copper_oligarchy']] }),

            // ===================== 线 D：边疆联邦（山地诸州）｜形状＝星辐邦联 =====================
            f('WDC_frontier_federation', '边疆联邦之路', '边疆联邦', 24, 2, 6, '让各州长与地方治安官分享军区统治。', [E.pp(3), E.recruitAmount(1)], ['WDC_rocky_council'], meOthers('WDC_frontier_federation')),
            f('WDC_mountain_states_pact', '山地诸州公约', '边疆联邦', 24, 3, 6, '签订山地诸州的战时公约。', [E.money(12), E.freeT(2)], ['WDC_frontier_federation']),
            f('WDC_colorado_delegation', '科罗拉多代表团', '边疆联邦', 21, 4, 6, '科罗拉多带着矿业与铁路加入。', [E.moneyIncome(1), E.allT(1)], ['WDC_mountain_states_pact']),
            f('WDC_utah_delegation', '犹他代表团', '边疆联邦', 23, 4, 6, '犹他带着教会与农业加入。', [E.moneyIncome(1), E.freeT(2)], ['WDC_mountain_states_pact']),
            f('WDC_wyoming_delegation', '怀俄明代表团', '边疆联邦', 24, 4, 6, '怀俄明带着牧场与煤矿加入。', [E.allT(1), E.freeT(2)], ['WDC_mountain_states_pact']),
            f('WDC_montana_delegation', '蒙大拿代表团', '边疆联邦', 25, 4, 6, '蒙大拿带着铜矿与牧场加入。', [E.recruitAmount(1), E.allT(1)], ['WDC_mountain_states_pact']),
            f('WDC_nevada_delegation', '内华达代表团', '边疆联邦', 27, 4, 6, '内华达带着白银与荒漠走廊加入。', [E.money(10), E.tagInc('油田', 1)], ['WDC_mountain_states_pact']),
            f('WDC_states_compact', '州权契约', '边疆联邦', 22, 5, 7, '各州签订保留自治的州权契约。', [E.maint(-0.02), E.money(12)], ['WDC_colorado_delegation']),
            f('WDC_frontier_congress', '边疆国会', '边疆联邦', 24, 5, 7, '召集边疆国会统一战时意志。', [E.ppCap(2), E.pp(3)], ['WDC_wyoming_delegation']),
            f('WDC_homestead_bloc', '拓荒集团', '边疆联邦', 26, 5, 7, '拓荒者与小农结成政治集团。', [E.recruitAmount(1), E.freeT(2)], ['WDC_montana_delegation']),
            f('WDC_federal_charter', '联邦宪章', '边疆联邦', 24, 6, 7, '起草约束中央的联邦宪章。', [E.ppCap(2), E.pp(3)], ['WDC_frontier_congress']),
            // 星辐分叉：州权邦联 vs 拓荒民主
            f('WDC_states_rights_bloc', '州权邦联派', '边疆联邦', 22, 6, 7, '主张松散的州权邦联。', [E.moneyIncome(1), E.freeT(3)], ['WDC_states_compact'], { mutuallyExclusive: ['WDC_homestead_democracy'] }),
            f('WDC_homestead_democracy', '拓荒民主派', '边疆联邦', 26, 6, 7, '主张以拓荒者为基础的边疆民主。', [E.ppCap(2), E.recruitAmount(1)], ['WDC_homestead_bloc'], { mutuallyExclusive: ['WDC_states_rights_bloc'] }),
            f('WDC_sovereign_states', '主权州联盟', '边疆联邦', 22, 7, 8, '让各州保留自己的地盘与守备。', [E.moneyIncome(1), E.allCapT(2)], ['WDC_states_rights_bloc']),
            f('WDC_mountain_confederation', '山地邦联', '边疆联邦', 22, 8, 9, '把州权自治写进山地邦联宪章。', [E.ppIncome(1), E.freeT(4), E.ideo('federalism', '西部指挥军区', '西部军区')], ['WDC_sovereign_states']),
            f('WDC_homestead_acts', '拓荒法案', '边疆联邦', 26, 7, 8, '用土地分配换取拓荒者的忠诚。', [E.recruitAmount(1), E.money(10)], ['WDC_homestead_democracy']),
            f('WDC_frontier_republic_wdc', '边疆共和国', '边疆联邦', 26, 8, 9, '把拓荒民主升格为边疆共和国。', [E.ppCap(2), E.freeT(2), E.ideo('frontier_republic', '拓荒者共和国', '拓荒共和国')], ['WDC_homestead_acts']),
            f('WDC_western_federation', '西部联邦', '边疆联邦', 24, 9, 11, '无论州权还是拓荒，山地诸州都结成西部联邦。', [E.ppIncome(1), E.allCapT(3), E.freeT(2), E.badge('西部联邦')], [], { prerequisiteAny: [['WDC_mountain_confederation'], ['WDC_frontier_republic_wdc']] }),

            // ===================== 政治终局：合流 =====================
            f('WDC_rocky_mandate', '落基山授权', '政治路线', 13, 12, 12, '把所选政治路线塑造成可长期维持的西部国家形态。', [E.ppIncome(1), E.allCapT(3), E.allT(1), E.badge('落基山授权')], [], { prerequisiteAny: [['WDC_western_command_state'], ['WDC_state_of_deseret'], ['WDC_mountain_mineral_state'], ['WDC_western_federation']] }),

            // ===================== 支线·军事：山地防务｜形状＝盾形（宽顶收束） =====================
            f('WDC_mountain_staff', '落基山总参', '山地防务', 33, 1, 5, '用少量兵力控制山口、铁路与荒漠道路。', [E.capT(3)], ['WDC_command_post']),
            f('WDC_pass_command', '山口防务', '山地防务', 30, 2, 6, '依靠地形与山口构筑弹性防线。', [E.gDef(0.05), E.maint(-0.02)], ['WDC_mountain_staff']),
            f('WDC_mountain_infantry', '山地步兵', '山地防务', 32, 2, 6, '训练适应高海拔的山地步兵。', [E.allT(1), E.tagD('油田', 0.05)], ['WDC_mountain_staff']),
            f('WDC_desert_raiders', '荒漠游击', '山地防务', 34, 2, 6, '用小股机动部队扰乱敌方补给。', [E.actionCost('move', -1), E.gAtk(0.05)], ['WDC_mountain_staff']),
            f('WDC_water_cache_corps', '水窖工兵', '山地防务', 36, 2, 6, '军事线绕着水源展开，水窖比工厂更关键。', [E.maint(-0.04), E.freeT(3)], ['WDC_mountain_staff']),
            f('WDC_garrison_militia', '守备民兵', '山地防务', 30, 3, 6, '在要点编成守备民兵。', [E.recruitAmount(1), E.freeT(2)], ['WDC_pass_command']),
            f('WDC_redoubt_doctrine', '堡垒条令', '山地防务', 31, 3, 6, '把山口要塞化写成条令。', [E.gDef(0.05), E.allT(1)], ['WDC_pass_command']),
            f('WDC_mountain_school', '山地步校', '山地防务', 33, 3, 6, '建立山地步兵学校。', [E.allT(1), E.recruitCost(-1)], ['WDC_mountain_infantry']),
            f('WDC_raider_school', '游击学校', '山地防务', 35, 3, 6, '训练荒漠游击与突击。', [E.gAtk(0.05), E.damage(1, 2)], ['WDC_desert_raiders']),
            f('WDC_engineer_sappers', '工兵爆破', '山地防务', 36, 3, 6, '工兵专破敌方铁路与水站。', [E.damage(1, 2), E.actionCost('build', -1)], ['WDC_water_cache_corps']),
            f('WDC_fortified_passes', '设防山口', '山地防务', 30, 4, 7, '把关键山口彻底要塞化。', [E.gDef(0.05), E.allCapT(2)], ['WDC_redoubt_doctrine']),
            f('WDC_ambush_doctrine', '伏击条令', '山地防务', 32, 4, 7, '把山口伏击编成成体系的条令。', [E.gAtk(0.05), E.maint(-0.02)], ['WDC_mountain_school']),
            f('WDC_long_range_command', '长程巡逻部', '山地防务', 34, 4, 7, '为荒漠袭扰建立长程指挥。', [E.gAtk(0.05), E.capMoney(2)], ['WDC_raider_school']),
            f('WDC_supply_caches', '补给窖网', '山地防务', 36, 4, 7, '在荒漠布设隐蔽补给窖网。', [E.maint(-0.04), E.freeT(3)], ['WDC_engineer_sappers']),
            f('WDC_frontier_forts', '边疆要塞', '山地防务', 30, 5, 7, '在边疆要点修筑要塞。', [E.gDef(0.05), E.freeT(2)], ['WDC_fortified_passes']),
            f('WDC_pass_artillery', '山口炮兵', '山地防务', 31, 5, 7, '在山口部署炮兵封锁通路。', [E.gDef(0.05), E.allT(1)], ['WDC_fortified_passes']),
            f('WDC_raider_columns', '游击纵队', '山地防务', 33, 5, 7, '把游击队编成长程纵队。', [E.damage(1, 2), E.allT(1)], ['WDC_ambush_doctrine']),
            f('WDC_desert_recon', '荒漠侦察', '山地防务', 35, 5, 7, '建立荒漠侦察网。', [E.recruitAmount(1), E.damage(1, 2)], ['WDC_long_range_command']),
            f('WDC_mountain_reserve', '山地预备队', '山地防务', 32, 6, 7, '保留一支山地预备队。', [E.maint(-0.02), E.freeT(3)], ['WDC_raider_columns']),
            f('WDC_mobile_reserve', '机动预备队', '山地防务', 34, 6, 7, '保留一支快速机动预备队。', [E.actionCost('move', -1), E.allT(1)], ['WDC_desert_recon']),
            f('WDC_western_battle_plan', '西部纵深计划', '山地防务', 33, 7, 10, '把守势与袭扰纳入统一的纵深作战方案。', [E.gDef(0.05), E.allCapT(2), E.allT(1)], [], { prerequisiteAny: [['WDC_pass_artillery'], ['WDC_raider_columns'], ['WDC_desert_recon']] }),
            f('WDC_army_of_the_west', '西部军团', '山地防务', 33, 8, 11, '稀薄工业逼出一套移动、节约、突袭的西部军团。', [E.actionCost('all', -1), E.allCapT(3), E.capT(3)], ['WDC_western_battle_plan']),

            // ===================== 支线·经济：矿牧经济｜形状＝梯子/H（矿∥牧+横档） =====================
            f('WDC_supply_office', '西部补给局', '矿牧经济', 42, 1, 5, '在低工业地区尽可能榨出道路、水源与矿产价值。', [E.money(14), E.tagInc('油田', 1)], ['WDC_command_post']),
            f('WDC_mines_program', '矿区征用', '矿牧经济', 40, 2, 6, '征用山地矿场支持军需。', [E.capI(1), E.capBoost(1, 1)], ['WDC_supply_office']),
            f('WDC_thrift_bonds', '节约债券', '矿牧经济', 42, 2, 6, '发行节约债券筹措战费。', [E.bonds(20, 3, 3), E.moneyIncome(1)], ['WDC_supply_office']),
            f('WDC_ranches_program', '牧场补给', '矿牧经济', 44, 2, 6, '让牧场承担粮食与运输动物。', [E.moneyIncome(1), E.freeT(2)], ['WDC_supply_office']),
            f('WDC_mine_contracts', '矿石合同', '矿牧经济', 40, 3, 6, '对铜矿与铅矿下达战时合同。', [E.money(15), E.actionCost('build', -1)], ['WDC_mines_program']),
            f('WDC_rail_water_grid', '铁路水网联调', '矿牧经济', 42, 3, 6, '把矿区与牧场用铁路水网联调（横档）。', [E.maint(-0.02), E.allI(1, 2)], ['WDC_mines_program', 'WDC_ranches_program']),
            f('WDC_ranch_quotas', '牧场配给', '矿牧经济', 44, 3, 6, '把牧场粮食配给给前线部队。', [E.tagInc('油田', 1), E.freeT(3)], ['WDC_ranches_program']),
            f('WDC_mormon_supply', '盐湖补给协定', '矿牧经济', 38, 3, 6, '盐湖城商会与教会承担仓储与分配。', [E.moneyIncome(1), E.freeT(4)], ['WDC_mines_program']),
            f('WDC_copper_wire', '铜线征集', '矿牧经济', 46, 3, 6, '矿区优先产出通信线材。', [E.capBoost(1, 2), E.actionCost('focus', -1)], ['WDC_ranches_program']),
            f('WDC_mountain_workshops', '山地工坊', '矿牧经济', 40, 4, 7, '在丹佛与盐湖城扩建小型工坊。', [E.allI(1, 2), E.capBoost(1, 1)], ['WDC_mine_contracts']),
            f('WDC_supply_treasury', '补给金库', '矿牧经济', 42, 4, 7, '建立战时补给金库与预算。', [E.moneyIncome(1), E.money(12)], ['WDC_rail_water_grid']),
            f('WDC_stock_drives', '牲畜驱赶', '矿牧经济', 44, 4, 7, '组织长途牲畜驱赶补给军队。', [E.moneyIncome(1), E.recruitCost(-1)], ['WDC_ranch_quotas']),
            f('WDC_cooperative_stores', '合作社商店', '矿牧经济', 38, 4, 7, '用合作社商店稳定后方供应。', [E.moneyIncome(1), E.money(10)], ['WDC_mormon_supply']),
            f('WDC_rail_salvage', '铁路回收', '矿牧经济', 46, 4, 7, '回收旧铁路与机车补充工业。', [E.allI(1, 2), E.maint(-0.02)], ['WDC_copper_wire']),
            f('WDC_smelters', '冶炼厂', '矿牧经济', 40, 5, 8, '扩建冶炼厂提升金属产量。', [E.allI(1, 2), E.capI(1)], ['WDC_mountain_workshops']),
            f('WDC_mine_ranch_grid', '矿牧联调', '矿牧经济', 42, 5, 7, '把矿业与牧业产能协同调度（横档）。', [E.moneyIncome(1), E.maint(-0.02)], ['WDC_mountain_workshops', 'WDC_stock_drives']),
            f('WDC_meatpacking', '肉类加工', '矿牧经济', 44, 5, 8, '在丹佛建立肉类加工与罐头厂。', [E.money(12), E.moneyIncome(1)], ['WDC_stock_drives']),
            f('WDC_mormon_granaries', '教会粮仓', '矿牧经济', 38, 5, 8, '教会粮仓储备战时口粮。', [E.moneyIncome(1), E.freeT(3)], ['WDC_cooperative_stores']),
            f('WDC_wire_arsenal', '线材兵工', '矿牧经济', 46, 5, 8, '用线材与回收金属生产军械。', [E.allI(1, 2), E.capBoost(1, 1)], ['WDC_rail_salvage']),
            f('WDC_quartermaster_west', '西部军需', '矿牧经济', 42, 6, 7, '设立西部军需总监统一调度。', [E.allI(1, 2), E.freeT(2)], ['WDC_mine_ranch_grid']),
            f('WDC_mineral_total', '矿业总产', '矿牧经济', 40, 6, 9, '把矿业产能提升到战时极限。', [E.allI(1, 2), E.capI(1)], ['WDC_smelters']),
            f('WDC_ranch_total', '牧业总产', '矿牧经济', 44, 6, 9, '把牧业供应提升到战时极限。', [E.moneyIncome(2), E.freeT(3)], ['WDC_meatpacking']),
            f('WDC_mine_boomtown', '矿业繁荣', '矿牧经济', 40, 7, 8, '让矿业城镇在战时迅速扩张。', [E.allI(1, 2), E.tagInc('油田', 1)], ['WDC_mineral_total']),
            f('WDC_thrift_economy', '西部节约经济', '矿牧经济', 42, 7, 11, '把经济线转化为可支撑长期内战的节约生产制度。', [E.moneyIncome(1), E.allI(1, 2), E.allCapT(2)], [], { prerequisiteAny: [['WDC_mineral_total'], ['WDC_ranch_total'], ['WDC_supply_treasury']] }),

            // ===================== 支线·外交：西部边境｜形状＝菱形 =====================
            f('WDC_regional_office', '西部边境政策', '西部边境', 52, 1, 5, '选择向太平洋、平原或盐湖盟友寻找机会。', [E.money(10), E.pp(3)], ['WDC_command_post']),
            f('WDC_pacific_front', '太平洋接触', '西部边境', 50, 2, 6, '与西海岸交换山口安全与贸易通道。', [E.money(12), E.tagInc('港口', 1)], ['WDC_regional_office']),
            f('WDC_mountain_neutral', '山区中立', '西部边境', 52, 2, 6, '在各方之间维持山区中立。', [E.pp(3), E.crisis(2)], ['WDC_regional_office']),
            f('WDC_plains_front', '平原缓冲', '西部边境', 54, 2, 6, '在奥马哈、堪萨斯方向建立预警纵深。', [E.allT(1), E.crisis(3)], ['WDC_regional_office']),
            f('WDC_reno_trade', '里诺贸易', '西部边境', 49, 3, 7, '把里诺变成对外贸易口岸。', [E.money(10), E.moneyIncome(1)], ['WDC_pacific_front']),
            f('WDC_pass_negotiators', '山口谈判员', '西部边境', 50, 3, 7, '与西海岸各州签订山口协议。', [E.actionCost('move', -1), E.tagInc('港口', 1)], ['WDC_pacific_front']),
            f('WDC_salt_lake_diplomacy', '盐湖斡旋', '西部边境', 52, 3, 7, '借盐湖城的中立信誉斡旋各方。', [E.pp(3), E.ppCap(2)], ['WDC_mountain_neutral']),
            f('WDC_plains_outposts', '平原哨站', '西部边境', 54, 3, 7, '在平原边缘设哨站。', [E.damage(1, 2), E.allT(1)], ['WDC_plains_front']),
            f('WDC_colorado_buffer', '科罗拉多缓冲', '西部边境', 55, 3, 7, '在科罗拉多东缘建立缓冲。', [E.allT(1), E.crisis(2)], ['WDC_plains_front']),
            f('WDC_nevada_corridor', '内华达走廊', '西部边境', 50, 4, 8, '把通往太平洋国的山口变成稳定走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['WDC_pass_negotiators']),
            f('WDC_entente_supply', '协约国补给', '西部边境', 52, 4, 8, '争取协约国经太平洋的补给。', [E.money(15), E.recruitAmount(1)], ['WDC_salt_lake_diplomacy']),
            f('WDC_eastern_line', '丹佛东线', '西部边境', 54, 4, 8, '把丹佛东线变成可机动防线。', [E.capT(2), E.gDef(0.05)], ['WDC_plains_outposts']),
            f('WDC_pacific_accord', '太平洋协定', '西部边境', 50, 5, 8, '与太平洋国达成长期防务协定。', [E.money(12), E.tagD('港口', 0.05)], ['WDC_nevada_corridor']),
            f('WDC_oil_for_passage', '以矿换通路', '西部边境', 52, 5, 9, '用矿产换取列强的通路与承认。', [E.money(12), E.pp(3)], ['WDC_entente_supply']),
            f('WDC_plains_redoubt', '平原堡垒', '西部边境', 54, 5, 8, '把平原东线收束成堡垒。', [E.gDef(0.05), E.freeT(2)], ['WDC_eastern_line']),
            f('WDC_sierra_passes', '内华达山口', '西部边境', 50, 6, 8, '把内华达山口纳入稳定走廊。', [E.gDef(0.05), E.actionCost('move', -1)], ['WDC_pacific_accord']),
            f('WDC_great_plains_watch', '大平原警戒', '西部边境', 54, 6, 8, '在大平原前沿保持长期警戒。', [E.gDef(0.05), E.freeT(2)], ['WDC_plains_redoubt']),
            f('WDC_west_survival', '西部存续战略', '西部边境', 52, 6, 10, '把边境政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.allCapT(2)], [], { prerequisiteAny: [['WDC_pacific_accord'], ['WDC_entente_supply'], ['WDC_plains_redoubt']] }),
            f('WDC_western_command_pact', '西部战略后院', '西部边境', 52, 7, 11, '把山区与边境变成军区稳固的战略后院。', [E.allCapT(2), E.gDef(0.05), E.pp(3)], ['WDC_west_survival']),

            // ===================== 支线·社会：拓荒社会｜形状＝篷车小径（之字） =====================
            f('WDC_frontier_society', '边疆社会', '拓荒社会', 61, 1, 5, '用拓荒传统、教会与矿城文化凝聚后方。', [E.pp(3), E.money(8)], ['WDC_command_post']),
            f('WDC_pioneer_churches', '拓荒教会', '拓荒社会', 61, 2, 6, '把各派教会编进战时动员。', [E.ppIncome(1), E.crisis(2)], ['WDC_frontier_society']),
            f('WDC_wagon_trains', '篷车队', '拓荒社会', 59, 3, 6, '用篷车队维系定居点之间的联系。', [E.recruitAmount(1), E.freeT(2)], ['WDC_pioneer_churches']),
            f('WDC_territorial_press', '准州报系', '拓荒社会', 61, 3, 6, '用准州报系统一战时叙事。', [E.pp(3), E.crisis(2)], ['WDC_pioneer_churches']),
            f('WDC_boomtowns', '矿业繁荣镇', '拓荒社会', 63, 3, 6, '矿业繁荣镇成为后方活力之源。', [E.moneyIncome(1), E.money(10)], ['WDC_pioneer_churches']),
            f('WDC_trail_forts', '沿途要塞', '拓荒社会', 59, 4, 6, '在拓荒小径沿途修筑要塞。', [E.gDef(0.05), E.freeT(2)], ['WDC_wagon_trains']),
            f('WDC_frontier_schools', '边疆学校', '拓荒社会', 60, 4, 6, '兴办边疆学校培养公民与技工。', [E.moneyIncome(1), E.ppCap(2)], ['WDC_wagon_trains']),
            f('WDC_saloon_press', '沙龙报系', '拓荒社会', 62, 4, 6, '用沙龙与报系掌握舆论。', [E.pp(3), E.crisis(2)], ['WDC_territorial_press']),
            f('WDC_cattle_country', '牧牛之乡', '拓荒社会', 64, 4, 6, '把牧牛文化包装成西部骄傲。', [E.recruitAmount(1), E.allT(1)], ['WDC_boomtowns']),
            f('WDC_gold_rush_towns', '淘金镇', '拓荒社会', 63, 4, 6, '淘金镇带来人口与现金。', [E.money(10), E.moneyIncome(1)], ['WDC_boomtowns']),
            f('WDC_homestead_revival', '拓荒复兴', '拓荒社会', 59, 5, 7, '用拓荒复兴动员小农与零工。', [E.crisis(3), E.freeT(2)], ['WDC_trail_forts']),
            f('WDC_pony_express', '小马快递', '拓荒社会', 61, 5, 7, '用小马快递缩短西部的消息传递。', [E.actionCost('focus', -1), E.pp(3)], ['WDC_saloon_press']),
            f('WDC_mining_camps_soc', '矿营文化', '拓荒社会', 63, 5, 7, '矿营文化凝聚矿工后方。', [E.allT(1), E.money(8)], ['WDC_gold_rush_towns']),
            f('WDC_frontier_spirit', '边疆精神', '拓荒社会', 61, 6, 8, '把边疆精神写成国家气质。', [E.ppIncome(1), E.gDef(0.05)], ['WDC_pony_express']),
            f('WDC_western_spirit', '西部精神总动员', '拓荒社会', 61, 7, 10, '把拓荒传统、信仰与矿城文化合成一场精神总动员。', [E.ppCap(3), E.gDef(0.05), E.allCapT(3), E.badge('西部精神')], [], { prerequisiteAny: [['WDC_homestead_revival'], ['WDC_frontier_spirit'], ['WDC_mining_camps_soc']] })
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
