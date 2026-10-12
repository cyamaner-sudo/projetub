import type { AiSettings, Issue, ProjectState, StepId, TextSectionId } from '../types.ts';
import { SECTION_DEFS } from '../data/sections.ts';
import { LIMITS } from '../data/programs.ts';
import { countWords } from '../lib/text.ts';
import { Card, inputCls, levelIcon, levelStyle } from '../ui.tsx';
import AiCoach from './AiCoach.tsx';
import { useState } from 'react';
import { askDraft, type DraftId } from '../lib/ai.ts';
import { PROGRAMS } from '../data/programs.ts';
import { setText, withAiUse } from '../lib/draftApply.ts';
import { btnGhost } from '../ui.tsx';

interface Props {
  id: TextSectionId;
  project: ProjectState;
  issues: Issue[];
  update: (f: (p: ProjectState) => ProjectState) => void;
  ai: AiSettings;
  openSettings: () => void;
}

function counter(id: TextSectionId, text: string): string {
  const n = countWords(text);
  if (id === 'title') return `${n} / ${LIMITS.titleMaxWords} kelime`;
  if (id === 'abstract') return `${n} kelime (${LIMITS.abstractMin}–${LIMITS.abstractMax})`;
  if (id === 'keywords') return '';
  return `${n} kelime`;
}

export function Guide({ id }: { id: TextSectionId }) {
  const d = SECTION_DEFS[id];
  return (
    <Card title="Rehber">
      <p className="text-sm text-slate-700">{d.what}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
        {d.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-medium text-slate-700">Kendinize sorun</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-600">
        {d.questions.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Card>
  );
}

export function Checks({ issues, step }: { issues: Issue[]; step: StepId }) {
  const mine = issues.filter((i) => i.step === step);
  if (!mine.length) return null;
  return (
    <Card title="Kontroller">
      <ul className="space-y-1">
        {mine.map((i) => (
          <li key={i.id} className={`flex gap-2 rounded-lg border px-2 py-1 text-xs ${levelStyle[i.level]}`}>
            <b>{levelIcon[i.level]}</b>
            <span>{i.message}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function SectionEditor({ id, project, issues, update, ai, openSettings }: Props) {
  const d = SECTION_DEFS[id];
  const value = project.texts[id];
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');
  const canDraft = id !== 'appendix';
  const draft = async () => {
    if (value.trim() && !confirm) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setBusy(true);
    setErr('');
    try {
      const text = await askDraft(ai, PROGRAMS[project.programId], project, id as DraftId);
      update((p) => withAiUse(setText(p, id, text), ai.model, [id as DraftId]));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  };
  const set = (v: string) => update((p) => ({ ...p, texts: { ...p.texts, [id]: v } }));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{d.label}</h2>
          <span className="text-xs text-slate-500">{counter(id, value)}</span>
        </div>
        {d.kind === 'line' ? (
          <input className={inputCls} value={value} placeholder={d.placeholder} onChange={(e) => set(e.target.value)} />
        ) : (
          <textarea
            className={`${inputCls} font-serif leading-relaxed`}
            rows={d.rows + 4}
            value={value}
            placeholder={d.placeholder}
            onChange={(e) => set(e.target.value)}
          />
        )}
        {canDraft && (
          <div className="flex flex-wrap items-center gap-2">
            <button className={btnGhost} disabled={busy || !ai.apiKey.trim()} onClick={draft}>
              {busy ? 'Taslak yazılıyor…' : confirm ? 'Mevcut metin silinip taslakla değişecek. Onaylıyor musunuz?' : 'YZ ile taslak oluştur'}
            </button>
            {confirm && <button className="text-xs underline" onClick={() => setConfirm(false)}>Vazgeç</button>}
            {!ai.apiKey.trim() && <button className="text-xs text-indigo-700 underline" onClick={openSettings}>API anahtarı ekleyin</button>}
          </div>
        )}
        {err && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-800">{err}</p>}
        {canDraft && value.includes('[DOLDUR') && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
            Taslakta [DOLDUR: ...] yer tutucuları var. Bunları kendi bilgilerinizle değiştirin; rapor ancak hepsi doldurulunca hazır sayılır.
          </p>
        )}
        {id === 'keywords' && <p className="text-xs text-slate-500">Virgülle ayırın.</p>}
        {(id === 'intro' || id === 'discussion' || id === 'method') && (
          <p className="text-xs text-slate-500">
            Atıf biçimi: (Yılmaz, 2020), (Yılmaz & Kaya, 2020) veya Yılmaz ve Kaya (2020). Kaynakçadaki girdilerle otomatik eşleştirilir.
          </p>
        )}
      </div>
      <aside className="space-y-3">
        <Checks issues={issues} step={id} />
        <Guide id={id} />
        <AiCoach settings={ai} project={project} sectionLabel={d.label} sectionText={value} openSettings={openSettings} />
      </aside>
    </div>
  );
}
