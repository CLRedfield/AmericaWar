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
            minActions: 0,
            economyMultiplier: 0.75,
            ppMultiplier: 0.75,
            minAttackRatio: 1.45,
            minAttackScore: 30,
            lossAversion: 2.2,
            attackBias: 1,
            defenseReserveRatio: 0.2,
            recruitBatch: 5,
            recruitMinBalance: 3,
            reinforceBatch: 4,
            capitalReserve: 10,
            frontReserve: 4,
            buildMoneyReserve: 18
        },
        easy: {
            maxActions: 2,
            minActions: 0,
            economyMultiplier: 1,
            ppMultiplier: 1,
            minAttackRatio: 1.25,
            minAttackScore: 18,
            lossAversion: 1.8,
            attackBias: 1,
            defenseReserveRatio: 0.2,
            recruitBatch: 5,
            recruitMinBalance: 2,
            reinforceBatch: 4,
            capitalReserve: 10,
            frontReserve: 4,
            buildMoneyReserve: 18
        },
        normal: {
            maxActions: 6,
            minActions: 0,
            economyMultiplier: 1.25,
            ppMultiplier: 1.25,
            minAttackRatio: 1,
            minAttackScore: 2,
            lossAversion: 1,
            attackBias: 1.7,
            defenseReserveRatio: 0.2,
            recruitBatch: 9,
            recruitMinBalance: 0,
            reinforceBatch: 6,
            capitalReserve: 11,
            frontReserve: 5,
            buildMoneyReserve: 14
        },
        hard: {
            maxActions: 12,
            minActions: 0,
            economyMultiplier: 1.5,
            ppMultiplier: 1.5,
            minAttackRatio: 0.95,
            riskyAttackRatio: 0.9,
            riskyTargetValue: 28,
            riskyAttackScore: -55,
            minAttackScore: -10,
            lossAversion: 0.65,
            attackBias: 1.7,
            defenseReserveRatio: 0.2,
            recruitBatch: 14,
            recruitMinBalance: -6,
            reinforceBatch: 9,
            capitalReserve: 13,
            frontReserve: 6,
            buildMoneyReserve: 10
        }
    },
    factionProfiles: {
        TEX: {
            defenseReserveRatio: 0.6
        }
    },
    targetAttackBiases: {
        AUS: { TEX: 1 },
        USA: { NEN: 1 }
    },
    targetAttackDamageBonuses: {
        AUS: { TEX: 0.3 },
        USA: { NEN: 0.3 }
    },

    cancelPending() {
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        this.isThinking = false;
    },

    getDifficultyProfile(difficulty, factionId = null) {
        const baseProfile = this.difficultyProfiles[difficulty] || this.difficultyProfiles.normal;
        const factionProfile = factionId ? this.factionProfiles[factionId] : null;
        return factionProfile ? { ...baseProfile, ...factionProfile } : baseProfile;
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

        const profile = this.getDifficultyProfile(difficulty, factionId);
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
        this.aiAdvanceFreeFocusForTurn(factionId, difficulty);
        this.pendingTimeout = setTimeout(step, actionDelay);
    },

    /**
     * 尝试做一个 AI 决策。返回 true 表示有行动，false 表示无可做（应结束回合）。
     */
    tryOneAction(factionId, difficulty) {
        const faction = GameState.getFaction(factionId);
        if (!faction) return false;

        const profile = this.getDifficultyProfile(difficulty, factionId);
        const resources = this.computeFactionResources(factionId);
        const actionIndex = GameState.game.actionCountThisTurn || 0;

        // 1. 首都或前线快顶不住时，先补兵。
        if (this.aiEmergencyRecruit(factionId, resources, profile)) return true;

        // 2. 如果有漂亮战机，先打一拳；困难 AI 会接受更薄的优势。
        if (this.aiAttackBestTarget(factionId, resources, profile)) return true;

        // 3. 进攻后优先补兵，避免有钱时先盖厂而前线兵力不足。
        if (this.aiRecruitBestNode(factionId, resources, profile)) return true;

        // 4. 普通/困难 AI 会把后方兵力往前线推，避免只在首都堆兵。
        if (difficulty !== 'easy' && this.aiReinforceFront(factionId, resources, profile)) return true;

        // 5. 钱和 PP 都宽裕时，再补工业。
        if (difficulty !== 'easy' && this.aiBuildBestIndustry(factionId, resources, profile, true)) return true;

        // 6. 前几手如果没有战术动作，就推进更有价值的国策。
        if (difficulty !== 'easy' && resources.pp >= 2 && actionIndex <= 2) {
            const focus = this.pickFocus(factionId);
            if (focus) {
                const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
                if (this.aiAdvanceFocus(factionId, focus, capitalNode)) return true;
            }
        }

        // 7. 如果前面没触发富余建厂，局面稳定时仍可补工业。
        if (difficulty !== 'easy' && this.aiBuildBestIndustry(factionId, resources, profile)) return true;

        // 8. 兜底：有 PP 但战线暂时无事，就继续国策。
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

    createAiModifierDefaults() {
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

    getAiModifiers(factionId) {
        if (!GameState.game.aiModifiers) GameState.game.aiModifiers = {};
        const defaults = this.createAiModifierDefaults();
        GameState.game.aiModifiers[factionId] = {
            ...defaults,
            ...(GameState.game.aiModifiers[factionId] || {})
        };
        const modifiers = GameState.game.aiModifiers[factionId];
        modifiers.actionBaseCost = modifiers.actionBaseCost || {};
        modifiers.taggedDefense = modifiers.taggedDefense || {};
        modifiers.taggedIncome = modifiers.taggedIncome || {};
        modifiers.badges = modifiers.badges || [];
        return modifiers;
    },

    getAiIdeologyId(factionId) {
        return (GameState.game.aiIdeologies && GameState.game.aiIdeologies[factionId])
            || (GameState.getFaction(factionId)?.ideology);
    },

    getAiIdeologyBonus(factionId, key) {
        const ideologyId = this.getAiIdeologyId(factionId);
        const ideology = ideologyId ? GameState.getIdeology(ideologyId) : null;
        if (!ideology || !Array.isArray(ideology.bonuses)) return 0;
        const typeMap = {
            maintenanceRateDelta: ['maintenanceRate'],
            recruitCostDelta: ['recruitCost'],
            captureMoneyOnWin: ['captureMoney'],
            captureTroopsOnWin: ['captureTroops']
        };
        const wanted = typeMap[key] || [key];
        return ideology.bonuses
            .filter(bonus => wanted.includes(bonus.type))
            .reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
    },

    getAiNumericModifier(factionId, key) {
        return (this.getAiModifiers(factionId)[key] || 0) + this.getAiIdeologyBonus(factionId, key);
    },

    getAiTaggedEffectValue(factionId, type, tag) {
        const modifiers = this.getAiModifiers(factionId);
        const map = type === 'taggedIncome' ? modifiers.taggedIncome : modifiers.taggedDefense;
        let value = (map && map[tag]) || 0;
        const ideologyId = this.getAiIdeologyId(factionId);
        const ideology = ideologyId ? GameState.getIdeology(ideologyId) : null;
        if (ideology && Array.isArray(ideology.bonuses)) {
            ideology.bonuses
                .filter(bonus => bonus.type === type && bonus.tag === tag)
                .forEach(bonus => { value += bonus.amount || 0; });
        }
        return value;
    },

    getAiTaggedIncomeTotal(factionId) {
        return MapData.getFactionNodes(factionId).reduce((total, node) => (
            total + node.tags.reduce((sum, tag) => sum + this.getAiTaggedEffectValue(factionId, 'taggedIncome', tag), 0)
        ), 0);
    },

    getAiActionCostAdjustment(factionId, action) {
        const costs = this.getAiModifiers(factionId).actionBaseCost || {};
        return costs[action] || 0;
    },

    getTargetAttackBias(factionId, targetFactionId) {
        return (this.targetAttackBiases[factionId] && this.targetAttackBiases[factionId][targetFactionId]) || 0;
    },

    getTargetAttackDamageBonus(factionId, targetFactionId) {
        return (this.targetAttackDamageBonuses[factionId] && this.targetAttackDamageBonuses[factionId][targetFactionId]) || 0;
    },

    getTargetFrontBias(factionId, node) {
        const targets = this.targetAttackBiases[factionId] || {};
        if (!node || Object.keys(targets).length === 0) return 0;
        return MapData.getNeighbors(node.id)
            .filter(neighbor => neighbor.factionId && targets[neighbor.factionId])
            .reduce((sum, neighbor) => sum + targets[neighbor.factionId] * 80, 0);
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
            else if (effect.type === 'globalDefense' || effect.type === 'freeTroops') score += 6;
            else if (effect.type === 'actionCost') score += 8;
            else if (effect.type === 'recruitAmount' || effect.type === 'recruitCost') score += 7;
            else if (effect.type === 'moneyIncome' || effect.type === 'ppIncome' || effect.type === 'taggedIncome') score += 6;
            else if (effect.type === 'ppCapBonus' || effect.type === 'captureMoney') score += 4;
            else if (effect.type === 'taggedDefense') score += 3;
            else if (effect.type === 'industryCapBonus') score += (effect.maxNodes || 1) * 4;
        });

        if ((focus.branch || '').includes('军事') && situation.frontNodes.length > 0) score += 8;
        if ((focus.branch || '').includes('经济') && situation.totalIndustry < 18) score += 6;
        if ((focus.branch || '').includes('政治') && situation.capitalThreat === 0) score += 3;
        return score;
    },

    aiAdvanceFocus(factionId, focus, capitalNode, options = {}) {
        const resources = this.computeFactionResources(factionId);
        const isFree = Boolean(options.free);
        const ppCost = isFree ? 0 : this.getActionPPCost(1, factionId, 'focus');
        if (!isFree) {
            if (resources.pp < ppCost) return false;
            resources.pp -= ppCost;
            GameState.game.actionCountThisTurn = (GameState.game.actionCountThisTurn || 0) + 1;
        }

        const previousProgress = GameState.getFocusProgress(focus.id);
        const required = GameState.getFocusRequiredProgress(focus);
        const nextProgress = Math.min(required, previousProgress + 1);
        GameState.game.focusProgress[focus.id] = nextProgress;

        if (nextProgress >= required) {
            GameState.game.completedFocuses = GameState.game.completedFocuses || [];
            GameState.game.completedFocuses.push(focus.id);
            (focus.effects || []).forEach(effect => this.applyAiFocusEffect(effect, factionId, capitalNode));
            GameState.addLog(`${GameState.getFactionName(factionId)} AI ${isFree ? '免费完成' : '完成'}国策"${focus.name}"。`, 'system', false);
        } else {
            GameState.addLog(`${GameState.getFactionName(factionId)} AI ${isFree ? '免费推进' : '推进'}国策"${focus.name}" (${nextProgress}/${required})。`, 'system', false);
        }
        GameState.notify();
        return true;
    },

    aiAdvanceFreeFocusForTurn(factionId, difficulty) {
        if (difficulty !== 'normal' && difficulty !== 'hard') return false;

        GameState.game.aiFreeFocusTurns = GameState.game.aiFreeFocusTurns || {};
        const turnKey = `${GameState.game.currentTurn}:${factionId}`;
        if (GameState.game.aiFreeFocusTurns[factionId] === turnKey) return false;

        const focus = this.pickFocus(factionId);
        if (!focus) return false;

        const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
        const advanced = this.aiAdvanceFocus(factionId, focus, capitalNode, { free: true });
        if (advanced) GameState.game.aiFreeFocusTurns[factionId] = turnKey;
        return advanced;
    },

    /**
     * AI 自身的国策效果应用（不依赖玩家自己的 modifiers/resources）。
     * 简化版：只更新 AI 的金钱/PP/兵力/工业；UI 不展示 AI 修正。
     */
    applyAiFocusEffect(effect, factionId, capitalNode) {
        const resources = this.computeFactionResources(factionId);
        const modifiers = this.getAiModifiers(factionId);
        if (effect.type === 'money') resources.money += effect.amount;
        else if (effect.type === 'pp') resources.pp = Math.min(this.getAiPPCap(factionId), resources.pp + effect.amount);
        else if (effect.type === 'actionCost') {
            if (effect.action === 'all') {
                ['recruit', 'disband', 'move', 'build', 'focus'].forEach(action => {
                    modifiers.actionBaseCost[action] = (modifiers.actionBaseCost[action] || 0) + effect.amount;
                });
            } else {
                modifiers.actionBaseCost[effect.action] = (modifiers.actionBaseCost[effect.action] || 0) + effect.amount;
            }
        } else if (effect.type === 'recruitAmount') modifiers.recruitAmount += effect.amount;
        else if (effect.type === 'maintenanceRate') modifiers.maintenanceRateDelta += effect.amount;
        else if (effect.type === 'ppIncome') modifiers.ppIncome += effect.amount;
        else if (effect.type === 'moneyIncome') modifiers.moneyIncome += effect.amount;
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
            modifiers.industryCapBoosts += (effect.amount || 0) * (effect.maxNodes || 1);
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
        } else if (effect.type === 'ppCapBonus') modifiers.ppCapBonus += effect.amount;
        else if (effect.type === 'recruitCost') modifiers.recruitCostDelta += effect.amount;
        else if (effect.type === 'freeTroops') modifiers.freeTroops += effect.amount;
        else if (effect.type === 'globalAttack') modifiers.globalAttack += effect.amount;
        else if (effect.type === 'globalDefense') modifiers.globalDefense += effect.amount;
        else if (effect.type === 'taggedDefense') {
            modifiers.taggedDefense[effect.tag] = (modifiers.taggedDefense[effect.tag] || 0) + effect.amount;
        } else if (effect.type === 'taggedIncome') {
            modifiers.taggedIncome[effect.tag] = (modifiers.taggedIncome[effect.tag] || 0) + effect.amount;
        } else if (effect.type === 'captureMoney') modifiers.captureMoneyOnWin += effect.amount;
        else if (effect.type === 'captureTroops') modifiers.captureTroopsOnWin += effect.amount;
        else if (effect.type === 'crisisPP') modifiers.crisisPP += effect.amount;
        else if (effect.type === 'badge') {
            if (!modifiers.badges.includes(effect.label)) modifiers.badges.push(effect.label);
        } else if (effect.type === 'ideology') {
            if (GameState.ideologies[effect.id]) {
                GameState.game.aiIdeologies = GameState.game.aiIdeologies || {};
                GameState.game.aiIdeologies[factionId] = effect.id;
            }
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

    getActionPPCost(baseCost, factionId = null, action = null) {
        const adjustment = factionId && action ? this.getAiActionCostAdjustment(factionId, action) : 0;
        return Math.max(0, baseCost + adjustment + (GameState.game.actionCountThisTurn || 0));
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

        if (anchor) GameState.game.selectedNodeId = anchor.id;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 暂无有效行动，结束行动。`, 'system', false);
        GameState.notify();
        return false;
    },

    getAiRecruitCostPerSoldier(factionId) {
        return Math.max(1, 2 + this.getAiNumericModifier(factionId, 'recruitCostDelta'));
    },

    getAiRecruitGainAmount(factionId, draftAmount) {
        return Math.max(1, draftAmount + this.getAiNumericModifier(factionId, 'recruitAmount'));
    },

    getAiMaintenanceRate(factionId) {
        return Math.max(0.05, GameState.baseMaintenanceRate + this.getAiNumericModifier(factionId, 'maintenanceRateDelta'));
    },

    getAiPPCap(factionId) {
        return Math.max(20, GameState.ppCap + this.getAiNumericModifier(factionId, 'ppCapBonus'));
    },

    calculateAiTurnPreview(factionId, resources, profile, options = {}) {
        const totals = MapData.calculateFactionStats(factionId);
        const extraTroops = Number(options.extraTroops) || 0;
        const extraIndustry = Number(options.extraIndustry) || 0;
        const moneySpent = Math.max(0, Number(options.moneySpent) || 0);
        const grossBase = totals.totalIndustry
            + extraIndustry
            + 1
            + this.getAiNumericModifier(factionId, 'moneyIncome')
            + this.getAiTaggedIncomeTotal(factionId);
        const income = Math.max(0, grossBase) * (profile.economyMultiplier || 1);
        const totalTroops = totals.totalTroops + extraTroops;
        const freeTroops = Math.max(0, this.getAiNumericModifier(factionId, 'freeTroops'));
        const billableTroops = Math.max(0, totalTroops - freeTroops);
        const maintenance = billableTroops * this.getAiMaintenanceRate(factionId);
        const currentMoneyAfterAction = resources.money - moneySpent;
        const projectedMoney = currentMoneyAfterAction + income - maintenance;
        const debtPenalty = GameState.getDebtPenalty(projectedMoney);
        const ppIncome = Math.max(0, GameState.basePPIncome * (profile.ppMultiplier || 1)
            + this.getAiNumericModifier(factionId, 'ppIncome')
            + debtPenalty.ppIncomeDelta);
        const projectedPP = Math.min(this.getAiPPCap(factionId), Math.max(0, (resources.pp || 0) + ppIncome));

        return {
            income,
            maintenance,
            moneyDelta: income - maintenance,
            projectedMoney,
            ppIncome,
            projectedPP,
            debtPenalty,
            freeTroops,
            billableTroops,
            totalTroops
        };
    },

    settleAiTurnStart(factionId, resources, profile) {
        const settlement = this.calculateAiTurnPreview(factionId, resources, profile);
        resources.money = settlement.projectedMoney;
        resources.pp = settlement.projectedPP;
        return {
            income: settlement.income,
            maintenance: settlement.maintenance,
            moneyDelta: settlement.moneyDelta,
            balance: resources.money,
            ppIncome: settlement.ppIncome,
            debtPenalty: settlement.debtPenalty
        };
    },

    estimateAiNextTurnMoney(factionId, resources, profile, extraTroops = 0, moneySpent = 0) {
        return this.calculateAiTurnPreview(factionId, resources, profile, { extraTroops, moneySpent }).projectedMoney;
    },

    estimateAiMoneyAfterTurns(factionId, resources, profile, extraTroops = 0, moneySpent = 0, turns = 5) {
        let projectedMoney = resources.money - moneySpent;
        const totals = MapData.calculateFactionStats(factionId);
        const grossBase = totals.totalIndustry
            + 1
            + this.getAiNumericModifier(factionId, 'moneyIncome')
            + this.getAiTaggedIncomeTotal(factionId);
        const income = Math.max(0, grossBase) * (profile.economyMultiplier || 1);
        const totalTroops = totals.totalTroops + extraTroops;
        const freeTroops = Math.max(0, this.getAiNumericModifier(factionId, 'freeTroops'));
        const billableTroops = Math.max(0, totalTroops - freeTroops);
        const maintenance = billableTroops * this.getAiMaintenanceRate(factionId);

        for (let i = 0; i < turns; i += 1) {
            projectedMoney += income - maintenance;
            if (projectedMoney < 0) return projectedMoney;
        }

        return projectedMoney;
    },

    getMaxRecruitAmountForNextBalance(factionId, resources, profile, costPerSoldier, minBalance = 1) {
        const totals = MapData.calculateFactionStats(factionId);
        const income = (totals.totalIndustry + 1
            + this.getAiNumericModifier(factionId, 'moneyIncome')
            + this.getAiTaggedIncomeTotal(factionId)) * (profile.economyMultiplier || 1);
        const billableTroops = Math.max(0, totals.totalTroops - Math.max(0, this.getAiNumericModifier(factionId, 'freeTroops')));
        const currentMaintenance = Math.max(0, billableTroops * this.getAiMaintenanceRate(factionId));
        const room = resources.money + income - currentMaintenance - minBalance;
        const fullCostPerSoldier = costPerSoldier + this.getAiMaintenanceRate(factionId);
        return Math.max(0, Math.floor(room / fullCostPerSoldier));
    },

    getMaxRecruitAmountForFiveTurnBalance(factionId, resources, profile, costPerSoldier) {
        const budgetCap = Math.floor(Math.max(0, resources.money) * 0.25);
        const budgetLimit = Math.floor(budgetCap / costPerSoldier);
        if (budgetLimit < 1) return 0;

        let low = 0;
        let high = budgetLimit;
        while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            const moneySpent = mid * costPerSoldier;
            const gainedTroops = this.getAiRecruitGainAmount(factionId, mid);
            const projectedMoney = this.estimateAiMoneyAfterTurns(factionId, resources, profile, gainedTroops, moneySpent, 5);
            if (projectedMoney >= 0) low = mid;
            else high = mid - 1;
        }

        return low;
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

    getCapitalDefenseCap(factionId) {
        const totals = MapData.calculateFactionStats(factionId);
        return Math.max(1, Math.ceil(totals.totalTroops * 0.1));
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
                const sourceIsCapital = GameState.getCapitalNodeId(factionId) === source.id;
                if (!sourceIsCapital && sourcePressure > 0 && sourcePressure >= frontPressure) return null;

                const frontNeed = this.estimateNodeDefenseNeed(front, factionId, profile) - front.troops;
                const targetFrontBias = this.getTargetFrontBias(factionId, front);
                const reinforceLimit = Math.max(profile.reinforceBatch, Math.ceil(source.troops * 2 / 3));
                const amount = Math.max(1, Math.min(
                    maxSafeMove,
                    reinforceLimit,
                    Math.ceil(Math.max(1, frontNeed > 0 ? frontNeed : reinforceLimit * 0.5))
                ));
                const score = frontPressure * 4
                    + Math.max(0, frontNeed) * 14
                    + this.getNodeStrategicValue(front) * 1.4
                    + this.getNodeStrategicValue(nextStep) * 0.45
                    + targetFrontBias
                    - distance * 2
                    - sourcePressure * 1.2;

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
        const need = Math.max(1, Math.ceil(base + enemyPressure * 0.55 + node.industry * 0.25 - friendlySupport * 0.18));
        return isCurrentCapital ? Math.min(need, this.getCapitalDefenseCap(factionId)) : need;
    },

    aiEmergencyRecruit(factionId, resources, profile) {
        return this.aiRecruitBestNode(factionId, resources, profile, true);
    },

    aiRecruitBestNode(factionId, resources, profile, emergencyOnly = false) {
        const plan = this.pickRecruitPlan(factionId, resources, profile, emergencyOnly);
        if (!plan) return false;
        return this.aiRecruit(factionId, plan.node, resources, plan.amount, plan.ppCost, plan.costPerSoldier, plan.draftAmount);
    },

    pickRecruitPlan(factionId, resources, profile, emergencyOnly = false) {
        const ppCost = this.getActionPPCost(1, factionId, 'recruit');
        const costPerSoldier = this.getAiRecruitCostPerSoldier(factionId);
        const maxAffordable = this.getMaxRecruitAmountForFiveTurnBalance(factionId, resources, profile, costPerSoldier);
        if (resources.pp < ppCost || maxAffordable < 1) return null;

        const candidates = MapData.getFactionNodes(factionId)
            .filter(node => GameState.canRecruitAtNode(node.id, factionId));
        const plans = candidates.map(node => {
            const pressure = this.getEnemyPressure(node, factionId);
            const need = this.estimateNodeDefenseNeed(node, factionId, profile) - node.troops;
            if (emergencyOnly && need <= 0) return null;
            if (!emergencyOnly && pressure <= 0 && need <= 0 && resources.money < profile.buildMoneyReserve + 8) return null;

            const wanted = emergencyOnly
                ? Math.max(1, need, maxAffordable)
                : pressure > 0
                    ? maxAffordable
                    : Math.max(1, need, maxAffordable * 0.5);
            const draftAmount = Math.max(1, Math.min(maxAffordable, Math.ceil(wanted)));
            const amount = this.getAiRecruitGainAmount(factionId, draftAmount);
            const score = need * 10
                + pressure * 1.2
                + this.getNodeStrategicValue(node)
                + (GameState.getCapitalNodeId(factionId) === node.id ? 15 : 0);
            return { node, amount, draftAmount, costPerSoldier, ppCost, score };
        }).filter(Boolean);

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    aiRecruit(factionId, node, resources, amount, ppCost, costPerSoldier = this.getAiRecruitCostPerSoldier(factionId), draftAmount = amount) {
        const moneyCost = costPerSoldier * draftAmount;
        if (!node || amount < 1) return false;
        if (resources.money < moneyCost) return false;
        const profile = this.getDifficultyProfile(GameState.getSlot(factionId)?.aiDifficulty || 'normal', factionId);
        if (moneyCost > Math.max(0, resources.money) * 0.25) return false;
        if (this.estimateAiMoneyAfterTurns(factionId, resources, profile, amount, moneyCost, 5) < 0) return false;
        if (!this.spendAction(resources, ppCost)) return false;

        resources.money -= moneyCost;
        node.troops += amount;
        node.freshTroops = (node.freshTroops || 0) + amount;
        GameState.addLog(`${GameState.getFactionName(factionId)} AI 在 ${node.name} 征兵 +${amount}（消耗 $${moneyCost}）。`, 'system', false);
        GameState.notify();
        return true;
    },

    aiAttackBestTarget(factionId, resources, profile) {
        const ppCost = this.getActionPPCost(1, factionId, 'move');
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
                    const fullPreview = this.createAiBattlePreview(attacker, defender, factionId);
                    const amount = this.pickAttackTroopAmount(attacker, fullPreview, profile, factionId);
                    if (amount < 1) return;
                    const preview = this.createAiBattlePreview(attacker, defender, factionId, amount);
                    const ratio = preview.attackerPower / Math.max(1, preview.defenderPower);
                    const score = this.scoreAttackPlan(attacker, defender, preview, profile, factionId);
                    const targetValue = this.getNodeStrategicValue(defender);
                    const acceptable = this.isAttackPlanAcceptable(preview, score, ratio, targetValue, profile);
                    if (acceptable) plans.push({ attacker, defender, preview, ratio, score, amount });
                });
        });

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    isAttackPlanAcceptable(preview, score, ratio, targetValue, profile) {
        if (preview.attackerWins) {
            return score >= profile.minAttackScore
                && (ratio >= profile.minAttackRatio || targetValue >= 28);
        }

        return Boolean(profile.riskyAttackRatio)
            && targetValue >= (profile.riskyTargetValue || 28)
            && ratio >= profile.riskyAttackRatio
            && score >= (profile.riskyAttackScore ?? -50);
    },

    pickAttackTroopAmount(attacker, preview, profile, factionId) {
        const movable = GameState.getNodeMovableTroops(attacker);
        if (!preview || movable < 1) return 0;

        const attackMultiplier = Math.max(0.05, 1 + preview.attackerAttackBonus / 100);
        const neededToWin = Math.floor(preview.defenderPower / attackMultiplier) + 1;
        const pressureAmount = Math.ceil((preview.defenderPower * 1.2) / attackMultiplier);
        const halfStrengthAmount = Math.ceil(attacker.troops * 0.5);
        const safeAmount = Math.max(pressureAmount, halfStrengthAmount);
        const reserveRatio = typeof profile.defenseReserveRatio === 'number' ? profile.defenseReserveRatio : 1;
        const sourceNeed = Math.ceil(this.estimateNodeDefenseNeed(attacker, factionId, profile) * reserveRatio);
        const maxWithReserve = Math.max(1, Math.min(movable, attacker.troops - sourceNeed));

        if (safeAmount <= maxWithReserve) return Math.max(1, safeAmount);
        if (neededToWin <= maxWithReserve) return Math.max(1, neededToWin);
        return Math.max(1, Math.min(movable, safeAmount));
    },

    getAiAttackBonusPercent(factionId) {
        const resources = this.computeFactionResources(factionId);
        const debtPenalty = GameState.getDebtPenalty(resources.money);
        return Math.round((this.getAiNumericModifier(factionId, 'globalAttack') + debtPenalty.globalAttackDelta) * 100);
    },

    getAiDefenseBonusPercent(factionId, node) {
        const resources = this.computeFactionResources(factionId);
        const debtPenalty = GameState.getDebtPenalty(resources.money);
        const taggedDefense = (node?.tags || []).reduce((sum, tag) => (
            sum + this.getAiTaggedEffectValue(factionId, 'taggedDefense', tag)
        ), 0);
        return Math.round((this.getAiNumericModifier(factionId, 'globalDefense') + taggedDefense + debtPenalty.globalDefenseDelta) * 100);
    },

    createAiBattlePreview(attacker, defender, factionId, requestedAmount = null) {
        const baseDefenseBonus = 15;
        const isPlayerDefender = defender.factionId === GameState.getPlayerFactionId();
        const defenderSlot = GameState.getSlot(defender.factionId);
        const defenseModifierBonus = isPlayerDefender
            ? Math.round(((GameState.getTaggedDefenseBonus(defender) || 0) + (GameState.getEffectiveGlobalDefense() || 0)) * 100)
            : (defenderSlot && defenderSlot.kind === 'ai' ? this.getAiDefenseBonusPercent(defender.factionId, defender) : 0);
        const attackerEncircled = MapData.isNodeEncircled(attacker);
        const defenderEncircled = MapData.isNodeEncircled(defender);
        const encirclementPenalty = -35;
        const defenseBonus = baseDefenseBonus
            + defenseModifierBonus
            + (defenderEncircled ? encirclementPenalty : 0);
        const attackerAttackBonus = this.getAiAttackBonusPercent(factionId)
            + Math.round(this.getTargetAttackDamageBonus(factionId, defender.factionId) * 100)
            + (attackerEncircled ? encirclementPenalty : 0);
        const maxAttackers = GameState.getNodeMovableTroops(attacker);
        const draftAmount = requestedAmount === null || typeof requestedAmount === 'undefined'
            ? maxAttackers
            : requestedAmount;
        const attackerBase = maxAttackers > 0
            ? Math.min(maxAttackers, Math.max(1, Math.floor(Number(draftAmount) || maxAttackers)))
            : 0;
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
            maxAttackers,
            defenderBase,
            attackerPower,
            defenderPower,
            attackerWins,
            remainingTroops,
            defenseBonus,
            attackerAttackBonus,
            attackerEncircled,
            defenderEncircled,
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
        const reserveRatio = typeof profile.defenseReserveRatio === 'number' ? profile.defenseReserveRatio : 1;
        const sourceNeed = Math.ceil(this.estimateNodeDefenseNeed(attacker, factionId, profile) * reserveRatio);
        const overextensionPenalty = Math.max(0, sourceNeed - sourceAfter) * 0.6;
        const attackBias = (profile.attackBias || 1) + this.getTargetAttackBias(factionId, defender.factionId);

        const attackValue = (preview.attackerWins ? 50 : -70)
            + this.getNodeStrategicValue(defender)
            + Math.min(28, preview.remainingTroops * 2.4)
            + Math.max(0, 10 - defender.troops)
            + MapData.getNeighbors(defender.id).filter(node => node.factionId === factionId).length * 4;

        return attackValue * attackBias
            - expectedLosses * profile.lossAversion
            - overextensionPenalty;
    },

    aiResolveAttack(factionId, plan, resources, ppCost, profile) {
        const attacker = MapData.getNode(plan.attacker.id);
        const defender = MapData.getNode(plan.defender.id);
        if (!attacker || !defender || attacker.factionId !== factionId || defender.factionId === factionId) return false;

        const plannedAmount = Math.min(plan.amount || GameState.getNodeMovableTroops(attacker), GameState.getNodeMovableTroops(attacker));
        const preview = this.createAiBattlePreview(attacker, defender, factionId, plannedAmount);
        const score = this.scoreAttackPlan(attacker, defender, preview, profile, factionId);
        const ratio = preview.attackerPower / Math.max(1, preview.defenderPower);
        const targetValue = this.getNodeStrategicValue(defender);
        if (!this.isAttackPlanAcceptable(preview, score, ratio, targetValue, profile)) return false;

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
            const captureMoney = this.getAiNumericModifier(factionId, 'captureMoneyOnWin');
            const captureTroops = this.getAiNumericModifier(factionId, 'captureTroopsOnWin');
            if (captureMoney > 0) resources.money += captureMoney;
            if (captureTroops > 0) defender.troops += captureTroops;
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
        const ppCost = this.getActionPPCost(1, factionId, 'move');
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
            if (dispatchPlan && dispatchPlan.score > 2) plans.push(dispatchPlan);

            MapData.getNeighbors(source.id)
                .filter(target => target.factionId === factionId)
                .forEach(target => {
                    const targetPressure = this.getEnemyPressure(target, factionId);
                    const targetNeed = this.estimateNodeDefenseNeed(target, factionId, profile) - target.troops;
                    const sourcePressure = this.getEnemyPressure(source, factionId);
                    const sourceIsCapital = GameState.getCapitalNodeId(factionId) === source.id;
                    if (targetPressure <= 0 && targetNeed <= 0) return;
                    if (!sourceIsCapital && sourcePressure > targetPressure && targetNeed <= 0) return;

                    const targetFrontBias = this.getTargetFrontBias(factionId, target);
                    const reinforceLimit = Math.max(profile.reinforceBatch, Math.ceil(source.troops * 2 / 3));
                    const desiredAmount = targetNeed > 0
                        ? targetNeed
                        : targetFrontBias > 0
                            ? reinforceLimit * 0.5
                            : 1;
                    const amount = Math.max(1, Math.min(maxSafeMove, reinforceLimit, Math.ceil(Math.max(1, desiredAmount))));
                    const score = targetNeed * 15
                        + targetPressure * 2.5
                        + this.getNodeStrategicValue(target) * 1.4
                        + targetFrontBias
                        - sourcePressure * 0.9
                        - this.getNodeStrategicValue(source) * 0.08;
                    if (score > 3) plans.push({ source, target, amount, score });
                });
        });

        return plans.sort((a, b) => b.score - a.score)[0] || null;
    },

    aiBuildBestIndustry(factionId, resources, profile, requireSurplus = false) {
        const ppCost = this.getActionPPCost(5, factionId, 'build');
        const moneyCost = 10;
        const reserve = profile.buildMoneyReserve + (requireSurplus ? 8 : 0);
        if (resources.pp < ppCost || resources.money < moneyCost + reserve) return false;
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
