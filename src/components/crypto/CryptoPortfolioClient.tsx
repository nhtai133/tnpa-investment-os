'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardHeader } from '@/components/ui/Card';
import {
  CRYPTO_CHAINS,
  type CryptoChain,
  type CryptoWallet,
  shortenAddress,
} from '@/lib/crypto';

const STORAGE_KEY = 'tnpa.crypto.wallets.v1';

type WalletFormState = {
  name: string;
  chain: CryptoChain;
  address: string;
  notes: string;
  isActive: boolean;
};

const EMPTY_FORM: WalletFormState = {
  name: '',
  chain: 'BTC',
  address: '',
  notes: '',
  isActive: true,
};

function createWalletId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `wallet-${Date.now()}`;
}

function formatLastSynced(value: string | null) {
  if (!value) return 'Not synced';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function loadWallets(): CryptoWallet[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CryptoPortfolioClient() {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [form, setForm] = useState<WalletFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setWallets(loadWallets());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    }
  }, [loaded, wallets]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const address = form.address.trim();
    const notes = form.notes.trim();

    if (!name || !address) return;

    const now = new Date().toISOString();

    if (editingId) {
      setWallets((current) =>
        current.map((wallet) =>
          wallet.id === editingId
            ? { ...wallet, name, chain: form.chain, address, notes, isActive: form.isActive, updatedAt: now }
            : wallet,
        ),
      );
    } else {
      setWallets((current) => [
        {
          id: createWalletId(),
          name,
          chain: form.chain,
          address,
          notes,
          isActive: form.isActive,
          lastSyncedAt: null,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    resetForm();
  }

  function editWallet(wallet: CryptoWallet) {
    setEditingId(wallet.id);
    setForm({
      name: wallet.name,
      chain: wallet.chain,
      address: wallet.address,
      notes: wallet.notes,
      isActive: wallet.isActive,
    });
  }

  function deleteWallet(id: string) {
    setWallets((current) => current.filter((wallet) => wallet.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <p className="text-sm font-medium text-amber-200">
          Never enter seed phrase, private key, or recovery phrase. TNPA Investment OS only tracks
          public wallet addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6">
        <Card>
          <CardHeader
            label="Wallet Registry"
            action={editingId ? 'Editing wallet' : 'New wallet'}
          />
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label
                htmlFor="wallet-name"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Wallet name
              </label>
              <input
                id="wallet-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-lg border border-[#2F2F36] bg-[#0C0C0E] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-indigo-500"
                placeholder="Treasury wallet"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div>
                <label
                  htmlFor="wallet-chain"
                  className="block text-xs font-medium text-zinc-400 mb-1.5"
                >
                  Chain
                </label>
                <select
                  id="wallet-chain"
                  value={form.chain}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      chain: event.target.value as CryptoChain,
                    }))
                  }
                  className="w-full rounded-lg border border-[#2F2F36] bg-[#0C0C0E] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-500"
                >
                  {CRYPTO_CHAINS.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 self-end rounded-lg border border-[#2F2F36] bg-[#0C0C0E] px-3 py-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-zinc-600 bg-[#0C0C0E] text-indigo-600"
                />
                Is active
              </label>
            </div>

            <div>
              <label
                htmlFor="wallet-address"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Public address
              </label>
              <input
                id="wallet-address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                className="w-full rounded-lg border border-[#2F2F36] bg-[#0C0C0E] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-indigo-500"
                placeholder="0x…"
                required
              />
            </div>

            <div>
              <label
                htmlFor="wallet-notes"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Notes
              </label>
              <textarea
                id="wallet-notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="min-h-24 w-full resize-y rounded-lg border border-[#2F2F36] bg-[#0C0C0E] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-indigo-500"
                placeholder="Purpose, custody notes, exchange source, or tracking context"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                {editingId ? 'Save wallet' : 'Add wallet'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[#2F2F36] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-[#1C1C21]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader label="Registered Wallets" action={`${wallets.length} total`} />
          {wallets.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="mx-auto max-w-md text-sm text-zinc-400">
                Add your first public wallet address to start tracking crypto holdings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#26262B] text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Chain</th>
                    <th className="px-5 py-3">Address</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Last synced</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="border-b border-[#202026] last:border-0">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-zinc-100">{wallet.name}</p>
                        {wallet.notes && (
                          <p className="mt-1 max-w-48 truncate text-xs text-zinc-600">
                            {wallet.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge label={wallet.chain} color="#60A5FA" />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-300">
                        {shortenAddress(wallet.address)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${
                            wallet.isActive
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-zinc-700/30 text-zinc-400'
                          }`}
                        >
                          {wallet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {formatLastSynced(wallet.lastSyncedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editWallet(wallet)}
                            className="rounded-md border border-[#2F2F36] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-[#1C1C21]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWallet(wallet.id)}
                            className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
