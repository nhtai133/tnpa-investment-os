import Link from 'next/link';

export function FormPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link href="/banking" className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold">
            Back to Banking
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">{title}</h1>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl bg-[#131316] border border-[#26262B] rounded-xl p-6">{children}</div>
      </main>
    </div>
  );
}
