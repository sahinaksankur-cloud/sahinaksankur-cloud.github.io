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
- **Her yayından önce** `python3 araclar/surum-guncelle.py` çalıştır ve commit'e kat: sayfalardaki CSS/JS bağlantılarına (`assets/…`, `data/…`) `?v=<tarih-saat>` yazar. Yoksa tarayıcılar eski JS/CSS'i önbellekten getirir (yeni HTML + eski soru dosyası gibi karışık sürüm görünür). Yeni bir sayfa ya da script eklenirse bağlantısı da bu biçimde olmalı.
- **Sitede ücret, fiyat, ödeme ya da satış ifadesi olmamalı.** Site bilgi ve iletişim amaçlı.
- API anahtarı, parola gibi gizli bilgileri hiçbir dosyaya yazma.
- Geri alınması zor işlemlerden (geçmişi yeniden yazmak, dosya/dal silmek) önce kullanıcıdan onay al.
- Aynı anda birden fazla Claude oturumu bu depoda çalışabiliyor. İşe başlamadan `git fetch` yapıp
  `main`'deki ve diğer `claude/*` dallarındaki son değişikliklere bak; aynı dosyada çakışan iş varsa kullanıcıya sor.

## Yapı
Düz HTML/CSS/JS, derleme adımı yok. GitHub Pages, `main` dalından yayınlar (alan adı `CNAME`'de, `.nojekyll` var).

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Ana sayfa (özet): kısa kanal tanıtımı ve dört kutu — 📚 Dersler (sol üst; telefonda en üstte; ders bağlantıları ve video sayıları `#ana-dersler`, app.js `renderAnaDersler`), 🏛 Kampüsün İçinden, 🎮 Testler, ✍️ Makaleler ("Son yazı" bağlantısı elle yazılı: **yeni makale eklenince güncelle**); altta WhatsApp ve Birebir ders şeridi |
| `dersler.html` | Ders kartları (`#courses`, app.js `renderHome`): Calculus 1, 2, Çalışma Soruları ve "Yakında" kartı. Menüdeki "Dersler" buraya gider |
| `ders.html?liste=<id>` | Video oynatıcı, ders listesi, arama, PDF görüntüleyici. Tek videoya link: `ders.html?liste=calc1#v=<YouTube kimliği>` |
| `iletisim.html` | Bilgi alma formu (öğrencinin e-posta uygulamasını açar, veri saklanmaz) ve Duyurular (WhatsApp) kartı |
| `oyun.html` | Testler (menüde "Testler"; eski adı Calculus Oyunu). Üstte iki sekme: 🎓 Üniversite ve 📘 YKS (son açılan sekme cihazda hatırlanır; `#yks` linki YKS'yi açar). Üniversite'de dört test türü, her biri kendi renkli şeridinde (🧭 Calculus'a Hazır mısın? mor, 📝 Sınava Hazır mısın? lacivert, 🎯 Konu Turları yeşil, ⚡ Doğru / Yanlış turuncu). Kayıt yok; puanlar sadece öğrencinin cihazında (`localStorage`, anahtar `kk-oyun-v1`) |
| `kampus.html` | Kampüsün İçinden: ODTÜ, Boğaziçi, İTÜ kartları (sınav hazırlık ve öğrenci paylaşımları için), her kartta "📤 … sınavı gönder" düğmesi (`iletisim.html?konu=kampus-sinav&okul=odtu|bogazici|itu`: konu, okul ve mesaj kendiliğinden dolar; öğrenci dosyayı e-postaya ekler), "Bize yaz" ve "Okulumu ekleyin" kutuları (`?konu=kampus` / `?konu=kampus-okul`), resmî bağ olmadığı notu. Üniversite logosu kullanılmaz |
| `makaleler.html`, `makaleler/` | Makaleler; `araclar/makaleleri-olustur.py` ile üretilir (bkz. README) |
| `yazilar.html`, `yazilar/` | Eski adresler; makalelere yönlendirir |
| `assets/config.js` | Tüm ayarlar ve ders listesi |
| `assets/app.js`, `assets/style.css` | Site kodu ve görünüm |
| `assets/pdfjs/` | PDF.js (PDF'leri sayfa içinde, telefonda da göstermek için) |
| `data/videos.csv` | Tüm videolar ve PDF'leri |
| `data/sorular.js`, `data/dogru-yanlis.js`, `assets/oyun.js` | Oyunun soru bankası, Doğru/Yanlış ifadeleri ve kodu |
| `data/yks-sorular.js` | 📘 YKS sekmesinin konuları, soruları ve Doğru/Yanlış ifadeleri (`window.KK_YKS`) |
| `pdf/<liste>/` | Sitedeki PDF dosyaları |

### `assets/config.js` içindeki önemli ayarlar
- `dersler`: Sitedeki dersler. Şu an aktif: `calc1` (Calculus 1), `calc2` (Calculus 2), `calc1-soru` (Calculus Çalışma Soruları). `en-calc` "Yakında" olarak duruyor.
- `whatsappKanal`: WhatsApp duyuru kanalı linki. Boşsa sitedeki tüm kanal bağlantıları gizlenir.
- `pdfIndirme`: `false` yapılırsa PDF'lerin yanındaki "⬇ İndir" düğmesi kalkar.
- `whatsapp`: Birebir iletişim numarası. **Boş kalmalı** (kişisel numara gösterilmiyor).
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
- Soru bankası `data/sorular.js`: `ad` (oyunun adı), `konular` (konu turları, 10 soru), `bolumler` ("Sınava Hazır mısın?" chapter testleri, 5 soru), `sorular.<liste>`. Listeler: `precalculus`, `limit`, `turev`, `integral` (konu turları) ve `uygulama` (Chapter 6; sadece chapter testinde ve Karışık'ta). `karisik` tüm listeleri birleştirir.
- Soru biçimi: `{ b: "2.4", s: "soru (HTML)", c: ["DOĞRU", "yanlış", "yanlış"], a: "kısa açıklama" }`. `b`, Thomas'ın (geç transandantal baskı) alt bölümüdür: eˣ, ln, ters trigonometri Chapter 7'de (`"7"`), kısmi integrasyon ve genelleştirilmiş integral Chapter 8'de (`"8"`), lise ön bilgisi `"0"`. Yeni soru eklerken `b`'yi mutlaka doğru yaz. **İlk seçenek doğru cevaptır**, oyunda karıştırılır. Üç seçenek birbirinden farklı olmalı.
- Sayfa düzeni: 🧭 Calculus'a Hazır mısın? (`hazirlikTesti`, varsayılan `precalculus`; konu turlarında gösterilmez), 📝 Sınava Hazır mısın? (`bolumler`), 🎯 Konu Turları (`konular`, hazırlık testi hariç), ⚡ Doğru / Yanlış (Chapter 1–6 + Tüm chapter'lar). Seviye seçimi sayfanın üstünde değil, 🧭/📝/🎯 testine dokununca açılan pencerede sorulur (`seviyeSor`); seviyeye dokununca test başlar. ⚡'de pencere açılmaz.
- Seviyeler (`seviyeler`): Kolay 30 sn, Orta 20 sn, Zor 12 sn. Grafikli (`g`) ve parçalı fonksiyonlu (`class="parcali"`) sorulara her seviyede `ekSure` (5) sn eklenir. Sorular aynı, sadece süre değişir; seçilen seviye cihazda hatırlanır, en iyi skor konu+seviye için ayrı tutulur. Sayaç sağ üstte; son 5 sn (`uyari`) turuncu, son 3 sn (`kritik`) kırmızı yanıp söner. Süre dolarsa puan verilmez ve hemen sonraki soruya geçilir. Yanlış ve süresi dolan sorular, doğru cevap ve açıklamasıyla tur sonunda "Kaçırdığın sorular" listesinde gösterilir.
- "Sınava Hazır mısın?" (`bolumler`, Chapter 1–6): sadece `b`'si o chapter'a ait sorular gelir; 5 soru mümkünse farklı alt bölümlerden seçilir. Tüm modlarda daha önce görülmemiş sorulara öncelik verilir (`localStorage` → `gorulen`). Sonuç mesajları `bolumSonuc`. `oyun.html#bolum-2` gibi bir link seviye penceresini açar (konu turları için `#limit` vb.).
- **⚡ Doğru / Yanlış** (`data/dogru-yanlis.js`, `window.KK_DY`): kendi şeridinde Chapter 1–6 ve "Tüm chapter'lar" karışık turu. Turda `soruSayisi` (5) ifade, her biri `sure` (5) saniye; seviyelerden bağımsız. Sayaç `uyari` (4) sn'den turuncu, `kritik` (2) sn'den kırmızı. Doğru/Yanlış düğmeleri bilerek renksiz (yeşil/kırmızı sadece cevaptan sonra kartta yanar; basılan düğme mavi çerçeveyle işaretlenir). İfade biçimi: `{ b: "2.6", s: "ifade (HTML)", d: true/false, n: "yanlışsa doğrusu" }`. Chapter başına en az 20 ifade (1–6; Chapter 2'de 37). Her turda en az bir doğru ve bir yanlış ifade olur. Sonuçta "📝 5 Soruya geç" ile aynı chapter'ın testine geçilir (önce seviye sorulur). Link: `oyun.html#dy-2`, `#dy-tum`.
- **Grafikli sorular:** Soruya `g` alanı eklenirse `oyun.js` → `grafik()` soru metninin altına SVG grafik çizer (karanlık modda da uyumlu; tur sonundaki "Kaçırdığın sorular"da da görünür). Biçim: `g: { x: [min, max], y: [min, max], p: [{ f: "x*x/2", a: 0, b: 2 }], bos: [[2, 2]], dolu: [[2, 1]], harf: { a: 1, b: 3, c: 5 }, dikey: [2] }`. `p`: eğri parçaları (JavaScript ifadesi, `Math.sqrt` vb.; a ≤ x ≤ b), `bos`: boş daire, `dolu`: dolu nokta, `harf`: x eksenindeki harfli noktalar (kesikli çizgiyle), `dikey`: dikey asimptot, `ek: [{ f, a, b, k: true }]`: kesen/teğet gibi turuncu yardımcı doğrular (`k`: kesikli; grafik alanında kırpılır), `yazi: [[x, y, "P"]]`: nokta adı. Her soru kendi grafiğini kullanır (aynı grafik birden fazla soruda tekrar edilmez); harfli sorularda doğru cevap hep aynı harf olmasın. Eklemeden önce boş/dolu noktaların eğri üstünde olduğunu ve sol/sağ limitlerle f değerini hesapla. Görülen sorular grafikli sorularda metin + grafikle ayırt edilir (`anahtar()`).
- **Kesir daireleri:** `g: { pasta: [{ n: 8, k: 3 }, { n: 4, k: 1 }] }` → her daire n eşit parçaya bölünür, ilk k parça turuncu boyanır (`oyun.js` → `pastaCiz()`); grafikli soru sayıldığı için +5 sn ek süre alır.
- **Üst üste kesir:** `<span class="kesir"><span>1</span><span>2</span></span>` (style.css `.kesir`). YKS İşlem Yeteneği'nin bölme ve merdiven kesir sorularında kullanılır (`/` ile `÷` karışmasın); diğer sorularda kesirler `2/7` biçiminde yazılır. Merdiven kesir: `class="kesir buyuk"` (ana çizgi uzun ve kalın; içine kesir ve işlem yazılabilir). `<span class="nw">−½</span>` eksiyi kesirden ayırmaz.
- **Parçalı fonksiyonlar** süslü parantezle alt alta yazılır: `<span class="parcali"><span>f(x) =</span><span class="sus">{</span><span class="satirlar"><span>x + 1,</span><span>x &lt; 1</span><span>3x − 1,</span><span>x ≥ 1</span></span></span>` ve soru cümlesi hemen arkasından gelir (fonksiyon kendi satırında durur, soru altında).
- **📘 YKS** (`data/yks-sorular.js`): `konular` (`id` "yks-" ile başlar; `ad`, `ust` üst başlık, `sinav` TYT/AYT, `sinif` 9–12), `sorular.<id>` (Üniversite ile aynı soru biçimi, `b` gerekmez), `dogruYanlis` (`k`: konu id). Sadece `konular` listesindeki konuların soruları ve Doğru/Yanlış ifadeleri oyunda görünür: listede olmayan bir id ile yazılan sorular (ör. `yks-koklu`) dosyada bekler, konu satırı eklenince açılır. `oyun.js` bunları `O.konular`/`O.sorular`'a `grup: "yks"` ile ekler; Üniversite turlarına (Karışık, chapter testleri, Doğru/Yanlış "Tüm chapter'lar") karışmaz. YKS sekmesinde şu an 📝 Konu Testi (10 soru, seviye penceresiyle) ve ⚡ Doğru/Yanlış (`#dy-yks`, tüm YKS ifadeleri). Link: `oyun.html#yks-rakam`. Soru yazma ilkeleri: kalıp/ezber değil anlama; tanımlar kalır; şıklar kısa ve eşit uzunlukta; ÖSYM soruları kopyalanmaz.
- **Puan ve soru sırası (her iki sekme):** Cevaplar cihazda `kk-oyun-v1` → `cevap[anahtar] = [1 çözüldü | 0 çözülemedi, tur no]` (Doğru/Yanlış ifadeleri de kaydedilir ama puana sayılmaz). Seçim sırası: önce hiç görülmemiş sorular; bitince çözülemeyenler (en eski denenen önce, böylece yine çözülemeyen bir sonraki tura kalır); hepsi çözülünce çözülenler. Her soru sadece ilk doğru çözümünde 1 puan getirir (seviyeden bağımsız); tekrar çözülünce "puan yok" yazar. Toplam puan = çözülen soru sayısı; kartlarda "Puan: x / n", sayfa altında Üniversite ve YKS toplamı. Tur başındaki "Doğru:" sayacı sadece o turun doğru sayısıdır.
- **⭐ Tam doğru bonusu** (`data/sorular.js` → `tamBonus`): 10 soruluk testlerde (konu turları, hazırlık testi, YKS konu testi; 5 soruluk chapter testleri ve Doğru/Yanlış hariç) tüm sorular doğruysa Kolay +1, Orta +2, Zor +1 + soru başına ortalama erken bitirilen saniye (yuvarlanır). Bonus, turda puan getiren en az bir soru varsa eklenir (`kk-oyun-v1` → `bonus["konu:seviye"]` birikir); konunun tüm soruları çözülmüşse kutlama gösterilir ama bonus eklenmez. Toplam puan = çözülen soru + bonus ("YKS toplam puanın: 12 (10 / 147 soru + 2 bonus)"); kartlarda "⭐ Bonus: +n". Kutlama penceresi `kutla()` (havai fişek canvas'ı; "hareketi azalt" açıksa animasyon yok).
- **Sesler** (`oyun.js`, Web Audio; ses dosyası yok): son `kritik` saniyelerde her saniye tıkırtı, süre dolunca sayfa çevirme sesi, kutlamada kısa melodi. Test ekranının üstündeki 🔊/🔇 düğmesi (`.ses-dugme`) sesi açar/kapatır; seçim `kk-oyun-v1` → `ses`. Varsayılan açık.
- Konu alanları: `etiket` (kartta rozet), `ders` (tur sonundaki "Konu anlatımını izle" linki), `sonuc` (puana göre mesaj: `iyi` ≥ %80, `orta` ≥ %50, `zayif`). Hepsi isteğe bağlı.
- Yeni konu eklemek kod değişikliği gerektirmez: `konular`'a bir satır ve aynı id ile bir soru listesi eklenir.
- Matematik HTML ile yazılır (`<sup>`, `<sub>`, `−`). `∫<sub>a</sub><sup>b</sup>` ve `Σ<sub>..</sub><sup>..</sup>` sınırları `oyun.js` içindeki `bicim()` ile otomatik olarak alt alta gösterilir. Soruların matematiğini mutlaka kontrol et; site sahibinin adıyla yayınlanıyor.
- Menü sırası (Dersler → `dersler.html`): Kampüsün İçinden/Kampüs, Dersler, Testler, Makaleler, Birebir Ders, YouTube. Uzun adlar (`.nav-uzun`) 840 px'ten genişte, kısa adlar (`.nav-kisa`) 840 px ve altında görünür. 700 px ve altında menüdeki YouTube gizlenir (`.nav-yt`). Menü 350–1300 px arasında tek satıra sığıyor; yeni menü öğesi eklerken tüm genişliklerde dene.
- Menü tüm sayfalarda elle yazılı (index, dersler, ders, iletisim, oyun, kampus); makale sayfaları `araclar/makaleleri-olustur.py` ile üretilir, menü listesi o dosyada. Menüyü değiştirince betiği çalıştır.

## Kullanıcıya dosya gönderirken (Mac)
- Mac'in Archive Utility'si buradan gönderilen zip'leri açamıyor ("Error 0"); Terminal'de `unzip` çalışıyor.
- Gönderilen dosyalar Mac'te `~/Desktop/Claude Works` klasörüne iner ve büyük dosyalar yavaş iner. İnmeden açılırsa bozuk görünür. Dosyaları ≤45 MB parçalara böl, beklenen bayt boyutlarını karşılaştıran bir Terminal komutu ver, hepsi tamam olunca açtır.
- Dosya adlarında Türkçe karakter ve uzun tire kullanma.

## Kontrol
Değişiklikten sonra siteyi yerelde aç (`python3 -m http.server`) ve Playwright ile ana sayfa, bir ders sayfası (PDF'li ve PDF'siz) ve telefon görünümünü dene; JavaScript hatası ve yatay taşma olmasın.
