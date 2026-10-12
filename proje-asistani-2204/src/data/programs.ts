import type { Program, ProgramId } from '../types.ts';

/**
 * Rapor sınırları. Kaynak: TÜBİTAK 2204 proje yazma şablonu (2025-2026) ve
 * 2204-B proje rehberi (2027). 2204-C ve 2204-D için ayrı doğrulama yapılmadı.
 */
export const LIMITS = {
  titleMaxWords: 15,
  abstractMin: 150,
  abstractMax: 250,
  keywordsMax: 5,
  pageMax: 20,
} as const;

export const FORMAT_RULES = [
  'Yazı tipi Times New Roman, 12 punto',
  'Her yandan 2,5 cm kenar boşluğu',
  'Tek satır aralığı, iki yana yaslı',
  `Rapor en fazla ${LIMITS.pageMax} sayfa (sığmayan ekler başvuru sistemindeki EK BELGELER bölümüne yüklenir)`,
  'Kaynaklar APA kurallarına göre listelenir',
];

const tr = (a: string, b: string) => a.localeCompare(b, 'tr');

// 2204-A 2027 proje rehberi, Tablo 2 (2027 rehberi: tematik alanların kapsamı genişletildi)
const A_THEMES = [
  'Aile İçi İletişim',
  'Akıllı Ulaşım Sistemleri',
  'Algoritma Tasarımı ve Uygulamaları',
  'Artırılmış, Sanal ve Karma Gerçeklik',
  'Astronomi ve Astrofizik',
  'Bağımlılık ve Bağımlılıkla Mücadele',
  'Bilgisayarsız Kodlama',
  'Bilim İletişimi',
  'Bilim Tarihi ve Felsefesi',
  'Biyoçeşitlilik',
  'Biyomedikal Cihaz Teknolojileri',
  'Biyotaklit',
  'Blokzincir',
  'Büyük Veri ve Bulut Bilişim',
  'Çevre ve Çevreyi Koruma',
  'Çip Teknolojileri',
  'Değerler Eğitimi',
  'Dijital İkiz',
  'Dijital Oyun Tasarımı',
  'Dil ve Edebiyat',
  'Doğal Afetler ve Afet Yönetimi',
  'Doğal Miras ve Doğal Kaynaklar',
  'E-Öğrenme',
  'Ekolojik Denge',
  'Ekolojik Okuryazarlık',
  'Erişilebilir Yaşam Teknolojileri',
  'Finansal Okuryazarlık',
  'Genetik ve Biyoteknoloji',
  'Gıda Arzı ve Gıda Güvenliği',
  'Giyilebilir Teknolojiler',
  'Göç ve Uyum',
  'Görsel ve İşitsel Sanatlar',
  'Havacılık ve Uzay Bilimleri',
  'Hidrojen Enerjisi',
  'İnsan Hakları ve Demokrasi',
  'Jeotermal Enerji',
  'Karbon Ayak İzi',
  'Kuantum Teknolojileri',
  'Kutup Keşfi ve Araştırmaları',
  'Küresel Isınma ve İklim Değişikliği',
  'Makine Öğrenmesi',
  'Malzeme Bilimi ve Nanoteknoloji',
  'Medya Okuryazarlığı',
  'Milli Teknoloji Hamlesi',
  'Nörobilim ve Nöroteknoloji',
  'Nükleer Enerji',
  'Okul Dışı Öğrenme Ortamları',
  'Orman ve Ormanları Koruma',
  'Oyun ve Oyunlaştırma',
  'Robotik ve Kodlama',
  'Sağlıklı Beslenme',
  'Sağlıklı Yaşam ve Spor',
  'Salgın Hastalıklar ve Salgınla Mücadele',
  'Sıfır Atık ve Geri Dönüşüm',
  'Siber Güvenlik',
  'Siber Psikoloji',
  'Somut Kültürel Miras',
  'Somut Olmayan Kültürel Miras',
  'Sorumlu Üretim ve Tüketim',
  'STEAM (Fen, Teknoloji, Mühendislik, Sanat ve Matematik)',
  'Sürdürülebilir Şehirler ve Toplumlar',
  'Tarım ve Hayvancılık Teknolojileri',
  'Yabancı Dil Eğitimi',
  'Yapay Zekâ',
  'Yenilenebilir Enerji',
  'Yer ve Deniz Bilimleri',
  'Yoksullukla Mücadele',
].sort(tr);

// 2204-B 2027 rehberindeki liste ile aynı kabul edildi
const B_THEMES = A_THEMES;

const TEKNOFEST_STAGES = [
  {
    title: 'Ön değerlendirme',
    text: 'Başvuru raporu şekil ve bilimsel ölçütlere göre incelenir. Başarılı projeler finale çağrılır.',
  },
  {
    title: 'Final değerlendirmesi',
    text: 'Çevrim içi (Zoom) yapılır. Değerlendirmeye yalnızca proje sahibi öğrenci veya öğrenciler katılır.',
  },
];

export const PROGRAMS: Record<ProgramId, Program> = {
  '2204-A': {
    id: '2204-A',
    name: 'Lise Öğrencileri Araştırma Projeleri Yarışması',
    audience: 'Lise',
    summary:
      'Lise öğrencilerini temel, sosyal ve uygulamalı bilim alanlarında çalışmalar yapmaya teşvik eden, TÜBİTAK BİDEB yarışması. 12 bölgede düzenlenir.',
    mainAreas: [
      'Biyoloji',
      'Coğrafya',
      'Değerler Eğitimi',
      'Fizik',
      'Kimya',
      'Matematik',
      'Psikoloji',
      'Sosyoloji',
      'Tarih',
      'Teknolojik Tasarım',
      'Türk Dili ve Edebiyatı',
      'Yazılım',
    ],
    mainAreaLabel: 'Ana alan',
    subAreaLabel: 'Tematik alan',
    subAreaOptions: A_THEMES,
    subAreaHint: 'Proje, ana alanın yanında tematik alanlardan birini kapsamalıdır.',
    stages: [
      {
        title: 'Ön değerlendirme',
        text: 'Başvuru sistemine yüklenen rapor önce şekil, sonra bilimsel ölçütlere göre incelenir. Önceki projeler ve yayınlanmış metinlerle benzerlik de kontrol edilir.',
      },
      {
        title: 'Bölge aşaması',
        text: 'Başarılı projeler bölge sergisine çağrılır, öğrenciler projeyi jüriye sözlü sunar. Bölge puanında ön değerlendirme puanının %30\'u etkilidir. Poster ve stant hazırlığı gerekir.',
      },
      {
        title: 'Final aşaması',
        text: 'Bölge aşamasında başarılı bulunan projeler finalde sergilenir ve jüriye sunulur.',
      },
    ],
    awards:
      'Bölge aşamasında katılım belgesi, birincilik, ikincilik, üçüncülük ve teşvik ödülleri verilebilir; bölge birincileri finale çağrılır. Finalde birincilik, ikincilik, üçüncülük ve teşvik ödülleri verilebilir. Ödül alan öğrencilere para ödülü ve başarı belgesi, final derecesi alanlara talep hâlinde patent desteği, 2205, 2247-C ve 2224-D gibi programlara başvuru imkânı ve YKS avantajları sağlanır. Ayrıntılar rehberde.',
    applyNotes: [
      'Başvuru dönemi: 23 Eylül 2026 – 4 Ocak 2027, saat 17.30. Sistem otomatik kapanır, sonradan değişiklik yapılamaz.',
      'Türkiye veya KKTC\'de örgün ya da açık öğretimde okuyan lise öğrencileri başvurabilir. Başvuru döneminin son gününde 20 yaşını doldurmamış olmak gerekir.',
      'Her öğrenci yalnızca bir projede yer alır. Bir projeyi en fazla 3 öğrenci hazırlar. En fazla 1 danışman olabilir, danışman zorunlu değildir. Danışmanla birinci derece akrabalık veya çıkar ilişkisi olmamalıdır.',
      'Öğrencilerin ve danışmanın ARBİS kaydı güncel olmalıdır.',
      'Rapor Türkçe, "Proje Yazım Şablonu" ile hazırlanır ve tek bir PDF olarak yüklenir.',
      'Ek belgeler PDF olmalı, dosya adı 25 karakteri geçmemeli, kişisel bilgi içermemeli ve 10 MB\'ı aşmamalıdır.',
      'Video isteğe bağlıdır: en fazla 10 MB ve 3 dakika, mp4.',
      'Ana alan ve tematik alan başvuru bittikten sonra değiştirilemez. Projenin asıl konusuna göre seçin.',
      'Belgelerde kurum, marka veya ticari ürün öne çıkarılamaz; ayrımcı veya aşağılayıcı ifade kullanılamaz.',
      'Aynı veya benzer proje son başvuru tarihinden önce başka bir yarışmaya başvurmuşsa proje elenir. Fikir aşamasındaki veya devam eden projeler kabul edilmez.',
    ],
    limitsVerified: true,
    dataNote:
      'Ana alanlar, tematik alanlar ve kurallar TÜBİTAK 2204-A 2027 proje rehberi ve 2026-2027 çağrı metninden alındı (23 Eylül 2026 duyurusu). Proje yazım şablonunun (.docx) içeriği okunamadığı için rapor bölüm başlıkları ve biçim kuralları önceki şablona dayanır. Şablonu indirip karşılaştırın.',
    links: [
      {
        label: '2204-A Proje Rehberi (2027)',
        url: 'https://tubitak.gov.tr/sites/default/files/2026-09/lise_proje_rehberi_2027_onaya_sunulan.pdf',
      },
      {
        label: '2204-A Çağrı metni (2026-2027)',
        url: 'https://tubitak.gov.tr/sites/default/files/2026-09/Ek-1b_2204_A_cagri_metni_2026-2027_17.08.2026_onaya_sunulan_v2.pdf',
      },
      {
        label: 'Proje yazım şablonu (2026-2027)',
        url: 'https://tubitak.gov.tr/sites/default/files/2026-09/proje_yazma_sablonu_2026-2027.docx',
      },
      {
        label: 'Ön değerlendirme kriterleri',
        url: 'https://tubitak.gov.tr/sites/default/files/2025-11/on_degerlendirme_kriterleri_2025_web.pdf',
      },
      {
        label: 'MEB Araştırma Uygulama İzinleri',
        url: 'https://arastirmaizinleri.meb.gov.tr/',
      },
    ],
    focus:
      'Lise düzeyinde, bölge ve final aşamalı genel araştırma projesi. Ana alan ve tematik alan birlikte belirtilir.',
  },
  '2204-B': {
    id: '2204-B',
    name: 'Ortaokul Öğrencileri Araştırma Projeleri Yarışması',
    audience: 'Ortaokul',
    summary:
      'Ortaokul öğrencileri için TÜBİTAK BİDEB yarışması. 12 bölgede düzenlenir; bölge birincileri finale katılır.',
    mainAreas: [
      'Biyoloji',
      'Coğrafya',
      'Değerler Eğitimi',
      'Fizik',
      'Kimya',
      'Matematik',
      'Tarih',
      'Teknolojik Tasarım',
      'Türkçe',
      'Yazılım',
    ],
    mainAreaLabel: 'Ana alan',
    subAreaLabel: 'Tematik alan',
    subAreaOptions: B_THEMES,
    subAreaHint: 'Proje, ana alanın yanında tematik alanlardan birini kapsamalıdır.',
    stages: [
      {
        title: 'Ön değerlendirme',
        text: 'Başvurular önce şekil, sonra bilimsel ölçütlere göre değerlendirilir.',
      },
      {
        title: 'Bölge aşaması',
        text: 'Başarılı projeler bölge sergisine çağrılır. Jüriye en fazla 10 dakikalık sözlü sunum yapılır; danışman sunuma ve sorulara müdahale etmez.',
      },
      {
        title: 'Final aşaması',
        text: 'Bölge birincileri finale katılır ve en fazla 10 dakikalık sözlü sunum yapar.',
      },
    ],
    awards: 'Final aşamasında ulusal birincilik, ikincilik ve üçüncülük ödülleri verilebilir.',
    limitsVerified: true,
    dataNote:
      'Alan listeleri 2204-B 2027 proje rehberinden alındı (Karbon Ayak İzi, Kuantum Teknolojileri, Kutup Keşfi ve Araştırmaları, Somut ve Somut Olmayan Kültürel Miras eklendi).',
    links: [
      {
        label: '2204-B Proje Rehberi (2027)',
        url: 'https://tubitak.gov.tr/sites/default/files/2026-09/ortaokul_proje_rehberi_2027.pdf',
      },
      {
        label: '2204-B yarışma sayfası',
        url: 'https://tubitak.gov.tr/tr/yarismalar/2204-b-ortaokul-ogrencileri-arastirma-projeleri-yarismasi',
      },
    ],
    focus:
      'Ortaokul düzeyinde araştırma projesi. Dil sade ve anlaşılır olmalı, deney ve gözlemler ortaokul düzeyine uygun tasarlanmalı.',
  },
  '2204-C': {
    id: '2204-C',
    name: 'Lise Öğrencileri Kutup Araştırma Projeleri Yarışması',
    audience: 'Lise',
    summary:
      'Öğrencileri Antarktika ve Arktik bölgelerde kutup bilimleri konusunda araştırmaya teşvik eden, TEKNOFEST kapsamında düzenlenen yarışma. Türkiye ve KKTC’de öğrenim gören lise öğrencileri katılabilir.',
    mainAreas: ['Canlı Bilimleri', 'Fiziki Bilimler', 'Sosyal ve Beşeri Bilimler', 'Yer Bilimleri'],
    mainAreaLabel: 'Ana alan',
    subAreaLabel: 'Alt alan',
    subAreaOptions: [],
    subAreaHint:
      'Proje, ana alanın altındaki alt alanlardan birini kapsamalıdır. Alt alan listesi yarışma şartnamesinde yer alır, buraya şartnamedeki adı yazın.',
    stages: TEKNOFEST_STAGES,
    awards:
      '2026’da her ana alanda 1 birincilik, 1 ikincilik ve 1 üçüncülük verildi (toplam 12 proje).',
    limitsVerified: false,
    dataNote:
      '2204-C için yalnızca duyurular ve ana alanlar doğrulandı. Sayfa, özet ve kelime sınırları A/B şablonundan alındı. Güncel şartnameyi ve proje rehberini kontrol edin.',
    links: [
      {
        label: '2204-C yarışma sayfası (TÜBİTAK)',
        url: 'https://tubitak.gov.tr/tr/yarismalar/2204-c-lise-ogrencileri-kutup-arastirma-projeleri-yarismasi',
      },
      {
        label: 'TEKNOFEST yarışma sayfası ve şartname',
        url: 'https://www.teknofest.org/tr/yarismalar/lise-ogrencileri-kutup-arastirma-projeleri-yarismasi/',
      },
      {
        label: 'Proje rehberi (2023, eski sürüm)',
        url: 'https://tubitak.gov.tr/sites/default/files/2750/kutup_proje_rehberi_2023_14.10.2022.pdf',
      },
    ],
    focus:
      'Kutup bilimleri (Antarktika ve Arktik) odaklı lise projesi. Konunun kutup bölgeleriyle ve seçilen ana alan/alt alanla ilişkisi açık olmalı.',
  },
  '2204-D': {
    id: '2204-D',
    name: 'Lise Öğrencileri İklim Değişikliği Araştırma Projeleri Yarışması',
    audience: 'Lise',
    summary:
      'Öğrencilerin iklim değişikliği farkındalığını artırmayı, doğal kaynakların sürdürülebilir kullanımı ve olumsuz etkilere çözüm üretmeyi teşvik eden, TEKNOFEST kapsamındaki yarışma.',
    mainAreas: [
      'Çevre',
      'Ekonomik Sektörler',
      'Hava ve İklim',
      'Su Araştırmaları',
      'Sürdürülebilirlik ve Refah',
      'Toplumsal Farkındalık',
    ],
    mainAreaLabel: 'Ana alan',
    subAreaLabel: 'Alt alan',
    subAreaOptions: [],
    subAreaHint:
      '2026’da yarışma 6 ana alan ve 22 alt alanda yapıldı. Alt alan adını yarışma şartnamesinden seçip buraya yazın.',
    stages: TEKNOFEST_STAGES,
    awards:
      '2026’da her ana alanda 1 birincilik, 1 ikincilik ve 1 üçüncülük verildi (toplam 18 proje).',
    limitsVerified: false,
    dataNote:
      '2204-D için duyurular ve ana alanlar doğrulandı. 22 alt alanın listesi ve rapor sınırları doğrulanamadı. Güncel şartnameyi kontrol edin.',
    links: [
      {
        label: '2204-D yarışma sayfası (TÜBİTAK)',
        url: 'https://tubitak.gov.tr/tr/yarismalar/2204-d-lise-ogrencileri-iklim-degisikligi-arastirma-projeleri-yarismasi',
      },
      {
        label: 'TEKNOFEST yarışma sayfası ve şartname',
        url: 'https://www.teknofest.org/tr/yarismalar/lise-ogrencileri-iklim-degisikligi-arastirma-projeleri-yarismasi/',
      },
      {
        label: 'Proje rehberi (2023, eski sürüm)',
        url: 'https://tubitak.gov.tr/sites/default/files/2750/iklim_proje_rehberi_2023_14.10.2022.pdf',
      },
    ],
    focus:
      'İklim değişikliği odaklı lise projesi. Konunun iklim değişikliğiyle (neden, etki veya çözüm) ilişkisi açık olmalı.',
  },
};

export const PROGRAM_LIST: Program[] = [
  PROGRAMS['2204-A'],
  PROGRAMS['2204-B'],
  PROGRAMS['2204-C'],
  PROGRAMS['2204-D'],
];
