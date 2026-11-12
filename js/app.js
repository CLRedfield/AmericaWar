function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatTimer(totalSeconds) {
    if (totalSeconds === null) return '不限时';
    const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatMoney(value) {
    const safeValue = Number(value) || 0;
    if (Math.abs(safeValue) < 0.005) return '0';
    return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatSignedMoney(value) {
    const safeValue = Math.abs(Number(value) || 0) < 0.005 ? 0 : Number(value) || 0;
    return `${safeValue >= 0 ? '+' : ''}${formatMoney(safeValue)}`;
}

function formatSignedPercent(value) {
    const safeValue = Number(value) || 0;
    return `${safeValue >= 0 ? '+' : ''}${safeValue}%`;
}

const App = {
    root: null,
    modalRoot: null,
    rankingMetric: 'nodes',
    mobilePanel: null,
    mobileLobbyPanel: 'slots',
    focusMobileFilter: 'all',
    focusDetailCollapsed: false,
    focusBranchOnly: false,
    focusTreeOverview: false,
    resolutionAnimation: null,
    resolutionAnimationTimer: null,
    lastPresentedResolutionKey: null,
    simultaneousResolveTimer: null,
    timerId: null,
    focusTreeDrag: null,
    focusTreePointers: new Map(),
    focusTreeTouchGesture: null,
    focusTreeCentered: false,
    pendingFocusTreeScroll: null,
    focusTreeScroll: null,
    focusTreeResizeObserver: null,
    tutorialTab: 'intro',
    lastFocusDragEndedAt: 0,
    roomDialog: null,
    menuScenarioId: 'america',
    menuTurnLimit: '180',

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
            if (code) setTimeout(() => this.openJoinRoomDialog(code), 300);
        }
    },

    render() {
        const views = {
            'main-menu': MainMenuView,
            lobby: LobbyView,
            'faction-select': FactionSelectView,
            'game-page': GamePageView,
            tutorial: TutorialView
        };
        const view = views[GameState.currentView] || MainMenuView;

        if (document.body) {
            document.body.classList.toggle('is-game-view', GameState.currentView === 'game-page');
            document.body.classList.toggle('is-lobby-view', GameState.currentView === 'lobby');
        }
        // 全量重渲染会重建 DOM、把滚动容器的 scrollTop 清零；先快照、替换后再还原，
        // 避免点击按钮后视图“跳回顶部”。焦点树滚动由 alignFocusTree 单独处理，这里不碰。
        const scrollState = this.capturePreservedScroll();
        const focusedProvince = document.activeElement?.dataset?.provinceId;
        this.root.innerHTML = view.render();
        this.modalRoot.innerHTML = typeof view.renderModals === 'function' ? view.renderModals() : '';
        this.restorePreservedScroll(scrollState);
        this.attachMapInteraction();
        if (focusedProvince && !this.modalRoot.firstElementChild) {
            this.root.querySelector(`[data-province-id="${focusedProvince}"]`)?.focus({ preventScroll: true });
        }
        this.attachFocusTreeInteraction();
        this.alignFocusTree();
    },

    playResolutionAnimation(report) {
        if (!report) return false;
        const resolutionId = Math.max(0, Number(report.resolutionId) || 0);
        const sessionId = report.sessionId || (GameState.game && GameState.game.sessionId) || 'local';
        const presentationKey = `${sessionId}:${resolutionId}`;
        if (this.lastPresentedResolutionKey === presentationKey) return false;

        this.lastPresentedResolutionKey = presentationKey;
        const movements = (Array.isArray(report.movements) ? report.movements : [])
            .map((movement, index) => ({
                id: String(movement.id || `resolution-${resolutionId}-${index}`),
                factionId: String(movement.factionId || ''),
                sourceId: String(movement.sourceId || ''),
                targetId: String(movement.targetId || ''),
                amount: Math.max(0, Math.floor(Number(movement.amount) || 0)),
                kind: movement.kind === 'move' ? 'move' : 'attack'
            }))
            .filter(movement => (
                movement.factionId &&
                movement.sourceId &&
                movement.targetId &&
                movement.amount > 0
            ));
        const engagements = (Array.isArray(report.engagements) ? report.engagements : [])
            .map(engagement => ({
                targetId: String(engagement.targetId || ''),
                type: engagement.type === 'occupation' ? 'occupation' : 'battle',
                winnerFactionId: String(engagement.winnerFactionId || ''),
                previousOwnerId: String(engagement.previousOwnerId || ''),
                survivors: Math.max(0, Math.floor(Number(engagement.survivors) || 0))
            }))
            .filter(engagement => engagement.targetId && engagement.winnerFactionId);

        if (!movements.length && !engagements.length) {
            this.resolutionAnimation = null;
            return true;
        }

        const reducedMotion = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const movementDuration = reducedMotion ? 0.16 : 1.05;
        const baseDelay = reducedMotion ? 0 : 0.12;
        const staggerStep = reducedMotion ? 0 : 0.04;
        const maxStagger = reducedMotion ? 0 : Math.min(Math.max(0, movements.length - 1) * staggerStep, 0.28);
        const impactDuration = reducedMotion ? 0.2 : 0.92;
        const durationMs = Math.ceil((baseDelay + maxStagger + movementDuration + impactDuration + 0.12) * 1000);

        this.resolutionAnimation = {
            resolutionId,
            turn: Math.max(1, Number(report.turn) || Math.max(1, GameState.game.currentTurn - 1)),
            nextTurn: Math.max(1, Number(report.nextTurn) || GameState.game.currentTurn),
            startedAt: Date.now(),
            movementDuration,
            baseDelay,
            staggerStep,
            impactDuration,
            durationMs,
            movements,
            engagements
        };

        if (this.resolutionAnimationTimer) clearTimeout(this.resolutionAnimationTimer);
        if (this.root && typeof setTimeout === 'function') {
            this.resolutionAnimationTimer = setTimeout(() => {
                this.resolutionAnimationTimer = null;
                this.resolutionAnimation = null;
                if (this.root && GameState.currentView === 'game-page') this.render();
            }, durationMs);
        }
        return true;
    },

    // 跨重渲染保留滚动位置的容器（按稳定选择器记录）。切换视图时旧容器消失、新容器没有
    // 旧位置，querySelector 取不到即自动跳过，不会误还原。
    PRESERVED_SCROLL_SELECTORS: ['.view-lobby', '.slot-list', '.lobby-chat-log', '.campaign-story-index', '.campaign-story-page'],

    capturePreservedScroll() {
        const state = {};
        this.PRESERVED_SCROLL_SELECTORS.forEach(selector => {
            const el = document.querySelector(selector);
            if (el && (el.scrollTop || el.scrollLeft)) {
                state[selector] = { top: el.scrollTop, left: el.scrollLeft };
            }
        });
        return state;
    },

    restorePreservedScroll(state) {
        Object.keys(state).forEach(selector => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.scrollTop = state[selector].top;
            el.scrollLeft = state[selector].left;
        });
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

    setMobileLobbyPanel(panel) {
        this.mobileLobbyPanel = panel || 'slots';
        this.render();
    },

    setFocusMobileFilter(filter) {
        this.captureFocusTreeScroll();
        this.focusMobileFilter = filter || 'all';
        GameState.notify();
    },

    centerCapital() {
        const capitalId = GameState.getCapitalNodeId(GameState.getPlayerFactionId());
        if (!capitalId) return;
        this.inspectProvince(capitalId);
        this.centerNode(capitalId);
    },

    setPlayerName(rawName) {
        const name = String(rawName || '').trim().slice(0, 16) || '指挥官';
        GameState.setMyIdentity({ name });
        // 若我已坐席位，更新名字
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
        GameState.notify();
    },

    selectScenario(id) {
        this.menuScenarioId = GameState.getScenario(id).id;
        GameState.notify();
    },

    setMenuTurnLimit(value) {
        this.menuTurnLimit = GameState.normalizeTurnLimit(value);
    },

    startLocalLobby() {
        GameState.initLocalLobby(this.menuScenarioId, { turnLimit: this.menuTurnLimit });
        GameState.setView('lobby');
    },

    // ——— 联机房间对话框（选择后端 + 输入房间码） ———

    openCreateRoomDialog() {
        if (!window.Multiplayer) return alert('多人模块未加载');
        this.roomDialog = {
            mode: 'create',
            scenarioId: this.menuScenarioId,
            transport: 'firebase',
            code: '',
            server: Multiplayer.emqxDefaultServer(),
            error: '',
            busy: false
        };
        GameState.notify();
    },

    openJoinRoomDialog(prefilledCode = '') {
        if (!window.Multiplayer) return alert('多人模块未加载');
        this.roomDialog = {
            mode: 'join',
            transport: 'firebase',
            code: String(prefilledCode || '').trim().toUpperCase(),
            server: Multiplayer.emqxDefaultServer(),
            error: '',
            busy: false
        };
        GameState.notify();
    },

    // 旧入口保留：主菜单按钮 / hash 邀请链接仍可调用
    createOnlineRoom() { this.openCreateRoomDialog(); },
    promptJoinRoom(prefilledCode = '') { this.openJoinRoomDialog(prefilledCode); },

    closeRoomDialog() {
        if (this.roomDialog && this.roomDialog.busy) return; // 连接中不允许关闭
        this.roomDialog = null;
        GameState.notify();
    },

    closeRoomDialogOnBackdrop(event) {
        if (event.target.classList.contains('room-dialog-backdrop')) this.closeRoomDialog();
    },

    // 切换后端会触发整页重渲染——先把输入框里的内容读回 state，避免丢失已输入的房间码/地址。
    _syncRoomDialogInputs() {
        if (!this.roomDialog) return;
        const codeEl = document.getElementById('room-dialog-code');
        const serverEl = document.getElementById('room-dialog-server');
        if (codeEl) this.roomDialog.code = codeEl.value;
        if (serverEl) this.roomDialog.server = serverEl.value;
    },

    setRoomDialogTransport(transport) {
        if (!this.roomDialog) return;
        this._syncRoomDialogInputs();
        this.roomDialog.transport = transport;
        this.roomDialog.error = '';
        GameState.notify();
    },

    _transportLabel(transport) {
        const opt = (Multiplayer.transportOptions() || []).find(o => o.id === transport);
        return opt ? opt.label : transport;
    },

    async submitRoomDialog() {
        const dialog = this.roomDialog;
        if (!dialog || dialog.busy) return;
        this._syncRoomDialogInputs();

        const transport = dialog.transport || 'firebase';
        const config = transport === 'emqx'
            ? { server: (dialog.server || '').trim() || Multiplayer.emqxDefaultServer() }
            : {};

        if (dialog.mode === 'join' && !String(dialog.code || '').trim()) {
            dialog.error = '请输入房间码。';
            GameState.notify();
            return;
        }

        dialog.busy = true;
        dialog.error = '';
        GameState.notify();

        try {
            if (dialog.mode === 'create') {
                const code = await Multiplayer.createRoom(GameState.lobby.myName, {
                    transport, config, scenarioId: dialog.scenarioId, turnLimit: this.menuTurnLimit
                });
                this.roomDialog = null;
                GameState.lobby.statusMessage = `房间 ${code} 已创建（${this._transportLabel(transport)}）。把房间码告诉朋友以邀请他们。`;
                GameState.setView('lobby');
            } else {
                const code = await Multiplayer.joinRoom(dialog.code, GameState.lobby.myName, { transport, config });
                this.roomDialog = null;
                GameState.lobby.statusMessage = `已加入房间 ${code}（${this._transportLabel(transport)}）。`;
                if (GameState.currentView !== 'game-page') GameState.setView('lobby');
            }
        } catch (err) {
            if (this.roomDialog) {
                this.roomDialog.busy = false;
                this.roomDialog.error = (err && err.message ? err.message : String(err));
            }
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

    openTutorial() {
        this.tutorialTab = 'intro';
        GameState.setView('tutorial');
    },

    setTutorialTab(tab) {
        this.tutorialTab = tab || 'intro';
        GameState.notify();
    },

    closeTutorial() {
        GameState.setView('main-menu');
    },

    openRulesHelp() {
        // 规则已并入教程：直接跳到教程的「规则速查」章节。
        this.tutorialTab = 'rules';
        GameState.setView('tutorial');
    },

    updateLobbySetting(key, value) {
        if (!GameState.updateLobbySetting(key, value)) return;
        if (key === 'turnLimit') this.setMenuTurnLimit(value);
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLobby();
    },

    toggleLobbySwitch(key) {
        if (GameState.toggleLobbySwitch(key) && window.Multiplayer && Multiplayer.isOnline) {
            Multiplayer.pushLobby();
        }
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
        const label = difficulty === 'very_easy' ? '非常简单' : difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通';
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
        if (GameState.canAutoFillSoloCampaign()) GameState.fillOpenSlotsWithAi();
        const active = GameState.getActiveSlots();
        if (active.length < 2) return alert('至少需要 2 个非空席位才能开始（玩家或 AI）');
        const humans = active.filter(s => s.kind === 'human');
        if (humans.length < 1) return alert('至少需要 1 个人类玩家');
        MapData.reset();
        GameState.startGameSession();
        if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushGameState(true);
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
        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            const isOnline = window.Multiplayer && Multiplayer.isOnline;
            if (!isOnline || GameState.isHost()) {
                SimultaneousTurns.prepareAiPlans();
            }
            return;
        }
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
            if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
                Multiplayer.pushLocalTurnPlan();
                return;
            }
            Multiplayer.pushGameState();
        }
    },

    /**
     * 检查："轮到我吗？" —— 联机模式下用。
     */
    isMyTurnToAct() {
        if (!GameState.game) return false;
        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            return SimultaneousTurns.canLocalPlayerAct();
        }
        const currentId = GameState.game.currentPlayerId;
        return GameState.isFactionPlayedByLocalUser(currentId);
    },

    canLocalPlayerAct() {
        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            return SimultaneousTurns.canLocalPlayerAct();
        }
        return GameState.game.currentPlayerId === GameState.getPlayerFactionId();
    },

    startTimer() {
        if (this.timerId) return;

        this.timerId = window.setInterval(() => {
            if (GameState.currentView !== 'game-page') return;
            if (!GameState.game || GameState.game.gameOver) return;

            const simultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
            if (simultaneous && this.resolutionAnimation) return;
            // 联机：只有"轮到自己的本地玩家"才跑倒计时；观战 / 等待他人行动时冻结，
            // 否则别人机器上的计时器归零会把当前玩家的回合提前结束。
            if (
                !simultaneous &&
                window.Multiplayer &&
                Multiplayer.isOnline &&
                !this.isMyTurnToAct()
            ) return;

            if (GameState.game.timerRemaining === null) return;
            GameState.game.timerRemaining = Math.max(0, GameState.game.timerRemaining - 1);
            this.updateTimerDisplay();
            if (GameState.game.timerRemaining === 0) this.endTurn(true);
        }, 1000);
    },

    updateTimerDisplay() {
        const timerElements = document.querySelectorAll('.timer');
        timerElements.forEach(element => {
            element.textContent = formatTimer(GameState.game.timerRemaining);
            element.classList.toggle('danger', Number.isFinite(GameState.game.timerRemaining) && GameState.game.timerRemaining <= 15);
        });
    },

    getActionMeta(action) {
        const perSoldierBase = 2;
        const recruitCostPerSoldier = Math.max(1, perSoldierBase + GameState.getEffectiveRecruitCostDelta());
        const draftAmount = this.getSelectedRecruitAmount(recruitCostPerSoldier);
        const recruitAmount = Math.max(1, draftAmount + GameState.getEffectiveRecruitAmount());
        const disbandAmount = this.getSelectedDisbandAmount();
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
            disband: {
                label: '裁军',
                basePP: 0,
                costMoney: 0,
                disbandAmount,
                gainMoney: disbandAmount,
                effect: `节点驻军 -${disbandAmount}，立即获得 $${formatMoney(disbandAmount)}`,
                rulesHint: '每解散 1 支部队立即获得 $1，并降低下回合维护费'
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
        const gainMoney = meta.gainMoney || 0;
        const moneyText = costMoney > 0
            ? `$${formatMoney(costMoney)} / `
            : gainMoney > 0
                ? `+$${formatMoney(gainMoney)} / `
                : '';
        const costText = `${moneyText}${ppCost} PP`;

        return {
            ...meta,
            basePP: adjustedBasePP,
            costMoney,
            gainMoney,
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

    getDisbandMoneyPreviewText(meta = this.getActionCost('disband')) {
        const amount = meta.disbandAmount || 0;
        const current = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId());
        const afterDisband = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId(), {
            extraTroops: -amount,
            moneyGained: meta.gainMoney || amount,
            ppSpent: meta.ppCost || 0
        });
        const improvement = afterDisband.projectedMoney - current.projectedMoney;
        return `下回合金钱净变：${formatSignedMoney(current.moneyDelta)} → ${formatSignedMoney(afterDisband.moneyDelta)}，预计余额改善 +$${formatMoney(improvement)}`;
    },

    getActionAvailability(action, nodeId = GameState.game.selectedNodeId, options = {}) {
        const node = MapData.getNode(nodeId);
        const meta = this.getActionCost(action, nodeId);
        const playerFactionId = GameState.getPlayerFactionId();
        const resources = GameState.game.playerResources;
        const requireFriendlyMoveTarget = options.requireFriendlyMoveTarget !== false;

        if (action === 'move') {
            if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', cost: meta.cost, ...meta };
            if (!this.canLocalPlayerAct()) return { enabled: false, reason: '计划已经提交，先撤回才能修改', cost: meta.cost, ...meta };
            if (GameState.game.movementOrdersActive) {
                return { enabled: true, reason: '', cost: '已启用', ppCost: 0, costMoney: 0, meta };
            }

            const hasMovableTroops = GameState.getFactionMovableTroops(playerFactionId) > 0;
            if (!hasMovableTroops) return { enabled: false, reason: '本回合没有可移动士兵', cost: meta.cost, ...meta };
            if (resources.pp < meta.ppCost) return { enabled: false, reason: `缺少 ${formatMoney(meta.ppCost - resources.pp)} PP`, cost: meta.cost, ...meta };
            return { enabled: true, reason: '', cost: meta.cost, ppCost: meta.ppCost, costMoney: meta.costMoney, meta };
        }

        if (!node) return { enabled: false, reason: '未选择节点', cost: meta.cost };
        if (GameState.game.gameOver) return { enabled: false, reason: '游戏已经结束', cost: meta.cost };
        if (!this.canLocalPlayerAct()) return { enabled: false, reason: '计划已经提交，先撤回才能修改', cost: meta.cost };
        if (node.factionId !== playerFactionId) return { enabled: false, reason: '只能操作己方节点', cost: meta.cost };
        if (action === 'recruit' && !GameState.canRecruitAtNode(node.id, playerFactionId)) {
            return { enabled: false, reason: '征兵只能在当前首都或已占领的原始首都执行', cost: meta.cost };
        }
        if (action === 'recruit' && resources.money < (meta.costPerSoldier || 1)) {
            return { enabled: false, reason: `至少需要 ${formatMoney(meta.costPerSoldier || 1)} 金钱才能征 1 个兵`, cost: meta.cost };
        }
        if (action === 'disband' && node.troops < 1) {
            return { enabled: false, reason: '该节点没有可裁撤的部队', cost: meta.cost };
        }
        if (action === 'build') {
            const cap = GameState.getNodeIndustryCap(node.id);
            if (node.industry >= cap) return { enabled: false, reason: `该节点工业已达到上限 ${cap}`, cost: meta.cost };
        }
        if (meta.costMoney > 0 && resources.money < meta.costMoney) return { enabled: false, reason: `缺少 ${formatMoney(meta.costMoney - resources.money)} 金钱`, cost: meta.cost };
        if (resources.pp < meta.ppCost) return { enabled: false, reason: `缺少 ${formatMoney(meta.ppCost - resources.pp)} PP`, cost: meta.cost };
        if (action === 'move' && node.troops < 1) return { enabled: false, reason: '该节点没有可移动部队', cost: meta.cost };
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
        if (GameState.game.currentAction === 'move') {
            GameState.setCurrentAction(null);
            return;
        }

        const source = MapData.getNode(GameState.game.selectedNodeId);
        if (!source || source.factionId !== GameState.getPlayerFactionId() || GameState.getNodeMovableTroops(source) < 1) return;
        const availability = this.getActionAvailability('move', source.id);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }
        this.mobilePanel = null;
        GameState.setCurrentAction('move');
    },

    ensureMovementOrders() {
        const availability = this.getActionAvailability('move');
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return false;
        }
        if (!GameState.game.movementOrdersActive) {
            GameState.game.playerResources.pp -= availability.ppCost;
            GameState.game.actionCountThisTurn += 1;
            GameState.game.movementOrdersActive = true;
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：发布移动令，本回合未移动士兵各可移动或进攻 1 次。`, 'system', false);
        }
        GameState.game.currentAction = 'move';
        return true;
    },

    confirmAction() {
        const confirm = GameState.game.actionConfirm;
        if (!confirm) return;
        if (!this.canLocalPlayerAct()) {
            GameState.game.actionConfirm = null;
            GameState.addLog(this.resolutionAnimation ? '统一结算回放期间不能行动。' : '计划已经准备，取消准备后才能继续操作。', 'system');
            return;
        }

        if (confirm.action === 'move') {
            const source = MapData.getNode(confirm.nodeId);
            const targets = MapData.getMoveTargets(confirm.nodeId, GameState.getPlayerFactionId());
            if (!targets.some(target => target.id === confirm.targetId) || !this.ensureMovementOrders()) return;
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
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${node.name} 完成征兵，驻军 +${recruitAmount}（消耗 $${formatMoney(meta.costMoney)}）。`, 'system');
            return;
        }

        if (confirm.action === 'disband') {
            const disbandAmount = Math.max(1, Math.min(node.troops, meta.disbandAmount || 1));
            node.troops = Math.max(0, node.troops - disbandAmount);
            node.moveReady = Math.min(GameState.getNodeMoveReady(node), node.troops);
            node.freshTroops = Math.min(GameState.getNodeFreshTroops(node), node.troops);
            GameState.game.playerResources.money += disbandAmount;
            GameState.game.disbandDraftAmount = 1;
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：${node.name} 裁军 ${disbandAmount} 支，回收物资 +$${formatMoney(disbandAmount)}。`, 'system');
            GameState.refreshFactionStatus(false);
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

    setRecruitRatio(ratio) {
        const max = this.getMaxRecruitAmount();
        const target = ratio <= 0 ? 1 : Math.max(1, Math.round(max * ratio));
        this.setRecruitDraftAmount(target);
    },

    getMaxDisbandAmount(node = MapData.getNode(GameState.game.selectedNodeId)) {
        return Math.max(0, node?.troops || 0);
    },

    getSelectedDisbandAmount(node = MapData.getNode(GameState.game.selectedNodeId)) {
        const max = this.getMaxDisbandAmount(node);
        if (max <= 0) return 0;
        const draft = Number(GameState.game.disbandDraftAmount) || 1;
        return Math.min(max, Math.max(1, Math.floor(draft)));
    },

    setDisbandDraftAmount(amount, shouldNotify = true) {
        const confirm = GameState.game.actionConfirm;
        const node = MapData.getNode(confirm && confirm.action === 'disband' ? confirm.nodeId : GameState.game.selectedNodeId);
        const max = this.getMaxDisbandAmount(node);
        GameState.game.disbandDraftAmount = max > 0
            ? Math.min(max, Math.max(1, Math.floor(Number(amount) || 1)))
            : 1;
        if (shouldNotify) {
            GameState.notify();
        } else {
            this.syncDisbandSliderDisplay();
        }
    },

    adjustDisbandDraftAmount(delta) {
        this.setDisbandDraftAmount(this.getSelectedDisbandAmount() + delta);
    },

    selectMaxDisbandAmount() {
        const confirm = GameState.game.actionConfirm;
        const node = MapData.getNode(confirm && confirm.action === 'disband' ? confirm.nodeId : GameState.game.selectedNodeId);
        this.setDisbandDraftAmount(this.getMaxDisbandAmount(node));
    },

    setDisbandRatio(ratio) {
        const confirm = GameState.game.actionConfirm;
        const node = MapData.getNode(confirm && confirm.action === 'disband' ? confirm.nodeId : GameState.game.selectedNodeId);
        const max = this.getMaxDisbandAmount(node);
        const target = ratio <= 0 ? 1 : Math.max(1, Math.round(max * ratio));
        this.setDisbandDraftAmount(target);
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

    setMovePreset(preset) {
        const confirm = GameState.game.actionConfirm;
        const source = MapData.getNode(confirm && confirm.action === 'move' ? confirm.nodeId : GameState.game.selectedNodeId);
        const max = GameState.getNodeMovableTroops(source);
        if (max <= 0) return;
        const stationary = Math.max(0, (source?.troops || 0) - max);
        let amount = max;
        if (preset === 'one') amount = 1;
        else if (preset === 'half') amount = Math.max(1, Math.ceil(max / 2));
        else if (preset === 'leaveOne') amount = stationary >= 1 ? max : Math.max(1, max - 1);
        this.setMoveDraftAmount(amount);
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

    setBattlePreset(preset) {
        const preview = GameState.game.battlePreview;
        const attacker = MapData.getNode(preview ? preview.attackerId : GameState.game.selectedNodeId);
        const max = GameState.getNodeMovableTroops(attacker);
        if (max <= 0) return;
        const stationary = Math.max(0, (attacker?.troops || 0) - max);
        let amount = max;
        if (preset === 'one') amount = 1;
        else if (preset === 'half') amount = Math.max(1, Math.ceil(max / 2));
        else if (preset === 'leaveOne') amount = stationary >= 1 ? max : Math.max(1, max - 1);
        this.setBattleDraftAmount(amount);
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

    syncDisbandSliderDisplay() {
        const confirm = GameState.game.actionConfirm;
        if (!confirm || confirm.action !== 'disband') return;

        const node = MapData.getNode(confirm.nodeId);
        const meta = this.getActionCost('disband', confirm.nodeId);
        const max = this.getMaxDisbandAmount(node);
        const amount = this.getSelectedDisbandAmount(node);
        const preview = this.getDisbandMoneyPreviewText(meta);
        const current = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId());
        const afterDisband = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId(), {
            extraTroops: -amount,
            moneyGained: amount,
            ppSpent: meta.ppCost || 0
        });
        const improvement = afterDisband.projectedMoney - current.projectedMoney;

        document.querySelectorAll('.disband-range, .disband-amount-input').forEach(input => {
            input.value = amount;
            input.max = max;
        });
        document.querySelectorAll('[data-disband-count]').forEach(element => {
            element.textContent = `${amount} / ${max} 支（下回合 +$${formatMoney(improvement)}）`;
        });
        document.querySelectorAll('[data-disband-gain]').forEach(element => {
            element.textContent = `立即获得 $${formatMoney(amount)}，并减少 ${amount} 支部队维护`;
        });
        document.querySelectorAll('[data-disband-next-money]').forEach(element => {
            element.textContent = preview;
        });
        document.querySelectorAll('[data-disband-effect]').forEach(element => {
            element.textContent = `驻军 -${amount}，金钱 +$${formatMoney(amount)}`;
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
        const simultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
        const outcome = preview.attackerWins
            ? `预计攻下目标，${preview.remainingTroops} 支联合部队进入`
            : simultaneous
                ? '预计进攻失败，投入统一战斗的攻方部队将损失'
                : `预计进攻失败，${preview.remainingTroops} 支参战部队撤回`;
        const coordination = simultaneous
            ? `；计入既有计划后合计 ${preview.combinedAttackerBase} 支、${preview.attackDirections} 路进攻${preview.multiDirectionBonus > 0 ? `，围攻 +${preview.multiDirectionBonus}%` : ''}`
            : '';
        return `本次新增 ${preview.attackerBase}/${preview.maxAttackers} 支可动兵进攻${coordination}，并消耗这些部队的本回合移动次数；${outcome}。`;
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
        document.querySelectorAll('[data-battle-combined-base]').forEach(element => {
            element.textContent = preview.combinedAttackerBase;
        });
        document.querySelectorAll('[data-battle-coordination]').forEach(element => {
            element.textContent = preview.multiDirectionBonus > 0
                ? `${preview.attackDirections} 路协同 · 进攻 +${preview.multiDirectionBonus}%`
                : `${preview.attackDirections} 路进攻 · 暂无围攻加成`;
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

        if (!source || !target || source.factionId !== playerFactionId || target.factionId !== playerFactionId || !MapData.areAdjacent(source.id, target.id)) {
            GameState.addLog('移动条件不满足。', 'system');
            return;
        }

        const maxAmount = GameState.getNodeMovableTroops(source);
        if (maxAmount < 1) {
            GameState.addLog('该节点没有可移动士兵。', 'system');
            return;
        }

        const availability = this.getActionAvailability('move', source.id);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }
        this.mobilePanel = null;
        GameState.game.moveDraftAmount = Math.min(maxAmount, Math.max(1, Number(GameState.game.moveDraftAmount) || maxAmount));
        GameState.game.actionConfirm = { action: 'move', nodeId: source.id, targetId: target.id };
        GameState.game.battlePreview = null;
        GameState.notify();
    },

    performMove(targetId, amount = null) {
        if (!this.canLocalPlayerAct()) {
            GameState.addLog(this.resolutionAnimation ? '统一结算回放期间不能发布行军令。' : '计划已经准备，取消准备后才能修改行军令。', 'system');
            return;
        }
        const source = MapData.getNode(GameState.game.selectedNodeId);
        const target = MapData.getNode(targetId);

        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            if (!source || !target) return;
            const movingTroops = Math.max(1, Math.floor(Number(amount) || this.getSelectedMoveAmount(source)));
            const order = SimultaneousTurns.addOrder({
                sourceId: source.id,
                targetId: target.id,
                amount: movingTroops,
                kind: target.factionId === source.factionId ? 'move' : 'attack'
            });
            if (!order) {
                GameState.addLog('无法加入行军计划：可用兵力不足或目标不合法。', 'system');
                return;
            }
            GameState.game.actionConfirm = null;
            GameState.game.selectedNodeId = source.id;
            GameState.addLog(
                `第 ${GameState.game.currentTurn} 回合规划：${source.name} → ${target.name}，${order.amount} 支；将在统一结算时执行。`,
                'system'
            );
            return;
        }

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

    inspectProvince(nodeId) {
        const node = MapData.getNode(nodeId);
        if (!node) return;
        GameState.game.currentAction = null;
        GameState.setSelectedNode(nodeId);
    },

    handleNodeClick(nodeId) {
        if (GameState.game.currentAction === 'move' && this.openProvinceOrder(nodeId)) return;
        this.inspectProvince(nodeId);
    },

    openProvinceOrder(nodeId) {
        const source = MapData.getNode(GameState.game.selectedNodeId);
        const factionId = GameState.getPlayerFactionId();
        if (!source || !this.getActionAvailability('move', source.id).enabled) return false;

        if (MapData.getMoveTargets(source.id, factionId).some(node => node.id === nodeId)) {
            this.openMoveConfirm(nodeId);
            return true;
        }
        if (MapData.getAttackTargets(source.id, factionId).some(node => node.id === nodeId)) {
            this.openBattlePreview(source.id, nodeId);
            return true;
        }
        return false;
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
        const isSimultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
        const isPlayerDefender = defender.factionId === GameState.getPlayerFactionId();
        const defenderSlot = GameState.getSlot(defender.factionId);
        let defenderModifierBonus;
        if (isPlayerDefender) {
            // 防守方就是本地玩家：用本地实时的全局 + 标签防御。
            defenderModifierBonus = Math.round(((GameState.getTaggedDefenseBonus(defender) || 0) + (GameState.getEffectiveGlobalDefense() || 0)) * 100);
        } else if (window.GameAI && defenderSlot && defenderSlot.kind === 'ai') {
            // AI 守方：用 AI 防御加成。
            defenderModifierBonus = GameAI.getAiDefenseBonusPercent(defender.factionId, defender);
        } else {
            // 别的人类守方（联机）：用其同步过来的全局防御加成（humanCombat）。缺数据时回退到 0（即旧行为，绝不会更差）。
            const remoteCombat = GameState.game.humanCombat && GameState.game.humanCombat[defender.factionId];
            defenderModifierBonus = (remoteCombat && Number(remoteCombat.def)) || 0;
        }
        const attackerEncircled = MapData.isNodeEncircled(attacker);
        const defenderEncircled = MapData.isNodeEncircled(defender);
        const encirclementPenalty = -35;
        const defenseBonus = baseDefenseBonus
            + defenderModifierBonus
            + (defenderEncircled ? encirclementPenalty : 0);
        const maxAttackers = GameState.getNodeMovableTroops(attacker);
        const draftAmount = requestedAmount === null || typeof requestedAmount === 'undefined'
            ? (Number(GameState.game.battleDraftAmount) || maxAttackers)
            : requestedAmount;
        const attackerBase = maxAttackers > 0
            ? Math.min(maxAttackers, Math.max(1, Math.floor(Number(draftAmount) || maxAttackers)))
            : 0;
        const coordination = isSimultaneous
            ? SimultaneousTurns.getAttackCoordination(defender.id, attacker.factionId, {
                sourceId: attacker.id,
                amount: attackerBase
            })
            : {
                directions: attackerBase > 0 ? 1 : 0,
                bonus: 0,
                troops: attackerBase,
                existingTroops: 0
            };
        const multiDirectionBonus = coordination.bonus;
        const baseAttackBonus = Math.round((GameState.getEffectiveGlobalAttack() || 0) * 100)
            + (attackerEncircled ? encirclementPenalty : 0);
        const attackerAttackBonus = baseAttackBonus + multiDirectionBonus;
        const combinedAttackerBase = isSimultaneous ? coordination.troops : attackerBase;
        const defenderBase = defender.troops;
        const attackerPower = Number((combinedAttackerBase * (1 + attackerAttackBonus / 100)).toFixed(1));
        const defenderPower = Number((defenderBase * (1 + defenseBonus / 100)).toFixed(1));
        const attackerWins = attackerPower > defenderPower;
        const margin = Math.abs(attackerPower - defenderPower);
        const remainingTroops = attackerWins
            ? Math.max(1, Math.min(combinedAttackerBase, Math.round(margin)))
            : (isSimultaneous ? 0 : Math.max(0, Math.floor(attackerBase * 0.45)));

        return {
            attackerId,
            defenderId,
            attackerTotalTroops: attacker.troops,
            maxAttackers,
            attackerBase,
            defenderBase,
            combinedAttackerBase,
            existingPlannedTroops: coordination.existingTroops,
            attackDirections: coordination.directions,
            multiDirectionBonus,
            attackerPower,
            defenderPower,
            defenseBonus,
            attackerAttackBonus,
            attackerEncircled,
            defenderEncircled,
            encirclementPenalty,
            attackerWins,
            remainingTroops,

            resultText: attackerWins
                ? `预计结果：攻方胜利，预计 ${remainingTroops} 支联合部队进入目标。`
                : isSimultaneous
                    ? '预计结果：守方优势，投入本次统一战斗的攻方部队将损失。'
                    : `预计结果：守方优势，参战部队预计撤回 ${remainingTroops} 支。`
        };
    },

    openBattlePreview(attackerId, defenderId) {
        const availability = this.getActionAvailability('move', attackerId);
        if (!availability.enabled) {
            GameState.addLog(availability.reason, 'system');
            return;
        }
        const targets = MapData.getAttackTargets(attackerId, GameState.getPlayerFactionId());
        if (!targets.some(node => node.id === defenderId)) return;

        this.mobilePanel = null;
        const maxAttackers = GameState.getNodeMovableTroops(MapData.getNode(attackerId));
        GameState.game.battleDraftAmount = maxAttackers;
        GameState.setBattlePreview(this.createBattlePreview(attackerId, defenderId, maxAttackers));
    },

    attackFromNeighbor(attackerId, defenderId) {
        const attacker = MapData.getNode(attackerId);
        if (!attacker || attacker.factionId !== GameState.getPlayerFactionId()) return;
        GameState.game.selectedNodeId = attackerId;
        this.openBattlePreview(attackerId, defenderId);
    },

    confirmBattle() {
        const preview = GameState.game.battlePreview;
        if (!preview) return;

        if (!this.canLocalPlayerAct()) {
            GameState.game.battlePreview = null;
            GameState.addLog(this.resolutionAnimation ? '统一结算回放期间不能进攻。' : '计划已经准备，取消准备后才能修改进攻计划。', 'system');
            return;
        }
        const attacker = MapData.getNode(preview.attackerId);
        const defender = MapData.getNode(preview.defenderId);
        if (!attacker || !defender) return;
        const targets = MapData.getAttackTargets(attacker.id, GameState.getPlayerFactionId());
        if (!targets.some(node => node.id === defender.id) || !this.ensureMovementOrders()) return;

        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            const participatingTroops = this.getSelectedBattleAmount(attacker);
            const order = SimultaneousTurns.addOrder({
                sourceId: attacker.id,
                targetId: defender.id,
                amount: participatingTroops,
                kind: 'attack'
            });
            GameState.game.battlePreview = null;
            GameState.game.currentAction = 'move';
            GameState.game.actionConfirm = null;
            if (!order) {
                GameState.addLog('无法加入进攻计划：可用兵力不足或目标不合法。', 'system');
                GameState.notify();
                return;
            }
            GameState.addLog(
                `第 ${GameState.game.currentTurn} 回合规划：${attacker.name} → ${defender.name}，投入 ${order.amount} 支；战斗将在回合末统一结算。`,
                'battle'
            );
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
            attacker.troops = Math.max(0, attacker.troops - participatingTroops);
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
        attacker.troops = Math.max(0, attacker.troops - attackerLosses);
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

        if (window.SimultaneousTurns && SimultaneousTurns.isEnabled()) {
            this.submitOrWithdrawTurnPlan(auto);
            return;
        }

        // 联机：只有"该行动的本地玩家"可以结束自己的回合；AI / 空席由房主代为结束。
        // 防止其他客户端（例如观战中倒计时归零）误把当前玩家的回合结束掉。
        if (window.Multiplayer && Multiplayer.isOnline) {
            const actingId = GameState.game.currentPlayerId;
            const localActs = GameState.isFactionPlayedByLocalUser(actingId);
            const slot = GameState.getSlot(actingId);
            const hostHandlesNonHuman = GameState.isHost() && (!slot || slot.kind !== 'human');
            if (!localActs && !hostHandlesNonHuman) return;
        }

        const turnLimit = GameState.getTurnLimitSeconds();
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
        GameState.game.disbandDraftAmount = 1;
        GameState.game.battlePreview = null;
        GameState.game.actionConfirm = null;
        GameState.game.timerRemaining = turnLimit;

        const playerFactionId = GameState.getPlayerFactionId();

        if (isLastInRound) {
            // 一轮全部行动完了：回合数 +1。
            GameState.game.currentTurn += 1;
            // AI 结算由"结束本轮的这台机器"统一执行（aiResources 与 AI 的地图变化都会被同步出去）。
            // 人类各势力不在这里结算 —— 改为各自在"自己的回合开始"时结算自己（见 maybeSettleLocalFactionOnTurnStart）。
            this.settleAiTurnStart(turnOrder, playerFactionId);
            GameState.resetMovementReadiness();
            GameState.addLog(`${auto ? '计时结束' : '结束回合'}：第 ${GameState.game.currentTurn} 回合开始。`, 'system', false);
        } else {
            GameState.addLog(`${GameState.getFactionName(currentId)} 结束行动，下一手：${GameState.getFactionName(nextId)}。`, 'system', false);
        }

        GameState.game.currentPlayerId = nextId;
        // 轮到谁，谁就在自己机器上为自己的势力做"本回合完整结算"（金钱/PP/首都补员/赤字逃兵）。
        // 因为此刻正是该势力的回合，其拥有者是地图的权威写入方，联机下这些地图改动不会被其他人的快照覆盖。
        this.maybeSettleLocalFactionOnTurnStart(auto);
        GameState.refreshFactionStatus(false);
        GameState.checkVictory(true);
        GameState.notify();
    },

    submitOrWithdrawTurnPlan(auto = false) {
        if (!window.SimultaneousTurns || !SimultaneousTurns.isPlanning()) return;
        if (this.resolutionAnimation) return;
        const factionId = GameState.getPlayerFactionId();
        const alreadySubmitted = SimultaneousTurns.isFactionSubmitted(factionId);

        if (auto && alreadySubmitted && window.Multiplayer && Multiplayer.isOnline && !GameState.isHost()) {
            return;
        }

        if (alreadySubmitted && !auto) {
            SimultaneousTurns.snapshotLocalPlan(false);
            GameState.addLog(`第 ${GameState.game.currentTurn} 回合：已取消准备，可以继续调整。`, 'system', false);
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLocalTurnPlan(true);
            GameState.notify();
            this.tryResolveSimultaneousTurn();
            return;
        }

        if (!alreadySubmitted) {
            SimultaneousTurns.snapshotLocalPlan(true);
            const orderCount = SimultaneousTurns.getOrders(factionId).length;
            GameState.game.actionConfirm = null;
            GameState.game.battlePreview = null;
            GameState.game.currentAction = null;
                    GameState.addLog(
                `${auto ? '计时结束，自动' : ''}准备完成第 ${GameState.game.currentTurn} 回合计划（${orderCount} 道行军令）；取消准备后可继续修改。`,
                'system',
                false
            );
            if (window.Multiplayer && Multiplayer.isOnline) Multiplayer.pushLocalTurnPlan(true);
        }

        const isOnline = window.Multiplayer && Multiplayer.isOnline;
        const authority = !isOnline || GameState.isHost();
        if (auto && authority && !SimultaneousTurns.allRequiredPlansSubmitted()) {
            SimultaneousTurns.forceSubmitMissingPlans();
            GameState.addLog('规划时间结束：未提交势力按当前草案或原地待命处理。', 'system', false);
        }

        GameState.notify();
        this.tryResolveSimultaneousTurn();
    },

    clearPendingSimultaneousResolution() {
        if (!this.simultaneousResolveTimer) return;
        clearTimeout(this.simultaneousResolveTimer);
        this.simultaneousResolveTimer = null;
    },

    tryResolveSimultaneousTurn() {
        if (!window.SimultaneousTurns || !SimultaneousTurns.isPlanning()) {
            this.clearPendingSimultaneousResolution();
            return false;
        }
        const isOnline = window.Multiplayer && Multiplayer.isOnline;
        if (isOnline && !GameState.isHost()) return false;
        SimultaneousTurns.prepareAiPlans();
        if (!SimultaneousTurns.allRequiredPlansSubmitted()) {
            this.clearPendingSimultaneousResolution();
            return false;
        }

        if (isOnline) {
            if (this.simultaneousResolveTimer) return true;
            const expectedSessionId = GameState.game.sessionId;
            const expectedTurn = GameState.game.currentTurn;
            this.simultaneousResolveTimer = setTimeout(() => {
                this.simultaneousResolveTimer = null;
                if (!Multiplayer.isOnline || !GameState.isHost()) return;
                if (!SimultaneousTurns.isPlanning()) return;
                if (GameState.game.sessionId !== expectedSessionId || GameState.game.currentTurn !== expectedTurn) return;
                SimultaneousTurns.prepareAiPlans();
                if (!SimultaneousTurns.allRequiredPlansSubmitted()) return;
                if (!SimultaneousTurns.resolveTurn(this)) return;
                GameState.notify();
                Multiplayer.pushGameState(true);
            }, 450);
            return true;
        }

        const resolved = SimultaneousTurns.resolveTurn(this);
        if (!resolved) return false;
        GameState.notify();
        return true;
    },

    cancelPlannedOrder(orderId) {
        if (!window.SimultaneousTurns || !SimultaneousTurns.removeOrder(orderId)) return;
        GameState.addLog('已撤销一道行军令。', 'system');
    },

    clearPlannedOrders() {
        if (!window.SimultaneousTurns || !SimultaneousTurns.clearOrders()) return;
        GameState.addLog('已清空本回合全部行军令。', 'system');
    },

    /**
     * 在"轮到本地玩家所控势力"时，为它做本回合一次的【完整结算】：
     * 金钱/PP 收入、首都补员、赤字逃兵、战争债券惩罚倒计、本势力部队可移动重置。
     * 关键点：每个客户端只结算自己的势力，且只在自己的回合内执行 —— 此刻它正是该势力地图的
     * 权威写入方，所以首都补员 / 逃兵这类【地图改动】在联机下不会被其他人的快照覆盖（之前正是
     * 因为这些改动会被覆盖，才只能给客人补金钱/PP，导致客人没有首都补员、不会赤字逃兵）。
     * 单机同理：轮到玩家时结算自己，AI 由 endTurn 收尾时统一结算。靠 lastSettledTurn 保证每回合一次。
     */
    maybeSettleLocalFactionOnTurnStart(auto = false) {
        if (!GameState.game || GameState.game.gameOver) return;
        const turn = GameState.game.currentTurn;
        if (turn <= 1) { GameState.game.lastSettledTurn = turn; return; } // 第 1 回合用初始资源，不结算
        const factionId = GameState.getPlayerFactionId();
        // 只在"轮到自己"时结算自己 —— 保证自己是当前地图的权威写入方。
        if (GameState.game.currentPlayerId !== factionId) return;
        if (GameState.game.lastSettledTurn === turn) return; // 本回合已结算
        GameState.game.lastSettledTurn = turn;
        if ((GameState.game.eliminatedFactions || []).includes(factionId)) return;

        const settlement = this.settleTurnStart(factionId);

        // 让本势力新回合补员 / 留存的部队恢复可移动（与单机一致；只动自己势力，不碰别人）。
        MapData.getFactionNodes(factionId).forEach(node => {
            node.moveReady = Math.max(0, node.troops);
            node.freshTroops = 0;
            node.movedThisTurn = false;
        });

        const debtText = settlement.debtPenalty.threshold > 0 ? `，赤字状态：${settlement.debtPenalty.label}` : '';
        const desertionText = settlement.debtDeserted > 0 ? `，财政崩溃逃散 ${settlement.debtDeserted} 步兵` : '';
        GameState.addLog(`${auto ? '计时结束' : '回合开始'}：第 ${turn} 回合，收入 $${formatMoney(settlement.income)}，维护 $${formatMoney(settlement.maintenance)}，金钱 ${formatSignedMoney(settlement.moneyDelta)}，余额 $${formatMoney(settlement.balance)}，获得 ${formatMoney(settlement.ppIncome)} PP${debtText}${desertionText}。`, 'system', false);
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
            const profile = window.GameAI
                ? GameAI.getDifficultyProfile(slot.aiDifficulty || 'normal', factionId)
                : { economyMultiplier: 1, ppMultiplier: 1 };
            if (window.GameAI && GameAI.settleAiTurnStart) {
                const settlement = GameAI.settleAiTurnStart(factionId, r, profile);
                if (settlement.debtPenalty.desertionRate > 0 && totals.totalTroops > 0) {
                    const targetDesertion = Math.max(
                        settlement.debtPenalty.minDesertion || 0,
                        Math.ceil(totals.totalTroops * settlement.debtPenalty.desertionRate)
                    );
                    const deserted = this.disbandTroopsForMaintenance(factionId, targetDesertion);
                    if (deserted > 0) {
                        GameState.addLog(`${GameState.getFactionName(factionId)} 财政崩溃，逃散 ${deserted} 支部队。`, 'system', false);
                    }
                }
            } else {
                const baseIncome = (totals.totalIndustry + 1) * (profile.economyMultiplier || 1);
                const maintenance = Math.max(0, totals.totalTroops * GameState.baseMaintenanceRate);
                r.money = r.money + baseIncome - maintenance;
                const debtPenalty = GameState.getDebtPenalty(r.money);
                const ppIncome = GameState.basePPIncome * (profile.ppMultiplier || 1);
                r.pp = Math.min(GameState.ppCap, Math.max(0, r.pp + ppIncome + debtPenalty.ppIncomeDelta));
                if (debtPenalty.desertionRate > 0 && totals.totalTroops > 0) {
                    const targetDesertion = Math.max(
                        debtPenalty.minDesertion || 0,
                        Math.ceil(totals.totalTroops * debtPenalty.desertionRate)
                    );
                    const deserted = this.disbandTroopsForMaintenance(factionId, targetDesertion);
                    if (deserted > 0) {
                        GameState.addLog(`${GameState.getFactionName(factionId)} 财政崩溃，逃散 ${deserted} 支部队。`, 'system', false);
                    }
                }
            }
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
        if (!this.canLocalPlayerAct()) return { enabled: false, reason: '计划已经提交，先撤回才能修改', ...actionMeta };
        if (completed.includes(focus.id)) return { enabled: false, reason: '国策已完成', ...actionMeta };
        if (GameState.isFocusBlockedByMutual(focus, completed)) return { enabled: false, reason: '互斥国策已完成', ...actionMeta };
        if (!GameState.isFocusStageOpen(focus)) return { enabled: false, reason: focus.notBeforeTurn && GameState.game.currentTurn < focus.notBeforeTurn ? `第 ${focus.notBeforeTurn} 回合开放` : '战斗期开放', ...actionMeta };
        if (!GameState.areFocusPrerequisitesMet(focus, completed)) return { enabled: false, reason: '前置国策未满足', ...actionMeta };
        if (!GameState.hasFocusTerritory(focus, playerFactionId)) return { enabled: false, reason: '需控制所列省区', ...actionMeta };
        if (resources.pp < actionMeta.ppCost) return { enabled: false, reason: `缺少 ${formatMoney(actionMeta.ppCost - resources.pp)} PP`, ...actionMeta };

        return { enabled: true, reason: '', focus, ...actionMeta };
    },

    selectFocus(focusId) {
        if (Date.now() - this.lastFocusDragEndedAt < 180) return;

        this.captureFocusTreeScroll();
        const viewFactionId = GameState.game.focusViewFactionId || GameState.getPlayerFactionId();
        if (viewFactionId === GameState.getPlayerFactionId()) {
            GameState.setSelectedFocus(focusId);
        } else if (GameState.getFocusById(focusId, viewFactionId)) {
            GameState.game.focusViewSelectedId = focusId;
            GameState.notify();
        }
    },

    jumpToCampaignFocus(focusId, overview = false) {
        const game = GameState.game;
        const playerFaction = GameState.getPlayerFactionId();
        const viewFaction = game.focusViewFactionId || playerFaction;
        const isPlayerView = viewFaction === playerFaction;
        focusId ||= (isPlayerView ? game.selectedFocusId : game.focusViewSelectedId) || GameState.getFocusTree(viewFaction)[0]?.id;
        if (!GameState.getFocusById(focusId, viewFaction)) return;
        if (isPlayerView) {
            GameState.setSelectedFocus(focusId, false);
        } else {
            game.focusViewSelectedId = focusId;
        }
        if (overview !== this.focusTreeOverview) game.focusTreeViewport = { scale: 1, autoFit: true };
        this.focusTreeOverview = overview;
        this.focusMobileFilter = 'all';
        this.focusTreeCentered = false;
        this.pendingFocusTreeScroll = null;
        this.focusTreeScroll = null;
        GameState.notify();
    },

    toggleFocusTreeOverview() {
        this.jumpToCampaignFocus(null, !this.focusTreeOverview);
    },

    toggleCampaignBranchView() {
        const game = GameState.game;
        const factionId = game.focusViewFactionId || GameState.getPlayerFactionId();
        const selectedId = factionId === GameState.getPlayerFactionId() ? game.selectedFocusId : game.focusViewSelectedId;
        const selected = GameState.getFocusById(selectedId, factionId) || GameState.getFocusTree(factionId)[0];
        if (!selected?.category) return;
        this.focusBranchOnly = !this.focusBranchOnly;
        game.focusTreeViewport = { scale: 1, autoFit: true };
        this.jumpToCampaignFocus(selected.id);
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
        if (effect.type === 'routeSettlement') {
            WestRussiaRouteActions.settlement(effect.id, factionId, GameState.getGameModifiers());
            return;
        }
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
                ['recruit', 'disband', 'move', 'build', 'focus'].forEach(action => {
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
            if (window.SimultaneousTurns && SimultaneousTurns.isPlanning()) {
                const effects = GameState.game.pendingWorldEffects || (GameState.game.pendingWorldEffects = []);
                effects.push({
                    id: `${factionId}-${GameState.game.currentTurn}-damage-${Date.now().toString(36)}`,
                    type: 'damageIndustry',
                    factionId,
                    nodeIds: enemies.map(node => node.id),
                    amount
                });
                if (enemies.length > 0) {
                    GameState.addLog(`已规划异变效应：回合末令 ${enemies.length} 个敌方节点工业 -${amount}。`, 'system', false);
                }
                return;
            }
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
            // AI 的意识形态切换由 GameAI 处理。
            if (effect.name) GameState.setFactionName(factionId, effect.name, effect.shortName);
            const playerFactionId = GameState.getPlayerFactionId();
            // 意识形态加成只对玩家自己持续生效
            if (factionId !== playerFactionId) return;
            const previousId = GameState.game.currentIdeology;
            if (previousId === newId && !effect.name) return;
            GameState.setCurrentIdeology(newId);
            const renameNote = effect.name ? `，国号定为「${effect.name}」` : '';
            GameState.addLog(`你的国策意识形态已转为「${next.name}」${renameNote}。`, 'system', false);
            return;
        }
    },

    executeRouteAction() {
        if (!this.canLocalPlayerAct()) return;
        const result = WestRussiaRouteActions.execute(GameState.getPlayerFactionId(), GameState.game.selectedNodeId);
        if (!result.ok && result.reason) GameState.addLog(result.reason, 'system', false);
        GameState.notify();
    },

    setDiplomacy(factionId, relation) {
        if (!GameState.game.diplomacy[factionId]) return;

        if (!this.canLocalPlayerAct()) {
            GameState.addLog(this.resolutionAnimation ? '统一结算回放期间不能调整外交。' : '计划已经准备，取消准备后才能调整外交。', 'system');
            return;
        }
        const faction = GameState.getFaction(factionId);
        GameState.game.diplomacy[factionId] = {
            relation,
            treaty: relation === '停战' ? '2 回合' : relation === '中立' ? '互不侵犯' : '无'
        };
        GameState.addLog(`外交广播：你对 ${GameState.getFactionName(faction.id)} 的关系调整为“${relation}”。`, 'diplomacy');
    },

    openFocusModal(factionId = GameState.getPlayerFactionId()) {
        const viewFactionId = factionId || GameState.getPlayerFactionId();
        const playerFactionId = GameState.getPlayerFactionId();
        const previousViewFactionId = GameState.game.focusViewFactionId || playerFactionId;
        GameState.game.focusViewFactionId = viewFactionId;

        if (!GameState.game.showFocusModal || previousViewFactionId !== viewFactionId) {
            // 每次（重新）打开都按视口自动适配，给出总览而不是 100% 打开后狂滑
            GameState.game.focusTreeViewport = { scale: 1, autoFit: true };
            this.focusTreeOverview = false;
            this.focusDetailCollapsed = Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
            this.focusTreeCentered = false;
            this.pendingFocusTreeScroll = null;
            this.focusTreeScroll = null;
        }

        const tree = GameState.getVisibleFocusTree(viewFactionId);
        if (viewFactionId === playerFactionId) {
            const selectedFocus = GameState.getFocusById(GameState.game.selectedFocusId, viewFactionId);
            if (!selectedFocus && tree.length) {
                GameState.game.selectedFocusId = tree[0].id;
            }
        } else {
            const selectedFocus = GameState.getFocusById(GameState.game.focusViewSelectedId, viewFactionId);
            if (!selectedFocus && tree.length) {
                GameState.game.focusViewSelectedId = tree[0].id;
            }
        }

        this.mobilePanel = null;
        GameState.toggleFocusModal(true);
    },

    toggleFocusDetailSheet(forceValue = null) {
        this.captureFocusTreeScroll();
        this.focusDetailCollapsed = forceValue === null ? !this.focusDetailCollapsed : Boolean(forceValue);
        GameState.notify();
    },

    openDiplomacyModal() {
        GameState.toggleDiplomacyModal(true);
    },

    openModifiersModal() {
        GameState.toggleModifiersModal(true);
    },

    openCampaignStory(entryId = null) {
        const entries = GameState.getCampaignStories();
        if (!entries.length) return;
        const game = GameState.game;
        const entry = entries.find(item => item.id === entryId)
            || entries.find(item => !game.readStoryIds.includes(item.id))
            || entries.find(item => item.id === game.selectedStoryId)
            || entries[0];
        GameState.closeModals(false);
        game.showStoryModal = true;
        if (game.winner) game.showEndGameModal = false;
        game.selectedStoryId = entry.id;
        if (!game.readStoryIds.includes(entry.id)) game.readStoryIds.push(entry.id);
        GameState.notify();
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

    setMapMode(mode) {
        GameState.game.hoveredNodeId = null;
        GameState.game.mapMode = mode;
        if (mode === 'list') GameState.game.currentAction = null;
        GameState.notify();
    },

    getFocusTreeScale() {
        const viewport = GameState.game.focusTreeViewport || { scale: 1 };
        return this.clampFocusTreeScale(Number(viewport.scale) || 1);
    },

    clampFocusTreeScale(scale) {
        return Math.min(1.45, Math.max(this.focusTreeOverview ? 0.02 : 0.1, Number(scale) || 1));
    },

    // 计算"打开即总览"的缩放：整棵树能放进视口就整体显示，否则按树高适配
    // （看完整一条竖线，过宽的树留给横向滚动）。绝不放大超过 100%，并保留可读下限。
    getFocusTreeFitScale() {
        const scroller = document.querySelector('.focus-tree-scroll');
        const canvas = document.querySelector('.focus-tree-canvas');
        if (!scroller || !canvas) return null;
        const vpW = scroller.clientWidth;
        const vpH = scroller.clientHeight;
        const baseW = Number(canvas.dataset.baseWidth) || canvas.offsetWidth;
        const baseH = Number(canvas.dataset.baseHeight) || canvas.offsetHeight;
        if (!vpW || !vpH || !baseW || !baseH) return null;
        const fitWhole = Math.min(vpW / baseW, vpH / baseH);
        if (this.focusTreeOverview) return Math.min(1, fitWhole * 0.98);
        if (canvas.classList.contains('focus-west-russia')) {
            if (vpW <= 760) {
                return this.focusBranchOnly ? Math.max(0.68, Math.min(0.95, fitWhole)) : 0.68;
            }
            return this.focusBranchOnly ? Math.max(0.74, Math.min(1, fitWhole)) : 0.82;
        }
        const scale = fitWhole >= 0.5 ? fitWhole : (vpH / baseH) * 0.98;
        const minimum = canvas.dataset.campaignTree ? (this.focusBranchOnly ? 0.62 : 0.48) : 0.25;
        return Math.max(minimum, Math.min(1, scale));
    },

    setFocusTreeScale(scale) {
        GameState.game.focusTreeViewport = GameState.game.focusTreeViewport || { scale: 1 };
        GameState.game.focusTreeViewport.scale = this.clampFocusTreeScale(scale);
        // 用户手动缩放后关闭自动适配，保留其缩放
        GameState.game.focusTreeViewport.autoFit = false;
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
        canvas.style.setProperty('--focus-zoom-inverse', 1 / scale);
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

    alignFocusTree(centerVertically = false) {
        const scroller = document.querySelector('.focus-tree-scroll');
        if (!scroller) {
            this.focusTreeCentered = false;
            return;
        }

        // 自动适配：未被用户手动缩放时，按视口算一个总览缩放（修复手机端 100% 打开狂滑）
        const viewport = GameState.game.focusTreeViewport || (GameState.game.focusTreeViewport = { scale: 1 });
        if (viewport.autoFit) {
            const fit = this.getFocusTreeFitScale();
            if (fit != null) viewport.scale = fit;
        }

        this.applyFocusTreeTransform();
        if (this.focusTreeOverview) return;

        if (this.pendingFocusTreeScroll) {
            scroller.scrollLeft = this.pendingFocusTreeScroll.left;
            scroller.scrollTop = this.pendingFocusTreeScroll.top;
            this.focusTreeScroll = { left: scroller.scrollLeft, top: scroller.scrollTop };
            this.pendingFocusTreeScroll = null;
            return;
        }

        // 已经居中过：每次重渲染都会重建 modal DOM、把新 scroller 的滚动清零，
        // 这里必须把上次记录的滚动位置还原回去 —— 否则联机远端更新、日志刷新等
        // “非用户触发”的重渲染会让国策树跳回左上角。
        if (this.focusTreeCentered) {
            if (this.focusTreeScroll) {
                scroller.scrollLeft = this.focusTreeScroll.left;
                scroller.scrollTop = this.focusTreeScroll.top;
            }
            return;
        }

        const rootCard = scroller.querySelector('.focus-card.selected') || scroller.querySelector('.focus-card');
        if (!rootCard) return;

        const scale = this.getFocusTreeScale();
        scroller.scrollLeft = Math.max(0, (rootCard.offsetLeft + rootCard.offsetWidth / 2) * scale - scroller.clientWidth / 2);
        const offsetY = centerVertically ? (scroller.clientHeight - rootCard.offsetHeight * scale) / 2 : 30;
        scroller.scrollTop = GameState.getScenario().preparationTurns
            ? Math.max(0, rootCard.offsetTop * scale - offsetY) : 0;
        this.focusTreeScroll = { left: scroller.scrollLeft, top: scroller.scrollTop };
        this.focusTreeCentered = true;
    },

    getFocusTreeTouchPair() {
        const points = Array.from(this.focusTreePointers.values());
        return points.length >= 2 ? [points[0], points[1]] : null;
    },

    startFocusTreeTouchGesture(scroller) {
        const pair = this.getFocusTreeTouchPair();
        if (!pair) return;

        const [first, second] = pair;
        const rect = scroller.getBoundingClientRect();
        const center = this.getPointerMidpoint(first, second);
        const scale = this.getFocusTreeScale();
        this.focusTreeTouchGesture = {
            scale,
            distance: Math.max(12, this.getPointerDistance(first, second)),
            contentX: (scroller.scrollLeft + center.clientX - rect.left) / scale,
            contentY: (scroller.scrollTop + center.clientY - rect.top) / scale
        };
        this.focusTreeDrag = null;
        scroller.classList.add('is-panning');
    },

    updateFocusTreeTouchGesture(scroller) {
        const pair = this.getFocusTreeTouchPair();
        if (!pair) return;
        if (!this.focusTreeTouchGesture) this.startFocusTreeTouchGesture(scroller);
        if (!this.focusTreeTouchGesture) return;

        const [first, second] = pair;
        const rect = scroller.getBoundingClientRect();
        const center = this.getPointerMidpoint(first, second);
        const currentDistance = Math.max(12, this.getPointerDistance(first, second));
        const nextScale = this.clampFocusTreeScale(this.focusTreeTouchGesture.scale * (currentDistance / this.focusTreeTouchGesture.distance));

        this.setFocusTreeScale(nextScale);
        scroller.scrollLeft = this.focusTreeTouchGesture.contentX * nextScale - (center.clientX - rect.left);
        scroller.scrollTop = this.focusTreeTouchGesture.contentY * nextScale - (center.clientY - rect.top);
    },

    attachFocusTreeInteraction() {
        this.focusTreeResizeObserver?.disconnect();
        this.focusTreeResizeObserver = null;
        const scroller = document.querySelector('.focus-tree-scroll');
        if (!scroller) return;
        if (this.focusTreeOverview) {
            // The overview cannot pan, so it must remain fitted when its actual
            // viewport changes. Rebind after render and release on modal close.
            if (typeof ResizeObserver === 'function') {
                this.focusTreeResizeObserver = new ResizeObserver(() => {
                    if (scroller.isConnected && this.focusTreeOverview) this.alignFocusTree();
                });
                this.focusTreeResizeObserver.observe(scroller);
            }
            return;
        }

        this.applyFocusTreeTransform();
        this.focusTreePointers = new Map();
        this.focusTreeTouchGesture = null;

        // 记录当前滚动位置，供重渲染后还原（拖动 / 滚轮缩放 / 滚动条都会触发）。
        scroller.addEventListener('scroll', () => {
            this.focusTreeScroll = { left: scroller.scrollLeft, top: scroller.scrollTop };
        });

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
            if (event.pointerType === 'touch') {
                if (event.target.closest('.focus-detail-panel')) return;
                this.focusTreePointers.set(event.pointerId, {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY
                });
                if (this.focusTreePointers.size >= 2) {
                    scroller.setPointerCapture(event.pointerId);
                    this.startFocusTreeTouchGesture(scroller);
                    event.preventDefault();
                    return;
                }

                if (event.target.closest('button')) return;
            }

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
            if (event.pointerType === 'touch' && this.focusTreePointers.has(event.pointerId)) {
                this.focusTreePointers.set(event.pointerId, {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY
                });

                if (this.focusTreePointers.size >= 2) {
                    this.updateFocusTreeTouchGesture(scroller);
                    event.preventDefault();
                    return;
                }
            }

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
            if (event.pointerType === 'touch') {
                const wasPinching = Boolean(this.focusTreeTouchGesture);
                this.focusTreePointers.delete(event.pointerId);
                if (this.focusTreePointers.size < 2) {
                    if (wasPinching) this.lastFocusDragEndedAt = Date.now();
                    this.focusTreeTouchGesture = null;
                    scroller.classList.remove('is-panning');
                }
            }

            if (!this.focusTreeDrag || this.focusTreeDrag.pointerId !== event.pointerId) return;
            if (this.focusTreeDrag.moved) {
                this.lastFocusDragEndedAt = Date.now();
            }
            this.focusTreeDrag = null;
            scroller.classList.remove('is-panning');
        };

        scroller.addEventListener('pointerup', stopDrag);
        scroller.addEventListener('pointercancel', stopDrag);
        scroller.addEventListener('lostpointercapture', stopDrag);
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
        // "居中"按钮：回到自动总览缩放并重新居中
        GameState.game.focusTreeViewport = { scale: 1, autoFit: true };
        this.focusTreeCentered = false;
        this.alignFocusTree(true);
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

    mapPoint(svg, clientX, clientY) {
        return new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse());
    },

    resizeMap(width, anchor, position = anchor) {
        const viewport = GameState.game.mapViewport;
        const overviewWidth = GameState.getMapOverview().width;
        const nextWidth = Math.min(overviewWidth * 1.3, Math.max(overviewWidth * 0.22, width));
        const scale = nextWidth / viewport.width;
        viewport.x = anchor.x - (position.x - viewport.x) * scale;
        viewport.y = anchor.y - (position.y - viewport.y) * scale;
        viewport.width = nextWidth;
        viewport.height *= scale;
    },

    attachMapInteraction() {
        const svg = document.getElementById('svg-map');
        if (!svg) return;

        const pointers = new Map();
        let drag = null;
        let pinch = null;
        let suppressClick = false;
        const provinceId = target => target.closest('[data-province-id]')?.dataset.provinceId;
        const pinchGeometry = () => {
            const [a, b] = pointers.values();
            return { center: this.getPointerMidpoint(a, b), distance: Math.max(12, this.getPointerDistance(a, b)) };
        };

        svg.addEventListener('wheel', event => {
            event.preventDefault();
            this.zoomMap(event.deltaY > 0 ? 1.12 : 0.89, event);
        }, { passive: false });

        svg.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            suppressClick = false;
            if (event.pointerType === 'touch') {
                pointers.set(event.pointerId, event);
                if (pointers.size >= 2) {
                    const { center, distance } = pinchGeometry();
                    pinch = {
                        anchor: this.mapPoint(svg, center.clientX, center.clientY),
                        distance,
                        width: GameState.game.mapViewport.width
                    };
                    drag = null;
                    suppressClick = true;
                    for (const id of pointers.keys()) svg.setPointerCapture(id);
                    return;
                }
            }
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        });

        svg.addEventListener('pointermove', event => {
            if (pointers.has(event.pointerId)) pointers.set(event.pointerId, event);
            if (pinch && pointers.size >= 2) {
                const { center, distance } = pinchGeometry();
                this.resizeMap(pinch.width * pinch.distance / distance, pinch.anchor,
                    this.mapPoint(svg, center.clientX, center.clientY));
                this.updateSvgViewBox(svg);
                return;
            }
            if (drag?.id !== event.pointerId) return;
            if (!suppressClick) {
                if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
                suppressClick = true;
                svg.setPointerCapture(event.pointerId);
                this.hoverNode(null);
            }
            const previous = this.mapPoint(svg, drag.x, drag.y);
            const current = this.mapPoint(svg, event.clientX, event.clientY);
            const viewport = GameState.game.mapViewport;
            viewport.x += previous.x - current.x;
            viewport.y += previous.y - current.y;
            drag.x = event.clientX;
            drag.y = event.clientY;
            this.updateSvgViewBox(svg);
        });

        const stop = event => {
            pointers.delete(event.pointerId);
            if (pointers.size < 2) pinch = null;
            if (drag?.id === event.pointerId) drag = null;
        };
        svg.addEventListener('pointerup', stop);
        svg.addEventListener('pointercancel', stop);
        svg.addEventListener('lostpointercapture', event => {
            if (!svg.hasPointerCapture(event.pointerId) && event.target === svg) stop(event);
        });
        svg.addEventListener('pointerover', event => {
            if (event.pointerType === 'mouse' && !suppressClick) this.hoverNode(provinceId(event.target) || null);
        });
        svg.addEventListener('pointerleave', () => {
            if (!suppressClick) drag = null;
            this.hoverNode(null);
        });
        svg.addEventListener('click', event => {
            const id = provinceId(event.target);
            if (!suppressClick && id) this.handleNodeClick(id);
            suppressClick = false;
        });
        svg.addEventListener('contextmenu', event => {
            const id = provinceId(event.target);
            if (!id) return;
            event.preventDefault();
            this.openProvinceOrder(id);
        });
        svg.addEventListener('keydown', event => {
            const id = provinceId(event.target);
            if (!id || (event.key !== 'Enter' && event.key !== ' ')) return;
            event.preventDefault();
            this.handleNodeClick(id);
        });
    },

    zoomMap(factor, pointer = null) {
        const svg = document.getElementById('svg-map');
        if (!svg) return;
        const viewport = GameState.game.mapViewport;
        const anchor = pointer
            ? this.mapPoint(svg, pointer.clientX, pointer.clientY)
            : { x: viewport.x + viewport.width / 2, y: viewport.y + viewport.height / 2 };
        this.resizeMap(viewport.width * factor, anchor);
        this.updateSvgViewBox(svg);
    },

    resetMapViewport() {
        GameState.game.mapViewport = GameState.getMapOverview();
        GameState.notify();
    },

    centerNode(nodeId) {
        const node = MapData.getNode(nodeId);
        if (!node) return;

        const viewport = GameState.game.mapViewport;
        const scale = Math.min(1, GameState.getMapOverview().width * 0.41 / viewport.width);
        viewport.width *= scale;
        viewport.height *= scale;
        viewport.x = node.x - viewport.width / 2;
        viewport.y = node.y - viewport.height / 2;
        this.updateSvgViewBox(document.getElementById('svg-map'));
    },

    updateSvgViewBox(svg) {
        if (!svg) return;
        const viewport = GameState.game.mapViewport;
        svg.setAttribute('viewBox', `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`);
        if (typeof MapView !== 'undefined' && MapView.applyTerritoryZoom) MapView.applyTerritoryZoom(svg);
    }
};

window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());
