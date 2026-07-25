const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

global.window = global;

const root = path.resolve(__dirname, '..');
['js/state.js', 'js/map.js', 'js/simultaneous-turns.js'].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

MapData.reset();
GameState.lobby.mode = 'online';
GameState.lobby.myUserId = 'host-user';
GameState.lobby.hostId = 'host-user';
GameState.lobby.settings.turnLimit = '180';
GameState.lobby.slots = GameState.createDefaultSlots();
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'USA'), {
    kind: 'human',
    userId: 'host-user',
    playerName: 'Host'
});
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'CSA'), {
    kind: 'human',
    userId: 'guest-user',
    playerName: 'Guest'
});
Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'TEX'), {
    kind: 'ai',
    aiDifficulty: 'normal',
    playerName: 'AI'
});
GameState.startGameSession();

assert.equal(SimultaneousTurns.getHumanPlayerCount(), 2);
assert.equal(SimultaneousTurns.getReadyHumanCount(), 0, 'AI submissions must not count as ready players');
assert.equal(SimultaneousTurns.getSubmittedCount(), 1, 'AI still submits for authoritative resolution');
assert.equal(SimultaneousTurns.canLocalPlayerAct(), true);

const firstOrder = SimultaneousTurns.addOrder({
    sourceId: 'WAS',
    targetId: 'PIT',
    amount: 1,
    kind: 'attack'
});
assert.ok(firstOrder);

const readyPlan = SimultaneousTurns.snapshotLocalPlan(true);
assert.equal(SimultaneousTurns.getReadyHumanCount(), 1);
assert.equal(SimultaneousTurns.canLocalPlayerAct(), false, 'ready players must be locked');
assert.equal(SimultaneousTurns.addOrder({
    sourceId: 'WAS',
    targetId: 'PIT',
    amount: 1,
    kind: 'attack'
}), null);

const cancelledPlan = SimultaneousTurns.snapshotLocalPlan(false);
assert.ok(cancelledPlan.revision > readyPlan.revision, 'ready toggles need monotonic revisions');
assert.equal(SimultaneousTurns.getReadyHumanCount(), 0);
assert.equal(SimultaneousTurns.canLocalPlayerAct(), true, 'cancelling ready must restore actions');

const guestReady = {
    factionId: 'CSA',
    sessionId: GameState.game.sessionId,
    turn: GameState.game.currentTurn,
    submitted: true,
    orders: [],
    factionName: { name: '远端测试联盟', shortName: '远端联盟' },
    revision: Date.now() + 100
};
assert.equal(SimultaneousTurns.applyRemotePlan(guestReady), true);
assert.equal(SimultaneousTurns.getReadyHumanCount(), 1);
assert.equal(GameState.getFactionName('CSA'), '远端联盟', 'remote focus renames should be visible immediately');

const guestCancelled = { ...guestReady, submitted: false, revision: guestReady.revision + 1 };
assert.equal(SimultaneousTurns.applyRemotePlan(guestCancelled), true);
assert.equal(SimultaneousTurns.getReadyHumanCount(), 0);
assert.equal(SimultaneousTurns.applyRemotePlan(guestReady), false, 'an older ready packet must not roll back cancel');
assert.equal(SimultaneousTurns.getReadyHumanCount(), 0);

const spoofed = {
    ...guestCancelled,
    revision: guestCancelled.revision + 1,
    orders: [{ factionId: 'USA', sourceId: 'CLE', targetId: 'PIT', amount: 1 }]
};
assert.equal(SimultaneousTurns.applyRemotePlan(spoofed), false, 'orders may not impersonate another faction');

console.log('multiplayer ready-state tests passed');
