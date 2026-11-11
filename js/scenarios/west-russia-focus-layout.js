const WestRussiaFocusLayout = (() => {
    const cardWidth = 190;
    const cardHeight = 150;
    const cellWidth = 230;
    const cellHeight = 198;
    const padding = 54;
    const cache = new WeakMap();

    // Every chapter is a complete, top-aligned lane, like the American trees.
    // External requirements are navigable references, not lines across lanes.
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

    function routeLinks(links, positions) {
        const tracks = new Map();
        const trunks = new Map();
        const occupied = new Set(Object.values(positions).map(p => p.column + ',' + p.row));
        const track = (row, x1, x2, key) => {
            if (!tracks.has(row)) tracks.set(row, [[], [], [], [], []]);
            const slots = tracks.get(row);
            const start = Math.min(x1, x2);
            const end = Math.max(x1, x2);
            const overlap = ranges => ranges.reduce((count, [a, b, other]) => count + Number(key !== other && start < b && end > a), 0);
            const index = slots.reduce((best, ranges, i) => overlap(ranges) < overlap(slots[best]) ? i : best, 0);
            slots[index].push([start, end, key]);
            return [23, 15, 31, 7, 39][index];
        };
        const sorted = [...links].sort((a, b) => Number(a.crossBranch) - Number(b.crossBranch)
            || (positions[a.to].row - positions[a.from].row) - (positions[b.to].row - positions[b.from].row));
        return sorted.map(link => {
            const source = positions[link.from];
            const target = positions[link.to];
            const { centerX: sx, bottomY: sy } = source;
            const { centerX: tx, topY: ty } = target;
            const rowsBetween = target.row - source.row - 1;
            const clear = (column) => Array.from({ length: rowsBetween }, (_, i) => source.row + i + 1)
                .every(row => !occupied.has(column + ',' + row));
            let path;
            if (sx === tx && clear(source.column)) {
                path = `M ${sx} ${sy} V ${ty}`;
            } else if (!rowsBetween) {
                const y = sy + track(source.row, sx, tx, link.from + link.optional);
                path = `M ${sx} ${sy} V ${y} H ${tx} V ${ty}`;
            } else if (clear(target.column)) {
                // A clear destination column needs one turn across the gap,
                // rather than a detour into a second vertical gutter.
                const y = sy + track(source.row, sx, tx, link.from + link.optional);
                path = `M ${sx} ${sy} V ${y} H ${tx} V ${ty}`;
            } else if (clear(source.column)) {
                const y = ty - (cellHeight - cardHeight)
                    + track(target.row - 1, sx, tx, link.to + link.optional);
                path = `M ${sx} ${sy} V ${y} H ${tx} V ${ty}`;
            } else {
                // One vertical run in a gutter, with turns between rows.
                const min = Math.min(source.column, target.column);
                const max = Math.max(source.column, target.column);
                const midpoint = (source.column + target.column) / 2;
                let gutter = min - 0.5;
                let best = Infinity;
                for (let column = min - 0.5; column <= max + 0.5; column += 1) {
                    const runs = trunks.get(column) || [];
                    const clashes = runs.filter(([a, b]) => a < target.row && b > source.row).length;
                    const penalty = column < min || column > max ? 2 : 0;
                    const score = clashes * 4 + penalty + Math.abs(column - midpoint);
                    if (score < best) {
                        gutter = column;
                        best = score;
                    }
                }
                if (!trunks.has(gutter)) trunks.set(gutter, []);
                trunks.get(gutter).push([source.row, target.row]);
                const x = padding + cardWidth / 2 + gutter * cellWidth;
                const y1 = sy + track(source.row, sx, x, link.from + link.optional);
                const y2 = ty - (cellHeight - cardHeight) + track(target.row - 1, x, tx, link.to + link.optional);
                path = `M ${sx} ${sy} V ${y1} H ${x} V ${y2} H ${tx} V ${ty}`;
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
            return { name: root.branch, category: root.category, entryId: root.id, order,
                positions: chapterColumns(group, rows, localParents, localChildren) };
        }).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.order - b.order);
        const positions = {};
        const sections = [];
        let columns = 0;
        for (const chapter of chapters) {
            const width = Math.max(...chapter.positions.map(node => node.column)) + 1;
            const sectionPositions = chapter.positions.map(({ id, column, row }) => {
                const col = columns + column;
                const left = padding + col * cellWidth;
                const top = padding + row * cellHeight;
                positions[id] = { left, top, topY: top, bottomY: top + cardHeight, centerX: left + cardWidth / 2,
                    centerY: top + cardHeight / 2, row, column: col };
                return { id, column: col, row };
            });
            sections.push({ ...chapter, positions: sectionPositions });
            columns += width;
        }
        const width = padding * 2 + (columns - 1) * cellWidth + cardWidth;
        const height = padding * 2 + Math.max(...rows.values()) * cellHeight + cardHeight;
        // Only local edges receive screen paths. Keep the complete dependency
        // graph and external links available for inspection and jump controls.
        const layout = { positions, sections, references, links: routeLinks(localLinks, positions), allLinks, externalLinks,
            width, height, cardWidth, cardHeight, cellWidth, cellHeight, padding };
        layouts.set(onlyBranch, layout);
        return layout;
    }

    return { build };
})();
