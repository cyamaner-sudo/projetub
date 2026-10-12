import type { Issue, ProjectState } from '../types.ts';
import { monthLabel, uid, MONTHS_TR } from '../lib/text.ts';
import { btnGhost, btnPrimary, Card, inputCls } from '../ui.tsx';
import { Checks } from './SectionEditor.tsx';

interface Props {
  project: ProjectState;
  issues: Issue[];
  update: (f: (p: ProjectState) => ProjectState) => void;
}

export default function TimelineEditor({ project, issues, update }: Props) {
  const months = project.timelineMonths;
  const setRow = (id: string, patch: Partial<{ task: string; start: number; end: number }>) =>
    update((p) => ({ ...p, timeline: p.timeline.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const opts = Array.from({ length: months }, (_, i) => i + 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">İş-Zaman Çizelgesi</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>İlk ay:</span>
          <select
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
            value={project.timelineStart}
            onChange={(e) => update((p) => ({ ...p, timelineStart: Number(e.target.value) }))}
          >
            {MONTHS_TR.map((m, i) => (
              <option key={m} value={i + 1}>{m.charAt(0) + m.slice(1).toLocaleLowerCase('tr')}</option>
            ))}
          </select>
          <span>Toplam süre (ay):</span>
          <input
            type="number"
            min={1}
            max={12}
            className={`${inputCls} !w-20`}
            value={months}
            onChange={(e) => {
              const m = Math.min(12, Math.max(1, Number(e.target.value) || 1));
              update((p) => ({
                ...p,
                timelineMonths: m,
                timeline: p.timeline.map((r) => ({ ...r, start: Math.min(r.start, m), end: Math.min(r.end, m) })),
              }));
            }}
          />
        </div>

        <div className="space-y-2">
          {project.timeline.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
              <input
                className={`${inputCls} min-w-[12rem] flex-1`}
                placeholder="İş / faaliyet"
                value={r.task}
                onChange={(e) => setRow(r.id, { task: e.target.value })}
              />
              <select className="rounded-lg border border-slate-300 px-2 py-2 text-sm" value={r.start} onChange={(e) => setRow(r.id, { start: Number(e.target.value) })}>
                {opts.map((o) => <option key={o} value={o}>{monthLabel(project.timelineStart, o - 1)}</option>)}
              </select>
              <span className="text-slate-400">–</span>
              <select className="rounded-lg border border-slate-300 px-2 py-2 text-sm" value={r.end} onChange={(e) => setRow(r.id, { end: Number(e.target.value) })}>
                {opts.map((o) => <option key={o} value={o}>{monthLabel(project.timelineStart, o - 1)}</option>)}
              </select>
              <button className={btnGhost} onClick={() => update((p) => ({ ...p, timeline: p.timeline.filter((x) => x.id !== r.id) }))}>
                Sil
              </button>
            </div>
          ))}
        </div>
        <button className={btnPrimary} onClick={() => update((p) => ({ ...p, timeline: [...p.timeline, { id: uid(), task: '', start: 1, end: 1 }] }))}>
          + İş ekle
        </button>

        {project.timeline.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th rowSpan={2} className="w-1/3 text-left">İşin Adı</th>
                  <th colSpan={months}>AYLAR</th>
                </tr>
                <tr>
                  {opts.map((o) => <th key={o} className="text-[9px]">{monthLabel(project.timelineStart, o - 1)}</th>)}
                </tr>
              </thead>
              <tbody>
                {project.timeline.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1 pr-2">{r.task || '—'}</td>
                    {opts.map((o) => (
                      <td key={o} className={`border border-slate-200 ${o >= r.start && o <= r.end ? 'bg-slate-400' : ''}`}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <aside className="space-y-3">
        <Checks issues={issues} step="timeline" />
        <Card title="Rehber">
          <p className="text-sm text-slate-700">
            Yöntemde anlattığınız her aşamayı bir iş olarak ekleyin: kaynak tarama, veri toplama, analiz, rapor yazımı gibi. Gerçekçi süreler verin.
          </p>
        </Card>
      </aside>
    </div>
  );
}
