const { spawn } = require('node:child_process');
const { homedir } = require('node:os');
const { resolve, join } = require('node:path');
const { fileURLToPath } = require('node:url');

const environment = process.argv[2];
const command = process.argv[3];
const args = process.argv.slice(4);
if (!['development', 'production'].includes(environment) || !command) {
  throw new Error('Usage: local-environment.cjs <development|production> <command> [...args]');
}
if (process.env.TNPA_ENV && process.env.TNPA_ENV !== environment) throw new Error(`Requested ${environment}, but TNPA_ENV is already ${process.env.TNPA_ENV}. Refusing environment switch.`);
const dataRoot = join(homedir(), environment === 'development' ? '.tnpa-wealth-os-dev' : '.tnpa-wealth-os');
if (process.env.TNPA_DATA_ROOT && resolve(process.env.TNPA_DATA_ROOT) !== resolve(dataRoot)) throw new Error(`TNPA_DATA_ROOT must be ${dataRoot} for ${environment}.`);
if (process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) throw new Error('Legacy remote database settings are disabled.');
if (process.env.DATABASE_URL) {
  let path;
  try { path = fileURLToPath(new URL(process.env.DATABASE_URL)); } catch { throw new Error('DATABASE_URL must be the canonical local file URL.'); }
  if (path !== join(dataRoot, 'database', 'wealth.db')) throw new Error(`DATABASE_URL must point to this ${environment} environment only.`);
}
const child = spawn(command, args, {
  stdio: 'inherit',
  env: { ...process.env, TNPA_ENV: environment, TNPA_DATA_ROOT: dataRoot, NEXT_TELEMETRY_DISABLED: '1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
