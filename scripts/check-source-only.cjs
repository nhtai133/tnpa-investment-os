const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const staged = new Set(execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean));
const bad = [];
for (const path of paths) {
  if (/(^|\/)(database|exports|backups|snapshots|logs|\.tnpa-wealth-os(?:-dev)?)(\/|$)|\.(db(?:-.*)?|sqlite3?(?:-.*)?|csv|tsv|jsonl|pem|key|bak|backup)$/i.test(path) || /(^|\/)\.env(?:\..*)?$/.test(path) && !path.endsWith('.env.example')) bad.push(path);
  if (path.endsWith('.json')) {
    try {
      const raw = staged.has(path)
        ? execFileSync('git', ['show', `:${path}`], { encoding: 'utf8' })
        : readFileSync(path, 'utf8');
      const value = JSON.parse(raw);
      if (value.backup_version || value.exported_at && value.assets || /"(TURSO_AUTH_TOKEN|private_key|seed_phrase)"\s*:\s*"[^"\s]+"/.test(raw)) bad.push(path);
    } catch { /* Deletions and non-JSON text are not data backups. */ }
  }
}
if (bad.length) { console.error('Private artifacts must not be committed:', [...new Set(bad)].join('\n')); process.exit(1); }
console.log('Source-only check passed: no tracked/unignored private artifact paths or JSON backup payloads.');
