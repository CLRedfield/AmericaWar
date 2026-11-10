const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Keep test dependencies and outputs separate from the game's static runtime.
const [mode = 'verify', ...args] = process.argv.slice(2);
if (!['verify', 'capture', 'compare'].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
const env = { ...process.env, FOCUS_CAPTURE: mode === 'capture' ? '1' : '0', FOCUS_COMPARE: mode === 'compare' ? '1' : '0' };
const forwarded = [];
for (let i = 0; i < args.length; i++) {
    const option = args[i];
    if (['--root', '--base-url', '--label'].includes(option)) {
        const value = args[++i];
        if (!value || value.startsWith('--')) throw new Error(`${option} requires a value`);
        if (option === '--root') env.FOCUS_SOURCE_ROOT = path.resolve(value);
        if (option === '--base-url') env.FOCUS_BASE_URL = value;
        if (option === '--label') env.FOCUS_RUN_LABEL = value;
    } else forwarded.push(option);
}
const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', ...forwarded], {
    cwd: __dirname,
    env,
    stdio: 'inherit'
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
