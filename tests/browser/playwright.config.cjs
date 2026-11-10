const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const label = process.env.FOCUS_RUN_LABEL || 'current';
if (!/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error('FOCUS_RUN_LABEL must contain only letters, digits, _ or -');
const port = Number(process.env.FOCUS_PORT || 8766);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid FOCUS_PORT');
const remote = process.env.FOCUS_BASE_URL;
const baseURL = remote || `http://127.0.0.1:${port}/`;
if (!['http:', 'https:'].includes(new URL(baseURL).protocol)) throw new Error('Browser tests require an HTTP(S) URL');
if (!new URL(baseURL).pathname.endsWith('/')) throw new Error('FOCUS_BASE_URL must be a directory URL ending with /');

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: 'focus-tree.spec.cjs',
    timeout: 60_000,
    expect: { timeout: 8_000, toHaveScreenshot: { maxDiffPixelRatio: 0.002, threshold: 0.2 } },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    outputDir: path.join(__dirname, 'artifacts', label, 'results'),
    reporter: [
        ['list'],
        ['html', { outputFolder: path.join(__dirname, 'artifacts', label, 'report'), open: 'never' }],
        ['json', { outputFile: path.join(__dirname, 'artifacts', label, 'results.json') }]
    ],
    snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{platform}/{arg}{ext}',
    use: {
        baseURL,
        viewport: { width: 1363, height: 936 },
        deviceScaleFactor: 1,
        locale: 'zh-CN',
        timezoneId: 'Asia/Tokyo',
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        launchOptions: process.env.FOCUS_BROWSER_EXECUTABLE
            ? { executablePath: process.env.FOCUS_BROWSER_EXECUTABLE }
            : {},
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        headless: true
    },
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
    webServer: remote ? undefined : {
        command: 'node serve.cjs',
        cwd: __dirname,
        url: baseURL,
        env: { FOCUS_PORT: String(port) },
        reuseExistingServer: false,
        timeout: 10_000
    }
});
