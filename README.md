# Kuzey Kampüs – web sitesi

Kuzey Kampüs – ders videoları, çalışma PDF'leri ve makaleler.

## Videolar ve PDF'ler nasıl eklenir?

Tüm videolar `data/videos.csv` dosyasında (ileride bir Google E-Tablo'da) tutulur:

| Sütun | Açıklama |
|---|---|
| `liste` | Dersin kimliği (`calc1`, `calc2`, `en-calc`) |
| `sira` | Videonun ders içindeki sırası |
| `baslik` | Sitede görünen başlık |
| `video` | YouTube linki ya da video kimliği |
| `pdf` | Google Drive PDF linki. Ad vermek için `Boş PDF=link` yazın. Birden fazlaysa aralarına `\|` koyun: `Boş PDF=link1 \| Çözümlü PDF=link2`. Boş bırakılabilir. |

Dersler ve genel ayarlar `assets/config.js` dosyasındadır.
