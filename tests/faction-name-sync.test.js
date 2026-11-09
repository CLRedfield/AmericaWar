const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

global.window = global;

const root = path.resolve(__dirname, '..');
['js/state.js', 'js/province-geography.js', 'js/map.js', 'js/simultaneous-turns.js', 'js/multiplayer.js'].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

(async () => {
    MapData.reset();
    GameState.lobby.mode = 'online';
    GameState.lobby.myUserId = 'host-user';
    GameState.lobby.hostId = 'host-user';
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
    GameState.startGameSession();
    GameState.setFactionName('USA', '美利坚测试共和国', '测试共和国');
    GameState.game.resolutionId = 1;
    GameState.game.lastResolutionReport = {
        resolutionId: 1,
        sessionId: GameState.game.sessionId,
        turn: 1,
        nextTurn: 2,
        acceptedOrders: 2,
        battles: 1,
        occupations: 1,
        coordinatedAttacks: 0,
        movements: [{
            id: 'host-route-1',
            factionId: 'USA',
            sourceId: 'WAS',
            targetId: 'PIT',
            amount: 2,
            kind: 'attack'
        }],
        engagements: [{
            targetId: 'PIT',
            type: 'battle',
            winnerFactionId: 'USA',
            previousOwnerId: 'CSA',
            survivors: 1
        }]
    };

    let payload = null;
    Multiplayer.isOnline = true;
    Multiplayer.isHost = true;
    Multiplayer.room = {
        writeState(value) { payload = value; }
    };
    Multiplayer.pushGameState(true);
    await new Promise(resolve => setTimeout(resolve, 120));

    assert.ok(payload, 'host should emit an authoritative state snapshot');
    assert.deepEqual(payload.factionNames.USA, {
        name: '美利坚测试共和国',
        shortName: '测试共和国'
    });
    assert.equal(payload.lastResolutionReport.occupations, 1);
    assert.equal(payload.lastResolutionReport.movements[0].sourceId, 'WAS');
    assert.equal(payload.lastResolutionReport.engagements[0].targetId, 'PIT');
    const remoteEmptyNode = payload.map.find(node => node.id === 'WAS');
    remoteEmptyNode.troops = 0;
    remoteEmptyNode.moveReady = 0;
    remoteEmptyNode.freshTroops = 0;

    payload.factionNames.USA = {
        name: '远端同步国名',
        shortName: '远端国名'
    };
    Multiplayer.suppressLocalSync = true;
    Multiplayer.applyStateFromRemote(payload);
    Multiplayer.suppressLocalSync = false;

    assert.equal(GameState.getFaction('USA').name, '远端同步国名');
    assert.equal(GameState.getFactionName('USA'), '远端国名');
    assert.equal(MapData.getNode('WAS').troops, 0, 'authoritative zero troop values must survive multiplayer apply');
    assert.equal(MapData.getNode('WAS').moveReady, 0);
    assert.equal(GameState.game.lastResolutionReport.occupations, 1);

    const preservedGuestPlan = {
        factionId: 'CSA',
        sessionId: GameState.game.sessionId,
        turn: GameState.game.currentTurn,
        submitted: true,
        orders: [],
        revision: Number(payload.lastUpdate || 0) + 10
    };
    GameState.game.turnPlans.CSA = preservedGuestPlan;
    GameState.setFactionName('CSA', '即时公开联盟', '即时联盟');
    assert.equal(Multiplayer.applyStateFromRemote(payload), false, 'duplicate authoritative state should be ignored');
    assert.equal(GameState.game.turnPlans.CSA.revision, preservedGuestPlan.revision, 'duplicate same-round state must preserve newer plan readiness');
    assert.equal(GameState.getFactionName('CSA'), '即时联盟', 'duplicate same-round state must not erase a public plan rename');
    const oldPayload = JSON.parse(JSON.stringify(payload));

    let replayCount = 0;
    let replayedReport = null;
    global.app = {
        playResolutionAnimation(report) {
            replayCount += 1;
            replayedReport = report;
            return true;
        }
    };
    payload.resolutionId = 2;
    payload.lastUpdate = Number(payload.lastUpdate || 0) + 1;
    payload.lastResolutionReport = {
        ...payload.lastResolutionReport,
        resolutionId: 2,
        movements: [{
            id: 'host-route-2',
            factionId: 'CSA',
            sourceId: 'PIT',
            targetId: 'WAS',
            amount: 1,
            kind: 'attack'
        }]
    };
    assert.equal(Multiplayer.applyStateFromRemote(payload), true);
    assert.equal(replayCount, 1, 'a newer authoritative resolution should replay exactly once on a guest');
    assert.equal(replayedReport.movements[0].id, 'host-route-2');

    assert.equal(Multiplayer.applyStateFromRemote(payload), false);
    assert.equal(Multiplayer.applyStateFromRemote(oldPayload), false, 'an older state arriving later must be rejected');
    assert.equal(GameState.game.resolutionId, 2, 'old state must not roll back the guest turn snapshot');
    assert.equal(replayCount, 1);

    assert.equal(replayCount, 1, 'receiving the same resolution snapshot again must not replay it');

    console.log('faction name sync test passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
