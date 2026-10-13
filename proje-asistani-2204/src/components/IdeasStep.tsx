import { useState } from 'react';
import type { AiSettings, ProjectState } from '../types.ts';
import { PROGRAMS } from '../data/programs.ts';
import { askIdeas, askSkeleton, askDraft, askTimelineDraft, askSearchQueries, DRAFT_LABEL, DRAFT_ORDER, type DraftId } from '../lib/ai.ts';
import { setText, withAiUse } from '../lib/draftApply.ts';
import { uid } from '../lib/text.ts';
import { hitToRef, searchSources, type SourceHit } from '../lib/sources.ts';
import { TEXT_SECTION_IDS } from '../data/sections.ts';
import { btnPrimary, Card, Field, inputCls } from '../ui.tsx';
import { Md } from './AiCoach.tsx';

interface Props {
  project: ProjectState;
  update: (f: (p: ProjectState) => ProjectState) => void;
  ai: AiSettings;
  openSettings: () => void;
}

export default function IdeasStep({ project, update, ai, openSettings }: Props) {
  const prog = PROGRAMS[project.programId];
  const [interests, setInterests] = useState('');
  const [ideas, setIdeas] = useState('');
  const [skeleton, setSkeleton] = useState('');
  const [busy, setBusy] = useState<'' | 'ideas' | 'skeleton'>('');
  const [error, setError] = useState('');

  const run = async (kind: 'ideas' | 'skeleton') => {
    setBusy(kind);
    setError('');
    try {
      if (kind === 'ideas') setIdeas(await askIdeas(ai, prog, project, interests));
      else setSkeleton(await askSkeleton(ai, prog, project, project.ideaNote ?? ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setBusy('');
    }
  };

  const [overwrite, setOverwrite] = useState(false);
  const [progress, setProgress] = useState('');
  const [allBusy, setAllBusy] = useState(false);
  void TEXT_SECTION_IDS;

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const withRetry = async <T,>(fn: () => Promise<T>, label: string): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Error && e.message.includes('sınırına')) {
        for (let s = 25; s > 0; s--) {
          setProgress(`${label}: istek sınırı, ${s} sn bekleniyor…`);
          await wait(1000);
        }
        return await fn();
      }
      throw e;
    }
  };

  const writeAll = async (start: ProjectState) => {
    setAllBusy(true);
    setError('');
    let cur: ProjectState = start;
    const done: (DraftId | 'timeline')[] = [];
    try {
      const jobs: (DraftId | 'timeline')[] = [...DRAFT_ORDER];
      jobs.splice(DRAFT_ORDER.indexOf('method') + 1, 0, 'timeline');
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        const label = j === 'timeline' ? 'İş-Zaman Çizelgesi' : DRAFT_LABEL[j];
        setProgress(`${i + 1}/${jobs.length} ${label} yazılıyor…`);
        if (j === 'timeline') {
          if (cur.timeline.length > 0 && !overwrite) continue;
          const rows = await withRetry(() => askTimelineDraft(ai, prog, cur), label);
          cur = { ...cur, timeline: rows.map((r) => ({ id: uid(), ...r })) };
        } else {
          if (cur.texts[j].trim() && !overwrite) continue;
          const text = await withRetry(() => askDraft(ai, prog, cur, j), label);
          cur = setText(cur, j, text);
        }
        done.push(j);
        const snap = cur;
        update(() => snap);
        await wait(800);
      }
      if (done.length) {
        const snap = withAiUse(cur, ai.model, done);
        update(() => snap);
      }
      setProgress(done.length ? `Tamamlandı: ${done.length} bölüm taslağı hazır. Yer tutucuları doldurun ve metni kendi cümlelerinizle düzenleyin.` : 'Yazılacak boş bölüm yoktu.');
    } catch (e) {
      const snap = done.length ? withAiUse(cur, ai.model, done) : cur;
      if (done.length) update(() => snap);
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
      setProgress(done.length ? `${done.length} bölüm yazıldı, sonra hata oluştu.` : '');
    } finally {
      setAllBusy(false);
    }
  };

  const [scanFirst, setScanFirst] = useState(true);
  const [cands, setCands] = useState<SourceHit[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [usedQueries, setUsedQueries] = useState<string[]>([]);
  const keyOf = (h: SourceHit) => h.doi || h.id || h.title;

  const startAll = async () => {
    const sourced = project.references.filter((r) => (r.abstract ?? '').trim()).length;
    if (!scanFirst || sourced >= 4) {
      await writeAll(project);
      return;
    }
    setAllBusy(true);
    setError('');
    setCands(null);
    try {
      setProgress('Arama kelimeleri hazırlanıyor…');
      const queries = await askSearchQueries(ai, prog, project);
      if (queries.length === 0) throw new Error('Arama için fikir notu veya anahtar kelime gerekli. Önce fikrinizi yazın.');
      setUsedQueries(queries);
      const lists: SourceHit[][] = [];
      for (let i = 0; i < queries.length; i++) {
        setProgress(`Kaynaklar taranıyor (${i + 1}/${queries.length}): ${queries[i]}`);
        try {
          lists.push(await searchSources(queries[i], { fromYear: 2012, onlyArticles: true }));
        } catch (e) {
          if (i === 0 && queries.length === 1) throw e;
        }
      }
      const seen = new Set<string>();
      const merged: SourceHit[] = [];
      for (let rank = 0; rank < 10; rank++)
        for (const l of lists) {
          const h = l[rank];
          if (!h) continue;
          const k = keyOf(h).toLowerCase();
          const dup = seen.has(k) || project.references.some((r) => r.doi && h.doi && r.doi.toLowerCase() === h.doi.toLowerCase());
          if (dup) continue;
          seen.add(k);
          merged.push(h);
        }
      const top = merged.slice(0, 18);
      if (top.length === 0) throw new Error('Kaynak bulunamadı. "Kaynak tarama" adımında kendi kelimelerinizle arayın veya kaynaksız devam edin.');
      setCands(top);
      setPicked(new Set());
      setProgress(`${top.length} aday kaynak bulundu. İlgili olanları seçin.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
      setProgress('');
    } finally {
      setAllBusy(false);
    }
  };

  const continueWithPicked = async () => {
    const chosen = (cands ?? []).filter((h) => picked.has(keyOf(h)));
    const withRefs: ProjectState = { ...project, references: [...project.references, ...chosen.map(hitToRef)] };
    update(() => withRefs);
    setCands(null);
    await writeAll(withRefs);
  };

  const noKey = !ai.apiKey.trim();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fikir ve taslak</h2>
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        Öneriler ilham ve başlangıç içindir. 2204 kurallarına göre projenin fikri ve metinleri öğrenciye ait olmalıdır. Fikri kendinize göre değiştirin,
        rapor metnini kendi cümlelerinizle yazın. Asistan sonuç, veri veya kaynak üretmez; bulgular ve kaynakçayı çalışmayı yaptıktan sonra siz doldurursunuz.
      </p>

      {noKey && (
        <Card>
          <p className="text-sm text-slate-700">
            Bu özellik Gemini API anahtarı ister.{' '}
            <button className="text-indigo-700 underline" onClick={openSettings}>Ayarlar'dan ekleyin.</button>
          </p>
        </Card>
      )}

      <Card title="1. Proje fikirleri">
        <p className="mb-2 text-xs text-slate-500">
          Seçtiğiniz alan: <b>{project.mainArea || 'seçilmedi'}</b> / <b>{project.subArea || 'belirtilmedi'}</b>. Önce "Program ve alan" adımında alanı seçin.
        </p>
        <Field label="İlgi alanlarınız ve imkânlarınız (isteğe bağlı)">
          <textarea className={inputCls} rows={3} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Örn. okulda laboratuvar var, sensör kullanmayı seviyorum, evimizde balkon bahçesi var" />
        </Field>
        <button className={`${btnPrimary} mt-2`} disabled={!!busy || noKey} onClick={() => run('ideas')}>
          {busy === 'ideas' ? 'Fikirler hazırlanıyor…' : 'Proje fikirleri öner'}
        </button>
        {ideas && <div className="mt-3 rounded-lg bg-slate-50 p-3"><Md text={ideas} /></div>}
      </Card>

      <Card title="2. Seçtiğiniz fikir">
        <Field label="Beğendiğiniz fikri kendi cümlelerinizle yazın veya yukarıdan kopyalayıp değiştirin">
          <textarea
            className={inputCls}
            rows={5}
            value={project.ideaNote ?? ''}
            onChange={(e) => update((p) => ({ ...p, ideaNote: e.target.value }))}
            placeholder="Başlık, araştırma sorusu, kısaca ne yapacağınız"
          />
        </Field>
        <button className={`${btnPrimary} mt-2`} disabled={!!busy || noKey} onClick={() => run('skeleton')}>
          {busy === 'skeleton' ? 'İskelet hazırlanıyor…' : 'Rapor iskeleti hazırla'}
        </button>
        {skeleton && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <Md text={skeleton} />
            <p className="mt-2 text-xs text-slate-500">
              Bu iskeleti bölüm adımlarında yol gösterici olarak kullanın. Metni kendiniz yazın.
            </p>
          </div>
        )}
      </Card>

      <Card title="3. Tüm bölümler için tek tıkla taslak">
        <p className="mb-2 text-xs text-slate-500">
          Yukarıdaki fikir notunuzdan başlık, amaç, giriş, yöntem, çizelge, bulgular, tartışma, öneriler, özet ve anahtar kelimeler için taslak yazılır.
          Yapay zekâ veri, sonuç veya kaynak uydurmaz; bilmediği yerlere [DOLDUR: ...] koyar. Bu yer tutucular doldurulmadan Genel kontrol bölümü hata verir.
        </p>
        <Field label="Verileriniz ve gözlemleriniz (varsa). Bulgular ve tartışma yalnızca buna dayanır.">
          <textarea
            className={inputCls}
            rows={4}
            value={project.dataNote ?? ''}
            onChange={(e) => update((p) => ({ ...p, dataNote: e.target.value }))}
            placeholder="Örn. 1. grupta ortalama ... , 2. grupta ... ölçtüm. Bulduğum gerçek sayılar ve gözlemler. Boşsa bulgular bölümü yer tutucu olarak kalır."
          />
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={scanFirst} onChange={(e) => setScanFirst(e.target.checked)} />
          Önce kaynakları tara, seçtiklerime dayanarak yaz (önerilir)
        </label>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
          Dolu bölümlerin üzerine de yaz
        </label>
        <button className={`${btnPrimary} mt-2`} disabled={allBusy || noKey} onClick={startAll}>
          {allBusy ? 'Çalışıyor…' : 'Tüm bölümleri tek tıkla oluştur'}
        </button>
        {progress && <p className="mt-2 text-sm text-slate-700">{progress}</p>}
        {cands && (
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-600">
              Aranan sorgular: {usedQueries.join(' · ')}. Konunuzla gerçekten ilgili olanları işaretleyin (başlığa değil özete bakın). Hiçbiri uygun değilse kaynaksız devam edebilirsiniz; Giriş yer tutuculu kalır.
            </p>
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {cands.map((h) => {
                const k = keyOf(h);
                return (
                  <li key={k}>
                    <label className="flex cursor-pointer gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={picked.has(k)}
                        onChange={(e) =>
                          setPicked((p) => {
                            const n = new Set(p);
                            if (e.target.checked) n.add(k);
                            else n.delete(k);
                            return n;
                          })
                        }
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{h.title}</span>
                        <span className="block text-xs text-slate-600">
                          {h.authors.slice(0, 3).map((a) => a.surname).join(', ')}
                          {h.authors.length > 3 ? ' vd.' : ''} · {h.year} · {h.venue || 'dergi bilgisi yok'} · {h.cited} atıf
                        </span>
                        <span className="block text-xs text-slate-500">{h.abstract.slice(0, 220)}…</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button className={btnPrimary} disabled={allBusy || picked.size === 0} onClick={continueWithPicked}>
                Seçilen {picked.size} kaynakla yazmaya başla
              </button>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={allBusy}
                onClick={() => {
                  setCands(null);
                  void writeAll(project);
                }}
              >
                Kaynaksız devam et
              </button>
              <button className="px-3 py-2 text-sm underline" onClick={() => { setCands(null); setProgress(''); }}>
                İptal
              </button>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Beyan: Yapay zekâ kullanımı "YZ Kullanım Beyanı" adımına otomatik yazılır. İnsan müdahalesi kısmını siz doldurun. Kaynaklar adımındaki kaynakları kendiniz bulup ekleyin.
        </p>
      </Card>

      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
