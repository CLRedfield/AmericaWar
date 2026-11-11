const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .matchAll(/src="(js\/[^"?]+)\?v=/g)].map(([, filename]) => filename);

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
    const client = vm.runInContext('({ GameState, GamePageView, WestRussiaFocusLayout, App })', context);
    client.GameState.initLocalLobby('west-russia');
    client.GameState.startGameSession();
    return client;
}

// Inspect the rendered HTML contract without replacing the production renderer
// or requiring a DOM package. Browser tests cover CSS, hit targets and pixels.
function attributes(markup) {
    return Object.fromEntries([...markup.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
        .map(([, name, , value]) => [name, value]));
}

function elements(html, tag) {
    return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g'))]
        .map(([, opening, contents]) => ({ attrs: attributes(opening), contents }));
}

function hasClass(element, name) {
    return (element.attrs.class || '').split(/\s+/).includes(name);
}

function cards(html) {
    return new Map(elements(html, 'button').filter(element => element.attrs['data-focus-id'])
        .map(element => [element.attrs['data-focus-id'], element]));
}

function mutualGroups(html) {
    return elements(html, 'g').filter(element => element.attrs['data-focus-mutual-group']);
}

function ids(value) {
    return (value || '').trim().split(/\s+/).filter(Boolean);
}

function parentIds(focus) {
    return new Set([...focus.prerequisites, ...(focus.prerequisiteAny || []).flat()]);
}

function render(client, factionId, selectedId, { branchOnly = false, overview = false } = {}) {
    const { GameState, GamePageView, App } = client;
    GameState.game.focusViewFactionId = factionId;
    GameState.game.selectedFocusId = selectedId;
    GameState.game.focusViewSelectedId = selectedId;
    App.focusBranchOnly = branchOnly;
    App.focusTreeOverview = overview;
    App.focusMobileFilter = 'all';
    return GamePageView.renderFocusTreeModal();
}

function renderedEdges(html) {
    return [...html.matchAll(/<path\b([^>]*)\/?\s*>/g)]
        .map(([, opening]) => attributes(opening))
        .filter(attrs => attrs['data-focus-from'])
        .map(attrs => ({
            key: `${attrs['data-focus-from']}|${attrs['data-focus-to']}`,
            optional: (attrs.class || '').split(/\s+/).includes('focus-link-any')
        }));
}

function expectedEdges(tree) {
    const visible = new Set(tree.map(focus => focus.id));
    const byId = new Map(tree.map(focus => [focus.id, focus]));
    return tree.flatMap(focus => [...parentIds(focus)]
        .filter(id => visible.has(id) && byId.get(id).branch === focus.branch).map(id => ({
        key: `${id}|${focus.id}`,
        optional: !focus.prerequisites.includes(id)
    })));
}

function assertSameEdges(html, tree, message) {
    const normalize = edges => Array.from(edges, edge => `${edge.key}|${edge.optional}`).sort();
    assert.deepEqual(normalize(renderedEdges(html)), normalize(expectedEdges(tree)), message);
}

function pathSegments(d) {
    const tokens = d.match(/[A-Za-z]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
    const segments = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i < tokens.length;) {
        const command = tokens[i++];
        assert.ok(['M', 'H', 'V', 'L'].includes(command), `Unsupported bracket command: ${command}`);
        const nextX = command === 'V' ? x : Number(tokens[i++]);
        const nextY = command === 'H' ? y : Number(tokens[i++]);
        assert.ok(Number.isFinite(nextX) && Number.isFinite(nextY), `Invalid bracket path: ${d}`);
        if (command !== 'M') segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
        x = nextX;
        y = nextY;
    }
    return segments;
}

function segmentIntersectsRect(segment, { left, top, width, height }) {
    // Clip a segment against an open rectangle. This covers horizontal,
    // vertical and diagonal strokes; touching the boundary is allowed.
    const epsilon = 0.01;
    const bounds = [
        [segment.x1, segment.x2 - segment.x1, left + epsilon, left + width - epsilon],
        [segment.y1, segment.y2 - segment.y1, top + epsilon, top + height - epsilon]
    ];
    let start = 0;
    let end = 1;
    for (const [origin, delta, minimum, maximum] of bounds) {
        if (delta === 0) {
            if (origin < minimum || origin > maximum) return false;
            continue;
        }
        const enter = (minimum - origin) / delta;
        const leave = (maximum - origin) / delta;
        start = Math.max(start, Math.min(enter, leave));
        end = Math.min(end, Math.max(enter, leave));
        if (start > end) return false;
    }
    return true;
}

test('West Russia full, overview and isolated views draw every real local prerequisite and preserve OR alternatives', () => {
    const client = gameClient();
    const { GameState, WestRussiaFocusLayout } = client;
    GameState.game.completedFocuses.push('wr_one_assembly');
    for (const faction of GameState.factions) {
        const tree = GameState.getFocusTree(faction.id);
        const full = render(client, faction.id, tree[0].id);
        assert.equal(cards(full).size, tree.length, `${faction.id}: every full-tree card is rendered`);
        assertSameEdges(full, tree, `${faction.id}: full tree local prerequisites`);
        assert.equal(renderedEdges(full).some(edge => {
            const [from, to] = edge.key.split('|');
            return GameState.getFocusById(from, faction.id).branch !== GameState.getFocusById(to, faction.id).branch;
        }), false, faction.id + ': full view uses references instead of long cross-branch paths');

        const overview = render(client, faction.id, tree[0].id, { overview: true });
        assertSameEdges(overview, tree, `${faction.id}: overview local prerequisites`);
        const overviewSvg = elements(overview, 'svg').find(element => hasClass(element, 'focus-overview-nodes'));
        assert.ok(overviewSvg, `${faction.id}: overview node layer exists`);
        assert.equal((overviewSvg.contents.match(/<rect\b/g) || []).length, tree.length);

        for (const section of WestRussiaFocusLayout.build(tree, faction.id).sections) {
            const branchTree = tree.filter(focus => focus.branch === section.name);
            const isolated = render(client, faction.id, section.entryId, { branchOnly: true });
            assert.deepEqual([...cards(isolated).keys()].sort(), Array.from(branchTree, focus => focus.id).sort());
            assertSameEdges(isolated, branchTree, `${faction.id}/${section.name}: internal prerequisites`);
        }
    }
});

test('every external West Russia prerequisite is named on its card and has a real clickable detail reference', () => {
    const client = gameClient();
    const { GameState, GamePageView, App } = client;
    GameState.game.completedFocuses.push('wr_one_assembly');
    let externalDependencies = 0;
    for (const faction of GameState.factions) {
        const tree = GameState.getFocusTree(faction.id);
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const fullCards = cards(render(client, faction.id, tree[0].id));
        let navigationChecked = false;
        for (const focus of tree) {
            const expected = [...parentIds(focus)].filter(id => byId.get(id).branch !== focus.branch).sort();
            const card = fullCards.get(focus.id);
            assert.deepEqual(ids(card.attrs['data-focus-external-ids']).sort(), expected,
                focus.id + ': card retains all AND and OR external parents');
            assert.equal(Number(card.attrs['data-focus-external-count']), expected.length);
            if (!expected.length) {
                assert.doesNotMatch(card.contents, /focus-external-label/);
                continue;
            }
            externalDependencies += expected.length;
            assert.match(card.contents, new RegExp('外部前置\\s*' + expected.length));
            const allParents = [...parentIds(focus)];
            assert.equal(GameState.areFocusPrerequisitesMet(focus, allParents), true);
            const requiredExternal = expected.find(id => focus.prerequisites.includes(id));
            if (requiredExternal) assert.equal(GameState.areFocusPrerequisitesMet(focus,
                allParents.filter(id => id !== requiredExternal)), false,
            focus.id + ': an unmet external AND prerequisite still blocks progress');
            const detail = GamePageView.renderFocusDetailPanel(focus, {
                viewFactionId: faction.id, isPlayerView: faction.id === GameState.getPlayerFactionId()
            });
            const summary = elements(detail, 'div').find(element => hasClass(element, 'focus-external-prerequisites'));
            assert.ok(summary, focus.id + ': external requirements are directly visible in its detail panel');
            assert.equal(summary.attrs['data-focus-external-for'], focus.id);
            const destinations = elements(summary.contents, 'button').map(element => element.attrs['data-focus-link-id']).filter(Boolean);
            assert.deepEqual(destinations.sort(), expected, focus.id + ': every external parent is a navigation button');
            if (!navigationChecked) {
                GameState.game.focusViewFactionId = faction.id;
                App.focusBranchOnly = true;
                App.jumpToCampaignFocus(expected[0]);
                const selected = faction.id === GameState.getPlayerFactionId()
                    ? GameState.game.selectedFocusId : GameState.game.focusViewSelectedId;
                assert.equal(selected, expected[0], faction.id + ': external reference opens the actual prerequisite');
                const parentCards = cards(GamePageView.renderFocusTreeModal());
                assert.ok(parentCards.has(expected[0]));
                assert.ok([...parentCards.keys()].every(id => byId.get(id).branch === byId.get(expected[0]).branch));
                navigationChecked = true;
            }
        }
    }
    assert.equal(externalDependencies, 391, 'all external dependencies remain visible as references');
});

test('both campaigns use the same full-size colored card contract and political routes have distinct colors', () => {
    const client = gameClient();
    const { GameState, GamePageView } = client;
    const requiredParts = ['focus-branch', 'focus-title', 'focus-card-row', 'focus-status-pill',
        'focus-progress-mini', 'focus-card-bottom', 'focus-cost'];
    for (const scenario of ['america', 'west-russia']) {
        GameState.initLocalLobby(scenario);
        GameState.startGameSession();
        if (scenario === 'west-russia') GameState.game.completedFocuses.push('wr_one_assembly');
        for (const faction of GameState.factions) {
            const tree = GameState.getVisibleFocusTree(faction.id);
            const rendered = cards(render(client, faction.id, tree[0].id));
            assert.equal(rendered.size, tree.length, faction.id + ': all visible cards remain present');
            const colors = new Map();
            for (const focus of tree) {
                const card = rendered.get(focus.id);
                assert.ok(hasClass(card, 'focus-unified-card'), focus.id + ': shares the full-card renderer');
                assert.match(card.attrs.style, /width: 190px/);
                assert.match(card.attrs.style, /height: 150px/);
                assert.ok(card.attrs['aria-label'], focus.id + ': retains its accessible name');
                assert.equal(card.attrs['aria-pressed'], String(focus.id === tree[0].id));
                for (const part of requiredParts) assert.match(card.contents, new RegExp('class="' + part + '(?:[ "]|$)'),
                    focus.id + ': ' + part + ' remains available');
                assert.doesNotMatch(card.contents, /focus-emblem|focus-plaque/);
                const color = card.attrs.style.match(/--branch-color:\s*([^;]+)/)?.[1];
                assert.ok(color, focus.id + ': carries its branch color');
                if (colors.has(focus.branch)) assert.equal(colors.get(focus.branch), color, focus.branch + ': stable color');
                colors.set(focus.branch, color);
            }
            assert.ok(new Set(colors.values()).size >= 4, faction.id + ': separates the main branches by color');
            if (scenario === 'america') {
                const layout = GamePageView.getFocusTreeLayout(tree);
                const connectorHtml = GamePageView.renderFocusConnectors(tree, layout, tree[0].id);
                const drawn = [...connectorHtml.matchAll(/<path\b([^>]*)\/?\s*>/g)]
                    .map(([, opening]) => attributes(opening))
                    .filter(attrs => (attrs.class || '').split(/\s+/).includes('focus-link'));
                const visible = new Set(tree.map(focus => focus.id));
                const actualDependencies = tree.reduce((total, focus) => total + new Set([
                    ...(focus.prerequisites || []), ...(focus.prerequisiteAny || []).flat()
                ].filter(id => visible.has(id))).size, 0);
                assert.equal(drawn.length, actualDependencies, faction.id + ': all actual American prerequisites remain drawn');
            }
            if (scenario === 'west-russia') {
                const roots = tree.filter(focus => focus.id.endsWith('_commit'));
                const routeColors = roots.map(focus => colors.get(focus.branch));
                assert.equal(new Set(routeColors).size, 4, faction.id + ': four political routes use four colors');
            }
        }
    }
});

test('all factions expose every mutex relation and highlight exactly the selected focus conflicts', () => {
    const client = gameClient();
    const { GameState } = client;
    GameState.game.completedFocuses.push('wr_one_assembly');
    let checkedPairs = 0;
    for (const faction of GameState.factions) {
        const tree = GameState.getFocusTree(faction.id);
        const fullCards = cards(render(client, faction.id, tree[0].id));
        for (const focus of tree) {
            const expected = Array.from(focus.mutuallyExclusive || []).sort();
            const card = fullCards.get(focus.id);
            assert.deepEqual(ids(card.attrs['data-focus-mutual-ids']).sort(), expected,
                `${focus.id}: the rendered card must retain all mutex identities`);
            if (!expected.length) continue;
            checkedPairs += expected.length / 2;
            assert.match(card.contents, /互斥\s*\d+/, `${focus.id}: mutex must have a visible text cue`);
            assert.match(card.attrs['aria-label'], /互斥/, `${focus.id}: mutex must be named for assistive technology`);

            const selectedCards = cards(render(client, faction.id, focus.id));
            const highlighted = [...selectedCards].filter(([, item]) => hasClass(item, 'focus-mutual-target')).map(([id]) => id).sort();
            assert.deepEqual(highlighted, expected, `${focus.id}: only actual conflicts may be highlighted`);
            for (const id of expected) {
                const conflict = selectedCards.get(id);
                assert.equal(conflict.attrs['data-focus-mutual-selected'], 'true');
                assert.match(conflict.attrs['aria-label'], /互斥/);
            }
            assert.ok(!hasClass(selectedCards.get(focus.id), 'focus-mutual-target'), 'A focus cannot conflict with itself');
        }
    }
    assert.equal(checkedPairs, 133, 'The audit covers all current West Russia mutex pairs including the signal dilemma');
});

test('Komi right-wing candidates form one four-way choice in full, overview and isolated views', () => {
    const client = gameClient();
    const expected = [0, 1, 2, 3].map(index => `wr_kom_right_${index}_choice`);
    for (const options of [{}, { overview: true }, { branchOnly: true }]) {
        const html = render(client, 'KOM', expected[0], options);
        const candidateGroups = mutualGroups(html).filter(group => ids(group.attrs['data-focus-mutual-group']).some(id => expected.includes(id)));
        assert.equal(candidateGroups.length, 1, 'Four candidates must not appear as two independent choices');
        assert.deepEqual(ids(candidateGroups[0].attrs['data-focus-mutual-group']).sort(), [...expected].sort());
        assert.match(candidateGroups[0].contents, /四选一/);
    }
});

test('mutual brackets preserve choice semantics and their labels never obscure cards or prerequisite lines', () => {
    const client = gameClient();
    const { GameState, GamePageView, WestRussiaFocusLayout } = client;
    let checkedGroups = 0;
    for (const faction of GameState.factions) {
        const tree = GameState.getFocusTree(faction.id);
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const branchNames = [null, ...new Set(tree.map(focus => focus.branch))];
        for (const branch of branchNames) {
            const visible = branch ? tree.filter(focus => focus.branch === branch) : tree;
            const layout = WestRussiaFocusLayout.build(tree, faction.id, branch);
            const html = GamePageView.renderCampaignFocusLinks(visible, layout, visible[0].id);
            const prerequisiteSegments = [...html.matchAll(/<path\b([^>]*)\/?\s*>/g)]
                .map(([, opening]) => attributes(opening))
                .filter(attrs => attrs['data-focus-from'])
                .flatMap(attrs => pathSegments(attrs.d).map(segment => ({
                    segment, key: `${attrs['data-focus-from']} → ${attrs['data-focus-to']}`
                })));
            for (const group of mutualGroups(html)) {
                checkedGroups++;
                const members = ids(group.attrs['data-focus-mutual-group']);
                assert.ok(members.length >= 2);
                assert.equal(new Set(members).size, members.length);
                for (const id of members) {
                    assert.ok(layout.positions[id], `${id}: mutex group must contain visible nodes`);
                    for (const other of members.filter(item => item !== id)) {
                        assert.ok(byId.get(id).mutuallyExclusive.includes(other), `${id} and ${other} are not exclusive`);
                    }
                }
                const brackets = [...group.contents.matchAll(/<path\b([^>]*)\/?\s*>/g)]
                    .map(([, opening]) => attributes(opening))
                    .filter(attrs => (attrs.class || '').split(/\s+/).includes('focus-mutual-bracket'));
                assert.ok(brackets.length, 'A mutex group must draw a visible bracket');
                for (const bracket of brackets) {
                    const segments = pathSegments(bracket.d);
                    assert.ok(segments.length);
                    for (const segment of segments) {
                        for (const focus of visible) {
                            const card = { ...layout.positions[focus.id], width: layout.cardWidth, height: layout.cardHeight };
                            assert.equal(segmentIntersectsRect(segment, card), false,
                                `${faction.id}/${branch || 'full'}: mutex bracket crosses ${focus.id}`);
                        }
                    }
                }
                const labelBoxes = [...group.contents.matchAll(/<rect\b([^>]*)\/?\s*>/g)]
                    .map(([, opening]) => attributes(opening))
                    .filter(attrs => (attrs.class || '').split(/\s+/).includes('focus-mutual-label-background'));
                for (const label of labelBoxes) {
                    const left = Number(label.x);
                    const top = Number(label.y);
                    const right = left + Number(label.width);
                    const bottom = top + Number(label.height);
                    // Include the active dependency stroke (2.8px wide), not
                    // just its mathematical centreline, in the clearance.
                    const labelRect = { left: left - 2, top: top - 2,
                        width: Number(label.width) + 4, height: Number(label.height) + 4 };
                    for (const focus of visible) {
                        const card = layout.positions[focus.id];
                        const overlap = Math.min(right, card.left + layout.cardWidth) > Math.max(left, card.left)
                            && Math.min(bottom, card.top + layout.cardHeight) > Math.max(top, card.top);
                        assert.equal(overlap, false, `${faction.id}: mutex label obscures ${focus.id}`);
                    }
                    for (const { key, segment } of prerequisiteSegments) {
                        assert.equal(segmentIntersectsRect(segment, labelRect), false,
                            `${faction.id}/${branch || 'full'}: mutex label obscures prerequisite ${key}`);
                    }
                }
            }
        }
    }
    assert.ok(checkedGroups > 0, 'Geometry assertions must exercise real rendered brackets');
});

test('a non-transitive mutex chain and an intervening unrelated card do not become a choice group', () => {
    const { GamePageView, GameState } = gameClient();
    const sample = GameState.getFocusTree('KOM').find(focus => focus.id === 'wr_kom_right_0_choice');
    const node = (id, exclusive) => ({ ...sample, id, mutuallyExclusive: exclusive, prerequisites: [], prerequisiteAny: [] });
    const tree = [node('a', ['b']), node('b', ['a', 'c']), node('c', ['b'])];
    const positions = Object.fromEntries(['a', 'b', 'c'].map((id, column) => {
        const left = 30 + column * 230;
        const top = 228;
        return [id, { left, top, topY: top, bottomY: top + 150, centerX: left + 95, centerY: top + 75, column, row: 1 }];
    }));
    const layout = { positions, links: [], cardWidth: 190, cardHeight: 150, width: 710, height: 410 };
    const html = GamePageView.renderCampaignFocusLinks(tree, layout, 'a');
    assert.equal(mutualGroups(html).length, 0, 'A-B and B-C do not imply A-C or a three-way choice');

    const obstructed = [node('a', ['c']), node('b', []), node('c', ['a'])];
    const obstructedHtml = GamePageView.renderCampaignFocusLinks(obstructed, layout, 'a');
    assert.equal(mutualGroups(obstructedHtml).length, 0, 'An unrelated intervening card cannot be placed inside a choice bracket');
});

test('isolated branches keep cross-branch prerequisite and mutex navigation available', () => {
    const client = gameClient();
    const { GameState } = client;
    const cases = [
        ['WRF', 'wr_wrf_cadres_commit'],
        ['KOM', 'wr_kom_research_commit'],
        ['SAM', 'wr_sam_officers_commit']
    ];
    for (const [factionId, selectedId] of cases) {
        const focus = GameState.getFocusById(selectedId, factionId);
        const html = render(client, factionId, selectedId, { branchOnly: true });
        const panel = elements(html, 'aside').find(element => element.attrs['data-focus-detail-id'] === selectedId);
        assert.ok(panel, `${selectedId}: detail panel exists`);
        const navigation = new Set(elements(panel.contents, 'button').map(element => element.attrs['data-focus-link-id']).filter(Boolean));
        const related = new Set([...parentIds(focus), ...(focus.mutuallyExclusive || [])]);
        for (const id of related) assert.ok(navigation.has(id), `${selectedId}: detail retains navigation to ${id}`);
        for (const id of parentIds(focus)) {
            if (GameState.getFocusById(id, factionId).branch !== focus.branch) {
                assert.ok(!cards(html).has(id), 'A cross-branch prerequisite stays in navigation, not the isolated card set');
            }
        }
    }
});
