const WestRussiaFocusLayout = (() => {
    const cardWidth = 154;
    const cardHeight = 72;
    const cellWidth = 194;
    const cellHeight = 118;
    const padding = 30;
    const cache = new WeakMap();

    // Neighboring chapters share a wing and can use the same columns at
    // different depths. The order follows each country's political split.
    const wings = {
        WRF: [
            ['dockSounding', 'railInventory', 'ukhtaWells'],
            ['cadres_commit', 'schoolRoster'], ['zhukov_commit', 'shelterMap'],
            ['report', 'continuity_commit', 'dualSignatures', 'westernFiles'],
            ['tukhachevsky_commit', 'staffMap', 'southRailOrder']
        ],
        KOM: [
            ['timberStock', 'ferryPiers', 'countyEnvoys'],
            ['research_commit', 'generators'], ['left_commit', 'shopDelegates'],
            ['report', 'rollBook', 'centre_commit', 'secondSession'],
            ['right_commit', 'guardRoll', 'lostRegistry']
        ],
        VYA: [
            ['ruralCircle', 'localRegisters', 'kadets_commit'],
            ['shulgin_commit', 'crownRoads'], ['report', 'royalAssets', 'solidarists_commit'],
            ['rovs_commit', 'cadetInspection', 'borderPasses'],
            ['oreFloors', 'izhevskLathes', 'eastRailSurvey', 'izhevskCorridor']
        ],
        SAM: [
            ['zykov_commit', 'familyInquiries', 'localPublicOffice'],
            ['officers_commit', 'pressCredentials', 'receivingStations'],
            ['report', 'steel_commit', 'officerTraining', 'crossingOffensive'],
            ['engineWorks', 'ferryChains', 'refineryAudit'], ['oktan_commit', 'ledgerClerks']
        ],
        PRM: [
            ['velimir_commit', 'riverSafety'], ['vagner_commit', 'guardInspectors', 'armsCounting'],
            ['report', 'saltStock', 'depotInventory', 'upperKamaAgency'],
            ['workers_commit', 'mutualAid', 'restoreIdentity'],
            ['engineers_commit', 'engineerRegister', 'shopsSurvey']
        ],
        ONE: [
            ['iceChart', 'patrol_commit', 'beachScouts', 'coastalDirective'],
            ['report', 'aidManifest', 'treaty_commit', 'inspectWinterStores'],
            ['autonomy_commit', 'lakeTownCouncil', 'lakeMaps', 'admitBorderTowns'],
            ['harbor_commit', 'dryDocks', 'woodsleds', 'saltAndRye']
        ],
        GOR: [
            ['workers_commit', 'factoryDelegates', 'machinistApprentices'],
            ['report', 'powerCycle', 'armor_commit', 'serviceableHull', 'factoryOffensiveOrder'],
            ['river_commit', 'crossingMap', 'rifleInventory'],
            ['veterans_commit', 'pensionBook', 'forestRoads', 'acquireSparePlants']
        ],
        VOL: [
            ['schools_commit', 'reopenClassrooms'], ['municipal_commit', 'workshopFurnaces', 'countyMeetings'],
            ['report', 'borderLedger', 'shelterRegisters', 'emergencyTrainLabel'],
            ['neutrality_commit', 'stationMilitia', 'sidingsAtVologda'],
            ['coops_commit', 'seedWarehouse', 'neighborEmergencyFiles']
        ],
        GEO: [
            ['law_commit', 'civilJudge'], ['parishes_commit', 'parishLedgers', 'villageSeedLoans'],
            ['report', 'landingFees', 'warningBells', 'landAdmission'],
            ['order_commit', 'bridgeOath', 'countSupplyLoads', 'riverRecoveryOrder'],
            ['forestry_commit', 'timberSurvey']
        ],
        TAT: [
            ['federation_commit', 'townAccords', 'forestSurveyors'],
            ['assembly_commit', 'translationDesk'],
            ['report', 'riverBook', 'loadingUnion', 'newRiverTowns', 'regionalEnergyReport'],
            ['guard_commit', 'ferryWatch'], ['union_commit', 'nurlatWells', 'zelenodolskYards']
        ],
        BSH: [
            ['farm_commit', 'farmDelegates'], ['home_commit', 'districtRequests', 'handoverCouriers'],
            ['report', 'mountains_commit', 'ridgeGuides', 'reserveRolls', 'shelterDepots', 'outwardRidgePlan'],
            ['oil_commit', 'oilLedgers', 'marketCrossingHours'], ['riverCrossings', 'ironOreSurvey']
        ]
    };

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

    function packWing(chapters) {
        const occupied = new Set();
        const placed = [];
        let left = 0;
        let right = 0;
        // Place the main route first, then tuck related work into its free slots.
        for (const chapter of [...chapters].sort((a, b) => b.positions.length - a.positions.length)) {
            const width = Math.max(...chapter.positions.map(node => node.column)) + 1;
            const aim = (left + right - width) / 2;
            let offset = left - width;
            let best = Infinity;
            for (let x = left - width; x <= right; x++) {
                if (chapter.positions.some(node => occupied.has((x + node.column) + ',' + node.row))) continue;
                const span = Math.max(right, x + width) - Math.min(left, x);
                const score = span * 4 + Math.abs(x - aim);
                if (score < best) {
                    offset = x;
                    best = score;
                }
            }
            const positions = chapter.positions.map(node => ({ ...node, column: node.column + offset }));
            for (const node of positions) occupied.add(node.column + ',' + node.row);
            placed.push({ ...chapter, positions });
            left = Math.min(left, offset);
            right = Math.max(right, offset + width);
        }
        return { placed, left, width: right - left };
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
        const prefix = `wr_${factionId.toLowerCase()}_`;
        const branches = new Map();
        for (const node of nodes) {
            if (!branches.has(node.branch)) branches.set(node.branch, []);
            branches.get(node.branch).push(node);
        }
        const chapters = new Map([...branches.values()].map(group => {
            const root = group[0];
            return [root.id.slice(prefix.length), {
                name: root.branch, category: root.category, entryId: root.id,
                positions: chapterColumns(group, rows, localParents, localChildren)
            }];
        }));
        const plan = onlyBranch ? [] : wings[factionId];
        const assigned = new Set(plan.flat());
        const groups = [...plan, ...[...chapters.keys()].filter(key => !assigned.has(key)).map(key => [key])];
        const positions = {};
        const sections = [];
        let columns = 0;
        for (const group of groups) {
            const cluster = packWing(group.map(key => chapters.get(key)).filter(Boolean));
            for (const chapter of cluster.placed) {
                for (const { id, column, row } of chapter.positions) {
                    const col = columns + column - cluster.left;
                    const left = padding + col * cellWidth;
                    const top = padding + row * cellHeight;
                    positions[id] = { left, top, topY: top, bottomY: top + cardHeight, centerX: left + cardWidth / 2,
                        centerY: top + cardHeight / 2, row, column: col };
                }
                sections.push(chapter);
            }
            columns += cluster.width;
        }
        const width = padding * 2 + (columns - 1) * cellWidth + cardWidth;
        const height = padding * 2 + Math.max(...rows.values()) * cellHeight + cardHeight;
        const layout = { positions, sections, references, links: routeLinks(links, positions), width, height, cardWidth, cardHeight };
        layouts.set(onlyBranch, layout);
        return layout;
    }

    return { build };
})();
