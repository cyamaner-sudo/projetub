import type { ProgramId, ProjectState } from '../types.ts';
import { PROGRAM_LIST, PROGRAMS } from '../data/programs.ts';
import { Card, Field, inputCls } from '../ui.tsx';

interface Props {
  project: ProjectState;
  update: (f: (p: ProjectState) => ProjectState) => void;
}

export default function Setup({ project, update }: Props) {
  const prog = PROGRAMS[project.programId];
  const setProgram = (id: ProgramId) =>
    update((p) => ({ ...p, programId: id, mainArea: '', subArea: '' }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Program ve alan</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PROGRAM_LIST.map((pr) => (
          <button
            key={pr.id}
            onClick={() => setProgram(pr.id)}
            className={`rounded-xl border p-4 text-left transition ${
              pr.id === project.programId
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-semibold">{pr.id}</div>
            <div className="text-sm text-slate-700">{pr.name}</div>
            <div className="mt-1 text-xs text-slate-500">{pr.audience}</div>
          </button>
        ))}
      </div>

      <Card>
        <p className="text-sm text-slate-700">{prog.summary}</p>
        {!prog.limitsVerified && (
          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
            Bu program için sayısal sınırlar (kelime, sayfa) 2204-A/B rehberlerinden alındı ve henüz bu programın kendi
            rehberiyle doğrulanmadı. Başvurmadan önce güncel rehberi kontrol edin.
          </p>
        )}
      </Card>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={prog.mainAreaLabel}>
            <select
              className={inputCls}
              value={project.mainArea}
              onChange={(e) => update((p) => ({ ...p, mainArea: e.target.value }))}
            >
              <option value="">Seçin…</option>
              {prog.mainAreas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label={prog.subAreaLabel}>
            {prog.subAreaOptions.length > 0 ? (
              <select
                className={inputCls}
                value={project.subArea}
                onChange={(e) => update((p) => ({ ...p, subArea: e.target.value }))}
              >
                <option value="">Seçin…</option>
                {prog.subAreaOptions.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            ) : (
              <input
                className={inputCls}
                value={project.subArea}
                onChange={(e) => update((p) => ({ ...p, subArea: e.target.value }))}
                placeholder="Alt alanı yazın"
              />
            )}
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">{prog.subAreaHint}</p>
      </Card>
    </div>
  );
}
