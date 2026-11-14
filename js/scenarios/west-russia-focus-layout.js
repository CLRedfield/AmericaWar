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
                } else if (chamberFork && node === hearing) column = 1.2;
                else if (chamberFork && node === mandate) column = 3.8;
                else if (node.id.endsWith('_integration')) column = center - 1.2;
                else if (node.id.endsWith('_reserves')) column = center + 1.2;
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
                else if (node.id.endsWith('_integration')) column = center - 1.2;
                else if (node.id.endsWith('_reserves')) column = center + 1.2;
                return { id: node.id, column, row: rows.get(node.id) };
            });
            return { shape: 'giant-fan-4', positions: normalizePositions(placed) };
        }

        // 2-arm sculpted architectural motifs (with unified 3-card epilogue pedestal)
        const profiles = {
            pyramid: {
                center: 2.0,
                chamber: [1.2, 2.8],
                choice: [1.2, 2.8],
                measure: parallel ? [0.3, 3.7] : [0.9, 3.1],
                project: parallel ? [1.4, 2.6] : [0.5, 3.5],
                charter: [0.2, 3.8],
                settlement: [0.0, 4.0],
                pedestal: [0.8, 3.2]
            },
            wedge: {
                center: 2.0,
                chamber: [0.0, 4.0],
                choice: [0.2, 3.8],
                measure: parallel ? [0.4, 3.6] : [0.6, 3.4],
                project: parallel ? [1.4, 2.6] : [1.0, 3.0],
                charter: [1.3, 2.7],
                settlement: [1.5, 2.5],
                pedestal: [1.0, 3.0]
            },
            cross: {
                center: 2.0,
                chamber: [1.4, 2.6],
                choice: [1.0, 3.0],
                measure: [0.0, 4.0],
                project: parallel ? [1.0, 3.0] : [1.2, 2.8],
                charter: [1.4, 2.6],
                settlement: [1.4, 2.6],
                pedestal: [0.9, 3.1]
            },
            scepter: {
                center: 2.0,
                chamber: [1.4, 2.6],
                choice: [1.2, 2.8],
                measure: parallel ? [0.0, 4.0] : [0.4, 3.6],
                project: parallel ? [1.1, 2.9] : [0.9, 3.1],
                charter: [0.8, 3.2],
                settlement: [1.3, 2.7],
                pedestal: [1.0, 3.0]
            },
            dome: {
                center: 2.0,
                chamber: [0.8, 3.2],
                choice: [0.6, 3.4],
                measure: parallel ? [0.0, 4.0] : [0.2, 3.8],
                project: parallel ? [1.2, 2.8] : [0.6, 3.4],
                charter: [0.6, 3.4],
                settlement: [1.1, 2.9],
                pedestal: [0.9, 3.1]
            },
            obelisk: {
                center: 1.8,
                chamber: [1.2, 2.4],
                choice: [1.2, 2.4],
                measure: parallel ? [0.2, 3.4] : [1.2, 2.4],
                project: parallel ? [1.2, 2.4] : [0.2, 3.4],
                charter: [1.2, 2.4],
                settlement: [1.2, 2.4],
                pedestal: [0.8, 2.8]
            },
            derrick: {
                center: 2.0,
                chamber: [1.3, 2.7],
                choice: [1.1, 2.9],
                measure: parallel ? [0.4, 3.6] : [0.8, 3.2],
                project: parallel ? [1.4, 2.6] : [0.5, 3.5],
                charter: [0.3, 3.7],
                settlement: [0.1, 3.9],
                pedestal: [0.8, 3.2]
            },
            fan: {
                center: 2.0,
                chamber: [0.9, 3.1],
                choice: [1.2, 2.8],
                measure: parallel ? [0.2, 3.8] : [0.4, 3.6],
                project: parallel ? [1.3, 2.7] : [0.0, 4.0],
                charter: [0.6, 3.4],
                settlement: [1.1, 2.9],
                pedestal: [0.9, 3.1]
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
            else if (node.id.endsWith('_integration')) column = spec.pedestal[0];
            else if (node.id.endsWith('_reserves')) column = spec.pedestal[1];
            return { id: node.id, column, row: rows.get(node.id) };
        });
        return { shape: 'political-' + motif, positions: normalizePositions(placed) };
    }

    function sculptDepartmentChapter(nodes, rows, localParents, localChildren, style = 'compact') {
        if (nodes.some(node => node.id.endsWith('_zeroListen'))) {
            const bySuffix = suffix => nodes.find(node => node.id.endsWith(suffix));
            const placed = [
                bySuffix('_zeroListen') && { id: bySuffix('_zeroListen').id, column: 1.0, row: 0 },
                bySuffix('_zeroSeal') && { id: bySuffix('_zeroSeal').id, column: 0.0, row: 1 },
                bySuffix('_zeroReply') && { id: bySuffix('_zeroReply').id, column: 2.0, row: 1 },
                bySuffix('_zeroBroadcast') && { id: bySuffix('_zeroBroadcast').id, column: 2.0, row: 2 }
            ].filter(Boolean);
            return { shape: 'abyss-trench', positions: normalizePositions(placed) };
        }

        const base = chapterColumns(nodes, rows, localParents, localChildren);
        const normalizedBase = normalizePositions(base);
        const compact = normalizePositions(compressColumns(normalizedBase));
        if (style === 'compact') {
            return { shape: 'dept-compact', positions: compact };
        }
        if (style === 'wide') {
            return { shape: 'dept-wide', positions: normalizedBase };
        }

        const cMid = Math.max(...compact.map(n => n.column), 0) / 2;
        const cMaxRow = Math.max(...compact.map(n => n.row), 1);
        if (style === 'arrowhead') {
            const placed = compact.map(item => {
                const rowItems = compact.filter(other => other.row === item.row);
                if (rowItems.length === 1) return { ...item, column: cMid };
                const flare = item.row >= 1 && item.row <= cMaxRow - 1 ? 0.2 : 0;
                const shift = item.column < cMid ? -flare : item.column > cMid ? flare : 0;
                return { ...item, column: item.column + shift };
            });
            return { shape: 'dept-arrowhead', positions: normalizePositions(placed) };
        }

        // 'diamond': subtle mid-tree flare with centered single-card spine nodes
        const placed = compact.map(item => {
            const rowItems = compact.filter(other => other.row === item.row);
            if (rowItems.length === 1) return { ...item, column: cMid };
            const distFromMidRow = 1 - Math.abs(item.row - cMaxRow / 2) / (cMaxRow / 2 || 1);
            const flare = 0.25 * distFromMidRow;
            const shift = item.column < cMid ? -flare : item.column > cMid ? flare : 0;
            return { ...item, column: item.column + shift };
        });
        return { shape: 'dept-diamond', positions: normalizePositions(placed) };
    }

    // 11 bespoke American-Civil-War-style national layouts:
    // - Cohesive Political Crown (all political forks & mid-tree succession branches connect at dRow = 1..2)
    // - 4 consolidated, internally-connected Department Trees (d:0 Industry, d:1 Military, d:2 Civil, d:3 Strategy)
    // - Compact 14-17 row height with distinct macro arrangements per nation.
    const nationalBlueprints = {
        // 1. 西俄革命阵线：左翼参谋旁支分叉 + 三路赤军主帅树冠 + 右翼军务/苏维埃/船坞部门群
        WRF: {
            structure: 'dual-marshal-spear',
            deptStyles: ['diamond', 'compact', 'arrowhead', 'diamond'],
            stacks: [
                { startRow: 2, region: 'politics', items: ['p:cadres'] },
                { startRow: 2, region: 'politics', items: ['p:zhukov'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:continuity'] },
                { startRow: 2, region: 'politics', items: ['p:tukhachevsky'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 1, region: 'home-front', items: ['d:0'] }
            ]
        },
        // 2. 科米共和国：左翼半途裂变火箭尖塔 + 中央三路大穹顶 + 右翼四路巨扇 + 右侧共和部门群
        KOM: {
            structure: 'parliament-hemicycle',
            deptStyles: ['compact', 'diamond', 'arrowhead', 'compact'],
            stacks: [
                { startRow: 2, region: 'politics', items: ['p:research'] },
                { startRow: 2, region: 'politics', items: ['p:left'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:centre'] },
                { startRow: 2, region: 'politics', items: ['p:right'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] }
            ]
        },
        // 3. 维亚特卡总督辖区：左右帝国双翼拱卫中央四路罗曼诺夫皇冠
        VYA: {
            structure: 'imperial-double-eagle',
            deptStyles: ['diamond', 'arrowhead', 'compact', 'diamond'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 2, region: 'politics', items: ['p:solidarists'] },
                { startRow: 2, region: 'politics', items: ['p:kadets'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:shulgin'] },
                { startRow: 2, region: 'politics', items: ['p:rovs'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] }
            ]
        },
        // 4. 萨马拉（俄罗斯解放军）：左翼伏尔加动力 + 中央 KONR 阶梯楔冠 + 右翼解放军渡江集群
        SAM: {
            structure: 'konr-pyramid',
            deptStyles: ['arrowhead', 'compact', 'diamond', 'arrowhead'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 3, region: 'politics', items: ['p:zykov'] },
                { startRow: 2, region: 'politics', items: ['p:steel'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:officers'] },
                { startRow: 3, region: 'politics', items: ['p:oktan'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] }
            ]
        },
        // 5. 彼尔姆（雅利安兄弟会）：左侧瓦格纳→韦利米尔邪典双塔 vs 右侧地下工人/技术官与卡马工业群
        PRM: {
            structure: 'pagan-twin-spires',
            deptStyles: ['compact', 'diamond', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 2, region: 'politics', items: ['p:velimir'] },
                { startRow: 2, region: 'politics', items: ['p:vagner'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:workers'] },
                { startRow: 2, region: 'politics', items: ['p:engineers'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] }
            ]
        },
        // 6. 奥涅加（反共志愿卫队）：左翼芬兰补给与港务 + 中央四路海防政治树 + 紧邻旁侧第零频道与海岸反攻
        ONE: {
            structure: 'coastal-abyss',
            deptStyles: ['compact', 'diamond', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:2'] },
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 2, region: 'politics', items: ['p:treaty'] },
                { startRow: 2, region: 'politics', items: ['p:autonomy'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:patrol'] },
                { startRow: 2, region: 'politics', items: ['p:harbor'] },
                { startRow: 2, region: 'politics', items: ['secret', 'd:3'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] }
            ]
        },
        // 7. 高尔基坦克旅：左翼 GAZ 汽车军工纵列 + 中央装甲旅 V 型楔冠 + 右翼江防与干线总攻纵列
        GOR: {
            structure: 'armored-wedge',
            deptStyles: ['compact', 'compact', 'diamond', 'arrowhead'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0', 'd:2'] },
                { startRow: 3, region: 'politics', items: ['p:workers'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:armor'] },
                { startRow: 2, region: 'politics', items: ['p:river'] },
                { startRow: 3, region: 'politics', items: ['p:veterans'] },
                { startRow: 1, region: 'frontier', items: ['d:1', 'd:3'] }
            ]
        },
        // 8. 沃洛格达中立国：左右对称中立民生与铁道双翼 + 中央市政→教员同盟子分叉
        VOL: {
            structure: 'neutrality-scale',
            deptStyles: ['compact', 'diamond', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 2, region: 'politics', items: ['p:coops'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:municipal'] },
                { startRow: 2, region: 'politics', items: ['p:schools'] },
                { startRow: 2, region: 'politics', items: ['p:neutrality'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] }
            ]
        },
        // 9. 圣乔治骑士团：左右上卡马短横翼拱卫中央堂区→民法和解十字中枢
        GEO: {
            structure: 'orthodox-cross',
            deptStyles: ['diamond', 'diamond', 'compact', 'arrowhead'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 2, region: 'politics', items: ['p:forestry'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:parishes'] },
                { startRow: 2, region: 'politics', items: ['p:law'] },
                { startRow: 2, region: 'politics', items: ['p:order'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] }
            ]
        },
        // 10. 鞑靼斯坦共和国：左侧伏尔加—卡马政治汇流（议会→自治联邦旁支）+ 右侧江防、市民与油田三翼
        TAT: {
            structure: 'twin-river-confluence',
            deptStyles: ['diamond', 'compact', 'arrowhead', 'diamond'],
            stacks: [
                { startRow: 2, region: 'politics', items: ['p:union'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:assembly'] },
                { startRow: 2, region: 'politics', items: ['p:federation'] },
                { startRow: 2, region: 'politics', items: ['p:guard'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] },
                { startRow: 1, region: 'home-front', items: ['d:0'] }
            ]
        },
        // 11. 巴什科尔托斯坦共和国：外侧油铁与乌拉尔山口双角拱卫中央库鲁尔泰（自治议会→农社协商旁支）
        BSH: {
            structure: 'steppe-crescent',
            deptStyles: ['compact', 'arrowhead', 'diamond', 'compact'],
            stacks: [
                { startRow: 1, region: 'home-front', items: ['d:0'] },
                { startRow: 2, region: 'politics', items: ['p:oil'] },
                { startRow: 0, region: 'politics', items: ['opening', 'p:home'] },
                { startRow: 2, region: 'politics', items: ['p:farm'] },
                { startRow: 2, region: 'politics', items: ['p:mountains'] },
                { startRow: 1, region: 'frontier', items: ['d:1'] },
                { startRow: 1, region: 'home-front', items: ['d:2', 'd:3'] }
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

        let fallbackDeptIndex = 0;
        const chapters = [...branches.values()].map((group, order) => {
            const root = group[0];
            const isOpening = group.some(node => node.id.endsWith('_assembly'));
            const isSecret = group.some(node => node.id.endsWith('_zeroListen'));
            const political = sculptPoliticalChapter(group, rows);
            const deptSlot = !isOpening && !isSecret && !political
                ? (group.find(node => node.deptIndex != null)?.deptIndex ?? fallbackDeptIndex++)
                : null;

            let sculpted;
            if (political) {
                sculpted = political;
            } else if (isOpening) {
                sculpted = sculptDepartmentChapter(group, rows, localParents, localChildren, 'compact');
            } else if (isSecret) {
                sculpted = sculptDepartmentChapter(group, rows, localParents, localChildren, 'secret');
            } else {
                const style = blueprint.deptStyles?.[deptSlot] || 'compact';
                sculpted = sculptDepartmentChapter(group, rows, localParents, localChildren, style);
            }

            const compact = sculpted.positions;
            return {
                name: root.branch,
                category: root.category,
                entryId: root.id,
                order,
                deptSlot,
                isOpening,
                isSecret,
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
                else if (chapter.isPoliticalRoute) {
                    const match = chapter.entryId.match(/^wr_[a-z]+_(.+)_commit$/);
                    if (match) tokenMap.set('p:' + match[1], chapter);
                } else if (chapter.deptSlot != null) {
                    tokenMap.set('d:' + chapter.deptSlot, chapter);
                }
            }

            const baseColGap = 0.35;
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

            for (const chapter of chapters) {
                if (usedChapters.has(chapter.name)) continue;
                if (resolvedStacks.length) cursorCol += baseColGap;
                resolvedStacks.push({
                    startCol: cursorCol,
                    width: chapter.width,
                    startRow: 1,
                    region: chapter.category === 'politics' ? 'politics' : 'frontier',
                    entries: [{ id: chapter.name, minRow: 0, chapter }]
                });
                cursorCol += chapter.width;
            }

            const assemblyId = tokenMap.get('opening')?.positions.find(node => node.id.endsWith('_assembly'))?.id;
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
                                top = Math.max(top, positions[parentId].row + 1);
                            }
                            const bridge = externalLinks.find(link => link.from === parentId && link.to === chapter.entryId);
                            if (bridge) bridges.push({ ...bridge, bridge: true, display: 'political-entry' });
                        }
                        const centeredCol = stack.startCol + (stack.width - chapter.width) / 2;
                        const region = chapter.category === 'politics' ? 'politics' : stack.region;
                        place(chapter, centeredCol, top, region);
                        stackRowCursor[s] = top + chapter.height;
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
