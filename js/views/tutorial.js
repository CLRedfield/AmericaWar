/**
 * 新手教程 / 游戏指南视图。
 * 一个独立的全屏页面，用分章节的卡片把"这游戏怎么玩"讲清楚。
 * 章节切换由 App.tutorialTab + App.setTutorialTab 驱动（整页重渲染，内容回到顶部）。
 * 阵营数据从 GameState.factions 实时取，保证和实际游戏一致。
 */
const TutorialView = {
    CHAPTERS: [
        { id: 'intro', icon: '🗽', title: '开战吧' },
        { id: 'resources', icon: '💰', title: '两种家底' },
        { id: 'turn', icon: '🔄', title: '回合流程' },
        { id: 'actions', icon: '⚡', title: '行动与递增' },
        { id: 'battle', icon: '⚔️', title: '打仗' },
        { id: 'focus', icon: '🌳', title: '国策意识形态' },
        { id: 'victory', icon: '🏆', title: '怎么赢' },
        { id: 'factions', icon: '🚩', title: '八大势力' },
        { id: 'rules', icon: '📜', title: '规则速查' },
        { id: 'tips', icon: '🎯', title: '新手三步走' }
    ],

    render() {
        const active = (window.app && App.tutorialTab) || 'intro';
        const tabs = this.CHAPTERS.map(ch => `
            <button class="tut-tab ${ch.id === active ? 'active' : ''}"
                onclick="window.app.setTutorialTab('${ch.id}')">
                <span class="tut-tab-icon">${ch.icon}</span>
                <span class="tut-tab-text">${ch.title}</span>
            </button>
        `).join('');

        return `
            <div class="view-tutorial animate-fade-in">
                <header class="tut-header">
                    <div class="tut-header-titles">
                        <h1 class="tut-title">新手教程</h1>
                        <span class="tut-subtitle">裂旗战争 · 上手指南</span>
                    </div>
                    <button class="btn btn-outline" onclick="window.app.closeTutorial()">← 返回主菜单</button>
                </header>
                <nav class="tut-tabs">${tabs}</nav>
                <main class="tut-content" data-tut-scroll>
                    ${this.renderChapter(active)}
                </main>
            </div>
        `;
    },

    renderChapter(id) {
        switch (id) {
            case 'intro': return this.intro();
            case 'resources': return this.resources();
            case 'turn': return this.turn();
            case 'actions': return this.actions();
            case 'battle': return this.battle();
            case 'focus': return this.focus();
            case 'victory': return this.victory();
            case 'factions': return this.factions();
            case 'rules': return this.rules();
            case 'tips': return this.tips();
            default: return this.intro();
        }
    },

    // ——— 章节内容 ———

    intro() {
        return `
            <div class="tut-hero">
                <div class="tut-hero-emoji">🇺🇸💥</div>
                <h2>一场没能结束的内战</h2>
                <p>美国四分五裂，<strong>8 个势力</strong>在格点化的全美地图上同台厮杀——军政府、工团、联盟国、宪政派、太平洋共和、山地军区、孤星德州、东北新英格兰。你将执掌其中之一，<strong>统一全美</strong>，或夺取霸权。</p>
            </div>
            ${this.cardGrid([
                ['🎯', '你的目标', '消灭所有对手实现<b>统一</b>，或控制全图 <b>60%</b> 的节点拿下<b>霸权</b>。'],
                ['🧩', '核心循环', '控制节点 → 产出金钱 → 征兵打仗 → 推进国策变强 → 抢更多节点。'],
                ['⏱️', '一局多久', '约 <b>45–90 分钟</b>。支持<b>单机沙盒</b>（对 AI 练手）和<b>多人联机</b>。'],
                ['🧠', '玩的是什么', '不是单位微操，而是<b>"这回合做什么"</b>的取舍——政治点有限，行动会越做越贵。']
            ])}
            <div class="tut-callout tut-callout-info">
                💡 第一次玩？建议从左到右把这几章扫一遍，再开一局<b>单机沙盒</b>边看边练。
            </div>
        `;
    },

    resources() {
        return `
            <h2 class="tut-h2">你只需要管两样东西</h2>
            <div class="tut-resource-row">
                <div class="tut-resource-card" style="--accent:#fbbf24">
                    <div class="tut-resource-head"><span class="tut-resource-icon">💰</span><span class="tut-resource-name">金钱 $</span></div>
                    <ul>
                        <li><b>从哪来：</b>你控制的<b>所有节点工业值之和</b>，每回合开始自动入账。</li>
                        <li><b>花在哪：</b>征兵（每个兵 <b>$2</b>）、部队维护（每个兵 <b>$0.5/回合</b>）、建设工业（<b>$10</b>）。</li>
                        <li><b>⚠️ 赤字：</b>钱变成负数会触发财政危机——士兵逃散、收入和战力被削弱。别让钱烧穿底！</li>
                    </ul>
                </div>
                <div class="tut-resource-card" style="--accent:#3b82f6">
                    <div class="tut-resource-head"><span class="tut-resource-icon">🏛️</span><span class="tut-resource-name">政治点 PP</span></div>
                    <ul>
                        <li><b>从哪来：</b>每回合固定 <b>+3 PP</b>，<b>可以跨回合存</b>（上限通常 60，可被意识形态/国策改变）。</li>
                        <li><b>花在哪：</b><b>几乎一切行动</b>——征兵、移动、建设、推进国策都要花 PP。</li>
                        <li><b>本质：</b>PP 决定你"这回合能做几件事"。攒 PP，就是攒一次集中爆发的机会。</li>
                    </ul>
                </div>
            </div>
            <div class="tut-callout">
                顶部状态栏会实时显示你的 <span class="tut-chip" style="--c:#fbbf24">💰 金钱</span> 和 <span class="tut-chip" style="--c:#3b82f6">🏛️ PP</span>，还会预测<b>下回合收入</b>。随时盯一眼。
            </div>
        `;
    },

    turn() {
        return `
            <h2 class="tut-h2">一个回合长什么样</h2>
            <p class="tut-lead">每当轮到你，游戏会先帮你"结算"，然后把舞台交给你自由行动。</p>
            <ol class="tut-steps">
                <li><span class="tut-step-n">1</span><div><b>收金钱</b>：进账 = 你所有节点的工业值总和。</div></li>
                <li><span class="tut-step-n">2</span><div><b>付维护</b>：每个士兵扣 $0.5。兵越多，养兵越贵。</div></li>
                <li><span class="tut-step-n">3</span><div><b>财政兜底</b>：如果钱不够付维护，会自动从后方解散部分部队。</div></li>
                <li><span class="tut-step-n">4</span><div><b>领政治点</b>：+3 PP（攒着也行）。</div></li>
                <li><span class="tut-step-n">5</span><div><b>首都补员</b>：部分意识形态会让首都每回合自动多出一些驻军。</div></li>
                <li><span class="tut-step-n">▶</span><div><b>行动阶段</b>：现在随你折腾——征兵、调兵、建设、点国策，直到 PP 不够或你点<b>「结束回合」</b>。</div></li>
            </ol>
            <div class="tut-callout tut-callout-info">
                🤝 <b>联机</b>时大家<b>按座位顺序轮流</b>行动，AI 会自动操作。轮到别人时你只能观战，轮到你时顶栏会亮起、计时器开始走。
            </div>
        `;
    },

    actions() {
        const rows = [
            ['🪖 征兵', '1 PP + $2/兵', '<span class="tut-em">⚠ 只能在首都征召</span>（或你占领的敌方原首都），普通城市无法征兵。立刻增加该地驻军。'],
            ['🥾 移动士兵', '1 PP', '本回合所有"还没动过"的部队，可一起各移动一格。'],
            ['🏭 建设工业', '5 PP + $10', '选一个己方节点，工业 +1（=以后每回合多一点钱）。'],
            ['🌳 推进国策', '1 PP', '把某个国策往前推一步，集满进度即解锁其永久增益。'],
            ['💸 裁军', '0 PP', '解散部队换回少量金钱，并降低下回合维护——缺钱时的急救。']
        ];
        const actionRows = rows.map(([a, c, e]) => `
            <tr><td class="tut-act-name">${a}</td><td class="tut-act-cost">${c}</td><td>${e}</td></tr>
        `).join('');
        return `
            <h2 class="tut-h2">五种行动</h2>
            <div class="tut-table-wrap">
                <table class="tut-table">
                    <thead><tr><th>行动</th><th>消耗</th><th>效果</th></tr></thead>
                    <tbody>${actionRows}</tbody>
                </table>
            </div>
            <div class="tut-callout tut-callout-warn">
                🏰 <b>关键：征兵只能在首都进行！</b>普通城市再大也招不了兵。所以——<br>
                · <b>守住首都</b> = 守住你唯一的兵源，首都一旦被围/被破，补兵能力就断了；<br>
                · <b>攻下敌人的首都</b>就能掐死对方的征兵，而你占领敌方<b>原首都</b>后，也能在那儿征兵。
            </div>
            <h3 class="tut-h3">⚡ 最重要的机制：行动会越做越贵</h3>
            <p class="tut-lead">每多做一次行动，<b>下一次就要额外多花 PP</b>。本回合做的第 1 次照常，第 2 次 +1 PP，第 3 次 +2 PP……</p>
            <div class="tut-table-wrap">
                <table class="tut-table tut-table-compact">
                    <thead><tr><th>本回合第几次行动</th><th>额外消耗</th><th>这次「征兵」实际花</th></tr></thead>
                    <tbody>
                        <tr><td>第 1 次</td><td>+0</td><td>1 PP</td></tr>
                        <tr><td>第 2 次</td><td>+1</td><td>2 PP</td></tr>
                        <tr><td>第 3 次</td><td>+2</td><td>3 PP</td></tr>
                        <tr><td>第 4 次</td><td>+3</td><td>4 PP</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="tut-callout tut-callout-warn">
                🔑 <b>结论：</b>与其每回合零敲碎打，不如<b>攒几回合 PP，打一个集中爆发的大回合</b>。"这回合做什么、按什么顺序做"就是本游戏最核心的策略。
            </div>
        `;
    },

    battle() {
        return `
            <h2 class="tut-h2">怎么打仗</h2>
            <p class="tut-lead">把士兵<b>移动到敌方节点</b>就会开战；移动到<b>空节点</b>则直接占领。</p>
            ${this.cardGrid([
                ['🧮', '战力怎么算', '战力 = 兵力 ×（1 + 修正）。<b>攻方战力 > 守方战力</b> → 攻方占领；否则守方守住。'],
                ['🛡️', '守方有优势', '守方天然 <b>+15%</b>；<b>城市 / 山地 / 港口</b>等地形、国策、意识形态还会再叠加防御。'],
                ['⚠️', '被包围 -35%', '一个节点若<b>四周邻居全是敌人</b>，它的部队<b>进攻和防守都 -35%</b>，极度危险——别让自己的兵被孤立。'],
                ['🏰', '首都规则', '首都是<b>唯一征兵点</b>。丢了首都<b>不会立刻亡国</b>，但当一个势力<b>所有节点都被夺走</b>时才判定灭亡。']
            ])}
            <div class="tut-callout tut-callout-info">
                👁️ 出兵前会有<b>「战斗预览」</b>：显示双方战力和预计结果。<b>预览是绿色（稳赢）再打</b>，集中兵力、优先抢工业高的节点。
            </div>
        `;
    },

    focus() {
        return `
            <h2 class="tut-h2">国策 & 意识形态：滚雪球的引擎</h2>
            <p class="tut-lead">每个势力都有一棵<b>独一无二的国策树</b>，用政治点一步步点亮。</p>
            ${this.cardGrid([
                ['🌳', '都是永久增益', '加钱、加兵、加工业、降征兵价、降维护、加攻防、每回合额外收入……点出来就一直生效。'],
                ['🧭', '会改变意识形态', '关键国策能让你<b>转变意识形态</b>（甚至<b>改国名</b>！），解锁一整套更强的全局加成与不同战略走向。'],
                ['🗺️', '提前规划路线', '早点想好走"经济流"还是"军事流"，让增益尽快滚起来，是拉开差距的关键。'],
                ['🖱️', '怎么操作', '游戏里点<b>「国策」</b>打开国策树，选一个可推进的国策点<b>「推进国策」</b>。集满进度即解锁。']
            ])}
        `;
    },

    victory() {
        return `
            <h2 class="tut-h2">怎么赢，怎么输</h2>
            <div class="tut-resource-row">
                <div class="tut-resource-card" style="--accent:#10b981">
                    <div class="tut-resource-head"><span class="tut-resource-icon">👑</span><span class="tut-resource-name">统一胜利</span></div>
                    <p>成为地图上<b>最后一个存活的势力</b>。所有对手被消灭，你就赢了。</p>
                </div>
                <div class="tut-resource-card" style="--accent:#fbbf24">
                    <div class="tut-resource-head"><span class="tut-resource-icon">🏆</span><span class="tut-resource-name">霸权胜利</span></div>
                    <p>控制全图 <b>≥ 60%</b> 的节点即立即获胜——避免多人局拖得太久。</p>
                </div>
            </div>
            <div class="tut-callout">
                🎛️ 胜利方式由<b>房主在大厅设置</b>（统一 / 霸权）。<br>
                💀 <b>灭亡判定：</b>一个势力只有在<b>失去全部节点</b>时才出局——丢了首都还能靠其它城市苟住、翻盘。
            </div>
        `;
    },

    factions() {
        const diffLabel = d => ({ 1: '入门', 2: '简单', 3: '适中', 4: '挑战', 5: '高难' }[d] || '适中');
        const dots = d => Array.from({ length: 5 }, (_, i) =>
            `<span class="tut-dot ${i < d ? 'on' : ''}"></span>`).join('');
        const cards = (GameState.factions || []).map(f => {
            const tags = (f.playstyleTags || []).map(t => `<span class="tut-tag">${escapeHtml(t)}</span>`).join('');
            return `
                <div class="tut-faction-card" style="--fc:${f.color}">
                    <div class="tut-faction-top">
                        <span class="tut-faction-swatch"></span>
                        <div class="tut-faction-names">
                            <b>${escapeHtml(f.shortName || f.name)}</b>
                            <span>${escapeHtml(f.name)}</span>
                        </div>
                    </div>
                    <div class="tut-faction-diff">
                        <span class="tut-diff-dots">${dots(f.difficulty || 3)}</span>
                        <span class="tut-diff-label">${diffLabel(f.difficulty || 3)}</span>
                    </div>
                    <div class="tut-faction-tags">${tags}</div>
                    <p class="tut-faction-desc">${escapeHtml(f.description || '')}</p>
                </div>
            `;
        }).join('');
        return `
            <h2 class="tut-h2">八大势力速览</h2>
            <p class="tut-lead">阵营差异鲜明：地盘、工业、兵力、被动各不相同。难度点越多越吃操作。</p>
            <div class="tut-faction-grid">${cards}</div>
        `;
    },

    rules() {
        return `
            <h2 class="tut-h2">规则速查</h2>
            <p class="tut-lead">把全部正式规则压缩成一页——开局忘了哪条，回来扫一眼即可。前面各章是详细讲解，这里只列结论。</p>

            <h3 class="tut-h3">💰 资源</h3>
            <div class="tut-table-wrap">
                <table class="tut-table">
                    <thead><tr><th>资源</th><th>来源</th><th>用途 / 规则</th></tr></thead>
                    <tbody>
                        <tr><td><b>金钱 $</b></td><td>每回合 = 你所有节点<b>工业值之和</b>，自动入账</td><td>征兵、部队维护、建设工业；<b>赤字会触发财政危机</b>（逃兵 + 收入战力削弱）</td></tr>
                        <tr><td><b>政治点 PP</b></td><td>每回合固定 <b>+3</b>，可跨回合储存（上限约 60，受意识形态 / 国策影响）</td><td>几乎一切行动都要花 PP，决定你“这回合能做几件事”</td></tr>
                    </tbody>
                </table>
            </div>

            <h3 class="tut-h3">🔄 回合开始结算（自动）</h3>
            <ol class="tut-steps">
                <li><span class="tut-step-n">1</span><div><b>收金钱</b>：进账 = 全部节点工业值之和。</div></li>
                <li><span class="tut-step-n">2</span><div><b>付维护</b>：每个士兵 <b>$0.5</b>。</div></li>
                <li><span class="tut-step-n">3</span><div><b>财政兜底</b>：钱不够付维护，自动从后方解散部分部队。</div></li>
                <li><span class="tut-step-n">4</span><div><b>领政治点</b>：<b>+3 PP</b>（可攒）。</div></li>
                <li><span class="tut-step-n">5</span><div><b>首都补员</b>：部分意识形态让首都每回合自动多出驻军。</div></li>
            </ol>

            <h3 class="tut-h3">⚡ 行动与递增消耗</h3>
            <div class="tut-table-wrap">
                <table class="tut-table">
                    <thead><tr><th>行动</th><th>基础消耗</th><th>说明</th></tr></thead>
                    <tbody>
                        <tr><td>征兵</td><td>1 PP + $2/兵</td><td><b>只能在首都</b>（或你占领的敌方原首都）进行</td></tr>
                        <tr><td>移动士兵</td><td>1 PP</td><td>本回合所有未移动过的部队各移动一格</td></tr>
                        <tr><td>建设工业</td><td>5 PP + $10</td><td>选一个己方节点，工业 +1</td></tr>
                        <tr><td>推进国策</td><td>1 PP</td><td>把某国策推进一步，集满解锁永久增益</td></tr>
                        <tr><td>裁军</td><td>0 PP</td><td>解散部队换少量金钱并降低维护</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="tut-callout tut-callout-warn">
                🔑 <b>行动越做越贵：</b>本回合每多做一次行动，下一次额外 +1 PP（第 1 次 +0、第 2 次 +1、第 3 次 +2…）。所以<b>攒 PP 打集中爆发的大回合</b>更划算。
            </div>

            <h3 class="tut-h3">⚔️ 移动 · 战斗 · 占领</h3>
            <ul class="tut-rule-list">
                <li>只能移动到<b>相邻节点</b>；移入<b>空节点</b>→直接占领；移入<b>敌方节点</b>→开战。</li>
                <li>战力 = 兵力 ×（1 + 修正）。<b>攻方战力 &gt; 守方战力</b> → 攻方占领，否则守方守住。</li>
                <li>守方天然 <b>+15%</b>；<b>城市 / 山地 / 港口</b>等地形、国策、意识形态再叠加防御。</li>
                <li><b>被包围 −35%：</b>若某节点直接相邻的节点<b>全是敌方</b>，该节点部队<b>进攻和防守都 −35%</b>。</li>
            </ul>

            <h3 class="tut-h3">🏰 首都 · 灭亡 · 胜利</h3>
            <ul class="tut-rule-list">
                <li><b>首都是唯一征兵点。</b>丢首都<b>不会立刻灭国</b>，但会断掉兵源。</li>
                <li><b>灭亡判定：</b>一个势力<b>失去全部节点</b>时才出局——还剩一城即可苟住翻盘。</li>
                <li><b>统一胜利：</b>成为地图上最后存活的势力。</li>
                <li><b>霸权胜利：</b>控制全图 <b>≥ 60%</b> 节点立即获胜（胜利方式由房主在大厅设置）。</li>
            </ul>

            <h3 class="tut-h3">🤝 联机与回合顺序</h3>
            <ul class="tut-rule-list">
                <li><b>单机沙盒：</b>本地房间，空席国家在游戏中待机（不行动、不外交，但可被进攻）。</li>
                <li><b>联机房间：</b>玩家<b>按座位顺序轮流</b>行动；AI 由本地 / 房主代为执行。轮到别人时你只能观战。</li>
                <li><b>房主</b>控制开局、添加 / 移除 AI、踢人，并负责写入完整对局状态。</li>
                <li><b>两种联机后端：</b><span class="tut-chip" style="--c:#f87171">Firebase（需翻墙）</span> 与 <span class="tut-chip" style="--c:#34d399">EMQX 公共服务器（免翻墙）</span>——<b>同一房间里所有人必须选同一种</b>，房间码才互通。</li>
            </ul>

            <div class="tut-callout tut-callout-info">
                📌 国内联网对战找不到房间？多半是房主用了 <b>Firebase</b> 而你没开代理。改用 <b>EMQX 公共服务器</b>，双方都选它即可免翻墙直连。
            </div>
        `;
    },

    tips() {
        return `
            <h2 class="tut-h2">新手三步走</h2>
            <ol class="tut-steps tut-steps-big">
                <li><span class="tut-step-n">1</span><div>
                    <b>挑个好上手的阵营。</b><br>
                    <span class="tut-muted">太平洋国（简单，西海岸闷声发育）最好上手；联合工团（工业爆兵）和麦克阿瑟军政府（正统防守反击）也很稳。高难阵营（如西部军区、联盟国、新英格兰）等熟练了再碰。</span>
                </div></li>
                <li><span class="tut-step-n">2</span><div>
                    <b>开局先把经济滚起来。</b><br>
                    <span class="tut-muted">别急着乱花 PP。先点 1–2 个"加收入 / 降成本"的国策，再考虑建设工业，让钱稳步增长。</span>
                </div></li>
                <li><span class="tut-step-n">3</span><div>
                    <b>攒 PP，打集中爆发的大回合。</b><br>
                    <span class="tut-muted">因为行动越做越贵，一口气"征兵 + 移动 + 进攻"比天天小动作划算。集中兵力打"绿色预览"的稳赢仗，优先抢工业高的节点。</span>
                </div></li>
            </ol>
            <div class="tut-callout tut-callout-warn">
                别踩这两个坑：💸 <b>别让钱变负</b>（赤字会逃兵）；🕸️ <b>别让部队被包围</b>（攻防 -35%）。
            </div>
            <div class="tut-cta">
                <p>准备好了吗？</p>
                <button class="btn btn-primary" onclick="window.app.startLocalLobby()">开一局单机沙盒练练手 →</button>
            </div>
        `;
    },

    // ——— 小工具：图标卡片网格 ———
    cardGrid(items) {
        const cards = items.map(([icon, title, body]) => `
            <div class="tut-info-card">
                <div class="tut-info-icon">${icon}</div>
                <div class="tut-info-body">
                    <b>${title}</b>
                    <p>${body}</p>
                </div>
            </div>
        `).join('');
        return `<div class="tut-info-grid">${cards}</div>`;
    }
};

window.TutorialView = TutorialView;
