'use client';

import { useFormStatus } from 'react-dom';

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 text-sm text-red-400 border border-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Deleting…' : 'Delete Asset'}
    </button>
  );
}

interface DeleteAssetFormProps {
  action: (formData: FormData) => Promise<void>;
  assetName: string;
}

export function DeleteAssetForm({ action, assetName }: DeleteAssetFormProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[#26262B]">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">
        Danger Zone
      </p>
      <p className="text-xs text-zinc-600 mb-4">
        Permanently delete <span className="text-zinc-400">{assetName}</span>. This cannot be undone.
      </p>
      <form action={action}>
        <DeleteButton />
      </form>
    </div>
  );
}
