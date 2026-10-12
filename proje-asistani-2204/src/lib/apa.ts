import type { Author, Reference } from '../types.ts';
import { normKey, uid } from './text.ts';

export interface Seg {
  t: string;
  i?: boolean;
}

export function emptyRef(type: Reference['type'] = 'article'): Reference {
  return {
    id: uid(),
    type,
    authors: [{ surname: '', initials: '' }],
    year: '',
    title: '',
    container: '',
    volume: '',
    issue: '',
    pages: '',
    edition: '',
    doi: '',
    url: '',
    accessDate: '',
    dateDetail: '',
    thesisType: 'Yüksek lisans tezi',
  };
}

function normInitials(s: string): string {
  const letters = s.match(/\p{L}/gu);
  if (!letters) return '';
  return letters.map((l) => l.toLocaleUpperCase('tr')).join('. ') + '.';
}

function realAuthors(a: Author[]): Author[] {
  return a.filter((x) => x.surname.trim());
}

function authorName(a: Author): string {
  const s = a.surname.trim();
  const ini = normInitials(a.initials);
  return ini ? `${s}, ${ini}` : s;
}

export function authorsText(authors: Author[]): string {
  const names = realAuthors(authors).map(authorName);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(', ')}, & ${last}`;
}

function doiUrl(doi: string): string {
  const d = doi.trim();
  if (!d) return '';
  return /^https?:\/\//i.test(d) ? d : `https://doi.org/${d.replace(/^doi:\s*/i, '')}`;
}

function endWithPeriod(s: string): string {
  return /[.!?]$/.test(s) ? s : s + '.';
}

/** APA 7 (Türkçe) kaynakça girdisini biçimli parçalar hâlinde üretir. */
export function formatRef(r: Reference): Seg[] {
  const segs: Seg[] = [];
  const push = (t: string, i = false) => {
    if (t) segs.push({ t, i });
  };

  const au = authorsText(r.authors);
  const hasAuthor = au.length > 0;
  const year = r.year.trim() || 's.t.';
  const dateText = r.type === 'web' && r.dateDetail.trim() ? `${year}, ${r.dateDetail.trim()}` : year;
  const title = r.title.trim();
  const container = r.container.trim();
  const link = doiUrl(r.doi) || r.url.trim();

  // Yazar varsa "Yazar. (Yıl). ", yoksa başlık yazarın yerine geçer ve tarih başlıktan sonra gelir.
  const head = (titleItalic: boolean, titleSuffix = '') => {
    if (hasAuthor) {
      push(endWithPeriod(au) + ' ');
      push(`(${dateText}). `);
      push(title, titleItalic);
      push(titleSuffix);
      push('. ');
    } else {
      push(title, titleItalic);
      push(titleSuffix);
      push('. ');
      push(`(${dateText}). `);
    }
  };

  switch (r.type) {
    case 'article': {
      head(false);
      push(container, true);
      if (r.volume.trim()) {
        push(', ');
        push(r.volume.trim(), true);
      }
      if (r.issue.trim()) push(`(${r.issue.trim()})`);
      if (r.pages.trim()) push(`, ${r.pages.trim().replace(/-/g, '–')}`);
      push('.');
      if (link) push(' ' + link);
      break;
    }
    case 'book': {
      head(true, r.edition.trim() ? ` (${r.edition.trim()})` : '');
      if (container) push(endWithPeriod(container));
      if (link) push(' ' + link);
      break;
    }
    case 'web': {
      head(true);
      if (container) push(endWithPeriod(container) + ' ');
      if (r.accessDate.trim()) push(`Erişim tarihi: ${r.accessDate.trim()}, `);
      push(r.url.trim());
      break;
    }
    case 'thesis': {
      const kind = r.thesisType.trim() || 'Tez';
      head(true, ` [${kind}${container ? ', ' + container : ''}]`);
      push(r.url.trim());
      break;
    }
  }

  const out = segs.filter((s) => s.t.length > 0);
  const last = out[out.length - 1];
  if (last) last.t = last.t.replace(/\s+$/, '').replace(/,$/, '');
  return out;
}

export function refToPlain(r: Reference): string {
  return formatRef(r)
    .map((s) => s.t)
    .join('')
    .trim();
}

/** Metin içi atıf: (Yılmaz & Kaya, 2020) veya anlatımsal: Yılmaz ve Kaya (2020) */
export function inTextCite(r: Reference, narrative = false): string {
  const a = realAuthors(r.authors);
  const year = r.year.trim() || 's.t.';
  let who: string;
  if (a.length === 0) {
    who = r.title.trim().split(/\s+/).slice(0, 3).join(' ');
  } else if (a.length === 1) {
    who = a[0].surname.trim();
  } else if (a.length === 2) {
    who = `${a[0].surname.trim()} ${narrative ? 've' : '&'} ${a[1].surname.trim()}`;
  } else {
    who = `${a[0].surname.trim()} vd.`;
  }
  return narrative ? `${who} (${year})` : `(${who}, ${year})`;
}

export function refSortKey(r: Reference): string {
  const a = authorsText(r.authors) || r.title.trim();
  return normKey(a) + ' ' + r.year;
}

export function sortedRefs(refs: Reference[]): Reference[] {
  return [...refs].sort((x, y) => refSortKey(x).localeCompare(refSortKey(y), 'tr'));
}

/** Atıf eşleştirmesi için ilk yazar (veya başlık) anahtarı */
export function refMatchKey(r: Reference): string {
  const a = realAuthors(r.authors);
  if (a.length > 0) return normKey(a[0].surname);
  return normKey(r.title.trim().split(/\s+/).slice(0, 3).join(' '));
}

export function isRefComplete(r: Reference): boolean {
  const hasWho = realAuthors(r.authors).length > 0;
  return Boolean(r.year.trim() && r.title.trim() && (hasWho || r.type === 'web'));
}
