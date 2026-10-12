import { useState } from 'react';
import type { Program, ProjectState } from '../types.ts';
import { monthLabel } from '../lib/text.ts';
import { buildReport } from '../lib/report.ts';
import { exportDocx } from '../lib/export.ts';
import { exportJson, IN_HOSTED_PAGE } from '../lib/storage.ts';
import { btnGhost, btnPrimary } from '../ui.tsx';

interface Props {
  project: ProjectState;
  program: Program;
  onImport: (file: File) => void;
}

export default function Preview({ project, program, onImport }: Props) {
  const blocks = buildReport(project, program);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-semibold">Önizleme ve çıktı</h2>
        <button
          className={btnPrimary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await exportDocx(project, program); } finally { setBusy(false); }
          }}
        >
          Word (.docx) indir
        </button>
        {!IN_HOSTED_PAGE && <button className={btnGhost} onClick={() => window.print()}>PDF / Yazdır</button>}
        <button className={btnGhost} onClick={() => exportJson(project)}>Yedek (JSON)</button>
        <label className={`${btnGhost} cursor-pointer`}>
          Yedek yükle
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
        </label>
      </div>
      <p className="no-print text-xs text-slate-500">
        Önizleme yaklaşık görünümdür. Sayfa sayısını Word dosyasında kontrol edin. {IN_HOSTED_PAGE ? 'PDF için Word dosyasını PDF olarak kaydedin.' : 'PDF için yazdır penceresinde "PDF olarak kaydet"i seçin.'}
      </p>
      <div className="paper">
        {blocks.map((b, i) => {
          switch (b.kind) {
            case 'meta': return <p key={i}><b>{b.label}:</b> {b.value}</p>;
            case 'heading': return <h2 key={i}>{b.text}</h2>;
            case 'para': return <p key={i}>{b.text}</p>;
            case 'field': return <p key={i}><b>{b.label}:</b> {b.text}</p>;
            case 'keywords': return <p key={i}><b>{b.label}:</b> <em>{b.text}</em></p>;
            case 'empty': return <p key={i} className="empty no-print">{b.text}</p>;
            case 'ref': return <p key={i} className="ref">{b.segs.map((s, j) => (s.i ? <em key={j}>{s.t}</em> : <span key={j}>{s.t}</span>))}</p>;
            case 'timeline': {
              const m = Array.from({ length: b.months }, (_, k) => k + 1);
              return (
                <table key={i}>
                  <thead><tr><th rowSpan={2} style={{ width: '30%' }}>İşin Adı</th><th colSpan={b.months}>AYLAR</th></tr><tr>{m.map((x) => <th key={x} style={{ fontSize: '7pt' }}>{monthLabel(b.start, x - 1)}</th>)}</tr></thead>
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.id}><td>{r.task}</td>{m.map((x) => <td key={x} className={x >= r.start && x <= r.end ? 'on' : ''} />)}</tr>
                    ))}
                  </tbody>
                </table>
              );
            }
          }
        })}
      </div>
    </div>
  );
}
