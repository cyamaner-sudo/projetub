import type { AiSettings, Program, ProjectState } from '../types.ts';
import { LIMITS } from '../data/programs.ts';
import { inTextCite } from './apa.ts';

export type AiMode = 'jury' | 'questions' | 'clarity' | 'shape' | 'search';

export const AI_MODES: { id: AiMode; label: string; hint: string }[] = [
  { id: 'jury', label: 'Jüri gözüyle eleştir', hint: 'Güçlü ve zayıf yönleri, düzeltme önerileriyle verir.' },
  { id: 'questions', label: 'Yönlendirici sorular', hint: 'Bölümü geliştirmeniz için düşündürücü sorular sorar.' },
  { id: 'clarity', label: 'Dil ve anlatım', hint: 'Akademik üslup ve belirsiz ifadeleri işaret eder.' },
  { id: 'shape', label: 'Araştırma sorusunu netleştir', hint: 'Konu fikrini sınanabilir bir soruya doğru daraltmanıza yardım eder.' },
  { id: 'search', label: 'Kaynak tarama stratejisi', hint: 'Arama kelimeleri ve bakılacak veri tabanları önerir. Kaynak uydurmaz.' },
];

const SYSTEM = `Sen, TÜBİTAK 2204 Araştırma Projeleri Yarışmalarına hazırlanan öğrencilere yardım eden bir proje mentorusun. Türkçe yaz.

Temel ilkelerin:
- Projenin fikri ve metni öğrencilere ait olmalı. Rapor bölümünü öğrencinin yerine YAZMA, hazır paragraf, özet veya sonuç cümlesi üretme. Öğrenci "benim yerime yaz" derse nazikçe reddet ve bunun yerine nasıl ilerleyebileceğini anlat.
- Eleştir, soru sor, eksikleri göster, düşünmeye yönelt. Düzeltme önerilerini tarif et; gerekirse bir cümle için kısa bir örnek yapı göster, tam bir paragraf yazma.
- Asla kaynak, yazar, makale adı, yıl, DOI veya istatistik UYDURMA. Emin olmadığın bilgiyi "doğrulanmalı" diye işaretle.
- Öğrencinin metninde olmayan bir bilgiyi var sayma.
- Yanıtın kısa olsun (en fazla yaklaşık 250 kelime), madde işaretli ve somut olsun.
- Öğrenci ortaokul veya lise düzeyindedir; sade ve cesaretlendirici bir dil kullan, ama dürüst ol.`;

const MODE_PROMPT: Record<AiMode, string> = {
  jury: 'Aşağıdaki bölümü TÜBİTAK jürisi gibi değerlendir. En fazla 2 güçlü yön, en fazla 4 zayıf veya eksik yön yaz. Her zayıf yön için öğrencinin ne yapabileceğini tarif et. Hazır metin yazma.',
  questions:
    'Öğrencinin bu bölümü geliştirmesi için 5 veya 6 yönlendirici soru sor. Sorular öğrenciyi kendi fikrini derinleştirmeye ve eksiklerini fark etmeye götürsün. Cevap verme.',
  clarity:
    'Dil ve akademik anlatım açısından incele: belirsiz, tekrar eden veya gayriresmî ifadeleri ve mantık atlamalarını işaretle. En fazla 3 sorunlu ifadeyi alıntıla, neden sorunlu olduğunu ve nasıl düzeltilebileceğini tarif et. Tüm paragrafı yeniden yazma.',
  shape:
    'Öğrencinin konu veya fikir taslağından başlayarak sınanabilir bir araştırma sorusu ve hipotez oluşturmasına yardım et. Önce eksik bilgiyi (değişkenler, ölçüm yolu, örneklem, süre, imkân) soru olarak sor, sonra konunun fazla geniş olup olmadığını değerlendir. Hazır araştırma sorusu dayatma; en fazla genel bir soru kalıbı göster.',
  search:
    'Öğrencinin konusu için kaynak tarama stratejisi öner: Türkçe ve İngilizce anahtar kelime grupları, AND/OR ile örnek arama sorguları ve bakılabilecek veri tabanları (Google Scholar, DergiPark, TR Dizin, YÖK Tez Merkezi gibi). Gerçek bir kaynak adı, yazar veya makale UYDURMA; yalnızca arama yönlendirmesi yap. Güvenilir kaynak türlerini ve kaynak kalitesini nasıl değerlendireceğini kısaca anlat.',
};

interface AskArgs {
  settings: AiSettings;
  mode: AiMode;
  program: Program;
  project: ProjectState;
  sectionLabel: string;
  sectionText: string;
}

export async function askCoach(a: AskArgs): Promise<string> {
  const { settings, mode, program, project, sectionLabel, sectionText } = a;
  if (!settings.apiKey.trim()) throw new Error('Önce ayarlardan Gemini API anahtarınızı girin.');

  const ctx = [
    `Program: ${program.id} ${program.name} (${program.audience})`,
    `Program bağlamı: ${program.focus}`,
    `${program.mainAreaLabel}: ${project.mainArea || '(seçilmedi)'}`,
    `${program.subAreaLabel}: ${project.subArea || '(belirtilmedi)'}`,
    project.texts.title.trim() ? `Proje adı: ${project.texts.title.trim()}` : '',
    `Rapor sınırları: başlık en fazla ${LIMITS.titleMaxWords} kelime, özet ${LIMITS.abstractMin}-${LIMITS.abstractMax} kelime, rapor en fazla ${LIMITS.pageMax} sayfa.`,
  ]
    .filter(Boolean)
    .join('\n');

  const user = `${MODE_PROMPT[mode]}

--- Bağlam ---
${ctx}

--- Bölüm: ${sectionLabel} ---
${sectionText.trim() ? sectionText.trim() : '(Öğrenci bu bölümü henüz yazmadı.)'}`;

  return callGemini(settings, SYSTEM, user, 1200, 0.4);
}

async function callGemini(settings: AiSettings, system: string, user: string, maxTokens: number, temperature: number): Promise<string> {
  const model = settings.model.trim() || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.apiKey.trim() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    });
  } catch {
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  }

  const data = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    error?: { message?: string };
    promptFeedback?: { blockReason?: string };
  } | null;

  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 400 || res.status === 403) throw new Error(`İstek reddedildi: ${msg}. API anahtarını ve model adını kontrol edin.`);
    if (res.status === 404) throw new Error(`Model bulunamadı: "${model}". Ayarlardan geçerli bir model adı girin.`);
    if (res.status === 429) throw new Error('İstek sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.');
    throw new Error(msg);
  }

  if (data?.promptFeedback?.blockReason) throw new Error('İçerik güvenlik filtresine takıldı. Metni değiştirip tekrar deneyin.');
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new Error('Boş yanıt döndü. Tekrar deneyin.');
  return text;
}

const IDEA_SYSTEM = `Sen, TÜBİTAK 2204 yarışmalarına hazırlanan öğrencilere araştırma projesi fikri öneren bir mentorsun. Türkçe yaz.
- Fikirler özgün, ilgi çekici ve bir lise veya ortaokul öğrencisinin okul imkânlarıyla, birkaç ay içinde yapabileceği düzeyde olsun.
- Her fikir için: Başlık önerisi (en fazla 15 kelime), araştırma sorusu, kısa gerekçe, olası yöntem (3-4 adım), gereken malzeme ve veri, güçlük ve risk, özgünlüğü artırma yolu yaz.
- Hiçbir kaynak, yazar, makale, istatistik veya sonuç UYDURMA. Sonuç tahmini yazma. Emin olmadığın bilgiyi "doğrulanmalı" diye belirt.
- İnsan, hayvan veya veri toplama gerektiren fikirlerde etik izin gerektiğini hatırlat.
- Bunlar öğrenciye ilham verecek başlangıç noktalarıdır; öğrencinin kendi fikriyle şekillendirmesi gerektiğini belirt.`;

const SKELETON_SYSTEM = `Sen, TÜBİTAK 2204 yarışmalarına hazırlanan öğrencilere rapor iskeleti hazırlayan bir mentorsun. Türkçe yaz.
- Seçilen proje fikri için rapor bölümlerinin her biri (Özet, Amaç, Giriş, Yöntem, İş-Zaman Çizelgesi, Bulgular, Sonuç ve Tartışma, Öneriler) için bir YAPI ve YAZIM REHBERİ ver: bölümde hangi alt başlıklar ve hangi sorulara cevap verilmeli, hangi bilgiyi öğrenci doldurmalı.
- Öğrencinin doldurması gereken yerleri [ÖĞRENCİ DOLDURACAK: ...] biçiminde işaretle.
- Yöntem bölümü için gerçekçi adımlar, ölçülecek değişkenler ve örnek bir veri tablosu başlığı öner.
- Zaman çizelgesi için ay ay iş önerisi ver.
- Bulgular ve Sonuç ve Tartışma bölümlerine ASLA sonuç, sayı veya yorum yazma; yalnızca bu bölümde neyin nasıl sunulacağını anlat.
- Kaynaklar için kaynak adı UYDURMA; yalnızca hangi tür kaynaklara ve hangi arama kelimeleriyle bakılacağını yaz.
- Özet, Giriş gibi bölümlerde tam paragraf yazma; cümle kalıbı ve içerik listesi ver.`;

export async function askIdeas(settings: AiSettings, program: Program, project: ProjectState, interests: string): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Önce ayarlardan Gemini API anahtarınızı girin.');
  const user = `Aşağıdaki alana uygun 5 farklı, özgün proje fikri öner.

Program: ${program.id} ${program.name} (${program.audience})
Program bağlamı: ${program.focus}
${program.mainAreaLabel}: ${project.mainArea || '(seçilmedi)'}
${program.subAreaLabel}: ${project.subArea || '(belirtilmedi)'}
Öğrencinin ilgi alanları ve imkânları: ${interests.trim() || '(belirtilmedi)'}`;
  return callGemini(settings, IDEA_SYSTEM, user, 3000, 0.9);
}

export async function askSkeleton(settings: AiSettings, program: Program, project: ProjectState, idea: string): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Önce ayarlardan Gemini API anahtarınızı girin.');
  if (!idea.trim()) throw new Error('Önce seçtiğiniz proje fikrini yazın.');
  const user = `Aşağıdaki proje fikri için rapor iskeleti hazırla.

Program: ${program.id} ${program.name} (${program.audience})
${program.mainAreaLabel}: ${project.mainArea || '(seçilmedi)'}
${program.subAreaLabel}: ${project.subArea || '(belirtilmedi)'}
Rapor süresi: ${project.timelineMonths} ay

Proje fikri:
${idea.trim()}`;
  return callGemini(settings, SKELETON_SYSTEM, user, 4000, 0.5);
}

// ---------------------------------------------------------------------------
// Taslak oluşturma (öğrencinin kendi fikri ve notlarından)
// ---------------------------------------------------------------------------

export type DraftId = 'title' | 'abstract' | 'keywords' | 'aim' | 'intro' | 'method' | 'findings' | 'discussion' | 'recommendations';

export const DRAFT_ORDER: DraftId[] = ['title', 'aim', 'intro', 'method', 'findings', 'discussion', 'recommendations', 'abstract', 'keywords'];

const DRAFT_SYSTEM = `Sen, TÜBİTAK 2204 proje raporu yazan öğrencilere taslak hazırlayan bir yazım yardımcısısın. Türkçe, akademik ama sade bir dille yaz.

Kesin kurallar:
- YALNIZCA öğrencinin verdiği proje fikri, notlar ve veri notlarındaki bilgileri kullan. Başka bilgi ekleme.
- Hiçbir kaynak, yazar, makale adı, yıl, DOI, istatistik, ölçüm değeri, örneklem büyüklüğü veya sonuç UYDURMA. Metinde (Yazar, Yıl) biçiminde atıf yazma.
- Bilgi eksikse o yere tam olarak [DOLDUR: neyin yazılacağı] biçiminde yer tutucu koy. Yer tutucuyu atlamak ve tahminle doldurmak yasak.
- Öğrenci veri notu vermediyse deney, anket veya gözlem sonucu hakkında hiçbir bulgu veya yorum yazma; bunun yerine bölümde neyin nasıl sunulacağını yer tutucularla belirt.
- Çıktı düz metindir: markdown, başlık, madde işareti, kalın yazı kullanma. Paragrafları boş satırla ayır. Bölüm başlığını tekrar yazma.
- Sadece istenen bölümün metnini ver; açıklama, giriş veya kapanış cümlesi ekleme.`;

const GROUNDED_SYSTEM = `Sen, TÜBİTAK 2204 proje raporu yazan öğrencilere kaynak özetlerinden giriş (kaynak taraması) taslağı hazırlayan bir yazım yardımcısısın. Türkçe, akademik ama sade yaz.
Yalnızca sana verilen kaynak özetlerindeki ve öğrenci notlarındaki bilgileri kullan; kendi bilginden bilgi, sayı, kaynak veya yazar ekleme. Atıfları yalnızca verilen biçimde yaz. Çıktı düz metindir, markdown kullanma.`;

const DRAFT_GUIDE: Record<DraftId, string> = {
  title: 'Proje başlığı: tek cümle, en fazla 15 kelime, projenin içeriğini yansıtsın. Yalnızca başlığı yaz.',
  abstract:
    'Özet: 150-250 kelime, tek paragraf. Amaç, yöntem, yapılan gözlem ve temel bulgular/sonuçtan birkaç cümle. Ayrıntı, yorum ve kaynak yok. Bulgu için veri notu yoksa bulgu cümlesini [DOLDUR: ...] ile bırak.',
  keywords: 'Anahtar kelimeler: projenin konusunu yansıtan en fazla 5 kelime veya kısa ifade, virgülle ayrılmış. Yalnızca listeyi yaz.',
  aim: 'Amaç bölümü: projenin amacı, somut ve ölçülebilir hedefleri, çözülmesi gereken problem ve (varsa) hipotez. Genel konu ve tarihçe anlatma. 2-4 kısa paragraf.',
  intro:
    'Giriş (kaynak taraması) bölümünün iskeleti: konunun önemi, bu alanda bilinenler, çelişkiler ve cevapsız soru, projenin bu boşluğu nasıl doldurduğu. Hiçbir çalışmayı adıyla anma; bilinenleri anlatacağın yerlere [DOLDUR: bu konuda yapılmış çalışmanın sonucu ve kaynağı] yer tutucusunu koy. 4-6 paragraf.',
  method:
    'Yöntem bölümü: araştırma deseni, katılımcı/örneklem veya malzeme, veri toplama araçları, deney/gözlem düzeneği, süreç adımları, veri analizi. Öğrencinin anlattığı adımları düzenle; bilinmeyen ayrıntıları [DOLDUR: ...] ile işaretle. İnsan veya hayvan söz konusuysa etik izin ve onam bilgisi için yer tutucu bırak.',
  findings:
    'Bulgular bölümü: yorum yapmadan verilerin sunumu. Yalnızca öğrencinin veri notlarındaki verileri aktar ve hangi tablo/şeklin konacağını belirt. Veri notu yoksa sadece neyin hangi tablo ve şekille sunulacağını yer tutucularla yaz.',
  discussion:
    'Sonuç ve Tartışma bölümü: bulguların araştırma sorusuna göre yorumu, literatürle karşılaştırma ve sınırlılıklar. Yalnızca öğrencinin veri notlarının desteklediği yorumları yaz. Veri yoksa yorum yazma, yer tutucularla yapıyı ver.',
  recommendations: 'Öneriler bölümü: benzer çalışma yapacaklara yol gösterecek 3-5 öneri. Fikre ve notlardaki sınırlılıklara dayan; tahmini sonuç yazma.',
};

export const DRAFT_LABEL: Record<DraftId, string> = {
  title: 'Proje Adı',
  abstract: 'Özet',
  keywords: 'Anahtar Kelimeler',
  aim: 'Amaç',
  intro: 'Giriş',
  method: 'Yöntem',
  findings: 'Bulgular',
  discussion: 'Sonuç ve Tartışma',
  recommendations: 'Öneriler',
};

function draftContext(program: Program, project: ProjectState): string {
  const clip = (s: string) => (s.length > 1500 ? s.slice(0, 1500) + '…' : s);
  const parts = [
    `Program: ${program.id} ${program.name} (${program.audience})`,
    `${program.mainAreaLabel}: ${project.mainArea || '(seçilmedi)'}`,
    `${program.subAreaLabel}: ${project.subArea || '(belirtilmedi)'}`,
    `Proje süresi: ${project.timelineMonths} ay`,
    '',
    'ÖĞRENCİNİN PROJE FİKRİ VE NOTLARI:',
    project.ideaNote?.trim() || '(yazılmadı)',
    '',
    'ÖĞRENCİNİN VERİ NOTLARI (gözlem, ölçüm, anket sonuçları):',
    project.dataNote?.trim() || '(verilmedi. Hiçbir bulgu veya sonuç yazma.)',
  ];
  const t = project.texts;
  const have = (['title', 'aim', 'method'] as const).filter((k) => t[k].trim());
  if (have.length) {
    parts.push('', 'RAPORUN ÖĞRENCİ TARAFINDAN ONAYLANMIŞ MEVCUT BÖLÜMLERİ (tutarlı kal):');
    for (const k of have) parts.push(`[${DRAFT_LABEL[k as DraftId]}] ${clip(t[k])}`);
  }
  return parts.join('\n');
}

export async function askDraft(settings: AiSettings, program: Program, project: ProjectState, id: DraftId): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Önce ayarlardan Gemini API anahtarınızı girin.');
  if (!(project.ideaNote ?? '').trim() && !project.texts.title.trim() && !project.texts.aim.trim())
    throw new Error('Önce "Fikir ve taslak" adımında proje fikrinizi yazın.');
  const src = project.references.filter((r) => (r.abstract ?? '').trim());
  const sourced: DraftId[] = ['intro', 'aim', 'method', 'discussion'];
  if (sourced.includes(id) && src.length > 0) {
    const block = src
      .map((r, i) => `[K${i + 1}] Atıf biçimi: ${inTextCite(r)} | Başlık: ${r.title}\nÖzet: ${(r.abstract ?? '').slice(0, 1400)}`)
      .join('\n\n');
    const base = id === 'intro' ? DRAFT_GUIDE.intro.split('Hiçbir çalışmayı')[0] : DRAFT_GUIDE[id];
    const guided = `${base}

Aşağıdaki GERÇEK kaynakların özetlerinden ve öğrencinin notlarından yararlanarak yaz.

Kurallar:
- Bir kaynağa dayanan her cümlenin sonunda o kaynağın atıf biçimini aynen yaz, örn. ${inTextCite(src[0])}. Yalnızca aşağıdaki listedeki atıf biçimlerini kullan.
- Bir kaynak hakkında yalnızca özetinde açıkça yazanları söyle. Özette olmayan bulgu, sayı veya yorum ekleme. Özeti kopyalama, kendi cümlelerinle yeniden anlat.
- Öğrencinin kendi bilgileri için yalnızca ÖĞRENCİNİN NOTLARI'ndakileri kullan. Öğrenci veri notu vermediyse hiçbir bulgu veya sonuç yazma.
- Bilmediğin yerlere [DOLDUR: ...] koy. Listede olmayan hiçbir kaynağa atıf yapma.
- Düz metin yaz, markdown kullanma.

--- Kaynaklar ---
${block}

--- Bağlam ---
${draftContext(program, project)}`;
    const text = await callGemini(settings, GROUNDED_SYSTEM, guided, 3000, 0.3);
    return text.replace(/\*\*/g, '').trim();
  }
  const user = `${DRAFT_GUIDE[id]}\n\n--- Bağlam ---\n${draftContext(program, project)}`;
  const out = await callGemini(settings, DRAFT_SYSTEM, user, 2500, 0.5);
  return out.replace(/^```[a-z]*\n?|```$/g, '').replace(/\*\*/g, '').trim();
}

export async function askTimelineDraft(
  settings: AiSettings,
  program: Program,
  project: ProjectState,
): Promise<{ task: string; start: number; end: number }[]> {
  if (!settings.apiKey.trim()) throw new Error('Önce ayarlardan Gemini API anahtarınızı girin.');
  const m = project.timelineMonths;
  const user = `Aşağıdaki proje için ${m} aylık bir iş-zaman çizelgesi öner. Yalnızca JSON dizisi döndür, başka metin yazma. Her eleman {"task": "iş adı", "start": 1, "end": 2} biçiminde olsun (ay numaraları 1-${m} arası). 5-8 iş olsun: kaynak tarama, hazırlık, veri toplama, analiz, rapor yazımı gibi, projeye özgü adlarla.\n\n--- Bağlam ---\n${draftContext(program, project)}`;
  const raw = await callGemini(settings, DRAFT_SYSTEM, user, 1200, 0.3);
  const json = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
  let arr: unknown;
  try {
    arr = JSON.parse(json);
  } catch {
    throw new Error('Çizelge okunamadı. Tekrar deneyin.');
  }
  if (!Array.isArray(arr)) throw new Error('Çizelge okunamadı. Tekrar deneyin.');
  return arr
    .map((r) => r as { task?: unknown; start?: unknown; end?: unknown })
    .filter((r) => typeof r.task === 'string' && r.task.trim())
    .map((r) => {
      const s = Math.min(m, Math.max(1, Math.round(Number(r.start) || 1)));
      const e = Math.min(m, Math.max(s, Math.round(Number(r.end) || s)));
      return { task: String(r.task).trim(), start: s, end: e };
    });
}

/** Fikir notundan veri tabanında aranacak 3 arama sorgusu önerir (Türkçe ve İngilizce). Yapay zekâ kaynak üretmez, yalnızca arama kelimesi önerir. */
export async function askSearchQueries(settings: AiSettings, program: Program, project: ProjectState): Promise<string[]> {
  const fallback = [project.texts.keywords, project.texts.title, project.ideaNote ?? '']
    .map((x) => x.replace(/\s+/g, ' ').trim().slice(0, 120))
    .filter((x) => x.length >= 3)
    .slice(0, 2);
  if (!settings.apiKey.trim()) return fallback;
  try {
    const user = `Aşağıdaki proje için bilimsel veri tabanında (OpenAlex) aranacak 3 kısa arama sorgusu öner. Biri Türkçe, ikisi İngilizce olsun. Her sorgu 2-6 kelime, konunun çekirdek kavramlarını içersin. Yalnızca JSON dizisi döndür, örn. ["sorgu 1","query 2","query 3"]. Kaynak, yazar veya makale adı yazma.

--- Bağlam ---
${draftContext(program, project)}`;
    const raw = await callGemini(settings, DRAFT_SYSTEM, user, 400, 0.2);
    const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)) as unknown;
    if (Array.isArray(arr)) {
      const qs = arr.filter((q): q is string => typeof q === 'string' && q.trim().length >= 3).map((q) => q.trim()).slice(0, 3);
      if (qs.length) return qs;
    }
  } catch {
    /* anahtar kelimelerle devam et */
  }
  return fallback;
}
