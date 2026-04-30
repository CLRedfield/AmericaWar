const GamePageView = {
    render() {
        return `
            <div class="view-game-page">
                ${this.renderTopStatusBar()}
                ${this.renderLeftFactionPanel()}
                <main class="game-map-container">${MapView.render()}</main>
                ${this.renderRightActionPanel()}
                ${this.renderBottomLogPanel()}
            </div>
        `;
    },

    renderModals() {
        const game = GameState.game;
        return [
            game.actionConfirm ? this.renderActionConfirmModal(game.actionConfirm) : '',
            game.battlePreview ? this.renderBattlePreviewModal(game.battlePreview) : '',
            game.showFocusModal ? this.renderFocusTreeModal() : '',
            game.showDiplomacyModal ? this.renderDiplomacyModal() : '',
            game.winner && game.showEndGameModal !== false ? this.renderEndGameModal(game.winner) : ''
        ].join('');
    },

    renderTopStatusBar() {
        const game = GameState.game;
        const resources = game.playerResources;
        const faction = GameState.getFaction(game.currentPlayerId);
        const playerFaction = GameState.getFaction(GameState.getPlayerFactionId());
        const isLowTime = game.timerRemaining <= 15;
        const isPlayerTurn = game.currentPlayerId === GameState.getPlayerFactionId();
        const currentSlot = GameState.getSlot(game.currentPlayerId);
        let turnTag;
        if (isPlayerTurn) {
            turnTag = '你的回合';
        } else if (currentSlot && currentSlot.kind === 'ai') {
            turnTag = `AI 行动中（${currentSlot.playerName || faction.shortName}）`;
        } else if (currentSlot && currentSlot.kind === 'human') {
            turnTag = `等待 ${currentSlot.playerName} 行动`;
        } else {
            turnTag = '轮替中…';
        }

        return `
            <header class="game-top-bar ${isPlayerTurn ? 'is-player-turn' : 'is-waiting'}">
                <div class="top-brand-block">
                    <strong>裂旗战争</strong>
                    <span>房间 ${GameState.lobby.roomCode}${GameState.lobby.mode === 'online' ? ' · 联机' : ' · 本地'}</span>
                </div>

                <div class="top-bar-stats">
                    <div class="top-stat-item">
                        <span class="top-stat-label">回合</span>
                        <span class="top-stat-value">${game.currentTurn}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">当前</span>
                        <span class="top-stat-value" style="color: ${faction.color}">${faction.shortName}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">计时</span>
                        <span class="top-stat-value timer ${isLowTime ? 'danger' : ''}">${formatTimer(game.timerRemaining)}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">$</span>
                        <span class="top-stat-value">${formatMoney(resources.money)}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">PP</span>
                        <span class="top-stat-value">${resources.pp}/${GameState.getEffectivePPCap()}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">行动递增</span>
                        <span class="top-stat-value">+${GameState.getActionExtraCost()} PP</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">节点</span>
                        <span class="top-stat-value">${resources.nodes}</span>
                    </div>
                    <div class="top-stat-item">
                        <span class="top-stat-label">工业</span>
                        <span class="top-stat-value">${resources.totalIndustry}</span>
                    </div>
                </div>

                <div class="top-actions">
                    <span class="connection-dot ${isPlayerTurn ? '' : 'waiting'}">${turnTag}</span>
                    <button class="btn btn-primary" ${isPlayerTurn && !game.gameOver ? '' : 'disabled'} onclick="window.app.endTurn()">
                        结束回合
                    </button>
                    <button class="btn btn-danger top-exit-button" onclick="window.app.exitGame()">
                        退出
                    </button>
                </div>
                <div class="current-player-strip" style="--current-color: ${playerFaction.color}"></div>
            </header>
        `;
    },

    renderLeftFactionPanel() {
        const playerFaction = GameState.getFaction(GameState.getPlayerFactionId());
        const originalCapital = MapData.getNode(playerFaction.capitalNodeId);
        const capital = MapData.getNode(GameState.getCapitalNodeId(playerFaction.id));
        const resources = GameState.game.playerResources;
        const victoryProgress = Math.round((resources.nodes / MapData.nodes.length) * 100);
        const isOriginalCapitalHeld = originalCapital && originalCapital.factionId === playerFaction.id;
        const ideology = GameState.getIdeology();

        return `
            <aside class="game-left-panel">
                <section class="panel-section">
                    <div class="faction-summary-heading">
                        <span class="faction-swatch" style="background: ${playerFaction.color}"></span>
                        <div>
                            <h3>${playerFaction.shortName}</h3>
                            <div class="text-muted">${playerFaction.name}</div>
                        </div>
                    </div>
                    <div class="summary-grid">
                        <div>
                            <span>首都</span>
                            <strong class="${isOriginalCapitalHeld ? 'success-text' : 'danger-text'}">
                                ${capital ? `${capital.name}${isOriginalCapitalHeld ? '' : '（临时）'}` : '灭亡'}
                            </strong>
                        </div>
                        <div>
                            <span>资源</span>
                            <strong>$ ${formatMoney(resources.money)} / PP ${resources.pp}</strong>
                        </div>
                        <div>
                            <span>国策</span>
                            <strong>${GameState.game.completedFocuses.length}/${GameState.getFocusTree().length}</strong>
                        </div>
                        <div>
                            <span>胜利进度</span>
                            <strong>${victoryProgress}%</strong>
                        </div>
                    </div>
                    ${ideology ? this.renderIdeologyCard(ideology) : ''}
                    <div class="passive-line">基础政治点收入：每回合 +${GameState.basePPIncome} PP；步兵维护：每人 $0.25</div>
                    <div class="panel-actions">
                        <button class="btn btn-primary" onclick="window.app.openFocusModal()">国策</button>
                        <button class="btn btn-outline" onclick="window.app.openDiplomacyModal()">外交</button>
                    </div>
                </section>

                <section class="panel-section">
                    <div class="section-title-row">
                        <h3>势力排行</h3>
                        <select class="compact-select" onchange="window.app.setRankingMetric(this.value)">
                            <option value="nodes" ${window.app.rankingMetric === 'nodes' ? 'selected' : ''}>节点</option>
                            <option value="industry" ${window.app.rankingMetric === 'industry' ? 'selected' : ''}>工业</option>
                            <option value="troops" ${window.app.rankingMetric === 'troops' ? 'selected' : ''}>兵力</option>
                        </select>
                    </div>
                    <div class="ranking-list">
                        ${this.renderRankingList()}
                    </div>
                </section>

                <section class="panel-section">
                    <h3>外交关系</h3>
                    <div class="diplomacy-badges">${this.renderDiplomacyBadges()}</div>
                </section>
            </aside>
        `;
    },

    renderIdeologyCard(ideology) {
        const bonusItems = (ideology.bonuses || [])
            .map(b => this.formatIdeologyBonus(b))
            .filter(Boolean)
            .map(text => `<li>${escapeHtml(text)}</li>`)
            .join('');

        return `
            <div class="ideology-card" style="--ideology-color: ${ideology.color}">
                <div class="ideology-heading">
                    <span class="ideology-swatch" style="background: ${ideology.color}"></span>
                    <div>
                        <div class="ideology-label">意识形态</div>
                        <strong>${escapeHtml(ideology.name)}</strong>
                    </div>
                </div>
                <div class="ideology-desc text-muted">${escapeHtml(ideology.description || '')}</div>
                <ul class="ideology-bonus-list">${bonusItems}</ul>
            </div>
        `;
    },

    formatIdeologyBonus(bonus) {
        if (!bonus) return '';
        const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
        const pct = (n) => `${(n * 100).toFixed(0)}%`;
        const signedPct = (n) => (n > 0 ? `+${pct(n)}` : `-${pct(-n)}`);
        switch (bonus.type) {
            case 'ppCapBonus': return `PP 上限 ${sign(bonus.amount)}`;
            case 'ppIncome': return `每回合 PP ${sign(bonus.amount)}`;
            case 'moneyIncome': return `每回合金钱 ${sign(bonus.amount)}`;
            case 'recruitCost': return `每个士兵金钱成本 ${sign(bonus.amount)}（最低 1）`;
            case 'recruitAmount': return `每次征兵数量 ${sign(bonus.amount)}`;
            case 'maintenanceRate': return `部队维护费率 ${signedPct(bonus.amount)}`;
            case 'globalAttack': return `全局进攻力 ${signedPct(bonus.amount)}`;
            case 'globalDefense': return `全局防守力 ${signedPct(bonus.amount)}`;
            case 'freeTroops': return `免维护士兵 ${sign(bonus.amount)} 名`;
            case 'captureMoney': return `每次占领额外 ${sign(bonus.amount)} 金钱`;
            case 'captureTroops': return `每次占领额外 ${sign(bonus.amount)} 驻军`;
            case 'crisisPP': return `首都失守时 PP 危机收入 ${sign(bonus.amount)}`;
            case 'capitalTroopsPerTurn': return `每回合首都驻军 ${sign(bonus.amount)}`;
            case 'damageOnCapture': return `占领后破坏敌方工业 ${sign(bonus.amount)}`;
            case 'taggedIncome': return `每个${bonus.tag}节点每回合 ${sign(bonus.amount)} 金钱`;
            case 'taggedDefense': return `${bonus.tag}节点防守 ${signedPct(bonus.amount)}`;
            case 'actionCost': {
                const names = { recruit: '征兵', move: '移动', build: '建设', focus: '推进国策', all: '全部行动' };
                return `${names[bonus.action] || bonus.action} 基础 PP ${sign(bonus.amount)}`;
            }
            default: return '';
        }
    },

    renderRankingList() {
        const ranking = MapData.getRanking(window.app.rankingMetric || 'nodes');
        const metric = window.app.rankingMetric || 'nodes';
        return ranking.map((faction, index) => {
            const value = metric === 'industry'
                ? faction.totalIndustry
                : metric === 'troops'
                    ? faction.totalTroops
                    : faction.nodes;
            const originalCapital = MapData.getNode(faction.capitalNodeId);
            const isEliminated = GameState.game.eliminatedFactions.includes(faction.id);
            const capitalLabel = isEliminated
                ? '灭亡'
                : originalCapital && originalCapital.factionId === faction.id
                    ? '本都'
                    : '迁都';
            const capitalClass = isEliminated ? 'lost' : capitalLabel === '本都' ? 'held' : 'moved';
            const ideology = GameState.getIdeology(faction.id);
            const ideologyLabel = ideology ? ideology.name : '';

            return `
                <div class="ranking-row" title="${ideology ? escapeHtml(ideology.description || '') : ''}">
                    <span class="ranking-index">${index + 1}</span>
                    <span class="faction-swatch small" style="background: ${faction.color}"></span>
                    <span>${faction.shortName}</span>
                    <strong>${value}</strong>
                    ${ideologyLabel ? `<span class="ranking-ideology" style="--ideology-color: ${ideology.color}">${escapeHtml(ideologyLabel)}</span>` : ''}
                    <span class="capital-state ${capitalClass}">${capitalLabel}</span>
                </div>
            `;
        }).join('');
    },

    renderDiplomacyBadges() {
        const relations = GameState.game.diplomacy;
        return Object.entries(relations).map(([factionId, data]) => {
            const faction = GameState.getFaction(factionId);
            const relationClass = data.relation === '战争' ? 'war' : data.relation === '停战' ? 'truce' : 'neutral';
            return `
                <span class="diplomacy-badge ${relationClass}" style="--faction-color: ${faction.color}">
                    ${faction.id} ${data.relation}
                </span>
            `;
        }).join('');
    },

    renderRightActionPanel() {
        const game = GameState.game;
        const node = MapData.getNode(game.selectedNodeId);

        return `
            <aside class="game-right-panel">
                <section class="panel-section">
                    <div class="section-title-row">
                        <h3>行动面板</h3>
                        <span class="action-count">本回合 ${game.actionCountThisTurn} 次行动</span>
                    </div>
                    ${node ? this.renderSelectedNode(node) : this.renderDefaultActionState()}
                    ${this.renderFocusActionSummary()}
                </section>
            </aside>
        `;
    },

    renderFocusActionSummary() {
        const focus = GameState.getFocusById(GameState.game.selectedFocusId);
        const availability = window.app.getFocusAdvanceAvailability(focus ? focus.id : null);
        const progress = focus ? GameState.getFocusProgressInfo(focus) : null;
        const disabled = availability.enabled ? '' : 'disabled';
        const buttonTitle = availability.reason ? `title="${availability.reason}"` : '';

        return `
            <div class="focus-action-summary">
                <div>
                    <span>国策行动</span>
                    <strong>${focus ? focus.name : '未选择国策'}</strong>
                    <small>${focus ? `${progress.current}/${progress.required} 推进 · ${availability.ppCost} PP` : '打开国策树选择一个目标'}</small>
                </div>
                <div class="focus-action-buttons">
                    <button class="btn btn-outline" onclick="window.app.openFocusModal()">国策树</button>
                    ${focus ? `<button class="btn btn-primary" ${disabled} ${buttonTitle} onclick="window.app.advanceFocus('${focus.id}')">推进国策</button>` : ''}
                </div>
            </div>
        `;
    },

    renderDefaultActionState() {
        return `
            <div class="empty-state">
                <strong>未选择节点</strong>
                <span>选择己方节点后可执行征兵、移动、建设或进攻。</span>
            </div>
            <div class="action-help-block">
                当前可用 PP：${GameState.game.playerResources.pp}<br>
                下一回合基础收入：+${GameState.basePPIncome} PP
            </div>
        `;
    },

    renderSelectedNode(node) {
        const faction = GameState.getFaction(node.factionId);
        const playerFactionId = GameState.getPlayerFactionId();
        const isFriendly = node.factionId === playerFactionId;
        const neighbors = MapData.getNeighbors(node.id);
        const attackTargets = MapData.getAttackTargets(node.id, playerFactionId);
        const moveTargets = MapData.getMoveTargets(node.id, playerFactionId);
        const movableTroops = GameState.getNodeMovableTroops(node);
        const freshTroops = GameState.getNodeFreshTroops(node);
        const waitingTroops = Math.max(0, node.troops - GameState.getNodeMoveReady(node) - freshTroops);
        const currentCapitalOwner = GameState.getCapitalOwner(node.id);
        const originalCapitalOwner = GameState.getOriginalCapitalOwner(node.id);
        const nodeLabels = [
            ...node.tags,
            currentCapitalOwner ? `${GameState.getFactionName(currentCapitalOwner)}当前首都` : '',
            originalCapitalOwner && originalCapitalOwner !== currentCapitalOwner ? `${GameState.getFactionName(originalCapitalOwner)}原始首都` : ''
        ].filter(Boolean);

        return `
            <div class="selected-node-card" style="--faction-color: ${faction.color}">
                <div class="selected-node-heading">
                    <span>${node.abbr}</span>
                    <div>
                        <h3>${node.name}</h3>
                        <div class="text-muted">${faction.name}</div>
                    </div>
                </div>
                <div class="node-detail-grid">
                    <div><span>工业</span><strong>${node.industry}</strong></div>
                    <div><span>兵力</span><strong>${node.troops}</strong></div>
                    <div><span>可动老兵</span><strong>${movableTroops}</strong></div>
                    <div><span>本回合新兵</span><strong>${freshTroops}</strong></div>
                    <div><span>地形</span><strong>${node.terrain}</strong></div>
                    <div><span>已行动/待命</span><strong>${waitingTroops}</strong></div>
                    <div><span>标签</span><strong>${nodeLabels.length ? nodeLabels.join(' / ') : '无'}</strong></div>
                </div>
            </div>

            ${isFriendly ? `
                <div class="action-button-grid">
                    ${this.renderActionButton('recruit', '征兵')}
                    ${this.renderActionButton('move', this.getMoveButtonLabel())}
                    ${this.renderActionButton('build', '建设工业')}
                </div>
                ${GameState.game.currentAction === 'move' ? this.renderMoveTargets(node, moveTargets) : ''}
                ${this.renderAttackTargets(attackTargets)}
            ` : `
                <div class="action-help-block hostile">
                    敌方节点。先选择相邻己方节点，再点击这里可打开战斗预览。
                </div>
            `}

            <div class="neighbor-list">
                <span>相邻节点</span>
                <div>${neighbors.map(neighbor => `<button onclick="window.app.handleNodeClick('${neighbor.id}')">${neighbor.abbr}</button>`).join('')}</div>
            </div>
        `;
    },

    getMoveButtonLabel() {
        if (!GameState.game.movementOrdersActive) return '移动士兵';
        return GameState.game.currentAction === 'move' ? '收起移动' : '继续移动';
    },

    renderActionButton(action, label) {
        const availability = window.app.getActionAvailability(action);
        const disabled = availability.enabled ? '' : 'disabled';
        const title = availability.reason ? `title="${availability.reason}"` : '';
        const handler = action === 'move'
            ? 'window.app.activateMove()'
            : `window.app.openAction('${action}')`;

        return `
            <button class="btn ${availability.enabled ? 'btn-primary' : 'btn-outline'} action-btn" ${disabled} ${title}
                onclick="${handler}">
                <span>${label}</span>
                <small>${availability.cost}</small>
            </button>
        `;
    },

    renderMoveTargets(source, targets) {
        const maxAmount = GameState.getNodeMovableTroops(source);
        const amount = window.app.getSelectedMoveAmount(source);

        if (!GameState.game.movementOrdersActive) {
            return `<div class="action-help-block">先点击“移动士兵”发布移动令，本回合所有未移动士兵都可以各移动 1 次。</div>`;
        }

        if (maxAmount < 1) {
            return `<div class="action-help-block">该节点没有可移动士兵。本回合新征召、已经移动过或必须留守的士兵不能再移动。</div>`;
        }

        if (!targets.length) {
            return `<div class="action-help-block">该节点没有可移动的相邻己方节点。</div>`;
        }

        return `
            <div class="move-order-panel">
                <div class="move-order-heading">
                    <div>
                        <span>调动数量</span>
                        <strong data-move-count>${amount} / ${maxAmount} 支</strong>
                    </div>
                    <button class="mini-control-btn" onclick="window.app.selectMaxMoveAmount()">最大</button>
                </div>
                <div class="move-amount-controls">
                    <button class="mini-control-btn" onclick="window.app.adjustMoveDraftAmount(-1)">−</button>
                    <input type="range" class="move-range tactical-range" min="1" max="${maxAmount}" value="${amount}"
                        oninput="window.app.setMoveDraftAmount(this.value, false)"
                        onchange="window.app.setMoveDraftAmount(this.value)">
                    <input class="move-amount-input" type="number" min="1" max="${maxAmount}" value="${amount}" onchange="window.app.setMoveDraftAmount(this.value)">
                    <button class="mini-control-btn" onclick="window.app.adjustMoveDraftAmount(1)">+</button>
                </div>
                <div class="target-list move-target-list">
                    <span>移动目标</span>
                    ${targets.map(target => `
                        <button onclick="window.app.openMoveConfirm('${target.id}')">
                            <strong>${target.name}</strong>
                            <small data-move-target-amount>调动 ${amount}</small>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderAttackTargets(targets) {
        if (!targets.length) return '';

        return `
            <div class="target-list attack-target-list">
                <span>可进攻</span>
                ${targets.map(target => `
                    <button onclick="window.app.openBattlePreview('${GameState.game.selectedNodeId}', '${target.id}')">
                        ${target.name}
                    </button>
                `).join('')}
            </div>
        `;
    },

    renderBottomLogPanel() {
        const tabs = [
            { id: 'battle', label: '战报' },
            { id: 'chat', label: '聊天' },
            { id: 'diplomacy', label: '外交' },
            { id: 'system', label: '系统' }
        ];
        const activeTab = GameState.game.activeLogTab;
        const logs = GameState.game.logs.filter(log => log.type === activeTab);
        const fallback = activeTab === 'chat' ? '暂无聊天消息。' : '暂无记录。';

        return `
            <footer class="game-bottom-panel">
                <div class="log-tabs">
                    ${tabs.map(tab => `
                        <button class="log-tab ${activeTab === tab.id ? 'active' : ''}" onclick="window.app.setLogTab('${tab.id}')">
                            ${tab.label}
                        </button>
                    `).join('')}
                </div>
                <div class="log-content">
                    ${logs.length ? logs.map(log => `
                        <div class="log-entry log-entry-${log.type}">${escapeHtml(log.text)}</div>
                    `).join('') : `<div class="log-entry">${fallback}</div>`}
                </div>
                ${activeTab === 'chat' ? `
                    <div class="game-chat-row">
                        <input class="chat-input" type="text" placeholder="输入战场聊天"
                            onkeydown="window.app.handleGameChatKey(event)">
                    </div>
                ` : ''}
            </footer>
        `;
    },

    renderActionConfirmModal(confirm) {
        const node = MapData.getNode(confirm.nodeId);
        const targetNode = confirm.targetId ? MapData.getNode(confirm.targetId) : null;
        const actionMeta = window.app.getActionCost(confirm.action, confirm.nodeId);
        const isRecruit = confirm.action === 'recruit';
        const isMove = confirm.action === 'move';
        const recruitMax = isRecruit ? window.app.getMaxRecruitAmount(actionMeta.costPerSoldier) : 0;
        const recruitDraft = isRecruit ? window.app.getSelectedRecruitAmount(actionMeta.costPerSoldier) : 0;
        const moveMax = isMove ? GameState.getNodeMovableTroops(node) : 0;
        const moveDraft = isMove ? window.app.getSelectedMoveAmount(node) : 0;

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel compact-modal">
                    <header class="modal-header">
                        <h3>确认${actionMeta.label}</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <div class="modal-body">
                        <div class="confirm-line"><span>${isMove ? '出发节点' : '节点'}</span><strong>${node.name}</strong></div>
                        ${isMove && targetNode ? `<div class="confirm-line"><span>目标节点</span><strong>${targetNode.name}</strong></div>` : ''}
                        ${isRecruit ? `
                            <div class="recruit-slider-block">
                                <div class="recruit-slider-heading">
                                    <span>征兵数量</span>
                                    <strong data-recruit-count>${recruitDraft} / ${recruitMax} 人</strong>
                                </div>
                                <div class="recruit-slider-row">
                                    <button class="mini-control-btn" onclick="window.app.adjustRecruitDraftAmount(-1)">−</button>
                                    <input type="range" class="recruit-range tactical-range" min="1" max="${recruitMax}" value="${recruitDraft}"
                                        oninput="window.app.setRecruitDraftAmount(this.value, false)"
                                        onchange="window.app.setRecruitDraftAmount(this.value)">
                                    <input class="recruit-amount-input" type="number" min="1" max="${recruitMax}" value="${recruitDraft}"
                                        onchange="window.app.setRecruitDraftAmount(this.value)">
                                    <button class="mini-control-btn" onclick="window.app.adjustRecruitDraftAmount(1)">+</button>
                                    <button class="mini-control-btn" onclick="window.app.selectMaxRecruitAmount()">最大</button>
                                </div>
                                <div class="recruit-slider-hint text-muted" data-recruit-cost>
                                    每人 $${actionMeta.costPerSoldier}，本次共需 $${actionMeta.costMoney}（PP 不随数量变化）
                                </div>
                            </div>
                            <div class="confirm-line"><span>实际增援</span><strong data-recruit-effect>驻军 +${actionMeta.recruitAmount}</strong></div>
                        ` : isMove ? `
                            <div class="move-slider-block">
                                <div class="recruit-slider-heading">
                                    <span>移动数量</span>
                                    <strong data-move-count>${moveDraft} / ${moveMax} 支</strong>
                                </div>
                                <div class="recruit-slider-row">
                                    <button class="mini-control-btn" onclick="window.app.adjustMoveDraftAmount(-1)">−</button>
                                    <input type="range" class="move-range tactical-range" min="1" max="${moveMax}" value="${moveDraft}"
                                        oninput="window.app.setMoveDraftAmount(this.value, false)"
                                        onchange="window.app.setMoveDraftAmount(this.value)">
                                    <input class="move-amount-input" type="number" min="1" max="${moveMax}" value="${moveDraft}"
                                        onchange="window.app.setMoveDraftAmount(this.value)">
                                    <button class="mini-control-btn" onclick="window.app.adjustMoveDraftAmount(1)">+</button>
                                    <button class="mini-control-btn" onclick="window.app.selectMaxMoveAmount()">最大</button>
                                </div>
                                <div class="recruit-slider-hint text-muted" data-move-summary>
                                    ${node.name} → ${targetNode ? targetNode.name : ''}，调动 ${moveDraft} 支部队
                                </div>
                            </div>
                        ` : `
                            <div class="confirm-line"><span>效果</span><strong>${actionMeta.effect}</strong></div>
                        `}
                        <div class="confirm-line"><span>消耗</span><strong data-action-cost>${isMove ? '已支付移动令' : actionMeta.costText}</strong></div>
                        <div class="confirm-line"><span>行动次数</span><strong>${isMove ? GameState.game.actionCountThisTurn : GameState.game.actionCountThisTurn + 1}</strong></div>
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-outline" onclick="window.app.closeModals()">取消</button>
                        <button class="btn btn-primary" onclick="window.app.confirmAction()">确认</button>
                    </footer>
                </section>
            </div>
        `;
    },

    renderBattlePreviewModal(preview) {
        const attacker = MapData.getNode(preview.attackerId);
        const defender = MapData.getNode(preview.defenderId);
        const attackerFaction = GameState.getFaction(attacker.factionId);
        const defenderFaction = GameState.getFaction(defender.factionId);

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel battle-modal">
                    <header class="modal-header">
                        <h3>进攻预览：${attacker.name} → ${defender.name}</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <div class="battle-preview-grid">
                        <div class="battle-side" style="--faction-color: ${attackerFaction.color}">
                            <span>攻方：${attackerFaction.shortName}</span>
                            <strong>${preview.attackerBase}</strong>
                            <div>总驻军：${attacker.troops}</div>
                            <div>参战可动兵：${preview.attackerBase}</div>
                            <div>进攻修正：+10%</div>
                            <div>最终战力：${preview.attackerPower}</div>
                        </div>
                        <div class="battle-side" style="--faction-color: ${defenderFaction.color}">
                            <span>守方：${defenderFaction.shortName}</span>
                            <strong>${defender.troops}</strong>
                            <div>基础战力：${preview.defenderBase}</div>
                            <div>地形防御：+${preview.defenseBonus}%</div>
                            <div>最终战力：${preview.defenderPower}</div>
                        </div>
                    </div>
                    <div class="battle-result ${preview.attackerWins ? 'success' : 'danger'}">
                        ${preview.resultText}
                        <div class="text-muted">本次进攻消耗：${preview.ppCost || 1} PP（移动行动 + 递增消耗）</div>
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-outline" onclick="window.app.closeModals()">取消</button>
                        <button class="btn btn-danger" onclick="window.app.confirmBattle()">发动进攻</button>
                    </footer>
                </section>
            </div>
        `;
    },

    renderFocusTreeModal() {
        const tree = GameState.getFocusTree();
        const completed = GameState.game.completedFocuses;
        const pp = GameState.game.playerResources.pp;
        const layout = this.getFocusTreeLayout(tree);
        const selectedFocus = GameState.getFocusById(GameState.game.selectedFocusId) || tree[0];
        const scale = window.app.getFocusTreeScale();

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel focus-modal">
                    <header class="modal-header">
                        <h3>${GameState.getFactionName()} 国策树</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <div class="focus-toolbar">
                        <div class="focus-toolbar-stats">
                            <span>PP ${pp}/${GameState.getEffectivePPCap()}</span>
                            <span>推进消耗 ${window.app.getActionCost('focus').ppCost} PP</span>
                            <span>行动递增 +${GameState.getActionExtraCost()} PP</span>
                            <span>已完成 ${completed.length}/${tree.length}</span>
                        </div>
                        <div class="focus-zoom-controls">
                            <button class="map-icon-btn" title="缩小国策树" onclick="window.app.zoomFocusTree(-1)">−</button>
                            <span data-focus-zoom-label>${Math.round(scale * 100)}%</span>
                            <button class="map-icon-btn" title="放大国策树" onclick="window.app.zoomFocusTree(1)">+</button>
                            <button class="btn btn-outline" onclick="window.app.resetFocusTreeView()">居中</button>
                        </div>
                    </div>
                    <div class="focus-modal-body">
                        <div class="focus-tree-scroll">
                            <div class="focus-tree-stage" style="width: ${layout.width * scale}px; height: ${layout.height * scale}px;">
                                <div class="focus-tree-canvas" data-base-width="${layout.width}" data-base-height="${layout.height}"
                                    style="width: ${layout.width}px; height: ${layout.height}px; transform: scale(${scale});">
                                    ${this.renderFocusConnectors(tree, layout)}
                                    ${tree.map(focus => this.renderFocusCard(focus, layout)).join('')}
                                </div>
                            </div>
                        </div>
                        ${this.renderFocusDetailPanel(selectedFocus)}
                    </div>
                </section>
            </div>
        `;
    },

    getFocusTreeLayout(tree) {
        const cellWidth = 226;
        const cellHeight = 184;
        const cardWidth = 190;
        const cardHeight = 150;
        const padding = 36;
        const maxX = Math.max(...tree.map(focus => focus.x), 0);
        const maxY = Math.max(...tree.map(focus => focus.y), 0);
        const positions = tree.reduce((acc, focus) => {
            acc[focus.id] = {
                left: padding + focus.x * cellWidth,
                top: padding + focus.y * cellHeight,
                centerX: padding + focus.x * cellWidth + cardWidth / 2,
                centerY: padding + focus.y * cellHeight + cardHeight / 2,
                bottomY: padding + focus.y * cellHeight + cardHeight,
                topY: padding + focus.y * cellHeight
            };
            return acc;
        }, {});

        return {
            cellWidth,
            cellHeight,
            cardWidth,
            cardHeight,
            padding,
            positions,
            width: padding * 2 + maxX * cellWidth + cardWidth,
            height: padding * 2 + maxY * cellHeight + cardHeight
        };
    },

    getFocusParentIds(focus) {
        const directParents = focus.prerequisites || [];
        const optionalParents = (focus.prerequisiteAny || []).flat();
        return [...new Set([...directParents, ...optionalParents])];
    },

    renderFocusConnectors(tree, layout) {
        const lines = [];
        const mutualPairs = new Set();

        tree.forEach(focus => {
            const target = layout.positions[focus.id];
            this.getFocusParentIds(focus).forEach(parentId => {
                const source = layout.positions[parentId];
                if (!source || !target) return;
                const midY = source.bottomY + Math.max(18, (target.topY - source.bottomY) / 2);
                lines.push(`<path class="focus-link" d="M ${source.centerX} ${source.bottomY} V ${midY} H ${target.centerX} V ${target.topY}" />`);
            });

            (focus.mutuallyExclusive || []).forEach(otherId => {
                const key = [focus.id, otherId].sort().join('|');
                const other = layout.positions[otherId];
                if (!target || !other || mutualPairs.has(key)) return;
                mutualPairs.add(key);
                lines.push(`<path class="focus-mutual-link" d="M ${target.centerX} ${target.centerY} H ${other.centerX}" />`);
            });
        });

        return `
            <svg class="focus-connector-layer" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
                ${lines.join('')}
            </svg>
        `;
    },

    renderFocusCard(focus, layout) {
        const completed = GameState.game.completedFocuses;
        const status = GameState.getFocusStatus(focus, completed);
        const progress = GameState.getFocusProgressInfo(focus);
        const actionCost = window.app.getActionCost('focus').ppCost;
        const selected = GameState.game.selectedFocusId === focus.id;
        const stateClass = status === 'done'
            ? 'done'
            : status === 'available'
                ? 'available'
                : status === 'mutually-blocked'
                    ? 'blocked'
                    : status === 'pp-blocked'
                        ? 'pp-blocked'
                        : 'locked';
        const statusText = status === 'done'
            ? '已完成'
            : status === 'mutually-blocked'
                ? '互斥'
                : status === 'locked'
                    ? '锁定'
                    : status === 'pp-blocked'
                        ? 'PP不足'
                        : progress.current > 0
                            ? '推进中'
                            : '可推进';
        const position = layout.positions[focus.id];
        const progressPercent = Math.round(progress.ratio * 100);

        return `
            <button class="focus-card ${stateClass} ${selected ? 'selected' : ''}" data-focus-id="${focus.id}"
                style="left: ${position.left}px; top: ${position.top}px;"
                onclick="window.app.selectFocus('${focus.id}')">
                <div class="focus-branch">${focus.branch}</div>
                <div class="focus-title">${focus.name}</div>
                <div class="focus-card-row">
                    <span class="focus-status-pill">${statusText}</span>
                    <span>${progress.current}/${progress.required}</span>
                </div>
                <div class="focus-progress-mini" aria-label="国策推进进度">
                    <span style="width: ${progressPercent}%"></span>
                </div>
                <div class="focus-cost">推进 ${actionCost} PP</div>
            </button>
        `;
    },

    renderFocusDetailPanel(focus) {
        if (!focus) {
            return `
                <aside class="focus-detail-panel">
                    <div class="empty-state">
                        <strong>未选择国策</strong>
                        <span>点击国策节点查看详情与效果。</span>
                    </div>
                </aside>
            `;
        }

        const status = GameState.getFocusStatus(focus);
        const progress = GameState.getFocusProgressInfo(focus);
        const availability = window.app.getFocusAdvanceAvailability(focus.id);
        const disabled = availability.enabled ? '' : 'disabled';
        const title = availability.reason ? `title="${availability.reason}"` : '';
        const mutuals = focus.mutuallyExclusive || [];
        const prerequisiteHtml = this.renderFocusPrerequisites(focus);
        const effectsHtml = (focus.effects || []).map(effect => `<li>${this.renderFocusEffect(effect)}</li>`).join('');
        const mutualHtml = mutuals.length
            ? `<div class="focus-detail-block danger-block">
                    <span>互斥国策</span>
                    <strong>${mutuals.map(id => GameState.getFocusById(id)?.name || id).join(' / ')}</strong>
                </div>`
            : '';

        return `
            <aside class="focus-detail-panel" data-focus-detail-id="${focus.id}">
                <div class="focus-detail-heading">
                    <span>${focus.branch}</span>
                    <h3>${focus.name}</h3>
                    <p>${focus.description}</p>
                </div>

                <div class="focus-detail-progress">
                    <div>
                        <span>推进进度</span>
                        <strong>${progress.current}/${progress.required}</strong>
                    </div>
                    <div class="focus-progress-large"><span style="width: ${Math.round(progress.ratio * 100)}%"></span></div>
                </div>

                <div class="focus-detail-block">
                    <span>前置条件</span>
                    <strong>${prerequisiteHtml}</strong>
                </div>
                ${mutualHtml}

                <div class="focus-detail-block">
                    <span>完成效果</span>
                    <ul class="focus-effect-list">${effectsHtml || '<li>无直接效果</li>'}</ul>
                </div>

                <footer class="focus-detail-actions">
                    <div>
                        <span>${status === 'done' ? '已完成' : availability.reason || '可推进'}</span>
                        <strong>${availability.ppCost} PP</strong>
                    </div>
                    <button class="btn btn-primary" ${disabled} ${title} onclick="window.app.advanceFocus('${focus.id}')">
                        推进国策
                    </button>
                </footer>
            </aside>
        `;
    },

    renderFocusPrerequisites(focus) {
        const required = focus.prerequisites || [];
        const anyGroups = focus.prerequisiteAny || [];
        const direct = required.map(id => GameState.getFocusById(id)?.name || id);
        const optional = anyGroups.map(group => group.map(id => GameState.getFocusById(id)?.name || id).join(' + '));
        const parts = [
            ...direct,
            ...optional.map(text => `任一：${text}`)
        ];

        return parts.length ? parts.join(' / ') : '无';
    },

    renderFocusEffect(effect) {
        const signed = effect.amount > 0 ? `+${effect.amount}` : String(effect.amount);
        const percent = (val) => `${val > 0 ? '+' : ''}${Math.round(val * 100)}%`;

        if (effect.type === 'money') return `金钱 ${signed}`;
        if (effect.type === 'pp') return `PP ${signed}`;
        if (effect.type === 'actionCost') {
            const names = { recruit: '征兵', move: '移动士兵', build: '建设工业', focus: '推进国策', all: '全部行动' };
            return `${names[effect.action] || effect.action}基础 PP ${signed}`;
        }
        if (effect.type === 'recruitAmount') return `征兵数量 ${signed}`;
        if (effect.type === 'maintenanceRate') return `维护费率 ${percent(effect.amount)}`;
        if (effect.type === 'ppIncome') return `每回合 PP ${signed}`;
        if (effect.type === 'moneyIncome') return `每回合金钱 ${signed}`;
        if (effect.type === 'capitalTroops') return `当前首都驻军 ${signed}`;
        if (effect.type === 'capitalIndustry') return `当前首都工业 ${signed}`;
        if (effect.type === 'allTroops') return `所有己方节点驻军 ${signed}`;
        if (effect.type === 'allIndustry') return `最高工业的 ${effect.maxNodes || '全部'} 个己方节点工业 ${signed}`;
        if (effect.type === 'nodeIndustry') {
            const node = MapData.getNode(effect.nodeId);
            return `${node ? node.name : '指定城市'} 工业 ${signed}（若失守则作用于当前首都）`;
        }
        if (effect.type === 'taggedTroops') return `${effect.tag}节点驻军 ${signed}`;

        if (effect.type === 'ppCapBonus') return `PP 上限 ${signed}`;
        if (effect.type === 'recruitCost') return `征兵金钱成本 ${signed}（最低 1）`;
        if (effect.type === 'freeTroops') return `免维护士兵 ${signed} 名`;
        if (effect.type === 'globalAttack') return `全局进攻力 ${percent(effect.amount)}`;
        if (effect.type === 'globalDefense') return `全局防守力 ${percent(effect.amount)}`;
        if (effect.type === 'taggedDefense') return `${effect.tag}节点防守 ${percent(effect.amount)}`;
        if (effect.type === 'taggedIncome') return `每个${effect.tag}节点每回合 ${signed} 金钱`;
        if (effect.type === 'captureMoney') return `每次占领敌方节点立即 ${signed} 金钱`;
        if (effect.type === 'captureTroops') return `每次占领敌方节点驻军 ${signed}`;
        if (effect.type === 'crisisPP') return `首都失守时立即 ${signed} PP`;
        if (effect.type === 'industryCapBonus') return `提升 ${effect.maxNodes || 1} 个最高工业节点工业上限 ${signed}`;
        if (effect.type === 'taggedNodeMoney') return `立即获得：每个${effect.tag}节点 ${signed} 金钱`;
        if (effect.type === 'damageEnemyIndustry') return `破坏敌方工业最高的 ${effect.maxNodes || 3} 个节点工业 -${effect.amount || 1}`;
        if (effect.type === 'warBonds') return `立即 +${effect.amount} 金钱，未来 ${effect.turns} 回合每回合 -${effect.penalty} 金钱`;
        if (effect.type === 'allCapitalsTroops') return `所有己方首都/原始首都驻军 ${signed}`;
        if (effect.type === 'badge') return `获得国家修正：${effect.label}`;
        if (effect.type === 'ideology') {
            const ideology = GameState.ideologies[effect.id];
            return ideology ? `意识形态切换为「${ideology.name}」（替换上一意识形态的所有加成）` : `意识形态切换：${effect.id}`;
        }

        return `${effect.type} ${signed}`;
    },

    renderDiplomacyModal() {
        const rows = Object.entries(GameState.game.diplomacy).map(([factionId, data]) => {
            const faction = GameState.getFaction(factionId);
            return `
                <tr>
                    <td><span class="faction-swatch small" style="background: ${faction.color}"></span>${faction.shortName}</td>
                    <td>${data.relation}</td>
                    <td>${data.treaty}</td>
                    <td>
                        <button onclick="window.app.setDiplomacy('${factionId}', '停战')">停战</button>
                        <button onclick="window.app.setDiplomacy('${factionId}', '中立')">互不侵犯</button>
                        <button onclick="window.app.setDiplomacy('${factionId}', '战争')">宣战</button>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel diplomacy-modal">
                    <header class="modal-header">
                        <h3>外交</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <table class="diplomacy-table">
                        <thead>
                            <tr>
                                <th>势力</th>
                                <th>关系</th>
                                <th>条约</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </section>
            </div>
        `;
    },

    renderEndGameModal(winner) {
        const faction = GameState.getFaction(winner.factionId);
        return `
            <div class="modal-backdrop">
                <section class="modal-panel compact-modal endgame-modal" style="--faction-color: ${faction.color}">
                    <header class="modal-header">
                        <h3>${winner.type}</h3>
                    </header>
                    <div class="modal-body">
                        <div class="winner-mark">${faction.id}</div>
                        <h3>${faction.name}</h3>
                        <p class="text-muted">${winner.text}</p>
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-primary" onclick="window.app.dismissEndGame()">继续查看地图</button>
                    </footer>
                </section>
            </div>
        `;
    }
};
