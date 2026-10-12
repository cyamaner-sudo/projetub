export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function countWords(s: string): number {
  return s
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

export function parseKeywords(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function splitParagraphs(s: string): string[] {
  return s
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export interface Citation {
  author: string;
  year: string;
  raw: string;
}

const YEAR = '(?:19|20)\\d{2}[a-z]?';

/** Metindeki APA tarzı atıfları bulur: (Yılmaz & Kaya, 2020; Demir vd., 2019) ve Yılmaz (2020). */
export function extractCitations(text: string): Citation[] {
  const out: Citation[] = [];

  const groupRe = new RegExp(`\\(([^()]*?${YEAR}[^()]*?)\\)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = groupRe.exec(text))) {
    for (const part of m[1].split(';')) {
      const cleaned = part.trim().replace(/^(?:bkz\.?|bk\.|ör\.?|örn\.?)\s*,?\s*/i, '');
      const mm = cleaned.match(new RegExp(`^(\\p{Lu}[^\\d]*?),?\\s*(${YEAR})`, 'u'));
      if (mm) {
        out.push({
          author: mm[1].replace(/[,\s]+$/, '').trim(),
          year: mm[2],
          raw: part.trim(),
        });
      }
    }
  }

  const narrRe = new RegExp(
    `(\\p{Lu}[\\p{L}'’\\-]+(?:\\s+(?:ve|&)\\s+\\p{Lu}[\\p{L}'’\\-]+|\\s+vd\\.|\\s+ve\\s+ark\\.|\\s+et\\s+al\\.)?)\\s*\\((${YEAR})\\)`,
    'gu',
  );
  while ((m = narrRe.exec(text))) {
    out.push({ author: m[1], year: m[2], raw: m[0] });
  }

  return out;
}

export function normKey(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function baseYear(y: string): string {
  return y.slice(0, 4);
}

export const MONTHS_TR = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

/** Çizelgenin i. (0 tabanlı) sütununun ay adı */
export function monthLabel(start: number, i: number): string {
  return MONTHS_TR[(((start - 1 + i) % 12) + 12) % 12];
}
