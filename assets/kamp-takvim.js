// Kuzey Kampüs – 🏕 Ders Çalışma Kampları takvimi (assets/config.js → kamplar).
// Saatler Türkiye saatidir (UTC+3, yaz saati yok). Sunucu yok: kampın hangi derste/molada olduğunu her cihaz saatten hesaplar.
// Ana sayfadaki şeridi ([data-kamp-serit]) de bu dosya çizer; kamp.html bu hesapları window.KK_KAMP ile kullanır.
(function () {
  "use strict";
  var CFG = (window.KK_CONFIG && window.KK_CONFIG.kamplar) || null;
  if (!CFG) return;
  var TR = 3 * 3600e3, GUN = 86400e3, DK = 60e3;
  var DUZEN = CFG.duzen || [[50, 10], [50, 10], [40, 20], [50, 10], [50, 0]];

  function gunAnahtar(ms) { return new Date(ms + TR).toISOString().slice(0, 10); }
  function gunBasi(anahtar) { return Date.parse(anahtar + "T00:00:00Z") - TR; }
  function iptalMi(gun, saat) {
    return (CFG.iptal || []).some(function (x) { x = String(x).trim(); return x === gun || x === gun + " " + saat; });
  }
  // Bir kampın o günkü hâli: ders ve mola blokları (ms)
  function kur(k, gun) {
    var hm = k.bas.split(":"), t = gunBasi(gun) + (+hm[0]) * 3600e3 + (+hm[1]) * DK, bloklar = [], ders = 0;
    var bas = t;
    DUZEN.forEach(function (d, i) {
      bloklar.push({ tur: "ders", no: i + 1, bas: t, bit: t + d[0] * DK, dk: d[0] }); t += d[0] * DK; ders += d[0];
      if (d[1] && i < DUZEN.length - 1) { bloklar.push({ tur: "mola", no: i + 1, bas: t, bit: t + d[1] * DK, dk: d[1], uzun: d[1] >= 20 }); t += d[1] * DK; }
    });
    return { id: k.id, ad: k.ad, ikon: k.ikon || "🏕", not: k.not || "", saat: k.bas, gun: gun, bas: bas, bit: t,
      bitSaat: saatYaz(t), bloklar: bloklar, dersDk: ders, dersSayisi: DUZEN.length, anahtar: gun + " " + k.id };
  }
  function saatYaz(ms) { return new Date(ms + TR).toISOString().slice(11, 16); }
  function gunun(gun) {
    return (CFG.liste || []).filter(function (k) { return !iptalMi(gun, k.bas); })
      .map(function (k) { return kur(k, gun); }).sort(function (a, b) { return a.bas - b.bas; });
  }
  function aralik(bas, bit) {
    var l = [];
    for (var t = gunBasi(gunAnahtar(bas)); t <= bit; t += GUN) l = l.concat(gunun(gunAnahtar(t + 3600e3)));
    return l;
  }
  function bul(anahtar) {
    var p = String(anahtar || "").split(" "), k = (CFG.liste || []).filter(function (x) { return x.id === p[1]; })[0];
    return k && p[0] ? kur(k, p[0]) : null;
  }
  // Şu an: { kamp, blok } (kamp sürüyorsa) ve { sira } (sıradaki kamp)
  function durum(ms) {
    var l = aralik(ms - GUN, ms + 2 * GUN);
    var kamp = l.filter(function (k) { return k.bas <= ms && ms < k.bit; })[0] || null;
    var blok = kamp ? kamp.bloklar.filter(function (b) { return b.bas <= ms && ms < b.bit; })[0] : null;
    var sira = l.filter(function (k) { return k.bas > ms; })[0] || null;
    return { kamp: kamp, blok: blok, sira: sira };
  }
  // Dijital saat: 02:35:14
  function saat(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), iki = function (n) { return ("0" + n).slice(-2); };
    return iki(Math.floor(s / 3600)) + ":" + iki(Math.floor(s % 3600 / 60)) + ":" + iki(s % 60);
  }
  function dkYaz(ms) { var d = Math.max(1, Math.ceil(ms / DK)); return d + " dk"; }

  window.KK_KAMP = { CFG: CFG, TR: TR, DUZEN: DUZEN, gunAnahtar: gunAnahtar, gunun: gunun, aralik: aralik, bul: bul, durum: durum, saat: saat, saatYaz: saatYaz, dkYaz: dkYaz };

  if (CFG.aktif === false) return;
  // ---- Şerit: [data-kamp-serit] (ana sayfa) ----
  var seritler = document.querySelectorAll("[data-kamp-serit]");
  if (!seritler.length) return;
  var saatler = (CFG.liste || []).map(function (k) { return k.bas; }).join(" · ");
  function ciz() {
    var s = Date.now(), d = durum(s), yazi;
    if (d.kamp && d.blok) {
      yazi = d.blok.tur === "ders"
        ? "Şimdi: " + d.kamp.ikon + " " + d.kamp.ad + " · " + d.blok.no + ". ders (" + dkYaz(d.blok.bit - s) + " kaldı) · Katıl →"
        : "Şimdi: " + d.kamp.ikon + " " + d.kamp.ad + " · Molada, " + dkYaz(d.blok.bit - s) + " sonra " + (d.blok.no + 1) + ". ders · Katıl →";
    } else if (d.sira) {
      yazi = '<span class="canli-saat-etiket">Sıradaki: ' + d.sira.ikon + " " + d.sira.ad + " " + d.sira.saat +
        (d.sira.gun !== gunAnahtar(s) ? ", yarın" : "") + '</span><span class="canli-saat kamp-saat" role="timer">' + saat(d.sira.bas - s) + "</span>";
    } else yazi = "";
    Array.prototype.forEach.call(seritler, function (el) {
      el.hidden = false;
      el.classList.toggle("simdi", !!d.kamp);
      el.innerHTML = '<span class="kamp-serit-ikon" aria-hidden="true">🏕</span>' +
        '<span class="canli-serit-ic"><strong>Ders Çalışma Kampları</strong>' +
        '<span class="canli-serit-program">Birlikte çalış · Her gün ' + saatler + "</span></span>" +
        '<span class="kamp-serit-durum">' + yazi + "</span>";
    });
  }
  ciz();
  setInterval(ciz, 1000);
})();
