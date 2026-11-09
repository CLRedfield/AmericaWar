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
global.alert = message => { throw new Error(message); };
global.confirm = () => true;

const root = path.resolve(__dirname, '..');
[
    'js/state.js',
    'js/province-geography.js',
    'js/map.js',
    'js/simultaneous-turns.js',
    'js/ai.js',
    'js/multiplayer.js',
    'js/app.js'
].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

(async () => {
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

    const stateWrites = [];
    const planWrites = [];
    Multiplayer.isOnline = true;
    Multiplayer.isHost = true;
    Multiplayer.room = {
        writeState(payload) { stateWrites.push(payload); },
        writePlan(factionId, payload) { planWrites.push({ factionId, payload }); }
    };

    App.startMatch();
    await new Promise(resolve => setTimeout(resolve, 120));
    assert.equal(stateWrites.length, 1, 'online start must force the first authoritative state snapshot');
    assert.equal(stateWrites[0].turnMode, 'simultaneous');
    assert.ok(stateWrites[0].sessionId);

    const initialTurn = GameState.game.currentTurn;
    const guestReady = {
        factionId: 'CSA',
        sessionId: GameState.game.sessionId,
        turn: initialTurn,
        submitted: true,
        orders: [],
        revision: Date.now() + 50
    };
    assert.equal(SimultaneousTurns.applyRemotePlan(guestReady), true);

    App.submitOrWithdrawTurnPlan(false);
    assert.equal(SimultaneousTurns.isFactionSubmitted('USA'), true);
    assert.ok(App.simultaneousResolveTimer, 'all-ready should open a short cancellation window');
    const originalRelation = GameState.game.diplomacy.CSA.relation;
    const changedRelation = originalRelation === '??' ? '??' : '??';
    App.setDiplomacy('CSA', changedRelation);
    assert.equal(GameState.game.diplomacy.CSA.relation, originalRelation, 'ready must lock diplomacy too');

    App.submitOrWithdrawTurnPlan(false);
    assert.equal(SimultaneousTurns.isFactionSubmitted('USA'), false);
    assert.equal(App.simultaneousResolveTimer, null, 'cancelling ready must cancel pending resolution');
    App.setDiplomacy('CSA', changedRelation);
    assert.equal(GameState.game.diplomacy.CSA.relation, changedRelation, 'cancelling ready restores diplomacy actions');
    await new Promise(resolve => setTimeout(resolve, 520));
    assert.equal(GameState.game.currentTurn, initialTurn, 'cancelled ready must not resolve the turn');

    App.submitOrWithdrawTurnPlan(false);
    await new Promise(resolve => setTimeout(resolve, 650));
    assert.equal(GameState.game.currentTurn, initialTurn + 1, 'all players staying ready should resolve once');
    assert.ok(stateWrites.length >= 2, 'the host must broadcast the resolved authoritative state');
    assert.ok(planWrites.some(write => write.factionId === 'USA' && write.payload.submitted === false));

    if (App.resolutionAnimationTimer) clearTimeout(App.resolutionAnimationTimer);
    console.log('multiplayer round-flow tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
