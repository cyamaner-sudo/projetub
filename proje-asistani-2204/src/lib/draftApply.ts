import type { ProjectState, TextSectionId } from '../types.ts';
import { MONTHS_TR } from './text.ts';
import { DRAFT_LABEL, type DraftId } from './ai.ts';

function monthYear(d = new Date()): string {
  const m = MONTHS_TR[d.getMonth()];
  return `${m.charAt(0)}${m.slice(1).toLocaleLowerCase('tr')} ${d.getFullYear()}`;
}

/** Taslak üretildiğinde Yapay Zeka Kullanım Beyanı alanlarını başlatır (öğrenci düzenler). */
export function withAiUse(p: ProjectState, model: string, ids: (DraftId | 'timeline')[]): ProjectState {
  const labels = ids.map((i) => (i === 'timeline' ? 'İş-Zaman Çizelgesi' : DRAFT_LABEL[i]));
  const prev = p.aiDecl;
  const known = prev.scope
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const scope = [...known, ...labels.filter((l) => !known.includes(l))].join(', ');
  return {
    ...p,
    aiDecl: {
      tools: prev.tools.trim() || `Gemini, ${model || 'gemini-flash-latest'}, ${monthYear()}`,
      purpose: prev.purpose.trim() || 'Bölüm taslaklarının hazırlanması (öğrencinin kendi fikir ve notlarından)',
      scope: scope ? `Taslak desteği alınan bölümler: ${scope}` : prev.scope,
      human: prev.human.trim() || '[DOLDUR: Çıktılarda yaptığınız değişiklikleri ve kaynakları nasıl doğruladığınızı yazın]',
    },
  };
}

export function setText(p: ProjectState, id: TextSectionId, text: string): ProjectState {
  return { ...p, texts: { ...p.texts, [id]: text } };
}
