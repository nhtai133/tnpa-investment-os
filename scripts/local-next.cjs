const { spawn } = require('node:child_process');
const { homedir } = require('node:os');
const { join, resolve } = require('node:path');
const { fileURLToPath } = require('node:url');
const { existsSync, statSync } = require('node:fs');
const command = process.argv[2];
if (!['dev', 'build', 'lint'].includes(command) || process.argv.length > 3) {
  throw new Error('Use npm run dev/build/lint without overrides. Host is fixed to 127.0.0.1.');
}
const args = [require.resolve('next/dist/bin/next'), command];
const environment = 'development';
const dataRoot = join(homedir(), '.tnpa-wealth-os-dev');
if (process.env.TNPA_ENV && process.env.TNPA_ENV !== environment) throw new Error(`npm run ${command} requires TNPA_ENV=${environment}; refusing an environment switch.`);
if (process.env.TNPA_DATA_ROOT && process.env.TNPA_DATA_ROOT !== dataRoot) throw new Error(`npm run ${command} requires ${dataRoot}; refusing another data root.`);
if (process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) throw new Error('Remote database configuration is disabled.');
if (process.env.DATABASE_URL) {
  let path;
  try { path = fileURLToPath(new URL(process.env.DATABASE_URL)); } catch { throw new Error('DATABASE_URL must be the canonical local file URL.'); }
  if (resolve(path) !== resolve(dataRoot, 'database', 'wealth.db')) throw new Error(`npm run ${command} cannot use a database outside ${dataRoot}.`);
}
if (command === 'dev') args.push('--hostname', '127.0.0.1', '--port', '3002');
const env = { ...process.env, TNPA_ENV: environment, TNPA_DATA_ROOT: dataRoot, NEXT_TELEMETRY_DISABLED: '1' };
if (command === 'dev' && (!existsSync(join(dataRoot, 'database', 'wealth.db')) || statSync(join(dataRoot, 'database', 'wealth.db')).size === 0)) {
  const init = spawn(process.execPath, ['scripts/local-environment.cjs', 'development', './node_modules/.bin/tsx', 'src/db/init-local.ts'], { stdio: 'inherit', env });
  init.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  init.on('exit', (code) => { if (code !== 0) process.exit(code ?? 1); else startServer(); });
} else startServer();
function startServer() {
 const child = spawn(process.execPath, args, { stdio: 'inherit', env });
 for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
 child.on('exit', (code) => process.exit(code ?? 1));
}
