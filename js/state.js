/**
 * Centralized State Management
 * A small publish-subscribe store for the static SPA.
 */

const GameState = {
    currentView: 'main-menu', // main-menu, lobby, faction-select, game-page
    selectedFactionId: null,
    ppCap: 100,
    basePPIncome: 3,
    baseMaintenanceRate: 0.5,
    debtPenaltyTiers: [
        {
            threshold: 20,
            label: '拖欠军饷',
            description: '军饷开始拖欠，军心动摇。',
            ppIncomeDelta: -1,
            globalAttackDelta: -0.1,
            globalDefenseDelta: -0.1,
            actionCostDelta: 0,
            desertionRate: 0,
            minDesertion: 0
        },
        {
            threshold: 40,
            label: '补给断裂',
            description: '补给链被债务压垮，行政效率下降。',
            ppIncomeDelta: -2,
            globalAttackDelta: -0.2,
            globalDefenseDelta: -0.2,
            actionCostDelta: 1,
            desertionRate: 0,
            minDesertion: 0
        },
        {
            threshold: 80,
            label: '财政崩溃',
            description: '财政系统失序，部队开始逃散。',
            ppIncomeDelta: -3,
            globalAttackDelta: -0.4,
            globalDefenseDelta: -0.4,
            actionCostDelta: 2,
            desertionRate: 0.08,
            minDesertion: 2
        }
    ],

    /**
     * 意识形态表。每个意识形态包含一组在游戏中持续生效的加成（与国策效果同语义）。
     * 完成某些政治国策时可以通过 type:'ideology' 切换。
     * 切换时会自动反转上一意识形态加成、再叠加新意识形态加成（仅适用加性加成）。
     */
    ideologies: {
        military_junta: {
            id: 'military_junta', name: '军政府', color: '#1f2937',
            description: '军方直接接管行政与征用。进攻强、维护贵。',
            bonuses: [
                { type: 'globalAttack', amount: 0.05 },
                { type: 'capitalTroopsPerTurn', amount: 1 },
                { type: 'maintenanceRate', amount: 0.02 }
            ]
        },
        wartime_democracy: {
            id: 'wartime_democracy', name: '战时民主', color: '#2563eb',
            description: '议会与文官在战时持续运转，政治资本高、防御稳。',
            bonuses: [
                { type: 'ppCapBonus', amount: 5 },
                { type: 'ppIncome', amount: 1 },
                { type: 'globalDefense', amount: 0.05 },
                { type: 'maintenanceRate', amount: -0.02 }
            ]
        },
        technocracy: {
            id: 'technocracy', name: '技术官僚', color: '#0ea5e9',
            description: '工程师与文官主导战争。建设便宜、上限高、行政高效。',
            bonuses: [
                { type: 'actionCost', action: 'build', amount: -1 },
                { type: 'moneyIncome', amount: 1 },
                { type: 'ppCapBonus', amount: 3 }
            ]
        },
        syndicalism: {
            id: 'syndicalism', name: '工团主义', color: '#dc2626',
            description: '工团-赤卫队网络承担战争。征兵便宜、免维护士兵多。',
            bonuses: [
                { type: 'recruitCost', amount: -1 },
                { type: 'recruitAmount', amount: 1 },
                { type: 'freeTroops', amount: 4 }
            ]
        },
        central_planning: {
            id: 'central_planning', name: '中央计划', color: '#b91c1c',
            description: '所有工业进入中央计划委员会。工业上限高，但行政摩擦高。',
            bonuses: [
                { type: 'actionCost', action: 'build', amount: -1 },
                { type: 'moneyIncome', amount: 2 },
                { type: 'maintenanceRate', amount: -0.02 },
                { type: 'ppCapBonus', amount: -3 }
            ]
        },
        populism: {
            id: 'populism', name: '民粹主义', color: '#a16207',
            description: '俱乐部、广播、地方动员。PP 收入高、征兵便宜。',
            bonuses: [
                { type: 'ppIncome', amount: 2 },
                { type: 'recruitCost', amount: -1 },
                { type: 'recruitAmount', amount: 1 },
                { type: 'ppCapBonus', amount: -3 }
            ]
        },
        fascism: {
            id: 'fascism', name: '法西斯主义', color: '#831843',
            description: '党国一体，强人治理，靠战争维持自身。',
            bonuses: [
                { type: 'globalAttack', amount: 0.10 },
                { type: 'captureMoney', amount: 2 },
                { type: 'crisisPP', amount: 3 },
                { type: 'maintenanceRate', amount: -0.03 },
                { type: 'ppCapBonus', amount: -5 }
            ]
        },
        plutocracy: {
            id: 'plutocracy', name: '财阀寡头', color: '#9a3412',
            description: '银行、铁路和承包商承担国家职能。金钱多、政治资本少。',
            bonuses: [
                { type: 'moneyIncome', amount: 3 },
                { type: 'maintenanceRate', amount: -0.02 },
                { type: 'recruitCost', amount: 1 },
                { type: 'ppIncome', amount: -1 }
            ]
        },
        security_state: {
            id: 'security_state', name: '安全国家', color: '#0f766e',
            description: '宪兵、许可、清剿。后方稳，前线不主动。',
            bonuses: [
                { type: 'globalDefense', amount: 0.10 },
                { type: 'crisisPP', amount: 3 },
                { type: 'maintenanceRate', amount: -0.03 },
                { type: 'globalAttack', amount: -0.05 }
            ]
        },
        mercantile: {
            id: 'mercantile', name: '商业共和', color: '#0369a1',
            description: '港口、保险、船运承担国家收入。海路赚钱，陆战吃亏。',
            bonuses: [
                { type: 'taggedIncome', tag: '港口', amount: 1 },
                { type: 'moneyIncome', amount: 2 },
                { type: 'taggedDefense', tag: '港口', amount: 0.05 },
                { type: 'globalAttack', amount: -0.05 }
            ]
        },
        frontier_republic: {
            id: 'frontier_republic', name: '边疆共和', color: '#ca8a04',
            description: '州长、治安官和牧场主分享统治。征兵活、但 PP 上限低。',
            bonuses: [
                { type: 'taggedIncome', tag: '油田', amount: 1 },
                { type: 'recruitAmount', amount: 1 },
                { type: 'freeTroops', amount: 3 },
                { type: 'ppCapBonus', amount: -2 }
            ]
        },
        expansionism: {
            id: 'expansionism', name: '扩张主义', color: '#7c2d12',
            description: '把战争视为国家解决方案。攻击与缴获双高。',
            bonuses: [
                { type: 'globalAttack', amount: 0.10 },
                { type: 'captureMoney', amount: 3 },
                { type: 'captureTroops', amount: 1 },
                { type: 'recruitAmount', amount: 1 },
                { type: 'maintenanceRate', amount: 0.02 }
            ]
        },
        constitutional: {
            id: 'constitutional', name: '宪政复归', color: '#1d4ed8',
            description: '战时仍尊重宪法、法院与文官审查。',
            bonuses: [
                { type: 'actionCost', action: 'focus', amount: -1 },
                { type: 'ppIncome', amount: 1 },
                { type: 'ppCapBonus', amount: 3 },
                { type: 'maintenanceRate', amount: -0.02 }
            ]
        },
        federalism: {
            id: 'federalism', name: '州联邦', color: '#3730a3',
            description: '州权回归。地方自治、部队自带补给，但中央 PP 紧张。',
            bonuses: [
                { type: 'moneyIncome', amount: 2 },
                { type: 'freeTroops', amount: 5 },
                { type: 'ppCapBonus', amount: -3 },
                { type: 'taggedIncome', tag: '油田', amount: 1 }
            ]
        },
        cthulhu_cult: {
            id: 'cthulhu_cult', name: '旧日支配', color: '#15803d',
            description: '旧日支配者已经回归。所有人在战场上都看见不该看见的。',
            bonuses: [
                { type: 'globalAttack', amount: 0.10 },
                { type: 'captureTroops', amount: 2 },
                { type: 'damageOnCapture', amount: 1 },
                { type: 'crisisPP', amount: 5 },
                { type: 'maintenanceRate', amount: 0.04 }
            ]
        },
        eldritch_knowledge: {
            id: 'eldritch_knowledge', name: '神秘技术', color: '#16a34a',
            description: '密斯卡塔尼克的学者打开了"知道一切"的钥匙。',
            bonuses: [
                { type: 'ppCapBonus', amount: 5 },
                { type: 'actionCost', action: 'all', amount: -1 },
                { type: 'moneyIncome', amount: 2 },
                { type: 'maintenanceRate', amount: -0.03 }
            ]
        },
        crawling_chaos: {
            id: 'crawling_chaos', name: '爬行混沌', color: '#65a30d',
            description: '"千面"出现在每一面镜子里。命令无须解释，但谁也不再确定。',
            bonuses: [
                { type: 'ppIncome', amount: 3 },
                { type: 'freeTroops', amount: 8 },
                { type: 'crisisPP', amount: 6 },
                { type: 'recruitAmount', amount: 1 },
                { type: 'globalDefense', amount: -0.05 }
            ]
        }
    },

    factions: [
        {
            id: 'USA',
            name: '美利坚合众国',
            shortName: '麦克阿瑟军政府',
            color: '#2563eb',
            capitalNodeId: 'WAS',
            difficulty: 3,
            playstyleTags: ['防守反击', '正统政府'],
            description: '作为合众国正统，你需要死守华盛顿并向四周出击，平息所有叛乱。',
            ideology: 'military_junta',
            startingStats: { nodes: 6, industry: 14, troops: 24, money: 20, pp: 10 }
        },
        {
            id: 'CSA',
            name: '美利坚联合工团',
            shortName: '联合工团',
            color: '#dc2626',
            capitalNodeId: 'CHI',
            difficulty: 2,
            playstyleTags: ['工业爆兵', '五大湖防线'],
            description: '控制着五大湖工业区，拥有极高的工业潜力，可以用持续征兵压垮敌人。',
            ideology: 'syndicalism',
            startingStats: { nodes: 6, industry: 15, troops: 31, money: 15, pp: 13 }
        },
        {
            id: 'AUS',
            name: '美利坚联盟国',
            shortName: '联盟国',
            color: '#7c3aed',
            capitalNodeId: 'BAT',
            difficulty: 3,
            playstyleTags: ['中部走廊', '纵深机动'],
            description: '从北部平原一路压到密西西比河下游，能同时威胁五大湖、落基山和深南方。',
            ideology: 'populism',
            startingStats: { nodes: 8, industry: 14, troops: 27, money: 24, pp: 10 }
        },
        {
            id: 'CON',
            name: '美利坚宪政国',
            shortName: '宪政国',
            color: '#059669',
            capitalNodeId: 'ATL',
            difficulty: 4,
            playstyleTags: ['深南方堡垒', '亚特兰大核心'],
            description: '以亚特兰大和卡罗莱纳为核心，夹在联邦军、联盟国和德州之间，扩张窗口很窄。',
            ideology: 'security_state',
            startingStats: { nodes: 6, industry: 14, troops: 23, money: 20, pp: 10 }
        },
        {
            id: 'NEN',
            name: '新英格兰',
            shortName: '新英格兰',
            color: '#0284c7',
            capitalNodeId: 'BOS',
            difficulty: 5,
            playstyleTags: ['偏安一隅', '外援窗口'],
            description: '在东北角自保，依赖外部势力的援助和精密防守。',
            ideology: 'mercantile',
            startingStats: { nodes: 4, industry: 8, troops: 13, money: 30, pp: 5 }
        },
        {
            id: 'PAC',
            name: '美利坚太平洋国',
            shortName: '太平洋国',
            color: '#d97706',
            capitalNodeId: 'SAC',
            difficulty: 3,
            playstyleTags: ['民主堡垒', '落基山防线'],
            description: '退守西海岸，利用地理优势积蓄力量。',
            ideology: 'wartime_democracy',
            startingStats: { nodes: 5, industry: 12, troops: 22, money: 20, pp: 7 }
        },
        {
            id: 'WDC',
            name: '西部指挥军区',
            shortName: '西部军区',
            color: '#64748b',
            capitalNodeId: 'DEN',
            difficulty: 4,
            playstyleTags: ['荒漠游击', '纵深防御'],
            description: '在大平原和沙漠中与各方周旋，节点多但工业薄弱。',
            ideology: 'military_junta',
            startingStats: { nodes: 7, industry: 8, troops: 17, money: 18, pp: 10 }
        },
        {
            id: 'TEX',
            name: '德克萨斯临时政府',
            shortName: '德克萨斯',
            color: '#92400e',
            capitalNodeId: 'DAL',
            difficulty: 4,
            playstyleTags: ['石油经济', '孤星防线'],
            description: '拥有丰富的油田资源，可以把金钱转化为持续战争潜力。',
            ideology: 'frontier_republic',
            startingStats: { nodes: 4, industry: 10, troops: 16, money: 22.5, pp: 8 }
        }
    ],

    /**
     * 大厅状态。
     * - mode: 'local'（单机沙盒）或 'online'（Firebase 联机房间）
     * - slots: 每个国家一个槽位 { factionId, kind: 'open'|'human'|'ai', userId?, playerName?, aiDifficulty? }
     * - hostId: 房主 userId（决定谁可以踢人/加 AI/开始游戏）
     * - myUserId / myName: 当前客户端身份
     * - chat: 聊天消息列表
     */
    lobby: {
        roomCode: 'LOCAL',
        mode: 'local',
        hostId: 'local-host',
        myUserId: 'local-host',
        myName: '指挥官',
        ready: false,
        connecting: false,
        statusMessage: '',
        settings: {
            maxPlayers: '8',
            mapScale: '标准',
            turnLimit: '180',
            victory: '统一',
            diplomacy: true,
            ai: true
        },
        slots: [],
        chat: []
    },

    game: {
        currentTurn: 1,
        currentPlayerId: 'USA',
        currentIdeology: null,
        timerRemaining: 180,
        selectedNodeId: null,
        hoveredNodeId: null,
        currentAction: null,
        actionCountThisTurn: 0,
        movementOrdersActive: false,
        moveDraftAmount: 1,
        battleDraftAmount: 1,
        recruitDraftAmount: 1,
        battlePreview: null,
        actionConfirm: null,
        showFocusModal: false,
        showDiplomacyModal: false,
        showGridView: false,
        activeLogTab: 'battle',
        completedFocuses: [],
        focusProgress: {},
        selectedFocusId: null,
        focusTreeViewport: { scale: 1 },
        modifiers: {
            actionBaseCost: {},
            recruitAmount: 0,
            maintenanceRateDelta: 0,
            ppIncome: 0,
            moneyIncome: 0,
            ppCapBonus: 0,
            recruitCostDelta: 0,
            freeTroops: 0,
            globalAttack: 0,
            globalDefense: 0,
            taggedDefense: {},
            taggedIncome: {},
            captureMoneyOnWin: 0,
            captureTroopsOnWin: 0,
            crisisPP: 0,
            industryCapBoosts: 0,
            damageOnCapture: 0,
            badges: []
        },
        nodeIndustryCaps: {},
        warBondsPenalty: 0,
        warBondsPenaltyTurns: 0,
        diplomacy: {},
        currentCapitals: {},
        eliminatedFactions: [],
        winner: null,
        gameOver: false,
        showEndGameModal: false,
        mapViewport: { x: 0, y: 0, width: 1000, height: 620 },
        playerResources: {
            money: 25,
            pp: 10,
            nodes: 0,
            totalIndustry: 0,
            totalTroops: 0
        },
        logs: [
            { type: 'system', text: '游戏开始。第 1 回合。' }
        ]
    },

    focusTrees: {
        USA: [
            { id: 'usa_secure_command', name: '战时指挥委员会', branch: '战时统合', x: 9, y: 0, cost: 4, description: '把华盛顿周边的军政权力压进一套统一指挥链。', effects: [{ type: 'pp', amount: 5 }, { type: 'capitalTroops', amount: 2 }] },

            { id: 'usa_emergency_war_powers', name: '紧急战争权力', branch: '政治路线', x: 3, y: 1, cost: 5, prerequisites: ['usa_secure_command'], description: '授权总统与总参谋部绕过常规程序处理叛乱。', effects: [{ type: 'pp', amount: 4 }] },
            { id: 'usa_restore_congress', name: '召回国会委员会', branch: '民主修复', x: 1, y: 2, cost: 6, prerequisites: ['usa_emergency_war_powers'], mutuallyExclusive: ['usa_american_caesar', 'usa_military_directorate'], description: '保留军政府框架下的文官合法性。', effects: [{ type: 'money', amount: 12 }, { type: 'pp', amount: 3 }] },
            { id: 'usa_american_caesar', name: '美国凯撒', branch: '军政府', x: 3, y: 2, cost: 6, prerequisites: ['usa_emergency_war_powers'], mutuallyExclusive: ['usa_restore_congress', 'usa_military_directorate'], description: '承认麦克阿瑟个人权威是维持联邦的核心。', effects: [{ type: 'capitalTroops', amount: 5 }, { type: 'pp', amount: 3 }] },
            { id: 'usa_military_directorate', name: '军政委员会', branch: '技术官僚', x: 5, y: 2, cost: 6, prerequisites: ['usa_emergency_war_powers'], mutuallyExclusive: ['usa_restore_congress', 'usa_american_caesar'], description: '用军官、州长和工程官僚组成临时管理机构。', effects: [{ type: 'money', amount: 10 }, { type: 'capitalIndustry', amount: 1 }] },
            { id: 'usa_special_elections', name: '特别选举筹备', branch: '民主修复', x: 1, y: 3, cost: 7, prerequisites: ['usa_restore_congress'], description: '为内战后的临时选举保留制度入口。', effects: [{ type: 'money', amount: 10 }, { type: 'pp', amount: 6 }] },
            { id: 'usa_government_by_decree', name: '命令治国', branch: '军政府', x: 3, y: 3, cost: 8, prerequisites: ['usa_american_caesar'], description: '所有州际事务由军令直达。', effects: [{ type: 'allTroops', amount: 1 }, { type: 'pp', amount: 7 }] },
            { id: 'usa_balanced_restoration', name: '有限复归方案', branch: '技术官僚', x: 5, y: 3, cost: 8, prerequisites: ['usa_military_directorate'], description: '预设一套既保留军管效率又恢复法统的路线。', effects: [{ type: 'money', amount: 12 }, { type: 'capitalIndustry', amount: 1 }] },

            { id: 'usa_war_department_expansion', name: '扩编战争部', branch: '军事改革', x: 9, y: 1, cost: 5, prerequisites: ['usa_secure_command'], description: '重开各局办公室，协调陆军、民兵与州防卫队。', effects: [{ type: 'capitalTroops', amount: 4 }] },
            { id: 'usa_mcarthur_in_command', name: '麦克阿瑟亲自指挥', branch: '军事改革', x: 9, y: 2, cost: 6, prerequisites: ['usa_war_department_expansion'], description: '让总司令部直接接管关键战区。', effects: [{ type: 'pp', amount: 5 }, { type: 'allTroops', amount: 1 }] },
            { id: 'usa_all_to_general_staff', name: '一切归于总参', branch: '军事改革', x: 8, y: 3, cost: 6, prerequisites: ['usa_mcarthur_in_command'], mutuallyExclusive: ['usa_field_command_autonomy'], description: '集中计划、统一调配，避免战区军阀化。', effects: [{ type: 'allTroops', amount: 1 }, { type: 'pp', amount: 3 }] },
            { id: 'usa_field_command_autonomy', name: '战区指挥自主', branch: '军事改革', x: 10, y: 3, cost: 6, prerequisites: ['usa_mcarthur_in_command'], mutuallyExclusive: ['usa_all_to_general_staff'], description: '授予前线司令更大机动权限。', effects: [{ type: 'money', amount: 10 }, { type: 'capitalTroops', amount: 3 }] },
            { id: 'usa_mcnair_report', name: '麦克奈尔报告', branch: '军事改革', x: 9, y: 4, cost: 6, prerequisiteAny: [['usa_all_to_general_staff'], ['usa_field_command_autonomy']], description: '评估内战中暴露出的编制与训练问题。', effects: [{ type: 'pp', amount: 4 }, { type: 'allTroops', amount: 1 }] },
            { id: 'usa_armored_thrust', name: '装甲突击理论', branch: '军事改革', x: 8, y: 5, cost: 7, prerequisites: ['usa_mcnair_report'], mutuallyExclusive: ['usa_infantry_superiority'], description: '把稀缺燃料和工厂优先用于机动作战。', effects: [{ type: 'nodeIndustry', nodeId: 'PIT', amount: 1 }, { type: 'capitalTroops', amount: 3 }] },
            { id: 'usa_infantry_superiority', name: '步兵优势学说', branch: '军事改革', x: 10, y: 5, cost: 7, prerequisites: ['usa_mcnair_report'], mutuallyExclusive: ['usa_armored_thrust'], description: '用火炮、工兵和训练提升普通步兵战力。', effects: [{ type: 'allTroops', amount: 2 }] },
            { id: 'usa_joint_operations', name: '联合战役司令部', branch: '军事改革', x: 9, y: 6, cost: 9, prerequisiteAny: [['usa_armored_thrust'], ['usa_infantry_superiority']], description: '把陆军、航空队和海军支援纳入统一战役计划。', effects: [{ type: 'pp', amount: 6 }, { type: 'capitalTroops', amount: 4 }] },

            { id: 'usa_emergency_industry_board', name: '紧急工业委员会', branch: '经济动员', x: 13, y: 1, cost: 5, prerequisites: ['usa_secure_command'], description: '将军工合同、铁路运输和原料配给集中审查。', effects: [{ type: 'money', amount: 15 }, { type: 'capitalIndustry', amount: 1 }] },
            { id: 'usa_war_bonds_drive', name: '战争债券宣传', branch: '经济动员', x: 12, y: 2, cost: 5, prerequisites: ['usa_emergency_industry_board'], description: '向忠诚城市发行短期债券。', effects: [{ type: 'money', amount: 25 }] },
            { id: 'usa_arsenal_of_the_capital', name: '首都兵工厂', branch: '经济动员', x: 12, y: 3, cost: 6, prerequisites: ['usa_war_bonds_drive'], description: '扩建首都圈军工产能。', effects: [{ type: 'capitalIndustry', amount: 2 }] },
            { id: 'usa_military_factories_first', name: '军工优先', branch: '经济动员', x: 11, y: 4, cost: 7, prerequisites: ['usa_arsenal_of_the_capital'], mutuallyExclusive: ['usa_civilian_retooling'], description: '牺牲民生恢复速度，优先扩大前线军需。', effects: [{ type: 'allIndustry', amount: 1, maxNodes: 4 }] },
            { id: 'usa_civilian_retooling', name: '民用复产', branch: '经济动员', x: 14, y: 4, cost: 7, prerequisites: ['usa_arsenal_of_the_capital'], mutuallyExclusive: ['usa_military_factories_first'], description: '保住城市财政和运输体系，再反哺战争。', effects: [{ type: 'money', amount: 35 }] },
            { id: 'usa_treasury_reorganization', name: '财政部重组', branch: '经济动员', x: 13, y: 5, cost: 8, prerequisiteAny: [['usa_military_factories_first'], ['usa_civilian_retooling']], description: '建立战时预算和维护费优先级。', effects: [{ type: 'money', amount: 20 }, { type: 'pp', amount: 5 }] },
            { id: 'usa_total_war_production', name: '全面战争生产', branch: '经济动员', x: 13, y: 6, cost: 10, prerequisites: ['usa_treasury_reorganization'], description: '把所有剩余工业纳入统一战争经济。', effects: [{ type: 'allIndustry', amount: 1, maxNodes: 6 }, { type: 'money', amount: 20 }] },

            { id: 'usa_reopen_naval_bureau', name: '重开海军局', branch: '海空军', x: 17, y: 1, cost: 5, prerequisites: ['usa_secure_command'], description: '恢复东海岸港口与海军仓库的最低运转。', effects: [{ type: 'taggedTroops', tag: '港口', amount: 1 }] },
            { id: 'usa_atlantic_patrols', name: '大西洋巡逻线', branch: '海空军', x: 16, y: 2, cost: 5, prerequisites: ['usa_reopen_naval_bureau'], description: '守住诺福克、巴尔的摩和纽约的海上补给。', effects: [{ type: 'money', amount: 12 }, { type: 'taggedTroops', tag: '港口', amount: 1 }] },
            { id: 'usa_army_air_corps', name: '陆军航空队', branch: '海空军', x: 18, y: 2, cost: 5, prerequisites: ['usa_reopen_naval_bureau'], description: '用侦察和近距支援补足前线兵力不足。', effects: [{ type: 'pp', amount: 4 }] },
            { id: 'usa_chief_of_combined_operations', name: '联合作战部长', branch: '海空军', x: 18, y: 3, cost: 9, prerequisites: ['usa_atlantic_patrols', 'usa_army_air_corps'], description: '海空军支援不再各自为战。', effects: [{ type: 'pp', amount: 8 }, { type: 'taggedTroops', tag: '港口', amount: 1 }] },

            { id: 'usa_plan_for_reconstruction', name: '重建白皮书', branch: '战后路线', x: 23, y: 1, cost: 5, prerequisites: ['usa_secure_command'], description: '在战争还没结束时就准备战后治理方案。', effects: [{ type: 'pp', amount: 4 }] },
            { id: 'usa_restore_federal_courts', name: '恢复联邦法院', branch: '战后路线', x: 23, y: 2, cost: 6, prerequisites: ['usa_plan_for_reconstruction'], description: '让被军令压住的司法体系逐步恢复。', effects: [{ type: 'money', amount: 12 }, { type: 'pp', amount: 4 }] },
            { id: 'usa_rebuild_monroe_doctrine', name: '重建门罗主义', branch: '外交路线', x: 22, y: 3, cost: 7, prerequisites: ['usa_restore_federal_courts'], mutuallyExclusive: ['usa_enter_the_fray', 'usa_fortress_america'], description: '把重心放在西半球秩序。', effects: [{ type: 'money', amount: 18 }] },
            { id: 'usa_enter_the_fray', name: '加入世界风暴', branch: '外交路线', x: 24, y: 3, cost: 7, prerequisites: ['usa_restore_federal_courts'], mutuallyExclusive: ['usa_rebuild_monroe_doctrine', 'usa_fortress_america'], description: '以美国回归世界战争作为战后合法性。', effects: [{ type: 'pp', amount: 9 }] },
            { id: 'usa_fortress_america', name: '美洲堡垒', branch: '外交路线', x: 26, y: 3, cost: 7, prerequisites: ['usa_restore_federal_courts'], mutuallyExclusive: ['usa_rebuild_monroe_doctrine', 'usa_enter_the_fray'], description: '拒绝海外冒险，优先巩固大陆。', effects: [{ type: 'allIndustry', amount: 1, maxNodes: 3 }] },
            { id: 'usa_hemisphere_defense', name: '半球防御计划', branch: '外交路线', x: 24, y: 4, cost: 8, prerequisiteAny: [['usa_rebuild_monroe_doctrine'], ['usa_enter_the_fray'], ['usa_fortress_america']], description: '沿海、港口和首都圈进入长期防御规划。', effects: [{ type: 'taggedTroops', tag: '港口', amount: 2 }, { type: 'capitalTroops', amount: 4 }] }
        ],
        default: [
            { id: 'generic_mobilize', name: '战时动员', branch: '通用', x: 2, y: 0, cost: 4, description: '把残余行政系统转入战争状态。', effects: [{ type: 'pp', amount: 4 }] },
            { id: 'generic_militia', name: '民兵组织', branch: '通用', x: 1, y: 1, cost: 5, prerequisites: ['generic_mobilize'], description: '在首都组建守备民兵。', effects: [{ type: 'capitalTroops', amount: 4 }] },
            { id: 'generic_industry', name: '兵工厂扩建', branch: '通用', x: 3, y: 1, cost: 5, prerequisites: ['generic_mobilize'], description: '扩建首都军工设施。', effects: [{ type: 'capitalIndustry', amount: 1 }] },
            { id: 'generic_rail', name: '铁路军运', branch: '通用', x: 1, y: 2, cost: 6, prerequisites: ['generic_militia'], description: '把后方驻军送上前线。', effects: [{ type: 'allTroops', amount: 1 }] },
            { id: 'generic_bonds', name: '战争债券', branch: '通用', x: 3, y: 2, cost: 6, prerequisites: ['generic_industry'], description: '发行债券维持军费。', effects: [{ type: 'money', amount: 18 }] },
            { id: 'generic_offensive', name: '全面攻势', branch: '通用', x: 2, y: 3, cost: 8, prerequisites: ['generic_rail', 'generic_bonds'], description: '集中所有资源发动一次总攻。', effects: [{ type: 'pp', amount: 6 }, { type: 'capitalTroops', amount: 3 }] }
        ]
    },

    listeners: [],

    /**
     * 应用启动时调用一次，建立默认本地 lobby slots（USA 默认是房主），所有空槽位待机。
     */
    bootstrapLobby() {
        if (!this.lobby.slots || this.lobby.slots.length === 0) {
            this.initLocalLobby();
        }
    },

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(item => item !== listener);
        };
    },

    notify() {
        this.refreshFactionStatus(false);
        this.recalculatePlayerResources();
        this.listeners.forEach(listener => listener(this));
    },

    getFaction(factionId = this.selectedFactionId || this.game.currentPlayerId) {
        return this.factions.find(faction => faction.id === factionId) || this.factions[0];
    },

    getIdeology(idOrFactionId) {
        // 直接传意识形态 id
        if (idOrFactionId && this.ideologies[idOrFactionId]) return this.ideologies[idOrFactionId];
        // 传势力 id：玩家用 game.currentIdeology，其他势力用其 baseline
        const playerFactionId = this.getPlayerFactionId();
        if (idOrFactionId && idOrFactionId === playerFactionId && this.game.currentIdeology) {
            return this.ideologies[this.game.currentIdeology] || null;
        }
        if (idOrFactionId) {
            const faction = this.getFaction(idOrFactionId);
            return faction ? this.ideologies[faction.ideology] || null : null;
        }
        // 默认：当前玩家
        const factionId = playerFactionId;
        const ideologyId = this.game.currentIdeology || (this.getFaction(factionId)?.ideology);
        return this.ideologies[ideologyId] || null;
    },

    setCurrentIdeology(ideologyId) {
        if (!this.ideologies[ideologyId]) return;
        this.game.currentIdeology = ideologyId;
    },

    /**
     * 累加当前意识形态对某个简单 numeric 加成键的总贡献。
     * key 可以是 'ppCapBonus' / 'ppIncome' / 'moneyIncome' / 'recruitCostDelta' /
     * 'recruitAmount' / 'maintenanceRateDelta' / 'globalAttack' / 'globalDefense' /
     * 'freeTroops' / 'captureMoneyOnWin' / 'captureTroopsOnWin' / 'crisisPP' /
     * 'capitalTroopsPerTurn' / 'damageOnCapture'
     */
    getIdeologyBonus(key) {
        const ideology = this.getIdeology();
        if (!ideology || !ideology.bonuses) return 0;
        const map = {
            ppCapBonus: ['ppCapBonus'],
            ppIncome: ['ppIncome'],
            moneyIncome: ['moneyIncome'],
            recruitCostDelta: ['recruitCost'],
            recruitAmount: ['recruitAmount'],
            maintenanceRateDelta: ['maintenanceRate'],
            globalAttack: ['globalAttack'],
            globalDefense: ['globalDefense'],
            freeTroops: ['freeTroops'],
            captureMoneyOnWin: ['captureMoney'],
            captureTroopsOnWin: ['captureTroops'],
            crisisPP: ['crisisPP'],
            capitalTroopsPerTurn: ['capitalTroopsPerTurn'],
            damageOnCapture: ['damageOnCapture']
        };
        const types = map[key] || [];
        return ideology.bonuses
            .filter(b => types.includes(b.type))
            .reduce((sum, b) => sum + (b.amount || 0), 0);
    },

    getIdeologyTaggedBonus(target, tag) {
        const ideology = this.getIdeology();
        if (!ideology || !ideology.bonuses) return 0;
        const wanted = target === 'income' ? 'taggedIncome' : 'taggedDefense';
        return ideology.bonuses
            .filter(b => b.type === wanted && b.tag === tag)
            .reduce((sum, b) => sum + (b.amount || 0), 0);
    },

    getIdeologyActionCostDelta(action) {
        const ideology = this.getIdeology();
        if (!ideology || !ideology.bonuses) return 0;
        return ideology.bonuses
            .filter(b => b.type === 'actionCost' && (b.action === action || b.action === 'all'))
            .reduce((sum, b) => sum + (b.amount || 0), 0);
    },

    getFactionColor(factionId) {
        const faction = this.getFaction(factionId);
        return faction ? faction.color : '#94a3b8';
    },

    getFactionName(factionId) {
        const faction = this.getFaction(factionId);
        return faction ? faction.shortName : '未知势力';
    },

    getOriginalCapitalOwner(nodeId) {
        const owner = this.factions.find(faction => faction.capitalNodeId === nodeId);
        return owner ? owner.id : null;
    },

    isOriginalCapitalNode(nodeId) {
        return Boolean(this.getOriginalCapitalOwner(nodeId));
    },

    getCapitalNodeId(factionId) {
        return Object.prototype.hasOwnProperty.call(this.game.currentCapitals, factionId)
            ? this.game.currentCapitals[factionId]
            : this.getFaction(factionId).capitalNodeId;
    },

    getCapitalOwner(nodeId) {
        return Object.entries(this.game.currentCapitals).find(([, capitalNodeId]) => capitalNodeId === nodeId)?.[0] || null;
    },

    canRecruitAtNode(nodeId, factionId = this.getPlayerFactionId()) {
        const node = window.MapData ? window.MapData.getNode(nodeId) : null;
        if (!node || node.factionId !== factionId) return false;

        return nodeId === this.getCapitalNodeId(factionId) || this.isOriginalCapitalNode(nodeId);
    },

    getNodeMoveReady(node) {
        if (!node) return 0;
        const ready = Number.isFinite(node.moveReady) ? node.moveReady : node.troops;
        return Math.max(0, Math.min(ready, node.troops));
    },

    getNodeFreshTroops(node) {
        if (!node) return 0;
        return Math.max(0, Math.min(node.freshTroops || 0, node.troops));
    },

    getNodeMovableTroops(node) {
        if (!node) return 0;
        return Math.max(0, Math.min(this.getNodeMoveReady(node), node.troops - 1));
    },

    getFactionMovableTroops(factionId = this.getPlayerFactionId()) {
        return this.getFactionNodes(factionId).reduce((total, node) => total + this.getNodeMovableTroops(node), 0);
    },

    resetMovementReadiness() {
        if (!window.MapData) return;

        window.MapData.nodes.forEach(node => {
            node.moveReady = Math.max(0, node.troops);
            node.freshTroops = 0;
            node.movedThisTurn = false;
        });
    },

    getActionExtraCost() {
        return this.game.actionCountThisTurn;
    },

    getActionPPCost(baseCost) {
        return baseCost + this.getActionExtraCost();
    },

    getGameModifiers() {
        const defaults = {
            actionBaseCost: {},
            recruitAmount: 0,
            maintenanceRateDelta: 0,
            ppIncome: 0,
            moneyIncome: 0,
            ppCapBonus: 0,
            recruitCostDelta: 0,
            freeTroops: 0,
            globalAttack: 0,
            globalDefense: 0,
            taggedDefense: {},
            taggedIncome: {},
            captureMoneyOnWin: 0,
            captureTroopsOnWin: 0,
            crisisPP: 0,
            industryCapBoosts: 0,
            damageOnCapture: 0,
            badges: []
        };
        this.game.modifiers = Object.assign({}, defaults, this.game.modifiers || {});
        this.game.modifiers.actionBaseCost = this.game.modifiers.actionBaseCost || {};
        this.game.modifiers.taggedDefense = this.game.modifiers.taggedDefense || {};
        this.game.modifiers.taggedIncome = this.game.modifiers.taggedIncome || {};
        this.game.modifiers.badges = this.game.modifiers.badges || [];
        this.game.nodeIndustryCaps = this.game.nodeIndustryCaps || {};
        return this.game.modifiers;
    },

    getActionBaseCostAdjustment(action) {
        return (this.getGameModifiers().actionBaseCost[action] || 0)
            + this.getIdeologyActionCostDelta(action)
            + this.getDebtPenalty().actionCostDelta;
    },

    getMaintenanceRate() {
        return Math.max(0.05, this.baseMaintenanceRate
            + (this.getGameModifiers().maintenanceRateDelta || 0)
            + this.getIdeologyBonus('maintenanceRateDelta'));
    },

    getEffectivePPCap() {
        const total = this.ppCap
            + (this.getGameModifiers().ppCapBonus || 0)
            + this.getIdeologyBonus('ppCapBonus');
        return Math.max(20, total);
    },

    getTurnPPIncome(money = this.game.playerResources.money) {
        return Math.max(0, this.basePPIncome
            + (this.getGameModifiers().ppIncome || 0)
            + this.getIdeologyBonus('ppIncome')
            + this.getDebtPenalty(money).ppIncomeDelta);
    },

    getMoneyIncomeBonus() {
        return (this.getGameModifiers().moneyIncome || 0)
            + this.getIdeologyBonus('moneyIncome');
    },

    getEffectiveGlobalAttack() {
        return (this.getGameModifiers().globalAttack || 0)
            + this.getIdeologyBonus('globalAttack')
            + this.getDebtPenalty().globalAttackDelta;
    },

    getEffectiveGlobalDefense() {
        return (this.getGameModifiers().globalDefense || 0)
            + this.getIdeologyBonus('globalDefense')
            + this.getDebtPenalty().globalDefenseDelta;
    },

    getDebtAmount(money = this.game.playerResources.money) {
        return Math.max(0, -(Number(money) || 0));
    },

    getDebtPenalty(money = this.game.playerResources.money) {
        const debt = this.getDebtAmount(money);
        const tier = [...this.debtPenaltyTiers]
            .reverse()
            .find(item => debt >= item.threshold);
        return tier
            ? { ...tier, debt }
            : {
                threshold: 0,
                label: '财政稳定',
                description: '没有赤字惩罚。',
                debt,
                ppIncomeDelta: 0,
                globalAttackDelta: 0,
                globalDefenseDelta: 0,
                actionCostDelta: 0,
                desertionRate: 0,
                minDesertion: 0
            };
    },

    getEffectiveCaptureMoney() {
        return (this.getGameModifiers().captureMoneyOnWin || 0)
            + this.getIdeologyBonus('captureMoneyOnWin');
    },

    getEffectiveCaptureTroops() {
        return (this.getGameModifiers().captureTroopsOnWin || 0)
            + this.getIdeologyBonus('captureTroopsOnWin');
    },

    getEffectiveFreeTroops() {
        return (this.getGameModifiers().freeTroops || 0)
            + this.getIdeologyBonus('freeTroops');
    },

    getEffectiveCrisisPP() {
        return (this.getGameModifiers().crisisPP || 0)
            + this.getIdeologyBonus('crisisPP');
    },

    getEffectiveRecruitCostDelta() {
        return (this.getGameModifiers().recruitCostDelta || 0)
            + this.getIdeologyBonus('recruitCostDelta');
    },

    getEffectiveRecruitAmount() {
        return (this.getGameModifiers().recruitAmount || 0)
            + this.getIdeologyBonus('recruitAmount');
    },

    getCapitalTroopsPerTurn() {
        return this.getIdeologyBonus('capitalTroopsPerTurn');
    },

    getTaggedNodeCount(tag, factionId = this.getPlayerFactionId()) {
        if (!window.MapData) return 0;
        return window.MapData.getFactionNodes(factionId).filter(node => node.tags.includes(tag)).length;
    },

    getTaggedIncomeTotal(factionId = this.getPlayerFactionId()) {
        const taggedIncome = this.getGameModifiers().taggedIncome || {};
        const ideology = this.getIdeology();
        const merged = { ...taggedIncome };
        if (ideology && ideology.bonuses) {
            ideology.bonuses
                .filter(b => b.type === 'taggedIncome')
                .forEach(b => { merged[b.tag] = (merged[b.tag] || 0) + b.amount; });
        }
        return Object.entries(merged).reduce((total, [tag, perNode]) => (
            total + this.getTaggedNodeCount(tag, factionId) * perNode
        ), 0);
    },

    getNextTurnResourcePreview(factionId = this.getPlayerFactionId(), options = {}) {
        const mapData = window.MapData;
        const resources = this.game.playerResources || {};
        const totals = mapData
            ? mapData.calculateFactionStats(factionId)
            : {
                totalIndustry: resources.totalIndustry || 0,
                totalTroops: resources.totalTroops || 0
            };
        const extraTroops = Number(options.extraTroops) || 0;
        const extraIndustry = Number(options.extraIndustry) || 0;
        const moneySpent = Math.max(0, Number(options.moneySpent) || 0);
        const ppSpent = Math.max(0, Number(options.ppSpent) || 0);
        const taggedIncome = this.getTaggedIncomeTotal(factionId);
        const warBondsPenalty = this.game.warBondsPenaltyTurns > 0 ? (this.game.warBondsPenalty || 0) : 0;
        const grossIncome = Math.max(0, totals.totalIndustry + extraIndustry + this.getMoneyIncomeBonus() + taggedIncome + warBondsPenalty);
        const maintenanceRate = this.getMaintenanceRate();
        const freeTroops = Math.max(0, this.getEffectiveFreeTroops());
        const totalTroops = Math.max(0, totals.totalTroops + extraTroops);
        const billableTroops = Math.max(0, totalTroops - freeTroops);
        const maintenance = billableTroops * maintenanceRate;
        const moneyDelta = grossIncome - maintenance;
        const currentMoneyAfterAction = (resources.money || 0) - moneySpent;
        const currentPPAfterAction = Math.max(0, (resources.pp || 0) - ppSpent);
        const ppIncome = this.getTurnPPIncome(currentMoneyAfterAction);
        const projectedPP = Math.min(this.getEffectivePPCap(), currentPPAfterAction + ppIncome);
        const projectedMoney = currentMoneyAfterAction + moneyDelta;

        return {
            taggedIncome,
            warBondsPenalty,
            grossIncome,
            maintenance,
            moneyDelta,
            projectedMoney,
            ppIncome,
            ppDelta: projectedPP - currentPPAfterAction,
            projectedPP,
            debtPenalty: this.getDebtPenalty(currentMoneyAfterAction),
            projectedDebtPenalty: this.getDebtPenalty(projectedMoney),
            maintenanceRate,
            freeTroops,
            totalTroops,
            billableTroops
        };
    },

    getTaggedDefenseBonus(node) {
        if (!node) return 0;
        const taggedDefense = this.getGameModifiers().taggedDefense || {};
        const ideology = this.getIdeology();
        const merged = { ...taggedDefense };
        if (ideology && ideology.bonuses) {
            ideology.bonuses
                .filter(b => b.type === 'taggedDefense')
                .forEach(b => { merged[b.tag] = (merged[b.tag] || 0) + b.amount; });
        }
        return Object.entries(merged).reduce((bonus, [tag, value]) => (
            node.tags && node.tags.includes(tag) ? bonus + value : bonus
        ), 0);
    },

    getNodeIndustryCap(nodeId) {
        const caps = this.game.nodeIndustryCaps || {};
        return Math.max(5, caps[nodeId] || 5);
    },

    setNodeIndustryCap(nodeId, cap) {
        this.game.nodeIndustryCaps = this.game.nodeIndustryCaps || {};
        this.game.nodeIndustryCaps[nodeId] = Math.max(this.game.nodeIndustryCaps[nodeId] || 0, cap);
    },

    getFocusTree(factionId = this.getPlayerFactionId()) {
        return this.focusTrees[factionId] || this.focusTrees.default;
    },

    getFocusById(focusId, factionId = this.getPlayerFactionId()) {
        return this.getFocusTree(factionId).find(focus => focus.id === focusId);
    },

    areFocusPrerequisitesMet(focus, completed = this.game.completedFocuses) {
        const required = focus.prerequisites || [];
        const requiredMet = required.every(id => completed.includes(id));
        const anyGroups = focus.prerequisiteAny || [];
        const anyMet = anyGroups.length === 0 || anyGroups.some(group => group.every(id => completed.includes(id)));

        return requiredMet && anyMet;
    },

    isFocusBlockedByMutual(focus, completed = this.game.completedFocuses) {
        return (focus.mutuallyExclusive || []).some(id => completed.includes(id));
    },

    getFocusRequiredProgress(focus) {
        if (!focus) return 0;
        if (focus.progressRequired) return focus.progressRequired;
        if (focus.cost >= 8) return 4;
        if (focus.cost >= 6) return 3;
        return 2;
    },

    getFocusProgress(focusId) {
        return this.game.focusProgress?.[focusId] || 0;
    },

    getFocusProgressInfo(focus) {
        const required = this.getFocusRequiredProgress(focus);
        const current = this.game.completedFocuses.includes(focus.id)
            ? required
            : Math.min(this.getFocusProgress(focus.id), required);

        return {
            current,
            required,
            ratio: required > 0 ? current / required : 0
        };
    },

    getFocusStatus(focus, completed = this.game.completedFocuses) {
        if (completed.includes(focus.id)) return 'done';
        if (this.isFocusBlockedByMutual(focus, completed)) return 'mutually-blocked';
        if (!this.areFocusPrerequisitesMet(focus, completed)) return 'locked';

        const ppCost = this.getActionPPCost(1);
        return this.game.playerResources.pp >= ppCost ? 'available' : 'pp-blocked';
    },

    getFactionNodes(factionId) {
        return window.MapData ? window.MapData.getFactionNodes(factionId) : [];
    },

    getBestFallbackCapital(factionId) {
        const nodes = this.getFactionNodes(factionId);
        if (!nodes.length) return null;

        return [...nodes].sort((a, b) => (
            b.industry - a.industry ||
            b.troops - a.troops ||
            a.name.localeCompare(b.name, 'zh-Hans-CN')
        ))[0];
    },

    refreshFactionStatus(shouldLog = false) {
        if (!window.MapData || !this.game.currentCapitals) return;

        const playerFactionId = this.getPlayerFactionId();
        this.game.lastCapitalNodeIds = this.game.lastCapitalNodeIds || {};

        this.factions.forEach(faction => {
            const ownedNodes = window.MapData.getFactionNodes(faction.id);
            const previousCapitalId = this.game.currentCapitals[faction.id];

            if (!ownedNodes.length) {
                this.game.currentCapitals[faction.id] = null;
                if (!this.game.eliminatedFactions.includes(faction.id)) {
                    this.game.eliminatedFactions.push(faction.id);
                    if (shouldLog) this.addLog(`${faction.shortName} 已无控制节点，判定灭亡。`, 'system', false);
                }
                return;
            }

            const originalCapital = window.MapData.getNode(faction.capitalNodeId);
            const fallbackCapital = this.getBestFallbackCapital(faction.id);
            const nextCapitalId = originalCapital && originalCapital.factionId === faction.id
                ? faction.capitalNodeId
                : fallbackCapital.id;

            this.game.currentCapitals[faction.id] = nextCapitalId;

            if (shouldLog && previousCapitalId && previousCapitalId !== nextCapitalId) {
                const nextCapital = window.MapData.getNode(nextCapitalId);
                if (nextCapitalId === faction.capitalNodeId) {
                    this.addLog(`${faction.shortName} 收复原首都，政府迁回 ${nextCapital.name}。`, 'system', false);
                } else {
                    this.addLog(`${faction.shortName} 原首都失守，临时首都迁至 ${nextCapital.name}。`, 'system', false);
                }
            }

            if (faction.id === playerFactionId) {
                const lastSeen = this.game.lastCapitalNodeIds[faction.id];
                if (lastSeen && lastSeen !== nextCapitalId && lastSeen === faction.capitalNodeId) {
                    const crisisPP = this.getGameModifiers().crisisPP || 0;
                    if (crisisPP > 0) {
                        this.game.playerResources.pp = Math.min(this.getEffectivePPCap(), this.game.playerResources.pp + crisisPP);
                        if (shouldLog) this.addLog(`紧急集会触发：${faction.shortName} 失去原首都，士气号召带来 +${crisisPP} PP。`, 'system', false);
                    }
                }
                this.game.lastCapitalNodeIds[faction.id] = nextCapitalId;
            } else {
                this.game.lastCapitalNodeIds[faction.id] = nextCapitalId;
            }
        });
    },

    checkVictory(shouldLog = false) {
        if (!window.MapData || this.game.gameOver) return null;

        const aliveFactions = this.factions.filter(faction => window.MapData.getFactionNodes(faction.id).length > 0);
        const totalNodes = window.MapData.nodes.length;
        const hegemon = aliveFactions.find(faction => window.MapData.getFactionNodes(faction.id).length / totalNodes >= 0.6);

        let winner = null;
        if (aliveFactions.length === 1) {
            winner = {
                factionId: aliveFactions[0].id,
                type: '歼灭胜利',
                text: `${aliveFactions[0].shortName} 成为地图上最后的存活势力。`
            };
        } else if (hegemon) {
            const nodeCount = window.MapData.getFactionNodes(hegemon.id).length;
            winner = {
                factionId: hegemon.id,
                type: '霸权胜利',
                text: `${hegemon.shortName} 控制 ${nodeCount}/${totalNodes} 个节点，达到 60% 霸权门槛。`
            };
        }

        if (winner) {
            this.game.winner = winner;
            this.game.gameOver = true;
            this.game.showEndGameModal = true;
            this.game.currentAction = null;
            this.game.battlePreview = null;
            this.game.actionConfirm = null;
            if (shouldLog) this.addLog(`${winner.type}：${winner.text}`, 'system', false);
        }

        return winner;
    },

    recalculatePlayerResources() {
        if (!window.MapData) return;

        const factionId = this.getPlayerFactionId();
        const totals = window.MapData.calculateFactionStats(factionId);
        this.game.playerResources.nodes = totals.nodes;
        this.game.playerResources.totalIndustry = totals.totalIndustry;
        this.game.playerResources.totalTroops = totals.totalTroops;
    },

    setView(viewName) {
        this.currentView = viewName;
        this.notify();
    },

    updateLobbySetting(key, value) {
        this.lobby.settings[key] = value;
        this.notify();
    },

    toggleLobbySwitch(key) {
        this.lobby.settings[key] = !this.lobby.settings[key];
        this.notify();
    },

    addLobbyChat(text) {
        const cleanText = String(text || '').trim();
        if (!cleanText) return;

        const chat = this.lobby.chat || (this.lobby.chat = []);
        chat.unshift({ author: this.lobby.myName || '指挥官', text: cleanText, ts: Date.now() });
        if (chat.length > 60) chat.length = 60;
        this.notify();
    },

    /**
     * 创建初始 slots（默认每个国家一个空槽位）。
     */
    createDefaultSlots() {
        return this.factions.map(faction => ({
            factionId: faction.id,
            kind: 'open',
            userId: null,
            playerName: '',
            aiDifficulty: 'normal'
        }));
    },

    isHost() {
        return this.lobby.hostId && this.lobby.hostId === this.lobby.myUserId;
    },

    getMySlot() {
        if (!this.lobby.slots) return null;
        return this.lobby.slots.find(slot => slot.kind === 'human' && slot.userId === this.lobby.myUserId) || null;
    },

    getActiveSlots() {
        return (this.lobby.slots || []).filter(slot => slot.kind === 'human' || slot.kind === 'ai');
    },

    setSlot(factionId, patch) {
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot) return null;
        Object.assign(slot, patch);
        return slot;
    },

    /**
     * 玩家坐到一个空槽位。如果之前已坐过别的槽位，先释放之前的。
     */
    takeSlot(factionId) {
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot || slot.kind !== 'open') return false;

        // 释放之前的槽位
        const previous = this.getMySlot();
        if (previous) {
            previous.kind = 'open';
            previous.userId = null;
            previous.playerName = '';
        }

        slot.kind = 'human';
        slot.userId = this.lobby.myUserId;
        slot.playerName = this.lobby.myName;
        return true;
    },

    leaveSlot() {
        const slot = this.getMySlot();
        if (!slot) return;
        slot.kind = 'open';
        slot.userId = null;
        slot.playerName = '';
    },

    /**
     * 房主操作：把一个空槽改为 AI。
     */
    addAiToSlot(factionId, difficulty = 'normal') {
        if (!this.isHost()) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot || slot.kind === 'human') return false;
        slot.kind = 'ai';
        slot.userId = null;
        slot.playerName = `AI · ${difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通'}`;
        slot.aiDifficulty = difficulty;
        return true;
    },

    fillOpenSlotsWithAi(difficulty = 'normal') {
        if (!this.isHost()) return 0;
        let filled = 0;
        (this.lobby.slots || []).forEach(slot => {
            if (slot.kind !== 'open') return;
            if (this.addAiToSlot(slot.factionId, difficulty)) filled += 1;
        });
        return filled;
    },

    setAiDifficulty(factionId, difficulty) {
        if (!this.isHost()) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot || slot.kind !== 'ai') return false;
        slot.aiDifficulty = difficulty;
        slot.playerName = `AI · ${difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通'}`;
        return true;
    },

    clearSlot(factionId) {
        if (!this.isHost()) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot) return false;
        slot.kind = 'open';
        slot.userId = null;
        slot.playerName = '';
        return true;
    },

    /**
     * 设定本地大厅（单机沙盒模式）。会重置 slots、把房主放到 USA 槽位上、其他默认空。
     */
    initLocalLobby() {
        // 在本地模式下重新生成稳定的本地 userId（避免重用 Firebase uid 等不可控的值），
        // 这样从联机模式回到单机时 USA 槽位的 userId 一定与本地 myUserId 匹配。
        const myUserId = `local-${Math.random().toString(36).slice(2, 10)}`;
        const myName = this.lobby.myName || '指挥官';
        this.lobby = {
            roomCode: 'LOCAL',
            mode: 'local',
            hostId: myUserId,
            myUserId,
            myName,
            ready: false,
            connecting: false,
            statusMessage: '',
            settings: this.lobby.settings || {
                maxPlayers: '8',
                mapScale: '标准',
                turnLimit: '180',
                victory: '统一',
                diplomacy: true,
                ai: true
            },
            slots: this.createDefaultSlots(),
            chat: [
                { author: '系统', text: '本地房间已创建，所有空席位将待机不行动。' }
            ]
        };
        // 玩家默认坐第一席（USA），其他全空
        const usa = this.lobby.slots[0];
        usa.kind = 'human';
        usa.userId = myUserId;
        usa.playerName = myName;
    },

    setMyIdentity({ userId, name }) {
        if (userId) this.lobby.myUserId = userId;
        if (name) this.lobby.myName = name;
        // 如果我已经坐在一个槽位上，更新显示名
        const slot = this.getMySlot();
        if (slot) slot.playerName = this.lobby.myName;
    },

    selectFaction(factionId) {
        this.selectedFactionId = factionId;

        const faction = this.getFaction(factionId);
        if (faction) {
            this.game.currentPlayerId = factionId;
            this.game.playerResources.money = faction.startingStats.money;
            this.game.playerResources.pp = Math.min(this.getEffectivePPCap(), faction.startingStats.pp);
        }

        this.notify();
    },

    /**
     * 基于 lobby.slots 计算行动顺序：所有 kind=human/ai 的槽位按 factions 数组顺序加入；空槽位被永久跳过。
     */
    computeTurnOrder() {
        const order = (this.lobby.slots || [])
            .filter(slot => slot.kind === 'human' || slot.kind === 'ai')
            .map(slot => slot.factionId);
        // 万一 slots 没设置好，退化到全部 8 国
        if (order.length === 0) return this.factions.map(faction => faction.id);
        return order;
    },

    isFactionPlayedByLocalUser(factionId) {
        if (!this.lobby || !this.lobby.slots) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        if (!slot) return false;
        return slot.kind === 'human' && slot.userId === this.lobby.myUserId;
    },

    isFactionAi(factionId) {
        if (!this.lobby || !this.lobby.slots) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        return slot && slot.kind === 'ai';
    },

    isFactionOpen(factionId) {
        if (!this.lobby || !this.lobby.slots) return false;
        const slot = this.lobby.slots.find(s => s.factionId === factionId);
        return slot && slot.kind === 'open';
    },

    getSlot(factionId) {
        if (!this.lobby || !this.lobby.slots) return null;
        return this.lobby.slots.find(s => s.factionId === factionId) || null;
    },

    /**
     * 我控制的势力 ID（本地玩家所占的 slot 上的国家）。如果没坐槽位，回退到 selectedFactionId。
     */
    getPlayerFactionId() {
        if (this.lobby && this.lobby.slots) {
            const slot = this.lobby.slots.find(s => s.kind === 'human' && s.userId === this.lobby.myUserId);
            if (slot) return slot.factionId;
        }
        return this.selectedFactionId || (this.game && this.game.currentPlayerId) || this.factions[0].id;
    },

    startGameSession() {
        const myFactionId = this.getPlayerFactionId();
        const turnOrder = this.computeTurnOrder();
        const firstFactionId = turnOrder[0] || myFactionId;
        const myFaction = this.getFaction(myFactionId);
        const firstFaction = this.getFaction(firstFactionId);
        this.selectedFactionId = myFactionId;

        this.game = {
            currentTurn: 1,
            currentPlayerId: firstFactionId,
            currentIdeology: myFaction.ideology || 'wartime_democracy',
            turnOrder,
            firstPlayerId: firstFactionId,
            timerRemaining: Number(this.lobby.settings.turnLimit) || 180,
            selectedNodeId: myFaction.capitalNodeId,
            hoveredNodeId: null,
            currentAction: null,
            actionCountThisTurn: 0,
            movementOrdersActive: false,
            moveDraftAmount: 1,
            battleDraftAmount: 1,
            recruitDraftAmount: 1,
            battlePreview: null,
            actionConfirm: null,
            showFocusModal: false,
            showDiplomacyModal: false,
            showGridView: false,
            activeLogTab: 'battle',
            completedFocuses: [],
            focusProgress: {},
            selectedFocusId: null,
            focusTreeViewport: { scale: 1 },
            modifiers: {
                actionBaseCost: {},
                recruitAmount: 0,
                maintenanceRateDelta: 0,
                ppIncome: 0,
                moneyIncome: 0,
                ppCapBonus: 0,
                recruitCostDelta: 0,
                freeTroops: 0,
                globalAttack: 0,
                globalDefense: 0,
                taggedDefense: {},
                taggedIncome: {},
                captureMoneyOnWin: 0,
                captureTroopsOnWin: 0,
                crisisPP: 0,
                industryCapBoosts: 0,
                damageOnCapture: 0,
                badges: []
            },
            nodeIndustryCaps: {},
            warBondsPenalty: 0,
            warBondsPenaltyTurns: 0,
            diplomacy: this.createDiplomacyState(myFaction.id),
            currentCapitals: this.factions.reduce((capitals, item) => {
                capitals[item.id] = item.capitalNodeId;
                return capitals;
            }, {}),
            eliminatedFactions: [],
            winner: null,
            gameOver: false,
            showEndGameModal: false,
            mapViewport: { x: 0, y: 0, width: 1000, height: 620 },
            playerResources: {
                money: myFaction.startingStats.money,
                pp: Math.min(this.ppCap, myFaction.startingStats.pp),
                nodes: 0,
                totalIndustry: 0,
                totalTroops: 0
            },
            lastCapitalNodeIds: {},
            logs: [
                { type: 'system', text: `你以 ${myFaction.name} 进入战场，本轮先手：${firstFaction.shortName}。` },
                { type: 'battle', text: '第 1 回合开始，所有部队进入待命状态。' }
            ]
        };

        this.game.selectedFocusId = this.getFocusTree(myFaction.id)[0]?.id || null;
        this.currentView = 'game-page';
        this.refreshFactionStatus(false);
        this.checkVictory(false);
        this.notify();
    },

    createDiplomacyState(playerFactionId) {
        return this.factions.reduce((relations, faction) => {
            if (faction.id !== playerFactionId) {
                relations[faction.id] = {
                    relation: faction.id === 'CSA' || faction.id === 'AUS' ? '战争' : '中立',
                    treaty: faction.id === 'NEN' ? '边境观察' : '无'
                };
            }
            return relations;
        }, {});
    },

    setHoveredNode(nodeId, shouldNotify = false) {
        if (this.game.hoveredNodeId === nodeId) return;
        this.game.hoveredNodeId = nodeId;
        if (shouldNotify) this.notify();
    },

    setSelectedFocus(focusId, shouldNotify = true) {
        if (!this.getFocusById(focusId)) return;
        this.game.selectedFocusId = focusId;
        if (shouldNotify) this.notify();
    },

    setSelectedNode(nodeId) {
        this.game.selectedNodeId = nodeId;
        if (!(this.game.movementOrdersActive && this.game.currentAction === 'move')) {
            this.game.currentAction = null;
        }
        this.game.battlePreview = null;
        this.game.actionConfirm = null;
        this.notify();
    },

    setCurrentAction(action) {
        this.game.currentAction = action;
        this.game.actionConfirm = null;
        this.game.battlePreview = null;
        this.notify();
    },

    openActionConfirm(action, nodeId = this.game.selectedNodeId) {
        this.game.actionConfirm = { action, nodeId };
        this.game.battlePreview = null;
        this.notify();
    },

    setBattlePreview(preview) {
        this.game.battlePreview = preview;
        this.game.actionConfirm = null;
        this.notify();
    },

    closeModals() {
        this.game.battlePreview = null;
        this.game.actionConfirm = null;
        this.game.showFocusModal = false;
        this.game.showDiplomacyModal = false;
        this.notify();
    },

    toggleFocusModal(forceValue) {
        this.game.showFocusModal = typeof forceValue === 'boolean' ? forceValue : !this.game.showFocusModal;
        this.game.actionConfirm = null;
        this.game.battlePreview = null;
        this.notify();
    },

    toggleDiplomacyModal(forceValue) {
        this.game.showDiplomacyModal = typeof forceValue === 'boolean' ? forceValue : !this.game.showDiplomacyModal;
        this.game.actionConfirm = null;
        this.game.battlePreview = null;
        this.notify();
    },

    toggleGridView() {
        this.game.showGridView = !this.game.showGridView;
        this.game.currentAction = null;
        this.notify();
    },

    setLogTab(tab) {
        this.game.activeLogTab = tab;
        this.notify();
    },

    addLog(text, type = 'system', shouldNotify = true) {
        this.game.logs.unshift({ type, text });
        if (shouldNotify) this.notify();
    }
};
