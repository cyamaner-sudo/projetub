import { useState } from 'react';
import type { AiSettings, ProjectState } from '../types.ts';
import { PROGRAMS } from '../data/programs.ts';
import { askDraft } from '../lib/ai.ts';
import { setText, withAiUse } from '../lib/draftApply.ts';
import { hitToRef, searchSources, type SourceHit } from '../lib/sources.ts';
import { parseKeywords } from '../lib/text.ts';
import { btnGhost, btnPrimary, Card, Field, inputCls } from '../ui.tsx';

interface Props {
  project: ProjectState;
  update: (f: (p: ProjectState) => ProjectState) => void;
  ai: AiSettings;
  openSettings: () => void;
}

export default function SourceSearch({ project, update, ai, openSettings }: Props) {
  const defaultQuery = parseKeywords(project.texts.keywords).join(' ') || project.texts.title;
  const [query, setQuery] = useState(defaultQuery);
  const [lang, setLang] = useState<'' | 'tr' | 'en'>('');
  const [fromYear, setFromYear] = useState(2015);
  const [onlyArticles, setOnlyArticles] = useState(true);
  const [hits, setHits] = useState<SourceHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string>('');
  const [introBusy, setIntroBusy] = useState(false);
  const [introMsg, setIntroMsg] = useState('');

  const have = (h: SourceHit) =>
    project.references.some((r) => (h.doi && r.doi.toLowerCase() === h.doi.toLowerCase()) || (r.title === h.title && r.year === String(h.year)));

  const search = async () => {
    setBusy(true);
    setError('');
    try {
      setHits(await searchSources(query, { language: lang, fromYear, onlyArticles }));
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  };

  const add = (h: SourceHit) => update((p) => ({ ...p, references: [...p.references, hitToRef(h)] }));

  const withAbstract = project.references.filter((r) => (r.abstract ?? '').trim());

  const writeIntro = async () => {
    setIntroBusy(true);
    setIntroMsg('');
    try {
      const text = await askDraft(ai, PROGRAMS[project.programId], project, 'intro');
      update((p) => withAiUse(setText(p, 'intro', text), ai.model, ['intro']));
      setIntroMsg('Giriş taslağı yazıldı. Giriş adımında inceleyin; atıfların kaynakçayla eşleştiği otomatik kontrol edilir.');
    } catch (e) {
      setIntroMsg(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setIntroBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kaynak tarama</h2>
      <p className="rounded-lg bg-sky-50 p-3 text-xs text-sky-900">
        Kaynaklar yapay zekâdan gelmez. OpenAlex adlı açık bilimsel veri tabanında aranır; başlık, yazar, yıl, dergi ve DOI gerçek kayıttan alınır.
        Ancak veri tabanı her kaynağı içermez (özellikle Türkçe yayınların bir kısmı eksik olabilir). Tam metni siz okuyun, burada yalnızca özet görürsünüz.
      </p>

      <Card>
        <Field label="Arama (anahtar kelimeler; Türkçe ve İngilizce deneyin)">
          <input
            className={inputCls}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !busy && search()}
            placeholder="Örn. microplastic soil, mikroplastik toprak"
          />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <select className="rounded-lg border border-slate-300 px-2 py-2" value={lang} onChange={(e) => setLang(e.target.value as '' | 'tr' | 'en')}>
            <option value="">Tüm diller</option>
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </select>
          <label className="flex items-center gap-1">
            Başlangıç yılı
            <input type="number" className={`${inputCls} !w-24`} value={fromYear} min={1990} max={2030} onChange={(e) => setFromYear(Number(e.target.value) || 2015)} />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={onlyArticles} onChange={(e) => setOnlyArticles(e.target.checked)} />
            Yalnızca makale
          </label>
          <button className={btnPrimary} disabled={busy} onClick={search}>
            {busy ? 'Aranıyor…' : 'Ara'}
          </button>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      </Card>

      {searched && hits.length === 0 && !error && (
        <p className="text-sm text-slate-600">Sonuç bulunamadı. Farklı veya daha genel kelimeler, ya da İngilizce karşılıkları deneyin.</p>
      )}

      <ul className="space-y-3">
        {hits.map((h) => {
          const added = have(h);
          return (
            <li key={h.id || h.doi || h.title}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">{h.title}</div>
                    <div className="text-xs text-slate-600">
                      {h.authors.slice(0, 4).map((a) => `${a.surname}${a.initials ? ' ' + a.initials : ''}`).join(', ')}
                      {h.authors.length > 4 ? ' vd.' : ''} · {h.year} · {h.venue || 'Dergi bilgisi yok'} · {h.cited} atıf
                    </div>
                    {h.doi ? (
                      <a className="text-xs text-indigo-700 underline" href={`https://doi.org/${h.doi}`} target="_blank" rel="noreferrer">
                        doi.org/{h.doi}
                      </a>
                    ) : (
                      <span className="text-xs text-amber-700">DOI yok: kaynağı başka yerden doğrulayın</span>
                    )}
                  </div>
                  <button className={added ? btnGhost : btnPrimary} disabled={added} onClick={() => add(h)}>
                    {added ? 'Eklendi' : 'Kaynakçaya ekle'}
                  </button>
                </div>
                {h.abstract && (
                  <div className="mt-2">
                    <button className="text-xs text-indigo-700 underline" onClick={() => setOpen(open === h.id ? '' : h.id)}>
                      {open === h.id ? 'Özeti gizle' : 'Özeti göster'}
                    </button>
                    {open === h.id && <p className="mt-1 text-xs leading-relaxed text-slate-700">{h.abstract}</p>}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <Card title="Eklediğiniz kaynaklardan giriş taslağı">
        <p className="mb-2 text-xs text-slate-500">
          {withAbstract.length} kaynağın özeti var. Taslak yalnızca bu özetlere dayanır, her cümlede ilgili kaynağa atıf yapar ve listede olmayan kaynak kullanmaz.
          Özeti okumak, kaynağı okumak değildir: önemli iddiaları kaynağın kendisinden doğrulayın.
        </p>
        {!ai.apiKey.trim() ? (
          <button className="text-sm text-indigo-700 underline" onClick={openSettings}>Gemini API anahtarı ekleyin</button>
        ) : (
          <button className={btnPrimary} disabled={introBusy || withAbstract.length === 0} onClick={writeIntro}>
            {introBusy ? 'Yazılıyor…' : 'Giriş taslağını bu kaynaklardan yaz'}
          </button>
        )}
        {introMsg && <p className="mt-2 text-sm text-slate-700">{introMsg}</p>}
      </Card>
    </div>
  );
}
