import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateWatchlistItem } from '@/app/watchlist/actions';
import { WatchlistForm } from '@/components/watchlist/WatchlistForm';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function EditWatchlistItemPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const item = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!item) notFound();

  const updateAction = updateWatchlistItem.bind(null, id);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/watchlist"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Watchlist
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            {item.name}
          </h1>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <div className="p-6">
              <WatchlistForm
                action={updateAction}
                defaultValues={item}
                cancelHref="/watchlist"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
