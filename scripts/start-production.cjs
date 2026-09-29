const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
if (process.env.TNPA_ENV || process.env.TNPA_DATA_ROOT || process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Unset environment/database overrides before launching the installed production release.');
}
const root = path.join(os.homedir(), 'Applications', 'TNPA-Wealth-OS');
if (!fs.existsSync(path.join(root, '.tnpa-wealth-os-deployment'))) throw new Error(`No approved local production deployment is installed at ${root}.`);
const launcher = path.join(root, 'start.sh');
const current = fs.realpathSync(path.join(root, 'current'));
const releases = fs.realpathSync(path.join(root, 'releases'));
if (!current.startsWith(releases + path.sep) || !fs.existsSync(launcher)) throw new Error('Production release pointer or launcher is invalid.');
const child = spawn(launcher, [], { stdio: 'inherit', cwd: current, env: { ...process.env, TNPA_ENV: 'production', TNPA_DATA_ROOT: path.join(os.homedir(), '.tnpa-wealth-os'), NEXT_TELEMETRY_DISABLED: '1', HOSTNAME: '127.0.0.1', PORT: '3001' } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
