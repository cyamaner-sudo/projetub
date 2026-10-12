import type { StepId, TextSectionId } from '../types.ts';
import { LIMITS } from './programs.ts';

export interface SectionDef {
  id: TextSectionId;
  label: string;
  kind: 'line' | 'text';
  rows: number;
  placeholder: string;
  what: string;
  tips: string[];
  questions: string[];
}

export const SECTION_DEFS: Record<TextSectionId, SectionDef> = {
  title: {
    id: 'title',
    label: 'Proje Adı',
    kind: 'line',
    rows: 1,
    placeholder: 'Projenizi anlatan tek bir cümle',
    what: `Tek cümle, kısa ve öz. En fazla ${LIMITS.titleMaxWords} kelime. Okuyana projenin içeriği hakkında fikir vermeli.`,
    tips: [
      'Başlık proje içeriğini yansıtmalı; süslü veya genel ifadelerden kaçının.',
      'Neyi, hangi koşulda, neye etkisiyle incelediğinizi içermesi iyi olur.',
      'Proje ilerledikçe başlığı güncelleyebilirsiniz.',
    ],
    questions: [
      'Başlığı okuyan biri projenin konusunu ve yaklaşımını tahmin edebilir mi?',
      'Başlıktaki her kelime gerekli mi?',
    ],
  },
  abstract: {
    id: 'abstract',
    label: 'Özet',
    kind: 'text',
    rows: 12,
    placeholder: 'Yöntemi, temel bulguları ve sonucu birkaç cümleyle özetleyin',
    what: `${LIMITS.abstractMin}-${LIMITS.abstractMax} kelime. Kullanılan yöntem, yapılan gözlem, temel bulgular ve sonuç birkaç cümleyle anlatılır.`,
    tips: [
      'Çalışmanın ayrıntılarına, yorumlara ve kaynaklara özette yer verilmez.',
      'Başlarken taslak bir özet yazın, çalışma bitince raporun içeriğine uygun olarak güncelleyin.',
      'Jüri ve okuyucu projeyi en kısa sürede anlamak ister; özet tek başına okunabilmeli.',
    ],
    questions: [
      'Özet; amaç, yöntem, temel bulgu ve sonucu içeriyor mu?',
      'Özet raporun son hâliyle uyumlu mu?',
    ],
  },
  keywords: {
    id: 'keywords',
    label: 'Anahtar Kelimeler',
    kind: 'line',
    rows: 1,
    placeholder: 'Virgülle ayırarak yazın',
    what: `Projenin konusunu genel olarak yansıtan en fazla ${LIMITS.keywordsMax} kelime. Özetin altında yer alır.`,
    tips: [
      'Başlıkta ve özette geçen temel kavramları seçin.',
      'Kaynak taramasında arama yaparken de kullanacağınız kelimeler olmalı.',
    ],
    questions: ['Bu kelimelerle aratan biri projenize ulaşabilir mi?'],
  },
  aim: {
    id: 'aim',
    label: 'Amaç',
    kind: 'text',
    rows: 8,
    placeholder: 'Projenin amacı ve somut hedefleri',
    what: 'Doğrudan projenin amacına, somut hedeflerine ve Ar-Ge içeriğine odaklanılır. Konunun çözülmesi gereken veya önceden çalışılmış ama aydınlatılması gereken bir problem olup olmadığı, hangi eksikliği nasıl gidereceği ya da hangi sorunlara çözüm getireceği açıklanır.',
    tips: [
      'Amaç ölçülebilir veya sınanabilir olmalı. "Farkındalık oluşturmak" gibi genel ifadeleri somutlaştırın.',
      'Araştırma sorunuzu ve varsa hipotezinizi burada ya da girişin sonunda açıkça yazın.',
      'Mühendislik veya tasarım projelerinde problemi ve tasarım ölçütlerini belirtin.',
      'Raporu alanında uzman kişiler değerlendirecek: değerlendirmeye katkısı olmayan genel konu ve tarihçe anlatımından kaçının.',
    ],
    questions: [
      'Projeniz hangi soruya cevap arıyor veya hangi problemi çözüyor?',
      'Sonunda neyi gösterebilirseniz amaca ulaşmış sayılırsınız?',
      'Fikir size mi ait? Danışmanınızın katkısı yönlendirme düzeyinde mi?',
    ],
  },
  intro: {
    id: 'intro',
    label: 'Giriş',
    kind: 'text',
    rows: 16,
    placeholder: 'Konuyla ilgili yapılmış çalışmalar ve cevapsız sorular',
    what: 'Araştırma konusu hakkında yapılmış araştırmaların sonuçları ve bu alanda cevapsız olan sorular, bilimsel makalelere dayandırılarak anlatılır (kaynak taraması).',
    tips: [
      'Her bilgi için metin içinde kaynak gösterin: (Yılmaz & Kaya, 2020) veya Yılmaz ve Kaya (2020).',
      'Kaynakları sıralamak yerine birbiriyle ilişkilendirin: kim ne buldu, nerede çelişki veya eksik var?',
      'Giriş, projenizin neden gerekli olduğunu gösteren boşlukla bitsin.',
      'Başka metinlerden cümle almayın; kendi cümlelerinizle yazın ve kaynak belirtin.',
    ],
    questions: [
      'Bu konuda en önemli 3-5 çalışma hangisi ve ne söylüyor?',
      'Bu çalışmaların cevaplamadığı soru nedir? Projeniz bunu nasıl dolduruyor?',
    ],
  },
  method: {
    id: 'method',
    label: 'Yöntem',
    kind: 'text',
    rows: 14,
    placeholder: 'Çalışmanın nasıl yürütüldüğünü başka biri tekrar edebilecek ayrıntıda anlatın',
    what: 'Araştırma yöntemi, veri toplama araçları, deney ve gözlem düzenekleri ve verilerin analiz yöntemi verilir.',
    tips: [
      'Başka bir kişi yazdıklarınızla çalışmayı tekrarlayabilmeli.',
      'Örneklem veya katılımcıları, malzemeleri, ölçüm araçlarını ve süreleri belirtin.',
      'Anket, görüşme gibi araçlar ve yasal izinler Ekler bölümüne konabilir.',
      'İnsan veya canlı hayvan içeren çalışmalarda etik kurallara ve izinlere uyduğunuzu açıkça yazın.',
    ],
    questions: [
      'Hangi veriyi, nasıl, kimden veya neyden, ne zaman topladınız?',
      'Veriyi hangi yöntemle analiz ettiniz ve neden bu yöntemi seçtiniz?',
      'Sonucu etkileyebilecek değişkenleri nasıl kontrol ettiniz?',
    ],
  },
  findings: {
    id: 'findings',
    label: 'Bulgular',
    kind: 'text',
    rows: 14,
    placeholder: 'Toplanan veriler ve analiz sonuçları (yorumsuz)',
    what: 'Çalışmada toplanan veriler ve verilere ait analiz sonuçları verilir.',
    tips: [
      'Yorumu bu bölüme değil, Sonuç ve Tartışma bölümüne bırakın.',
      'Her tablo ve şekle numara, başlık verin ve metinde ona atıf yapın.',
      'Uzun ham veriler Ekler bölümüne konabilir.',
    ],
    questions: [
      'Her bulgu amaçla veya araştırma sorusuyla ilişkili mi?',
      'Tablo ve şekiller tek başına anlaşılabiliyor mu?',
    ],
  },
  discussion: {
    id: 'discussion',
    label: 'Sonuç ve Tartışma',
    kind: 'text',
    rows: 14,
    placeholder: 'Bulguların yorumu ve literatürle karşılaştırma',
    what: 'Proje çalışması ile elde edilen bulgular, araştırma sorusuna veya problemine uygun olarak yorumlanır.',
    tips: [
      'Önce sorunuza cevabı net yazın, sonra neden böyle çıktığını tartışın.',
      'Bulgularınızı girişte anlattığınız çalışmalarla karşılaştırın; uyumlu veya farklı olduğu yerleri belirtin.',
      'Çalışmanın sınırlılıklarını dürüstçe yazın (örneklem küçüklüğü, süre, ölçüm hatası).',
      'Verinin desteklemediği iddialarda bulunmayın.',
    ],
    questions: [
      'Araştırma sorusunun cevabı nedir ve hangi veri bunu destekliyor?',
      'Sonuçlarınız literatürle uyumlu mu? Değilse olası nedenleri neler?',
      'Hangi sınırlılıklar sonuçları etkilemiş olabilir?',
    ],
  },
  recommendations: {
    id: 'recommendations',
    label: 'Öneriler',
    kind: 'text',
    rows: 6,
    placeholder: 'Benzer çalışma yapacaklara öneriler',
    what: 'Benzer çalışmalar yapacak olanlara yol göstermesi bakımından öneriler varsa belirtilir.',
    tips: [
      'Önerileriniz bulgularınıza ve karşılaştığınız zorluklara dayansın.',
      'Hangi sorunun hâlâ açık kaldığını ve sonraki adımda ne yapılabileceğini belirtin.',
    ],
    questions: ['Projeyi baştan yapsaydınız neyi farklı yapardınız?'],
  },
  appendix: {
    id: 'appendix',
    label: 'Ekler',
    kind: 'text',
    rows: 8,
    placeholder: 'Anketler, uzun tablolar, formüller, izin belgeleri vb.',
    what: `Konuyu dağıtacağı düşünülen veya çok uzun metinlerden oluşan tablolar, formüller, ayrıntılı deney verileri, bilgisayar programları, anketler vb. burada verilebilir. Araştırma için alınan yasal izinler, yazışmalar ve gerekirse e-posta örnekleri de bu bölümde yer almalıdır. Her ek için uygun bir başlık seçilip metindeki geçiş sırasına göre "Ek 1.", "Ek 2." biçiminde, ayrı bir sayfadan başlayacak şekilde verilir. Ekler ${LIMITS.pageMax} sayfa sınırına sığmazsa başvuru sistemindeki EK BELGELER kısmına yüklenir; bu durumda raporda EK BELGELER kısmına dosya yüklendiği belirtilir ve eklenen belgeler liste hâlinde yazılır.`,
    tips: [
      'Her eke numara ve ad verin (Ek 1. Anket formu) ve metinde atıf yapın.',
      'Dosya olarak yükleyeceğiniz belgeleri burada liste hâlinde yazın.',
    ],
    questions: ['Metni dağıtan veya sayfa sınırını aşan hangi materyal var?'],
  },
};

export const STEP_GROUPS: { title: string; steps: { id: StepId; label: string }[] }[] = [
  {
    title: 'Başlangıç',
    steps: [
      { id: 'setup', label: 'Program ve alan' },
      { id: 'rules', label: 'Kurallar ve süreç' },
      { id: 'ideas', label: 'Fikir ve taslak' },
    ],
  },
  {
    title: 'Rapor',
    steps: [
      { id: 'title', label: 'Proje Adı' },
      { id: 'aidecl', label: 'YZ Kullanım Beyanı' },
      { id: 'abstract', label: 'Özet' },
      { id: 'keywords', label: 'Anahtar Kelimeler' },
      { id: 'aim', label: 'Amaç' },
      { id: 'intro', label: 'Giriş' },
      { id: 'method', label: 'Yöntem' },
      { id: 'timeline', label: 'İş-Zaman Çizelgesi' },
      { id: 'findings', label: 'Bulgular' },
      { id: 'discussion', label: 'Sonuç ve Tartışma' },
      { id: 'recommendations', label: 'Öneriler' },
      { id: 'refs', label: 'Kaynaklar' },
      { id: 'appendix', label: 'Ekler' },
    ],
  },
  {
    title: 'Kontrol ve çıktı',
    steps: [
      { id: 'ethics', label: 'Etik ve kurallar' },
      { id: 'review', label: 'Genel kontrol' },
      { id: 'preview', label: 'Önizleme ve çıktı' },
    ],
  },
];

export const ALL_STEPS = STEP_GROUPS.flatMap((g) => g.steps);

export const TEXT_SECTION_IDS = Object.keys(SECTION_DEFS) as TextSectionId[];

export interface EthicsItem {
  id: string;
  text: string;
  conditional?: boolean;
}

export const ETHICS_ITEMS: { title: string; items: EthicsItem[] }[] = [
  {
    title: 'Özgünlük',
    items: [
      {
        id: 'idea',
        text: 'Projenin çıkış fikri öğrencilere ait. Danışman yönlendirici ve destekleyici rolde (rehberin en önemli ölçütü fikrin öğrenciye ait olması).',
      },
      {
        id: 'notOngoing',
        text: 'Bir üniversite veya kurumda yürüyen bir araştırmaya katılıp oradaki çalışmayı proje olarak sunmuyorum. Dış destek bilgi alma ve cihaz kullanımıyla sınırlı.',
      },
      {
        id: 'plagiarism',
        text: 'Metinlerin tamamı kendi cümlelerimle yazıldı, başkalarının ifade ve düşünceleri kaynak gösterilerek kullanıldı. Önceki projeler ve yayınlanmış metinlerle benzerlik kontrol edilir; benzerlik tespit edilirse proje elenebilir.',
      },
      {
        id: 'safeExperiment',
        text: 'Çalışmam sağlık riski taşımıyor; hayvanlar üzerinde kesi veya kan/doku alımı içermiyor ve tehlikeli madde kullanmıyor (bunlar elenme nedenidir).',
      },
      {
        id: 'aiDeclared',
        text: 'Üretken yapay zekâ araçlarını kullandıysam kullanım beyanını doldurdum; çıktıları kendim gözden geçirip düzelttim ve tüm kaynakları bağımsız olarak doğruladım.',
      },
      {
        id: 'notRepeat',
        text: 'Aynı veya benzer içerikli proje, bu yarışmanın son başvuru tarihinden önce başka bir proje yarışmasına başvurmuş veya katılmış değil.',
      },
    ],
  },
  {
    title: 'İnsan ve hayvan içeren çalışmalar',
    items: [
      {
        id: 'consent',
        text: 'Katılımcılar gönüllü. 18 yaş altı katılımcılar için veli izin/onam belgesi alındı.',
        conditional: true,
      },
      {
        id: 'mebPermit',
        text: 'Milli Eğitim Bakanlığına bağlı kurumlardan (öğrenci, veli, öğretmen vb.) veri toplanıyorsa Araştırma Uygulama İzin Belgesi alındı.',
        conditional: true,
      },
      {
        id: 'animals',
        text: 'Omurgalı hayvan deneyi varsa; hayvanın öldürülmesi, vücudunda kesi yapılması, aç/susuz bırakılması, acı ve eziyet çekmesi gibi uygulamalar yok.',
        conditional: true,
      },
      {
        id: 'health',
        text: 'Sağlığı tehdit eden bir deney yapılmadı.',
      },
    ],
  },
  {
    title: 'Rapor',
    items: [
      {
        id: 'noIdentity',
        text: 'Raporda öğrenci, okul veya danışman adı yok. TÜBİTAK şablonu yalnızca ana alan, tematik/alt alan ve proje adı bilgisini içeriyor. Güncel çağrı metnini kontrol edin.',
      },
      {
        id: 'attachments',
        text: 'Anket, ölçek, izin belgeleri gibi materyaller Ekler bölümüne veya başvuru sistemindeki EK BELGELER bölümüne eklendi.',
      },
      {
        id: 'reviewedByConsultant',
        text: 'Raporu danışman öğretmenimle birlikte gözden geçirdik.',
      },
    ],
  },
];
