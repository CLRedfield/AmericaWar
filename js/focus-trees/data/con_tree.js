// 国策数据：CON（美利坚宪政国 / Constitutional American Republic + 黑带起义）。
// 手工布局：每条线一种独立轮廓，坐标在此即最终位置
// （CON 已从所有后处理器中排除，参照 PAC）。
// 政治线＝大Y分叉：左翼【宪政国·棕榈扇】 vs 右翼【黑人起义·上升闪电/握拳】（两翼根互斥）。
// 支线：南方军(三叉戟) / 深南方(梯子H) / 南大西洋(菱形) / 秩序信仰(王冠)。终局合流。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.CON = function (f, E) {
        return [
            // ===================== 根 + 政治大会（大Y分叉柄） =====================
            f('CON_emergency_regency', '亚特兰大摄政府', '战时统合', 11, 0, 4, '深南方危局中，把摄政官、州议会和军队绑成同一套战时政府。', [E.pp(4), E.capT(2)]),
            f('CON_constitutional_convention', '南方宪政会议', '政治路线', 11, 1, 5, '宪政会议必须决定：是死守白人宪政国，还是任由黑带揭竿而起。', [E.pp(3), E.maint(-0.02)], ['CON_emergency_regency']),

            // ===================== 左翼：宪政国（CAR）｜形状＝棕榈扇 =====================
            // 主干
            f('CON_car_path', '维护宪政国', '宪政国', 5, 2, 6, '把摄政府塑造成原始宪法的临时守护者，镇住深南方。', [E.pp(3), E.ppCap(2)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_black_revolt'] }),
            f('CON_all_democratic_party', '全民主党', '宪政国', 5, 3, 6, '以老民主党（ODP）为执政核心，统合种植园主与城镇白人。', [E.pp(3), E.money(8)], ['CON_car_path']),
            f('CON_jacksonian_doctrine', '杰克逊主义', '宪政国', 5, 4, 6, '把州权与农本主义写成立国信条，扇形展开各派系。', [E.ppCap(2), E.maint(-0.02)], ['CON_all_democratic_party']),
            // 扇基两侧
            f('CON_solid_south', '铁板南方', '宪政国', 3, 4, 6, '用恩惠与恐惧把南方各州钉成铁板一块。', [E.pp(3), E.ppCap(2)], ['CON_all_democratic_party']),
            f('CON_southern_manifesto', '南方宣言', '宪政国', 7, 4, 6, '联署一份维护旧秩序的南方宣言，号召强人出山。', [E.pp(4), E.crisis(2)], ['CON_all_democratic_party']),
            // 指1：ODP 法统（x=0）
            f('CON_odp_county_courts', '县治法庭', '宪政国', 0, 5, 7, '重开县级法庭，用司法替代军令安抚地方。', [E.money(8), E.maint(-0.02)], ['CON_jacksonian_doctrine'], { mutuallyExclusive: ['CON_ford_industrial_party', 'CON_klan_invisible_empire', 'CON_strongman_call'] }),
            f('CON_odp_old_constitution', '旧宪法至上', '宪政国', 0, 6, 7, '宣布原始宪法压倒一切战时权宜。', [E.pp(4), E.crisis(3)], ['CON_odp_county_courts']),
            f('CON_odp_agrarian_order', '农本秩序', '宪政国', 0, 7, 7, '把农业与小镇士绅奉为共和国的道德根基。', [E.moneyIncome(1), E.maint(-0.02)], ['CON_odp_old_constitution']),
            f('CON_odp_planter_gentry', '种植园士绅', '宪政国', 0, 8, 8, '让旧种植园主重新成为地方权力的脊梁。', [E.money(10), E.ppCap(2)], ['CON_odp_agrarian_order']),
            f('CON_odp_restored_republic', '复归共和国', '宪政国', 0, 9, 9, '宣布摄政府只是过渡，宪政共和终将复归。', [E.ppCap(3), E.pp(5), E.actionCost('focus', -1), E.ideo('constitutional', '美利坚宪政国', '宪政国')], ['CON_odp_planter_gentry']),
            f('CON_disenfranchisement', '选举权剥夺', '宪政国', 1, 5, 7, '用人头税与识字测验把不可靠选民清出名册。', [E.maint(-0.02), E.crisis(3)], ['CON_solid_south']),
            // 指2：福特主义（x=2）
            f('CON_ford_industrial_party', '福特工业党', '宪政国', 2, 5, 7, '亨利·福特式的工业家集团登上战时内阁。', [E.capI(1), E.capBoost(1, 1)], ['CON_jacksonian_doctrine'], { mutuallyExclusive: ['CON_odp_county_courts', 'CON_klan_invisible_empire', 'CON_strongman_call'] }),
            f('CON_ford_machine_gov', '机器治国', '宪政国', 2, 6, 7, '用工程师与流水线逻辑接管行政。', [E.allI(1, 2), E.actionCost('build', -1)], ['CON_ford_industrial_party']),
            f('CON_ford_company_welfare', '公司福利', '宪政国', 2, 7, 7, '用厂办住房、医疗与工资换取工人忠诚。', [E.moneyIncome(1), E.maint(-0.02)], ['CON_ford_machine_gov']),
            f('CON_ford_sociological', '社会学部', '宪政国', 2, 8, 8, '福特社会学部深入工人生活，塑造顺从的劳动力。', [E.recruitAmount(1), E.freeT(2)], ['CON_ford_company_welfare']),
            f('CON_ford_corporate_state', '福特统合国', '宪政国', 2, 9, 9, '让工程师与承包商财团成为日常政府。', [E.allI(1, 3), E.capI(1), E.ideo('fordism', '福特统合国', '福特统合国')], ['CON_ford_sociological']),
            // 横联：罗素参议员（x=1）
            f('CON_russell_dixiecrat', '罗素迪克西联盟', '宪政国', 1, 10, 8, '理查德·罗素牵头，把法统派与工业派缝进同一个迪克西联盟。', [E.ppCap(2), E.money(10), E.ideo('dixiecrat', '迪克西联盟', '迪克西联盟')], [], { prerequisiteAny: [['CON_odp_agrarian_order'], ['CON_ford_company_welfare']] }),
            // 指3：三K党（x=5 → 老/少壮 互斥）
            f('CON_klan_invisible_empire', '隐形帝国', '宪政国', 5, 5, 7, '把三K党重组为摄政府背后的隐形帝国。', [E.allT(1), E.crisis(2)], ['CON_jacksonian_doctrine'], { mutuallyExclusive: ['CON_odp_county_courts', 'CON_ford_industrial_party', 'CON_strongman_call'] }),
            f('CON_klan_grand_wizard', '大巫师集会', '宪政国', 5, 6, 7, '大巫师集会统一各地党团的纪律与暗号。', [E.pp(3), E.freeT(2)], ['CON_klan_invisible_empire']),
            f('CON_klan_old', '老三K党', '宪政国', 4, 7, 7, '依靠老式秘密会社与私刑维持乡村恐惧。', [E.allT(1), E.damage(1, 2)], ['CON_klan_grand_wizard'], { mutuallyExclusive: ['CON_klan_young'] }),
            f('CON_klan_young', '少壮K党', '宪政国', 6, 7, 7, '少壮派把三K党改造成现代群众政党。', [E.recruitAmount(1), E.allT(1)], ['CON_klan_grand_wizard'], { mutuallyExclusive: ['CON_klan_old'] }),
            f('CON_klan_night_riders', '夜骑士团', '宪政国', 4, 8, 8, '夜骑士团执行党直属的政治军事任务。', [E.gAtk(0.05), E.damage(1, 2)], ['CON_klan_old']),
            f('CON_klan_young_legions', '青年军团', '宪政国', 6, 8, 8, '青年军团把街头运动编成准军事力量。', [E.allT(1), E.freeT(3)], ['CON_klan_young']),
            f('CON_klan_imperial_congress', '帝国国会', '宪政国', 5, 9, 9, '隐形帝国召开帝国国会，正式接管国家机器。', [E.allCapT(3), E.gAtk(0.05), E.ideo('white_league', '白人帝国', '隐形帝国'), E.badge('隐形帝国')], [], { prerequisiteAny: [['CON_klan_night_riders'], ['CON_klan_young_legions']] }),
            // 指4：强人（x=8 → 基督教认同/巴顿 互斥）
            f('CON_strongman_call', '呼唤强人', '宪政国', 8, 5, 7, '南方宣言之后，各派开始呼唤一位收拾残局的强人。', [E.capT(2), E.crisis(2)], ['CON_southern_manifesto'], { mutuallyExclusive: ['CON_odp_county_courts', 'CON_ford_industrial_party', 'CON_klan_invisible_empire'] }),
            f('CON_white_citizens_council', '白人公民会', '宪政国', 9, 5, 7, '白人公民会用体面的方式组织抵抗与动员。', [E.allT(1), E.ppCap(2)], ['CON_southern_manifesto']),
            f('CON_christian_identity', '基督教认同', '宪政国', 7, 6, 7, '把白人福音派神学抬成国家意识形态。', [E.crisis(3), E.ppIncome(1)], ['CON_strongman_call'], { mutuallyExclusive: ['CON_patton_junta'] }),
            f('CON_patton_junta', '巴顿军政府', '宪政国', 9, 6, 7, '巴顿将军以铁腕接管摄政府。', [E.capT(3), E.gAtk(0.05)], ['CON_strongman_call'], { mutuallyExclusive: ['CON_christian_identity'] }),
            f('CON_ci_white_gospel', '白人福音', '宪政国', 7, 7, 8, '巡回布道把战争包装成净化与圣战。', [E.crisis(3), E.freeT(2)], ['CON_christian_identity']),
            f('CON_ci_dominion', '神权统治', '宪政国', 7, 8, 9, '基督教认同教团把南方变成一座神权堡垒。', [E.ppIncome(1), E.gDef(0.05), E.crisis(4), E.ideo('christian_identity', '基督教神权国', '神权国')], ['CON_ci_white_gospel']),
            f('CON_patton_martial_law', '军事戒严', '宪政国', 9, 7, 8, '全境实行戒严，军令直达每个县。', [E.allCapT(2), E.maint(-0.02)], ['CON_patton_junta']),
            f('CON_patton_caudillo', '南方军事强人', '宪政国', 9, 8, 9, '巴顿成为南方的军事强人，承认个人统治。', [E.gAtk(0.05), E.capT(3), E.allCapT(2), E.ideo('military_junta', '南方军政府', '南方军政府')], ['CON_patton_martial_law']),
            // 棕榈扇收束 capstone
            f('CON_constitutional_republic', '宪政美利坚共和国', '宪政国', 5, 11, 11, '无论由谁掌舵，深南方都凝成一个自认正统的宪政共和国。', [E.ppCap(3), E.pp(6), E.gDef(0.04), E.allCapT(3), E.badge('宪政美利坚共和国')], [], { prerequisiteAny: [['CON_odp_restored_republic'], ['CON_ford_corporate_state'], ['CON_klan_imperial_congress'], ['CON_ci_dominion'], ['CON_patton_caudillo'], ['CON_russell_dixiecrat']] }),

            // ===================== 右翼：黑人起义（Black Belt）｜形状＝上升闪电/握拳 =====================
            f('CON_black_revolt', '黑带起义', '黑人起义', 17, 2, 6, '宪政国的种族压迫走到尽头，黑带地区揭竿而起。', [E.recruitAmount(1), E.ppCap(2), E.crisis(3)], ['CON_constitutional_convention'], { mutuallyExclusive: ['CON_car_path'] }),
            f('CON_black_draft', '黑人征兵令', '黑人起义', 17, 3, 6, '起义后的第一道命令：是否征召黑人公民保卫新共和国。', [E.recruitAmount(1), E.allT(1)], ['CON_black_revolt']),
            // 中央拳核（trunk, x=17）
            f('CON_freedmens_congress', '自由民大会', '黑人起义', 17, 4, 6, '召集各地自由民代表组成临时大会。', [E.pp(3), E.ppCap(2)], ['CON_black_draft']),
            f('CON_forty_acres', '四十英亩与一头骡', '黑人起义', 17, 5, 7, '把没收的种植园分给起义者，兑现古老承诺。', [E.money(10), E.recruitCost(-1)], ['CON_freedmens_congress']),
            f('CON_black_belt_assembly', '黑带议会', '黑人起义', 17, 6, 7, '黑带议会成为各派系共同的政治中枢。', [E.ppIncome(1), E.freeT(2)], ['CON_forty_acres']),
            f('CON_great_migration', '大迁徙归乡', '黑人起义', 16, 4, 6, '号召北迁的黑人返乡，充实起义的人力。', [E.recruitAmount(1), E.freeT(2)], ['CON_black_draft']),
            // 线A：杜波依斯·泛非社会主义（x=13）
            f('CON_dubois_socialists', '杜波依斯社会党', '黑人起义', 13, 4, 7, 'W.E.B.杜波依斯把起义引向左翼泛非主义。', [E.recruitCost(-1), E.freeT(2)], ['CON_black_draft'], { mutuallyExclusive: ['CON_wilkins_democrats', 'CON_uplift_movement'] }),
            f('CON_talented_tenth', '天才十分之一', '黑人起义', 13, 5, 7, '培养受教育精英，作为新国家的骨干。', [E.ppCap(2), E.ppIncome(1)], ['CON_dubois_socialists']),
            f('CON_worker_solidarity', '工人团结', '黑人起义', 13, 6, 7, '以工人团结跨越肤色与地域。', [E.allT(1), E.recruitAmount(1)], ['CON_talented_tenth']),
            f('CON_cooperative_economy', '合作社经济', '黑人起义', 13, 7, 8, '以合作社与集体农场重建黑带经济。', [E.allI(1, 2), E.moneyIncome(1)], ['CON_worker_solidarity']),
            f('CON_abb_brotherhood', '非洲血缘兄弟会', '黑人起义', 12, 8, 8, 'ABB 把合作社经济武装成激进的革命民兵。', [E.allT(1), E.gAtk(0.05)], ['CON_cooperative_economy']),
            f('CON_pan_african_socialism', '泛非社会主义', '黑人起义', 13, 8, 9, '泛非社会主义成为黑带共和国的国家形态。', [E.recruitAmount(2), E.freeT(3), E.ideo('pan_africanism', '泛非社会主义共和国', '泛非共和国')], ['CON_cooperative_economy']),
            f('CON_sharecropper_union', '佃农工会', '黑人起义', 14, 6, 7, '把佃农组织进战时工会，稳定粮食与人力。', [E.recruitCost(-1), E.allT(1)], ['CON_talented_tenth']),
            f('CON_negro_leagues', '黑人社区联盟', '黑人起义', 14, 7, 7, '以社区联盟与球赛凝聚后方士气。', [E.pp(3), E.crisis(2)], ['CON_sharecropper_union']),
            // 线B：威尔金斯·进步民主（x=15）
            f('CON_wilkins_democrats', '威尔金斯民主派', '黑人起义', 15, 4, 7, '罗伊·威尔金斯主张走选举与公民权利的进步道路。', [E.pp(4), E.ppCap(2)], ['CON_black_draft'], { mutuallyExclusive: ['CON_dubois_socialists', 'CON_uplift_movement'] }),
            f('CON_civil_rights_charter', '公民权利宪章', '黑人起义', 15, 5, 7, '颁布一份保障平等的公民权利宪章。', [E.ppIncome(1), E.pp(3)], ['CON_wilkins_democrats']),
            f('CON_black_ballot', '黑人选举权', '黑人起义', 15, 6, 7, '在战时仍保留选举与司法审查。', [E.ppCap(2), E.crisis(2)], ['CON_civil_rights_charter']),
            f('CON_freedmen_schools', '自由民学校', '黑人起义', 15, 7, 8, '兴办自由民学校，培养公民与技工。', [E.moneyIncome(1), E.ppIncome(1)], ['CON_black_ballot']),
            f('CON_progressive_black_republic', '进步黑带共和', '黑人起义', 15, 8, 9, '把改革传统升格为进步民主的国家身份。', [E.ppCap(3), E.pp(5), E.ideo('progressive_democracy', '进步黑带共和国', '进步共和国')], ['CON_freedmen_schools']),
            // 线C：加维 UNIA / 伊斯兰国度（x=19 → 互斥）
            f('CON_uplift_movement', '黑人提升运动', '黑人起义', 19, 4, 7, '黑人提升运动在自助与信仰之间寻找方向。', [E.pp(3), E.ppCap(2)], ['CON_black_draft'], { mutuallyExclusive: ['CON_dubois_socialists', 'CON_wilkins_democrats'] }),
            f('CON_garvey_unia', '加维UNIA', '黑人起义', 19, 5, 7, '马库斯·加维的 UNIA 主张返非建国。', [E.money(10), E.tagInc('港口', 1)], ['CON_uplift_movement'], { mutuallyExclusive: ['CON_noi_nation'] }),
            f('CON_noi_nation', '伊斯兰国度', '黑人起义', 21, 5, 7, '伊斯兰国度以信仰与纪律自立社区。', [E.recruitAmount(1), E.crisis(2)], ['CON_uplift_movement'], { mutuallyExclusive: ['CON_garvey_unia'] }),
            f('CON_unia_black_star', '黑星航运', '黑人起义', 19, 6, 7, '黑星航运把海岸贸易掌握在自己手里。', [E.tagT('港口', 1), E.money(8)], ['CON_garvey_unia']),
            f('CON_unia_back_to_africa', '返非运动', '黑人起义', 19, 7, 8, '组织志愿者与资源，启动返非计划。', [E.freeT(2), E.tagInc('港口', 1)], ['CON_unia_black_star']),
            f('CON_unia_liberia_pact', '利比里亚协定', '黑人起义', 19, 8, 9, '与利比里亚结盟，建立跨大西洋的黑人国家网络。', [E.moneyIncome(1), E.tagT('港口', 1), E.ideo('garveyism', '黑星-利比里亚联盟', '黑星联盟')], ['CON_unia_back_to_africa']),
            f('CON_noi_self_reliance', '自立社区', '黑人起义', 21, 6, 7, '以自营商铺与农场支撑社区财政。', [E.moneyIncome(1), E.freeT(2)], ['CON_noi_nation']),
            f('CON_noi_fruit', '伊斯兰之果民兵', '黑人起义', 21, 7, 8, '伊斯兰之果把信徒训练成纪律严明的民兵。', [E.allT(1), E.gAtk(0.05)], ['CON_noi_self_reliance']),
            f('CON_noi_nation_state', '信仰国度', '黑人起义', 21, 8, 9, '把黑带打造成一个信仰立国的国度。', [E.freeT(3), E.crisis(3), E.ideo('black_nationalism', '伊斯兰信仰国度', '信仰国度')], ['CON_noi_fruit']),
            // 握拳收束 capstone + Sun Ra 支线
            f('CON_black_belt_republic', '黑带共和国', '黑人起义', 17, 10, 11, '各派系在同一面旗下结成黑带共和国。', [E.recruitAmount(2), E.ppCap(3), E.allCapT(3), E.badge('黑带共和国'), E.ideo('black_belt', '黑带共和国', '黑带共和国')], [], { prerequisiteAny: [['CON_pan_african_socialism'], ['CON_abb_brotherhood'], ['CON_progressive_black_republic'], ['CON_unia_liberia_pact'], ['CON_noi_nation_state'], ['CON_black_belt_assembly']] }),
            f('CON_sun_ra_arkestra', '太阳神拉星际方舟', '黑人起义', 17, 11, 12, '太阳神拉把黑带共和国想象成一艘驶向群星的方舟。', [E.ppIncome(1), E.freeT(4), E.crisis(4), E.badge('宇宙黑人国'), E.ideo('afrofuturism', '宇宙黑人国', '星际方舟')], ['CON_black_belt_republic']),

            // ===================== 政治终局：两翼合流 =====================
            f('CON_southern_destiny', '南方命运', '政治路线', 11, 12, 12, '无论宪政国还是黑带共和，深南方都走上了一条不可逆的国家道路。', [E.ppIncome(1), E.allCapT(3), E.gDef(0.04), E.badge('南方命运')], [], { prerequisiteAny: [['CON_constitutional_republic'], ['CON_black_belt_republic']] }),

            // ===================== 支线·军事：南方军｜形状＝三叉戟/箭簇 =====================
            f('CON_general_staff', '亚特兰大总参', '南方军', 27, 1, 5, '用内线交通和南方城市群建立指挥体系。', [E.capT(3)], ['CON_emergency_regency']),
            f('CON_state_guard', '州卫队体系', '南方军', 24, 2, 6, '强化地方守备与州卫队编成。', [E.recruitAmount(1), E.gDef(0.05)], ['CON_general_staff']),
            f('CON_regular_corps', '正规军核心', '南方军', 27, 2, 6, '把精锐集中到少数可控军团。', [E.capT(4), E.gAtk(0.05)], ['CON_general_staff']),
            f('CON_woodland_partisans', '林地反游击', '南方军', 30, 2, 6, '组建适合南方林地与沼泽的清剿部队。', [E.actionCost('move', -1), E.damage(1, 2)], ['CON_general_staff']),
            f('CON_provost_network', '宪兵网络', '南方军', 25, 3, 6, '在铁路与城市部署宪兵检查站。', [E.allT(1), E.maint(-0.02)], ['CON_general_staff']),
            f('CON_railroad_movement', '铁路机动', '南方军', 26, 3, 6, '用军列实现快速的内线兵力调度。', [E.actionCost('move', -1), E.capT(2)], ['CON_general_staff']),
            f('CON_signal_corps', '通信兵团', '南方军', 28, 3, 6, '统一战时通信，缩短指挥链。', [E.allCapT(2), E.actionCost('focus', -1)], ['CON_general_staff']),
            f('CON_ranger_school', '游骑兵学校', '南方军', 29, 3, 6, '训练适合长距离突袭的游骑兵。', [E.gAtk(0.05), E.allT(1)], ['CON_general_staff']),
            f('CON_guard_training', '州卫队教导团', '南方军', 24, 3, 6, '把州卫队整训到能上前线的水平。', [E.allT(1), E.freeT(2)], ['CON_state_guard']),
            f('CON_local_defense', '地方防卫司令部', '南方军', 24, 4, 7, '让州卫队、宪兵与民兵共用指挥。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['CON_guard_training']),
            f('CON_home_guard', '乡土守备司令部', '南方军', 24, 5, 7, '把城乡守备并入统一司令部。', [E.gDef(0.05), E.allT(1)], ['CON_local_defense']),
            f('CON_fortified_towns', '设防城镇', '南方军', 24, 6, 8, '把关键城镇要塞化为防御纵深。', [E.gDef(0.05), E.allCapT(2)], ['CON_home_guard']),
            f('CON_officer_school', '军官学校', '南方军', 27, 3, 6, '建立面向集团军级的军官学校。', [E.capT(3), E.allT(1)], ['CON_regular_corps']),
            f('CON_corps_command', '集团军指挥所', '南方军', 27, 4, 7, '在亚特兰大建立可运转集团军的指挥所。', [E.gAtk(0.05), E.actionCost('move', -1)], ['CON_officer_school']),
            f('CON_armored_punch', '装甲反击拳', '南方军', 27, 5, 7, '保留少数装甲拳头，等待集中反击。', [E.gAtk(0.05), E.capT(3)], ['CON_corps_command']),
            f('CON_regular_doctrine', '正规战条令', '南方军', 27, 6, 8, '完成深南方守势-反击的正规战条令。', [E.gAtk(0.05), E.allCapT(2)], ['CON_armored_punch']),
            f('CON_swamp_scouts', '沼泽斥候', '南方军', 30, 3, 6, '在河口沼泽雇佣熟悉地形的斥候。', [E.actionCost('move', -1), E.allT(1)], ['CON_woodland_partisans']),
            f('CON_counter_guerrilla', '清剿队', '南方军', 30, 4, 7, '专打渗透与破坏交通线的小股敌人。', [E.damage(1, 2), E.maint(-0.02)], ['CON_swamp_scouts']),
            f('CON_mountain_ambush', '山口伏击', '南方军', 30, 5, 7, '把阿巴拉契亚山口变成伏击场。', [E.gDef(0.05), E.damage(1, 2)], ['CON_counter_guerrilla']),
            f('CON_partisan_doctrine', '反游击条令', '南方军', 30, 6, 8, '把林地清剿与伏击编成成体系的条令。', [E.gAtk(0.05), E.maint(-0.02)], ['CON_mountain_ambush']),
            f('CON_engineer_corps', '工兵团', '南方军', 25, 5, 7, '工兵团修筑工事、桥梁与障碍。', [E.gDef(0.05), E.actionCost('build', -1)], ['CON_local_defense']),
            f('CON_logistics_command', '后勤司令部', '南方军', 29, 5, 7, '统一前线补给与轮换。', [E.maint(-0.02), E.allT(1)], ['CON_counter_guerrilla']),
            f('CON_carolina_battle_plan', '卡罗来纳战役计划', '南方军', 27, 7, 10, '把三支劲旅纳入统一的深南方战役计划。', [E.gDef(0.05), E.capT(4), E.allCapT(2)], [], { prerequisiteAny: [['CON_fortified_towns'], ['CON_regular_doctrine'], ['CON_partisan_doctrine']] }),
            f('CON_southern_army_command', '南方军总司令部', '南方军', 27, 8, 11, '南方军成为可独立支撑长期内战的战争机器。', [E.gAtk(0.05), E.allCapT(3), E.capTroop(1)], ['CON_carolina_battle_plan']),

            // ===================== 支线·经济：深南方｜形状＝梯子/H（双轨+横档） =====================
            f('CON_war_committee', '亚特兰大战时委员会', '深南方', 36, 1, 5, '协调铁路、钢铁、港口与内陆工坊。', [E.money(16), E.tagInc('港口', 1)], ['CON_emergency_regency']),
            f('CON_cotton_bonds', '棉花债券', '深南方', 36, 2, 6, '以棉花期票发行战争债券。', [E.bonds(25, 4, 3), E.moneyIncome(1)], ['CON_war_committee']),
            f('CON_rail_steel_link', '钢运联调', '深南方', 36, 3, 6, '把铁路资本与内陆兵工拧成一条调度链（横档）。', [E.maint(-0.02), E.allI(1, 2)], ['CON_railroad_capital', 'CON_inland_arsenal_base']),
            f('CON_central_depot', '中央补给站', '深南方', 36, 4, 7, '在亚特兰大建立中央补给与转运站。', [E.allI(1, 2), E.actionCost('build', -1)], ['CON_cotton_bonds']),
            f('CON_port_power_grid', '港电联调', '深南方', 36, 5, 7, '把机修产能与高炉电力协同调度（横档）。', [E.moneyIncome(1), E.maint(-0.02)], ['CON_machine_shops', 'CON_birmingham_furnaces']),
            f('CON_quartermaster', '军需总监部', '深南方', 36, 6, 7, '统一军需的采购、配给与库存。', [E.allI(1, 3), E.freeT(2)], ['CON_central_depot']),
            f('CON_war_treasury', '战时金库', '深南方', 36, 7, 8, '建立战时预算与维护费优先级。', [E.moneyIncome(2), E.bonds(30, 5, 4)], ['CON_quartermaster']),
            f('CON_deep_south_production', '深南方总生产', '深南方', 36, 8, 11, '把经济线转化为可支撑长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 4), E.tagInc('港口', 1)], [], { prerequisiteAny: [['CON_rolling_stock'], ['CON_shell_plant'], ['CON_war_treasury']] }),
            // 左轨：铁路资本（x=34）
            f('CON_railroad_capital', '铁路资本', '深南方', 34, 2, 6, '以铁路资本推动军运与维修。', [E.moneyIncome(1), E.maint(-0.02)], ['CON_war_committee']),
            f('CON_railroad_bonds', '铁路债券', '深南方', 34, 3, 6, '发行铁路债券支持军运。', [E.bonds(25, 4, 3), E.tagInc('港口', 1)], ['CON_railroad_capital']),
            f('CON_machine_shops', '机修厂扩建', '深南方', 34, 4, 7, '扩建关键铁路机修厂。', [E.allI(1, 3), E.actionCost('build', -1)], ['CON_railroad_bonds']),
            f('CON_rail_priority', '南方铁路优先', '深南方', 34, 5, 7, '给军列与军需运输设置优先级。', [E.maint(-0.02), E.money(12)], ['CON_machine_shops']),
            f('CON_logistics_hub', '后勤枢纽', '深南方', 34, 6, 7, '把铁路网收束成统一的后勤枢纽。', [E.maint(-0.02), E.allI(1, 2)], ['CON_rail_priority']),
            f('CON_rolling_stock', '机车车辆厂', '深南方', 34, 7, 8, '自产机车与车厢，摆脱对外依赖。', [E.nodeI('ATL', 1), E.allI(1, 3)], ['CON_logistics_hub']),
            // 右轨：内陆兵工（x=38）
            f('CON_inland_arsenal_base', '内陆兵工', '深南方', 38, 2, 6, '把伯明翰与亚特兰大变成稳定兵工链。', [E.allI(1, 2), E.capBoost(1, 1)], ['CON_war_committee']),
            f('CON_steel_contracts', '钢铁合同', '深南方', 38, 3, 6, '对伯明翰钢厂下达战时合同。', [E.nodeI('BHM', 1), E.money(15)], ['CON_inland_arsenal_base']),
            f('CON_birmingham_furnaces', '伯明翰高炉', '深南方', 38, 4, 7, '点燃更多高炉，把钢产能推到极限。', [E.allI(1, 3), E.capI(1)], ['CON_steel_contracts']),
            f('CON_ammunition_lines', '弹药生产线', '深南方', 38, 5, 7, '建立稳定的弹药与引信生产线。', [E.allI(1, 3), E.capBoost(1, 2)], ['CON_birmingham_furnaces']),
            f('CON_artillery_works', '火炮厂', '深南方', 38, 6, 7, '集中生产火炮与炮架。', [E.allI(1, 2), E.gAtk(0.05)], ['CON_ammunition_lines']),
            f('CON_shell_plant', '炮弹总厂', '深南方', 38, 7, 8, '把炮弹产量提升到可支撑长期炮战。', [E.nodeI('BHM', 1), E.allI(1, 3)], ['CON_artillery_works']),
            // 左外柱：种植园金融（x=32）
            f('CON_planter_credit', '种植园信贷', '深南方', 32, 3, 6, '用种植园资产做抵押，扩大战时信贷。', [E.moneyIncome(1), E.money(10)], ['CON_railroad_capital']),
            f('CON_cotton_exchange', '棉花交易所', '深南方', 32, 4, 7, '重开棉花交易所，把棉价变成现金流。', [E.tagInc('港口', 1), E.moneyIncome(1)], ['CON_planter_credit']),
            f('CON_war_bonds_drive', '战债募集', '深南方', 32, 5, 7, '向忠诚城市与富豪发行战争债券。', [E.bonds(30, 4, 3), E.money(12)], ['CON_cotton_exchange']),
            // 右外柱：军工财阀（x=40）
            f('CON_contractor_guild', '承包商公会', '深南方', 40, 3, 6, '把军工承包商组织进战时公会。', [E.moneyIncome(1), E.allI(1, 2)], ['CON_inland_arsenal_base']),
            f('CON_black_budget', '军工黑预算', '深南方', 40, 4, 7, '用秘密预算直接喂给钢铁与军火承包商。', [E.allI(1, 3), E.bonds(25, 4, 3)], ['CON_contractor_guild']),
            f('CON_munitions_trust', '军火托拉斯', '深南方', 40, 5, 8, '把分散军火厂整合成统一托拉斯。', [E.moneyIncome(2), E.allI(1, 3)], ['CON_black_budget']),

            // ===================== 支线·地区：南大西洋｜形状＝菱形（海岸/内陆分再合） =====================
            f('CON_south_atlantic_policy', '南大西洋政策', '南大西洋', 46, 1, 5, '决定重心放在海岸港口、内陆边界，还是外交。', [E.money(10), E.pp(3)], ['CON_emergency_regency']),
            f('CON_coast_security', '海岸安全', '南大西洋', 44, 2, 6, '优先掌控萨凡纳、杰克逊维尔与诺福克方向。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['CON_south_atlantic_policy']),
            f('CON_regional_office', '南大西洋外交局', '南大西洋', 46, 2, 6, '设立外交局，寻找外部承认与援助。', [E.money(10), E.pp(3)], ['CON_south_atlantic_policy']),
            f('CON_inland_buffer', '内陆缓冲', '南大西洋', 48, 2, 6, '在阿巴拉契亚与密西西比边缘建立缓冲。', [E.money(12), E.allT(1)], ['CON_south_atlantic_policy']),
            f('CON_port_liaisons', '港口联络官', '南大西洋', 44, 3, 6, '在沿海各港派出长期联络官。', [E.tagInc('港口', 1), E.tagMoney('港口', 6)], ['CON_coast_security']),
            f('CON_coastal_supply', '海岸补给线', '南大西洋', 44, 4, 7, '让港口构成稳定补给走廊。', [E.actionCost('recruit', -1), E.capT(2)], ['CON_port_liaisons']),
            f('CON_savannah_charter', '萨凡纳特许', '南大西洋', 44, 5, 7, '给萨凡纳颁发战时港口特许，换取现金与忠诚。', [E.tagInc('港口', 1), E.tagD('港口', 0.05)], ['CON_coastal_supply']),
            f('CON_mountain_scouts', '山地斥候', '南大西洋', 48, 3, 6, '在阿巴拉契亚雇佣山地斥候。', [E.crisis(3), E.damage(1, 2)], ['CON_inland_buffer']),
            f('CON_inland_defense_line', '内陆防线', '南大西洋', 48, 4, 7, '把内陆河谷打造成防御纵深。', [E.gDef(0.05), E.tagD('港口', 0.05)], ['CON_mountain_scouts']),
            f('CON_blue_ridge_forts', '蓝岭要塞', '南大西洋', 48, 5, 7, '在蓝岭山口修筑要塞链。', [E.gDef(0.05), E.allT(1)], ['CON_inland_defense_line']),
            f('CON_british_blockade_talks', '英帝国封锁谈判', '南大西洋', 46, 3, 6, '与英帝国就封锁与通商展开谈判。', [E.money(12), E.tagInc('港口', 1)], ['CON_regional_office']),
            f('CON_csa_ceasefire', '对工团停火', '南大西洋', 45, 4, 7, '与北方工团达成局部停火，腾出兵力。', [E.pp(3), E.crisis(3)], ['CON_british_blockade_talks']),
            f('CON_german_arms', '德援军火', '南大西洋', 47, 4, 7, '争取德意志的军火与技术援助。', [E.allI(1, 2), E.money(12)], ['CON_british_blockade_talks']),
            f('CON_neutral_recognition', '中立国承认', '南大西洋', 46, 4, 7, '争取中立国对摄政府的外交承认。', [E.pp(4), E.ppCap(2)], ['CON_british_blockade_talks']),
            f('CON_florida_ports', '佛州港群', '南大西洋', 44, 6, 7, '把佛州港群接入海岸补给走廊。', [E.tagT('港口', 1), E.tagMoney('港口', 6)], ['CON_savannah_charter']),
            f('CON_appalachian_redoubt', '阿巴拉契亚堡垒', '南大西洋', 48, 6, 7, '把山地防线收束成最后的内陆堡垒。', [E.gDef(0.05), E.freeT(2)], ['CON_blue_ridge_forts']),
            f('CON_south_atlantic_strategy', '南大西洋战略', '南大西洋', 46, 6, 10, '把海岸、内陆与外交收束成最终战略。', [E.pp(5), E.actionCost('all', -1), E.capTroop(1)], [], { prerequisiteAny: [['CON_savannah_charter'], ['CON_blue_ridge_forts'], ['CON_neutral_recognition']] }),
            f('CON_south_atlantic_command', '南大西洋战区', '南大西洋', 46, 7, 11, '把南大西洋变成摄政府稳固的战略后院。', [E.tagT('港口', 2), E.allCapT(2), E.gDef(0.04)], ['CON_south_atlantic_strategy']),

            // ===================== 支线·社会：秩序与信仰｜形状＝王冠（长柄+三冠点） =====================
            f('CON_southern_radio', '南方秩序广播', '秩序信仰', 55, 1, 5, '统一战时叙事，把南方秩序卖给每座城镇。', [E.pp(3), E.money(8)], ['CON_emergency_regency']),
            f('CON_church_network', '教会网络', '秩序信仰', 55, 2, 6, '把南方各教会编进战时动员网络。', [E.ppIncome(1), E.crisis(2)], ['CON_southern_radio']),
            f('CON_pulpit_press', '讲坛报刊', '秩序信仰', 55, 3, 6, '让讲坛与报刊共同主导舆论。', [E.pp(3), E.ppCap(2)], ['CON_church_network']),
            f('CON_radio_ministry', '广播布道团', '秩序信仰', 56, 3, 6, '组建专职广播布道团，覆盖偏远县镇。', [E.pp(3), E.crisis(2)], ['CON_church_network']),
            f('CON_revival_circuit', '福音复兴巡回', '秩序信仰', 53, 4, 7, '巡回布道点燃后方的宗教热情。', [E.ppIncome(1), E.crisis(3)], ['CON_pulpit_press']),
            f('CON_cotton_culture', '棉花文化', '秩序信仰', 55, 4, 7, '把棉花经济包装成南方的文化骄傲。', [E.pp(3), E.ppIncome(1)], ['CON_pulpit_press']),
            f('CON_war_archives', '战时档案局', '秩序信仰', 57, 4, 7, '建立战时档案与安全审查流程。', [E.maint(-0.02), E.crisis(3)], ['CON_pulpit_press']),
            f('CON_tent_revivals', '帐篷布道', '秩序信仰', 53, 5, 7, '帐篷布道把宗教热情转成战时动员。', [E.crisis(3), E.freeT(2)], ['CON_revival_circuit']),
            f('CON_moral_order', '道德秩序', '秩序信仰', 53, 6, 8, '以道德秩序把民众绑在政府周围。', [E.ppIncome(1), E.gDef(0.05)], ['CON_tent_revivals']),
            f('CON_plantation_myth', '种植园神话', '秩序信仰', 55, 5, 7, '用田园神话美化旧南方秩序。', [E.pp(3), E.crisis(2)], ['CON_cotton_culture']),
            f('CON_lost_cause', '失败的伟业', '秩序信仰', 55, 6, 8, '把战争叙事编成"失败的伟业"式的民族神话。', [E.ppCap(2), E.ppIncome(1)], ['CON_plantation_myth']),
            f('CON_censorship_bureau', '审查局', '秩序信仰', 57, 5, 7, '用许可与审查控制政治宣传。', [E.maint(-0.02), E.crisis(3)], ['CON_war_archives']),
            f('CON_loyalty_files', '忠诚档案', '秩序信仰', 57, 6, 8, '建立覆盖官员与军官的忠诚档案。', [E.maint(-0.03), E.gDef(0.05)], ['CON_censorship_bureau']),
            f('CON_womens_auxiliary', '妇女后援会', '秩序信仰', 54, 5, 7, '妇女后援会承担募捐、护理与后方动员。', [E.recruitAmount(1), E.crisis(2)], ['CON_revival_circuit']),
            f('CON_veterans_league', '老兵联盟', '秩序信仰', 56, 5, 7, '老兵联盟成为政府最坚定的群众基础。', [E.allT(1), E.ppCap(2)], ['CON_cotton_culture']),
            f('CON_southern_spirit', '南方精神总动员', '秩序信仰', 55, 7, 10, '宣传、信仰与档案合成一场南方精神总动员。', [E.ppCap(3), E.gDef(0.05), E.allCapT(3), E.badge('南方精神总动员')], [], { prerequisiteAny: [['CON_moral_order'], ['CON_lost_cause'], ['CON_loyalty_files']] })
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
