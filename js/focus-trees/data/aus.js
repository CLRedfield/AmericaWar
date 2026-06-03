// Auto-split national focus data: AUS (American Union State / 美利坚联盟国 · Long).
// 手工布局：每条线一种独立轮廓 + 线下子分叉（KX 路线）。坐标在此即最终位置
// （AUS 已从 applyReadableFocusTreeLayouts 的通用布局中排除，且不再走
//  extendSignatureArcs / addStrategicDetours / applyPoliticalBranching /
//  rebalancePoliticalFocusEffects 的 AUS 分支——全部就地定稿）。
//
// 政治主线（互斥，四选一）：
//   朗派机器  · 喷泉/王冠    · 休伊·朗  → 子分叉 王鱼王朝 / 史密斯继位
//   社会正义  · 广播塔/教堂  · 库格林    → 子分叉 法团经济 / 神职社会正义
//   银军团    · 金字塔/漏斗  · 皮利      → 子分叉 灵魂学神秘 / 基督教邦联
//   义勇民兵  · 锋矢/长矛    · 军政强人  → 子分叉 河线纵深 / 纵深突袭
// 支线（可全做，各有形状）：
//   密西西比军务 · 河三角洲分流 ｜ 南方经济 · 梯子/H ｜ 南方外交 · 轮辐/星
// 终局：四条政治主线合流 → 巴吞鲁日新秩序。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.AUS = function (f, E) {
        const POL_ME = ['AUS_longist_path', 'AUS_social_justice_path', 'AUS_silver_legion', 'AUS_minutemen_path'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 政治大会 =====================
            f('AUS_emergency_cabinet', '巴吞鲁日紧急内阁', '战时统合', 11, 0, 4, '朗派机器、州长和民兵队长聚到同一间战争办公室。', [E.pp(4), E.capT(2)]),
            f('AUS_baton_rouge_pact', '巴吞鲁日政治协议', '政治路线', 11, 1, 5, '联盟国必须在民粹、社会正义、银军团和军政派之间定型。', [E.pp(3), E.moneyIncome(1)], ['AUS_emergency_cabinet']),

            // ===================== 线 A：朗派机器（休伊·朗）｜形状＝喷泉/王冠 ＋ 朗/史密斯子分叉 =====================
            f('AUS_longist_path', '朗派民粹路线', '朗派机器', 2, 2, 6, '以"分享财富"和个人号召稳住联盟国的群众基础。', [E.pp(3), E.ppCap(2)], ['AUS_baton_rouge_pact'], meOthers('AUS_longist_path')),
            // 喷口下的三股水柱
            f('AUS_share_wealth_clubs', '分享财富俱乐部', '朗派机器', 0, 3, 6, '让俱乐部成为动员与征募节点。', [E.recruitAmount(1), E.recruitCost(-1)], ['AUS_longist_path']),
            f('AUS_radio_firesides', '炉边广播网', '朗派机器', 2, 3, 6, '让朗的广播覆盖整个密西西比流域。', [E.pp(4), E.ppIncome(1)], ['AUS_longist_path']),
            f('AUS_county_captains', '县级队长团', '朗派机器', 4, 3, 6, '用地方队长管理粮食和兵员。', [E.moneyIncome(1), E.freeT(3)], ['AUS_longist_path']),
            // 落水：财富向下铺开
            f('AUS_minutemen_clubs', '草根民兵俱乐部', '朗派机器', 0, 4, 7, '把失业青年编进就近的义勇民兵小队。', [E.freeT(3), E.recruitAmount(1)], ['AUS_share_wealth_clubs']),
            f('AUS_peoples_budget', '人民预算', '朗派机器', 2, 4, 7, '把预算解释成对普通人的战争契约。', [E.ppCap(3), E.money(18)], ['AUS_radio_firesides']),
            f('AUS_patronage_machine', '恩庇分配机器', '朗派机器', 4, 4, 7, '用职位、合同和救济把地方牢牢绑在巴吞鲁日。', [E.moneyIncome(1), E.ppCap(2)], ['AUS_county_captains']),
            // 中央脊（民兵直线）
            f('AUS_minutemen_legion', '义勇民兵军团', '朗派机器', 2, 5, 8, '把分散的俱乐部合编成一支随叫随到的群众军团。', [E.allCapT(2), E.recruitAmount(1)], ['AUS_peoples_budget']),
            f('AUS_peoples_militia_state', '人民民兵之国', '朗派机器', 2, 6, 9, '让每个县都自带一支民兵，是朗派统治的基石。', [E.recruitAmount(1), E.freeT(4), E.allCapT(2), E.ideo('populism', '美利坚联盟国', '联盟国')], ['AUS_minutemen_legion']),
            // 子分叉：朗本人 vs 史密斯（互斥）
            f('AUS_kingfish_dynasty', '王鱼王朝', '朗派机器', 1, 5, 8, '把朗家族塑造成战时合法性的化身。', [E.ppCap(3), E.allCapT(3)], ['AUS_minutemen_clubs', 'AUS_peoples_budget'], { mutuallyExclusive: ['AUS_smith_succession'] }),
            f('AUS_smith_succession', '史密斯继位', '朗派机器', 3, 5, 8, '杰拉尔德·史密斯接掌分享财富会，把党向右拽。', [E.pp(4), E.crisis(2)], ['AUS_peoples_budget', 'AUS_patronage_machine'], { mutuallyExclusive: ['AUS_kingfish_dynasty'] }),
            // 朗臂（左）
            f('AUS_court_of_the_kingfish', '王鱼宫廷', '朗派机器', 0, 6, 8, '朗派俱乐部变成分配职位、预算和恩惠的宫廷。', [E.ppCap(3), E.money(15)], ['AUS_kingfish_dynasty']),
            f('AUS_share_our_wealth_society', '分享财富总会', '朗派机器', 1, 6, 8, '把全国的"分享财富会"并成统一的群众组织。', [E.ppIncome(1), E.recruitCost(-1)], ['AUS_kingfish_dynasty']),
            f('AUS_homestead_dividend', '宅地分红', '朗派机器', 0, 7, 8, '把战时缴获折成给小农和退伍兵的现金分红。', [E.money(20), E.freeT(3)], ['AUS_court_of_the_kingfish']),
            f('AUS_tribune_for_life', '终身护民官', '朗派机器', 1, 7, 8, '把"王鱼"塑造成不受任期限制的人民护民官。', [E.ppCap(2), E.ppIncome(1)], ['AUS_share_our_wealth_society']),
            f('AUS_kingfish_caesar', '王鱼独裁', '朗派机器', 0, 8, 9, '王鱼成为联盟国不可替代的人格化权威。', [E.ppCap(3), E.allCapT(3), E.ppIncome(1), E.ideo('national_populism', '美利坚国民联盟', '国民联盟')], ['AUS_homestead_dividend', 'AUS_tribune_for_life']),
            // 史密斯臂（右）
            f('AUS_revival_caravans', '复兴车队', '朗派机器', 3, 6, 8, '把广播车和帐篷讲台开进每个县，直送草根人群。', [E.pp(3), E.recruitAmount(1)], ['AUS_smith_succession']),
            f('AUS_rowdies_militia', '罗迪民团', '朗派机器', 4, 6, 8, '史密斯的"罗迪"狂热分子被编成一线打手。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_smith_succession']),
            f('AUS_field_preachers', '巡回布道团', '朗派机器', 3, 7, 8, '巡回牧师把战争包装成福音与净化。', [E.crisis(3), E.freeT(2)], ['AUS_revival_caravans']),
            f('AUS_minutemen_rifles', '民兵长枪队', '朗派机器', 4, 7, 8, '给罗迪民团配齐步枪，化散兵为常备力量。', [E.allT(1), E.recruitAmount(1)], ['AUS_rowdies_militia']),
            f('AUS_evangelical_war_state', '福音战争国', '朗派机器', 4, 8, 9, '史密斯把联盟国变成宗教保守的战争国家。', [E.gAtk(0.05), E.recruitAmount(1), E.crisis(3), E.ideo('clerical_populism', '美利坚福音联盟', '福音联盟')], ['AUS_field_preachers', 'AUS_minutemen_rifles']),
            // 基底汇流（线 A capstone）
            f('AUS_every_man_a_king', '人人皆王', '朗派机器', 2, 9, 10, '无论王鱼还是史密斯，南方动员都升华成全新的国家信条。', [E.ppCap(4), E.pp(6), E.ppIncome(1)], [], { prerequisiteAny: [['AUS_kingfish_caesar'], ['AUS_evangelical_war_state'], ['AUS_peoples_militia_state']] }),

            // ===================== 线 B：社会正义（库格林神父）｜形状＝广播塔/教堂尖顶 ＋ 法团/神职子分叉 =====================
            f('AUS_social_justice_path', '社会正义运动', '社会正义', 8, 2, 6, '库格林神父把天主教电台与"社会正义"带进战时内阁。', [E.pp(3), E.crisis(2)], ['AUS_baton_rouge_pact'], meOthers('AUS_social_justice_path')),
            // 塔身 + 两侧
            f('AUS_radio_league', '全国广播联盟', '社会正义', 8, 3, 6, '把分散的电台并成统一的全国广播联盟。', [E.pp(3), E.ppIncome(1)], ['AUS_social_justice_path']),
            f('AUS_corporate_guilds', '法团行会', '社会正义', 6, 3, 6, '按行业把劳资编进受国家监管的行会。', [E.moneyIncome(1), E.maint(-0.02)], ['AUS_social_justice_path']),
            f('AUS_union_party_press', '联合党报系', '社会正义', 10, 3, 6, '用《社会正义》报系主导舆论。', [E.pp(3), E.money(8)], ['AUS_social_justice_path']),
            f('AUS_guild_charter', '行会宪章', '社会正义', 6, 4, 7, '颁布行会宪章，把工资与产量写进契约。', [E.moneyIncome(1), E.freeT(2)], ['AUS_corporate_guilds']),
            f('AUS_radio_priest_hour', '神父电台时间', '社会正义', 8, 4, 7, '让全国广播变成神父的讲坛。', [E.pp(4), E.crisis(2)], ['AUS_radio_league']),
            f('AUS_social_justice_weekly', '社会正义周刊', '社会正义', 10, 4, 7, '周刊把不满情绪导向统一的政治诉求。', [E.pp(3), E.ppCap(2)], ['AUS_union_party_press']),
            // 同心波（横档，向塔身收束）
            f('AUS_corporatist_board', '法团协调局', '社会正义', 7, 5, 7, '协调局把行会产量与电台动员对齐。', [E.moneyIncome(1), E.maint(-0.02)], ['AUS_guild_charter', 'AUS_radio_priest_hour']),
            f('AUS_just_price_courts', '公平价格法庭', '社会正义', 9, 5, 7, '设立法庭裁定"公平价格"，打击投机。', [E.maint(-0.02), E.crisis(2)], ['AUS_radio_priest_hour', 'AUS_social_justice_weekly']),
            // 塔身继续（直达基底）
            f('AUS_cathedral_of_the_air', '空中大教堂', '社会正义', 8, 6, 7, '广播本身被奉为联盟国的"空中大教堂"。', [E.crisis(3), E.ppIncome(1)], ['AUS_radio_priest_hour']),
            f('AUS_national_shrine', '全国神龛', '社会正义', 8, 7, 8, '把社会正义运动升格为半官方的国家信仰。', [E.ppCap(2), E.crisis(2), E.ideo('distributism', '美利坚分配公社', '分配公社')], ['AUS_cathedral_of_the_air']),
            // 子分叉：法团经济（左）vs 神职社会正义（右）
            f('AUS_corporate_state', '法团国家', '社会正义', 6, 6, 8, '把行会体系做成正式的法团国家。', [E.moneyIncome(2), E.actionCost('build', -1)], ['AUS_corporatist_board'], { mutuallyExclusive: ['AUS_church_militant'] }),
            f('AUS_church_militant', '战斗教会', '社会正义', 10, 6, 8, '让教会成为动员与审查的战斗机器。', [E.crisis(3), E.allCapT(2)], ['AUS_just_price_courts'], { mutuallyExclusive: ['AUS_corporate_state'] }),
            // 法团臂
            f('AUS_industrial_concords', '劳资协约', '社会正义', 6, 7, 8, '用强制协约消化罢工，保住产量。', [E.allI(1, 3), E.maint(-0.02)], ['AUS_corporate_state']),
            f('AUS_workers_tithe', '工人什一税', '社会正义', 7, 7, 8, '行会以什一税供养民兵与救济。', [E.moneyIncome(1), E.freeT(3)], ['AUS_corporate_state']),
            // 神职臂
            f('AUS_radio_crusade', '电台十字军', '社会正义', 9, 7, 8, '把广播鼓动成针对敌人的道德十字军。', [E.pp(4), E.crisis(3)], ['AUS_church_militant']),
            f('AUS_christian_front', '基督教阵线', '社会正义', 10, 7, 8, '把教区青年编成"基督教阵线"民兵。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_church_militant']),
            // 臂 capstone
            f('AUS_corporate_commonwealth', '法团共同体', '社会正义', 6, 8, 9, '联盟国成为以行会运营的法团共同体。', [E.moneyIncome(2), E.allI(1, 3), E.ideo('corporatism', '美利坚法团国', '法团国')], ['AUS_industrial_concords', 'AUS_workers_tithe']),
            f('AUS_social_justice_state', '社会正义国', '社会正义', 10, 8, 9, '神职社会正义运动成为日常政府。', [E.crisis(3), E.allCapT(2), E.gAtk(0.05), E.ideo('clerical_corporatism', '社会正义联盟', '社会正义联盟')], ['AUS_radio_crusade', 'AUS_christian_front']),
            // 基底汇流（线 B capstone，塔身亦汇入）
            f('AUS_social_justice_union', '社会正义联盟', '社会正义', 8, 9, 10, '法团、教会与广播在同一面旗下结成战时联盟。', [E.moneyIncome(2), E.ppIncome(1), E.pp(5)], [], { prerequisiteAny: [['AUS_corporate_commonwealth'], ['AUS_social_justice_state'], ['AUS_national_shrine']] }),

            // ===================== 线 C：银军团（皮利）｜形状＝金字塔/漏斗（权力汇向顶点）＋ 灵魂学/邦联子分叉 =====================
            f('AUS_silver_legion', '银军团路线', '银军团', 14, 2, 6, '把皮利和神职煽动者拉进政府的极端右翼路线。', [E.capT(2), E.gAtk(0.05)], ['AUS_baton_rouge_pact'], meOthers('AUS_silver_legion')),
            // 宽底（群众基础，五柱）
            f('AUS_silver_shirts', '银衫纵队', '银军团', 11, 3, 6, '把退伍军人和右翼民兵编成银衫纵队。', [E.allT(1), E.freeT(2)], ['AUS_silver_legion']),
            f('AUS_klan_revival', '乡村打击队', '银军团', 12, 3, 6, '把银衫、退伍军官和旧打手合编成乡村打击队。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_silver_legion']),
            f('AUS_radio_priest_pulpit', '煽动者讲坛', '银军团', 14, 3, 6, '让右翼布道者占据全国广播时段。', [E.pp(4), E.crisis(2)], ['AUS_silver_legion']),
            f('AUS_purity_committees', '纯化委员会', '银军团', 16, 3, 6, '在县和教会建立审查与告密制度。', [E.maint(-0.03), E.crisis(2)], ['AUS_silver_legion']),
            f('AUS_silver_minutemen', '银衫义勇', '银军团', 17, 3, 6, '把义勇民兵中最狂热的一批吸收进银军团。', [E.allT(1), E.allCapT(2)], ['AUS_silver_legion']),
            // 收窄一层（每节点由相邻两柱汇成，梯形网格）
            f('AUS_soulcraft_circles', '灵魂学社', '银军团', 12, 4, 7, '皮利的"灵魂学"小组渗入军官团与民兵。', [E.crisis(3), E.freeT(2)], ['AUS_silver_shirts', 'AUS_klan_revival']),
            f('AUS_blood_and_soil', '血与土战线', '银军团', 14, 4, 7, '把农村民兵塑造成银军团的核心力量。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_klan_revival', 'AUS_radio_priest_pulpit']),
            f('AUS_inquisition_bureaus', '审查局', '银军团', 16, 4, 7, '审查局把不服从者从地方机器里清除。', [E.maint(-0.03), E.damage(1, 2)], ['AUS_radio_priest_pulpit', 'AUS_purity_committees']),
            f('AUS_provost_tribunals', '军事审判庭', '银军团', 17, 4, 7, '战地军事法庭就地处置破坏者与逃兵。', [E.crisis(2), E.maint(-0.02)], ['AUS_purity_committees', 'AUS_silver_minutemen']),
            // 子分叉：灵魂学神秘（左）vs 基督教邦联（右）
            f('AUS_soulcraft_doctrine', '灵魂学教义', '银军团', 13, 5, 8, '把"灵魂学"立为银军团的官方神秘学说。', [E.crisis(4), E.ppCap(2)], ['AUS_soulcraft_circles', 'AUS_blood_and_soil'], { mutuallyExclusive: ['AUS_christian_commonwealth'] }),
            f('AUS_christian_commonwealth', '基督教邦联', '银军团', 15, 5, 8, '皮利的"基督教邦联"融合法西斯、社会主义与神权。', [E.gAtk(0.05), E.allCapT(2)], ['AUS_blood_and_soil', 'AUS_inquisition_bureaus'], { mutuallyExclusive: ['AUS_soulcraft_doctrine'] }),
            // 灵魂学臂
            f('AUS_pyramid_mysteries', '金字塔秘仪', '银军团', 12, 6, 8, '金字塔神秘学被包装成国家命运的预言。', [E.crisis(3), E.ppIncome(1)], ['AUS_soulcraft_doctrine']),
            f('AUS_galahad_colleges', '加拉哈德学院', '银军团', 13, 6, 8, '仿照皮利的"加拉哈德学院"培养银军团干部。', [E.freeT(3), E.ppCap(2)], ['AUS_soulcraft_doctrine']),
            // 邦联臂
            f('AUS_silver_ranks', '银军团军阶', '银军团', 15, 6, 8, '为银衫建立等级森严的准军事军阶。', [E.allCapT(2), E.gAtk(0.05)], ['AUS_christian_commonwealth']),
            f('AUS_great_purge', '大清洗', '银军团', 16, 6, 8, '一场全国净化清除所有政治异己。', [E.damage(1, 3), E.crisis(3)], ['AUS_christian_commonwealth']),
            // 臂 capstone
            f('AUS_esoteric_order', '神秘教团', '银军团', 12, 7, 9, '银军团变成一个掌权的神秘主义教团。', [E.crisis(4), E.ppCap(3), E.ideo('esoteric_fascism', '银色教团国', '银色教团')], ['AUS_pyramid_mysteries', 'AUS_galahad_colleges']),
            f('AUS_christian_militant_state', '基督教邦联国', '银军团', 16, 7, 9, '基督教邦联成为政教合一的战争国家。', [E.gAtk(0.05), E.allCapT(3), E.damage(1, 2), E.ideo('clerical_fascism', '美利坚基督教邦联', '基督教邦联')], ['AUS_silver_ranks', 'AUS_great_purge']),
            // 顶点（线 C capstone，漏斗收束）
            f('AUS_silver_revolution', '银色革命', '银军团', 14, 8, 10, '皮利的"银色革命"把联盟国推入持续的全国净化。', [E.gAtk(0.08), E.allCapT(3), E.badge('银军团'), E.ideo('national_fascism', '银色联盟国', '银色联盟国')], [], { prerequisiteAny: [['AUS_esoteric_order'], ['AUS_christian_militant_state']] }),
            f('AUS_all_seeing_eye', '全视之眼', '银军团', 14, 9, 11, '金字塔之眼俯视全国，党、教、军合于皮利一人。', [E.ppCap(3), E.crisis(4), E.ppIncome(1)], ['AUS_silver_revolution']),

            // ===================== 线 D：义勇民兵（军政强人）｜形状＝锋矢/长矛（宽肩收成尖）＋ 河线/突袭子分叉 =====================
            f('AUS_minutemen_path', '义勇民兵路线', '义勇民兵', 20, 2, 6, '压低地方阻力，把联盟国做成一台中央集权的进攻机器。', [E.capT(3), E.recruitAmount(1)], ['AUS_baton_rouge_pact'], meOthers('AUS_minutemen_path')),
            // 矢翼（三尖）
            f('AUS_minutemen_levy', '民兵征召', '义勇民兵', 18, 3, 6, '让各县按人口和粮食产量承担征召。', [E.recruitAmount(1), E.recruitCost(-1)], ['AUS_minutemen_path']),
            f('AUS_war_governors', '战时州督', '义勇民兵', 20, 3, 6, '中央任命的州督接管关键区域。', [E.allCapT(3), E.capT(2)], ['AUS_minutemen_path']),
            f('AUS_security_ministry', '安全部', '义勇民兵', 22, 3, 6, '清理破坏者和不服从的地方队长。', [E.pp(3), E.maint(-0.02)], ['AUS_minutemen_path']),
            // 收肩（双亲汇成）
            f('AUS_emergency_levies', '紧急征召令', '义勇民兵', 19, 4, 7, '把征召写成不容拖延的战时律令。', [E.recruitAmount(1), E.freeT(2)], ['AUS_minutemen_levy', 'AUS_war_governors']),
            f('AUS_river_authority', '河运管理局', '义勇民兵', 21, 4, 7, '统一密西西比河运输优先级。', [E.actionCost('move', -1), E.tagInc('港口', 1)], ['AUS_war_governors', 'AUS_security_ministry']),
            // 中央矛杆（直线）
            f('AUS_provost_courts', '宪兵法庭', '义勇民兵', 20, 4, 7, '军令直辖的宪兵法庭压制后方动荡。', [E.maint(-0.03), E.crisis(2)], ['AUS_war_governors']),
            f('AUS_minuteman_directory', '民兵总署', '义勇民兵', 20, 5, 8, '设立总署直接调度全国义勇民兵。', [E.allCapT(2), E.recruitAmount(1)], ['AUS_provost_courts']),
            f('AUS_grand_army_of_the_union', '联盟大军', '义勇民兵', 20, 6, 8, '把民兵与正规军合编成统一的"联盟大军"。', [E.capT(3), E.gAtk(0.05)], ['AUS_minuteman_directory']),
            f('AUS_levee_en_masse', '全民动员', '义勇民兵', 20, 7, 9, '宣布全民动员，把整片流域都纳入战争机器。', [E.recruitAmount(1), E.allCapT(2), E.freeT(3), E.ideo('national_mobilization', '总动员联盟国', '总动员国')], ['AUS_grand_army_of_the_union']),
            // 子分叉：河线纵深（左）vs 纵深突袭（右）
            f('AUS_river_line_doctrine', '河线纵深条令', '义勇民兵', 19, 5, 8, '沿密西西比水道集中补给与炮兵，稳守反击。', [E.gDef(0.05), E.tagD('港口', 0.10)], ['AUS_emergency_levies'], { mutuallyExclusive: ['AUS_deep_raid_doctrine'] }),
            f('AUS_deep_raid_doctrine', '纵深突袭条令', '义勇民兵', 21, 5, 8, '用卡车、骑兵和向导执行长程纵深机动。', [E.gAtk(0.05), E.actionCost('move', -1)], ['AUS_river_authority'], { mutuallyExclusive: ['AUS_river_line_doctrine'] }),
            // 河线臂
            f('AUS_river_artillery', '河运炮兵群', '义勇民兵', 18, 6, 8, '为河防部队配齐重炮。', [E.tagT('港口', 1), E.gDef(0.05)], ['AUS_river_line_doctrine']),
            f('AUS_fortified_levees', '设防堤防', '义勇民兵', 19, 6, 8, '把堤防改造成天然防线。', [E.gDef(0.05), E.allT(1)], ['AUS_river_line_doctrine']),
            f('AUS_mississippi_wall', '密西西比壁垒', '义勇民兵', 18, 7, 9, '把整条大河变成不可逾越的防御纵深。', [E.gDef(0.05), E.tagD('港口', 0.10), E.ideo('military_junta', '密西西比军政国', '军政国')], ['AUS_river_artillery', 'AUS_fortified_levees']),
            // 突袭臂
            f('AUS_motorized_raiders', '机动突袭队', '义勇民兵', 21, 6, 8, '为机动部队建立长程袭扰指挥。', [E.gAtk(0.05), E.capT(3)], ['AUS_deep_raid_doctrine']),
            f('AUS_cavalry_columns', '骑兵纵队', '义勇民兵', 22, 6, 8, '用骑兵与卡车纵队执行纵深机动。', [E.actionCost('move', -1), E.recruitAmount(1)], ['AUS_deep_raid_doctrine']),
            f('AUS_caesarist_command', '凯撒式统帅部', '义勇民兵', 22, 7, 9, '军政强人把指挥权彻底集中于一人。', [E.gAtk(0.05), E.capT(4), E.ideo('american_caesarism', '美利坚凯撒国', '凯撒国')], ['AUS_motorized_raiders', 'AUS_cavalry_columns']),
            // 矛尖汇流
            f('AUS_national_union_state', '全国联盟国', '义勇民兵', 20, 8, 10, '把临时联盟变成真正的中央集权国家机器。', [E.gAtk(0.05), E.capT(4), E.actionCost('all', -1), E.allCapT(3)], [], { prerequisiteAny: [['AUS_mississippi_wall'], ['AUS_caesarist_command'], ['AUS_levee_en_masse']] }),
            // 矛尖（线 D capstone）
            f('AUS_total_levy_state', '总征召国家', '义勇民兵', 20, 9, 11, '每个县都必须交出粮食、卡车和一个连。', [E.recruitAmount(2), E.allCapT(4), E.actionCost('recruit', -1)], ['AUS_national_union_state']),

            // ===================== 支线·军事：密西西比军务｜形状＝河三角洲分流 =====================
            f('AUS_river_command', '密西西比河防司令部', '密西西比军务', 26, 1, 5, '围绕河流、铁路和平原纵深建设战役指挥。', [E.capT(3)], ['AUS_emergency_cabinet']),
            f('AUS_river_staff', '河防参谋部', '密西西比军务', 26, 2, 6, '把水道、堤防和铁路画进同一张作战图。', [E.allT(1), E.tagD('港口', 0.05)], ['AUS_river_command']),
            // 分流（三条支流）
            f('AUS_brownwater_flotilla', '内河炮艇队', '密西西比军务', 24, 3, 7, '把民用驳船改成可调度的内河炮艇队。', [E.tagT('港口', 1), E.tagD('港口', 0.05)], ['AUS_river_staff']),
            f('AUS_levee_engineers', '堤防工兵', '密西西比军务', 26, 3, 7, '工兵沿堤防架桥、设防、保障行军。', [E.actionCost('move', -1), E.gDef(0.05)], ['AUS_river_staff']),
            f('AUS_river_cavalry', '河谷骑兵', '密西西比军务', 28, 3, 7, '河谷骑兵执行侦察与纵深机动。', [E.gAtk(0.05), E.actionCost('move', -1)], ['AUS_river_staff']),
            // 支流加深 + 编织（相邻支流交汇）
            f('AUS_gunboat_squadrons', '炮艇支队', '密西西比军务', 24, 4, 8, '炮艇支队为登陆与河岸进攻提供火力。', [E.tagT('港口', 1), E.gAtk(0.05)], ['AUS_brownwater_flotilla']),
            f('AUS_barge_bridge', '驳船浮桥', '密西西比军务', 25, 4, 7, '驳船在任意河段架起临时浮桥。', [E.tagT('港口', 1), E.actionCost('move', -1)], ['AUS_brownwater_flotilla', 'AUS_levee_engineers']),
            f('AUS_pontoon_bridges', '浮桥纵队', '密西西比军务', 26, 4, 8, '专职浮桥纵队让大军随时渡河。', [E.actionCost('move', -1), E.allT(1)], ['AUS_levee_engineers']),
            f('AUS_river_forts', '河口要塞', '密西西比军务', 27, 4, 7, '在关键河口修筑要塞封锁水道。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['AUS_levee_engineers', 'AUS_river_cavalry']),
            f('AUS_mounted_raiders', '骑乘袭扰队', '密西西比军务', 28, 4, 8, '骑乘袭扰队专打敌方薄弱节点。', [E.gAtk(0.05), E.capT(2)], ['AUS_river_cavalry']),
            // 出海口前一层
            f('AUS_delta_arsenals', '三角洲军械库', '密西西比军务', 24, 5, 8, '在三角洲集中军械与补给。', [E.tagInc('港口', 1), E.allT(1)], ['AUS_gunboat_squadrons']),
            f('AUS_river_supply_depots', '河运补给站', '密西西比军务', 25, 5, 8, '沿河补给站让前线不再断粮。', [E.maint(-0.02), E.tagInc('港口', 1)], ['AUS_barge_bridge']),
            f('AUS_combat_engineers', '战斗工兵团', '密西西比军务', 26, 5, 8, '战斗工兵兼顾架桥、设防与爆破。', [E.gDef(0.05), E.maint(-0.02)], ['AUS_pontoon_bridges']),
            f('AUS_floating_batteries', '浮动炮台', '密西西比军务', 27, 5, 8, '浮动炮台为河口要塞提供机动火力。', [E.tagD('港口', 0.05), E.gAtk(0.05)], ['AUS_river_forts']),
            f('AUS_deep_raid_command', '纵深袭扰司令部', '密西西比军务', 28, 5, 8, '为骑乘部队建立长程袭扰指挥。', [E.capT(4), E.gAtk(0.05)], ['AUS_mounted_raiders']),
            // 出海口两翼
            f('AUS_marine_battalions', '陆战营', '密西西比军务', 24, 6, 8, '组建依托港口与登陆的陆战营。', [E.tagT('港口', 1), E.gAtk(0.05)], ['AUS_delta_arsenals']),
            f('AUS_horse_artillery', '骑炮兵', '密西西比军务', 28, 6, 8, '为机动纵队配备可快速展开的骑炮兵。', [E.gAtk(0.05), E.allT(1)], ['AUS_deep_raid_command']),
            // 出海口汇流（支线 capstone）
            f('AUS_mississippi_command', '大河统帅部', '密西西比军务', 26, 6, 10, '三条支流在出海口收束成统一的大河军务。', [E.capT(4), E.tagD('港口', 0.05), E.gAtk(0.05)], [], { prerequisiteAny: [['AUS_delta_arsenals'], ['AUS_combat_engineers'], ['AUS_deep_raid_command'], ['AUS_river_supply_depots'], ['AUS_floating_batteries']] }),
            f('AUS_river_marine_corps', '内河陆战军', '密西西比军务', 26, 7, 9, '把炮艇、工兵与陆战营合成统一的内河陆战军。', [E.tagT('港口', 1), E.capT(3)], ['AUS_mississippi_command']),

            // ===================== 支线·经济：南方经济｜形状＝梯子/H（油田轨 + 农业轨 + 横档）=====================
            f('AUS_economic_board', '南方战时经济局', '南方经济', 32, 1, 5, '把农产品、石油、河运和地方金融纳入战争预算。', [E.money(16), E.tagInc('油田', 1)], ['AUS_emergency_cabinet']),
            // 中央脊（横档串起来的主轴）
            f('AUS_resource_council', '资源调配委员会', '南方经济', 32, 2, 6, '委员会统一调配油料、粮食与现金。', [E.money(12), E.maint(-0.02)], ['AUS_economic_board']),
            // 两轨：油田（左）/ 农业（右）
            f('AUS_oil_program', '油田合同', '南方经济', 30, 2, 6, '优先控制路易斯安那与德州边缘油料。', [E.tagT('油田', 1), E.tagInc('油田', 1)], ['AUS_economic_board']),
            f('AUS_agrarian_program', '农业配给', '南方经济', 34, 2, 6, '以粮食和棉花换取现金与稳定。', [E.moneyIncome(1), E.freeT(2)], ['AUS_economic_board']),
            f('AUS_oil_advance', '油料预支', '南方经济', 30, 3, 7, '以未来油税预支战费。', [E.bonds(25, 4, 3), E.tagMoney('油田', 8)], ['AUS_oil_program']),
            f('AUS_war_finance_board', '战时财政局', '南方经济', 32, 3, 7, '把油税与粮款拧成统一的战时财政（横档）。', [E.money(18), E.moneyIncome(1)], ['AUS_oil_program', 'AUS_agrarian_program']),
            f('AUS_grain_levy', '粮食征购', '南方经济', 34, 3, 7, '把粮食征购写成战时律令。', [E.money(18), E.tagInc('港口', 1)], ['AUS_agrarian_program']),
            f('AUS_refinery_expansion', '炼油设备扩建', '南方经济', 30, 4, 8, '把炼油线扩建到极限。', [E.allI(1, 3), E.tagInc('油田', 1)], ['AUS_oil_advance']),
            f('AUS_river_rail_priority', '河谷铁路时刻表', '南方经济', 32, 4, 8, '给军列、棉花、粮食和军械设定优先级（横档）。', [E.maint(-0.02), E.money(12)], ['AUS_war_finance_board']),
            f('AUS_township_workshops', '乡镇修械厂', '南方经济', 34, 4, 8, '让乡镇承接小件军工生产。', [E.allI(1, 3), E.actionCost('build', -1)], ['AUS_grain_levy']),
            f('AUS_oilfield_cartel', '油田卡特尔', '南方经济', 30, 5, 8, '把油田并成受国家控制的卡特尔。', [E.tagMoney('油田', 8), E.moneyIncome(1)], ['AUS_refinery_expansion']),
            f('AUS_arsenal_program', '军械生产计划', '南方经济', 32, 5, 8, '把炼油与乡镇修械合成统一军械计划（横档）。', [E.allI(1, 3), E.capBoost(1, 2)], ['AUS_refinery_expansion', 'AUS_township_workshops']),
            f('AUS_cotton_exchange', '棉花交易所', '南方经济', 34, 5, 8, '以棉花票据筹措现金与外援。', [E.money(20), E.moneyIncome(1)], ['AUS_township_workshops']),
            f('AUS_war_bonds_drive', '战时债券运动', '南方经济', 30, 6, 8, '向地方发行高息战争债券。', [E.bonds(30, 5, 3), E.money(10)], ['AUS_oilfield_cartel']),
            f('AUS_homestead_act', '宅地法案', '南方经济', 34, 6, 8, '以未来土地换取小农与退伍兵的忠诚。', [E.freeT(4), E.moneyIncome(1)], ['AUS_cotton_exchange']),
            // 底部横档（支线 capstone）
            f('AUS_total_mobilization', '联盟国总动员', '南方经济', 32, 6, 10, '把经济线转化为支撑长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 3), E.allCapT(2)], [], { prerequisiteAny: [['AUS_war_bonds_drive'], ['AUS_arsenal_program'], ['AUS_homestead_act']] }),
            // 双轨延伸 + 中央脊收尾
            f('AUS_gulf_refineries', '墨西哥湾炼油带', '南方经济', 30, 7, 8, '把墨西哥湾沿岸炼油厂连成专供战争的炼油带。', [E.allI(1, 2), E.tagInc('油田', 1)], ['AUS_war_bonds_drive']),
            f('AUS_war_economy_office', '战时经济总署', '南方经济', 32, 7, 9, '总署把油、粮、棉与军械纳入一张生产总表。', [E.moneyIncome(2), E.allI(1, 3)], ['AUS_total_mobilization']),
            f('AUS_cotton_mills', '南方纺织厂群', '南方经济', 34, 7, 8, '把棉花直接加工成军需被服与现金。', [E.allI(1, 2), E.money(12)], ['AUS_homestead_act']),

            // ===================== 支线·外交：南方外交｜形状＝轮辐/星（德州 / 深南方 / 五大湖）=====================
            f('AUS_regional_office', '南方外交局', '南方外交', 38, 1, 5, '选择向德州、深南方或中西部寻找突破口。', [E.money(10), E.pp(3)], ['AUS_emergency_cabinet']),
            // 三根辐条
            f('AUS_texas_contact', '德州接触', '南方外交', 36, 2, 6, '用石油与边界安全换取德州派系合作。', [E.money(12), E.tagInc('油田', 1)], ['AUS_regional_office']),
            f('AUS_deep_south_pact', '深南方协定', '南方外交', 38, 2, 6, '与深南方种植园主与州长结盟。', [E.pp(3), E.ppCap(2)], ['AUS_regional_office']),
            f('AUS_lakes_front', '北上工团战线', '南方外交', 40, 2, 6, '把反工团宣传推向圣路易斯与芝加哥方向。', [E.pp(3), E.recruitAmount(1)], ['AUS_regional_office']),
            // 辐条加深
            f('AUS_oilfield_negotiators', '油田谈判员', '南方外交', 36, 3, 7, '派出常驻德州与墨西哥湾油田的谈判员。', [E.tagMoney('油田', 6), E.money(10)], ['AUS_texas_contact']),
            f('AUS_planter_compact', '种植园主协定', '南方外交', 38, 3, 7, '给地方精英保留战后地位换取供给。', [E.moneyIncome(1), E.freeT(2)], ['AUS_deep_south_pact']),
            f('AUS_missouri_outpost', '密苏里联络站', '南方外交', 40, 3, 7, '在密苏里-堪萨斯走廊设立联络站。', [E.damage(1, 2), E.crisis(2)], ['AUS_lakes_front']),
            // 轮缘（相邻辐条交汇）
            f('AUS_border_truce', '边境停火', '南方外交', 37, 4, 7, '与德州达成边境停火，腾出兵力。', [E.money(10), E.crisis(2)], ['AUS_oilfield_negotiators', 'AUS_planter_compact']),
            f('AUS_kansas_corridor', '堪萨斯走廊', '南方外交', 39, 4, 7, '打通堪萨斯走廊作为北上跳板。', [E.allT(1), E.damage(1, 2)], ['AUS_planter_compact', 'AUS_missouri_outpost']),
            // 辐条 capstone
            f('AUS_red_river_corridor', '红河走廊', '南方外交', 36, 4, 8, '红河沿线建立稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['AUS_oilfield_negotiators']),
            f('AUS_cotton_diplomacy', '棉花外交', '南方外交', 38, 4, 8, '用棉花与油料换取各方善意。', [E.money(15), E.moneyIncome(1)], ['AUS_planter_compact']),
            f('AUS_st_louis_front', '圣路易斯前线', '南方外交', 40, 4, 8, '把圣路易斯方向变成可用的进攻起点。', [E.allT(1), E.gAtk(0.05)], ['AUS_missouri_outpost']),
            f('AUS_gulf_alliance', '墨西哥湾同盟', '南方外交', 36, 5, 8, '与墨西哥湾沿岸势力结成资源同盟。', [E.tagInc('油田', 1), E.tagInc('港口', 1)], ['AUS_red_river_corridor']),
            f('AUS_southern_bloc', '南方集团', '南方外交', 38, 5, 8, '把深南方各州整合成稳固的政治集团。', [E.pp(4), E.ppCap(2)], ['AUS_cotton_diplomacy']),
            f('AUS_lakes_offensive', '五大湖攻势', '南方外交', 40, 5, 8, '把北上战线升级为可执行的攻势。', [E.gAtk(0.05), E.capTroop(1)], ['AUS_st_louis_front']),
            // 第四根辐条：阿巴拉契亚（向东）
            f('AUS_appalachian_contact', '阿巴拉契亚接触', '南方外交', 42, 2, 6, '与阿巴拉契亚山区的小农与矿工建立联系。', [E.pp(3), E.crisis(2)], ['AUS_regional_office']),
            f('AUS_appalachian_partisans', '山区游击队', '南方外交', 42, 3, 7, '把山民编成袭扰敌后的游击队。', [E.allT(1), E.damage(1, 2)], ['AUS_appalachian_contact']),
            f('AUS_eastern_offensive', '东进攻势', '南方外交', 42, 4, 8, '把山区据点变成向东推进的跳板。', [E.gAtk(0.05), E.capT(2)], ['AUS_appalachian_partisans']),
            f('AUS_appalachian_front', '阿巴拉契亚战线', '南方外交', 42, 5, 8, '在东部山地稳住一条可进可守的战线。', [E.gDef(0.05), E.allT(1)], ['AUS_eastern_offensive']),
            // 轮毂汇流（支线 capstone）
            f('AUS_southern_unification', '南方统一战略', '南方外交', 38, 6, 10, '把地区政策纳入最终统一战争。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['AUS_gulf_alliance'], ['AUS_southern_bloc'], ['AUS_lakes_offensive'], ['AUS_appalachian_front']] }),

            // ===================== 终局：四条政治主线合流 =====================
            f('AUS_baton_rouge_order', '巴吞鲁日新秩序', '联盟国终局', 10, 10, 12, '联盟国不再只是反对派联盟，而是一套可以统治大陆的制度。', [E.ppCap(4), E.capMoney(4), E.allCapT(3), E.badge('巴吞鲁日新秩序')], [], { prerequisiteAny: [['AUS_every_man_a_king'], ['AUS_social_justice_union'], ['AUS_silver_revolution'], ['AUS_total_levy_state']] }),
            f('AUS_continental_union', '大陆联盟国', '联盟国终局', 10, 11, 13, '巴吞鲁日的战争机器把整片大陆纳入同一套秩序。', [E.moneyIncome(2), E.allCapT(4), E.allI(1, 4)], ['AUS_baton_rouge_order']),
            f('AUS_new_american_order', '新美利坚秩序', '联盟国终局', 10, 12, 14, '联盟国终于把"分享财富"的口号写成一个新美利坚的国家形态。', [E.ppIncome(1), E.ppCap(4), E.gAtk(0.05), E.gDef(0.05), E.badge('新美利坚秩序')], ['AUS_continental_union'])
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
