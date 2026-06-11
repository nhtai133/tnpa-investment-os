import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { APP_VERSION, APP_NAME, APP_ENV, DATABASE_URL, isLocalDb, dbMode } from '@/lib/env';

export const dynamic = 'force-dynamic';

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1A1A1F] last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-mono ${warn ? 'text-amber-400' : 'text-zinc-300'}`}>{value}</span>
    </div>
  );
}

export default function HealthPage() {
  const now = new Date().toISOString();
  const localDb = isLocalDb();
  const dbUrl = localDb ? DATABASE_URL : DATABASE_URL.replace(/\?.*$/, '…');

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

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-300 font-medium">Operational</span>
          </div>

          {/* App info */}
          <Card className="p-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Application</p>
            <Row label="Name" value={APP_NAME} />
            <Row label="Version" value={APP_VERSION} />
            <Row label="Environment" value={APP_ENV} />
            <Row label="Timestamp" value={now} />
          </Card>

          {/* Database */}
          <Card className="p-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Database</p>
            <Row label="Mode" value={dbMode()} warn={localDb} />
            <Row label="URL" value={dbUrl} warn={localDb} />
          </Card>

          {/* SQLite warning */}
          {localDb && (
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">Local SQLite — not suitable for Vercel production</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Local SQLite files are ephemeral on serverless platforms. Migrate to Turso or Supabase before deploying to production. See{' '}
                <code className="text-amber-600">docs/deployment/vercel.md</code>.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
