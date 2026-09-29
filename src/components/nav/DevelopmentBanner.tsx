import { tr } from '@/i18n';
export function DevelopmentBanner({ environment }: { environment: 'development' | 'production' }) {
  if (environment !== 'development') return null;
  return (
    <div role="alert" className="h-8 flex items-center justify-center bg-amber-400 px-3 text-center text-xs font-extrabold tracking-wide text-black">
      {tr("DEVELOPMENT — DỮ LIỆU THỬ NGHIỆM")}</div>
  );
}
