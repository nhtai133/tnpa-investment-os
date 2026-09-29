import { tr } from '@/i18n';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function CashFundsCompatPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold mb-1">
            {tr("Workspace")}</p>
          <h1 className="text-xl font-semibold text-zinc-100">{tr("Cash & Funds has moved")}</h1>
          <p className="text-sm text-zinc-500 mt-2">
            {tr("This workspace has been split into two dedicated spaces.")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/banking"
            className="bg-[#131316] border border-[#26262B] rounded-xl p-5 text-left hover:border-zinc-600 transition-colors"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">
              {tr("Banking")}</p>
            <p className="text-sm font-medium text-zinc-100">{tr("Cash, Savings & Term Deposits")}</p>
            <p className="text-xs text-zinc-600 mt-1">{tr("/banking →")}</p>
          </Link>

          <Link
            href="/funds"
            className="bg-[#131316] border border-[#26262B] rounded-xl p-5 text-left hover:border-zinc-600 transition-colors"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">
              {tr("Funds & ETFs")}</p>
            <p className="text-sm font-medium text-zinc-100">{tr("Mutual Funds, ETFs & Certificates")}</p>
            <p className="text-xs text-zinc-600 mt-1">{tr("/funds →")}</p>
          </Link>
        </div>

        <p className="text-[10px] text-zinc-700">
          {tr("Update your bookmarks — this page is kept for compatibility only.")}</p>
      </div>
    </div>
  );
}
