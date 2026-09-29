import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { APP_VERSION, APP_NAME, dbMode, maskedDbUrl } from '@/lib/env';
export const dynamic = 'force-dynamic';
export default function LocalSystemPage() {
  return <div className="min-h-screen bg-[#0C0C0E]">
    <header className="border-b border-[#26262B] px-6 py-4"><div className="max-w-screen-xl mx-auto flex items-center justify-between">
      <div><p className="text-[11px] uppercase text-zinc-600">System</p><h1 className="text-base font-semibold">Health</h1></div>
      <Link href="/settings" className="text-xs text-zinc-500">← Settings</Link>
    </div></header>
    <main className="max-w-screen-xl mx-auto px-6 py-8"><div className="max-w-lg space-y-5">
      <Card className="p-5 space-y-3"><h2 className="text-emerald-400">Private local-only operation</h2>
        <p className="text-sm">{APP_NAME} · {APP_VERSION}</p><p className="text-xs">{dbMode()}</p>
        <p className="text-xs break-all">{maskedDbUrl()}</p>
        <p className="text-xs text-zinc-500">Standard startup binds to 127.0.0.1:3001. Remote database URLs are rejected. No cloud deployment or remote authentication.</p>
      </Card>
      <Card className="p-5 space-y-3"><h2 className="text-sm">Data protection</h2>
        <p className="text-xs text-zinc-500">Exports: ~/.tnpa-wealth-os/exports/</p>
        <p className="text-xs text-zinc-500">Pre-import backups: ~/.tnpa-wealth-os/backups/</p>
        <p className="text-xs text-zinc-500">Only source code belongs in GitHub. Financial files must remain on this Mac.</p>
      </Card>
      <Card className="p-5 space-y-3"><h2 className="text-sm">Operating limits</h2>
        <p className="text-xs text-zinc-500">Single trusted macOS user. No market-data feeds, broker synchronization or automatic trading. Rates and valuations are manual. Existing dependency vulnerabilities require a separate modernization sprint.</p>
        <p className="text-xs text-zinc-500">See docs/LOCAL_ONLY_SECURITY_MODEL.md for safeguards and limitations. These checks do not certify macOS firewall or disk encryption settings.</p>
      </Card>
    </div></main>
  </div>;
}
