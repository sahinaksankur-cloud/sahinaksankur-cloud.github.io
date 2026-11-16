# Kuzey Kampüs – web sitesi

Kuzey Kampüs – ders videoları, çalışma PDF'leri ve makaleler.

## Videolar ve PDF'ler nasıl eklenir?

Tüm videolar `data/videos.csv` dosyasında (ileride bir Google E-Tablo'da) tutulur:

| Sütun | Açıklama |
|---|---|
| `liste` | Dersin kimliği (`calc1`, `calc2`, `calc1-soru`, `en-calc`) |
| `sira` | Videonun ders içindeki sırası |
| `baslik` | Sitede görünen başlık |
| `video` | YouTube linki ya da video kimliği |
| `pdf` | Sitedeki PDF dosyasının yolu (`pdf/` klasörü). Ad vermek için `Boş PDF=yol` yazın. Birden fazlaysa aralarına `\|` koyun: `Boş PDF=pdf/calc1/039-bos.pdf \| Çözümlü PDF=pdf/calc1/039-cozumlu.pdf`. Boş bırakılabilir. |

Dersler ve genel ayarlar `assets/config.js` dosyasındadır.

## Makaleler nasıl eklenir?

1. `makaleler/kaynak/` klasörüne yeni bir `.md` dosyası ekleyin (örnek: `dusunen-insan-13.md`). Dosyanın üstündeki `---` arasındaki bilgiler seri, numara, başlık, tarih, kısa özet, LinkedIn linki ve ilgili derstir.
2. Yeni bir seri gerekiyorsa `makaleler/seriler.json` dosyasına ekleyin.
3. `python3 araclar/makaleleri-olustur.py` komutunu çalıştırın. Her makalenin sayfası (`makaleler/<seri>-<no>.html`) ve liste sayfası (`makaleler.html`) yeniden oluşturulur. Ek bir paket gerekmez.

## Telegram topluluğu nasıl açılır?

`assets/config.js` dosyasındaki `topluluk` bölümüne grubun linkini (`grup`) ve varsa konu başlıklarının linklerini (`basliklar`) yazın. `grup` doluysa menüde Topluluk sayfası görünür, ders sayfalarında "Toplulukta sor" kutusu ve makalelerin sonunda "Toplulukta tartış" linki açılır. Boşsa hepsi gizli kalır.
