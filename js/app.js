function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatMoney(value) {
    const safeValue = Number(value) || 0;
    return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatSignedMoney(value) {
    const safeValue = Math.abs(Number(value) || 0) < 0.005 ? 0 : Number(value) || 0;
    return `${safeValue >= 0 ? '+' : ''}${formatMoney(safeValue)}`;
}

const App = {
    root: null,
    modalRoot: null,
    rankingMetric: 'nodes',
    mobilePanel: null,
    timerId: null,
    mapDrag: null,
    mapPointers: new Map(),
    mapTouchGesture: null,
    focusTreeDrag: null,
    focusTreeCentered: false,
    pendingFocusTreeScroll: null,
    lastFocusDragEndedAt: 0,

    init() {
        this.root = document.getElementById('app');
        this.modalRoot = document.getElementById('modal-container');

        // 引导 lobby（建立默认 slots）
        if (GameState.bootstrapLobby) GameState.bootstrapLobby();

        GameState.subscribe(() => {
            this.render();
            this.maybeRunAi();
            this.maybePushOnlineSync();
        });
        this.render();
        this.startTimer();

        // 处理 hash 链接邀请：#room=ABCDEF 自动跳转到加入对话
        if (location.hash.startsWith('#room=')) {
            const code = decodeURIComponent(location.hash.slice('#room='.length));
            if (code) setTimeout(() => this.promptJoinRoom(code), 300);
        }
    },

    render() {
        const views = {
            'main-menu': MainMenuView,
            lobby: LobbyView,
            'faction-select': FactionSelectView,
            'game-page': GamePageView
        };
        const view = views[GameState.currentView] || MainMenuView;

        this.root.innerHTML = view.render();
        this.modalRoot.innerHTML = typeof view.renderModals === 'function' ? view.renderModals() : '';
        this.attachMapInteraction();
        this.attachFocusTreeInteraction();
        this.alignFocusTree();
    },

    navigateTo(viewName) {
        GameState.setView(viewName);
    },

    isMobileLayout() {
        return typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
    },

    setMobilePanel(panel) {
        this.mobilePanel = this.mobilePanel === panel ? null : panel;
        this.render();
    },

    setPlayerName(rawName) {
        const name = String(rawName || '').trim().slice(0, 16) || '指挥官';
        GameState.setMyIdentity({ name });
        // 若我已坐席位，更新名字
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        GameState.notify();
    },

    startLocalLobby() {
        GameState.initLocalLobby();
        GameState.setView('lobby');
    },

    async createOnlineRoom() {
        if (!window.Multiplayer) return alert('多人模块未加载');
        try {
            GameState.lobby.connecting = true;
            GameState.lobby.statusMessage = '正在创建房间…';
            GameState.notify();
            const code = await Multiplayer.createRoom(GameState.lobby.myName);
            GameState.lobby.connecting = false;
            GameState.lobby.statusMessage = `房间 ${code} 已创建。把房间码告诉朋友以邀请他们。`;
            GameState.setView('lobby');
        } catch (err) {
            GameState.lobby.connecting = false;
            GameState.lobby.statusMessage = '创建房间失败：' + (err && err.message ? err.message : err);
            GameState.notify();
        }
    },

    async promptJoinRoom(prefilledCode = '') {
        if (!window.Multiplayer) return alert('多人模块未加载');
        const code = (prefilledCode || prompt('请输入房间码（6 位字母 / 数字）：') || '').trim();
        if (!code) return;
        try {
            GameState.lobby.connecting = true;
            GameState.lobby.statusMessage = '正在加入房间…';
            GameState.notify();
            await Multiplayer.joinRoom(code, GameState.lobby.myName);
            GameState.lobby.connecting = false;
            GameState.lobby.statusMessage = '已加入房间。';
            GameState.setView('lobby');
        } catch (err) {
            GameState.lobby.connecting = false;
            GameState.lobby.statusMessage = '加入失败：' + (err && err.message ? err.message : err);
            GameState.notify();
        }
    },

    async leaveLobby() {
        if (window.Multiplayer && Multiplayer.isOnline) {
            await Multiplayer.leaveRoom();
        }
        GameState.initLocalLobby();
        GameState.setView('main-menu');
    },

    async exitGame() {
        const confirmed = window.confirm('确认退出当前战局并返回主菜单？当前战局进度不会保留。');
        if (!confirmed) return;

        if (window.Multiplayer && Multiplayer.isOnline) {
            await Multiplayer.leaveRoom();
        }
        GameState.closeModals();
        GameState.initLocalLobby();
        GameState.setView('main-menu');
    },

    copyInviteLink() {
        const code = GameState.lobby.roomCode;
        const url = `${location.origin}${location.pathname}#room=${encodeURIComponent(code)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                GameState.lobby.statusMessage = `邀请链接已复制：${url}`;
                GameState.notify();
            }).catch(() => {
                GameState.lobby.statusMessage = `邀请链接：${url}`;
                GameState.notify();
            });
        } else {
            GameState.lobby.statusMessage = `邀请链接：${url}`;
            GameState.notify();
        }
    },

    openRulesHelp() {
        alert('裂旗战争（v0.3）：\n\n· 单机沙盒：本地房间，每个空席国家在游戏中待机。\n· 联机房间：通过 Firebase 同步，房主控制开局并能添加 AI/踢人。\n· 战场上每个国家依次行动，AI 由本地或房主代为执行。');
    },

    updateLobbySetting(key, value) {
        GameState.updateLobbySetting(key, value);
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    toggleLobbySwitch(key) {
        GameState.toggleLobbySwitch(key);
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    handleLobbyChatKey(event) {
        if (event.key !== 'Enter') return;
        GameState.addLobbyChat(event.currentTarget.value);
        event.currentTarget.value = '';
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    takeSlot(factionId) {
        if (GameState.takeSlot(factionId)) {
            GameState.notify();
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        }
    },

    releaseSlot() {
        GameState.leaveSlot();
        GameState.notify();
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    addAiToSlot(factionId, difficulty) {
        if (!difficulty) return;
        if (!GameState.isHost()) return alert('只有房主才能添加 AI');
        if (GameState.addAiToSlot(factionId, difficulty)) {
            GameState.notify();
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        }
    },

    fillOpenSlotsWithAi(difficulty = 'normal') {
        if (!GameState.isHost()) return alert('只有房主才能添加 AI');
        const filled = GameState.fillOpenSlotsWithAi(difficulty);
        const label = difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通';
        GameState.lobby.statusMessage = filled > 0
            ? `已将 ${filled} 个空席位设为 ${label} AI。`
            : '没有可填充的空席位。';
        GameState.notify();
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    setAiDifficulty(factionId, difficulty) {
        if (!GameState.isHost()) return alert('只有房主才能调整 AI 难度');
        if (GameState.setAiDifficulty(factionId, difficulty)) {
            GameState.notify();
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        }
    },

    clearSlot(factionId) {
        if (!GameState.isHost()) return alert('只有房主才能清空席位');
        if (GameState.clearSlot(factionId)) {
            GameState.notify();
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        }
    },

    kickFromSlot(factionId) {
        if (!GameState.isHost()) return alert('只有房主才能踢人');
        const slot = GameState.getSlot(factionId);
        if (!slot || slot.kind !== 'human') return;
        if (!confirm(`踢出 ${slot.playerName}？`)) return;
        slot.kind = 'open';
        slot.userId = null;
        slot.playerName = '';
        GameState.notify();
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    selectFaction(factionId) {
        GameState.selectFaction(factionId);
    },

    startMatch() {
        if (!GameState.isHost()) {
            GameState.lobby.statusMessage = '请等待房主开始游戏。';
            GameState.notify();
            return;
        }
        const active = GameState.getActiveSlots();
        if (active.length < 2) return alert('至少需要 2 个非空席位才能开始（玩家或 AI）');
        const humans = active.filter(s => s.kind === 'human');
        if (humans.length < 1) return alert('至少需要 1 个人类玩家');
        MapData.reset();
        GameState.startGameSession();
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushGameState();
    },

    startGame() {
        // 兼容旧入口：本地玩家可直接通过 faction-select 进入。
        MapData.reset();
        GameState.startGameSession();
    },

    /**
     * 当渲染后状态发生变化：
     *   - 如果当前轮到 AI 国家、且本机是房主（或本地模式），自动让 GameAI 接管该回合。
     *   - 如果是空席（开放席位）但仍处于 turnOrder（理论不会），跳过。
     */
    maybeRunAi() {
        if (!GameState.game || GameState.game.gameOver) return;
        if (GameState.currentView !== 'game-page') return;

        const currentId = GameState.game.currentPlayerId;
        const slot = GameState.getSlot(currentId);
        if (!slot) return;

        const isAi = slot.kind === 'ai';
        const isOpen = slot.kind === 'open';
        const isOnline = window.Multiplayer && Multiplayer.isOnline;
        const amIHost = GameState.isHost();

        // 空席：直接结束他的回合（不应该发生，因为 turnOrder 不含 open，但兜底）
        if (isOpen) {
            if (!isOnline || amIHost) {
                if (!this._aiSkipScheduled) {
                    this._aiSkipScheduled = true;
                    setTimeout(() => {
                        this.endTurn(false);
                        this._aiSkipScheduled = false;
                    }, 50);
                }
            }
            return;
        }

        if (!isAi) return;
        // 联机：只有房主代跳 AI
        if (isOnline && !amIHost) return;
        if (window.GameAI && window.GameAI.isThinking) return;
        if (this._aiTurnRunning) return;

        this._aiTurnRunning = true;
        window.GameAI.takeTurn(currentId, slot.aiDifficulty || 'normal', () => {
            setTimeout(() => {
                this._aiTurnRunning = false;
                if (GameState.game && !GameState.game.gameOver && GameState.game.currentPlayerId === currentId) {
                    this.endTurn(false);
                }
            }, 25);
        });
    },

    maybePushOnlineSync() {
        if (!window.Multiplayer || !Multiplayer.isOnline) return;
        if (Multiplayer.suppressLocalSync) return;
        if (GameState.currentView === 'game-page') {
            Multiplayer.pushGameState();
        }
    },

    /**
     * 检查："轮到我吗？" —— 联机模式下用。
     */
    isMyTurnToAct() {
        if (!GameState.game) return false;
        const currentId = GameState.game.currentPlayerId;
        return GameState.isFactionPlayedByLocalUser(currentId);
    },

    startTimer() {
        if (this.timerId) return;

        this.timerId = window.setInterval(() => {
            if (GameState.currentView !== 'game-page') return;

            if (GameState.game.timerRemaining <= 0) {
                this.endTurn(true);
                return;
            }

            GameState.game.timerRemaining -= 1;
            this.updateTimerDisplay();
        }, 1000);
    },

    updateTimerDisplay() {
        const timerElements = document.querySelectorAll('.timer');
        timerElements.forEach(element => {
            element.textContent = formatTimer(GameState.game.timerRemaining);
            element.classList.toggle('danger', GameState.game.timerRemaining <= 15);
        });
    },

    getActionMeta(action) {
        const perSoldierBase = 2;
        const recruitCostPerSoldier = Math.max(1, perSoldierBase + GameState.getEffectiveRecruitCostDelta());
        const draftAmount = this.getSelectedRecruitAmount(recruitCostPerSoldier);
        const recruitAmount = Math.max(1, draftAmount + GameState.getEffectiveRecruitAmount());
        const meta = {
            recruit: {
                label: '征兵',
                basePP: 1,
                costPerSoldier: recruitCostPerSoldier,
                draftAmount,
                recruitAmount,
                costMoney: recruitCostPerSoldier * draftAmount,
                effect: `节点驻军 +${recruitAmount}（拖拽选择数量）`,
                rulesHint: '每个士兵 $2，每次征兵都是 1 行动；只能在当前首都或已占领的原始首都执行'
            },
            move: {
                label: '移动士兵',
                basePP: 1,
                costMoney: 0,
                effect: '本回合所有未移动士兵可各移动 1 次'
            },
            build: {
                label: '建设工业',
                basePP: 5,
                costMoney: 10,
                effect: '节点工业 +1',
                rulesHint: '建设工业同时消耗 $10'
            },
            focus: {
                label: '推进国策',
                basePP: 1,
                costMoney: 0,
                effect: '当前国策进度 +1',
                rulesHint: '在国策详情中选择一个可推进的国策'
            }
        };

        return meta[action] || meta.recruit;
    },

    getActionCost(action, nodeId = GameState.game.selectedNodeId) {
        const node = MapData.getNode(nodeId);
        const meta = this.getActionMeta(action);
        const costMoney = meta.costMoney;
        const adjustedBasePP = Math.max(0, meta.basePP + GameState.getActionBaseCostAdjustment(action));
        const ppCost = GameState.getActionPPCost(adjustedBasePP);
        const costText = `${costMoney > 0 ? `$${formatMoney(costMoney)} / ` : ''}${ppCost} PP`;

        return {
            ...meta,
            basePP: adjustedBasePP,
            costMoney,
            ppCost,
            cost: costText,
            costText
        };
    },

    getRecruitMoneyPreviewText(meta = this.getActionCost('recruit')) {
        const current = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId());
        const afterRecruit = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId(), {
            extraTroops: meta.recruitAmount || 0,
            moneySpent: meta.costMoney || 0,
            ppSpent: meta.ppCost || 0
        });
        return `下回合金钱净变：${formatSignedMoney(current.moneyDelta)} → ${formatSignedMoney(afterRecruit.moneyDelta)}，预计余额 $${formatMoney(afterRecruit.projectedMoney)}`;
    },

    getActionAvailability(action, nodeId = GameState.game.selectedNodeId, options = {}) {
        const node = MapData.getNode(nodeId);
        const meta = this.getActionCost(action, nodeId);
        const playerFactionId = GameState.getPlayerFactionId();
        const resources = GameState.game.playerResources;
        const requireFriendlyMoveTarget = options.requireFriendlyMoveTarget !== false;

        if (action === 'move') {
            if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', cost: meta.cost, ...meta };
            if (GameState.game.currentPlayerId !== playerFactionId) return { enabled: false, reason: '还未轮到你行动', cost: meta.cost, ...meta };
            if (GameState.game.movementOrdersActive) {
                return { enabled: true, reason: '', cost: '已启用', ppCost: 0, costMoney: 0, meta };
            }

            const hasMovableTroops = GameState.getFactionMovableTroops(playerFactionId) > 0;
            if (!hasMovableTroops) return { enabled: false, reason: '本回合没有可移动士兵', cost: meta.cost, ...meta };
            if (resources.pp < meta.ppCost) return { enabled: false, reason: `缺少 ${meta.ppCost - resources.pp} PP`, cost: meta.cost, ...meta };
            return { enabled: true, reason: '', cost: meta.cost, ppCost: meta.ppCost, costMoney: meta.costMoney, meta };
        }

        if (!node) return { enabled: false, reason: '未选择节点', cost: meta.cost };
        if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', cost: meta.cost };
        if (GameState.game.currentPlayerId !== playerFactionId) return { enabled: false, reason: '还未轮到你行动', cost: meta.cost };
        if (node.factionId !== playerFactionId) return { enabled: false, reason: '只能操作己方节点', cost: meta.cost };
        if (action === 'recruit' && !GameState.canRecruitAtNode(node.id, playerFactionId)) {
            return { enabled: false, reason: '征兵只能在当前首都或已占领的原始首都执行', cost: meta.cost };
        }
        if (action === 'recruit' && resources.money < (meta.costPerSoldier || 1)) {
            return { enabled: false, reason: `至少需要 ${meta.costPerSoldier || 1} 金钱才能征 1 个兵`, cost: meta.cost };
        }
        if (action === 'build') {
            const cap = GameState.getNodeIndustryCap(node.id);
            if (node.industry >= cap) return { enabled: false, reason: `该节点工业已达到上限 ${cap}`, cost: meta.cost };
        }
        if (meta.costMoney > 0 && resources.money < meta.costMoney) return { enabled: false, reason: `缺少 ${formatMoney(meta.costMoney - resources.money)} 金钱`, cost: meta.cost };
        if (resources.pp < meta.ppCost) return { enabled: false, reason: `缺少 ${meta.ppCost - resources.pp} PP`, cost: meta.cost };
        if (action === 'move' && node.troops < 2) return { enabled: false, reason: '至少需要 2 支部队才能移动', cost: meta.cost };
        if (action === 'move' && requireFriendlyMoveTarget && MapData.getMoveTargets(node.id, playerFactionId).length === 0) {
            return { enabled: false, reason: '没有相邻己方目标', cost: meta.cost };
        }

        return { enabled: true, reason: '', cost: meta.cost, ppCost: meta.ppCost, costMoney: meta.costMoney, meta };
    },

    openAction(action) {
        const availability = this.getActionAvailability(action);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }

        GameState.openActionConfirm(action);
    },

    activateMove() {
        const availability = this.getActionAvailability('move');
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }

        if (!GameState.game.movementOrdersActive) {
            GameState.game.playerResources.pp -= availability.ppCost;
            GameState.game.actionCountThisTurn += 1;
            GameState.game.movementOrdersActive = true;
            GameState.game.currentAction = 'move';
            GameState.game.battlePreview = null;
            GameState.game.actionConfirm = null;
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：发布移动令，本回合未移动士兵各可移动 1 次。`, 'system');
            return;
        }

        const nextAction = GameState.game.currentAction === 'move' ? null : 'move';
        GameState.setCurrentAction(nextAction);
    },

    ensureMovementOrdersForAttack() {
        if (GameState.game.movementOrdersActive) {
            GameState.game.currentAction = 'move';
            GameState.game.actionConfirm = null;
            return true;
        }

        const availability = this.getActionAvailability('move');
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return false;
        }

        GameState.game.playerResources.pp -= availability.ppCost;
        GameState.game.actionCountThisTurn += 1;
        GameState.game.movementOrdersActive = true;
        GameState.game.currentAction = 'move';
        GameState.game.battlePreview = null;
        GameState.game.actionConfirm = null;
        GameState.addLog(`第 ${GameState.game.currentTurn} 回合：发布移动令，本回合未移动士兵各可移动或进攻 1 次。`, 'system', false);
        return true;
    },

    openBattleWithMoveOrder(attackerId, defenderId) {
        const attacker = MapData.getNode(attackerId);
        const defender = MapData.getNode(defenderId);
        const playerFactionId = GameState.getPlayerFactionId();
        const relation = defender ? GameState.game.diplomacy[defender.factionId] : null;

        if (!attacker || !defender) return;
        if (attacker.factionId !== playerFactionId) {
            GameState.addLog('你未选中己方可用节点。', 'system');
            return;
        }
        if (defender.factionId === playerFactionId) {
            GameState.addLog('无法进攻：目标不是敌方节点。', 'system');
            return;
        }
        if (!MapData.areAdjacent(attacker.id, defender.id)) {
            GameState.addLog('无法进攻：目标不相邻。', 'system');
            return;
        }
        if (attacker.troops < 2 || GameState.getNodeMovableTroops(attacker) < 1) {
            GameState.addLog('该节点没有可用于进攻的未移动士兵。', 'system');
            return;
        }
        if (relation && relation.relation === '停战') {
            GameState.addLog('无法进攻：当前外交协议处于停战。', 'system');
            return;
        }

        if (!this.ensureMovementOrdersForAttack()) return;
        this.openBattlePreview(attackerId, defenderId);
    },

    confirmAction() {
        const confirm = GameState.game.actionConfirm;
        if (!confirm) return;

        if (confirm.action === 'move') {
            const source = MapData.getNode(confirm.nodeId);
            const movingTroops = this.getSelectedMoveAmount(source);
            GameState.game.selectedNodeId = confirm.nodeId;
            GameState.game.actionConfirm = null;
            this.performMove(confirm.targetId, movingTroops);
            return;
        }

        const availability = this.getActionAvailability(confirm.action, confirm.nodeId);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }

        const node = MapData.getNode(confirm.nodeId);
        const meta = availability.meta;

        GameState.game.playerResources.money -= meta.costMoney;
        GameState.game.playerResources.pp -= meta.ppCost;
        GameState.game.actionCountThisTurn += 1;
        GameState.game.actionConfirm = null;

        if (confirm.action === 'recruit') {
            const recruitAmount = Math.max(1, meta.recruitAmount);
            node.troops += recruitAmount;
            node.freshTroops = (node.freshTroops || 0) + recruitAmount;
            GameState.game.recruitDraftAmount = 1;
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${node.name} 完成征兵，驻军 +${recruitAmount}（消耗 $${meta.costMoney}）。`, 'system');
            return;
        }

        if (confirm.action === 'build') {
            const cap = GameState.getNodeIndustryCap(node.id);
            node.industry = Math.min(cap, node.industry + 1);
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${node.name} 建设工业成功，工业 +1（消耗 $${formatMoney(meta.costMoney)}，上限 ${cap}）。`, 'system');
        }
    },

    getMaxRecruitAmount(costPerSoldier) {
        const cost = costPerSoldier || Math.max(1, 2 + GameState.getEffectiveRecruitCostDelta());
        const moneyCap = Math.max(1, Math.floor(GameState.game.playerResources.money / cost));
        return Math.min(99, Math.max(1, moneyCap));
    },

    getSelectedRecruitAmount(costPerSoldier) {
        const max = this.getMaxRecruitAmount(costPerSoldier);
        const draft = Number(GameState.game.recruitDraftAmount) || 1;
        return Math.min(max, Math.max(1, Math.floor(draft)));
    },

    setRecruitDraftAmount(amount, shouldNotify = true) {
        const cost = Math.max(1, 2 + GameState.getEffectiveRecruitCostDelta());
        const max = this.getMaxRecruitAmount(cost);
        GameState.game.recruitDraftAmount = Math.min(max, Math.max(1, Math.floor(Number(amount) || 1)));
        if (shouldNotify) {
            GameState.notify();
        } else {
            this.syncRecruitSliderDisplay();
        }
    },

    adjustRecruitDraftAmount(delta) {
        this.setRecruitDraftAmount(this.getSelectedRecruitAmount() + delta);
    },

    selectMaxRecruitAmount() {
        this.setRecruitDraftAmount(this.getMaxRecruitAmount());
    },

    getSelectedMoveAmount(source = MapData.getNode(GameState.game.selectedNodeId)) {
        const maxAmount = GameState.getNodeMovableTroops(source);
        if (maxAmount <= 0) return 0;

        const draft = Number(GameState.game.moveDraftAmount) || maxAmount;
        return Math.min(maxAmount, Math.max(1, Math.floor(draft)));
    },

    setMoveDraftAmount(amount, shouldNotify = true) {
        const confirm = GameState.game.actionConfirm;
        const source = MapData.getNode(confirm && confirm.action === 'move' ? confirm.nodeId : GameState.game.selectedNodeId);
        const maxAmount = GameState.getNodeMovableTroops(source);
        GameState.game.moveDraftAmount = maxAmount > 0
            ? Math.min(maxAmount, Math.max(1, Math.floor(Number(amount) || 1)))
            : 1;
        if (shouldNotify) {
            GameState.notify();
        } else {
            this.syncMoveSliderDisplay();
        }
    },

    adjustMoveDraftAmount(delta) {
        this.setMoveDraftAmount(this.getSelectedMoveAmount() + delta);
    },

    selectMaxMoveAmount() {
        const confirm = GameState.game.actionConfirm;
        const source = MapData.getNode(confirm && confirm.action === 'move' ? confirm.nodeId : GameState.game.selectedNodeId);
        this.setMoveDraftAmount(GameState.getNodeMovableTroops(source));
    },

    getSelectedBattleAmount(attacker = null) {
        const preview = GameState.game.battlePreview;
        const source = attacker || MapData.getNode(preview ? preview.attackerId : GameState.game.selectedNodeId);
        const maxAmount = GameState.getNodeMovableTroops(source);
        if (maxAmount <= 0) return 0;

        const draft = Number(GameState.game.battleDraftAmount) || maxAmount;
        return Math.min(maxAmount, Math.max(1, Math.floor(draft)));
    },

    setBattleDraftAmount(amount, shouldNotify = true) {
        const preview = GameState.game.battlePreview;
        const attacker = MapData.getNode(preview ? preview.attackerId : GameState.game.selectedNodeId);
        const maxAmount = GameState.getNodeMovableTroops(attacker);
        GameState.game.battleDraftAmount = maxAmount > 0
            ? Math.min(maxAmount, Math.max(1, Math.floor(Number(amount) || 1)))
            : 1;

        if (preview) {
            GameState.game.battlePreview = this.createBattlePreview(preview.attackerId, preview.defenderId, GameState.game.battleDraftAmount);
        }

        if (shouldNotify) {
            GameState.notify();
        } else {
            this.syncBattlePreviewDisplay();
        }
    },

    adjustBattleDraftAmount(delta) {
        this.setBattleDraftAmount(this.getSelectedBattleAmount() + delta);
    },

    selectMaxBattleAmount() {
        const preview = GameState.game.battlePreview;
        const attacker = MapData.getNode(preview ? preview.attackerId : GameState.game.selectedNodeId);
        this.setBattleDraftAmount(GameState.getNodeMovableTroops(attacker));
    },

    syncRecruitSliderDisplay() {
        const confirm = GameState.game.actionConfirm;
        if (!confirm || confirm.action !== 'recruit') return;

        const meta = this.getActionCost('recruit', confirm.nodeId);
        const max = this.getMaxRecruitAmount(meta.costPerSoldier);
        const draft = this.getSelectedRecruitAmount(meta.costPerSoldier);
        document.querySelectorAll('.recruit-range, .recruit-amount-input').forEach(input => {
            input.value = draft;
            input.max = max;
        });
        document.querySelectorAll('[data-recruit-count]').forEach(element => {
            element.textContent = `${draft} / ${max} 人`;
        });
        document.querySelectorAll('[data-recruit-cost]').forEach(element => {
            element.textContent = `每人 $${formatMoney(meta.costPerSoldier)}，本次共需 $${formatMoney(meta.costMoney)}（PP 不随数量变化）`;
        });
        document.querySelectorAll('[data-recruit-next-money]').forEach(element => {
            element.textContent = this.getRecruitMoneyPreviewText(meta);
        });
        document.querySelectorAll('[data-recruit-effect]').forEach(element => {
            element.textContent = `驻军 +${meta.recruitAmount}`;
        });
        document.querySelectorAll('[data-action-cost]').forEach(element => {
            element.textContent = meta.costText;
        });
    },

    syncMoveSliderDisplay() {
        const confirm = GameState.game.actionConfirm;
        const isMoveConfirm = confirm && confirm.action === 'move';
        const source = MapData.getNode(isMoveConfirm ? confirm.nodeId : GameState.game.selectedNodeId);
        const target = isMoveConfirm ? MapData.getNode(confirm.targetId) : null;
        const max = GameState.getNodeMovableTroops(source);
        const amount = this.getSelectedMoveAmount(source);
        document.querySelectorAll('.move-range, .move-amount-input').forEach(input => {
            input.value = amount;
            input.max = max;
        });
        document.querySelectorAll('[data-move-count]').forEach(element => {
            element.textContent = `${amount} / ${max} 支`;
        });
        document.querySelectorAll('[data-move-summary]').forEach(element => {
            element.textContent = `${source ? source.name : ''} → ${target ? target.name : ''}，调动 ${amount} 支部队`;
        });
        document.querySelectorAll('[data-move-target-amount]').forEach(element => {
            element.textContent = `调动 ${amount}`;
        });
    },

    getBattleSummaryText(preview) {
        if (!preview) return '';
        const outcome = preview.attackerWins
            ? `预计攻下目标，${preview.remainingTroops} 支参战部队进入`
            : `预计进攻失败，${preview.remainingTroops} 支参战部队撤回`;
        return `本次使用 ${preview.attackerBase}/${preview.maxAttackers} 支可动兵进攻，消耗这些部队的本回合移动次数；${outcome}。`;
    },

    syncBattlePreviewDisplay() {
        const preview = GameState.game.battlePreview;
        if (!preview || typeof document === 'undefined') return;

        const max = Math.max(1, preview.maxAttackers || 1);
        const amount = Math.min(max, Math.max(1, preview.attackerBase || 1));
        document.querySelectorAll('.battle-range, .battle-amount-input').forEach(input => {
            input.value = amount;
            input.max = max;
        });
        document.querySelectorAll('[data-battle-count]').forEach(element => {
            element.textContent = `${amount} / ${max} 支`;
        });
        document.querySelectorAll('[data-battle-attacker-base]').forEach(element => {
            element.textContent = amount;
        });
        document.querySelectorAll('[data-battle-attacker-power]').forEach(element => {
            element.textContent = preview.attackerPower;
        });
        document.querySelectorAll('[data-battle-defender-power]').forEach(element => {
            element.textContent = preview.defenderPower;
        });
        document.querySelectorAll('[data-battle-result-text]').forEach(element => {
            element.textContent = preview.resultText;
        });
        document.querySelectorAll('[data-battle-summary]').forEach(element => {
            element.textContent = this.getBattleSummaryText(preview);
        });

        const resultBlock = document.querySelector('[data-battle-result]');
        if (resultBlock) {
            resultBlock.classList.toggle('success', preview.attackerWins);
            resultBlock.classList.toggle('danger', !preview.attackerWins);
        }
    },

    openMoveConfirm(targetId) {
        const source = MapData.getNode(GameState.game.selectedNodeId);
        const target = MapData.getNode(targetId);
        const playerFactionId = GameState.getPlayerFactionId();

        if (!GameState.game.movementOrdersActive || GameState.game.currentAction !== 'move') {
            GameState.addLog('请先激活“移动士兵”行动。', 'system');
            return;
        }

        if (!source || !target || source.factionId !== playerFactionId || target.factionId !== playerFactionId || !MapData.areAdjacent(source.id, target.id)) {
            GameState.addLog('移动条件不满足。', 'system');
            return;
        }

        const maxAmount = GameState.getNodeMovableTroops(source);
        if (maxAmount < 1) {
            GameState.addLog('该节点没有可移动士兵。', 'system');
            return;
        }

        GameState.game.moveDraftAmount = Math.min(maxAmount, Math.max(1, Number(GameState.game.moveDraftAmount) || maxAmount));
        GameState.game.actionConfirm = { action: 'move', nodeId: source.id, targetId: target.id };
        GameState.game.battlePreview = null;
        GameState.notify();
    },

    performMove(targetId, amount = null) {
        const source = MapData.getNode(GameState.game.selectedNodeId);
        const target = MapData.getNode(targetId);

        if (!GameState.game.movementOrdersActive) {
            GameState.addLog('请先执行“移动士兵”行动来发布本回合移动令。', 'system');
            return;
        }

        if (!source || !target || !MapData.areAdjacent(source.id, target.id) || target.factionId !== source.factionId) {
            GameState.addLog('移动条件不满足。', 'system');
            return;
        }

        const maxAmount = GameState.getNodeMovableTroops(source);
        const movingTroops = Math.min(maxAmount, Math.max(1, Math.floor(Number(amount) || this.getSelectedMoveAmount(source))));
        if (movingTroops < 1) {
            GameState.addLog('该节点没有可移动士兵。', 'system');
            return;
        }

        const sourceReadyBeforeMove = GameState.getNodeMoveReady(source);
        source.troops -= movingTroops;
        source.moveReady = Math.max(0, sourceReadyBeforeMove - movingTroops);
        target.troops += movingTroops;
        source.movedThisTurn = GameState.getNodeMovableTroops(source) <= 0;

        GameState.game.moveDraftAmount = Math.max(1, Math.min(GameState.getNodeMovableTroops(source), GameState.game.moveDraftAmount || 1));
        GameState.game.selectedNodeId = GameState.getNodeMovableTroops(source) > 0 ? source.id : target.id;
        GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${source.name} 向 ${target.name} 调动 ${movingTroops} 支部队。`, 'system');
    },

    handleNodeClick(nodeId) {
        const node = MapData.getNode(nodeId);
        const selectedNode = MapData.getNode(GameState.game.selectedNodeId);
        const playerFactionId = GameState.getPlayerFactionId();
        if (!node) return;

        const isAdjacentEnemy = selectedNode &&
            selectedNode.id !== node.id &&
            selectedNode.factionId === playerFactionId &&
            node.factionId !== playerFactionId &&
            MapData.areAdjacent(selectedNode.id, node.id);

        if (GameState.game.currentAction === 'move' && selectedNode && selectedNode.factionId === playerFactionId) {
            if (MapData.areAdjacent(selectedNode.id, node.id) && node.factionId === playerFactionId) {
                this.openMoveConfirm(node.id);
                return;
            }

            if (isAdjacentEnemy) {
                if (GameState.getNodeMovableTroops(selectedNode) < 1) {
                    GameState.addLog('该节点没有可用于进攻的未移动士兵。', 'system');
                    return;
                }
                this.openBattleWithMoveOrder(selectedNode.id, node.id);
                return;
            }
        }

        if (isAdjacentEnemy) {
            this.openBattleWithMoveOrder(selectedNode.id, node.id);
            return;
        }

        if (this.isMobileLayout()) this.mobilePanel = 'actions';
        GameState.setSelectedNode(nodeId);
    },

    hoverNode(nodeId) {
        if (GameState.game.hoveredNodeId === nodeId) return;

        GameState.game.hoveredNodeId = nodeId;
        this.updateMapTooltip();
    },

    updateMapTooltip() {
        document.querySelectorAll('.map-tooltip').forEach(tooltip => tooltip.remove());

        if (!GameState.game.hoveredNodeId) return;

        const mapContainer = document.querySelector('.game-map-container');
        if (!mapContainer || !MapData.getNode(GameState.game.hoveredNodeId)) return;

        mapContainer.insertAdjacentHTML('beforeend', MapView.renderTooltip());
    },

    createBattlePreview(attackerId, defenderId, requestedAmount = null) {
        const attacker = MapData.getNode(attackerId);
        const defender = MapData.getNode(defenderId);
        if (!attacker || !defender) return null;

        const baseDefenseBonus = 15;
        const taggedDefenseBonus = Math.round((GameState.getTaggedDefenseBonus(defender) || 0) * 100);
        const globalDefenseBonus = Math.round((GameState.getEffectiveGlobalDefense() || 0) * 100);
        const isPlayerDefender = defender.factionId === GameState.getPlayerFactionId();
        const defenseBonus = baseDefenseBonus + (isPlayerDefender ? taggedDefenseBonus + globalDefenseBonus : 0);
        const attackerAttackBonus = Math.round((GameState.getEffectiveGlobalAttack() || 0) * 100);
        const maxAttackers = GameState.getNodeMovableTroops(attacker);
        const draftAmount = requestedAmount === null || typeof requestedAmount === 'undefined'
            ? (Number(GameState.game.battleDraftAmount) || maxAttackers)
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
            attackerId,
            defenderId,
            attackerTotalTroops: attacker.troops,
            maxAttackers,
            attackerBase,
            defenderBase,
            attackerPower,
            defenderPower,
            defenseBonus,
            attackerAttackBonus,
            attackerWins,
            remainingTroops,
            ppCost: 0,
            resultText: attackerWins
                ? `预计结果：攻方胜利，预计 ${remainingTroops} 支参战部队进入目标。`
                : `预计结果：守方优势，参战部队预计撤回 ${remainingTroops} 支。`
        };
    },

    getBattleAvailability(attackerId) {
        const attacker = MapData.getNode(attackerId);
        const moveMeta = this.getActionMeta('move');
        const meta = { ...moveMeta, cost: '移动令内', costText: '移动令内', ppCost: 0, costMoney: 0 };
        const playerFactionId = GameState.getPlayerFactionId();

        if (!attacker) return { enabled: false, reason: '未选择进攻节点', ...meta };
        if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', ...meta };
        if (GameState.game.currentPlayerId !== playerFactionId) return { enabled: false, reason: '还未轮到你行动', ...meta };
        if (attacker.factionId !== playerFactionId) return { enabled: false, reason: '你未选中己方可用节点', ...meta };
        if (!GameState.game.movementOrdersActive) return { enabled: false, reason: '请先使用“移动士兵”发布移动令，进攻会作为普通移动执行，不再额外花费 PP。', ...meta };
        if (GameState.game.currentAction !== 'move') return { enabled: false, reason: '请点击“继续移动”后再选择进攻目标。', ...meta };
        if (attacker.troops < 2) return { enabled: false, reason: '至少需要 2 支部队才能进攻', ...meta };
        if (GameState.getNodeMovableTroops(attacker) < 1) return { enabled: false, reason: '该节点没有可用于进攻的未移动士兵', ...meta };

        return { enabled: true, reason: '', ...meta };
    },

    openBattlePreview(attackerId, defenderId) {
        const attacker = MapData.getNode(attackerId);
        const defender = MapData.getNode(defenderId);
        const playerFactionId = GameState.getPlayerFactionId();
        const relation = defender ? GameState.game.diplomacy[defender.factionId] : null;
        const availability = this.getBattleAvailability(attackerId);

        if (!attacker || !defender) return;
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }
        if (attacker.factionId !== playerFactionId) {
            GameState.addLog('你未选中己方可用节点。', 'system');
            return;
        }
        if (defender.factionId === playerFactionId) {
            GameState.addLog('无法进攻：目标不是敌方节点。', 'system');
            return;
        }
        if (!MapData.areAdjacent(attacker.id, defender.id)) {
            GameState.addLog('无法进攻：目标不相邻。', 'system');
            return;
        }
        if (attacker.troops < 2) {
            GameState.addLog('无法进攻：至少需要 2 支部队。', 'system');
            return;
        }
        if (relation && relation.relation === '停战') {
            GameState.addLog('无法进攻：当前外交协议处于停战。', 'system');
            return;
        }

        const maxAttackers = GameState.getNodeMovableTroops(attacker);
        GameState.game.battleDraftAmount = maxAttackers;
        GameState.setBattlePreview(this.createBattlePreview(attacker.id, defender.id, GameState.game.battleDraftAmount));
    },

    confirmBattle() {
        const preview = GameState.game.battlePreview;
        if (!preview) return;

        const attacker = MapData.getNode(preview.attackerId);
        const defender = MapData.getNode(preview.defenderId);
        if (!attacker || !defender) return;

        if (!GameState.game.movementOrdersActive || GameState.game.currentAction !== 'move') {
            GameState.addLog('请先使用“移动士兵”发布移动令后再进攻。', 'system');
            GameState.game.battlePreview = null;
            GameState.notify();
            return;
        }

        const participatingTroops = this.getSelectedBattleAmount(attacker);
        if (participatingTroops < 1) {
            GameState.addLog('无法进攻：该节点没有可参与进攻的未移动士兵。', 'system');
            GameState.game.battlePreview = null;
            GameState.notify();
            return;
        }

        const attackerFaction = GameState.getFaction(attacker.factionId);
        const defenderFaction = GameState.getFaction(defender.factionId);
        const resolvedPreview = this.createBattlePreview(attacker.id, defender.id, participatingTroops);
        GameState.game.battlePreview = null;
        GameState.game.currentAction = 'move';
        GameState.game.actionConfirm = null;
        const attackerReadyBeforeBattle = GameState.getNodeMoveReady(attacker);
        attacker.moveReady = Math.max(0, attackerReadyBeforeBattle - participatingTroops);
        attacker.movedThisTurn = true;

        if (resolvedPreview.attackerWins) {
            const enteringTroops = Math.max(1, Math.min(participatingTroops, resolvedPreview.remainingTroops));
            attacker.troops = Math.max(1, attacker.troops - participatingTroops);
            const wasEnemyOwned = defender.factionId !== attacker.factionId;
            defender.factionId = attacker.factionId;
            defender.troops = enteringTroops;
            defender.moveReady = 0;
            defender.freshTroops = 0;
            if (wasEnemyOwned) this.applyCaptureBonuses(defender);
            GameState.game.selectedNodeId = defender.id;
            GameState.refreshFactionStatus(true);
            GameState.checkVictory(true);
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${attackerFaction.shortName} 从 ${attacker.name} 以 ${participatingTroops} 支可动部队进攻 ${defender.name}，攻方胜利。`, 'battle');
            return;
        }

        const returningTroops = Math.max(0, Math.min(participatingTroops, resolvedPreview.remainingTroops));
        const attackerLosses = participatingTroops - returningTroops;
        attacker.troops = Math.max(1, attacker.troops - attackerLosses);
        defender.troops = Math.max(1, Math.ceil(defender.troops * 0.7));
        GameState.refreshFactionStatus(true);
        GameState.checkVictory(true);
        GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${attackerFaction.shortName} 以 ${participatingTroops} 支可动部队进攻 ${defenderFaction.shortName} 控制的 ${defender.name} 失败。`, 'battle');
    },

    settleTurnStart(factionId) {
        GameState.recalculatePlayerResources();
        const resources = GameState.game.playerResources;
        const preview = GameState.getNextTurnResourcePreview(factionId);
        const income = preview.grossIncome;
        const availableMoney = resources.money + income;
        const maintenanceRate = preview.maintenanceRate;
        const freeTroops = preview.freeTroops;
        const ppIncome = preview.ppIncome;
        const capitalRegen = GameState.getCapitalTroopsPerTurn();
        if (capitalRegen > 0) {
            const capitalNode = MapData.getNode(GameState.getCapitalNodeId(factionId));
            if (capitalNode && capitalNode.factionId === factionId) {
                capitalNode.troops += capitalRegen;
            }
        }

        GameState.recalculatePlayerResources();
        const finalBillableTroops = Math.max(0, GameState.game.playerResources.totalTroops - freeTroops);
        const finalMaintenance = finalBillableTroops * maintenanceRate;
        resources.money = availableMoney - finalMaintenance;
        resources.pp = Math.min(GameState.getEffectivePPCap(), resources.pp + ppIncome);

        const debtPenalty = GameState.getDebtPenalty(resources.money);
        let debtDeserted = 0;
        if (debtPenalty.desertionRate > 0 && GameState.game.playerResources.totalTroops > 0) {
            const targetDesertion = Math.max(
                debtPenalty.minDesertion || 0,
                Math.ceil(GameState.game.playerResources.totalTroops * debtPenalty.desertionRate)
            );
            debtDeserted = this.disbandTroopsForMaintenance(factionId, targetDesertion);
            if (debtDeserted > 0) GameState.recalculatePlayerResources();
        }

        if (GameState.game.warBondsPenaltyTurns > 0) {
            GameState.game.warBondsPenaltyTurns -= 1;
            if (GameState.game.warBondsPenaltyTurns <= 0) {
                GameState.game.warBondsPenalty = 0;
            }
        }

        return {
            income,
            maintenance: finalMaintenance,
            disbanded: debtDeserted,
            debtDeserted,
            debtPenalty,
            moneyDelta: income - finalMaintenance,
            balance: resources.money,
            ppIncome,
            taggedIncome: preview.taggedIncome,
            freeTroops
        };
    },

    disbandTroopsForMaintenance(factionId, targetCount) {
        const currentCapitalId = GameState.getCapitalNodeId(factionId);
        let remaining = targetCount;
        let disbanded = 0;
        const candidates = MapData.getFactionNodes(factionId)
            .filter(node => node.troops > 0)
            .sort((a, b) => {
                const aFrontline = MapData.getNeighbors(a.id).some(node => node.factionId !== factionId) ? 1 : 0;
                const bFrontline = MapData.getNeighbors(b.id).some(node => node.factionId !== factionId) ? 1 : 0;
                const aCapital = a.id === currentCapitalId ? 1 : 0;
                const bCapital = b.id === currentCapitalId ? 1 : 0;

                return aCapital - bCapital ||
                    aFrontline - bFrontline ||
                    a.industry - b.industry ||
                    a.troops - b.troops;
            });

        candidates.forEach(node => {
            if (remaining <= 0) return;
            const removed = Math.min(node.troops, remaining);
            node.troops -= removed;
            remaining -= removed;
            disbanded += removed;
        });

        return disbanded;
    },

    endTurn(auto = false) {
        if (GameState.game.gameOver) return;

        const turnLimit = Number(GameState.lobby.settings.turnLimit) || 180;
        const turnOrder = (GameState.game.turnOrder && GameState.game.turnOrder.length)
            ? GameState.game.turnOrder
            : GameState.factions.map(f => f.id);
        const currentId = GameState.game.currentPlayerId;
        const idx = turnOrder.indexOf(currentId);
        const isLastInRound = idx === turnOrder.length - 1;
        const nextId = turnOrder[(idx + 1) % turnOrder.length];

        // 把刚结束行动的玩家做一些 per-turn 收尾（重置可移动状态等只在新一轮开始做）
        GameState.game.actionCountThisTurn = 0;
        GameState.game.currentAction = null;
        GameState.game.movementOrdersActive = false;
        GameState.game.moveDraftAmount = 1;
        GameState.game.battleDraftAmount = 1;
        GameState.game.recruitDraftAmount = 1;
        GameState.game.battlePreview = null;
        GameState.game.actionConfirm = null;
        GameState.game.timerRemaining = turnLimit;

        const playerFactionId = GameState.getPlayerFactionId();

        if (isLastInRound) {
            // 一轮全部行动完了：回合数 +1、所有人结算 settleTurnStart
            GameState.game.currentTurn += 1;
            // 玩家结算
            const settlement = this.settleTurnStart(playerFactionId);
            // AI 结算（只动 aiResources）
            this.settleAiTurnStart(turnOrder, playerFactionId);
            GameState.resetMovementReadiness();

            const prefix = auto ? '计时结束' : '结束回合';
            const debtText = settlement.debtPenalty.threshold > 0 ? `，赤字状态：${settlement.debtPenalty.label}` : '';
            const desertionText = settlement.debtDeserted > 0 ? `，财政崩溃逃散 ${settlement.debtDeserted} 步兵` : '';
            GameState.addLog(`${prefix}：收入 $${formatMoney(settlement.income)}，维护 $${formatMoney(settlement.maintenance)}，金钱 ${formatSignedMoney(settlement.moneyDelta)}，余额 $${formatMoney(settlement.balance)}，获得 ${settlement.ppIncome} PP${debtText}${desertionText}，第 ${GameState.game.currentTurn} 回合开始。`, 'system', false);
        } else {
            GameState.addLog(`${GameState.getFactionName(currentId)} 结束行动，下一手：${GameState.getFactionName(nextId)}。`, 'system', false);
        }

        GameState.game.currentPlayerId = nextId;
        GameState.refreshFactionStatus(false);
        GameState.checkVictory(true);
        GameState.notify();
    },

    settleAiTurnStart(turnOrder, playerFactionId) {
        if (!GameState.game.aiResources) GameState.game.aiResources = {};
        turnOrder.forEach(factionId => {
            if (factionId === playerFactionId) return;
            const slot = GameState.getSlot(factionId);
            if (!slot || slot.kind !== 'ai') return;
            const totals = MapData.calculateFactionStats(factionId);
            if (!GameState.game.aiResources[factionId]) {
                const f = GameState.getFaction(factionId);
                GameState.game.aiResources[factionId] = { money: f.startingStats.money, pp: f.startingStats.pp };
            }
            const r = GameState.game.aiResources[factionId];
            const baseIncome = totals.totalIndustry + 1;
            const maintenance = Math.max(0, totals.totalTroops * GameState.baseMaintenanceRate);
            r.money = r.money + baseIncome - maintenance;
            const debtPenalty = GameState.getDebtPenalty(r.money);
            r.pp = Math.min(GameState.ppCap, Math.max(0, r.pp + GameState.basePPIncome + debtPenalty.ppIncomeDelta));
        });
    },

    getFocusAdvanceAvailability(focusId = GameState.game.selectedFocusId) {
        const focus = GameState.getFocusById(focusId);
        const actionMeta = this.getActionCost('focus');
        const completed = GameState.game.completedFocuses;
        const playerFactionId = GameState.getPlayerFactionId();
        const resources = GameState.game.playerResources;

        if (!focus) return { enabled: false, reason: '未选择国策', ...actionMeta };
        if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', ...actionMeta };
        if (GameState.game.currentPlayerId !== playerFactionId) return { enabled: false, reason: '还未轮到你行动', ...actionMeta };
        if (completed.includes(focus.id)) return { enabled: false, reason: '国策已完成', ...actionMeta };
        if (GameState.isFocusBlockedByMutual(focus, completed)) return { enabled: false, reason: '互斥国策已完成', ...actionMeta };
        if (!GameState.areFocusPrerequisitesMet(focus, completed)) return { enabled: false, reason: '前置国策未满足', ...actionMeta };
        if (resources.pp < actionMeta.ppCost) return { enabled: false, reason: `缺少 ${actionMeta.ppCost - resources.pp} PP`, ...actionMeta };

        return { enabled: true, reason: '', focus, ...actionMeta };
    },

    selectFocus(focusId) {
        if (Date.now() - this.lastFocusDragEndedAt < 180) return;

        this.captureFocusTreeScroll();
        GameState.setSelectedFocus(focusId);
    },

    advanceFocus(focusId = GameState.game.selectedFocusId) {
        const availability = this.getFocusAdvanceAvailability(focusId);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }

        const policy = availability.focus;
        const completed = GameState.game.completedFocuses;
        const playerFaction = GameState.getFaction(GameState.getPlayerFactionId());
        const capital = MapData.getNode(GameState.getCapitalNodeId(playerFaction.id));
        const required = GameState.getFocusRequiredProgress(policy);
        const previousProgress = GameState.getFocusProgress(policy.id);
        const nextProgress = Math.min(required, previousProgress + 1);
        const isComplete = nextProgress >= required;

        this.captureFocusTreeScroll();
        GameState.game.selectedFocusId = policy.id;
        GameState.game.focusProgress[policy.id] = nextProgress;
        GameState.game.playerResources.pp -= availability.ppCost;
        GameState.game.actionCountThisTurn += 1;

        if (isComplete) {
            completed.push(policy.id);
            (policy.effects || []).forEach(effect => this.applyFocusEffect(effect, playerFaction.id, capital));
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${playerFaction.shortName} 完成国策“${policy.name}”。`, 'system', false);
        } else {
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：推进国策“${policy.name}” ${nextProgress}/${required}。`, 'system', false);
        }

        GameState.notify();
    },

    executeFocus(policyId) {
        this.advanceFocus(policyId);
    },

    applyCaptureBonuses(defender) {
        const playerFactionId = GameState.getPlayerFactionId();
        if (!defender || defender.factionId !== playerFactionId) return;
        const captureMoney = GameState.getEffectiveCaptureMoney();
        const captureTroops = GameState.getEffectiveCaptureTroops();
        if (captureMoney > 0) {
            GameState.game.playerResources.money += captureMoney;
            GameState.addLog(`占领 ${defender.name}：缴获物资 +${captureMoney} 金钱。`, 'battle', false);
        }
        if (captureTroops > 0) {
            defender.troops += captureTroops;
            GameState.addLog(`占领 ${defender.name}：当地武装归附，驻军 +${captureTroops}。`, 'battle', false);
        }
    },

    applyFocusEffect(effect, factionId, capital) {
        if (effect.type === 'money') {
            GameState.game.playerResources.money += effect.amount;
            return;
        }

        if (effect.type === 'pp') {
            GameState.game.playerResources.pp = Math.min(GameState.getEffectivePPCap(), GameState.game.playerResources.pp + effect.amount);
            return;
        }

        if (effect.type === 'actionCost') {
            const modifiers = GameState.getGameModifiers();
            if (effect.action === 'all') {
                ['recruit', 'move', 'build', 'focus'].forEach(action => {
                    modifiers.actionBaseCost[action] = (modifiers.actionBaseCost[action] || 0) + effect.amount;
                });
            } else {
                modifiers.actionBaseCost[effect.action] = (modifiers.actionBaseCost[effect.action] || 0) + effect.amount;
            }
            return;
        }

        if (effect.type === 'recruitAmount') {
            GameState.getGameModifiers().recruitAmount += effect.amount;
            return;
        }

        if (effect.type === 'maintenanceRate') {
            GameState.getGameModifiers().maintenanceRateDelta += effect.amount;
            return;
        }

        if (effect.type === 'ppIncome') {
            GameState.getGameModifiers().ppIncome += effect.amount;
            return;
        }

        if (effect.type === 'moneyIncome') {
            GameState.getGameModifiers().moneyIncome += effect.amount;
            return;
        }

        if (effect.type === 'capitalTroops' && capital) {
            capital.troops += effect.amount;
            return;
        }

        if (effect.type === 'capitalIndustry' && capital) {
            const cap = GameState.getNodeIndustryCap(capital.id);
            capital.industry = Math.min(cap, capital.industry + effect.amount);
            return;
        }

        if (effect.type === 'allTroops') {
            MapData.getFactionNodes(factionId).forEach(node => {
                node.troops += effect.amount;
            });
            return;
        }

        if (effect.type === 'allIndustry') {
            const maxNodes = effect.maxNodes || Infinity;
            MapData.getFactionNodes(factionId)
                .filter(node => node.industry < GameState.getNodeIndustryCap(node.id))
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, maxNodes)
                .forEach(node => {
                    node.industry = Math.min(GameState.getNodeIndustryCap(node.id), node.industry + effect.amount);
                });
            return;
        }

        if (effect.type === 'nodeIndustry') {
            const node = MapData.getNode(effect.nodeId);
            if (node && node.factionId === factionId) {
                node.industry = Math.min(GameState.getNodeIndustryCap(node.id), node.industry + effect.amount);
            } else if (capital) {
                capital.industry = Math.min(GameState.getNodeIndustryCap(capital.id), capital.industry + effect.amount);
            }
            return;
        }

        if (effect.type === 'taggedTroops') {
            MapData.getFactionNodes(factionId)
                .filter(node => node.tags.includes(effect.tag))
                .forEach(node => {
                    node.troops += effect.amount;
                });
            return;
        }

        if (effect.type === 'ppCapBonus') {
            GameState.getGameModifiers().ppCapBonus += effect.amount;
            return;
        }

        if (effect.type === 'recruitCost') {
            GameState.getGameModifiers().recruitCostDelta += effect.amount;
            return;
        }

        if (effect.type === 'freeTroops') {
            GameState.getGameModifiers().freeTroops += effect.amount;
            return;
        }

        if (effect.type === 'globalAttack') {
            GameState.getGameModifiers().globalAttack += effect.amount;
            return;
        }

        if (effect.type === 'globalDefense') {
            GameState.getGameModifiers().globalDefense += effect.amount;
            return;
        }

        if (effect.type === 'taggedDefense') {
            const map = GameState.getGameModifiers().taggedDefense;
            map[effect.tag] = (map[effect.tag] || 0) + effect.amount;
            return;
        }

        if (effect.type === 'taggedIncome') {
            const map = GameState.getGameModifiers().taggedIncome;
            map[effect.tag] = (map[effect.tag] || 0) + effect.amount;
            return;
        }

        if (effect.type === 'captureMoney') {
            GameState.getGameModifiers().captureMoneyOnWin += effect.amount;
            return;
        }

        if (effect.type === 'captureTroops') {
            GameState.getGameModifiers().captureTroopsOnWin += effect.amount;
            return;
        }

        if (effect.type === 'crisisPP') {
            GameState.getGameModifiers().crisisPP += effect.amount;
            return;
        }

        if (effect.type === 'industryCapBonus') {
            const targetCount = effect.maxNodes || 1;
            const sorted = MapData.getFactionNodes(factionId)
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, targetCount);
            sorted.forEach(node => {
                const newCap = GameState.getNodeIndustryCap(node.id) + effect.amount;
                GameState.setNodeIndustryCap(node.id, newCap);
            });
            GameState.getGameModifiers().industryCapBoosts += effect.amount * targetCount;
            return;
        }

        if (effect.type === 'taggedNodeMoney') {
            const count = GameState.getTaggedNodeCount(effect.tag, factionId);
            const total = count * effect.amount;
            GameState.game.playerResources.money += total;
            return;
        }

        if (effect.type === 'damageEnemyIndustry') {
            const amount = effect.amount || 1;
            const targetCount = effect.maxNodes || 3;
            const enemies = MapData.nodes
                .filter(node => node.factionId && node.factionId !== factionId && node.industry > 0)
                .sort((a, b) => b.industry - a.industry)
                .slice(0, targetCount);
            enemies.forEach(node => {
                node.industry = Math.max(0, node.industry - amount);
            });
            if (enemies.length > 0) {
                GameState.addLog(`异变效应：${enemies.length} 个敌方节点工业 -${amount}。`, 'system', false);
            }
            return;
        }

        if (effect.type === 'warBonds') {
            GameState.game.playerResources.money += effect.amount || 0;
            GameState.game.warBondsPenalty = -(effect.penalty || 0);
            GameState.game.warBondsPenaltyTurns = effect.turns || 0;
            return;
        }

        if (effect.type === 'allCapitalsTroops') {
            MapData.nodes
                .filter(node => node.factionId === factionId && (node.isCapital || node.tags.includes('首都')))
                .forEach(node => { node.troops += effect.amount; });
            return;
        }

        if (effect.type === 'badge') {
            const badges = GameState.getGameModifiers().badges;
            if (!badges.includes(effect.label)) badges.push(effect.label);
            return;
        }

        if (effect.type === 'ideology') {
            const newId = effect.id;
            const next = GameState.ideologies[newId];
            if (!next) return;
            const playerFactionId = GameState.getPlayerFactionId();
            // 只对玩家自己持续生效；其他 AI 势力暂时只显示 baseline
            if (factionId !== playerFactionId) return;
            const previousId = GameState.game.currentIdeology;
            if (previousId === newId) return;
            GameState.setCurrentIdeology(newId);
            GameState.addLog(`你的国策意识形态已转为「${next.name}」。`, 'system', false);
            return;
        }
    },

    setDiplomacy(factionId, relation) {
        if (!GameState.game.diplomacy[factionId]) return;

        const faction = GameState.getFaction(factionId);
        GameState.game.diplomacy[factionId] = {
            relation,
            treaty: relation === '停战' ? '2 回合' : relation === '中立' ? '互不侵犯' : '无'
        };
        GameState.addLog(`外交广播：你对 ${faction.shortName} 的关系调整为“${relation}”。`, 'diplomacy');
    },

    openFocusModal() {
        if (!GameState.game.showFocusModal) {
            const tree = GameState.getFocusTree();
            const selectedFocus = GameState.getFocusById(GameState.game.selectedFocusId);
            if (!selectedFocus && tree.length) {
                GameState.game.selectedFocusId = tree[0].id;
            }
            GameState.game.focusTreeViewport = GameState.game.focusTreeViewport || { scale: 1 };
            this.focusTreeCentered = false;
            this.pendingFocusTreeScroll = null;
        }

        GameState.toggleFocusModal(true);
    },

    openDiplomacyModal() {
        GameState.toggleDiplomacyModal(true);
    },

    closeModals() {
        GameState.closeModals();
    },

    dismissEndGame() {
        GameState.game.showEndGameModal = false;
        GameState.notify();
    },

    closeModalOnBackdrop(event) {
        if (event.target.classList.contains('modal-backdrop')) {
            this.closeModals();
        }
    },

    setLogTab(tab) {
        GameState.setLogTab(tab);
    },

    handleGameChatKey(event) {
        if (event.key !== 'Enter') return;
        const message = String(event.currentTarget.value || '').trim();
        if (!message) return;

        GameState.addLog(`你：${message}`, 'chat');
        event.currentTarget.value = '';
    },

    setRankingMetric(metric) {
        this.rankingMetric = metric;
        GameState.notify();
    },

    toggleGridView() {
        GameState.toggleGridView();
    },

    getFocusTreeScale() {
        const viewport = GameState.game.focusTreeViewport || { scale: 1 };
        return this.clampFocusTreeScale(Number(viewport.scale) || 1);
    },

    clampFocusTreeScale(scale) {
        return Math.min(1.45, Math.max(0.1, Number(scale) || 1));
    },

    setFocusTreeScale(scale) {
        GameState.game.focusTreeViewport = GameState.game.focusTreeViewport || { scale: 1 };
        GameState.game.focusTreeViewport.scale = this.clampFocusTreeScale(scale);
        this.applyFocusTreeTransform();
    },

    applyFocusTreeTransform() {
        const stage = document.querySelector('.focus-tree-stage');
        const canvas = document.querySelector('.focus-tree-canvas');
        if (!stage || !canvas) return;

        const scale = this.getFocusTreeScale();
        const baseWidth = Number(canvas.dataset.baseWidth) || canvas.offsetWidth;
        const baseHeight = Number(canvas.dataset.baseHeight) || canvas.offsetHeight;
        stage.style.width = `${baseWidth * scale}px`;
        stage.style.height = `${baseHeight * scale}px`;
        canvas.style.transform = `scale(${scale})`;
        this.updateFocusZoomLabel(scale);
    },

    updateFocusZoomLabel(scale = this.getFocusTreeScale()) {
        const label = document.querySelector('[data-focus-zoom-label]');
        if (label) label.textContent = `${Math.round(scale * 100)}%`;
    },

    captureFocusTreeScroll() {
        const scroller = document.querySelector('.focus-tree-scroll');
        if (!scroller) return;
        this.pendingFocusTreeScroll = {
            left: scroller.scrollLeft,
            top: scroller.scrollTop
        };
    },

    alignFocusTree() {
        const scroller = document.querySelector('.focus-tree-scroll');
        if (!scroller) {
            this.focusTreeCentered = false;
            return;
        }

        this.applyFocusTreeTransform();

        if (this.pendingFocusTreeScroll) {
            scroller.scrollLeft = this.pendingFocusTreeScroll.left;
            scroller.scrollTop = this.pendingFocusTreeScroll.top;
            this.pendingFocusTreeScroll = null;
            return;
        }

        if (this.focusTreeCentered) return;

        const selectedFocusId = GameState.game.selectedFocusId;
        const selectedCard = selectedFocusId ? document.querySelector(`[data-focus-id="${selectedFocusId}"]`) : null;
        const rootCard = selectedCard || document.querySelector('[data-focus-id="usa_secure_command"], [data-focus-id="generic_mobilize"], .focus-card');
        if (!rootCard) return;

        const scale = this.getFocusTreeScale();
        scroller.scrollLeft = Math.max(0, rootCard.offsetLeft * scale - scroller.clientWidth / 2 + (rootCard.offsetWidth * scale) / 2);
        scroller.scrollTop = 0;
        this.focusTreeCentered = true;
    },

    attachFocusTreeInteraction() {
        const scroller = document.querySelector('.focus-tree-scroll');
        if (!scroller) return;

        this.applyFocusTreeTransform();

        scroller.addEventListener('wheel', event => {
            event.preventDefault();
            const oldScale = this.getFocusTreeScale();
            const factor = event.deltaY > 0 ? 0.9 : 1.1;
            const newScale = this.clampFocusTreeScale(oldScale * factor);
            if (Math.abs(newScale - oldScale) < 0.001) return;

            const rect = scroller.getBoundingClientRect();
            const pointerX = event.clientX - rect.left;
            const pointerY = event.clientY - rect.top;
            const contentX = (scroller.scrollLeft + pointerX) / oldScale;
            const contentY = (scroller.scrollTop + pointerY) / oldScale;

            this.setFocusTreeScale(newScale);
            scroller.scrollLeft = contentX * newScale - pointerX;
            scroller.scrollTop = contentY * newScale - pointerY;
        }, { passive: false });

        scroller.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            if (event.target.closest('button, .focus-detail-panel')) return;

            this.focusTreeDrag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                scrollLeft: scroller.scrollLeft,
                scrollTop: scroller.scrollTop,
                moved: false
            };
            scroller.classList.add('is-panning');
            scroller.setPointerCapture(event.pointerId);
        });

        scroller.addEventListener('pointermove', event => {
            if (!this.focusTreeDrag || this.focusTreeDrag.pointerId !== event.pointerId) return;

            const dx = event.clientX - this.focusTreeDrag.startX;
            const dy = event.clientY - this.focusTreeDrag.startY;
            if (Math.abs(dx) + Math.abs(dy) > 4) {
                this.focusTreeDrag.moved = true;
            }
            scroller.scrollLeft = this.focusTreeDrag.scrollLeft - dx;
            scroller.scrollTop = this.focusTreeDrag.scrollTop - dy;
            event.preventDefault();
        });

        const stopDrag = event => {
            if (!this.focusTreeDrag || this.focusTreeDrag.pointerId !== event.pointerId) return;
            if (this.focusTreeDrag.moved) {
                this.lastFocusDragEndedAt = Date.now();
            }
            this.focusTreeDrag = null;
            scroller.classList.remove('is-panning');
        };

        scroller.addEventListener('pointerup', stopDrag);
        scroller.addEventListener('pointercancel', stopDrag);
    },

    zoomFocusTree(direction) {
        const scroller = document.querySelector('.focus-tree-scroll');
        const oldScale = this.getFocusTreeScale();
        const newScale = direction > 0 ? oldScale * 1.12 : oldScale / 1.12;
        const centerX = scroller ? scroller.scrollLeft + scroller.clientWidth / 2 : 0;
        const centerY = scroller ? scroller.scrollTop + scroller.clientHeight / 2 : 0;
        const contentX = centerX / oldScale;
        const contentY = centerY / oldScale;

        this.setFocusTreeScale(newScale);

        if (scroller) {
            const scale = this.getFocusTreeScale();
            scroller.scrollLeft = contentX * scale - scroller.clientWidth / 2;
            scroller.scrollTop = contentY * scale - scroller.clientHeight / 2;
        }
    },

    resetFocusTreeView() {
        GameState.game.focusTreeViewport = { scale: 1 };
        this.focusTreeCentered = false;
        this.applyFocusTreeTransform();
        this.alignFocusTree();
    },

    getPointerDistance(a, b) {
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    },

    getPointerMidpoint(a, b) {
        return {
            clientX: (a.clientX + b.clientX) / 2,
            clientY: (a.clientY + b.clientY) / 2
        };
    },

    getMapTouchPair() {
        const points = Array.from(this.mapPointers.values());
        return points.length >= 2 ? [points[0], points[1]] : null;
    },

    startMapTouchGesture(svg) {
        const pair = this.getMapTouchPair();
        if (!pair) return;

        const [first, second] = pair;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const center = this.getPointerMidpoint(first, second);
        const viewport = { ...GameState.game.mapViewport };
        this.mapTouchGesture = {
            distance: Math.max(12, this.getPointerDistance(first, second)),
            viewport,
            anchorMapX: viewport.x + ((center.clientX - rect.left) / rect.width) * viewport.width,
            anchorMapY: viewport.y + ((center.clientY - rect.top) / rect.height) * viewport.height
        };
        this.mapDrag = null;
    },

    updateMapTouchGesture(svg) {
        const pair = this.getMapTouchPair();
        if (!pair) return;
        if (!this.mapTouchGesture) this.startMapTouchGesture(svg);
        if (!this.mapTouchGesture) return;

        const [first, second] = pair;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const center = this.getPointerMidpoint(first, second);
        const currentDistance = Math.max(12, this.getPointerDistance(first, second));
        const factor = this.mapTouchGesture.distance / currentDistance;
        const sourceViewport = this.mapTouchGesture.viewport;
        const newWidth = Math.min(1300, Math.max(420, sourceViewport.width * factor));
        const newHeight = Math.min(806, Math.max(260, sourceViewport.height * factor));
        const viewport = GameState.game.mapViewport;

        viewport.x = this.mapTouchGesture.anchorMapX - ((center.clientX - rect.left) / rect.width) * newWidth;
        viewport.y = this.mapTouchGesture.anchorMapY - ((center.clientY - rect.top) / rect.height) * newHeight;
        viewport.width = newWidth;
        viewport.height = newHeight;
        this.updateSvgViewBox(svg);
    },

    attachMapInteraction() {
        const svg = document.getElementById('svg-map');
        if (!svg) return;

        this.mapPointers = new Map();
        this.mapTouchGesture = null;

        svg.addEventListener('wheel', event => {
            event.preventDefault();
            const factor = event.deltaY > 0 ? 1.1 : 0.9;
            this.zoomMap(factor, { clientX: event.clientX, clientY: event.clientY });
        }, { passive: false });

        svg.addEventListener('pointerdown', event => {
            if (event.pointerType === 'touch') {
                this.mapPointers.set(event.pointerId, {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY
                });
                svg.setPointerCapture(event.pointerId);

                if (this.mapPointers.size >= 2) {
                    this.startMapTouchGesture(svg);
                    event.preventDefault();
                    return;
                }
            }

            if (event.target.closest('.map-node')) return;

            this.mapDrag = {
                pointerId: event.pointerId,
                pointerType: event.pointerType,
                lastX: event.clientX,
                lastY: event.clientY
            };
            svg.setPointerCapture(event.pointerId);
        });

        svg.addEventListener('pointermove', event => {
            if (event.pointerType === 'touch' && this.mapPointers.has(event.pointerId)) {
                this.mapPointers.set(event.pointerId, {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY
                });

                if (this.mapPointers.size >= 2) {
                    this.updateMapTouchGesture(svg);
                    event.preventDefault();
                    return;
                }
            }

            if (!this.mapDrag || this.mapDrag.pointerId !== event.pointerId) return;

            const viewport = GameState.game.mapViewport;
            const rect = svg.getBoundingClientRect();
            const dx = event.clientX - this.mapDrag.lastX;
            const dy = event.clientY - this.mapDrag.lastY;
            viewport.x -= dx * (viewport.width / rect.width);
            viewport.y -= dy * (viewport.height / rect.height);
            this.mapDrag.lastX = event.clientX;
            this.mapDrag.lastY = event.clientY;
            this.updateSvgViewBox(svg);
            if (event.pointerType === 'touch') event.preventDefault();
        });

        const stopDrag = event => {
            if (event.pointerType === 'touch') {
                this.mapPointers.delete(event.pointerId);
                this.mapTouchGesture = null;
            }

            if (!this.mapDrag || this.mapDrag.pointerId !== event.pointerId) return;
            this.mapDrag = null;
        };

        svg.addEventListener('pointerup', stopDrag);
        svg.addEventListener('pointercancel', stopDrag);
        svg.addEventListener('lostpointercapture', stopDrag);
    },

    zoomMap(factor, pointer = null) {
        const svg = document.getElementById('svg-map');
        const viewport = GameState.game.mapViewport;
        const oldWidth = viewport.width;
        const oldHeight = viewport.height;
        const newWidth = Math.min(1300, Math.max(420, oldWidth * factor));
        const newHeight = Math.min(806, Math.max(260, oldHeight * factor));

        let anchorX = viewport.x + oldWidth / 2;
        let anchorY = viewport.y + oldHeight / 2;

        if (pointer && svg) {
            const rect = svg.getBoundingClientRect();
            anchorX = viewport.x + ((pointer.clientX - rect.left) / rect.width) * oldWidth;
            anchorY = viewport.y + ((pointer.clientY - rect.top) / rect.height) * oldHeight;
        }

        viewport.x = anchorX - ((anchorX - viewport.x) / oldWidth) * newWidth;
        viewport.y = anchorY - ((anchorY - viewport.y) / oldHeight) * newHeight;
        viewport.width = newWidth;
        viewport.height = newHeight;

        if (svg) this.updateSvgViewBox(svg);
    },

    resetMapViewport() {
        GameState.game.mapViewport = { x: 0, y: 0, width: 1000, height: 620 };
        GameState.notify();
    },

    centerNode(nodeId) {
        const node = MapData.getNode(nodeId);
        if (!node) return;

        const viewport = GameState.game.mapViewport;
        viewport.x = node.x - viewport.width / 2;
        viewport.y = node.y - viewport.height / 2;
        this.updateSvgViewBox(document.getElementById('svg-map'));
    },

    updateSvgViewBox(svg) {
        if (!svg) return;
        const viewport = GameState.game.mapViewport;
        svg.setAttribute('viewBox', `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`);
    }
};

window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());
