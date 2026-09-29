const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const tag = process.argv[2];
if (!tag || process.argv.length !== 3 || !/^v\d+\.\d+\.\d+(?:[.-][A-Za-z0-9.-]+)?$/.test(tag)) throw new Error('Usage: npm run deploy:local -- <approved-tag>');
if (process.env.TNPA_ENV || process.env.TNPA_DATA_ROOT || process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) throw new Error('Unset runtime database overrides before local deployment.');
const git = (args) => spawnSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const head = git(['rev-parse', 'HEAD']);
if (head.status !== 0) throw new Error('Cannot determine current Git commit.');
const targetCommit = git(['rev-parse', `${tag}^{commit}`]);
if (targetCommit.status !== 0 || targetCommit.stdout.trim() !== head.stdout.trim()) throw new Error('Checkout must be exactly the approved tag before deployment.');
const dirty = git(['status', '--porcelain', '--untracked-files=all']);
if (dirty.status !== 0 || dirty.stdout.trim()) throw new Error('Deployment refused: source worktree must be clean.');
const tagType = git(['cat-file', '-t', tag]);
if (tagType.stdout.trim() !== 'tag') throw new Error('Deployment requires an annotated approved release tag.');

const home = os.homedir();
const appRoot = path.join(home, 'Applications', 'TNPA-Wealth-OS');
const releases = path.join(appRoot, 'releases');
const finalRelease = path.join(releases, tag);
const staging = path.join(releases, `.staging-${tag}-${process.pid}`);
if (fs.existsSync(finalRelease) || fs.existsSync(staging)) throw new Error('Release destination already exists; refusing to overwrite a deployed release.');
if (fs.existsSync(appRoot) && (fs.lstatSync(appRoot).isSymbolicLink() || !fs.statSync(appRoot).isDirectory())) throw new Error('Unexpected production deployment path; refusing to follow or replace it.');
const deploymentMarker = path.join(appRoot, '.tnpa-wealth-os-deployment');
if (fs.existsSync(appRoot) && !fs.existsSync(deploymentMarker)) throw new Error('Existing production directory lacks the TNPA deployment marker; refusing to modify it.');

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: 'inherit', env });
  if (result.status !== 0) throw new Error(`${command} failed; deployment stopped.`);
}
function auditTree(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const item = path.join(root, entry.name);
    if (/(^|\/)(database|exports|backups|snapshots|logs|\.git|\.tnpa-wealth-os(?:-dev)?)(\/|$)|(^|\/)\.env(?:\..*)?$|\.(db(?:[-.].*)?|sqlite(?:3)?(?:[-.].*)?|csv|tsv|jsonl|bak|backup)$/i.test(item)) throw new Error(`Private/generated artifact in deployment payload: ${item}`);
    if (entry.isDirectory()) auditTree(item);
  }
}
function writeAtomic(file, contents, mode = 0o755) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, contents, { mode, flag: 'wx' });
  fs.renameSync(tmp, file);
}
function setCurrent(release) {
  const linkTmp = path.join(appRoot, `.current-${process.pid}`);
  fs.symlinkSync(path.relative(appRoot, release), linkTmp, 'dir');
  fs.renameSync(linkTmp, path.join(appRoot, 'current'));
}

try {
  // A verified, timestamped copy is required before any application or schema update.
  run(process.execPath, ['scripts/local-environment.cjs', 'production', './node_modules/.bin/tsx', 'scripts/backup-production.ts']);
  run(process.execPath, ['scripts/local-environment.cjs', 'development', './node_modules/.bin/next', 'build']);
  const standalone = path.join(process.cwd(), '.next', 'standalone');
  if (!fs.existsSync(path.join(standalone, 'server.js')) || !fs.existsSync(path.join(process.cwd(), '.next', 'static'))) throw new Error('Standalone build output missing.');
  fs.mkdirSync(appRoot, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(deploymentMarker)) fs.writeFileSync(deploymentMarker, 'TNPA Wealth OS local deployment\n', { flag: 'wx', mode: 0o600 });
  fs.mkdirSync(releases, { recursive: true, mode: 0o700 });
  fs.mkdirSync(staging, { mode: 0o700 });
  fs.cpSync(standalone, staging, { recursive: true, dereference: false });
  fs.cpSync(path.join(process.cwd(), '.next', 'static'), path.join(staging, '.next', 'static'), { recursive: true });
  fs.cpSync(path.join(process.cwd(), 'public'), path.join(staging, 'public'), { recursive: true });
  fs.cpSync(path.join(process.cwd(), 'src', 'db', 'migrations'), path.join(staging, 'src', 'db', 'migrations'), { recursive: true });
  auditTree(staging);
  fs.writeFileSync(path.join(staging, 'release-tag.txt'), `${tag}\n`, { mode: 0o600, flag: 'wx' });
  fs.renameSync(staging, finalRelease);

  // Safe additive schema initialization is run only after a verified production backup.
  run(process.execPath, ['scripts/local-environment.cjs', 'production', './node_modules/.bin/tsx', 'src/db/init-local.ts', '--confirm-production-schema-migration']);

  writeAtomic(path.join(appRoot, 'start.sh'), `#!/bin/sh\nset -eu\nAPP_ROOT="$HOME/Applications/TNPA-Wealth-OS"\nexport TNPA_ENV=production\nexport TNPA_DATA_ROOT="$HOME/.tnpa-wealth-os"\nexport NEXT_TELEMETRY_DISABLED=1\nexport HOSTNAME=127.0.0.1\nexport PORT=3001\ncd "$APP_ROOT/current"\nexec node server.js\n`);
  writeAtomic(path.join(appRoot, 'rollback.sh'), `#!/bin/sh\nset -eu\nif [ "$#" -ne 1 ]; then echo "Usage: $0 <previous-release-tag>" >&2; exit 2; fi\nAPP_ROOT="$HOME/Applications/TNPA-Wealth-OS"\ncase "$1" in *[!A-Za-z0-9._-]*|'') echo "Invalid release tag" >&2; exit 2;; esac\n[ -f "$APP_ROOT/releases/$1/release-tag.txt" ] || { echo "Release not found" >&2; exit 1; }\nln -s "releases/$1" "$APP_ROOT/.current-rollback-$$"\nmv -fh "$APP_ROOT/.current-rollback-$$" "$APP_ROOT/current"\necho "Code rolled back to $1. Database is unchanged; verify schema compatibility before restarting."\n`);
  setCurrent(finalRelease);
  console.log(`Deployed approved release ${tag} to ${appRoot}. Production data remains at ~/.tnpa-wealth-os.`);
  console.log('Start or restart production explicitly with ~/Applications/TNPA-Wealth-OS/start.sh.');
} catch (error) {
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  console.error(error instanceof Error ? error.message : 'Deployment failed.');
  process.exitCode = 1;
}
