import type { Evidence, Reference } from '../types.ts';
import { emptyRef } from './apa.ts';

/** Metindeki ilk DOI'yi bulur (ilk sayfalarda). */
export function findDoi(text: string): string {
  const m = text.match(/\b(10\.\d{4,9}\/[^\s"<>\]\)]+)/i);
  if (!m) return '';
  return m[1].replace(/[.,;:]+$/, '');
}

/** Karşılaştırma için metni sadeleştirir: büyük/küçük harf, boşluk, satır sonu tireleri, tırnak biçimleri. */
export function normalizeForMatch(s: string): string {
  return s
    .replace(/-\s*\n\s*/g, '')
    .replace(/[‐-―­]/g, '-')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('tr')
    .trim();
}

/** Alıntı gerçekten dosyada geçiyor mu? Geçiyorsa hangi sayfada? (1 tabanlı, yoksa 0) */
export function locateQuote(pages: string[], quote: string): number {
  const q = normalizeForMatch(quote);
  if (q.length < 25) return 0;
  for (let i = 0; i < pages.length; i++) if (normalizeForMatch(pages[i]).includes(q)) return i + 1;
  // Sayfa sınırında bölünmüş alıntılar için bitişik iki sayfayı birlikte dene
  for (let i = 0; i < pages.length - 1; i++)
    if (normalizeForMatch(pages[i] + ' ' + pages[i + 1]).includes(q)) return i + 1;
  return 0;
}

/** Yapay zekâdan gelen kanıt adaylarından yalnızca alıntısı dosyada birebir bulunanları tutar. */
export function verifyEvidence(pages: string[], items: { claim?: unknown; quote?: unknown }[]): { kept: Evidence[]; dropped: number } {
  const kept: Evidence[] = [];
  let dropped = 0;
  for (const it of items) {
    const claim = typeof it.claim === 'string' ? it.claim.trim() : '';
    const quote = typeof it.quote === 'string' ? it.quote.trim() : '';
    const page = claim && quote ? locateQuote(pages, quote) : 0;
    if (page > 0) kept.push({ claim, quote, page });
    else dropped++;
  }
  return { kept, dropped };
}

const STOP = new Set(['ve', 'ile', 'bir', 'bu', 'için', 'the', 'and', 'of', 'in', 'to', 'a', 'on', 'for', 'with']);

/** Metin çok uzunsa konuyla en çok örtüşen sayfaları seçer (sayfa sırasını korur). */
export function selectPages(pages: string[], query: string, maxChars: number): { index: number; text: string }[] {
  const total = pages.reduce((n, p) => n + p.length, 0);
  const all = pages.map((text, index) => ({ index, text }));
  if (total <= maxChars) return all;
  const words = normalizeForMatch(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const scored = all.map((p) => {
    const t = normalizeForMatch(p.text);
    let score = 0;
    for (const w of words) if (t.includes(w)) score++;
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const chosen: typeof all = [];
  let used = 0;
  for (const p of scored) {
    if (used + p.text.length > maxChars) continue;
    chosen.push({ index: p.index, text: p.text });
    used += p.text.length;
  }
  return chosen.sort((a, b) => a.index - b.index);
}

type CrossrefMessage = {
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  type?: string;
  issued?: { 'date-parts'?: number[][] };
  DOI?: string;
  publisher?: string;
};

/** Crossref kaydından kaynak girdisi üretir. Kayıt gerçek olduğu için alanlar doğrulanmış sayılır. */
export function referenceFromCrossref(message: CrossrefMessage): Reference | null {
  const title = (message.title?.[0] ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const authors = (message.author ?? [])
    .map((a) => ({
      surname: (a.family ?? a.name ?? '').trim(),
      initials: (a.given ?? '')
        .split(/[\s-]+/)
        .map((p) => p.replace(/[^\p{L}]/gu, '').charAt(0))
        .join(''),
    }))
    .filter((a) => a.surname);
  const year = message.issued?.['date-parts']?.[0]?.[0];
  if (!title || authors.length === 0 || !year) return null;
  const t = message.type ?? '';
  const r = emptyRef(t.includes('book') ? 'book' : t === 'dissertation' ? 'thesis' : 'article');
  r.authors = authors;
  r.year = String(year);
  r.title = title;
  r.container = (message['container-title']?.[0] ?? message.publisher ?? '').trim();
  r.volume = message.volume ?? '';
  r.issue = message.issue ?? '';
  r.pages = (message.page ?? '').replace(/\s/g, '');
  r.doi = message.DOI ?? '';
  r.origin = 'upload';
  return r;
}

/** Yüklenen dosyaların sayfa metinleri yalnızca bu oturumda, bellekte tutulur (kaynak id'sine göre). */
export const docStore = new Map<string, string[]>();
