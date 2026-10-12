import { FORMAT_RULES, LIMITS, PROGRAMS } from '../data/programs.ts';
import type { ProjectState } from '../types.ts';
import { Card } from '../ui.tsx';

export default function Rules({ project }: { project: ProjectState }) {
  const prog = PROGRAMS[project.programId];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kurallar ve süreç</h2>
      <Card title="Biçim kuralları">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {FORMAT_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>
      <Card title="Sınırlar">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Proje adı en fazla {LIMITS.titleMaxWords} kelime</li>
          <li>
            Özet {LIMITS.abstractMin}–{LIMITS.abstractMax} kelime, kaynak içermez
          </li>
          <li>En fazla {LIMITS.keywordsMax} anahtar kelime</li>
          <li>En fazla {LIMITS.pageMax} sayfa</li>
        </ul>
      </Card>
      <Card title={`${prog.id} aşamaları`}>
        <ol className="space-y-2 text-sm text-slate-700">
          {prog.stages.map((s, i) => (
            <li key={s.title}>
              <b>
                {i + 1}. {s.title}
              </b>
              <div className="text-slate-600">{s.text}</div>
            </li>
          ))}
        </ol>
      </Card>
      {prog.applyNotes && (
        <Card title="Başvuru şartları">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {prog.applyNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Ödüller">
        <p className="text-sm text-slate-700">{prog.awards}</p>
      </Card>
      <Card title="Veri notu">
        <p className="text-sm text-slate-700">{prog.dataNote}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {prog.links.map((l) => (
            <li key={l.url}>
              <a className="text-indigo-700 underline" href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
