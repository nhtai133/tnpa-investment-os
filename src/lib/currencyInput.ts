export type CurrencyInputCurrency = 'VND' | 'USD' | string;

export function parseCurrencyInput(value: string): string {
  const normalized = value.replace(/[^\d.,-]/g, '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);
  const decimalPartLength = decimalIndex >= 0 ? normalized.slice(decimalIndex + 1).replace(/[^\d]/g, '').length : 0;
  const hasDecimal =
    decimalIndex >= 0 &&
    decimalPartLength > 0 &&
    decimalPartLength <= 2;

  const sign = normalized.trim().startsWith('-') ? '-' : '';
  if (!hasDecimal) return sign + normalized.replace(/[^\d]/g, '');

  const intPart = normalized.slice(0, decimalIndex).replace(/[^\d]/g, '');
  const decimalPart = normalized.slice(decimalIndex + 1).replace(/[^\d]/g, '');
  return `${sign}${intPart}.${decimalPart}`;
}

export function formatCurrencyInput(value: string | number | null | undefined, currency: CurrencyInputCurrency): string {
  if (value === null || value === undefined || value === '') return '';
  const raw = typeof value === 'number' ? String(value) : parseCurrencyInput(String(value));
  if (raw === '' || raw === '-') return raw;

  const [intPart, decimalPart] = raw.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = intPart.replace(/[^\d]/g, '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, currency === 'VND' ? '.' : ',');
  const formatted = `${sign}${grouped}`;
  return decimalPart != null && decimalPart !== '' ? `${formatted}.${decimalPart}` : formatted;
}

export function formatCompactVND(value: string | number | null | undefined): string {
  const amount = typeof value === 'number' ? value : Number(parseCurrencyInput(String(value ?? '')));
  if (!Number.isFinite(amount) || amount <= 0) return '';
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    return `≈ ${Number.isInteger(ty) ? ty.toFixed(0) : ty.toFixed(1)} tỷ VNĐ`;
  }
  if (amount >= 1_000_000) {
    const trieu = amount / 1_000_000;
    return `≈ ${Number.isInteger(trieu) ? trieu.toFixed(0) : trieu.toFixed(1)} triệu VNĐ`;
  }
  return '';
}
