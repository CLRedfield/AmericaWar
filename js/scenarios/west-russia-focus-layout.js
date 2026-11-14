const WestRussiaFocusLayout = (() => {
    const cardWidth = 190;
    const cardHeight = 150;
    const cellWidth = 230;
    const cellHeight = 198;
    const padding = 64;
    const cache = new WeakMap();

    function rankFocuses(nodes, links, localParents, localChildren) {
        let rows = new Map(nodes.map(({ id }) => [id, 0]));
        const constraints = new Map(nodes.map(({ id }) => [id, []]));
        for (const { from, to } of links) constraints.get(from).push([to, 1]);
        for (const { id } of [...nodes].sort((a, b) => a.y - b.y)) {
            for (const [child, gap] of constraints.get(id)) rows.set(child, Math.max(rows.get(child), rows.get(id) + gap));
        }

        const lastRow = Math.max(...rows.values(), 0);
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

    function normalizePositions(positions) {
        const minCol = Math.min(...positions.map(node => node.column));
        const minRow = Math.min(...positions.map(node => node.row));
        return positions.map(node => ({
            id: node.id,
            column: Number((node.column - minCol).toFixed(3)),
            row: node.row - minRow
        }));
    }

    function sculptPoliticalChapter(nodes, rows) {
        const policies = nodes.filter(node => /_\d+_choice$/.test(node.id));
        if (!policies.length || !nodes.some(node => node.id.endsWith('_commit'))) return null;
        const motif = nodes.find(node => node.motif)?.motif || 'dome';
        const k = policies.length;
        const parallel = policies.some(node => {
            const prefix = node.id.slice(0, -'choice'.length);
            return rows.get(prefix + 'measure') === rows.get(prefix + 'project');
        });
        const hearing = nodes.find(node => node.id.endsWith('_hearing'));
        const mandate = nodes.find(node => node.id.endsWith('_mandate'));
        const chamberFork = hearing && mandate && rows.get(hearing.id) === rows.get(mandate.id);

        if (k === 3) {
            // 3-arm Parliamentary Dome (e.g. Komi Centre)
            const center = 2.5;
            const placed = nodes.map(node => {
                const arm = node.id.match(/_(\d+)_(choice|measure|project|charter|settlement)$/);
                let column = center;
                if (arm) {
                    const idx = Number(arm[1]);
                    const part = arm[2];
                    if (part === 'choice') column = [0.5, 2.5, 4.5][idx];
                    else if (part === 'measure') column = parallel ? idx * 2 : [0.5, 2.5, 4.5][idx];
                    else if (part === 'project') column = parallel ? idx * 2 + 1 : [0.5, 2.5, 4.5][idx];
                    else if (part === 'charter') column = [0.5, 2.5, 4.5][idx];
                    else if (part === 'settlement') column = [1.0, 2.5, 4.0][idx];
                } else if (chamberFork && node === hearing) column = 1.0;
                else if (chamberFork && node === mandate) column = 4.0;
                return { id: node.id, column, row: rows.get(node.id) };
            });
            return { shape: 'parliament-dome-3', positions: normalizePositions(placed) };
        }

        if (k >= 4) {
            // 4-arm Giant Fan (e.g. Komi Right-Wing)
            const center = 3.0;
            const placed = nodes.map(node => {
                const arm = node.id.match(/_(\d+)_(choice|measure|project|charter|settlement)$/);
                let column = center;
                if (arm) {
                    const idx = Number(arm[1]);
                    const part = arm[2];
                    const table = {
                        choice: [0.6, 2.2, 3.8, 5.4],
                        measure: [0.3, 2.1, 3.9, 5.7],
                        project: [0.0, 2.0, 4.0, 6.0],
                        charter: [0.3, 2.1, 3.9, 5.7],
                        settlement: [0.6, 2.2, 3.8, 5.4]
                    };
                    column = (table[part] || table.choice)[idx] ?? idx * 1.8;
                } else if (chamberFork && node === hearing) column = 2.0;
                else if (chamberFork && node === mandate) column = 4.0;
                return { id: node.id, column, row: rows.get(node.id) };
            });
            return { shape: 'giant-fan-4', positions: normalizePositions(placed) };
        }

        // 2-arm sculpted architectural motifs
        const profiles = {
            pyramid: {
                center: 2.0,
                chamber: [1.2, 2.8],
                choice: [1.2, 2.8],
                measure: parallel ? [0.3, 3.7] : [0.9, 3.1],
                project: parallel ? [1.4, 2.6] : [0.5, 3.5],
                charter: [0.2, 3.8],
                settlement: [0.0, 4.0]
            },
            wedge: {
                center: 2.0,
                chamber: [0.0, 4.0],
                choice: [0.0, 4.0],
                measure: parallel ? [0.4, 3.6] : [0.5, 3.5],
                project: parallel ? [1.4, 2.6] : [1.0, 3.0],
                charter: [1.3, 2.7],
                settlement: [1.5, 2.5]
            },
            cross: {
                center: 2.0,
                chamber: [1.5, 2.5],
                choice: [1.0, 3.0],
                measure: parallel ? [0.0, 4.0] : [0.0, 4.0],
                project: parallel ? [1.0, 3.0] : [1.2, 2.8],
                charter: [1.5, 2.5],
                settlement: [1.5, 2.5]
            },
            scepter: {
                center: 2.0,
                chamber: [1.5, 2.5],
                choice: [1.2, 2.8],
                measure: parallel ? [0.0, 4.0] : [0.2, 3.8],
                project: parallel ? [1.1, 2.9] : [0.8, 3.2],
                charter: [0.6, 3.4],
                settlement: [1.2, 2.8]
            },
            dome: {
                center: 2.0,
                chamber: [0.6, 3.4],
                choice: [0.6, 3.4],
                measure: parallel ? [0.0, 4.0] : [0.2, 3.8],
                project: parallel ? [1.2, 2.8] : [0.6, 3.4],
                charter: [0.6, 3.4],
                settlement: [1.2, 2.8]
            },
            obelisk: {
                center: 1.8,
                chamber: [1.3, 2.3],
                choice: [1.3, 2.3],
                measure: parallel ? [0.2, 3.4] : [1.3, 2.3],
                project: parallel ? [1.2, 2.4] : [0.0, 3.6],
                charter: [1.3, 2.3],
                settlement: [1.3, 2.3]
            },
            derrick: {
                center: 2.0,
                chamber: [1.4, 2.6],
                choice: [1.1, 2.9],
                measure: parallel ? [0.4, 3.6] : [0.8, 3.2],
                project: parallel ? [1.4, 2.6] : [0.5, 3.5],
                charter: [0.2, 3.8],
                settlement: [0.0, 4.0]
            },
            fan: {
                center: 2.0,
                chamber: [0.8, 3.2],
                choice: [1.2, 2.8],
                measure: parallel ? [0.2, 3.8] : [0.4, 3.6],
                project: parallel ? [1.3, 2.7] : [0.0, 4.0],
                charter: [0.6, 3.4],
                settlement: [1.2, 2.8]
            }
        };
        const spec = profiles[motif] || profiles.dome;
        const placed = nodes.map(node => {
            const arm = node.id.match(/_(\d+)_(choice|measure|project|charter|settlement)$/);
            let column = spec.center;
            if (arm) {
                const idx = Number(arm[1]);
                const part = arm[2];
                column = spec[part][idx];
            } else if (chamberFork && node === hearing) column = spec.chamber[0];
            else if (chamberFork && node === mandate) column = spec.chamber[1];
            else if (!chamberFork && motif === 'wedge' && node === hearing) column = 1.4;
            else if (!chamberFork && motif === 'wedge' && node === mandate) column = 2.6;
            return { id: node.id, column, row: rows.get(node.id) };
        });
        return { shape: 'political-' + motif, positions: normalizePositions(placed) };
    }

    function sculptPortfolio(nodes, crestStyle = 'arch') {
        const patterns = {
            arch: [[0, 1], [1, 0], [2, 0], [3, 1], [1.5, 2]],
            chevron: [[0, 0], [1, 1], [2, 1], [3, 0], [1.5, 2]],
            diamond: [[1, 0], [0, 1], [2, 1], [1, 2], [1, 3]],
            rampart: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
            pillar: [[0.5, 0], [0, 1], [1, 1], [0.5, 2], [0.5, 3]],
            stepLeft: [[0, 0], [1, 0], [0.5, 1], [1.5, 1], [1, 2]],
            stepRight: [[0.5, 0], [1.5, 0], [0, 1], [1, 1], [0.5, 2]]
        };
        const coords = patterns[crestStyle] || patterns.arch;
        const placed = nodes.map((node, index) => {
            const c = coords[index] || [index % 2, Math.floor(index / 2)];
            return { id: node.id, column: c[0], row: c[1] };
        });
        return { shape: 'crest-' + crestStyle, positions: normalizePositions(placed) };
    }

    function sculptSupportChapter(nodes, rows, localParents, localChildren, style = 'wide') {
        if (nodes.some(node => node.id.endsWith('_zeroListen'))) {
            const bySuffix = suffix => nodes.find(node => node.id.endsWith(suffix));
            const placed = [
                bySuffix('_zeroListen') && { id: bySuffix('_zeroListen').id, column: 1.0, row: 0 },
                bySuffix('_zeroSeal') && { id: bySuffix('_zeroSeal').id, column: 0.0, row: 1 },
                bySuffix('_zeroReply') && { id: bySuffix('_zeroReply').id, column: 2.0, row: 1 },
                bySuffix('_zeroBroadcast') && { id: bySuffix('_zeroBroadcast').id, column: 2.4, row: 2 }
            ].filter(Boolean);
            return { shape: 'abyss-trench', positions: normalizePositions(placed) };
        }

        const base = chapterColumns(nodes, rows, localParents, localChildren);
        const normalizedBase = normalizePositions(base);
        if (style === 'compact') {
            return { shape: 'support-compact', positions: normalizePositions(compressColumns(normalizedBase)) };
        }

        const maxCol = Math.max(...normalizedBase.map(node => node.column), 0);
        const maxRow = Math.max(...normalizedBase.map(node => node.row), 1);
        const byRow = new Map();
        for (const item of normalizedBase) {
            if (!byRow.has(item.row)) byRow.set(item.row, []);
            byRow.get(item.row).push(item);
        }

        let placed = normalizedBase.map(item => ({ ...item }));
        if (style === 'arrowhead') {
            const mid = maxCol / 2;
            placed = placed.map(item => {
                const rowItems = byRow.get(item.row);
                if (rowItems.length === 1) return { ...item, column: mid };
                const flare = item.row >= 1 && item.row <= maxRow - 1 ? 0.3 : 0;
                const shift = item.column < mid ? -flare : item.column > mid ? flare : 0;
                return { ...item, column: item.column + shift };
            });
            return { shape: 'support-arrowhead', positions: normalizePositions(placed) };
        }

        if (style === 'diamond') {
            const compact = normalizePositions(compressColumns(normalizedBase));
            const cMid = Math.max(...compact.map(n => n.column), 0) / 2;
            const cMaxRow = Math.max(...compact.map(n => n.row), 1);
            placed = compact.map(item => {
                const rowItems = compact.filter(other => other.row === item.row);
                if (rowItems.length === 1) return { ...item, column: cMid };
                const distFromMidRow = 1 - Math.abs(item.row - cMaxRow / 2) / (cMaxRow / 2 || 1);
                const flare = 0.45 * distFromMidRow;
                const shift = item.column < cMid ? -flare : item.column > cMid ? flare : 0;
                return { ...item, column: item.column + shift };
            });
            return { shape: 'support-diamond', positions: normalizePositions(placed) };
        }

        if (style === 'echelon-right' || style === 'echelon-left') {
            const compact = normalizePositions(compressColumns(normalizedBase));
            const dir = style === 'echelon-right' ? 0.28 : -0.28;
            placed = compact.map(item => ({ ...item, column: item.column + item.row * dir }));
            return { shape: 'support-' + style, positions: normalizePositions(placed) };
        }

        // 'wide': preserve 3-lane open courtyard without collapsing center stems to 0.5
        if (maxCol >= 2) {
            return { shape: 'support-trident', positions: normalizedBase };
        }
        return { shape: 'support-fork', positions: normalizePositions(compressColumns(normalizedBase)) };
    }

    // 11 bespoke national macro blueprints: each defines its structure id, crest styles,
    // support chapter styles, and explicit column stacks (with startRow & optional air gaps).
    const nationalBlueprints = {
        // 1. 西俄革命阵线：双元帅两翼军旗 + 中央南下伏尔加赤军巨矛
        WRF: {
            structure: 'dual-marshal-spear',
            econCrest: 'diamond',
            milCrest: 'chevron',
            supportStyles: ['diamond', 'wide', 'diamond', 'arrowhead', 'wide', 'compact', 'wide', 'diamond', 'arrowhead'],
            stacks: [
                { startRow: 2, region: 'home-front', items: ['s:0', 's:5'] },
                { startRow: 1, region: 'home-front', items: ['s:1', 's:6'] },
                { startRow: 3, region: 'politics', items: ['p:zhukov', 'p:cadres'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:continuity', 's:3', 's:8', 'milCrest'] },
                { startRow: 3, region: 'politics', items: ['p:tukhachevsky', 's:7'] },
                { startRow: 1, region: 'frontier', items: ['s:4', 'econCrest'] },
                { startRow: 2, region: 'frontier', items: ['s:2'] }
            ]
        },
        // 2. 科米共和国：上层半圆议会拱廊 + 左翼日丹诺夫深空尖塔 + 中央圆顶 + 右翼超宽四选一巨扇
        KOM: {
            structure: 'parliament-hemicycle',
            econCrest: 'arch',
            milCrest: 'arch',
            supportStyles: ['wide', 'diamond', 'wide', 'arrowhead', 'diamond', 'compact', 'echelon-right', 'compact', 'wide'],
            stacks: [
                { startRow: 4, region: 'home-front', items: ['s:2', 's:4'] },
                { startRow: 1, region: 'politics', items: ['s:0', 'p:left', 'p:research'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:centre', 's:1', 's:6'] },
                { startRow: 1, region: 'politics', items: ['s:8', 'p:right', 'econCrest'] },
                { startRow: 3, region: 'frontier', items: ['s:5', 's:3'] },
                { startRow: 5, region: 'frontier', items: ['s:7', 'milCrest'] }
            ]
        },
        // 3. 维亚特卡总督辖区：双头鹰高扬双翼 + 中央罗曼诺夫皇冠对称阵
        VYA: {
            structure: 'imperial-double-eagle',
            econCrest: 'diamond',
            milCrest: 'diamond',
            supportStyles: ['diamond', 'arrowhead', 'arrowhead', 'compact', 'echelon-left', 'diamond', 'echelon-left', 'compact', 'diamond', 'echelon-right'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:6', 's:4'] },
                { startRow: 2, region: 'home-front', items: ['s:1', 's:7'] },
                { startRow: 4, region: 'politics', items: ['p:solidarists', 'econCrest'] },
                { startRow: 3, region: 'politics', items: ['p:kadets'] },
                { startRow: 0, region: 'politics', items: ['opening', 's:0', 's:3', 's:8'] },
                { startRow: 3, region: 'politics', items: ['p:shulgin'] },
                { startRow: 4, region: 'politics', items: ['p:rovs', 'milCrest'] },
                { startRow: 2, region: 'frontier', items: ['s:2', 's:9'] },
                { startRow: 0, region: 'frontier', items: ['s:5'] }
            ]
        },
        // 4. 萨马拉（俄罗斯解放军）：KONR 铁血阶梯金字塔（尖顶逐级外扩至宽厚军工底座）
        SAM: {
            structure: 'konr-pyramid',
            econCrest: 'chevron',
            milCrest: 'chevron',
            supportStyles: ['compact', 'diamond', 'wide', 'arrowhead', 'wide', 'compact', 'echelon-left', 'compact', 'diamond', 'arrowhead'],
            stacks: [
                { startRow: 11, region: 'home-front', items: ['s:6', 'econCrest'] },
                { startRow: 8, region: 'home-front', items: ['s:2', 's:7'] },
                { startRow: 5, region: 'politics', items: ['p:zykov', 's:4'] },
                { startRow: 3, region: 'politics', items: ['p:steel', 's:1'] },
                { startRow: 0, region: 'politics', items: ['opening', 's:0', 's:3', 's:8'] },
                { startRow: 3, region: 'politics', items: ['p:officers', 's:9'] },
                { startRow: 5, region: 'politics', items: ['p:oktan', 's:5'] },
                { startRow: 11, region: 'frontier', items: ['milCrest'] }
            ]
        },
        // 5. 彼尔姆（雅利安兄弟会）：左侧超深符文双歧巨塔 + 中央下陷矿坑峡谷 + 右侧地下抵抗暗堡
        PRM: {
            structure: 'pagan-twin-spires',
            econCrest: 'pillar',
            milCrest: 'diamond',
            supportStyles: ['compact', 'diamond', 'wide', 'arrowhead', 'wide', 'compact', 'echelon-right', 'compact', 'compact', 'diamond'],
            stacks: [
                { startRow: 2, region: 'frontier', items: ['s:3', 'milCrest'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:vagner', 'p:velimir'] },
                { startRow: 10, gapBefore: 0.6, region: 'home-front', items: ['s:1', 'econCrest'] },
                { startRow: 11, region: 'home-front', items: ['s:2', 's:8'] },
                { startRow: 10, region: 'home-front', items: ['s:0', 's:5'] },
                { startRow: 3, gapBefore: 0.6, region: 'politics', items: ['p:workers', 's:4'] },
                { startRow: 3, region: 'politics', items: ['p:garrison', 's:6'] },
                { startRow: 4, region: 'frontier', items: ['s:7', 's:9'] }
            ]
        },
        // 6. 奥涅加（反共志愿卫队）：上方一字横亘白海海岸防线胸墙 + 右下角孤悬深潜第零频道海沟
        ONE: {
            structure: 'coastal-abyss',
            econCrest: 'rampart',
            milCrest: 'rampart',
            supportStyles: ['compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:0', 's:5'] },
                { startRow: 0, region: 'home-front', items: ['s:2', 's:6'] },
                { startRow: 0, region: 'politics', items: ['s:1', 'p:treaty'] },
                { startRow: 0, region: 'politics', items: ['s:3', 'p:autonomy'] },
                { startRow: 0, region: 'politics', items: ['opening', 's:7', 'econCrest'] },
                { startRow: 0, region: 'politics', items: ['s:4', 'p:patrol'] },
                { startRow: 0, region: 'politics', items: ['s:9', 'p:harbor'] },
                { startRow: 0, region: 'frontier', items: ['s:10', 's:8'] },
                { startRow: 0, gapBefore: 0.8, region: 'frontier', items: ['milCrest', { id: 'secret', minRow: 15 }] }
            ]
        },
        // 7. 高尔基坦克旅：GAZ 重坦正面宽肩装甲带 + 向下逐级内收的倒三角穿甲楔尖
        GOR: {
            structure: 'armored-wedge',
            econCrest: 'chevron',
            milCrest: 'chevron',
            supportStyles: ['wide', 'arrowhead', 'compact', 'wide', 'compact', 'compact', 'compact', 'diamond', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:6'] },
                { startRow: 0, region: 'home-front', items: ['s:0', 'econCrest'] },
                { startRow: 0, region: 'politics', items: ['s:3', 'p:workers'] },
                { startRow: 2, region: 'politics', items: ['p:armor', 's:2'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:river', 's:7', 's:9'] },
                { startRow: 2, region: 'politics', items: ['p:veterans', 's:8'] },
                { startRow: 0, region: 'frontier', items: ['s:1', 'milCrest'] },
                { startRow: 0, region: 'frontier', items: ['s:4'] },
                { startRow: 0, region: 'frontier', items: ['s:5'] }
            ]
        },
        // 8. 沃洛格达中立国：顶层横梁 + 中央指针垂轴 + 左右腾空对称悬挂双秤盘
        VOL: {
            structure: 'neutrality-scale',
            econCrest: 'arch',
            milCrest: 'arch',
            supportStyles: ['compact', 'compact', 'diamond', 'compact', 'compact', 'diamond', 'diamond', 'compact', 'compact', 'compact'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:1', { id: 's:2', minRow: 8 }, 's:3'] },
                { startRow: 0, region: 'politics', items: ['s:4', { id: 'p:coops', minRow: 8 }, 's:5'] },
                { startRow: 0, region: 'home-front', items: ['econCrest'] },
                { startRow: 0, gapBefore: 0.7, region: 'politics', items: ['opening', 'p:municipal', 'p:schools'] },
                { startRow: 0, gapBefore: 0.7, region: 'frontier', items: ['milCrest'] },
                { startRow: 0, region: 'politics', items: ['s:7', { id: 'p:neutrality', minRow: 8 }, 's:6'] },
                { startRow: 0, region: 'frontier', items: ['s:0', { id: 's:9', minRow: 8 }, 's:8'] }
            ]
        },
        // 9. 圣乔治骑士团：四角完全留空、上小横木+主横梁+下斜踏脚的东正教八端十字架
        GEO: {
            structure: 'orthodox-cross',
            econCrest: 'pillar',
            milCrest: 'pillar',
            supportStyles: ['compact', 'diamond', 'diamond', 'compact', 'compact', 'compact', 'compact', 'compact', 'compact', 'diamond'],
            stacks: [
                { startRow: 9, region: 'home-front', items: ['s:5', 'econCrest'] },
                { startRow: 8, region: 'home-front', items: ['s:2', 's:3'] },
                { startRow: 2, region: 'politics', items: ['s:0', { id: 'p:forestry', minRow: 8 }, { id: 's:8', minRow: 22 }] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:parishes', 'p:law', 's:9'] },
                { startRow: 2, region: 'politics', items: ['s:6', { id: 'p:order', minRow: 8 }, { id: 'milCrest', minRow: 24 }] },
                { startRow: 8, region: 'frontier', items: ['s:1', 's:4'] },
                { startRow: 9, region: 'frontier', items: ['s:7'] }
            ]
        },
        // 10. 鞑靼斯坦共和国：伏尔加与卡马左右双河斜向阶梯汇流至中央三角洲
        TAT: {
            structure: 'twin-river-confluence',
            econCrest: 'stepRight',
            milCrest: 'stepLeft',
            supportStyles: ['echelon-right', 'echelon-left', 'echelon-left', 'echelon-left', 'echelon-right', 'diamond', 'echelon-left', 'echelon-right', 'diamond', 'arrowhead'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:7', 's:4'] },
                { startRow: 2, region: 'home-front', items: ['s:0', 'econCrest'] },
                { startRow: 4, region: 'politics', items: ['p:union'] },
                { startRow: 5, region: 'politics', items: ['p:assembly', 's:5'] },
                { startRow: 2, region: 'politics', items: ['opening', { id: 'p:federation', minRow: 15 }, 's:9'] },
                { startRow: 5, region: 'politics', items: ['p:guard', 's:8'] },
                { startRow: 4, region: 'frontier', items: ['s:3', 'milCrest'] },
                { startRow: 2, region: 'frontier', items: ['s:2', 's:6'] },
                { startRow: 0, region: 'frontier', items: ['s:1'] }
            ]
        },
        // 11. 巴什科尔托斯坦共和国：两端高挑弓梢向中央弧谷弯曲的南乌拉尔铁骑新月弯弓
        BSH: {
            structure: 'steppe-crescent',
            econCrest: 'stepRight',
            milCrest: 'stepLeft',
            supportStyles: ['echelon-right', 'echelon-left', 'echelon-right', 'echelon-left', 'echelon-right', 'echelon-right', 'echelon-right', 'echelon-left', 'echelon-left', 'echelon-left', 'arrowhead'],
            stacks: [
                { startRow: 0, region: 'home-front', items: ['s:5', 's:2'] },
                { startRow: 2, region: 'home-front', items: ['s:0', 'econCrest'] },
                { startRow: 4, region: 'home-front', items: ['s:4', 's:6'] },
                { startRow: 6, region: 'politics', items: ['p:oil'] },
                { startRow: 3, region: 'politics', items: ['opening', { id: 'p:home', minRow: 7 }, 'p:farm'] },
                { startRow: 6, region: 'politics', items: ['p:mountains'] },
                { startRow: 4, region: 'frontier', items: ['s:3', 's:7'] },
                { startRow: 2, region: 'frontier', items: ['s:10', 'milCrest'] },
                { startRow: 0, region: 'frontier', items: ['s:1', 's:9', 's:8'] }
            ]
        }
    };

    function routeLinks(links, positions, extraGutters = []) {
        const cards = Object.values(positions);
        const clearVertical = (x, top, bottom) => cards.every(card =>
            x <= card.left - 4 || x >= card.left + cardWidth + 4 || bottom <= card.topY || top >= card.bottomY);
        return links.map(link => {
            const source = positions[link.from];
            const target = positions[link.to];
            const { centerX: sx, bottomY: sy } = source;
            const { centerX: tx, topY: ty } = target;
            const firstY = sy + (link.bridge ? 24 : 20);
            const lastY = ty - 20;
            let path;
            if (sx === tx && clearVertical(sx, sy, ty)) path = `M ${sx} ${sy} V ${ty}`;
            else if (clearVertical(tx, firstY, ty)) path = `M ${sx} ${sy} V ${firstY} H ${tx} V ${ty}`;
            else if (clearVertical(sx, sy, lastY)) path = `M ${sx} ${sy} V ${lastY} H ${tx} V ${ty}`;
            else {
                const candidates = [...new Set([
                    ...extraGutters,
                    padding - 24,
                    ...cards.flatMap(card => [card.left - 20, card.left + cardWidth + 20])
                ])]
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

        const blueprint = nationalBlueprints[factionId] || nationalBlueprints.WRF;
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

        // Identify support chapters in deterministic order so each receives its assigned style
        let supportIndex = 0;
        const chapters = [...branches.values()].map((group, order) => {
            const root = group[0];
            const isOpening = group.some(node => node.id.endsWith('_assembly'));
            const isSecret = group.some(node => node.id.endsWith('_zeroListen'));
            const political = sculptPoliticalChapter(group, rows);
            const portfolio = !isOpening && !isSecret && !political && group.length > 2
                && group.every(node => !localParents.get(node.id).length && !localChildren.get(node.id).length);

            let sculpted;
            let supportSlot = null;
            if (political) {
                sculpted = political;
            } else if (portfolio) {
                const crest = root.category === 'industry' ? blueprint.econCrest : blueprint.milCrest;
                sculpted = sculptPortfolio(group, crest);
            } else if (isOpening) {
                sculpted = sculptSupportChapter(group, rows, localParents, localChildren, 'compact');
            } else if (isSecret) {
                sculpted = sculptSupportChapter(group, rows, localParents, localChildren, 'secret');
            } else {
                supportSlot = supportIndex++;
                const style = blueprint.supportStyles[supportSlot] || 'wide';
                sculpted = sculptSupportChapter(group, rows, localParents, localChildren, style);
            }

            const compact = sculpted.positions;
            return {
                name: root.branch,
                category: root.category,
                entryId: root.id,
                order,
                supportSlot,
                isOpening,
                isSecret,
                isPortfolio: portfolio,
                isPoliticalRoute: Boolean(political),
                shape: sculpted.shape,
                positions: compact,
                width: Math.max(...compact.map(node => node.column)) + 1,
                height: Math.max(...compact.map(node => node.row)) + 1
            };
        });

        const positions = {};
        const sections = [];
        const regions = [];
        const bridges = [];
        const stackGutters = [];
        const place = (chapter, offset, top, region) => {
            const sectionPositions = chapter.positions.map(({ id, column, row }) => {
                const col = Number((offset + column).toFixed(3));
                const actualRow = top + row;
                const left = padding + col * cellWidth;
                const cardTop = padding + actualRow * cellHeight;
                positions[id] = {
                    left,
                    top: cardTop,
                    topY: cardTop,
                    bottomY: cardTop + cardHeight,
                    centerX: left + cardWidth / 2,
                    centerY: cardTop + cardHeight / 2,
                    row: actualRow,
                    column: col
                };
                return { id, column: col, row: actualRow };
            });
            sections.push({ ...chapter, region, positions: sectionPositions });
        };

        if (onlyBranch) {
            place(chapters[0], 0, 0, chapters[0].category);
        } else {
            const tokenMap = new Map();
            for (const chapter of chapters) {
                if (chapter.isOpening) tokenMap.set('opening', chapter);
                else if (chapter.isSecret) tokenMap.set('secret', chapter);
                else if (chapter.isPortfolio && chapter.category === 'industry') tokenMap.set('econCrest', chapter);
                else if (chapter.isPortfolio && chapter.category === 'military') tokenMap.set('milCrest', chapter);
                else if (chapter.isPoliticalRoute) {
                    const match = chapter.entryId.match(/^wr_[a-z]+_(.+)_commit$/);
                    if (match) tokenMap.set('p:' + match[1], chapter);
                } else if (chapter.supportSlot != null) {
                    tokenMap.set('s:' + chapter.supportSlot, chapter);
                }
            }

            // Compute column offsets for every stack first, then place opening & parent
            // political routes before dependent political routes so parent rows are known.
            const baseColGap = 0.45;
            const resolvedStacks = [];
            const usedChapters = new Set();
            let cursorCol = 0;
            for (const stackSpec of blueprint.stacks) {
                const entries = stackSpec.items
                    .map(raw => (typeof raw === 'string' ? { id: raw, minRow: 0 } : raw))
                    .map(spec => ({ ...spec, chapter: tokenMap.get(spec.id) }))
                    .filter(spec => spec.chapter);
                if (!entries.length) continue;
                if (resolvedStacks.length) {
                    const gap = stackSpec.gapBefore ?? baseColGap;
                    stackGutters.push(padding + (cursorCol + gap / 2) * cellWidth - (cellWidth - cardWidth) / 2);
                    cursorCol += gap;
                }
                const stackWidth = Math.max(...entries.map(entry => entry.chapter.width));
                for (const entry of entries) usedChapters.add(entry.chapter.name);
                resolvedStacks.push({
                    startCol: cursorCol,
                    width: stackWidth,
                    startRow: stackSpec.startRow || 0,
                    region: stackSpec.region || 'politics',
                    entries
                });
                cursorCol += stackWidth;
            }

            // Safety fallback for any unreferenced chapter (e.g. if a secret is hidden before reveal)
            for (const chapter of chapters) {
                if (usedChapters.has(chapter.name)) continue;
                const gap = baseColGap;
                if (resolvedStacks.length) cursorCol += gap;
                resolvedStacks.push({
                    startCol: cursorCol,
                    width: chapter.width,
                    startRow: 2,
                    region: chapter.category === 'politics' ? 'politics' : 'frontier',
                    entries: [{ id: chapter.name, minRow: 0, chapter }]
                });
                cursorCol += chapter.width;
            }

            const assemblyId = tokenMap.get('opening')?.positions.find(node => node.id.endsWith('_assembly'))?.id;

            // Multi-pass stack placement so opening is placed first, root political routes second,
            // and succession routes (plus items below them in the same stack) third.
            const stackRowCursor = resolvedStacks.map(stack => stack.startRow);
            const nextIndexInStack = resolvedStacks.map(() => 0);

            const canPlaceChapter = chapter => {
                if (chapter.isOpening) return true;
                if (!chapter.isPoliticalRoute && !chapter.isSecret) {
                    return !tokenMap.has('opening') || Boolean(positions[assemblyId]);
                }
                const entry = byId.get(chapter.entryId);
                const parentId = entry.prerequisites.find(id => id.endsWith('_congress')) || assemblyId;
                return !parentId || Boolean(positions[parentId]);
            };

            let progress = true;
            while (progress) {
                progress = false;
                for (let s = 0; s < resolvedStacks.length; s++) {
                    const stack = resolvedStacks[s];
                    while (nextIndexInStack[s] < stack.entries.length) {
                        const { chapter, minRow = 0 } = stack.entries[nextIndexInStack[s]];
                        if (!canPlaceChapter(chapter)) break;
                        let top = Math.max(stackRowCursor[s], minRow);
                        if (chapter.isPoliticalRoute || chapter.isSecret) {
                            const entry = byId.get(chapter.entryId);
                            const parentId = entry.prerequisites.find(id => id.endsWith('_congress')) || assemblyId;
                            if (parentId && positions[parentId]) {
                                top = Math.max(top, positions[parentId].row + 2);
                            }
                            const bridge = externalLinks.find(link => link.from === parentId && link.to === chapter.entryId);
                            if (bridge) bridges.push({ ...bridge, bridge: true, display: 'political-entry' });
                        }
                        const centeredCol = stack.startCol + (stack.width - chapter.width) / 2;
                        const region = chapter.category === 'politics' ? 'politics' : stack.region;
                        place(chapter, centeredCol, top, region);
                        stackRowCursor[s] = top + chapter.height + 1;
                        nextIndexInStack[s]++;
                        progress = true;
                    }
                }
            }

            regions.push({
                id: blueprint.structure,
                startColumn: 0,
                endColumn: cursorCol,
                openingId: assemblyId
            });
        }

        const width = padding * 2 + Math.max(...Object.values(positions).map(node => node.left - padding)) + cardWidth;
        const height = padding * 2 + Math.max(...Object.values(positions).map(node => node.top - padding)) + cardHeight;
        const layout = {
            structure: blueprint.structure,
            positions,
            sections,
            regions,
            references,
            links: routeLinks([...localLinks, ...bridges], positions, stackGutters),
            allLinks,
            externalLinks,
            width,
            height,
            cardWidth,
            cardHeight,
            cellWidth,
            cellHeight,
            padding
        };
        layouts.set(onlyBranch, layout);
        return layout;
    }

    return { build };
})();
