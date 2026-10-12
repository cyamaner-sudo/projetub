import type { ProjectState } from '../types.ts';
import { ETHICS_ITEMS } from '../data/sections.ts';
import { Card } from '../ui.tsx';

export default function EthicsStep({ project, update }: { project: ProjectState; update: (f: (p: ProjectState) => ProjectState) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Etik ve kurallar</h2>
      <p className="text-sm text-slate-600">"Koşullu" işaretli maddeler yalnızca ilgili çalışma türünde gereklidir.</p>
      {ETHICS_ITEMS.map((g) => (
        <Card key={g.title} title={g.title}>
          <ul className="space-y-2">
            {g.items.map((i) => (
              <li key={i.id}>
                <label className="flex cursor-pointer gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!project.ethics[i.id]}
                    onChange={(e) => update((p) => ({ ...p, ethics: { ...p.ethics, [i.id]: e.target.checked } }))}
                  />
                  <span>
                    {i.text}
                    {i.conditional && <em className="ml-1 text-xs text-slate-500">(koşullu)</em>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
