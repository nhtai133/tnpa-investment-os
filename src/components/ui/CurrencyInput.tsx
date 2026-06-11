'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatCompactVND, formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';

interface CurrencyInputProps {
  name: string;
  currency?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
  onRawChange?: (value: string) => void;
}

function helperLine(rawValue: string, currency: string) {
  if (!rawValue) return '';
  const formatted = formatCurrencyInput(rawValue, currency);
  if (currency === 'VND') {
    const compact = formatCompactVND(rawValue);
    return compact ? `${formatted} đ · ${compact}` : `${formatted} đ`;
  }
  return `$${formatted}`;
}

export function CurrencyInput({
  name,
  currency = 'VND',
  defaultValue,
  required,
  placeholder,
  className,
  onRawChange,
}: CurrencyInputProps) {
  const initialRaw = defaultValue === null || defaultValue === undefined ? '' : String(defaultValue);
  const [rawValue, setRawValue] = useState(parseCurrencyInput(initialRaw));
  const [displayValue, setDisplayValue] = useState(formatCurrencyInput(initialRaw, currency));
  const inputRef = useRef<HTMLInputElement>(null);
  const caretFromRightRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretFromRightRef.current === null || !inputRef.current) return;
    const next = Math.max(0, displayValue.length - caretFromRightRef.current);
    inputRef.current.setSelectionRange(next, next);
    caretFromRightRef.current = null;
  }, [displayValue]);

  useEffect(() => {
    setDisplayValue(formatCurrencyInput(rawValue, currency));
  }, [currency, rawValue]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    caretFromRightRef.current = input.value.length - (input.selectionStart ?? input.value.length);
    const nextRaw = parseCurrencyInput(input.value);
    setRawValue(nextRaw);
    onRawChange?.(nextRaw);
    setDisplayValue(formatCurrencyInput(nextRaw, currency));
  }

  return (
    <div>
      <input type="hidden" name={name} value={rawValue} />
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className={className}
      />
      <p className="mt-1 text-[10px] text-zinc-600 min-h-[1rem]">{helperLine(rawValue, currency)}</p>
    </div>
  );
}
