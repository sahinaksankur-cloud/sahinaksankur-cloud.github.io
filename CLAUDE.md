# Kuzey Kampüs sitesi – Claude için çalışma notları

Bu dosya sitenin **şu anki** durumunu ve bu depoda çalışırken uyulacak kuralları anlatır.
Yalnızca yapılmış ve yayında olan şeyler yazılır; plan ve fikir yazılmaz (depo herkese açık).
Siteye kalıcı bir değişiklik yaptığında bu dosyayı da güncelle.

Site sahibinin ayrıca verdiği talimat dosyaları varsa onlar bu dosyadan önce gelir.

## Kurallar
- Kullanıcıyla **Türkçe** konuş. Teknik adımları tek tek, sade anlat.
- **Kişisel e-posta adresi hiçbir yerde görünmemeli** (kod, sayfa, commit). Commit kimliği her zaman:
  `sahinaksankur-cloud <356609707+sahinaksankur-cloud@users.noreply.github.com>`.
  Oturum başında `git config user.email` değerini kontrol et; göndermeden önce `git log` ile yazarı doğrula.
- `main`'e GitHub'ın "Merge" düğmesiyle birleştirme yapma (GitHub kendi yazar bilgisini kullanabilir).
  Yerelde fast-forward edip `git push origin HEAD:main` ile gönder; önce `git fetch` ile `main`'in ilerlemediğini kontrol et.
- **Sitede ücret, fiyat, ödeme ya da satış ifadesi olmamalı.** Site bilgi ve iletişim amaçlı.
- API anahtarı, parola gibi gizli bilgileri hiçbir dosyaya yazma.
- Geri alınması zor işlemlerden (geçmişi yeniden yazmak, dosya/dal silmek) önce kullanıcıdan onay al.
- Aynı anda birden fazla Claude oturumu bu depoda çalışabiliyor. İşe başlamadan `git fetch` yapıp
  `main`'deki ve diğer `claude/*` dallarındaki son değişikliklere bak; aynı dosyada çakışan iş varsa kullanıcıya sor.

## Yapı
Düz HTML/CSS/JS, derleme adımı yok. GitHub Pages, `main` dalından yayınlar (alan adı `CNAME`'de, `.nojekyll` var).

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Ana sayfa: Calculus Oyunu kutusu (giriş metninin hemen altında), ders kartları, WhatsApp kanalı kutusu, birebir ders bilgi kutusu |
| `ders.html?liste=<id>` | Video oynatıcı, ders listesi, arama, PDF görüntüleyici. Tek videoya link: `ders.html?liste=calc1#v=<YouTube kimliği>` |
| `iletisim.html` | Bilgi alma formu (öğrencinin e-posta uygulamasını açar, veri saklanmaz) ve Duyurular (WhatsApp) kartı |
| `oyun.html` | Calculus Oyunu: konu seç, rastgele 10 soru, 3 seçenek, doğru cevap 1 puan. Kayıt yok; puanlar sadece öğrencinin cihazında (`localStorage`, anahtar `kk-oyun-v1`) |
| `makaleler.html`, `makaleler/` | Makaleler; `araclar/makaleleri-olustur.py` ile üretilir (bkz. README) |
| `topluluk.html` | Telegram topluluğu sayfası; `config.js` → `topluluk.grup` boş olduğu için gizli |
| `yazilar.html`, `yazilar/` | Eski adresler; makalelere yönlendirir |
| `assets/config.js` | Tüm ayarlar ve ders listesi |
| `assets/app.js`, `assets/style.css` | Site kodu ve görünüm |
| `assets/pdfjs/` | PDF.js (PDF'leri sayfa içinde, telefonda da göstermek için) |
| `data/videos.csv` | Tüm videolar ve PDF'leri |
| `data/sorular.js`, `assets/oyun.js` | Oyunun soru bankası ve kodu |
| `pdf/<liste>/` | Sitedeki PDF dosyaları |

### `assets/config.js` içindeki önemli ayarlar
- `dersler`: Sitedeki dersler. Şu an aktif: `calc1` (Calculus 1), `calc2` (Calculus 2), `calc1-soru` (Calculus Çalışma Soruları). `en-calc` "Yakında" olarak duruyor.
- `whatsappKanal`: WhatsApp duyuru kanalı linki. Boşsa sitedeki tüm kanal bağlantıları gizlenir.
- `pdfIndirme`: `false` yapılırsa PDF'lerin yanındaki "⬇ İndir" düğmesi kalkar.
- `whatsapp`: Birebir iletişim numarası. **Boş kalmalı** (kişisel numara gösterilmiyor).
- `topluluk`: Telegram grubu ve başlık linkleri. Boşken ilgili her şey gizli.
- `sheetCsvUrl`: Doluysa video listesi `data/videos.csv` yerine bu Google E-Tablo'dan okunur. Şu an boş.

### `data/videos.csv`
- Sütunlar: `liste,sira,baslik,video,pdf`. Satır sonları **CRLF**; düzenlerken koru.
- `pdf` biçimi: `Boş PDF=pdf/calc1/039-bos.pdf | Çözümlü PDF=pdf/calc1/039-cozumlu.pdf`. Etiket `=` işaretinden önce yazılır, birden fazla PDF `|` ile ayrılır. Boş bırakılırsa sitede "PDF'i yakında eklenecek" yazar.
- PDF dosya adları: `pdf/<liste>/<sıra 3 hane>-<bos|cozumlu|pdf>.pdf`. Bölüm 2 çalışma sorularının 17 dersi ortak `pdf/calc1-soru/limit-calisma-sorulari.pdf` dosyasını kullanır.
- İçerik: `calc1` 110 video, `calc2` 42 video, `calc1-soru` 93 video.

## PDF'ler
- Tüm PDF'ler sitenin içinde (`pdf/`). Sitede Google Drive linki kalmadı.
- Her PDF'te üç şey var; yeni PDF eklerken aynısını yap:
  1. Her sayfanın altında ortalı, gri, küçük: `© Kuzey Kampüs · kuzeykampuscalculus.com` (pypdf + reportlab, DejaVu Sans, 6,5–9 punto).
  2. Sonda "Bu notlar bir kitaba dönüşüyor" sayfası. Mevcut bir site PDF'inin son sayfasından kopyalanır.
  3. Ghostscript ile sıkıştırma: `gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.6 -dPDFSETTINGS=/ebook`.
- Ghostscript yavaştır; çok dosyada işleri paralel çalıştır, uzun işi arka planda yürüt ve **yarım kalmış dosyaları commit etme**. Sonra her dosyada sayfa sayısını, telif notunu ve kitap sayfasını kontrol et.
- YouTube video açıklamalarındaki PDF linkleri hâlâ Google Drive'daki **eski** dosyalara gidiyor. Bu Drive dosyaları **silinmemeli**.

## Oyun
- Soru bankası `data/sorular.js`: `ad` (oyunun adı, sayfa başlığı buradan gelir), `konular` (id, ad, açıklama), `sorular.<id>` listeleri. Şu an `limit`, `turev` ve `integral`, 60'ar soru; `karisik` tüm konuları birleştirir.
- Soru biçimi: `{ s: "soru (HTML)", c: ["DOĞRU", "yanlış", "yanlış"], a: "kısa açıklama" }`. **İlk seçenek doğru cevaptır**, oyunda karıştırılır. Üç seçenek birbirinden farklı olmalı.
- Seviyeler (`seviyeler`): Kolay 20 sn, Orta 15 sn, Zor 10 sn. Sorular aynı, sadece süre değişir; seçilen seviye cihazda hatırlanır, en iyi skor konu+seviye için ayrı tutulur. Sayaç sağ üstte; son 5 sn (`uyari`) turuncu, son 3 sn (`kritik`) kırmızı yanıp söner. Süre dolarsa puan verilmez ve hemen sonraki soruya geçilir. Yanlış ve süresi dolan sorular, doğru cevap ve açıklamasıyla tur sonunda "Kaçırdığın sorular" listesinde gösterilir.
- Yeni konu eklemek kod değişikliği gerektirmez: `konular`'a bir satır ve aynı id ile bir soru listesi eklenir.
- Matematik HTML ile yazılır (`<sup>`, `<sub>`, `−`). `∫<sub>a</sub><sup>b</sup>` ve `Σ<sub>..</sub><sup>..</sup>` sınırları `oyun.js` içindeki `bicim()` ile otomatik olarak alt alta gösterilir. Soruların matematiğini mutlaka kontrol et; site sahibinin adıyla yayınlanıyor.
- Menüde oyun sekmesi tüm sayfalarda var: geniş ekranda "Calculus Oyunu", 760 px ve altında "Oyun" yazar (`.nav-uzun` / `.nav-kisa`); telefonda menünün sığması için kısa ad gerekli (makale sayfaları `araclar/makaleleri-olustur.py` ile üretilir; menü listesi o dosyada).

## Kullanıcıya dosya gönderirken (Mac)
- Mac'in Archive Utility'si buradan gönderilen zip'leri açamıyor ("Error 0"); Terminal'de `unzip` çalışıyor.
- Gönderilen dosyalar Mac'te `~/Desktop/Claude Works` klasörüne iner ve büyük dosyalar yavaş iner. İnmeden açılırsa bozuk görünür. Dosyaları ≤45 MB parçalara böl, beklenen bayt boyutlarını karşılaştıran bir Terminal komutu ver, hepsi tamam olunca açtır.
- Dosya adlarında Türkçe karakter ve uzun tire kullanma.

## Kontrol
Değişiklikten sonra siteyi yerelde aç (`python3 -m http.server`) ve Playwright ile ana sayfa, bir ders sayfası (PDF'li ve PDF'siz) ve telefon görünümünü dene; JavaScript hatası ve yatay taşma olmasın.
