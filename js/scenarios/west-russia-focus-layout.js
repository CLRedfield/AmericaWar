const WestRussiaFocusLayout = (() => {
    const cardWidth = 190;
    const cardHeight = 150;
    const cellWidth = 230;
    const cellHeight = 198;
    const padding = 54;
    const cache = new WeakMap();

    // The opening crowns the political choices. Economic and military projects
    // form independent wings; only genuine political succession crosses chapters.
    const categoryOrder = ['politics', 'industry', 'military', 'logistics', 'civil', 'diplomacy', 'integration'];

    function rankFocuses(nodes, links, localParents, localChildren) {
        let rows = new Map(nodes.map(({ id }) => [id, 0]));
        const constraints = new Map(nodes.map(({ id }) => [id, []]));
        for (const { from, to } of links) constraints.get(from).push([to, 1]);
        for (const { id } of [...nodes].sort((a, b) => a.y - b.y)) {
            for (const [child, gap] of constraints.get(id)) rows.set(child, Math.max(rows.get(child), rows.get(id) + gap));
        }

        // Keep the critical path short while tightening runs. Each proposed
        // bound is retained only if every prerequisite still flows downward.
        const lastRow = Math.max(...rows.values());
        const sameBranch = links.filter(link => !link.crossBranch);
        const straight = sameBranch.filter(({ from, to }) => localChildren.get(from).length === 1 && localParents.get(to).length === 1);
        for (const [limit, candidates] of [[1, straight], [2, sameBranch], [1, sameBranch]]) {
            for (const { from, to } of candidates) {
                const bound = [from, -limit];
                constraints.get(to).push(bound);
                if (rows.get(to) - rows.get(from) <= limit) continue;
                const next = new Map(rows);
                const queue = [to];
                let valid = true;
                for (let i = 0; i < queue.length && valid; i++) {
                    for (const [id, gap] of constraints.get(queue[i])) {
                        const row = next.get(queue[i]) + gap;
                        if (row <= next.get(id)) continue;
                        if (row > lastRow) {
                            valid = false;
                            break;
                        }
                        next.set(id, row);
                        queue.push(id);
                    }
                }
                if (valid) rows = next;
                else constraints.get(to).pop();
            }
        }
        return rows;
    }

    function chapterColumns(nodes, rows, localParents, localChildren) {
        const byId = new Map(nodes.map(focus => [focus.id, focus]));
        const columns = new Map();
        const occupied = new Set();
        for (const focus of [...nodes].sort((a, b) => rows.get(a.id) - rows.get(b.id))) {
            if (columns.has(focus.id)) continue;
            const run = [focus];
            let current = focus;
            while (localChildren.get(current.id).length === 1) {
                const next = byId.get(localChildren.get(current.id)[0]);
                if (localParents.get(next.id).length !== 1) break;
                run.push(next);
                current = next;
            }
            const lanes = run.map(node => node.x).sort((a, b) => a - b);
            const preferred = lanes[Math.floor(lanes.length / 2)];
            const free = column => run.every(({ id }) => !occupied.has(column + ',' + rows.get(id)));
            let column = preferred;
            for (let offset = 1; !free(column); offset++) {
                column = free(preferred - offset) ? preferred - offset : preferred + offset;
            }
            for (const { id } of run) {
                columns.set(id, column);
                occupied.add(column + ',' + rows.get(id));
            }
        }
        const lanes = [...new Set(columns.values())].sort((a, b) => a - b);
        const laneIndex = new Map(lanes.map((lane, index) => [lane, index]));
        return nodes.map(({ id }) => ({ id, column: laneIndex.get(columns.get(id)), row: rows.get(id) }));
    }

    function compressColumns(positions) {
        // Preserve authored lane order and straight runs, but remove columns that
        // are only used by a stem. A stem between two adjacent arms sits at .5.
        const lanes = [...new Set(positions.map(node => node.column))].sort((a, b) => a - b);
        const index = new Map(lanes.map((lane, i) => [lane, i]));
        const gaps = lanes.map(() => []);
        for (let i = 0; i < lanes.length - 1; i++) gaps[i].push([i + 1, 0]);
        const levels = new Map();
        for (const node of positions) {
            if (!levels.has(node.row)) levels.set(node.row, []);
            levels.get(node.row).push(index.get(node.column));
        }
        for (const level of levels.values()) {
            const ordered = [...new Set(level)].sort((a, b) => a - b);
            for (let i = 0; i < ordered.length - 1; i++) gaps[ordered[i]].push([ordered[i + 1], 1]);
        }
        const lower = lanes.map(() => 0);
        for (let i = 0; i < lanes.length; i++) for (const [next, gap] of gaps[i]) {
            lower[next] = Math.max(lower[next], lower[i] + gap);
        }
        const upper = lanes.map(() => lower.at(-1));
        for (let i = lanes.length - 1; i >= 0; i--) for (const [next, gap] of gaps[i]) {
            upper[i] = Math.min(upper[i], upper[next] - gap);
        }
        const columns = lower.map((value, i) => (value + upper[i]) / 2);
        return positions.map(node => ({ ...node, column: columns[index.get(node.column)] }));
    }

    function politicalColumns(nodes, rows) {
        const policies = nodes.filter(node => /_\d+_choice$/.test(node.id));
        if (!policies.length || !nodes.some(node => node.id.endsWith('_commit'))) return null;
        const parallel = policies.some(node => {
            const prefix = node.id.slice(0, -'choice'.length);
            return rows.get(prefix + 'measure') === rows.get(prefix + 'project');
        });
        const armWidth = parallel ? 2 : 1;
        const center = (policies.length * armWidth - 1) / 2;
        const hearing = nodes.find(node => node.id.endsWith('_hearing'));
        const mandate = nodes.find(node => node.id.endsWith('_mandate'));
        const chamberFork = hearing && mandate && rows.get(hearing.id) === rows.get(mandate.id);
        return nodes.map(node => {
            const arm = node.id.match(/_(\d+)_(choice|measure|project|charter|settlement)$/);
            let column = center;
            if (arm) {
                const base = Number(arm[1]) * armWidth;
                column = base + (armWidth - 1) / 2;
                if (parallel && arm[2] === 'measure') column = base;
                if (parallel && arm[2] === 'project') column = base + 1;
            } else if (chamberFork && node === hearing) column -= .5;
            else if (chamberFork && node === mandate) column += .5;
            return { id: node.id, column, row: rows.get(node.id) };
        });
    }

    function routeLinks(links, positions) {
        const cards = Object.values(positions);
        const clearVertical = (x, top, bottom) => cards.every(card =>
            x <= card.left || x >= card.left + cardWidth || bottom <= card.topY || top >= card.bottomY);
        return links.map(link => {
            const source = positions[link.from];
            const target = positions[link.to];
            const { centerX: sx, bottomY: sy } = source;
            const { centerX: tx, topY: ty } = target;
            const firstY = sy + (link.bridge ? 24 : 18);
            const lastY = ty - 18;
            let path;
            if (sx === tx && clearVertical(sx, sy, ty)) path = `M ${sx} ${sy} V ${ty}`;
            else if (clearVertical(tx, firstY, ty)) path = `M ${sx} ${sy} V ${firstY} H ${tx} V ${ty}`;
            else if (clearVertical(sx, sy, lastY)) path = `M ${sx} ${sy} V ${lastY} H ${tx} V ${ty}`;
            else {
                // Keep long joins in actual empty gutters, including half-column
                // stems; checking pixels also protects adjacent compact arms.
                const candidates = [...new Set(cards.flatMap(card => [card.left - 20, card.left + cardWidth + 20]))]
                    .filter(x => clearVertical(x, firstY, lastY))
                    .sort((a, b) => Math.abs(sx - a) + Math.abs(tx - a) - Math.abs(sx - b) - Math.abs(tx - b));
                const gutter = candidates[0];
                if (gutter == null) throw new Error('No clear focus connector: ' + link.from + ' → ' + link.to);
                path = `M ${sx} ${sy} V ${firstY} H ${gutter} V ${lastY} H ${tx} V ${ty}`;
            }
            return { ...link, path };
        });
    }

    function build(tree, factionId, onlyBranch = null) {
        if (!cache.has(tree)) cache.set(tree, new Map());
        const layouts = cache.get(tree);
        if (layouts.has(onlyBranch)) return layouts.get(onlyBranch);

        const nodes = onlyBranch ? tree.filter(focus => focus.branch === onlyBranch) : tree;
        const visible = new Set(nodes.map(focus => focus.id));
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const references = new Map(tree.map(focus => [focus.id, { before: [], after: [] }]));
        const localParents = new Map(nodes.map(focus => [focus.id, []]));
        const localChildren = new Map(nodes.map(focus => [focus.id, []]));
        const allLinks = [];
        const localLinks = [];
        const externalLinks = [];
        for (const focus of tree) {
            const required = new Set(focus.prerequisites);
            const parents = new Set([...required, ...(focus.prerequisiteAny || []).flat()]);
            for (const parentId of parents) {
                const crossBranch = byId.get(parentId).branch !== focus.branch;
                const link = { from: parentId, to: focus.id, optional: !required.has(parentId), crossBranch };
                allLinks.push(link);
                if (crossBranch) {
                    references.get(parentId).after.push(focus.id);
                    references.get(focus.id).before.push(parentId);
                    externalLinks.push(link);
                } else if (visible.has(parentId) && visible.has(focus.id)) {
                    localLinks.push(link);
                    localParents.get(focus.id).push(parentId);
                    localChildren.get(parentId).push(focus.id);
                }
            }
        }

        const rows = rankFocuses(nodes, localLinks, localParents, localChildren);
        const branches = new Map();
        for (const node of nodes) {
            if (!branches.has(node.branch)) branches.set(node.branch, []);
            branches.get(node.branch).push(node);
        }
        const chapters = [...branches.values()].map((group, order) => {
            const root = group[0];
            const political = politicalColumns(group, rows);
            const portfolio = group.length > 2 && group.every(node => !localParents.get(node.id).length && !localChildren.get(node.id).length);
            const compact = portfolio ? group.map((node, index) => ({ id: node.id, column: index % 2, row: Math.floor(index / 2) }))
                : political || compressColumns(chapterColumns(group, rows, localParents, localChildren));
            const parallel = group.some(node => /_\d+_project$/.test(node.id)
                && rows.get(node.id) === rows.get(node.id.replace(/_project$/, '_measure')));
            const congress = group.find(node => node.id.endsWith('_congress'));
            const chamberChain = group.some(node => /_(hearing|mandate)$/.test(node.id)
                && node.prerequisites.some(id => /_(hearing|mandate)$/.test(id)));
            let shape = portfolio ? 'project-portfolio' : 'project-fork';
            if (political) {
                if (parallel) shape = 'parallel-cabinet';
                else if (congress?.prerequisites.length > 1) shape = 'council-diamond';
                else shape = chamberChain ? 'command-fan' : 'mandate-fork';
            }
            return { name: root.branch, category: root.category, entryId: root.id, order, shape,
                positions: compact, width: Math.max(...compact.map(node => node.column)) + 1,
                height: Math.max(...compact.map(node => node.row)) + 1 };
        });
        const positions = {};
        const sections = [];
        const regions = [];
        const bridges = [];
        let columns = 0;
        const place = (chapter, offset, top, region) => {
            const sectionPositions = chapter.positions.map(({ id, column, row }) => {
                const col = offset + column;
                const actualRow = top + row;
                const left = padding + col * cellWidth;
                const cardTop = padding + actualRow * cellHeight;
                positions[id] = { left, top: cardTop, topY: cardTop, bottomY: cardTop + cardHeight,
                    centerX: left + cardWidth / 2, centerY: cardTop + cardHeight / 2, row: actualRow, column: col };
                return { id, column: col, row: actualRow };
            });
            sections.push({ ...chapter, region, positions: sectionPositions });
        };
        if (onlyBranch) {
            place(chapters[0], 0, 0, chapters[0].category);
        } else {
            const opening = chapters.find(chapter => chapter.positions.some(node => node.id.endsWith('_assembly')));
            const political = chapters.filter(chapter => chapter !== opening && chapter.category === 'politics');
            const left = chapters.filter(chapter => ['industry', 'logistics', 'civil'].includes(chapter.category));
            const right = chapters.filter(chapter => ![opening, ...political, ...left].includes(chapter));
            const projectStage = { industry: 1, logistics: 2, civil: 2, military: 1, diplomacy: 2, integration: 4 };
            const placeWing = (wing, name) => {
                const start = columns;
                for (const chapter of wing.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.order - b.order)) {
                    // Later wartime/reconstruction chapters remain on the same
                    // wing, with a visible phase change rather than identical tops.
                    const root = byId.get(chapter.entryId);
                    const stage = Math.max(projectStage[chapter.category] || 1,
                        root.wartime && !root.id.endsWith('_roster') ? 3 : 0);
                    place(chapter, columns, stage, name);
                    columns += chapter.width;
                }
                regions.push({ id: name, startColumn: start, endColumn: columns });
            };
            placeWing(left, 'home-front');
            const politicalStart = columns;
            const orderedPolitics = [];
            const pending = [...political];
            while (pending.length) {
                const index = pending.findIndex(chapter => {
                    const entry = byId.get(chapter.entryId);
                    return !entry.prerequisites.some(id => id.endsWith('_congress') && pending.some(other =>
                        other.positions.some(node => node.id === id)));
                });
                const chapter = pending.splice(Math.max(0, index), 1)[0];
                const parentId = byId.get(chapter.entryId).prerequisites.find(id => id.endsWith('_congress'));
                const parentIndex = parentId && orderedPolitics.findIndex(other => other.positions.some(node => node.id === parentId));
                if (parentId && parentIndex >= 0) orderedPolitics.splice(parentIndex + 1, 0, chapter);
                else orderedPolitics.push(chapter);
            }
            const offsets = new Map();
            for (const chapter of orderedPolitics) {
                offsets.set(chapter.name, columns);
                columns += chapter.width;
            }
            const assemblyId = opening?.positions.find(node => node.id.endsWith('_assembly'))?.id;
            const openingCenter = politicalStart + (columns - politicalStart - 1) / 2;
            if (opening) place(opening, openingCenter, 0, 'politics');
            const placedPolitics = new Set();
            const placePolitical = chapter => {
                if (placedPolitics.has(chapter.name)) return;
                const entry = byId.get(chapter.entryId);
                const parentId = entry.prerequisites.find(id => id.endsWith('_congress')) || assemblyId;
                const parentChapter = political.find(other => other.positions.some(node => node.id === parentId));
                if (parentChapter) placePolitical(parentChapter);
                const top = parentChapter ? positions[parentId].row + 1 : 3;
                place(chapter, offsets.get(chapter.name), top, 'politics');
                placedPolitics.add(chapter.name);
                const bridge = externalLinks.find(link => link.from === parentId && link.to === chapter.entryId);
                if (bridge) bridges.push({ ...bridge, bridge: true, display: 'political-entry' });
            };
            for (const chapter of orderedPolitics) placePolitical(chapter);
            regions.push({ id: 'politics', startColumn: politicalStart, endColumn: columns, openingId: assemblyId });
            placeWing(right, 'frontier');
        }
        const width = padding * 2 + Math.max(...Object.values(positions).map(node => node.left - padding)) + cardWidth;
        const height = padding * 2 + Math.max(...Object.values(positions).map(node => node.top - padding)) + cardHeight;
        const layout = { structure: 'political-crown', positions, sections, regions, references,
            links: routeLinks([...localLinks, ...bridges], positions), allLinks, externalLinks,
            width, height, cardWidth, cardHeight, cellWidth, cellHeight, padding };
        layouts.set(onlyBranch, layout);
        return layout;
    }

    return { build };
})();
