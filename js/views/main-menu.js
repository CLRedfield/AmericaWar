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
                        <button class="btn btn-primary" ${connecting ? 'disabled' : ''} onclick="window.app.createOnlineRoom()">
                            ${connecting ? '创建中…' : '创建联机房间'}
                        </button>
                        <button class="btn btn-outline" ${connecting ? 'disabled' : ''} onclick="window.app.promptJoinRoom()">
                            通过房间码加入
                        </button>
                        <button class="btn btn-outline" onclick="window.app.openRulesHelp()">
                            规则说明
                        </button>
                    </div>

                    ${status ? `<div class="menu-status text-muted">${escapeHtml(status)}</div>` : ''}

                    <div style="margin-top: var(--spacing-8); color: var(--color-text-muted); font-size: 0.875rem;">
                        v0.4 · 联机版
                    </div>
                </div>
            </div>
        `;
    }
};
