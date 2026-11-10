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
    return tree.flatMap(focus => [...parentIds(focus)].filter(id => visible.has(id)).map(id => ({
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

test('all West Russia views retain the actual prerequisite edges and optional alternatives', () => {
    const client = gameClient();
    const { GameState, WestRussiaFocusLayout } = client;
    for (const faction of GameState.factions) {
        const tree = GameState.getFocusTree(faction.id);
        const full = render(client, faction.id, tree[0].id);
        assert.equal(cards(full).size, tree.length, `${faction.id}: every full-tree card is rendered`);
        assertSameEdges(full, tree, `${faction.id}: full tree prerequisites`);

        const overview = render(client, faction.id, tree[0].id, { overview: true });
        assertSameEdges(overview, tree, `${faction.id}: overview prerequisites`);
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

test('all factions expose every mutex relation and highlight exactly the selected focus conflicts', () => {
    const client = gameClient();
    const { GameState } = client;
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
    assert.equal(checkedPairs, 131, 'The audit covers all current West Russia mutex pairs');
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
        const left = 30 + column * 194;
        const top = 148;
        return [id, { left, top, topY: top, bottomY: top + 72, centerX: left + 77, centerY: top + 36, column, row: 1 }];
    }));
    const layout = { positions, links: [], cardWidth: 154, cardHeight: 72, width: 602, height: 250 };
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
