// 国策数据：USA（美利坚合众国 / 华盛顿麦克阿瑟联邦政府）。
// 手工布局：每条线一种独立轮廓，坐标在此即最终位置（USA 已从 placeUsa 与所有后处理器中排除，base 已从 state.js 清空）。
// 政治线顶层＝二选一互斥：【合众国之翼】(凯撒/民主/技术官僚) vs 【纽约市之翼】(华尔街/坦慕尼/红色纽约/拉瓜迪亚)。
// 两翼各自终局（合众国万岁 / 帝国都市）。支线：军事改革 / 经济动员 / 海空军 / 门罗主义。
// 意识形态守卫：每条子线 2 臂带各自意识形态、按路线改名；合流节点不带 ideo。民主线"立即大选"保留原国名。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.USA = function (f, E) {
        const UNION_ME = ['usa_american_caesar', 'usa_restore_congress', 'usa_military_directorate'];
        const NYC_ME = ['usa_wall_street', 'usa_tammany_hall', 'usa_red_new_york', 'usa_laguardia'];
        const unionOthers = (id) => ({ mutuallyExclusive: UNION_ME.filter(x => x !== id) });
        const nycOthers = (id) => ({ mutuallyExclusive: NYC_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 大会 + 两翼根 =====================
            f('usa_secure_command', '战时指挥委员会', '战时统合', 19, 0, 4, '把华盛顿周边的军政权力压进一套统一指挥链。', [E.pp(5), E.capT(2)]),
            f('usa_emergency_war_powers', '紧急战争权力', '政治路线', 19, 1, 5, '授权总统与总参谋部绕过常规程序处理叛乱。', [E.pp(4)], ['usa_secure_command']),
            f('usa_union_path', '坚守联邦', '政治路线', 8, 2, 6, '内战胜利后，联邦的中心仍在华盛顿——在凯撒、民主与技术官僚之间定型。', [E.pp(3), E.allCapT(2)], ['usa_emergency_war_powers'], { mutuallyExclusive: ['usa_nyc_path'] }),
            f('usa_nyc_path', '纽约市掌权', '政治路线', 31, 2, 6, '联邦重心转向纽约市，由曼哈顿的四大权力集团接管残存的合众国。', [E.money(14), E.ppCap(2)], ['usa_emergency_war_powers'], { mutuallyExclusive: ['usa_union_path'] }),

            // ===================== 合众国之翼·线 A：军政府·美国凯撒｜罗马军团 =====================
            f('usa_american_caesar', '美国凯撒', '军政府', 2, 3, 6, '承认麦克阿瑟个人权威是维持联邦的核心。', [E.capT(5), E.pp(3)], ['usa_union_path'], unionOthers('usa_american_caesar')),
            f('usa_government_by_decree', '命令治国', '军政府', 2, 4, 7, '所有州际事务由军令直达。', [E.allT(1), E.pp(7)], ['usa_american_caesar']),
            f('usa_command_proconsuls', '战区总督', '军政府', 1, 5, 7, '把前线州交给军政总督快速决断。', [E.capT(3), E.gAtk(0.05)], ['usa_government_by_decree']),
            f('usa_military_censors', '军事新闻审查', '军政府', 3, 5, 7, '统一战时广播口径，压制失败主义。', [E.pp(4), E.crisis(3)], ['usa_government_by_decree']),
            f('usa_praetorian_guard', '禁卫军', '军政府', 0, 6, 7, '组建只忠于统帅的禁卫军。', [E.capT(3), E.allCapT(2)], ['usa_command_proconsuls']),
            f('usa_caesar_personal', '个人凯撒崇拜', '军政府', 1, 6, 7, '把麦克阿瑟塑造成披托加戴桂冠的美国凯撒。', [E.crisis(3), E.ppIncome(1)], ['usa_command_proconsuls'], { mutuallyExclusive: ['usa_military_board'] }),
            f('usa_military_board', '军政委员会', '军政府', 3, 6, 7, '由总参与战区司令组成集体军政。', [E.allT(1), E.gAtk(0.05)], ['usa_military_censors'], { mutuallyExclusive: ['usa_caesar_personal'] }),
            f('usa_caesar_cult', '凯撒个人崇拜', '军政府', 1, 7, 8, '军报与广播把统帅塑造成救国的化身。', [E.crisis(3), E.pp(4)], ['usa_caesar_personal']),
            f('usa_american_empire', '美利坚帝国', '军政府', 1, 8, 10, '麦克阿瑟加冕，联邦成为一座军营帝国。', [E.gAtk(0.08), E.capMoney(4), E.allCapT(4), E.ideo('american_caesarism', '美利坚帝国', '美帝国'), E.badge('美利坚帝国')], ['usa_caesar_cult']),
            f('usa_war_directorate', '战争委员会', '军政府', 3, 7, 8, '把行政、情报、补给并入一张命令表。', [E.allCapT(2), E.actionCost('move', -1)], ['usa_military_board']),
            f('usa_army_state', '军队国家', '军政府', 3, 8, 10, '承认军队是联邦生存期间最稳定的国家骨架。', [E.allCapT(3), E.gAtk(0.05), E.capT(4), E.ideo('military_junta', '美利坚军政府', '军政府'), E.badge('军队国家')], ['usa_war_directorate']),
            f('usa_caesar_state', '凯撒之国', '军政府', 2, 9, 10, '无论个人凯撒还是军政委员会，联邦都成了军营国家。', [E.gAtk(0.05), E.allCapT(3)], [], { prerequisiteAny: [['usa_american_empire'], ['usa_army_state']] }),

            // ===================== 合众国之翼·线 B：民主修复·民主胜利｜国会穹顶 =====================
            f('usa_restore_congress', '召回国会委员会', '民主修复', 8, 3, 6, '保留军政府框架下的文官合法性。', [E.money(12), E.pp(3)], ['usa_union_path'], unionOthers('usa_restore_congress')),
            f('usa_special_elections', '特别选举筹备', '民主修复', 8, 4, 7, '为内战后的临时选举保留制度入口。', [E.money(10), E.pp(6)], ['usa_restore_congress']),
            f('usa_wartime_civil_service', '战时文官署', '民主修复', 7, 5, 7, '用可追责的文官系统接管征税与征募。', [E.actionCost('focus', -1), E.moneyIncome(1)], ['usa_special_elections']),
            f('usa_provisional_bill', '临时权利法案', '民主修复', 9, 5, 7, '以战时限制为边界，公开承诺战后权利恢复。', [E.ppCap(2), E.pp(4)], ['usa_special_elections']),
            f('usa_loyal_state_governors', '忠诚州长会议', '民主修复', 6, 6, 7, '把仍承认联邦的州长纳入战时咨议。', [E.money(8), E.ppCap(2)], ['usa_wartime_civil_service']),
            f('usa_shadow_president', '影子总统', '民主修复', 7, 6, 7, '任命一位"影子总统"傀儡过渡到大选。', [E.ppCap(2), E.ppIncome(1)], ['usa_wartime_civil_service'], { mutuallyExclusive: ['usa_immediate_elections'] }),
            f('usa_immediate_elections', '立即大选', '民主修复', 9, 6, 7, '在停火后立即恢复全国大选。', [E.pp(4), E.ppCap(2)], ['usa_provisional_bill'], { mutuallyExclusive: ['usa_shadow_president'] }),
            f('usa_caretaker_cabinet', '看守内阁', '民主修复', 7, 7, 8, '影子总统主持看守内阁直到下次选举。', [E.actionCost('focus', -1), E.moneyIncome(1)], ['usa_shadow_president']),
            f('usa_shadow_republic', '合众国看守政府', '民主修复', 7, 8, 10, '权力名义还政、实际仍由军方把持的看守共和。', [E.ppCap(3), E.ppIncome(1), E.maint(-0.03), E.ideo('shadow_presidency', '合众国看守政府', '看守政府'), E.badge('影子总统')], ['usa_caretaker_cabinet']),
            f('usa_national_reconciliation', '全国和解委员会', '民主修复', 9, 7, 8, '为投降州与战后政党重组预留合法出口。', [E.ppIncome(1), E.moneyIncome(2)], ['usa_immediate_elections']),
            f('usa_democracy_triumphs', '民主胜利', '民主修复', 9, 8, 10, '临时军政府把权力交回选票、法院与州议会。', [E.ppCap(4), E.ppIncome(1), E.pp(5), E.actionCost('focus', -1), E.ideo('wartime_democracy'), E.badge('民主胜利')], ['usa_national_reconciliation']),
            f('usa_constitutional_continuity', '宪法连续性', '民主修复', 8, 9, 10, '无论看守还是大选，联邦都宣告宪政连续。', [E.maint(-0.03), E.ppCap(2), E.freeT(3)], [], { prerequisiteAny: [['usa_shadow_republic'], ['usa_democracy_triumphs']] }),

            // ===================== 合众国之翼·线 C：技术官僚·受控共和｜齿轮网格 =====================
            f('usa_military_directorate', '军政委员会', '技术官僚', 14, 3, 6, '用军官、州长和工程官僚组成临时管理机构。', [E.money(10), E.capI(1)], ['usa_union_path'], unionOthers('usa_military_directorate')),
            f('usa_balanced_restoration', '有限复归方案', '技术官僚', 14, 4, 7, '预设一套既保留军管效率又恢复法统的路线。', [E.money(12), E.capI(1)], ['usa_military_directorate']),
            f('usa_engineers_cabinet', '工程师内阁', '技术官僚', 13, 5, 7, '由工程军官、铁路经理与预算专家组成执行内阁。', [E.capI(1), E.actionCost('build', -1)], ['usa_balanced_restoration']),
            f('usa_state_planning_boards', '州际计划委员会', '技术官僚', 15, 5, 7, '用配给表与运输优先级替代派系协商。', [E.capBoost(1, 2)], ['usa_balanced_restoration']),
            f('usa_budget_bureau', '预算局', '技术官僚', 12, 6, 7, '建立统一的战时预算局。', [E.moneyIncome(1), E.actionCost('build', -1)], ['usa_engineers_cabinet']),
            f('usa_engineer_rule', '工程师治国', '技术官僚', 13, 6, 7, '让工程师与技术官僚直接掌握行政。', [E.allI(1, 2), E.capBoost(1, 1)], ['usa_engineers_cabinet'], { mutuallyExclusive: ['usa_managed_path'] }),
            f('usa_managed_path', '受控共和派', '技术官僚', 15, 6, 7, '用有限选举与登记政党维持受控的合法性。', [E.pp(3), E.moneyIncome(1)], ['usa_state_planning_boards'], { mutuallyExclusive: ['usa_engineer_rule'] }),
            f('usa_technical_corps', '技术军官团', '技术官僚', 13, 7, 8, '把工程军官编成治理国家的技术团。', [E.allI(1, 3), E.capI(1)], ['usa_engineer_rule']),
            f('usa_engineered_state', '美利坚技术联邦', '技术官僚', 13, 8, 10, '由工程师与承包商财团成为日常政府。', [E.allI(1, 4), E.capBoost(1, 3), E.actionCost('build', -1), E.ideo('technocracy', '美利坚技术联邦', '技术联邦'), E.badge('技术联邦')], ['usa_technical_corps']),
            f('usa_regulated_parties', '受监管政党', '技术官僚', 15, 7, 8, '允许有限政治活动，但一切组织须接受战时登记。', [E.pp(3), E.moneyIncome(1)], ['usa_managed_path']),
            f('usa_managed_republic', '受控共和国', '技术官僚', 15, 8, 10, '把军政效率与合法性修复装进同一个过渡方案。', [E.allI(1, 3), E.moneyIncome(2), E.actionCost('all', -1), E.ideo('technocracy', '受控共和国', '受控共和'), E.badge('受控共和国')], ['usa_regulated_parties']),
            f('usa_managed_transition', '受控过渡', '技术官僚', 14, 9, 10, '无论工程师治国还是受控共和，联邦都按计划过渡。', [E.allI(1, 3), E.moneyIncome(1)], [], { prerequisiteAny: [['usa_engineered_state'], ['usa_managed_republic']] }),

            // ===================== 合众国之翼·终局：战后重建 =====================
            f('usa_victory_in_the_civil_war', '内战胜利规划', '战后重建', 8, 10, 10, '胜利还没到来，但战后秩序必须先写在总参谋部墙上。', [E.ppCap(3), E.money(20), E.allCapT(2)], [], { prerequisiteAny: [['usa_caesar_state'], ['usa_constitutional_continuity'], ['usa_managed_transition']], progressRequired: 5 }),
            f('usa_begin_reconstruction', '启动重建署', '战后重建', 6, 11, 9, '用一个独立重建署处理收复州、铁路与临时财政。', [E.moneyIncome(2), E.actionCost('build', -1), E.allI(1, 4)], ['usa_victory_in_the_civil_war']),
            f('usa_state_readmission_acts', '各州重新准入法', '战后重建', 10, 11, 9, '为每个收复州规定回归条件、警备规模与预算公式。', [E.pp(8), E.recruitCost(-1), E.freeT(5)], ['usa_victory_in_the_civil_war']),
            f('usa_union_forever', '合众国万岁', '战后重建', 8, 12, 12, '战火没有消灭合众国，反而给它铸出了新的国家神话。', [E.ppIncome(2), E.ppCap(5), E.gAtk(0.05), E.gDef(0.05), E.badge('合众国万岁')], [], { prerequisiteAny: [['usa_begin_reconstruction'], ['usa_state_readmission_acts']], progressRequired: 6 }),

            // ===================== 纽约市之翼·脊柱 =====================
            f('usa_metro_assembly', '大都会议会', '纽约市', 31, 3, 6, '召集曼哈顿的市政、金融与工会代表组成大都会议会。', [E.money(12), E.ppCap(2)], ['usa_nyc_path']),
            f('usa_five_boroughs', '五区联席', '纽约市', 31, 4, 6, '把五大区并入统一的战时市政。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['usa_metro_assembly']),
            f('usa_city_hall', '市政厅', '纽约市', 31, 5, 6, '市政厅成为残存合众国的实际中枢。', [E.pp(3), E.money(10)], ['usa_five_boroughs']),
            f('usa_empire_city', '帝国都市', '纽约市', 31, 10, 12, '无论谁掌权，合众国都化身为以纽约为核心的大都会国家。', [E.ppCap(4), E.moneyIncome(2), E.allCapT(3), E.tagInc('港口', 1), E.badge('帝国都市')], [], { prerequisiteAny: [['usa_wall_street_state'], ['usa_tammany_state'], ['usa_commune_state'], ['usa_little_flower']] }),

            // ===================== 纽约市之翼·线 1：华尔街金权｜摩天楼 =====================
            f('usa_wall_street', '华尔街金权', '华尔街', 22, 3, 6, '让华尔街的银行与交易所接管国家财政。', [E.money(14), E.moneyIncome(1)], ['usa_nyc_path'], nycOthers('usa_wall_street')),
            f('usa_morgan_house', '摩根财团', '华尔街', 22, 4, 7, '摩根财团成为战时财政的脊梁。', [E.moneyIncome(1), E.money(12)], ['usa_wall_street']),
            f('usa_stock_exchange', '证券交易所', '华尔街', 21, 5, 7, '重开纽约证券交易所筹措战费。', [E.bonds(30, 4, 3), E.moneyIncome(1)], ['usa_morgan_house']),
            f('usa_federal_reserve', '联储重组', '华尔街', 23, 5, 7, '把联邦储备体系搬到纽约掌控。', [E.moneyIncome(1), E.money(12)], ['usa_morgan_house']),
            f('usa_morgan_trust', '摩根托拉斯', '华尔街', 21, 6, 7, '由摩根托拉斯统一调度战时金融。', [E.moneyIncome(2), E.bonds(30, 4, 3)], ['usa_stock_exchange'], { mutuallyExclusive: ['usa_speculation'] }),
            f('usa_speculation', '投机交易所', '华尔街', 23, 6, 7, '放开投机，用市场现金流撑起战争。', [E.money(20), E.capMoney(2)], ['usa_federal_reserve'], { mutuallyExclusive: ['usa_morgan_trust'] }),
            f('usa_banking_cartel', '银行卡特尔', '华尔街', 21, 7, 8, '各大银行结成战时卡特尔。', [E.moneyIncome(2), E.money(15)], ['usa_morgan_trust']),
            f('usa_financial_republic', '纽约金融共和国', '华尔街', 21, 8, 10, '由金融寡头运营的纽约金融共和国。', [E.moneyIncome(2), E.money(20), E.actionCost('build', -1), E.ideo('plutocracy', '纽约金融共和国', '金融共和国'), E.badge('金融共和国')], ['usa_banking_cartel']),
            f('usa_free_market', '自由市场', '华尔街', 23, 7, 8, '把纽约辟为自由贸易与投机的市场。', [E.tagInc('港口', 1), E.moneyIncome(1)], ['usa_speculation']),
            f('usa_free_city', '纽约自由市', '华尔街', 23, 8, 10, '把纽约变成汉萨式的自由商业城市。', [E.moneyIncome(2), E.tagInc('港口', 1), E.tagMoney('港口', 8), E.ideo('mercantile', '纽约自由市', '自由市'), E.badge('自由市')], ['usa_free_market']),
            f('usa_wall_street_state', '华尔街之国', '华尔街', 22, 9, 10, '无论托拉斯还是自由市，金融都成了纽约的命脉。', [E.moneyIncome(2), E.allCapT(2)], [], { prerequisiteAny: [['usa_financial_republic'], ['usa_free_city']] }),

            // ===================== 纽约市之翼·线 2：坦慕尼厅机器｜大厅拱 =====================
            f('usa_tammany_hall', '坦慕尼厅', '坦慕尼厅', 28, 3, 6, '坦慕尼厅的政治机器接管市政。', [E.pp(3), E.money(10)], ['usa_nyc_path'], nycOthers('usa_tammany_hall')),
            f('usa_ward_bosses', '选区老板', '坦慕尼厅', 28, 4, 7, '各选区老板掌握基层动员。', [E.recruitAmount(1), E.money(8)], ['usa_tammany_hall']),
            f('usa_patronage', '恩庇网络', '坦慕尼厅', 27, 5, 7, '用职位与合同编织恩庇网络。', [E.moneyIncome(1), E.maint(-0.02)], ['usa_ward_bosses']),
            f('usa_immigrant_wards', '移民票仓', '坦慕尼厅', 29, 5, 7, '把移民社区组织成稳定票仓。', [E.recruitAmount(1), E.freeT(2)], ['usa_ward_bosses']),
            f('usa_machine_boss', '老板政治', '坦慕尼厅', 27, 6, 7, '由一位坦慕尼老板独揽市政。', [E.moneyIncome(1), E.capMoney(2)], ['usa_patronage'], { mutuallyExclusive: ['usa_immigrant_populism'] }),
            f('usa_immigrant_populism', '移民民粹', '坦慕尼厅', 29, 6, 7, '把移民票仓动员成草根民粹。', [E.recruitAmount(1), E.pp(3)], ['usa_immigrant_wards'], { mutuallyExclusive: ['usa_machine_boss'] }),
            f('usa_graft_economy', '分肥经济', '坦慕尼厅', 27, 7, 8, '用回扣与分肥维持机器运转。', [E.moneyIncome(2), E.money(12)], ['usa_machine_boss']),
            f('usa_tammany_regime', '纽约坦慕尼政权', '坦慕尼厅', 27, 8, 10, '坦慕尼老板政治成为城市的统治形态。', [E.moneyIncome(3), E.recruitCost(-1), E.ideo('machine_politics', '纽约坦慕尼政权', '坦慕尼政权'), E.badge('坦慕尼政权')], ['usa_graft_economy']),
            f('usa_ethnic_blocs', '族裔联盟', '坦慕尼厅', 29, 7, 8, '把各族裔社区结成政治联盟。', [E.recruitAmount(1), E.ppIncome(1)], ['usa_immigrant_populism']),
            f('usa_peoples_city', '纽约人民市政', '坦慕尼厅', 29, 8, 10, '以移民与工人为基础的人民市政。', [E.recruitAmount(1), E.ppIncome(1), E.freeT(2), E.ideo('populism', '纽约人民市政', '人民市政'), E.badge('人民市政')], ['usa_ethnic_blocs']),
            f('usa_tammany_state', '坦慕尼之国', '坦慕尼厅', 28, 9, 10, '无论老板还是民粹，机器都掌控了纽约。', [E.moneyIncome(2), E.recruitAmount(1)], [], { prerequisiteAny: [['usa_tammany_regime'], ['usa_peoples_city']] }),

            // ===================== 纽约市之翼·线 3：红色纽约工团｜齿轮网格 =====================
            f('usa_red_new_york', '红色纽约', '红色纽约', 34, 3, 6, '纽约庞大的工会运动登上政治舞台。', [E.recruitCost(-1), E.freeT(2)], ['usa_nyc_path'], nycOthers('usa_red_new_york')),
            f('usa_labor_council', '劳工委员会', '红色纽约', 34, 4, 7, '由各大工会组成劳工委员会。', [E.recruitAmount(1), E.allT(1)], ['usa_red_new_york']),
            f('usa_garment_unions', '成衣工会', '红色纽约', 33, 5, 7, '成衣工会成为城市工团的核心。', [E.allI(1, 2), E.freeT(2)], ['usa_labor_council']),
            f('usa_longshore_union', '码头工会', '红色纽约', 35, 5, 7, '码头工会掌握港口的命脉。', [E.tagT('港口', 1), E.allT(1)], ['usa_labor_council']),
            f('usa_garment_syndicate', '成衣工团', '红色纽约', 33, 6, 7, '把成衣工会改造成生产工团。', [E.allI(1, 2), E.recruitAmount(1)], ['usa_garment_unions'], { mutuallyExclusive: ['usa_longshore_syndicate'] }),
            f('usa_longshore_syndicate', '码头工团', '红色纽约', 35, 6, 7, '把码头工会改造成港口工团。', [E.tagT('港口', 1), E.freeT(2)], ['usa_longshore_union'], { mutuallyExclusive: ['usa_garment_syndicate'] }),
            f('usa_factory_committees', '工厂委员会', '红色纽约', 33, 7, 8, '每个工厂由工人委员会管理。', [E.allI(1, 3), E.recruitCost(-1)], ['usa_garment_syndicate']),
            f('usa_red_commune', '红色纽约公社', '红色纽约', 33, 8, 10, '把纽约改造成工人自治的红色公社。', [E.recruitCost(-1), E.recruitAmount(2), E.freeT(4), E.ideo('syndicalism', '红色纽约公社', '红色纽约'), E.badge('红色纽约')], ['usa_factory_committees']),
            f('usa_dock_control', '码头管制', '红色纽约', 35, 7, 8, '工团接管港口的调度与现金流。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['usa_longshore_syndicate']),
            f('usa_harbor_syndicate', '纽约工团', '红色纽约', 35, 8, 10, '由港口工团主导的工团城市。', [E.tagT('港口', 1), E.freeT(3), E.recruitAmount(1), E.ideo('syndicalism', '纽约工团', '纽约工团'), E.badge('纽约工团')], ['usa_dock_control']),
            f('usa_commune_state', '工团之城', '红色纽约', 34, 9, 10, '无论成衣还是码头，工团都掌控了纽约。', [E.freeT(3), E.recruitAmount(1)], [], { prerequisiteAny: [['usa_red_commune'], ['usa_harbor_syndicate']] }),

            // ===================== 纽约市之翼·线 4：拉瓜迪亚融合派｜市政厅穹顶 =====================
            f('usa_laguardia', '拉瓜迪亚融合派', '拉瓜迪亚', 40, 3, 6, '"小花"拉瓜迪亚的融合派改革市政。', [E.pp(3), E.ppCap(2)], ['usa_nyc_path'], nycOthers('usa_laguardia')),
            f('usa_fusion_ticket', '融合派联票', '拉瓜迪亚', 40, 4, 7, '共和党、进步派与改革者结成融合联票。', [E.pp(3), E.ppIncome(1)], ['usa_laguardia']),
            f('usa_good_government', '廉政市政', '拉瓜迪亚', 39, 5, 7, '清扫贪腐，建立廉洁高效的市政。', [E.maint(-0.03), E.ppCap(2)], ['usa_fusion_ticket']),
            f('usa_public_works_nyc', '公共工程', '拉瓜迪亚', 41, 5, 7, '用公共工程与机场、桥梁带动就业。', [E.moneyIncome(1), E.allI(1, 2)], ['usa_fusion_ticket']),
            f('usa_reform_city', '改革市政', '拉瓜迪亚', 39, 6, 7, '把廉政与效率写成市政原则。', [E.ppCap(2), E.actionCost('build', -1)], ['usa_good_government'], { mutuallyExclusive: ['usa_new_deal_coalition'] }),
            f('usa_new_deal_coalition', '新政联盟', '拉瓜迪亚', 41, 6, 7, '与新政力量结成城市联盟。', [E.moneyIncome(1), E.ppIncome(1)], ['usa_public_works_nyc'], { mutuallyExclusive: ['usa_reform_city'] }),
            f('usa_civil_service_reform', '文官改革', '拉瓜迪亚', 39, 7, 8, '用考绩制取代分肥的文官改革。', [E.actionCost('focus', -1), E.ppCap(2)], ['usa_reform_city']),
            f('usa_fusion_metropolis', '纽约融合市政', '拉瓜迪亚', 39, 8, 10, '把融合改革升格为城市国家形态。', [E.ppCap(3), E.actionCost('build', -1), E.gDef(0.05), E.ideo('fusion_progressivism', '纽约融合市政', '融合市政'), E.badge('融合市政')], ['usa_civil_service_reform']),
            f('usa_relief_programs', '救济计划', '拉瓜迪亚', 41, 7, 8, '推行覆盖全市的救济与公共就业。', [E.moneyIncome(1), E.freeT(2)], ['usa_new_deal_coalition']),
            f('usa_new_deal_city', '纽约新政联盟', '拉瓜迪亚', 41, 8, 10, '以新政联盟为基础的进步民主城市。', [E.ppCap(2), E.moneyIncome(1), E.ppIncome(1), E.ideo('wartime_democracy', '纽约新政联盟', '新政联盟'), E.badge('新政联盟')], ['usa_relief_programs']),
            f('usa_little_flower', '小花之城', '拉瓜迪亚', 40, 9, 10, '无论改革还是新政，融合派都重塑了纽约。', [E.ppCap(3), E.gDef(0.05)], [], { prerequisiteAny: [['usa_fusion_metropolis'], ['usa_new_deal_city']] }),

            // ===================== 支线·军事：军事改革｜麦帅参谋部（箭簇）=====================
            f('usa_war_department_expansion', '扩编战争部', '军事改革', 48, 1, 5, '重开各局办公室，协调陆军、民兵与州防卫队。', [E.capT(4)], ['usa_secure_command']),
            f('usa_mcarthur_in_command', '麦克阿瑟亲自指挥', '军事改革', 48, 2, 6, '让总司令部直接接管关键战区。', [E.pp(5), E.allT(1)], ['usa_war_department_expansion']),
            f('usa_war_college', '陆军学院', '军事改革', 46, 3, 6, '重开陆军学院培养参谋军官。', [E.capT(3), E.allT(1)], ['usa_mcarthur_in_command']),
            f('usa_pentagon_planning_rooms', '五角大楼规划室', '军事改革', 48, 3, 7, '把各战区计划搬进同一套墙图。', [E.actionCost('move', -1), E.pp(3)], ['usa_mcarthur_in_command']),
            f('usa_signal_command', '通信指挥部', '军事改革', 50, 3, 6, '统一战时通信与密码。', [E.allCapT(2), E.actionCost('focus', -1)], ['usa_mcarthur_in_command']),
            f('usa_all_to_general_staff', '一切归于总参', '军事改革', 46, 4, 6, '集中计划、统一调配，避免战区军阀化。', [E.allT(1), E.pp(3)], ['usa_war_college'], { mutuallyExclusive: ['usa_field_command_autonomy'] }),
            f('usa_field_command_autonomy', '战区指挥自主', '军事改革', 50, 4, 6, '授予前线司令更大机动权限。', [E.money(10), E.capT(3)], ['usa_signal_command'], { mutuallyExclusive: ['usa_all_to_general_staff'] }),
            f('usa_mcnair_report', '麦克奈尔报告', '军事改革', 48, 5, 6, '评估内战中暴露出的编制与训练问题。', [E.pp(4), E.allT(1)], [], { prerequisiteAny: [['usa_all_to_general_staff'], ['usa_field_command_autonomy']] }),
            f('usa_armored_thrust', '装甲突击理论', '军事改革', 46, 6, 7, '把稀缺燃料和工厂优先用于机动作战。', [E.nodeI('PIT', 1), E.capT(3)], ['usa_mcnair_report'], { mutuallyExclusive: ['usa_infantry_superiority'] }),
            f('usa_infantry_superiority', '步兵优势学说', '军事改革', 50, 6, 7, '用火炮、工兵与训练提升普通步兵战力。', [E.allT(2)], ['usa_mcnair_report'], { mutuallyExclusive: ['usa_armored_thrust'] }),
            f('usa_armor_school', '装甲学校', '军事改革', 45, 7, 7, '训练装甲与机械化部队。', [E.gAtk(0.05), E.capT(2)], ['usa_armored_thrust']),
            f('usa_paratroopers', '伞兵部队', '军事改革', 47, 7, 7, '组建空降突击力量。', [E.gAtk(0.05), E.actionCost('move', -1)], ['usa_armored_thrust']),
            f('usa_infantry_school', '步兵学校', '军事改革', 49, 7, 7, '把步兵训练成多面手。', [E.allT(1), E.recruitCost(-1)], ['usa_infantry_superiority']),
            f('usa_artillery_command', '炮兵司令部', '军事改革', 51, 7, 7, '统一调度首都圈炮兵。', [E.gDef(0.05), E.allT(1)], ['usa_infantry_superiority']),
            f('usa_joint_operations', '联合战役司令部', '军事改革', 48, 8, 9, '把陆军、航空队与海军支援纳入统一战役计划。', [E.pp(6), E.capT(4)], [], { prerequisiteAny: [['usa_armored_thrust'], ['usa_infantry_superiority']] }),
            f('usa_corps_area_commands', '军管区司令部', '军事改革', 46, 9, 9, '沿旧陆军军管区恢复后方训练、补员与治安。', [E.allCapT(2), E.gDef(0.05), E.freeT(3)], [], { prerequisiteAny: [['usa_joint_operations'], ['usa_pentagon_planning_rooms']] }),
            f('usa_combined_arms', '合成兵种', '军事改革', 50, 9, 9, '把装甲、步兵、炮兵与空中支援合成一体。', [E.gAtk(0.05), E.allT(1)], ['usa_joint_operations']),
            f('usa_grand_army', '大陆军', '军事改革', 48, 10, 11, '把联邦军重建为可决定内战的大陆军。', [E.gAtk(0.05), E.allCapT(3), E.capT(4)], [], { prerequisiteAny: [['usa_corps_area_commands'], ['usa_combined_arms']] }),

            // ===================== 支线·经济：经济动员｜战争经济（梯子）=====================
            f('usa_emergency_industry_board', '紧急工业委员会', '经济动员', 56, 1, 5, '将军工合同、铁路运输与原料配给集中审查。', [E.money(15), E.capI(1)], ['usa_secure_command']),
            f('usa_war_bonds_drive', '战争债券宣传', '经济动员', 56, 2, 5, '向忠诚城市发行短期债券。', [E.money(25)], ['usa_emergency_industry_board']),
            f('usa_arsenal_of_the_capital', '首都兵工厂', '经济动员', 55, 3, 6, '扩建首都圈军工产能。', [E.capI(2)], ['usa_war_bonds_drive']),
            f('usa_rail_coordination', '铁路统筹', '经济动员', 57, 3, 6, '把军列优先权写进合同而非命令。', [E.maint(-0.02), E.moneyIncome(1)], ['usa_war_bonds_drive']),
            f('usa_military_factories_first', '军工优先', '经济动员', 55, 4, 7, '牺牲民生恢复速度，优先扩大前线军需。', [E.allI(1, 4)], ['usa_arsenal_of_the_capital'], { mutuallyExclusive: ['usa_civilian_retooling'] }),
            f('usa_civilian_retooling', '民用复产', '经济动员', 57, 4, 7, '保住城市财政与运输体系，再反哺战争。', [E.money(35)], ['usa_rail_coordination'], { mutuallyExclusive: ['usa_military_factories_first'] }),
            f('usa_steel_quotas', '钢铁配额', '经济动员', 54, 5, 7, '对匹兹堡钢厂下达战时配额。', [E.nodeI('PIT', 1), E.allI(1, 2)], ['usa_military_factories_first']),
            f('usa_detroit_lines', '底特律生产线', '经济动员', 58, 5, 7, '把汽车工业转产军车与坦克。', [E.nodeI('DET', 1), E.allI(1, 2)], ['usa_civilian_retooling']),
            f('usa_treasury_reorganization', '财政部重组', '经济动员', 56, 5, 8, '建立战时预算与维护费优先级。', [E.money(20), E.pp(5)], [], { prerequisiteAny: [['usa_military_factories_first'], ['usa_civilian_retooling']] }),
            f('usa_federal_rail_contracts', '联邦铁路合同', '经济动员', 54, 6, 8, '把军列优先权写进合同，减少城市工业摩擦。', [E.maint(-0.03), E.moneyIncome(1)], ['usa_steel_quotas']),
            f('usa_lend_lease_industry', '租借工业', '经济动员', 58, 6, 8, '为协约国生产军备换取硬通货。', [E.money(20), E.moneyIncome(1)], ['usa_detroit_lines']),
            f('usa_war_finance_board', '战时金融委员会', '经济动员', 56, 6, 8, '统一战债、税收与拨款。', [E.moneyIncome(2), E.bonds(30, 5, 4)], ['usa_treasury_reorganization']),
            f('usa_total_war_production', '全面战争生产', '经济动员', 56, 7, 10, '把所有剩余工业纳入统一战争经济。', [E.allI(1, 6), E.money(20)], [], { prerequisiteAny: [['usa_federal_rail_contracts'], ['usa_lend_lease_industry'], ['usa_war_finance_board']] }),
            f('usa_arsenal_of_democracy', '民主兵工厂', '经济动员', 56, 8, 11, '把联邦工业潜力转化为可碾压叛军的兵工厂。', [E.allI(1, 5), E.moneyIncome(2), E.capBoost(1, 3)], ['usa_total_war_production']),

            // ===================== 支线·海空军：大西洋舰队｜三叉戟 =====================
            f('usa_reopen_naval_bureau', '重开海军局', '海空军', 64, 1, 5, '恢复东海岸港口与海军仓库的最低运转。', [E.tagT('港口', 1)], ['usa_secure_command']),
            f('usa_atlantic_patrols', '大西洋巡逻线', '海空军', 63, 2, 6, '守住诺福克、巴尔的摩与纽约的海上补给。', [E.money(12), E.tagT('港口', 1)], ['usa_reopen_naval_bureau']),
            f('usa_army_air_corps', '陆军航空队', '海空军', 65, 2, 6, '用侦察与近距支援补足前线兵力不足。', [E.pp(4), E.gAtk(0.05)], ['usa_reopen_naval_bureau']),
            f('usa_capital_shipyard_ring', '首都船厂环', '海空军', 62, 3, 7, '诺福克、巴尔的摩与费城船厂组成首都外圈补给链。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['usa_atlantic_patrols']),
            f('usa_convoy_escorts', '护航舰队', '海空军', 63, 3, 7, '组织反潜护航保住海上补给。', [E.tagD('港口', 0.05), E.tagT('港口', 1)], ['usa_atlantic_patrols']),
            f('usa_strategic_bombing', '战略轰炸', '海空军', 65, 3, 7, '用重型轰炸机打击叛军工业。', [E.damage(1, 3), E.gAtk(0.05)], ['usa_army_air_corps']),
            f('usa_naval_aviation', '海军航空兵', '海空军', 66, 3, 7, '发展舰载航空兵掩护舰队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['usa_army_air_corps']),
            f('usa_harbor_forts', '海岸要塞', '海空军', 62, 4, 7, '把首都圈港口要塞化。', [E.gDef(0.05), E.tagD('港口', 0.10)], ['usa_capital_shipyard_ring']),
            f('usa_atlantic_fleet', '大西洋舰队', '海空军', 63, 4, 8, '把巡逻与护航整编为大西洋舰队。', [E.tagT('港口', 2), E.tagD('港口', 0.05)], ['usa_convoy_escorts']),
            f('usa_air_superiority', '制空权', '海空军', 65, 4, 7, '夺取东海岸上空的制空权。', [E.gAtk(0.05), E.gDef(0.05)], ['usa_strategic_bombing']),
            f('usa_chief_of_combined_operations', '联合作战部长', '海空军', 64, 5, 9, '海空军支援不再各自为战。', [E.pp(8), E.tagT('港口', 1)], [], { prerequisiteAny: [['usa_atlantic_fleet'], ['usa_air_superiority'], ['usa_harbor_forts']] }),
            f('usa_two_ocean_navy', '两洋海军', '海空军', 64, 6, 10, '把联邦海军重建为可投射两洋的力量。', [E.tagT('港口', 2), E.gAtk(0.05), E.allCapT(2)], ['usa_chief_of_combined_operations']),

            // ===================== 支线·外交：门罗主义｜西半球（星辐）=====================
            f('usa_plan_for_reconstruction', '重建白皮书', '门罗主义', 73, 1, 5, '在战争还没结束时就准备战后治理方案。', [E.pp(4)], ['usa_secure_command']),
            f('usa_restore_federal_courts', '恢复联邦法院', '门罗主义', 73, 2, 6, '让被军令压住的司法体系逐步恢复。', [E.money(12), E.pp(4)], ['usa_plan_for_reconstruction']),
            f('usa_rebuild_monroe_doctrine', '重建门罗主义', '门罗主义', 71, 3, 7, '把重心放在西半球秩序。', [E.money(18)], ['usa_restore_federal_courts'], { mutuallyExclusive: ['usa_enter_the_fray', 'usa_fortress_america'] }),
            f('usa_enter_the_fray', '加入世界风暴', '门罗主义', 73, 3, 7, '以美国回归世界战争作为战后合法性。', [E.pp(9)], ['usa_restore_federal_courts'], { mutuallyExclusive: ['usa_rebuild_monroe_doctrine', 'usa_fortress_america'] }),
            f('usa_fortress_america', '美洲堡垒', '门罗主义', 75, 3, 7, '拒绝海外冒险，优先巩固大陆。', [E.allI(1, 3)], ['usa_restore_federal_courts'], { mutuallyExclusive: ['usa_rebuild_monroe_doctrine', 'usa_enter_the_fray'] }),
            f('usa_league_of_american_states', '美洲国家联盟', '门罗主义', 70, 4, 9, '把门罗主义改造成战时外交机器。', [E.moneyIncome(1), E.pp(6), E.tagMoney('港口', 8)], ['usa_rebuild_monroe_doctrine']),
            f('usa_pan_american_pact', '泛美公约', '门罗主义', 72, 4, 8, '与拉美国家签订泛美防务公约。', [E.money(15), E.tagInc('港口', 1)], ['usa_rebuild_monroe_doctrine']),
            f('usa_entente_embarkation', '远征军登船', '门罗主义', 73, 4, 9, '美国不再只是内战的幸存者，而是世界战争的新砝码。', [E.gAtk(0.05), E.tagT('港口', 2), E.capTroop(1)], ['usa_enter_the_fray']),
            f('usa_continental_fortress_line', '大陆堡垒线', '门罗主义', 75, 4, 9, '把铁路、港口与首都圈接成长期隔离主义防线。', [E.gDef(0.05), E.allCapT(3), E.maint(-0.03)], ['usa_fortress_america']),
            f('usa_hemisphere_defense', '半球防御计划', '门罗主义', 73, 5, 8, '沿海、港口与首都圈进入长期防御规划。', [E.tagT('港口', 2), E.capT(4)], [], { prerequisiteAny: [['usa_league_of_american_states'], ['usa_pan_american_pact'], ['usa_entente_embarkation'], ['usa_continental_fortress_line']] }),
            f('usa_arsenal_of_the_hemisphere', '半球兵工厂', '门罗主义', 71, 5, 8, '把西半球资源接入联邦战争经济。', [E.moneyIncome(2), E.tagInc('港口', 1)], ['usa_league_of_american_states']),
            f('usa_world_power', '世界强国', '门罗主义', 73, 6, 10, '把战后的合众国重新塑造成世界强国。', [E.pp(6), E.gAtk(0.05), E.allCapT(2)], [], { prerequisiteAny: [['usa_hemisphere_defense'], ['usa_entente_embarkation']] }),
            f('usa_billions_for_roads', '十亿修路法案', '门罗主义', 75, 6, 9, '把战时军运网络变成统一美国的骨架。', [E.money(30), E.allI(1, 4), E.maint(-0.02)], ['usa_continental_fortress_line']),
            f('usa_american_century', '美利坚世纪', '门罗主义', 73, 7, 12, '战火没有压垮联邦，反而把它铸成了一个新的世纪。', [E.ppIncome(2), E.gAtk(0.05), E.gDef(0.05), E.allI(1, 4), E.badge('美利坚世纪')], ['usa_world_power'])
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
