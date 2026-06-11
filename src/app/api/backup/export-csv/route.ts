import { NextResponse } from 'next/server';
import { db } from '@/db';
import { assets } from '@/db/schema';

function csvCell(value: string | number | boolean | null | undefined): string {
  const str = value == null ? '' : String(value);
  return '"' + str.replace(/"/g, '""') + '"';
}

export async function GET() {
  const rows = await db.select().from(assets);

  const headers = [
    'name', 'symbol', 'asset_class', 'currency', 'current_value',
    'cost_basis', 'gain_loss', 'purpose', 'is_archived', 'notes',
    'created_at', 'updated_at',
  ];

  const csvRows = rows.map((a) => {
    const gainLoss = a.cost_basis != null ? a.current_value - a.cost_basis : '';
    return [
      csvCell(a.name),
      csvCell(a.symbol),
      csvCell(a.asset_class),
      csvCell(a.currency),
      csvCell(a.current_value),
      csvCell(a.cost_basis),
      csvCell(gainLoss),
      csvCell(a.purpose),
      csvCell(a.is_archived),
      csvCell(a.notes),
      csvCell(a.created_at),
      csvCell(a.updated_at),
    ].join(',');
  });

  const csv = [headers.join(','), ...csvRows].join('\n');
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tnpa-holdings-${date}.csv"`,
    },
  });
}
