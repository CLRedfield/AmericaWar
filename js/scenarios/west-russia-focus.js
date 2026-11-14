/**
 * Compile the West Russia scenario's political routes and faction projects into
 * the same focus objects used by the American campaign.
 */
const buildWestRussiaFocus = (() => {
    const effect = (type, amount, extra = {}) => ({ type, amount, ...extra });
    const grant = (type, amount) => [effect(type, amount)];
    const develop = () => [{ type: 'allIndustry', amount: 1, maxNodes: 2 }];

    // Each administration emphasizes different parts of the existing economy and combat rules.
    const doctrines = {
        civic: [effect('pp', 3), effect('crisisPP', 3), effect('ppCapBonus', 6), effect('ppIncome', 0.9)],
        council: [effect('pp', 3), effect('recruitAmount', 1), effect('freeTroops', 3), effect('ppIncome', 0.7)],
        staff: [effect('capitalTroops', 3), effect('globalAttack', 0.06), effect('allTroops', 1), effect('globalAttack', 0.08)],
        defence: [effect('capitalTroops', 3), effect('globalDefense', 0.06), effect('freeTroops', 2), effect('globalDefense', 0.08)],
        industry: [effect('money', 10), effect('capitalIndustry', 1), effect('moneyIncome', 1.2), effect('moneyIncome', 1.6)],
        supply: [effect('money', 9), effect('maintenanceRate', -0.045), effect('freeTroops', 3), effect('maintenanceRate', -0.05)],
        trade: [effect('money', 11), effect('captureMoney', 3), effect('moneyIncome', 1.2), effect('moneyIncome', 1.5)],
        levy: [effect('capitalTroops', 3), effect('recruitAmount', 2), effect('freeTroops', 3), effect('captureTroops', 1)],
        relief: [effect('pp', 4), effect('crisisPP', 3), effect('money', 12), effect('maintenanceRate', -0.05)]
    };

    // Distinct architectural motifs per faction route so each political path has
    // its own topological silhouette (dome, pyramid, wedge, cross, scepter, obelisk, derrick, fan).
    const routeMotifs = {
        WRF: { zhukov: 'dome', cadres: 'pyramid', continuity: 'obelisk', tukhachevsky: 'wedge' },
        KOM: { left: 'derrick', research: 'scepter', centre: 'dome', right: 'fan' },
        VYA: { kadets: 'dome', shulgin: 'obelisk', solidarists: 'cross', rovs: 'wedge' },
        SAM: { zykov: 'dome', steel: 'pyramid', officers: 'obelisk', oktan: 'derrick' },
        PRM: { vagner: 'obelisk', velimir: 'scepter', workers: 'dome', engineers: 'wedge' },
        ONE: { treaty: 'derrick', autonomy: 'dome', patrol: 'wedge', harbor: 'pyramid' },
        GOR: { workers: 'derrick', armor: 'wedge', river: 'fan', veterans: 'obelisk' },
        VOL: { municipal: 'dome', schools: 'scepter', coops: 'pyramid', neutrality: 'derrick' },
        GEO: { parishes: 'cross', law: 'cross', forestry: 'pyramid', order: 'wedge' },
        TAT: { union: 'derrick', assembly: 'dome', federation: 'pyramid', guard: 'wedge' },
        BSH: { oil: 'derrick', home: 'dome', farm: 'scepter', mountains: 'pyramid' }
    };

    function politicalChapter(profile, route, plans, rootRoutes) {
        const plan = plans[route.id] || {};
        const motif = routeMotifs[profile.faction.id]?.[route.id] || 'dome';
        const nodes = [];
        const center = route.policies.length;
        const key = suffix => route.id + '_' + suffix;
        const add = (suffix, name, lane, description, effects, requires, extra = {}) => {
            nodes.push({ key: key(suffix), name, lane, description, effects, requires, motif, ...extra });
        };
        const commit = key('commit');
        const hearing = key('hearing');
        const mandate = key('mandate');
        const congress = key('congress');
        const wartime = key('wartime');
        const competing = plan.parent
            ? [plan.parent + '_wartime']
            : rootRoutes.filter(other => other !== route.id).map(other => other + '_commit');
        // Political choices only follow political choices. Workshop, army and
        // territorial projects remain optional work in their own branches.
        const entrance = plan.parent ? [plan.parent + '_congress'] : ['assembly'];
        // Preserve 'either' (OR) chambers so minimal step-counts never increase;
        // otherwise sculpt the chamber to match the route's architectural motif.
        const chamber = (!plan.chamber || plan.chamber === 'either')
            ? plan.chamber
            : (motif === 'scepter' || motif === 'cross')
                ? (plan.chamber === 'command' ? 'command' : 'caucus')
                : (motif === 'dome' || motif === 'pyramid' || motif === 'derrick')
                    ? 'joint'
                    : plan.chamber;
        add('commit', route.title, center, route.platform, [doctrines[route.policies[0].doctrine][0], effect('pp', 3)], entrance,
            { steps: 2, excludes: competing, story: route.story });

        add('hearing', route.hearing, center - 1, '', [effect('ppCapBonus', 5), effect('pp', 4)],
            [chamber === 'command' ? mandate : commit], { steps: 2 });
        add('mandate', route.mandate, center + 1, '', [effect('money', 10), effect('capitalTroops', 2)],
            [chamber === 'caucus' ? hearing : commit], { steps: 2 });

        const required = { joint: [hearing, mandate], command: [hearing], caucus: [mandate] }[chamber] || [];
        add('congress', route.congress, center, '确定政府领导。', [effect('pp', 5), effect('ppIncome', 0.7), effect('moneyIncome', 0.9)], required,
            { steps: 3, any: required.length ? undefined : [[hearing], [mandate]] });
        add('wartime', route.wartime, center, '确立执政方针。', [doctrines[route.policies[0].doctrine][1], effect('pp', 5), effect('money', 8)],
            [congress], { steps: 3 });

        const lateChoice = plan.cabinet === 'coalition';
        const parallelWork = ['dome', 'pyramid', 'cross', 'scepter', 'derrick'].includes(motif);
        const settlements = route.policies.map((policy, arm) => {
            const outcome = typeof WestRussiaEndings !== 'undefined'
                ? WestRussiaEndings.get(profile.faction.id, route.id, arm) : null;
            const lane = arm * 2 + 1;
            const suffix = part => arm + '_' + part;
            const armKey = part => key(suffix(part));
            const reward = doctrines[policy.doctrine];
            const eligibility = [wartime];
            const rivals = route.policies.map((_, index) => index).filter(index => index !== arm);
            add(suffix('choice'), policy.title, lane, policy.platform, [reward[0], effect('pp', 3)], eligibility,
                { excludes: lateChoice ? [] : rivals.map(index => key(index + '_choice')), steps: 2,
                    routeOutcome: outcome, routeDecision: true });
            add(suffix('measure'), policy.measure, lane, '',
                [reward[1], effect('money', 6)], [armKey('choice')], { steps: 2 });
            add(suffix('project'), policy.project, parallelWork ? lane + 1 : lane,
                '', [reward[2], effect('pp', 4), effect('money', 8)],
                [armKey(parallelWork ? 'choice' : 'measure')], { steps: 3 });
            const charterParents = [armKey('project'), ...(parallelWork ? [armKey('measure')] : [])];
            add(suffix('charter'), policy.title + '施政纲领', lane, '',
                [effect('ppCapBonus', 6), effect('freeTroops', 2), effect('money', 10), effect('pp', 5)], charterParents, { steps: 3 });
            add(suffix('settlement'), policy.stateName, lane, '确立政体，获得本路线效果。',
                [
                    ...(!outcome ? [reward[3]] : []),
                    { type: 'ideology', id: policy.ideology, name: policy.stateName, shortName: policy.shortName },
                    ...(outcome ? [{ type: 'routeSettlement', id: outcome.id }] : [])
                ],
                [armKey('charter')], {
                    steps: 4,
                    excludes: lateChoice ? rivals.map(index => key(index + '_settlement')) : [],
                    story: { title: outcome ? outcome.title : policy.endingTitle,
                        text: policy.ending },
                    routeOutcome: outcome
                });
            return armKey('settlement');
        });

        const rulebook = key('rulebook');
        const integration = key('integration');
        const reserves = key('reserves');
        add('rulebook', route.outlook, center, '', [effect('capitalIndustry', 1), effect('moneyIncome', 1.2), effect('pp', 3)], [],
            { steps: 2, any: settlements.map(id => [id]) });
        add('integration', '地方接管法令', center - 1, '恢复地方工业。',
            [{ type: 'allIndustry', amount: 1, maxNodes: 3 }, effect('money', 8)], [rulebook, plan.integration].filter(Boolean),
            { steps: 3, precompensated: true, category: 'industry', motif: null });
        add('reserves', '战后常备名册', center + 1, '扩充常备部队。',
            [effect('allTroops', 1), effect('freeTroops', 2)], [rulebook, plan.reserves].filter(Boolean),
            { steps: 3, precompensated: true, category: 'military', motif: null });
        add('final', route.outlook + '总章程', center, '', [effect('ppIncome', 0.9), effect('capitalTroops', 3), effect('pp', 5)], [rulebook], { steps: 3 });
        add('successors', route.title + '的下一任代表', center, '',
            [effect('moneyIncome', 1.6), effect('freeTroops', 3), effect('money', 14), effect('capitalTroops', 2)], [key('final')], { steps: 4 });

        return { title: route.title, category: 'politics', nodes };
    }

    // Consolidate fragmented non-political sub-chapters into 4 cohesive American-style
    // national department trees (Industry, Military, Civil/Diplomacy, Strategic Integration)
    // so upstream and downstream focuses connect directly via short vertical lines.
    const departmentPlans = {
        WRF: [
            { title: '白海船坞与乌赫塔工业', chapters: [0, 2], opening: ['repair'] },
            { title: '普列谢茨克军务与北德维纳军运', chapters: [1, 3, 4], opening: ['roster', 'frontier'] },
            { title: '军属安置与后方苏维埃', chapters: [5, 6] },
            { title: '西俄光复与伏尔加攻势', chapters: [7, 8] }
        ],
        KOM: [
            { title: '维切格达林业、电网与劳资', chapters: [1, 2, 4], opening: ['repair'] },
            { title: '共和国防卫与双语航运', chapters: [3, 6], opening: ['roster', 'frontier'] },
            { title: '公开选举与公民保障', chapters: [0, 5] },
            { title: '北境统合与二届议会', chapters: [7, 8] }
        ],
        VYA: [
            { title: '王室财政、兵工与矿冶', chapters: [0, 1, 6], opening: ['repair'] },
            { title: '白卫近卫与乌德穆尔特军铁', chapters: [2, 7], opening: ['roster', 'frontier'] },
            { title: '巡回法庭、粮税与使团', chapters: [3, 4, 5] },
            { title: '王国接管与东线反攻', chapters: [8, 9] }
        ],
        SAM: [
            { title: '伏尔加动力与财政承包', chapters: [1, 4], opening: ['repair'] },
            { title: '解放军整编与油铁渡口', chapters: [2, 3, 6], opening: ['roster', 'frontier'] },
            { title: '军民善后与民事许可', chapters: [0, 5, 7] },
            { title: '战区接收与渡江战役', chapters: [8, 9] }
        ],
        PRM: [
            { title: '卡马电网、矿冶与工业议定', chapters: [1, 2, 8], opening: ['repair'] },
            { title: '要道守备与山口河港', chapters: [3, 6], opening: ['roster', 'frontier'] },
            { title: '双权名册与工友互助', chapters: [0, 4] },
            { title: '民事法院、复产与上游统合', chapters: [5, 7, 9] }
        ],
        ONE: [
            { title: '白海港务、冰路与跨海补给', chapters: [2, 6, 9], opening: ['repair'] },
            { title: '冰湾预警、三镇防线与机动勤务', chapters: [1, 3, 4], opening: ['roster', 'frontier'] },
            { title: '芬兰供给、粮票学校与三镇议事', chapters: [0, 5, 7] },
            { title: '白海缓冲与海岸反攻', chapters: [8, 10] }
        ],
        GOR: [
            { title: '汽车厂复产、军工与技校', chapters: [0, 3, 6], opening: ['repair'] },
            { title: '伏尔加江防、道路与桥梁步兵', chapters: [2, 4, 8], opening: ['roster', 'frontier'] },
            { title: '老兵安置与伏尔加工厂带', chapters: [5, 7] },
            { title: '装甲战备与干线总攻', chapters: [1, 9] }
        ],
        VOL: [
            { title: '切列波韦茨工坊、合作社与铁道', chapters: [1, 2, 5], opening: ['repair', 'frontier'] },
            { title: '铁路卫戍与地方预算', chapters: [6, 7], opening: ['roster'] },
            { title: '通行公约、医护与北方教员', chapters: [0, 3, 4] },
            { title: '邻镇接纳与跨境救援走廊', chapters: [8, 9] }
        ],
        GEO: [
            { title: '上卡马林木、粮库与船运', chapters: [2, 4, 5], opening: ['repair', 'frontier'] },
            { title: '山口护卫与前线补给', chapters: [1, 7], opening: ['roster'] },
            { title: '堂区救济、民法与夜间通信', chapters: [0, 3, 6] },
            { title: '上卡马接收与彼尔姆进军', chapters: [8, 9] }
        ],
        TAT: [
            { title: '努尔拉特油田、造船与两岸能源', chapters: [1, 6, 9], opening: ['repair'] },
            { title: '喀山江防、航运与西线粮运', chapters: [2, 3, 7], opening: ['roster', 'frontier'] },
            { title: '多语市民与港工工会', chapters: [0, 4] },
            { title: '地方协约与两岸代表权', chapters: [5, 8] }
        ],
        BSH: [
            { title: '乌法油田、铁矿与农社财政', chapters: [0, 2, 3, 5], opening: ['repair'] },
            { title: '山口联防、河道与守备编制', chapters: [1, 4, 7], opening: ['roster', 'frontier'] },
            { title: '山地医护与边境采购互认', chapters: [6, 9] },
            { title: '南部接管与山口出击', chapters: [8, 10] }
        ]
    };

    function resolveDepartmentBranches(factionId) {
        const plan = departmentPlans[factionId] || [];
        const byChapter = new Map();
        const byOpening = new Map();
        const deptByBranch = new Map();
        plan.forEach((dept, deptIndex) => {
            deptByBranch.set(dept.title, deptIndex);
            for (const idx of dept.chapters) byChapter.set(idx, dept.title);
            for (const key of dept.opening || []) byOpening.set(key, dept.title);
        });
        return { byChapter, byOpening, deptByBranch };
    }

    function openingChapter(profile, design, byOpening) {
        const [opening, repair, roster, assembly, frontier] = profile.opening;
        const firstIndustry = byOpening.get('repair') || design.chapters.find(section => section.category === 'industry')?.title || '经济恢复';
        const rosterBranch = byOpening.get('roster') || design.chapters.find(section => section.category === 'military')?.title || '军事整备';
        const frontierBranch = byOpening.get('frontier') || rosterBranch;
        return {
            title: design.council.title,
            category: 'politics',
            nodes: [
                { key: 'report', name: opening, lane: 1, description: profile.faction.description,
                    effects: [effect('pp', 3), effect('money', 6)], steps: 1 },
                { key: 'repair', name: repair, lane: 0, description: '集中首都的修造人员，恢复第一批产能。',
                    effects: [effect('capitalIndustry', 1), effect('money', 4)], requires: ['report'], steps: 1, branch: firstIndustry, category: 'industry' },
                { key: 'roster', name: roster, lane: 2, description: '登记还能立即归队的人员与装备。',
                    effects: grant('capitalTroops', 3), requires: ['report'], steps: 1, branch: rosterBranch, category: 'military' },
                { key: 'assembly', name: assembly, lane: 1, description: '选择国家的政治方向。',
                    effects: [effect('pp', 5), effect('ppCapBonus', 5)], requires: ['report'], steps: 2 },
                { key: 'frontier', name: frontier, lane: 3, description: '检查路障、通讯与民用撤离路线。',
                    effects: [{ type: 'taggedDefense', amount: 0.05, tag: design.frontier }, effect('freeTroops', 1)], requires: ['report'], steps: 1, branch: frontierBranch, category: 'military' }
            ]
        };
    }

    function computeFocusSteps(node, hasChildren) {
        if (node.category === 'politics') return node.steps || 2;
        if (node.steps === 1) return 1;
        if (node.steps === 4) return 4;
        if (node.steps === 3 && !node.precompensated) return !hasChildren ? 4 : 3;
        if (node.precompensated) return node.steps || 3;
        const multiParent = Boolean(node.any?.length) || (node.requires || []).length >= 2;
        if (!hasChildren && multiParent && (node.war || (node.effects || []).length >= 2)) return 4;
        const heavyEffect = (node.effects || []).some(item => (
            item.type === 'actionCost' || item.type === 'allIndustry' || item.type === 'industryCapBonus' || item.type === 'allTroops'
        ));
        if (node.control?.length || node.war || multiParent || heavyEffect) return 3;
        return 2;
    }

    function compensateStepEffects(node, steps) {
        const base = (node.effects || []).map(item => ({ ...item }));
        if (node.category === 'politics' || node.precompensated || steps <= 2) return base;
        if (steps === 3) {
            if (node.category === 'military') return [...base, effect('freeTroops', 1), effect('money', 4)];
            if (node.category === 'civil') return [...base, effect('pp', 3), effect('money', 4)];
            return [...base, effect('money', 6), effect('pp', 2)];
        }
        if (node.category === 'military') return [...base, effect('capitalTroops', 2), effect('freeTroops', 2), effect('pp', 3)];
        if (node.category === 'civil') return [...base, effect('pp', 5), effect('money', 8), effect('ppCapBonus', 4)];
        return [...base, effect('money', 10), effect('pp', 3), effect('moneyIncome', 0.5)];
    }

    return function buildFocusTree(profile, design) {
        if (typeof WestRussiaSecrets !== 'undefined') design = WestRussiaSecrets.extend(profile, design);
        const { byChapter, byOpening, deptByBranch } = resolveDepartmentBranches(profile.faction.id);
        const mappedChapters = design.chapters.map((chapter, index) => ({
            ...chapter,
            title: byChapter.get(index) || chapter.title
        }));
        const rootRoutes = profile.routes.filter(route => !design.routes[route.id]?.parent).map(route => route.id);
        const political = profile.routes.map(route => politicalChapter(profile, route, design.routes, rootRoutes));
        const sections = [openingChapter(profile, design, byOpening), mappedChapters[0], ...political, ...mappedChapters.slice(1)];
        const prefix = 'wr_' + profile.faction.id.toLowerCase() + '_';
        const id = key => prefix + key;
        const drafts = new Map();
        let column = 0;
        for (const section of sections) {
            for (const node of section.nodes) {
                if (drafts.has(node.key)) throw new Error(prefix + 'duplicate focus ' + node.key);
                drafts.set(node.key, { ...node, branch: node.branch || section.title, category: node.category || section.category, x: column + node.lane });
            }
            column += Math.max(...section.nodes.map(node => node.lane)) + 2;
        }
        const parentKeys = new Set();
        for (const node of drafts.values()) {
            for (const req of node.requires || []) parentKeys.add(req);
            for (const group of node.any || []) for (const req of group) parentKeys.add(req);
        }

        const built = new Map();
        const visiting = new Set();
        const occupied = new Set();
        function compile(key) {
            if (built.has(key)) return built.get(key);
            const node = drafts.get(key);
            if (!node || visiting.has(key)) throw new Error(prefix + 'invalid focus dependency ' + key);
            visiting.add(key);
            const required = (node.requires || []).map(compile);
            const anyGroups = (node.any || []).map(group => group.map(compile));
            const parents = [...required, ...anyGroups.flat()];
            let y = parents.reduce((row, parent) => Math.max(row, parent.y + 1), 0);
            while (occupied.has(node.x + ',' + y)) y++;
            occupied.add(node.x + ',' + y);

            const steps = computeFocusSteps(node, parentKeys.has(key));
            const focus = {
                id: id(key), name: node.name, branch: node.branch, category: node.category, x: node.x, y,
                cost: steps * 2, description: node.description, effects: compensateStepEffects(node, steps), prerequisites: required.map(parent => parent.id),
                progressRequired: steps
            };
            if (anyGroups.length) focus.prerequisiteAny = anyGroups.map(group => group.map(parent => parent.id));
            const plainPolitics = node.category === 'politics';
            if (node.control && !plainPolitics) focus.requiredControl = node.control.map(code => 'WR_' + code);
            if (!plainPolitics && (node.war || required.some(parent => parent.wartime)
                || (anyGroups.length && anyGroups.every(group => group.some(parent => parent.wartime))))) focus.wartime = true;
            if (node.story) focus.story = node.story;
            if (node.routeOutcome) focus.routeOutcome = node.routeOutcome;
            if (node.routeDecision) focus.routeDecision = true;
            if (node.notBeforeTurn != null && !plainPolitics) focus.notBeforeTurn = node.notBeforeTurn;
            if (node.secretReveal) focus.secretReveal = node.secretReveal;
            if (node.motif && plainPolitics) focus.motif = node.motif;
            if (deptByBranch.has(focus.branch)) focus.deptIndex = deptByBranch.get(focus.branch);
            built.set(key, focus);
            visiting.delete(key);
            return focus;
        }

        const tree = Array.from(drafts.keys(), compile);
        for (const [key, node] of drafts) {
            for (const other of node.excludes || []) {
                if (!built.has(other)) throw new Error(prefix + 'unknown exclusive focus ' + other);
                for (const [from, to] of [[key, other], [other, key]]) {
                    const focus = built.get(from);
                    if (!focus.mutuallyExclusive) focus.mutuallyExclusive = [];
                    if (!focus.mutuallyExclusive.includes(id(to))) focus.mutuallyExclusive.push(id(to));
                }
            }
        }
        return tree;
    };
})();
