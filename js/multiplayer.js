/**
 * 联机模块。支持两种「传输后端」（transport）：
 *  - firebase：默认后端，走 Firebase RTDB。功能完整，但在中国大陆通常【需要翻墙】。
 *  - emqx：走公共 MQTT 服务器（默认 EMQX 公共 broker，免翻墙）。用「保留消息(retained)」
 *          模拟数据库快照——新加入者订阅后会立即收到房间最新的 lobby / state。
 *
 * 上层逻辑（创建/加入/离开房间、lobby+state 双向同步、GameState 映射）对后端无感，
 * 只通过下面的 transport 适配器接口收发数据：
 *
 *   transport.connect(config) -> { userId }
 *   transport.openRoom(code)  -> roomHandle
 *   roomHandle:
 *     canCheckExistence: bool                 // 创建房间时是否做撞码检查
 *     async exists() -> bool
 *     async readAll() -> { meta, lobby, state } | null
 *     async writeRoot({ meta, lobby })
 *     async writeLobby(lobby)
 *     async readLobby() -> lobby | null
 *     async writeState(state)
 *     onLobby(cb)  // 订阅 lobby 变化，cb(lobbyObj|null)
 *     onState(cb)  // 订阅 state 变化，cb(stateObj|null)
 *     detach()     // 取消本房间的全部订阅
 *     async remove()
 *
 * 数据结构（两种后端一致）：
 *   meta:  { hostId, createdAt, mode:'online', transport }
 *   lobby: { settings, slots[], chat[], hostId }
 *   state: { turn, currentPlayerId, turnOrder, game 快照, map 快照 }
 *
 * 房主有最终写权（添加 AI、踢人、写入完整 state）。其他玩家只在轮到自己时写自己的 game state。
 * 同步模型：last-writer-wins（最后写入者覆盖）。
 */

/* ============================ Firebase 后端 ============================ */
const FirebaseTransport = {
    name: 'firebase',
    label: 'Firebase 默认房间',
    db: null,

    async connect() {
        if (!window.ensureFirebaseReady) throw new Error('Firebase 未加载');
        const user = await window.ensureFirebaseReady();
        this.db = window.database;
        return { userId: user.uid };
    },

    openRoom(code) {
        const ref = this.db.ref(`rooms/${code}`);
        const subs = []; // [{ child, handler }]
        return {
            canCheckExistence: true,
            async exists() {
                const snap = await ref.get();
                return snap.exists();
            },
            async readAll() {
                const snap = await ref.get();
                return snap.exists() ? snap.val() : null;
            },
            async writeRoot(data) {
                await ref.set(data);
            },
            async writeLobby(lobby) {
                await ref.child('lobby').set(lobby);
            },
            async readLobby() {
                const snap = await ref.child('lobby').get();
                return snap.val();
            },
            async writeState(state) {
                await ref.child('state').set(state);
            },
            onLobby(cb) {
                const handler = ref.child('lobby').on('value', snap => cb(snap.val()));
                subs.push({ child: 'lobby', handler });
            },
            onState(cb) {
                const handler = ref.child('state').on('value', snap => cb(snap.val()));
                subs.push({ child: 'state', handler });
            },
            detach() {
                subs.forEach(({ child, handler }) => ref.child(child).off('value', handler));
                subs.length = 0;
            },
            async remove() {
                await ref.remove();
            }
        };
    }
};

/* ============================ EMQX / MQTT 后端 ============================ */

// 懒加载 mqtt.js（只有真正用到 EMQX 时才加载）。本地 vendor 副本优先（免翻墙 / 离线可用），
// 失败再回退到公共 CDN。
let _mqttLibPromise = null;
function loadMqttLib() {
    if (window.mqtt) return Promise.resolve(window.mqtt);
    if (_mqttLibPromise) return _mqttLibPromise;
    const sources = [
        'js/vendor/mqtt.min.js',
        'https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js',
        'https://unpkg.com/mqtt@5/dist/mqtt.min.js'
    ];
    _mqttLibPromise = new Promise((resolve, reject) => {
        let i = 0;
        const tryNext = () => {
            if (i >= sources.length) {
                _mqttLibPromise = null;
                return reject(new Error('无法加载 MQTT 库（请检查网络）'));
            }
            const script = document.createElement('script');
            script.src = sources[i++];
            script.async = true;
            script.onload = () => (window.mqtt ? resolve(window.mqtt) : tryNext());
            script.onerror = tryNext;
            document.head.appendChild(script);
        };
        tryNext();
    });
    return _mqttLibPromise;
}

// 本地持久的玩家 ID（EMQX 没有匿名登录，自己生成并存 localStorage）。
function emqxUserId() {
    let id = null;
    try { id = localStorage.getItem('ss_emqx_uid'); } catch (e) { /* 隐私模式等 */ }
    if (!id) {
        id = 'u' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
        try { localStorage.setItem('ss_emqx_uid', id); } catch (e) { /* ignore */ }
    }
    return id;
}

const EmqxTransport = {
    name: 'emqx',
    label: 'EMQX 公共服务器（免翻墙）',
    DEFAULT_SERVER: 'wss://broker.emqx.io:8084/mqtt',
    TOPIC_BASE: 'shatteredstates/v1',

    client: null,
    server: null,
    topicHandlers: null, // Map<topic, Set<cb>>
    retainedCache: null,  // Map<topic, parsedValue>

    async connect(config = {}) {
        const server = String(config.server || '').trim() || this.DEFAULT_SERVER;
        const mqtt = await loadMqttLib();
        const userId = emqxUserId();

        // 复用已有连接（同一服务器且在线）
        if (this.client && this.server === server && this.client.connected) {
            return { userId };
        }
        if (this.client) {
            try { this.client.end(true); } catch (e) { /* ignore */ }
            this.client = null;
        }

        this.server = server;
        this.topicHandlers = new Map();
        this.retainedCache = new Map();

        await new Promise((resolve, reject) => {
            let settled = false;
            const client = mqtt.connect(server, {
                clientId: 'ss-' + userId + '-' + Math.random().toString(36).slice(2, 8),
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 8000,
                keepalive: 30
            });
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                try { client.end(true); } catch (e) { /* ignore */ }
                reject(new Error('连接 EMQX 超时，请检查服务器地址或网络'));
            }, 9000);
            client.on('connect', () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                this.client = client;
                resolve();
            });
            client.on('error', err => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                try { client.end(true); } catch (e) { /* ignore */ }
                reject(err instanceof Error ? err : new Error('MQTT 连接错误'));
            });
            client.on('message', (topic, payload) => this._dispatch(topic, payload));
        });

        return { userId };
    },

    _dispatch(topic, payload) {
        let value = null;
        const text = payload && payload.length ? payload.toString() : '';
        if (text) {
            try { value = JSON.parse(text); } catch (e) { value = null; }
        }
        this.retainedCache.set(topic, value);
        const set = this.topicHandlers.get(topic);
        if (set) set.forEach(cb => { try { cb(value); } catch (e) { console.warn('mqtt handler', e); } });
    },

    _subscribe(topic, cb) {
        let set = this.topicHandlers.get(topic);
        const isNewTopic = !set;
        if (!set) {
            set = new Set();
            this.topicHandlers.set(topic, set);
            if (this.client) this.client.subscribe(topic, { qos: 1 });
        }
        set.add(cb);
        // 对【已订阅】的主题，broker 不会再补发保留消息——把缓存值补给新回调。
        // 对全新订阅，broker 会自己投递保留消息，避免重复就不从缓存补。
        if (!isNewTopic && this.retainedCache.has(topic)) {
            const v = this.retainedCache.get(topic);
            if (v != null) setTimeout(() => cb(v), 0);
        }
        return () => {
            const s = this.topicHandlers.get(topic);
            if (!s) return;
            s.delete(cb);
            if (s.size === 0) {
                this.topicHandlers.delete(topic);
                if (this.client) { try { this.client.unsubscribe(topic); } catch (e) { /* ignore */ } }
            }
        };
    },

    _publish(topic, value) {
        if (!this.client) return;
        this.client.publish(topic, JSON.stringify(value), { qos: 1, retain: true });
    },

    _clearRetained(topic) {
        if (!this.client) return;
        // 空载荷 + retain 用于清除保留消息
        this.client.publish(topic, '', { qos: 1, retain: true });
    },

    // 一次性读取某主题的保留消息：订阅 → 等首条消息（或超时）→ 退订。
    _readRetained(topic, timeoutMs = 3500) {
        return new Promise(resolve => {
            let done = false;
            let unsub = () => {};
            const finish = v => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                unsub();
                resolve(v);
            };
            const timer = setTimeout(() => {
                finish(this.retainedCache.has(topic) ? this.retainedCache.get(topic) : null);
            }, timeoutMs);
            unsub = this._subscribe(topic, v => finish(v));
        });
    },

    openRoom(code) {
        const base = `${this.TOPIC_BASE}/${code}`;
        const T = { lobby: `${base}/lobby`, state: `${base}/state`, meta: `${base}/meta` };
        const self = this;
        const unsubs = [];
        return {
            // 房码空间 30^6 ≈ 7.3 亿，撞码概率可忽略；而 MQTT 确认「不存在」要等超时，
            // 太慢，所以创建房间时不做撞码检查。
            canCheckExistence: false,
            async exists() {
                const lobby = await self._readRetained(T.lobby, 2500);
                return !!lobby;
            },
            async readAll() {
                const [meta, lobby, state] = await Promise.all([
                    self._readRetained(T.meta, 3500),
                    self._readRetained(T.lobby, 3500),
                    self._readRetained(T.state, 1500)
                ]);
                if (!lobby && !meta) return null;
                return { meta, lobby, state };
            },
            async writeRoot(data) {
                if (data && data.meta) self._publish(T.meta, data.meta);
                if (data && data.lobby) self._publish(T.lobby, data.lobby);
            },
            async writeLobby(lobby) {
                self._publish(T.lobby, lobby);
            },
            async readLobby() {
                return self._readRetained(T.lobby, 3000);
            },
            async writeState(state) {
                self._publish(T.state, state);
            },
            onLobby(cb) {
                unsubs.push(self._subscribe(T.lobby, cb));
            },
            onState(cb) {
                unsubs.push(self._subscribe(T.state, cb));
            },
            detach() {
                unsubs.forEach(u => { try { u(); } catch (e) { /* ignore */ } });
                unsubs.length = 0;
            },
            async remove() {
                self._clearRetained(T.meta);
                self._clearRetained(T.lobby);
                self._clearRetained(T.state);
            }
        };
    }
};

const Transports = {
    firebase: FirebaseTransport,
    emqx: EmqxTransport
};

/* ============================ 上层联机逻辑 ============================ */
const Multiplayer = {
    isOnline: false,
    isHost: false,
    transportName: 'firebase',
    transport: null,
    room: null,
    listeners: [],
    suppressLocalSync: false,
    pendingPushTimeout: null,

    /** 可选传输后端列表（供 UI 渲染）。 */
    transportOptions() {
        return [
            { id: 'firebase', label: FirebaseTransport.label, needsVpn: true },
            { id: 'emqx', label: EmqxTransport.label, needsVpn: false }
        ];
    },

    emqxDefaultServer() {
        return EmqxTransport.DEFAULT_SERVER;
    },

    /**
     * 生成 6 位房间码，由大写字母 / 数字组成。
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },

    /**
     * 选定并连接后端。返回本地 userId。
     */
    async connect(transportName, config) {
        const name = transportName || this.transportName || 'firebase';
        const adapter = Transports[name];
        if (!adapter) throw new Error('未知的联机方式：' + name);
        this.transportName = name;
        this.transport = adapter;
        const result = await adapter.connect(config || {});
        const userId = result && result.userId;
        if (!userId) throw new Error('联机连接失败：未获得用户 ID');
        return userId;
    },

    /**
     * 创建联机房间。设当前用户为房主，本地 lobby 切换到 online 模式。
     * options: { transport, config }
     */
    async createRoom(playerName, options = {}) {
        const userId = await this.connect(options.transport, options.config);
        const cleanName = String(playerName || '').trim() || `指挥官-${userId.slice(-4)}`;

        const code = this.generateRoomCode();
        const room = this.transport.openRoom(code);
        // 仅在后端支持快速存在性检查时做撞码重试
        if (room.canCheckExistence && (await room.exists())) {
            return this.createRoom(playerName, options);
        }

        GameState.lobby = {
            roomCode: code,
            mode: 'online',
            transport: this.transportName,
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

        await room.writeRoot({
            meta: {
                hostId: userId,
                createdAt: Date.now(),
                mode: 'online',
                transport: this.transportName
            },
            lobby: this.serializeLobby()
        });

        this.attachRoomListeners(room, userId, /* asHost */ true);
        GameState.notify();
        return code;
    },

    /**
     * 通过房间码加入房间。
     * options: { transport, config }
     */
    async joinRoom(rawCode, playerName, options = {}) {
        const userId = await this.connect(options.transport, options.config);
        const code = String(rawCode || '').trim().toUpperCase();
        if (!code) throw new Error('请填写房间码');
        const cleanName = String(playerName || '').trim() || `指挥官-${userId.slice(-4)}`;

        const room = this.transport.openRoom(code);
        const data = await room.readAll();
        if (!data || !data.lobby) throw new Error(`房间 ${code} 不存在`);

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

        const hostId = (data.meta && data.meta.hostId) || lobby.hostId || userId;
        GameState.lobby = {
            roomCode: code,
            mode: 'online',
            transport: this.transportName,
            hostId,
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
        await room.writeLobby(this.serializeLobby());

        const isHost = userId === GameState.lobby.hostId;
        this.attachRoomListeners(room, userId, isHost);
        GameState.notify();
        return code;
    },

    /**
     * 订阅 lobby + state 变化。
     */
    attachRoomListeners(room, userId, asHost) {
        this.detachRoomListeners();
        this.isOnline = true;
        this.isHost = asHost;
        // 本地玩家是否已为这局初始化过自己的会话（资源/意识形态/外交/国策修正）。
        // 客人不会走 startGameSession，需要首次收到对局状态时补一次初始化。
        this._localSessionStarted = false;
        this.room = room;

        room.onLobby(remote => {
            if (this.suppressLocalSync) return;
            if (!remote) return;
            this.suppressLocalSync = true;
            this.applyLobbyFromRemote(remote);
            this.suppressLocalSync = false;
        });

        room.onState(remote => {
            if (!remote) return;
            this.suppressLocalSync = true;
            this.applyStateFromRemote(remote);
            this.suppressLocalSync = false;
        });
    },

    detachRoomListeners() {
        if (this.room) {
            try { this.room.detach(); } catch (e) { /* ignore */ }
        }
        this.room = null;
        this.listeners = [];
        this.isOnline = false;
        this.isHost = false;
    },

    /**
     * 把当前 lobby（settings/slots/chat/hostId）push 到后端。
     */
    pushLobby() {
        if (!this.isOnline || this.suppressLocalSync) return;
        if (!this.room) return;
        this.room.writeLobby(this.serializeLobby());
    },

    /**
     * 序列化游戏状态（地图节点 + game 字段）以便 push。
     * 注意 game 中很多字段是 UI-only（actionConfirm, hoveredNodeId, focusTreeViewport 等），不需要同步。
     */
    pushGameState() {
        if (!this.isOnline || this.suppressLocalSync) return;
        if (!this.room) return;
        if (!window.MapData) return;

        // 节流：100ms 内多次写合并
        if (this.pendingPushTimeout) clearTimeout(this.pendingPushTimeout);
        this.pendingPushTimeout = setTimeout(() => {
            this.pendingPushTimeout = null;
            // 把"本地势力的全局攻防加成"写进共享的 humanCombat（合并，不覆盖别人的条目）。
            // 当别的玩家进攻我的节点时，他在自己机器上算战斗，需要用到我（守方人类）的防御加成；
            // 否则人类守方的国策/意识形态防御会被当成 0，比 AI 还好打。攻方仍用自己的攻击加成。
            const myFaction = GameState.getPlayerFactionId();
            const humanCombat = Object.assign({}, GameState.game.humanCombat || {});
            humanCombat[myFaction] = {
                def: Math.round((GameState.getEffectiveGlobalDefense() || 0) * 100),
                atk: Math.round((GameState.getEffectiveGlobalAttack() || 0) * 100)
            };
            GameState.game.humanCombat = humanCombat;
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
                // 注意：game.modifiers 是"本地玩家自己国策加成"的私有对象，绝不能上传/共享，
                // 否则会互相覆盖（房主每跑一个 AI 就 push 一次 → 客人的国策加成被清掉）。
                // humanCombat 是各人类势力的"全局攻防加成"汇总（供他人进攻己方时取守方加成）。
                humanCombat: GameState.game.humanCombat || {},
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
            this.room.writeState(payload);
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
        const transport = GameState.lobby.transport;
        GameState.lobby = {
            ...GameState.lobby,
            roomCode,
            mode: 'online',
            transport,
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

        // 客人首次进入对局（或房主开了新的一局，turn 回退到较小值）：先用"自己的势力"建立本地会话，
        // 保证 playerResources（按本势力 startingStats）、currentIdeology、diplomacy、modifiers 正确初始化。
        // 否则客人一直用默认 game 模板里的 money=25/pp=10，且后续无人为它结算。
        const isGuest = !GameState.isHost();
        const isNewGame = remote.turn && GameState.game && remote.turn < (GameState.game.currentTurn || 0);
        if (isGuest && remote.turn && (!this._localSessionStarted || isNewGame)) {
            this._localSessionStarted = true;
            if (window.MapData.reset) window.MapData.reset();
            GameState.startGameSession();
        }

        const prevPlayerId = GameState.game.currentPlayerId;

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
        // 不再用 remote.modifiers 覆盖本地国策加成 —— 那是每个玩家各自的私有数据（见 pushGameState 注释）。
        // humanCombat 合并（不整体替换）：每个客户端只更新自己势力的条目，合并可避免互相清掉。
        if (remote.humanCombat) {
            GameState.game.humanCombat = Object.assign({}, GameState.game.humanCombat || {}, remote.humanCombat);
        }
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

        // 轮到本地玩家行动：重置本机倒计时（计时器在非自己回合是冻结的）。
        if (remote.currentPlayerId !== prevPlayerId &&
            GameState.isFactionPlayedByLocalUser(remote.currentPlayerId)) {
            GameState.game.timerRemaining = Number(GameState.lobby.settings.turnLimit) || 180;
        }

        // 轮到本地玩家所控势力时，为它做本回合【完整结算】（金钱/PP/首都补员/赤字逃兵）。
        // 只在"轮到自己"时结算——此刻自己是地图权威写入方，地图改动不会被他人快照覆盖。
        // 注意：全局导出是 window.app（小写），曾误写成 window.App 导致这里永不执行、客人不回 PP/钱。
        if (window.app && window.app.maybeSettleLocalFactionOnTurnStart) {
            window.app.maybeSettleLocalFactionOnTurnStart();
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
        if (!this.isOnline || !this.room) {
            this.detachRoomListeners();
            return;
        }
        const room = this.room;
        const userId = GameState.lobby.myUserId;
        try {
            if (this.isHost) {
                await room.remove();
            } else {
                const remote = (await room.readLobby()) || {};
                const slots = (remote.slots || []).map(s => (
                    s.userId === userId
                        ? { ...s, kind: 'open', userId: null, playerName: '' }
                        : s
                ));
                await room.writeLobby({
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
