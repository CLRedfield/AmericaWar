const WestRussiaFocusLayout = (() => {
    const cardWidth = 190;
    const cardHeight = 150;
    const cellWidth = 230;
    const cellHeight = 198;
    const padding = 54;
    const cache = new WeakMap();

    // Full cards use the same dimensions as the American campaign. A chapter
    // owns its rectangle; unrelated chapters never fill gaps inside it.
    const categoryOrder = ['politics', 'industry', 'logistics', 'military', 'civil', 'diplomacy', 'integration'];
    const boardColumns = 26;

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

    function chapterComponents(chapters, links, branchById) {
        const next = new Map(chapters.map(chapter => [chapter.name, new Set()]));
        for (const link of links) {
            const from = branchById.get(link.from);
            const to = branchById.get(link.to);
            if (from !== to) next.get(from).add(to);
        }
        const indices = new Map();
        const low = new Map();
        const active = new Set();
        const stack = [];
        const groups = [];
        let index = 0;
        function visit(name) {
            indices.set(name, index);
            low.set(name, index++);
            stack.push(name);
            active.add(name);
            for (const other of next.get(name)) {
                if (!indices.has(other)) {
                    visit(other);
                    low.set(name, Math.min(low.get(name), low.get(other)));
                } else if (active.has(other)) low.set(name, Math.min(low.get(name), indices.get(other)));
            }
            if (low.get(name) !== indices.get(name)) return;
            const component = [];
            let member;
            do {
                member = stack.pop();
                active.delete(member);
                component.push(member);
            } while (member !== name);
            groups.push(component);
        }
        for (const chapter of chapters) if (!indices.has(chapter.name)) visit(chapter.name);
        const byName = new Map(chapters.map((chapter, order) => [chapter.name, { ...chapter, order }]));
        const components = groups.map((names, id) => {
            const members = names.map(name => byName.get(name)).sort((a, b) => a.order - b.order);
            const top = Math.min(...members.flatMap(chapter => chapter.positions.map(node => node.row)));
            let column = 0;
            const positions = [];
            for (const chapter of members) {
                const width = Math.max(...chapter.positions.map(node => node.column)) + 1;
                positions.push(...chapter.positions.map(node => ({ ...node, column: node.column + column, row: node.row - top })));
                column += width + 1;
            }
            return { id, members, positions, width: column - 1,
                height: Math.max(...positions.map(node => node.row)) + 1, before: new Set(), after: new Set(),
                priority: Math.min(...members.map(chapter => categoryOrder.indexOf(chapter.category))),
                order: Math.min(...members.map(chapter => chapter.order)) };
        });
        const owner = new Map(components.flatMap(component => component.positions.map(node => [node.id, component.id])));
        for (const link of links) {
            const from = owner.get(link.from);
            const to = owner.get(link.to);
            if (from !== to) {
                components[from].after.add(to);
                components[to].before.add(from);
            }
        }
        return { components, owner };
    }

    function placeChapterBoards(chapters, links, branchById) {
        const { components, owner } = chapterComponents(chapters, links, branchById);
        const limit = Math.max(boardColumns, ...components.map(component => component.width));
        const placed = new Map();
        const rectangles = [];
        const remaining = new Set(components.map(component => component.id));
        const incoming = new Map(components.map(component => [component.id, links.filter(link => owner.get(link.to) === component.id && owner.get(link.from) !== component.id)]));
        while (remaining.size) {
            const ready = [...remaining].map(id => components[id]).filter(component => [...component.before].every(id => !remaining.has(id)))
                .sort((a, b) => a.priority - b.priority || a.order - b.order);
            if (!ready.length) throw new Error('Invalid focus chapter graph');
            const component = ready[0];
            const local = new Map(component.positions.map(node => [node.id, node]));
            const edges = incoming.get(component.id);
            const minimumTop = Math.max(0, ...edges.map(link => placed.get(link.from).row + 1 - local.get(link.to).row));
            const aim = edges.length ? edges.reduce((sum, link) => sum + placed.get(link.from).column - local.get(link.to).column, 0) / edges.length : (limit - component.width) / 2;
            let placement = null;
            for (let row = minimumTop; !placement; row++) {
                const candidates = [];
                for (let column = 0; column + component.width <= limit; column++) {
                    const free = rectangles.every(rect => column >= rect.right || column + component.width + 1 <= rect.left
                        || row >= rect.bottom || row + component.height + 1 <= rect.top);
                    if (free) candidates.push({ row, column });
                }
                placement = candidates.sort((a, b) => Math.abs(a.column - aim) - Math.abs(b.column - aim) || a.column - b.column)[0] || null;
            }
            rectangles.push({ left: placement.column, right: placement.column + component.width + 1,
                top: placement.row, bottom: placement.row + component.height + 1 });
            for (const node of component.positions) placed.set(node.id, {
                column: placement.column + node.column, row: placement.row + node.row
            });
            remaining.delete(component.id);
        }
        // Remove unused outer columns left behind by centering the opening.
        const left = Math.min(...[...placed.values()].map(node => node.column));
        for (const node of placed.values()) node.column -= left;
        return placed;
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
        const references = new Map(tree.map(focus => [focus.id, { after: [] }]));
        const localParents = new Map(nodes.map(focus => [focus.id, []]));
        const localChildren = new Map(nodes.map(focus => [focus.id, []]));
        const links = [];
        for (const focus of tree) {
            const required = new Set(focus.prerequisites);
            const parents = new Set([...required, ...(focus.prerequisiteAny || []).flat()]);
            for (const parentId of parents) {
                const crossBranch = byId.get(parentId).branch !== focus.branch;
                if (crossBranch) references.get(parentId).after.push(focus.id);
                if (!visible.has(parentId) || !visible.has(focus.id)) continue;
                links.push({ from: parentId, to: focus.id, optional: !required.has(parentId), crossBranch });
                if (!crossBranch) {
                    localParents.get(focus.id).push(parentId);
                    localChildren.get(parentId).push(focus.id);
                }
            }
        }

        const rows = rankFocuses(nodes, links, localParents, localChildren);
        const branches = new Map();
        for (const node of nodes) {
            if (!branches.has(node.branch)) branches.set(node.branch, []);
            branches.get(node.branch).push(node);
        }
        const chapters = [...branches.values()].map(group => {
            const root = group[0];
            return { name: root.branch, category: root.category, entryId: root.id,
                positions: chapterColumns(group, rows, localParents, localChildren) };
        });
        const branchById = new Map(nodes.map(node => [node.id, node.branch]));
        const cells = placeChapterBoards(chapters, links, branchById);
        const positions = {};
        for (const [id, { column, row }] of cells) {
            const left = padding + column * cellWidth;
            const top = padding + row * cellHeight;
            positions[id] = { left, top, topY: top, bottomY: top + cardHeight, centerX: left + cardWidth / 2,
                centerY: top + cardHeight / 2, row, column };
        }
        const sections = chapters.map(chapter => ({ ...chapter,
            positions: chapter.positions.map(({ id }) => ({ id, ...cells.get(id) })) }));
        const columns = Math.max(...[...cells.values()].map(node => node.column)) + 1;
        const width = padding * 2 + (columns - 1) * cellWidth + cardWidth;
        const height = padding * 2 + Math.max(...[...cells.values()].map(node => node.row)) * cellHeight + cardHeight;
        const layout = { positions, sections, references, links: routeLinks(links, positions), width, height, cardWidth, cardHeight, cellWidth, cellHeight, padding };
        layouts.set(onlyBranch, layout);
        return layout;
    }

    return { build };
})();
