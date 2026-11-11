const FactionSelectView = {
    render() {
        const factions = GameState.factions;
        const selectedId = GameState.selectedFactionId || factions[0].id;
        const selectedFaction = factions.find(f => f.id === selectedId);

        let factionListHtml = factions.map(f => `
            <button type="button" class="faction-item ${f.id === selectedId ? 'active' : ''}" aria-pressed="${f.id === selectedId}"
                 onclick="window.app.selectFaction('${f.id}')">
                <span class="faction-color-indicator" style="background-color: ${f.color}; color: ${f.color}" aria-hidden="true"></span>
                <span class="faction-item-label">
                    <span class="faction-item-name">${f.name}</span>
                    <span class="faction-item-sub">${f.shortName} · ${f.id}</span>
                </span>
            </button>
        `).join('');

        let difficultyStars = '★'.repeat(selectedFaction.difficulty) + '☆'.repeat(5 - selectedFaction.difficulty);

        const opening = MapData.calculateFactionStats(selectedFaction.id, MapData.initialNodes);

        return `
            <div class="view-faction-select animate-fade-in">
                <div class="faction-select-header">
                    <h2>选择势力</h2>
                    <div class="text-muted">选择你将带领的势力，书写下一份国家档案</div>
                </div>
                
                <div class="glass-panel faction-layout">
                    <div class="faction-list">
                        ${factionListHtml}
                    </div>
                    
                    <div class="faction-details">
                        <div class="faction-details-header flex items-center">
                            <div class="faction-color-indicator" style="width: 24px; height: 24px; background-color: ${selectedFaction.color}; color: ${selectedFaction.color}"></div>
                            <div>
                                <h3>${selectedFaction.name}</h3>
                                <div class="text-accent">${selectedFaction.playstyleTags.join(' / ')}</div>
                            </div>
                        </div>
                        
                        <div class="faction-details-content">
                            <p style="margin-bottom: var(--spacing-4); color: var(--color-text-muted)">
                                ${selectedFaction.description}
                            </p>
                            
                            <div style="margin-bottom: var(--spacing-2)">
                                <span class="text-muted">操作难度：</span>
                                <span style="color: var(--color-warning)">${difficultyStars}</span>
                            </div>
                            
                            <div style="margin-top: var(--spacing-6); font-weight: 600;">初始资源</div>
                            <div class="stat-grid">
                                <div class="stat-box">
                                    <div class="text-muted text-sm">金钱</div>
                                    <div class="stat-value">$ ${selectedFaction.startingStats.money}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="text-muted text-sm">政治点</div>
                                    <div class="stat-value">PP ${selectedFaction.startingStats.pp}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="text-muted text-sm">初始兵力</div>
                                    <div class="stat-value">${opening.totalTroops}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="text-muted text-sm">初始工业</div>
                                    <div class="stat-value">${opening.totalIndustry}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="faction-action-bar">
                            <button class="btn btn-outline" style="margin-right: var(--spacing-4)" onclick="window.app.navigateTo('lobby')">
                                返回
                            </button>
                            <button class="btn btn-primary" onclick="window.app.startGame()">
                                锁定势力并开始
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
