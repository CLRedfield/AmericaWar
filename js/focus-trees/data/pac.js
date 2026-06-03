// Auto-split national focus data: PAC (Pacific States of America / 太平洋国).
// 手工布局：每条线一种独立轮廓 + 线下子分叉（KX 路线）。坐标在此即最终位置
// （PAC 已从 applyReadableFocusTreeLayouts 的通用布局中排除）。
// 政治主线（互斥，五选一）：进步联邦 / 休斯财团 / 好莱坞 / 太平洋帝国 / 神秘主义
// 支线（可全做）：太平洋卫队 / 太平洋经济 / 外援后盾。终局合流。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.PAC = function (f, E) {
        const POL_ME = ['PAC_progressive_path', 'PAC_technocrat_path', 'PAC_hollywood_path', 'PAC_imperial_path', 'PAC_spiritualist_path'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 政治大会 =====================
            f('PAC_emergency_assembly', '萨克拉门托紧急议会', '战时统合', 10, 0, 4, '麦克阿瑟政变后，太平洋国在西海岸竖起民主与自治的旗帜。', [E.pp(4), E.capT(2)]),
            f('PAC_west_convention', '西海岸政治大会', '政治路线', 10, 1, 5, '在民主派、休斯财团、好莱坞、海权派与神秘主义者之间确定战时国体。', [E.pp(3), E.tagInc('港口', 1)], ['PAC_emergency_assembly']),

            // ===================== 线 A：进步联邦（联邦党）｜形状＝菱形 ＋ 奥尔森/辛克莱子分叉 =====================
            f('PAC_progressive_path', '联邦大会党', '进步联邦', 1, 2, 6, '以加州联邦党为核心，争取城市中产与劳工。', [E.pp(3), E.ppCap(2)], ['PAC_west_convention'], meOthers('PAC_progressive_path')),
            f('PAC_olson_commonwealth', '奥尔森社会民主', '进步联邦', 0, 3, 6, '州长奥尔森"生产用于使用"，走温和社会民主。', [E.ppIncome(1), E.maint(-0.02)], ['PAC_progressive_path'], { mutuallyExclusive: ['PAC_sinclair_epic'] }),
            f('PAC_sinclair_epic', '辛克莱EPIC运动', '进步联邦', 2, 3, 6, '厄普顿·辛克莱"终结加州贫困"，走激进合作社路线。', [E.recruitAmount(1), E.freeT(2)], ['PAC_progressive_path'], { mutuallyExclusive: ['PAC_olson_commonwealth'] }),
            // 奥尔森臂（民主）
            f('PAC_health_initiative', '全民医疗法案', '进步联邦', 0, 4, 7, '推行公共医疗与社会保险。', [E.moneyIncome(1), E.crisis(2)], ['PAC_olson_commonwealth']),
            f('PAC_public_works_admin', '公共事业署', '进步联邦', 0, 5, 7, '用水坝、道路和救济维持后方与就业。', [E.moneyIncome(1), E.maint(-0.02)], ['PAC_health_initiative']),
            f('PAC_civil_liberties', '公民自由保障', '进步联邦', 0, 6, 8, '战时仍保留有限选举与司法审查。', [E.ppIncome(1), E.ppCap(2)], ['PAC_public_works_admin']),
            f('PAC_second_california', '第二加州共和国', '进步联邦', 0, 7, 9, '把改革传统升格为国家身份，成为西海岸的民主灯塔。', [E.actionCost('focus', -1), E.ppCap(3), E.pp(5), E.ideo('wartime_democracy', '美利坚太平洋国', '太平洋国')], ['PAC_civil_liberties']),
            // 辛克莱臂（合作社/工团）
            f('PAC_epic_communes', '生产合作公社', '进步联邦', 2, 4, 7, '把失业者组织进自给自足的生产公社。', [E.recruitCost(-1), E.allT(1)], ['PAC_sinclair_epic']),
            f('PAC_drone_labor', '劳动调度局', '进步联邦', 2, 5, 7, '中央调度劳动力填补战时缺口。', [E.allI(1, 2), E.freeT(2)], ['PAC_epic_communes']),
            f('PAC_hive_system', '蜂巢生产体系', '进步联邦', 2, 6, 8, '每个公社专精一种产业，组成"蜂巢"网络。', [E.allI(1, 3), E.freeT(3)], ['PAC_drone_labor']),
            f('PAC_utopian_hives', '太平洋乌托邦蜂巢', '进步联邦', 2, 7, 9, '辛克莱的乌托邦蜂巢成为国家形态。', [E.recruitAmount(2), E.freeT(4), E.ideo('syndicalism', '太平洋乌托邦公社', '乌托邦公社')], ['PAC_hive_system']),
            // 菱形合流
            f('PAC_west_coast_coalition', '西海岸进步联盟', '进步联邦', 1, 8, 10, '温和派与激进派在同一面旗下结成战时联盟。', [E.pp(4), E.allCapT(2)], [], { prerequisiteAny: [['PAC_second_california'], ['PAC_utopian_hives']] }),

            // ===================== 线 B：休斯财团｜形状＝鱼骨脊柱 ＋ 拉斯维加斯/航空子分叉 =====================
            f('PAC_technocrat_path', '休斯财团入主', '休斯财团', 5, 2, 6, '霍华德·休斯把航空、电影与工程财团带进战时内阁。', [E.capI(1), E.capBoost(1, 1)], ['PAC_west_convention'], meOthers('PAC_technocrat_path')),
            f('PAC_hughes_consolidation', '休斯集团整合', '休斯财团', 5, 3, 6, '吞并竞争对手，形成横跨海岸的财团。', [E.moneyIncome(1), E.money(10)], ['PAC_technocrat_path']),
            f('PAC_vegas_project', '拉斯维加斯工程', '休斯财团', 6, 4, 7, '在内华达沙漠建起赌城与大型工程基地。', [E.money(15), E.moneyIncome(1)], ['PAC_hughes_consolidation'], { mutuallyExclusive: ['PAC_aviation_expansion'] }),
            f('PAC_aviation_expansion', '航空工业扩张', '休斯财团', 4, 4, 7, '把零散机库整合成统一的西海岸航空总公司。', [E.capI(1), E.allI(1, 2)], ['PAC_hughes_consolidation'], { mutuallyExclusive: ['PAC_vegas_project'] }),
            // 赌城臂（财阀）
            f('PAC_casino_capitalism', '赌场资本主义', '休斯财团', 6, 5, 7, '用赌场与娱乐现金流支撑战时财政。', [E.moneyIncome(2), E.bonds(25, 4, 3)], ['PAC_vegas_project']),
            f('PAC_luxury_bonds', '奢华债券', '休斯财团', 6, 6, 8, '向富豪发行高息战争债券。', [E.money(20), E.moneyIncome(1)], ['PAC_casino_capitalism']),
            f('PAC_economic_zone', '太平洋经济特区', '休斯财团', 6, 7, 9, '把太平洋国变成由财团运营的经济特区。', [E.moneyIncome(2), E.money(20), E.ideo('plutocracy', '太平洋经济特区', '经济特区')], ['PAC_luxury_bonds']),
            // 航空臂（技术）+ 肋
            f('PAC_jet_radar', '喷气与雷达', '休斯财团', 4, 5, 7, '抢先发展喷气推进与海岸雷达。', [E.allI(1, 3), E.gAtk(0.05)], ['PAC_aviation_expansion']),
            f('PAC_nuclear_research', '曼哈顿西岸分部', '休斯财团', 3, 6, 8, '把胡佛水坝电力投入秘密核研究。', [E.capI(1), E.capBoost(1, 2)], ['PAC_jet_radar']),
            f('PAC_automation', '全自动工厂', '休斯财团', 4, 6, 8, '推行流水线与自动化，压低军工成本。', [E.allI(1, 3), E.actionCost('build', -1)], ['PAC_jet_radar']),
            f('PAC_engineered_state', '太平洋技术统合', '休斯财团', 4, 7, 9, '让工程师与承包商财团成为日常政府。', [E.actionCost('build', -1), E.allI(1, 3), E.pp(4), E.ideo('technocracy', '太平洋技术统合国', '技术统合国')], ['PAC_automation']),
            // 合流
            f('PAC_hughes_synthesis', '休斯综合体', '休斯财团', 5, 8, 10, '财团把赌城现金与航空科技拧成一台战争机器。', [E.moneyIncome(1), E.allI(1, 3), E.allCapT(2)], [], { prerequisiteAny: [['PAC_economic_zone'], ['PAC_engineered_state']] }),

            // ===================== 线 C：好莱坞｜形状＝三叉戟（迪士尼/广播/赫斯特）=====================
            f('PAC_hollywood_path', '好莱坞宣传机器', '好莱坞', 9, 2, 6, '把好莱坞片厂、广播网和报业整合成战时宣传机器。', [E.pp(3), E.crisis(2)], ['PAC_west_convention'], meOthers('PAC_hollywood_path')),
            f('PAC_wartime_studios', '战时制片厂', '好莱坞', 9, 3, 6, '电影厂转产战争宣传片与募债海报。', [E.pp(3), E.money(10)], ['PAC_hollywood_path']),
            // 三叉：迪士尼(左, 与赫斯特互斥) / 广播(中) / 赫斯特(右, 与迪士尼互斥)
            f('PAC_disney_tomorrowland', '迪士尼明日乐园', '好莱坞', 8, 4, 7, '用"明日乐园"式的乐观主义把民众团结在政府周围。', [E.ppIncome(1), E.crisis(3)], ['PAC_wartime_studios'], { mutuallyExclusive: ['PAC_hearst_press'] }),
            f('PAC_national_broadcast', '全国广播网', '好莱坞', 9, 4, 7, '统一战时叙事，把西海岸神话卖给每座城市。', [E.pp(3), E.ppIncome(1)], ['PAC_wartime_studios']),
            f('PAC_hearst_press', '赫斯特报系', '好莱坞', 10, 4, 7, '赫斯特报系用耸动新闻主导舆论。', [E.pp(3), E.money(8)], ['PAC_wartime_studios'], { mutuallyExclusive: ['PAC_disney_tomorrowland'] }),
            // 迪士尼臂
            f('PAC_patriotic_shorts', '爱国动画短片', '好莱坞', 8, 5, 8, '用动画短片做最廉价高效的宣传。', [E.pp(4), E.crisis(2)], ['PAC_disney_tomorrowland']),
            f('PAC_tomorrowland_state', '明日乐园国家', '好莱坞', 8, 6, 9, '迪士尼把娱乐变成温情而坚定的国家机器。', [E.ppIncome(1), E.crisis(4), E.gDef(0.05), E.ideo('entertainment_state', '太平洋梦工厂国', '梦工厂国')], ['PAC_patriotic_shorts']),
            // 广播臂
            f('PAC_propaganda_network', '宣传总网', '好莱坞', 9, 5, 8, '广播、海报与新闻片组成统一宣传总网。', [E.ppIncome(1), E.crisis(3)], ['PAC_national_broadcast']),
            f('PAC_dream_factory', '太平洋梦工厂', '好莱坞', 9, 6, 9, '把整个西海岸变成一座制造梦想与共识的工厂。', [E.pp(4), E.ppIncome(1), E.crisis(3), E.ideo('entertainment_state', '太平洋梦工厂国', '梦工厂国')], ['PAC_propaganda_network']),
            // 赫斯特臂
            f('PAC_media_monopoly', '黄色新闻垄断', '好莱坞', 10, 5, 8, '兼并报刊与电台，垄断舆论。', [E.pp(3), E.damage(1, 2)], ['PAC_hearst_press']),
            f('PAC_western_states', '西部合众国', '好莱坞', 10, 6, 9, '赫斯特以媒体扶植强人，建立西部合众国。', [E.pp(4), E.damage(1, 3), E.gAtk(0.05), E.ideo('fascism', '西部合众国', '西部合众国')], ['PAC_media_monopoly']),

            // ===================== 线 D：太平洋海权/诺顿｜形状＝之字 ＋ 诺顿/日本子分叉 =====================
            f('PAC_imperial_path', '太平洋海权派', '太平洋帝国', 13, 2, 6, '把太平洋国塑造成面向海外的海权强国。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_west_convention'], meOthers('PAC_imperial_path')),
            f('PAC_pacific_fleet', '太平洋舰队', '太平洋帝国', 12, 3, 6, '把民用船团改造成可调度的太平洋舰队。', [E.tagT('港口', 1), E.tagD('港口', 0.05)], ['PAC_imperial_path']),
            f('PAC_railgun_battleships', '电磁炮战列舰', '太平洋帝国', 13, 4, 7, '为战列舰换装电磁炮与核动力。', [E.gAtk(0.05), E.tagD('港口', 0.05)], ['PAC_pacific_fleet']),
            f('PAC_naval_bases', '跳岛基地网', '太平洋帝国', 13, 5, 7, '在西太平洋建立跳岛基地链。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['PAC_railgun_battleships']),
            f('PAC_deep_water_doctrine', '远洋制海条令', '太平洋帝国', 13, 6, 8, '把舰队推向远洋，主动制海。', [E.gAtk(0.05), E.tagD('港口', 0.05)], ['PAC_naval_bases']),
            // 诺顿臂（君主）/ 日本臂（共荣）子分叉
            f('PAC_norton_claim', '诺顿王位主张', '太平洋帝国', 12, 5, 7, '推出诺顿二世，主张太平洋帝位。', [E.ppCap(2), E.crisis(2)], ['PAC_railgun_battleships'], { mutuallyExclusive: ['PAC_japan_cooperation'] }),
            f('PAC_japan_cooperation', '日本共荣合作', '太平洋帝国', 14, 5, 7, '与日本就太平洋共荣达成合作。', [E.money(15), E.tagInc('港口', 1)], ['PAC_railgun_battleships'], { mutuallyExclusive: ['PAC_norton_claim'] }),
            f('PAC_coronation', '诺顿二世加冕', '太平洋帝国', 12, 6, 8, '在旧金山为诺顿二世举行加冕大典。', [E.ppCap(2), E.allCapT(2)], ['PAC_norton_claim']),
            f('PAC_pacific_empire', '太平洋帝国', '太平洋帝国', 12, 7, 9, '诺顿二世登基，太平洋国成为西太平洋核心。', [E.gAtk(0.05), E.capMoney(3), E.badge('太平洋帝国'), E.ideo('pacific_imperium', '太平洋帝国', '太平洋帝国')], ['PAC_coronation']),
            f('PAC_co_prosperity', '太平洋共荣圈', '太平洋帝国', 14, 6, 8, '把港口与贸易并入日本主导的共荣圈。', [E.moneyIncome(2), E.money(15)], ['PAC_japan_cooperation']),
            f('PAC_japanese_pacific', '日属太平洋诸州', '太平洋帝国', 14, 7, 9, '以自治换取日本的舰队与资源支持。', [E.moneyIncome(2), E.tagInc('港口', 1), E.tagT('港口', 1), E.ideo('mercantile', '日属太平洋诸州', '太平洋诸州')], ['PAC_co_prosperity']),
            // 合流
            f('PAC_oceanic_mandate', '大洋授权', '太平洋帝国', 13, 8, 10, '无论加冕还是结盟，太平洋都成为太平洋国的内湖。', [E.capMoney(3), E.capTroop(1), E.tagT('港口', 2)], [], { prerequisiteAny: [['PAC_pacific_empire'], ['PAC_japanese_pacific']] }),

            // ===================== 线 E：神秘主义｜形状＝长柄＋冠（罗里奇/哈伯德）=====================
            f('PAC_spiritualist_path', '神秘主义觉醒', '神秘主义', 17, 2, 6, '西海岸的灵性运动登上政治舞台。', [E.pp(3), E.crisis(2)], ['PAC_west_convention'], meOthers('PAC_spiritualist_path')),
            f('PAC_theosophy', '神智学社', '神秘主义', 17, 3, 6, '把神智学与新纪元运动组织起来。', [E.ppIncome(1), E.crisis(2)], ['PAC_spiritualist_path']),
            f('PAC_sacred_assembly', '神圣议会', '神秘主义', 17, 4, 7, '召集灵性领袖组成神圣议会。', [E.ppCap(2), E.pp(3)], ['PAC_theosophy']),
            // 冠：罗里奇(左) / 哈伯德(右) 子分叉
            f('PAC_roerich_invite', '邀请罗里奇', '神秘主义', 16, 5, 7, '迎请尼古拉·罗里奇主持圣域同盟。', [E.ppIncome(1), E.ppCap(2)], ['PAC_sacred_assembly'], { mutuallyExclusive: ['PAC_hubbard_order'] }),
            f('PAC_hubbard_order', '哈伯德灵性教团', '神秘主义', 18, 5, 7, 'L·罗恩·哈伯德建立神秘的灵性教团。', [E.crisis(4), E.freeT(3)], ['PAC_sacred_assembly'], { mutuallyExclusive: ['PAC_roerich_invite'] }),
            // 罗里奇臂
            f('PAC_roerich_arts', '罗里奇艺术院', '神秘主义', 16, 6, 8, '以艺术与和平公约凝聚民心。', [E.ppIncome(1), E.moneyIncome(1)], ['PAC_roerich_invite']),
            f('PAC_sacred_union', '太平洋神圣同盟', '神秘主义', 16, 7, 9, '罗里奇的圣域同盟成为国家信仰。', [E.ppCap(3), E.ppIncome(1), E.allCapT(2), E.ideo('pacific_spiritualism', '太平洋神圣同盟', '神圣同盟')], ['PAC_roerich_arts']),
            // 哈伯德臂
            f('PAC_paranormal_division', '超自然调查局', '神秘主义', 18, 6, 8, '成立调查超自然与UFO的秘密部门。', [E.crisis(3), E.damage(1, 2)], ['PAC_hubbard_order']),
            f('PAC_spiritual_order', '太平洋灵性教团', '神秘主义', 18, 7, 9, '哈伯德教团把信徒动员为狂热的战时力量。', [E.freeT(4), E.crisis(4), E.ideo('pacific_spiritualism', '太平洋神圣同盟', '神圣同盟')], ['PAC_paranormal_division']),
            // 合流（顶部三叉冠收束）
            f('PAC_great_awakening', '大觉醒', '神秘主义', 17, 8, 10, '无论圣域还是教团，西海岸都进入一场精神总动员。', [E.ppCap(3), E.gDef(0.05), E.allCapT(3)], [], { prerequisiteAny: [['PAC_sacred_union'], ['PAC_spiritual_order']] }),

            // ===================== 支线·军事：太平洋卫队｜形状＝三叉（日系/游骑/陆战）=====================
            f('PAC_general_staff', '西海岸防务参谋部', '太平洋卫队', 23, 1, 5, '以山口、港口和长距离机动作战保卫太平洋国。', [E.capT(3)], ['PAC_emergency_assembly']),
            f('PAC_nisei_militia', '日系义勇民兵', '太平洋卫队', 22, 2, 6, '组建日裔美国人义勇民兵，忠诚而廉价。', [E.recruitAmount(1), E.freeT(2)], ['PAC_general_staff']),
            f('PAC_rocky_rangers', '落基山游骑兵', '太平洋卫队', 23, 2, 6, '由护林员、测绘员与猎人组成山地游骑兵。', [E.gAtk(0.05), E.actionCost('move', -1)], ['PAC_general_staff']),
            f('PAC_pacific_marines', '太平洋陆战队', '太平洋卫队', 24, 2, 6, '围绕港口与登陆建立精锐陆战队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_general_staff']),
            f('PAC_nisei_command', '海岸守备司令部', '太平洋卫队', 22, 3, 7, '把港口与城市守备并入统一司令部。', [E.gDef(0.05), E.allT(1)], ['PAC_nisei_militia']),
            f('PAC_coastal_defense', '海岸防御网', '太平洋卫队', 22, 4, 8, '在海岸线布设要塞与防空。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['PAC_nisei_command']),
            f('PAC_ranger_raids', '山地袭扰队', '太平洋卫队', 23, 3, 7, '游骑兵专打敌方薄弱节点。', [E.damage(1, 2), E.allT(1)], ['PAC_rocky_rangers']),
            f('PAC_mountain_warfare', '山地战条令', '太平洋卫队', 23, 4, 8, '把落基山口变成天然防线与伏击场。', [E.gAtk(0.05), E.maint(-0.02)], ['PAC_ranger_raids']),
            f('PAC_amphibious', '两栖突击训练', '太平洋卫队', 24, 3, 7, '把陆战队训练成可登陆部队。', [E.recruitAmount(1), E.tagT('港口', 1)], ['PAC_pacific_marines']),
            f('PAC_island_assault', '岛屿登陆群', '太平洋卫队', 24, 4, 8, '组建跨海登陆突击群。', [E.gAtk(0.05), E.tagT('港口', 1)], ['PAC_amphibious']),
            f('PAC_pacific_guard', '太平洋卫队总司令部', '太平洋卫队', 23, 5, 10, '把三支劲旅纳入统一的太平洋卫队。', [E.gAtk(0.05), E.capT(4), E.tagD('港口', 0.05)], [], { prerequisiteAny: [['PAC_coastal_defense'], ['PAC_mountain_warfare'], ['PAC_island_assault']] }),

            // ===================== 支线·经济：太平洋经济｜形状＝梯子/H =====================
            f('PAC_production_board', '西海岸生产委员会', '太平洋经济', 27, 1, 5, '整合港口、农场、水电和航空工坊。', [E.money(16), E.tagInc('港口', 1)], ['PAC_emergency_assembly']),
            f('PAC_ports_program', '港口经济', '太平洋经济', 26, 2, 6, '让洛杉矶和旧金山承担更多现金流。', [E.moneyIncome(1), E.tagMoney('港口', 8)], ['PAC_production_board']),
            f('PAC_green_power', '绿色电力网', '太平洋经济', 28, 2, 6, '把水电、风电和太阳能并入战时电网。', [E.moneyIncome(1), E.capBoost(1, 1)], ['PAC_production_board']),
            f('PAC_harbor_grid', '港电联调', '太平洋经济', 27, 3, 7, '把港口现金流与绿色电网协同调度（横档）。', [E.moneyIncome(1), E.maint(-0.02)], ['PAC_ports_program', 'PAC_green_power']),
            f('PAC_port_bonds', '港口债券', '太平洋经济', 26, 3, 7, '发行港口债券筹措战费。', [E.bonds(25, 4, 3), E.tagInc('港口', 1)], ['PAC_ports_program']),
            f('PAC_aero_orders', '航空订单', '太平洋经济', 28, 3, 7, '为本国与海外发出航空订单。', [E.money(15), E.capI(1)], ['PAC_green_power']),
            f('PAC_coastal_arsenal', '海岸兵工厂', '太平洋经济', 26, 4, 8, '让港口承担更多军工生产。', [E.allI(1, 3), E.actionCost('build', -1)], ['PAC_port_bonds']),
            f('PAC_aero_factories', '飞机零件厂', '太平洋经济', 28, 4, 8, '把零件厂扩建到极限。', [E.allI(1, 3), E.capBoost(1, 2)], ['PAC_aero_orders']),
            f('PAC_longshore_credit', '码头工信用社', '太平洋经济', 26, 5, 9, '港口工会与银行共同承担短期战费。', [E.moneyIncome(1), E.tagMoney('港口', 6)], ['PAC_coastal_arsenal']),
            f('PAC_atomic_commission', '原子能委员会', '太平洋经济', 28, 5, 9, '把核能投入工业与电力。', [E.allI(1, 3), E.capBoost(1, 2)], ['PAC_aero_factories']),
            f('PAC_industrial_grid', '产业总协同', '太平洋经济', 27, 5, 8, '把港口、电网与航空厂连成一张产业网（横档）。', [E.allI(1, 2), E.moneyIncome(1)], ['PAC_coastal_arsenal', 'PAC_aero_factories']),
            f('PAC_total_pacific_production', '太平洋总生产', '太平洋经济', 27, 6, 10, '把经济路线转化为长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 3), E.tagInc('港口', 1)], [], { prerequisiteAny: [['PAC_longshore_credit'], ['PAC_atomic_commission']] }),

            // ===================== 支线·外交：外援后盾｜形状＝轮辐/星形 =====================
            f('PAC_regional_office', '西部外交局', '外援后盾', 32, 1, 5, '决定向落基山推进还是巩固太平洋海岸，并寻找外部支持。', [E.money(10), E.pp(3)], ['PAC_emergency_assembly']),
            f('PAC_independence_league', '独立联盟', '外援后盾', 32, 2, 6, '加入各州独立联盟，抵制麦克阿瑟的干涉。', [E.pp(3), E.ppCap(2)], ['PAC_regional_office']),
            f('PAC_japan_contacts', '日本接触', '外援后盾', 31, 3, 7, '与日本就太平洋贸易与军备秘密接触。', [E.money(12), E.tagInc('港口', 1)], ['PAC_independence_league']),
            f('PAC_entente_aid', '协约国援助', '外援后盾', 32, 3, 7, '争取协约国的租借援助。', [E.money(15), E.recruitAmount(1)], ['PAC_independence_league']),
            f('PAC_canada_accord', '加拿大协定', '外援后盾', 33, 3, 7, '与加拿大达成海岸防务与补给协定。', [E.moneyIncome(1), E.tagD('港口', 0.05)], ['PAC_independence_league']),
            f('PAC_pacific_trade', '泛太平洋贸易', '外援后盾', 31, 4, 8, '把港口接入泛太平洋贸易网。', [E.moneyIncome(1), E.tagMoney('港口', 6)], ['PAC_japan_contacts']),
            f('PAC_macarthur_standoff', '对峙麦克阿瑟', '外援后盾', 32, 4, 8, '在谈判桌与战线上同时对峙麦克阿瑟。', [E.crisis(3), E.pp(3)], ['PAC_entente_aid']),
            f('PAC_dominion_pact', '加州自治领议案', '外援后盾', 33, 4, 8, '考虑以自治领身份接受协约国保护。', [E.gDef(0.05), E.moneyIncome(1)], ['PAC_canada_accord']),
            f('PAC_asian_markets', '亚洲市场准入', '外援后盾', 31, 5, 9, '换取亚洲市场与原料准入。', [E.moneyIncome(2), E.money(12)], ['PAC_pacific_trade']),
            f('PAC_federal_referendum', '联邦重整公投', '外援后盾', 32, 5, 9, '为战后与联邦重新整合预留合法出口。', [E.pp(4), E.ppCap(2)], ['PAC_macarthur_standoff']),
            f('PAC_west_unification', '西部统一战略', '外援后盾', 32, 6, 10, '把外援与地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.allCapT(2)], [], { prerequisiteAny: [['PAC_asian_markets'], ['PAC_federal_referendum'], ['PAC_dominion_pact']] }),

            // ===================== 终局 capstone（合流所选政治主线 + 支线）=====================
            f('PAC_west_coast_showcase', '西海岸样板国', '太平洋终局', 10, 10, 10, '萨克拉门托把太平洋国包装成比旧联邦更现代的美国。', [E.ppIncome(1), E.ppCap(3), E.money(15)], [], { prerequisiteAny: [['PAC_west_coast_coalition'], ['PAC_hughes_synthesis'], ['PAC_tomorrowland_state'], ['PAC_dream_factory'], ['PAC_western_states'], ['PAC_oceanic_mandate'], ['PAC_great_awakening']] }),
            f('PAC_california_century', '加利福尼亚世纪', '太平洋终局', 10, 11, 12, '高科技、宣传、海权、信仰与民主合成一套独一无二的西海岸玩法。', [E.moneyIncome(2), E.actionCost('build', -1), E.allI(1, 5), E.badge('加利福尼亚世纪')], ['PAC_west_coast_showcase']),

            // ===================== 扩展：各线加深 + 新支线（西海岸社会）补到 ~150 =====================
            // 进步联邦
            f('PAC_ca_labor_council', '加州劳工议会', '进步联邦', 1, 4, 7, '把工会与劳工组织进战时议会。', [E.recruitAmount(1), E.freeT(2)], ['PAC_progressive_path']),
            f('PAC_ca_cooperatives', '加州合作总社', '进步联邦', 1, 5, 7, '把合作社联成全州生产网络。', [E.allI(1, 2), E.freeT(2)], ['PAC_ca_labor_council']),
            f('PAC_olson_legacy', '奥尔森遗产', '进步联邦', 0, 8, 8, '把社会民主写成长期制度遗产。', [E.ppIncome(1), E.ppCap(2)], ['PAC_second_california']),
            f('PAC_sinclair_legacy', '辛克莱遗产', '进步联邦', 2, 8, 8, '把合作社乌托邦扩展到每个城市。', [E.recruitAmount(1), E.freeT(3)], ['PAC_utopian_hives']),
            // 休斯财团
            f('PAC_hughes_film', '休斯电影厂', '休斯财团', 5, 4, 7, '用电影业现金流补贴航空与工程。', [E.pp(3), E.money(10)], ['PAC_hughes_consolidation']),
            f('PAC_hughes_aircraft', '休斯飞行器', '休斯财团', 3, 4, 7, '休斯亲自主持新一代飞行器。', [E.capI(1), E.allI(1, 2)], ['PAC_hughes_consolidation']),
            f('PAC_spruce_goose', '云杉鹅运输机', '休斯财团', 3, 5, 7, '巨型运输机连接海岸与跳岛基地。', [E.allI(1, 2), E.capBoost(1, 1)], ['PAC_hughes_aircraft']),
            f('PAC_desert_test_site', '沙漠试验场', '休斯财团', 3, 7, 8, '在内华达沙漠测试喷气与核装置。', [E.capBoost(1, 2), E.gAtk(0.05)], ['PAC_nuclear_research']),
            f('PAC_vegas_strip', '拉斯维加斯大道', '休斯财团', 6, 8, 9, '赌城大道成为财团的现金机器。', [E.moneyIncome(2), E.money(15)], ['PAC_economic_zone']),
            // 好莱坞
            f('PAC_disney_studios', '迪士尼制片城', '好莱坞', 8, 7, 8, '迪士尼制片城把乐观主义工业化。', [E.ppIncome(1), E.crisis(3)], ['PAC_tomorrowland_state']),
            f('PAC_radio_empire', '广播帝国', '好莱坞', 9, 7, 8, '把广播网扩张成覆盖西部的帝国。', [E.pp(4), E.ppIncome(1)], ['PAC_dream_factory']),
            f('PAC_hearst_machine', '赫斯特政治机器', '好莱坞', 10, 7, 8, '赫斯特报系成为操纵政治的机器。', [E.pp(3), E.damage(1, 2)], ['PAC_western_states']),
            // 太平洋帝国
            f('PAC_marine_corps', '帝国陆战队', '太平洋帝国', 12, 4, 7, '建立面向跳岛的帝国陆战队。', [E.tagT('港口', 1), E.allT(1)], ['PAC_pacific_fleet']),
            f('PAC_carrier_groups', '航母战斗群', '太平洋帝国', 14, 4, 7, '把民用船坞改造成航母战斗群。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_pacific_fleet']),
            f('PAC_pacific_throne', '太平洋王座', '太平洋帝国', 13, 7, 9, '为太平洋帝位铸造长期合法性。', [E.ppCap(3), E.allCapT(2)], ['PAC_coronation']),
            // 神秘主义
            f('PAC_secret_doctrine', '秘密教义', '神秘主义', 16, 4, 7, '把神智学秘义编成内部教义。', [E.ppIncome(1), E.crisis(2)], ['PAC_theosophy']),
            f('PAC_ufo_contactees', 'UFO接触者', '神秘主义', 18, 4, 7, '把UFO接触者纳入神秘主义运动。', [E.crisis(3), E.freeT(2)], ['PAC_theosophy']),
            f('PAC_new_age_movement', '新纪元运动', '神秘主义', 17, 5, 7, '把新纪元运动组织成群众运动。', [E.ppIncome(1), E.crisis(2)], ['PAC_sacred_assembly']),
            f('PAC_pacific_temple', '太平洋神殿', '神秘主义', 17, 6, 8, '在旧金山建起太平洋神殿。', [E.ppCap(2), E.crisis(3)], ['PAC_new_age_movement']),
            // 太平洋卫队
            f('PAC_nisei_442', '第442步兵团', '太平洋卫队', 22, 5, 8, '日裔第442步兵团成为精锐突击力量。', [E.allT(1), E.gAtk(0.05)], ['PAC_coastal_defense']),
            f('PAC_island_chain', '跳岛链', '太平洋卫队', 24, 5, 8, '把登陆群串成跨海跳岛链。', [E.tagT('港口', 1), E.gAtk(0.05)], ['PAC_island_assault']),
            f('PAC_coast_fortress', '海岸要塞', '太平洋卫队', 22, 6, 8, '把港口城市要塞化。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['PAC_nisei_442']),
            f('PAC_marine_division', '陆战师', '太平洋卫队', 24, 6, 8, '把陆战队扩编为陆战师。', [E.gAtk(0.05), E.tagT('港口', 1)], ['PAC_island_chain']),
            f('PAC_pacific_legion', '太平洋军团', '太平洋卫队', 23, 6, 10, '把卫队整编为太平洋军团。', [E.gAtk(0.05), E.allCapT(3)], ['PAC_pacific_guard']),
            f('PAC_pacific_high_command', '太平洋最高司令部', '太平洋卫队', 23, 7, 11, '把军团纳入太平洋最高司令部。', [E.gAtk(0.05), E.capT(4)], ['PAC_pacific_legion']),
            // 太平洋经济
            f('PAC_shipyards', '西海岸船厂', '太平洋经济', 26, 6, 9, '把港口船厂扩建到极限。', [E.tagT('港口', 1), E.allI(1, 2)], ['PAC_longshore_credit']),
            f('PAC_aero_giant', '航空巨头', '太平洋经济', 28, 6, 9, '把飞机厂整合成西海岸航空巨头。', [E.allI(1, 3), E.capI(1)], ['PAC_atomic_commission']),
            f('PAC_port_metropolis', '港口都会', '太平洋经济', 26, 7, 9, '把港口城市变成战时经济都会。', [E.moneyIncome(2), E.tagMoney('港口', 8)], ['PAC_shipyards']),
            f('PAC_pacific_dynamo', '太平洋动力', '太平洋经济', 27, 7, 10, '把水电、核电与航空连成动力总枢。', [E.moneyIncome(2), E.allI(1, 3)], ['PAC_total_pacific_production']),
            f('PAC_total_war_economy', '总体战经济', '太平洋经济', 27, 8, 11, '把太平洋经济推向总体战制度。', [E.moneyIncome(2), E.allI(1, 3)], ['PAC_pacific_dynamo']),
            // 外援后盾
            f('PAC_lend_lease_pacific', '太平洋租借', '外援后盾', 31, 6, 9, '把亚洲市场升级为太平洋租借网。', [E.money(15), E.allI(1, 2)], ['PAC_asian_markets']),
            f('PAC_commonwealth_seat', '英联邦席位', '外援后盾', 33, 5, 8, '争取在英联邦体系中的席位。', [E.pp(3), E.gDef(0.05)], ['PAC_dominion_pact']),
            f('PAC_dominion_status', '自治领地位', '外援后盾', 33, 6, 9, '以自治领地位换取长期保护。', [E.moneyIncome(1), E.gDef(0.05)], ['PAC_commonwealth_seat']),
            f('PAC_pacific_alliance', '太平洋同盟', '外援后盾', 32, 7, 10, '把外援整合成太平洋同盟体系。', [E.pp(4), E.allCapT(2)], ['PAC_west_unification']),
            f('PAC_pacific_bloc', '太平洋集团', '外援后盾', 32, 8, 11, '把同盟扩展为面向战后的太平洋集团。', [E.pp(3), E.allCapT(2)], ['PAC_pacific_alliance']),
            // 新支线·社会：西海岸社会（梯田/网格）
            f('PAC_homefront_board', '西海岸总动员委员会', '西海岸社会', 39, 1, 5, '把工会、大学、报业与教会纳入战时大后方。', [E.pp(3), E.money(8)], ['PAC_emergency_assembly']),
            f('PAC_labor_unions', '西海岸工会', '西海岸社会', 37, 2, 6, '把工会组织进战时动员。', [E.recruitAmount(1), E.freeT(2)], ['PAC_homefront_board']),
            f('PAC_civic_culture', '公民文化', '西海岸社会', 39, 2, 6, '用公民文化凝聚多元后方。', [E.ppIncome(1), E.crisis(2)], ['PAC_homefront_board']),
            f('PAC_universities', '西海岸大学', '西海岸社会', 41, 2, 6, '把大学纳入战时研究与动员。', [E.capI(1), E.ppCap(2)], ['PAC_homefront_board']),
            f('PAC_longshoremen', '码头工会', '西海岸社会', 37, 3, 6, '码头工会承担港口动员。', [E.recruitAmount(1), E.tagT('港口', 1)], ['PAC_labor_unions']),
            f('PAC_pacific_press', '太平洋报系', '西海岸社会', 39, 3, 6, '统一战时舆论与募债。', [E.pp(3), E.crisis(2)], ['PAC_civic_culture']),
            f('PAC_research_labs', '研究实验室', '西海岸社会', 41, 3, 6, '把大学实验室投入军研。', [E.capBoost(1, 2), E.capI(1)], ['PAC_universities']),
            f('PAC_union_militia', '工会民兵', '西海岸社会', 37, 4, 7, '把工会组织成后方民兵。', [E.allT(1), E.freeT(2)], ['PAC_longshoremen']),
            f('PAC_war_morale', '战时士气', '西海岸社会', 39, 4, 7, '用宣传与文化维持战时士气。', [E.ppIncome(1), E.crisis(3)], ['PAC_pacific_press']),
            f('PAC_tech_institutes', '技术学院', '西海岸社会', 41, 4, 7, '技术学院培养工程与航空人才。', [E.allI(1, 2), E.capBoost(1, 1)], ['PAC_research_labs']),
            f('PAC_cooperative_housing', '合作住房', '西海岸社会', 37, 5, 7, '用合作住房稳住工人后方。', [E.moneyIncome(1), E.freeT(2)], ['PAC_union_militia']),
            f('PAC_civil_defense', '民防体系', '西海岸社会', 39, 5, 7, '建立海岸城市的民防体系。', [E.gDef(0.05), E.freeT(2)], ['PAC_war_morale']),
            f('PAC_aerospace_schools', '航空学校', '西海岸社会', 41, 5, 7, '航空学校为军工输送技师。', [E.allI(1, 2), E.gAtk(0.05)], ['PAC_tech_institutes']),
            f('PAC_pacific_labor_charter', '太平洋劳工宪章', '西海岸社会', 37, 6, 8, '颁布保障工人的太平洋劳工宪章。', [E.recruitAmount(1), E.ppIncome(1)], ['PAC_cooperative_housing']),
            f('PAC_homefront_unity', '后方团结', '西海岸社会', 39, 6, 8, '把多元后方凝成统一意志。', [E.ppCap(2), E.crisis(3)], ['PAC_civil_defense']),
            f('PAC_scientist_corps', '科学家团', '西海岸社会', 41, 6, 8, '把科学家组织成战时科学家团。', [E.capBoost(1, 2), E.allI(1, 2)], ['PAC_aerospace_schools']),
            f('PAC_west_coast_mobilization', '西海岸总动员', '西海岸社会', 39, 7, 10, '把劳工、文化与科学拧成一场总动员。', [E.ppCap(3), E.allCapT(2), E.recruitAmount(1), E.badge('西海岸总动员')], [], { prerequisiteAny: [['PAC_pacific_labor_charter'], ['PAC_homefront_unity'], ['PAC_scientist_corps']] }),
            f('PAC_pacific_homefront', '太平洋大后方', '西海岸社会', 39, 8, 11, '把西海岸打造成支撑长期战争的大后方。', [E.moneyIncome(2), E.freeT(3), E.ppIncome(1)], ['PAC_west_coast_mobilization']),
            // 终局加深
            f('PAC_pacific_renaissance', '太平洋复兴', '太平洋终局', 12, 11, 10, '把西海岸样板升华为一场太平洋复兴。', [E.ppIncome(1), E.money(15)], ['PAC_west_coast_showcase']),
            f('PAC_new_pacific_order', '新太平洋秩序', '太平洋终局', 10, 12, 13, '加利福尼亚世纪扩展为一整套新太平洋秩序。', [E.ppCap(5), E.allCapT(4), E.allI(1, 4), E.badge('新太平洋秩序')], ['PAC_california_century'])
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
