const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('losing the original capital combines national and ideological emergency PP once', () => {
    const root = path.resolve(__dirname, '..');
    const ctx = vm.createContext({ console, setTimeout, clearTimeout,
        document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, body: { classList: { toggle() {} } } },
        location: { hash: '', origin: 'http://localhost', pathname: '/' }, matchMedia: () => ({ matches: false }) });
    ctx.window = ctx;
    for (const [, file] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(js\/[^"?]+)\?v=/g)) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    }
    const { GameState, MapData } = vm.runInContext('({ GameState, MapData })', ctx);
    GameState.initLocalLobby('west-russia');
    GameState.takeSlot('KOM');
    GameState.addAiToSlot('WRF', 'very_easy');
    GameState.startGameSession();
    GameState.setCurrentIdeology('wr_civic_restoration');
    GameState.getGameModifiers().crisisPP = 2;
    GameState.game.playerResources.pp = 0;
    const original = GameState.getFaction('KOM').capitalNodeId;
    GameState.game.lastCapitalNodeIds.KOM = original;
    MapData.getNode(original).factionId = 'WRF';
    GameState.refreshFactionStatus(true);
    assert.equal(GameState.game.playerResources.pp, 8, 'national +2 and ideology +6 both apply');
    GameState.refreshFactionStatus(true);
    assert.equal(GameState.game.playerResources.pp, 8, 'remaining in the fallback capital does not pay again');
});
