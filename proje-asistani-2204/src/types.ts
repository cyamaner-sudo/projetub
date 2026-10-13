export type ProgramId = '2204-A' | '2204-B' | '2204-C' | '2204-D';

export type TextSectionId =
  | 'title'
  | 'abstract'
  | 'keywords'
  | 'aim'
  | 'intro'
  | 'method'
  | 'findings'
  | 'discussion'
  | 'recommendations'
  | 'appendix';

export type StepId =
  | 'setup'
  | 'rules'
  | 'ideas'
  | 'sources'
  | 'aidecl'
  | TextSectionId
  | 'timeline'
  | 'refs'
  | 'ethics'
  | 'review'
  | 'preview';

export interface Program {
  id: ProgramId;
  name: string;
  audience: string;
  summary: string;
  mainAreas: string[];
  mainAreaLabel: string;
  /** A/B: tematik alan, C/D: alt alan */
  subAreaLabel: string;
  subAreaOptions: string[];
  subAreaHint: string;
  stages: { title: string; text: string }[];
  awards: string;
  /** Sınırlar bu programın kendi rehberinden doğrulandı mı? */
  limitsVerified: boolean;
  dataNote: string;
  /** Başvuru şartları ve süreç notları (varsa) */
  applyNotes?: string[];
  links: { label: string; url: string }[];
  /** Yapay zekâ koçuna verilen program bağlamı */
  focus: string;
}

/** Şablondaki "Yapay Zeka Araçları Kullanım Beyanı" alanları */
export interface AiDeclaration {
  tools: string;
  purpose: string;
  scope: string;
  human: string;
}

export interface Author {
  surname: string;
  initials: string;
}

export type RefType = 'article' | 'book' | 'web' | 'thesis';

export interface Reference {
  id: string;
  type: RefType;
  /** Kurum yazar için yalnızca soyad alanını kullanın (ör. "Milli Eğitim Bakanlığı") */
  authors: Author[];
  year: string;
  title: string;
  /** Dergi adı / yayınevi / web sitesi adı / üniversite */
  container: string;
  volume: string;
  issue: string;
  pages: string;
  edition: string;
  doi: string;
  url: string;
  accessDate: string;
  /** Web kaynağı için gün-ay (ör. "5 Mart") */
  dateDetail: string;
  /** Tez türü (ör. "Yüksek lisans tezi") */
  thesisType: string;
  /** Veritabanından gelen kaynaklarda: özet metni (yalnızca dayanak olarak kullanılır, rapora yazılmaz) */
  abstract?: string;
  /** Kaynağın nereden geldiği */
  origin?: 'openalex' | 'manual';
}

export interface TimelineRow {
  id: string;
  task: string;
  /** 1 tabanlı ay numarası */
  start: number;
  end: number;
}

export interface ProjectState {
  version: 1;
  programId: ProgramId;
  mainArea: string;
  subArea: string;
  texts: Record<TextSectionId, string>;
  timelineMonths: number;
  /** Çizelgenin ilk ayı (1=Ocak … 12=Aralık) */
  timelineStart: number;
  timeline: TimelineRow[];
  references: Reference[];
  ethics: Record<string, boolean>;
  updatedAt: number;
  /** Öğrencinin seçtiği proje fikri notu (iskelet için) */
  ideaNote?: string;
  /** Öğrencinin kendi verileri ve gözlemleri (bulgular taslağı için) */
  dataNote?: string;
  aiDecl: AiDeclaration;
}

export type IssueLevel = 'error' | 'warn' | 'info' | 'ok';

export interface Issue {
  id: string;
  level: IssueLevel;
  step: StepId;
  message: string;
}

export interface AiSettings {
  apiKey: string;
  model: string;
}
