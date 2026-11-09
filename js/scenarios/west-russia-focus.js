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

    function politicalChapter(route, plans, rootRoutes) {
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
        const entrance = plan.entry || (plan.parent ? [plan.parent + '_congress'] : ['assembly']);
        add('commit', route.title, center, route.platform, [doctrines[route.policies[0].doctrine][0]], entrance,
            { steps: 1, any: plan.entryAny, excludes: competing, story: route.story });

        add('hearing', route.hearing, center - 1, '请代表就「' + route.title + '」的施政提案提出条件。', grant('ppCapBonus', 3),
            [plan.chamber === 'command' ? mandate : commit]);
        add('mandate', route.mandate, center + 1, '为过渡机构确定经费、责任和执勤人员。', grant('money', 6),
            [plan.chamber === 'caucus' ? hearing : commit]);

        const required = { joint: [hearing, mandate], command: [hearing], caucus: [mandate] }[plan.chamber] || [];
        add('congress', route.congress, center, '把「' + route.title + '」的授权写入政府议程。', grant('ppIncome', 0.3), required,
            { any: required.length ? undefined : [[hearing], [mandate]] });
        add('wartime', route.wartime, center, '按新政府的授权拟定战时行动纲领。', [doctrines[route.policies[0].doctrine][1]],
            [congress], { war: true });

        const lateChoice = plan.cabinet === 'coalition';
        const parallelWork = plan.cabinet === 'parallel';
        const settlements = route.policies.map((policy, arm) => {
            const lane = arm * 2 + 1;
            const suffix = part => arm + '_' + part;
            const armKey = part => key(suffix(part));
            const reward = doctrines[policy.doctrine];
            const eligibility = [wartime, plan.eligibility?.[arm]].filter(Boolean);
            const rivals = route.policies.map((_, index) => index).filter(index => index !== arm);
            add(suffix('choice'), policy.title, lane, policy.platform, [reward[0]], eligibility,
                { excludes: lateChoice ? [] : rivals.map(index => key(index + '_choice')), steps: 1 });
            add(suffix('measure'), policy.measure, lane, '通过「' + policy.measure + '」，确立这条路线的常设制度。',
                [reward[1]], [armKey('choice')]);
            add(suffix('project'), policy.project, parallelWork ? lane + 1 : lane,
                '用「' + policy.project + '」检验新制度在战时的运转。', [reward[2]],
                [armKey(parallelWork ? 'choice' : 'measure')]);
            const charterParents = [armKey('project'), ...(parallelWork ? [armKey('measure')] : [])];
            add(suffix('charter'), policy.title + '施政纲领', lane, '公布执行细则和各地代表的权限。',
                grant('ppCapBonus', 4), charterParents);
            add(suffix('settlement'), policy.stateName, lane, '以新国号组织下一阶段治理。',
                [reward[3], { type: 'ideology', id: policy.ideology, name: policy.stateName, shortName: policy.shortName }],
                [armKey('charter')], {
                    steps: 3,
                    excludes: lateChoice ? rivals.map(index => key(index + '_settlement')) : [],
                    story: { title: policy.endingTitle, text: policy.ending }
                });
            return armKey('settlement');
        });

        const rulebook = key('rulebook');
        const integration = key('integration');
        const reserves = key('reserves');
        add('rulebook', route.outlook, center, '明确中央机构、地方政府和战区的长期权限。', grant('moneyIncome', 0.6), [],
            { any: settlements.map(id => [id]) });
        add('integration', '地方接管法令', center - 1, '用已有的民政机构接管新地区，先恢复公共服务和产能。',
            develop(), [rulebook, plan.integration].filter(Boolean));
        add('reserves', '战后常备名册', center + 1, '将具备稳定补给的预备队转为常备部队。',
            grant('allTroops', 1), [rulebook, plan.reserves].filter(Boolean));
        add('final', route.outlook + '总章程', center, '让新制度在停战后仍能履行预算和战区承诺。', grant('ppIncome', 0.55),
            plan.final === 'joint' ? [integration, reserves] : [],
            { any: plan.final === 'joint' ? undefined : [[integration], [reserves]], steps: 3 });
        add('successors', route.title + '的下一任代表', center, '移交行政权限并公开核验尚未完成的拨款。',
            grant('moneyIncome', 0.75), [key('final')], { steps: 3 });

        return { title: route.title, category: 'politics', nodes };
    }

    function openingChapter(profile, design) {
        const [opening, repair, roster, assembly, frontier] = profile.opening;
        return {
            title: design.council.title,
            category: 'politics',
            nodes: [
                { key: 'report', name: opening, lane: 1, description: profile.faction.description,
                    effects: grant('pp', 1), steps: 1 },
                { key: 'repair', name: repair, lane: 0, description: '集中首都的修造人员，恢复第一批产能。',
                    effects: grant('capitalIndustry', 1), requires: ['report'], steps: 1 },
                { key: 'roster', name: roster, lane: 2, description: '登记还能立即归队的人员与装备。',
                    effects: grant('capitalTroops', 2), requires: ['report'], steps: 1 },
                { key: 'assembly', name: assembly, lane: 1, description: design.council.description,
                    effects: grant('pp', 2), requires: design.council.requires, any: design.council.any, steps: 1 },
                { key: 'frontier', name: frontier, lane: 3, description: '检查路障、通讯与民用撤离路线。',
                    effects: [{ type: 'taggedDefense', amount: 0.04, tag: design.frontier }], requires: ['report'], steps: 1 }
            ]
        };
    }

    return function buildFocusTree(profile, design) {
        const rootRoutes = profile.routes.filter(route => !design.routes[route.id]?.parent).map(route => route.id);
        const political = profile.routes.map(route => politicalChapter(route, design.routes, rootRoutes));
        const sections = [openingChapter(profile, design), design.chapters[0], ...political, ...design.chapters.slice(1)];
        const prefix = 'wr_' + profile.faction.id.toLowerCase() + '_';
        const id = key => prefix + key;
        const drafts = new Map();
        let column = 0;
        for (const section of sections) {
            for (const node of section.nodes) {
                if (drafts.has(node.key)) throw new Error(prefix + 'duplicate focus ' + node.key);
                drafts.set(node.key, { ...node, branch: section.title, category: section.category, x: column + node.lane });
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
                progressRequired: node.steps || 2
            };
            if (anyGroups.length) focus.prerequisiteAny = anyGroups.map(group => group.map(parent => parent.id));
            if (node.control) focus.requiredControl = node.control.map(code => 'WR_' + code);
            if (node.war || required.some(parent => parent.wartime)
                || (anyGroups.length && anyGroups.every(group => group.some(parent => parent.wartime)))) focus.wartime = true;
            if (node.story) focus.story = node.story;
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
