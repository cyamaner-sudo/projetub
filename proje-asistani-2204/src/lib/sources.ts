import type { Reference } from '../types.ts';
import { emptyRef } from './apa.ts';

/** Gerçek bilimsel veri tabanından (OpenAlex, Crossref) gelen kayıtlar. Hiçbir alanı yapay zekâ üretmez. */
export interface SourceHit {
  id: string;
  doi: string;
  title: string;
  year: number | null;
  authors: { surname: string; initials: string }[];
  venue: string;
  volume: string;
  issue: string;
  pages: string;
  abstract: string;
  cited: number;
  lang: string;
  type: string;
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** OpenAlex "abstract_inverted_index" (kelime -> konumlar) yapısından düz metin kurar. */
export function rebuildAbstract(inv: Record<string, number[]> | null | undefined): string {
  if (!inv || typeof inv !== 'object') return '';
  const words: string[] = [];
  for (const [w, positions] of Object.entries(inv)) {
    if (!Array.isArray(positions)) continue;
    for (const p of positions) words[p] = w;
  }
  return stripTags(words.filter((w) => w !== undefined).join(' '));
}

export function splitName(display: string): { surname: string; initials: string } {
  const parts = display.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (parts.length === 0) return { surname: '', initials: '' };
  if (parts.length === 1) return { surname: parts[0], initials: '' };
  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p.replace(/[^\p{L}]/gu, '').charAt(0))
    .join('');
  return { surname, initials };
}

const cleanDoi = (d: string | null | undefined) => (d ? d.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : '');

type OAWork = {
  id?: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: { source?: { display_name?: string } | null } | null;
  biblio?: { volume?: string | null; issue?: string | null; first_page?: string | null; last_page?: string | null };
  abstract_inverted_index?: Record<string, number[]> | null;
  cited_by_count?: number;
  language?: string | null;
  type?: string | null;
};

export function parseOpenAlex(json: unknown): SourceHit[] {
  const results = (json as { results?: OAWork[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: SourceHit[] = [];
  for (const w of results) {
    const title = stripTags(w.title || w.display_name || '');
    const authors = (w.authorships ?? [])
      .map((a) => splitName(a.author?.display_name ?? ''))
      .filter((a) => a.surname);
    if (!title || authors.length === 0 || !w.publication_year) continue;
    const b = w.biblio ?? {};
    const first = b.first_page ?? '';
    const last = b.last_page ?? '';
    out.push({
      id: w.id ?? '',
      doi: cleanDoi(w.doi),
      title,
      year: w.publication_year,
      authors,
      venue: stripTags(w.primary_location?.source?.display_name ?? ''),
      volume: b.volume ?? '',
      issue: b.issue ?? '',
      pages: first && last && first !== last ? `${first}-${last}` : first,
      abstract: rebuildAbstract(w.abstract_inverted_index),
      cited: w.cited_by_count ?? 0,
      lang: w.language ?? '',
      type: w.type ?? '',
    });
  }
  return out;
}

export interface SearchOptions {
  language?: 'tr' | 'en' | '';
  fromYear?: number;
  onlyArticles?: boolean;
}

export async function searchSources(query: string, opts: SearchOptions = {}): Promise<SourceHit[]> {
  const q = query.trim();
  if (q.length < 3) throw new Error('Arama için en az 3 karakter yazın.');
  const filters = ['has_abstract:true'];
  if (opts.language) filters.push(`language:${opts.language}`);
  if (opts.fromYear) filters.push(`publication_year:>${opts.fromYear - 1}`);
  if (opts.onlyArticles) filters.push('type:article');
  const select =
    'id,doi,title,display_name,publication_year,authorships,primary_location,biblio,abstract_inverted_index,cited_by_count,language,type';
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=${filters.join(',')}&per-page=15&select=${select}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Veri tabanına ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  }
  if (!res.ok) throw new Error(`Veri tabanı hata verdi (HTTP ${res.status}). Biraz sonra tekrar deneyin.`);
  return parseOpenAlex(await res.json());
}

/** Bir veri tabanı kaydını kaynakça girdisine çevirir. */
export function hitToRef(h: SourceHit): Reference {
  const r = emptyRef(h.type === 'book' ? 'book' : h.type === 'dissertation' ? 'thesis' : 'article');
  r.authors = h.authors.slice(0, 20).map((a) => ({ surname: a.surname, initials: a.initials }));
  r.year = h.year ? String(h.year) : '';
  r.title = h.title;
  r.container = h.venue;
  r.volume = h.volume;
  r.issue = h.issue;
  r.pages = h.pages;
  r.doi = h.doi;
  r.abstract = h.abstract;
  r.origin = 'openalex';
  return r;
}

const tokens = (s: string) =>
  new Set(
    s
      .toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );

export function titleSimilarity(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

export interface VerifyResult {
  status: 'ok' | 'mismatch' | 'notfound' | 'error';
  message: string;
}

/** DOI'yi Crossref kaydıyla karşılaştırır: var mı, başlık ve yıl tutuyor mu? */
export async function verifyDoi(ref: Reference): Promise<VerifyResult> {
  const doi = cleanDoi(ref.doi);
  if (!doi) return { status: 'error', message: 'DOI yok.' };
  let res: Response;
  try {
    res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  } catch {
    return { status: 'error', message: 'Crossref\'e ulaşılamadı.' };
  }
  if (res.status === 404) return { status: 'notfound', message: 'Bu DOI kayıtlı değil. Kaynağı kontrol edin.' };
  if (!res.ok) return { status: 'error', message: `Crossref hata verdi (HTTP ${res.status}).` };
  const m = ((await res.json().catch(() => null)) as { message?: { title?: string[]; issued?: { 'date-parts'?: number[][] } } } | null)?.message;
  const title = m?.title?.[0] ?? '';
  const year = m?.issued?.['date-parts']?.[0]?.[0];
  if (title && titleSimilarity(title, ref.title) < 0.6)
    return { status: 'mismatch', message: `Başlık eşleşmiyor. Kayıtlı başlık: "${stripTags(title)}"` };
  if (year && ref.year && String(year) !== ref.year.trim())
    return { status: 'mismatch', message: `Yıl eşleşmiyor. Kayıtlı yıl: ${year}` };
  return { status: 'ok', message: 'DOI kayıtla uyumlu.' };
}
