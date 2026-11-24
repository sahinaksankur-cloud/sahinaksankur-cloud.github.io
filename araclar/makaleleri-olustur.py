#!/usr/bin/env python3
"""Makaleler bölümünü oluşturur.

makaleler/kaynak/*.md dosyalarını okuyup her makale için makaleler/<ad>.html
sayfasını ve kökteki makaleler.html liste sayfasını yazar.
Ek paket gerekmez:  python3 araclar/makaleleri-olustur.py

Kaynak dosya biçimi (üstte --- arasında bilgiler, altta metin):

    ---
    seri: dusunen-insan            # makaleler/seriler.json içindeki id
    no: 13
    baslik: Makalenin başlığı
    tarih: 2026-11-09
    ozet: Liste sayfasında ve Google'da görünen kısa açıklama.
    linkedin: https://www.linkedin.com/pulse/...   (isteğe bağlı)
    ders: calc1 | videoKimliği | Ders başlığı       (isteğe bağlı)
    ---

Metinde kullanılabilenler: ## başlık, ### ara başlık, boş satırla ayrılmış
paragraflar, > alıntı, - madde, 1. numaralı madde, **kalın**, *italik*,
[link metni](https://...).
"""
import html
import json
import re
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
KAYNAK = KOK / "makaleler" / "kaynak"
CIKTI = KOK / "makaleler"
SITE = "https://kuzeykampuscalculus.com"
AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
         "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]


def e(s):
    return html.escape(str(s), quote=True)


def tarih_yaz(t):
    y, a, g = (int(x) for x in t.split("-"))
    return f"{g} {AYLAR[a - 1]} {y}"


def satir_ici(s):
    s = e(s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
               lambda m: f'<a href="{m.group(2)}" target="_blank" rel="noopener">{m.group(1)}</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"<em>\1</em>", s)
    return s


def md_html(metin):
    out = []
    for blok in re.split(r"\n\s*\n", metin.strip()):
        satirlar = [s.rstrip() for s in blok.strip().split("\n")]
        ilk = satirlar[0]
        if ilk.startswith("### "):
            out.append(f"<h3>{satir_ici(ilk[4:])}</h3>")
        elif ilk.startswith("## "):
            out.append(f"<h2>{satir_ici(ilk[3:])}</h2>")
        elif all(s.startswith(">") for s in satirlar):
            ic = "<br>".join(satir_ici(s.lstrip("> ").strip()) for s in satirlar)
            out.append(f"<blockquote><p>{ic}</p></blockquote>")
        elif all(s.startswith("- ") for s in satirlar):
            out.append("<ul>" + "".join(f"<li>{satir_ici(s[2:])}</li>" for s in satirlar) + "</ul>")
        elif all(re.match(r"\d+\. ", s) for s in satirlar):
            out.append("<ol>" + "".join(f"<li>{satir_ici(s.split('. ', 1)[1])}</li>" for s in satirlar) + "</ol>")
        else:
            out.append(f"<p>{satir_ici(' '.join(satirlar))}</p>")
    return "\n".join(out)


def oku(yol):
    ham = yol.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", ham, re.S)
    if not m:
        raise SystemExit(f"{yol.name}: üstteki --- bilgileri bulunamadı")
    bilgi = {}
    for satir in m.group(1).splitlines():
        if ":" in satir:
            k, v = satir.split(":", 1)
            bilgi[k.strip()] = v.strip()
    for gerekli in ("seri", "no", "baslik", "tarih"):
        if not bilgi.get(gerekli):
            raise SystemExit(f"{yol.name}: '{gerekli}' eksik")
    bilgi["no"] = int(bilgi["no"])
    bilgi["dosya"] = f"{bilgi['seri']}-{bilgi['no']}.html"
    bilgi["govde"] = m.group(2)
    kelime = len(re.findall(r"\w+", m.group(2)))
    bilgi["dakika"] = max(1, round(kelime / 200))
    return bilgi


def sayfa(baslik, aciklama, yol, govde, kok="", aktif="makaleler", ek_head=""):
    nav = [("dersler.html", "Dersler", "dersler"), ("oyun.html", 'Testler', "oyun"), ("kampus.html", '<span class="nav-uzun">Kampüsün İçinden</span><span class="nav-kisa">Kampüs</span>', "kampus"), ("makaleler.html", "Makaleler", "makaleler"),
           ("iletisim.html", "Birebir Ders", "iletisim")]
    linkler = "\n        ".join(
        f'<a href="{kok}{h}"{" class=\"active\"" if k == aktif else ""}>{ad}</a>' for h, ad, k in nav)
    return f"""<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(baslik)}</title>
  <meta name="description" content="{e(aciklama)}">
  <link rel="canonical" href="{SITE}/{yol}">
  <meta property="og:title" content="{e(baslik)}">
  <meta property="og:description" content="{e(aciklama)}">
  <meta property="og:url" content="{SITE}/{yol}">
  <meta property="og:locale" content="tr_TR">
{ek_head}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{kok}assets/style.css?v=202611240619">
</head>
<body>
  <header class="topbar">
    <div class="wrap">
      <a class="brand" href="{kok}index.html">Kuzey <span>Kampüs</span></a>
      <nav class="nav">
        {linkler}
        <a data-yt href="#" target="_blank" rel="noopener" class="nav-yt">YouTube</a>
      </nav>
    </div>
  </header>

{govde}

  <footer>
    <div class="wrap">
      <span>© Kuzey Kampüs – Şahin Aksankur</span>
      <a href="{kok}iletisim.html">İletişim</a>
      <a data-yt href="#" target="_blank" rel="noopener">YouTube kanalı</a>
    </div>
  </footer>

  <script src="{kok}assets/config.js?v=202611240619"></script>
  <script src="{kok}assets/app.js?v=202611240619"></script>
  <script src="{kok}assets/canli-takvim.js?v=202611240619"></script>
  <!-- Ziyaretçi sayımı: GoatCounter (çerezsiz, kişisel veri yok; yerelde saymaz) -->
  <script data-goatcounter="https://kuzeykampus.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
"""


def yazi_sayfasi(y, seri, onceki, sonraki):
    ek = ""
    if y.get("ders"):
        parca = [p.strip() for p in y["ders"].split("|")]
        if len(parca) == 3:
            liste, vid, ad = parca
            ek += (f'\n      <aside class="related">\n        <span class="related-label">Bu makaleyle ilgili ders</span>\n'
                   f'        <a href="../ders.html?liste={e(liste)}#v={e(vid)}">{e(ad)} →</a>\n      </aside>')
    gezinti = ""
    if onceki or sonraki:
        sol = (f'<a class="pn prev" href="{onceki["dosya"]}"><span>← Önceki makale</span>'
               f'#{onceki["no"]} {e(onceki["baslik"])}</a>') if onceki else "<span></span>"
        sag = (f'<a class="pn next" href="{sonraki["dosya"]}"><span>Sonraki makale →</span>'
               f'#{sonraki["no"]} {e(sonraki["baslik"])}</a>') if sonraki else "<span></span>"
        gezinti = f'\n      <nav class="prevnext" aria-label="Serideki diğer makaleler">{sol}{sag}</nav>'
    kaynak = ""
    if y.get("linkedin"):
        kaynak = (f'\n      <p class="article-origin">Bu makale ilk olarak '
                  f'<a href="{e(y["linkedin"])}" target="_blank" rel="noopener">LinkedIn\'de</a> yayımlandı.</p>')

    govde = f"""  <main class="wrap">
    <article class="article">
      <header class="article-head">
        <a class="article-series" href="../makaleler.html#{e(seri['id'])}">{e(seri['ad'])} · #{y['no']}</a>
        <h1>{e(y['baslik'])}</h1>
        <p class="article-meta">{e(seri['yazar_ad'])} · <time datetime="{y['tarih']}">{tarih_yaz(y['tarih'])}</time> · {y['dakika']} dk okuma</p>
      </header>
      <div class="prose">
{md_html(y['govde'])}
      </div>{kaynak}
{ek}{gezinti}
    </article>
  </main>"""
    jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "Article",
        "headline": y["baslik"], "datePublished": y["tarih"],
        "author": {"@type": "Person", "name": seri["yazar_ad"]},
        "isPartOf": {"@type": "CreativeWorkSeries", "name": seri["ad"]},
    }, ensure_ascii=False)
    baslik = f"{seri['ad']} #{y['no']}: {y['baslik']} – {seri['yazar_ad']} | Kuzey Kampüs"
    return sayfa(baslik, y.get("ozet", ""), f"makaleler/{y['dosya']}", govde, kok="../",
                 ek_head=f'  <meta property="og:type" content="article">\n  <script type="application/ld+json">{jsonld}</script>\n')


def liste_sayfasi(yazarlar, seriler, yazilar):
    yazar_bloklari = []
    for a_i, a in enumerate(yazarlar):
        seri_bloklari = []
        toplam = 0
        for s in (s for s in seriler if s["yazar"] == a["id"]):
            ys = sorted((y for y in yazilar if y["seri"] == s["id"]), key=lambda y: y["no"])
            toplam += len(ys)
            maddeler = "\n".join(
                f'            <li><a href="makaleler/{y["dosya"]}"><span class="num">#{y["no"]}</span>'
                f'<span class="t">{e(y["baslik"])}</span>'
                f'<span class="d">{tarih_yaz(y["tarih"])} · {y["dakika"]} dk</span></a></li>' for y in ys)
            aciklama = f'\n          <p class="series-desc">{e(s["aciklama"])}</p>' if s.get("aciklama") else ""
            if ys:
                icerik = f"""\n          <ul class="series-list">\n{maddeler}\n          </ul>"""
                sayi = f"{len(ys)} makale"
            else:
                # Henüz makalesi olmayan seri: başlıklar gösterilmez, sadece seri görünür.
                icerik = '\n          <p class="series-empty">Bu serinin makaleleri yakında eklenecek.</p>'
                sayi = "Yakında"
            seri_bloklari.append(f"""        <details class="series" id="{e(s['id'])}"{' open' if not seri_bloklari else ''}>
          <summary><span class="series-name">{e(s['ad'])}</span><span class="series-count">{sayi}</span></summary>{aciklama}{icerik}
        </details>""")
        if not seri_bloklari:
            continue
        yazar_bloklari.append(f"""      <details class="author" id="{e(a['id'])}"{' open' if a_i == 0 else ''}>
        <summary><span class="author-name">{e(a['baslik'])}</span><span class="series-count">{len(seri_bloklari)} seri · {toplam} makale</span></summary>
        <div class="author-series">
{chr(10).join(seri_bloklari)}
        </div>
      </details>""")
    govde = f"""  <main class="wrap">
    <section class="hero">
      <h1>Makaleler</h1>
      <p>Matematik, bilim ve eğitim üzerine makaleler. Her seri kendi içinde sırayla okunabilir.</p>
    </section>
    <div class="series-wrap">
{chr(10).join(yazar_bloklari)}
    </div>
  </main>
  <script>
    // Adres #seri-adı ya da #yazar-adı ile açılırsa o bölümü ve üstündekileri aç.
    (function () {{
      var d = location.hash && document.getElementById(location.hash.slice(1));
      while (d) {{ if (d.tagName === "DETAILS") d.open = true; d = d.parentElement; }}
    }})();
  </script>"""
    return sayfa("Makaleler – Şahin Aksankur | Kuzey Kampüs",
                 "Şahin Aksankur'un matematik, bilim ve eğitim üzerine yazdığı makale dizileri.",
                 "makaleler.html", govde)


def main():
    seriler = json.loads((KOK / "makaleler" / "seriler.json").read_text(encoding="utf-8"))
    yazarlar = json.loads((KOK / "makaleler" / "yazarlar.json").read_text(encoding="utf-8"))
    yazar_map = {a["id"]: a for a in yazarlar}
    for s in seriler:
        if s.get("yazar") not in yazar_map:
            raise SystemExit(f"'{s['id']}' serisinin yazarı yazarlar.json'da yok")
        s["yazar_ad"] = yazar_map[s["yazar"]]["ad"]
    seri_map = {s["id"]: s for s in seriler}
    yazilar = [oku(p) for p in sorted(KAYNAK.glob("*.md"))]
    for y in yazilar:
        if y["seri"] not in seri_map:
            raise SystemExit(f"{y['dosya']}: '{y['seri']}' serisi seriler.json'da yok")
    for s in seriler:
        ys = sorted((y for y in yazilar if y["seri"] == s["id"]), key=lambda y: y["no"])
        for i, y in enumerate(ys):
            onceki = ys[i - 1] if i > 0 else None
            sonraki = ys[i + 1] if i + 1 < len(ys) else None
            (CIKTI / y["dosya"]).write_text(yazi_sayfasi(y, s, onceki, sonraki), encoding="utf-8")
    (KOK / "makaleler.html").write_text(liste_sayfasi(yazarlar, seriler, yazilar), encoding="utf-8")
    print(f"{len(yazilar)} makale oluşturuldu.")


if __name__ == "__main__":
    main()
