const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '..');

// Before the identity-focused balance pass, these were the narrow/unsustainable
// endings. Compare real income and army upkeep after a legal political path,
// rather than accepting a new letter grade as proof that they improved.
const previousEconomyAt40 = {
    WRF_zhukov_0: 3.1,
    WRF_tukhachevsky_1: 1.47,
    WRF_continuity_0: 3.55,
    WRF_cadres_0: 3.55,
    KOM_centre_1: 1.37,
    KOM_left_0: 0.57,
    KOM_right_0: 2.85,
    KOM_right_1: -5.65,
    KOM_right_2: 1.25,
    VYA_kadets_1: 4.45,
    VYA_shulgin_0: 2.95,
    VYA_solidarists_1: -3.25,
    VYA_rovs_0: 2.85,
    SAM_zykov_0: 1.35,
    SAM_oktan_1: 3.25,
    SAM_officers_0: 4.145,
    PRM_vagner_0: -5.05,
    PRM_velimir_0: -5.45,
    PRM_velimir_1: 1.05,
    PRM_engineers_1: 4.145,
    ONE_treaty_0: 4.545,
    ONE_autonomy_0: 1.8,
    ONE_autonomy_1: 5.775,
    ONE_zero_sealed: 3.6,
    ONE_zero_broadcast: -8.4,
    GOR_armor_1: 4.145,
    GOR_veterans_0: 5.25,
    VOL_schools_0: 1.35,
    VOL_neutrality_0: 4.145,
    GEO_parishes_1: 1.8,
    GEO_order_0: 3.775,
    GEO_law_0: 1.35,
    TAT_guard_0: 4.145,
    BSH_home_0: 1.95,
    BSH_mountains_0: 4.145,
};
function client() {
    const ctx = vm.createContext({ console, setTimeout, clearTimeout,
        document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, body: { classList: { toggle() {} } } },
        location: { hash: '', origin: 'http://localhost', pathname: '/' }, matchMedia: () => ({ matches: false }) });
    ctx.window = ctx;
    for (const [, file] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(js\/[^"?]+)\?v=/g)) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    }
    return vm.runInContext('({ GameState, MapData, App })', ctx);
}
function politicalPlan(tree, target) {
    const byId = new Map(tree.map(f => [f.id, f]));
    const memo = new Map();
    const combine = (first, second) => first.flatMap(a => second.map(b => new Set([...a, ...b])))
        .filter(s => ![...s].some(id => byId.get(id).mutuallyExclusive?.some(other => s.has(other))));
    function plans(id) {
        if (memo.has(id)) return memo.get(id);
        const focus = byId.get(id);
        let all = [new Set([id])];
        for (const parent of focus.prerequisites) all = combine(all, plans(parent));
        if (focus.prerequisiteAny?.length) all = focus.prerequisiteAny.flatMap(group =>
            group.reduce((choices, parent) => combine(choices, plans(parent)), all));
        memo.set(id, all);
        return all;
    }
    const capstone = target.id.endsWith('_settlement')
        ? `wr_${target.routeOutcome.factionId.toLowerCase()}_${target.routeOutcome.routeId}_successors`
        : target.id;
    const choices = combine(plans(target.id), plans(capstone)).sort((a, b) =>
        a.size - b.size || [...a].sort().join('|').localeCompare([...b].sort().join('|')));
    assert.ok(choices.length, target.id + ' has a legal political route');
    const done = new Set(), ordered = [];
    function visit(id) {
        if (done.has(id)) return;
        const focus = byId.get(id);
        for (const parent of [...focus.prerequisites, ...(focus.prerequisiteAny || []).flat()]) {
            if (choices[0].has(parent)) visit(parent);
        }
        done.add(id);
        ordered.push(focus);
    }
    for (const id of choices[0]) visit(id);
    assert.ok(ordered.every(f => f.category === 'politics'));
    return ordered;
}

test('all 35 formerly weak western endings improve real 40-troop supply without changing their political access', () => {
    const { GameState, MapData, App } = client();
    for (const [id, previous] of Object.entries(previousEconomyAt40)) {
        const faction = id.split('_')[0];
        GameState.initLocalLobby('west-russia');
        GameState.takeSlot(faction);
        GameState.startGameSession();
        const tree = GameState.focusTrees[faction];
        const target = tree.find(f => f.routeOutcome?.id === id &&
            (f.id.endsWith('_settlement') || f.id.endsWith('zeroSeal') || f.id.endsWith('zeroBroadcast')));
        assert.ok(target, id);
        for (const focus of politicalPlan(tree, target)) {
            assert.equal(GameState.getFocusRequiredProgress(focus), 1);
            for (const effect of focus.effects) {
                App.applyFocusEffect(effect, faction, MapData.getNode(GameState.getCapitalNodeId(faction)));
            }
        }
        const upkeep = Math.max(0, 40 - GameState.getEffectiveFreeTroops()) * GameState.getMaintenanceRate();
        const net = GameState.getMoneyIncomeBonus() + GameState.getTaggedIncomeTotal() + 20 - upkeep;
        assert.ok(net > previous + 0.75, `${id}: supply gain is material (${previous} -> ${net})`);
        assert.ok(net > 0, `${id}: its political package can support a 40-troop force better than the unmodified baseline`);
        assert.equal(GameState.getGameModifiers().routeState.id, id);
    }
});
