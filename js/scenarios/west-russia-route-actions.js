/**
 * Political settlements grant one replaceable national programme and one
 * deliberate action. All action writes stay inside the acting faction's map
 * ownership, so the regular simultaneous-turn snapshots remain authoritative.
 */
const WestRussiaRouteActions = (() => {
    const actions = {
        civic: { name: '公开听证', description: '支出行政预算召开听证，获得 8 PP。', moneyCost: 6, ppCost: 2, cooldown: 3 },
        arsenal: { name: '统筹生产', description: '指定一处己方省份，工业 +1，不能超过当地工业上限。', moneyCost: 12, ppCost: 4, cooldown: 2, targeted: true },
        breakthrough: { name: '纵深突击', description: '从首都经己方连通地区运输最多 4 支可动部队到己方前线；抵达后可立即参加本回合行军与进攻。', moneyCost: 10, ppCost: 6, cooldown: 2, targeted: true, wartime: true },
        fortress: { name: '纵深筑垒', description: '指定一处己方前线补充 3 支部队；新部队下回合可动。', moneyCost: 8, ppCost: 6, cooldown: 3, targeted: true, wartime: true },
        commerce: { name: '特许贸易', description: '按己方港口、河港、铁路或油田省份结算贸易：金钱 +4，每处贸易省另 +2，最多 +20。', moneyCost: 0, ppCost: 6, cooldown: 3 },
        levies: { name: '战时征集', description: '兵力最少的最多 3 处己方前线各增加 2 支部队；新部队下回合可动。', moneyCost: 6, ppCost: 12, cooldown: 3, wartime: true },
        welfare: { name: '社会复员', description: '从指定非首都省份复员最多 4 支可动部队，每支返还 3 金钱、1 PP；省份不能有待执行行军令。', moneyCost: 0, ppCost: 6, cooldown: 2, targeted: true },
        supply: { name: '轮换补给', description: '从首都经己方连通地区运输最多 6 支可动部队到指定己方省份；抵达后下回合可动。', moneyCost: 6, ppCost: 4, cooldown: 2, targeted: true },
        councils: { name: '工厂大会', description: '工业最高的最多 3 处己方省份各补充 1 支部队，并按这些省份工业总量获得最多 8 PP。', moneyCost: 10, ppCost: 10, cooldown: 3 }
    };
    const modifierKeys = {
        recruitAmount: 'recruitAmount', maintenanceRate: 'maintenanceRateDelta',
        ppIncome: 'ppIncome', moneyIncome: 'moneyIncome', ppCapBonus: 'ppCapBonus',
        recruitCost: 'recruitCostDelta', freeTroops: 'freeTroops', globalAttack: 'globalAttack',
        globalDefense: 'globalDefense', captureMoney: 'captureMoneyOnWin',
        captureTroops: 'captureTroopsOnWin', crisisPP: 'crisisPP', damageOnCapture: 'damageOnCapture'
    };
    const clone = value => JSON.parse(JSON.stringify(value));
    const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
    const localId = () => GameState.getPlayerFactionId();
    const isAi = (factionId, options = {}) => options.ai === true
        || (options.ai !== false && GameState.getSlot(factionId)?.kind === 'ai');
    const lookup = id => {
        if (typeof WestRussiaEndings === 'undefined') return null;
        if (typeof WestRussiaEndings.getById === 'function') return WestRussiaEndings.getById(id);
        const all = typeof WestRussiaEndings.all === 'function' ? WestRussiaEndings.all() : WestRussiaEndings.all;
        return Array.isArray(all) ? all.find(item => item.id === id) : all?.[id];
    };
    const kindOf = ending => ending?.actionKind || ending?.mechanic || ending?.kind || ending?.action;
    const effectsOf = ending => ending?.passiveEffects || ending?.effects || [];
    const ownNodes = factionId => MapData.getFactionNodes(factionId);
    const front = (node, factionId) => MapData.getNeighbors(node.id)
        .some(other => other.factionId && other.factionId !== factionId);
    const capitals = factionId => MapData.getNode(GameState.getCapitalNodeId(factionId));
    const orders = factionId => window.SimultaneousTurns && SimultaneousTurns.isPlanning()
        ? (GameState.game.turnPlans?.[factionId]?.orders || []) : [];
    const movable = (node, factionId) => Math.max(0, Math.min(
        finite(node.moveReady ?? node.troops), finite(node.troops)
    ) - orders(factionId).filter(order => order.sourceId === node.id)
        .reduce((sum, order) => sum + Math.max(0, finite(order.amount)), 0));
    const fresh = (node, amount) => {
        const ready = Math.min(finite(node.moveReady ?? node.troops), finite(node.troops));
        node.troops += amount;
        node.moveReady = Math.max(0, ready);
        node.freshTroops = Math.max(0, finite(node.freshTroops)) + amount;
    };
    const removeReady = (node, amount) => {
        node.moveReady = Math.max(0, finite(node.moveReady ?? node.troops) - amount);
        node.troops = Math.max(0, node.troops - amount);
        node.movedThisTurn = node.moveReady <= 0;
    };
    function context(factionId, options = {}) {
        const ai = isAi(factionId, options);
        const modifiers = ai ? window.GameAI?.getAiModifiers(factionId) : GameState.getGameModifiers();
        const resources = ai ? window.GameAI?.computeFactionResources(factionId) : GameState.game.playerResources;
        return { ai, modifiers, resources, state: modifiers?.routeState };
    }
    function adjustPassive(modifiers, effect, direction) {
        const amount = finite(effect.amount) * direction;
        const key = modifierKeys[effect.type];
        if (key) {
            const value = finite(modifiers[key]) + amount;
            modifiers[key] = Math.abs(value) < 1e-10 ? 0 : value;
        } else if (effect.type === 'actionCost') {
            const costs = modifiers.actionBaseCost || (modifiers.actionBaseCost = {});
            (effect.action === 'all' ? ['recruit', 'disband', 'move', 'build', 'focus'] : [effect.action])
                .filter(Boolean).forEach(action => { costs[action] = finite(costs[action]) + amount; });
        } else if (effect.type === 'taggedIncome' || effect.type === 'taggedDefense') {
            const tags = modifiers[effect.type] || (modifiers[effect.type] = {});
            tags[effect.tag] = finite(tags[effect.tag]) + amount;
        }
    }
    function connected(source, target, factionId) {
        if (!source || !target || source.factionId !== factionId || target.factionId !== factionId) return false;
        const seen = new Set([source.id]);
        for (const id of seen) {
            if (id === target.id) return true;
            MapData.getNeighbors(id).filter(node => node.factionId === factionId)
                .forEach(node => seen.add(node.id));
        }
        return false;
    }
    function chooseTarget(kind, factionId) {
        const capital = capitals(factionId);
        const nodes = ownNodes(factionId);
        if (kind === 'arsenal') return nodes.filter(node => node.industry < GameState.getNodeIndustryCap(node.id))
            .sort((a, b) => b.industry - a.industry || a.id.localeCompare(b.id))[0];
        if (kind === 'welfare') return nodes.filter(node => node.id !== capital?.id
            && !orders(factionId).some(order => order.sourceId === node.id || order.targetId === node.id)
            && movable(node, factionId) > 0)
            .sort((a, b) => Number(front(a, factionId)) - Number(front(b, factionId))
                || movable(b, factionId) - movable(a, factionId) || a.id.localeCompare(b.id))[0];
        return nodes.filter(node => (kind !== 'fortress' && kind !== 'breakthrough' || front(node, factionId))
            && (kind !== 'supply' && kind !== 'breakthrough' || node.id !== capital?.id && connected(capital, node, factionId)))
            .sort((a, b) => a.troops - b.troops || a.id.localeCompare(b.id))[0];
    }
    function checkGoal(factionId, modifiers, ending) {
        modifiers ||= context(factionId).modifiers;
        const state = modifiers?.routeState;
        ending ||= lookup(state?.id);
        if (!ending) return false;
        if (!state || state.objectiveComplete || state.uses < 3) return false;
        const required = Math.max(12, finite(ending.goalNodes || ending.objective?.goalNodes));
        if (ownNodes(factionId).length < required) return false;
        state.objectiveComplete = true;
        state.achieved = true;
        state.objectiveTurn = GameState.game.currentTurn;
        const label = ending.badge || `施政纪念 · ${ending.name || ending.title || state.id}`;
        const badges = modifiers.badges || (modifiers.badges = []);
        if (!badges.includes(label)) badges.push(label);
        GameState.addLog(`${GameState.getFactionName(factionId)} 完成施政目标「${ending.name || ending.title || state.id}」：行动执行 ${state.uses} 次，掌握 ${ownNodes(factionId).length} 处省份。这是一段施政纪念，战役继续。`, 'system', false);
        return true;
    }
    function settlement(id, factionId, modifiers) {
        const ending = lookup(id);
        if (!ending || ending.factionId && ending.factionId !== factionId) return null;
        modifiers ||= context(factionId).modifiers;
        if (!modifiers) return null;
        const previous = modifiers.routeState;
        if (previous?.id === id) return previous;
        (previous?.passiveEffects || effectsOf(lookup(previous?.id))).forEach(effect => adjustPassive(modifiers, effect, -1));
        const passiveEffects = clone(effectsOf(ending));
        passiveEffects.forEach(effect => adjustPassive(modifiers, effect, 1));
        modifiers.routeState = {
            id, uses: 0, enteredTurn: GameState.game.currentTurn,
            lastUsedTurn: previous?.lastUsedTurn ?? null,
            passiveEffects, objectiveComplete: false, achieved: false
        };
        return modifiers.routeState;
    }
    function describe(factionId = localId(), nodeId = GameState.game.selectedNodeId, options = {}) {
        const ctx = context(factionId, options);
        const ending = lookup(ctx.state?.id);
        const kind = kindOf(ending);
        const action = actions[kind];
        if (!action) return null;
        const turn = GameState.game.currentTurn;
        const remaining = ctx.state.lastUsedTurn == null ? 0 : Math.max(0, action.cooldown - (turn - ctx.state.lastUsedTurn));
        const target = action.targeted ? (ctx.ai && !nodeId ? chooseTarget(kind, factionId) : MapData.getNode(nodeId)) : null;
        const capital = capitals(factionId);
        const fronts = ownNodes(factionId).filter(node => front(node, factionId));
        let reason = '';
        if (GameState.getScenario().id !== 'west-russia') reason = '仅西俄罗斯战役可执行';
        else if (GameState.game.gameOver) reason = '战役已经结束';
        else if (ctx.ai && GameState.getSlot(factionId)?.kind !== 'ai') reason = '该势力不是 AI';
        else if (!ctx.ai && factionId !== localId()) reason = '只能执行本国行动';
        else if (!ctx.ai && window.app?.canLocalPlayerAct && !window.app.canLocalPlayerAct()) reason = '计划已提交或尚未轮到本国';
        else if (ctx.ai && window.SimultaneousTurns && SimultaneousTurns.isEnabled() && !SimultaneousTurns.isPlanning()) reason = '当前不在规划阶段';
        else if (action.wartime && !GameState.isWarOpen()) reason = '发育期结束后可执行';
        else if (remaining > 0) reason = `还需冷却 ${remaining} 回合`;
        else if (!ctx.resources || ctx.resources.money < action.moneyCost || ctx.resources.pp < action.ppCost) reason = '金钱或 PP 不足';
        else if (action.targeted && (!target || target.factionId !== factionId)) reason = '请先选择己方省份';
        else if (kind === 'arsenal' && target.industry >= GameState.getNodeIndustryCap(target.id)) reason = '该省工业已达上限';
        else if ((kind === 'fortress' || kind === 'breakthrough') && !front(target, factionId)) reason = '请选择与敌方接壤的己方前线';
        else if (kind === 'levies' && !fronts.length) reason = '没有需要征集部队的己方前线';
        else if (kind === 'welfare' && (target.id === capital?.id || orders(factionId).some(order => order.sourceId === target.id || order.targetId === target.id))) reason = '首都或已有行军令的省份不能复员';
        else if (kind === 'welfare' && movable(target, factionId) < 1) reason = '该省没有可复员的可动部队';
        else if ((kind === 'supply' || kind === 'breakthrough') && (!capital || capital.factionId !== factionId || target.id === capital.id || !connected(capital, target, factionId))) reason = '目的省必须经己方领土与首都连通';
        else if ((kind === 'supply' || kind === 'breakthrough') && Math.min(movable(capital, factionId), Math.max(0, capital.troops - 1)) < 1) reason = '首都没有未预留的可动部队，且须保留 1 支守军';
        else if (kind === 'councils' && !ownNodes(factionId).length) reason = '没有可召开大会的己方省份';
        return {
            ...action, kind, endingId: ending.id, endingName: ending.name || ending.title,
            nodeId: target?.id || null, enabled: !reason, canExecute: !reason, reason,
            cooldownRemaining: remaining, uses: ctx.state.uses || 0,
            goalNodes: Math.max(12, finite(ending.goalNodes || ending.objective?.goalNodes)),
            objectiveComplete: !!ctx.state.objectiveComplete
        };
    }
    function execute(factionId = localId(), nodeId, options = {}) {
        const ctx = context(factionId, options);
        const action = describe(factionId, nodeId ?? (ctx.ai ? null : GameState.game.selectedNodeId), options);
        if (!action?.enabled) return { ok: false, reason: action?.reason || '尚未确立施政路线' };
        const ending = lookup(action.endingId);
        const target = action.nodeId ? MapData.getNode(action.nodeId) : null;
        const capital = capitals(factionId);
        const resources = ctx.resources;
        resources.money -= action.moneyCost;
        resources.pp -= action.ppCost;
        let detail = '';
        const cap = ctx.ai ? GameAI.getAiPPCap(factionId) : GameState.getEffectivePPCap();
        const gainPP = amount => { resources.pp = Math.min(cap, resources.pp + amount); };
        if (action.kind === 'civic') { gainPP(8); detail = '听证完成，获得 8 PP'; }
        else if (action.kind === 'arsenal') { target.industry += 1; detail = `${target.name} 工业 +1`; }
        else if (action.kind === 'breakthrough' || action.kind === 'supply') {
            const amount = Math.min(action.kind === 'supply' ? 6 : 4, movable(capital, factionId), Math.max(0, capital.troops - 1));
            removeReady(capital, amount);
            if (action.kind === 'breakthrough') {
                const ready = Math.min(finite(target.moveReady ?? target.troops), finite(target.troops));
                target.troops += amount;
                target.moveReady = ready + amount;
                target.movedThisTurn = false;
            } else fresh(target, amount);
            detail = `${amount} 支部队由首都抵达 ${target.name}，${action.kind === 'breakthrough' ? '可立即参加本回合行动' : '下回合可动'}`;
        } else if (action.kind === 'fortress') { fresh(target, 3); detail = `${target.name} 驻军 +3，下回合可动`; }
        else if (action.kind === 'commerce') {
            const count = ownNodes(factionId).filter(node => (node.tags || []).some(tag => ['港口', '河港', '铁路', '油田'].includes(tag))).length;
            const amount = Math.min(20, 4 + count * 2);
            resources.money += amount;
            detail = `${count} 处贸易省份带来 ${amount} 金钱`;
        } else if (action.kind === 'levies') {
            const nodes = ownNodes(factionId).filter(node => front(node, factionId))
                .sort((a, b) => a.troops - b.troops || a.id.localeCompare(b.id)).slice(0, 3);
            nodes.forEach(node => fresh(node, 2));
            detail = `${nodes.length} 处前线各增加 2 支部队，下回合可动`;
        } else if (action.kind === 'welfare') {
            const amount = Math.min(4, movable(target, factionId));
            removeReady(target, amount);
            resources.money += amount * 3;
            gainPP(amount);
            detail = `${target.name} 复员 ${amount} 支部队，返还 ${amount * 3} 金钱、${amount} PP`;
        } else if (action.kind === 'councils') {
            const nodes = ownNodes(factionId).sort((a, b) => b.industry - a.industry || a.id.localeCompare(b.id)).slice(0, 3);
            nodes.forEach(node => fresh(node, 1));
            const pp = Math.min(8, nodes.reduce((sum, node) => sum + node.industry, 0));
            gainPP(pp);
            detail = `${nodes.length} 处省份各补充 1 支部队，并获得 ${pp} PP`;
        }
        ctx.state.uses = (ctx.state.uses || 0) + 1;
        ctx.state.lastUsedTurn = GameState.game.currentTurn;
        checkGoal(factionId, ctx.modifiers, ending);
        GameState.addLog(`${GameState.getFactionName(factionId)} 执行「${action.name}」：${detail}。`, 'system', false);
        return { ok: true, action: action.kind, detail, uses: ctx.state.uses };
    }
    function autoAct(factionId) {
        if (GameState.getSlot(factionId)?.kind !== 'ai') return { ok: false, reason: '该势力不是 AI' };
        const ctx = context(factionId, { ai: true });
        const ending = lookup(ctx.state?.id);
        const kind = kindOf(ending);
        if (!actions[kind]) return { ok: false, reason: '尚未确立施政路线' };
        const target = actions[kind].targeted ? chooseTarget(kind, factionId) : null;
        return execute(factionId, target?.id || null, { ai: true });
    }
    return { settlement, describe, execute, autoAct, checkGoal, actions, getEnding: lookup };
})();

window.WestRussiaRouteActions = WestRussiaRouteActions;
