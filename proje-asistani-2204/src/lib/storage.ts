import type { AiSettings, ProgramId, ProjectState, TextSectionId } from '../types.ts';

const PROJECT_KEY = 'p2204.project.v1';
const AI_KEY = 'p2204.ai.v1';

export const DEFAULT_MODEL = 'gemini-flash-latest';

const EMPTY_TEXTS: Record<TextSectionId, string> = {
  title: '',
  abstract: '',
  keywords: '',
  aim: '',
  intro: '',
  method: '',
  findings: '',
  discussion: '',
  recommendations: '',
  appendix: '',
};

export function emptyProject(programId: ProgramId = '2204-A'): ProjectState {
  return {
    version: 1,
    programId,
    mainArea: '',
    subArea: '',
    texts: { ...EMPTY_TEXTS },
    timelineMonths: 6,
    timelineStart: new Date().getMonth() + 1,
    aiDecl: { tools: '', purpose: '', scope: '', human: '' },
    timeline: [],
    references: [],
    ethics: {},
    updatedAt: Date.now(),
  };
}

/** Bilinmeyen bir nesneyi geçerli proje durumuna dönüştürür; eksik alanları varsayılanla doldurur. */
export function normalizeProject(raw: unknown): ProjectState {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz proje dosyası.');
  const r = raw as Partial<ProjectState>;
  const ids: ProgramId[] = ['2204-A', '2204-B', '2204-C', '2204-D'];
  if (!r.programId || !ids.includes(r.programId)) throw new Error('Dosyada geçerli bir program bilgisi yok.');
  const base = emptyProject(r.programId);
  return {
    ...base,
    ...r,
    version: 1,
    texts: { ...EMPTY_TEXTS, ...(r.texts ?? {}) },
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
    references: Array.isArray(r.references) ? r.references : [],
    ethics: r.ethics && typeof r.ethics === 'object' ? r.ethics : {},
    timelineMonths: Math.min(12, Math.max(1, Number(r.timelineMonths) || 6)),
    mainArea: typeof r.mainArea === 'string' ? r.mainArea : '',
    subArea: typeof r.subArea === 'string' ? r.subArea : '',
    ideaNote: typeof r.ideaNote === 'string' ? r.ideaNote : '',
    dataNote: typeof r.dataNote === 'string' ? r.dataNote : '',
    aiDecl: { ...base.aiDecl, ...(r.aiDecl && typeof r.aiDecl === 'object' ? r.aiDecl : {}) },
    timelineStart: Math.min(12, Math.max(1, Number(r.timelineStart) || base.timelineStart)),
    updatedAt: Date.now(),
  };
}

export function loadProject(): ProjectState {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) return normalizeProject(JSON.parse(raw));
  } catch {
    /* bozuk kayıt: boş projeyle başla */
  }
  return emptyProject();
}

export function saveProject(p: ProjectState): void {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(p));
  } catch {
    /* depolama dolu veya kapalı */
  }
}

export function loadAi(): AiSettings {
  try {
    const raw = localStorage.getItem(AI_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<AiSettings>;
      return { apiKey: o.apiKey ?? '', model: o.model || DEFAULT_MODEL };
    }
  } catch {
    /* yoksay */
  }
  return { apiKey: '', model: DEFAULT_MODEL };
}

export function saveAi(s: AiSettings): void {
  try {
    localStorage.setItem(AI_KEY, JSON.stringify(s));
  } catch {
    /* yoksay */
  }
}

type ClaudeHost = { use?: (name: string) => Promise<unknown> };
const host = (): ClaudeHost | undefined => (globalThis as { claude?: ClaudeHost }).claude;

/** Yayımlanmış sayfa (artifact) içinde mi çalışıyoruz? Orada doğrudan indirme ve yazdırma çalışmaz. */
export const IN_HOSTED_PAGE = typeof host()?.use === 'function';

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (IN_HOSTED_PAGE) {
    const d = (await host()!.use!('downloads')) as { save(r: { filename: string; data: Blob }): Promise<unknown> } | null;
    if (d) {
      try {
        await d.save({ filename, data: blob });
      } catch {
        /* kullanıcı reddetti */
      }
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson(p: ProjectState): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `2204-proje-yedek-${new Date().toISOString().slice(0, 10)}.json`);
}
