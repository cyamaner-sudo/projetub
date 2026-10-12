import { Fragment, useState } from 'react';
import type { AiSettings, ProjectState } from '../types.ts';
import { PROGRAMS } from '../data/programs.ts';
import { AI_MODES, askCoach, type AiMode } from '../lib/ai.ts';
import { IN_HOSTED_PAGE } from '../lib/storage.ts';
import { btnPrimary, Card } from '../ui.tsx';

function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Çok küçük bir markdown gösterici: madde işaretleri ve kalın metin. */
export function Md({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-slate-800">
      {lines.map((l, i) => {
        const t = l.trim();
        if (!t) return null;
        const m = t.match(/^[-*•]\s+(.*)$/) || t.match(/^\d+[.)]\s+(.*)$/);
        if (m) return <div key={i} className="flex gap-2"><span>•</span><span>{inline(m[1])}</span></div>;
        return <p key={i}>{inline(t.replace(/^#+\s*/, ''))}</p>;
      })}
    </div>
  );
}

interface Props {
  settings: AiSettings;
  project: ProjectState;
  sectionLabel: string;
  sectionText: string;
  openSettings: () => void;
}

export default function AiCoach({ settings, project, sectionLabel, sectionText, openSettings }: Props) {
  const [mode, setMode] = useState<AiMode>('jury');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    setAnswer('');
    try {
      setAnswer(
        await askCoach({ settings, mode, program: PROGRAMS[project.programId], project, sectionLabel, sectionText }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  };

  const hint = AI_MODES.find((m) => m.id === mode)?.hint;

  return (
    <Card title="YZ koçu (isteğe bağlı)">
      <p className="mb-2 text-xs text-slate-500">
        Koç metninizi yazmaz; geri bildirim, soru ve yönlendirme verir. Yanıtları mutlaka kendiniz doğrulayın.
      </p>
      {IN_HOSTED_PAGE ? (
        <p className="text-xs text-slate-600">Bu çevrimiçi sürümde YZ koçu kapalıdır (dış sunucuya bağlanılamaz). Yerelde çalıştırdığınızda Ayarlar'dan anahtar girerek kullanabilirsiniz.</p>
      ) : !settings.apiKey ? (
        <button className="text-sm text-indigo-700 underline" onClick={openSettings}>
          Kullanmak için Gemini API anahtarı ekleyin
        </button>
      ) : (
        <div className="space-y-2">
          <select
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as AiMode)}
          >
            {AI_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{hint}</p>
          <button className={`${btnPrimary} w-full`} disabled={busy} onClick={run}>
            {busy ? 'Düşünüyor…' : 'Koça sor'}
          </button>
          {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}
          {answer && (
            <div className="rounded-lg bg-slate-50 p-3">
              <Md text={answer} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
