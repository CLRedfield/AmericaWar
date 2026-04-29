const MainMenuView = {
    render() {
        const myName = (GameState.lobby && GameState.lobby.myName) || '指挥官';
        const status = (GameState.lobby && GameState.lobby.statusMessage) || '';
        const connecting = !!(GameState.lobby && GameState.lobby.connecting);

        return `
            <div class="view-main-menu animate-fade-in">
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
                        v0.3 · 联机版
                    </div>
                </div>
            </div>
        `;
    }
};
