'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import type { WorkspaceConfig, WorkspaceFieldDef } from './WorkspaceConfig';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';

const labelClass =
  'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

function FieldWrapper({
  field,
  children,
}: {
  field: WorkspaceFieldDef;
  children: React.ReactNode;
}) {
  const colClass = field.colSpan === 2 ? 'md:col-span-2' : '';
  return (
    <div className={colClass}>
      <label className={labelClass}>
        {field.label}
        {field.required && <span className="text-zinc-700 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function renderField(field: WorkspaceFieldDef, defaultPurpose: string) {
  if (field.type === 'select') {
    return (
      <FieldWrapper key={field.name} field={field}>
        <select
          name={field.name}
          defaultValue={field.name === 'purpose' ? defaultPurpose : (field.defaultValue ?? '')}
          required={field.required}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  }

  if (field.type === 'textarea') {
    return (
      <FieldWrapper key={field.name} field={field}>
        <textarea
          name={field.name}
          rows={3}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue ?? ''}
          required={field.required}
          className={`${inputClass} resize-none`}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'number') {
    return (
      <FieldWrapper key={field.name} field={field}>
        <input
          type="number"
          name={field.name}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue ?? ''}
          required={field.required}
          min="0"
          step="any"
          className={inputClass}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'date') {
    return (
      <FieldWrapper key={field.name} field={field}>
        <input
          type="date"
          name={field.name}
          defaultValue={field.defaultValue ?? ''}
          required={field.required}
          className={inputClass}
        />
      </FieldWrapper>
    );
  }

  // type === 'text' — optionally with datalist suggestions
  const listId = field.suggestions ? `${field.name}-suggestions` : undefined;
  return (
    <FieldWrapper key={field.name} field={field}>
      <input
        type="text"
        name={field.name}
        list={listId}
        placeholder={field.placeholder}
        defaultValue={field.defaultValue ?? ''}
        required={field.required}
        maxLength={field.name === 'symbol' ? 20 : 200}
        className={`${inputClass}${field.uppercase ? ' uppercase' : ''}`}
      />
      {field.suggestions && (
        <datalist id={listId}>
          {field.suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </FieldWrapper>
  );
}

interface WorkspaceAssetFormProps {
  config: WorkspaceConfig;
  action: (formData: FormData) => Promise<void>;
}

export function WorkspaceAssetForm({ config, action }: WorkspaceAssetFormProps) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="asset_class" value={config.assetClass} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {config.fields.map((field) => renderField(field, config.defaultPurpose))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton label={config.addButtonLabel} />
        <Link
          href={config.route}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
