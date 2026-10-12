import type { Issue, ProjectState, RefType, Reference } from '../types.ts';
import { emptyRef, formatRef, inTextCite, sortedRefs } from '../lib/apa.ts';
import { btnGhost, btnPrimary, Card, Field, inputCls } from '../ui.tsx';
import { Checks } from './SectionEditor.tsx';

interface Props {
  project: ProjectState;
  issues: Issue[];
  update: (f: (p: ProjectState) => ProjectState) => void;
}

const TYPE_LABEL: Record<RefType, string> = { article: 'Makale', book: 'Kitap', web: 'Web sayfası', thesis: 'Tez' };
const CONTAINER_LABEL: Record<RefType, string> = {
  article: 'Dergi adı',
  book: 'Yayınevi',
  web: 'Web sitesi / kurum adı',
  thesis: 'Üniversite',
};

export default function ReferenceManager({ project, issues, update }: Props) {
  const patch = (id: string, f: Partial<Reference>) =>
    update((p) => ({ ...p, references: p.references.map((r) => (r.id === id ? { ...r, ...f } : r)) }));
  const sorted = sortedRefs(project.references);
  const t = (r: Reference, k: keyof Reference, label: string, ph = '') => (
    <Field label={label}>
      <input className={inputCls} placeholder={ph} value={r[k] as string} onChange={(e) => patch(r.id, { [k]: e.target.value } as Partial<Reference>)} />
    </Field>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Kaynaklar (APA 7)</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABEL) as RefType[]).map((k) => (
            <button key={k} className={btnPrimary} onClick={() => update((p) => ({ ...p, references: [...p.references, emptyRef(k)] }))}>
              + {TYPE_LABEL[k]}
            </button>
          ))}
        </div>

        {sorted.map((r) => (
          <Card key={r.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{TYPE_LABEL[r.type]}</span>
              <button className={btnGhost} onClick={() => update((p) => ({ ...p, references: p.references.filter((x) => x.id !== r.id) }))}>
                Sil
              </button>
            </div>

            <div className="space-y-2">
              {r.authors.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                  <input
                    className={inputCls}
                    placeholder="Soyad (kurum için kurum adı)"
                    value={a.surname}
                    onChange={(e) => patch(r.id, { authors: r.authors.map((x, j) => (j === i ? { ...x, surname: e.target.value } : x)) })}
                  />
                  <input
                    className={inputCls}
                    placeholder="Ad baş harfi"
                    value={a.initials}
                    onChange={(e) => patch(r.id, { authors: r.authors.map((x, j) => (j === i ? { ...x, initials: e.target.value } : x)) })}
                  />
                  <button
                    className={btnGhost}
                    disabled={r.authors.length <= 1}
                    onClick={() => patch(r.id, { authors: r.authors.filter((_, j) => j !== i) })}
                  >
                    −
                  </button>
                </div>
              ))}
              <button className="text-xs text-indigo-700 underline" onClick={() => patch(r.id, { authors: [...r.authors, { surname: '', initials: '' }] })}>
                + yazar ekle
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {t(r, 'year', 'Yıl', '2020')}
              {t(r, 'title', 'Başlık')}
              {t(r, 'container', CONTAINER_LABEL[r.type])}
              {r.type === 'article' && (
                <>
                  {t(r, 'volume', 'Cilt')}
                  {t(r, 'issue', 'Sayı')}
                  {t(r, 'pages', 'Sayfalar', '12-25')}
                  {t(r, 'doi', 'DOI')}
                </>
              )}
              {r.type === 'book' && (
                <>
                  {t(r, 'edition', 'Baskı', '2. baskı')}
                  {t(r, 'doi', 'DOI veya URL')}
                </>
              )}
              {r.type === 'web' && (
                <>
                  {t(r, 'dateDetail', 'Gün ve ay', '5 Mart')}
                  {t(r, 'accessDate', 'Erişim tarihi', '10 Ekim 2026')}
                  {t(r, 'url', 'URL')}
                </>
              )}
              {r.type === 'thesis' && (
                <>
                  {t(r, 'thesisType', 'Tez türü')}
                  {t(r, 'url', 'URL')}
                </>
              )}
            </div>

            <p className="mt-3 rounded-lg bg-slate-50 p-2 text-sm text-slate-800" style={{ fontFamily: 'Times New Roman, serif' }}>
              {formatRef(r).map((s, i) => (s.i ? <em key={i}>{s.t}</em> : <span key={i}>{s.t}</span>))}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Metin içi: {inTextCite(r)} &nbsp;·&nbsp; {inTextCite(r, true)}
            </p>
          </Card>
        ))}
        {sorted.length === 0 && <p className="text-sm text-slate-500">Henüz kaynak eklenmedi. Yalnızca gerçekten okuduğunuz kaynakları ekleyin.</p>}
      </div>
      <aside className="space-y-3">
        <Checks issues={issues} step="refs" />
        <Card title="Rehber">
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Kaynaklar yazar soyadına göre otomatik sıralanır.</li>
            <li>Metindeki her atıf kaynakçada, kaynakçadaki her kaynak metinde olmalı.</li>
            <li>Kaynak bilgilerini kaynağın kendisinden kontrol edin; yapay zekâdan kaynak istemeyin.</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
