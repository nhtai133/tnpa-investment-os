import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { parseRawNote } from '@/lib/parser';
import { revalidatePath } from 'next/cache';
import type { OpportunitySource, AssetClass } from '@/db/schema';

const VALID_SOURCES = new Set<string>(['manual', 'telegram', 'ai', 'other']);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw_note = typeof body.raw_note === 'string' ? body.raw_note.trim() : '';
  if (!raw_note) {
    return NextResponse.json({ error: 'raw_note is required' }, { status: 400 });
  }

  const source_raw = typeof body.source === 'string' ? body.source : 'manual';
  const source: OpportunitySource = VALID_SOURCES.has(source_raw)
    ? (source_raw as OpportunitySource)
    : 'manual';

  const hint_symbol =
    typeof body.symbol === 'string' && body.symbol.trim() ? body.symbol.trim() : null;
  const hint_class =
    typeof body.asset_class === 'string' && body.asset_class.trim()
      ? (body.asset_class.trim() as AssetClass)
      : null;
  const hint_name =
    typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
  const hint_thesis =
    typeof body.parsed_thesis === 'string' && body.parsed_thesis.trim()
      ? body.parsed_thesis.trim()
      : null;

  const parsed = parseRawNote(raw_note, { symbol: hint_symbol, asset_class: hint_class });

  const symbol = hint_symbol ?? parsed.symbol;
  const asset_class = hint_class ?? parsed.asset_class;
  const parsed_thesis = hint_thesis ?? parsed.parsed_thesis;
  const name =
    hint_name ??
    (symbol ?? null) ??
    raw_note.slice(0, 60).replace(/\s+/g, ' ').trim();

  const ts = new Date().toISOString();

  const [row] = await db
    .insert(opportunities)
    .values({
      name,
      symbol: symbol ?? undefined,
      asset_class: asset_class ?? undefined,
      source,
      raw_note,
      parsed_thesis: parsed_thesis || undefined,
      status: 'new',
      created_at: ts,
      updated_at: ts,
    })
    .returning({ id: opportunities.id });

  revalidatePath('/intake');
  revalidatePath('/pipeline');

  return NextResponse.json(
    {
      id: row.id,
      name,
      symbol,
      asset_class,
      source,
      parsed_thesis,
      status: 'new',
      url: `/opportunities/${row.id}`,
    },
    { status: 201 },
  );
}
