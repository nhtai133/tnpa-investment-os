'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface BackupPreview {
  asset_count: number;
  archived_asset_count: number;
  settings_count: number;
  exported_at: string;
}

interface DataManagementProps {
  activeAssets: number;
  archivedAssets: number;
  settingsCount: number;
}

export function DataManagement({ activeAssets, archivedAssets, settingsCount }: DataManagementProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [pendingBackup, setPendingBackup] = useState<Record<string, unknown> | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function triggerDownload(url: string) {
    const a = document.createElement('a');
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>;

        if (data.app !== 'TNPA Investment OS') {
          setError('Invalid backup file: wrong app identifier.');
          return;
        }
        if (data.backup_version !== 1) {
          setError('Invalid backup file: unsupported version.');
          return;
        }
        if (!Array.isArray(data.assets)) {
          setError('Invalid backup file: assets array missing.');
          return;
        }

        const assetList = data.assets as Array<{ is_archived?: boolean }>;
        setPreview({
          asset_count:
            typeof data.asset_count === 'number'
              ? data.asset_count
              : assetList.filter((a) => !a.is_archived).length,
          archived_asset_count:
            typeof data.archived_asset_count === 'number'
              ? data.archived_asset_count
              : assetList.filter((a) => a.is_archived).length,
          settings_count: Array.isArray(data.app_settings) ? data.app_settings.length : 0,
          exported_at: typeof data.exported_at === 'string' ? data.exported_at : 'Unknown',
        });
        setPendingBackup(data);
      } catch {
        setError('Could not read file. Please select a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  }

  async function handleConfirmImport() {
    if (!pendingBackup) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingBackup),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Import failed. Please try again.');
        return;
      }

      setSuccess('Backup restored successfully.');
      setPreview(null);
      setPendingBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  function handleCancelImport() {
    setPreview(null);
    setPendingBackup(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-4">

      {/* Export JSON Backup */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">Export JSON Backup</p>
            <p className="text-xs text-zinc-500 mt-1">
              Full portfolio backup — assets, settings, decisions, watchlist, and research notes.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('/api/backup/export-json')}
            className="shrink-0 px-3 py-1.5 rounded-md bg-[#1C1C21] border border-[#26262B] text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </Card>

      {/* Export CSV Holdings */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">Export CSV Holdings</p>
            <p className="text-xs text-zinc-500 mt-1">
              Holdings only — spreadsheet-friendly format including active and archived assets.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('/api/backup/export-csv')}
            className="shrink-0 px-3 py-1.5 rounded-md bg-[#1C1C21] border border-[#26262B] text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </Card>

      {/* Import JSON Backup */}
      <Card className="p-5">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">Import JSON Backup</p>
            <p className="text-xs text-zinc-500 mt-1">
              Restore portfolio from a JSON backup file. Current local data will be replaced.
            </p>
          </div>

          {!preview && !success && (
            <>
              <input
                ref={fileInputRef}
                id="backup-file-input"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="backup-file-input"
                className="inline-block cursor-pointer px-3 py-1.5 rounded-md bg-[#1C1C21] border border-[#26262B] text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
              >
                Select Backup File
              </label>
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}

          {preview && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#26262B] bg-[#0C0C0E] p-3 space-y-2">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
                  Backup Preview
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Active assets</span>
                    <span className="text-xs text-zinc-300 tabular-nums">{preview.asset_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Archived assets</span>
                    <span className="text-xs text-zinc-300 tabular-nums">{preview.archived_asset_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Settings entries</span>
                    <span className="text-xs text-zinc-300 tabular-nums">{preview.settings_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Exported at</span>
                    <span className="text-xs text-zinc-300">
                      {new Date(preview.exported_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2">
                <p className="text-xs text-amber-400">
                  This will overwrite current local portfolio data. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-3 py-1.5 rounded-md bg-red-900/30 border border-red-800/50 text-xs font-medium text-red-300 hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                >
                  {importing ? 'Restoring…' : 'Confirm Restore'}
                </button>
                <button
                  onClick={handleCancelImport}
                  disabled={importing}
                  className="px-3 py-1.5 rounded-md bg-[#1C1C21] border border-[#26262B] text-xs font-medium text-zinc-400 hover:text-zinc-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Backup Info */}
      <Card className="p-5 space-y-3">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">Backup Info</p>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs text-zinc-500">Active assets</span>
            <span className="text-xs text-zinc-300 tabular-nums">{activeAssets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-zinc-500">Archived assets</span>
            <span className="text-xs text-zinc-300 tabular-nums">{archivedAssets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-zinc-500">Settings entries</span>
            <span className="text-xs text-zinc-300 tabular-nums">{settingsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-zinc-500">Database mode</span>
            <span className="text-xs text-zinc-300">Local SQLite</span>
          </div>
        </div>
        <div className="pt-2 border-t border-[#26262B] space-y-1.5">
          <p className="text-[11px] text-zinc-600">
            Backups are stored locally by your browser download. Keep a copy in cloud drive or external storage.
          </p>
          <p className="text-[11px] text-zinc-700">
            Wallet Registry localStorage backup will be added in a later sprint.
          </p>
        </div>
      </Card>

    </div>
  );
}
