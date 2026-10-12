import type { Issue, StepId } from '../types.ts';
import { ALL_STEPS } from '../data/sections.ts';
import { estimatePages } from '../lib/validate.ts';
import type { ProjectState } from '../types.ts';
import { LIMITS } from '../data/programs.ts';
import { Card, levelIcon, levelStyle } from '../ui.tsx';

interface Props {
  issues: Issue[];
  project: ProjectState;
  go: (s: StepId) => void;
}

export default function ReviewStep({ issues, project, go }: Props) {
  const problems = issues.filter((i) => i.level !== 'ok');
  const label = (s: StepId) => ALL_STEPS.find((x) => x.id === s)?.label ?? s;
  const pages = estimatePages(project);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Genel kontrol</h2>
      <Card>
        <p className="text-sm">
          Tahmini uzunluk: <b>{pages.toFixed(1)}</b> / {LIMITS.pageMax} sayfa. Bu yalnızca kelime sayısına dayalı bir tahmindir; tablo ve şekiller yer kaplar.
        </p>
        <p className="mt-1 text-sm">
          Açık madde: <b>{problems.length}</b>
        </p>
      </Card>
      {problems.length === 0 ? (
        <Card><p className="text-sm text-emerald-800">Otomatik kontrollerde açık madde yok. Yine de metni danışmanınızla gözden geçirin.</p></Card>
      ) : (
        <ul className="space-y-2">
          {problems.map((i) => (
            <li key={i.id}>
              <button onClick={() => go(i.step)} className={`flex w-full gap-2 rounded-lg border px-3 py-2 text-left text-sm ${levelStyle[i.level]}`}>
                <b>{levelIcon[i.level]}</b>
                <span className="flex-1">{i.message}</span>
                <span className="text-xs underline">{label(i.step)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
