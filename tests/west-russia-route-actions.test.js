const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
function client(factionId = 'WRF') {
    const context = vm.createContext({
        console, setTimeout, clearTimeout,
        document: {
            addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
            getElementById() { return null; }, body: { classList: { toggle() {} } }
        },
        location: { hash: '', origin: 'http://localhost', pathname: '/' }, matchMedia: () => ({ matches: false })
    });
    context.window = context;
    const indexScripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8')
        .matchAll(/src="(js\/[^"?]+)\?v=/g)].map(([, filename]) => filename);
    const scripts = new Set(indexScripts);
    for (const filename of indexScripts) vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
    for (const filename of ['js/scenarios/west-russia-endings.js', 'js/scenarios/west-russia-route-actions.js']) {
        if (!scripts.has(filename)) vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
    }
    Object.assign(context, vm.runInContext('({ GameState, MapData, App, GameAI, SimultaneousTurns, WestRussiaEndings, WestRussiaRouteActions })', context));
    const { GameState } = context;
    GameState.initLocalLobby('west-russia');
    GameState.lobby.slots.forEach(slot => Object.assign(slot, { kind: 'open', userId: null }));
    Object.assign(GameState.getSlot(factionId), { kind: 'human', userId: GameState.lobby.myUserId });
    GameState.selectedFactionId = factionId;
    GameState.startGameSession();
    GameState.game.currentTurn = 4;
    GameState.game.playerResources.money = 500;
    GameState.game.playerResources.pp = 500;
    return context;
}
function adopt(ctx, mechanic, factionId = 'WRF', ai = false) {
    const ending = ctx.WestRussiaEndings.all().find(item => item.factionId === factionId && item.mechanic === mechanic);
    assert.ok(ending, `${factionId} has ${mechanic} ending`);
    const modifiers = ai ? ctx.GameAI.getAiModifiers(factionId) : ctx.GameState.getGameModifiers();
    ctx.WestRussiaRouteActions.settlement(ending.id, factionId, modifiers);
    return ending;
}
function snapshotNodes(ctx, factionId) {
    return ctx.MapData.nodes.filter(node => node.factionId !== factionId)
        .map(node => JSON.stringify(node)).join('|');
}

test('settlements replace all reversible institutions, preserve unrelated bonuses, and cannot reset cooldown by reapplying', () => {
    const ctx = client();
    const { GameState, WestRussiaRouteActions: routes } = ctx;
    GameState.getGameModifiers().globalAttack = 0.123;
    const first = adopt(ctx, 'breakthrough');
    const bonuses = JSON.parse(JSON.stringify(GameState.getGameModifiers()));
    routes.settlement(first.id, 'WRF', GameState.getGameModifiers());
    assert.deepEqual(JSON.parse(JSON.stringify(GameState.getGameModifiers())), bonuses);
    adopt(ctx, 'supply');
    assert.ok(Math.abs(GameState.getGameModifiers().globalAttack - 0.213) < 1e-9, 'old breakthrough +14% is removed; supply-specific +9% remains');
    assert.equal(GameState.getGameModifiers().captureTroopsOnWin, 0);
    assert.equal(GameState.getGameModifiers().actionBaseCost.move, -1);
    const civic = adopt(ctx, 'civic');
    assert.equal(routes.execute('WRF').ok, true);
    const state = GameState.getGameModifiers().routeState;
    routes.settlement(civic.id, 'WRF', GameState.getGameModifiers());
    assert.equal(GameState.getGameModifiers().routeState.uses, 1);
    assert.equal(GameState.getGameModifiers().routeState.lastUsedTurn, state.lastUsedTurn);
    assert.equal(routes.execute('WRF').ok, false);
});

test('hearing charges exact resources, enforces cooldown and submitted-plan lock, and leaves standard action count alone', () => {
    const ctx = client();
    const { GameState, WestRussiaRouteActions: routes, SimultaneousTurns } = ctx;
    adopt(ctx, 'civic');
    GameState.game.playerResources.pp = 10;
    const resources = GameState.game.playerResources;
    const beforeActions = GameState.game.actionCountThisTurn;
    assert.equal(routes.execute('WRF').ok, true);
    assert.equal(resources.money, 494);
    assert.equal(resources.pp, 16);
    assert.equal(GameState.game.actionCountThisTurn, beforeActions);
    assert.match(routes.describe('WRF').reason, /冷却 3/);
    GameState.game.currentTurn += 2;
    assert.equal(routes.execute('WRF').ok, false);
    GameState.game.currentTurn += 1;
    SimultaneousTurns.getPlan('WRF').submitted = true;
    assert.equal(routes.execute('WRF').ok, false);
    SimultaneousTurns.getPlan('WRF').submitted = false;
    assert.equal(routes.execute('WRF').ok, true);
    GameState.game.currentTurn += 3;
    resources.money = 0;
    assert.equal(routes.execute('WRF').ok, false);
});

test('production creates actual industry without exceeding its cap or changing enemy nodes', () => {
    const ctx = client();
    const { GameState, MapData, WestRussiaRouteActions: routes } = ctx;
    adopt(ctx, 'arsenal');
    const own = MapData.getFactionNodes('WRF')[0];
    const before = snapshotNodes(ctx, 'WRF');
    const industry = own.industry;
    assert.equal(routes.execute('WRF', own.id).ok, true);
    assert.equal(own.industry, industry + 1);
    assert.equal(snapshotNodes(ctx, 'WRF'), before);
    GameState.game.currentTurn += 2;
    own.industry = GameState.getNodeIndustryCap(own.id);
    assert.equal(routes.execute('WRF', own.id).ok, false);
    assert.match(routes.describe('WRF', own.id).reason, /上限/);
});

test('military actions respect the preparation period and create immobile fresh reserves', () => {
    const ctx = client();
    const { GameState, MapData, WestRussiaRouteActions: routes } = ctx;
    adopt(ctx, 'fortress');
    const target = MapData.getFactionNodes('WRF').find(node => MapData.getNeighbors(node.id).some(other => other.factionId !== 'WRF'));
    assert.ok(target);
    GameState.game.currentTurn = 3;
    assert.equal(routes.execute('WRF', target.id).ok, false);
    GameState.game.currentTurn = 4;
    const troops = target.troops;
    const ready = GameState.getNodeMoveReady(target);
    assert.equal(routes.execute('WRF', target.id).ok, true);
    assert.equal(target.troops, troops + 3);
    assert.equal(target.moveReady, ready);
    assert.equal(target.freshTroops, 3);
});

test('strategic transport preserves reserved troops, connected ownership, and at least one capital guard', () => {
    const ctx = client();
    const { GameState, MapData, WestRussiaRouteActions: routes, SimultaneousTurns } = ctx;
    adopt(ctx, 'supply');
    const capital = MapData.getNode(GameState.getCapitalNodeId('WRF'));
    const target = MapData.getNeighbors(capital.id).find(node => node.factionId === 'WRF');
    assert.ok(target);
    capital.troops = 8;
    capital.moveReady = 8;
    SimultaneousTurns.getPlan('WRF').orders.push({ sourceId: capital.id, targetId: target.id, amount: 6, factionId: 'WRF', kind: 'move' });
    const previous = target.troops;
    assert.equal(routes.execute('WRF', target.id).ok, true);
    assert.equal(capital.troops, 6, 'six reserved soldiers remain in source');
    assert.equal(capital.moveReady, 6);
    assert.equal(target.troops, previous + 2);
    assert.equal(target.freshTroops, 2);
    GameState.game.currentTurn += 2;
    assert.equal(routes.execute('WRF', target.id).ok, false, 'no unreserved soldier can be transported');
    SimultaneousTurns.getPlan('WRF').orders = [];
    capital.troops = 1;
    capital.moveReady = 1;
    assert.equal(routes.execute('WRF', target.id).ok, false, 'capital must keep one guard');
});

test('welfare cannot remove soldiers assigned to a pending order and pays only for actual demobilisation', () => {
    const ctx = client();
    const { GameState, MapData, WestRussiaRouteActions: routes, SimultaneousTurns } = ctx;
    adopt(ctx, 'welfare');
    const capital = GameState.getCapitalNodeId('WRF');
    const target = MapData.getFactionNodes('WRF').find(node => node.id !== capital);
    target.troops = 8;
    target.moveReady = 8;
    SimultaneousTurns.getPlan('WRF').orders.push({ sourceId: target.id, targetId: capital, amount: 1 });
    assert.equal(routes.execute('WRF', target.id).ok, false);
    SimultaneousTurns.getPlan('WRF').orders = [];
    GameState.game.playerResources.pp = 10;
    assert.equal(routes.execute('WRF', target.id).ok, true);
    assert.equal(target.troops, 4);
    assert.equal(GameState.game.playerResources.money, 512);
    assert.equal(GameState.game.playerResources.pp, 8);
});

test('AI uses its own resources and institutions, and actions never mutate another faction', () => {
    const ctx = client();
    const { GameState, GameAI, WestRussiaRouteActions: routes } = ctx;
    Object.assign(GameState.getSlot('KOM'), { kind: 'ai', aiDifficulty: 'normal' });
    GameState.game.aiResources = { KOM: { money: 100, pp: 10 } };
    adopt(ctx, 'civic', 'KOM', true);
    const localMoney = GameState.game.playerResources.money;
    const localPP = GameState.game.playerResources.pp;
    const before = snapshotNodes(ctx, 'KOM');
    assert.equal(routes.autoAct('KOM').ok, true);
    assert.equal(GameState.game.aiResources.KOM.money, 94);
    assert.equal(GameState.game.aiResources.KOM.pp, 16);
    assert.equal(GameState.game.playerResources.money, localMoney);
    assert.equal(GameState.game.playerResources.pp, localPP);
    assert.equal(GameAI.getAiModifiers('KOM').routeState.uses, 1);
    assert.equal(snapshotNodes(ctx, 'KOM'), before);
    assert.equal(routes.autoAct('KOM').ok, false, 'AI observes the same cooldown');
});

test('route action counters and passive snapshots survive a human planning snapshot round trip', () => {
    const ctx = client();
    const { GameState, WestRussiaRouteActions: routes, SimultaneousTurns } = ctx;
    adopt(ctx, 'civic');
    GameState.game.playerResources.pp = 10;
    assert.equal(routes.execute('WRF').ok, true);
    const plan = SimultaneousTurns.snapshotLocalPlan(false);
    const expected = JSON.stringify(plan.playerState.modifiers.routeState);
    GameState.game.modifiers.routeState = null;
    GameState.game.humanStates.WRF = plan.playerState;
    SimultaneousTurns.loadHumanState('WRF');
    assert.equal(JSON.stringify(GameState.game.modifiers.routeState), expected);
    assert.equal(routes.describe('WRF').enabled, false);
    assert.match(routes.describe('WRF').reason, /冷却/);
});

test('three actions and territory goal award a single commemorative achievement without winning the war', () => {
    const ctx = client();
    const { GameState, MapData, WestRussiaRouteActions: routes } = ctx;
    const ending = adopt(ctx, 'civic');
    const needed = Math.max(12, ending.goalNodes);
    const own = MapData.getFactionNodes('WRF').length;
    MapData.nodes.filter(node => node.factionId !== 'WRF').slice(0, needed - own)
        .forEach(node => { node.factionId = 'WRF'; });
    for (let i = 0; i < 3; i += 1) {
        GameState.game.playerResources.pp = 10;
        assert.equal(routes.execute('WRF').ok, true);
        GameState.game.currentTurn += 3;
    }
    const modifiers = GameState.getGameModifiers();
    assert.equal(modifiers.routeState.achieved, true);
    assert.equal(modifiers.routeState.objectiveComplete, true);
    const badgeCount = modifiers.badges.length;
    assert.equal(routes.checkGoal('WRF', modifiers), false);
    assert.equal(modifiers.badges.length, badgeCount);
    assert.equal(GameState.game.gameOver, false);
    assert.equal(GameState.game.winner, null);
});

test('every national action performs its advertised resource or map change for its own faction', () => {
    const catalogue = client().WestRussiaEndings.all();
    for (const kind of ['commerce', 'levies', 'councils', 'breakthrough']) {
        const ending = catalogue.find(item => item.mechanic === kind);
        const ctx = client(ending.factionId);
        const { GameState, MapData, WestRussiaRouteActions: routes } = ctx;
        const id = ending.factionId;
        routes.settlement(ending.id, id, GameState.getGameModifiers());
        const own = MapData.getFactionNodes(id);
        const capital = MapData.getNode(GameState.getCapitalNodeId(id));
        capital.troops = 12;
        capital.moveReady = 12;
        const enemySnapshot = snapshotNodes(ctx, id);
        const fronts = own.filter(node => MapData.getNeighbors(node.id).some(other => other.factionId !== id));
        const target = fronts.find(node => node.id !== capital.id);
        const action = routes.describe(id, target?.id);
        assert.ok(action?.enabled, `${kind}: ${action?.reason}`);
        const resources = GameState.game.playerResources;
        resources.pp = 20;
        const beforeMoney = resources.money;
        const beforeTroops = own.reduce((sum, node) => sum + node.troops, 0);
        const targetReady = target ? GameState.getNodeMoveReady(target) : 0;
        const targetFresh = target?.freshTroops || 0;
        const expectedCommerce = Math.min(20, 4 + 2 * own.filter(node => node.tags.some(tag => ['港口', '河港', '铁路', '油田'].includes(tag))).length);
        const result = routes.execute(id, target?.id);
        assert.equal(result.ok, true, `${kind}: ${result.reason}`);
        const afterTroops = own.reduce((sum, node) => sum + node.troops, 0);
        if (kind === 'commerce') {
            assert.equal(resources.money, beforeMoney + expectedCommerce);
            assert.equal(resources.pp, 14);
            assert.equal(afterTroops, beforeTroops);
        } else if (kind === 'levies') {
            assert.equal(afterTroops - beforeTroops, Math.min(3, fronts.length) * 2);
            assert.equal(resources.money, beforeMoney - 6);
            assert.equal(resources.pp, 8);
        } else if (kind === 'councils') {
            assert.equal(afterTroops - beforeTroops, Math.min(3, own.length));
            const expectedPP = Math.min(8, [...own].sort((a, b) => b.industry - a.industry).slice(0, 3).reduce((sum, node) => sum + node.industry, 0));
            assert.equal(resources.pp, 10 + expectedPP);
        } else if (kind === 'breakthrough') {
            assert.equal(afterTroops, beforeTroops);
            assert.equal(capital.troops, 8);
            assert.equal(target.freshTroops || 0, targetFresh);
            assert.equal(target.moveReady, targetReady + 4, 'breakthrough troops may attack this turn, unlike supply rotations');
        }
        assert.equal(snapshotNodes(ctx, id), enemySnapshot, kind + ' must not modify another faction');
    }
});
