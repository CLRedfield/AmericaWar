const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

global.window = global;

const root = path.resolve(__dirname, '..');
['js/state.js', 'js/map.js', 'js/simultaneous-turns.js'].forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

function createSession() {
    MapData.reset();
    GameState.lobby.mode = 'local';
    GameState.lobby.myUserId = 'test-user';
    GameState.lobby.hostId = 'test-user';
    GameState.lobby.settings.turnLimit = '180';
    GameState.lobby.slots = GameState.createDefaultSlots();
    Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'USA'), {
        kind: 'human',
        userId: 'test-user',
        playerName: 'Tester'
    });
    Object.assign(GameState.lobby.slots.find(slot => slot.factionId === 'CSA'), {
        kind: 'ai',
        aiDifficulty: 'normal',
        playerName: 'AI'
    });
    GameState.startGameSession();
}

createSession();

const was = MapData.getNode('WAS');
const bal = MapData.getNode('BAL');
const troopsBefore = was.troops;
const order = SimultaneousTurns.addOrder({
    sourceId: was.id,
    targetId: bal.id,
    amount: 2,
    kind: 'move'
});

assert.ok(order, 'a valid adjacent order should be queued');
assert.equal(was.troops, troopsBefore, 'planning must not mutate map troops');
assert.equal(SimultaneousTurns.getReservedTroops(was.id, 'USA'), 2);
assert.equal(GameState.getNodeMovableTroops(was), troopsBefore - 2);

SimultaneousTurns.removeOrder(order.id);
assert.equal(SimultaneousTurns.getReservedTroops(was.id, 'USA'), 0);
assert.equal(was.troops, troopsBefore);

createSession();
const target = MapData.getNode('PIT');
const usaSource = MapData.getNode('WAS');
const csaSource = MapData.getNode('CLE');
target.factionId = 'CON';
target.troops = 2;
usaSource.troops = 8;
usaSource.moveReady = 8;
csaSource.troops = 7;
csaSource.moveReady = 7;
GameState.game.turnStartOwners = SimultaneousTurns.captureOwners();

const report = SimultaneousTurns.resolveMovementOrders([
    {
        factionId: 'USA',
        combat: { atk: 0, def: 0 },
        orders: [{ id: 'u', sourceId: 'WAS', targetId: 'PIT', amount: 5, createdAt: 1 }]
    },
    {
        factionId: 'CSA',
        combat: { atk: 0, def: 0 },
        orders: [{ id: 'c', sourceId: 'CLE', targetId: 'PIT', amount: 3, createdAt: 1 }]
    }
]);

assert.equal(report.acceptedOrders, 2);
assert.equal(report.battles, 1);
assert.equal(target.factionId, 'USA', 'largest attacking force should win the multi-party battle');
assert.ok(target.troops >= 1);
assert.equal(usaSource.troops, 3);
assert.equal(csaSource.troops, 4);

createSession();
const siegeTarget = MapData.getNode('PIT');
const siegeWest = MapData.getNode('WAS');
const siegeEast = MapData.getNode('BAL');
siegeTarget.factionId = 'CON';
siegeTarget.troops = 9;
siegeWest.troops = 7;
siegeWest.moveReady = 7;
siegeWest.freshTroops = 0;
siegeEast.troops = 7;
siegeEast.moveReady = 7;
siegeEast.freshTroops = 0;
GameState.game.turnStartOwners = SimultaneousTurns.captureOwners();

assert.equal(SimultaneousTurns.getMultiDirectionBonus(1), 0);
assert.equal(SimultaneousTurns.getMultiDirectionBonus(2), 5);
assert.equal(SimultaneousTurns.getMultiDirectionBonus(3), 10);
assert.equal(SimultaneousTurns.getMultiDirectionBonus(7), 10, 'coordination bonus must be capped');

assert.ok(SimultaneousTurns.addOrder({
    sourceId: siegeWest.id,
    targetId: siegeTarget.id,
    amount: 5,
    kind: 'attack'
}));
assert.ok(SimultaneousTurns.addOrder({
    sourceId: siegeEast.id,
    targetId: siegeTarget.id,
    amount: 5,
    kind: 'attack'
}));

const coordination = SimultaneousTurns.getAttackCoordination(siegeTarget.id, 'USA');
assert.equal(coordination.directions, 2);
assert.equal(coordination.troops, 10);
assert.equal(coordination.bonus, 5);

const siegeReport = SimultaneousTurns.resolveMovementOrders([{
    factionId: 'USA',
    combat: { atk: 0, def: 0 },
    orders: SimultaneousTurns.getOrders('USA')
}]);
assert.equal(siegeReport.coordinatedAttacks, 1);
assert.equal(siegeTarget.factionId, 'USA', 'two 5-troop attacks should narrowly beat 9 defenders with the 5% coordination bonus');
assert.equal(siegeReport.movements.length, 2);
assert.equal(siegeReport.engagements.length, 1);
assert.equal(siegeReport.engagements[0].type, 'battle');
assert.equal(siegeReport.engagements[0].winnerFactionId, 'USA');

createSession();
const emptyingSource = MapData.getNode('WAS');
const undefendedTarget = MapData.getNode('PIT');
emptyingSource.troops = 3;
emptyingSource.moveReady = 3;
emptyingSource.freshTroops = 0;
undefendedTarget.factionId = 'CON';
undefendedTarget.troops = 0;
undefendedTarget.moveReady = 0;
GameState.game.turnStartOwners = SimultaneousTurns.captureOwners();

assert.equal(GameState.getNodeMovableTroops(emptyingSource), 3, 'all troops may leave a node');
assert.ok(SimultaneousTurns.addOrder({
    sourceId: emptyingSource.id,
    targetId: undefendedTarget.id,
    amount: 3,
    kind: 'attack'
}));

const occupationReport = SimultaneousTurns.resolveMovementOrders([{
    factionId: 'USA',
    combat: { atk: 0, def: 0 },
    orders: SimultaneousTurns.getOrders('USA')
}]);

assert.equal(emptyingSource.troops, 0, 'the source node may become empty');
assert.equal(undefendedTarget.factionId, 'USA', 'entering an undefended enemy node must change ownership');
assert.equal(undefendedTarget.troops, 3);
assert.equal(occupationReport.battles, 0);
assert.equal(occupationReport.occupations, 1);
assert.equal(occupationReport.movements.length, 1);
assert.deepEqual(
    Object.fromEntries(['factionId', 'sourceId', 'targetId', 'amount', 'kind'].map(key => [key, occupationReport.movements[0][key]])),
    { factionId: 'USA', sourceId: 'WAS', targetId: 'PIT', amount: 3, kind: 'attack' }
);
assert.equal(occupationReport.engagements.length, 1);
assert.equal(occupationReport.engagements[0].type, 'occupation');
assert.equal(occupationReport.engagements[0].winnerFactionId, 'USA');

GameState.game.factionNames = {};
GameState.setFactionName('USA', '测试共和国', '测试国');
assert.equal(GameState.getFactionName('USA'), '测试国');

console.log('simultaneous-turns tests passed');
