import { tr } from '@/i18n';
import { getUsdVndRate } from '@/lib/settings';
import { FxRateForm } from '@/components/settings/FxRateForm';
import { WealthTrackingStartDateForm } from '@/components/settings/WealthTrackingStartDateForm';
import { DataManagement } from '@/components/settings/DataManagement';
import { Card } from '@/components/ui/Card';
import { db } from '@/db';
import { assets, appSettings } from '@/db/schema';
import { APP_VERSION, APP_ENV, dbMode, isLocalDb, deployReadiness } from '@/lib/env';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [usdVndRate, allAssets, allSettings] = await Promise.all([
    getUsdVndRate(),
    db.select().from(assets),
    db.select().from(appSettings),
  ]);

  const activeAssets = allAssets.filter((a) => !a.is_archived).length;
  const archivedAssets = allAssets.filter((a) => a.is_archived).length;
  const settingsCount = allSettings.length;
  const trackingStartDate = allSettings.find((setting) => setting.key === 'wealth_tracking_start_date')?.value ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">{tr("System")}</p>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">{tr("Settings")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        <section>
          <div className="mb-3"><p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">{tr('Wealth tracking')}</p></div>
          <Card className="p-5"><WealthTrackingStartDateForm currentDate={trackingStartDate} /></Card>
        </section>

        {/* Reporting Currency */}
        <section>
          <div className="mb-3">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              {tr("Reporting Currency")}</p>
          </div>
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">{tr("USD – United States Dollar")}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{tr("Base currency for all portfolio calculations")}</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase bg-[#1C1C21] text-zinc-500">
                {tr("Active")}</span>
            </div>
            <p className="text-[11px] text-zinc-700 pt-2 border-t border-[#26262B]">
              {tr("Additional reporting currencies will be configurable in a future update.")}</p>
          </Card>
        </section>

        {/* FX Rates */}
        <section>
          <div className="mb-3">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              {tr("FX Rates")}</p>
          </div>
          <Card className="p-5">
            <FxRateForm currentRate={usdVndRate} />
          </Card>
        </section>

        {/* Data Management */}
        <section>
          <div className="mb-3">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              {tr("Data Management")}</p>
          </div>
          <DataManagement
            activeAssets={activeAssets}
            archivedAssets={archivedAssets}
            settingsCount={settingsCount}
          />
        </section>

        {/* App Info */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              {tr("App Info")}</p>
            <div className="flex items-center gap-3">
              <Link
                href="/system/production"
                className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                {tr("Checklist →")}</Link>
              <Link
                href="/system/health"
                className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                {tr("Health →")}</Link>
            </div>
          </div>
          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("Version")}</span>
              <span className="text-xs text-zinc-300 tabular-nums">{APP_VERSION}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("System")}</span>
              <span className="text-xs text-zinc-300">TNPA Wealth OS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("Environment")}</span>
              <span className="text-xs text-zinc-300">{APP_ENV}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("Database")}</span>
              <span className={`text-xs ${isLocalDb() ? 'text-amber-400' : 'text-emerald-400'}`}>
                {dbMode()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("Deploy Readiness")}</span>
              <span className={`text-xs font-medium ${isLocalDb() ? 'text-zinc-600' : 'text-emerald-400'}`}>
                {deployReadiness()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{tr("Type")}</span>
              <span className="text-xs text-zinc-300">{tr("Personal Family Office")}</span>
            </div>
            {isLocalDb() && (
              <div className="pt-2 border-t border-[#26262B] flex items-center justify-between">
                <p className="text-[11px] text-zinc-700">
                  {tr("Private local-only mode. Backups stay on this Mac.")}</p>
                <Link
                  href="/system/production"
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors whitespace-nowrap ml-3"
                >
                  {tr("Local operation →")}</Link>
              </div>
            )}
          </Card>
        </section>

      </main>
    </div>
  );
}
