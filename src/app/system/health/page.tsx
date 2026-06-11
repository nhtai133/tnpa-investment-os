import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  APP_VERSION,
  APP_NAME,
  APP_ENV,
  resolveDbMode,
  dbMode,
  maskedDbUrl,
  hasAuthToken,
} from '@/lib/env';

export const dynamic = 'force-dynamic';

function Row({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'warn' | 'good' | 'muted';
}) {
  const colors = {
    normal: 'text-zinc-300',
    warn: 'text-amber-400',
    good: 'text-emerald-400',
    muted: 'text-zinc-600',
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1A1A1F] last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-mono ${colors[tone]}`}>{value}</span>
    </div>
  );
}

export default function HealthPage() {
  const now = new Date().toISOString();
  const mode = resolveDbMode();
  const local = mode === 'local';
  const turso = mode === 'turso';

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">System</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">Health</h1>
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
        <div className="max-w-md space-y-6">

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-300 font-medium">Operational</span>
          </div>

          {/* Application */}
          <Card className="p-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Application</p>
            <Row label="Name" value={APP_NAME} />
            <Row label="Version" value={APP_VERSION} />
            <Row label="Environment" value={APP_ENV} />
            <Row label="Timestamp" value={now} tone="muted" />
          </Card>

          {/* Database */}
          <Card className="p-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Database</p>
            <Row
              label="Mode"
              value={dbMode()}
              tone={turso ? 'good' : local ? 'warn' : 'normal'}
            />
            <Row
              label="URL"
              value={maskedDbUrl()}
              tone={local ? 'warn' : 'normal'}
            />
            <Row
              label="Auth Token"
              value={hasAuthToken() ? 'Configured' : 'Not set'}
              tone={turso && !hasAuthToken() ? 'warn' : hasAuthToken() ? 'good' : 'muted'}
            />
            <Row
              label="Deploy Readiness"
              value={local ? 'Local-only' : 'Cloud-ready'}
              tone={local ? 'warn' : 'good'}
            />
          </Card>

          {/* Local SQLite warning */}
          {local && (
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">
                Local SQLite — not suitable for Vercel production
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                SQLite files are ephemeral on serverless platforms. Set{' '}
                <code className="text-amber-600">TURSO_DATABASE_URL</code> and{' '}
                <code className="text-amber-600">TURSO_AUTH_TOKEN</code> to switch to Turso Cloud.
                See <code className="text-amber-600">docs/deployment/turso.md</code>.
              </p>
            </div>
          )}

          {/* Turso ready banner */}
          {turso && (
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-400 mb-1">
                Turso Cloud — production-ready remote DB
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Connected to Turso. Data is persisted remotely and safe for Vercel deployment.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
