const { test, expect } = require('@playwright/test');

const captureOnly = process.env.FOCUS_CAPTURE === '1';
const compareScreenshots = process.env.FOCUS_COMPARE === '1';
const factions = [
    { id: 'WRF', count: 154, entry: 'wr_wrf_cadres_commit', parent: 'wr_wrf_zhukov_congress' },
    { id: 'KOM', count: 168, entry: 'wr_kom_right_commit', parent: 'wr_kom_assembly' },
    { id: 'SAM', count: 159, entry: 'wr_sam_officers_commit', parent: 'wr_sam_assembly' }
];
const rightChoices = [0, 1, 2, 3].map(index => `wr_kom_right_${index}_choice`);
const card = (page, id) => page.locator(`.focus-card[data-focus-id="${id}"]`);

test.beforeEach(async ({ browser }, testInfo) => {
    if (captureOnly) testInfo.annotations.push({ type: 'capture-only', description: '只记录画面；新增互斥表达与 resize 的合格断言未执行' });
    await attachJson(testInfo, 'browser-environment', {
        mode: captureOnly ? 'capture-only' : compareScreenshots ? 'verify-and-compare' : 'verify',
        version: browser.version(),
        executable: process.env.FOCUS_BROWSER_EXECUTABLE || 'Playwright bundled Chromium',
        viewport: testInfo.project.use.viewport,
        node: process.version
    });
});

async function openTree(page, faction, scenario = 'west-russia') {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.locator('.menu-scenario').filter({ hasText: scenario === 'west-russia' ? '西俄罗斯 · 大动乱' : '美国内战' }).click();
    await page.getByLabel('每回合时间', { exact: true }).selectOption({ label: '不限时' });
    await page.getByRole('button', { name: '单机沙盒（本地房间）', exact: true }).click();
    if (faction !== (scenario === 'west-russia' ? 'WRF' : 'USA')) {
        await page.locator('.slot-row').filter({ hasText: `${faction} ·` })
            .getByRole('button', { name: '换到这里', exact: true }).click();
    }
    await page.getByRole('button', { name: '开始游戏', exact: true }).click();
    await page.getByRole('button', { name: '国策', exact: true }).click();
    await expect(page.locator('.focus-tree-canvas')).toBeVisible();
    if (scenario === 'west-russia') await expect(page.locator('[data-focus-zoom-label]')).toHaveText('82%');
}

async function checkUnifiedCards(page, testInfo, name) {
    const metrics = await page.locator('.focus-card').evaluateAll(nodes => ({
        cards: nodes.length,
        legacyEmblems: nodes.filter(node => node.querySelector('.focus-emblem, .focus-plaque')).length,
        invalid: nodes.filter(node => {
            const header = node.querySelector('.focus-branch');
            return node.offsetWidth !== 190 || node.offsetHeight !== 150
                || !node.classList.contains('focus-unified-card')
                || !node.querySelector('.focus-title') || !node.querySelector('.focus-status-pill')
                || !node.querySelector('.focus-progress-mini') || !node.querySelector('.focus-cost')
                || !header || header.offsetHeight < 24 || header.offsetWidth < node.clientWidth - 2
                || getComputedStyle(header).backgroundColor === 'rgba(0, 0, 0, 0)';
        }).map(node => node.dataset.focusId),
        branchColors: [...new Set(nodes.map(node => getComputedStyle(node.querySelector('.focus-branch')).backgroundColor))]
    }));
    await attachJson(testInfo, name, metrics);
    expect(metrics.cards).toBeGreaterThan(100);
    expect(metrics.legacyEmblems).toBe(0);
    expect(metrics.invalid).toEqual([]);
    expect(metrics.branchColors.length).toBeGreaterThanOrEqual(4);
}

async function readViewport(page) {
    return page.locator('.focus-tree-scroll').evaluate(scroller => {
        const canvas = scroller.querySelector('.focus-tree-canvas');
        const stage = scroller.querySelector('.focus-tree-stage');
        const rect = scroller.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: scroller.clientWidth, height: scroller.clientHeight,
            left: scroller.scrollLeft, top: scroller.scrollTop, scrollWidth: scroller.scrollWidth,
            scrollHeight: scroller.scrollHeight, stageWidth: stage.getBoundingClientRect().width,
            stageHeight: stage.getBoundingClientRect().height,
            scale: new DOMMatrix(getComputedStyle(canvas).transform).a };
    });
}

async function selectedIsInView(page, id) {
    await expect(page.locator('.focus-detail-panel')).toHaveAttribute('data-focus-detail-id', id);
    await expect(card(page, id)).toHaveClass(/\bselected\b/);
    await expect.poll(() => card(page, id).evaluate(element => {
        const rect = element.getBoundingClientRect();
        const scroller = element.closest('.focus-tree-scroll').getBoundingClientRect();
        return rect.left >= scroller.left - 2 && rect.right <= scroller.right + 2
            && rect.top >= scroller.top - 2 && rect.bottom <= scroller.bottom + 2;
    })).toBe(true);
}

async function snapshot(page, testInfo, name) {
    await page.evaluate(() => document.fonts.ready);
    // Remove incidental hover without changing the application DOM or styles.
    await page.mouse.move(1, 1);
    const file = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path: file, fullPage: false, animations: 'disabled', caret: 'hide' });
    await testInfo.attach(name, { path: file, contentType: 'image/png' });
    if (compareScreenshots) await expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled', caret: 'hide' });
}

async function attachJson(testInfo, name, data) {
    await testInfo.attach(name, { body: Buffer.from(JSON.stringify(data, null, 2)), contentType: 'application/json' });
}

async function checkRenderedGeometry(page, testInfo, name) {
    const result = await page.locator('.focus-tree-canvas').evaluate(canvas => {
        const cards = [...canvas.querySelectorAll('.focus-card')].map(element => ({
            id: element.dataset.focusId, rect: element.getBoundingClientRect()
        }));
        const byId = new Map(cards.map(item => [item.id, item.rect]));
        const overlaps = [];
        for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
            const a = cards[i].rect, b = cards[j].rect;
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
                && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlaps.push([cards[i].id, cards[j].id]);
        }
        const detachedEndpoints = [];
        for (const link of canvas.querySelectorAll('path[data-focus-from]')) {
            const source = byId.get(link.dataset.focusFrom), target = byId.get(link.dataset.focusTo);
            const matrix = link.getScreenCTM();
            const start = link.getPointAtLength(0).matrixTransform(matrix);
            const end = link.getPointAtLength(link.getTotalLength()).matrixTransform(matrix);
            if (!source || !target || Math.hypot(start.x - (source.left + source.width / 2), start.y - source.bottom) > 2
                || Math.hypot(end.x - (target.left + target.width / 2), end.y - target.top) > 2) {
                detachedEndpoints.push([link.dataset.focusFrom, link.dataset.focusTo]);
            }
        }
        return { cards: cards.length, overlaps, detachedEndpoints,
            paths: canvas.querySelectorAll('path[data-focus-from]').length,
            crossBranchPaths: canvas.querySelectorAll('.focus-link-cross').length };
    });
    await attachJson(testInfo, name, result);
    expect(result.overlaps).toEqual([]);
    expect(result.detachedEndpoints).toEqual([]);
    expect(result.paths).toBeGreaterThan(0);
}

for (const faction of factions) {
    test(`${faction.id}: full tree, overview, branch and cross-branch round trip`, async ({ page }, testInfo) => {
        await openTree(page, faction.id);
        await expect(page.locator('.focus-card')).toHaveCount(faction.count);
        await checkUnifiedCards(page, testInfo, `${faction.id}-unified-cards`);
        await checkRenderedGeometry(page, testInfo, `${faction.id}-full-geometry`);
        await snapshot(page, testInfo, `${faction.id}-full`);

        await page.getByRole('button', { name: '全局图', exact: true }).click();
        await expect(page.locator('.focus-modal')).toHaveClass(/focus-modal-overview/);
        await expect(page.locator('.focus-overview-nodes rect')).toHaveCount(faction.count);
        await snapshot(page, testInfo, `${faction.id}-overview`);
        await page.locator(`[data-focus-chapter="${faction.entry}"]`).click();
        await expect(page.locator('.focus-modal')).not.toHaveClass(/focus-modal-overview/);
        await selectedIsInView(page, faction.entry);

        await page.getByRole('button', { name: '仅此支线', exact: true }).click();
        await expect(page.getByRole('button', { name: '仅此支线', exact: true })).toHaveAttribute('aria-pressed', 'true');
        expect(await page.locator('.focus-card').count()).toBeLessThan(faction.count);
        expect(await page.locator('.focus-link-cross').count()).toBe(0);
        await checkRenderedGeometry(page, testInfo, `${faction.id}-branch-geometry`);
        await snapshot(page, testInfo, `${faction.id}-branch`);

        const previousBranch = await card(page, faction.entry).getAttribute('data-branch');
        await page.locator(`.focus-detail-panel [data-focus-link-id="${faction.parent}"]`).click();
        await selectedIsInView(page, faction.parent);
        expect(await card(page, faction.parent).getAttribute('data-branch')).not.toBe(previousBranch);
        const branches = await page.locator('.focus-card').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.branch))]);
        expect(branches).toHaveLength(1);
        await snapshot(page, testInfo, `${faction.id}-cross-branch-parent`);
        await page.locator(`.focus-detail-panel [data-focus-link-id="${faction.entry}"]`).click();
        await selectedIsInView(page, faction.entry);
        await expect(page.getByLabel('跳转国策支线')).toHaveValue(faction.entry);
    });
}

test('USA: the American campaign shares full-size branch-colored cards with West Russia', async ({ page }, testInfo) => {
    await openTree(page, 'USA', 'america');
    await checkUnifiedCards(page, testInfo, 'USA-unified-cards');
    await snapshot(page, testInfo, 'USA-unified-cards');
});

test('KOM: button zoom, wheel anchor, selection scroll retention and background drag', async ({ page }, testInfo) => {
    await openTree(page, 'KOM');
    await page.getByLabel('跳转国策支线').selectOption('wr_kom_right_commit');
    await card(page, rightChoices[0]).click();
    const start = await readViewport(page);
    await page.getByTitle('放大国策树', { exact: true }).click();
    await expect.poll(async () => (await readViewport(page)).scale).toBeGreaterThan(start.scale);
    await page.getByTitle('缩小国策树', { exact: true }).click();
    expect((await readViewport(page)).scale).toBeCloseTo(start.scale, 4);

    const beforeWheel = await readViewport(page);
    const pointer = { x: beforeWheel.width * 0.55, y: beforeWheel.height * 0.5 };
    await page.mouse.move(beforeWheel.x + pointer.x, beforeWheel.y + pointer.y);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => (await readViewport(page)).scale).toBeGreaterThan(beforeWheel.scale);
    const afterWheel = await readViewport(page);
    expect(Math.abs((beforeWheel.left + pointer.x) / beforeWheel.scale - (afterWheel.left + pointer.x) / afterWheel.scale)).toBeLessThan(2);
    expect(Math.abs((beforeWheel.top + pointer.y) / beforeWheel.scale - (afterWheel.top + pointer.y) / afterWheel.scale)).toBeLessThan(2);

    // Choose an already visible card so Playwright need not scroll it into view.
    const visibleId = await page.locator('.focus-tree-scroll').evaluate(scroller => {
        const area = scroller.getBoundingClientRect();
        return [...scroller.querySelectorAll('.focus-card')].find(node => {
            const box = node.getBoundingClientRect();
            return box.left > area.left + 5 && box.right < area.right - 5 && box.top > area.top + 5 && box.bottom < area.bottom - 5;
        })?.dataset.focusId;
    });
    expect(visibleId).toBeTruthy();
    const beforeSelect = await readViewport(page);
    await card(page, visibleId).click();
    const afterSelect = await readViewport(page);
    expect(Math.abs(afterSelect.left - beforeSelect.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(afterSelect.top - beforeSelect.top)).toBeLessThanOrEqual(1);

    const emptyPoint = await page.locator('.focus-tree-scroll').evaluate(scroller => {
        const area = scroller.getBoundingClientRect();
        for (let y = area.top + 120; y < area.bottom - 30; y += 37) for (let x = area.left + 160; x < area.right - 30; x += 41) {
            const hit = document.elementFromPoint(x, y);
            if (hit && scroller.contains(hit) && !hit.closest('button, .focus-detail-panel')) return { x, y };
        }
        return null;
    });
    expect(emptyPoint).toBeTruthy();
    const beforeDrag = await readViewport(page);
    await page.mouse.move(emptyPoint.x, emptyPoint.y);
    await page.mouse.down();
    await page.mouse.move(emptyPoint.x - 100, emptyPoint.y - 80, { steps: 12 });
    await page.mouse.up();
    await expect.poll(async () => (await readViewport(page)).left).toBeGreaterThan(beforeDrag.left + 60);
    await expect.poll(async () => (await readViewport(page)).top).toBeGreaterThan(beforeDrag.top + 50);
    await attachJson(testInfo, 'interaction-metrics', { beforeWheel, afterWheel, beforeSelect, afterSelect, beforeDrag, afterDrag: await readViewport(page) });
    await snapshot(page, testInfo, 'KOM-zoom-pan');
});

test('KOM: all four candidates remain one exclusive choice in full and branch views', async ({ page }, testInfo) => {
    await openTree(page, 'KOM');
    await page.getByLabel('跳转国策支线').selectOption('wr_kom_right_commit');
    for (const branchOnly of [false, true]) {
        if (branchOnly) await page.getByRole('button', { name: '仅此支线', exact: true }).click();
        await card(page, rightChoices[0]).click();
        const groups = await page.locator('[data-focus-mutual-group]').evaluateAll(nodes => nodes.map(node => node.dataset.focusMutualGroup.split(' ')));
        const marked = await page.locator('.focus-mutual-target').evaluateAll(nodes => nodes.map(node => node.dataset.focusId).sort());
        await attachJson(testInfo, `mutex-${branchOnly ? 'branch' : 'full'}`, { groups, marked });
        await snapshot(page, testInfo, `KOM-mutex-${branchOnly ? 'branch' : 'full'}`);
        if (!captureOnly) {
            expect(groups.filter(group => rightChoices.every(id => group.includes(id)))).toHaveLength(1);
            expect(marked).toEqual(rightChoices.slice(1).sort());
            for (const id of rightChoices) await expect(card(page, id).locator('.focus-choice-label')).toBeVisible();
        }
    }
});

test('WRF: selected successor exposes its cross-branch conflict and reciprocal navigation', async ({ page }, testInfo) => {
    await openTree(page, 'WRF');
    const first = 'wr_wrf_cadres_commit', other = 'wr_wrf_zhukov_wartime';
    await page.getByLabel('跳转国策支线').selectOption(first);
    await snapshot(page, testInfo, 'WRF-cross-branch-conflict');
    if (!captureOnly) await expect(card(page, other)).toHaveAttribute('data-focus-mutual-selected', 'true');
    await page.locator(`.focus-detail-panel [data-focus-link-id="${other}"]`).click();
    await selectedIsInView(page, other);
    if (!captureOnly) await expect(card(page, first)).toHaveAttribute('data-focus-mutual-selected', 'true');
    await page.locator(`.focus-detail-panel [data-focus-link-id="${first}"]`).click();
    await selectedIsInView(page, first);
});

test('KOM: overview fits after a window resize and shrinking does not leave an unscaled scroll area', async ({ page }, testInfo) => {
    await openTree(page, 'KOM');
    await page.getByRole('button', { name: '全局图', exact: true }).click();
    await page.setViewportSize({ width: 1100, height: 800 });
    const visibleOverview = () => page.locator('.focus-tree-scroll').evaluate(scroller => {
        const area = scroller.getBoundingClientRect();
        const nodes = [...scroller.querySelectorAll('.focus-overview-nodes rect')];
        return nodes.every(node => { const box = node.getBoundingClientRect(); return box.left >= area.left - 1 && box.right <= area.right + 1
            && box.top >= area.top - 1 && box.bottom <= area.bottom + 1; });
    });
    if (!captureOnly) await expect.poll(visibleOverview).toBe(true);
    await attachJson(testInfo, 'overview-resize', { allNodesVisible: await visibleOverview(), viewport: await readViewport(page) });
    await snapshot(page, testInfo, 'KOM-overview-1100');
    await page.getByRole('button', { name: '全局图', exact: true }).click();
    for (let i = 0; i < 6; i++) await page.getByTitle('缩小国策树', { exact: true }).click();
    const small = await readViewport(page);
    expect(small.scrollWidth - Math.max(small.width, small.stageWidth)).toBeLessThanOrEqual(2);
    expect(small.scrollHeight - Math.max(small.height, small.stageHeight)).toBeLessThanOrEqual(2);
    await attachJson(testInfo, 'shrunk-scroll-area', small);
    await snapshot(page, testInfo, 'KOM-small-tree');
});
