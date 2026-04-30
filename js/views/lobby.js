const LobbyView = {
    render() {
        const { lobby } = GameState;
        const isHost = GameState.isHost();
        const isOnline = lobby.mode === 'online';
        const mySlot = GameState.getMySlot();
        const activeCount = (lobby.slots || []).filter(s => s.kind !== 'open').length;
        const humanCount = (lobby.slots || []).filter(s => s.kind === 'human').length;
        const canStart = isHost && humanCount >= 1 && activeCount >= 2;

        const slotsHtml = (lobby.slots || []).map(slot => this.renderSlotRow(slot, isHost, isOnline, lobby)).join('');

        const chatHtml = (lobby.chat || []).map(message => `
            <div class="lobby-chat-line">
                <span>${escapeHtml(message.author || '系统')}</span>
                ${escapeHtml(message.text)}
            </div>
        `).join('');

        const inviteUrl = isOnline
            ? `${location.origin}${location.pathname}#room=${encodeURIComponent(lobby.roomCode)}`
            : null;

        return `
            <div class="view-lobby animate-fade-in">
                <header class="lobby-header">
                    <div>
                        <div class="eyebrow">${isOnline ? '联机房间' : '本地沙盒房间'}</div>
                        <h2>房间 ${escapeHtml(lobby.roomCode)}</h2>
                        <div class="text-muted">
                            身份：${escapeHtml(lobby.myName)}（${isHost ? '房主' : '玩家'}）
                            ${mySlot ? ` · 当前坐席 <strong style="color:${this.colorOf(mySlot.factionId)}">${this.nameOf(mySlot.factionId)}</strong>` : ' · 未入座'}
                        </div>
                        ${lobby.statusMessage ? `<div class="text-muted lobby-status">${escapeHtml(lobby.statusMessage)}</div>` : ''}
                    </div>
                    <div class="lobby-header-actions">
                        ${isOnline ? `
                            <button class="btn btn-outline" onclick="window.app.copyInviteLink()" title="${escapeHtml(inviteUrl || '')}">复制邀请链接</button>
                        ` : ''}
                        <button class="btn btn-outline" onclick="window.app.leaveLobby()">${isOnline ? '离开房间' : '返回主菜单'}</button>
                        <button class="btn btn-primary" ${canStart ? '' : 'disabled'}
                                title="${canStart ? '' : '至少 1 名人类玩家、2 个非空席位才能开始'}"
                                onclick="window.app.startMatch()">
                            ${isHost ? '开始游戏' : '等待房主开始'}
                        </button>
                    </div>
                </header>

                <div class="lobby-grid">
                    <section class="lobby-panel lobby-slots-panel">
                        <div class="section-title-row">
                            <h3>国家席位</h3>
                            <span class="text-muted">${activeCount}/${lobby.slots.length} 在场（${humanCount} 人类）</span>
                        </div>
                        <div class="slot-list">${slotsHtml}</div>
                        <div class="slot-help text-muted">
                            空席国家在游戏中保持待机（不行动、不响应外交，但可被进攻）。
                        </div>
                    </section>

                    <section class="lobby-panel lobby-settings-panel">
                        <h3>房主设置 ${isHost ? '' : '<span class="text-muted">（仅房主可改）</span>'}</h3>
                        <div class="settings-grid">
                            ${this.renderSelect('maxPlayers', '最大玩家数', ['4', '6', '8'], !isHost)}
                            ${this.renderSelect('mapScale', '地图规模', ['小型', '标准', '最大'], !isHost)}
                            ${this.renderSelect('turnLimit', '回合限时', ['60', '90', '120', '180', '无限'], !isHost)}
                            ${this.renderSelect('victory', '胜利条件', ['统一', '霸权'], !isHost)}
                            ${this.renderSwitch('diplomacy', '启用外交', !isHost)}
                            ${this.renderSwitch('ai', '允许 AI', !isHost)}
                        </div>
                        ${isHost ? this.renderAiFillControls() : ''}
                    </section>

                    <section class="lobby-panel lobby-chat-panel">
                        <div class="section-title-row">
                            <h3>房间聊天</h3>
                            <span class="connection-dot ${isOnline ? '' : 'offline'}">${isOnline ? '联机已同步' : '本地'}</span>
                        </div>
                        <div class="lobby-chat-log">${chatHtml || '<div class="text-muted">暂无聊天。</div>'}</div>
                        <input class="chat-input" type="text" placeholder="输入消息（回车发送）"
                            onkeydown="window.app.handleLobbyChatKey(event)">
                    </section>
                </div>
            </div>
        `;
    },

    renderSlotRow(slot, isHost, isOnline, lobby) {
        const faction = GameState.getFaction(slot.factionId);
        const isMine = slot.kind === 'human' && slot.userId === lobby.myUserId;
        const ideology = GameState.ideologies && GameState.ideologies[faction.ideology];
        let stateLabel, stateClass, actionsHtml;

        if (slot.kind === 'open') {
            stateLabel = '空席（待机）';
            stateClass = 'open';
            const sittingHere = !GameState.getMySlot() || isOnline; // 在线模式可换座；本地若已入座则不允许重复入座
            actionsHtml = `
                <div class="slot-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.app.takeSlot('${slot.factionId}')">${GameState.getMySlot() ? '换到这里' : '我坐这里'}</button>
                    ${isHost ? `
                        <select class="compact-select" onchange="window.app.addAiToSlot('${slot.factionId}', this.value)">
                            <option value="" selected>+ 添加 AI</option>
                            <option value="easy">AI · 简单</option>
                            <option value="normal">AI · 普通</option>
                            <option value="hard">AI · 困难</option>
                        </select>
                    ` : ''}
                </div>
            `;
        } else if (slot.kind === 'ai') {
            stateLabel = `AI · ${this.difficultyLabel(slot.aiDifficulty)}`;
            stateClass = 'ai';
            actionsHtml = `
                <div class="slot-actions">
                    ${isHost ? `
                        <select class="compact-select" onchange="window.app.setAiDifficulty('${slot.factionId}', this.value)">
                            <option value="easy" ${slot.aiDifficulty === 'easy' ? 'selected' : ''}>简单</option>
                            <option value="normal" ${(slot.aiDifficulty || 'normal') === 'normal' ? 'selected' : ''}>普通</option>
                            <option value="hard" ${slot.aiDifficulty === 'hard' ? 'selected' : ''}>困难</option>
                        </select>
                        <button class="btn btn-outline btn-sm" onclick="window.app.clearSlot('${slot.factionId}')">移除 AI</button>
                    ` : ''}
                </div>
            `;
        } else {
            stateLabel = `${escapeHtml(slot.playerName || '玩家')}${isMine ? '（你）' : ''}`;
            stateClass = isMine ? 'human-self' : 'human';
            actionsHtml = `
                <div class="slot-actions">
                    ${isMine ? `<button class="btn btn-outline btn-sm" onclick="window.app.releaseSlot()">起身</button>` : ''}
                    ${isHost && !isMine ? `<button class="btn btn-outline btn-sm" onclick="window.app.kickFromSlot('${slot.factionId}')">踢出</button>` : ''}
                </div>
            `;
        }

        return `
            <div class="slot-row slot-${stateClass}" style="--faction-color: ${faction.color}">
                <div class="slot-color" style="background: ${faction.color}"></div>
                <div class="slot-faction">
                    <div class="slot-faction-name">${faction.id} · ${faction.shortName}</div>
                    <div class="text-muted">${faction.playstyleTags.join(' / ')}${ideology ? ` · 起步意识形态：${ideology.name}` : ''}</div>
                </div>
                <div class="slot-state-badge slot-state-${stateClass}">${stateLabel}</div>
                ${actionsHtml}
            </div>
        `;
    },

    difficultyLabel(d) {
        if (d === 'easy') return '简单';
        if (d === 'hard') return '困难';
        return '普通';
    },

    renderAiFillControls() {
        return `
            <div class="host-ai-fill">
                <div>
                    <strong>一键补 AI</strong>
                    <span class="text-muted">把所有空席位转为同一难度 AI</span>
                </div>
                <div class="host-ai-fill-actions">
                    <select id="host-fill-ai-difficulty" class="compact-select">
                        <option value="easy">AI · 简单</option>
                        <option value="normal" selected>AI · 普通</option>
                        <option value="hard">AI · 困难</option>
                    </select>
                    <button class="btn btn-outline btn-sm"
                            onclick="window.app.fillOpenSlotsWithAi(document.getElementById('host-fill-ai-difficulty').value)">
                        一键填满空席
                    </button>
                </div>
            </div>
        `;
    },

    nameOf(factionId) {
        const f = GameState.getFaction(factionId);
        return f ? f.shortName : factionId;
    },

    colorOf(factionId) {
        const f = GameState.getFaction(factionId);
        return f ? f.color : '#94a3b8';
    },

    renderSelect(key, label, options, disabled = false) {
        const value = GameState.lobby.settings[key];
        const optionsHtml = options.map(option => `
            <option value="${option}" ${String(value) === String(option) ? 'selected' : ''}>${option}</option>
        `).join('');

        return `
            <label class="setting-field">
                <span>${label}</span>
                <select onchange="window.app.updateLobbySetting('${key}', this.value)" ${disabled ? 'disabled' : ''}>
                    ${optionsHtml}
                </select>
            </label>
        `;
    },

    renderSwitch(key, label, disabled = false) {
        const checked = GameState.lobby.settings[key];
        return `
            <label class="switch-field">
                <span>${label}</span>
                <button class="switch ${checked ? 'on' : ''}" ${disabled ? 'disabled' : ''}
                    onclick="window.app.toggleLobbySwitch('${key}')"
                    aria-label="${label}" type="button">
                    <span></span>
                </button>
            </label>
        `;
    }
};
