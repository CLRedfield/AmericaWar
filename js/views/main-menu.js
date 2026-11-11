const MainMenuView = {
    renderBackdrop(scenario) {
        const nodes = scenario.map?.nodes || MapData.americanNodes;
        const geography = scenario.map || MapData.americanGeography;
        const factions = scenario.factions || GameState.americanFactions;
        const colors = new Map(factions.map(faction => [faction.id, faction.color]));
        const provinces = nodes.map(node => (
            `<path d="${geography.provinces[node.id][3]}" fill="${colors.get(node.factionId)}"></path>`
        )).join('');

        return `
            <div class="main-menu-backdrop" aria-hidden="true">
                <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
                    <g class="menu-map-provinces">${provinces}</g>
                </svg>
                <div class="main-menu-vignette"></div>
            </div>
            ${MapView.renderMapCredit(scenario)}
        `;
    },

    render() {
        const myName = (GameState.lobby && GameState.lobby.myName) || '指挥官';
        const status = (GameState.lobby && GameState.lobby.statusMessage) || '';
        const connecting = !!(GameState.lobby && GameState.lobby.connecting);
        const scenario = GameState.getScenario(window.app.menuScenarioId);

        return `
            <div class="view-main-menu animate-fade-in">
                ${this.renderBackdrop(scenario)}
                <div class="main-menu-content">
                    <header class="menu-identity">
                        <div class="menu-kicker"><span aria-hidden="true">SS /</span> 战略指挥部</div>
                        <h1 class="main-menu-title">裂旗战争</h1>
                        <div class="main-menu-subtitle">SHATTERED STATES</div>
                        <p class="menu-identity-copy">一片破碎的国土。<br>一个尚未写定的未来。</p>
                        <div class="menu-identity-rule" aria-hidden="true"></div>
                        <div class="menu-dossier-caption">CAMPAIGN ARCHIVES <span>作战档案 / 02</span></div>
                    </header>

                    <section class="menu-operations" aria-label="战役与开始选项">
                        <div class="menu-section-heading"><span>01 / 选择战役</span><span>THEATRE</span></div>
                        <div class="menu-scenarios" role="group" aria-label="选择战役">
                            ${Object.values(GameState.scenarios).map((item, index) => `
                                <button class="menu-scenario" aria-pressed="${item.id === scenario.id}"
                                    onclick="window.app.selectScenario('${item.id}')">
                                    <span class="menu-scenario-number" aria-hidden="true">0${index + 1}</span>
                                    <span class="menu-scenario-copy"><small>${item.subtitle}</small><strong>${item.name}</strong></span>
                                    <span class="menu-scenario-check" aria-hidden="true">${item.id === scenario.id ? '●' : '○'}</span>
                                </button>
                            `).join('')}
                        </div>
                        <p class="menu-scenario-description">${scenario.description}</p>

                        <div class="menu-name-row">
                            <label>
                                <span>指挥官姓名</span>
                                <input type="text" maxlength="16" value="${escapeHtml(myName)}"
                                    onchange="window.app.setPlayerName(this.value)"
                                    placeholder="输入你的指挥官昵称">
                            </label>
                            <label class="menu-turn-field">
                                <span>每回合时间</span>
                                <select onchange="window.app.setMenuTurnLimit(this.value)">
                                    ${GameState.turnLimitOptions.map(option => `
                                        <option value="${option}" ${option === window.app.menuTurnLimit ? 'selected' : ''}>${GameState.formatTurnLimitOption(option)}</option>
                                    `).join('')}
                                </select>
                            </label>
                        </div>

                        <div class="menu-section-heading menu-command-heading"><span>02 / 下达命令</span><span>COMMAND</span></div>
                        <div class="main-menu-actions">
                            <button class="btn btn-primary menu-command menu-command-primary" ${connecting ? 'disabled' : ''} onclick="window.app.startLocalLobby()">
                                <span class="menu-command-number" aria-hidden="true">I</span><span>${connecting ? '加载中…' : '单机沙盒（本地房间）'}</span><span class="menu-command-arrow" aria-hidden="true">↗</span>
                            </button>
                            <button class="btn btn-outline menu-command" ${connecting ? 'disabled' : ''} onclick="window.app.openCreateRoomDialog()">
                                <span class="menu-command-number" aria-hidden="true">II</span><span>创建联机房间</span><span class="menu-command-arrow" aria-hidden="true">→</span>
                            </button>
                            <button class="btn btn-outline menu-command" ${connecting ? 'disabled' : ''} onclick="window.app.openJoinRoomDialog()">
                                <span class="menu-command-number" aria-hidden="true">III</span><span>通过房间码加入</span><span class="menu-command-arrow" aria-hidden="true">→</span>
                            </button>
                            <button class="btn btn-outline menu-command btn-tutorial" onclick="window.app.openTutorial()">
                                <span class="menu-command-number" aria-hidden="true">IV</span><span>新手教程</span><span class="menu-command-arrow" aria-hidden="true">→</span>
                            </button>
                        </div>
                        ${status ? `<div class="menu-status text-muted" role="status">${escapeHtml(status)}</div>` : ''}
                        <footer class="menu-edition"><span>双战役 · 回合同步战略</span><span>SHATTERED STATES</span></footer>
                    </section>
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
                <input id="room-dialog-code" class="room-code-input" type="text" maxlength="9"
                    value="${escapeHtml(d.code || '')}" placeholder="ABCDEF 或 WR-ABCDEF" autocomplete="off" spellcheck="false"
                    oninput="window.app.roomDialog && (window.app.roomDialog.code = this.value)"
                    onkeydown="if(event.key==='Enter') window.app.submitRoomDialog()"
                    ${d.busy ? 'disabled' : ''}>
                <span class="room-dialog-hint">请输入房主提供的完整房间码。西俄罗斯房间码含 WR- 前缀。</span>
            </label>
        `;

        const title = isCreate ? `创建房间 · ${GameState.getScenario(d.scenarioId).name}` : '加入联机房间';
        const submitLabel = d.busy
            ? (isCreate ? '创建中…' : '连接中…')
            : (isCreate ? '创建房间' : '加入房间');

        return `
            <div class="modal-backdrop room-dialog-backdrop" onclick="window.app.closeRoomDialogOnBackdrop(event)">
                <section class="modal-panel compact-modal room-dialog">
                    <header class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" aria-label="关闭房间对话框" onclick="window.app.closeRoomDialog()" ${d.busy ? 'disabled' : ''}>×</button>
                    </header>
                    <div class="modal-body room-dialog-body">
                        <div class="room-dialog-field-label">联机方式</div>
                        <div class="room-trans-options">${transportCards}</div>
                        ${serverField}
                        ${codeField}
                        ${d.error ? `<div class="room-dialog-error" role="alert">${escapeHtml(d.error)}</div>` : ''}
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
