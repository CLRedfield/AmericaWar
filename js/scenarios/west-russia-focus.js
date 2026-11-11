/**
 * Compile the West Russia scenario's political routes and faction projects into
 * the same focus objects used by the American campaign.
 */
const buildWestRussiaFocus = (() => {
    const effect = (type, amount) => ({ type, amount });
    const grant = (type, amount) => [effect(type, amount)];
    const develop = () => [{ type: 'allIndustry', amount: 1, maxNodes: 2 }];

    // Each administration emphasizes different parts of the existing economy and combat rules.
    const doctrines = {
        civic: [effect('pp', 2), effect('crisisPP', 2), effect('ppCapBonus', 4), effect('ppIncome', 0.6)],
        council: [effect('pp', 2), effect('recruitAmount', 1), effect('freeTroops', 1), effect('ppIncome', 0.4)],
        staff: [effect('capitalTroops', 2), effect('globalAttack', 0.04), effect('allTroops', 1), effect('globalAttack', 0.05)],
        defence: [effect('capitalTroops', 2), effect('globalDefense', 0.04), effect('crisisPP', 1), effect('globalDefense', 0.05)],
        industry: [effect('money', 6), effect('capitalIndustry', 1), effect('moneyIncome', 0.5), effect('moneyIncome', 1)],
        supply: [effect('money', 5), effect('maintenanceRate', -0.03), effect('freeTroops', 1), effect('maintenanceRate', -0.04)],
        trade: [effect('money', 7), effect('captureMoney', 2), effect('ppCapBonus', 3), effect('moneyIncome', 0.9)],
        levy: [effect('capitalTroops', 2), effect('recruitAmount', 1), effect('maintenanceRate', 0.02), effect('captureTroops', 1)],
        relief: [effect('pp', 3), effect('crisisPP', 2), effect('money', 8), effect('maintenanceRate', -0.035)]
    };

    function politicalChapter(profile, route, plans, rootRoutes) {
        const plan = plans[route.id] || {};
        const nodes = [];
        const center = route.policies.length;
        const key = suffix => route.id + '_' + suffix;
        const add = (suffix, name, lane, description, effects, requires, extra = {}) => {
            nodes.push({ key: key(suffix), name, lane, description, effects, requires, ...extra });
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
        add('commit', route.title, center, route.platform, [doctrines[route.policies[0].doctrine][0]], entrance,
            { steps: 1, excludes: competing, story: route.story });

        add('hearing', route.hearing, center - 1, '', grant('ppCapBonus', 3),
            [plan.chamber === 'command' ? mandate : commit]);
        add('mandate', route.mandate, center + 1, '', grant('money', 6),
            [plan.chamber === 'caucus' ? hearing : commit]);

        const required = { joint: [hearing, mandate], command: [hearing], caucus: [mandate] }[plan.chamber] || [];
        add('congress', route.congress, center, '确定政府领导。', grant('ppIncome', 0.3), required,
            { any: required.length ? undefined : [[hearing], [mandate]] });
        add('wartime', route.wartime, center, '确立执政方针。', [doctrines[route.policies[0].doctrine][1]],
            [congress]);

        const lateChoice = plan.cabinet === 'coalition';
        const parallelWork = plan.cabinet === 'parallel';
        const settlements = route.policies.map((policy, arm) => {
            const outcome = typeof WestRussiaEndings !== 'undefined'
                ? WestRussiaEndings.get(profile.faction.id, route.id, arm) : null;
            const lane = arm * 2 + 1;
            const suffix = part => arm + '_' + part;
            const armKey = part => key(suffix(part));
            const reward = doctrines[policy.doctrine];
            const eligibility = [wartime];
            const rivals = route.policies.map((_, index) => index).filter(index => index !== arm);
            add(suffix('choice'), policy.title, lane, policy.platform, [reward[0]], eligibility,
                { excludes: lateChoice ? [] : rivals.map(index => key(index + '_choice')), steps: 1,
                    routeOutcome: outcome, routeDecision: true });
            add(suffix('measure'), policy.measure, lane, '',
                [reward[1]], [armKey('choice')]);
            add(suffix('project'), policy.project, parallelWork ? lane + 1 : lane,
                '', [reward[2]],
                [armKey(parallelWork ? 'choice' : 'measure')]);
            const charterParents = [armKey('project'), ...(parallelWork ? [armKey('measure')] : [])];
            add(suffix('charter'), policy.title + '施政纲领', lane, '',
                grant('ppCapBonus', 4), charterParents);
            add(suffix('settlement'), policy.stateName, lane, '确立政体，获得本路线效果。',
                [
                    ...(!outcome ? [reward[3]] : []),
                    { type: 'ideology', id: policy.ideology, name: policy.stateName, shortName: policy.shortName },
                    ...(outcome ? [{ type: 'routeSettlement', id: outcome.id }] : [])
                ],
                [armKey('charter')], {
                    steps: 1,
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
        add('rulebook', route.outlook, center, '', grant('moneyIncome', 0.6), [],
            { any: settlements.map(id => [id]) });
        add('integration', '地方接管法令', center - 1, '恢复地方工业。',
            develop(), [rulebook, plan.integration].filter(Boolean), { branch: '经济恢复', category: 'industry' });
        add('reserves', '战后常备名册', center + 1, '扩充常备部队。',
            grant('allTroops', 1), [rulebook, plan.reserves].filter(Boolean), { branch: '军事整备', category: 'military' });
        add('final', route.outlook + '总章程', center, '', grant('ppIncome', 0.55), [rulebook]);
        add('successors', route.title + '的下一任代表', center, '',
            grant('moneyIncome', 0.75), [key('final')]);

        return { title: route.title, category: 'politics', nodes };
    }

    function openingChapter(profile, design) {
        const [opening, repair, roster, assembly, frontier] = profile.opening;
        // Opening projects belong with the work they start. Keeping them in
        // the same chapter as late political follow-ups made the old chapter
        // boxes stretch across the entire tree and interleave with every route.
        const firstIndustry = design.chapters.find(section => section.category === 'industry')?.title || '经济恢复';
        const firstMilitary = design.chapters.find(section => section.category === 'military')?.title || '军事整备';
        return {
            title: design.council.title,
            category: 'politics',
            nodes: [
                { key: 'report', name: opening, lane: 1, description: profile.faction.description,
                    effects: grant('pp', 1), steps: 1 },
                { key: 'repair', name: repair, lane: 0, description: '集中首都的修造人员，恢复第一批产能。',
                    effects: grant('capitalIndustry', 1), requires: ['report'], steps: 1, branch: firstIndustry, category: 'industry' },
                { key: 'roster', name: roster, lane: 2, description: '登记还能立即归队的人员与装备。',
                    effects: grant('capitalTroops', 2), requires: ['report'], steps: 1, branch: firstMilitary, category: 'military' },
                { key: 'assembly', name: assembly, lane: 1, description: '选择国家的政治方向。',
                    effects: grant('pp', 2), requires: ['report'], steps: 1 },
                { key: 'frontier', name: frontier, lane: 3, description: '检查路障、通讯与民用撤离路线。',
                    effects: [{ type: 'taggedDefense', amount: 0.04, tag: design.frontier }], requires: ['report'], steps: 1, branch: firstMilitary, category: 'military' }
            ]
        };
    }

    return function buildFocusTree(profile, design) {
        if (typeof WestRussiaSecrets !== 'undefined') design = WestRussiaSecrets.extend(profile, design);
        const rootRoutes = profile.routes.filter(route => !design.routes[route.id]?.parent).map(route => route.id);
        const political = profile.routes.map(route => politicalChapter(profile, route, design.routes, rootRoutes));
        const sections = [openingChapter(profile, design), design.chapters[0], ...political, ...design.chapters.slice(1)];
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

            const focus = {
                id: id(key), name: node.name, branch: node.branch, category: node.category, x: node.x, y,
                cost: 4, description: node.description, effects: node.effects, prerequisites: required.map(parent => parent.id),
                progressRequired: node.category === 'politics' ? 1 : node.steps || 2
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
