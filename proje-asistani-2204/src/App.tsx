import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectState, StepId, TextSectionId } from './types.ts';
import { PROGRAMS } from './data/programs.ts';
import { ALL_STEPS, STEP_GROUPS, TEXT_SECTION_IDS } from './data/sections.ts';
import { stepStatus, validateProject, type StepStatus } from './lib/validate.ts';
import { DEFAULT_MODEL, loadAi, loadProject, normalizeProject, saveAi, saveProject } from './lib/storage.ts';
import { btnGhost, btnPrimary, inputCls } from './ui.tsx';
import Setup from './components/Setup.tsx';
import AiDeclStep from './components/AiDeclStep.tsx';
import SourceSearch from './components/SourceSearch.tsx';
import IdeasStep from './components/IdeasStep.tsx';
import Rules from './components/Rules.tsx';
import SectionEditor from './components/SectionEditor.tsx';
import TimelineEditor from './components/TimelineEditor.tsx';
import ReferenceManager from './components/ReferenceManager.tsx';
import EthicsStep from './components/EthicsStep.tsx';
import ReviewStep from './components/ReviewStep.tsx';
import Preview from './components/Preview.tsx';

const DOT: Record<StepStatus, string> = {
  empty: 'bg-slate-300',
  ok: 'bg-emerald-500',
  info: 'bg-sky-400',
  warn: 'bg-amber-400',
  error: 'bg-red-500',
};

export default function App() {
  const [project, setProject] = useState<ProjectState>(loadProject);
  const [ai, setAi] = useState(loadAi);
  const [step, setStep] = useState<StepId>('setup');
  const [showSettings, setShowSettings] = useState(false);
  const [draftAi, setDraftAi] = useState(ai);
  const [notice, setNotice] = useState('');

  const update = (f: (p: ProjectState) => ProjectState) => setProject((p) => ({ ...f(p), updatedAt: Date.now() }));

  // Otomatik kayıt (400 ms gecikmeli)
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveProject(project), 400);
    return () => window.clearTimeout(timer.current);
  }, [project]);

  const prog = PROGRAMS[project.programId];
  const issues = useMemo(() => validateProject(project, prog), [project, prog]);

  const importFile = async (file: File) => {
    try {
      const p = normalizeProject(JSON.parse(await file.text()));
      if (!window.confirm('Mevcut proje bu yedekle değiştirilecek. Devam edilsin mi?')) return;
      setProject(p);
      setNotice('Yedek yüklendi.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Dosya okunamadı.');
    }
    window.setTimeout(() => setNotice(''), 4000);
  };

  const idx = ALL_STEPS.findIndex((s) => s.id === step);
  const go = (s: StepId) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  let body;
  if (step === 'setup') body = <Setup project={project} update={update} />;
  else if (step === 'rules') body = <Rules project={project} />;
  else if (step === 'ideas')
    body = <IdeasStep project={project} update={update} ai={ai} openSettings={() => { setDraftAi(ai); setShowSettings(true); }} />;
  else if (step === 'aidecl') body = <AiDeclStep project={project} issues={issues} update={update} />;
  else if (step === 'sources')
    body = <SourceSearch project={project} update={update} ai={ai} openSettings={() => { setDraftAi(ai); setShowSettings(true); }} />;
  else if (step === 'timeline') body = <TimelineEditor project={project} issues={issues} update={update} />;
  else if (step === 'refs') body = <ReferenceManager project={project} issues={issues} update={update} />;
  else if (step === 'ethics') body = <EthicsStep project={project} update={update} />;
  else if (step === 'review') body = <ReviewStep issues={issues} project={project} go={go} />;
  else if (step === 'preview') body = <Preview project={project} program={prog} onImport={importFile} />;
  else if ((TEXT_SECTION_IDS as string[]).includes(step))
    body = (
      <SectionEditor
        key={step}
        id={step as TextSectionId}
        project={project}
        issues={issues}
        update={update}
        ai={ai}
        openSettings={() => { setDraftAi(ai); setShowSettings(true); }}
      />
    );

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <h1 className="text-base font-semibold">2204 Proje Asistanı</h1>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{prog.id}</span>
          <span className="ml-auto text-xs text-slate-500">{notice || 'Otomatik kaydedilir'}</span>
          <button className={btnGhost} onClick={() => { setDraftAi(ai); setShowSettings(true); }}>Ayarlar</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="no-print">
          <select className={`${inputCls} md:hidden`} value={step} onChange={(e) => go(e.target.value as StepId)}>
            {ALL_STEPS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="hidden space-y-4 md:block">
            {STEP_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.title}</div>
                {g.steps.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => go(s.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                      s.id === step ? 'bg-indigo-50 font-medium text-indigo-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${DOT[stepStatus(issues, s.id)]}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0">
          {body}
          <div className="no-print mt-6 flex justify-between">
            <button className={btnGhost} disabled={idx <= 0} onClick={() => go(ALL_STEPS[idx - 1].id)}>← Önceki</button>
            <button className={btnPrimary} disabled={idx >= ALL_STEPS.length - 1} onClick={() => go(ALL_STEPS[idx + 1].id)}>Sonraki →</button>
          </div>
        </main>
      </div>

      {showSettings && (
        <div className="no-print fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Ayarlar</h3>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Gemini API anahtarı</span>
              <input className={inputCls} type="password" autoComplete="off" value={draftAi.apiKey} onChange={(e) => setDraftAi({ ...draftAi, apiKey: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Model</span>
              <input className={inputCls} value={draftAi.model} placeholder={DEFAULT_MODEL} onChange={(e) => setDraftAi({ ...draftAi, model: e.target.value })} />
            </label>
            <p className="text-xs text-slate-500">
              Anahtar yalnızca bu tarayıcıda saklanır ve sadece Google'a gönderilir. Ortak bilgisayarlarda işiniz bitince silin. Anahtarı Google AI Studio'dan ücretsiz alabilirsiniz.
            </p>
            <div className="flex justify-between">
              <button className={btnGhost} onClick={() => { const e = { apiKey: '', model: DEFAULT_MODEL }; setAi(e); saveAi(e); setDraftAi(e); }}>Anahtarı sil</button>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setShowSettings(false)}>Kapat</button>
                <button className={btnPrimary} onClick={() => { const v = { apiKey: draftAi.apiKey.trim(), model: draftAi.model.trim() || DEFAULT_MODEL }; setAi(v); saveAi(v); setShowSettings(false); }}>Kaydet</button>
              </div>
            </div>
            <hr />
            <button className="text-xs text-red-700 underline" onClick={() => { if (window.confirm('Tüm proje içeriği silinecek. Emin misiniz?')) { setProject(normalizeProject({ programId: project.programId })); setShowSettings(false); } }}>
              Projeyi sıfırla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
