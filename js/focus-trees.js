/**
 * Extended national focus authoring.
 * Each faction gets a hand-crafted political tree with distinctive mechanics.
 * Inspirations come from KX civil-war content (workers' councils, Long-Pelley,
 * MacArthur's caesar, Hughes-Olson Pacific, Patton's western district,
 * Lone-Star revival) and Lovecraft's New England (Providence Society leading
 * to Cthulhu / Yog-Sothoth / Nyarlathotep endings).
 */

(function extendNationalFocusTrees() {
    if (typeof GameState === 'undefined') return;

    const E = {
        money: a => ({ type: 'money', amount: a }),
        pp: a => ({ type: 'pp', amount: a }),
        ppIncome: a => ({ type: 'ppIncome', amount: a }),
        moneyIncome: a => ({ type: 'moneyIncome', amount: a }),
        ppCap: a => ({ type: 'ppCapBonus', amount: a }),
        capT: a => ({ type: 'capitalTroops', amount: a }),
        capI: a => ({ type: 'capitalIndustry', amount: a }),
        allT: a => ({ type: 'allTroops', amount: a }),
        allI: (a, max) => ({ type: 'allIndustry', amount: a, maxNodes: max }),
        nodeI: (id, a) => ({ type: 'nodeIndustry', nodeId: id, amount: a }),
        tagT: (tag, a) => ({ type: 'taggedTroops', tag, amount: a }),
        tagD: (tag, a) => ({ type: 'taggedDefense', tag, amount: a }),
        tagInc: (tag, a) => ({ type: 'taggedIncome', tag, amount: a }),
        tagMoney: (tag, a) => ({ type: 'taggedNodeMoney', tag, amount: a }),
        actionCost: (action, a) => ({ type: 'actionCost', action, amount: a }),
        recruitAmount: a => ({ type: 'recruitAmount', amount: a }),
        recruitCost: a => ({ type: 'recruitCost', amount: a }),
        maint: a => ({ type: 'maintenanceRate', amount: a }),
        freeT: a => ({ type: 'freeTroops', amount: a }),
        gAtk: a => ({ type: 'globalAttack', amount: a }),
        gDef: a => ({ type: 'globalDefense', amount: a }),
        capMoney: a => ({ type: 'captureMoney', amount: a }),
        capTroop: a => ({ type: 'captureTroops', amount: a }),
        crisis: a => ({ type: 'crisisPP', amount: a }),
        capBoost: (a, max) => ({ type: 'industryCapBonus', amount: a, maxNodes: max }),
        damage: (a, max) => ({ type: 'damageEnemyIndustry', amount: a, maxNodes: max }),
        bonds: (amount, penalty, turns) => ({ type: 'warBonds', amount, penalty, turns }),
        allCapT: a => ({ type: 'allCapitalsTroops', amount: a }),
        badge: label => ({ type: 'badge', label }),
        // ideo(id) 仅切换意识形态；ideo(id, name, shortName) 同时把国家更名为 name（shortName 省略则同 name）。
        // 每个势力都应保留一条"沿用原国名"的路线（该路线的 ideo 把 name 写成原国名）。
        ideo: (id, name, shortName) => (name ? { type: 'ideology', id, name, shortName: shortName || name } : { type: 'ideology', id })
    };

    function f(id, name, branch, x, y, cost, description, effects = [], prerequisites = [], extra = {}) {
        const item = { id, name, branch, x, y, cost, description, effects };
        if (prerequisites && prerequisites.length) item.prerequisites = prerequisites;
        return Object.assign(item, extra);
    }

    function addUnique(tree, items) {
        const ids = new Set(tree.map(item => item.id));
        items.forEach(item => {
            if (!item || ids.has(item.id)) return;
            tree.push(item);
            ids.add(item.id);
        });
    }

    // ============================================================
    // USA: Macarthur military government - rebuild political depth
    // ============================================================
    function rebuildUsaPoliticalDepth() {
        const tree = GameState.focusTrees.USA;
        addUnique(tree, FocusData.USA(f, E));
    }

    // ============================================================
    // CSA - 美利坚联合工团：里德工团 / 总工团托派 / 激进社会主义 / 卡彭机器
    // 联合工团（CSA）专属手工布局：每条线一种独立轮廓 + 线下子分叉（KX 路线）。
    // 坐标在此处即最终位置（CSA 已从 applyReadableFocusTreeLayouts 以及
    // extendSignatureArcs / addStrategicDetours / applyPoliticalBranching /
    // rebalancePoliticalFocusEffects 的通用处理中排除）。
    // ============================================================
    function buildCsaTree() {
        const tree = [];
        addUnique(tree, FocusData.CSA(f, E));
        return tree;
    }

    // ============================================================
    // AUS - 美利坚联盟国 (Long)：朗派机器 / 社会正义 / 银军团 / 义勇民兵
    // 联盟国（AUS）专属手工布局：每条线一种独立轮廓 + 线下子分叉（KX 路线）。
    // 坐标在此处即最终位置（AUS 已从 applyReadableFocusTreeLayouts 以及
    // extendSignatureArcs / addStrategicDetours / applyPoliticalBranching /
    // rebalancePoliticalFocusEffects 的通用处理中排除）。
    // ============================================================
    function buildAusTree() {
        const tree = [];
        addUnique(tree, FocusData.AUS(f, E));
        return tree;
    }

    // ============================================================
    // CON - 美利坚宪政国：宪章 / 财阀 / 安全统制 / 法西斯化
    // 主打防御 + 财政债券 + 缴获
    // ============================================================
    function buildConTree() {
        const tree = [];
        addUnique(tree, FocusData.CON(f, E));
        return tree;
    }

    // ============================================================
    // NEN - 新英格兰：自由州 / 商贸委员会 / 加拿大保护协定 / 普罗维登斯学社（洛夫克拉夫特）
    // 普罗维登斯路线最后分裂为 克苏鲁 / 犹格-索托斯 / 奈亚拉托提普 三大分支
    // ============================================================
    function buildNenTree() {
        const tree = [];
        addUnique(tree, FocusData.NEN(f, E));
        return tree;
    }

    // ============================================================
    // PAC - 太平洋国：进步民主 / 技术内阁 / 防务联盟 / 太平洋帝国
    // ============================================================
    function buildPacTree() {
        const tree = [];
        // 太平洋国（PSA）专属手工布局：每条线一种独立轮廓。
        // 坐标在此处即最终位置（PAC 已从 applyReadableFocusTreeLayouts 的通用布局中排除）。
        addUnique(tree, FocusData.PAC(f, E));
        return tree;
    }

    // ============================================================
    // WDC - 西部军区：军官 / 边疆 / 西部共和国 / 长程远征
    // ============================================================
    function buildWdcTree() {
        const tree = [];
        addUnique(tree, FocusData.WDC(f, E));
        return tree;
    }

    // ============================================================
    // TEX - 德克萨斯：石油 / 牧场民粹 / 共和国 / 大德州
    // ============================================================
    function buildTexTree() {
        const tree = [];
        addUnique(tree, FocusData.TEX(f, E));
        return tree;
    }

    function extendSignatureArcs() {

        // CSA（联合工团）终局已并入 js/focus-trees/data/csa.js 的手工布局，不再在此追加。

        // AUS（联盟国）终局已并入 js/focus-trees/data/aus.js 的手工布局，不再在此追加。


    }

    function addStrategicDetours() {

        // CSA（联合工团）的战略支线节点已并入 js/focus-trees/data/csa.js 的手工布局。

        // AUS（联盟国）的战略支线节点已并入 js/focus-trees/data/aus.js 的手工布局。


    }

    function applyAsymmetricLayouts() {
        const branchPlans = {
            USA: {
                '军事改革': [[9, 1], [8, 2], [6, 3], [10, 3], [8, 4], [6, 5], [10, 5], [9, 6], [7, 7], [10, 8]],
                '经济动员': [[14, 1], [13, 2], [12, 3], [11, 4], [15, 4], [14, 5], [15, 6], [14, 7]],
                '海空军': [[18, 1], [17, 2], [19, 2], [18, 3], [20, 4]],
                '战后路线': [[24, 1], [24, 2]],
                '外交路线': [[22, 3], [24, 3], [27, 3], [24, 4]]
            },
            CSA: {
                '政治路线': [[4, 1], [3, 3], [7, 3], [4, 6], [4, 8]],
                '军事路线': [[12, 1], [9, 2], [14, 2], [8, 3], [15, 3], [8, 4], [16, 4], [11, 5], [13, 5], [11, 6], [14, 6], [12, 7]],
                '经济路线': [[18, 1], [15, 2], [21, 2], [14, 3], [21, 3], [15, 4], [20, 4], [18, 5], [17, 6], [20, 6], [18, 7], [16, 8]],
                '地区外交': [[23, 1], [22, 2], [25, 2], [21, 3], [25, 3], [21, 4], [26, 4], [23, 5]]
            },
            AUS: {
                '政治路线': [[4, 1], [3, 3], [7, 3], [4, 6], [4, 8]],
                '军事路线': [[11, 1], [9, 2], [14, 2], [9, 3], [15, 3], [10, 4], [16, 4], [11, 5], [14, 5], [12, 6], [16, 6], [13, 7]],
                '经济路线': [[16, 1], [13, 2], [19, 2], [12, 3], [20, 3], [13, 4], [19, 4], [15, 5], [18, 5], [16, 6], [14, 7], [18, 7]],
                '地区外交': [[22, 1], [20, 2], [24, 2], [19, 3], [24, 3], [19, 4], [25, 4], [22, 5]]
            },
            CON: {
                '政治路线': [[4, 1], [2, 3], [7, 3], [4, 6], [4, 8]],
                '军事路线': [[12, 1], [10, 2], [14, 2], [9, 3], [15, 3], [9, 4], [15, 4], [10, 5], [14, 5], [12, 6], [11, 7], [13, 8]],
                '经济路线': [[17, 1], [15, 2], [19, 2], [15, 3], [19, 3], [15, 4], [19, 4], [16, 5], [18, 5], [17, 6], [15, 7], [19, 7]],
                '地区外交': [[22, 1], [20, 2], [24, 2], [20, 3], [24, 3], [19, 4], [25, 4], [22, 5]]
            },
            NEN: {
                '政治路线': [[4, 1], [3, 3], [6, 3], [4, 6], [4, 8]],
                '军事路线': [[10, 1], [8, 2], [13, 2], [8, 3], [14, 3], [9, 4], [14, 4], [9, 5], [13, 5], [11, 6], [10, 7], [13, 7]],
                '经济路线': [[17, 1], [15, 2], [19, 2], [14, 3], [20, 3], [15, 4], [20, 4], [15, 5], [18, 5], [17, 6], [14, 7], [20, 7]],
                '地区外交': [[23, 1], [21, 2], [25, 2], [20, 3], [25, 3], [20, 4], [26, 4], [23, 5]]
            },
            PAC: {
                '政治路线': [[4, 1], [2, 3], [7, 3], [4, 6], [4, 8]],
                '军事路线': [[12, 1], [9, 2], [15, 2], [8, 3], [16, 3], [9, 4], [15, 4], [10, 5], [15, 5], [12, 6], [10, 7], [15, 7]],
                '经济路线': [[17, 1], [14, 2], [20, 2], [13, 3], [21, 3], [14, 4], [20, 4], [14, 5], [18, 5], [17, 6], [13, 7], [21, 7]],
                '地区外交': [[23, 1], [21, 2], [25, 2], [20, 3], [25, 3], [20, 4], [26, 4], [23, 5]]
            },
            WDC: {
                '政治路线': [[4, 1], [3, 3], [6, 3], [4, 6], [4, 8]],
                '军事路线': [[11, 1], [9, 2], [13, 2], [8, 3], [14, 3], [8, 4], [15, 4], [10, 5], [15, 5], [11, 6], [9, 7], [14, 7]],
                '经济路线': [[17, 1], [15, 2], [19, 2], [14, 3], [20, 3], [14, 4], [19, 4], [14, 5], [17, 5], [18, 6], [15, 7], [19, 7]],
                '地区外交': [[22, 1], [20, 2], [24, 2], [19, 3], [24, 3], [19, 4], [25, 4], [22, 5]]
            },
            TEX: {
                '政治路线': [[4, 1], [3, 3], [6, 3], [4, 6], [4, 8]],
                '军事路线': [[12, 1], [9, 2], [14, 2], [8, 3], [15, 3], [9, 4], [15, 4], [10, 5], [13, 5], [12, 6], [9, 7], [14, 7]],
                '经济路线': [[17, 1], [15, 2], [19, 2], [14, 3], [20, 3], [15, 4], [20, 4], [15, 5], [18, 5], [17, 6], [14, 7], [20, 7]],
                '地区外交': [[22, 1], [19, 2], [25, 2], [18, 3], [25, 3], [18, 4], [26, 4], [22, 6]]
            }
        };

        Object.entries(branchPlans).forEach(([factionId, plans]) => {
            const tree = GameState.focusTrees[factionId];
            if (!tree) return;

            Object.entries(plans).forEach(([branch, coords]) => {
                tree
                    .filter(focus => focus.branch === branch)
                    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
                    .forEach((focus, index) => {
                        if (!coords[index]) return;
                        focus.x = coords[index][0];
                        focus.y = coords[index][1];
                    });
            });
        });

        Object.values(GameState.focusTrees).forEach(tree => {
            const occupied = new Set();
            [...tree]
                .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
                .forEach(focus => {
                    while (occupied.has(`${focus.x},${focus.y}`)) {
                        focus.x += 1;
                    }
                    occupied.add(`${focus.x},${focus.y}`);
                });
        });
    }

    function setFocusEffects(id, effects) {
        Object.values(GameState.focusTrees).some(tree => {
            const focus = tree.find(item => item.id === id);
            if (!focus) return false;
            focus.effects = effects;
            return true;
        });
    }

    function rebalancePoliticalFocusEffects() {
        const port = '\u6e2f\u53e3';
        const oil = '\u6cb9\u7530';

        [
            // CSA（联合工团）效果已在 js/focus-trees/data/csa.js 中就地定稿。

            // AUS（联盟国）效果已在 js/focus-trees/data/aus.js 中就地定稿，无需在此再平衡。

            ['placeholder_no_rebalance', []]
        ].filter(([id]) => id !== 'placeholder_no_rebalance').forEach(([id, effects]) => setFocusEffects(id, effects));
    }

    /**
     * 给政治路线的中段插入一个互斥支线节点，把单列直链改造成 2 选 1 的小分叉。
     * 主路 P3（非 USA）或 P4（USA）保持原 effects 与 prereq；新支线和主路互斥并共享同一个父节点；
     * 链上的下一个节点改用 prerequisiteAny，让玩家走主路或支路都能继续推进。
     */
    function applyPoliticalBranching() {
        const forks = [
            // CSA（联合工团）的政治子分叉已在 js/focus-trees/data/csa.js 中手工写入。

            // AUS（联盟国）的政治子分叉已在 js/focus-trees/data/aus.js 中手工写入，不再自动插入。

        ];

        forks.forEach(fork => {
            const tree = GameState.focusTrees[fork.factionId];
            if (!tree) return;
            const main = tree.find(item => item.id === fork.mainId);
            if (!main) return;

            // 新支线节点：与主节点共享父节点（同一个 prereq），y 相同、x 比主节点大 1，互斥
            const altX = (typeof main.x === 'number' ? main.x : 0) + 1;
            const altY = typeof main.y === 'number' ? main.y : 0;
            const alt = f(
                fork.altId,
                fork.altName,
                fork.branch,
                altX,
                altY,
                fork.cost,
                fork.description,
                fork.effects,
                Array.isArray(main.prerequisites) ? [...main.prerequisites] : [],
                { mutuallyExclusive: [fork.mainId] }
            );
            addUnique(tree, [alt]);

            // 主节点反向加上互斥关系，便于互斥连线在两侧都能渲染
            if (!Array.isArray(main.mutuallyExclusive)) main.mutuallyExclusive = [];
            if (!main.mutuallyExclusive.includes(fork.altId)) main.mutuallyExclusive.push(fork.altId);

            // 下一节点：prereq 改为 prereqAny，主路或支路二选其一即可推进
            const next = tree.find(item => item.id === fork.nextId);
            if (next) {
                delete next.prerequisites;
                next.prerequisiteAny = [[fork.mainId], [fork.altId]];
            }
        });
    }

    function applyReadableFocusTreeLayouts() {
        // 政治路线主轴（每条路线 col_x），P3/P4 主路移到 col_x-1，因此最左路线轴右移到 1 避免出现 x=-1
        const regularPoliticalX = [1, 4, 8, 11];
        const sharedPoliticalCoords = [[6, 1], [5, 3], [7, 3], [6, 6], [6, 8]];
        const militaryCoords = [[17, 1], [15, 2], [19, 2], [14, 3], [20, 3], [14, 4], [20, 4], [16, 5], [19, 5], [17, 6], [15, 7], [19, 7], [17, 8]];
        const economyCoords = [[25, 1], [23, 2], [27, 2], [22, 3], [28, 3], [23, 4], [27, 4], [23, 5], [27, 5], [25, 6], [23, 7], [27, 7], [25, 8]];
        const regionCoords = [[33, 1], [31, 2], [35, 2], [30, 3], [36, 3], [30, 4], [36, 4], [33, 5]];
        const terminalCoords = [[5, 9], [0, 10], [3, 10], [7, 10], [10, 10], [5, 11]];

        function branchNames(tree) {
            return [...new Set(tree.map(focus => focus.branch))];
        }

        function sortedBranch(tree, branch) {
            return tree
                .filter(focus => focus.branch === branch)
                .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
        }

        function placeItems(items, coords) {
            items.forEach((focus, index) => {
                const coord = coords[index] || coords[coords.length - 1];
                focus.x = coord[0];
                focus.y = coord[1] + Math.max(0, index - coords.length + 1);
            });
        }

        function placeBranch(tree, branch, coords) {
            if (!branch) return;
            placeItems(sortedBranch(tree, branch), coords);
        }

        function placeVerticalBranch(tree, branch, x, startY) {
            placeBranch(tree, branch, Array.from({ length: 12 }, (_, index) => [x, startY + index]));
        }

        // 7 节点（6 主路 + 1 支线）的政治路线：在 P3 处一分二，再合流
        // 排序结果（y, x, id）下的 7 个槽位：P1 / P2 / P3 主 / P3 支 / P4 / P5 / P6
        // 主路 P3 落在 col_x-1，支线 P3 落在 col_x+1，两者关于主轴 col_x 镜像
        function placeBranchedPoliticalPath(tree, branch, x, startY) {
            placeBranch(tree, branch, [
                [x, startY],
                [x, startY + 1],
                [x - 1, startY + 2],
                [x + 1, startY + 2],
                [x, startY + 3],
                [x, startY + 4],
                [x, startY + 5]
            ]);
        }

        // USA 政治路线为 7 节点链，分叉点放在中段 P4
        // 主路 P4 落在 col_x-1，支线 P4 落在 col_x+1，关于主轴对称
        function placeBranchedUsaPoliticalPath(tree, branch, x, startY) {
            placeBranch(tree, branch, [
                [x, startY],
                [x, startY + 1],
                [x, startY + 2],
                [x - 1, startY + 3],
                [x + 1, startY + 3],
                [x, startY + 4],
                [x, startY + 5],
                [x, startY + 6]
            ]);
        }

        function placeTerminalBranch(tree, branch) {
            const items = sortedBranch(tree, branch);
            const coords = items.length === 5
                ? [[5, 9], [2, 10], [5, 10], [8, 10], [5, 11]]
                : terminalCoords;
            placeItems(items, coords);
        }

        function placeRegularFaction(factionId) {
            const tree = GameState.focusTrees[factionId];
            if (!tree) return;
            const branches = branchNames(tree);

            placeBranch(tree, branches[0], [[11, 0]]);
            placeBranch(tree, branches[1], sharedPoliticalCoords);
            branches.slice(2, 6).forEach((branch, index) => {
                placeBranchedPoliticalPath(tree, branch, regularPoliticalX[index], 2);
            });
            placeBranch(tree, branches[6], militaryCoords);
            placeBranch(tree, branches[7], economyCoords);
            placeBranch(tree, branches[8], regionCoords);
            placeTerminalBranch(tree, branches[9]);
        }

        function placeNewEngland() {
            const tree = GameState.focusTrees.NEN;
            if (!tree) return;
            const branches = branchNames(tree);

            placeBranch(tree, branches[0], [[11, 0]]);
            placeBranch(tree, branches[1], sharedPoliticalCoords);
            branches.slice(2, 6).forEach((branch, index) => {
                placeBranchedPoliticalPath(tree, branch, regularPoliticalX[index], 2);
            });
            placeBranch(tree, branches[6], [[3, 9], [2, 10], [4, 10], [3, 11], [3, 12]]);
            placeBranch(tree, branches[7], [[7, 9], [6, 10], [8, 10], [7, 11], [7, 12]]);
            placeBranch(tree, branches[8], [[11, 9], [10, 10], [12, 10], [11, 11], [11, 12]]);
            placeBranch(tree, branches[9], militaryCoords);
            placeBranch(tree, branches[10], economyCoords);
            placeBranch(tree, branches[11], regionCoords);
            placeBranch(tree, branches[12], [[13, 8], [13, 9], [13, 10], [7, 13]]);
        }

        function placeUsa() {
            const tree = GameState.focusTrees.USA;
            if (!tree) return;
            const branches = branchNames(tree);

            placeBranch(tree, branches[0], [[12, 0]]);
            placeBranch(tree, branches[1], [[6, 1], [6, 9], [6, 10]]);
            placeBranchedUsaPoliticalPath(tree, branches[2], 1, 2);
            placeBranchedUsaPoliticalPath(tree, branches[3], 5, 2);
            placeBranchedUsaPoliticalPath(tree, branches[4], 9, 2);
            // 军事改革（10 节点，按实际拓扑排布）：
            //   y=1 战争部 → y=2 麦克阿瑟 → y=3 总参/战区指挥(mutex) + 五角大楼侧线 →
            //   y=4 麦克奈尔 → y=5 装甲/步兵(mutex) → y=6 联合战役 → y=7 军管区(汇合)
            // 注意排序键是 (y,x,id)：五角大楼 (y=4,x=7) 排在麦克奈尔 (y=4,x=9) 前面，
            // 因此 coords[4] 给五角大楼侧线，coords[5] 给麦克奈尔主线。
            placeBranch(tree, branches[5], [
                [15, 1], [15, 2], [13, 3], [17, 3], [20, 3], [15, 4], [13, 5], [17, 5], [15, 6], [20, 7]
            ]);
            // 经济动员（8 节点）：
            //   y=1 紧急工业 → y=2 战争债券 → y=3 首都兵工厂 →
            //   y=4 军工/民用(mutex) → y=5 财政部重组 → y=6 全面战争生产 + 联邦铁路合同
            placeBranch(tree, branches[6], [
                [25, 1], [25, 2], [25, 3], [23, 4], [27, 4], [25, 5], [23, 6], [27, 6]
            ]);
            // 海空军：终端节点改为直接位于父节点下方
            placeBranch(tree, branches[7], [[31, 1], [29, 2], [33, 2], [31, 3], [31, 4]]);
            placeBranch(tree, branches[8], [[40, 1], [40, 2]]);
            placeBranch(tree, branches[9], [[38, 3], [40, 3], [42, 3], [40, 4]]);
            placeBranch(tree, branches[10], [[37, 5]]);
            placeBranch(tree, branches[11], [[40, 5]]);
            placeBranch(tree, branches[12], [[43, 5]]);
            placeBranch(tree, branches[13], [[40, 6], [38, 7], [42, 7], [36, 8], [40, 8], [44, 8], [38, 9], [42, 9], [40, 10]]);
        }

        // PAC（太平洋国）、AUS（联盟国）、CSA（联合工团）使用各自数据文件里的手工坐标，给每条线独立形状，故不走通用布局。
        [].forEach(placeRegularFaction);
    }

    // ============================================================
    // 入口
    // ============================================================
    rebuildUsaPoliticalDepth();
    GameState.focusTrees.CSA = buildCsaTree();
    GameState.focusTrees.AUS = buildAusTree();
    GameState.focusTrees.CON = buildConTree();
    GameState.focusTrees.NEN = buildNenTree();
    GameState.focusTrees.PAC = buildPacTree();
    GameState.focusTrees.WDC = buildWdcTree();
    GameState.focusTrees.TEX = buildTexTree();
    applyPoliticalBranching();
    addStrategicDetours();
    extendSignatureArcs();
    rebalancePoliticalFocusEffects();
    applyReadableFocusTreeLayouts();
})();
