/** Political settlements are reversible national institutions, not another stack of permanent rewards. */
const WestRussiaEndings = (() => {
    const e = (type, amount, fields = {}) => ({ type, amount, ...fields });
    const cash = n => e('moneyIncome', n);
    const voice = n => e('ppIncome', n);
    const attack = n => e('globalAttack', n);
    const defend = n => e('globalDefense', n);
    const free = n => e('freeTroops', n);
    const levy = n => e('recruitAmount', n);
    const upkeep = n => e('maintenanceRate', n);
    const crisis = n => e('crisisPP', n);
    const cap = n => e('ppCapBonus', n);
    const recruit = n => e('recruitCost', n);
    const loot = n => e('captureMoney', n);
    const rally = n => e('captureTroops', n);
    const regen = n => e('capitalTroopsPerTurn', n);
    const action = (name, amount) => e('actionCost', amount, { action: name });
    const income = (tag, amount) => e('taggedIncome', amount, { tag });
    const terrain = (tag, amount) => e('taggedDefense', amount, { tag });

    const mechanics = {
        civic: { name: '公开听证', playstyle: '花钱换政治点，适合发展国策',
            payoff: '政治收入 +1.6／回合、固定财政 +1.2／回合、政治上限 +10', tradeoff: '全局进攻 -2%',
            effects: [voice(1.6), cash(1.2), cap(10), free(3), attack(-0.02)] },
        arsenal: { name: '统筹生产', playstyle: '扩产高收，军需充沛',
            payoff: '固定财政收入 +3.4／回合、建设政治消耗 -1、免维护兵力 +4', tradeoff: '维护费率 +1.5%',
            effects: [cash(3.4), action('build', -1), free(4), upkeep(0.015)] },
        breakthrough: { name: '纵深突击', playstyle: '凌厉攻势，以战养战',
            payoff: '全局进攻 +18%、攻占补兵 +1、攻占缴获 +3、免维护兵力 +3', tradeoff: '维护费率 +2%',
            effects: [attack(0.18), rally(1), loot(3), free(3), upkeep(0.02)] },
        fortress: { name: '纵深筑垒', playstyle: '稳固防线，低耗养兵',
            payoff: '全局防御 +20%、免维护兵力 +6、维护费率 -3%', tradeoff: '全局进攻 -2.5%',
            effects: [defend(0.2), free(6), upkeep(-0.03), attack(-0.025)] },
        commerce: { name: '特许贸易', playstyle: '商路生财，战利丰厚',
            payoff: '固定财政收入 +4／回合、每次攻占缴获 +4、免维护兵力 +3', tradeoff: '征兵资金单价 +0.08',
            effects: [cash(4), loot(4), free(3), recruit(0.08)] },
        levies: { name: '战时征集', playstyle: '海量动员，迅速成军',
            payoff: '每次征兵人数 +3、征兵政治消耗 -1、免维护兵力 +5', tradeoff: '维护费率 +1.5%',
            effects: [levy(3), action('recruit', -1), free(5), upkeep(0.015)] },
        welfare: { name: '社会复员', playstyle: '民生减负，稳健养兵',
            payoff: '免维护兵力 +8、固定财政 +1.8／回合、维护费率 -3.5%、迁都补偿 +5', tradeoff: '征兵资金单价 +0.08',
            effects: [free(8), cash(1.8), upkeep(-0.035), crisis(5), recruit(0.08)] },
        supply: { name: '轮换补给', playstyle: '便宜调兵，后勤极省',
            payoff: '维护费率 -9%、移动政治消耗 -1、免维护兵力 +5', tradeoff: '政治上限 -4',
            effects: [upkeep(-0.09), action('move', -1), free(5), cap(-4)] },
        councils: { name: '工厂大会', playstyle: '军工动员，征建高效',
            payoff: '每次征兵人数 +2、政治收入 +1.1／回合、建设政治消耗 -1、免维护兵力 +5', tradeoff: '政治上限 -4',
            effects: [levy(2), voice(1.1), action('build', -1), free(5), cap(-4)] }
    };

    // Every entry has its own combination of geography, institutions and costs.
    // No irreversible effects belong here: a successor may replace an earlier settlement.
    const settlements = {
        WRF: {
            zhukov: [
                ['代表优先的北方共和国', 'civic', '铁路听证', '铁路每省收入 +0.8；建设政治消耗 -1；免维护兵力 +4', [income('铁路', 0.8), crisis(3), action('build', -1), free(4), recruit(-0.3)]],
                ['白海工业复兴', 'arsenal', '复产换取耐心', '港口节点额外收入 +0.9；每次征兵人数 +1', [income('港口', 0.9), levy(1), free(3), cap(-3)]]
            ],
            tukhachevsky: [
                ['不停站的红色梯队', 'breakthrough', '进攻养活进攻', '每次攻占缴获额外 +4；全局进攻 +5%', [loot(4), attack(0.05), recruit(-0.35), cap(-4)]],
                ['总参掌管每一袋粮', 'levies', '集中补员', '免维护兵力 +8；政治收入 +1；维护费率 -4%', [free(8), cash(1.6), voice(1), upkeep(-0.04), cap(-5)]]
            ],
            continuity: [
                ['两个战区的共同防线', 'fortress', '北方持久战', '森林与铁路防御；免维护兵力 +4；每次征兵人数 +2', [terrain('森林', 0.16), terrain('铁路', 0.12), free(4), upkeep(-0.035), levy(2), cash(1.4)]],
                ['把军服送回家', 'welfare', '复员财政', '固定财政收入 +2.6；征兵资金单价 -0.4；每次征兵人数 +1', [cash(2.6), recruit(-0.4), levy(1), cap(-3)]]
            ],
            cadres: [
                ['军校接管战争', 'fortress', '精干部防线', '征兵资金单价 -0.6；移动政治消耗 -1；每次征兵人数 +2', [recruit(-0.6), cap(6), action('move', -1), levy(2), free(3), upkeep(-0.03)]],
                ['有退路的机动作战', 'supply', '轮训与再部署', '全局进攻 +12%；每次攻占缴获 +3', [attack(0.12), loot(3), cash(1.5), recruit(-0.25)]]
            ]
        },
        KOM: {
            centre: [
                ['所有部长都要答询', 'civic', '行政大于动员', '国策政治消耗 -1；固定财政收入 +1.8；征兵单价 -0.3', [action('focus', -1), cash(1.8), recruit(-0.3), free(3)]],
                ['有失效日期的紧急权力', 'fortress', '危机共和国', '迁都补偿 +6；免维护兵力 +6；征兵政治消耗 -1', [crisis(6), free(6), upkeep(-0.03), cash(1.8), action('recruit', -1), levy(1)]],
                ['一座由合作社连接的共和国', 'councils', '共同采购', '固定财政收入 +2.6；维护费率 -3.5%；征兵单价 -0.25', [cash(2.6), upkeep(-0.035), recruit(-0.25), free(3)]]
            ],
            left: [
                ['党部与战区同一张表', 'levies', '纪律动员', '全局进攻 +11%；政治收入 +1.1；每次占领缴获 +3', [attack(0.11), cap(-4), voice(1.1), cash(1.8), free(4), loot(3), upkeep(-0.03)]],
                ['工厂选票不再沉默', 'councils', '基层征募', '每次征兵人数额外 +2；全局防御 +8%；固定收入 +1.6', [levy(2), defend(0.08), cash(1.6), recruit(-0.3)]]
            ],
            research: [
                ['每个乡镇都听见气象台', 'civic', '公开科学', '建设政治消耗 -1；固定财政收入 +2；免维护兵力 +3', [action('build', -1), cash(2), free(3), recruit(-0.25)]],
                ['手柄仍然留在机器上', 'arsenal', '战时技术国家', '铁路节点额外收入 +0.75；全局进攻 +9%；征兵单价 -0.3', [income('铁路', 0.75), attack(0.09), recruit(-0.3), levy(1)]]
            ],
            right: [
                ['保守联盟的边界', 'fortress', '乡镇保守防线', '政治上限 +8；免维护兵力 +5；维护费率 -3.5%', [cap(8), recruit(-0.25), free(5), upkeep(-0.035), voice(0.8), cash(1.5)]],
                ['停在午夜的摄政钟', 'levies', '摄政总动员', '每次征兵人数额外 +2；免维护兵力 +10；全局进攻 +8%', [levy(2), attack(0.08), defend(-0.03), voice(1.5), free(10), upkeep(-0.045), loot(2)]],
                ['工号代替姓名', 'arsenal', '高压工业统制', '固定收入 +2.8；工厂每省收入 +0.8；征兵政治消耗 -1', [cash(2.8), cap(-5), income('工厂', 0.8), action('recruit', -1), upkeep(-0.04), levy(2)]],
                ['横贯欧亚的军令', 'breakthrough', '大地域扩张', '移动政治消耗 -1；征兵单价 -0.4；全局进攻 +6%', [action('move', -1), recruit(-0.4), attack(0.06), cash(1.4)]]
            ]
        },
        VYA: {
            kadets: [
                ['王冠下的地方选票', 'civic', '议会宪政', '政治收入额外 +1；固定收入 +2；征兵单价 -0.35', [voice(1), cash(2), recruit(-0.35), free(4)]],
                ['慢一步的立宪', 'welfare', '过渡优先', '政治上限 +9；固定收入 +2.8；免维护兵力 +5；征兵人数 +2', [cap(9), cash(2.8), free(5), voice(0.8), defend(0.08), levy(2), recruit(-0.4), attack(-0.02)]]
            ],
            shulgin: [
                ['王冠与各省的契约', 'civic', '省税自治', '森林每省收入 +1.1；免维护兵力 +6；每次征兵人数 +2', [income('森林', 1.1), free(6), levy(2), recruit(-0.3)]],
                ['盐税撑起的王室', 'commerce', '关税国库', '铁路节点额外收入 +0.85；每次征兵人数 +1；维护费率 -3%', [income('铁路', 0.85), levy(1), upkeep(-0.03), free(3)]]
            ],
            solidarists: [
                ['每个行业一张席位', 'councils', '职业代表动员', '免维护兵力 +5；固定收入 +2；征兵单价 -0.35', [free(5), cash(2), recruit(-0.35), defend(0.06)]],
                ['全国服务团', 'levies', '社团战争', '免维护兵力 +7；政治收入 +1；维护费率 -4%', [crisis(4), upkeep(-0.04), free(7), voice(1), income('工厂', 0.8), cash(1.8), cap(-4)]]
            ],
            rovs: [
                ['近卫将岗哨交给杜马', 'fortress', '限期军事监理', '政治收入 +1.1；每次占领补兵 +1；免维护兵力 +5', [voice(1.1), rally(1), free(5), upkeep(-0.03), recruit(-0.35), cash(1.4)]],
                ['王冠的职业近卫', 'breakthrough', '精锐近卫', '全局进攻额外 +9%；征兵人数 +1；每次占领缴获 +2', [attack(0.09), levy(1), loot(2), recruit(-0.3)]]
            ]
        },
        SAM: {
            zykov: [
                ['伏尔加军队接受追问', 'civic', '问责换取合法性', '铁路每省收入 +0.8；建设政治消耗 -1；免维护兵力 +5', [crisis(4), income('铁路', 0.8), free(5), action('build', -1), levy(1), recruit(-0.35)]],
                ['列车重回民用班次', 'welfare', '先安置再扩军', '铁路每省收入 +0.9；每次征兵人数 +2；征兵单价 -0.45', [income('铁路', 0.9), levy(2), recruit(-0.45), cash(1.8), cap(-4)]]
            ],
            steel: [
                ['发动机不停的共和国', 'arsenal', '军工财政', '工厂节点额外收入 +0.95；每次征兵人数 +2；全局进攻 +6%', [income('工厂', 0.95), levy(2), attack(0.06), recruit(-0.3)]],
                ['技师与装甲同行', 'breakthrough', '可维修的突击', '维护费率 -4.5%；每次征兵人数 +1；固定收入 +1.8', [upkeep(-0.045), levy(1), cash(1.8), recruit(-0.3), cap(-4)]]
            ],
            oktan: [
                ['写在门外的军需价目', 'commerce', '透明采购', '建设政治消耗 -1；政治收入 +0.7；每次征兵人数 +1', [action('build', -1), voice(0.7), levy(1), upkeep(-0.025)]],
                ['二十年后仍要付款', 'commerce', '垄断先收钱', '固定收入 +3.4；征兵单价 -0.45；免维护兵力 +5', [cash(3.4), cap(-6), recruit(-0.45), upkeep(-0.035), free(5), levy(1)]]
            ],
            officers: [
                ['蓝灯下的桥头防线', 'fortress', '军民河防', '河港与铁路防御；河港每省收入 +0.9；移动政治消耗 -1', [terrain('河港', 0.2), terrain('铁路', 0.1), income('河港', 0.9), free(4), action('move', -1), levy(1), recruit(-0.3)]],
                ['同一电文只发一次', 'supply', '集团军调度', '全局进攻 +11%；免维护兵力 +4；每次征兵人数 +1', [attack(0.11), free(4), levy(1), cash(1.6), recruit(-0.3)]]
            ]
        },
        PRM: {
            vagner: [
                ['警备队站在每道门前', 'levies', '警备军配给', '征兵资金单价 -0.35；免维护兵力 +6；每次占领缴获 +3', [recruit(-0.35), cash(1.1), cap(-5), free(6), upkeep(-0.025), voice(0.8), loot(3)]],
                ['所有配给都经过中央仓', 'supply', '低维护的强制配给', '免维护兵力 +6；固定财政收入 +2；每次征兵人数 +1', [free(6), cash(2), levy(1), recruit(-0.3), defend(0.06)]]
            ],
            velimir: [
                ['极北神话的代价', 'levies', '神话驱动的攻势', '进攻 +12%；占领补兵 +1、缴获 +3；免维护兵力 +6', [attack(0.12), cash(1), cap(-6), free(6), upkeep(-0.025), voice(0.7), loot(3), rally(1)]],
                ['只保留工号的行政区', 'arsenal', '工矿监察', '工厂每省收入 +1.15；每次征兵人数 +1；维护费率 -3.5%', [income('工厂', 1.15), cap(-5), upkeep(-0.035), voice(0.6), levy(1), free(4)]]
            ],
            workers: [
                ['夜班重新选举', 'councils', '工人推翻等级统制', '工厂节点额外收入 +0.75；全局防御 +9%；固定收入 +1.6', [income('工厂', 0.75), defend(0.09), cash(1.6), recruit(-0.3)]],
                ['把姓名写回档案', 'welfare', '平民复权', '政治收入 +1.3；国策政治消耗 -1；每次征兵人数 +1', [voice(1.3), action('focus', -1), levy(1), cash(1.4)]]
            ],
            engineers: [
                ['医院与车间共享电网', 'arsenal', '市政复工', '维护费率 -4.5%；每次征兵人数 +1；迁都补偿 +4', [upkeep(-0.045), levy(1), recruit(-0.35), crisis(4), cap(-3)]],
                ['钥匙交给每一个城区', 'fortress', '城区互保', '工厂防御 +18%、每省收入 +1；建设政治消耗 -1', [terrain('工厂', 0.18), voice(0.6), income('工厂', 1), free(4), action('build', -1), levy(1)]]
            ]
        },
        ONE: {
            treaty: [
                ['北境大门上的两把锁', 'fortress', '协约防务', '港口防御 +22%、每省收入 +1.4；免维护兵力 +5', [terrain('港口', 0.22), cash(1.6), income('港口', 1.4), free(5), upkeep(-0.03), levy(1)]],
                ['每袋外援都有去向', 'supply', '外援库存', '港口节点额外收入 +1.2；固定收入 +1.8；征兵人数 +1', [income('港口', 1.2), cash(1.8), levy(1), recruit(-0.3)]]
            ],
            autonomy: [
                ['沿湖城镇自己的灯火', 'civic', '小国自治', '港口每省收入 +1.5；免维护兵力 +6；每次征兵人数 +2', [income('港口', 1.5), cap(6), free(6), action('build', -1), levy(2), recruit(-0.35)]],
                ['不向任何一边借道', 'fortress', '坚守中立', '额外防御 +12%；免维护兵力 +6；固定收入 +2.4；征兵单价 -0.35', [defend(0.12), free(6), upkeep(-0.035), cash(2.4), recruit(-0.35), levy(1)]]
            ],
            patrol: [
                ['沿湖撤退也有秩序', 'supply', '弹性防线', '森林防御 +20%；全局防御 +8%；固定收入 +1.8', [terrain('森林', 0.2), defend(0.08), cash(1.8), levy(1), crisis(3)]],
                ['港口最后一支反击队', 'breakthrough', '小国集中一击', '港口防御 +14%；攻占缴获 +3；征兵单价 -0.35', [terrain('港口', 0.14), loot(3), recruit(-0.35), cash(1.4)]]
            ],
            harbor: [
                ['白海渔港的共同账本', 'commerce', '海港经营', '港口节点额外收入 +1.3；每次征兵人数 +2；维护费率 -3%', [income('港口', 1.3), levy(2), upkeep(-0.03), free(3)]],
                ['港务长也要接受表决', 'civic', '港口民政', '维护费率 -3.5%；全局防御 +8%；固定收入 +1.8', [upkeep(-0.035), defend(0.08), cash(1.8), recruit(-0.3), levy(1)]]
            ]
        },
        GOR: {
            armor: [
                ['最后一批坦克继续向前', 'breakthrough', '装甲雪崩', '每次攻占额外补兵 +1；全局进攻 +7%；征兵单价 -0.3', [rally(1), attack(0.07), recruit(-0.3), cash(1.4)]],
                ['坦克作为移动堡垒', 'fortress', '装甲防御', '移动政治消耗 -1；进攻 +12%；每次征兵人数 +2', [action('move', -1), attack(0.12), free(4), upkeep(-0.025), levy(2), cash(1.4), cap(-4)]]
            ],
            workers: [
                ['工厂与卫队互相表决', 'councils', '武装工厂', '工厂防御 +22%；征兵资金单价 -0.35；固定收入 +1.8', [terrain('工厂', 0.22), recruit(-0.35), cash(1.8), upkeep(-0.025)]],
                ['汽车城按订单重生', 'arsenal', '车间共营', '工厂节点额外收入 +1；政治收入 +0.6；每次征兵人数 +1', [income('工厂', 1), voice(0.6), levy(1), recruit(-0.3)]]
            ],
            river: [
                ['每个渡口都是商埠', 'commerce', '沿河营利', '河港节点额外收入 +1.1；每次征兵人数 +1；调动消耗 -1', [income('河港', 1.1), levy(1), action('move', -1), free(2)]],
                ['两岸共用一份守备名册', 'supply', '渡口联保', '河港防御 +20%；免维护兵力 +4；固定收入 +1.8', [terrain('河港', 0.2), free(4), cash(1.8), levy(1), recruit(-0.25)]]
            ],
            veterans: [
                ['老兵把领条换成合同', 'welfare', '精兵复兴', '固定收入 +2.8；免维护兵力 +4；每次征兵人数 +2', [cash(2.8), free(4), recruit(-0.45), levy(2), defend(0.06), cap(-4)]],
                ['工人平时上班战时归队', 'supply', '职业后备役', '每次征兵人数 +2；征兵资金单价 -0.35；全局进攻 +7%', [levy(2), recruit(-0.35), attack(0.07), cash(1.5)]]
            ]
        },
        VOL: {
            municipal: [
                ['铁路两侧各有一张选票', 'civic', '市政协约', '铁路节点额外收入 +0.95；每次征兵人数 +2；维护费率 -3%', [income('铁路', 0.95), levy(2), upkeep(-0.03), recruit(-0.35), cash(1.4)]],
                ['同一张公共服务时刻表', 'arsenal', '市政供给', '维护费率 -5%；每次征兵人数 +2；征兵单价 -0.35', [upkeep(-0.05), levy(2), recruit(-0.35), defend(0.07), cap(-4)]]
            ],
            schools: [
                ['每座车站旁都有学堂', 'civic', '教育国家', '国策政治消耗 -1；铁路每省收入 +0.9；每次征兵人数 +2', [action('focus', -1), cap(6), income('铁路', 0.9), upkeep(-0.035), levy(2), recruit(-0.3)]],
                ['医生与教员共同过冬', 'welfare', '民生互助', '政治收入 +1.1；固定收入 +2.4；每次征兵人数 +2；征兵单价 -0.45', [voice(1.1), cash(2.4), levy(2), recruit(-0.45), defend(0.08), crisis(3), cap(-4)]]
            ],
            coops: [
                ['种子担保的地方信用', 'commerce', '农业金融', '森林节点额外收入 +0.85；免维护兵力 +5；征兵人数 +1', [income('森林', 0.85), free(5), levy(1), upkeep(-0.03)]],
                ['先修桥再发货', 'arsenal', '工农统购', '铁路节点额外收入 +0.8；征兵资金单价 -0.4；征兵人数 +1', [income('铁路', 0.8), recruit(-0.4), levy(1), defend(0.06)]]
            ],
            neutrality: [
                ['军车等候的六分钟', 'fortress', '中立通行权', '铁路防御 +24%、每省收入 +1；移动政治消耗 -1', [terrain('铁路', 0.24), voice(0.6), income('铁路', 1), free(4), action('move', -1), levy(1), recruit(-0.3)]],
                ['换防单上写着到期日', 'supply', '铁路卫戍', '铁路防御 +16%；固定财政收入 +2.2；征兵人数 +1', [terrain('铁路', 0.16), cash(2.2), levy(1), recruit(-0.3), defend(0.06)]]
            ]
        },
        GEO: {
            parishes: [
                ['借来的锅属于共同体', 'welfare', '堂区救济网', '免维护兵力额外 +5；固定收入 +2.4；每次征兵人数 +2', [free(5), cash(2.4), levy(2), recruit(-0.45), defend(0.07), cap(-3)]],
                ['救济窗口不再询问信仰', 'civic', '平民共同治理', '固定收入 +2.5；免维护兵力 +6；维护费率 -3.5%', [crisis(4), cash(2.5), free(6), upkeep(-0.035), levy(2), recruit(-0.35)]]
            ],
            order: [
                ['白线标出的桥梁', 'fortress', '誓约河防', '河港防御 +26%、每省收入 +1.1；免维护兵力 +5', [terrain('河港', 0.26), upkeep(-0.03), income('河港', 1.1), free(5), levy(2), recruit(-0.35)]],
                ['行军以后食堂照常开门', 'supply', '随军勤务', '固定收入 +2.2；每次征兵人数 +2；全局防御 +9%', [cash(2.2), levy(2), defend(0.09), recruit(-0.4), crisis(4)]]
            ],
            law: [
                ['地契保存在法院', 'civic', '双重监督', '政治上限 +10；森林每省收入 +0.9；征兵政治消耗 -1', [cap(10), cash(1.8), income('森林', 0.9), action('recruit', -1), free(5), levy(2), recruit(-0.3)]],
                ['先领毯子明日补批复', 'welfare', '救济优先', '固定收入 +2.6；维护费率 -4.5%；每次征兵人数 +2；征兵单价 -0.45', [cash(2.6), upkeep(-0.045), levy(2), recruit(-0.45), defend(0.09), attack(-0.02)]]
            ],
            forestry: [
                ['最后一车木料留给桥', 'commerce', '森林信用', '森林节点额外收入 +1.1；每次征兵人数 +2；维护费率 -3%', [income('森林', 1.1), levy(2), upkeep(-0.03), free(3)]],
                ['春水退后的工务联合', 'arsenal', '林地建设', '森林节点额外收入 +0.85；森林防御 +12%；每次征兵人数 +2', [income('森林', 0.85), terrain('森林', 0.12), levy(2), recruit(-0.35)]]
            ]
        },
        TAT: {
            assembly: [
                ['第三行地名也得到承认', 'civic', '多语公民国家', '每次征兵人数 +2；固定收入 +2；征兵单价 -0.35', [levy(2), cash(2), recruit(-0.35), voice(0.5), free(3)]],
                ['议场等候远方代表', 'welfare', '市镇席位保障', '政治上限 +10；全局防御 +9%；固定收入 +2.2；征兵人数 +2', [cap(10), defend(0.09), cash(2.2), levy(2), recruit(-0.4), attack(-0.02)]]
            ],
            federation: [
                ['小渡口也能重谈比例', 'supply', '协商联邦', '河港节点额外收入 +0.95；政治收入 +0.7；固定收入 +1.6', [income('河港', 0.95), voice(0.7), cash(1.6), levy(1), recruit(-0.3)]],
                ['学校仍由本地来办', 'councils', '地方共和国联盟', '政治上限 +10；固定收入 +2.2；全局防御 +7%', [cap(10), cash(2.2), defend(0.07), recruit(-0.3), attack(-0.02)]]
            ],
            union: [
                ['船工拥有自己的工具箱', 'commerce', '河运劳工合作', '河港节点额外收入 +1.1；维护费率 -3%；每次征兵人数 +1', [income('河港', 1.1), upkeep(-0.03), levy(1), free(3)]],
                ['泵机先验收再剪彩', 'arsenal', '石油工务', '油田节点额外收入 +1.3；每次征兵人数 +1；征兵单价 -0.3', [income('油田', 1.3), levy(1), recruit(-0.3), cash(1.2)]]
            ],
            guard: [
                ['把最后一条船留给村庄', 'fortress', '地方河防', '河港防御 +22%、每省收入 +0.9；免维护兵力 +5', [terrain('河港', 0.22), crisis(4), income('河港', 0.9), free(5), upkeep(-0.03), levy(1), cash(1.2)]],
                ['从不同渡口同时过河', 'breakthrough', '快速伏尔加战区', '移动政治消耗 -1；河港防御 +12%；征兵单价 -0.35', [action('move', -1), terrain('河港', 0.12), recruit(-0.35), cash(1.4)]]
            ]
        },
        BSH: {
            home: [
                ['村名后面都有一个姓名', 'civic', '多村自治', '粮区每省收入 +1.1；免维护兵力 +5；每次征兵人数 +2', [income('粮区', 1.1), cap(6), free(5), levy(2), recruit(-0.35), cash(1.4)]],
                ['炉灰边上的地方账本', 'welfare', '留税于地方', '固定财政收入 +2.8；每次征兵人数 +2；征兵单价 -0.45', [cash(2.8), levy(2), recruit(-0.45), defend(0.08), cap(-4)]]
            ],
            mountains: [
                ['备用炉门等候撤回的人', 'fortress', '南乌拉尔纵深', '山地防御 +20%、每省收入 +1.1；免维护兵力 +5', [terrain('山地', 0.2), crisis(4), income('山地', 1.1), free(5), upkeep(-0.035), levy(1), recruit(-0.3)]],
                ['绕路送煤的机动营', 'breakthrough', '山口精兵', '维护费率 -4%；山地防御 +12%；固定收入 +1.8', [upkeep(-0.04), terrain('山地', 0.12), cash(1.8), recruit(-0.3), cap(-4)]]
            ],
            oil: [
                ['维修费写进每桶油', 'commerce', '石油分成', '油田节点额外收入 +1.4；每次征兵人数 +1；维护费率 -2.5%', [income('油田', 1.4), levy(1), upkeep(-0.025), free(3)]],
                ['检修工按下启动按钮', 'arsenal', '炼油扩产', '油田节点额外收入 +1.15；维护费率 -3.5%；征兵人数 +1', [income('油田', 1.15), upkeep(-0.035), levy(1), recruit(-0.3), cap(-3)]]
            ],
            farm: [
                ['最后一袋种子被留下', 'councils', '农社征募', '免维护兵力 +6；固定收入 +2.2；征兵单价 -0.35', [free(6), cash(2.2), recruit(-0.35), defend(0.06)]],
                ['每袋余粮都有一个去向', 'welfare', '县社粮秣互保', '固定收入 +2.4；维护费率 -3.5%；河港防御 +15%；征兵人数 +2', [cash(2.4), upkeep(-0.035), terrain('河港', 0.15), levy(2), recruit(-0.4), cap(-3)]]
            ]
        }
    };
    const outcomes = new Map();
    const actionNames = { build: '建设', move: '移动', recruit: '征兵', focus: '国策' };
    const effectNames = { moneyIncome: '每回合金钱', ppIncome: '每回合PP',
        ppCapBonus: 'PP上限', globalAttack: '进攻', globalDefense: '防御',
        maintenanceRate: '养兵费率', recruitAmount: '征兵人数', recruitCost: '每兵价格',
        freeTroops: '免维护兵', crisisPP: '丢首都时PP', captureMoney: '占领得钱',
        captureTroops: '占领补兵', taggedDefense: '防御', taggedIncome: '每省收入' };
    const percentages = new Set(['globalAttack', 'globalDefense', 'maintenanceRate', 'taggedDefense']);
    const costTypes = new Set(['recruitCost', 'maintenanceRate', 'actionCost']);
    function summarize(effects) {
        const totals = new Map();
        effects.forEach(item => {
            const key = `${item.type}:${item.action || item.tag || ''}`;
            const total = totals.get(key) || { ...item, amount: 0 };
            total.amount = Math.round((total.amount + item.amount) * 10000) / 10000;
            totals.set(key, total);
        });
        const combined = [...totals.values()].filter(item => item.amount !== 0);
        const describe = item => {
            const name = item.type === 'actionCost' ? `${actionNames[item.action]}花费PP`
                : (item.tag || '') + effectNames[item.type];
            const number = percentages.has(item.type) ? Math.round(item.amount * 1000) / 10 : item.amount;
            return `${name} ${number > 0 ? '+' : ''}${number}${percentages.has(item.type) ? '%' : ''}`;
        };
        const positive = item => costTypes.has(item.type) ? item.amount < 0 : item.amount > 0;
        return { effects: combined, payoff: combined.filter(positive).map(describe).join('；') + '。',
            tradeoff: combined.filter(item => !positive(item)).map(describe).join('；') + '。' };
    }
    Object.entries(settlements).forEach(([factionId, routes]) => {
        Object.entries(routes).forEach(([routeId, arms]) => arms.forEach(([title, mechanic, playstyle, payoff, effects], arm) => {
            const rule = mechanics[mechanic];
            const id = `${factionId}_${routeId}_${arm}`;
            const summary = summarize([...rule.effects, ...effects]);
            outcomes.set(id, {
                id, factionId, routeId, arm, title, mechanic,
                actionName: rule.name,
                playstyle: `${playstyle}：${rule.playstyle}。`,
                payoff: summary.payoff,
                tradeoff: summary.tradeoff,
                effects: summary.effects
            });
        }));
    });

    // Ideology is a second, independent layer. It changes the economy and combat model,
    // while route institutions distinguish two countries that share the same ideology.
    const ideologyDesigns = {
        wr_staff: ['大本营统筹守备与常备补员，集中调度压缩地方议事弹性。', [defend(0.12), free(5), regen(1), cash(1.5), recruit(-0.3), cap(-4)]],
        wr_councils: ['工厂与地区苏维埃高效征募扩建，集中议程略微收紧政治储备。', [levy(2), action('build', -1), voice(1.1), cash(1.6), free(5), regen(1), cap(-5)]],
        wr_parliament: ['公开议会带来充沛政治点与稳定财政，主动出击相对审慎。', [voice(1.8), cap(12), cash(2), free(4), recruit(-0.25), attack(-0.02)]],
        wr_crown: ['王冠与杜马稳固防线并持续补员，维持传统仪制略增征募开支。', [defend(0.14), cash(2), free(5), crisis(4), regen(1), recruit(0.05)]],
        wr_directorate: ['军政委员会强化机动与突击，成建制战备略增日常维护。', [attack(0.14), action('move', -1), cash(1.8), regen(1), free(4), upkeep(0.015)]],
        wr_market: ['契约财政与物资流转带来丰厚收入与缴获，商业募兵单价微升。', [cash(4.2), loot(4), action('build', -1), free(4), recruit(0.08)]],
        wr_guard: ['联防体系兼顾纵深守备与低耗养兵，跨区远征略显保守。', [defend(0.18), upkeep(-0.05), free(6), cash(1.6), regen(1), attack(-0.025)]],
        wr_parish: ['堂区互助显著减轻军费并改善征募，地方分权略减中央政治上限。', [cash(2.2), free(7), crisis(6), upkeep(-0.06), recruit(-0.3), cap(-4)]],
        wr_coercion: ['高压统制强行榨取兵员与战利，严苛管制压缩政治回旋空间。', [levy(1), attack(0.11), loot(2), free(4), regen(1), recruit(-0.2), cap(-8)]],
        wr_red_army: ['红军总参以凌厉攻势与占领整编滚雪球，精锐梯队维护略高。', [attack(0.22), rally(1), loot(2), regen(1), free(5), recruit(-0.3), upkeep(0.02)]],
        wr_public_republic: ['多党民主加快国策推进并充实国库，对外用兵需经议会审慎授权。', [voice(2.2), cap(14), cash(2.4), free(4), action('focus', -1), attack(-0.02)]],
        wr_charter_crown: ['立宪王室兼顾政治共识、防务与财政，常备礼制略增单兵募费。', [voice(1.5), defend(0.14), cash(2.2), free(5), cap(8), regen(1), recruit(0.05)]],
        wr_developmental_military: ['军政信贷强力拉动扩产与廉价征兵，重装编制略增维护开支。', [cash(3.8), action('build', -1), recruit(-0.5), levy(1), regen(1), free(5), upkeep(0.02)]],
        wr_civic_restoration: ['公民复权凝聚人心、充实财政与防务，主动攻势保持克制。', [voice(1.7), cash(2.4), free(6), recruit(-0.35), crisis(6), attack(-0.02)]],
        wr_armed_neutrality: ['全民联防构筑坚不可摧的低耗防线，境外进攻意愿较低。', [defend(0.26), upkeep(-0.065), free(7), cash(2.2), regen(1), attack(-0.035)]],
        wr_armored_command: ['装甲军政拥有顶级突击与战地收编能力，机械化纵队维护较高。', [attack(0.25), rally(2), loot(3), regen(1), free(4), upkeep(0.025)]],
        wr_cooperative_credit: ['信用合作社兼顾财政增收、扩建减耗与低费养兵，议程协调略占政治上限。', [cash(3.4), upkeep(-0.055), free(6), recruit(-0.35), action('build', -1), cap(-4)]],
        wr_parish_federation: ['堂区联邦稳固后方、提供大批免维护民兵与财政支持，出击略偏保守。', [cash(2.6), free(8), voice(1.1), defend(0.1), crisis(6), recruit(-0.35), attack(-0.02)]],
        wr_multilingual_republic: ['多语公民权激活广泛兵源与地方税收，多元协商略占政治储备上限。', [voice(1.6), levy(2), recruit(-0.35), cash(2.2), free(5), regen(1), cap(-4)]],
        wr_fiscal_federation: ['自治联邦释放地方财力与民兵潜力，联席议军使跨区攻势略缓。', [cap(12), cash(3.4), free(6), upkeep(-0.045), recruit(-0.35), attack(-0.02)]]
    };

    return {
        mechanics,
        get(factionId, routeId, arm) {
            const outcome = outcomes.get(`${factionId}_${routeId}_${arm}`);
            if (!outcome) throw new Error(`Unknown West Russia settlement ${factionId}/${routeId}/${arm}`);
            return JSON.parse(JSON.stringify(outcome));
        },
        all() { return [...outcomes.values()].map(item => JSON.parse(JSON.stringify(item))); },
        getById(id) {
            const outcome = outcomes.get(id);
            if (outcome) return JSON.parse(JSON.stringify(outcome));
            return typeof WestRussiaSecrets !== 'undefined' ? WestRussiaSecrets.getById(id) : null;
        },
        registerIdeologies() {
            Object.entries(ideologyDesigns).forEach(([id, [description, bonuses]]) => {
                if (GameState.ideologies[id]) Object.assign(GameState.ideologies[id], {
                    description, bonuses: bonuses.map(item => ({ ...item }))
                });
            });
        }
    };
})();
