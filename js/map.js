/**
 * SVG map data and helpers.
 * Coordinates are normalized to a 1000 x 620 viewBox.
 */

const MapData = {
    initialNodes: [
        { id: 'SEA', abbr: 'SEA', name: '西雅图', factionId: 'PAC', x: 96, y: 86, row: 0, col: 0, industry: 2, troops: 4, terrain: '港口城市', tags: ['港口'] },
        { id: 'POR', abbr: 'POR', name: '波特兰', factionId: 'PAC', x: 104, y: 154, row: 1, col: 0, industry: 1, troops: 3, terrain: '港口城市', tags: ['港口'] },
        { id: 'SFO', abbr: 'SFO', name: '旧金山', factionId: 'PAC', x: 116, y: 278, row: 2, col: 0, industry: 3, troops: 5, terrain: '港口城市', tags: ['港口'] },
        { id: 'SAC', abbr: 'SAC', name: '萨克拉门托', factionId: 'PAC', x: 154, y: 236, row: 2, col: 1, industry: 3, troops: 6, terrain: '太平洋国首府', tags: ['首都'], isCapital: true },
        { id: 'LAX', abbr: 'LAX', name: '洛杉矶', factionId: 'PAC', x: 154, y: 390, row: 4, col: 0, industry: 3, troops: 4, terrain: '港口城市', tags: ['港口'] },

        { id: 'BOI', abbr: 'BOI', name: '博伊西', factionId: 'WDC', x: 232, y: 150, row: 1, col: 1, industry: 1, troops: 2, terrain: '山地城市', tags: [] },
        { id: 'BIL', abbr: 'BIL', name: '比林斯', factionId: 'WDC', x: 364, y: 112, row: 0, col: 2, industry: 1, troops: 2, terrain: '落基山前沿', tags: [] },
        { id: 'RNO', abbr: 'RNO', name: '里诺', factionId: 'WDC', x: 226, y: 286, row: 2, col: 1, industry: 1, troops: 2, terrain: '山地荒漠', tags: [] },
        { id: 'SLC', abbr: 'SLC', name: '盐湖城', factionId: 'WDC', x: 332, y: 286, row: 2, col: 2, industry: 1, troops: 2, terrain: '高原城市', tags: [] },
        { id: 'DEN', abbr: 'DEN', name: '丹佛', factionId: 'WDC', x: 442, y: 330, row: 3, col: 3, industry: 2, troops: 5, terrain: '山地军区', tags: ['首都'], isCapital: true },
        { id: 'PHX', abbr: 'PHX', name: '凤凰城', factionId: 'WDC', x: 304, y: 438, row: 4, col: 2, industry: 1, troops: 2, terrain: '荒漠城市', tags: [] },
        { id: 'ABQ', abbr: 'ABQ', name: '阿尔伯克基', factionId: 'WDC', x: 392, y: 442, row: 4, col: 3, industry: 1, troops: 2, terrain: '高原荒漠', tags: [] },

        { id: 'FGO', abbr: 'FGO', name: '法戈', factionId: 'AUS', x: 522, y: 128, row: 0, col: 4, industry: 1, troops: 3, terrain: '北部平原', tags: [] },
        { id: 'OMA', abbr: 'OMA', name: '奥马哈', factionId: 'AUS', x: 542, y: 262, row: 2, col: 4, industry: 1, troops: 3, terrain: '铁路枢纽', tags: [] },
        { id: 'KAN', abbr: 'KAN', name: '堪萨斯城', factionId: 'AUS', x: 548, y: 362, row: 3, col: 4, industry: 2, troops: 3, terrain: '平原城市', tags: [] },
        { id: 'OKC', abbr: 'OKC', name: '俄克拉荷马城', factionId: 'AUS', x: 526, y: 452, row: 4, col: 4, industry: 2, troops: 3, terrain: '平原油田', tags: ['油田'] },
        { id: 'STL', abbr: 'STL', name: '圣路易斯', factionId: 'AUS', x: 640, y: 342, row: 3, col: 5, industry: 3, troops: 4, terrain: '河港城市', tags: [] },
        { id: 'LRK', abbr: 'LRK', name: '小石城', factionId: 'AUS', x: 616, y: 438, row: 4, col: 5, industry: 1, troops: 3, terrain: '河谷城市', tags: [] },
        { id: 'BAT', abbr: 'BAT', name: '巴吞鲁日', factionId: 'AUS', x: 642, y: 532, row: 5, col: 5, industry: 2, troops: 5, terrain: '联盟国首府', tags: ['首都', '油田'], isCapital: true },
        { id: 'NOL', abbr: 'NOL', name: '新奥尔良', factionId: 'AUS', x: 688, y: 558, row: 5, col: 6, industry: 2, troops: 3, terrain: '港口城市', tags: ['港口'] },

        { id: 'MSP', abbr: 'MSP', name: '明尼阿波利斯', factionId: 'CSA', x: 600, y: 166, row: 0, col: 5, industry: 2, troops: 4, terrain: '湖区城市', tags: [] },
        { id: 'MIL', abbr: 'MIL', name: '密尔沃基', factionId: 'CSA', x: 658, y: 174, row: 0, col: 6, industry: 2, troops: 4, terrain: '工业港口', tags: ['港口'] },
        { id: 'CHI', abbr: 'CHI', name: '芝加哥', factionId: 'CSA', x: 676, y: 238, row: 1, col: 6, industry: 4, troops: 8, terrain: '工团首府', tags: ['首都'], isCapital: true },
        { id: 'DET', abbr: 'DET', name: '底特律', factionId: 'CSA', x: 748, y: 212, row: 0, col: 7, industry: 3, troops: 6, terrain: '汽车工业城', tags: [] },
        { id: 'CLE', abbr: 'CLE', name: '克利夫兰', factionId: 'CSA', x: 798, y: 250, row: 1, col: 8, industry: 2, troops: 5, terrain: '湖岸工业城', tags: [] },
        { id: 'PIT', abbr: 'PIT', name: '匹兹堡', factionId: 'CSA', x: 808, y: 300, row: 2, col: 8, industry: 2, troops: 4, terrain: '钢铁城市', tags: [] },

        { id: 'WAS', abbr: 'WAS', name: '华盛顿', factionId: 'USA', x: 860, y: 326, row: 2, col: 9, industry: 3, troops: 6, terrain: '军政府首都', tags: ['首都'], isCapital: true },
        { id: 'BAL', abbr: 'BAL', name: '巴尔的摩', factionId: 'USA', x: 842, y: 292, row: 2, col: 8, industry: 2, troops: 4, terrain: '港口城市', tags: ['港口'] },
        { id: 'PHI', abbr: 'PHI', name: '费城', factionId: 'USA', x: 872, y: 258, row: 1, col: 9, industry: 2, troops: 4, terrain: '工业城市', tags: [] },
        { id: 'NYC', abbr: 'NYC', name: '纽约', factionId: 'USA', x: 902, y: 220, row: 0, col: 9, industry: 3, troops: 4, terrain: '港口都会', tags: ['港口'] },
        { id: 'RIC', abbr: 'RIC', name: '里士满', factionId: 'USA', x: 840, y: 372, row: 3, col: 9, industry: 2, troops: 3, terrain: '前线城市', tags: [] },
        { id: 'NOR', abbr: 'NOR', name: '诺福克', factionId: 'USA', x: 878, y: 390, row: 3, col: 10, industry: 2, troops: 3, terrain: '军港', tags: ['港口'] },

        { id: 'ALB', abbr: 'ALB', name: '奥尔巴尼', factionId: 'NEN', x: 890, y: 176, row: 0, col: 8, industry: 2, troops: 3, terrain: '山麓城市', tags: [] },
        { id: 'HFD', abbr: 'HFD', name: '哈特福德', factionId: 'NEN', x: 920, y: 194, row: 0, col: 10, industry: 2, troops: 3, terrain: '新英格兰工业城', tags: [] },
        { id: 'BOS', abbr: 'BOS', name: '波士顿', factionId: 'NEN', x: 944, y: 162, row: 0, col: 11, industry: 3, troops: 5, terrain: '新英格兰首府', tags: ['首都', '港口'], isCapital: true },
        { id: 'MNE', abbr: 'MNE', name: '缅因', factionId: 'NEN', x: 958, y: 104, row: 0, col: 12, industry: 1, troops: 2, terrain: '森林海岸', tags: [] },

        { id: 'ATL', abbr: 'ATL', name: '亚特兰大', factionId: 'CON', x: 760, y: 456, row: 4, col: 7, industry: 3, troops: 6, terrain: '宪政国首府', tags: ['首都'], isCapital: true },
        { id: 'BHM', abbr: 'BHM', name: '伯明翰', factionId: 'CON', x: 704, y: 486, row: 4, col: 6, industry: 3, troops: 4, terrain: '钢铁工业区', tags: [] },
        { id: 'CHA', abbr: 'CHA', name: '夏洛特', factionId: 'CON', x: 820, y: 424, row: 3, col: 8, industry: 3, troops: 4, terrain: '卡罗莱纳工业城', tags: [] },
        { id: 'CLM', abbr: 'CLM', name: '哥伦比亚', factionId: 'CON', x: 816, y: 458, row: 4, col: 8, industry: 1, troops: 3, terrain: '内陆城市', tags: [] },
        { id: 'SAV', abbr: 'SAV', name: '萨凡纳', factionId: 'CON', x: 820, y: 506, row: 5, col: 8, industry: 2, troops: 3, terrain: '港口城市', tags: ['港口'] },
        { id: 'JAX', abbr: 'JAX', name: '杰克逊维尔', factionId: 'CON', x: 826, y: 564, row: 5, col: 9, industry: 2, troops: 3, terrain: '佛州港口', tags: ['港口'] },

        { id: 'ELP', abbr: 'ELP', name: '埃尔帕索', factionId: 'TEX', x: 408, y: 552, row: 5, col: 3, industry: 2, troops: 3, terrain: '边境城市', tags: [] },
        { id: 'DAL', abbr: 'DAL', name: '达拉斯', factionId: 'TEX', x: 504, y: 520, row: 5, col: 4, industry: 3, troops: 6, terrain: '德克萨斯首府', tags: ['首都', '油田'], isCapital: true },
        { id: 'HOU', abbr: 'HOU', name: '休斯敦', factionId: 'TEX', x: 552, y: 580, row: 6, col: 4, industry: 3, troops: 4, terrain: '港口油田', tags: ['港口', '油田'] },
        { id: 'SAT', abbr: 'SAT', name: '圣安东尼奥', factionId: 'TEX', x: 456, y: 584, row: 6, col: 3, industry: 2, troops: 3, terrain: '边境城市', tags: [] }
    ],

    connections: [
        ['SEA', 'POR'], ['POR', 'SFO'], ['POR', 'BOI'], ['SFO', 'SAC'], ['SAC', 'LAX'], ['SAC', 'RNO'], ['LAX', 'PHX'],
        ['BOI', 'BIL'], ['BOI', 'RNO'], ['RNO', 'SLC'], ['RNO', 'PHX'], ['SLC', 'BIL'], ['SLC', 'DEN'], ['SLC', 'ABQ'],
        ['BIL', 'DEN'], ['BIL', 'FGO'], ['DEN', 'OMA'], ['DEN', 'KAN'], ['DEN', 'ABQ'], ['PHX', 'ABQ'], ['PHX', 'ELP'],
        ['FGO', 'MSP'], ['FGO', 'OMA'], ['OMA', 'MSP'], ['OMA', 'CHI'], ['OMA', 'KAN'], ['KAN', 'STL'], ['KAN', 'OKC'], ['OKC', 'ABQ'], ['OKC', 'DAL'], ['OKC', 'LRK'],
        ['STL', 'CHI'], ['STL', 'PIT'], ['STL', 'LRK'], ['LRK', 'BAT'], ['LRK', 'BHM'], ['BAT', 'NOL'], ['BAT', 'HOU'], ['NOL', 'HOU'], ['NOL', 'SAV'],
        ['MSP', 'MIL'], ['MIL', 'CHI'], ['CHI', 'DET'], ['CHI', 'CLE'], ['DET', 'CLE'], ['DET', 'ALB'], ['CLE', 'PIT'], ['PIT', 'PHI'], ['PIT', 'BAL'], ['PIT', 'WAS'],
        ['ALB', 'NYC'], ['ALB', 'HFD'], ['HFD', 'BOS'], ['BOS', 'MNE'], ['HFD', 'NYC'], ['NYC', 'PHI'], ['PHI', 'BAL'], ['BAL', 'WAS'], ['WAS', 'RIC'], ['RIC', 'NOR'],
        ['RIC', 'CHA'], ['NOR', 'CLM'], ['ATL', 'BHM'], ['ATL', 'CHA'], ['ATL', 'CLM'], ['ATL', 'SAV'], ['BHM', 'LRK'], ['BHM', 'BAT'], ['CLM', 'CHA'], ['CLM', 'SAV'], ['SAV', 'JAX'],
        ['ELP', 'ABQ'], ['ELP', 'SAT'], ['SAT', 'DAL'], ['SAT', 'HOU'], ['DAL', 'HOU'], ['DAL', 'OKC']
    ],

    nodes: [],

    reset() {
        this.nodes = this.initialNodes.map(node => ({
            ...node,
            tags: [...node.tags],
            movedThisTurn: false,
            moveReady: node.troops,
            freshTroops: 0
        }));
    },

    getNode(nodeId) {
        return this.nodes.find(node => node.id === nodeId);
    },

    getFactionNodes(factionId) {
        return this.nodes.filter(node => node.factionId === factionId);
    },

    getNeighbors(nodeId) {
        return this.connections
            .filter(([a, b]) => a === nodeId || b === nodeId)
            .map(([a, b]) => (a === nodeId ? b : a))
            .map(id => this.getNode(id))
            .filter(Boolean);
    },

    areAdjacent(sourceId, targetId) {
        return this.connections.some(([a, b]) => (
            (a === sourceId && b === targetId) || (a === targetId && b === sourceId)
        ));
    },

    /**
     * 判断节点是否被"包围"：与之相邻（直接联通）的所有其它节点都属于敌方阵营。
     * 没有邻居的孤岛节点不算被包围。
     */
    isNodeEncircled(node) {
        if (!node || !node.factionId) return false;
        const neighbors = this.getNeighbors(node.id);
        if (neighbors.length === 0) return false;
        return neighbors.every(neighbor => neighbor.factionId && neighbor.factionId !== node.factionId);
    },

    getMoveTargets(sourceId, factionId) {
        const source = this.getNode(sourceId);
        if (!source || source.factionId !== factionId || GameState.getNodeMovableTroops(source) < 1) return [];
        return this.getNeighbors(sourceId).filter(node => node.factionId === factionId);
    },

    getAttackTargets(sourceId, factionId) {
        const source = this.getNode(sourceId);
        if (!source || source.factionId !== factionId || GameState.getNodeMovableTroops(source) < 1) return [];
        return this.getNeighbors(sourceId).filter(node => node.factionId !== factionId);
    },

    calculateFactionStats(factionId) {
        return this.getFactionNodes(factionId).reduce((totals, node) => {
            totals.nodes += 1;
            totals.totalIndustry += node.industry;
            totals.totalTroops += node.troops;
            return totals;
        }, { nodes: 0, totalIndustry: 0, totalTroops: 0 });
    },

    getRanking(metric) {
        return GameState.factions.map(faction => {
            const stats = this.calculateFactionStats(faction.id);
            const capital = this.getNode(faction.capitalNodeId);
            return {
                ...faction,
                ...stats,
                capitalHeld: Boolean(capital && capital.factionId === faction.id),
                value: metric === 'industry'
                    ? stats.totalIndustry
                    : metric === 'troops'
                        ? stats.totalTroops
                        : stats.nodes
            };
        }).sort((a, b) => b.value - a.value);
    }
};

MapData.reset();
window.MapData = MapData;

const MapView = {
    render() {
        return GameState.game.showGridView ? this.renderGridView() : this.renderStrategicView();
    },

    renderStrategicView() {
        const game = GameState.game;
        const playerFactionId = GameState.getPlayerFactionId();
        const selectedNode = MapData.getNode(game.selectedNodeId);
        const moveTargets = selectedNode ? MapData.getMoveTargets(selectedNode.id, playerFactionId).map(node => node.id) : [];
        const attackTargets = selectedNode ? MapData.getAttackTargets(selectedNode.id, playerFactionId).map(node => node.id) : [];
        const viewport = game.mapViewport;

        const linkHtml = MapData.connections.map(([sourceId, targetId]) => {
            const source = MapData.getNode(sourceId);
            const target = MapData.getNode(targetId);
            if (!source || !target) return '';

            const isHot = selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id);
            return `
                <line class="map-link ${isHot ? 'hot' : ''}"
                    x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />
            `;
        }).join('');

        const nodeHtml = MapData.nodes.map(node => this.renderNode(node, {
            selectedNodeId: game.selectedNodeId,
            hoveredNodeId: game.hoveredNodeId,
            moveTargets,
            attackTargets,
            playerFactionId
        })).join('');

        return `
            <div class="map-command-strip">
                <button class="btn btn-outline" onclick="window.app.toggleGridView()">网格视图</button>
                <button class="map-icon-btn" title="放大" onclick="window.app.zoomMap(0.85)">+</button>
                <button class="map-icon-btn" title="缩小" onclick="window.app.zoomMap(1.15)">-</button>
                <button class="btn btn-outline mobile-map-shortcut" onclick="window.app.centerCapital()">首都</button>
                <button class="btn btn-outline mobile-map-shortcut" onclick="window.app.centerSelectedNode()">选中</button>
                <button class="btn btn-outline" onclick="window.app.resetMapViewport()">重置视角</button>
            </div>
            <svg id="svg-map" viewBox="${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}" aria-label="战略地图">
                <defs>
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g class="background-map-shape">
                    <path d="M78 100 C160 42 284 52 382 84 C484 34 602 72 696 116 C812 122 902 150 952 214 C918 258 936 336 884 384 C828 438 758 496 660 548 C568 590 448 578 356 542 C270 510 182 476 132 408 C84 342 52 224 78 100 Z" />
                    <path class="background-map-coast" d="M116 92 C104 172 112 250 152 328 C188 408 248 478 344 526" />
                    <path class="background-map-coast" d="M904 180 C856 246 844 320 870 392" />
                </g>

                <g class="region-blocks">
                    <path class="region-block pacific" d="M72 80 L260 104 L296 450 L150 430 L92 314 Z" />
                    <path class="region-block plains" d="M266 92 L584 110 L596 472 L346 460 Z" />
                    <path class="region-block lakes" d="M560 110 L824 154 L814 318 L612 326 Z" />
                    <path class="region-block atlantic" d="M792 154 L956 158 L926 356 L814 334 Z" />
                    <path class="region-block south" d="M500 392 L804 380 L742 578 L446 584 Z" />
                </g>

                <g class="map-links-layer">${linkHtml}</g>
                <g class="map-nodes-layer">${nodeHtml}</g>
            </svg>
            ${this.renderTooltip()}
        `;
    },

    renderNode(node, context) {
        const faction = GameState.getFaction(node.factionId);
        const color = faction.color;
        const isSelected = node.id === context.selectedNodeId;
        const isHovered = node.id === context.hoveredNodeId;
        const isFriendly = node.factionId === context.playerFactionId;
        const canMove = context.moveTargets.includes(node.id);
        const canAttack = context.attackTargets.includes(node.id);
        const movableTroops = GameState.getNodeMovableTroops(node);
        const hasMoveReady = isFriendly && movableTroops > 0;
        const isMoveTarget = GameState.game.currentAction === 'move' && canMove;
        const isActionTarget = isMoveTarget || canAttack;
        const currentCapitalOwner = GameState.getCapitalOwner(node.id);
        const isCapitalMarker = node.isCapital || currentCapitalOwner;
        const isEncircled = MapData.isNodeEncircled(node);
        const classNames = [
            'map-node',
            isSelected ? 'selected' : '',
            isHovered ? 'hovered' : '',
            isFriendly ? 'friendly' : 'hostile',
            hasMoveReady ? 'has-move-ready' : '',
            canMove ? 'can-move' : '',
            canAttack ? 'can-attack' : '',
            isActionTarget ? 'action-target' : '',
            isEncircled ? 'is-encircled' : ''
        ].filter(Boolean).join(' ');

        return `
            <g class="${classNames}" transform="translate(${node.x} ${node.y})"
                onmouseenter="window.app.hoverNode('${node.id}')"
                onmouseleave="window.app.hoverNode(null)"
                onclick="event.stopPropagation(); window.app.handleNodeClick('${node.id}')"
                ondblclick="event.stopPropagation(); window.app.centerNode('${node.id}')">
                <circle class="node-hit-area" r="30"></circle>
                ${isMoveTarget ? '<circle class="target-pulse move" r="31"></circle>' : ''}
                ${canAttack ? '<circle class="target-pulse attack" r="31"></circle>' : ''}
                ${isEncircled ? '<circle class="encircled-ring" r="27"></circle>' : ''}
                <circle class="control-ring" r="23" stroke="${color}"></circle>
                <circle class="node-base" r="17" fill="rgba(15, 23, 42, 0.96)" stroke="${color}"></circle>
                <text class="node-troops" text-anchor="middle" y="5">${node.troops}</text>
                ${hasMoveReady ? `
                    <g class="move-ready-badge" transform="translate(-19 17)">
                        <rect x="-9" y="-8" width="18" height="14" rx="3"></rect>
                        <text text-anchor="middle" y="3">${movableTroops}</text>
                    </g>
                ` : ''}
                <text class="node-abbr" text-anchor="middle" y="38">${node.abbr}</text>
                <g class="industry-badge" transform="translate(12 -24)">
                    <rect x="-10" y="-10" width="20" height="16" rx="3"></rect>
                    <text text-anchor="middle" y="2">${node.industry}</text>
                </g>
                ${isCapitalMarker ? '<text class="capital-marker" text-anchor="middle" x="-20" y="-20">★</text>' : ''}
                ${node.tags.includes('港口') ? '<text class="node-tag" text-anchor="middle" x="24" y="-17">P</text>' : ''}
                ${node.tags.includes('油田') ? '<text class="node-tag oil" text-anchor="middle" x="24" y="-2">O</text>' : ''}
            </g>
        `;
    },

    renderGridView() {
        const maxCol = Math.max(...MapData.nodes.map(node => node.col));
        const rows = [...new Set(MapData.nodes.map(node => node.row))].sort((a, b) => a - b);
        const selectedNodeId = GameState.game.selectedNodeId;

        const rowsHtml = rows.map(row => {
            const cells = MapData.nodes
                .filter(node => node.row === row)
                .sort((a, b) => a.col - b.col)
                .map(node => {
                    const faction = GameState.getFaction(node.factionId);
                    const isSelected = selectedNodeId === node.id;
                    return `
                        <button class="grid-cell ${isSelected ? 'selected' : ''}" style="--faction-color: ${faction.color}; grid-column: ${node.col + 1};"
                            onclick="window.app.handleNodeClick('${node.id}')"
                            onmouseenter="window.app.hoverNode('${node.id}')"
                            onmouseleave="window.app.hoverNode(null)">
                            <strong>${node.abbr}</strong>
                            <span>${node.factionId} / 工业 ${node.industry}${GameState.getCapitalOwner(node.id) ? ' / 当前首都' : node.isCapital ? ' / 原始首都' : ''}</span>
                            <b>驻军 ${node.troops} / 可动 ${GameState.getNodeMovableTroops(node)}</b>
                        </button>
                    `;
                }).join('');

            return `<div class="map-grid-row">${cells}</div>`;
        }).join('');

        return `
            <div class="map-command-strip">
                <button class="btn btn-primary" onclick="window.app.toggleGridView()">战略地图</button>
                <button class="btn btn-outline" onclick="window.app.resetMapViewport()">重置视角</button>
            </div>
            <div class="map-grid-view" style="--grid-columns: ${maxCol + 1}">
                ${rowsHtml}
            </div>
            ${this.renderTooltip()}
        `;
    },

    renderTooltip() {
        const node = MapData.getNode(GameState.game.hoveredNodeId);
        if (!node) return '';

        const neighbors = MapData.getNeighbors(node.id).map(neighbor => neighbor.name).join('、');
        const faction = GameState.getFaction(node.factionId);
        const currentCapitalOwner = GameState.getCapitalOwner(node.id);
        const originalCapitalOwner = GameState.getOriginalCapitalOwner(node.id);
        const encircled = MapData.isNodeEncircled(node);

        return `
            <div class="map-tooltip" style="--faction-color: ${faction.color}">
                <div class="tooltip-title">${node.name}</div>
                <div>控制：${faction.name}</div>
                ${currentCapitalOwner ? `<div>当前首都：${GameState.getFactionName(currentCapitalOwner)}</div>` : ''}
                ${originalCapitalOwner && originalCapitalOwner !== currentCapitalOwner ? `<div>原始首都：${GameState.getFactionName(originalCapitalOwner)}</div>` : ''}
                <div>地形：${node.terrain}</div>
                <div>工业：${node.industry}</div>
                <div>驻军：${node.troops}</div>
                <div>可动士兵：${GameState.getNodeMovableTroops(node)}</div>
                <div>本回合新兵：${GameState.getNodeFreshTroops(node)}</div>
                ${encircled ? `<div class="danger-text">⚠ 被包围：进攻 -35% / 防守 -35%</div>` : ''}
                <div>相邻：${neighbors}</div>
            </div>
        `;
    }
};
