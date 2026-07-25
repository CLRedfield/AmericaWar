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
    'js/app.js'
].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

MapData.reset();
GameState.lobby.mode = 'local';
GameState.lobby.myUserId = 'round-user';
GameState.lobby.hostId = 'round-user';
GameState.lobby.settings.turnLimit = '180';
GameState.lobby.slots = GameState.createDefaultSlots();
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'USA'), {
    kind: 'human',
    userId: 'round-user',
    playerName: 'Tester'
});
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'CSA'), {
    kind: 'ai',
    aiDifficulty: 'easy',
    playerName: 'AI'
});

GameState.startGameSession();
assert.equal(GameState.game.turnMode, 'simultaneous');
assert.equal(GameState.game.phase, 'planning');
assert.ok(SimultaneousTurns.isFactionSubmitted('CSA'), 'AI should prepare and submit during planning');

const source = MapData.getNode('WAS');
const target = MapData.getNode('PIT');
const startTurn = GameState.game.currentTurn;
const startMoney = GameState.game.playerResources.money;

const order = SimultaneousTurns.addOrder({
    sourceId: source.id,
    targetId: target.id,
    amount: Math.min(3, source.troops - 1),
    kind: 'attack'
});
assert.ok(order);

SimultaneousTurns.snapshotLocalPlan(true);
assert.ok(SimultaneousTurns.allRequiredPlansSubmitted());
assert.equal(App.tryResolveSimultaneousTurn(), true);

assert.equal(GameState.game.currentTurn, startTurn + 1);
assert.equal(GameState.game.phase, 'planning');
assert.equal(SimultaneousTurns.isFactionSubmitted('USA'), false);
assert.ok(SimultaneousTurns.isFactionSubmitted('CSA'), 'AI should immediately prepare the next turn');
assert.equal(GameState.game.actionCountThisTurn, 0);
assert.equal(GameState.game.movementOrdersActive, false);
assert.ok(GameState.game.playerResources.money !== startMoney, 'human economy should settle at the shared turn boundary');
assert.ok(MapData.nodes.every(node => node.moveReady >= 0 && node.moveReady <= node.troops));
assert.equal(GameState.game.lastResolutionReport.turn, startTurn);
assert.equal(GameState.game.lastResolutionReport.nextTurn, startTurn + 1);
assert.equal(GameState.game.lastResolutionReport.resolutionId, 1);
assert.ok(GameState.game.lastResolutionReport.movements.length > 0, 'authoritative report should include accepted public movements');
assert.ok(Array.isArray(GameState.game.lastResolutionReport.engagements));
assert.equal(App.resolutionAnimation.resolutionId, 1, 'host/local client should present the authoritative resolution report');
assert.equal(App.resolutionAnimation.movements.length, GameState.game.lastResolutionReport.movements.length);
assert.ok(App.resolutionAnimation.durationMs > 0);
assert.equal(App.playResolutionAnimation(GameState.game.lastResolutionReport), false, 'the same authoritative resolution must not replay');

console.log('simultaneous round integration test passed');
