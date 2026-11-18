#!/usr/bin/env python3
"""Sayfalardaki CSS/JS bağlantılarına sürüm numarası (?v=...) yazar.

Tarayıcılar ve GitHub Pages dosyaları önbellekte tutar; sürüm numarası değişince
yeni dosya hemen indirilir. Her yayından önce çalıştır:  python3 araclar/surum-guncelle.py
"""
import datetime, glob, os, re

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
surum = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M")
desen = re.compile(r'((?:src|href)="(?:\.\./|\{kok\})?(?:assets|data)/[^"?]+\.(?:js|css))(?:\?v=[0-9]+)?"')

dosyalar = glob.glob(os.path.join(KOK, "*.html")) + glob.glob(os.path.join(KOK, "makaleler", "*.html")) \
    + [os.path.join(KOK, "araclar", "makaleleri-olustur.py")]
degisen = 0
for yol in dosyalar:
    with open(yol, encoding="utf-8") as f:
        eski = f.read()
    yeni = desen.sub(lambda m: m.group(1) + '?v=' + surum + '"', eski)
    if yeni != eski:
        with open(yol, "w", encoding="utf-8") as f:
            f.write(yeni)
        degisen += 1
print("Sürüm", surum, "-", degisen, "dosya güncellendi.")
