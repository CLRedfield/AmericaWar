const MainMenuView = {
    renderBackdrop() {
        const nodes = (window.MapData && MapData.initialNodes) || [];
        const dots = nodes.map(node => {
            const faction = GameState.getFaction(node.factionId);
            const color = (faction && faction.color) || '#94a3b8';
            return `<circle cx="${node.x}" cy="${node.y}" r="${node.isCapital ? 5 : 3}" fill="${color}" />`;
        }).join('');
        const links = (window.MapData && MapData.connections ? MapData.connections : []).map(([a, b]) => {
            const s = MapData.getNode(a);
            const t = MapData.getNode(b);
            if (!s || !t) return '';
            return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" />`;
        }).join('');

        return `
            <div class="main-menu-backdrop" aria-hidden="true">
                <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
                    <path class="menu-map-shape" d="M78 100 C160 42 284 52 382 84 C484 34 602 72 696 116 C812 122 902 150 952 214 C918 258 936 336 884 384 C828 438 758 496 660 548 C568 590 448 578 356 542 C270 510 182 476 132 408 C84 342 52 224 78 100 Z" />
                    <g class="menu-map-links">${links}</g>
                    <g class="menu-map-nodes">${dots}</g>
                </svg>
                <div class="main-menu-vignette"></div>
            </div>
        `;
    },

    render() {
        const myName = (GameState.lobby && GameState.lobby.myName) || '指挥官';
        const status = (GameState.lobby && GameState.lobby.statusMessage) || '';
        const connecting = !!(GameState.lobby && GameState.lobby.connecting);

        return `
            <div class="view-main-menu animate-fade-in">
                ${this.renderBackdrop()}
                <div class="main-menu-content">
                    <h1 class="main-menu-title">裂旗战争</h1>
                    <div class="main-menu-subtitle">Shattered States</div>

                    <div class="menu-name-row">
                        <label>
                            <span>玩家昵称</span>
                            <input type="text" maxlength="16" value="${escapeHtml(myName)}"
                                onchange="window.app.setPlayerName(this.value)"
                                placeholder="输入你的指挥官昵称">
                        </label>
                    </div>

                    <div class="main-menu-actions">
                        <button class="btn btn-primary" ${connecting ? 'disabled' : ''} onclick="window.app.startLocalLobby()">
                            ${connecting ? '加载中…' : '单机沙盒（本地房间）'}
                        </button>
                        <button class="btn btn-primary" ${connecting ? 'disabled' : ''} onclick="window.app.openCreateRoomDialog()">
                            创建联机房间
                        </button>
                        <button class="btn btn-outline" ${connecting ? 'disabled' : ''} onclick="window.app.openJoinRoomDialog()">
                            通过房间码加入
                        </button>
                        <button class="btn btn-primary btn-tutorial" onclick="window.app.openTutorial()">
                            📖 新手教程
                        </button>
                        <button class="btn btn-outline" onclick="window.app.openRulesHelp()">
                            📜 规则速查
                        </button>
                    </div>

                    ${status ? `<div class="menu-status text-muted">${escapeHtml(status)}</div>` : ''}

                    <div style="margin-top: var(--spacing-8); color: var(--color-text-muted); font-size: 0.875rem;">
                        v0.5 · 联机版
                    </div>
                </div>
            </div>
        `;
    },

    renderModals() {
        const dialog = window.app && window.app.roomDialog;
        if (!dialog) return '';
        return this.renderRoomDialog(dialog);
    },

    renderRoomDialog(d) {
        const isCreate = d.mode === 'create';
        const transports = (window.Multiplayer && Multiplayer.transportOptions()) || [];

        const transportCards = transports.map(opt => {
            const active = d.transport === opt.id;
            const badge = opt.needsVpn
                ? '<span class="room-trans-badge warn">需翻墙</span>'
                : '<span class="room-trans-badge ok">免翻墙</span>';
            const desc = opt.id === 'firebase'
                ? 'Google Firebase 实时数据库，稳定，但中国大陆通常需要科学上网。'
                : '公共 MQTT 服务器，国内可直连，无需翻墙。';
            return `
                <button type="button" class="room-trans-option ${active ? 'active' : ''}"
                    onclick="window.app.setRoomDialogTransport('${opt.id}')" ${d.busy ? 'disabled' : ''}>
                    <span class="room-trans-radio" aria-hidden="true"></span>
                    <span class="room-trans-text">
                        <span class="room-trans-top">
                            <span class="room-trans-name">${escapeHtml(opt.label)}</span>
                            ${badge}
                        </span>
                        <span class="room-trans-desc">${escapeHtml(desc)}</span>
                    </span>
                </button>
            `;
        }).join('');

        const serverField = d.transport === 'emqx' ? `
            <label class="room-dialog-field">
                <span class="room-dialog-field-label">EMQX 服务器地址</span>
                <input id="room-dialog-server" type="text" value="${escapeHtml(d.server || '')}"
                    placeholder="wss://broker.emqx.io:8084/mqtt" autocomplete="off" spellcheck="false"
                    oninput="window.app.roomDialog && (window.app.roomDialog.server = this.value)"
                    ${d.busy ? 'disabled' : ''}>
                <span class="room-dialog-hint">默认填入 EMQX 公共服务器；也可改成自建 broker（需支持 WebSocket / WSS）。</span>
            </label>
        ` : '';

        const codeField = isCreate ? '' : `
            <label class="room-dialog-field">
                <span class="room-dialog-field-label">房间码</span>
                <input id="room-dialog-code" class="room-code-input" type="text" maxlength="6"
                    value="${escapeHtml(d.code || '')}" placeholder="ABC123" autocomplete="off" spellcheck="false"
                    oninput="window.app.roomDialog && (window.app.roomDialog.code = this.value)"
                    onkeydown="if(event.key==='Enter') window.app.submitRoomDialog()"
                    ${d.busy ? 'disabled' : ''}>
                <span class="room-dialog-hint">向房主索取 6 位房间码（字母 / 数字），并选择与房主相同的联机方式。</span>
            </label>
        `;

        const title = isCreate ? '创建联机房间' : '加入联机房间';
        const submitLabel = d.busy
            ? (isCreate ? '创建中…' : '连接中…')
            : (isCreate ? '创建房间' : '加入房间');

        return `
            <div class="modal-backdrop room-dialog-backdrop" onclick="window.app.closeRoomDialogOnBackdrop(event)">
                <section class="modal-panel compact-modal room-dialog">
                    <header class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="window.app.closeRoomDialog()" ${d.busy ? 'disabled' : ''}>×</button>
                    </header>
                    <div class="modal-body room-dialog-body">
                        <div class="room-dialog-field-label">联机方式</div>
                        <div class="room-trans-options">${transportCards}</div>
                        ${serverField}
                        ${codeField}
                        ${d.error ? `<div class="room-dialog-error">⚠ ${escapeHtml(d.error)}</div>` : ''}
                        ${d.busy && d.transport === 'emqx' ? `<div class="room-dialog-hint">正在连接 EMQX，首次加载约需几秒…</div>` : ''}
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-outline" onclick="window.app.closeRoomDialog()" ${d.busy ? 'disabled' : ''}>取消</button>
                        <button class="btn btn-primary" onclick="window.app.submitRoomDialog()" ${d.busy ? 'disabled' : ''}>${submitLabel}</button>
                    </footer>
                </section>
            </div>
        `;
    }
};
