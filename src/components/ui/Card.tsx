import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-[#131316] border border-[#26262B] rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  label: string;
  action?: ReactNode;
}

export function CardHeader({ label, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#26262B]">
      <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
        {label}
      </span>
      {action && <div className="text-xs text-zinc-500">{action}</div>}
    </div>
  );
}

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = '#818CF8' }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}
