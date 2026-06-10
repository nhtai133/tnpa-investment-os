'use client';

import { useFormStatus } from 'react-dom';

function ArchiveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 text-sm text-amber-400 border border-amber-900 rounded-lg hover:bg-amber-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Archiving…' : 'Archive Asset'}
    </button>
  );
}

interface ArchiveAssetFormProps {
  action: (formData: FormData) => Promise<void>;
  assetName: string;
}

export function ArchiveAssetForm({ action, assetName }: ArchiveAssetFormProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[#26262B]">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">
        Archive
      </p>
      <p className="text-xs text-zinc-600 mb-4">
        Archive <span className="text-zinc-400">{assetName}</span> to remove it from portfolio
        totals. All related records are preserved and no data is deleted.
      </p>
      <form action={action}>
        <ArchiveButton />
      </form>
    </div>
  );
}
