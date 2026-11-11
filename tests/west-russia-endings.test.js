const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function campaign() {
    const ctx = vm.createContext({ GameState: { ideologies: {}, scenarios: {}, focusTrees: {} } });
    for (const filename of ['west-russia-map.js', 'west-russia-programs.js', 'west-russia-endings.js', 'west-russia-secrets.js', 'west-russia-focus.js', 'west-russia.js']) {
        let source = fs.readFileSync(path.join(__dirname, '../js/scenarios', filename), 'utf8');
        if (filename === 'west-russia.js') source = source.replace('    const scenario = {', '    globalThis.profiles = profiles;\n    const scenario = {');
        vm.runInContext(source, ctx, { filename });
    }
    return { ...ctx, ...vm.runInContext('({ WestRussiaEndings, WestRussiaGeography, GameState })', ctx) };
}
const negativeCosts = new Set(['maintenanceRate', 'recruitCost', 'actionCost']);
const beneficial = effect => negativeCosts.has(effect.type) ? effect.amount < 0 : effect.amount > 0;

test('all 91 political settlements have a distinct reversible programme with a real tradeoff', () => {
    const { profiles, WestRussiaEndings, WestRussiaGeography } = campaign();
    const all = WestRussiaEndings.all();
    assert.equal(all.length, 91);
    assert.equal(new Set(all.map(item => JSON.stringify(item.effects))).size, 91);
    assert.equal(new Set(all.map(item => item.title)).size, 91);
    const allowed = new Set(['moneyIncome', 'ppIncome', 'ppCapBonus', 'globalAttack', 'globalDefense',
        'maintenanceRate', 'recruitAmount', 'recruitCost', 'freeTroops', 'crisisPP', 'captureMoney',
        'captureTroops', 'taggedDefense', 'taggedIncome', 'actionCost']);
    for (const profile of profiles) for (const route of profile.routes) {
        route.policies.forEach((policy, arm) => {
            const ending = WestRussiaEndings.get(profile.faction.id, route.id, arm);
            assert.equal(ending.id, `${profile.faction.id}_${route.id}_${arm}`);
            assert.ok(WestRussiaEndings.mechanics[ending.mechanic], ending.id);
            assert.ok(ending.effects.every(effect => allowed.has(effect.type) && Number.isFinite(effect.amount)), ending.id);
            assert.ok(ending.effects.some(beneficial), ending.id + ' has a benefit');
            assert.ok(ending.effects.some(effect => !beneficial(effect)), ending.id + ' has a cost');
            const ownNodes = WestRussiaGeography.nodes.filter(node => node.factionId === profile.faction.id);
            assert.equal(ending.goalNodes, Math.max(12, ownNodes.length + 3));
            assert.ok(ending.goal.includes(String(ending.goalNodes)));
            ending.effects.filter(effect => effect.tag).forEach(effect => {
                assert.ok(ownNodes.some(node => node.tags.includes(effect.tag)), `${ending.id} starts with an applicable ${effect.tag} province`);
            });
        });
    }
});

test('settlements replace institutions through one engine effect, and expose the decision before commitment', () => {
    const { profiles, WestRussiaEndings, GameState } = campaign();
    for (const profile of profiles) for (const route of profile.routes) route.policies.forEach((policy, arm) => {
        const prefix = `wr_${profile.faction.id.toLowerCase()}_${route.id}_${arm}_`;
        const focus = GameState.focusTrees[profile.faction.id].find(item => item.id === prefix + 'settlement');
        const choice = GameState.focusTrees[profile.faction.id].find(item => item.id === prefix + 'choice');
        assert.equal(focus.effects.length, 2, focus.id + ' does not permanently stack passive effects');
        assert.equal(focus.effects[0].type, 'ideology');
        assert.equal(focus.effects[1].type, 'routeSettlement');
        assert.equal(focus.routeOutcome.id, focus.effects[1].id);
        assert.equal(choice.routeOutcome.id, focus.routeOutcome.id);
        assert.equal(choice.routeDecision, true);
        assert.ok(focus.description.includes(focus.routeOutcome.tradeoff));
        assert.equal(WestRussiaEndings.getById(focus.effects[1].id).title, focus.routeOutcome.title);
    });
});

test('all West Russia ideologies have noticeable strengths and costs, without altering American ideologies', () => {
    const { GameState, WestRussiaEndings } = campaign();
    GameState.ideologies.american_fixture = { id: 'american_fixture', description: 'unchanged', bonuses: [] };
    WestRussiaEndings.registerIdeologies();
    const entries = Object.values(GameState.ideologies).filter(item => item.id.startsWith('wr_'));
    assert.equal(entries.length, 21);
    for (const ideology of entries) {
        assert.ok(ideology.bonuses.some(beneficial), ideology.id + ' offers a strength');
        assert.ok(ideology.bonuses.some(effect => !beneficial(effect)), ideology.id + ' charges a cost');
    }
    assert.equal(GameState.ideologies.american_fixture.description, 'unchanged');
    const copy = WestRussiaEndings.getById('WRF_zhukov_0');
    copy.effects[0].amount = 999;
    assert.notEqual(WestRussiaEndings.getById('WRF_zhukov_0').effects[0].amount, 999);
});
