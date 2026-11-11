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
    const action = (name, amount) => e('actionCost', amount, { action: name });
    const income = (tag, amount) => e('taggedIncome', amount, { tag });
    const terrain = (tag, amount) => e('taggedDefense', amount, { tag });

    const mechanics = {
        civic: { name: '公开听证', playstyle: '花钱换政治点，适合发展国策',
            payoff: '政治收入 +1.1／回合、政治上限 +6', tradeoff: '全局进攻 -7%',
            effects: [voice(1.1), cap(6), attack(-0.07)] },
        arsenal: { name: '统筹生产', playstyle: '赚钱扩产，养兵更贵',
            payoff: '固定财政收入 +1.8／回合、建设政治消耗 -1', tradeoff: '维护费率 +3.5%',
            effects: [cash(1.8), action('build', -1), upkeep(0.035)] },
        breakthrough: { name: '纵深突击', playstyle: '进攻补兵，防守较弱',
            payoff: '全局进攻 +14%、每次攻占补兵 +1', tradeoff: '全局防御 -5%、维护费率 +5.5%',
            effects: [attack(0.14), rally(1), defend(-0.05), upkeep(0.055)] },
        fortress: { name: '纵深筑垒', playstyle: '守得住，但进攻较弱',
            payoff: '全局防御 +18%、免维护兵力 +3', tradeoff: '全局进攻 -9%',
            effects: [defend(0.18), free(3), attack(-0.09)] },
        commerce: { name: '特许贸易', playstyle: '靠贸易赚钱，征兵更贵',
            payoff: '固定财政收入 +2.4／回合、每次攻占缴获 +3', tradeoff: '征兵资金单价 +0.25',
            effects: [cash(2.4), loot(3), recruit(0.25)] },
        levies: { name: '战时征集', playstyle: '快速增兵，但财政吃紧',
            payoff: '每次征兵人数 +2、征兵政治消耗 -1', tradeoff: '政治收入 -0.7／回合、维护费率 +4%',
            effects: [levy(2), action('recruit', -1), voice(-0.7), upkeep(0.04)] },
        welfare: { name: '社会复员', playstyle: '少养兵省钱，扩军较慢',
            payoff: '免维护兵力 +5、迁都危机补偿 +4', tradeoff: '征兵资金单价 +0.35',
            effects: [free(5), crisis(4), recruit(0.35)] },
        supply: { name: '轮换补给', playstyle: '便宜调兵，建设较贵',
            payoff: '维护费率 -7.5%、移动政治消耗 -1', tradeoff: '建设政治消耗 +1',
            effects: [upkeep(-0.075), action('move', -1), action('build', 1)] },
        councils: { name: '工厂大会', playstyle: '征兵建设更便宜，收入较少',
            payoff: '每次征兵人数 +1、政治收入 +0.6／回合、建设政治消耗 -1', tradeoff: '固定财政收入 -0.8／回合',
            effects: [levy(1), voice(0.6), action('build', -1), cash(-0.8)] }
    };

    // Every entry has its own combination of geography, institutions and costs.
    // No irreversible effects belong here: a successor may replace an earlier settlement.
    const settlements = {
        WRF: {
            zhukov: [
                ['代表优先的北方共和国', 'civic', '铁路听证', '铁路节点额外收入 +0.25；迁都补偿 +2', [income('铁路', 0.25), crisis(2)]],
                ['白海工业复兴', 'arsenal', '复产换取耐心', '港口节点额外收入 +0.4；征兵资金单价 +0.1', [income('港口', 0.4), recruit(0.1)]]
            ],
            tukhachevsky: [
                ['不停站的红色梯队', 'breakthrough', '进攻养活进攻', '每次攻占缴获额外 +4；政治收入 -0.35', [loot(4), voice(-0.35)]],
                ['总参掌管每一袋粮', 'levies', '集中补员', '免维护兵力 +4；固定财政收入 -0.6', [free(4), cash(-0.6)]]
            ],
            continuity: [
                ['两个战区的共同防线', 'fortress', '北方持久战', '森林防御 +14%；铁路防御 +10%', [terrain('森林', 0.14), terrain('铁路', 0.1)]],
                ['把军服送回家', 'welfare', '复员财政', '固定财政收入 +1.2；每次征兵人数 -1', [cash(1.2), levy(-1)]]
            ],
            cadres: [
                ['军校接管战争', 'fortress', '精干部防线', '征兵资金单价 -0.3；政治上限 +4', [recruit(-0.3), cap(4)]],
                ['有退路的机动作战', 'supply', '轮训与再部署', '全局进攻 +9%；政治收入 -0.2', [attack(0.09), voice(-0.2)]]
            ]
        },
        KOM: {
            centre: [
                ['所有部长都要答询', 'civic', '行政大于动员', '国策政治消耗 -1；征兵政治消耗 +1', [action('focus', -1), action('recruit', 1)]],
                ['有失效日期的紧急权力', 'fortress', '危机共和国', '迁都补偿 +5；政治收入 -0.2', [crisis(5), voice(-0.2)]],
                ['一座由合作社连接的共和国', 'councils', '共同采购', '固定财政收入 +1.6；维护费率 -2%；征兵资金单价 +0.15', [cash(1.6), upkeep(-0.02), recruit(0.15)]]
            ],
            left: [
                ['党部与战区同一张表', 'levies', '纪律动员', '全局进攻 +9%；政治上限 -3', [attack(0.09), cap(-3)]],
                ['工厂选票不再沉默', 'councils', '基层征募', '每次征兵人数额外 +1；全局防御 +5%', [levy(1), defend(0.05)]]
            ],
            research: [
                ['每个乡镇都听见气象台', 'civic', '公开科学', '建设政治消耗 -1；固定财政收入 +0.5', [action('build', -1), cash(0.5)]],
                ['手柄仍然留在机器上', 'arsenal', '战时技术国家', '铁路节点额外收入 +0.35；全局进攻 +6%', [income('铁路', 0.35), attack(0.06)]]
            ],
            right: [
                ['保守联盟的边界', 'fortress', '乡镇保守防线', '政治上限 +5；征兵资金单价 +0.15', [cap(5), recruit(0.15)]],
                ['停在午夜的摄政钟', 'levies', '无法持续的总动员', '每次征兵人数额外 +2；固定财政收入 -1.6；全局防御 -8%', [levy(2), cash(-1.6), defend(-0.08)]],
                ['工号代替姓名', 'arsenal', '高压工业统制', '固定财政收入额外 +2；政治收入 -1.2', [cash(2), voice(-1.2)]],
                ['横贯欧亚的军令', 'breakthrough', '大地域扩张', '移动政治消耗 -1；征兵资金单价 +0.2', [action('move', -1), recruit(0.2)]]
            ]
        },
        VYA: {
            kadets: [
                ['王冠下的地方选票', 'civic', '议会宪政', '政治收入额外 +0.7；征兵资金单价 +0.15', [voice(0.7), recruit(0.15)]],
                ['慢一步的立宪', 'welfare', '过渡优先', '政治上限 +7；固定财政收入 +0.6', [cap(7), cash(0.6)]]
            ],
            shulgin: [
                ['王冠与各省的契约', 'civic', '省税自治', '森林节点额外收入 +0.3；免维护兵力 +2', [income('森林', 0.3), free(2)]],
                ['盐税撑起的王室', 'commerce', '关税国库', '铁路节点额外收入 +0.4；政治收入 -0.3', [income('铁路', 0.4), voice(-0.3)]]
            ],
            solidarists: [
                ['每个行业一张席位', 'councils', '职业代表动员', '免维护兵力 +3；政治上限 +3', [free(3), cap(3)]],
                ['全国服务团', 'levies', '社团战争', '迁都补偿 +3；维护费率额外 +1.5%', [crisis(3), upkeep(0.015)]]
            ],
            rovs: [
                ['近卫将岗哨交给杜马', 'fortress', '限期军事监理', '政治收入 +0.6；全局进攻额外 -3%', [voice(0.6), attack(-0.03)]],
                ['王冠的职业近卫', 'breakthrough', '昂贵的精锐', '全局进攻额外 +7%；征兵资金单价 +0.35', [attack(0.07), recruit(0.35)]]
            ]
        },
        SAM: {
            zykov: [
                ['伏尔加军队接受追问', 'civic', '问责换取合法性', '迁都补偿 +4；征兵政治消耗 +1', [crisis(4), action('recruit', 1)]],
                ['列车重回民用班次', 'welfare', '先安置再扩军', '铁路节点额外收入 +0.35；每次征兵人数 -1', [income('铁路', 0.35), levy(-1)]]
            ],
            steel: [
                ['发动机不停的共和国', 'arsenal', '军工财政', '工厂节点额外收入 +0.45；维护费率额外 +1.5%', [income('工厂', 0.45), upkeep(0.015)]],
                ['技师与装甲同行', 'breakthrough', '可维修的突击', '维护费率 -3%；征兵资金单价 +0.15', [upkeep(-0.03), recruit(0.15)]]
            ],
            oktan: [
                ['写在门外的军需价目', 'commerce', '透明采购', '建设政治消耗 -1；政治收入 +0.2', [action('build', -1), voice(0.2)]],
                ['二十年后仍要付款', 'commerce', '垄断先收钱', '固定财政收入额外 +2.5；政治收入 -1.1；征兵资金单价额外 +0.2', [cash(2.5), voice(-1.1), recruit(0.2)]]
            ],
            officers: [
                ['蓝灯下的桥头防线', 'fortress', '军民河防', '河港防御 +18%；铁路防御 +8%', [terrain('河港', 0.18), terrain('铁路', 0.08)]],
                ['同一电文只发一次', 'supply', '集团军调度', '全局进攻 +8%；免维护兵力 +2', [attack(0.08), free(2)]]
            ]
        },
        PRM: {
            vagner: [
                ['警备队站在每道门前', 'levies', '征发吞掉未来', '征兵资金单价 -0.3；固定财政收入 -1；政治上限 -3', [recruit(-0.3), cash(-1), cap(-3)]],
                ['所有配给都经过中央仓', 'supply', '低维护的强制配给', '免维护兵力 +6；政治收入 -1', [free(6), voice(-1)]]
            ],
            velimir: [
                ['极北神话的代价', 'levies', '神话驱动的消耗战', '全局进攻 +12%；固定财政收入 -1.4', [attack(0.12), cash(-1.4)]],
                ['只保留工号的行政区', 'arsenal', '工矿监察', '工厂节点额外收入 +0.6；政治上限 -4', [income('工厂', 0.6), cap(-4)]]
            ],
            workers: [
                ['夜班重新选举', 'councils', '工人推翻等级统制', '工厂节点额外收入 +0.3；全局防御 +7%', [income('工厂', 0.3), defend(0.07)]],
                ['把姓名写回档案', 'welfare', '平民复权', '政治收入 +1；国策政治消耗 -1', [voice(1), action('focus', -1)]]
            ],
            engineers: [
                ['医院与车间共享电网', 'arsenal', '市政复工', '维护费率 -3%；迁都补偿 +2', [upkeep(-0.03), crisis(2)]],
                ['钥匙交给每一个城区', 'fortress', '城区互保', '工厂防御 +16%；政治收入 +0.35', [terrain('工厂', 0.16), voice(0.35)]]
            ]
        },
        ONE: {
            treaty: [
                ['北境大门上的两把锁', 'fortress', '协约防务', '港口防御 +20%；固定财政收入 +0.4', [terrain('港口', 0.2), cash(0.4)]],
                ['每袋外援都有去向', 'supply', '外援库存', '港口节点额外收入 +0.6；全局进攻 -3%', [income('港口', 0.6), attack(-0.03)]]
            ],
            autonomy: [
                ['沿湖城镇自己的灯火', 'civic', '小国自治', '港口节点额外收入 +0.45；政治上限 +4', [income('港口', 0.45), cap(4)]],
                ['不向任何一边借道', 'fortress', '坚守中立', '全局防御额外 +10%；全局进攻额外 -8%；免维护兵力 +2', [defend(0.1), attack(-0.08), free(2)]]
            ],
            patrol: [
                ['沿湖撤退也有秩序', 'supply', '弹性防线', '森林防御 +18%；迁都补偿 +2', [terrain('森林', 0.18), crisis(2)]],
                ['港口最后一支反击队', 'breakthrough', '小国集中一击', '港口防御 +12%；每次攻占缴获额外 +2', [terrain('港口', 0.12), loot(2)]]
            ],
            harbor: [
                ['白海渔港的共同账本', 'commerce', '海港经营', '港口节点额外收入 +0.85；每次征兵人数 -1', [income('港口', 0.85), levy(-1)]],
                ['港务长也要接受表决', 'civic', '港口民政', '维护费率 -2.5%；全局防御 +4%', [upkeep(-0.025), defend(0.04)]]
            ]
        },
        GOR: {
            armor: [
                ['最后一批坦克继续向前', 'breakthrough', '装甲雪崩', '每次攻占额外补兵 +1；维护费率额外 +2.5%', [rally(1), upkeep(0.025)]],
                ['坦克作为移动堡垒', 'fortress', '装甲防御', '移动政治消耗 -1；征兵资金单价 +0.2', [action('move', -1), recruit(0.2)]]
            ],
            workers: [
                ['工厂与卫队互相表决', 'councils', '武装工厂', '工厂防御 +20%；征兵资金单价 -0.1', [terrain('工厂', 0.2), recruit(-0.1)]],
                ['汽车城按订单重生', 'arsenal', '车间共营', '工厂节点额外收入 +0.5；政治收入 +0.2', [income('工厂', 0.5), voice(0.2)]]
            ],
            river: [
                ['每个渡口都是商埠', 'commerce', '沿河营利', '河港节点额外收入 +0.7；全局防御 -4%', [income('河港', 0.7), defend(-0.04)]],
                ['两岸共用一份守备名册', 'supply', '渡口联保', '河港防御 +17%；免维护兵力 +2', [terrain('河港', 0.17), free(2)]]
            ],
            veterans: [
                ['老兵把领条换成合同', 'welfare', '缩军复兴', '固定财政收入 +1.4；全局进攻 -5%', [cash(1.4), attack(-0.05)]],
                ['工人平时上班战时归队', 'supply', '职业后备役', '每次征兵人数 +1；征兵资金单价 -0.2', [levy(1), recruit(-0.2)]]
            ]
        },
        VOL: {
            municipal: [
                ['铁路两侧各有一张选票', 'civic', '市政协约', '铁路节点额外收入 +0.45；建设政治消耗 +1', [income('铁路', 0.45), action('build', 1)]],
                ['同一张公共服务时刻表', 'arsenal', '市政供给', '维护费率 -4%；全局进攻 -3%', [upkeep(-0.04), attack(-0.03)]]
            ],
            schools: [
                ['每座车站旁都有学堂', 'civic', '教育国家', '国策政治消耗 -1；政治上限额外 +5', [action('focus', -1), cap(5)]],
                ['医生与教员共同过冬', 'welfare', '民生互助', '政治收入 +0.65；迁都补偿额外 +2', [voice(0.65), crisis(2)]]
            ],
            coops: [
                ['种子担保的地方信用', 'commerce', '农业金融', '森林节点额外收入 +0.4；免维护兵力 +2', [income('森林', 0.4), free(2)]],
                ['先修桥再发货', 'arsenal', '工农统购', '铁路节点额外收入 +0.3；征兵资金单价 -0.15', [income('铁路', 0.3), recruit(-0.15)]]
            ],
            neutrality: [
                ['军车等候的六分钟', 'fortress', '中立通行权', '铁路防御 +22%；政治收入 +0.2', [terrain('铁路', 0.22), voice(0.2)]],
                ['换防单上写着到期日', 'supply', '铁路卫戍', '铁路防御 +12%；固定财政收入 +0.5', [terrain('铁路', 0.12), cash(0.5)]]
            ]
        },
        GEO: {
            parishes: [
                ['借来的锅属于共同体', 'welfare', '堂区救济网', '免维护兵力额外 +3；政治上限 +4', [free(3), cap(4)]],
                ['救济窗口不再询问信仰', 'civic', '平民共同治理', '迁都补偿 +3；固定财政收入 +0.45', [crisis(3), cash(0.45)]]
            ],
            order: [
                ['白线标出的桥梁', 'fortress', '誓约河防', '河港防御 +24%；维护费率 +1%', [terrain('河港', 0.24), upkeep(0.01)]],
                ['行军以后食堂照常开门', 'supply', '随军勤务', '迁都补偿 +4；每次征兵人数 -1', [crisis(4), levy(-1)]]
            ],
            law: [
                ['地契保存在法院', 'civic', '双重监督', '政治上限额外 +8；建设政治消耗 +1', [cap(8), action('build', 1)]],
                ['先领毯子明日补批复', 'welfare', '救济优先', '维护费率 -3%；全局进攻 -4%', [upkeep(-0.03), attack(-0.04)]]
            ],
            forestry: [
                ['最后一车木料留给桥', 'commerce', '森林信用', '森林节点额外收入 +0.65；政治收入 -0.15', [income('森林', 0.65), voice(-0.15)]],
                ['春水退后的工务联合', 'arsenal', '林地建设', '森林节点额外收入 +0.35；森林防御 +8%', [income('森林', 0.35), terrain('森林', 0.08)]]
            ]
        },
        TAT: {
            assembly: [
                ['第三行地名也得到承认', 'civic', '多语公民国家', '每次征兵人数 +1；政治收入额外 +0.2', [levy(1), voice(0.2)]],
                ['议场等候远方代表', 'welfare', '市镇席位保障', '政治上限 +9；全局防御 +5%', [cap(9), defend(0.05)]]
            ],
            federation: [
                ['小渡口也能重谈比例', 'supply', '协商联邦', '河港节点额外收入 +0.45；政治收入 +0.25', [income('河港', 0.45), voice(0.25)]],
                ['学校仍由本地来办', 'councils', '地方共和国联盟', '政治上限 +8；全局进攻 -5%', [cap(8), attack(-0.05)]]
            ],
            union: [
                ['船工拥有自己的工具箱', 'commerce', '河运劳工合作', '河港节点额外收入 +0.6；维护费率 -1.5%', [income('河港', 0.6), upkeep(-0.015)]],
                ['泵机先验收再剪彩', 'arsenal', '石油工务', '油田节点额外收入 +0.8；征兵政治消耗 +1', [income('油田', 0.8), action('recruit', 1)]]
            ],
            guard: [
                ['把最后一条船留给村庄', 'fortress', '地方河防', '河港防御 +19%；迁都补偿 +3', [terrain('河港', 0.19), crisis(3)]],
                ['从不同渡口同时过河', 'breakthrough', '快速伏尔加战区', '移动政治消耗 -1；河港防御 +8%', [action('move', -1), terrain('河港', 0.08)]]
            ]
        },
        BSH: {
            home: [
                ['村名后面都有一个姓名', 'civic', '多村自治', '粮区节点额外收入 +0.2；政治上限额外 +4', [income('粮区', 0.2), cap(4)]],
                ['炉灰边上的地方账本', 'welfare', '留税于地方', '固定财政收入 +1.5；建设政治消耗 +1', [cash(1.5), action('build', 1)]]
            ],
            mountains: [
                ['备用炉门等候撤回的人', 'fortress', '南乌拉尔纵深', '山地防御 +15%；迁都补偿 +4', [terrain('山地', 0.15), crisis(4)]],
                ['绕路送煤的机动营', 'breakthrough', '山口精兵', '维护费率 -2.5%；山地防御 +6%', [upkeep(-0.025), terrain('山地', 0.06)]]
            ],
            oil: [
                ['维修费写进每桶油', 'commerce', '石油分成', '油田节点额外收入 +1；建设政治消耗 +1', [income('油田', 1), action('build', 1)]],
                ['检修工按下启动按钮', 'arsenal', '炼油扩产', '油田节点额外收入 +0.55；维护费率 -2%', [income('油田', 0.55), upkeep(-0.02)]]
            ],
            farm: [
                ['最后一袋种子被留下', 'councils', '农社征募', '免维护兵力 +4；征兵资金单价 +0.15', [free(4), recruit(0.15)]],
                ['每袋余粮都有一个去向', 'welfare', '县社粮秣互保', '维护费率 -2%；河港防御 +11%', [upkeep(-0.02), terrain('河港', 0.11)]]
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
        wr_staff: ['守军更强，收入较少。', [defend(0.1), free(3), cash(-0.8)]],
        wr_councils: ['征兵建设更容易，收入较少。', [levy(1), action('build', -1), voice(0.6), cash(-0.8)]],
        wr_parliament: ['政治点更多，进攻较弱。', [voice(1.2), cap(6), attack(-0.07)]],
        wr_crown: ['防守更强，征兵较贵。', [defend(0.1), crisis(3), recruit(0.2)]],
        wr_directorate: ['进攻调兵更强，养兵较贵。', [attack(0.1), action('move', -1), upkeep(0.04)]],
        wr_market: ['赚钱更多，征兵较贵。', [cash(2.4), loot(3), recruit(0.4)]],
        wr_guard: ['守得更稳，进攻较弱。', [defend(0.14), upkeep(-0.035), attack(-0.09)]],
        wr_parish: ['养兵更便宜，征兵较贵。', [crisis(5), upkeep(-0.055), recruit(0.3)]],
        wr_coercion: ['增兵进攻更强，财政和政治点吃紧。', [levy(2), attack(0.1), voice(-1.1), cash(-1.2), upkeep(0.045)]],
        wr_red_army: ['越打兵越多，防守和养兵承压。', [attack(0.18), rally(1), defend(-0.07), upkeep(0.065)]],
        wr_public_republic: ['政治点充足，征兵更费政治点。', [voice(1.8), cap(9), action('recruit', 1), attack(-0.06)]],
        wr_charter_crown: ['政治点与防守兼顾，征兵较贵。', [voice(1), defend(0.1), cap(4), recruit(0.3)]],
        wr_developmental_military: ['扩产征兵更便宜，养兵较贵。', [cash(2.6), action('build', -1), recruit(-0.35), upkeep(0.07)]],
        wr_civic_restoration: ['政治点与救济更强，进攻较弱。', [voice(1.1), crisis(6), free(3), attack(-0.08)]],
        wr_armed_neutrality: ['重防守、低维护，主动进攻很弱。', [defend(0.23), upkeep(-0.055), attack(-0.17)]],
        wr_armored_command: ['突击与占领补兵最强，维护很贵。', [attack(0.21), rally(2), upkeep(0.085), defend(-0.08)]],
        wr_cooperative_credit: ['赚钱省维护，征兵多花政治点。', [cash(1.7), upkeep(-0.045), cap(5), action('recruit', 1)]],
        wr_parish_federation: ['后方稳定、免维护兵多，进攻较弱。', [crisis(6), free(5), voice(0.5), attack(-0.1)]],
        wr_multilingual_republic: ['政治点与征兵更多，收入较少。', [voice(1), levy(1), cap(6), cash(-0.6)]],
        wr_fiscal_federation: ['钱和政治点更多，进攻较弱。', [cap(10), cash(1.8), free(3), attack(-0.1)]]
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
