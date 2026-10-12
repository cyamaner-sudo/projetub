import type { Program, ProjectState, TimelineRow } from '../types.ts';
import { formatRef, sortedRefs, type Seg } from './apa.ts';
import { parseKeywords, splitParagraphs } from './text.ts';

export type Block =
  | { kind: 'meta'; label: string; value: string }
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'keywords'; label: string; text: string }
  | { kind: 'timeline'; months: number; start: number; rows: TimelineRow[] }
  | { kind: 'field'; label: string; text: string }
  | { kind: 'ref'; segs: Seg[] }
  | { kind: 'empty'; text: string };

/** Önizleme ve Word çıktısının ortak içerik modeli. */
export function buildReport(p: ProjectState, prog: Program): Block[] {
  const b: Block[] = [];
  const t = p.texts;

  b.push({ kind: 'meta', label: 'Proje Ana Alanı', value: p.mainArea });
  b.push({
    kind: 'meta',
    label: prog.subAreaLabel === 'Tematik alan' ? 'Proje Tematik Alanı' : 'Proje Alt Alanı',
    value: p.subArea,
  });
  b.push({ kind: 'meta', label: 'Proje Adı (Başlığı)', value: t.title.trim() });

  const d = p.aiDecl;
  if ([d.tools, d.purpose, d.scope, d.human].some((x) => x.trim())) {
    b.push({ kind: 'heading', text: 'Yapay Zeka Araçları Kullanım Beyanı' });
    b.push({ kind: 'field', label: 'Kullanılan araçlar', text: d.tools.trim() });
    b.push({ kind: 'field', label: 'Kullanım amacı', text: d.purpose.trim() });
    b.push({ kind: 'field', label: 'Kullanım kapsamı', text: d.scope.trim() });
    b.push({ kind: 'field', label: 'İnsan müdahalesi', text: d.human.trim() });
  }

  const section = (heading: string, text: string) => {
    b.push({ kind: 'heading', text: heading });
    const paras = splitParagraphs(text);
    if (paras.length === 0) b.push({ kind: 'empty', text: 'Bu bölüm henüz yazılmadı.' });
    for (const para of paras) b.push({ kind: 'para', text: para });
  };

  section('Özet', t.abstract);
  const kws = parseKeywords(t.keywords);
  if (kws.length) b.push({ kind: 'keywords', label: 'Anahtar Kelimeler', text: kws.join(', ') });

  section('Amaç', t.aim);
  section('Giriş', t.intro);
  section('Yöntem', t.method);

  b.push({ kind: 'heading', text: 'Proje İş-Zaman Çizelgesi' });
  if (p.timeline.length === 0) b.push({ kind: 'empty', text: 'Bu bölüm henüz yazılmadı.' });
  else b.push({ kind: 'timeline', months: p.timelineMonths, start: p.timelineStart, rows: p.timeline });

  section('Bulgular', t.findings);
  section('Sonuç ve Tartışma', t.discussion);
  section('Öneriler', t.recommendations);

  b.push({ kind: 'heading', text: 'Kaynaklar' });
  if (p.references.length === 0) b.push({ kind: 'empty', text: 'Bu bölüm henüz yazılmadı.' });
  for (const r of sortedRefs(p.references)) b.push({ kind: 'ref', segs: formatRef(r) });

  if (splitParagraphs(t.appendix).length > 0) section('Ekler', t.appendix);

  return b;
}
