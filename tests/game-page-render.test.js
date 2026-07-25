const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

global.window = global;
global.document = {
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; },
    body: { classList: { toggle() {} } }
};
global.location = { hash: '' };
global.alert = () => {};
global.confirm = () => true;

const root = path.resolve(__dirname, '..');
[
    'js/state.js',
    'js/map.js',
    'js/simultaneous-turns.js',
    'js/ai.js',
    'js/views/game-page.js',
    'js/app.js'
].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

MapData.reset();
GameState.lobby.mode = 'online';
GameState.lobby.myUserId = 'render-user';
GameState.lobby.hostId = 'render-user';
GameState.lobby.slots = GameState.createDefaultSlots();
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'USA'), {
    kind: 'human',
    userId: 'render-user',
    playerName: 'Tester'
});
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'CSA'), {
    kind: 'human',
    userId: 'guest-user',
    playerName: 'Guest'
});
GameState.startGameSession();
GameState.game.selectedNodeId = 'WAS';
GameState.game.movementOrdersActive = true;
GameState.game.currentAction = 'move';

const order = SimultaneousTurns.addOrder({
    sourceId: 'WAS',
    targetId: 'PIT',
    amount: 2,
    kind: 'attack'
});
assert.ok(order);
const supportOrder = SimultaneousTurns.addOrder({
    sourceId: 'BAL',
    targetId: 'PIT',
    amount: 2,
    kind: 'attack'
});
assert.ok(supportOrder);

const html = GamePageView.render();
assert.match(html, /同时规划/);
assert.match(html, /准备完毕/);
assert.match(html, /0\/2 已准备/);
assert.match(html, /planned-order attack/);
assert.match(html, /本节点行军计划/);
assert.match(html, /WAS/);
assert.match(html, /coordinated/);
assert.ok(html.indexOf('map-nodes-layer') < html.indexOf('planned-orders-layer'), 'planned routes should render above map nodes');
assert.match(html, /2 路围攻 · 进攻 \+5%/);

GameState.game.battlePreview = App.createBattlePreview('WAS', 'PIT', 1);
const battleHtml = GamePageView.renderBattlePreviewModal(GameState.game.battlePreview);
assert.match(battleHtml, /2 路协同 · 进攻 \+5%/);
assert.equal(GameState.game.battlePreview.existingPlannedTroops, 4);
assert.equal(GameState.game.battlePreview.combinedAttackerBase, 5);

App.resolutionAnimation = {
    resolutionId: 1,
    turn: 1,
    nextTurn: 2,
    startedAt: Date.now(),
    movementDuration: 1.05,
    baseDelay: 0.12,
    staggerStep: 0.04,
    impactDuration: 0.92,
    movements: [
        { id: 'route-a', factionId: 'USA', sourceId: 'WAS', targetId: 'PIT', amount: 2, kind: 'attack' },
        { id: 'route-b', factionId: 'USA', sourceId: 'BAL', targetId: 'PIT', amount: 2, kind: 'attack' }
    ],
    engagements: [{
        targetId: 'PIT',
        type: 'battle',
        winnerFactionId: 'USA',
        previousOwnerId: 'CSA',
        survivors: 1
    }]
};
const resolutionHtml = GamePageView.render();
assert.doesNotMatch(resolutionHtml, /turn-resolution-overlay/);
assert.match(resolutionHtml, /resolution-movement-layer/);
assert.match(resolutionHtml, /resolution-unit-token attack/);
assert.match(resolutionHtml, /<animateMotion/);
assert.match(resolutionHtml, /resolution-engagement-pulse battle/);
assert.match(resolutionHtml, /结算回放/);
assert.ok(
    resolutionHtml.indexOf('map-nodes-layer') < resolutionHtml.indexOf('resolution-movement-layer'),
    'resolution replay should render above map nodes'
);
assert.match(resolutionHtml, /is-resolution-locked/);
assert.match(resolutionHtml, /统一结算中/);
assert.match(resolutionHtml, /disabled/);

App.resolutionAnimation = null;
SimultaneousTurns.snapshotLocalPlan(true);
const readyHtml = GamePageView.render();
assert.match(readyHtml, /is-plan-locked/);
assert.match(readyHtml, /取消准备/);
assert.match(readyHtml, /1\/2 已准备/);
assert.match(readyHtml, /aria-pressed="true"/);

assert.equal(SimultaneousTurns.applyRemotePlan({
    factionId: 'CSA',
    sessionId: GameState.game.sessionId,
    turn: GameState.game.currentTurn,
    submitted: true,
    orders: [],
    revision: Date.now() + 100
}), true);
const finalizingHtml = GamePageView.render();
assert.match(finalizingHtml, /锁定结算中/);
assert.match(finalizingHtml, /2\/2 已准备/);
assert.match(finalizingHtml, /disabled/);
assert.doesNotMatch(finalizingHtml, /turn-ready-label">取消准备</);

console.log('game page render test passed');
