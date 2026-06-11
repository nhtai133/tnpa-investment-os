import type { ReviewCadence } from '@/db/schema';

export type CalendarBand = 'overdue' | 'this_week' | 'this_month' | 'upcoming';
export type CalendarItemType = 'decision' | 'watchlist' | 'asset' | 'bucket';

export interface CalendarItem {
  key: string;
  type: CalendarItemType;
  name: string;
  dueDate: string;
  href: string;
  cadence?: string | null;
  subtext?: string | null;
  band: CalendarBand;
}

export const REVIEW_CADENCE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

export const CALENDAR_ITEM_COLORS: Record<CalendarItemType, string> = {
  decision: '#818CF8',
  watchlist: '#F472B6',
  asset: '#34D399',
  bucket: '#FBBF24',
};

export const CALENDAR_BAND_LABELS: Record<CalendarBand, string> = {
  overdue: 'Overdue',
  this_week: 'Due This Week',
  this_month: 'Due This Month',
  upcoming: 'Upcoming',
};

export const CALENDAR_BAND_COLORS: Record<CalendarBand, string> = {
  overdue: '#F87171',
  this_week: '#FBBF24',
  this_month: '#818CF8',
  upcoming: '#71717A',
};

export function getBand(
  dueDate: string,
  today: string,
  weekEnd: string,
  monthEnd: string,
): CalendarBand {
  if (dueDate < today) return 'overdue';
  if (dueDate <= weekEnd) return 'this_week';
  if (dueDate <= monthEnd) return 'this_month';
  return 'upcoming';
}

export function computeNextReviewDate(from: Date, cadence: ReviewCadence | string): string {
  const d = new Date(from);
  switch (cadence) {
    case 'monthly':    d.setMonth(d.getMonth() + 1); break;
    case 'quarterly':  d.setMonth(d.getMonth() + 3); break;
    case 'semi_annual': d.setMonth(d.getMonth() + 6); break;
    case 'annual':     d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

export function getDateBounds(): { today: string; weekEnd: string; monthEnd: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const week = new Date(now);
  week.setDate(week.getDate() + 6);
  const weekEnd = week.toISOString().split('T')[0];

  const month = new Date(now);
  month.setDate(month.getDate() + 30);
  const monthEnd = month.toISOString().split('T')[0];

  return { today, weekEnd, monthEnd };
}
