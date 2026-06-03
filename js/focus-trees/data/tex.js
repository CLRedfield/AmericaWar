// 国策数据：TEX（德克萨斯共和国 / KX Republic of Texas）。
// 手工布局：每条线一种独立轮廓，坐标在此即最终位置（TEX 已从所有后处理器中排除）。
// 政治线＝4 选 1 互斥：石油寡头(油井塔架) / 帕皮民粹(广播塔) / 新政民主(议会穹顶) / 孤星共和(五角星)。
// 支线：游骑兵军务(锋矢) / 石油经济(管线梯子H) / 边境外交(菱形) / 边疆社会(王冠)。终局合流孤星授权。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.TEX = function (f, E) {
        const POL_ME = ['TEX_oil_barons', 'TEX_pappy_odaniel', 'TEX_texas_democrats', 'TEX_lone_star_republic'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 独立大会（4 线分叉柄） =====================
            f('TEX_provisional_government', '达拉斯临时政府', '战时统合', 13, 0, 4, '德克萨斯用石油、民兵和边境政治撑起独立战争机器。', [E.pp(4), E.tagInc('油田', 1)]),
            f('TEX_state_convention', '德州独立大会', '政治路线', 13, 1, 5, '临时政府要在石油寡头、帕皮民粹、新政民主与孤星共和之间定型。', [E.pp(3), E.tagInc('油田', 1)], ['TEX_provisional_government']),

            // ===================== 线 A：石油寡头（德士古）｜形状＝油井塔架 derrick =====================
            f('TEX_oil_barons', '石油寡头入主', '石油寡头', 3, 2, 6, '让油田、银行和德士古财团成为国家支柱。', [E.money(14), E.tagInc('油田', 1)], ['TEX_state_convention'], meOthers('TEX_oil_barons')),
            f('TEX_texaco_board', '德士古董事会', '石油寡头', 3, 3, 6, '里伯的德士古董事会接管战时油政。', [E.moneyIncome(1), E.tagInc('油田', 1)], ['TEX_oil_barons']),
            f('TEX_oil_security', '油田保安队', '石油寡头', 2, 3, 6, '为油井部署私募保安队。', [E.tagT('油田', 1), E.tagD('油田', 0.10)], ['TEX_oil_barons']),
            f('TEX_refinery_ring', '炼厂环线', '石油寡头', 4, 3, 6, '把沿海炼厂串成一条环线。', [E.allI(1, 2), E.capBoost(1, 1)], ['TEX_oil_barons']),
            f('TEX_oil_levies', '油税征收', '石油寡头', 2, 4, 6, '对每桶原油课征战时油税。', [E.money(12), E.bonds(30, 4, 3)], ['TEX_oil_security']),
            f('TEX_pipeline_trust', '管线托拉斯', '石油寡头', 4, 4, 6, '把输油管线并进单一托拉斯。', [E.moneyIncome(1), E.tagMoney('油田', 6)], ['TEX_refinery_ring']),
            f('TEX_rieber_consolidation', '里伯整合', '石油寡头', 3, 4, 7, '托尔基尔·里伯吞并竞争对手，独霸油政。', [E.moneyIncome(1), E.money(10)], ['TEX_texaco_board']),
            f('TEX_oil_assembly', '石油议会', '石油寡头', 3, 5, 7, '把油田、银行与铁路代表编成战时议会。', [E.moneyIncome(1), E.ppCap(2)], ['TEX_rieber_consolidation']),
            f('TEX_drilling_boom', '钻探热潮', '石油寡头', 3, 6, 7, '在东德州掀起一场战时钻探热潮。', [E.tagInc('油田', 1), E.money(10)], ['TEX_oil_assembly']),
            // 塔架顶部分叉：卡特尔（财阀）vs 政变（军方）
            f('TEX_oil_cartel', '石油卡特尔', '石油寡头', 2, 6, 7, '德士古联合各大油商组成卡特尔。', [E.moneyIncome(2), E.tagInc('油田', 1)], ['TEX_oil_assembly'], { mutuallyExclusive: ['TEX_oil_coup'] }),
            f('TEX_oil_coup', '石油军政变', '石油寡头', 4, 6, 7, '德士古发动政变，扶植军方接管政府。', [E.capT(3), E.gAtk(0.05)], ['TEX_oil_assembly'], { mutuallyExclusive: ['TEX_oil_cartel'] }),
            f('TEX_petro_bonds', '石油债券', '石油寡头', 2, 7, 7, '以未来油税发行高息战争债券。', [E.bonds(35, 5, 4), E.tagMoney('油田', 8)], ['TEX_oil_cartel']),
            f('TEX_corporatocracy', '石油财阀国', '石油寡头', 2, 8, 9, '把德州变成由油田财团运营的财阀政体。', [E.moneyIncome(2), E.actionCost('build', -1), E.tagInc('油田', 2), E.ideo('plutocracy', '德克萨斯石油寡头国', '石油寡头国')], ['TEX_petro_bonds']),
            f('TEX_eaker_command', '伊克航空指挥', '石油寡头', 4, 7, 7, '让艾拉·伊克与尼米兹这样的军官掌握指挥权。', [E.gAtk(0.05), E.capT(2)], ['TEX_oil_coup']),
            f('TEX_oil_junta', '石油军政府', '石油寡头', 4, 8, 9, '油钱供养一支由军官统治的政府。', [E.capT(3), E.allCapT(2), E.gAtk(0.05), E.ideo('military_junta', '德克萨斯军政府', '军政府')], ['TEX_eaker_command']),
            f('TEX_petroleum_state', '石油国家', '石油寡头', 3, 9, 11, '无论财阀还是军政，石油都成了德州的财政宪法。', [E.moneyIncome(2), E.tagInc('油田', 2), E.allCapT(2), E.badge('石油国家')], [], { prerequisiteAny: [['TEX_corporatocracy'], ['TEX_oil_junta']] }),

            // ===================== 线 B：帕皮·奥丹尼尔民粹｜形状＝广播塔 + 电波 =====================
            f('TEX_pappy_odaniel', '帕皮·奥丹尼尔', '帕皮民粹', 9, 2, 6, '"帕皮" W.李·奥丹尼尔用广播与面粉把民粹送进政治。', [E.pp(3), E.recruitAmount(1)], ['TEX_state_convention'], meOthers('TEX_pappy_odaniel')),
            f('TEX_hillbilly_flour', '山地面粉公司', '帕皮民粹', 9, 3, 6, '用山地面粉公司的钱与名气撑起政治机器。', [E.money(10), E.ppIncome(1)], ['TEX_pappy_odaniel']),
            f('TEX_radio_pulpit', '广播讲坛', '帕皮民粹', 9, 4, 6, '把电台变成布道与拉票的讲坛。', [E.pp(4), E.crisis(2)], ['TEX_hillbilly_flour']),
            f('TEX_light_crust', '轻壳乐队', '帕皮民粹', 8, 4, 6, '轻壳面包小子乐队为竞选巡演伴奏。', [E.recruitAmount(1), E.freeT(2)], ['TEX_hillbilly_flour']),
            f('TEX_biscuit_populism', '饼干民粹', '帕皮民粹', 10, 4, 6, '"把饼干传过来"成了全州的口号。', [E.pp(3), E.money(8)], ['TEX_hillbilly_flour']),
            f('TEX_radio_machine', '广播机器', '帕皮民粹', 9, 5, 7, '把电台网络整合成统一的政治广播机器。', [E.pp(4), E.ppCap(2)], ['TEX_radio_pulpit']),
            f('TEX_prairie_revival', '草原复兴', '帕皮民粹', 7, 5, 7, '巡回布道把草原小镇动员起来。', [E.crisis(3), E.recruitCost(-1)], ['TEX_light_crust']),
            f('TEX_main_street_clubs', '大街俱乐部', '帕皮民粹', 11, 5, 7, '小城镇的大街俱乐部成为基层网络。', [E.ppIncome(1), E.recruitAmount(1)], ['TEX_biscuit_populism']),
            f('TEX_radio_network', '广播总网', '帕皮民粹', 9, 6, 7, '把全州电台并成一张广播总网。', [E.pp(3), E.ppIncome(1)], ['TEX_radio_machine']),
            f('TEX_dust_bowl_relief', '沙尘暴救济', '帕皮民粹', 7, 6, 7, '在沙尘暴灾区发放救济，收拢小农人心。', [E.moneyIncome(1), E.freeT(3)], ['TEX_prairie_revival']),
            f('TEX_county_machines', '县级机器', '帕皮民粹', 11, 6, 7, '在各县建立听命于帕皮的政治机器。', [E.recruitAmount(1), E.pp(3)], ['TEX_main_street_clubs']),
            // 广播塔分叉：奥丹尼尔执政 vs 草根军团
            f('TEX_odaniel_governor', '奥丹尼尔执政', '帕皮民粹', 8, 6, 7, '帕皮亲自出任州长，把广播机器变成政府。', [E.ppCap(2), E.ppIncome(1)], ['TEX_radio_machine'], { mutuallyExclusive: ['TEX_grassroots_legion'] }),
            f('TEX_grassroots_legion', '草根军团', '帕皮民粹', 10, 6, 7, '把听众组织成草根动员军团。', [E.recruitAmount(1), E.allT(1)], ['TEX_radio_machine'], { mutuallyExclusive: ['TEX_odaniel_governor'] }),
            f('TEX_ten_commandments', '十诫纲领', '帕皮民粹', 8, 7, 8, '用"十诫与黄金法则"包装施政纲领。', [E.pp(4), E.crisis(2)], ['TEX_odaniel_governor']),
            f('TEX_pass_the_biscuits', '把饼干传过来', '帕皮民粹', 10, 7, 8, '把口号变成全州动员的草根运动。', [E.freeT(3), E.recruitCost(-1)], ['TEX_grassroots_legion']),
            f('TEX_lone_star_populism', '孤星民粹', '帕皮民粹', 9, 8, 11, '把广播民粹写成孤星共和国的国家理念。', [E.ppIncome(1), E.ppCap(3), E.pp(5), E.ideo('populism', '德克萨斯帕皮国', '帕皮国'), E.badge('孤星民粹')], [], { prerequisiteAny: [['TEX_ten_commandments'], ['TEX_pass_the_biscuits']] }),

            // ===================== 线 C：新政民主（奥尔雷德/加纳/约翰逊）｜形状＝议会穹顶 dome =====================
            f('TEX_texas_democrats', '德州民主党', '新政民主', 16, 2, 6, '以临时宪法和选举制度争取广泛承认。', [E.pp(3), E.ppCap(2)], ['TEX_state_convention'], meOthers('TEX_texas_democrats')),
            f('TEX_independence_party', '德州独立党', '新政民主', 16, 3, 6, '奥尔雷德倒戈，成立支持独立的德州独立党。', [E.pp(3), E.ppIncome(1)], ['TEX_texas_democrats']),
            f('TEX_garner_oldguard', '加纳保守派', '新政民主', 14, 4, 6, '"仙人掌杰克"加纳代表党内保守老派。', [E.moneyIncome(1), E.ppCap(2)], ['TEX_independence_party']),
            f('TEX_allred_liberals', '奥尔雷德自由派', '新政民主', 16, 4, 6, '詹姆斯·奥尔雷德领导新政自由派。', [E.ppIncome(1), E.pp(3)], ['TEX_independence_party']),
            f('TEX_young_turks', '青年新政派', '新政民主', 18, 4, 6, '一批青年议员主张更激进的新政。', [E.recruitAmount(1), E.pp(3)], ['TEX_independence_party']),
            f('TEX_county_conventions', '县代表大会', '新政民主', 13, 5, 7, '召集各县代表确立临时议会。', [E.moneyIncome(1), E.ppCap(2)], ['TEX_garner_oldguard']),
            f('TEX_progressive_caucus', '进步党团', '新政民主', 16, 5, 7, '自由派与青年派组成进步党团。', [E.ppIncome(1), E.pp(3)], ['TEX_allred_liberals']),
            f('TEX_new_deal_clubs', '新政俱乐部', '新政民主', 19, 5, 7, '在各城市建立新政俱乐部组织选民。', [E.ppIncome(1), E.recruitAmount(1)], ['TEX_young_turks']),
            // 穹顶分叉：奥尔雷德/加纳联票 vs 约翰逊联票
            f('TEX_allred_ticket', '奥尔雷德联票', '新政民主', 15, 5, 7, '奥尔雷德与加纳联手稳住老派与自由派。', [E.ppCap(2), E.ppIncome(1)], ['TEX_allred_liberals'], { mutuallyExclusive: ['TEX_lbj_ticket'] }),
            f('TEX_lbj_ticket', '约翰逊联票', '新政民主', 17, 5, 7, '年轻的林登·约翰逊登上前台。', [E.recruitAmount(1), E.money(10)], ['TEX_allred_liberals'], { mutuallyExclusive: ['TEX_allred_ticket'] }),
            f('TEX_garner_compromise', '加纳妥协', '新政民主', 14, 6, 7, '加纳在派系之间维持最低限度妥协。', [E.pp(3), E.money(8)], ['TEX_county_conventions']),
            f('TEX_lbj_machine', '约翰逊机器', '新政民主', 18, 6, 7, '约翰逊在各县建起自己的政治机器。', [E.recruitAmount(1), E.ppIncome(1)], ['TEX_new_deal_clubs']),
            f('TEX_texas_bill_of_rights', '德州权利法案', '新政民主', 15, 6, 8, '颁布保障公民权利的德州权利法案。', [E.ppCap(3), E.pp(4)], ['TEX_allred_ticket']),
            f('TEX_lbj_public_works', '约翰逊公共工程', '新政民主', 17, 6, 8, '约翰逊把公共工程铺到每个县。', [E.moneyIncome(1), E.allI(1, 2)], ['TEX_lbj_ticket']),
            f('TEX_wartime_republic', '战时共和', '新政民主', 15, 7, 9, '战时仍保留选举、法院与文官审查。', [E.ppCap(2), E.gDef(0.05), E.ideo('wartime_democracy', '德克萨斯临时政府', '德克萨斯')], ['TEX_texas_bill_of_rights']),
            f('TEX_new_deal_texas', '德州新政', '新政民主', 17, 7, 9, '把公共工程、工业与选举写成德州新政。', [E.moneyIncome(1), E.ppIncome(1), E.ideo('new_deal', '德克萨斯新政邦', '新政邦')], ['TEX_lbj_public_works']),
            f('TEX_lone_star_democracy', '孤星民主', '新政民主', 16, 8, 11, '把民主传统升格为孤星共和国的国家身份。', [E.ppCap(3), E.pp(5), E.allCapT(2), E.badge('孤星民主')], [], { prerequisiteAny: [['TEX_wartime_republic'], ['TEX_new_deal_texas']] }),

            // ===================== 线 D：孤星共和（收复主义）｜形状＝五角星 =====================
            f('TEX_lone_star_republic', '孤星共和国', '孤星共和', 24, 2, 6, '宣布德州不只是临时政府，而是重生的孤星共和国。', [E.pp(3), E.ppCap(2)], ['TEX_state_convention'], meOthers('TEX_lone_star_republic')),
            f('TEX_republic_proclaimed', '重宣共和国', '孤星共和', 24, 3, 6, '在达拉斯重新宣布共和国成立。', [E.pp(4), E.allT(1)], ['TEX_lone_star_republic']),
            f('TEX_veteran_legions', '老兵军团', '孤星共和', 23, 4, 6, '把退伍军人编成共和国军团。', [E.recruitAmount(1), E.allT(1)], ['TEX_republic_proclaimed']),
            f('TEX_reclaim_borders', '收复1836边界', '孤星共和', 22, 4, 6, '主张收复 1836 年共和国的旧疆界。', [E.allT(1), E.gAtk(0.05)], ['TEX_republic_proclaimed']),
            f('TEX_frontier_volunteers', '边疆志愿兵', '孤星共和', 25, 4, 6, '招募边疆志愿兵充实军队。', [E.recruitAmount(1), E.freeT(2)], ['TEX_republic_proclaimed']),
            f('TEX_rio_grande_claim', '格兰德河主张', '孤星共和', 26, 4, 6, '主张以格兰德河为南部边界。', [E.tagT('油田', 1), E.crisis(3)], ['TEX_republic_proclaimed']),
            f('TEX_mounted_brigades', '骑兵旅', '孤星共和', 21, 5, 7, '组建快速机动的骑兵旅。', [E.gAtk(0.05), E.actionCost('move', -1)], ['TEX_reclaim_borders']),
            f('TEX_lone_star_council', '孤星议会', '孤星共和', 24, 5, 7, '召集孤星议会统一战时意志。', [E.ppCap(2), E.capT(2)], ['TEX_republic_proclaimed']),
            f('TEX_gulf_claim', '墨西哥湾主张', '孤星共和', 27, 5, 7, '主张把墨西哥湾沿岸纳入版图。', [E.tagT('港口', 1), E.crisis(2)], ['TEX_rio_grande_claim']),
            // 五角星下方分叉：边界收复派 vs 对墨战争派
            f('TEX_border_restoration', '边界收复派', '孤星共和', 22, 6, 7, '主张以谈判和军事压力收复旧疆界。', [E.allT(1), E.capT(2)], ['TEX_lone_star_council'], { mutuallyExclusive: ['TEX_war_on_mexico'] }),
            f('TEX_ranger_companies', '游骑兵连', '孤星共和', 23, 6, 7, '把游骑兵编成共和国正规连队。', [E.allT(1), E.gAtk(0.05)], ['TEX_lone_star_council']),
            f('TEX_frontier_cavalry', '边疆骑兵', '孤星共和', 25, 6, 7, '组建边疆骑兵掩护边界。', [E.recruitAmount(1), E.allT(1)], ['TEX_lone_star_council']),
            f('TEX_war_on_mexico', '对墨战争派', '孤星共和', 26, 6, 7, '主张直接对墨西哥开战夺取边境。', [E.gAtk(0.05), E.capTroop(1)], ['TEX_lone_star_council'], { mutuallyExclusive: ['TEX_border_restoration'] }),
            f('TEX_old_republic_borders', '旧共和国疆界', '孤星共和', 21, 7, 8, '逐步收复旧共和国的疆界。', [E.allCapT(2), E.tagInc('油田', 1)], ['TEX_border_restoration']),
            f('TEX_mexico_campaign', '墨西哥战役', '孤星共和', 27, 7, 8, '发动跨境的墨西哥战役。', [E.gAtk(0.05), E.capMoney(3)], ['TEX_war_on_mexico']),
            f('TEX_lone_star_irredenta', '孤星收复主义', '孤星共和', 22, 8, 9, '把收复旧疆界写成国家信条。', [E.allCapT(2), E.recruitAmount(1), E.ideo('lone_star_nationalism', '德克萨斯共和国', '孤星共和国')], ['TEX_old_republic_borders']),
            f('TEX_greater_texas', '大德克萨斯', '孤星共和', 26, 8, 9, '宣布德州是所有讲英语和西班牙语牛仔的国家。', [E.gAtk(0.05), E.capTroop(1), E.tagMoney('油田', 8), E.ideo('expansionism', '大德克萨斯帝国', '大德州')], ['TEX_mexico_campaign']),
            f('TEX_lone_star_destiny', '孤星天命', '孤星共和', 24, 9, 11, '无论收复还是征服，孤星共和国都走向昭昭天命。', [E.gAtk(0.05), E.allCapT(3), E.badge('孤星天命')], [], { prerequisiteAny: [['TEX_lone_star_irredenta'], ['TEX_greater_texas']] }),

            // ===================== 政治终局：合流 =====================
            f('TEX_lone_star_mandate', '孤星授权', '政治路线', 13, 12, 12, '把所选政治路线塑造成可长期维持的孤星国家形态。', [E.ppIncome(1), E.tagInc('油田', 1), E.allCapT(3), E.badge('孤星授权')], [], { prerequisiteAny: [['TEX_petroleum_state'], ['TEX_lone_star_populism'], ['TEX_lone_star_democracy'], ['TEX_lone_star_destiny']] }),

            // ===================== 支线·军事：游骑兵军务｜形状＝锋矢/箭簇 =====================
            f('TEX_ranger_command', '德州游骑兵总部', '游骑兵军务', 33, 1, 5, '以辽阔边境、油料和机动队为基础组织战争。', [E.capT(3)], ['TEX_provisional_government']),
            f('TEX_mounted_rangers', '骑兵游骑队', '游骑兵军务', 30, 2, 6, '依靠骑兵游骑队控制广袤边境。', [E.gAtk(0.05), E.actionCost('move', -1)], ['TEX_ranger_command']),
            f('TEX_motorized_rangers', '摩托化游骑队', '游骑兵军务', 33, 2, 6, '用充足燃油把游骑兵卡车化。', [E.tagT('油田', 1), E.capT(3)], ['TEX_ranger_command']),
            f('TEX_frank_hamer_lawmen', '哈默执法队', '游骑兵军务', 36, 2, 6, '弗兰克·哈默式的执法队清剿匪患。', [E.maint(-0.02), E.damage(1, 2)], ['TEX_ranger_command']),
            f('TEX_ranger_academy', '游骑兵学院', '游骑兵军务', 32, 3, 6, '建立面向边境作战的游骑兵学院。', [E.capT(3), E.allT(1)], ['TEX_ranger_command']),
            f('TEX_motor_pool', '车辆调度场', '游骑兵军务', 34, 3, 6, '建立统一的车辆调度场。', [E.actionCost('move', -1), E.capT(2)], ['TEX_ranger_command']),
            f('TEX_remount_service', '军马补充处', '游骑兵军务', 31, 3, 6, '设立军马补充处维持骑兵。', [E.recruitAmount(1), E.freeT(2)], ['TEX_ranger_command']),
            f('TEX_signal_riders', '通信骑手', '游骑兵军务', 35, 3, 6, '用通信骑手缩短指挥链。', [E.allCapT(2), E.actionCost('focus', -1)], ['TEX_ranger_command']),
            f('TEX_cavalry_school', '骑兵学校', '游骑兵军务', 30, 3, 6, '把骑兵游骑训练成精锐小队。', [E.allT(1), E.recruitCost(-1)], ['TEX_mounted_rangers']),
            f('TEX_long_patrols', '长程骑巡', '游骑兵军务', 30, 4, 7, '为骑兵建立长程指挥与巡逻。', [E.gAtk(0.05), E.capMoney(2)], ['TEX_cavalry_school']),
            f('TEX_prairie_raiders', '草原突击队', '游骑兵军务', 30, 5, 7, '草原突击队专打敌方薄弱节点。', [E.damage(1, 2), E.allT(1)], ['TEX_long_patrols']),
            f('TEX_truck_columns', '卡车纵队', '游骑兵军务', 33, 3, 6, '把卡车化训练写进训练手册。', [E.actionCost('move', -1), E.tagT('油田', 1)], ['TEX_motorized_rangers']),
            f('TEX_fuel_logistics', '燃油后勤', '游骑兵军务', 33, 4, 7, '为机动部队配齐燃油后勤。', [E.maint(-0.02), E.capT(3)], ['TEX_truck_columns']),
            f('TEX_armored_cars', '装甲车队', '游骑兵军务', 33, 5, 7, '组建油料充足的装甲车队。', [E.gAtk(0.05), E.capT(2)], ['TEX_fuel_logistics']),
            f('TEX_fuel_depot', '燃油库', '游骑兵军务', 34, 5, 7, '在前沿设置燃油库支撑机动。', [E.maint(-0.02), E.tagT('油田', 1)], ['TEX_fuel_logistics']),
            f('TEX_ranger_courts', '游骑兵法庭', '游骑兵军务', 36, 3, 6, '游骑兵带着临时法庭推进。', [E.capMoney(2), E.maint(-0.02)], ['TEX_frank_hamer_lawmen']),
            f('TEX_border_marshals', '边境法警', '游骑兵军务', 36, 4, 7, '在边境城镇任命法警维持秩序。', [E.gDef(0.05), E.allT(1)], ['TEX_ranger_courts']),
            f('TEX_frontier_justice', '边疆司法', '游骑兵军务', 36, 5, 7, '用边疆司法稳住占领区治安。', [E.crisis(3), E.damage(1, 2)], ['TEX_border_marshals']),
            f('TEX_ranger_reserve', '游骑兵预备队', '游骑兵军务', 31, 5, 7, '保留一支游骑兵预备队。', [E.maint(-0.02), E.freeT(3)], ['TEX_long_patrols']),
            f('TEX_border_garrison', '边境守备', '游骑兵军务', 35, 5, 7, '在边境要点设置守备。', [E.gDef(0.05), E.allT(1)], ['TEX_border_marshals']),
            f('TEX_red_river_battle_plan', '红河战役计划', '游骑兵军务', 33, 6, 10, '把三股劲旅纳入统一的边境作战方案。', [E.gAtk(0.05), E.capT(4), E.tagD('油田', 0.10)], [], { prerequisiteAny: [['TEX_prairie_raiders'], ['TEX_armored_cars'], ['TEX_frontier_justice']] }),
            f('TEX_lone_star_army', '孤星军', '游骑兵军务', 33, 7, 11, '游骑兵军成为可支撑长期内战的战争机器。', [E.gAtk(0.05), E.allCapT(3), E.capTroop(1)], ['TEX_red_river_battle_plan']),

            // ===================== 支线·经济：石油经济｜形状＝管线梯子/H（双轨+横档） =====================
            f('TEX_oil_economy_board', '石油经济委员会', '石油经济', 42, 1, 5, '用油田、牧场和边境贸易维持现金流。', [E.money(16), E.tagInc('油田', 1)], ['TEX_provisional_government']),
            f('TEX_east_texas_fields', '东德州油田', '石油经济', 40, 2, 6, '把东德州油田推向战时产量。', [E.tagInc('油田', 1), E.moneyIncome(1)], ['TEX_oil_economy_board']),
            f('TEX_cotton_bonds', '棉花债券', '石油经济', 42, 2, 6, '以棉花期票发行战争债券。', [E.bonds(25, 4, 3), E.moneyIncome(1)], ['TEX_oil_economy_board']),
            f('TEX_gulf_refineries', '海湾炼油厂', '石油经济', 44, 2, 6, '把海湾炼油厂转入战时生产。', [E.allI(1, 2), E.capBoost(1, 1)], ['TEX_oil_economy_board']),
            f('TEX_wildcat_drilling', '野猫钻探', '石油经济', 40, 3, 6, '鼓励野猫钻探扩大油源。', [E.money(12), E.tagInc('油田', 1)], ['TEX_east_texas_fields']),
            f('TEX_pipeline_grid', '管线联调', '石油经济', 42, 3, 6, '把油田与炼厂用管线联调（横档）。', [E.maint(-0.02), E.allI(1, 2)], ['TEX_east_texas_fields', 'TEX_gulf_refineries']),
            f('TEX_cracking_plants', '裂化装置', '石油经济', 44, 3, 6, '建设裂化装置提升成品油产量。', [E.allI(1, 3), E.capI(1)], ['TEX_gulf_refineries']),
            f('TEX_ranch_credit', '牧场信贷', '石油经济', 38, 3, 6, '用牧场资产做抵押扩大信贷。', [E.moneyIncome(1), E.money(10)], ['TEX_east_texas_fields']),
            f('TEX_oil_contractors', '石油承包商', '石油经济', 46, 3, 6, '把军工外包给石油承包商。', [E.moneyIncome(1), E.allI(1, 2)], ['TEX_gulf_refineries']),
            f('TEX_spindletop_revival', '纺锤顶复兴', '石油经济', 40, 4, 7, '让老油田纺锤顶恢复产量。', [E.tagMoney('油田', 8), E.moneyIncome(1)], ['TEX_wildcat_drilling']),
            f('TEX_oil_treasury', '石油金库', '石油经济', 42, 4, 7, '建立战时石油金库与预算。', [E.moneyIncome(2), E.bonds(35, 5, 4)], ['TEX_cotton_bonds']),
            f('TEX_petrochemicals', '石化工业', '石油经济', 44, 4, 7, '把炼厂延伸到石化工业。', [E.allI(1, 3), E.capBoost(1, 2)], ['TEX_cracking_plants']),
            f('TEX_cattle_exchange', '牛市交易所', '石油经济', 38, 4, 7, '重开牛市交易所稳定现金流。', [E.tagInc('油田', 1), E.moneyIncome(1)], ['TEX_ranch_credit']),
            f('TEX_munitions_oil', '油基军工', '石油经济', 46, 4, 7, '用石化原料生产弹药与火炸药。', [E.allI(1, 3), E.bonds(25, 4, 3)], ['TEX_oil_contractors']),
            f('TEX_oil_export_terminals', '石油出口码头', '石油经济', 40, 5, 8, '在海湾建立石油出口码头。', [E.tagInc('港口', 1), E.money(12)], ['TEX_spindletop_revival']),
            f('TEX_fuel_grid', '油气联网', '石油经济', 42, 5, 7, '把油田现金流与炼化产能协同（横档）。', [E.moneyIncome(1), E.maint(-0.02)], ['TEX_spindletop_revival', 'TEX_petrochemicals']),
            f('TEX_aviation_fuel', '航空燃油', '石油经济', 44, 5, 8, '专产高辛烷值航空燃油。', [E.allI(1, 2), E.gAtk(0.05)], ['TEX_petrochemicals']),
            f('TEX_ranch_war_fund', '牧场战费', '石油经济', 38, 5, 8, '动员牧场主认购战费。', [E.bonds(30, 4, 3), E.money(12)], ['TEX_cattle_exchange']),
            f('TEX_oil_arsenal', '石油兵工', '石油经济', 46, 5, 8, '把油基军工整合成兵工总厂。', [E.allI(1, 3), E.capBoost(1, 2)], ['TEX_munitions_oil']),
            f('TEX_oil_fields_total', '油田总开发', '石油经济', 40, 6, 9, '把全州油田纳入统一开发。', [E.tagInc('油田', 2), E.moneyIncome(2)], ['TEX_oil_export_terminals']),
            f('TEX_central_oil_bank', '中央油库银行', '石油经济', 42, 6, 8, '设立中央油库银行统一调度油财。', [E.moneyIncome(2), E.money(15)], ['TEX_fuel_grid']),
            f('TEX_refining_total', '炼油总产', '石油经济', 44, 6, 9, '把炼化产能提升到战时极限。', [E.allI(1, 3), E.capI(1)], ['TEX_aviation_fuel']),
            f('TEX_boomtown_growth', '油城扩张', '石油经济', 40, 7, 8, '让油城在战时迅速扩张。', [E.allI(1, 2), E.tagInc('油田', 1)], ['TEX_oil_fields_total']),
            f('TEX_lone_star_war_economy', '孤星战争经济', '石油经济', 42, 7, 11, '把经济线转化为长期内战的生产制度。', [E.moneyIncome(2), E.allI(1, 4), E.tagInc('油田', 1)], [], { prerequisiteAny: [['TEX_oil_fields_total'], ['TEX_refining_total'], ['TEX_oil_treasury']] }),

            // ===================== 支线·外交：边境外交｜形状＝菱形 =====================
            f('TEX_border_office', '孤星外交局', '边境外交', 52, 1, 5, '决定向墨西哥、联盟国、西部军区或协约国投放资源。', [E.money(10), E.pp(3)], ['TEX_provisional_government']),
            f('TEX_mexico_relations', '墨西哥关系', '边境外交', 50, 2, 6, '在战与和之间处理对墨关系。', [E.pp(3), E.crisis(2)], ['TEX_border_office']),
            f('TEX_east_diplomacy', '东线外交', '边境外交', 52, 2, 6, '用油料换取东部边境安全。', [E.pp(3), E.tagInc('油田', 1)], ['TEX_border_office']),
            f('TEX_west_buffer', '西部缓冲', '边境外交', 54, 2, 6, '向新墨西哥和丹佛方向建立缓冲。', [E.allT(1), E.money(10)], ['TEX_border_office']),
            f('TEX_mexican_oil_concessions', '墨西哥油田特许', '边境外交', 49, 3, 7, '换取墨西哥北部油田特许权。', [E.tagInc('油田', 1), E.money(12)], ['TEX_mexico_relations']),
            f('TEX_rio_grande_pacts', '格兰德河协定', '边境外交', 50, 3, 7, '在格兰德河沿线达成边境协定。', [E.money(12), E.tagInc('油田', 1)], ['TEX_mexico_relations']),
            f('TEX_aus_oil_deals', '联盟国油约', '边境外交', 52, 3, 7, '与联盟国签订长期供油合约。', [E.money(12), E.tagMoney('油田', 6)], ['TEX_east_diplomacy']),
            f('TEX_wdc_ceasefire', '西部军区停火', '边境外交', 54, 3, 7, '与西部军区达成局部停火。', [E.pp(3), E.crisis(3)], ['TEX_west_buffer']),
            f('TEX_tejano_accord', '特哈诺协定', '边境外交', 50, 4, 8, '与特哈诺社区达成自治协定。', [E.pp(3), E.recruitAmount(1)], ['TEX_rio_grande_pacts']),
            f('TEX_entente_oil_buyers', '协约国油商', '边境外交', 52, 4, 8, '把油卖给协约国换取硬通货。', [E.money(15), E.moneyIncome(1)], ['TEX_aus_oil_deals']),
            f('TEX_el_paso_corridor', '埃尔帕索通道', '边境外交', 54, 4, 8, '把埃尔帕索通道做成可机动走廊。', [E.actionCost('move', -1), E.gDef(0.05)], ['TEX_wdc_ceasefire']),
            f('TEX_southern_border_line', '南境防线', '边境外交', 50, 5, 8, '沿南部边界构筑防线。', [E.gDef(0.05), E.tagD('油田', 0.05)], ['TEX_tejano_accord']),
            f('TEX_oil_for_recognition', '以油换承认', '边境外交', 52, 5, 9, '用石油换取列强的外交承认。', [E.pp(4), E.money(12)], ['TEX_entente_oil_buyers']),
            f('TEX_mountain_outposts', '山地哨站', '边境外交', 54, 5, 8, '在西部山地设置哨站。', [E.damage(1, 2), E.allT(1)], ['TEX_el_paso_corridor']),
            f('TEX_gulf_neutrality', '墨西哥湾中立', '边境外交', 50, 6, 8, '争取墨西哥湾航道的中立地位。', [E.crisis(3), E.money(10)], ['TEX_southern_border_line']),
            f('TEX_rockies_watch', '落基山警戒', '边境外交', 54, 6, 8, '在落基山前沿保持警戒。', [E.gDef(0.05), E.freeT(2)], ['TEX_mountain_outposts']),
            f('TEX_gulf_trade_route', '墨西哥湾航路', '边境外交', 50, 7, 8, '打通墨西哥湾的战时贸易航路。', [E.tagInc('港口', 1), E.money(10)], ['TEX_gulf_neutrality']),
            f('TEX_texas_unification', '德州统一战略', '边境外交', 52, 6, 10, '把边境政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.tagInc('油田', 1)], [], { prerequisiteAny: [['TEX_southern_border_line'], ['TEX_oil_for_recognition'], ['TEX_mountain_outposts']] }),
            f('TEX_lone_star_diplomacy', '孤星外交总略', '边境外交', 52, 7, 11, '把边境与外交收束成孤星共和国的战略后院。', [E.tagT('油田', 1), E.allCapT(2), E.pp(3)], ['TEX_texas_unification']),

            // ===================== 支线·社会：边疆社会｜形状＝王冠 =====================
            f('TEX_frontier_society', '边疆社会', '边疆社会', 61, 1, 5, '用边疆传统、教会和油城文化凝聚后方。', [E.pp(3), E.money(8)], ['TEX_provisional_government']),
            f('TEX_baptist_churches', '浸信会网络', '边疆社会', 61, 2, 6, '把浸信会网络编进战时动员。', [E.ppIncome(1), E.crisis(2)], ['TEX_frontier_society']),
            f('TEX_county_fairs', '县集市', '边疆社会', 61, 3, 6, '用县集市维系社区与征募。', [E.pp(3), E.money(8)], ['TEX_baptist_churches']),
            f('TEX_ranch_culture', '牧场文化', '边疆社会', 59, 4, 7, '把牧场文化包装成德州骄傲。', [E.pp(3), E.recruitAmount(1)], ['TEX_county_fairs']),
            f('TEX_oil_boomtowns', '石油城镇', '边疆社会', 61, 4, 7, '让石油城镇成为后方活力之源。', [E.moneyIncome(1), E.allI(1, 2)], ['TEX_county_fairs']),
            f('TEX_cattle_baron_clubs', '牛仔男爵俱乐部', '边疆社会', 63, 4, 7, '牛仔男爵俱乐部资助战争。', [E.money(10), E.ppCap(2)], ['TEX_county_fairs']),
            f('TEX_cowboy_myth', '牛仔神话', '边疆社会', 59, 5, 7, '用牛仔神话鼓舞士气。', [E.pp(3), E.allT(1)], ['TEX_ranch_culture']),
            f('TEX_frontier_schools', '边疆学校', '边疆社会', 60, 5, 7, '兴办边疆学校培养公民与技工。', [E.moneyIncome(1), E.ppCap(2)], ['TEX_ranch_culture']),
            f('TEX_boomtown_growth_soc', '油城繁荣', '边疆社会', 61, 5, 7, '油城繁荣带动后方经济与人心。', [E.moneyIncome(1), E.tagInc('油田', 1)], ['TEX_oil_boomtowns']),
            f('TEX_gentry_press', '乡绅报系', '边疆社会', 63, 5, 7, '乡绅报系主导舆论。', [E.pp(3), E.crisis(2)], ['TEX_cattle_baron_clubs']),
            f('TEX_frontier_spirit', '边疆精神', '边疆社会', 59, 6, 8, '把边疆精神写成国家气质。', [E.ppIncome(1), E.gDef(0.05)], ['TEX_cowboy_myth']),
            f('TEX_dust_chapels', '沙尘礼拜堂', '边疆社会', 60, 6, 7, '在沙尘灾区建起礼拜堂安抚人心。', [E.crisis(2), E.ppIncome(1)], ['TEX_frontier_schools']),
            f('TEX_revival_meetings', '复兴布道会', '边疆社会', 61, 6, 7, '用复兴布道会凝聚战时热情。', [E.crisis(3), E.freeT(2)], ['TEX_boomtown_growth_soc']),
            f('TEX_oilman_philanthropy', '石油慈善', '边疆社会', 63, 6, 7, '油商慈善资助学校、医院与教会。', [E.money(10), E.ppIncome(1)], ['TEX_gentry_press']),
            f('TEX_lone_star_spirit', '孤星精神总动员', '边疆社会', 61, 7, 10, '把边疆传统、信仰与油城文化合成一场精神总动员。', [E.ppCap(3), E.gDef(0.05), E.allCapT(3), E.badge('孤星精神')], [], { prerequisiteAny: [['TEX_frontier_spirit'], ['TEX_boomtown_growth_soc'], ['TEX_gentry_press']] })
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
