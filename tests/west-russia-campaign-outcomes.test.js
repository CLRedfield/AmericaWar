const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function campaign() {
    const ctx = vm.createContext({ console, setTimeout, clearTimeout,
        document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, body: { classList: { toggle() {} } } },
        location: { hash: '', origin: 'http://localhost', pathname: '/' }, matchMedia: () => ({ matches: false }) });
    ctx.window = ctx;
    for (const [, file] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(js\/[^"?]+)\?v=/g)) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    }
    const client = vm.runInContext('({ GameState, MapData, App, GamePageView, WestRussiaEndings, WestRussiaRouteActions })', ctx);
    client.GameState.initLocalLobby('west-russia');
    client.GameState.takeSlot('ONE');
    client.GameState.addAiToSlot('WRF', 'very_easy');
    client.GameState.startGameSession();
    client.GameState.game.storyEnabled = true;
    return client;
}

function complete(client, key) {
    const { GameState, App } = client;
    const id = `wr_one_${key}`;
    const focus = GameState.getFocusById(id);
    for (let step = 0; step < GameState.getFocusRequiredProgress(focus); step++) {
        GameState.game.playerResources.pp = GameState.getEffectivePPCap();
        assert.equal(App.getFocusAdvanceAvailability(id).enabled, true, `${id}: available`);
        App.advanceFocus(id);
    }
    assert.ok(GameState.game.completedFocuses.includes(id));
}

test('the northern signal appears through exploration, obeys its date and forces a seal-or-reply choice', () => {
    const c = campaign();
    const { GameState, GamePageView, App } = c;
    assert.doesNotMatch(GamePageView.renderFocusTreeModal(), /data-focus-id="wr_one_zeroListen"/);
    complete(c, 'report');
    complete(c, 'shortwaveReceivers');
    assert.match(GamePageView.renderFocusTreeModal(), /data-focus-id="wr_one_zeroListen"/);
    complete(c, 'nightLights');
    GameState.game.currentTurn = 5;
    assert.equal(App.getFocusAdvanceAvailability('wr_one_zeroListen').enabled, false);
    GameState.game.currentTurn = 6;
    complete(c, 'zeroListen');
    complete(c, 'zeroSeal');
    assert.equal(GameState.getGameModifiers().routeState.id, 'ONE_zero_sealed');
    assert.equal(App.getFocusAdvanceAvailability('wr_one_zeroReply').enabled, false);
    assert.equal(App.getFocusAdvanceAvailability('wr_one_zeroBroadcast').enabled, false);
    assert.equal(GameState.getFaction('ONE').name, '白海守灯人共和国');
});

test('answering the signal creates a costly supernatural institution and an actionable country panel', () => {
    const c = campaign();
    const { GameState, GamePageView, App, WestRussiaEndings } = c;
    GameState.game.currentTurn = 6;
    for (const key of ['report', 'shortwaveReceivers', 'nightLights', 'zeroListen', 'zeroReply']) complete(c, key);
    assert.equal(App.getFocusAdvanceAvailability('wr_one_zeroBroadcast').enabled, false);
    GameState.game.currentTurn = 9;
    complete(c, 'zeroBroadcast');
    const state = GameState.getGameModifiers().routeState;
    assert.equal(state.id, 'ONE_zero_broadcast');
    assert.equal(GameState.getIdeology().id, 'wr_zero_tide');
    assert.equal(GameState.getGameModifiers().moneyIncome, -4);
    assert.equal(GameState.getGameModifiers().ppIncome, -2);
    assert.ok(GameState.getEffectiveGlobalAttack() >= .5);
    const html = GamePageView.renderRouteAction();
    assert.match(html, /战时征集/);
    assert.match(html, /executeRouteAction/);
    assert.match(html, /财政|收入/);
    assert.equal(WestRussiaEndings.getById(state.id).goalNodes, 12);
});

test('territorial gains complete a route milestone and carry its identity into victory and the campaign epilogue', () => {
    const c = campaign();
    const { GameState, MapData, WestRussiaRouteActions } = c;
    const modifiers = GameState.getGameModifiers();
    WestRussiaRouteActions.settlement('ONE_zero_sealed', 'ONE', modifiers);
    modifiers.routeState.uses = 3;
    MapData.nodes.forEach(node => { node.factionId = 'ONE'; });
    GameState.notify();
    assert.equal(modifiers.routeState.objectiveComplete, true);
    const winner = GameState.checkVictory();
    assert.equal(winner.routeTitle, '白海守灯人');
    assert.match(winner.routeText, /专属施政执行 3 次/);
    const stories = GameState.getCampaignStories();
    assert.ok(stories.some(story => story.id === 'wr_route_ONE_zero_sealed'));
    assert.equal(stories.find(story => story.id === 'wr_ending').title, '白海守灯人');
});
