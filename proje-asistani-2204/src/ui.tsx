import type { ReactNode } from 'react';
import type { IssueLevel } from './types.ts';

export const levelStyle: Record<IssueLevel, string> = {
  error: 'bg-red-50 text-red-800 border-red-200',
  warn: 'bg-amber-50 text-amber-900 border-amber-200',
  info: 'bg-sky-50 text-sky-900 border-sky-200',
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};
export const levelIcon: Record<IssueLevel, string> = { error: '✕', warn: '!', info: 'i', ok: '✓' };

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
export const btnCls =
  'rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50';
export const btnPrimary = `${btnCls} bg-indigo-600 text-white hover:bg-indigo-700`;
export const btnGhost = `${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {title && <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>}
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
