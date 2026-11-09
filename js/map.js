/**
 * Campaign provinces and SVG map.
 * Coordinates are normalized to a 1000 x 620 viewBox.
 */

const MapData = {
    americanNodes: [
        { id: 'SEA', abbr: 'SEA', name: '西雅图', industry: 2, troops: 4, terrain: '港口城市', tags: ['港口'] },
        { id: 'POR', abbr: 'POR', name: '波特兰', industry: 1, troops: 3, terrain: '港口城市', tags: ['港口'] },
        { id: 'SFO', abbr: 'SFO', name: '旧金山', industry: 3, troops: 5, terrain: '港口城市', tags: ['港口'] },
        { id: 'SAC', abbr: 'SAC', name: '萨克拉门托', industry: 3, troops: 6, terrain: '太平洋国首府', tags: ['首都'], isCapital: true },
        { id: 'LAX', abbr: 'LAX', name: '洛杉矶', industry: 3, troops: 4, terrain: '港口城市', tags: ['港口'] },

        { id: 'BOI', abbr: 'BOI', name: '博伊西', industry: 1, troops: 2, terrain: '山地城市', tags: [] },
        { id: 'BIL', abbr: 'BIL', name: '比林斯', industry: 1, troops: 2, terrain: '落基山前沿', tags: [] },
        { id: 'RNO', abbr: 'RNO', name: '里诺', industry: 1, troops: 2, terrain: '山地荒漠', tags: [] },
        { id: 'SLC', abbr: 'SLC', name: '盐湖城', industry: 1, troops: 2, terrain: '高原城市', tags: [] },
        { id: 'DEN', abbr: 'DEN', name: '丹佛', industry: 2, troops: 5, terrain: '山地军区', tags: ['首都'], isCapital: true },
        { id: 'PHX', abbr: 'PHX', name: '凤凰城', industry: 1, troops: 2, terrain: '荒漠城市', tags: [] },
        { id: 'ABQ', abbr: 'ABQ', name: '阿尔伯克基', industry: 1, troops: 2, terrain: '高原荒漠', tags: [] },

        { id: 'FGO', abbr: 'FGO', name: '法戈', industry: 1, troops: 3, terrain: '北部平原', tags: [] },
        { id: 'OMA', abbr: 'OMA', name: '奥马哈', industry: 1, troops: 3, terrain: '铁路枢纽', tags: [] },
        { id: 'KAN', abbr: 'KAN', name: '堪萨斯城', industry: 2, troops: 3, terrain: '平原城市', tags: [] },
        { id: 'OKC', abbr: 'OKC', name: '俄克拉荷马城', industry: 2, troops: 3, terrain: '平原油田', tags: ['油田'] },
        { id: 'STL', abbr: 'STL', name: '圣路易斯', industry: 3, troops: 4, terrain: '河港城市', tags: [] },
        { id: 'LRK', abbr: 'LRK', name: '小石城', industry: 1, troops: 3, terrain: '河谷城市', tags: [] },
        { id: 'BAT', abbr: 'BAT', name: '巴吞鲁日', industry: 5, troops: 6, terrain: '联盟国首府', tags: ['首都', '油田'], isCapital: true },
        { id: 'NOL', abbr: 'NOL', name: '新奥尔良', industry: 4, troops: 3, terrain: '港口城市', tags: ['港口'] },
        { id: 'HOU', abbr: 'HOU', name: '休斯敦', industry: 2, troops: 4, terrain: '港口油田', tags: ['港口', '油田'] },

        { id: 'MSP', abbr: 'MSP', name: '明尼阿波利斯', industry: 2, troops: 4, terrain: '湖区城市', tags: [] },
        { id: 'MIL', abbr: 'MIL', name: '密尔沃基', industry: 2, troops: 4, terrain: '工业港口', tags: ['港口'] },
        { id: 'CHI', abbr: 'CHI', name: '芝加哥', industry: 4, troops: 8, terrain: '工团首府', tags: ['首都'], isCapital: true },
        { id: 'DET', abbr: 'DET', name: '底特律', industry: 3, troops: 6, terrain: '汽车工业城', tags: [] },
        { id: 'CLE', abbr: 'CLE', name: '克利夫兰', industry: 2, troops: 5, terrain: '湖岸工业城', tags: [] },
        { id: 'PIT', abbr: 'PIT', name: '匹兹堡', industry: 2, troops: 1, terrain: '钢铁城市', tags: [] },

        { id: 'WAS', abbr: 'WAS', name: '华盛顿', industry: 3, troops: 6, terrain: '军政府首都', tags: ['首都'], isCapital: true },
        { id: 'BAL', abbr: 'BAL', name: '巴尔的摩', industry: 2, troops: 4, terrain: '港口城市', tags: ['港口'] },
        { id: 'PHI', abbr: 'PHI', name: '费城', industry: 2, troops: 4, terrain: '工业城市', tags: [] },
        { id: 'NYC', abbr: 'NYC', name: '纽约', industry: 3, troops: 4, terrain: '港口都会', tags: ['港口'] },
        { id: 'RIC', abbr: 'RIC', name: '里士满', industry: 2, troops: 3, terrain: '前线城市', tags: [] },
        { id: 'NOR', abbr: 'NOR', name: '诺福克', industry: 2, troops: 3, terrain: '军港', tags: ['港口'] },

        { id: 'ALB', abbr: 'ALB', name: '奥尔巴尼', industry: 1, troops: 3, terrain: '山麓城市', tags: [] },
        { id: 'HFD', abbr: 'HFD', name: '哈特福德', industry: 2, troops: 3, terrain: '新英格兰工业城', tags: [] },
        { id: 'BOS', abbr: 'BOS', name: '波士顿', industry: 2, troops: 5, terrain: '新英格兰首府', tags: ['首都', '港口'], isCapital: true },
        { id: 'MNE', abbr: 'MNE', name: '缅因', industry: 1, troops: 2, terrain: '森林海岸', tags: [] },

        { id: 'ATL', abbr: 'ATL', name: '亚特兰大', industry: 3, troops: 6, terrain: '宪政国首府', tags: ['首都'], isCapital: true },
        { id: 'BHM', abbr: 'BHM', name: '伯明翰', industry: 2, troops: 3, terrain: '钢铁工业区', tags: [] },
        { id: 'CHA', abbr: 'CHA', name: '夏洛特', industry: 2, troops: 3, terrain: '卡罗莱纳工业城', tags: [] },
        { id: 'CLM', abbr: 'CLM', name: '哥伦比亚', industry: 1, troops: 3, terrain: '内陆城市', tags: [] },
        { id: 'SAV', abbr: 'SAV', name: '萨凡纳', industry: 2, troops: 3, terrain: '港口城市', tags: ['港口'] },
        { id: 'JAX', abbr: 'JAX', name: '杰克逊维尔', industry: 1, troops: 3, terrain: '佛州港口', tags: ['港口'] },

        { id: 'ELP', abbr: 'ELP', name: '埃尔帕索', industry: 2, troops: 3, terrain: '边境城市', tags: [] },
        { id: 'DAL', abbr: 'DAL', name: '达拉斯', industry: 3, troops: 7, terrain: '德克萨斯首府', tags: ['首都', '油田'], isCapital: true },
        { id: 'SAT', abbr: 'SAT', name: '圣安东尼奥', industry: 2, troops: 3, terrain: '边境城市', tags: [] },
        { id: 'DLH', abbr: 'DLH', name: '德卢斯', industry: 1, troops: 2, terrain: '苏必利尔湖港口', tags: ['港口'] },
        { id: 'CAM', abbr: 'CAM', name: '卡姆登', industry: 2, troops: 3, terrain: '特拉华河港', tags: ['港口'] }
    ].map(node => {
        const [x, y, , , factionId] = ProvinceGeography.provinces[node.id];
        return { ...node, x, y, factionId };
    }),

    americanGeography: { ...ProvinceGeography, connections: ProvinceGeography.borders.map(([a, b]) => [a, b]) },

    get initialNodes() {
        return GameState.getScenario().map?.nodes || this.americanNodes;
    },

    get geography() {
        return GameState.getScenario().map || this.americanGeography;
    },

    get connections() {
        return this.geography.connections;
    },

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
        if (!GameState.isWarOpen()) return [];
        const source = this.getNode(sourceId);
        if (!source || source.factionId !== factionId || GameState.getNodeMovableTroops(source) < 1) return [];
        return this.getNeighbors(sourceId).filter(node => (
            node.factionId !== factionId && GameState.game.diplomacy[node.factionId]?.relation !== '停战'
        ));
    },

    calculateFactionStats(factionId, nodes = this.nodes) {
        return nodes.filter(node => node.factionId === factionId).reduce((totals, node) => {
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
                // 用 getFaction 取本局显示名（国策更名覆盖），再叠加静态字段与统计。
                ...GameState.getFaction(faction.id),
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
        return GameState.game.mapMode === 'list' ? this.renderProvinceList() : this.renderStrategicView();
    },

    renderStrategicView() {
        const game = GameState.game;
        const scenario = GameState.getScenario();
        const playerFactionId = GameState.getPlayerFactionId();
        const selected = MapData.getNode(game.selectedNodeId);
        const canIssueOrders = selected?.factionId === playerFactionId
            && GameState.getNodeMovableTroops(selected) > 0
            && window.app.getActionAvailability('move', selected.id).enabled;
        const ordering = canIssueOrders && game.currentAction === 'move';
        const moveTargets = new Set(ordering ? MapData.getMoveTargets(selected.id, playerFactionId).map(node => node.id) : []);
        const attackTargets = new Set(canIssueOrders ? MapData.getAttackTargets(selected.id, playerFactionId).map(node => node.id) : []);
        const industry = game.mapMode === 'industry';
        const viewport = game.mapViewport;
        const simultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
        const orders = simultaneous ? SimultaneousTurns.getOrders(playerFactionId) : [];
        const locked = simultaneous && !SimultaneousTurns.canLocalPlayerAct();
        const context = { selectedId: selected?.id, moveTargets, attackTargets, industry };
        const provinces = MapData.nodes.map(node => this.renderProvince(node, context)).join('');
        const markers = MapData.nodes.map(node => this.renderCity(node, context)).join('');

        return `
            ${this.renderToolbar()}
            <svg id="svg-map" class="strategy-atlas ${this.zoomClass(viewport.width)} ${industry ? 'atlas-industry' : ''}"
                viewBox="${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}" aria-label="${scenario.name}战略地图">
                <defs>
                    <marker id="planArrowMove" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0 0 0 6 8 3Z" fill="#79dcff"></path>
                    </marker>
                    <marker id="planArrowAttack" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0 0 0 6 8 3Z" fill="#ff9b86"></path>
                    </marker>
                </defs>
                ${MapData.geography.surroundings ? `<path class="atlas-surroundings" d="${MapData.geography.surroundings}"></path>` : ''}
                <g class="province-layer">${provinces}</g>
                ${MapData.geography.rivers ? `<path class="atlas-rivers" d="${MapData.geography.rivers}"></path>` : ''}
                <g class="atlas-context" aria-hidden="true">${this.renderMapContext(scenario)}</g>
                <g class="frontier-layer" aria-hidden="true">${this.renderFrontiers()}</g>
                <g class="territory-labels" aria-hidden="true">${industry ? '' : this.renderFactionLabels()}</g>
                <g class="map-nodes-layer" aria-hidden="true">${markers}</g>
                <g class="planned-orders-layer ${locked ? 'is-locked' : ''}">${this.renderPlannedOrders(orders, locked)}</g>
                <g class="resolution-movement-layer">${this.renderResolutionMovements()}</g>
            </svg>
            <div class="atlas-caption">
                <span class="atlas-coordinate">${scenario.mapLabel}</span>
                ${industry ? `<span class="atlas-industry-key">工业低 <i></i> 高</span>` : `
                    <span><i class="atlas-front-key"></i> 势力边界</span>
                    <span><i class="atlas-capital-key">★</i> 当前首都</span>
                `}
                ${ordering ? '<span class="atlas-order-hint">行军模式 · 点击高亮目标</span>'
                    : '<span class="atlas-desktop-hint">拖拽平移 · 滚轮缩放 · 右键下令</span>'}
                ${this.renderMapCredit(scenario)}
            </div>
            ${this.renderTooltip()}
        `;
    },

    renderMapCredit(scenario) {
        const credit = scenario.mapSource;
        return credit ? `<a class="atlas-map-credit" href="${credit.href}" target="_blank" rel="noopener noreferrer">${credit.label}</a>` : '';
    },

    renderMapContext(scenario) {
        const labels = scenario.mapLabels || [
            ['加拿大', 510, 31], ['墨西哥', 290, 560], ['太平洋', 66, 481],
            ['大西洋', 929, 376], ['墨西哥湾', 656, 568]
        ];
        return labels.map(([label, x, y]) => `<text x="${x}" y="${y}">${label}</text>`).join('');
    },

    renderToolbar() {
        const game = GameState.game;
        const list = game.mapMode === 'list';
        const industry = game.mapMode === 'industry';
        const simultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
        const count = simultaneous ? SimultaneousTurns.getOrders().length : 0;
        const canClear = count && SimultaneousTurns.canLocalPlayerAct();
        return `
            <div class="map-command-strip atlas-toolbar">
                <div class="atlas-tabs" role="group" aria-label="地图图层">
                    <button aria-pressed="${!list && !industry}" onclick="window.app.setMapMode('political')">政区</button>
                    <button aria-pressed="${!list && industry}" onclick="window.app.setMapMode('industry')">工业</button>
                    <button aria-pressed="${list}" onclick="window.app.setMapMode('list')">列表</button>
                </div>
                ${list ? '' : `
                    <div class="atlas-tools" role="group" aria-label="地图视角">
                        <button title="缩小地图" aria-label="缩小地图" onclick="window.app.zoomMap(1.25)">−</button>
                        <button title="放大地图" aria-label="放大地图" onclick="window.app.zoomMap(0.8)">+</button>
                        <button title="定位并放大到己方首都" onclick="window.app.centerCapital()">首都</button>
                        <button title="恢复全图视角" onclick="window.app.resetMapViewport()">全图</button>
                    </div>
                `}
                ${simultaneous ? `
                    <div class="atlas-plan-summary">
                        <span>行军令 <strong>${count}</strong></span>
                        <button ${canClear ? '' : 'disabled'} onclick="window.app.clearPlannedOrders()">清空</button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderProvince(node, context) {
        const selected = node.id === context.selectedId;
        const move = context.moveTargets.has(node.id);
        const attack = context.attackTargets.has(node.id);
        const color = context.industry
            ? this.mixHex('#334a52', '#e3b254', Math.min(1, Math.max(0, node.industry / 8)))
            : this.factionTerritoryColor(node.factionId);
        const faction = GameState.getFaction(node.factionId);
        const label = escapeHtml(`${node.name}省区，${faction.shortName}，驻军 ${node.troops}，工业 ${node.industry}`);
        return `
            <path class="map-province ${selected ? 'selected' : ''} ${move ? 'move-target' : ''} ${attack ? 'attack-target' : ''}"
                d="${MapData.geography.provinces[node.id][3]}" style="--province-color:${color}"
                data-province-id="${node.id}" tabindex="0" role="button" aria-pressed="${selected}" aria-label="${label}"></path>
        `;
    },

    renderFrontiers() {
        return MapData.geography.borders.map(([a, b, path]) => {
            const left = MapData.getNode(a);
            const right = MapData.getNode(b);
            if (left.factionId === right.factionId) return '';
            return `<path d="${path}"></path>`;
        }).join('');
    },

    renderFactionLabels() {
        const provinces = MapData.geography.provinces;
        const fontSize = GameState.getScenario().map ? 15 : 20;
        const placed = [];
        return GameState.factions.map(faction => {
            const nodes = MapData.getFactionNodes(faction.id);
            if (!nodes.length) return '';
            const area = nodes.reduce((sum, node) => sum + provinces[node.id][2], 0);
            const x = nodes.reduce((sum, node) => sum + node.x * provinces[node.id][2], 0) / area;
            const y = nodes.reduce((sum, node) => sum + node.y * provinces[node.id][2], 0) / area;
            const name = GameState.getFaction(faction.id).shortName;
            const width = name.length * fontSize;
            nodes.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
            const anchor = nodes.find(node => !placed.some(label => (
                Math.abs(node.y - label.y) < fontSize + 5 && Math.abs(node.x - label.x) < (width + label.width) / 2 + 5
            ))) || nodes[0];
            placed.push({ x: anchor.x, y: anchor.y, width });
            return `<text class="territory-label" x="${anchor.x}" y="${anchor.y - 18}">${escapeHtml(name)}</text>`;
        }).join('');
    },

    renderCity(node, context) {
        const currentCapital = Boolean(GameState.getCapitalOwner(node.id));
        const important = node.id === context.selectedId || context.moveTargets.has(node.id) || context.attackTargets.has(node.id);
        const crowded = MapData.nodes.some(other => node.id !== other.id && Math.hypot(node.x - other.x, node.y - other.y) < 19);
        const classes = ['map-city', important ? 'emphasis' : '', crowded ? 'crowded' : '',
            node.id === context.selectedId ? 'selected' : ''].join(' ');
        const value = context.industry ? node.industry : node.troops;
        const secondary = node.factionId === GameState.getPlayerFactionId() && !context.industry
            ? GameState.getNodeMovableTroops(node) : '';
        const counter = secondary === '' ? value : `${value}·${secondary}`;
        return `
            <g class="${classes}" transform="translate(${node.x} ${node.y})">
                ${currentCapital ? '<text class="city-capital" y="4">★</text>' : '<circle class="city-dot" r="2.7"></circle>'}
                <g class="city-detail">
                    <rect class="city-counter" x="-${counter.toString().length * 2.7 + 4}" y="-16"
                        width="${counter.toString().length * 5.4 + 8}" height="12" rx="2"></rect>
                    <text class="city-count" y="-7">${counter}</text>
                    <text class="city-name" y="13">${node.abbr}</text>
                </g>
            </g>
        `;
    },

    zoomClass(width) {
        const fraction = width / GameState.getMapOverview().width;
        if (fraction <= 0.3) return 'atlas-detail';
        if (fraction <= 0.53) return 'atlas-close';
        return fraction <= 0.79 ? 'atlas-mid' : 'atlas-overview';
    },

    applyTerritoryZoom(svg) {
        const level = this.zoomClass(GameState.game.mapViewport.width);
        svg.classList.remove('atlas-detail', 'atlas-close', 'atlas-mid', 'atlas-overview');
        svg.classList.add(level);
    },

    renderPlannedOrders(orders = [], locked = false) {
        return orders.map((order, index) => {
            const source = MapData.getNode(order.sourceId);
            const target = MapData.getNode(order.targetId);
            if (!source || !target) return '';
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const ux = dx / length;
            const uy = dy / length;
            const startX = source.x + ux * Math.min(10, length * 0.22);
            const startY = source.y + uy * Math.min(10, length * 0.22);
            const endX = target.x - ux * Math.min(13, length * 0.26);
            const endY = target.y - uy * Math.min(13, length * 0.26);
            const bend = (index % 2 === 0 ? 1 : -1) * Math.min(18, length * 0.12);
            const controlX = (startX + endX) / 2 - uy * bend;
            const controlY = (startY + endY) / 2 + ux * bend;
            const labelX = (startX + 2 * controlX + endX) / 4;
            const labelY = (startY + 2 * controlY + endY) / 4;
            const attack = order.kind === 'attack';
            const coordination = attack && window.SimultaneousTurns
                ? SimultaneousTurns.getAttackCoordination(order.targetId, order.factionId)
                : null;
            const coordinated = coordination && coordination.bonus > 0;
            return `
                <g class="planned-order ${attack ? 'attack' : 'move'} ${coordinated ? 'coordinated' : ''}" ${locked ? '' : `onclick="event.stopPropagation(); window.app.cancelPlannedOrder('${order.id}')"`}>
                    <title>${locked ? '计划已锁定，取消准备后可调整' : coordinated ? `${coordination.directions} 路围攻，进攻 +${coordination.bonus}%` : '点击撤销这道行军令'}</title>
                    <path d="M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}"
                        marker-end="url(#${attack ? 'planArrowAttack' : 'planArrowMove'})"></path>
                    <g class="planned-order-label" transform="translate(${labelX.toFixed(1)} ${labelY.toFixed(1)})">
                        <circle r="10"></circle><text text-anchor="middle" y="3">${order.amount}</text>
                    </g>
                </g>
            `;
        }).join('');
    },

    renderResolutionMovements() {
        const replay = window.app && window.app.resolutionAnimation;
        if (!replay) return '';
        const movements = Array.isArray(replay.movements) ? replay.movements : [];
        const engagements = Array.isArray(replay.engagements) ? replay.engagements : [];
        if (!movements.length && !engagements.length) return '';

        const elapsed = Math.max(0, (Date.now() - (Number(replay.startedAt) || Date.now())) / 1000);
        const movementDuration = Math.max(0.01, Number(replay.movementDuration) || 1.05);
        const baseDelay = Math.max(0, Number(replay.baseDelay) || 0);
        const staggerStep = Math.max(0, Number(replay.staggerStep) || 0);
        const impactDuration = Math.max(0.01, Number(replay.impactDuration) || 0.92);
        const movementDelay = index => baseDelay + Math.min(index * staggerStep, 0.28);

        const routeHtml = movements.map((movement, index) => {
            const source = MapData.getNode(movement.sourceId);
            const target = MapData.getNode(movement.targetId);
            if (!source || !target) return '';
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const ux = dx / length;
            const uy = dy / length;
            const startX = source.x + ux * Math.min(9, length * 0.22);
            const startY = source.y + uy * Math.min(9, length * 0.22);
            const endX = target.x - ux * Math.min(10, length * 0.26);
            const endY = target.y - uy * Math.min(10, length * 0.26);
            const bend = (index % 2 === 0 ? 1 : -1) * Math.min(18, length * 0.12);
            const controlX = (startX + endX) / 2 - uy * bend;
            const controlY = (startY + endY) / 2 + ux * bend;
            const motionControlX = (source.x + target.x) / 2 - uy * bend;
            const motionControlY = (source.y + target.y) / 2 + ux * bend;
            const routePath = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            const motionPath = `M ${source.x.toFixed(1)} ${source.y.toFixed(1)} Q ${motionControlX.toFixed(1)} ${motionControlY.toFixed(1)} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`;
            const begin = movementDelay(index) - elapsed;
            const faction = GameState.getFaction(movement.factionId);
            const color = (faction && faction.color) || '#94a3b8';
            const kind = movement.kind === 'move' ? 'move' : 'attack';
            const label = kind === 'attack' ? '进攻' : '调动';
            return `
                <g class="resolution-movement ${kind}" style="--movement-color:${color}">
                    <title>${GameState.getFactionName(movement.factionId)}${label}：${source.name} → ${target.name}，兵力 ${movement.amount}</title>
                    <path class="resolution-movement-route ${kind}" d="${routePath}">
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.82;1"
                            dur="${(movementDuration + 0.28).toFixed(2)}s" begin="${begin.toFixed(2)}s" fill="freeze"></animate>
                    </path>
                    <g class="resolution-unit-token ${kind}" opacity="0">
                        <circle r="12"></circle>
                        <text text-anchor="middle" dominant-baseline="central">${movement.amount}</text>
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.86;1"
                            dur="${(movementDuration + 0.24).toFixed(2)}s" begin="${begin.toFixed(2)}s" fill="freeze"></animate>
                        <animateMotion path="${motionPath}" dur="${movementDuration.toFixed(2)}s"
                            begin="${begin.toFixed(2)}s" rotate="0" fill="freeze"></animateMotion>
                    </g>
                </g>
            `;
        }).join('');

        const engagementHtml = engagements.map(engagement => {
            const target = MapData.getNode(engagement.targetId);
            if (!target) return '';
            const incomingIndexes = movements
                .map((movement, index) => movement.targetId === engagement.targetId ? index : -1)
                .filter(index => index >= 0);
            const latestMovementDelay = incomingIndexes.length
                ? Math.max(...incomingIndexes.map(index => movementDelay(index)))
                : baseDelay;
            const begin = latestMovementDelay + movementDuration - elapsed;
            const faction = GameState.getFaction(engagement.winnerFactionId);
            const color = (faction && faction.color) || '#f8fafc';
            const type = engagement.type === 'occupation' ? 'occupation' : 'battle';
            const resultLabel = type === 'occupation' ? '占领' : '交战';
            const resultText = `${resultLabel} · ${GameState.getFactionName(engagement.winnerFactionId)} ${engagement.survivors}`;
            return `
                <g class="resolution-engagement-pulse ${type}" transform="translate(${target.x} ${target.y})"
                    style="--winner-color:${color}" opacity="0">
                    <title>${target.name}：${resultText}</title>
                    <circle class="resolution-impact-ring" r="16">
                        <animate attributeName="r" values="16;38;48" keyTimes="0;.55;1"
                            dur="${impactDuration.toFixed(2)}s" begin="${begin.toFixed(2)}s" fill="freeze"></animate>
                    </circle>
                    <circle class="resolution-impact-core" r="13"></circle>
                    <path class="resolution-impact-mark" d="${type === 'battle' ? 'M -7 -7 L 7 7 M 7 -7 L -7 7' : 'M -7 1 L -1 7 L 8 -7'}"></path>
                    <text class="resolution-result-label" text-anchor="middle" y="-24">${resultText}</text>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.68;1"
                        dur="${impactDuration.toFixed(2)}s" begin="${begin.toFixed(2)}s" fill="freeze"></animate>
                </g>
            `;
        }).join('');

        return routeHtml + engagementHtml;
    },

    factionTerritoryColor(factionId) {
        const faction = GameState.getFaction(factionId);
        const baseHex = (faction && faction.color) || '#888888';
        let ideologyId = faction && faction.ideology;
        if (factionId === GameState.getPlayerFactionId()) {
            ideologyId = (GameState.game && GameState.game.currentIdeology) || ideologyId;
        }
        const ideology = ideologyId && GameState.ideologies ? GameState.ideologies[ideologyId] : null;
        return ideology && ideology.color ? this.mixHex(baseHex, ideology.color, 0.18) : baseHex;
    },

    mixHex(a, b, t) {
        const parse = (hex) => {
            let h = String(hex).replace('#', '');
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        };
        const ca = parse(a);
        const cb = parse(b);
        const mix = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
        return '#' + mix.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    },

    renderProvinceList() {
        const selectedId = GameState.game.selectedNodeId;
        const groups = GameState.factions.map(faction => {
            const nodes = MapData.getFactionNodes(faction.id);
            if (!nodes.length) return '';
            const label = escapeHtml(GameState.getFaction(faction.id).shortName);
            return `
                <section class="atlas-province-group" style="--faction-color:${faction.color}">
                    <h3>${label} <small>${nodes.length} 省区</small></h3>
                    <div>${nodes.map(node => `
                        <button class="grid-cell ${selectedId === node.id ? 'selected' : ''}"
                            aria-pressed="${selectedId === node.id}" onclick="window.app.inspectProvince('${node.id}')">
                            <strong>${node.name} <small>${node.abbr}</small></strong>
                            <span>驻军 ${node.troops} · 工业 ${node.industry}${GameState.getCapitalOwner(node.id) ? ' · ★' : ''}</span>
                        </button>
                    `).join('')}</div>
                </section>
            `;
        }).join('');
        return `${this.renderToolbar()}<div class="map-grid-view atlas-province-list">${groups}</div>`;
    },

    renderTooltip() {
        const node = MapData.getNode(GameState.game.hoveredNodeId);
        if (!node) return '';

        const faction = GameState.getFaction(node.factionId);
        return `
            <div class="map-tooltip atlas-tooltip" style="--faction-color:${faction.color}">
                <strong>${node.name}</strong> · ${escapeHtml(faction.shortName)}
                <span>驻军 ${node.troops} · 工业 ${node.industry}${MapData.isNodeEncircled(node) ? ' · 被包围' : ''}</span>
            </div>
        `;
    }
};
