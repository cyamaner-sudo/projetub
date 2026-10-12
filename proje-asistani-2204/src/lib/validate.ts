import type { Issue, Program, ProjectState, StepId, TextSectionId } from '../types.ts';
import { LIMITS } from '../data/programs.ts';
import { ETHICS_ITEMS, SECTION_DEFS } from '../data/sections.ts';
import { baseYear, countWords, extractCitations, normKey, parseKeywords } from './text.ts';
import { isRefComplete, refMatchKey, refToPlain } from './apa.ts';

const BODY_SECTIONS: TextSectionId[] = [
  'aim',
  'intro',
  'method',
  'findings',
  'discussion',
  'recommendations',
  'appendix',
];

/** Kelime başına yaklaşık 500 kelime/sayfa (TNR 12, tek aralık). Tablo ve şekiller dahil değildir. */
export function estimatePages(p: ProjectState): number {
  const t = p.texts;
  let words = countWords(t.abstract) + countWords(t.title) + countWords(t.keywords);
  for (const id of BODY_SECTIONS) words += countWords(t[id]);
  for (const r of p.references) words += countWords(refToPlain(r));
  words += p.timeline.length * 8;
  words += countWords(Object.values(p.aiDecl).join(' ')) + 8;
  return words / 500;
}

export function bodyCitations(p: ProjectState) {
  const all = BODY_SECTIONS.map((id) => p.texts[id]).join('\n');
  return extractCitations(all);
}

export function validateProject(p: ProjectState, prog: Program): Issue[] {
  const out: Issue[] = [];
  const add = (id: string, level: Issue['level'], step: StepId, message: string) =>
    out.push({ id, level, step, message });
  const t = p.texts;

  // Program ve alan
  if (!p.mainArea) add('area', 'warn', 'setup', `${prog.mainAreaLabel} seçilmedi.`);
  if (!p.subArea.trim()) add('sub', 'warn', 'setup', `${prog.subAreaLabel} belirtilmedi.`);
  if (p.mainArea && p.subArea.trim()) add('setup-ok', 'ok', 'setup', 'Program ve alan bilgileri tamam.');

  // Başlık
  const tw = countWords(t.title);
  if (tw === 0) add('title-empty', 'warn', 'title', 'Proje adı yazılmadı.');
  else if (tw > LIMITS.titleMaxWords)
    add('title-long', 'error', 'title', `Proje adı ${tw} kelime. En fazla ${LIMITS.titleMaxWords} olmalı.`);
  else add('title-ok', 'ok', 'title', `Proje adı ${tw} kelime.`);
  if (/[.!?]\s+\p{L}/u.test(t.title.trim()))
    add('title-single', 'warn', 'title', 'Proje adı tek bir cümle olmalı.');

  // Özet
  const aw = countWords(t.abstract);
  if (aw === 0) add('abs-empty', 'warn', 'abstract', 'Özet yazılmadı.');
  else if (aw < LIMITS.abstractMin)
    add('abs-short', 'warn', 'abstract', `Özet ${aw} kelime. En az ${LIMITS.abstractMin} olmalı.`);
  else if (aw > LIMITS.abstractMax)
    add('abs-long', 'error', 'abstract', `Özet ${aw} kelime. En fazla ${LIMITS.abstractMax} olmalı.`);
  else add('abs-ok', 'ok', 'abstract', `Özet ${aw} kelime, sınırlar içinde.`);
  if (extractCitations(t.abstract).length > 0)
    add('abs-cite', 'warn', 'abstract', 'Özette kaynak veya atıf bulunmamalı.');

  // Anahtar kelimeler
  const kws = parseKeywords(t.keywords);
  if (kws.length === 0) add('kw-empty', 'warn', 'keywords', 'Anahtar kelime girilmedi.');
  else if (kws.length > LIMITS.keywordsMax)
    add('kw-many', 'error', 'keywords', `${kws.length} anahtar kelime var. En fazla ${LIMITS.keywordsMax} olmalı.`);
  else add('kw-ok', 'ok', 'keywords', `${kws.length} anahtar kelime.`);

  // Metin bölümleri
  const required: TextSectionId[] = ['aim', 'intro', 'method', 'findings', 'discussion'];
  for (const id of required) {
    if (countWords(t[id]) === 0)
      add(`${id}-empty`, 'warn', id, `${SECTION_DEFS[id].label} bölümü henüz yazılmadı.`);
    else add(`${id}-ok`, 'ok', id, `${SECTION_DEFS[id].label} yazıldı (${countWords(t[id])} kelime).`);
  }

  const introCites = new Set(extractCitations(t.intro).map((c) => normKey(c.author) + baseYear(c.year)));
  if (countWords(t.intro) > 80 && introCites.size < 3)
    add('intro-cites', 'info', 'intro', `Giriş kaynak taramasına dayanmalı. Şu an ${introCites.size} farklı atıf var.`);

  if (countWords(t.discussion) > 80 && extractCitations(t.discussion).length === 0)
    add('disc-cites', 'info', 'discussion', 'Bulgularınızı literatürle karşılaştırın. Bu bölümde atıf yok.');

  if (/\b(anket|görüşme|katılımcı|gönüllü|öğrenciler?e|veli)\b/i.test(t.method)) {
    const needed = ETHICS_ITEMS.flatMap((g) => g.items).filter((i) => i.id === 'consent' || i.id === 'mebPermit');
    if (needed.some((i) => !p.ethics[i.id]))
      add('method-ethics', 'info', 'method', 'Yöntemde katılımcılar geçiyor. Etik bölümündeki izin maddelerini kontrol edin.');
  }

  // İş-zaman çizelgesi
  if (p.timeline.length === 0) add('tl-empty', 'warn', 'timeline', 'İş-zaman çizelgesine hiç iş eklenmedi.');
  else {
    const bad = p.timeline.filter((r) => !r.task.trim() || r.end < r.start);
    if (bad.length) add('tl-bad', 'error', 'timeline', `${bad.length} satırda iş adı eksik veya bitiş ayı başlangıçtan önce.`);
    else add('tl-ok', 'ok', 'timeline', `${p.timeline.length} iş planlandı.`);
  }

  // Kaynakça ve atıflar
  const cites = bodyCitations(p);
  if (p.references.length === 0) {
    if (cites.length > 0) add('ref-none', 'warn', 'refs', 'Metinde atıf var ama kaynakça boş.');
    else add('ref-empty', 'warn', 'refs', 'Kaynakça boş.');
  } else {
    const incomplete = p.references.filter((r) => !isRefComplete(r));
    if (incomplete.length) add('ref-incomplete', 'warn', 'refs', `${incomplete.length} kaynakta yazar, yıl veya başlık eksik.`);

    const keys = p.references.map((r) => ({ key: refMatchKey(r), year: baseYear(r.year) }));
    const seenMissing = new Set<string>();
    const used = new Set<number>();
    for (const c of cites) {
      const ca = normKey(c.author);
      const idx = keys.findIndex((k) => k.key && k.year === baseYear(c.year) && ca.includes(k.key));
      if (idx >= 0) used.add(idx);
      else {
        const label = `${c.author} (${c.year})`;
        if (!seenMissing.has(label)) {
          seenMissing.add(label);
          add(`cite-missing-${label}`, 'warn', 'refs', `"${label}" metinde geçiyor ama kaynakçada bulunamadı.`);
        }
      }
    }
    p.references.forEach((r, i) => {
      if (!used.has(i) && isRefComplete(r))
        add(`ref-unused-${r.id}`, 'info', 'refs', `Kaynakçada olup metinde atıf yapılmayan kaynak: ${refMatchKey(r)} (${r.year}).`);
    });
    if (!incomplete.length && seenMissing.size === 0) add('ref-ok', 'ok', 'refs', `${p.references.length} kaynak, atıflarla uyumlu.`);
  }

  // Yapay zekâ kullanım beyanı
  const dc = p.aiDecl;
  const dvals = [dc.tools, dc.purpose, dc.scope, dc.human];
  const filled = dvals.filter((x) => x.trim()).length;
  if (filled === 0)
    add('aidecl-none', 'info', 'aidecl', 'Üretken yapay zekâ aracı kullandıysanız beyan bölümünü doldurmanız gerekir. Kullanmadıysanız boş bırakın.');
  else if (filled < 4) add('aidecl-part', 'warn', 'aidecl', 'Beyanda dört alanın hepsi (araç, amaç, kapsam, insan müdahalesi) doldurulmalı.');
  else add('aidecl-ok', 'ok', 'aidecl', 'Yapay zekâ kullanım beyanı tamam.');

  // Doldurulmamış yer tutucular ([DOLDUR: ...])
  const allText = Object.values(t).join('\n') + dvals.join('\n');
  const ph = (allText.match(/\[(?:DOLDUR|ÖĞRENCİ DOLDURACAK)[^\]]*\]/g) ?? []).length;
  if (ph > 0) add('placeholders', 'error', 'review', `Metinde doldurulmamış ${ph} yer tutucu ([DOLDUR: ...]) var. Hepsini kendi bilgilerinizle değiştirin.`);

  // Sayfa tahmini
  const pages = estimatePages(p);
  if (pages > LIMITS.pageMax)
    add('pages-over', 'error', 'review', `Tahmini uzunluk yaklaşık ${pages.toFixed(1)} sayfa. Sınır ${LIMITS.pageMax}. Uzun ekleri EK BELGELER bölümüne taşıyın.`);
  else if (pages > LIMITS.pageMax - 3)
    add('pages-near', 'warn', 'review', `Tahmini uzunluk yaklaşık ${pages.toFixed(1)} sayfa, sınıra yakın. Tablo ve şekiller yer kaplar.`);

  // Etik
  const open = ETHICS_ITEMS.flatMap((g) => g.items).filter((i) => !i.conditional && !p.ethics[i.id]);
  if (open.length) add('ethics-open', 'info', 'ethics', `${open.length} etik/kural maddesi henüz onaylanmadı.`);
  else add('ethics-ok', 'ok', 'ethics', 'Zorunlu etik ve kural maddeleri onaylandı.');

  return out;
}

export type StepStatus = 'empty' | 'ok' | 'info' | 'warn' | 'error';

const RANK: Record<Issue['level'], number> = { error: 3, warn: 2, info: 1, ok: 0 };

export function stepStatus(issues: Issue[], step: StepId): StepStatus {
  const mine = issues.filter((i) => i.step === step);
  if (mine.length === 0) return 'empty';
  const worst = mine.reduce((a, b) => (RANK[b.level] > RANK[a.level] ? b : a));
  return worst.level;
}
