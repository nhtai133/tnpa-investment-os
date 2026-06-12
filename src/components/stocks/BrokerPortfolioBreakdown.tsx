'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatValue, formatPercent } from '@/lib/formatters';
import type { BrokerPortfolioRow } from '@/lib/broker-portfolio';

interface Props {
  brokers: BrokerPortfolioRow[];
}

export function BrokerPortfolioBreakdown({ brokers }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (brokers.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="text-sm text-zinc-600 mb-3">No broker accounts registered yet.</p>
        <Link
          href="/stocks/accounts/new"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add a broker account
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      {/* Column header */}
      <div className="hidden md:grid grid-cols-[1fr_repeat(4,minmax(0,120px))_28px] gap-x-4 px-5 py-2.5 border-b border-[#26262B]">
        {['Broker', 'Cash', 'Stock Value', 'Total', 'P&L', ''].map((label, i) => (
          <span
            key={i}
            className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="divide-y divide-[#26262B]">
        {brokers.map((row) => {
          const isOpen = expandedIds.has(row.broker.id);
          const totalPnl = row.realizedPnl + row.unrealizedPnl;

          return (
            <div key={row.broker.id}>
              {/* Compact row — always visible */}
              <button
                type="button"
                onClick={() => toggle(row.broker.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#101014] transition-colors text-left"
              >
                <span className="text-sm font-medium text-zinc-200 flex-1 min-w-0 truncate">
                  {row.broker.name}
                </span>
                <span className="text-xs tabular-nums text-zinc-500 hidden sm:block w-[100px]">
                  <span className="text-zinc-600">Cash </span>
                  {formatValue(row.cashBalance, row.broker.currency)}
                </span>
                <span className="text-xs tabular-nums text-zinc-300 hidden md:block w-[100px]">
                  <span className="text-zinc-600">Stock </span>
                  {formatValue(row.stockCustodyValue, row.broker.currency)}
                </span>
                <span className="text-xs tabular-nums text-zinc-100 font-medium hidden md:block w-[100px]">
                  {formatValue(row.totalValue, row.broker.currency)}
                </span>
                <span
                  className={`text-xs tabular-nums hidden lg:block w-[90px] ${
                    totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {totalPnl >= 0 ? '+' : ''}
                  {formatValue(totalPnl, row.broker.currency)}
                </span>
                <svg
                  className={`w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Expanded detail */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 200ms ease',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div className="border-t border-[#1A1A1F] bg-[#0E0E12]">
                    {/* P&L strip + broker link */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-2.5 border-b border-[#1A1A1F] text-xs">
                      <span className="text-zinc-600">Realized:</span>
                      <span
                        className={`tabular-nums ${
                          row.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {row.realizedPnl >= 0 ? '+' : ''}
                        {formatValue(row.realizedPnl, row.broker.currency)}
                      </span>
                      <span className="text-zinc-600">Unrealized:</span>
                      <span
                        className={`tabular-nums ${
                          row.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {row.unrealizedPnl >= 0 ? '+' : ''}
                        {formatValue(row.unrealizedPnl, row.broker.currency)}
                      </span>
                      <span className="text-zinc-600">{row.transactionCount} transactions</span>
                      <Link
                        href={`/stocks/accounts/${row.broker.id}`}
                        className="ml-auto text-indigo-400 hover:text-indigo-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Broker →
                      </Link>
                    </div>

                    {/* Holdings table */}
                    {row.holdings.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-zinc-700">
                        No stock positions at this broker.{' '}
                        <Link
                          href="/transactions/new"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Add a buy transaction
                        </Link>{' '}
                        to assign holdings here.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#1A1A1F]">
                              {[
                                'Symbol',
                                'Company',
                                'Qty',
                                'Market Value',
                                'Cost Basis',
                                'Gain / Loss',
                                'Funding Source',
                              ].map((col) => (
                                <th
                                  key={col}
                                  className="px-5 py-2 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1A1F]">
                            {row.holdings.map((h) => (
                              <tr
                                key={h.asset.id}
                                className="hover:bg-[#131316] transition-colors"
                              >
                                <td className="px-5 py-2.5 font-mono text-xs text-zinc-400 whitespace-nowrap">
                                  {h.asset.symbol ?? '—'}
                                </td>
                                <td className="px-5 py-2.5 whitespace-nowrap">
                                  <Link
                                    href={`/holdings/${h.asset.id}`}
                                    className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors"
                                  >
                                    {h.asset.name}
                                  </Link>
                                </td>
                                <td className="px-5 py-2.5 text-zinc-400 tabular-nums whitespace-nowrap">
                                  {h.quantity.toLocaleString()}
                                </td>
                                <td className="px-5 py-2.5 text-zinc-200 tabular-nums whitespace-nowrap">
                                  {formatValue(h.marketValue, h.asset.currency)}
                                </td>
                                <td className="px-5 py-2.5 text-zinc-500 tabular-nums whitespace-nowrap">
                                  {formatValue(h.costBasis, h.asset.currency)}
                                </td>
                                <td className="px-5 py-2.5 whitespace-nowrap">
                                  <span
                                    className={`text-sm font-medium tabular-nums ${
                                      h.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                                  >
                                    {h.gainLoss >= 0 ? '+' : ''}
                                    {formatValue(h.gainLoss, h.asset.currency)}
                                  </span>
                                  {h.gainLossPct !== null && (
                                    <p
                                      className={`text-xs tabular-nums ${
                                        h.gainLossPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                                      }`}
                                    >
                                      {formatPercent(h.gainLossPct)}
                                    </p>
                                  )}
                                </td>
                                <td className="px-5 py-2.5 text-zinc-600 text-xs whitespace-nowrap">
                                  {h.fundingAccountName ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
