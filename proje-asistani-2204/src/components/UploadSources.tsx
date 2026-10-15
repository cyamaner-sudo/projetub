import { useRef, useState } from 'react';
import type { AiSettings, ProjectState, Reference } from '../types.ts';
import { PROGRAMS } from '../data/programs.ts';
import { askEvidence } from '../lib/ai.ts';
import { emptyRef } from '../lib/apa.ts';
import { docStore, findDoi, referenceFromCrossref } from '../lib/docs.ts';
import { extractFile } from '../lib/pdf.ts';
import { btnGhost, btnPrimary, Card } from '../ui.tsx';

interface Props {
  project: ProjectState;
  update: (f: (p: ProjectState) => ProjectState) => void;
  ai: AiSettings;
  openSettings: () => void;
}

async function crossrefFor(doi: string): Promise<Reference | null> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { message?: Parameters<typeof referenceFromCrossref>[0] };
    return json.message ? referenceFromCrossref(json.message) : null;
  } catch {
    return null;
  }
}

export default function UploadSources({ project, update, ai, openSettings }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const uploaded = project.references.filter((r) => r.origin === 'upload');

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      setStatus(`${file.name} okunuyor…`);
      try {
        const doc = await extractFile(file);
        const doi = findDoi(doc.pages.slice(0, 3).join('\n'));
        let ref: Reference | null = null;
        let how = '';
        if (doi) {
          setStatus(`${file.name}: DOI bulundu, Crossref kaydı alınıyor…`);
          ref = await crossrefFor(doi);
          how = ref ? 'Künye Crossref kaydından alındı (doğrulanmış).' : 'DOI bulundu ama kayıt alınamadı.';
        } else how = 'Dosyada DOI bulunamadı.';
        if (!ref) {
          ref = emptyRef('article');
          ref.origin = 'upload';
          ref.title = '';
          how += ' Künye bilgilerini (yazar, yıl, başlık, dergi) kaynağın kapağından elle girin.';
          const hint = [doc.metaTitle && `PDF başlığı: ${doc.metaTitle}`, doc.metaAuthor && `PDF yazar: ${doc.metaAuthor}`].filter(Boolean).join(' · ');
          if (hint) how += ` (İpucu, doğrulanmadı: ${hint})`;
        }
        const withId = ref;
        docStore.set(withId.id, doc.pages);
        update((p) => ({ ...p, references: [...p.references, withId] }));
        setNotes((n) => ({ ...n, [withId.id]: `${file.name} · ${doc.pages.length} sayfa. ${how}` }));
      } catch (e) {
        setStatus(`${file.name}: ${e instanceof Error ? e.message : 'okunamadı'}`);
        continue;
      }
      setStatus('');
    }
    if (input.current) input.current.value = '';
  };

  const extract = async (r: Reference) => {
    const pages = docStore.get(r.id);
    if (!pages) {
      setNotes((n) => ({ ...n, [r.id]: 'Dosya metni bu oturumda bellekte yok. Dosyayı yeniden yükleyin.' }));
      return;
    }
    setBusyId(r.id);
    try {
      const { kept, dropped } = await askEvidence(ai, PROGRAMS[project.programId], project, r, pages);
      update((p) => ({ ...p, references: p.references.map((x) => (x.id === r.id ? { ...x, evidence: kept } : x)) }));
      setNotes((n) => ({
        ...n,
        [r.id]: `${kept.length} bilgi alıntısıyla birlikte doğrulandı${dropped ? `, ${dropped} madde dosyada birebir bulunamadığı için atıldı` : ''}.`,
      }));
    } catch (e) {
      setNotes((n) => ({ ...n, [r.id]: e instanceof Error ? e.message : 'Bilinmeyen hata' }));
    } finally {
      setBusyId('');
    }
  };

  const dropEvidence = (r: Reference, i: number) =>
    update((p) => ({
      ...p,
      references: p.references.map((x) => (x.id === r.id ? { ...x, evidence: (x.evidence ?? []).filter((_, j) => j !== i) } : x)),
    }));

  return (
    <Card title="Bilgisayarımdan makale veya tez yükle">
      <p className="mb-2 text-xs text-slate-500">
        İndirdiğiniz PDF'leri seçin. Dosya yalnızca tarayıcınızda okunur, hiçbir yere yüklenmez. Künye bilgisi DOI üzerinden Crossref'ten alınır; yoksa siz girersiniz.
        Yapay zekâ yalnızca dosyadan, alıntısı metinde birebir bulunabilen bilgileri çıkarır.
      </p>
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.txt,application/pdf,text/plain"
        className="hidden"
        id="source-files"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button className={btnPrimary} onClick={() => input.current?.click()}>
        Dosya seç (PDF veya TXT)
      </button>
      {status && <p className="mt-2 text-sm text-slate-700">{status}</p>}

      <ul className="mt-3 space-y-3">
        {uploaded.map((r) => (
          <li key={r.id} className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-medium">{r.title || 'Künye girilmedi'}</div>
            <div className="text-xs text-slate-600">
              {r.authors.filter((a) => a.surname).map((a) => a.surname).join(', ') || 'Yazar yok'} · {r.year || 'yıl yok'} {r.container ? `· ${r.container}` : ''}
            </div>
            {notes[r.id] && <p className="mt-1 text-xs text-slate-600">{notes[r.id]}</p>}
            {!r.title && <p className="mt-1 text-xs text-amber-700">Kaynaklar adımında bu girdinin künyesini doldurun, sonra bilgi çıkarın.</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {!ai.apiKey.trim() ? (
                <button className="text-xs text-indigo-700 underline" onClick={openSettings}>Gemini anahtarı ekleyin</button>
              ) : (
                <button className={btnGhost} disabled={busyId === r.id || !r.title} onClick={() => void extract(r)}>
                  {busyId === r.id ? 'Okunuyor…' : (r.evidence?.length ?? 0) > 0 ? 'Bilgileri yeniden çıkar' : 'Kaynaktan bilgi çıkar'}
                </button>
              )}
            </div>
            {(r.evidence?.length ?? 0) > 0 && (
              <ul className="mt-2 space-y-2">
                {r.evidence!.map((e, i) => (
                  <li key={i} className="rounded bg-slate-50 p-2 text-xs">
                    <div className="font-medium text-slate-800">{e.claim} <span className="font-normal text-slate-500">(s. {e.page})</span></div>
                    <div className="mt-0.5 italic text-slate-600">"{e.quote}"</div>
                    <button className="mt-1 text-red-700 underline" onClick={() => dropEvidence(r, i)}>Bu maddeyi çıkar</button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {uploaded.length === 0 && <li className="text-xs text-slate-500">Henüz dosya yüklenmedi.</li>}
      </ul>
    </Card>
  );
}
