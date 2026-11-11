/**
 * 同时回合引擎。
 *
 * 规划阶段只记录命令，不直接改动地图。所有有效命令都基于同一份回合开始快照，
 * 由房主（或本地单机）一次性合并非移动行动、扣除出发兵力并结算每个目标节点。
 */
const SimultaneousTurns = {
    _resolving: false,

    isEnabled(game = GameState.game) {
        return Boolean(game && game.turnMode === 'simultaneous');
    },

    isPlanning(game = GameState.game) {
        return this.isEnabled(game) && game.phase === 'planning';
    },

    defaultModifiers() {
        return {
            actionBaseCost: {},
            recruitAmount: 0,
            maintenanceRateDelta: 0,
            ppIncome: 0,
            moneyIncome: 0,
            ppCapBonus: 0,
            recruitCostDelta: 0,
            freeTroops: 0,
            globalAttack: 0,
            globalDefense: 0,
            taggedDefense: {},
            taggedIncome: {},
            captureMoneyOnWin: 0,
            captureTroopsOnWin: 0,
            crisisPP: 0,
            industryCapBoosts: 0,
            damageOnCapture: 0,
            badges: []
        };
    },

    clone(value, fallback = null) {
        if (value === null || typeof value === 'undefined') return fallback;
        return JSON.parse(JSON.stringify(value));
    },

    initializeSession() {
        const game = GameState.game;
        if (!game) return;

        game.turnMode = 'simultaneous';
        game.phase = 'planning';
        game.sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        game.resolutionId = 0;
        game.lastResolutionReport = null;
        game.turnPlans = {};
        game.submittedFactions = [];
        game.turnStartOwners = this.captureOwners();
        game.pendingWorldEffects = [];
        game.humanStates = this.createInitialHumanStates();
        game.currentPlayerId = (game.turnOrder && game.turnOrder[0]) || GameState.getPlayerFactionId();
        this.loadHumanState(GameState.getPlayerFactionId());
        this.prepareAiPlans();
    },

    createInitialHumanStates() {
        const states = {};
        const localFactionId = GameState.getPlayerFactionId();
        (GameState.lobby.slots || []).forEach(slot => {
            if (slot.kind !== 'human') return;
            const faction = GameState.getFaction(slot.factionId);
            const isLocal = slot.factionId === localFactionId;
            states[slot.factionId] = {
                playerResources: isLocal
                    ? this.clone(GameState.game.playerResources, {})
                    : {
                        money: faction.startingStats.money,
                        pp: Math.min(GameState.ppCap, faction.startingStats.pp),
                        ...MapData.calculateFactionStats(faction.id, MapData.initialNodes)
                    },
                currentIdeology: isLocal
                    ? GameState.game.currentIdeology
                    : (faction.ideology || 'wartime_democracy'),
                modifiers: isLocal
                    ? this.clone(GameState.game.modifiers, this.defaultModifiers())
                    : this.defaultModifiers(),
                actionCountThisTurn: isLocal ? (GameState.game.actionCountThisTurn || 0) : 0,
                movementOrdersActive: isLocal ? !!GameState.game.movementOrdersActive : false,
                warBondsPenalty: isLocal ? (GameState.game.warBondsPenalty || 0) : 0,
                warBondsPenaltyTurns: isLocal ? (GameState.game.warBondsPenaltyTurns || 0) : 0
            };
        });
        return states;
    },

    captureOwners() {
        return MapData.nodes.reduce((owners, node) => {
            owners[node.id] = node.factionId;
            return owners;
        }, {});
    },

    getActiveFactionIds() {
        const eliminated = new Set(GameState.game.eliminatedFactions || []);
        return (GameState.game.turnOrder || GameState.computeTurnOrder())
            .filter(factionId => !eliminated.has(factionId))
            .filter(factionId => {
                const slot = GameState.getSlot(factionId);
                return slot && (slot.kind === 'human' || slot.kind === 'ai');
            });
    },

    nextPlanRevision(factionId) {
        const game = GameState.game;
        game.planRevisionClock = game.planRevisionClock || {};
        const current = game.turnPlans && game.turnPlans[factionId];
        const next = Math.max(
            Date.now(),
            Number(game.planRevisionClock[factionId] || 0) + 1,
            Number(current && current.revision || 0) + 1
        );
        game.planRevisionClock[factionId] = next;
        return next;
    },
    getPlan(factionId = GameState.getPlayerFactionId()) {
        const game = GameState.game;
        game.turnPlans = game.turnPlans || {};
        const current = game.turnPlans[factionId];
        if (current && current.turn === game.currentTurn) return current;

        const plan = {
            factionId,
            sessionId: game.sessionId,
            turn: game.currentTurn,
            submitted: false,
            orders: [],
            revision: this.nextPlanRevision(factionId)
        };
        game.turnPlans[factionId] = plan;
        return plan;
    },

    isFactionSubmitted(factionId = GameState.getPlayerFactionId()) {
        const plan = GameState.game.turnPlans && GameState.game.turnPlans[factionId];
        return Boolean(plan && plan.turn === GameState.game.currentTurn && plan.submitted);
    },

    getSubmittedFactionIds() {
        return this.getActiveFactionIds().filter(factionId => this.isFactionSubmitted(factionId));
    },

    getSubmittedCount() {
        return this.getSubmittedFactionIds().length;
    },

    getRequiredCount() {
        return this.getActiveFactionIds().length;
    },

    getHumanFactionIds() {
        return this.getActiveFactionIds().filter(factionId => GameState.getSlot(factionId)?.kind === 'human');
    },

    getReadyHumanFactionIds() {
        return this.getHumanFactionIds().filter(factionId => this.isFactionSubmitted(factionId));
    },

    getReadyHumanCount() {
        return this.getReadyHumanFactionIds().length;
    },

    getHumanPlayerCount() {
        return this.getHumanFactionIds().length;
    },

    canLocalPlayerAct() {
        if (!this.isPlanning() || GameState.game.gameOver) return false;
        if (window.app && window.app.resolutionAnimation) return false;
        return !this.isFactionSubmitted(GameState.getPlayerFactionId());
    },

    getOrders(factionId = GameState.getPlayerFactionId()) {
        return this.getPlan(factionId).orders || [];
    },

    getMultiDirectionBonus(directionCount) {
        const directions = Math.max(0, Math.floor(Number(directionCount) || 0));
        if (directions >= 3) return 10;
        if (directions >= 2) return 5;
        return 0;
    },

    getAttackCoordination(targetId, factionId = GameState.getPlayerFactionId(), candidate = null, orders = null) {
        const sourceIds = new Set();
        let troops = 0;
        const plannedOrders = Array.isArray(orders) ? orders : this.getOrders(factionId);

        plannedOrders.forEach(order => {
            if (!order || order.targetId !== targetId || order.kind !== 'attack') return;
            const amount = Math.max(0, Math.floor(Number(order.amount) || 0));
            if (amount < 1 || !order.sourceId) return;
            sourceIds.add(order.sourceId);
            troops += amount;
        });

        const existingTroops = troops;
        if (candidate && candidate.sourceId) {
            const candidateAmount = Math.max(0, Math.floor(Number(candidate.amount) || 0));
            if (candidateAmount > 0) {
                sourceIds.add(candidate.sourceId);
                troops += candidateAmount;
            }
        }

        const directions = sourceIds.size;
        return {
            targetId,
            factionId,
            directions,
            bonus: this.getMultiDirectionBonus(directions),
            troops,
            existingTroops,
            sourceIds: [...sourceIds]
        };
    },

    getReservedTroops(sourceId, factionId = GameState.getPlayerFactionId()) {
        return this.getOrders(factionId)
            .filter(order => order.sourceId === sourceId)
            .reduce((total, order) => total + Math.max(0, Number(order.amount) || 0), 0);
    },

    addOrder({ factionId = GameState.getPlayerFactionId(), sourceId, targetId, amount, kind }) {
        if (!this.isPlanning() || this.isFactionSubmitted(factionId)) return null;
        const source = MapData.getNode(sourceId);
        const target = MapData.getNode(targetId);
        if (!source || !target || source.factionId !== factionId || !MapData.areAdjacent(sourceId, targetId)) return null;
        if (!GameState.isWarOpen() && target.factionId !== factionId) return null;

        const rawReady = Math.max(0, Math.min(GameState.getNodeMoveReady(source), source.troops));
        const remaining = Math.max(0, rawReady - this.getReservedTroops(sourceId, factionId));
        const acceptedAmount = Math.min(remaining, Math.max(1, Math.floor(Number(amount) || 1)));
        if (acceptedAmount < 1) return null;

        const plan = this.getPlan(factionId);
        const order = {
            id: `${factionId}-${GameState.game.currentTurn}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            factionId,
            sourceId,
            targetId,
            amount: acceptedAmount,
            kind: kind || (target.factionId === factionId ? 'move' : 'attack'),
            createdAt: Date.now()
        };
        plan.orders.push(order);
        plan.revision = this.nextPlanRevision(factionId);
        return order;
    },

    removeOrder(orderId, factionId = GameState.getPlayerFactionId()) {
        if (!this.isPlanning() || this.isFactionSubmitted(factionId)) return false;
        const plan = this.getPlan(factionId);
        const before = plan.orders.length;
        plan.orders = plan.orders.filter(order => order.id !== orderId);
        plan.revision = this.nextPlanRevision(factionId);
        return plan.orders.length !== before;
    },

    clearOrders(factionId = GameState.getPlayerFactionId()) {
        if (!this.isPlanning() || this.isFactionSubmitted(factionId)) return false;
        const plan = this.getPlan(factionId);
        if (!plan.orders.length) return false;
        plan.orders = [];
        plan.revision = this.nextPlanRevision(factionId);
        return true;
    },

    snapshotLocalPlan(submitted = this.isFactionSubmitted(GameState.getPlayerFactionId())) {
        const factionId = GameState.getPlayerFactionId();
        const base = this.getPlan(factionId);
        const ownedNodes = MapData.getFactionNodes(factionId).map(node => ({
            id: node.id,
            factionId: node.factionId,
            troops: node.troops,
            industry: node.industry,
            moveReady: node.moveReady,
            freshTroops: node.freshTroops || 0,
            movedThisTurn: !!node.movedThisTurn
        }));
        const ownCaps = {};
        Object.entries(GameState.game.nodeIndustryCaps || {}).forEach(([nodeId, cap]) => {
            const node = MapData.getNode(nodeId);
            if (node && node.factionId === factionId) ownCaps[nodeId] = cap;
        });
        const factionName = GameState.game.factionNames && GameState.game.factionNames[factionId];

        const plan = {
            factionId,
            sessionId: GameState.game.sessionId,
            turn: GameState.game.currentTurn,
            submitted: !!submitted,
            orders: this.clone(base.orders, []),
            nodeUpdates: ownedNodes,
            nodeIndustryCaps: ownCaps,
            playerState: this.captureHumanState(),
            completedFocuses: this.clone(GameState.game.completedFocuses, []),
            focusProgress: this.clone(GameState.game.focusProgress, {}),
            factionName: factionName ? this.clone(factionName) : null,
            worldEffects: this.clone(GameState.game.pendingWorldEffects, []),
            combat: {
                atk: Math.round((GameState.getEffectiveGlobalAttack() || 0) * 100),
                def: Math.round((GameState.getEffectiveGlobalDefense() || 0) * 100),
                defByNode: MapData.getFactionNodes(factionId).reduce((bonuses, node) => {
                    bonuses[node.id] = Math.round(
                        ((GameState.getEffectiveGlobalDefense() || 0) + (GameState.getTaggedDefenseBonus(node) || 0)) * 100
                    );
                    return bonuses;
                }, {}),
                captureMoney: GameState.getEffectiveCaptureMoney() || 0,
                captureTroops: GameState.getEffectiveCaptureTroops() || 0
            },
            revision: this.nextPlanRevision(factionId)
        };
        GameState.game.turnPlans[factionId] = plan;
        this.refreshSubmittedFactions();
        return plan;
    },

    applyRemotePlan(remote) {
        const factionId = remote && String(remote.factionId || '');
        if (
            !remote ||
            remote.sessionId !== GameState.game.sessionId ||
            remote.turn !== GameState.game.currentTurn ||
            !this.getActiveFactionIds().includes(factionId)
        ) return false;
        const orders = Array.isArray(remote.orders) ? remote.orders : [];
        if (orders.some(order => order && order.factionId && order.factionId !== factionId)) return false;

        GameState.game.turnPlans = GameState.game.turnPlans || {};
        const current = GameState.game.turnPlans[factionId];
        if (current && Number(current.revision || 0) >= Number(remote.revision || 0)) return false;
        GameState.game.turnPlans[factionId] = this.clone(remote);

        if (remote.factionName && (remote.factionName.name || remote.factionName.shortName)) {
            GameState.game.factionNames = GameState.game.factionNames || {};
            GameState.game.factionNames[factionId] = this.clone(remote.factionName);
        }
        this.refreshSubmittedFactions();
        return true;
    },

    refreshSubmittedFactions() {
        GameState.game.submittedFactions = this.getSubmittedFactionIds();
    },

    captureHumanState() {
        return {
            playerResources: this.clone(GameState.game.playerResources, {}),
            currentIdeology: GameState.game.currentIdeology,
            modifiers: this.clone(GameState.game.modifiers, this.defaultModifiers()),
            actionCountThisTurn: GameState.game.actionCountThisTurn || 0,
            movementOrdersActive: !!GameState.game.movementOrdersActive,
            warBondsPenalty: GameState.game.warBondsPenalty || 0,
            warBondsPenaltyTurns: GameState.game.warBondsPenaltyTurns || 0
        };
    },

    saveHumanState(factionId = GameState.getPlayerFactionId()) {
        GameState.game.humanStates = GameState.game.humanStates || {};
        GameState.game.humanStates[factionId] = this.captureHumanState();
        return GameState.game.humanStates[factionId];
    },

    loadHumanState(factionId = GameState.getPlayerFactionId()) {
        const state = GameState.game.humanStates && GameState.game.humanStates[factionId];
        if (!state) return false;
        GameState.game.playerResources = this.clone(state.playerResources, GameState.game.playerResources || {});
        GameState.game.currentIdeology = state.currentIdeology || GameState.getFaction(factionId).ideology;
        GameState.game.modifiers = this.clone(state.modifiers, this.defaultModifiers());
        GameState.game.actionCountThisTurn = state.actionCountThisTurn || 0;
        GameState.game.movementOrdersActive = !!state.movementOrdersActive;
        GameState.game.warBondsPenalty = state.warBondsPenalty || 0;
        GameState.game.warBondsPenaltyTurns = state.warBondsPenaltyTurns || 0;
        return true;
    },

    prepareAiPlans() {
        if (!this.isEnabled()) return;
        if (this._preparingAi) return;
        const isOnline = window.Multiplayer && Multiplayer.isOnline;
        if (isOnline && !GameState.isHost()) return;

        this._preparingAi = true;
        GameState.game.aiPlannedTurns = GameState.game.aiPlannedTurns || {};
        this.getActiveFactionIds().forEach(factionId => {
            const slot = GameState.getSlot(factionId);
            if (!slot || slot.kind !== 'ai') return;
            const turnKey = `${GameState.game.currentTurn}:${factionId}`;
            if (GameState.game.aiPlannedTurns[factionId] !== turnKey) {
                this.performAiStrategicActions(factionId, slot.aiDifficulty || 'normal');
                GameState.game.aiPlannedTurns[factionId] = turnKey;
            }
            GameState.game.turnPlans[factionId] = this.buildAiPlan(factionId, slot.aiDifficulty || 'normal');
        });
        this.refreshSubmittedFactions();
        this._preparingAi = false;
    },

    performAiStrategicActions(factionId, difficulty) {
        if (!window.GameAI) return;
        if (typeof WestRussiaRouteActions !== 'undefined') WestRussiaRouteActions.autoAct(factionId);
        const resources = GameAI.computeFactionResources(factionId);
        const profile = GameAI.getDifficultyProfile(difficulty, factionId);
        const savedActionCount = GameState.game.actionCountThisTurn || 0;
        GameState.game.actionCountThisTurn = 0;

        try {
            if (difficulty === 'normal' || difficulty === 'hard') {
                GameAI.aiAdvanceFreeFocusForTurn(factionId, difficulty);
            }

            const actionLimit = difficulty === 'very_easy' ? 0 : difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;
            for (let actionIndex = 0; actionIndex < actionLimit; actionIndex += 1) {
                if (GameAI.aiEmergencyRecruit(factionId, resources, profile)) continue;

                const focus = GameAI.pickFocus(factionId);
                const capital = MapData.getNode(GameState.getCapitalNodeId(factionId));
                if (focus && GameAI.aiAdvanceFocus(factionId, focus, capital)) continue;

                if (GameAI.aiRecruitBestNode(factionId, resources, profile)) continue;
                if (GameAI.aiBuildBestIndustry(factionId, resources, profile)) continue;
                break;
            }
        } finally {
            GameState.game.actionCountThisTurn = savedActionCount;
        }
    },

    buildAiPlan(factionId, difficulty = 'normal') {
        const maxOrders = difficulty === 'very_easy' ? 1 : difficulty === 'easy' ? 2 : difficulty === 'hard' ? 5 : 3;
        const orders = [];
        const reserved = {};
        const factionNodes = MapData.getFactionNodes(factionId)
            .slice()
            .sort((a, b) => b.troops - a.troops || a.id.localeCompare(b.id));

        const availableAt = node => Math.max(
            0,
            Math.min(GameState.getNodeMoveReady(node), node.troops) - (reserved[node.id] || 0)
        );

        const warOpen = GameState.isWarOpen();
        factionNodes.some(source => {
            if (!warOpen || orders.length >= maxOrders) return true;
            const available = availableAt(source);
            if (available < 1) return false;
            const enemies = MapData.getNeighbors(source.id)
                .filter(node => node.factionId !== factionId)
                .sort((a, b) => a.troops - b.troops || b.industry - a.industry);
            const target = enemies.find(node => available > Math.max(1, Math.ceil(node.troops * 1.1)));
            if (!target) return false;
            const amount = Math.min(available, Math.max(1, Math.ceil(target.troops * 1.25)));
            reserved[source.id] = (reserved[source.id] || 0) + amount;
            orders.push({
                id: `${factionId}-${GameState.game.currentTurn}-ai-${orders.length}`,
                factionId,
                sourceId: source.id,
                targetId: target.id,
                amount,
                kind: 'attack',
                createdAt: Date.now() + orders.length
            });
            return false;
        });

        if (orders.length < maxOrders) {
            factionNodes.some(source => {
                if (orders.length >= maxOrders) return true;
                const available = availableAt(source);
                if (available < 2) return false;
                const friendlyTargets = MapData.getNeighbors(source.id)
                    .filter(node => node.factionId === factionId)
                    .map(node => ({
                        node,
                        pressure: MapData.getNeighbors(node.id)
                            .filter(neighbor => neighbor.factionId !== factionId)
                            .reduce((sum, enemy) => sum + enemy.troops, 0)
                    }))
                    .filter(item => item.pressure > 0)
                    .sort((a, b) => b.pressure - a.pressure);
                if (!friendlyTargets.length) return false;
                const target = friendlyTargets[0].node;
                const amount = Math.max(1, Math.floor(available / 2));
                reserved[source.id] = (reserved[source.id] || 0) + amount;
                orders.push({
                    id: `${factionId}-${GameState.game.currentTurn}-ai-${orders.length}`,
                    factionId,
                    sourceId: source.id,
                    targetId: target.id,
                    amount,
                    kind: 'move',
                    createdAt: Date.now() + orders.length
                });
                return false;
            });
        }

        const aiCombat = window.GameAI ? {
            atk: GameAI.getAiAttackBonusPercent(factionId),
            def: GameAI.getAiDefenseBonusPercent(factionId, null),
            defByNode: MapData.getFactionNodes(factionId).reduce((bonuses, node) => {
                bonuses[node.id] = GameAI.getAiDefenseBonusPercent(factionId, node);
                return bonuses;
            }, {}),
            captureMoney: GameAI.getAiNumericModifier(factionId, 'captureMoneyOnWin'),
            captureTroops: GameAI.getAiNumericModifier(factionId, 'captureTroopsOnWin')
        } : { atk: 0, def: 0 };

        return {
            factionId,
            sessionId: GameState.game.sessionId,
            turn: GameState.game.currentTurn,
            submitted: true,
            orders,
            combat: aiCombat,
            revision: Date.now()
        };
    },

    allRequiredPlansSubmitted() {
        const active = this.getActiveFactionIds();
        return active.length > 0 && active.every(factionId => this.isFactionSubmitted(factionId));
    },

    forceSubmitMissingPlans() {
        this.prepareAiPlans();
        this.getActiveFactionIds().forEach(factionId => {
            if (this.isFactionSubmitted(factionId)) return;
            const existing = GameState.game.turnPlans && GameState.game.turnPlans[factionId];
            if (existing && existing.turn === GameState.game.currentTurn) {
                existing.submitted = true;
                existing.revision = Date.now();
                return;
            }
            GameState.game.turnPlans[factionId] = {
                factionId,
                sessionId: GameState.game.sessionId,
                turn: GameState.game.currentTurn,
                submitted: true,
                orders: [],
                revision: Date.now()
            };
        });
        this.refreshSubmittedFactions();
    },

    resolveTurn(app) {
        if (this._resolving || !this.isPlanning() || !this.allRequiredPlansSubmitted()) return false;
        this._resolving = true;
        const game = GameState.game;
        game.phase = 'resolving';
        game.resolutionId = (game.resolutionId || 0) + 1;

        const plans = this.getActiveFactionIds()
            .map(factionId => game.turnPlans[factionId])
            .filter(Boolean);

        this.mergePlanningSnapshots(plans);
        const report = this.resolveMovementOrders(plans);
        const completedTurn = game.currentTurn;

        game.currentTurn += 1;
        if (!GameState.isWarOpen(completedTurn) && GameState.isWarOpen()) {
            GameState.addLog('发育期结束。大动乱开始，跨境行军与战时国策现已开放。', 'system', false);
        }
        this.settleAllFactions(app);
        GameState.resetMovementReadiness();
        this.resetLocalTurnControls();
        Object.values(game.humanStates || {}).forEach(state => {
            state.actionCountThisTurn = 0;
            state.movementOrdersActive = false;
        });

        game.phase = 'planning';
        game.turnPlans = {};
        game.submittedFactions = [];
        game.turnStartOwners = this.captureOwners();
        game.pendingWorldEffects = [];
        game.timerRemaining = GameState.getTurnLimitSeconds();
        this.loadHumanState(GameState.getPlayerFactionId());
        this.prepareAiPlans();

        GameState.refreshFactionStatus(false);
        GameState.checkVictory(true);
        game.lastResolutionReport = {
            resolutionId: game.resolutionId,
            sessionId: game.sessionId,
            turn: completedTurn,
            nextTurn: game.currentTurn,
            acceptedOrders: report.acceptedOrders,
            battles: report.battles,
            occupations: report.occupations,
            coordinatedAttacks: report.coordinatedAttacks,
            movements: report.movements,
            engagements: report.engagements
        };
        const coordinationText = report.coordinatedAttacks > 0
            ? `，形成 ${report.coordinatedAttacks} 次多方向围攻`
            : '';
        const occupationText = report.occupations > 0 ? `，无守军占领 ${report.occupations} 处` : '';
        GameState.addLog(
            `第 ${completedTurn} 回合统一结算完成：执行 ${report.acceptedOrders} 道行军令，发生 ${report.battles} 场战斗${occupationText}${coordinationText}；第 ${game.currentTurn} 回合进入规划阶段。`,
            'system',
            false
        );
        if (app && typeof app.playResolutionAnimation === 'function') {
            app.playResolutionAnimation(game.lastResolutionReport);
        }
        this._resolving = false;
        return true;
    },

    resetLocalTurnControls() {
        const game = GameState.game;
        game.actionCountThisTurn = 0;
        game.currentAction = null;
        game.movementOrdersActive = false;
        game.moveDraftAmount = 1;
        game.battleDraftAmount = 1;
        game.recruitDraftAmount = 1;
        game.disbandDraftAmount = 1;
        game.battlePreview = null;
        game.actionConfirm = null;
    },

    mergePlanningSnapshots(plans) {
        const game = GameState.game;
        const startOwners = game.turnStartOwners || {};
        const warOpen = GameState.isWarOpen();
        const completed = new Set(game.completedFocuses || []);
        const progress = { ...(game.focusProgress || {}) };
        game.humanStates = game.humanStates || {};
        game.factionNames = game.factionNames || {};
        game.nodeIndustryCaps = game.nodeIndustryCaps || {};

        plans.forEach(plan => {
            const factionId = plan.factionId;
            if (plan.playerState && GameState.getSlot(factionId)?.kind === 'human') {
                game.humanStates[factionId] = this.clone(plan.playerState);
            }
            const campaignFocusIds = GameState.getScenario().preparationTurns ? new Set(GameState.getFocusTree(factionId)
                .filter(focus => (warOpen || !focus.wartime) && GameState.hasFocusTerritory(focus, factionId))
                .map(focus => focus.id)) : null;
            (plan.completedFocuses || []).forEach(focusId => {
                if (!campaignFocusIds || campaignFocusIds.has(focusId)) completed.add(focusId);
            });
            Object.entries(plan.focusProgress || {}).forEach(([focusId, value]) => {
                if (!campaignFocusIds || campaignFocusIds.has(focusId)) {
                    progress[focusId] = Math.max(progress[focusId] || 0, Number(value) || 0);
                }
            });
            if (plan.factionName) game.factionNames[factionId] = this.clone(plan.factionName);
            Object.entries(plan.nodeIndustryCaps || {}).forEach(([nodeId, cap]) => {
                if (startOwners[nodeId] === factionId) {
                    game.nodeIndustryCaps[nodeId] = Math.max(game.nodeIndustryCaps[nodeId] || 0, Number(cap) || 0);
                }
            });
            (plan.nodeUpdates || []).forEach(update => {
                const node = MapData.getNode(update.id);
                if (!node || startOwners[node.id] !== factionId || update.factionId !== factionId) return;
                node.troops = Math.max(0, Number(update.troops) || 0);
                node.industry = Math.max(0, Number(update.industry) || 0);
                node.moveReady = Math.max(0, Number(update.moveReady) || 0);
                node.freshTroops = Math.max(0, Number(update.freshTroops) || 0);
                node.movedThisTurn = !!update.movedThisTurn;
            });
        });

        game.completedFocuses = [...completed];
        game.focusProgress = progress;

        if (!warOpen) return;
        const appliedEffects = new Set();
        plans.forEach(plan => {
            (plan.worldEffects || []).forEach(effect => {
                const key = effect.id || `${plan.factionId}:${effect.type}:${JSON.stringify(effect)}`;
                if (appliedEffects.has(key)) return;
                appliedEffects.add(key);
                if (effect.type === 'damageIndustry') {
                    (effect.nodeIds || []).forEach(nodeId => {
                        const node = MapData.getNode(nodeId);
                        if (node && node.factionId !== plan.factionId) {
                            node.industry = Math.max(0, node.industry - Math.max(0, Number(effect.amount) || 0));
                        }
                    });
                }
            });
        });
    },

    resolveMovementOrders(plans) {
        const startOwners = GameState.game.turnStartOwners || {};
        const warOpen = GameState.isWarOpen();
        const accepted = [];
        const outgoingBySource = {};

        plans.forEach(plan => {
            (plan.orders || [])
                .slice()
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)))
                .forEach(order => {
                    const source = MapData.getNode(order.sourceId);
                    const target = MapData.getNode(order.targetId);
                    if (!source || !target || !MapData.areAdjacent(source.id, target.id)) return;
                    if (startOwners[source.id] !== plan.factionId) return;
                    if (!warOpen && startOwners[target.id] !== plan.factionId) return;
                    const alreadyOutgoing = outgoingBySource[source.id] || 0;
                    const rawReady = Math.max(0, Math.min(GameState.getNodeMoveReady(source), source.troops));
                    const available = Math.max(0, rawReady - alreadyOutgoing);
                    const amount = Math.min(available, Math.max(0, Math.floor(Number(order.amount) || 0)));
                    if (amount < 1) return;
                    outgoingBySource[source.id] = alreadyOutgoing + amount;
                    accepted.push({ ...order, factionId: plan.factionId, amount });
                });
        });

        Object.entries(outgoingBySource).forEach(([sourceId, amount]) => {
            const source = MapData.getNode(sourceId);
            if (!source) return;
            const readyBefore = GameState.getNodeMoveReady(source);
            source.troops = Math.max(0, source.troops - amount);
            source.moveReady = Math.max(0, readyBefore - amount);
            source.movedThisTurn = true;
        });

        const incomingByTarget = {};
        accepted.forEach(order => {
            incomingByTarget[order.targetId] = incomingByTarget[order.targetId] || [];
            incomingByTarget[order.targetId].push(order);
        });

        let battles = 0;
        let coordinatedAttacks = 0;
        let occupations = 0;
        const engagements = [];
        Object.entries(incomingByTarget).forEach(([targetId, orders]) => {
            const target = MapData.getNode(targetId);
            if (!target) return;
            const incumbentId = target.factionId;
            const troopsByFaction = { [incumbentId]: Math.max(0, target.troops) };
            const attackSourcesByFaction = {};
            orders.forEach(order => {
                troopsByFaction[order.factionId] = (troopsByFaction[order.factionId] || 0) + order.amount;
                if (order.factionId !== incumbentId) {
                    attackSourcesByFaction[order.factionId] = attackSourcesByFaction[order.factionId] || new Set();
                    attackSourcesByFaction[order.factionId].add(order.sourceId);
                }
            });

            const contenders = Object.entries(troopsByFaction).filter(([, troops]) => troops > 0);
            if (contenders.length <= 1) {
                const soleContender = contenders[0] || null;
                const nextOwnerId = soleContender ? soleContender[0] : incumbentId;
                const ownerChanged = nextOwnerId !== incumbentId;
                target.factionId = nextOwnerId;
                target.troops = soleContender ? soleContender[1] : 0;
                target.moveReady = 0;
                target.freshTroops = 0;
                target.movedThisTurn = orders.length > 0;
                if (ownerChanged) {
                    occupations += 1;
                    this.applyUnifiedCaptureBonuses(nextOwnerId, target, plans);
                    GameState.addLog(
                        `第 ${GameState.game.currentTurn} 回合无守军占领：${GameState.getFactionName(nextOwnerId)}进入${target.name}，接管该节点。`,
                        'battle',
                        false
                    );
                    engagements.push({
                        targetId,
                        type: 'occupation',
                        winnerFactionId: nextOwnerId,
                        previousOwnerId: incumbentId,
                        survivors: target.troops
                    });
                }
                return;
            }

            battles += 1;
            const scored = contenders.map(([factionId, troops]) => {
                const plan = plans.find(item => item.factionId === factionId);
                const combat = (plan && plan.combat) || this.getStoredCombat(factionId, target);
                const attackDirections = factionId === incumbentId
                    ? 0
                    : (attackSourcesByFaction[factionId] ? attackSourcesByFaction[factionId].size : 0);
                const coordinationBonus = this.getMultiDirectionBonus(attackDirections);
                const percent = factionId === incumbentId
                    ? 15 + (
                        Number(combat.defByNode && combat.defByNode[target.id]) || Number(combat.def) || 0
                    )
                    : (Number(combat.atk) || 0) + coordinationBonus;
                return {
                    factionId,
                    troops,
                    percent,
                    attackDirections,
                    coordinationBonus,
                    power: troops * (1 + percent / 100),
                    incumbent: factionId === incumbentId
                };
            }).sort((a, b) => (
                b.power - a.power ||
                Number(b.incumbent) - Number(a.incumbent) ||
                a.factionId.localeCompare(b.factionId)
            ));
            coordinatedAttacks += scored.filter(item => !item.incumbent && item.attackDirections >= 2).length;

            const winner = scored[0];
            const runnerUp = scored[1];
            const remainingPower = Math.max(1, winner.power - runnerUp.power);
            const survivors = Math.max(
                1,
                Math.min(winner.troops, Math.round(remainingPower / Math.max(0.1, 1 + winner.percent / 100)))
            );
            target.factionId = winner.factionId;
            target.troops = survivors;
            target.moveReady = 0;
            target.freshTroops = 0;
            target.movedThisTurn = true;

            if (winner.factionId !== incumbentId) {
                this.applyUnifiedCaptureBonuses(winner.factionId, target, plans);
            }
            const participants = scored
                .map(item => {
                    const coordination = item.coordinationBonus > 0
                        ? `，${item.attackDirections} 路围攻 +${item.coordinationBonus}%`
                        : '';
                    return `${GameState.getFactionName(item.factionId)} ${item.troops}${coordination}`;
                })
                .join(' / ');
            GameState.addLog(
                `第 ${GameState.game.currentTurn} 回合统一战斗：${target.name}（${participants}），${GameState.getFactionName(winner.factionId)}胜出，剩余 ${survivors} 支。`,
                'battle',
                false
            );
            engagements.push({
                targetId,
                type: 'battle',
                winnerFactionId: winner.factionId,
                previousOwnerId: incumbentId,
                survivors: target.troops,
                participants: scored.map(item => ({
                    factionId: item.factionId,
                    troops: item.troops,
                    power: Number(item.power.toFixed(2))
                }))
            });
        });

        const movements = accepted.map((order, index) => ({
            id: String(order.id || `resolved-${GameState.game.resolutionId || 0}-${index}`),
            factionId: order.factionId,
            sourceId: order.sourceId,
            targetId: order.targetId,
            amount: order.amount,
            kind: startOwners[order.targetId] === order.factionId ? 'move' : 'attack'
        }));
        return {
            acceptedOrders: accepted.length,
            battles,
            occupations,
            coordinatedAttacks,
            movements,
            engagements
        };
    },

    applyUnifiedCaptureBonuses(factionId, target, plans) {
        const plan = plans.find(item => item.factionId === factionId);
        const combat = (plan && plan.combat) || {};
        const captureMoney = Math.max(0, Number(combat.captureMoney) || 0);
        const captureTroops = Math.max(0, Number(combat.captureTroops) || 0);
        const slot = GameState.getSlot(factionId);

        if (slot && slot.kind === 'human') {
            const state = GameState.game.humanStates && GameState.game.humanStates[factionId];
            if (state && state.playerResources && captureMoney > 0) {
                state.playerResources.money = (state.playerResources.money || 0) + captureMoney;
            }
        } else if (slot && slot.kind === 'ai' && window.GameAI && captureMoney > 0) {
            const resources = GameAI.computeFactionResources(factionId);
            resources.money += captureMoney;
        }

        if (captureTroops > 0) {
            target.troops += captureTroops;
        }
        if (captureMoney > 0 || captureTroops > 0) {
            GameState.addLog(
                `${GameState.getFactionName(factionId)} 占领 ${target.name}：缴获 $${captureMoney}，归附部队 +${captureTroops}。`,
                'battle',
                false
            );
        }
    },

    getStoredCombat(factionId, node) {
        const slot = GameState.getSlot(factionId);
        if (slot && slot.kind === 'ai' && window.GameAI) {
            return {
                atk: GameAI.getAiAttackBonusPercent(factionId),
                def: GameAI.getAiDefenseBonusPercent(factionId, node)
            };
        }
        const remote = GameState.game.humanCombat && GameState.game.humanCombat[factionId];
        return remote || { atk: 0, def: 0 };
    },

    settleAllFactions(app) {
        const turnOrder = GameState.game.turnOrder || [];
        const localFactionId = GameState.getPlayerFactionId();
        const humanIds = turnOrder.filter(factionId => GameState.getSlot(factionId)?.kind === 'human');

        humanIds.forEach(factionId => {
            if ((GameState.game.eliminatedFactions || []).includes(factionId)) return;
            GameState.game.activeRuleFactionId = factionId;
            this.loadHumanState(factionId);
            const settlement = app.settleTurnStart(factionId);
            this.saveHumanState(factionId);
            const desertionText = settlement.debtDeserted > 0 ? `，逃散 ${settlement.debtDeserted} 支` : '';
            GameState.addLog(
                `${GameState.getFactionName(factionId)} 回合末经济：收入 $${formatMoney(settlement.income)}，维护 $${formatMoney(settlement.maintenance)}，余额 $${formatMoney(settlement.balance)}，+${settlement.ppIncome} PP${desertionText}。`,
                'system',
                false
            );
        });
        delete GameState.game.activeRuleFactionId;
        this.loadHumanState(localFactionId);
        app.settleAiTurnStart(turnOrder, localFactionId);
    }
};

window.SimultaneousTurns = SimultaneousTurns;
