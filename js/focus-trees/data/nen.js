// 国策数据：NEN（新英格兰 / KX Lovecraftian New England）。
// 手工布局：每条线一种独立轮廓，坐标在此即最终位置（NEN 已从 placeNewEngland 与所有后处理器中排除）。
// 政治线＝4 选 1 互斥：自由州(镇会钟楼) / 商贸委员会(码头天平) / 保护协定(盾徽王冠) / 普罗维登斯学社(洛夫克拉夫特·触手星)。
// 洛线后期裂为三神（克苏鲁 / 犹格-索托斯 / 奈亚拉托提普）三选一。支线：海岸防务 / 扬基经济 / 哈德逊外交。终局合流共同体授权。
// 意识形态守卫：每条线子分叉臂带各自意识形态，合流节点不带 ideo；洛线 eldritch_revelation 不带 ideo，必须再选一神才到终局。
(function (g) {
    g.FocusData = g.FocusData || {};
    g.FocusData.NEN = function (f, E) {
        const POL_ME = ['NEN_liberal_path', 'NEN_merchant_path', 'NEN_protectorate_path', 'NEN_providence_path'];
        const meOthers = (id) => ({ mutuallyExclusive: POL_ME.filter(x => x !== id) });
        return [
            // ===================== 根 + 公约（4 线分叉柄） =====================
            f('NEN_defense_council', '波士顿防务委员会', '战时统合', 13, 0, 4, '小而富裕的新英格兰需要把港口、议会和民兵组织起来。', [E.pp(4), E.capT(2)]),
            f('NEN_compact_convention', '新英格兰公约', '政治路线', 13, 1, 5, '在自由州传统、商贸寡头、外部保护与普罗维登斯学社之间选择重心。', [E.pp(3), E.tagD('港口', 0.05)], ['NEN_defense_council']),

            // ===================== 线 A：自由州（镇会/贵格）｜形状＝镇会钟楼 =====================
            f('NEN_liberal_path', '自由州路线', '自由州', 2, 2, 6, '保持镇会、州议会和公民民兵传统。', [E.pp(3), E.ppCap(2)], ['NEN_compact_convention'], meOthers('NEN_liberal_path')),
            f('NEN_town_meetings', '镇会网络', '自由州', 2, 3, 6, '把镇会改造成战时动员节点。', [E.money(8), E.freeT(2)], ['NEN_liberal_path']),
            f('NEN_civic_militia', '公民民兵', '自由州', 2, 4, 7, '让公民民兵承担海岸与仓库守备。', [E.recruitAmount(1), E.tagT('港口', 1)], ['NEN_town_meetings']),
            f('NEN_civil_liberties', '保留公民自由', '自由州', 2, 5, 7, '用透明程序保持小国合法性。', [E.ppIncome(1), E.crisis(3)], ['NEN_civic_militia']),
            f('NEN_quaker_meeting', '贵格会', '自由州', 0, 6, 6, '贵格会的良心传统进入战时政治。', [E.ppIncome(1), E.maint(-0.02)], ['NEN_civil_liberties']),
            f('NEN_town_charter', '镇会宪章', '自由州', 4, 6, 6, '把镇会自治写成成文宪章。', [E.ppCap(2), E.pp(3)], ['NEN_civil_liberties']),
            // 钟楼分叉：镇会民主 vs 贵格和平
            f('NEN_town_democracy', '镇会民主', '自由州', 1, 6, 7, '把镇会民主升格为战时国体。', [E.ppCap(2), E.ppIncome(1)], ['NEN_civil_liberties'], { mutuallyExclusive: ['NEN_quaker_pacifism'] }),
            f('NEN_quaker_pacifism', '贵格和平主义', '自由州', 3, 6, 7, '以贵格和平见证组织一种防御型政体。', [E.ppIncome(1), E.gDef(0.05)], ['NEN_civil_liberties'], { mutuallyExclusive: ['NEN_town_democracy'] }),
            f('NEN_volunteer_brigades', '志愿军旅', '自由州', 0, 7, 6, '在港口设招募站编成志愿军旅。', [E.allT(1), E.tagD('港口', 0.05)], ['NEN_quaker_meeting']),
            f('NEN_selectmen_boards', '行政委员会', '自由州', 4, 7, 6, '由民选行政委员会管理战时市镇。', [E.money(8), E.ppCap(2)], ['NEN_town_charter']),
            f('NEN_state_compacts', '州际契约', '自由州', 1, 7, 8, '把各州战争义务写成公开契约。', [E.maint(-0.03), E.actionCost('focus', -1)], ['NEN_town_democracy']),
            f('NEN_republic_of_towns', '镇会共和国', '自由州', 1, 8, 9, '以地方自治定义新英格兰政体。', [E.ppCap(3), E.pp(5), E.tagD('港口', 0.10), E.ideo('wartime_democracy', '新英格兰', '新英格兰')], ['NEN_state_compacts']),
            f('NEN_peace_testimony', '和平见证', '自由州', 3, 7, 8, '以和平见证组织非攻防御。', [E.ppIncome(1), E.freeT(3)], ['NEN_quaker_pacifism']),
            f('NEN_quaker_commonwealth', '贵格共同体', '自由州', 3, 8, 9, '把贵格和平传统升格为共同体国家。', [E.ppCap(2), E.gDef(0.05), E.freeT(2), E.ideo('quaker_commonwealth', '新英格兰公谊邦', '公谊邦')], ['NEN_peace_testimony']),
            f('NEN_free_commonwealth', '自由共同体', '自由州', 2, 9, 11, '无论镇会还是贵格，新英格兰都凝成一个自由共同体。', [E.ppCap(3), E.tagD('港口', 0.05), E.allCapT(2), E.badge('自由共同体')], [], { prerequisiteAny: [['NEN_republic_of_towns'], ['NEN_quaker_commonwealth']] }),

            // ===================== 线 B：商贸委员会（航运/An-Cap）｜形状＝码头天平 =====================
            f('NEN_merchant_path', '商贸委员会路线', '商贸委员会', 9, 2, 6, '让航运商、银行和军需承包商承担国家能力。', [E.money(14), E.tagInc('港口', 1)], ['NEN_compact_convention'], meOthers('NEN_merchant_path')),
            f('NEN_harbor_banks', '港口银行', '商贸委员会', 9, 3, 6, '用港口金融维持战争信用。', [E.moneyIncome(1), E.bonds(20, 3, 3)], ['NEN_merchant_path']),
            f('NEN_shipping_registry', '船运登记', '商贸委员会', 7, 4, 6, '所有船运进入战时登记。', [E.tagT('港口', 1), E.tagInc('港口', 1)], ['NEN_harbor_banks']),
            f('NEN_merchant_exchange', '商人交易所', '商贸委员会', 9, 4, 6, '重开商人交易所协调战时贸易。', [E.money(12), E.moneyIncome(1)], ['NEN_harbor_banks']),
            f('NEN_free_ports', '自由港', '商贸委员会', 11, 4, 6, '把港口辟为低关税自由港。', [E.moneyIncome(1), E.money(10)], ['NEN_harbor_banks']),
            f('NEN_insurance_pool', '保险共济池', '商贸委员会', 7, 5, 7, '分摊海运与港口损失。', [E.maint(-0.03), E.tagD('港口', 0.05)], ['NEN_shipping_registry']),
            f('NEN_private_charters', '私营特许', '商贸委员会', 11, 5, 7, '向私营公司颁发战时特许。', [E.moneyIncome(1), E.capMoney(2)], ['NEN_free_ports']),
            f('NEN_privateer_charters', '私掠特许状', '商贸委员会', 7, 6, 7, '向船主颁发私掠特许状自负盈亏。', [E.capMoney(2), E.tagT('港口', 1)], ['NEN_insurance_pool']),
            // 天平分叉：航运财阀 vs 无政府资本
            f('NEN_shipping_magnates', '航运财阀', '商贸委员会', 8, 6, 7, '航运财阀主导外交与采购。', [E.moneyIncome(2), E.tagMoney('港口', 8)], ['NEN_merchant_exchange'], { mutuallyExclusive: ['NEN_anarcho_capital'] }),
            f('NEN_anarcho_capital', '无政府资本', '商贸委员会', 10, 6, 7, '把国家职能外包给私营公司与私法。', [E.moneyIncome(2), E.recruitCost(-1)], ['NEN_merchant_exchange'], { mutuallyExclusive: ['NEN_shipping_magnates'] }),
            f('NEN_merchant_cabinet', '商人内阁', '商贸委员会', 8, 7, 8, '由商贸集团协调外交与采购。', [E.pp(4), E.tagMoney('港口', 8)], ['NEN_shipping_magnates']),
            f('NEN_atlantic_ledger', '大西洋账簿', '商贸委员会', 8, 8, 9, '以贸易账簿支撑国家运转。', [E.moneyIncome(2), E.actionCost('build', -1), E.allI(1, 2), E.ideo('plutocracy', '新英格兰商团', '商团')], ['NEN_merchant_cabinet']),
            f('NEN_private_law', '私法社会', '商贸委员会', 10, 7, 8, '用私法仲裁取代公共行政。', [E.moneyIncome(1), E.maint(-0.02)], ['NEN_anarcho_capital']),
            f('NEN_ancap_commonwealth', '无政府资本共同体', '商贸委员会', 10, 8, 9, '把私营与私法升格为国家形态。', [E.moneyIncome(2), E.recruitCost(-1), E.freeT(2), E.ideo('anarcho_capitalism', '自由港邦联', '自由港')], ['NEN_private_law']),
            f('NEN_merchant_state', '商贸共同体', '商贸委员会', 9, 9, 11, '无论财阀还是无政府资本，贸易都成了国家命脉。', [E.moneyIncome(2), E.tagInc('港口', 1), E.allCapT(2), E.badge('商贸共同体')], [], { prerequisiteAny: [['NEN_atlantic_ledger'], ['NEN_ancap_commonwealth']] }),

            // ===================== 线 C：保护协定（加拿大保护/君主）｜形状＝盾徽王冠 =====================
            f('NEN_protectorate_path', '保护协定路线', '保护协定', 16, 2, 6, '接受加拿大-英联邦影响，换取安全与物资。', [E.capT(2), E.money(12)], ['NEN_compact_convention'], meOthers('NEN_protectorate_path')),
            f('NEN_foreign_liaison', '外部联络团', '保护协定', 16, 3, 6, '设立与境外势力沟通的常设渠道。', [E.money(10), E.freeT(3)], ['NEN_protectorate_path']),
            f('NEN_advisory_mission', '军事顾问团', '保护协定', 14, 4, 6, '邀请顾问帮助整训小型军队。', [E.allT(1), E.gDef(0.05)], ['NEN_foreign_liaison']),
            f('NEN_dominion_charter', '自治领章程', '保护协定', 16, 4, 6, '草拟接受保护的自治领章程。', [E.pp(3), E.ppCap(2)], ['NEN_foreign_liaison']),
            f('NEN_royal_circle', '保王派圈子', '保护协定', 18, 4, 6, '保王派开始谋划复辟君主。', [E.ppCap(2), E.money(10)], ['NEN_foreign_liaison']),
            f('NEN_joint_harbor_watch', '联合港口巡防', '保护协定', 14, 5, 7, '让港口情报共享制度化。', [E.maint(-0.02), E.tagD('港口', 0.10)], ['NEN_advisory_mission']),
            f('NEN_lend_lease_office', '租借物资署', '保护协定', 14, 6, 7, '用英联邦租借物资换取长期债务承诺。', [E.bonds(20, 3, 3), E.allI(1, 2)], ['NEN_joint_harbor_watch']),
            f('NEN_loyalist_press', '保王派报系', '保护协定', 18, 5, 7, '保王派报系造势复辟。', [E.pp(3), E.crisis(2)], ['NEN_royal_circle']),
            // 盾徽分叉：加拿大保护 vs 复辟君主
            f('NEN_canadian_protectorate', '加拿大保护', '保护协定', 15, 6, 7, '正式接受加拿大-英联邦的保护框架。', [E.tagD('港口', 0.10), E.allCapT(2)], ['NEN_dominion_charter'], { mutuallyExclusive: ['NEN_restored_monarchy'] }),
            f('NEN_restored_monarchy', '复辟君主', '保护协定', 17, 6, 7, '在新英格兰复辟一个立宪君主。', [E.ppCap(2), E.allCapT(2)], ['NEN_dominion_charter'], { mutuallyExclusive: ['NEN_canadian_protectorate'] }),
            f('NEN_import_controls', '进口管制', '保护协定', 15, 7, 8, '以进口配额换取战略物资。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['NEN_canadian_protectorate']),
            f('NEN_shielded_commonwealth', '受保护共同体', '保护协定', 15, 8, 9, '把保护协定转化为长期安全框架。', [E.ppIncome(1), E.allCapT(3), E.tagD('港口', 0.10), E.ideo('security_state', '新英格兰戒严国', '戒严国')], ['NEN_import_controls']),
            f('NEN_crown_council', '王室议事会', '保护协定', 17, 7, 8, '设立王室议事会主持复辟政体。', [E.ppCap(2), E.money(10)], ['NEN_restored_monarchy']),
            f('NEN_new_england_crown', '新英格兰王冠', '保护协定', 17, 8, 9, '为新英格兰加冕一个立宪君主。', [E.ppCap(3), E.gDef(0.05), E.allCapT(2), E.ideo('new_england_monarchy', '新英格兰王国', '新英格兰王国')], ['NEN_crown_council']),
            f('NEN_protected_realm', '受护王国', '保护协定', 16, 9, 11, '无论保护领还是王冠，新英格兰都成为受护的王国。', [E.allCapT(2), E.tagD('港口', 0.05), E.gDef(0.05), E.badge('受护王国')], [], { prerequisiteAny: [['NEN_shielded_commonwealth'], ['NEN_new_england_crown']] }),

            // ===================== 线 D：普罗维登斯学社（洛夫克拉夫特）｜形状＝触手星 =====================
            f('NEN_providence_path', '普罗维登斯学社', '普罗维登斯学社', 26, 2, 6, '一群作家、神秘学者和反战名流聚集在普罗维登斯，宣称看见了人类历史之外的事物。', [E.pp(3), E.crisis(3)], ['NEN_compact_convention'], meOthers('NEN_providence_path')),
            f('NEN_arkham_commission', '阿卡姆调查委员会', '普罗维登斯学社', 26, 3, 6, '阿卡姆与密斯卡塔尼克的学者公开承认：他们正在阅读不该被阅读的文本。', [E.pp(3), E.capI(1)], ['NEN_providence_path']),
            f('NEN_pickman_gallery', '皮克曼画廊', '普罗维登斯学社', 24, 3, 6, '皮克曼的画作泄露了地底的真实。', [E.pp(3), E.crisis(2)], ['NEN_providence_path']),
            f('NEN_whateley_clan', '沃特利家族', '普罗维登斯学社', 28, 3, 6, '敦威治的沃特利家族带来了血脉与仪式。', [E.recruitAmount(1), E.crisis(2)], ['NEN_providence_path']),
            f('NEN_innsmouth_files', '印斯茅斯档案', '普罗维登斯学社', 26, 4, 7, '海岸渔村的真实情况被秘密整理成内部档案，决策圈震动。', [E.tagT('港口', 1), E.tagD('港口', 0.10), E.crisis(3)], ['NEN_arkham_commission']),
            f('NEN_starry_wisdom', '星之智慧教派', '普罗维登斯学社', 24, 4, 7, '星之智慧教派在港口、大学和州府布置小组。', [E.ppIncome(1), E.crisis(4)], ['NEN_pickman_gallery']),
            f('NEN_miskatonic_university', '密斯卡塔尼克大学', '普罗维登斯学社', 28, 4, 7, '密斯卡塔尼克大学把禁书与标本投入研究。', [E.capI(1), E.capBoost(1, 2)], ['NEN_whateley_clan']),
            f('NEN_dunwich_excavations', '敦威治发掘', '普罗维登斯学社', 26, 5, 7, '在敦威治山丘下出土了不属于人类的物件。', [E.actionCost('build', -1), E.allI(1, 2)], ['NEN_innsmouth_files']),
            f('NEN_innsmouth_pact', '印斯茅斯之约', '普罗维登斯学社', 24, 5, 7, '与海中的深潜者达成秘密之约。', [E.tagT('港口', 1), E.recruitAmount(1)], ['NEN_starry_wisdom']),
            f('NEN_dunwich_horror_project', '敦威治计划', '普罗维登斯学社', 28, 5, 8, '把不可解释的能量投入秘密军工。', [E.allI(1, 3), E.gAtk(0.05)], ['NEN_miskatonic_university']),
            f('NEN_dreams_in_witch_house', '巫宅之梦', '普罗维登斯学社', 26, 6, 8, '巫宅里出现的梦境被作为情报证据，高层进入半神秘状态。', [E.ppCap(3), E.maint(-0.02)], ['NEN_dunwich_excavations']),
            f('NEN_delta_green', '三角洲绿色', '普罗维登斯学社', 24, 6, 8, '成立只听梦境命令的秘密治安机构。', [E.maint(-0.03), E.freeT(3)], ['NEN_innsmouth_pact']),
            f('NEN_codex_of_providence', '普罗维登斯秘典', '普罗维登斯学社', 28, 6, 9, '所有路线都必须承认洛夫克拉夫特手中的秘典才是最终法源。', [E.ppCap(4), E.crisis(4), E.badge('普罗维登斯秘典')], ['NEN_dunwich_horror_project'], { progressRequired: 5 }),
            f('NEN_eldritch_revelation', '古旧启示', '普罗维登斯学社', 26, 7, 9, '洛夫克拉夫特宣布"另一些存在"已经回到地球，要求新英格兰为最后选择做好准备。', [E.pp(6), E.ppCap(2), E.allCapT(2), E.badge('普罗维登斯学社')], ['NEN_dreams_in_witch_house'], { progressRequired: 5 }),
            // 三神触手收束（洛线终局，guarded）
            f('NEN_call_of_providence', '回应普罗维登斯之召', '普罗维登斯学社', 27, 12, 13, '新英格兰从一个小共和国变成了故事本身，玩家选择的旧日分支获得最终形态。', [E.ppCap(5), E.gAtk(0.05), E.gDef(0.05), E.allCapT(5), E.badge('回应普罗维登斯之召')], [], { prerequisiteAny: [['NEN_cthulhu_raid'], ['NEN_yog_omniscience'], ['NEN_nyarl_crawling_chaos']], progressRequired: 6 }),

            // 三神之一：克苏鲁觉醒（黄衣之王）
            f('NEN_branch_cthulhu', '克苏鲁觉醒', '克苏鲁觉醒', 22, 8, 11, '海中沉眠的存在被唤醒，新英格兰成为旧日支配者的祭坛。', [E.gAtk(0.10), E.allCapT(4), E.capTroop(2), E.damage(2, 3), E.badge('克苏鲁觉醒'), E.ideo('cthulhu_cult', '旧日支配国', '旧日支配')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_yog', 'NEN_branch_nyarl'], progressRequired: 6 }),
            f('NEN_cthulhu_dread_fleet', '深潜者舰队', '克苏鲁觉醒', 21, 9, 9, '深潜者从海中浮出，主动攻击邻近港口。', [E.tagT('港口', 2), E.gAtk(0.05), E.capMoney(2)], ['NEN_branch_cthulhu']),
            f('NEN_cthulhu_kingdom', '黄衣之国', '克苏鲁觉醒', 23, 9, 12, '洛夫克拉夫特宣布自己为黄衣之王，新英格兰转入永远的战争状态。', [E.gAtk(0.05), E.capMoney(4), E.damage(2, 3), E.ppCap(3), E.badge('黄衣之王')], ['NEN_branch_cthulhu']),
            f('NEN_cthulhu_tides', '疯潮上岸', '克苏鲁觉醒', 21, 10, 10, '海岸城镇在夜里开门，敌人的港口防线开始自己崩解。', [E.tagT('港口', 2), E.damage(2, 3), E.gAtk(0.05)], ['NEN_cthulhu_dread_fleet']),
            f('NEN_deep_ones', '深潜者崛起', '克苏鲁觉醒', 23, 10, 10, '深潜者大规模登陆，占领带来俘虏与物资。', [E.tagT('港口', 1), E.damage(1, 2)], ['NEN_cthulhu_kingdom']),
            f('NEN_rlyeh', '拉莱耶浮现', '克苏鲁觉醒', 23, 11, 11, '沉没之城浮出海面，敌人在恐惧中崩溃。', [E.allCapT(2), E.crisis(3)], ['NEN_deep_ones']),
            f('NEN_cthulhu_raid', '深海突袭令', '克苏鲁觉醒', 22, 11, 11, '占领不再只带来土地，还会带来被恐惧驱赶来的俘虏与物资。', [E.capTroop(2), E.capMoney(5)], [], { prerequisiteAny: [['NEN_cthulhu_tides'], ['NEN_deep_ones']] }),

            // 三神之二：犹格-索托斯之钥（无所不知）
            f('NEN_branch_yog', '犹格-索托斯之钥', '犹格-索托斯之钥', 27, 8, 11, '密斯卡塔尼克的学者打开了"知道一切"的钥匙，工业和行政以不该有的速度展开。', [E.allI(2, 5), E.capBoost(2, 3), E.actionCost('all', -1), E.ppCap(4), E.badge('犹格-索托斯之钥'), E.ideo('eldritch_knowledge', '犹格-索托斯之钥', '索托斯之钥')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_cthulhu', 'NEN_branch_nyarl'], progressRequired: 6 }),
            f('NEN_yog_silver_key', '银钥', '犹格-索托斯之钥', 26, 9, 9, '兰多夫·卡特的银钥被找到，计划无须执行就已完成。', [E.actionCost('focus', -1), E.actionCost('build', -1), E.capI(2)], ['NEN_branch_yog']),
            f('NEN_yog_non_euclidean', '非欧几里得参谋部', '犹格-索托斯之钥', 28, 9, 10, '参谋部按不存在的直线规划进军，补给表全部对上了。', [E.actionCost('move', -1), E.allI(1, 4)], ['NEN_branch_yog']),
            f('NEN_yog_emperor', '圣人皇帝政体', '犹格-索托斯之钥', 26, 10, 12, '洛夫克拉夫特建立由"知者"组成的寡头共和，无知被视为犯罪。', [E.allI(1, 6), E.moneyIncome(2), E.ppIncome(1), E.capBoost(1, 4)], ['NEN_yog_silver_key']),
            f('NEN_yog_time_table', '时间表已经完成', '犹格-索托斯之钥', 28, 10, 11, '国策不是被推进的，而是在正确时刻被发现已经完成。', [E.actionCost('all', -1), E.ppIncome(1)], ['NEN_yog_non_euclidean']),
            f('NEN_yog_gate', '银钥之门', '犹格-索托斯之钥', 26, 11, 11, '银钥之门开启，时间与空间不再约束行政。', [E.actionCost('all', -1), E.capBoost(1, 2)], ['NEN_yog_emperor']),
            f('NEN_yog_omniscience', '全知政体', '犹格-索托斯之钥', 27, 11, 11, '全知政体把战争变成一道已知答案的算式。', [E.allI(1, 5), E.ppCap(4), E.capBoost(1, 3)], [], { prerequisiteAny: [['NEN_yog_emperor'], ['NEN_yog_time_table']] }),

            // 三神之三：奈亚拉托提普化身（爬行混沌）
            f('NEN_branch_nyarl', '奈亚拉托提普化身', '奈亚拉托提普化身', 31, 8, 11, '"千面"出现在波士顿、奥尔巴尼和缅因，所有政治都不再透明，但所有命令都被执行。', [E.ppIncome(2), E.recruitAmount(2), E.freeT(6), E.crisis(6), E.badge('爬行混沌'), E.ideo('crawling_chaos', '奈亚拉托提普化身国', '千面之国')], ['NEN_eldritch_revelation'], { mutuallyExclusive: ['NEN_branch_cthulhu', 'NEN_branch_yog'], progressRequired: 6 }),
            f('NEN_nyarl_black_pharaoh', '黑色法老', '奈亚拉托提普化身', 30, 9, 9, '黑色法老的形象出现在每一面镜子里，地方治安成本骤减。', [E.maint(-0.05), E.actionCost('move', -1), E.allT(1)], ['NEN_branch_nyarl']),
            f('NEN_nyarl_mask_ministry', '千面部', '奈亚拉托提普化身', 32, 9, 10, '每个地方官都收到一张新面具，谁戴上谁就能命令全城。', [E.ppIncome(2), E.maint(-0.04), E.crisis(4)], ['NEN_branch_nyarl']),
            f('NEN_nyarl_haunter', '黑暗中的潜伏者', '奈亚拉托提普化身', 30, 10, 12, '敌人首都开始流传"被人在睡梦中看见"的报告。', [E.damage(2, 4), E.crisis(5), E.allCapT(3), E.gAtk(0.05)], ['NEN_nyarl_black_pharaoh']),
            f('NEN_nyarl_laughter_coup', '笑声政变', '奈亚拉托提普化身', 32, 10, 11, '敌方高层开始互相怀疑，战线在没有枪声的夜里裂开。', [E.damage(2, 4), E.freeT(6)], ['NEN_nyarl_mask_ministry']),
            f('NEN_nyarl_thousand_masks', '千面千身', '奈亚拉托提普化身', 32, 11, 11, '千面千身渗入每一座城市，命令无须解释。', [E.ppIncome(2), E.maint(-0.04)], ['NEN_nyarl_laughter_coup']),
            f('NEN_nyarl_crawling_chaos', '爬行混沌降临', '奈亚拉托提普化身', 31, 11, 11, '爬行混沌降临，新英格兰几乎不需要直接进攻。', [E.crisis(6), E.freeT(6), E.ppIncome(2)], [], { prerequisiteAny: [['NEN_nyarl_haunter'], ['NEN_nyarl_laughter_coup']] }),

            // ===================== 政治终局：合流 =====================
            f('NEN_commonwealth_mandate', '共同体授权', '政治路线', 13, 13, 12, '把所选政治路线塑造成可长期维持的国家形态。', [E.ppIncome(1), E.tagD('港口', 0.05), E.allCapT(2), E.badge('共同体授权')], [], { prerequisiteAny: [['NEN_free_commonwealth'], ['NEN_merchant_state'], ['NEN_protected_realm'], ['NEN_call_of_providence']] }),

            // ===================== 支线·军事：海岸防务｜形状＝三叉（海岸/山林/海军） =====================
            f('NEN_general_staff', '新英格兰防务参谋部', '海岸防务', 37, 1, 5, '围绕港口、山地与城市纵深建立小型精锐防务。', [E.capT(3)], ['NEN_defense_council']),
            f('NEN_coastal_doctrine', '海岸堡垒', '海岸防务', 34, 2, 6, '把港口与海岸线做成迟滞敌人的堡垒网。', [E.tagT('港口', 1), E.tagD('港口', 0.10)], ['NEN_general_staff']),
            f('NEN_ranger_doctrine', '山林游骑', '海岸防务', 37, 2, 6, '利用缅因与阿巴拉契亚山林实施机动作战。', [E.actionCost('move', -1), E.gAtk(0.05)], ['NEN_general_staff']),
            f('NEN_harbor_fleet', '港湾舰队', '海岸防务', 40, 2, 6, '把民用船团改造成港湾舰队。', [E.tagT('港口', 1), E.tagD('港口', 0.05)], ['NEN_general_staff']),
            f('NEN_minutemen', '民兵团', '海岸防务', 35, 3, 6, '组织随时应召的民兵团。', [E.recruitAmount(1), E.freeT(2)], ['NEN_coastal_doctrine']),
            f('NEN_coast_signal', '海岸信号站', '海岸防务', 36, 4, 6, '沿海岸建立信号与预警站。', [E.allCapT(2), E.actionCost('focus', -1)], ['NEN_coastal_artillery']),
            f('NEN_yankee_rangers', '扬基游骑小径', '海岸防务', 39, 3, 6, '游骑兵沿森林、港湾和铁路支线机动。', [E.actionCost('move', -1), E.damage(1, 2)], ['NEN_harbor_fleet']),
            f('NEN_coastal_artillery', '海岸炮兵学校', '海岸防务', 34, 3, 7, '把炮兵与港防写进训练手册。', [E.allT(1), E.tagD('港口', 0.05)], ['NEN_coastal_doctrine']),
            f('NEN_harbor_command', '港防司令部', '海岸防务', 34, 4, 8, '用海岸要塞链锁住港口接近线。', [E.gDef(0.05), E.tagD('港口', 0.10)], ['NEN_coastal_artillery']),
            f('NEN_fortress_chain', '海岸要塞链', '海岸防务', 34, 5, 8, '把海岸炮台连成一条要塞链。', [E.gDef(0.05), E.allCapT(2)], ['NEN_harbor_command']),
            f('NEN_minefields', '水雷区', '海岸防务', 34, 6, 7, '在港口接近线布设水雷区。', [E.tagD('港口', 0.10), E.damage(1, 2)], ['NEN_fortress_chain']),
            f('NEN_ranger_training', '游骑训练营', '海岸防务', 37, 3, 7, '把游骑兵编成小队精锐。', [E.recruitAmount(1), E.actionCost('move', -1)], ['NEN_ranger_doctrine']),
            f('NEN_ranger_command', '山林指挥站', '海岸防务', 37, 4, 8, '为游骑队建立长程指挥。', [E.capT(4), E.gAtk(0.05)], ['NEN_ranger_training']),
            f('NEN_green_mountain_redoubt', '绿山堡垒', '海岸防务', 37, 5, 8, '把内陆山地当成最后防区。', [E.gDef(0.05), E.freeT(3)], ['NEN_ranger_command']),
            f('NEN_coast_guard', '海岸警卫队', '海岸防务', 40, 3, 7, '组建海岸警卫队巡逻港湾。', [E.tagT('港口', 1), E.maint(-0.02)], ['NEN_harbor_fleet']),
            f('NEN_privateer_fleet', '私掠舰队', '海岸防务', 40, 4, 8, '把私掠船编成袭扰舰队。', [E.capMoney(2), E.tagT('港口', 1)], ['NEN_coast_guard']),
            f('NEN_submarine_watch', '潜艇警戒', '海岸防务', 40, 5, 8, '建立反潜与潜艇警戒网。', [E.tagD('港口', 0.05), E.damage(1, 2)], ['NEN_privateer_fleet']),
            f('NEN_torpedo_boats', '鱼雷艇队', '海岸防务', 40, 6, 7, '组建近海鱼雷艇队。', [E.tagT('港口', 1), E.gAtk(0.05)], ['NEN_submarine_watch']),
            f('NEN_town_reserve', '镇民预备队', '海岸防务', 35, 6, 7, '保留一支镇民预备队。', [E.maint(-0.02), E.freeT(3)], ['NEN_fortress_chain']),
            f('NEN_naval_reserve', '海军预备队', '海岸防务', 39, 6, 7, '保留一支海军预备队。', [E.tagD('港口', 0.05), E.freeT(2)], ['NEN_submarine_watch']),
            f('NEN_northeast_battle_plan', '东北防御计划', '海岸防务', 37, 6, 10, '把海岸、山林与海军纳入统一防御计划。', [E.gDef(0.05), E.allCapT(2), E.tagD('港口', 0.10)], [], { prerequisiteAny: [['NEN_fortress_chain'], ['NEN_green_mountain_redoubt'], ['NEN_submarine_watch']] }),
            f('NEN_yankee_army', '扬基军', '海岸防务', 37, 7, 11, '把海岸与山林劲旅纳入统一的扬基军。', [E.gDef(0.05), E.allCapT(3), E.capT(3)], ['NEN_northeast_battle_plan']),

            // ===================== 支线·经济：扬基经济｜形状＝大学-工坊梯子（金融∥工坊+横档） =====================
            f('NEN_treasury', '波士顿财政局', '扬基经济', 46, 1, 5, '把银行、港口、大学实验室与工坊纳入战时账本。', [E.money(16), E.moneyIncome(1)], ['NEN_defense_council']),
            f('NEN_finance_program', '金融信用', '扬基经济', 44, 2, 6, '用银行信用换取短期战争资源。', [E.money(18), E.bonds(20, 3, 3)], ['NEN_treasury']),
            f('NEN_war_bonds', '战债募集', '扬基经济', 46, 2, 6, '向富裕市镇发行战争债券。', [E.bonds(25, 4, 3), E.moneyIncome(1)], ['NEN_treasury']),
            f('NEN_workshop_program', '精密工坊', '扬基经济', 48, 2, 6, '发挥新英格兰小型工坊与大学技术。', [E.capI(1), E.capBoost(1, 1)], ['NEN_treasury']),
            f('NEN_war_notes', '战争票据', '扬基经济', 44, 3, 6, '发行高频低额的战争票据。', [E.bonds(25, 4, 3), E.moneyIncome(1)], ['NEN_finance_program']),
            f('NEN_finance_lab_grid', '金融实验联调', '扬基经济', 46, 3, 6, '把金融与实验室产能联调（横档）。', [E.maint(-0.02), E.allI(1, 2)], ['NEN_finance_program', 'NEN_workshop_program']),
            f('NEN_university_contracts', '大学合同', '扬基经济', 48, 3, 6, '让密斯卡塔尼克与哈佛承担小型军用研究。', [E.capI(1), E.capBoost(1, 2)], ['NEN_workshop_program']),
            f('NEN_harvard_contracts', '哈佛合同', '扬基经济', 42, 3, 6, '让哈佛承担行政与情报研究。', [E.capI(1), E.ppCap(2)], ['NEN_finance_program']),
            f('NEN_mit_labs', '麻省理工实验室', '扬基经济', 50, 3, 6, '麻省理工实验室承担前沿军研。', [E.capBoost(1, 2), E.capI(1)], ['NEN_workshop_program']),
            f('NEN_harbor_credit', '港口信用', '扬基经济', 44, 4, 7, '用港口现金流支撑战时信用。', [E.moneyIncome(1), E.tagMoney('港口', 6)], ['NEN_war_notes']),
            f('NEN_treasury_board', '财政委员会', '扬基经济', 46, 4, 7, '设立统一的战时财政委员会。', [E.moneyIncome(1), E.money(12)], ['NEN_finance_lab_grid']),
            f('NEN_precision_arsenal', '精密军工厂', '扬基经济', 48, 4, 7, '把精密机械投入军工生产。', [E.allI(1, 2), E.tagInc('港口', 1)], ['NEN_university_contracts']),
            f('NEN_boston_tech', '波士顿技术三角', '扬基经济', 42, 4, 7, '大学、精密工坊与港口金融构成技术三角。', [E.capBoost(1, 3), E.moneyIncome(1)], ['NEN_harvard_contracts']),
            f('NEN_aero_workshops', '航空工坊', '扬基经济', 50, 4, 7, '把工坊扩展到航空制造。', [E.allI(1, 2), E.gAtk(0.05)], ['NEN_mit_labs']),
            f('NEN_war_insurance', '战争保险交易所', '扬基经济', 44, 5, 8, '用保险合同分摊港口损失。', [E.bonds(20, 2, 3), E.tagInc('港口', 1)], ['NEN_harbor_credit']),
            f('NEN_procurement_office', '军需采购局', '扬基经济', 46, 5, 7, '把港口现金与工坊产能协同（横档）。', [E.allI(1, 2), E.actionCost('build', -1)], ['NEN_harbor_credit', 'NEN_precision_arsenal']),
            f('NEN_lab_projects', '实验室计划', '扬基经济', 48, 5, 8, '把大学实验室投入秘密军研。', [E.capBoost(1, 2), E.allI(1, 2)], ['NEN_precision_arsenal']),
            f('NEN_endowment_fund', '大学捐赠基金', '扬基经济', 42, 5, 8, '用大学捐赠基金支撑长期研究。', [E.moneyIncome(1), E.money(10)], ['NEN_boston_tech']),
            f('NEN_jet_project', '喷气计划', '扬基经济', 50, 5, 8, '把航空工坊推向喷气推进。', [E.allI(1, 2), E.capBoost(1, 2)], ['NEN_aero_workshops']),
            f('NEN_finance_total', '金融总枢', '扬基经济', 44, 6, 9, '把金融体系整合成战时总枢。', [E.moneyIncome(2), E.money(15)], ['NEN_war_insurance']),
            f('NEN_war_treasury', '战时金库', '扬基经济', 46, 6, 8, '建立战时金库与预算优先级。', [E.moneyIncome(2), E.bonds(30, 5, 4)], ['NEN_procurement_office']),
            f('NEN_workshop_total', '工坊总产', '扬基经济', 48, 6, 9, '把工坊与实验室产能提升到极限。', [E.allI(1, 3), E.capI(1)], ['NEN_lab_projects']),
            f('NEN_finance_boom', '金融繁荣', '扬基经济', 44, 7, 8, '战时金融繁荣带动后方。', [E.moneyIncome(2), E.money(12)], ['NEN_finance_total']),
            f('NEN_efficient_economy', '小国高效经济', '扬基经济', 46, 7, 11, '把经济线转化为可支撑长期内战的高效生产制度。', [E.moneyIncome(2), E.allI(1, 2), E.tagInc('港口', 1)], [], { prerequisiteAny: [['NEN_finance_total'], ['NEN_workshop_total'], ['NEN_war_treasury']] }),

            // ===================== 支线·外交：哈德逊外交｜形状＝菱形 =====================
            f('NEN_regional_office', '东北边界政策', '哈德逊外交', 56, 1, 5, '决定向纽约走廊施压、维持北方安全，还是争取外援。', [E.money(10), E.pp(3)], ['NEN_defense_council']),
            f('NEN_newyork_front', '纽约走廊', '哈德逊外交', 54, 2, 6, '尝试影响奥尔巴尼、纽约与康涅狄格交通线。', [E.money(12), E.crisis(3)], ['NEN_regional_office']),
            f('NEN_atlantic_diplomacy', '大西洋外交', '哈德逊外交', 56, 2, 6, '与协约国就大西洋贸易与援助接触。', [E.pp(3), E.tagInc('港口', 1)], ['NEN_regional_office']),
            f('NEN_north_front', '北方安全', '哈德逊外交', 58, 2, 6, '把缅因与边境森林变成战略缓冲。', [E.allT(1), E.gDef(0.05)], ['NEN_regional_office']),
            f('NEN_nyc_underground', '纽约地下网', '哈德逊外交', 53, 3, 7, '在纽约都会布置地下情报网。', [E.crisis(3), E.damage(1, 2)], ['NEN_newyork_front']),
            f('NEN_hudson_liaisons', '哈德逊联络站', '哈德逊外交', 54, 3, 7, '在奥尔巴尼-纽约交通线设立联络站。', [E.tagT('港口', 1), E.damage(1, 2)], ['NEN_newyork_front']),
            f('NEN_entente_relations', '协约国关系', '哈德逊外交', 56, 3, 7, '与协约国建立长期外交关系。', [E.money(12), E.tagInc('港口', 1)], ['NEN_atlantic_diplomacy']),
            f('NEN_border_patrols', '边境巡防队', '哈德逊外交', 58, 3, 7, '在缅因与山口设巡防队。', [E.maint(-0.02), E.allT(1)], ['NEN_north_front']),
            f('NEN_st_lawrence_pact', '圣劳伦斯协定', '哈德逊外交', 59, 3, 7, '与加拿大就圣劳伦斯航道达成协定。', [E.moneyIncome(1), E.tagInc('港口', 1)], ['NEN_north_front']),
            f('NEN_hudson_corridor', '哈德逊走廊', '哈德逊外交', 54, 4, 8, '把哈德逊河沿线变成可机动走廊。', [E.actionCost('move', -1), E.capT(2)], ['NEN_hudson_liaisons']),
            f('NEN_canada_accord', '加拿大协定', '哈德逊外交', 56, 4, 8, '与加拿大达成海岸防务与补给协定。', [E.moneyIncome(1), E.tagD('港口', 0.05)], ['NEN_entente_relations']),
            f('NEN_north_supply_line', '北方补给线', '哈德逊外交', 58, 4, 8, '巩固北部补给线。', [E.tagInc('港口', 1), E.gDef(0.05)], ['NEN_border_patrols']),
            f('NEN_albany_pressure', '奥尔巴尼施压', '哈德逊外交', 54, 5, 8, '在奥尔巴尼方向同时施加军事与政治压力。', [E.crisis(3), E.allT(1)], ['NEN_hudson_corridor']),
            f('NEN_lend_lease_atlantic', '大西洋租借', '哈德逊外交', 56, 5, 9, '争取协约国经大西洋的租借物资。', [E.money(15), E.allI(1, 2)], ['NEN_canada_accord']),
            f('NEN_maine_redoubt', '缅因堡垒', '哈德逊外交', 58, 5, 8, '把缅因森林收束成内陆堡垒。', [E.gDef(0.05), E.freeT(2)], ['NEN_north_supply_line']),
            f('NEN_hudson_blockade', '哈德逊封锁', '哈德逊外交', 54, 6, 8, '在哈德逊河口实施封锁。', [E.tagD('港口', 0.05), E.damage(1, 2)], ['NEN_albany_pressure']),
            f('NEN_quebec_watch', '魁北克警戒', '哈德逊外交', 58, 6, 8, '在魁北克边境保持警戒。', [E.gDef(0.05), E.freeT(2)], ['NEN_maine_redoubt']),
            f('NEN_survival_strategy', '东北存续战略', '哈德逊外交', 56, 6, 10, '把地区政策纳入最终战略。', [E.pp(5), E.actionCost('all', -1), E.tagD('港口', 0.10)], [], { prerequisiteAny: [['NEN_albany_pressure'], ['NEN_lend_lease_atlantic'], ['NEN_maine_redoubt']] }),
            f('NEN_northeast_pact', '东北战略后院', '哈德逊外交', 56, 7, 11, '把哈德逊与北方变成新英格兰稳固的战略后院。', [E.allCapT(2), E.tagD('港口', 0.05), E.pp(3)], ['NEN_survival_strategy']),
            f('NEN_atlantic_commonwealth', '大西洋共同体', '哈德逊外交', 56, 8, 11, '把外交成果升格为大西洋共同体框架。', [E.pp(3), E.ppCap(2)], ['NEN_northeast_pact'])
        ];
    };
})(typeof window !== 'undefined' ? window : globalThis);
