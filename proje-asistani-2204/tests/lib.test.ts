import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, extractCitations, parseKeywords } from '../src/lib/text.ts';
import { emptyRef, formatRef, inTextCite, refToPlain, sortedRefs } from '../src/lib/apa.ts';
import { validateProject, estimatePages, stepStatus } from '../src/lib/validate.ts';
import { buildReport } from '../src/lib/report.ts';
import { emptyProject, normalizeProject } from '../src/lib/storage.ts';
import { PROGRAMS } from '../src/data/programs.ts';
import { buildDocxBlob } from '../src/lib/export.ts';

test('countWords ve anahtar kelimeler', () => {
  assert.equal(countWords('Bir iki  üç, dört.'), 4);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('- — –'), 0);
  assert.deepEqual(parseKeywords('iklim; kutup, buz\n'), ['iklim', 'kutup', 'buz']);
});

test('atıf ayıklama', () => {
  const c = extractCitations(
    'Buzullar eriyor (Yılmaz & Kaya, 2020; Demir vd., 2019a). Ayrıca Şahin (2021) ve Öz ve Ak (2018) bunu gösterdi. (Şekil 3) ve 2020 yılında. (T.C. Milli Eğitim Bakanlığı, 2018)',
  );
  const k = c.map((x) => `${x.author}|${x.year}`);
  assert.ok(k.includes('Yılmaz & Kaya|2020'), k.join(' / '));
  assert.ok(k.includes('Demir vd.|2019a'));
  assert.ok(k.includes('Şahin|2021'));
  assert.ok(k.some((x) => x.startsWith('Öz ve Ak') && x.endsWith('2018')));
  assert.ok(k.some((x) => x.includes('Milli Eğitim Bakanlığı|2018')));
  assert.equal(c.filter((x) => x.author.startsWith('Şekil')).length, 0);
});

test('APA biçimi', () => {
  const a = emptyRef('article');
  a.authors = [
    { surname: 'Yılmaz', initials: 'a b' },
    { surname: 'Kaya', initials: 'c' },
  ];
  a.year = '2020';
  a.title = 'Kutup buzullarında değişim';
  a.container = 'Kutup Bilimleri Dergisi';
  a.volume = '12';
  a.issue = '3';
  a.pages = '45-67';
  a.doi = '10.1234/kbd.2020.1';
  assert.equal(
    refToPlain(a),
    'Yılmaz, A. B., & Kaya, C. (2020). Kutup buzullarında değişim. Kutup Bilimleri Dergisi, 12(3), 45–67. https://doi.org/10.1234/kbd.2020.1',
  );
  const segs = formatRef(a);
  assert.ok(segs.some((s) => s.i && s.t === 'Kutup Bilimleri Dergisi'));
  assert.equal(inTextCite(a), '(Yılmaz & Kaya, 2020)');
  assert.equal(inTextCite(a, true), 'Yılmaz ve Kaya (2020)');

  const b = emptyRef('book');
  b.authors = [{ surname: 'Demir', initials: 'E' }];
  b.year = '2019';
  b.title = 'İklim bilimine giriş';
  b.edition = '2. bs.';
  b.container = 'Bilim Yayınları';
  assert.equal(refToPlain(b), 'Demir, E. (2019). İklim bilimine giriş (2. bs.). Bilim Yayınları.');

  const w = emptyRef('web');
  w.authors = [{ surname: 'Milli Eğitim Bakanlığı', initials: '' }];
  w.year = '2023';
  w.dateDetail = '5 Mart';
  w.title = 'Sıfır atık yönetmeliği';
  w.container = 'MEB';
  w.url = 'https://example.org/x';
  w.accessDate = '12.10.2026';
  assert.equal(
    refToPlain(w),
    'Milli Eğitim Bakanlığı. (2023, 5 Mart). Sıfır atık yönetmeliği. MEB. Erişim tarihi: 12.10.2026, https://example.org/x',
  );

  const t = emptyRef('thesis');
  t.authors = [{ surname: 'Şahin', initials: 'Z' }];
  t.year = '2021';
  t.title = 'Deniz buzu modelleri';
  t.container = 'Ege Üniversitesi';
  assert.equal(refToPlain(t), 'Şahin, Z. (2021). Deniz buzu modelleri [Yüksek lisans tezi, Ege Üniversitesi].');

  const noAuthor = emptyRef('web');
  noAuthor.authors = [{ surname: '', initials: '' }];
  noAuthor.year = '2024';
  noAuthor.title = 'Kutup araştırmaları';
  noAuthor.container = 'TÜBİTAK';
  assert.equal(refToPlain(noAuthor), 'Kutup araştırmaları. (2024). TÜBİTAK.');

  const sorted = sortedRefs([b, a, t]).map((r) => r.authors[0].surname);
  assert.deepEqual(sorted, ['Demir', 'Şahin', 'Yılmaz']);
});

function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `kelime${i}`).join(' ');
}

test('doğrulama kuralları', () => {
  const prog = PROGRAMS['2204-A'];
  const p = emptyProject('2204-A');
  p.mainArea = 'Fizik';
  p.subArea = 'Yenilenebilir Enerji';
  p.texts.title = words(16);
  p.texts.abstract = words(260) + ' (Yılmaz, 2020)';
  p.texts.keywords = 'a, b, c, d, e, f';
  p.texts.intro = words(100) + ' Yılmaz (2020) ve Kaya (2019) buldu. (Demir, 2018)';
  p.references = [];
  let issues = validateProject(p, prog);
  const ids = issues.map((i) => i.id);
  assert.ok(ids.includes('title-long'));
  assert.ok(ids.includes('abs-long'));
  assert.ok(ids.includes('abs-cite'));
  assert.ok(ids.includes('kw-many'));
  assert.ok(ids.includes('ref-none'));
  assert.equal(stepStatus(issues, 'title'), 'error');
  assert.equal(stepStatus(issues, 'setup'), 'ok');

  // Kaynakçayla eşleşme
  const y = emptyRef('article');
  y.authors = [{ surname: 'Yılmaz', initials: 'A' }];
  y.year = '2020';
  y.title = 'Başlık';
  y.container = 'Dergi';
  const k = emptyRef('book');
  k.authors = [{ surname: 'Kaya', initials: 'B' }];
  k.year = '2019';
  k.title = 'Kitap';
  k.container = 'Yayın';
  p.references = [y, k];
  issues = validateProject(p, prog);
  const missing = issues.filter((i) => i.id.startsWith('cite-missing'));
  assert.equal(missing.length, 1);
  assert.match(missing[0].message, /Demir/);

  p.texts.title = 'Kısa başlık';
  p.texts.abstract = words(200);
  p.texts.keywords = 'a, b';
  const d = emptyRef('web');
  d.authors = [{ surname: 'Demir', initials: '' }];
  d.year = '2018';
  d.title = 'Sayfa';
  d.container = 'Site';
  p.references.push(d);
  issues = validateProject(p, prog);
  assert.equal(issues.filter((i) => i.id.startsWith('cite-missing')).length, 0);
  assert.ok(issues.some((i) => i.id === 'ref-ok'));
  assert.ok(issues.some((i) => i.id === 'abs-ok'));
});

test('sayfa tahmini ve zaman çizelgesi', () => {
  const p = emptyProject('2204-B');
  p.texts.intro = words(11000);
  assert.ok(estimatePages(p) > 20);
  const issues = validateProject(p, PROGRAMS['2204-B']);
  assert.ok(issues.some((i) => i.id === 'pages-over'));
  p.timeline = [{ id: 'x', task: 'Deney', start: 3, end: 2 }];
  assert.ok(validateProject(p, PROGRAMS['2204-B']).some((i) => i.id === 'tl-bad'));
});

test('rapor modeli', () => {
  const p = emptyProject('2204-D');
  p.mainArea = 'Hava ve İklim';
  p.subArea = 'Sera gazları';
  p.texts.title = 'Bir başlık';
  p.texts.abstract = 'Birinci paragraf.\n\nİkinci paragraf.';
  p.texts.keywords = 'iklim, sera';
  p.timeline = [{ id: '1', task: 'Veri toplama', start: 1, end: 2 }];
  const blocks = buildReport(p, PROGRAMS['2204-D']);
  const metas = blocks.filter((b) => b.kind === 'meta').map((b) => (b as { label: string }).label);
  assert.deepEqual(metas, ['Proje Ana Alanı', 'Proje Alt Alanı', 'Proje Adı (Başlığı)']);
  assert.equal(blocks.filter((b) => b.kind === 'para').length, 2);
  assert.ok(blocks.some((b) => b.kind === 'timeline'));
  assert.ok(!blocks.some((b) => b.kind === 'heading' && (b as { text: string }).text === 'Ekler'));
});

test('depolama normalizasyonu', () => {
  assert.throws(() => normalizeProject({}));
  const p = normalizeProject({ programId: '2204-C', texts: { title: 'x' }, timelineMonths: 99 });
  assert.equal(p.texts.title, 'x');
  assert.equal(p.texts.abstract, '');
  assert.equal(p.timelineMonths, 12);
});

test('Word dosyası üretimi', async () => {
  const p = emptyProject('2204-A');
  p.mainArea = 'Fizik';
  p.subArea = 'Yenilenebilir Enerji';
  p.texts.title = 'Deneme başlığı';
  p.texts.abstract = 'Özet metni.';
  p.timeline = [{ id: '1', task: 'Deney', start: 1, end: 3 }];
  const r = emptyRef('book');
  r.authors = [{ surname: 'Demir', initials: 'E' }];
  r.year = '2019';
  r.title = 'Kitap';
  r.container = 'Yayın';
  p.references = [r];
  const blob = await buildDocxBlob(p, PROGRAMS['2204-A']);
  const buf = new Uint8Array(await blob.arrayBuffer());
  assert.equal(String.fromCharCode(buf[0], buf[1]), 'PK');
  assert.ok(buf.length > 3000);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(new URL('../dist-test-sample.docx', import.meta.url), buf);
});

test('2026-2027 şablon yapısı', async () => {
  const { buildReport } = await import('../src/lib/report.ts');
  const { monthLabel } = await import('../src/lib/text.ts');
  const { withAiUse } = await import('../src/lib/draftApply.ts');
  const { validateProject } = await import('../src/lib/validate.ts');
  const { PROGRAMS } = await import('../src/data/programs.ts');
  let p = emptyProject('2204-A');
  p.timelineStart = 11;
  p.timeline = [{ id: 'a', task: 'Literatür Taraması', start: 1, end: 3 }];
  p.texts.aim = 'Amaç metni.';
  assert.equal(monthLabel(11, 0), 'KASIM');
  assert.equal(monthLabel(11, 2), 'OCAK');
  let heads = buildReport(p, PROGRAMS['2204-A']).filter((b) => b.kind === 'heading').map((b) => (b as { text: string }).text);
  assert.ok(heads.includes('Amaç') && heads.includes('Kaynaklar'));
  assert.ok(!heads.includes('Yapay Zeka Araçları Kullanım Beyanı'));
  p = withAiUse(p, 'gemini-flash-latest', ['aim']);
  heads = buildReport(p, PROGRAMS['2204-A']).filter((b) => b.kind === 'heading').map((b) => (b as { text: string }).text);
  assert.equal(heads[0], 'Yapay Zeka Araçları Kullanım Beyanı');
  p.texts.intro = 'Bilinenler [DOLDUR: kaynak] burada.';
  const issues = validateProject(p, PROGRAMS['2204-A']);
  assert.ok(issues.some((i) => i.id === 'placeholders' && i.level === 'error'));
  assert.ok(issues.some((i) => i.id === 'aidecl-ok'));
  const blob = await buildDocxBlob(p, PROGRAMS['2204-A']);
  assert.ok(blob.size > 3000);
});
