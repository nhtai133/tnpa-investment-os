'use client';

interface Props {
  action: () => Promise<void>;
}

export function DeleteSnapshotButton({ action }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this snapshot? This cannot be undone.')) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-xs text-red-600 hover:text-red-400 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
