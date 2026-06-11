import Link from 'next/link';
import {
  APP_VERSION,
  APP_ENV,
  resolveDbMode,
  TURSO_DATABASE_URL,
  hasAuthToken,
  isLocalDb,
} from '@/lib/env';

export const dynamic = 'force-dynamic';

function Check({
  label,
  ok,
  warn,
  detail,
}: {
  label: string;
  ok: boolean;
  warn?: boolean;
  detail?: string;
}) {
  const icon = ok ? '✓' : warn ? '⚠' : '✗';
  const iconColor = ok ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-red-400';
  const labelColor = ok ? 'text-zinc-200' : warn ? 'text-zinc-300' : 'text-zinc-400';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1A1A1F] last:border-0">
      <span className={`text-xs font-mono mt-0.5 w-4 flex-shrink-0 ${iconColor}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${labelColor}`}>{label}</span>
        {detail && (
          <span className="ml-2 text-[11px] text-zinc-600 font-mono">{detail}</span>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#26262B] rounded-xl bg-[#131316] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#26262B]">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{title}</p>
      </div>
      <div className="px-5 py-1">
        {children}
      </div>
    </div>
  );
}

function Limitation({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1A1A1F] last:border-0">
      <span className="text-xs text-zinc-700 mt-0.5 w-4 flex-shrink-0">–</span>
      <div>
        <span className="text-xs text-zinc-400">{label}</span>
        <p className="text-[11px] text-zinc-700 mt-0.5">{note}</p>
      </div>
    </div>
  );
}

export default function ProductionPage() {
  const mode = resolveDbMode();
  const isTurso = mode === 'turso';
  const isLocal = mode === 'local';
  const hasToken = hasAuthToken();
  const hasTursoUrl = !!TURSO_DATABASE_URL;
  const isCloudReady = isTurso && hasToken;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">System</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Production Checklist
            </h1>
          </div>
          <Link
            href="/settings"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Settings
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="max-w-lg space-y-5">

          {/* Overall status banner */}
          {isCloudReady ? (
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-5 py-4">
              <p className="text-sm font-semibold text-emerald-400">Production Ready</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Turso Cloud is configured with an auth token. Safe to deploy to Vercel.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-5 py-4">
              <p className="text-sm font-semibold text-amber-400">
                {isLocal ? 'Local Mode — Not Yet Cloud-Ready' : 'Configuration Incomplete'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                {isLocal
                  ? 'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to enable production deployment.'
                  : 'Turso URL or auth token is missing. Check environment variables.'}
              </p>
            </div>
          )}

          {/* Environment */}
          <Section title="Environment">
            <Check
              label="App version"
              ok={true}
              detail={APP_VERSION}
            />
            <Check
              label="Runtime environment"
              ok={APP_ENV === 'production'}
              warn={APP_ENV !== 'production'}
              detail={APP_ENV}
            />
          </Section>

          {/* Database */}
          <Section title="Database">
            <Check
              label="Database mode"
              ok={isTurso}
              warn={isLocal}
              detail={isTurso ? 'Turso Cloud' : isLocal ? 'SQLite local file' : 'Custom libSQL'}
            />
            <Check
              label="TURSO_DATABASE_URL configured"
              ok={hasTursoUrl}
              warn={false}
            />
            <Check
              label="TURSO_AUTH_TOKEN configured"
              ok={hasToken}
              warn={hasTursoUrl && !hasToken}
            />
            <Check
              label="Cloud-ready"
              ok={isCloudReady}
              warn={!isCloudReady && hasTursoUrl}
            />
          </Section>

          {/* Application features */}
          <Section title="Application">
            <Check label="Backup export (JSON)" ok={true} />
            <Check label="Backup import (JSON)" ok={true} />
            <Check label="PWA manifest" ok={true} detail="TNPA Wealth OS" />
            <Check label="PWA icons (192px, 512px)" ok={true} />
            <Check label="Theme color" ok={true} detail="#818CF8" />
            <Check label="Mobile bottom navigation" ok={true} />
            <Check label="Sidebar drawer (mobile)" ok={true} />
            <Check label="Health page" ok={true} />
            <Check
              label="Production checklist"
              ok={true}
            />
          </Section>

          {/* Known limitations */}
          <Section title="Known Limitations">
            <Limitation
              label="No authentication"
              note="Single-user, no login. Suitable for personal/private use only. Do not expose publicly without auth."
            />
            <Limitation
              label="No multi-user accounts"
              note="All data belongs to one user. Multi-user support is not planned for v2.x."
            />
            <Limitation
              label="No broker integration"
              note="All portfolio values are entered manually. No brokerage APIs or automatic syncing."
            />
            <Limitation
              label="No automatic market pricing"
              note="Prices must be updated manually. No external market data feeds."
            />
            <Limitation
              label="No automatic trading"
              note="This tool tracks decisions only. No orders are placed."
            />
          </Section>

          {/* Next steps */}
          {isLocal && (
            <Section title="Next Steps to Deploy">
              <div className="py-3 space-y-2">
                <p className="text-[11px] text-zinc-400">Follow these steps to go production:</p>
                <ol className="space-y-1.5 text-[11px] text-zinc-500 list-decimal list-inside">
                  <li>Export a JSON backup (Settings → Data Management)</li>
                  <li>Create a Turso database — see <code className="text-zinc-400">docs/deployment/turso.md</code></li>
                  <li>Set <code className="text-zinc-400">TURSO_DATABASE_URL</code> and <code className="text-zinc-400">TURSO_AUTH_TOKEN</code></li>
                  <li>Run <code className="text-zinc-400">npm run db:migrate</code> to initialize the cloud schema</li>
                  <li>Import your backup JSON into the cloud instance</li>
                  <li>Deploy to Vercel — see <code className="text-zinc-400">docs/deployment/vercel.md</code></li>
                </ol>
              </div>
            </Section>
          )}

          <div className="flex items-center gap-4 pt-1">
            <Link
              href="/system/health"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              System Health →
            </Link>
            <Link
              href="/settings"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Settings →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
