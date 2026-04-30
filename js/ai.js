/**
 * 本地 AI。每次轮到 AI 控制的国家时，App 会调用 GameAI.takeTurn(factionId, difficulty)
 * 来让 AI 在该国回合内做出 0~N 个行动，然后调用 endTurn 切换。
 *
 * AI 决策极简，按优先级：
 *   1. 推进当前已选/可推进的国策（如果 PP 充足）
 *   2. 在首都征兵（如果金钱够、首都驻军不充裕）
 *   3. 其他兜底：直接 endTurn
 *
 * 不同难度差异：
 *   - easy: 每回合最多 1 次行动
 *   - normal: 最多 3 次
 *   - hard: 最多 6 次，且会优先国策、抢工业、抢征兵
 *
 * 注意：AI 直接读写 GameState/MapData，不通过用户 UI。
 */
const GameAI = {
    isThinking: false,
    pendingTimeout: null,
    actionDelayMs: 35,
    turnBudgetMs: 4500,

    cancelPending() {
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        this.isThinking = false;
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

        const maxActions = difficulty === 'hard' ? 6 : difficulty === 'easy' ? 1 : 3;
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

            const acted = this.tryOneAction(factionId, difficulty);
            actionCount += 1;

            if (!acted) return finish();

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

        const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
        const resources = this.computeFactionResources(factionId);

        // 1. 推进国策（hard/normal 才考虑）
        if (difficulty !== 'easy' && resources.pp >= 2) {
            const focus = this.pickFocus(factionId);
            if (focus) {
                if (this.aiAdvanceFocus(factionId, focus, capitalNode)) return true;
            }
        }

        // 2. 征兵（如果首都兵力低、有钱）
        if (capitalNode && capitalNode.factionId === factionId && resources.money >= 4 && resources.pp >= 1) {
            const defenseNeed = this.estimateCapitalDefenseNeed(factionId);
            if (capitalNode.troops < defenseNeed || difficulty === 'hard') {
                if (this.aiRecruit(factionId, capitalNode, resources, difficulty)) return true;
            }
        }

        // 3. hard：建设工业（如果钱足且首都工业未到上限）
        if (difficulty === 'hard' && capitalNode && capitalNode.factionId === factionId && resources.pp >= 5) {
            const cap = GameState.getNodeIndustryCap(capitalNode.id);
            if (capitalNode.industry < cap) {
                if (this.aiBuildIndustry(factionId, capitalNode)) return true;
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
        return tree.find(focus => (
            !completed.includes(focus.id)
            && GameState.areFocusPrerequisitesMet(focus, completed)
            && !GameState.isFocusBlockedByMutual(focus, completed)
        ));
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
                .slice(0, maxNodes)
                .forEach(node => {
                    const cap = GameState.getNodeIndustryCap(node.id);
                    node.industry = Math.min(cap, node.industry + effect.amount);
                });
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

    aiRecruit(factionId, capitalNode, resources, difficulty) {
        const costPerSoldier = 2;
        const maxAffordable = Math.floor(resources.money / costPerSoldier);
        const desiredCap = difficulty === 'hard' ? 12 : difficulty === 'easy' ? 3 : 6;
        const amount = Math.max(1, Math.min(maxAffordable, desiredCap));
        if (amount < 1) return false;
        const ppCost = 1 + (GameState.game.actionCountThisTurn || 0);
        if (resources.pp < ppCost) return false;

        resources.money -= costPerSoldier * amount;
        resources.pp -= ppCost;
        capitalNode.troops += amount;
        capitalNode.freshTroops = (capitalNode.freshTroops || 0) + amount;
        GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 在 ${capitalNode.name} 征兵 +${amount}。`, 'system', false);
        GameState.notify();
        return true;
    },

    aiBuildIndustry(factionId, capitalNode) {
        const resources = this.computeFactionResources(factionId);
        const ppCost = 5 + (GameState.game.actionCountThisTurn || 0);
        if (resources.pp < ppCost) return false;
        resources.pp -= ppCost;
        const cap = GameState.getNodeIndustryCap(capitalNode.id);
        capitalNode.industry = Math.min(cap, capitalNode.industry + 1);
        GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 在 ${capitalNode.name} 扩建工业 +1。`, 'system', false);
        GameState.notify();
        return true;
    }
};

window.GameAI = GameAI;
