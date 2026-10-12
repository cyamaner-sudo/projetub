# 2204 Proje Asistanı

TÜBİTAK 2204-A, B, C ve D proje raporlarını yazmak için adım adım rehber: bölüm rehberleri, canlı kontroller
(başlık/özet/anahtar kelime sınırları, sayfa tahmini, atıf–kaynakça eşleşmesi, etik listesi), APA 7 kaynakça
biçimlendirici, iş-zaman çizelgesi, Word çıktısı (Times New Roman 12, A4, 2,5 cm, tek aralık, iki yana yaslı) ve PDF için yazdırma.

## Çalıştırma

```
npm install
npm run dev        # geliştirme
npm run build      # üretim derlemesi (dist/)
npm test           # mantık katmanı testleri
```

Tailwind, `index.html` içinden CDN ile yüklenir (internet gerekir).

## YZ koçu (isteğe bağlı)

Ayarlar'a Gemini API anahtarınızı girin. Anahtar yalnızca tarayıcının localStorage'ında durur.
Koç raporu yazmaz; eleştiri, soru ve arama stratejisi verir, kaynak uydurmaz.

## Veri notları

- Sınırlar (15 kelime başlık, 150–250 kelime özet, 5 anahtar kelime, 20 sayfa) 2204-A 2026-2027 çağrı metni ve 2204-B rehberinden alındı.
  2204-C ve D için ayrıca doğrulanmadı; başvurmadan önce güncel rehberi kontrol edin.
- 2204-A verileri 2027 rehberi ve 2026-2027 çağrı metnine dayanır (23 Eylül 2026). Proje yazım şablonu .docx içeriği okunamadığı için rapor başlıkları önceki şablona dayanır.
- 2204-D alt alan listesi doğrulanmadı.

## 2026-2027 yazım şablonu uyumu

Rapor yapısı TÜBİTAK 2204 "Proje Yazım Şablonu 2026-2027" dosyasına göre düzenlendi: Yapay Zeka Araçları Kullanım Beyanı,
Özet, Anahtar Kelimeler, Amaç, Giriş, Yöntem, İş-Zaman Çizelgesi (aylı), Bulgular, Sonuç ve Tartışma, Öneriler, Kaynaklar, Ekler.

## Taslak yazımı

"Fikir ve taslak" adımında proje fikrinizi (ve varsa gerçek verilerinizi) yazıp tek tıkla bölüm taslakları oluşturabilirsiniz.
Yapay zekâ kaynak, veri veya sonuç uydurmaz; bilmediği yerlere [DOLDUR: ...] koyar. Yer tutucular doldurulmadan Genel kontrol hata verir.
Kullanım, "YZ Kullanım Beyanı" adımına otomatik yazılır.

## GitHub Pages ile web sitesi yapma

1. GitHub'da yeni bir depo oluşturun ve bu klasörün içeriğini `main` dalına yükleyin.
2. Depoda Settings > Pages > Build and deployment > Source: **GitHub Actions** seçin.
3. `main` dalına her yükleme yaptığınızda `.github/workflows/deploy.yml` siteyi derleyip yayınlar.
   Adres: `https://KULLANICI-ADI.github.io/DEPO-ADI/`
