import { NavLinks } from './NavLinks';

export function TopNav() {
  return (
    <div className="border-b border-[#26262B] bg-[#0C0C0E] sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto px-6 h-11 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
          TNPA Investment OS
        </span>
        <NavLinks />
      </div>
    </div>
  );
}
