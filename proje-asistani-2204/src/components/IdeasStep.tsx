import { useState } from 'react';
import type { AiSettings, ProjectState } from '../types.ts';
import { PROGRAMS } from '../data/programs.ts';
import { askIdeas, askSkeleton, askDraft, askTimelineDraft, DRAFT_LABEL, DRAFT_ORDER, type DraftId } from '../lib/ai.ts';
import { setText, withAiUse } from '../lib/draftApply.ts';
import { uid } from '../lib/text.ts';
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

  const generateAll = async () => {
    setAllBusy(true);
    setError('');
    let cur: ProjectState = project;
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
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
          Dolu bölümlerin üzerine de yaz
        </label>
        <button className={`${btnPrimary} mt-2`} disabled={allBusy || noKey} onClick={generateAll}>
          {allBusy ? 'Yazılıyor…' : 'Tüm bölümleri tek tıkla oluştur'}
        </button>
        {progress && <p className="mt-2 text-sm text-slate-700">{progress}</p>}
        <p className="mt-2 text-xs text-slate-500">
          Beyan: Yapay zekâ kullanımı "YZ Kullanım Beyanı" adımına otomatik yazılır. İnsan müdahalesi kısmını siz doldurun. Kaynaklar adımındaki kaynakları kendiniz bulup ekleyin.
        </p>
      </Card>

      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
