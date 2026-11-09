const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

global.window = global;
const root = path.resolve(__dirname, '..');
['js/state.js', 'js/province-geography.js', 'js/map.js', 'js/simultaneous-turns.js'].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

GameState.lobby.myUserId = 'session-user';
GameState.lobby.hostId = 'session-user';
GameState.lobby.slots = GameState.createDefaultSlots();
Object.assign(GameState.lobby.slots[0], {
    kind: 'human',
    userId: 'session-user',
    playerName: 'Tester'
});
MapData.reset();
GameState.startGameSession();

const stale = {
    factionId: 'USA',
    sessionId: 'previous-match',
    turn: GameState.game.currentTurn,
    submitted: true,
    orders: [],
    revision: Date.now()
};
assert.equal(SimultaneousTurns.applyRemotePlan(stale), false);
assert.equal(SimultaneousTurns.isFactionSubmitted('USA'), false);

const current = {
    ...stale,
    sessionId: GameState.game.sessionId,
    revision: stale.revision + 1
};
assert.equal(SimultaneousTurns.applyRemotePlan(current), true);
assert.equal(SimultaneousTurns.isFactionSubmitted('USA'), true);

console.log('plan session isolation test passed');
