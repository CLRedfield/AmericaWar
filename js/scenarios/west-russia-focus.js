/**
 * West Russia's focus trees. Each country supplies its own political choices,
 * public works and dispatches. The graph below defines the progression rules.
 */
const buildWestRussiaFocus = (() => {
    const effect = (type, amount, fields = {}) => ({ type, amount, ...fields });
    const grant = (type, amount) => [effect(type, amount)];
    const tag = (type, amount, name) => [effect(type, amount, { tag: name })];
    const cost = action => [effect('actionCost', -1, { action })];
    const develop = (maxNodes) => [effect('allIndustry', 1, { maxNodes })];
    const raiseCaps = (maxNodes) => [effect('industryCapBonus', 1, { maxNodes })];

    // Opening, implementation, consolidation and permanent legacy.
    const doctrines = {
        civic: ['pp', 2, 'crisisPP', 2, 'ppCapBonus', 4, 'ppIncome', 0.6],
        council: ['pp', 2, 'recruitAmount', 1, 'freeTroops', 1, 'ppIncome', 0.4],
        staff: ['capitalTroops', 2, 'globalAttack', 0.04, 'allTroops', 1, 'globalAttack', 0.05],
        defence: ['capitalTroops', 2, 'globalDefense', 0.04, 'crisisPP', 1, 'globalDefense', 0.05],
        industry: ['money', 6, 'capitalIndustry', 1, 'moneyIncome', 0.5, 'moneyIncome', 1],
        supply: ['money', 5, 'maintenanceRate', -0.03, 'freeTroops', 1, 'maintenanceRate', -0.04],
        trade: ['money', 7, 'captureMoney', 2, 'ppCapBonus', 3, 'moneyIncome', 0.9],
        levy: ['capitalTroops', 2, 'recruitAmount', 1, 'maintenanceRate', 0.02, 'captureTroops', 1],
        relief: ['pp', 3, 'crisisPP', 2, 'money', 8, 'maintenanceRate', -0.035]
    };

    function portfolioEffects(name, keyTag) {
        return {
            '经济重建': [
                grant('money', 5), grant('moneyIncome', 0.4), grant('pp', 2), grant('money', 6),
                tag('taggedIncome', 0.45, keyTag), grant('capitalIndustry', 1),
                cost('build'), develop(2), grant('money', 8), raiseCaps(2),
                grant('moneyIncome', 0.7), develop(2), grant('moneyIncome', 1)
            ],
            '铁路与补给': [
                grant('money', 4), grant('maintenanceRate', -0.015), grant('pp', 2), grant('capitalTroops', 1),
                tag('taggedIncome', 0.35, keyTag), tag('taggedDefense', 0.055, keyTag),
                grant('moneyIncome', 0.4), tag('taggedTroops', 1, keyTag), grant('ppCapBonus', 4), cost('move'),
                grant('maintenanceRate', -0.02), grant('capitalTroops', 2), grant('maintenanceRate', -0.03)
            ],
            '军事学说': [
                grant('capitalTroops', 1), grant('globalDefense', 0.02), grant('freeTroops', 1), grant('pp', 2),
                grant('globalDefense', 0.04), grant('globalAttack', 0.04),
                tag('taggedDefense', 0.05, keyTag), grant('capitalTroops', 3),
                grant('freeTroops', 1), grant('captureTroops', 1),
                grant('allTroops', 1), grant('recruitAmount', 1), grant('globalAttack', 0.045)
            ],
            '民政与避难': [
                grant('pp', 2), grant('money', 4), grant('ppCapBonus', 3), grant('freeTroops', 1),
                grant('crisisPP', 2), grant('recruitCost', -0.25),
                grant('ppIncome', 0.4), grant('recruitAmount', 1),
                tag('taggedIncome', 0.35, keyTag), grant('capitalTroops', 2),
                grant('maintenanceRate', -0.025), grant('pp', 3), grant('ppCapBonus', 8)
            ],
            '地区整合': [
                grant('ppCapBonus', 3), grant('money', 5), grant('pp', 2), tag('taggedTroops', 1, keyTag),
                tag('taggedIncome', 0.5, keyTag), grant('captureMoney', 2),
                grant('ppIncome', 0.35), tag('taggedDefense', 0.05, keyTag),
                develop(2), grant('freeTroops', 2), grant('moneyIncome', 0.8),
                grant('allTroops', 1), raiseCaps(3)
            ]
        }[name];
    }

    function buildPortfolio(add, portfolio, index) {
        const { name: branch, asset, choices: [first, second], tag: keyTag } = portfolio;
        const prefix = `p${index}`;
        const x = 25 + index * 5;
        const effects = portfolioEffects(branch, keyTag);
        const node = (key, name, offset, y, description, parents, extra = {}) => add(
            `${prefix}_${key}`, name, branch, x + offset, y, description, effects.shift(),
            parents.map(parent => parent === 'report' ? parent : `${prefix}_${parent}`),
            { wartime: y >= 7 || (branch === '地区整合' && y >= 3), ...extra }
        );

        node('survey', `勘察${asset}`, 0, 1, `派人到${asset}登记人手、库存与失修设施。`, ['report'], { progressRequired: 1 });
        node('plan', `${asset}预算`, 0, 2, `把${asset}的恢复计划排进下一轮预算。`, ['survey']);
        node('workshop', `召集${asset}的基层代表`, -1, 3, `向在${asset}实际维持运转的人收集方案。`, ['plan']);
        node('office', `审查${asset}的应急方案`, 1, 3, `让专业部门提出能立即执行的调配计划。`, ['plan']);
        node('local', first, -1, 4, `采纳「${first}」。经费先到现场，由使用者安排优先级。`, ['workshop'], { mutex: [`${prefix}_central`] });
        node('central', second, 1, 4, `采纳「${second}」。由指挥机关集中分配紧缺人力与物资。`, ['office'], { mutex: [`${prefix}_local`] });
        node('local_start', `${first}试点`, -1, 5, `让${asset}率先执行新方案，把耗时和缺口写进每周报告。`, ['local']);
        node('central_start', `${second}执行令`, 1, 5, `向负责${asset}的专员发出正式命令，统一调度。`, ['central']);
        node('local_spread', `推广${first}`, -1, 6, `把试点经验交给其余省区，由各地按实际条件采用。`, ['local_start']);
        node('central_spread', `${second}第二批拨款`, 1, 6, `把人手和物资从已经稳定的地段转到缺口最大的岗位。`, ['central_start']);
        node('audit', `${asset}战时报表`, 0, 7, `战线变化后重新核对${asset}的产出和流向。`, [], {
            any: [[`${prefix}_local_spread`], [`${prefix}_central_spread`]]
        });
        node('network', `扩展${asset}协作网`, 0, 8, `让新接管的站点加入${asset}已经建立的工作网络。`, ['audit']);
        node('legacy', `${asset}常设机构`, 0, 9, `将战时拨款、岗位和责任制固定下来，让${asset}在换届后继续运作。`, ['network'], { progressRequired: 3 });
    }

    function buildPoliticalRoute(add, profile, route, index) {
        const x = 3 + index * 5;
        const key = suffix => `${route.id}_${suffix}`;
        const branch = route.title;
        const node = (suffix, name, offset, y, description, effects, parents, extra = {}) => add(
            key(suffix), name, branch, x + offset, y, description, effects, parents, { wartime: y >= 6, ...extra }
        );
        const commit = key('commit');
        node('commit', route.title, 0, 3, route.platform, grant('pp', 2), ['assembly'], {
            mutex: profile.routes.filter(other => other.id !== route.id).map(other => `${other.id}_commit`),
            progressRequired: 1, story: route.story
        });
        node('hearing', route.hearing, -1, 4, `请各方就「${route.title}」的施政提案公开提出条件。`, grant('ppCapBonus', 3), [commit]);
        node('mandate', route.mandate, 1, 4, `为「${route.title}」的过渡机构确定经费与执勤名单。`, grant('money', 6), [commit]);
        node('congress', route.congress, 0, 5, `在正式议程上写明${branch}在新政府中的地位。`, grant('ppIncome', 0.3), [], {
            any: [[key('hearing')], [key('mandate')]]
        });
        node('wartime', route.wartime, 0, 6, `开战后，${branch}必须决定如何把既定承诺变成可以执行的政策。`,
            grant('capitalTroops', 2), [key('congress')]);

        const settlementIds = route.policies.map((policy, arm) => {
            const offset = arm === 0 ? -1 : 1;
            const choice = suffix => `${arm}_${suffix}`;
            const palette = doctrines[policy.doctrine];
            const reward = step => grant(palette[step * 2], palette[step * 2 + 1]);
            node(choice('choice'), policy.title, offset, 7, policy.platform, reward(0), [key('wartime')], {
                mutex: [key(`${1 - arm}_choice`)], progressRequired: 1
            });
            node(choice('measure'), policy.measure, offset, 8, `通过「${policy.measure}」，明确${policy.title}的第一项常设制度。`,
                reward(1), [key(choice('choice'))]);
            node(choice('project'), policy.project, offset, 9, `用「${policy.project}」检验这套制度能否在战时持续运转。`,
                reward(2), [key(choice('measure'))]);
            node(choice('charter'), `${policy.title}施政纲领`, offset, 10,
                `登记已经落实的改革，并把「${policy.measure}」纳入各地执行细则。`,
                grant('ppCapBonus', 4), [key(choice('project'))]);
            node(choice('settlement'), policy.stateName, offset, 11,
                `以${policy.stateName}的名义组织下一阶段治理。`,
                [...reward(3), { type: 'ideology', id: policy.ideology, name: policy.stateName, shortName: policy.shortName }],
                [key(choice('charter'))], {
                    progressRequired: 3, story: { title: policy.endingTitle, text: policy.ending }
                });
            return key(choice('settlement'));
        });

        node('rulebook', route.outlook, 0, 12, `确定「${route.title}」在各地的财政和行政权限。`,
            grant('moneyIncome', 0.6), [], { any: settlementIds.map(id => [id]) });
        node('integration', '给新接管地区的手册', -1, 13, `由地区整合机关向各省送出一套可执行的准入程序。`,
            develop(2), [key('rulebook'), 'p4_plan']);
        node('reserves', '把战时后备转入常备', 1, 13, `由运输部门登记尚未解散的后备单位，保留各地的补员能力。`,
            grant('allTroops', 1), [key('rulebook'), 'p1_plan']);
        node('final', `${route.outlook}总章程`, 0, 14, `将已经选定的行政安排写入长期章程。`,
            grant('ppIncome', 0.55), [], { any: [[key('integration')], [key('reserves')]], progressRequired: 3 });
        node('successors', `${route.title}的下一任代表`, 0, 15, `移交「${route.outlook}」的执行权限，避免各地工作因更替停摆。`,
            grant('moneyIncome', 0.75), [key('final')], { progressRequired: 3 });
    }

    return function buildFocusTree(profile) {
        const tree = [];
        const prefix = `wr_${profile.faction.id.toLowerCase()}_`;
        const id = key => prefix + key;
        const add = (key, name, branch, x, y, description, effects, parents = [], options = {}) => {
            const focus = {
                id: id(key), name, branch, x, y, cost: 4, description, effects,
                prerequisites: parents.map(id), progressRequired: options.progressRequired || 2
            };
            if (options.wartime) focus.wartime = true;
            if (options.any) focus.prerequisiteAny = options.any.map(group => group.map(id));
            if (options.mutex) focus.mutuallyExclusive = options.mutex.map(id);
            if (options.story) focus.story = options.story;
            tree.push(focus);
        };
        const [opening, repair, roster, assembly, frontier] = profile.opening;
        add('report', opening, '开局动员', 11, 0, profile.faction.description, grant('pp', 1), [], { progressRequired: 1 });
        add('repair', repair, '开局动员', 9, 1, '先修好首都受损的生产设备，恢复一部分常态产能。',
            grant('capitalIndustry', 1), ['report'], { progressRequired: 1 });
        add('roster', roster, '开局动员', 13, 1, '清点归队的老兵，为首都留出第一批应急部队。',
            grant('capitalTroops', 2), ['report'], { progressRequired: 1 });
        add('assembly', assembly, '政治路线', 11, 2, '召集各派代表。通过一条路线后，其他路线的执政申请将关闭。',
            grant('pp', 2), [], { any: [['repair'], ['roster']], progressRequired: 1 });
        add('frontier', frontier, '开局动员', 21, 1, '修整前沿阵地、检查应急物资和民用撤离路线。',
            tag('taggedDefense', 0.04, profile.portfolios[2].tag), ['report'], { progressRequired: 1 });

        profile.routes.forEach((route, index) => buildPoliticalRoute(add, profile, route, index));
        profile.portfolios.forEach((portfolio, index) => buildPortfolio(add, portfolio, index));
        return tree;
    };
})();
