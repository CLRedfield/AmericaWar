/**
 * 本地 AI。每次轮到 AI 控制的国家时，App 会调用 GameAI.takeTurn(factionId, difficulty)
 * 来让 AI 在该国回合内做出 0~N 个行动，然后调用 endTurn 切换。
 *
 * AI 决策按“战场意图”分层：
 *   1. 首都/前线危险时紧急征兵
 *   2. 评估可赢战斗，优先夺取首都、工业、港口、油田
 *   3. 从后方往压力更大的前线调兵
 *   4. 局面稳定时推进国策或扩建工业
 *
 * 不同难度差异：
 *   - easy: 每回合最多 2 次行动
 *   - normal: 最多 6 次
 *   - hard: 最多 12 次，攻击阈值更低、征兵/调兵批量更大
 *
 * 注意：AI 直接读写 GameState/MapData，不通过用户 UI。
 */
const GameAI = {
    isThinking: false,
    pendingTimeout: null,
    actionDelayMs: 35,
    turnBudgetMs: 4500,
    difficultyProfiles: {
        very_easy: {
            maxActions: 2,
            minActions: 2,
            economyMultiplier: 0.75,
            ppMultiplier: 0.75,
            minAttackRatio: 1.45,
            minAttackScore: 30,
            lossAversion: 2.2,
            recruitBatch: 5,
            reinforceBatch: 4,
            capitalReserve: 10,
            frontReserve: 4,
            buildMoneyReserve: 18
        },
        easy: {
            maxActions: 2,
            minActions: 2,
            economyMultiplier: 1,
            ppMultiplier: 1,
            minAttackRatio: 1.25,
            minAttackScore: 18,
            lossAversion: 1.8,
            recruitBatch: 5,
            reinforceBatch: 4,
            capitalReserve: 10,
            frontReserve: 4,
            buildMoneyReserve: 18
        },
        normal: {
            maxActions: 6,
            minActions: 2,
            economyMultiplier: 1.25,
            ppMultiplier: 1.25,
            minAttackRatio: 1.05,
            minAttackScore: 2,
            lossAversion: 1,
            recruitBatch: 9,
            reinforceBatch: 6,
            capitalReserve: 11,
            frontReserve: 5,
            buildMoneyReserve: 14
        },
        hard: {
            maxActions: 12,
            minActions: 2,
            economyMultiplier: 1.5,
            ppMultiplier: 1.5,
            minAttackRatio: 1,
            minAttackScore: -10,
            lossAversion: 0.65,
            recruitBatch: 14,
            reinforceBatch: 9,
            capitalReserve: 13,
            frontReserve: 6,
            buildMoneyReserve: 10
        }
    },

    cancelPending() {
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        this.isThinking = false;
    },

    getDifficultyProfile(difficulty) {
        return this.difficultyProfiles[difficulty] || this.difficultyProfiles.normal;
    },

    /**
     * 让 AI 立即接管 GameState.game.currentPlayerId 的当前回合。
     * 完成后会调用 onDone（一般等于 App.endTurnAdvance）。
     */
    takeTurn(factionId, difficulty = 'normal', onDone = null) {
        if (!window.MapData) {
            if (onDone) onDone();
            return;
        }

        const profile = this.getDifficultyProfile(difficulty);
        const maxActions = profile.maxActions;
        const actionDelay = this.actionDelayMs;
        const startedAt = Date.now();
        let actionCount = 0;

        const finish = () => {
            this.isThinking = false;
            this.pendingTimeout = null;
            if (onDone) onDone();
        };

        const step = () => {
            this.pendingTimeout = null;
            if (GameState.game.gameOver) return finish();
            if (GameState.game.currentPlayerId !== factionId) return finish();
            if (Date.now() - startedAt >= this.turnBudgetMs) return finish();
            if (actionCount >= maxActions) return finish();

            let acted = this.tryOneAction(factionId, difficulty);
            if (!acted && actionCount < profile.minActions) {
                acted = this.aiHoldAction(factionId);
            }

            if (!acted) return finish();

            actionCount += 1;
            this.pendingTimeout = setTimeout(step, actionDelay);
        };

        this.isThinking = true;
        this.pendingTimeout = setTimeout(step, actionDelay);
    },

    /**
     * 尝试做一个 AI 决策。返回 true 表示有行动，false 表示无可做（应结束回合）。
     */
    tryOneAction(factionId, difficulty) {
        const faction = GameState.getFaction(factionId);
        if (!faction) return false;

        const profile = this.getDifficultyProfile(difficulty);
        const resources = this.computeFactionResources(factionId);
        const actionIndex = GameState.game.actionCountThisTurn || 0;

        // 1. 首都或前线快顶不住时，先补兵。
        if (this.aiEmergencyRecruit(factionId, resources, profile)) return true;

        // 2. 如果有漂亮战机，先打一拳；困难 AI 会接受更薄的优势。
        if (this.aiAttackBestTarget(factionId, resources, profile)) return true;

        // 3. 普通/困难 AI 会把后方兵力往前线推，避免只在首都堆兵。
        if (difficulty !== 'easy' && this.aiReinforceFront(factionId, resources, profile)) return true;

        // 4. 前几手如果没有战术动作，就推进更有价值的国策。
        if (difficulty !== 'easy' && resources.pp >= 2 && actionIndex <= 2) {
            const focus = this.pickFocus(factionId);
            if (focus) {
                const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
                if (this.aiAdvanceFocus(factionId, focus, capitalNode)) return true;
            }
        }

        // 5. 补齐前线兵力。
        if (this.aiRecruitBestNode(factionId, resources, profile)) return true;

        // 6. 困难 AI 更懂长期经济；普通 AI 在局面稳定时也会补工业。
        if ((difficulty === 'hard' || actionIndex > 0) && this.aiBuildBestIndustry(factionId, resources, profile)) return true;

        // 7. 兜底：有 PP 但战线暂时无事，就继续国策。
        if (difficulty !== 'easy' && resources.pp >= 2) {
            const focus = this.pickFocus(factionId);
            if (focus) {
                const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
                if (this.aiAdvanceFocus(factionId, focus, capitalNode)) return true;
            }
        }

        return false;
    },

    computeFactionResources(factionId) {
        // 直接用 player resources 是不安全的——player resources 只对玩家自己计算。
        // AI 自己的资源由 game.aiResources 记录（如果不存在就用 faction.startingStats 初始值）
        if (!GameState.game.aiResources) GameState.game.aiResources = {};
        if (!GameState.game.aiResources[factionId]) {
            const faction = GameState.getFaction(factionId);
            GameState.game.aiResources[factionId] = {
                money: faction.startingStats.money,
                pp: faction.startingStats.pp
            };
        }
        return GameState.game.aiResources[factionId];
    },

    pickFocus(factionId) {
        const tree = GameState.getFocusTree(factionId);
        const completed = GameState.game.completedFocuses || [];
        const available = tree.filter(focus => (
            !completed.includes(focus.id)
            && GameState.areFocusPrerequisitesMet(focus, completed)
            && !GameState.isFocusBlockedByMutual(focus, completed)
        ));

        return available
            .sort((a, b) => this.scoreFocus(b, factionId) - this.scoreFocus(a, factionId))
            [0] || null;
    },

    scoreFocus(focus, factionId) {
        const situation = this.getFactionSituation(factionId);
        const progress = GameState.getFocusProgress(focus.id);
        let score = progress * 8;

        (focus.effects || []).forEach(effect => {
            if (effect.type === 'money') score += effect.amount * 0.6;
            else if (effect.type === 'pp') score += effect.amount * 1.4;
            else if (effect.type === 'capitalTroops') score += effect.amount * (situation.capitalThreat > 0 ? 6 : 3);
            else if (effect.type === 'allTroops') score += effect.amount * Math.max(3, situation.frontNodes.length * 3);
            else if (effect.type === 'taggedTroops') score += effect.amount * 4;
            else if (effect.type === 'capitalIndustry' || effect.type === 'nodeIndustry') score += 7;
            else if (effect.type === 'allIndustry') score += (effect.maxNodes || 3) * 5;
            else if (effect.type === 'globalAttack' || effect.type === 'captureTroops') score += 10;
            else if (effect.type === 'actionCost') score += 8;
            else if (effect.type === 'recruitAmount' || effect.type === 'recruitCost') score += 7;
            else if (effect.type === 'moneyIncome' || effect.type === 'ppIncome') score += 6;
            else if (effect.type === 'industryCapBonus') score += (effect.maxNodes || 1) * 4;
        });

        if ((focus.branch || '').includes('军事') && situation.frontNodes.length > 0) score += 8;
        if ((focus.branch || '').includes('经济') && situation.totalIndustry < 18) score += 6;
        if ((focus.branch || '').includes('政治') && situation.capitalThreat === 0) score += 3;
        return score;
    },

    aiAdvanceFocus(factionId, focus, capitalNode) {
        const resources = this.computeFactionResources(factionId);
        const ppCost = 1 + (GameState.game.actionCountThisTurn || 0);
        if (resources.pp < ppCost) return false;
        resources.pp -= ppCost;
        GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;

        const previousProgress = GameState.getFocusProgress(focus.id);
        const required = GameState.getFocusRequiredProgress(focus);
        const nextProgress = Math.min(required, previousProgress + 1);
        GameState.game.focusProgress[focus.id] = nextProgress;

        if (nextProgress >= required) {
            GameState.game.completedFocuses = GameState.game.completedFocuses || [];
            GameState.game.completedFocuses.push(focus.id);
            (focus.effects || []).forEach(effect => this.applyAiFocusEffect(effect, factionId, capitalNode));
            GameState.addLog(`${GameState.getFactionName(factionId)} AI 完成国策"${focus.name}"。`, 'system', false);
        } else {
            GameState.addLog(`${GameState.getFactionName(factionId)} AI 推进国策"${focus.name}" (${nextProgress}/${required})。`, 'system', false);
        }
        GameState.notify();
        return true;
    },

    /**
     * AI 自身的国策效果应用（不依赖玩家自己的 modifiers/resources）。
     * 简化版：只更新 AI 的金钱/PP/兵力/工业；UI 不展示 AI 修正。
     */
    applyAiFocusEffect(effect, factionId, capitalNode) {
        const resources = this.computeFactionResources(factionId);
        if (effect.type === 'money') resources.money += effect.amount;
        else if (effect.type === 'pp') resources.pp += effect.amount;
        else if (effect.type === 'capitalTroops' && capitalNode) capitalNode.troops += effect.amount;
        else if (effect.type === 'capitalIndustry' && capitalNode) {
            const cap = GameState.getNodeIndustryCap(capitalNode.id);
            capitalNode.industry = Math.min(cap, capitalNode.industry + effect.amount);
        } else if (effect.type === 'allTroops') {
            MapData.getFactionNodes(factionId).forEach(node => { node.troops += effect.amount; });
        } else if (effect.type === 'allIndustry') {
            const maxNodes = effect.maxNodes || Infinity;
            MapData.getFactionNodes(factionId)
                .filter(node => node.industry < GameState.getNodeIndustryCap(node.id))
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, maxNodes)
                .forEach(node => {
                    const cap = GameState.getNodeIndustryCap(node.id);
                    node.industry = Math.min(cap, node.industry + effect.amount);
                });
        } else if (effect.type === 'nodeIndustry') {
            const node = MapData.getNode(effect.nodeId);
            const target = node && node.factionId === factionId ? node : capitalNode;
            if (target) {
                const cap = GameState.getNodeIndustryCap(target.id);
                target.industry = Math.min(cap, target.industry + effect.amount);
            }
        } else if (effect.type === 'taggedTroops') {
            MapData.getFactionNodes(factionId)
                .filter(node => node.tags.includes(effect.tag))
                .forEach(node => { node.troops += effect.amount; });
        } else if (effect.type === 'taggedNodeMoney') {
            const count = MapData.getFactionNodes(factionId)
                .filter(node => node.tags.includes(effect.tag))
                .length;
            resources.money += count * effect.amount;
        } else if (effect.type === 'industryCapBonus') {
            MapData.getFactionNodes(factionId)
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, effect.maxNodes || 1)
                .forEach(node => {
                    GameState.setNodeIndustryCap(node.id, GameState.getNodeIndustryCap(node.id) + effect.amount);
                });
        } else if (effect.type === 'damageEnemyIndustry') {
            MapData.nodes
                .filter(node => node.factionId && node.factionId !== factionId && node.industry > 0)
                .sort((a, b) => b.industry - a.industry)
                .slice(0, effect.maxNodes || 3)
                .forEach(node => { node.industry = Math.max(0, node.industry - (effect.amount || 1)); });
        } else if (effect.type === 'warBonds') {
            resources.money += effect.amount || 0;
        } else if (effect.type === 'allCapitalsTroops') {
            MapData.getFactionNodes(factionId)
                .filter(node => node.isCapital || node.tags.includes('首都') || GameState.getCapitalOwner(node.id))
                .forEach(node => { node.troops += effect.amount; });
        } else if (effect.type === 'freeTroops' && capitalNode) {
            capitalNode.troops += effect.amount;
        }
    },

    estimateCapitalDefenseNeed(factionId) {
        const capital = MapData.getNode(GameState.getCapitalNodeId(factionId));
        if (!capital) return 0;
        const enemyPressure = MapData.getNeighbors(capital.id)
            .filter(node => node.factionId && node.factionId !== factionId)
            .reduce((sum, node) => sum + node.troops, 0);
        return Math.max(8, Math.ceil(enemyPressure * 0.7));
    },

    getFactionSituation(factionId) {
        const nodes = MapData.getFactionNodes(factionId);
        const frontNodes = nodes.filter(node => this.getEnemyPressure(node, factionId) > 0);
        const capital = MapData.getNode(GameState.getCapitalNodeId(factionId));
        return {
            nodes,
            frontNodes,
            capital,
            capitalThreat: capital ? this.getEnemyPressure(capital, factionId) : 0,
            totalIndustry: nodes.reduce((sum, node) => sum + node.industry, 0),
            totalTroops: nodes.reduce((sum, node) => sum + node.troops, 0)
        };
    },

    getActionPPCost(baseCost) {
        return Math.max(0, baseCost + (GameState.game.actionCountThisTurn || 0));
    },

    spendAction(resources, ppCost) {
        if (resources.pp < ppCost) return false;
        resources.pp -= ppCost;
        GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;
        return true;
    },

    aiHoldAction(factionId) {
        const situation = this.getFactionSituation(factionId);
        const anchor = situation.frontNodes
            .sort((a, b) => this.getEnemyPressure(b, factionId) - this.getEnemyPressure(a, factionId))
            [0] || situation.capital || situation.nodes[0];

        GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;
        if (anchor) GameState.game.selectedNodeId = anchor.id;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 整军待命，巩固${anchor ? ` ${anchor.name}` : '防线'}。`, 'system', false);
        GameState.notify();
        return true;
    },

    estimateAiNextTurnMoney(factionId, resources, profile, extraTroops = 0, moneySpent = 0) {
        const totals = MapData.calculateFactionStats(factionId);
        const income = (totals.totalIndustry + 1) * (profile.economyMultiplier || 1);
        const totalTroops = totals.totalTroops + extraTroops;
        const maintenance = Math.max(0, totalTroops * GameState.baseMaintenanceRate);
        return resources.money - moneySpent + income - maintenance;
    },

    getMaxRecruitAmountForNextBalance(factionId, resources, profile, costPerSoldier, minBalance = 1) {
        const totals = MapData.calculateFactionStats(factionId);
        const income = (totals.totalIndustry + 1) * (profile.economyMultiplier || 1);
        const currentMaintenance = Math.max(0, totals.totalTroops * GameState.baseMaintenanceRate);
        const room = resources.money + income - currentMaintenance - minBalance;
        const fullCostPerSoldier = costPerSoldier + GameState.baseMaintenanceRate;
        return Math.max(0, Math.floor(room / fullCostPerSoldier));
    },

    getEnemyPressure(node, factionId) {
        if (!node) return 0;
        return MapData.getNeighbors(node.id)
            .filter(neighbor => neighbor.factionId && neighbor.factionId !== factionId)
            .reduce((sum, neighbor) => sum + neighbor.troops, 0);
    },

    getFriendlySupport(node, factionId) {
        if (!node) return 0;
        return MapData.getNeighbors(node.id)
            .filter(neighbor => neighbor.factionId === factionId)
            .reduce((sum, neighbor) => sum + neighbor.troops, 0);
    },

    isCapitalLike(node) {
        return Boolean(node && (node.isCapital || GameState.getCapitalOwner(node.id) || GameState.getOriginalCapitalOwner(node.id)));
    },

    getNodeStrategicValue(node) {
        if (!node) return 0;
        let value = node.industry * 5;
        if (this.isCapitalLike(node)) value += 24;
        if (node.tags.includes('港口')) value += 5;
        if (node.tags.includes('油田')) value += 6;
        return value;
    },

    getFrontlineNodes(factionId) {
        return MapData.getFactionNodes(factionId)
            .filter(node => this.getEnemyPressure(node, factionId) > 0);
    },

    findFriendlyRoute(source, destination, factionId) {
        if (!source || !destination || source.id === destination.id) return null;

        const queue = [[source.id]];
        const seen = new Set([source.id]);

        while (queue.length) {
            const path = queue.shift();
            const currentId = path[path.length - 1];
            if (currentId === destination.id) {
                return path.map(id => MapData.getNode(id)).filter(Boolean);
            }

            MapData.getNeighbors(currentId)
                .filter(node => node.factionId === factionId && !seen.has(node.id))
                .forEach(node => {
                    seen.add(node.id);
                    queue.push([...path, node.id]);
                });
        }

        return null;
    },

    pickFrontDispatchPlan(source, factionId, profile, maxSafeMove) {
        const sourcePressure = this.getEnemyPressure(source, factionId);
        const candidates = this.getFrontlineNodes(factionId)
            .filter(front => front.id !== source.id)
            .map(front => {
                const route = this.findFriendlyRoute(source, front, factionId);
                if (!route || route.length < 2) return null;

                const nextStep = route[1];
                const distance = route.length - 1;
                const frontPressure = this.getEnemyPressure(front, factionId);
                if (sourcePressure > 0 && sourcePressure >= frontPressure) return null;

                const frontNeed = this.estimateNodeDefenseNeed(front, factionId, profile) - front.troops;
                const amount = Math.max(1, Math.min(
                    maxSafeMove,
                    profile.reinforceBatch,
                    Math.ceil(Math.max(1, frontNeed > 0 ? frontNeed : profile.reinforceBatch * 0.5))
                ));
                const score = frontPressure * 2.2
                    + Math.max(0, frontNeed) * 8
                    + this.getNodeStrategicValue(front) * 0.9
                    + this.getNodeStrategicValue(nextStep) * 0.25
                    - distance * 3.5
                    - sourcePressure * 2;

                return {
                    source,
                    target: nextStep,
                    amount,
                    score,
                    destination: front
                };
            })
            .filter(Boolean);

        return candidates.sort((a, b) => b.score - a.score)[0] || null;
    },

    estimateNodeDefenseNeed(node, factionId, profile) {
        if (!node) return 0;
        const enemyPressure = this.getEnemyPressure(node, factionId);
        const friendlySupport = this.getFriendlySupport(node, factionId);
        const isCurrentCapital = GameState.getCapitalNodeId(factionId) === node.id;
        const base = isCurrentCapital
            ? profile.capitalReserve
            : enemyPressure > 0
                ? profile.frontReserve
                : Math.max(2, Math.ceil(node.industry / 2) + 1);
        return Math.max(1, Math.ceil(base + enemyPressure * 0.55 + node.industry * 0.25 - friendlySupport * 0.18));
    },

    aiEmergencyRecruit(factionId, resources, profile) {
        return this.aiRecruitBestNode(factionId, resources, profile, true);
    },

    aiRecruitBestNode(factionId, resources, profile, emergencyOnly = false) {
        const plan = this.pickRecruitPlan(factionId, resources, profile, emergencyOnly);
        if (!plan) return false;
        return this.aiRecruit(factionId, plan.node, resources, plan.amount, plan.ppCost);
    },

    pickRecruitPlan(factionId, resources, profile, emergencyOnly = false) {
        const ppCost = this.getActionPPCost(1);
        const costPerSoldier = 2;
        const maxAffordable = Math.min(
            Math.floor(resources.money / costPerSoldier),
            this.getMaxRecruitAmountForNextBalance(factionId, resources, profile, costPerSoldier, 3)
        );
        if (resources.pp < ppCost || maxAffordable < 1) return null;

        const candidates = MapData.getFactionNodes(factionId)
            .filter(node => GameState.canRecruitAtNode(node.id, factionId));
        const plans = candidates.map(node => {
            const pressure = this.getEnemyPressure(node, factionId);
            const need = this.estimateNodeDefenseNeed(node, factionId, profile) - node.troops;
            if (emergencyOnly && need <= 0) return null;
            if (!emergencyOnly && pressure <= 0 && need <= 0 && resources.money < profile.buildMoneyReserve + 8) return null;

            const wanted = emergencyOnly
                ? Math.max(1, need)
                : Math.max(1, need, pressure > 0 ? profile.recruitBatch * 0.6 : profile.recruitBatch * 0.35);
            const amount = Math.max(1, Math.min(maxAffordable, profile.recruitBatch, Math.ceil(wanted)));
            const score = need * 10
                + pressure * 1.2
                + this.getNodeStrategicValue(node)
                + (GameState.getCapitalNodeId(factionId) === node.id ? 15 : 0);
            return { node, amount, ppCost, score };
        }).filter(Boolean);

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    aiRecruit(factionId, node, resources, amount, ppCost) {
        const costPerSoldier = 2;
        if (!node || amount < 1) return false;
        if (resources.money < costPerSoldier * amount) return false;
        const profile = this.getDifficultyProfile(GameState.getSlot(factionId)?.aiDifficulty || 'normal');
        if (this.estimateAiNextTurnMoney(factionId, resources, profile, amount, costPerSoldier * amount) < 3) return false;
        if (!this.spendAction(resources, ppCost)) return false;

        resources.money -= costPerSoldier * amount;
        node.troops += amount;
        node.freshTroops = (node.freshTroops || 0) + amount;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 在 ${node.name} 征兵 +${amount}。`, 'system', false);
        GameState.notify();
        return true;
    },

    aiAttackBestTarget(factionId, resources, profile) {
        const ppCost = this.getActionPPCost(1);
        if (resources.pp < ppCost) return false;
        const plan = this.pickAttackPlan(factionId, profile);
        if (!plan) return false;
        return this.aiResolveAttack(factionId, plan, resources, ppCost, profile);
    },

    pickAttackPlan(factionId, profile) {
        const plans = [];
        MapData.getFactionNodes(factionId).forEach(attacker => {
            if (GameState.getNodeMovableTroops(attacker) < 1) return;
            MapData.getNeighbors(attacker.id)
                .filter(defender => defender.factionId !== factionId)
                .forEach(defender => {
                    const preview = this.createAiBattlePreview(attacker, defender, factionId);
                    const ratio = preview.attackerPower / Math.max(1, preview.defenderPower);
                    const score = this.scoreAttackPlan(attacker, defender, preview, profile, factionId);
                    const targetValue = this.getNodeStrategicValue(defender);
                    const acceptable = preview.attackerWins
                        && score >= profile.minAttackScore
                        && (ratio >= profile.minAttackRatio || targetValue >= 28);
                    if (acceptable) plans.push({ attacker, defender, preview, ratio, score });
                });
        });

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    createAiBattlePreview(attacker, defender, factionId) {
        const baseDefenseBonus = 15;
        const isPlayerDefender = defender.factionId === GameState.getPlayerFactionId();
        const taggedDefenseBonus = isPlayerDefender ? Math.round((GameState.getTaggedDefenseBonus(defender) || 0) * 100) : 0;
        const globalDefenseBonus = isPlayerDefender ? Math.round((GameState.getEffectiveGlobalDefense() || 0) * 100) : 0;
        const defenseBonus = baseDefenseBonus + taggedDefenseBonus + globalDefenseBonus;
        const attackerAttackBonus = 0;
        const attackerBase = GameState.getNodeMovableTroops(attacker);
        const defenderBase = defender.troops;
        const attackerPower = Number((attackerBase * (1 + attackerAttackBonus / 100)).toFixed(1));
        const defenderPower = Number((defenderBase * (1 + defenseBonus / 100)).toFixed(1));
        const attackerWins = attackerPower > defenderPower;
        const margin = Math.abs(attackerPower - defenderPower);
        const remainingTroops = attackerWins
            ? Math.max(1, Math.min(attackerBase, Math.round(margin)))
            : Math.max(0, Math.floor(attackerBase * 0.45));

        return {
            attackerId: attacker.id,
            defenderId: defender.id,
            attackerBase,
            defenderBase,
            attackerPower,
            defenderPower,
            attackerWins,
            remainingTroops,
            defenseBonus,
            attackerAttackBonus,
            factionId
        };
    },

    scoreAttackPlan(attacker, defender, preview, profile, factionId) {
        const participating = preview.attackerBase;
        const expectedSurvivors = preview.attackerWins
            ? Math.max(1, Math.min(participating, preview.remainingTroops))
            : Math.max(0, Math.min(participating, preview.remainingTroops));
        const expectedLosses = Math.max(0, participating - expectedSurvivors);
        const sourceAfter = attacker.troops - participating;
        const sourceNeed = this.estimateNodeDefenseNeed(attacker, factionId, profile);
        const overextensionPenalty = Math.max(0, sourceNeed - sourceAfter) * 3;

        return (preview.attackerWins ? 50 : -70)
            + this.getNodeStrategicValue(defender)
            + Math.min(28, preview.remainingTroops * 2.4)
            + Math.max(0, 10 - defender.troops)
            + MapData.getNeighbors(defender.id).filter(node => node.factionId === factionId).length * 4
            - expectedLosses * profile.lossAversion
            - overextensionPenalty;
    },

    aiResolveAttack(factionId, plan, resources, ppCost, profile) {
        const attacker = MapData.getNode(plan.attacker.id);
        const defender = MapData.getNode(plan.defender.id);
        if (!attacker || !defender || attacker.factionId !== factionId || defender.factionId === factionId) return false;

        const preview = this.createAiBattlePreview(attacker, defender, factionId);
        const score = this.scoreAttackPlan(attacker, defender, preview, profile, factionId);
        const ratio = preview.attackerPower / Math.max(1, preview.defenderPower);
        const targetValue = this.getNodeStrategicValue(defender);
        if (!preview.attackerWins || score < profile.minAttackScore || (ratio < profile.minAttackRatio && targetValue < 28)) return false;

        const participatingTroops = Math.min(preview.attackerBase, GameState.getNodeMovableTroops(attacker));
        if (participatingTroops < 1) return false;
        if (!this.spendAction(resources, ppCost)) return false;

        const attackerFaction = GameState.getFaction(attacker.factionId);
        const defenderFaction = GameState.getFaction(defender.factionId);
        const attackerReadyBeforeBattle = GameState.getNodeMoveReady(attacker);
        attacker.moveReady = Math.max(0, attackerReadyBeforeBattle - participatingTroops);
        attacker.movedThisTurn = true;
        GameState.game.movementOrdersActive = true;
        GameState.game.currentAction = 'move';
        GameState.game.battlePreview = null;
        GameState.game.actionConfirm = null;

        if (preview.attackerWins) {
            const enteringTroops = Math.max(1, Math.min(participatingTroops, preview.remainingTroops));
            attacker.troops = Math.max(1, attacker.troops - participatingTroops);
            defender.factionId = factionId;
            defender.troops = enteringTroops;
            defender.moveReady = 0;
            defender.freshTroops = 0;
            GameState.game.selectedNodeId = defender.id;
            GameState.refreshFactionStatus(true);
            GameState.checkVictory(true);
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${attackerFaction.shortName} AI 发动攻势，从 ${attacker.name} 进攻 ${defenderFaction.shortName} 控制的 ${defender.name}，投入 ${participatingTroops} 支部队并占领目标。`, 'battle', false);
        } else {
            const returningTroops = Math.max(0, Math.min(participatingTroops, preview.remainingTroops));
            const attackerLosses = participatingTroops - returningTroops;
            attacker.troops = Math.max(1, attacker.troops - attackerLosses);
            defender.troops = Math.max(1, Math.ceil(defender.troops * 0.7));
            GameState.refreshFactionStatus(true);
            GameState.checkVictory(true);
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${attackerFaction.shortName} AI 从 ${attacker.name} 试探进攻 ${defender.name}，被 ${defenderFaction.shortName} 击退。`, 'battle', false);
        }

        GameState.notify();
        return true;
    },

    aiReinforceFront(factionId, resources, profile) {
        const ppCost = this.getActionPPCost(1);
        if (resources.pp < ppCost) return false;
        const plan = this.pickReinforcePlan(factionId, profile);
        if (!plan) return false;
        if (!this.spendAction(resources, ppCost)) return false;

        const sourceReadyBeforeMove = GameState.getNodeMoveReady(plan.source);
        plan.source.troops -= plan.amount;
        plan.source.moveReady = Math.max(0, sourceReadyBeforeMove - plan.amount);
        plan.target.troops += plan.amount;
        plan.source.movedThisTurn = GameState.getNodeMovableTroops(plan.source) <= 0;
        GameState.game.movementOrdersActive = true;
        GameState.game.currentAction = 'move';
        GameState.game.selectedNodeId = plan.target.id;
        const destinationText = plan.destination && plan.destination.id !== plan.target.id
            ? `，目标前线 ${plan.destination.name}`
            : '';
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 调兵：${plan.source.name} → ${plan.target.name}，增援 ${plan.amount} 支${destinationText}。`, 'system', false);
        GameState.notify();
        return true;
    },

    pickReinforcePlan(factionId, profile) {
        const plans = [];
        MapData.getFactionNodes(factionId).forEach(source => {
            const movable = GameState.getNodeMovableTroops(source);
            if (movable < 1) return;

            const sourceNeed = this.estimateNodeDefenseNeed(source, factionId, profile);
            const maxSafeMove = Math.min(movable, Math.max(0, source.troops - sourceNeed));
            if (maxSafeMove < 1) return;
            const dispatchPlan = this.pickFrontDispatchPlan(source, factionId, profile, maxSafeMove);
            if (dispatchPlan && dispatchPlan.score > 6) plans.push(dispatchPlan);

            MapData.getNeighbors(source.id)
                .filter(target => target.factionId === factionId)
                .forEach(target => {
                    const targetPressure = this.getEnemyPressure(target, factionId);
                    const targetNeed = this.estimateNodeDefenseNeed(target, factionId, profile) - target.troops;
                    const sourcePressure = this.getEnemyPressure(source, factionId);
                    if (targetPressure <= 0 && targetNeed <= 0) return;
                    if (sourcePressure > targetPressure && targetNeed <= 0) return;

                    const amount = Math.max(1, Math.min(maxSafeMove, profile.reinforceBatch, Math.ceil(Math.max(1, targetNeed))));
                    const score = targetNeed * 9
                        + targetPressure * 1.3
                        + this.getNodeStrategicValue(target)
                        - sourcePressure * 1.4
                        - this.getNodeStrategicValue(source) * 0.15;
                    if (score > 8) plans.push({ source, target, amount, score });
                });
        });

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    aiBuildBestIndustry(factionId, resources, profile) {
        const ppCost = this.getActionPPCost(5);
        const moneyCost = 10;
        if (resources.pp < ppCost || resources.money < moneyCost + profile.buildMoneyReserve) return false;
        const node = this.pickBuildNode(factionId);
        if (!node) return false;
        return this.aiBuildIndustry(factionId, node, resources, ppCost, moneyCost);
    },

    pickBuildNode(factionId) {
        return MapData.getFactionNodes(factionId)
            .filter(node => node.industry < GameState.getNodeIndustryCap(node.id))
            .map(node => {
                const pressure = this.getEnemyPressure(node, factionId);
                const cap = GameState.getNodeIndustryCap(node.id);
                const score = node.industry * 4
                    + (cap - node.industry) * 2
                    + (pressure > 0 ? -12 : 8)
                    + (this.isCapitalLike(node) ? 6 : 0)
                    + (node.tags.includes('港口') || node.tags.includes('油田') ? 4 : 0);
                return { node, score };
            })
            .sort((a, b) => b.score - a.score)[0]?.node || null;
    },

    aiBuildIndustry(factionId, node, resources, ppCost, moneyCost) {
        if (!node) return false;
        if (resources.pp < ppCost || resources.money < moneyCost) return false;
        if (!this.spendAction(resources, ppCost)) return false;
        resources.money -= moneyCost;
        const cap = GameState.getNodeIndustryCap(node.id);
        node.industry = Math.min(cap, node.industry + 1);
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 在 ${node.name} 扩建工业 +1（消耗 $${moneyCost}）。`, 'system', false);
        GameState.notify();
        return true;
    }
};

window.GameAI = GameAI;
