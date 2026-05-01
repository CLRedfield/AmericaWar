/**
 * Firebase 联机模块。负责：
 *  - 创建 / 加入 / 离开房间
 *  - 房间设置 + slots 双向同步
 *  - 游戏状态（GameState.game + MapData.nodes）增量同步
 *
 * 数据结构（Firebase RTDB）：
 *   rooms/{roomCode}/
 *     meta: { hostId, createdAt, lastUpdate, mode: 'online' }
 *     lobby: { settings, slots[], chat[] }
 *     state: { turn, currentPlayerId, turnOrder, game (snapshot), map (snapshot) }
 *
 * 房主有最终写权（添加 AI、踢人、写入完整 state）。其他玩家只在轮到自己时写自己的 game state。
 * 所有人都订阅 lobby + state，本地 GameState 自动同步。
 */
const Multiplayer = {
    isOnline: false,
    isHost: false,
    db: null,
    roomRef: null,
    listeners: [],
    suppressLocalSync: false,
    pendingPushTimeout: null,

    /**
     * 生成 6 位房间码，由大写字母组成。
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },

    async ensureFirebase() {
        if (!window.ensureFirebaseReady) throw new Error('Firebase 未加载');
        const user = await window.ensureFirebaseReady();
        this.db = window.database;
        return user;
    },

    /**
     * 创建联机房间。设当前用户为房主，本地 lobby 切换到 online 模式。
     */
    async createRoom(playerName) {
        const user = await this.ensureFirebase();
        const userId = user.uid;
        const cleanName = String(playerName || '').trim() || `指挥官-${userId.slice(-4)}`;

        const code = this.generateRoomCode();
        const ref = this.db.ref(`rooms/${code}`);
        // 先检查是否冲突（不太可能，但简单 retry 一次）
        const snap = await ref.get();
        if (snap.exists()) return this.createRoom(playerName);

        GameState.lobby = {
            roomCode: code,
            mode: 'online',
            hostId: userId,
            myUserId: userId,
            myName: cleanName,
            ready: false,
            connecting: false,
            statusMessage: '已创建房间，等待玩家加入。',
            settings: {
                maxPlayers: '8',
                mapScale: '标准',
                turnLimit: '180',
                victory: '统一',
                diplomacy: true,
                ai: true
            },
            slots: GameState.createDefaultSlots(),
            chat: [
                { author: '系统', text: `房间 ${code} 已创建。` }
            ]
        };
        // 房主默认坐 USA 席位
        const usa = GameState.lobby.slots[0];
        usa.kind = 'human';
        usa.userId = userId;
        usa.playerName = cleanName;

        await ref.set({
            meta: {
                hostId: userId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                mode: 'online'
            },
            lobby: this.serializeLobby()
        });

        this.attachRoomListeners(code, userId, /* asHost */ true);
        GameState.notify();
        return code;
    },

    /**
     * 通过房间码加入房间。
     */
    async joinRoom(rawCode, playerName) {
        const user = await this.ensureFirebase();
        const userId = user.uid;
        const code = String(rawCode || '').trim().toUpperCase();
        if (!code) throw new Error('请填写房间码');
        const cleanName = String(playerName || '').trim() || `指挥官-${userId.slice(-4)}`;

        const ref = this.db.ref(`rooms/${code}`);
        const snap = await ref.get();
        if (!snap.exists()) throw new Error(`房间 ${code} 不存在`);

        const data = snap.val();
        const lobby = data.lobby || {};
        const slots = (lobby.slots || []).map(slot => ({ ...slot }));

        // 如果我已在某个槽位上（重连），保留；否则坐第一个空席
        let mySlot = slots.find(s => s.userId === userId);
        if (!mySlot) {
            mySlot = slots.find(s => s.kind === 'open');
            if (!mySlot) throw new Error('房间没有空席位了');
            mySlot.kind = 'human';
            mySlot.userId = userId;
            mySlot.playerName = cleanName;
        } else {
            mySlot.kind = 'human';
            mySlot.playerName = cleanName;
        }

        GameState.lobby = {
            roomCode: code,
            mode: 'online',
            hostId: data.meta?.hostId || lobby.hostId || userId,
            myUserId: userId,
            myName: cleanName,
            ready: false,
            connecting: false,
            statusMessage: '已加入房间。',
            settings: lobby.settings || {
                maxPlayers: '8',
                mapScale: '标准',
                turnLimit: '180',
                victory: '统一',
                diplomacy: true,
                ai: true
            },
            slots,
            chat: [
                ...((lobby.chat || []).slice(0, 30)),
                { author: '系统', text: `${cleanName} 加入了房间。`, ts: Date.now() }
            ]
        };

        // 把自己坐席位的修改写回
        await ref.child('lobby').set(this.serializeLobby());

        const isHost = userId === GameState.lobby.hostId;
        this.attachRoomListeners(code, userId, isHost);
        GameState.notify();
        return code;
    },

    /**
     * 订阅 lobby + state 变化。
     */
    attachRoomListeners(code, userId, asHost) {
        this.detachRoomListeners();
        this.isOnline = true;
        this.isHost = asHost;
        this.roomRef = this.db.ref(`rooms/${code}`);

        const lobbyRef = this.roomRef.child('lobby');
        const stateRef = this.roomRef.child('state');

        const onLobby = lobbyRef.on('value', snap => {
            if (this.suppressLocalSync) return;
            const remote = snap.val();
            if (!remote) return;
            this.suppressLocalSync = true;
            this.applyLobbyFromRemote(remote);
            this.suppressLocalSync = false;
        });

        const onState = stateRef.on('value', snap => {
            const remote = snap.val();
            if (!remote) return;
            this.suppressLocalSync = true;
            this.applyStateFromRemote(remote);
            this.suppressLocalSync = false;
        });

        this.listeners = [
            { ref: lobbyRef, type: 'value', handler: onLobby },
            { ref: stateRef, type: 'value', handler: onState }
        ];
    },

    detachRoomListeners() {
        this.listeners.forEach(({ ref, type, handler }) => ref.off(type, handler));
        this.listeners = [];
        this.roomRef = null;
        this.isOnline = false;
        this.isHost = false;
    },

    /**
     * 把当前 lobby（settings/slots/chat/hostId）push 到 Firebase。
     */
    pushLobby() {
        if (!this.isOnline || this.suppressLocalSync) return;
        if (!this.roomRef) return;
        this.roomRef.child('lobby').set(this.serializeLobby());
    },

    /**
     * 序列化游戏状态（地图节点 + game 字段）以便 push。
     * 注意 game 中很多字段是 UI-only（actionConfirm, hoveredNodeId, focusTreeViewport 等），不需要同步。
     */
    pushGameState() {
        if (!this.isOnline || this.suppressLocalSync) return;
        if (!this.roomRef) return;
        if (!window.MapData) return;

        // 节流：100ms 内多次写合并
        if (this.pendingPushTimeout) clearTimeout(this.pendingPushTimeout);
        this.pendingPushTimeout = setTimeout(() => {
            this.pendingPushTimeout = null;
            const payload = {
                turn: GameState.game.currentTurn,
                currentPlayerId: GameState.game.currentPlayerId,
                turnOrder: GameState.game.turnOrder || [],
                actionCountThisTurn: GameState.game.actionCountThisTurn,
                completedFocuses: GameState.game.completedFocuses || [],
                focusProgress: GameState.game.focusProgress || {},
                currentCapitals: GameState.game.currentCapitals || {},
                eliminatedFactions: GameState.game.eliminatedFactions || [],
                aiResources: GameState.game.aiResources || {},
                aiModifiers: GameState.game.aiModifiers || {},
                aiIdeologies: GameState.game.aiIdeologies || {},
                aiFreeFocusTurns: GameState.game.aiFreeFocusTurns || {},
                gameOver: !!GameState.game.gameOver,
                modifiers: GameState.game.modifiers || {},
                nodeIndustryCaps: GameState.game.nodeIndustryCaps || {},
                map: MapData.nodes.map(node => ({
                    id: node.id,
                    factionId: node.factionId,
                    troops: node.troops,
                    industry: node.industry,
                    moveReady: node.moveReady,
                    freshTroops: node.freshTroops || 0,
                    movedThisTurn: !!node.movedThisTurn
                })),
                lastUpdate: Date.now()
            };
            this.roomRef.child('state').set(payload);
        }, 80);
    },

    serializeLobby() {
        const lobby = GameState.lobby;
        return {
            settings: lobby.settings,
            slots: lobby.slots.map(slot => ({
                factionId: slot.factionId,
                kind: slot.kind,
                userId: slot.userId || null,
                playerName: slot.playerName || '',
                aiDifficulty: slot.aiDifficulty || 'normal'
            })),
            chat: (lobby.chat || []).slice(0, 60),
            hostId: lobby.hostId
        };
    },

    applyLobbyFromRemote(remote) {
        if (!remote) return;
        const myUserId = GameState.lobby.myUserId;
        const myName = GameState.lobby.myName;
        const roomCode = GameState.lobby.roomCode;
        GameState.lobby = {
            ...GameState.lobby,
            roomCode,
            mode: 'online',
            hostId: remote.hostId || GameState.lobby.hostId,
            myUserId,
            myName,
            settings: remote.settings || GameState.lobby.settings,
            slots: (remote.slots || []).map(slot => ({ ...slot })),
            chat: (remote.chat || []).slice()
        };
        GameState.notify();
    },

    applyStateFromRemote(remote) {
        if (!remote || !window.MapData) return;
        // 把 game 关键字段刷新
        GameState.game.currentTurn = remote.turn;
        GameState.game.currentPlayerId = remote.currentPlayerId;
        GameState.game.turnOrder = remote.turnOrder || GameState.game.turnOrder || [];
        GameState.game.actionCountThisTurn = remote.actionCountThisTurn || 0;
        GameState.game.completedFocuses = remote.completedFocuses || [];
        GameState.game.focusProgress = remote.focusProgress || {};
        GameState.game.currentCapitals = remote.currentCapitals || {};
        GameState.game.eliminatedFactions = remote.eliminatedFactions || [];
        GameState.game.aiResources = remote.aiResources || {};
        GameState.game.aiModifiers = remote.aiModifiers || {};
        GameState.game.aiIdeologies = remote.aiIdeologies || {};
        GameState.game.aiFreeFocusTurns = remote.aiFreeFocusTurns || {};
        GameState.game.gameOver = !!remote.gameOver;
        if (remote.modifiers) GameState.game.modifiers = remote.modifiers;
        if (remote.nodeIndustryCaps) GameState.game.nodeIndustryCaps = remote.nodeIndustryCaps;

        // 同步地图
        if (Array.isArray(remote.map)) {
            const byId = {};
            remote.map.forEach(entry => { byId[entry.id] = entry; });
            MapData.nodes.forEach(node => {
                const remoteNode = byId[node.id];
                if (!remoteNode) return;
                node.factionId = remoteNode.factionId;
                node.troops = remoteNode.troops;
                node.industry = remoteNode.industry;
                node.moveReady = remoteNode.moveReady;
                node.freshTroops = remoteNode.freshTroops || 0;
                node.movedThisTurn = !!remoteNode.movedThisTurn;
            });
        }

        // 切换视图：如果状态在 online 且尚未进入 game-page，自动跳过去
        if (GameState.currentView !== 'game-page' && remote.turn) {
            GameState.currentView = 'game-page';
        }
        GameState.notify();
    },

    /**
     * 离开房间。如果是房主，清空房间数据；否则只把自己槽位变 open。
     */
    async leaveRoom() {
        if (!this.isOnline || !this.roomRef) {
            this.detachRoomListeners();
            return;
        }
        const userId = GameState.lobby.myUserId;
        try {
            if (this.isHost) {
                await this.roomRef.remove();
            } else {
                const snap = await this.roomRef.child('lobby').get();
                const remote = snap.val() || {};
                const slots = (remote.slots || []).map(s => (
                    s.userId === userId
                        ? { ...s, kind: 'open', userId: null, playerName: '' }
                        : s
                ));
                await this.roomRef.child('lobby').set({
                    ...remote,
                    slots,
                    chat: [
                        ...((remote.chat || []).slice(0, 30)),
                        { author: '系统', text: `${GameState.lobby.myName} 离开了房间。`, ts: Date.now() }
                    ]
                });
            }
        } catch (err) {
            console.warn('leaveRoom error', err);
        }
        this.detachRoomListeners();
    }
};

window.Multiplayer = Multiplayer;
