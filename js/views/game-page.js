const GamePageView = {
    render() {
        const mobilePanel = window.app.mobilePanel || 'none';
        const scenario = GameState.getScenario();
        const isPlanLocked = window.SimultaneousTurns
            && SimultaneousTurns.isEnabled()
            && SimultaneousTurns.isFactionSubmitted(GameState.getPlayerFactionId());
        const isResolutionLocked = Boolean(window.app && window.app.resolutionAnimation);
        return `
            <div class="view-game-page scenario-${scenario.id} mobile-panel-${mobilePanel} ${isPlanLocked ? 'is-plan-locked' : ''} ${isResolutionLocked ? 'is-resolution-locked' : ''}">
                ${this.renderTopStatusBar()}
                ${this.renderLeftFactionPanel()}
                <main class="game-map-container">
                    ${MapView.render()}
                    ${this.renderCampaignBriefing()}
                </main>
                ${this.renderRightActionPanel()}
                ${this.renderBottomLogPanel()}
                ${this.renderMobileSelectedNodeChip()}
                ${this.renderMobilePanelDock()}
            </div>
        `;
    },

    renderCampaignBriefing() {
        const stage = GameState.getCampaignStage();
        if (!stage) return '';
        const game = GameState.game;
        const stories = GameState.getCampaignStories();
        const unread = stories.filter(item => !game.readStoryIds.includes(item.id)).length;
        return `
            <aside class="campaign-briefing ${stage.wartime ? 'campaign-wartime' : ''}" aria-label="战役阶段">
                <div>
                    <strong>${stage.label}</strong>
                    <small>${stage.detail}</small>
                </div>
                ${stories.length ? `
                    <button class="campaign-story-button" onclick="window.app.openCampaignStory()">
                        剧情档案 ${unread ? `<b aria-label="${unread} 条未读">${unread}</b>` : ''}
                    </button>
                ` : ''}
            </aside>
        `;
    },

    renderCampaignStory() {
        const entries = GameState.getCampaignStories();
        if (!entries.length) return '';
        const game = GameState.game;
        const selected = entries.find(item => item.id === game.selectedStoryId) || entries[0];
        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel campaign-story-modal" role="dialog" aria-modal="true" aria-label="西俄罗斯剧情档案">
                    <header class="modal-header">
                        <h3>西俄罗斯 · 剧情档案</h3>
                        <button class="modal-close" onclick="window.app.closeModals()" aria-label="关闭剧情">×</button>
                    </header>
                    <div class="campaign-story-layout">
                        <nav class="campaign-story-index" aria-label="已解锁档案">
                            ${entries.map((item, index) => `
                                <button aria-pressed="${item.id === selected.id}" onclick="window.app.openCampaignStory('${item.id}')">
                                    <span>${String(index + 1).padStart(2, '0')} · ${escapeHtml(item.category)}</span>
                                    <strong>${escapeHtml(item.title)}${game.readStoryIds.includes(item.id) ? '' : ' •'}</strong>
                                </button>
                            `).join('')}
                        </nav>
                        <article class="campaign-story-page">
                            <small>${escapeHtml(selected.category)}</small>
                            <h4>${escapeHtml(selected.title)}</h4>
                            <p>${escapeHtml(selected.text)}</p>
                        </article>
                    </div>
                </section>
            </div>
        `;
    },

    renderMobileSelectedNodeChip() {
        const node = MapData.getNode(GameState.game.selectedNodeId);
        if (!node) return '';

        const faction = GameState.getFaction(node.factionId);
        const isFriendly = node.factionId === GameState.getPlayerFactionId();
        const movable = GameState.getNodeMovableTroops(node);
        const canOrder = isFriendly && movable > 0 && window.app.getActionAvailability('move', node.id).enabled;
        const isOrdering = canOrder && GameState.game.currentAction === 'move';
        const contextText = isOrdering
            ? (GameState.isWarOpen() ? '点相邻高亮省区，预览调兵或进攻' : '发育期 · 点击高亮省区调兵')
            : `${faction.shortName} · 驻军 ${node.troops} · 可动 ${movable} · 工业 ${node.industry}`;
        const primaryAction = canOrder
            ? `<button class="btn btn-primary btn-sm" onclick="window.app.activateMove()">${isOrdering ? '退出行军' : '行军'}</button>`
            : '';

        return `
            <div class="mobile-node-chip" style="--faction-color: ${faction.color}">
                <div class="mobile-node-chip-main">
                    <span>${node.abbr}</span>
                    <div>
                        <strong>${node.name}</strong>
                        <small>${contextText}</small>
                    </div>
                </div>
                <div class="mobile-node-chip-actions">
                    ${primaryAction}
                    <button class="btn btn-outline btn-sm" onclick="window.app.setMobilePanel('actions')">详情</button>
                </div>
            </div>
        `;
    },

    renderMobilePanelDock() {
        const active = window.app.mobilePanel || 'none';
        const items = [
            { id: 'actions', label: '行动' },
            { id: 'intel', label: '情报' },
            { id: 'logs', label: '战报' },
            { id: 'none', label: '地图' }
        ];

        return `
            <nav class="mobile-panel-dock" aria-label="手机端面板切换">
                ${items.map(item => {
                    const panel = item.id === 'none' ? null : item.id;
                    return `
                        <button class="${active === item.id ? 'active' : ''}" onclick="window.app.setMobilePanel(${panel ? `'${panel}'` : 'null'})">
                            ${item.label}
                        </button>
                    `;
                }).join('')}
            </nav>
        `;
    },

    renderModals() {
        const game = GameState.game;
        return [
            game.actionConfirm ? this.renderActionConfirmModal(game.actionConfirm) : '',
            game.battlePreview ? this.renderBattlePreviewModal(game.battlePreview) : '',
            game.showFocusModal ? this.renderFocusTreeModal() : '',
            game.showDiplomacyModal ? this.renderDiplomacyModal() : '',
            game.showModifiersModal ? this.renderModifiersModal() : '',
            game.showStoryModal ? this.renderCampaignStory() : '',
            game.winner && game.showEndGameModal !== false ? this.renderEndGameModal(game.winner) : ''
        ].join('');
    },

    renderTopStatusBar() {
        const game = GameState.game;
        const resources = game.playerResources;
        const playerFaction = GameState.getFaction(GameState.getPlayerFactionId());
        const isLowTime = Number.isFinite(game.timerRemaining) && game.timerRemaining <= 15;
        const isSimultaneous = window.SimultaneousTurns && SimultaneousTurns.isEnabled();
        const resolutionReplay = window.app && window.app.resolutionAnimation;
        const submitted = isSimultaneous
            ? SimultaneousTurns.isFactionSubmitted(GameState.getPlayerFactionId())
            : false;
        const readyCount = isSimultaneous ? SimultaneousTurns.getReadyHumanCount() : 0;
        const humanCount = isSimultaneous ? SimultaneousTurns.getHumanPlayerCount() : 0;
        const readyProgress = `${readyCount}/${humanCount}`;
        const allHumansReady = isSimultaneous && humanCount > 0 && readyCount >= humanCount;
        const finalizingReady = GameState.lobby.mode === 'online' && submitted && allHumansReady;
        const isPlayerTurn = isSimultaneous
            ? SimultaneousTurns.canLocalPlayerAct()
            : game.currentPlayerId === GameState.getPlayerFactionId();
        const resourcePreview = GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId());
        const debtPenalty = GameState.getDebtPenalty(resources.money);
        let turnTag;
        if (isSimultaneous) {
            turnTag = resolutionReplay
                ? `第 ${resolutionReplay.turn} 回合 · 结算回放`
                : game.phase === 'resolving'
                ? '统一结算中'
                : submitted
                    ? finalizingReady ? `全员已准备 ${readyProgress} · 锁定结算中` : `已准备 ${readyProgress} · 行动已锁定`
                    : `同时规划 · 已准备 ${readyProgress}`;
        } else if (isPlayerTurn) {
            turnTag = '你的回合';
        } else if (GameState.getSlot(game.currentPlayerId)?.kind === 'ai') {
            const faction = GameState.getFaction(game.currentPlayerId);
            const currentSlot = GameState.getSlot(game.currentPlayerId);
            turnTag = `AI 行动中（${currentSlot.playerName || faction.shortName}）`;
        } else if (GameState.getSlot(game.currentPlayerId)?.kind === 'human') {
            const currentSlot = GameState.getSlot(game.currentPlayerId);
            turnTag = `等待 ${currentSlot.playerName} 行动`;
        } else {
            turnTag = '轮替中…';
        }

        return `
            <header class="game-top-bar ${isPlayerTurn ? 'is-player-turn' : 'is-waiting'}">
                <div class="top-brand-block">
                    <strong>${GameState.getCampaignStage() ? '西俄罗斯' : '裂旗战争'}</strong>
                    <span>房间 ${escapeHtml(GameState.lobby.roomCode)}${GameState.lobby.mode === 'online' ? ' · 联机' : ' · 本地'}</span>
                </div>

                <div class="top-bar-stats">
                    <div class="top-stat-item mobile-core-stat">
                        <span class="top-stat-label">回合</span>
                        <span class="top-stat-value">${game.currentTurn}</span>
                    </div>
                    <div class="top-stat-item mobile-core-stat">
                        <span class="top-stat-label">${isSimultaneous ? '阶段' : '当前'}</span>
                        ${isSimultaneous ? `
                            <span class="top-stat-value phase-value">${resolutionReplay ? '回放' : game.phase === 'resolving' ? '结算' : '规划'}</span>
                        ` : `
                            <span class="top-stat-value" style="color: ${GameState.getFaction(game.currentPlayerId).color}">${GameState.getFaction(game.currentPlayerId).shortName}</span>
                        `}
                    </div>
                    <div class="top-stat-item mobile-optional-stat">
                        <span class="top-stat-label">计时</span>
                        <span class="top-stat-value timer ${isLowTime ? 'danger' : ''}">${formatTimer(game.timerRemaining)}</span>
                    </div>
                    <div class="top-stat-item mobile-core-stat">
                        <span class="top-stat-label">$</span>
                        <span class="top-stat-value ${resources.money < 0 ? 'negative-money' : ''}">
                            ${formatMoney(resources.money)}
                            <span class="resource-delta ${this.deltaClass(resourcePreview.moneyDelta)}">(${formatSignedMoney(resourcePreview.moneyDelta)})</span>
                        </span>
                    </div>
                    ${debtPenalty.threshold > 0 ? `
                        <div class="top-stat-item debt-top-indicator mobile-core-stat">
                            <span class="top-stat-label">赤字</span>
                            <span class="top-stat-value negative-money">${debtPenalty.label}</span>
                        </div>
                    ` : ''}
                    <div class="top-stat-item mobile-core-stat">
                        <span class="top-stat-label">PP</span>
                        <span class="top-stat-value">
                            ${resources.pp}/${GameState.getEffectivePPCap()}
                            <span class="resource-delta ${this.deltaClass(resourcePreview.ppDelta)}">(${formatSignedMoney(resourcePreview.ppDelta)})</span>
                        </span>
                    </div>
                    <div class="top-stat-item mobile-optional-stat">
                        <span class="top-stat-label">行动递增</span>
                        <span class="top-stat-value">+${GameState.getActionExtraCost()} PP</span>
                    </div>
                    <div class="top-stat-item mobile-optional-stat">
                        <span class="top-stat-label">省区</span>
                        <span class="top-stat-value">${resources.nodes}</span>
                    </div>
                    <div class="top-stat-item mobile-optional-stat">
                        <span class="top-stat-label">工业</span>
                        <span class="top-stat-value">${resources.totalIndustry}</span>
                    </div>
                </div>

                <div class="top-actions">
                    <span class="connection-dot ${isPlayerTurn ? '' : 'waiting'}">${turnTag}</span>
                    <button class="btn btn-primary ${isSimultaneous ? 'turn-ready-button' : ''} ${submitted ? 'is-submitted' : ''}"
                        ${!game.gameOver && !resolutionReplay && !finalizingReady && (isSimultaneous ? game.phase === 'planning' : isPlayerTurn) ? '' : 'disabled'}
                        ${isSimultaneous ? `aria-pressed="${submitted}" title="${finalizingReady ? '全员已准备，等待房主统一结算' : submitted ? '取消准备并恢复本回合操作' : '准备完毕后将锁定本回合操作'}"` : ''}
                        onclick="window.app.endTurn()">
                        ${isSimultaneous ? `
                            <span class="turn-ready-label">${resolutionReplay ? '统一结算中' : finalizingReady ? '锁定结算中' : submitted ? '取消准备' : '准备完毕'}</span>
                            <span class="turn-ready-count">${resolutionReplay ? `第 ${resolutionReplay.turn} 回合回放` : `${readyProgress} 已准备`}</span>
                        ` : '结束回合'}
                    </button>
                    <button class="btn btn-danger top-exit-button" onclick="window.app.exitGame()">
                        退出
                    </button>
                </div>
                <div class="current-player-strip" style="--current-color: ${playerFaction.color}"></div>
            </header>
        `;
    },

    deltaClass(value) {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    },

    renderLeftFactionPanel() {
        const playerFaction = GameState.getFaction(GameState.getPlayerFactionId());
        const originalCapital = MapData.getNode(playerFaction.capitalNodeId);
        const capital = MapData.getNode(GameState.getCapitalNodeId(playerFaction.id));
        const resources = GameState.game.playerResources;
        const victoryProgress = Math.round((resources.nodes / MapData.nodes.length) * 100);
        const isOriginalCapitalHeld = originalCapital && originalCapital.factionId === playerFaction.id;
        const ideology = GameState.getIdeology();
        const debtPenalty = GameState.getDebtPenalty(resources.money);
        const tree = GameState.getFocusTree();
        const completed = tree.filter(focus => this.isFocusCompleted(focus)).length;

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
                            <span>驻军总数</span>
                            <strong>${resources.totalTroops}</strong>
                        </div>
                        <div>
                            <span>国策</span>
                            <strong>${completed}/${tree.length}</strong>
                        </div>
                        <div>
                            <span>胜利进度</span>
                            <strong>${victoryProgress}%</strong>
                        </div>
                    </div>
                    ${ideology ? this.renderIdeologyCard(ideology) : ''}
                    ${debtPenalty.threshold > 0 ? this.renderDebtStatusCard(debtPenalty) : ''}
                    <div class="passive-line">有效政治点收入：每回合 +${GameState.getTurnPPIncome()} PP；步兵维护：每人 $${formatMoney(GameState.getMaintenanceRate())}</div>
                    <div class="panel-actions">
                        <button class="btn btn-primary" onclick="window.app.openFocusModal()">国策</button>
                        <button class="btn btn-outline" onclick="window.app.openModifiersModal()">国家修正</button>
                        <button class="btn btn-outline" onclick="window.app.openDiplomacyModal()">外交</button>
                    </div>
                </section>

                <section class="panel-section">
                    <div class="section-title-row">
                        <h3>势力排行</h3>
                        <select class="compact-select" onchange="window.app.setRankingMetric(this.value)">
                            <option value="nodes" ${window.app.rankingMetric === 'nodes' ? 'selected' : ''}>省区</option>
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

    renderDebtStatusCard(debtPenalty) {
        const attackPenalty = debtPenalty.globalAttackDelta
            ? `进攻 ${Math.round(debtPenalty.globalAttackDelta * 100)}%`
            : '';
        const defensePenalty = debtPenalty.globalDefenseDelta
            ? `防守 ${Math.round(debtPenalty.globalDefenseDelta * 100)}%`
            : '';
        const actionPenalty = debtPenalty.actionCostDelta
            ? `全部行动基础 PP +${debtPenalty.actionCostDelta}`
            : '';
        const ppPenalty = debtPenalty.ppIncomeDelta
            ? `PP 收入 ${debtPenalty.ppIncomeDelta}`
            : '';
        const desertionPenalty = debtPenalty.desertionRate
            ? `每回合逃散 ${Math.round(debtPenalty.desertionRate * 100)}% 部队`
            : '';
        const items = [ppPenalty, attackPenalty, defensePenalty, actionPenalty, desertionPenalty].filter(Boolean);

        return `
            <div class="debt-status-card severity-${debtPenalty.threshold}">
                <div>
                    <span>财政赤字 $${formatMoney(debtPenalty.debt)}</span>
                    <strong>${debtPenalty.label}</strong>
                </div>
                <p>${debtPenalty.description}</p>
                <small>${items.join('；')}</small>
            </div>
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
        const pct = (n) => `${formatMoney(n * 100)}%`;
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
                const names = { recruit: '征兵', disband: '裁军', move: '移动', build: '建设', focus: '推进国策', all: '全部行动' };
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
                    <span class="diplomacy-badge-name">${faction.shortName}</span>
                    <span class="diplomacy-badge-relation">${data.relation}</span>
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
                    ${this.renderRouteAction()}
                </section>
            </aside>
        `;
    },

    renderRouteAction() {
        if (GameState.getScenario().id !== 'west-russia') return '';
        const factionId = GameState.getPlayerFactionId();
        const state = GameState.getGameModifiers().routeState;
        if (!state) return `<div class="route-action-card"><span class="route-eyebrow">国家道路</span><p>政治分支决定制度、代价与专属国家行动。选择分支前，可在国策详情对比终局。</p></div>`;
        const outcome = WestRussiaEndings.getById(state.id);
        if (!outcome) return '';
        const action = WestRussiaRouteActions.describe(factionId, GameState.game.selectedNodeId);
        if (!action) return '';
        const nodes = MapData.getFactionNodes(factionId).length;
        const required = Math.max(12, outcome.goalNodes || 12);
        const fulfilled = state.objectiveComplete || (state.uses || 0) >= 3 && nodes >= required;
        return `<section class="route-action-card" data-route-id="${escapeHtml(state.id)}">
            <span class="route-eyebrow">${fulfilled ? '制度成就已达成' : '国家道路 · 已确立'}</span>
            <h4>${escapeHtml(outcome.title)}</h4>
            <p>${escapeHtml(outcome.playstyle)}</p>
            <div class="route-tradeoff"><strong>代价</strong> ${escapeHtml(outcome.tradeoff)}</div>
            <div class="route-goal">施政 ${state.uses || 0}/3 次 · 控制 ${nodes}/${required} 省</div>
            <div class="route-power"><strong>${escapeHtml(action.name || '国家行动')}</strong><p>${escapeHtml(action.description || '')}</p>
                <small>$${formatMoney(action.moneyCost || 0)} · ${action.ppCost || 0} PP · 冷却 ${action.cooldown || 0} 回合</small>
                <button class="btn btn-primary" ${action.enabled ? '' : 'disabled'} onclick="window.app.executeRouteAction()">${escapeHtml(action.name || '执行国家行动')}</button>
                ${action.reason ? `<small class="route-action-reason">${escapeHtml(action.reason)}</small>` : ''}
            </div>
        </section>`;
    },

    renderRouteOutcome(outcome) {
        if (!outcome) return '';
        return `<div class="focus-detail-block route-outcome-preview">
            <span>路线终局 · ${escapeHtml(outcome.title)}</span>
            <p>${escapeHtml(outcome.playstyle)}</p>
            <dl><dt>制度收益</dt><dd>${escapeHtml(outcome.payoff)}</dd><dt>必须承担</dt><dd>${escapeHtml(outcome.tradeoff)}</dd><dt>施政目标</dt><dd>${escapeHtml(outcome.goal)}</dd></dl>
            <ul class="focus-effect-list">${(outcome.effects || []).map(effect => `<li>${escapeHtml(this.formatIdeologyBonus(effect))}</li>`).join('')}</ul>
            <small>确立新制度时替换上一套终局修正和国家行动。</small>
        </div>`;
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
                <strong>未选择省区</strong>
                <span>点击地图上的任意省区查看驻军和工业。选中己方省区后，可以征兵、建设或规划行军。</span>
            </div>
            <div class="action-help-block">
                当前可用 PP：${GameState.game.playerResources.pp}<br>
                下一回合有效收入：+${GameState.getTurnPPIncome()} PP
            </div>
        `;
    },

    isLocalSeaMode() {
        return GameState.lobby && GameState.lobby.mode === 'local';
    },

    getObservedFactionResources(factionId) {
        const faction = GameState.getFaction(factionId);
        const slot = GameState.getSlot(factionId);
        const stats = MapData.calculateFactionStats(factionId);
        const capital = MapData.getNode(GameState.getCapitalNodeId(factionId));
        let money = faction.startingStats.money;
        let pp = faction.startingStats.pp;
        let source = '开局基准';
        let nextTurn = null;

        if (factionId === GameState.getPlayerFactionId()) {
            money = GameState.game.playerResources.money;
            pp = GameState.game.playerResources.pp;
            source = '玩家资源';
            const preview = GameState.getNextTurnResourcePreview(factionId);
            nextTurn = {
                moneyDelta: preview.moneyDelta,
                income: preview.grossIncome,
                maintenance: preview.maintenance,
                ppIncome: preview.ppIncome
            };
        } else if (slot && slot.kind === 'ai' && GameState.game.aiResources && GameState.game.aiResources[factionId]) {
            money = GameState.game.aiResources[factionId].money;
            pp = GameState.game.aiResources[factionId].pp;
            source = `AI · ${typeof LobbyView !== 'undefined' ? LobbyView.difficultyLabel(slot.aiDifficulty) : (slot.aiDifficulty || 'normal')}`;
            if (window.GameAI && GameAI.calculateAiTurnPreview) {
                const profile = GameAI.getDifficultyProfile(slot.aiDifficulty || 'normal', factionId);
                const preview = GameAI.calculateAiTurnPreview(factionId, GameState.game.aiResources[factionId], profile);
                nextTurn = {
                    moneyDelta: preview.moneyDelta,
                    income: preview.income,
                    maintenance: preview.maintenance,
                    ppIncome: preview.ppIncome
                };
            }
        } else if (slot && slot.kind === 'human') {
            source = '玩家席位';
        } else if (slot && slot.kind === 'open') {
            source = '空席待机';
        }

        return {
            faction,
            slot,
            stats,
            capital,
            money,
            pp,
            nextTurn,
            source
        };
    },

    renderSeaModeFactionCard(factionId) {
        if (!this.isLocalSeaMode()) return '';
        const observed = this.getObservedFactionResources(factionId);
        const completedCount = GameState.getFocusTree(factionId)
            .filter(focus => GameState.game.completedFocuses.includes(focus.id))
            .length;
        const focusCount = GameState.getFocusTree(factionId).length;
        const debtPenalty = GameState.getDebtPenalty(observed.money);

        return `
            <div class="sea-mode-card" style="--faction-color: ${observed.faction.color}">
                <div class="section-title-row">
                    <h3>看海模式</h3>
                    <span>${observed.source}</span>
                </div>
                <div class="node-detail-grid">
                    <div><span>金钱</span><strong class="${observed.money < 0 ? 'negative-money' : ''}">$ ${formatMoney(observed.money)}</strong></div>
                    <div><span>PP</span><strong>${formatMoney(observed.pp)}</strong></div>
                    <div><span>下回合金钱</span><strong>${observed.nextTurn ? `${formatSignedMoney(observed.nextTurn.moneyDelta)}（+$${formatMoney(observed.nextTurn.income)} / -$${formatMoney(observed.nextTurn.maintenance)}）` : '未知'}</strong></div>
                    <div><span>下回合 PP</span><strong>${observed.nextTurn ? formatSignedMoney(observed.nextTurn.ppIncome) : '未知'}</strong></div>
                    <div><span>省区</span><strong>${observed.stats.nodes}</strong></div>
                    <div><span>工业</span><strong>${observed.stats.totalIndustry}</strong></div>
                    <div><span>总兵力</span><strong>${observed.stats.totalTroops}</strong></div>
                    <div><span>首都</span><strong>${observed.capital ? observed.capital.name : '灭亡'}</strong></div>
                    <div><span>国策</span><strong>${completedCount}/${focusCount}</strong></div>
                    <div><span>财政</span><strong>${debtPenalty.threshold > 0 ? debtPenalty.label : '稳定'}</strong></div>
                </div>
                <div class="panel-actions">
                    <button class="btn btn-outline" onclick="window.app.openFocusModal('${factionId}')">查看国策树</button>
                </div>
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
        const isEncircled = MapData.isNodeEncircled(node);
        const nodeLabels = [
            ...node.tags.filter(tag => tag !== '首都'),
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
                <div class="node-detail-grid province-stats">
                    <div><span>驻军</span><strong>${node.troops}</strong></div>
                    <div><span>可调动</span><strong>${movableTroops}</strong></div>
                    <div><span>工业</span><strong>${node.industry}</strong></div>
                </div>
                <div class="province-meta">${node.terrain} · 新兵 ${freshTroops} · 已行动／预留 ${waitingTroops}</div>
                ${nodeLabels.length ? `<div class="province-meta">${nodeLabels.join(' · ')}</div>` : ''}
                ${isEncircled ? `
                    <div class="action-help-block hostile">
                        ⚠ 该节点已被包围（所有相邻节点均为敌方）：本节点部队进攻 -35%、防守 -35%。
                    </div>
                ` : ''}
            </div>

            ${isFriendly ? this.renderNodePlanOrders(node) : ''}
            ${isFriendly ? `
                <div class="action-button-grid">
                    ${this.renderActionButton('recruit', '征兵')}
                    ${this.renderActionButton('disband', '裁军')}
                    ${this.renderActionButton('move', this.getMoveButtonLabel(), movableTroops > 0)}
                    ${this.renderActionButton('build', '建设工业')}
                </div>
                ${GameState.game.currentAction === 'move' ? this.renderMoveTargets(node, moveTargets) : ''}
                ${window.app.getActionAvailability('move', node.id).enabled ? this.renderAttackTargets(node, attackTargets) : ''}
            ` : `
                <div class="action-help-block hostile">
                    敌方省区。选中相邻己方省区，再右键这里或使用行军模式规划进攻。
                </div>
            `}

            <div class="neighbor-list">
                <span>接壤省区 · 点击查看</span>
                <div>${neighbors.map(neighbor => `<button onclick="window.app.inspectProvince('${neighbor.id}')">${neighbor.name}</button>`).join('')}</div>
            </div>
            ${this.renderSeaModeFactionCard(node.factionId)}
        `;
    },

    renderNodePlanOrders(node) {
        if (!window.SimultaneousTurns || !SimultaneousTurns.isEnabled()) return '';
        const orders = SimultaneousTurns.getOrders().filter(order => order.sourceId === node.id);
        if (!orders.length) return '';
        const locked = SimultaneousTurns.isFactionSubmitted(GameState.getPlayerFactionId());
        return `
            <div class="node-plan-orders">
                <div class="node-plan-orders-heading">
                    <span>本节点行军计划</span>
                    <strong>${orders.reduce((sum, order) => sum + order.amount, 0)} 支已分配</strong>
                </div>
                ${orders.map(order => {
                    const target = MapData.getNode(order.targetId);
                    const coordination = order.kind === 'attack'
                        ? SimultaneousTurns.getAttackCoordination(order.targetId, order.factionId)
                        : null;
                    const coordinationNote = coordination && coordination.bonus > 0
                        ? `<small class="coordination-note">${coordination.directions} 路围攻 · 进攻 +${coordination.bonus}%</small>`
                        : '';
                    return `
                        <div class="node-plan-order ${order.kind === 'attack' ? 'attack' : ''}">
                            <span>${order.kind === 'attack' ? '进攻' : '移动'}至 ${target ? target.name : order.targetId}${coordinationNote}</span>
                            <strong>${order.amount}</strong>
                            <button ${locked ? 'disabled' : ''} onclick="window.app.cancelPlannedOrder('${order.id}')">撤销</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    getMoveButtonLabel() {
        return GameState.game.currentAction === 'move' ? '退出行军' : '规划行军';
    },

    renderActionButton(action, label, hasTroops = true) {
        const availability = window.app.getActionAvailability(action);
        const enabled = availability.enabled && hasTroops;
        const disabled = enabled ? '' : 'disabled';
        const reason = hasTroops ? availability.reason : '本省区没有可调动的部队';
        const title = reason ? `title="${reason}"` : '';
        const handler = action === 'move'
            ? 'window.app.activateMove()'
            : `window.app.openAction('${action}')`;

        return `
            <button class="btn ${enabled ? 'btn-primary' : 'btn-outline'} action-btn" ${disabled} ${title}
                onclick="${handler}">
                <span>${label}</span>
                <small>${availability.cost}</small>
            </button>
        `;
    },

    renderMoveTargets(source, targets) {
        const maxAmount = GameState.getNodeMovableTroops(source);
        const amount = window.app.getSelectedMoveAmount(source);

        if (maxAmount < 1) {
            return `<div class="action-help-block">该节点没有可移动士兵。本回合新征召或已经移动过的士兵不能再移动。</div>`;
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

    renderAttackTargets(source, targets) {
        if (!targets.length) return '';

        return `
            <div class="target-list attack-target-list">
                <span>可进攻</span>
                ${targets.map(target => `
                    <button onclick="window.app.openBattlePreview('${source.id}', '${target.id}')">
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
        const isDisband = confirm.action === 'disband';
        const isMove = confirm.action === 'move';
        const recruitMax = isRecruit ? window.app.getMaxRecruitAmount(actionMeta.costPerSoldier) : 0;
        const recruitDraft = isRecruit ? window.app.getSelectedRecruitAmount(actionMeta.costPerSoldier) : 0;
        const recruitMoneyPreview = isRecruit ? window.app.getRecruitMoneyPreviewText(actionMeta) : '';
        const disbandMax = isDisband ? window.app.getMaxDisbandAmount(node) : 0;
        const disbandDraft = isDisband ? window.app.getSelectedDisbandAmount(node) : 0;
        const disbandMoneyPreview = isDisband ? window.app.getDisbandMoneyPreviewText(actionMeta) : '';
        const disbandCurrent = isDisband ? GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId()) : null;
        const disbandAfter = isDisband ? GameState.getNextTurnResourcePreview(GameState.getPlayerFactionId(), {
            extraTroops: -disbandDraft,
            moneyGained: disbandDraft,
            ppSpent: actionMeta.ppCost || 0
        }) : null;
        const disbandImprovement = isDisband ? disbandAfter.projectedMoney - disbandCurrent.projectedMoney : 0;
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
                                    每人 $${formatMoney(actionMeta.costPerSoldier)}，本次共需 $${formatMoney(actionMeta.costMoney)}（PP 不随数量变化）
                                </div>
                                <div class="recruit-slider-hint recruit-income-preview" data-recruit-next-money>
                                    ${recruitMoneyPreview}
                                </div>
                            </div>
                            <div class="confirm-line"><span>实际增援</span><strong data-recruit-effect>驻军 +${actionMeta.recruitAmount}</strong></div>
                        ` : isDisband ? `
                            <div class="recruit-slider-block">
                                <div class="recruit-slider-heading">
                                    <span>裁军数量</span>
                                    <strong data-disband-count>${disbandDraft} / ${disbandMax} 支（下回合 +$${formatMoney(disbandImprovement)}）</strong>
                                </div>
                                <div class="recruit-slider-row">
                                    <button class="mini-control-btn" onclick="window.app.adjustDisbandDraftAmount(-1)">−</button>
                                    <input type="range" class="disband-range tactical-range" min="1" max="${disbandMax}" value="${disbandDraft}"
                                        oninput="window.app.setDisbandDraftAmount(this.value, false)"
                                        onchange="window.app.setDisbandDraftAmount(this.value)">
                                    <input class="disband-amount-input" type="number" min="1" max="${disbandMax}" value="${disbandDraft}"
                                        onchange="window.app.setDisbandDraftAmount(this.value)">
                                    <button class="mini-control-btn" onclick="window.app.adjustDisbandDraftAmount(1)">+</button>
                                    <button class="mini-control-btn" onclick="window.app.selectMaxDisbandAmount()">最大</button>
                                </div>
                                <div class="recruit-slider-hint text-muted" data-disband-gain>
                                    立即获得 $${formatMoney(disbandDraft)}，并减少 ${disbandDraft} 支部队维护
                                </div>
                                <div class="recruit-slider-hint recruit-income-preview" data-disband-next-money>
                                    ${disbandMoneyPreview}
                                </div>
                            </div>
                            <div class="confirm-line"><span>实际裁撤</span><strong data-disband-effect>驻军 -${disbandDraft}，金钱 +$${formatMoney(disbandDraft)}</strong></div>
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
                        <div class="confirm-line"><span>消耗</span><strong data-action-cost>${isMove ? this.renderMovementCost() : actionMeta.costText}</strong></div>
                        <div class="confirm-line"><span>行动次数</span><strong>${GameState.game.actionCountThisTurn + (isMove && GameState.game.movementOrdersActive ? 0 : 1)}</strong></div>
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-outline" onclick="window.app.closeModals()">取消</button>
                        <button class="btn btn-primary" onclick="window.app.confirmAction()">确认</button>
                    </footer>
                </section>
            </div>
        `;
    },

    renderMovementCost() {
        return GameState.game.movementOrdersActive
            ? '已发布移动令 · 0 PP'
            : `首次行军 · ${window.app.getActionAvailability('move').ppCost} PP`;
    },

    renderBattlePreviewModal(preview) {
        const attacker = MapData.getNode(preview.attackerId);
        const defender = MapData.getNode(preview.defenderId);
        const attackerFaction = GameState.getFaction(attacker.factionId);
        const defenderFaction = GameState.getFaction(defender.factionId);
        const maxAttackers = Math.max(1, preview.maxAttackers || preview.attackerBase || 1);
        const battleSummary = window.app.getBattleSummaryText(preview);

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
                            <strong data-battle-combined-base>${preview.combinedAttackerBase}</strong>
                            <div>总驻军：${attacker.troops}</div>
                            <div>本路新增：<span data-battle-attacker-base>${preview.attackerBase}</span> / ${maxAttackers}</div>
                            ${preview.existingPlannedTroops > 0 ? `<div>既有计划：${preview.existingPlannedTroops} 支</div>` : ''}
                            <div class="battle-coordination ${preview.multiDirectionBonus > 0 ? 'active' : ''}" data-battle-coordination>
                                ${preview.multiDirectionBonus > 0
                                    ? `${preview.attackDirections} 路协同 · 进攻 +${preview.multiDirectionBonus}%`
                                    : `${preview.attackDirections} 路进攻 · 暂无围攻加成`}
                            </div>
                            <div>进攻修正：${formatSignedPercent(preview.attackerAttackBonus)}</div>
                            ${preview.attackerEncircled ? `<div class="danger-text">⚠ 被包围：进攻 -35%</div>` : ''}
                            <div>最终战力：<span data-battle-attacker-power>${preview.attackerPower}</span></div>
                        </div>
                        <div class="battle-side" style="--faction-color: ${defenderFaction.color}">
                            <span>守方：${defenderFaction.shortName}</span>
                            <strong>${defender.troops}</strong>
                            <div>基础战力：${preview.defenderBase}</div>
                            <div>地形防御：${formatSignedPercent(preview.defenseBonus)}</div>
                            ${preview.defenderEncircled ? `<div class="danger-text">⚠ 被包围：防守 -35%</div>` : ''}
                            <div>最终战力：<span data-battle-defender-power>${preview.defenderPower}</span></div>
                        </div>
                    </div>
                    <div class="battle-slider-block">
                        <div class="recruit-slider-heading">
                            <span>参战数量</span>
                            <strong data-battle-count>${preview.attackerBase} / ${maxAttackers} 支</strong>
                        </div>
                        <div class="recruit-slider-row battle-slider-row">
                            <button class="mini-control-btn" onclick="window.app.adjustBattleDraftAmount(-1)">-</button>
                            <input type="range" class="battle-range tactical-range" min="1" max="${maxAttackers}" value="${preview.attackerBase}"
                                oninput="window.app.setBattleDraftAmount(this.value, false)"
                                onchange="window.app.setBattleDraftAmount(this.value)">
                            <input class="battle-amount-input" type="number" min="1" max="${maxAttackers}" value="${preview.attackerBase}" onchange="window.app.setBattleDraftAmount(this.value)">
                            <button class="mini-control-btn" onclick="window.app.adjustBattleDraftAmount(1)">+</button>
                            <button class="mini-control-btn" onclick="window.app.selectMaxBattleAmount()">最大</button>
                        </div>
                        <div class="recruit-slider-hint text-muted" data-battle-summary>${battleSummary}</div>
                    </div>
                    <div class="battle-result ${preview.attackerWins ? 'success' : 'danger'}" data-battle-result>
                        <span data-battle-result-text>${preview.resultText}</span>
                        <div class="text-muted">本次消耗 · ${this.renderMovementCost()}</div>
                    </div>
                    <footer class="modal-actions">
                        <button class="btn btn-outline" onclick="window.app.closeModals()">取消</button>
                        <button class="btn btn-danger" onclick="window.app.confirmBattle()">加入进攻计划</button>
                    </footer>
                </section>
            </div>
        `;
    },

    renderFocusTreeModal() {
        const viewFactionId = GameState.game.focusViewFactionId || GameState.getPlayerFactionId();
        const isPlayerView = viewFactionId === GameState.getPlayerFactionId();
        const tree = GameState.getVisibleFocusTree(viewFactionId);
        const completed = GameState.game.completedFocuses;
        const completedInTree = tree.filter(focus => completed.includes(focus.id)).length;
        const observed = this.getObservedFactionResources(viewFactionId);
        const pp = observed.pp;
        const selectedFocusId = isPlayerView ? GameState.game.selectedFocusId : GameState.game.focusViewSelectedId;
        const selectedFocus = GameState.getFocusById(selectedFocusId, viewFactionId) || tree[0];
        const campaignTree = Boolean(tree[0]?.category);
        const westRussia = GameState.getScenario().id === 'west-russia';
        const overview = westRussia && window.app.focusTreeOverview;
        const branchOnly = campaignTree && window.app.focusBranchOnly && !overview;
        const visibleTree = branchOnly ? tree.filter(focus => focus.branch === selectedFocus.branch) : tree;
        const layout = westRussia
            ? WestRussiaFocusLayout.build(tree, viewFactionId, branchOnly ? selectedFocus.branch : null)
            : this.getFocusTreeLayout(visibleTree, branchOnly);
        const scale = window.app.getFocusTreeScale();
        const faction = GameState.getFaction(viewFactionId);
        const actionCost = isPlayerView ? window.app.getActionCost('focus').ppCost : '只读';

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel focus-modal ${westRussia ? 'focus-campaign-modal' : ''} ${overview ? 'focus-modal-overview' : ''}">
                    <header class="modal-header">
                        <h3>${faction.shortName} 国策树</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <div class="focus-toolbar">
                        <div class="focus-toolbar-stats">
                            <span>${isPlayerView ? '我方' : '看海'} PP ${formatMoney(pp)}${isPlayerView ? `/${GameState.getEffectivePPCap()}` : ''}</span>
                            <span>推进消耗 ${actionCost}${isPlayerView ? ' PP' : ''}</span>
                            <span>${isPlayerView ? `行动递增 +${GameState.getActionExtraCost()} PP` : '只读查看，不消耗行动'}</span>
                            <span>已完成 ${completedInTree}/${tree.length}</span>
                        </div>
                        ${overview ? '' : `<div class="focus-zoom-controls">
                            <button class="map-icon-btn" title="缩小国策树" onclick="window.app.zoomFocusTree(-1)">−</button>
                            <span data-focus-zoom-label>${Math.round(scale * 100)}%</span>
                            <button class="map-icon-btn" title="放大国策树" onclick="window.app.zoomFocusTree(1)">+</button>
                            <button class="btn btn-outline" onclick="window.app.resetFocusTreeView()">居中</button>
                        </div>`}
                        ${westRussia ? `
                            <button class="btn btn-outline campaign-branch-view" type="button" aria-pressed="${Boolean(overview)}"
                                onclick="window.app.toggleFocusTreeOverview()">全局图</button>
                        ` : ''}
                        ${campaignTree ? this.renderCampaignBranches(tree, selectedFocus, branchOnly, overview) : ''}
                        ${overview ? '' : `<div class="focus-mobile-filter">
                            ${[
                                { id: 'all', label: '全部' },
                                { id: 'available', label: '可推进' },
                                { id: 'done', label: '已完成' },
                                { id: 'locked', label: '锁定' }
                            ].map(item => `
                                <button class="${window.app.focusMobileFilter === item.id ? 'active' : ''}" onclick="window.app.setFocusMobileFilter('${item.id}')">
                                    ${item.label}
                                </button>
                            `).join('')}
                        </div>`}
                    </div>
                    ${campaignTree ? `
                        <div class="focus-graph-legend" aria-label="国策连线图例">
                            <span><i></i> 必须完成</span>
                            <span><i class="focus-legend-any"></i> 任选方案</span>
                            ${westRussia ? `
                                <span><i class="focus-legend-mutex"></i> 互斥 · 红框为选中项的冲突路线</span>
                                <span class="focus-legend-hint">${overview ? '点选入口或用下拉菜单定位支线' : branchOnly ? '详情可跳转相邻支线 · 全树显示跨支线连线' : '前置在上 · 选中国策可突出相连路线'}</span>
                            ` : `
                                <span><i class="focus-legend-mutex"></i> 互斥</span>
                                <span class="focus-legend-hint">点击详情中的前置国策可跨支线跳转</span>
                            `}
                        </div>
                    ` : ''}
                    <div class="focus-modal-body">
                        <div class="focus-tree-scroll">
                            <div class="focus-tree-stage" style="width: ${layout.width * scale}px; height: ${layout.height * scale}px;">
                                <div class="focus-tree-canvas ${westRussia ? 'focus-west-russia' : ''}" data-base-width="${layout.width}" data-base-height="${layout.height}" ${campaignTree ? 'data-campaign-tree="true"' : ''}
                                    style="width: ${layout.width}px; height: ${layout.height}px; transform: scale(${scale});">
                                    ${this.renderFocusConnectors(visibleTree, layout, selectedFocus?.id)}
                                    ${overview ? this.renderFocusOverviewNodes(visibleTree, layout, selectedFocus) : visibleTree.map(focus =>
                                        this.renderFocusCard(focus, layout, { viewFactionId, selectedFocusId: selectedFocus?.id, isPlayerView })).join('')}
                                </div>
                            </div>
                        </div>
                        ${overview ? '' : this.renderFocusDetailPanel(selectedFocus, { viewFactionId, isPlayerView, references: layout.references?.get(selectedFocus?.id) })}
                    </div>
                </section>
            </div>
        `;
    },

    renderCampaignBranches(tree, selectedFocus, branchOnly, overview) {
        const labels = { politics: '政治与继承', industry: '工业与财政', military: '军务与战役', logistics: '运输与补给',
            civil: '民政与救济', diplomacy: '对外协约', integration: '地区整合' };
        const groups = new Map();
        for (const focus of tree) {
            if (!groups.has(focus.category)) groups.set(focus.category, new Map());
            const branches = groups.get(focus.category);
            if (!branches.has(focus.branch)) branches.set(focus.branch, { id: focus.id, count: 0 });
            branches.get(focus.branch).count++;
        }
        return `
            <div class="campaign-branch-controls">
                <label class="campaign-branch-jump">
                    <span>国策支线</span>
                    <select onchange="window.app.jumpToCampaignFocus(this.value)" aria-label="跳转国策支线">
                        ${[...groups].map(([category, branches]) => `
                            <optgroup label="${labels[category]}">
                                ${[...branches].map(([name, branch]) => `
                                    <option value="${branch.id}" ${selectedFocus.branch === name ? 'selected' : ''}>${escapeHtml(name)} · ${branch.count}</option>
                                `).join('')}
                            </optgroup>
                        `).join('')}
                    </select>
                </label>
                ${overview ? '' : `<button class="btn btn-outline campaign-branch-view" type="button" aria-pressed="${branchOnly}"
                    onclick="window.app.toggleCampaignBranchView()">仅此支线</button>`}
            </div>
        `;
    },

    getFocusTreeLayout(tree, compact = false) {
        const cellWidth = 226;
        const cellHeight = 184;
        const cardWidth = 190;
        const cardHeight = 150;
        const padding = 36;
        const minX = compact && tree.length ? Math.min(...tree.map(focus => focus.x)) : 0;
        const minY = compact && tree.length ? Math.min(...tree.map(focus => focus.y)) : 0;
        const maxX = Math.max(...tree.map(focus => focus.x), minX) - minX;
        const maxY = Math.max(...tree.map(focus => focus.y), minY) - minY;
        const positions = tree.reduce((acc, focus) => {
            const left = padding + (focus.x - minX) * cellWidth;
            const top = padding + (focus.y - minY) * cellHeight;
            acc[focus.id] = {
                left,
                top,
                centerX: left + cardWidth / 2,
                centerY: top + cardHeight / 2,
                bottomY: top + cardHeight,
                topY: top
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

    branchColor(branch) {
        if (!branch) return 'rgba(148, 163, 184, 0.6)';
        // 太平洋国主要分支：厘定主题色，保证每条线一眼可分。
        const palette = {
            '进步联邦': 'hsl(212, 72%, 64%)',   // 民主蓝
            '休斯财团': 'hsl(45, 82%, 60%)',     // 工业金
            '好莱坞': 'hsl(330, 76%, 67%)',      // 好莱坞粉
            '太平洋帝国': 'hsl(2, 74%, 63%)',    // 帝国红
            '神秘主义': 'hsl(275, 62%, 70%)',    // 神秘紫
            '太平洋终局': 'hsl(48, 88%, 62%)',   // 终局亮金
            '太平洋卫队': 'hsl(150, 54%, 56%)',  // 卫队绿
            '太平洋经济': 'hsl(26, 78%, 60%)',   // 经济橙
            '外援后盾': 'hsl(265, 58%, 70%)',    // 外交紫
            // 宪政国（CON）：左右两翼色调对立 + 四条支线各异。
            '宪政国': 'hsl(220, 65%, 60%)',      // 宪政蓝
            '黑人起义': 'hsl(45, 80%, 55%)',     // 泛非金
            '南方军': 'hsl(95, 35%, 52%)',       // 军绿橄榄
            '深南方': 'hsl(28, 72%, 56%)',       // 工业橙
            '南大西洋': 'hsl(190, 60%, 54%)',    // 海岸青
            '秩序信仰': 'hsl(280, 50%, 66%)',    // 信仰紫
            // 联盟国（AUS）：以紫为基调，但每条线一眼可分。
            '朗派机器': 'hsl(45, 85%, 58%)',     // 民粹金（王鱼）
            '社会正义': 'hsl(350, 62%, 60%)',    // 神职酒红（库格林）
            '银军团': 'hsl(220, 12%, 66%)',      // 银灰（皮利）
            '义勇民兵': 'hsl(268, 55%, 64%)',    // 民兵紫（军政强人）
            '密西西比军务': 'hsl(200, 58%, 56%)',// 河蓝
            '南方经济': 'hsl(30, 72%, 54%)',     // 棉油橙
            '南方外交': 'hsl(150, 46%, 50%)',    // 外交绿
            '联盟国终局': 'hsl(285, 70%, 62%)',  // 终局紫
            // 联合工团（CSA）：以工团红为基调，但每条线一眼可分。
            '里德工团': 'hsl(2, 78%, 57%)',      // 工团红（里德）
            '总工团': 'hsl(22, 58%, 46%)',       // 集权砖红（托派计划）
            '激进社会主义': 'hsl(340, 56%, 63%)',// 玫瑰粉（托马斯）
            '卡彭机器': 'hsl(46, 44%, 50%)',     // 做旧暗金（卡彭）
            '美国赤军': 'hsl(352, 55%, 47%)',    // 赤军深红（巴特勒）
            '五大湖工业': 'hsl(208, 16%, 57%)',  // 工业钢灰
            '第三国际': 'hsl(28, 72%, 54%)',     // 国际橙
            '工团终局': 'hsl(0, 80%, 64%)',      // 终局亮红
            // 德克萨斯（TEX）：4 政治线 + 4 支线各异，孤星红点睛。
            '石油寡头': 'hsl(32, 55%, 42%)',     // 石油暗褐（德士古）
            '帕皮民粹': 'hsl(50, 82%, 56%)',     // 广播金黄（奥丹尼尔）
            '新政民主': 'hsl(210, 66%, 61%)',    // 新政蓝（LBJ/奥尔雷德）
            '孤星共和': 'hsl(2, 72%, 58%)',      // 孤星红（收复主义）
            '游骑兵军务': 'hsl(96, 34%, 50%)',   // 游骑军绿
            '石油经济': 'hsl(18, 76%, 55%)',     // 油橙
            '边境外交': 'hsl(178, 52%, 48%)',    // 边境青
            '边疆社会': 'hsl(276, 48%, 65%)',    // 边疆紫
            // 西部军区（WDC）：山地灰为基调，蜂巢金点睛，4 政治线 + 4 支线各异。
            '山地军政': 'hsl(212, 12%, 52%)',    // 军政钢灰
            '德塞雷特': 'hsl(46, 78%, 53%)',     // 摩门蜂蜜金
            '矿业财阀': 'hsl(22, 50%, 44%)',     // 矿铜褐
            '边疆联邦': 'hsl(150, 42%, 48%)',    // 联邦绿
            '山地防务': 'hsl(8, 45%, 52%)',      // 荒漠红
            '矿牧经济': 'hsl(38, 62%, 52%)',     // 矿牧橙黄
            '西部边境': 'hsl(192, 52%, 50%)',    // 山区青
            '拓荒社会': 'hsl(278, 42%, 63%)',    // 拓荒紫
            // 新英格兰（NEN）：洛夫克拉夫特调色，三神各异。
            '自由州': 'hsl(210, 55%, 60%)',      // 自由蓝
            '商贸委员会': 'hsl(45, 60%, 50%)',   // 商贸金
            '保护协定': 'hsl(225, 28%, 56%)',    // 保护灰蓝
            '普罗维登斯学社': 'hsl(275, 45%, 60%)', // 神秘紫
            '克苏鲁觉醒': 'hsl(165, 45%, 42%)',  // 深海绿（克苏鲁）
            '犹格-索托斯之钥': 'hsl(52, 45%, 52%)', // 旧金（知识）
            '奈亚拉托提普化身': 'hsl(305, 42%, 52%)', // 混沌品红
            '海岸防务': 'hsl(200, 48%, 50%)',    // 海岸青
            '扬基经济': 'hsl(32, 58%, 52%)',     // 工坊橙
            '哈德逊外交': 'hsl(150, 42%, 50%)',  // 外交绿
            // 合众国（USA）：合众国之翼 + 纽约市之翼 + 4 支线。
            '军政府': 'hsl(222, 16%, 50%)',      // 军政钢灰（凯撒）
            '民主修复': 'hsl(218, 68%, 62%)',    // 民主蓝
            '技术官僚': 'hsl(186, 45%, 48%)',    // 技术青
            '战后重建': 'hsl(160, 40%, 46%)',    // 重建青绿
            '纽约市': 'hsl(285, 28%, 56%)',      // 大都会紫灰
            '华尔街': 'hsl(140, 48%, 38%)',      // 美钞绿
            '坦慕尼厅': 'hsl(30, 55%, 46%)',     // 老虎厅褐
            '红色纽约': 'hsl(2, 70%, 52%)',      // 工团红
            '拉瓜迪亚': 'hsl(48, 78%, 55%)',     // 融合金
            '军事改革': 'hsl(95, 28%, 48%)',     // 军绿橄榄
            '经济动员': 'hsl(28, 62%, 52%)',     // 工业橙
            '海空军': 'hsl(205, 58%, 46%)',      // 海军蓝
            '门罗主义': 'hsl(265, 45%, 62%)'     // 外交紫
        };
        if (palette[branch]) return palette[branch];
        let hash = 0;
        for (let i = 0; i < branch.length; i++) {
            hash = (hash * 31 + branch.charCodeAt(i)) >>> 0;
        }
        const hue = hash % 360;
        return `hsl(${hue}, 62%, 64%)`;
    },

    focusLinkPath(source, target) {
        const sx = source.centerX;
        const sy = source.bottomY;
        const tx = target.centerX;
        const ty = target.topY;
        if (sx === tx) return `M ${sx} ${sy} L ${tx} ${ty}`;
        const midY = sy + Math.max(18, (ty - sy) / 2);
        const dir = tx > sx ? 1 : -1;
        const r = Math.max(0, Math.min(12, Math.abs(tx - sx) / 2, midY - sy, ty - midY));
        if (r < 1) return `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
        return `M ${sx} ${sy} L ${sx} ${midY - r} Q ${sx} ${midY} ${sx + dir * r} ${midY} L ${tx - dir * r} ${midY} Q ${tx} ${midY} ${tx} ${midY + r} L ${tx} ${ty}`;
    },

    focusChapterColor(category) {
        return ({ politics: '#d6b682', military: '#d69a89', logistics: '#8aafcd', industry: '#82b9bb',
            civil: '#a6b994', diplomacy: '#b5a4ce', integration: '#cfac74' })[category];
    },

    renderFocusOverviewNodes(tree, layout, selectedFocus) {
        const completed = new Set(GameState.game.completedFocuses);
        return `
            <svg class="focus-overview-nodes" width="${layout.width}" height="${layout.height}" aria-hidden="true">
                ${tree.map(focus => {
                    const { left, top } = layout.positions[focus.id];
                    const mutualTarget = selectedFocus?.mutuallyExclusive?.includes(focus.id);
                    return `<rect class="${completed.has(focus.id) ? 'done' : ''} ${mutualTarget ? 'focus-overview-mutual-target' : ''}" x="${left + 9}" y="${top + 8}" width="${layout.cardWidth - 18}"
                        height="${layout.cardHeight - 16}" rx="8" fill="${this.focusChapterColor(focus.category)}" />`;
                }).join('')}
            </svg>
            ${layout.sections.map(chapter => {
                const { left, top } = layout.positions[chapter.entryId];
                return `<button type="button" class="focus-chapter-jump ${chapter.name === selectedFocus?.branch ? 'current' : ''}"
                    data-focus-chapter="${chapter.entryId}" aria-label="${escapeHtml(chapter.name)}"
                    style="left: ${left}px; top: ${top}px; width: ${layout.cardWidth}px; height: ${layout.cardHeight}px; --chapter-color: ${this.focusChapterColor(chapter.category)}"
                    onclick="window.app.jumpToCampaignFocus('${chapter.entryId}')"><span>${escapeHtml(chapter.name)}</span></button>`;
            }).join('')}
        `;
    },

    renderFocusLaneBands(tree, layout) {
        const bands = [];
        // 分支泳道：把每条线圈成一簇（≥3 节点的分支才画底色+标题）
        const byBranch = {};
        tree.forEach(focus => { (byBranch[focus.branch] = byBranch[focus.branch] || []).push(focus); });
        Object.entries(byBranch).forEach(([branch, nodes]) => {
            if (!branch || nodes.length < 3) return;
            const color = this.branchColor(branch);
            let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
            nodes.forEach(n => {
                const p = layout.positions[n.id];
                if (!p) return;
                minL = Math.min(minL, p.left);
                minT = Math.min(minT, p.topY);
                maxR = Math.max(maxR, p.left + layout.cardWidth);
                maxB = Math.max(maxB, p.bottomY);
            });
            if (!isFinite(minL)) return;
            const pad = 16;
            const labelGap = 22;
            const x = minL - pad;
            const y = minT - pad - labelGap;
            const w = (maxR - minL) + pad * 2;
            const h = (maxB - minT) + pad * 2 + labelGap;
            bands.push(`<rect class="focus-lane-band" x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${color}" />`);
            bands.push(`<text class="focus-lane-label" x="${x + 16}" y="${y + 24}" fill="${color}">${escapeHtml(branch)}</text>`);
        });
        return bands.join('');
    },

    renderFocusConnectors(tree, layout, selectedFocusId) {
        if (layout.links) return this.renderCampaignFocusLinks(tree, layout, selectedFocusId);
        const lines = [];
        const activeLines = [];
        const mutualPairs = new Set();
        const campaign = Boolean(tree[0]?.category);
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const completed = new Set(GameState.game.completedFocuses);

        tree.forEach(focus => {
            const target = layout.positions[focus.id];
            const color = this.branchColor(focus.branch);
            this.getFocusParentIds(focus).forEach(parentId => {
                const source = layout.positions[parentId];
                if (!source || !target) return;
                const active = focus.id === selectedFocusId || parentId === selectedFocusId;
                if (campaign && !active && byId.get(parentId).branch !== focus.branch) return;
                const optional = !(focus.prerequisites || []).includes(parentId);
                const classes = [
                    'focus-link',
                    optional ? 'focus-link-any' : '',
                    completed.has(parentId) ? 'focus-link-met' : '',
                    active ? 'focus-link-active' : ''
                ].join(' ');
                (active ? activeLines : lines).push(`<path class="${classes}" style="--focus-link-color: ${color}" d="${this.focusLinkPath(source, target)}" />`);
            });

            (focus.mutuallyExclusive || []).forEach(otherId => {
                const key = [focus.id, otherId].sort().join('|');
                const other = layout.positions[otherId];
                if (!target || !other || mutualPairs.has(key)) return;
                if (campaign && focus.id !== selectedFocusId && otherId !== selectedFocusId
                    && byId.get(otherId).branch !== focus.branch) return;
                mutualPairs.add(key);
                const middle = (target.centerX + other.centerX) / 2;
                lines.push(`<path class="focus-mutual-link" d="M ${target.centerX} ${target.centerY} H ${middle} V ${other.centerY} H ${other.centerX}" />`);
            });
        });

        return `
            <svg class="focus-connector-layer" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
                ${this.renderFocusLaneBands(tree, layout)}
                ${lines.join('')}
                ${activeLines.join('')}
            </svg>
        `;
    },

    getCampaignMutualGroups(tree, layout) {
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const neighbors = new Map(tree.map(focus => [focus.id, (focus.mutuallyExclusive || []).filter(id => {
            const other = byId.get(id);
            return other?.branch === focus.branch && other.mutuallyExclusive?.includes(focus.id)
                && layout.positions[id]?.row === layout.positions[focus.id]?.row;
        })]));
        const visited = new Set();
        const groups = [];
        const cards = tree.map(focus => ({ id: focus.id, ...layout.positions[focus.id] }));
        const intersectsCard = (x1, y1, x2, y2) => cards.some(card => (
            Math.min(x1, x2) < card.left + layout.cardWidth && Math.max(x1, x2) > card.left
            && Math.min(y1, y2) < card.bottomY && Math.max(y1, y2) > card.topY
        ));
        const prerequisiteSegments = (layout.links || []).flatMap(link => {
            const segments = [];
            let x = 0;
            let y = 0;
            for (const [, command, first, second] of link.path.matchAll(/([MHVL])\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)) {
                const nextX = command === 'V' ? x : Number(first);
                const nextY = command === 'H' ? y : Number(command === 'V' ? first : second);
                if (command !== 'M') segments.push([x, y, nextX, nextY]);
                x = nextX;
                y = nextY;
            }
            return segments;
        });
        for (const focus of tree) {
            if (visited.has(focus.id)) continue;
            const ids = [focus.id];
            visited.add(focus.id);
            for (let i = 0; i < ids.length; i++) {
                for (const id of neighbors.get(ids[i])) {
                    if (visited.has(id)) continue;
                    visited.add(id);
                    ids.push(id);
                }
            }
            // A connected exclusion graph is not necessarily a choice group:
            // every pair must exclude each other before it can say "N choose 1".
            if (ids.length < 2 || !ids.every(id => ids.every(other => id === other || neighbors.get(id).includes(other)))) continue;
            ids.sort((a, b) => layout.positions[a].centerX - layout.positions[b].centerX);
            const first = layout.positions[ids[0]];
            const last = layout.positions[ids[ids.length - 1]];
            if (cards.some(card => !ids.includes(card.id)
                && card.left < last.centerX && card.left + layout.cardWidth > first.centerX
                && card.topY < first.bottomY && card.bottomY > first.topY)) continue;

            // Keep the bracket above the emblems. Labels must also avoid the
            // real prerequisite routes, including optional and active links.
            const y = first.topY - 12;
            const midpoint = (first.centerX + last.centerX) / 2;
            const segments = [[first.centerX, y, last.centerX, y],
                ...ids.map(id => [layout.positions[id].centerX, y, layout.positions[id].centerX, y + 7])];
            if (segments.some(segment => intersectsCard(...segment))) continue;
            const offsets = [0];
            for (let offset = 36; offset <= (last.centerX - first.centerX) / 2; offset += 36) offsets.push(-offset, offset);
            const labelRect = [-8, -22, 12].flatMap(dy => offsets.map(dx => ({
                x: midpoint + dx - 25, y: y + dy - 9, width: 50, height: 17,
                distance: dx * dx + (dy + 8) * (dy + 8)
            }))).sort((a, b) => a.distance - b.distance).find(rect => (
                rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= layout.width && rect.y + rect.height <= layout.height
                && !intersectsCard(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
                // Three layout pixels clear the 2.8px selected prerequisite stroke.
                && !prerequisiteSegments.some(([x1, y1, x2, y2]) => (
                    Math.min(x1, x2) < rect.x + rect.width + 3 && Math.max(x1, x2) > rect.x - 3
                    && Math.min(y1, y2) < rect.y + rect.height + 3 && Math.max(y1, y2) > rect.y - 3
                ))
            )) || null;
            const number = ({ 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' })[ids.length] || ids.length;
            groups.push({ ids, label: `${number}选一`, labelX: labelRect ? labelRect.x + 25 : midpoint,
                labelY: labelRect ? labelRect.y + 9 : y - 8, labelRect,
                path: `M ${first.centerX} ${y + 7} V ${y} H ${last.centerX} V ${y + 7}`
                    + ids.slice(1, -1).map(id => ` M ${layout.positions[id].centerX} ${y} V ${y + 7}`).join('') });
        }
        return groups;
    },

    renderCampaignFocusLinks(tree, layout, selectedFocusId) {
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const completed = new Set(GameState.game.completedFocuses);
        const lines = [];
        const selected = [];
        for (const { from, to, optional, crossBranch, path } of layout.links) {
            const active = from === selectedFocusId || to === selectedFocusId;
            const classes = ['focus-link', optional ? 'focus-link-any' : '', crossBranch ? 'focus-link-cross' : '',
                completed.has(from) ? 'focus-link-met' : '', active ? 'focus-link-active' : ''].join(' ');
            const color = crossBranch ? '#8eaebf' : this.focusChapterColor(byId.get(to).category);
            (active ? selected : lines).push(`<path class="${classes}" style="--focus-link-color: ${color}"
                data-focus-from="${from}" data-focus-to="${to}" d="${path}" />`);
        }
        const mutualGroups = this.getCampaignMutualGroups(tree, layout).map(group => `
            <g class="focus-mutual-group ${group.ids.includes(selectedFocusId) ? 'active' : ''}"
                data-focus-mutual-group="${group.ids.join(' ')}">
                <path class="focus-mutual-bracket" d="${group.path}" />
                ${group.labelRect ? `<rect class="focus-mutual-label-background" x="${group.labelRect.x}" y="${group.labelRect.y}"
                    width="${group.labelRect.width}" height="${group.labelRect.height}" rx="3" />
                <text class="focus-mutual-label" x="${group.labelX}" y="${group.labelY}">${group.label}</text>` : ''}
            </g>`).join('');
        return `<svg class="focus-connector-layer" width="${layout.width}" height="${layout.height}" aria-hidden="true">
            ${lines.join('')}${selected.join('')}${mutualGroups}
        </svg>`;
    },

    getFocusStatusForView(focus, viewFactionId, isPlayerView) {
        if (isPlayerView) return GameState.getFocusStatus(focus);
        const completed = GameState.game.completedFocuses;
        if (completed.includes(focus.id)) return 'done';
        if (GameState.isFocusBlockedByMutual(focus, completed)) return 'mutually-blocked';
        if (!GameState.isFocusStageOpen(focus)) return 'phase-blocked';
        if (!GameState.areFocusPrerequisitesMet(focus, completed)) return 'locked';
        if (!GameState.hasFocusTerritory(focus, viewFactionId)) return 'territory-blocked';
        return 'available';
    },

    renderFocusCard(focus, layout, context = {}) {
        const viewFactionId = context.viewFactionId || GameState.getPlayerFactionId();
        const isPlayerView = context.isPlayerView !== false;
        const completed = GameState.game.completedFocuses;
        const status = this.getFocusStatusForView(focus, viewFactionId, isPlayerView);
        const progress = GameState.getFocusProgressInfo(focus);
        const selectedId = context.selectedFocusId || GameState.game.selectedFocusId;
        const selected = selectedId === focus.id;
        const mutualTarget = !selected && Boolean(GameState.getFocusById(selectedId, viewFactionId)?.mutuallyExclusive?.includes(focus.id));
        const stateClass = status === 'done'
            ? 'done'
            : status === 'available'
                ? 'available'
                : status === 'mutually-blocked'
                    ? 'blocked'
                    : status === 'pp-blocked'
                        ? 'pp-blocked'
                        : 'locked';
        const filter = window.app.focusMobileFilter || 'all';
        const mobileHidden = filter !== 'all' && !(
            (filter === 'done' && status === 'done') ||
            (filter === 'available' && status === 'available') ||
            (filter === 'locked' && status !== 'done' && status !== 'available')
        );
        const statusText = ({
            done: '已完成',
            'mutually-blocked': '互斥',
            'phase-blocked': '战斗期开放',
            'territory-blocked': '控制省区',
            locked: '锁定',
            'pp-blocked': 'PP不足'
        })[status] || (progress.current > 0 ? '推进中' : '可推进');
        const position = layout.positions[focus.id];
        const progressPercent = Math.round(progress.ratio * 100);
        const classes = `${stateClass} ${selected ? 'selected' : ''} ${mobileHidden ? 'mobile-focus-hidden' : ''}`;
        if (layout.links) return this.renderCampaignFocusCard(focus, position, classes, statusText, progressPercent, mutualTarget);
        const actionCost = isPlayerView ? window.app.getActionCost('focus').ppCost : '只读';
        const color = this.branchColor(focus.branch);

        return `
            <button class="focus-card ${classes}" data-focus-id="${focus.id}" data-branch="${escapeHtml(focus.branch || '')}"
                style="left: ${position.left}px; top: ${position.top}px; --branch-color: ${color};"
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
                <div class="focus-cost">${isPlayerView ? `推进 ${actionCost} PP` : '看海只读'}</div>
            </button>
        `;
    },

    renderCampaignFocusCard(focus, position, classes, status, progress, mutualTarget = false) {
        const glyph = {
            politics: 'M3 8 12 3l9 5H3Zm2 11h14M7 10v7m5-7v7m5-7v7',
            military: 'm4 11 8-6 8 6M4 17l8-6 8 6',
            industry: 'M3 20V9l6 4V9l6 4 1-8h4l1 15H3Zm4-4v1m5-1v1m5-1v1',
            logistics: 'M7 4v16M17 4v16M5 7h14M5 12h14M5 17h14',
            civil: 'M12 6v14M4 5c4 0 6 1 8 3 2-2 4-3 8-3v12c-4 0-6 1-8 3-2-2-4-3-8-3V5Z',
            diplomacy: 'm12 3 9 9-9 9-9-9 9-9Zm-4 9h8m-4-4v8',
            integration: 'M12 3v5m0 8v5M3 12h5m8 0h5M8 8h8v8H8z'
        }[focus.category];
        const mutuals = focus.mutuallyExclusive || [];
        const label = escapeHtml(`${focus.name} · ${focus.branch} · ${status}`
            + (mutuals.length ? ` · 与 ${mutuals.length} 项国策互斥` : '')
            + (mutualTarget ? ' · 与当前选中国策互斥' : ''));
        return `
            <button class="focus-card focus-emblem-card ${classes} ${mutualTarget ? 'focus-mutual-target' : ''}" data-focus-id="${focus.id}" data-branch="${escapeHtml(focus.branch)}"
                data-focus-mutual-ids="${mutuals.join(' ')}" data-focus-mutual-selected="${mutualTarget}"
                aria-label="${label}" title="${label}"
                style="left: ${position.left}px; top: ${position.top}px; --branch-color: ${this.focusChapterColor(focus.category)}; --focus-progress: ${progress}%"
                onclick="window.app.selectFocus('${focus.id}')">
                <span class="focus-emblem" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="${glyph}" /></svg>
                </span>
                ${mutuals.length ? `<span class="focus-choice-label" aria-hidden="true">互斥 ${mutuals.length}</span>` : ''}
                <span class="focus-plaque"><span>${escapeHtml(focus.name)}</span></span>
            </button>
        `;
    },

    renderFocusDetailPanel(focus, context = {}) {
        const viewFactionId = context.viewFactionId || GameState.getPlayerFactionId();
        const isPlayerView = context.isPlayerView !== false;
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

        const status = this.getFocusStatusForView(focus, viewFactionId, isPlayerView);
        const progress = GameState.getFocusProgressInfo(focus);
        const availability = isPlayerView
            ? window.app.getFocusAdvanceAvailability(focus.id)
            : { enabled: false, reason: '看海模式仅查看', ppCost: '只读' };
        const disabled = availability.enabled ? '' : 'disabled';
        const title = availability.reason ? `title="${availability.reason}"` : '';
        const mutuals = focus.mutuallyExclusive || [];
        const prerequisiteHtml = this.renderFocusPrerequisites(focus, viewFactionId);
        const successors = context.references?.after || [];
        const effectsHtml = (focus.effects || []).map(effect => `<li>${this.renderFocusEffect(effect, focus, viewFactionId)}</li>`).join('');
        const mutualHtml = mutuals.length
            ? `<div class="focus-detail-block danger-block">
                    <span>互斥国策</span>
                    <div class="focus-prereq-nodes">${mutuals.map(id => this.renderFocusLinkButton(id, viewFactionId)).join('')}</div>
                </div>`
            : '';
        const controlHtml = focus.requiredControl?.length ? `
            <div class="focus-detail-block">
                <span>需要控制的省区</span>
                <div class="focus-prereq-nodes">
                    ${focus.requiredControl.map(id => {
                        const province = MapData.getNode(id);
                        const controlled = province?.factionId === viewFactionId;
                        return `<span class="focus-condition ${controlled ? 'met' : ''}">${controlled ? '✓ ' : ''}${escapeHtml(province?.name || id)}</span>`;
                    }).join('')}
                </div>
            </div>
        ` : '';

        return `
            <aside class="focus-detail-panel" data-focus-detail-id="${focus.id}">
                <div class="focus-detail-heading">
                    <span>${focus.branch}</span>
                    <h3>${focus.name}</h3>
                    <p>${focus.description}</p>
                    ${focus.wartime ? '<small class="focus-war-requirement">战斗期国策</small>' : ''}
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
                    ${prerequisiteHtml}
                </div>
                ${controlHtml}
                ${mutualHtml}
                ${this.renderRouteOutcome(focus.routeOutcome)}
                ${successors.length ? `
                    <div class="focus-detail-block">
                        <span>跨支线后续</span>
                        <div class="focus-prereq-nodes">${successors.map(id => this.renderFocusLinkButton(id, viewFactionId)).join('')}</div>
                    </div>
                ` : ''}

                <div class="focus-detail-block">
                    <span>完成效果</span>
                    <ul class="focus-effect-list">${effectsHtml || '<li>无直接效果</li>'}</ul>
                </div>

                <footer class="focus-detail-actions">
                    <div>
                        <span>${status === 'done' ? '已完成' : availability.reason || '可推进'}</span>
                        <strong>${isPlayerView ? `${availability.ppCost} PP` : '只读'}</strong>
                    </div>
                    ${isPlayerView ? `
                        <button class="btn btn-primary" ${disabled} ${title} onclick="window.app.advanceFocus('${focus.id}')">
                            推进国策
                        </button>
                    ` : '<button class="btn btn-outline" disabled>看海模式</button>'}
                </footer>
            </aside>
        `;
    },

    renderFocusLinkButton(id, factionId) {
        const name = GameState.getFocusById(id, factionId)?.name || id;
        const met = GameState.game.completedFocuses.includes(id);
        return `<button type="button" class="focus-condition ${met ? 'met' : ''}"
            data-focus-link-id="${escapeHtml(id)}" onclick="window.app.jumpToCampaignFocus('${escapeHtml(id)}')">
            ${met ? '✓ ' : ''}${escapeHtml(name)}
        </button>`;
    },

    renderFocusPrerequisites(focus, factionId = GameState.getPlayerFactionId()) {
        const required = focus.prerequisites || [];
        const anyGroups = focus.prerequisiteAny || [];
        if (!required.length && !anyGroups.length) return '<strong>无</strong>';
        const links = ids => ids.map(id => this.renderFocusLinkButton(id, factionId)).join('');
        return `
            ${required.length ? `
                <small class="focus-prereq-label">全部完成</small>
                <div class="focus-prereq-nodes">${links(required)}</div>
            ` : ''}
            ${anyGroups.length ? `
                <small class="focus-prereq-label">任选一组，组内全部完成</small>
                ${anyGroups.map(group => `<div class="focus-prereq-nodes focus-prereq-option">${links(group)}</div>`).join('')}
            ` : ''}
        `;
    },

    renderFocusEffect(effect, focus = null, factionId = GameState.getPlayerFactionId()) {
        if (effect.type === 'routeSettlement') {
            const ending = WestRussiaEndings.getById(effect.id);
            return ending ? `确立「${escapeHtml(ending.title)}」；${escapeHtml(ending.payoff)}；代价：${escapeHtml(ending.tradeoff)}` : '确立路线制度';
        }
        const signed = effect.amount > 0 ? `+${effect.amount}` : String(effect.amount);
        const percent = (val) => `${val > 0 ? '+' : ''}${Math.round(val * 100)}%`;
        const getComparisonPair = (current, delta, clamp = value => value) => {
            const applied = this.isFocusCompleted(focus);
            const before = applied ? clamp(current - delta) : current;
            const after = applied ? current : clamp(current + delta);
            return [before, after];
        };
        const compare = (current, delta, formatter = value => formatMoney(value), clamp = value => value) => {
            const [before, after] = getComparisonPair(current, delta, clamp);
            return `（${formatter(before)} → ${formatter(after)}）`;
        };
        const compareLabeled = (label, current, delta, formatter = value => formatMoney(value), clamp = value => value) => {
            const [before, after] = getComparisonPair(current, delta, clamp);
            return `（${label} ${formatter(before)} → ${formatter(after)}）`;
        };
        const compareRaw = (before, after, formatter = value => formatMoney(value)) => `（${formatter(before)} → ${formatter(after)}）`;
        const moneyValue = value => `$${formatMoney(value)}`;
        const signedMoneyValue = value => formatSignedMoney(value);
        const percentValue = value => `${Math.round(value * 100)}%`;
        const nonNegative = value => Math.max(0, value);
        const playerFactionId = factionId || GameState.getPlayerFactionId();
        const observedResources = this.getObservedFactionResources(playerFactionId);
        const playerTotals = window.MapData
            ? MapData.calculateFactionStats(playerFactionId)
            : { totalIndustry: GameState.game.playerResources.totalIndustry || 0, totalTroops: GameState.game.playerResources.totalTroops || 0 };
        const focusCompleted = this.isFocusCompleted(focus);

        if (effect.type === 'money') {
            const current = observedResources.money || 0;
            return `金钱 ${signed}${compare(current, effect.amount, moneyValue, nonNegative)}`;
        }
        if (effect.type === 'pp') {
            const current = observedResources.pp || 0;
            return `PP ${signed}${compare(current, effect.amount, value => `${formatMoney(value)} PP`, value => Math.max(0, Math.min(GameState.getEffectivePPCap(), value)))}`;
        }
        if (effect.type === 'actionCost') {
            const names = { recruit: '征兵', disband: '裁军', move: '移动士兵', build: '建设工业', focus: '推进国策', all: '全部行动' };
            const actions = effect.action === 'all' ? ['recruit', 'disband', 'move', 'build', 'focus'] : [effect.action];
            const comparison = actions.map(action => {
                const meta = window.app.getActionMeta(action);
                const current = Math.max(0, meta.basePP + GameState.getActionBaseCostAdjustment(action));
                const before = focusCompleted ? Math.max(0, current - effect.amount) : current;
                const after = focusCompleted ? current : Math.max(0, current + effect.amount);
                return `${names[action] || action} ${before}→${after}`;
            }).join(' / ');
            return `${names[effect.action] || effect.action}基础 PP ${signed}（${comparison}）`;
        }
        if (effect.type === 'recruitAmount') {
            const current = GameState.getEffectiveRecruitAmount();
            return `征兵数量 ${signed}${compare(current, effect.amount, value => `额外 +${formatMoney(Math.max(0, value))}`, nonNegative)}`;
        }
        if (effect.type === 'maintenanceRate') {
            const current = GameState.getMaintenanceRate();
            return `维护费率 ${percent(effect.amount)}${compare(current, effect.amount, value => `${moneyValue(value)}/兵`, value => Math.max(0.05, value))}`;
        }
        if (effect.type === 'ppIncome') {
            const current = GameState.getTurnPPIncome();
            return `每回合 PP ${signed}${compare(current, effect.amount, value => `${formatMoney(value)} PP/回合`, nonNegative)}`;
        }
        if (effect.type === 'moneyIncome') {
            const current = GameState.getNextTurnResourcePreview(playerFactionId).moneyDelta;
            return `每回合金钱 ${signed}${compare(current, effect.amount, value => `${signedMoneyValue(value)}/回合`)}`;
        }
        if (effect.type === 'capitalTroops') {
            const capital = MapData.getNode(GameState.getCapitalNodeId(playerFactionId));
            const current = capital ? capital.troops : 0;
            return `当前首都驻军 ${signed}${capital ? compareLabeled(capital.name, current, effect.amount, value => formatMoney(value), nonNegative) : ''}`;
        }
        if (effect.type === 'capitalIndustry') {
            const capital = MapData.getNode(GameState.getCapitalNodeId(playerFactionId));
            if (!capital) return `当前首都工业 ${signed}`;
            const cap = GameState.getNodeIndustryCap(capital.id);
            return `当前首都工业 ${signed}${compareLabeled(capital.name, capital.industry, effect.amount, value => formatMoney(value), value => Math.max(0, Math.min(cap, value)))}`;
        }
        if (effect.type === 'allTroops') {
            const nodeCount = MapData.getFactionNodes(playerFactionId).length;
            return `所有己方节点驻军 ${signed}${compareLabeled('总兵力', playerTotals.totalTroops, effect.amount * nodeCount, value => formatMoney(value), nonNegative)}`;
        }
        if (effect.type === 'allIndustry') {
            const maxNodes = effect.maxNodes || Infinity;
            const targets = MapData.getFactionNodes(playerFactionId)
                .filter(node => focusCompleted || node.industry < GameState.getNodeIndustryCap(node.id))
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, maxNodes);
            const delta = focusCompleted
                ? effect.amount * targets.length
                : targets.reduce((sum, node) => sum + Math.max(0, Math.min(GameState.getNodeIndustryCap(node.id), node.industry + effect.amount) - node.industry), 0);
            return `最高工业的 ${effect.maxNodes || '全部'} 个己方节点工业 ${signed}${compareLabeled('总工业', playerTotals.totalIndustry, delta, value => formatMoney(value), nonNegative)}`;
        }
        if (effect.type === 'nodeIndustry') {
            const node = MapData.getNode(effect.nodeId);
            const capital = MapData.getNode(GameState.getCapitalNodeId(playerFactionId));
            const target = node && node.factionId === playerFactionId ? node : capital;
            if (!target) return `${node ? node.name : '指定城市'} 工业 ${signed}（若失守则作用于当前首都）`;
            const cap = GameState.getNodeIndustryCap(target.id);
            return `${target.name} 工业 ${signed}${compare(target.industry, effect.amount, value => formatMoney(value), value => Math.max(0, Math.min(cap, value)))}${target.id !== effect.nodeId ? '（原目标失守，作用于当前首都）' : ''}`;
        }
        if (effect.type === 'taggedTroops') {
            const count = GameState.getTaggedNodeCount(effect.tag, playerFactionId);
            return `${effect.tag}节点驻军 ${signed}${compareLabeled('总兵力', playerTotals.totalTroops, count * effect.amount, value => formatMoney(value), nonNegative)}`;
        }

        if (effect.type === 'ppCapBonus') return `PP 上限 ${signed}${compare(GameState.getEffectivePPCap(), effect.amount, value => `${formatMoney(value)} PP`, value => Math.max(20, value))}`;
        if (effect.type === 'recruitCost') {
            const current = Math.max(1, 2 + GameState.getEffectiveRecruitCostDelta());
            return `征兵金钱成本 ${signed}${compare(current, effect.amount, value => `${moneyValue(value)}/兵`, value => Math.max(1, value))}`;
        }
        if (effect.type === 'freeTroops') return `免维护士兵 ${signed} 名${compare(GameState.getEffectiveFreeTroops(), effect.amount, value => `${formatMoney(value)} 名`, nonNegative)}`;
        if (effect.type === 'globalAttack') return `全局进攻力 ${percent(effect.amount)}${compare(GameState.getEffectiveGlobalAttack(), effect.amount, percentValue)}`;
        if (effect.type === 'globalDefense') return `全局防守力 ${percent(effect.amount)}${compare(GameState.getEffectiveGlobalDefense(), effect.amount, percentValue)}`;
        if (effect.type === 'taggedDefense') {
            const current = this.getTaggedEffectValue('taggedDefense', effect.tag);
            return `${effect.tag}节点防守 ${percent(effect.amount)}${compare(current, effect.amount, percentValue)}`;
        }
        if (effect.type === 'taggedIncome') {
            const currentPerNode = this.getTaggedEffectValue('taggedIncome', effect.tag);
            const count = GameState.getTaggedNodeCount(effect.tag, playerFactionId);
            return `每个${effect.tag}节点每回合 ${signed} 金钱${compare(currentPerNode * count, effect.amount * count, value => `${signedMoneyValue(value)}/回合`)}`;
        }
        if (effect.type === 'captureMoney') return `每次占领敌方节点立即 ${signed} 金钱${compare(GameState.getEffectiveCaptureMoney(), effect.amount, moneyValue, nonNegative)}`;
        if (effect.type === 'captureTroops') return `每次占领敌方节点驻军 ${signed}${compare(GameState.getEffectiveCaptureTroops(), effect.amount, value => `${formatMoney(value)} 兵`, nonNegative)}`;
        if (effect.type === 'crisisPP') return `首都失守时立即 ${signed} PP${compare(GameState.getEffectiveCrisisPP(), effect.amount, value => `${formatMoney(value)} PP`, nonNegative)}`;
        if (effect.type === 'industryCapBonus') {
            const targetCount = effect.maxNodes || 1;
            const targets = MapData.getFactionNodes(playerFactionId)
                .sort((a, b) => b.industry - a.industry || b.troops - a.troops)
                .slice(0, targetCount);
            const currentCapTotal = targets.reduce((sum, node) => sum + GameState.getNodeIndustryCap(node.id), 0);
            return `提升 ${targetCount} 个最高工业节点工业上限 ${signed}${compareLabeled('总上限', currentCapTotal, effect.amount * targets.length, value => formatMoney(value), value => Math.max(0, value))}`;
        }
        if (effect.type === 'taggedNodeMoney') {
            const count = GameState.getTaggedNodeCount(effect.tag, playerFactionId);
            const total = count * effect.amount;
            return `立即获得：每个${effect.tag}节点 ${signed} 金钱${compare(observedResources.money || 0, total, moneyValue, nonNegative)}`;
        }
        if (effect.type === 'damageEnemyIndustry') return `破坏敌方工业最高的 ${effect.maxNodes || 3} 个节点工业 -${effect.amount || 1}`;
        if (effect.type === 'warBonds') {
            const currentMoney = observedResources.money || 0;
            const currentDelta = GameState.getNextTurnResourcePreview(playerFactionId).moneyDelta;
            return `立即 +${effect.amount} 金钱${compare(currentMoney, effect.amount, moneyValue, nonNegative)}，未来 ${effect.turns} 回合每回合 -${effect.penalty} 金钱${compareRaw(currentDelta, currentDelta - effect.penalty, value => `${signedMoneyValue(value)}/回合`)}`;
        }
        if (effect.type === 'allCapitalsTroops') return `所有己方首都/原始首都驻军 ${signed}`;
        if (effect.type === 'badge') return `获得国家修正：${effect.label}`;
        if (effect.type === 'ideology') {
            const ideology = GameState.ideologies[effect.id];
            const base = ideology ? `意识形态切换为「${ideology.name}」（替换上一意识形态的所有加成）` : `意识形态切换：${effect.id}`;
            const rename = effect.name ? `，国号改为「${effect.name}」` : '';
            const bonuses = ideology?.bonuses.map(bonus => this.formatIdeologyBonus(bonus)).filter(Boolean).join(' · ');
            return `${base}${rename}${bonuses ? `<br><small class="text-muted">${escapeHtml(bonuses)}</small>` : ''}`;
        }

        return `${effect.type} ${signed}`;
    },

    isFocusCompleted(focus) {
        return Boolean(focus && GameState.game.completedFocuses.includes(focus.id));
    },

    getTaggedEffectValue(type, tag) {
        const modifierKey = type === 'taggedIncome' ? 'taggedIncome' : 'taggedDefense';
        const modifiers = GameState.getGameModifiers()[modifierKey] || {};
        const ideology = GameState.getIdeology();
        const ideologyValue = ideology && ideology.bonuses
            ? ideology.bonuses
                .filter(bonus => bonus.type === type && bonus.tag === tag)
                .reduce((sum, bonus) => sum + (bonus.amount || 0), 0)
            : 0;
        return (modifiers[tag] || 0) + ideologyValue;
    },

    renderDiplomacyModal() {
        const canAct = window.app.canLocalPlayerAct();
        const disabled = canAct ? '' : 'disabled title="计划已锁定，取消准备后可调整外交"';
        const rows = Object.entries(GameState.game.diplomacy).map(([factionId, data]) => {
            const faction = GameState.getFaction(factionId);
            return `
                <tr>
                    <td><span class="faction-swatch small" style="background: ${faction.color}"></span>${GameState.getFactionName(factionId)}</td>
                    <td>${data.relation}</td>
                    <td>${data.treaty}</td>
                    <td>
                        <button ${disabled} onclick="window.app.setDiplomacy('${factionId}', '停战')">停战</button>
                        <button ${disabled} onclick="window.app.setDiplomacy('${factionId}', '中立')">互不侵犯</button>
                        <button ${disabled} onclick="window.app.setDiplomacy('${factionId}', '战争')">宣战</button>
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

    renderModifiersModal() {
        const ideology = GameState.getIdeology();
        const modifiers = GameState.getGameModifiers();
        const badges = modifiers.badges || [];
        const ideologyBonuses = ((ideology && ideology.bonuses) || [])
            .map(bonus => this.formatIdeologyBonus(bonus))
            .filter(Boolean);
        const focusEntries = this.formatNationalModifiers(modifiers);

        const listSection = (title, items, emptyText) => `
            <div class="modifier-group">
                <h4>${escapeHtml(title)}</h4>
                ${items.length
                    ? `<ul class="modifier-list">${items.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`
                    : `<p class="text-muted">${escapeHtml(emptyText)}</p>`}
            </div>
        `;

        const badgeHtml = badges.length
            ? `<div class="modifier-badges">${badges.map(b => `<span class="modifier-badge">${escapeHtml(b)}</span>`).join('')}</div>`
            : `<p class="text-muted">暂无国家修正徽章</p>`;

        return `
            <div class="modal-backdrop" onclick="window.app.closeModalOnBackdrop(event)">
                <section class="modal-panel modifiers-modal"${ideology ? ` style="--ideology-color: ${ideology.color}"` : ''}>
                    <header class="modal-header">
                        <h3>国家修正</h3>
                        <button class="modal-close" onclick="window.app.closeModals()">×</button>
                    </header>
                    <div class="modifiers-modal-body">
                        <div class="modifier-group">
                            <h4>国家修正徽章</h4>
                            ${badgeHtml}
                        </div>
                        ${listSection(`意识形态加成${ideology ? `（${ideology.name}）` : ''}`, ideologyBonuses, '暂无意识形态加成')}
                        ${listSection('国策累积修正', focusEntries, '尚未从国策获得任何修正')}
                    </div>
                </section>
            </div>
        `;
    },

    formatNationalModifiers(m) {
        if (!m) return [];
        const out = [];
        const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
        const pct = (n) => `${n > 0 ? '+' : ''}${(n * 100).toFixed(0)}%`;
        if (m.ppIncome) out.push(`每回合 PP ${sign(m.ppIncome)}`);
        if (m.moneyIncome) out.push(`每回合金钱 ${sign(m.moneyIncome)}`);
        if (m.ppCapBonus) out.push(`PP 上限 ${sign(m.ppCapBonus)}`);
        if (m.maintenanceRateDelta) out.push(`部队维护费率 ${pct(m.maintenanceRateDelta)}`);
        if (m.recruitCostDelta) out.push(`每个士兵金钱成本 ${sign(m.recruitCostDelta)}`);
        if (m.recruitAmount) out.push(`每次征兵数量 ${sign(m.recruitAmount)}`);
        if (m.freeTroops) out.push(`免维护士兵 ${sign(m.freeTroops)} 名`);
        if (m.globalAttack) out.push(`全局进攻力 ${pct(m.globalAttack)}`);
        if (m.globalDefense) out.push(`全局防守力 ${pct(m.globalDefense)}`);
        if (m.crisisPP) out.push(`首都失守时 PP 危机收入 ${sign(m.crisisPP)}`);
        if (m.captureMoneyOnWin) out.push(`每次占领额外 ${sign(m.captureMoneyOnWin)} 金钱`);
        if (m.captureTroopsOnWin) out.push(`每次占领额外 ${sign(m.captureTroopsOnWin)} 驻军`);
        if (m.damageOnCapture) out.push(`占领后破坏敌方工业 ${sign(m.damageOnCapture)}`);
        if (m.industryCapBoosts) out.push(`工业上限强化 ×${m.industryCapBoosts}`);
        const actionNames = { recruit: '征兵', disband: '裁军', move: '移动', build: '建设', focus: '推进国策', all: '全部行动' };
        Object.entries(m.actionBaseCost || {}).forEach(([action, delta]) => {
            if (delta) out.push(`${actionNames[action] || action} 基础 PP ${sign(delta)}`);
        });
        Object.entries(m.taggedIncome || {}).forEach(([tag, amt]) => {
            if (amt) out.push(`每个${tag}节点每回合 ${sign(amt)} 金钱`);
        });
        Object.entries(m.taggedDefense || {}).forEach(([tag, amt]) => {
            if (amt) out.push(`${tag}节点防守 ${pct(amt)}`);
        });
        return out;
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
                        <div class="winner-mark"><span class="winner-mark-star">★</span></div>
                        <h3>${faction.name}</h3>
                        <div class="winner-mark-sub">${faction.shortName}</div>
                        <p class="text-muted">${winner.text}</p>
                        ${winner.routeTitle ? `<div class="route-outcome-preview"><h4>${escapeHtml(winner.routeTitle)}</h4><p>${escapeHtml(winner.routeText)}</p></div>` : ''}
                    </div>
                    <footer class="modal-actions">
                        ${GameState.getCampaignStories().some(item => item.id === 'wr_ending') ? `
                            <button class="btn btn-outline" onclick="window.app.openCampaignStory('wr_ending')">阅读终章</button>
                        ` : ''}
                        <button class="btn btn-primary" onclick="window.app.dismissEndGame()">继续查看地图</button>
                    </footer>
                </section>
            </div>
        `;
    }
};
