const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(js\/[^"?]+)\?v=/g)]
    .map(([, filename]) => filename);

function gameClient() {
    const context = vm.createContext({
        console,
        document: {
            addEventListener() {},
            querySelector() { return null; },
            querySelectorAll() { return []; },
            getElementById() { return null; },
            body: { classList: { toggle() {} } }
        },
        location: { hash: '', origin: 'http://localhost', pathname: '/' },
        matchMedia: () => ({ matches: false }),
        setTimeout,
        clearTimeout
    });
    context.window = context;
    for (const filename of scripts) {
        vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
    }
    return Object.assign(context, vm.runInContext("({ GameState, WestRussiaFocusLayout })", context));
}

function assertReachableFocuses(focuses, byId) {
    const plans = new Map();
    function combine(left, right) {
        const compatible = new Map();
        for (const first of left) {
            for (const second of right) {
                const joined = new Set([...first, ...second]);
                const conflict = [...joined].some(id => byId.get(id).mutuallyExclusive?.some(other => joined.has(other)));
                if (!conflict) compatible.set([...joined].sort().join('|'), joined);
            }
        }
        return [...compatible.values()];
    }
    const requireAll = (choices, ids) => ids.reduce((current, id) => combine(current, plans.get(id)), choices);
    for (const focus of [...focuses].sort((a, b) => a.y - b.y)) {
        const required = requireAll([new Set([focus.id])], focus.prerequisites);
        const reachable = focus.prerequisiteAny?.length
            ? focus.prerequisiteAny.flatMap(group => requireAll(required, group))
            : required;
        assert.ok(reachable.length, focus.id + ' has at least one compatible prerequisite plan');
        plans.set(focus.id, reachable);
    }
}

function svgEdges(path, closed) {
    return path.split('M').filter(Boolean).flatMap(ring => {
        const points = ring.match(/-?[\d.]+ -?[\d.]+/g);
        if (closed) points.push(points[0]);
        return points.slice(1).map((point, index) => [point, points[index]].sort().join('|'));
    });
}

test('detailed map frontiers trace the same edges as both province fills', () => {
    const { GameState, MapData } = gameClient();
    GameState.initLocalLobby('west-russia');
    const { provinces, borders, rivers, lakes } = MapData.geography;
    const outlines = new Map(Object.entries(provinces).map(([id, data]) => [id, new Set(svgEdges(data[3], true))]));
    assert.equal(borders.length, 243);
    for (const [a, b, path] of borders) {
        const edges = svgEdges(path, false);
        assert.ok(edges.length);
        assert.ok(edges.every(edge => outlines.get(a).has(edge) && outlines.get(b).has(edge)), `${a}–${b} shares its drawn outline`);
    }
    assert.ok(rivers.startsWith('M') && lakes.startsWith('M'));
    GameState.initLocalLobby('america');
    assert.ok(MapData.geography.rivers.startsWith('M'));
});

test('West Russia provides a connected province map and complete, distinct faction trees', () => {
    const { GameState, MapData } = gameClient();
    GameState.initLocalLobby('west-russia');

    assert.equal(GameState.lobby.slots.length, 11);
    assert.equal(MapData.nodes.length, 93);
    const reachable = new Set([MapData.nodes[0].id]);
    for (const nodeId of reachable) {
        for (const neighbor of MapData.getNeighbors(nodeId)) reachable.add(neighbor.id);
    }
    assert.equal(reachable.size, MapData.nodes.length);
    assert.ok(MapData.geography.borders.every(([a, b, d]) => a !== b && d.startsWith('M')));
    assert.ok(MapData.nodes.every(node => MapData.geography.provinces[node.id][3].startsWith('M')));
    assert.ok(MapData.nodes.every(node => MapData.geography.districts[node.id].length > 0));
    const sourceDistricts = Object.values(MapData.geography.districts).flat();
    assert.equal(sourceDistricts.length, 494);
    assert.equal(new Set(sourceDistricts).size, sourceDistricts.length, 'each real district belongs to one playable province');
    assert.equal(MapData.getNode('WR_UKH').factionId, 'WRF');
    assert.equal(MapData.getNode('WR_VYT').factionId, 'VYA');
    assert.equal(GameState.getFaction('ONE').name, '反共志愿卫队');
    assert.equal(GameState.getFaction('PRM').name, '雅利安兄弟会');
    assert.equal(GameState.getFaction('GOR').name, '高尔基军事管制委员会');
    assert.equal(GameState.getFaction('SAM').name, '俄罗斯解放军');

    const campaignFocusIds = new Set();
    const campaignIdeologies = new Set();
    const topologies = new Set();
    const provincesPerFaction = { WRF: 14, KOM: 7, VYA: 10, SAM: 12, PRM: 10, ONE: 3, GOR: 5, VOL: 11, GEO: 6, TAT: 8, BSH: 7 };
    for (const faction of GameState.factions) {
        assert.equal(MapData.getNode(faction.capitalNodeId).factionId, faction.id);
        const owned = MapData.getFactionNodes(faction.id);
        assert.equal(owned.length, provincesPerFaction[faction.id]);
        assert.ok(owned.some(node => node.troops <= 1));
        campaignIdeologies.add(faction.ideology);
        const localNeighbors = new Set([faction.capitalNodeId]);
        for (const id of localNeighbors) {
            for (const next of MapData.getNeighbors(id)) {
                if (next.factionId === faction.id) localNeighbors.add(next.id);
            }
        }
        assert.equal(localNeighbors.size, owned.length, faction.id + ' has a contiguous starting position');

        const focuses = GameState.getFocusTree(faction.id);
        const byId = new Map(focuses.map(focus => [focus.id, focus]));
        assert.ok(focuses.length >= 150);
        assert.equal(byId.size, focuses.length);
        assert.ok(new Set(focuses.map(focus => focus.branch)).size >= 14);
        assert.ok(focuses.filter(focus => !focus.prerequisites.length && !focus.prerequisiteAny).length >= 2);
        assert.equal(new Set(focuses.map(focus => `${focus.x},${focus.y}`)).size, focuses.length);
        const indices = new Map(focuses.map((focus, index) => [focus.id, index]));
        const refs = ids => ids.map(id => indices.get(id));
        topologies.add(JSON.stringify(focuses.map(focus => [
            refs(focus.prerequisites), (focus.prerequisiteAny || []).map(refs), refs(focus.mutuallyExclusive || [])
        ])));
        assert.equal(focuses.filter(focus => focus.id.endsWith('_commit')).length, 4);
        assert.ok(focuses.filter(focus => focus.story).length >= 12);
        assert.ok(focuses.some(focus => focus.wartime));
        assert.ok(focuses.some(focus => !focus.wartime));

        for (const focus of focuses) {
            assert.ok(!campaignFocusIds.has(focus.id));
            campaignFocusIds.add(focus.id);
            assert.ok(focus.effects.length, focus.id + ' has a concrete effect');
            assert.equal(typeof focus.description, 'string');
            assert.ok(focus.description || focus.category === 'politics', focus.id + ' only omits redundant political prose');
            for (const id of focus.requiredControl || []) assert.ok(MapData.getNode(id), id + ' exists');
            const parents = [...focus.prerequisites, ...(focus.prerequisiteAny || []).flat()];
            for (const parent of parents) {
                assert.ok(byId.has(parent), parent + ' exists');
                assert.ok(byId.get(parent).y < focus.y, focus.id + ' keeps its dependencies acyclic');
            }
            for (const other of focus.mutuallyExclusive || []) {
                assert.ok(byId.get(other).mutuallyExclusive.includes(focus.id), focus.id + ' has a symmetric exclusion');
            }
            for (const effect of focus.effects) {
                if (effect.type === 'ideology') {
                    assert.ok(GameState.ideologies[effect.id].bonuses.length);
                    campaignIdeologies.add(effect.id);
                }
                if (effect.tag) assert.ok(owned.some(node => node.tags.includes(effect.tag)), faction.id + ' can use ' + effect.tag);
            }
        }
        assertReachableFocuses(focuses, byId);
    }
    assert.equal(topologies.size, GameState.factions.length);
    assert.equal(campaignFocusIds.size, 1720, '1716 existing focuses plus four connected northern signal focuses');
    assert.equal(campaignIdeologies.size, 21, '20 political ideologies plus the fictional zero-tide ideology');
    const openingFrontiers = new Set(MapData.connections.map(([a, b]) => (
        [MapData.getNode(a).factionId, MapData.getNode(b).factionId].sort().join('-')
    )));
    for (const border of ['KOM-VOL', 'BSH-SAM', 'GOR-SAM', 'SAM-VYA', 'ONE-WRF', 'GEO-WRF']) {
        assert.ok(openingFrontiers.has(border), border + ' has a shared land frontier');
    }

    GameState.initLocalLobby('america');
    assert.equal(GameState.lobby.slots.length, 8);
    assert.equal(MapData.nodes.length, 48);
    assert.equal(GameState.getFocusTree('USA').length, 150);
    assert.equal(GameState.isWarOpen(), true);
});

test('political branch choices support nested succession, multiple candidates and grouped alternatives', () => {
    const { GameState } = gameClient();
    GameState.initLocalLobby('west-russia');

    const successor = GameState.getFocusById('wr_wrf_cadres_commit', 'WRF');
    assert.ok(successor.prerequisites.includes('wr_wrf_zhukov_congress'));
    assert.ok(successor.mutuallyExclusive.includes('wr_wrf_zhukov_wartime'));
    const reconstruction = GameState.getFocusById('wr_wrf_zhukov_0_choice', 'WRF');
    const rivalReconstruction = GameState.getFocusById('wr_wrf_zhukov_1_choice', 'WRF');
    assert.equal(GameState.isFocusBlockedByMutual(rivalReconstruction, [reconstruction.id]), false);
    const rivalSettlement = GameState.getFocusById('wr_wrf_zhukov_1_settlement', 'WRF');
    assert.equal(GameState.isFocusBlockedByMutual(rivalSettlement, ['wr_wrf_zhukov_0_settlement']), true);

    const right = GameState.getFocusTree('KOM').filter(focus => /^wr_kom_right_\d+_choice$/.test(focus.id));
    assert.equal(right.length, 4);
    assert.ok(right.every(focus => focus.mutuallyExclusive.length === 3));

    const union = GameState.getFocusById('wr_tat_union_commit', 'TAT');
    assert.equal(GameState.areFocusPrerequisitesMet(union, []), false);
    assert.equal(GameState.areFocusPrerequisitesMet(union, ['wr_tat_assembly']), true,
        'choosing the union government does not require economic contracts or crew training');
});

test('West Russia draws every prerequisite downward and routes links between cards', () => {
    const { GameState, WestRussiaFocusLayout } = gameClient();
    GameState.initLocalLobby('west-russia');
    const silhouettes = new Set();
    let crossBranchLinks = 0;
    for (const { id: factionId } of GameState.factions) {
        const tree = GameState.getFocusTree(factionId);
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const layout = WestRussiaFocusLayout.build(tree, factionId);
        const { sections, positions, links, references, cardWidth, cardHeight } = layout;
        const branchCount = new Set(tree.map(focus => focus.branch)).size;
        assert.equal(sections.length, branchCount);
        assert.equal(new Set(sections.map(section => section.name)).size, branchCount);
        assert.equal(Object.keys(positions).length, tree.length);
        silhouettes.add(tree.map(({ id }) => `${positions[id].column},${positions[id].row}`).join('|'));

        const parents = new Map(tree.map(focus => [focus.id, new Set([...focus.prerequisites, ...(focus.prerequisiteAny || []).flat()])]));
        const byLink = new Map(links.map(link => [link.from + '|' + link.to, link]));
        assert.equal(byLink.size, [...parents.values()].reduce((sum, group) => sum + group.size, 0));
        let local = 0;
        let tight = 0;
        for (const [index, focus] of tree.entries()) {
            const card = positions[focus.id];
            assert.ok(card.left >= 0 && card.left + cardWidth <= layout.width);
            assert.ok(card.top >= 0 && card.top + cardHeight <= layout.height);
            for (const other of tree.slice(index + 1)) {
                const neighbor = positions[other.id];
                assert.ok(Math.abs(card.left - neighbor.left) >= cardWidth || Math.abs(card.top - neighbor.top) >= cardHeight,
                    `${focus.id} overlaps ${other.id}`);
            }
            for (const parentId of parents.get(focus.id)) {
                const link = byLink.get(parentId + '|' + focus.id);
                assert.ok(link, `${parentId} → ${focus.id} is drawn`);
                assert.equal(link.optional, !focus.prerequisites.includes(parentId));
                const parent = positions[parentId];
                assert.ok(parent.row < card.row, `${parentId} → ${focus.id} goes downward`);
                if (link.crossBranch) {
                    assert.notEqual(byId.get(parentId).branch, focus.branch);
                    assert.ok(references.get(parentId).after.includes(focus.id));
                    crossBranchLinks++;
                } else {
                    local++;
                    if (card.row - parent.row === 1) tight++;
                }
                let x = parent.centerX;
                let y = parent.bottomY;
                for (const [, command, value] of link.path.matchAll(/([HV]) (-?[\d.]+)/g)) {
                    const nextX = command === 'H' ? Number(value) : x;
                    const nextY = command === 'V' ? Number(value) : y;
                    assert.ok(y <= nextY);
                    for (const other of Object.values(positions)) {
                        const intersects = Math.min(x, nextX) < other.left + cardWidth && Math.max(x, nextX) > other.left
                            && y < other.bottomY && nextY > other.topY;
                        assert.ok(!intersects, `${parentId} → ${focus.id} crosses a card`);
                    }
                    x = nextX;
                    y = nextY;
                }
                assert.equal(x, card.centerX);
                assert.equal(y, card.topY);
            }
        }
        assert.ok(tight / local >= .95, `${factionId} keeps its local runs compact`);

        const political = sections.find(section => section.entryId.endsWith('_commit'));
        const isolated = WestRussiaFocusLayout.build(tree, factionId, political.name);
        assert.equal(isolated.sections.length, 1);
        assert.equal(Object.keys(isolated.positions).length, political.positions.length);
        assert.ok(isolated.links.every(link => !link.crossBranch));
        for (const { id } of political.positions) {
            assert.deepEqual(isolated.references.get(id), references.get(id));
        }
    }
    assert.equal(silhouettes.size, GameState.factions.length);
    assert.equal(crossBranchLinks, 413, 'conditional economic and military projects retain their cross-branch connections');
});

test('a conquest focus becomes available after taking its province and applies the local project', () => {
    const { GameState, MapData, SimultaneousTurns, GameAI, app } = gameClient();
    GameState.initLocalLobby('west-russia');
    GameState.takeSlot('SAM');
    GameState.addAiToSlot('TAT', 'very_easy');
    GameState.startGameSession();
    GameState.game.currentTurn = 4;
    const focus = GameState.getFocusById('wr_sam_cheboksaryBridgehead');
    const province = MapData.getNode('WR_CEB');
    GameState.game.completedFocuses = [...focus.prerequisites];
    assert.equal(GameState.getFocusStatus(focus), 'territory-blocked');
    assert.equal(app.getFocusAdvanceAvailability(focus.id).reason, '需控制所列省区');
    assert.equal(GameAI.aiAdvanceFocus('SAM', focus, null, { free: true }), false);
    SimultaneousTurns.mergePlanningSnapshots([{ factionId: 'SAM', completedFocuses: [focus.id], focusProgress: { [focus.id]: 2 } }]);
    assert.equal(GameState.game.completedFocuses.includes(focus.id), false);
    assert.equal(GameState.getFocusProgress(focus.id), 0);

    province.factionId = 'SAM';
    const industry = province.industry;
    assert.equal(GameState.getFocusStatus(focus), 'available');
    for (let i = 0; i < GameState.getFocusRequiredProgress(focus); i++) {
        GameState.game.playerResources.pp = GameState.getEffectivePPCap();
        app.advanceFocus(focus.id);
    }
    assert.equal(GameState.getFocusStatus(focus), 'done');
    assert.equal(province.industry, industry + 1);
});

test('preparation permits friendly movement and blocks cross-border orders through the host resolver', () => {
    const { GameState, MapData, SimultaneousTurns, GameAI, app } = gameClient();
    GameState.initLocalLobby('west-russia');
    GameState.addAiToSlot('KOM', 'very_easy');
    GameState.startGameSession();

    const friendly = { sourceId: 'WR_UKH', targetId: 'WR_LSH', amount: 1, kind: 'move' };
    const attack = { sourceId: 'WR_UKH', targetId: 'WR_KNY', amount: 4, kind: 'attack' };
    assert.equal(MapData.getAttackTargets(attack.sourceId, 'WRF').length, 0);
    assert.equal(SimultaneousTurns.addOrder(attack), null);
    assert.ok(SimultaneousTurns.addOrder(friendly));
    assert.equal(SimultaneousTurns.buildAiPlan('KOM').orders.some(order => order.kind === 'attack'), false);

    const wartime = GameState.getFocusById('wr_wrf_whiteSeaRenewal');
    assert.equal(GameState.getFocusStatus(wartime), 'phase-blocked');
    assert.equal(app.getFocusAdvanceAvailability(wartime.id).reason, '战斗期开放');
    assert.equal(GameAI.aiAdvanceFocus('WRF', wartime, null, { free: true }), false);

    const localPlan = SimultaneousTurns.snapshotLocalPlan(true);
    // The host must check the target owner even when an incoming packet claims a friendly move.
    localPlan.orders.push({ ...attack, kind: 'move' });
    const foreignWartimeId = GameState.getFocusTree('KOM').find(focus => focus.wartime && focus.category !== 'politics').id;
    localPlan.completedFocuses.push(wartime.id, foreignWartimeId);
    localPlan.focusProgress[wartime.id] = 2;
    localPlan.focusProgress[foreignWartimeId] = 2;
    const hostileProvince = MapData.getNode(attack.targetId);
    const ownerBefore = hostileProvince.factionId;
    assert.equal(SimultaneousTurns.resolveTurn(app), true);
    assert.equal(GameState.game.lastResolutionReport.movements.some(move => move.targetId === attack.targetId), false);
    assert.equal(GameState.game.lastResolutionReport.movements.some(move => move.targetId === friendly.targetId), true);
    assert.equal(hostileProvince.factionId, ownerBefore);
    assert.equal(GameState.game.completedFocuses.includes(wartime.id), false);
    assert.equal(GameState.getFocusProgress(wartime.id), 0);
    assert.equal(GameState.game.completedFocuses.includes(foreignWartimeId), false);
    assert.equal(GameState.getFocusProgress(foreignWartimeId), 0);
    assert.equal(GameState.isWarOpen(), false);
    for (let turn = 2; turn <= 3; turn++) {
        app.resolutionAnimation = null;
        SimultaneousTurns.snapshotLocalPlan(true);
        assert.equal(SimultaneousTurns.resolveTurn(app), true);
    }
    app.resolutionAnimation = null;
    assert.equal(GameState.game.currentTurn, 4);
    assert.equal(GameState.getCampaignStage().label, '战斗期 · 大动乱');
    assert.ok(MapData.getAttackTargets(attack.sourceId, 'WRF').some(node => node.id === attack.targetId));
    assert.ok(SimultaneousTurns.addOrder(attack));
    assert.equal(GameState.isFocusStageOpen(wartime), true);
});

test('narrative setting is opt-in, stays with the session and unlocks local faction dispatches', () => {
    const { GameState, MapData, app } = gameClient();
    GameState.initLocalLobby('west-russia');
    GameState.setView('lobby');
    assert.equal(GameState.lobby.settings.story, false);
    assert.equal(GameState.updateLobbySetting('story', true), true);
    GameState.takeSlot('KOM');
    GameState.startGameSession();
    assert.equal(GameState.updateLobbySetting('story', false), false, 'room settings freeze during a match');
    assert.equal(GameState.getCampaignStories().length, 2);
    assert.ok(GameState.getCampaignStories().some(entry => entry.id === 'wr_intro_KOM'));
    for (const id of ['report', 'repair', 'assembly', 'centre_commit']) app.advanceFocus('wr_kom_' + id);
    assert.ok(GameState.getCampaignStories().some(entry => entry.id === 'wr_kom_centre_commit'));
    assert.equal(GameState.getFocusStatus(GameState.getFocusById('wr_kom_left_commit')), 'mutually-blocked');
    assert.ok(!GameState.getCampaignStories().some(entry => entry.id === 'wr_smuta'));
    assert.ok(MapData.getNode('WR_SYK').industry > 3);
    app.openCampaignStory('wr_kom_centre_commit');
    assert.equal(GameState.game.selectedStoryId, 'wr_kom_centre_commit');
    assert.ok(GameState.game.readStoryIds.includes('wr_kom_centre_commit'));
    app.closeModals();
    assert.equal(GameState.game.showStoryModal, false);

    GameState.initLocalLobby('west-russia');
    GameState.setView('lobby');
    GameState.updateLobbySetting('story', false);
    GameState.startGameSession();
    assert.equal(GameState.getCampaignStories().length, 0);
    assert.equal(GameState.isWarOpen(), false);
});

test('completing a political route changes the ideology, country name and ongoing bonuses', () => {
    const { GameState, app } = gameClient();
    GameState.initLocalLobby('west-russia');
    GameState.takeSlot('KOM');
    GameState.addAiToSlot('WRF', 'very_easy');
    GameState.startGameSession();
    assert.equal(GameState.getIdeology().id, 'wr_parliament');
    assert.equal(GameState.getIdeologyBonus('moneyIncome'), 0);
    assert.equal(GameState.getIdeologyBonus('ppIncome'), 1.2);
    assert.equal(GameState.getIdeologyBonus('globalAttack'), -0.07);
    GameState.game.currentTurn = 4;
    const research = [
        'report', 'repair', 'assembly', 'centre_commit', 'centre_hearing', 'centre_congress', 'centre_wartime',
        'centre_0_choice', 'centre_0_measure', 'centre_0_project', 'centre_0_charter', 'centre_0_settlement'
    ];
    for (const key of research) {
        const focus = GameState.getFocusById('wr_kom_' + key);
        for (let i = 0; i < GameState.getFocusRequiredProgress(focus); i++) {
            GameState.game.playerResources.pp = GameState.getEffectivePPCap();
            app.advanceFocus(focus.id);
        }
        assert.ok(GameState.game.completedFocuses.includes(focus.id), focus.id);
    }
    assert.equal(GameState.getIdeology().id, 'wr_public_republic');
    assert.equal(GameState.getIdeologyBonus('ppIncome'), 1.8);
    assert.equal(GameState.getIdeologyBonus('moneyIncome'), 0);
    assert.equal(GameState.getIdeologyBonus('globalDefense'), 0);
    assert.equal(GameState.getIdeologyBonus('globalAttack'), -0.06);
    assert.equal(GameState.getIdeologyActionCostDelta('recruit'), 1);
    assert.equal(GameState.getFaction('KOM').name, '西俄罗斯共和国');
    assert.equal(GameState.getFactionName('KOM'), '科米共和政府');
    assert.equal(GameState.getFocusStatus(GameState.getFocusById('wr_kom_centre_1_choice')), 'mutually-blocked');
});

test('both campaigns apply the selected clock to every round and support untimed planning', () => {
    const client = gameClient();
    const { GameState, app } = client;
    let tick;
    client.setInterval = callback => { tick = callback; return 1; };
    app.playResolutionAnimation = () => false;
    app.startTimer();

    for (const [scenarioId, seconds, opponent] of [['america', 60, 'CSA'], ['west-russia', 30, 'KOM']]) {
        app.selectScenario(scenarioId);
        app.setMenuTurnLimit(String(seconds));
        app.startLocalLobby();
        assert.equal(GameState.lobby.settings.turnLimit, String(seconds));
        GameState.addAiToSlot(opponent, 'very_easy');
        GameState.startGameSession();
        assert.equal(GameState.game.timerRemaining, seconds);
        for (let remaining = seconds; remaining > 0; remaining--) tick();
        assert.equal(GameState.game.currentTurn, 2);
        assert.equal(GameState.game.timerRemaining, seconds);

        app.startLocalLobby();
        assert.equal(GameState.updateLobbySetting('turnLimit', '无限'), true);
        GameState.addAiToSlot(opponent, 'very_easy');
        GameState.startGameSession();
        for (let remaining = 301; remaining > 0; remaining--) tick();
        assert.equal(GameState.game.currentTurn, 1);
        assert.equal(GameState.game.timerRemaining, null);
        app.endTurn();
        assert.equal(GameState.game.currentTurn, 2);
        assert.equal(GameState.game.timerRemaining, null);
    }
});

test('West Russia room codes, settings and authoritative snapshots select the same campaign on both clients', async () => {
    const host = gameClient();
    const guest = gameClient();
    const rooms = new Map();
    function connect(client, id) {
        client.Multiplayer.connect = async function () {
            this.transport = {
                openRoom(key) {
                    if (!rooms.has(key)) rooms.set(key, {});
                    const store = rooms.get(key);
                    const clone = value => JSON.parse(JSON.stringify(value));
                    return {
                        canCheckExistence: false,
                        readAll: async () => clone(store),
                        writeRoot: async value => Object.assign(store, clone(value)),
                        writeLobby: async value => { store.lobby = clone(value); },
                        writeState: async value => { store.state = clone(value); },
                        onLobby() {},
                        onState() {},
                        onPlan() {},
                        detach() {}
                    };
                }
            };
            return id;
        };
    }
    connect(host, 'host');
    connect(guest, 'guest');

    const code = await host.Multiplayer.createRoom('房主', { scenarioId: 'west-russia', turnLimit: '90' });
    assert.match(code, /^WR-[A-Z0-9]{6}$/);
    assert.equal(host.GameState.lobby.settings.turnLimit, '90');
    host.GameState.setView('lobby');
    host.GameState.updateLobbySetting('story', true);
    host.Multiplayer.pushLobby();
    const roomKey = 'campaign-v3-' + code;
    assert.equal(rooms.get(roomKey).lobby.scenarioId, 'west-russia');
    assert.equal(rooms.get(roomKey).lobby.settings.story, true);

    await guest.Multiplayer.joinRoom(code.toLowerCase(), '客人');
    assert.equal(guest.GameState.getScenario().id, 'west-russia');
    assert.equal(guest.GameState.getPlayerFactionId(), 'KOM');
    assert.equal(guest.MapData.nodes.length, 93);
    assert.equal(guest.GameState.lobby.settings.story, true);
    assert.equal(guest.GameState.lobby.settings.turnLimit, '90');
    guest.GameState.setView('lobby');
    assert.equal(guest.GameState.updateLobbySetting('story', false), false);

    host.Multiplayer.applyLobbyFromRemote(rooms.get(roomKey).lobby);
    host.app.startMatch();
    await new Promise(resolve => setTimeout(resolve, 110));
    const state = rooms.get(roomKey).state;
    assert.equal(state.scenarioId, 'west-russia');
    assert.equal(state.storyEnabled, true);
    assert.equal(state.turnLimit, '90');
    guest.GameState.lobby.settings.turnLimit = '180';
    assert.equal(guest.Multiplayer.applyStateFromRemote(state), true);
    assert.equal(guest.GameState.game.sessionId, state.sessionId);
    assert.equal(guest.GameState.game.storyEnabled, true);
    assert.equal(guest.GameState.game.timerRemaining, 90);
    guest.GameState.game.timerRemaining = 55;
    assert.equal(guest.Multiplayer.applyStateFromRemote({ ...state, lastUpdate: state.lastUpdate + 1 }), true);
    assert.equal(guest.GameState.game.timerRemaining, 55);
    assert.equal(guest.GameState.getCampaignStage().label, '发育期 1/3');
    assert.ok(guest.GameState.getCampaignStories().some(entry => entry.id === 'wr_intro_KOM'));
    assert.equal(guest.Multiplayer.applyStateFromRemote({ ...state, scenarioId: 'america' }), false);

    host.GameState.game.currentTurn = 4;
    guest.GameState.game.currentTurn = 4;
    guest.GameState.setCurrentIdeology('wr_public_republic');
    const plan = guest.SimultaneousTurns.snapshotLocalPlan(false);
    assert.equal(host.SimultaneousTurns.applyRemotePlan(plan), true);
    assert.equal(host.GameState.getIdeology('KOM').id, 'wr_public_republic');
    host.SimultaneousTurns.mergePlanningSnapshots([plan]);
    host.GameState.game.turnPlans = {};
    assert.equal(host.GameState.getIdeology('KOM').id, 'wr_public_republic');

    const oldCode = await guest.Multiplayer.createRoom('另开一局', { scenarioId: 'america' });
    assert.match(oldCode, /^[A-Z0-9]{6}$/);
    assert.ok(rooms.has('provinces-v1-' + oldCode));
    assert.equal(guest.MapData.nodes.length, 48);
});
