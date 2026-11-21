// Kuzey Kampüs – 🔴 Canlı Yarışma takvimi (assets/config.js → canli).
// Saatler Türkiye saatidir (UTC+3, yaz saati yok). Ana sayfadaki ve Testler'deki şeridi de bu dosya çizer.
(function () {
  "use strict";
  var CFG = (window.KK_CONFIG && window.KK_CONFIG.canli) || null;
  if (!CFG) return;
  var TR = 3 * 3600e3, GUN = 86400e3;
  var AD = { yks: "YKS", calculus: "Calculus" };

  function gunAnahtar(ms) { return new Date(ms + TR).toISOString().slice(0, 10); }
  function gunBasi(anahtar) { return Date.parse(anahtar + "T00:00:00Z") - TR; }
  function haftaGunu(ms) { return new Date(ms + TR).getUTCDay(); }
  function iptalMi(gun, saat) {
    return (CFG.iptal || []).some(function (x) { x = String(x).trim(); return x === gun || x === gun + " " + saat; });
  }
  // Bir günün yarışmaları (saat sırasıyla)
  function gunun(anahtar) {
    var bas = gunBasi(anahtar), hg = haftaGunu(bas + 12 * 3600e3);
    return (CFG.program || []).filter(function (p) {
      return (!p.gunler || p.gunler.indexOf(hg) >= 0) && !iptalMi(anahtar, p.saat);
    }).map(function (p) {
      var hm = p.saat.split(":");
      return { grup: p.grup, ad: AD[p.grup] || p.grup, saat: p.saat, gun: anahtar,
        bas: bas + (+hm[0]) * 3600e3 + (+hm[1]) * 60e3, anahtar: anahtar + " " + p.saat + " " + p.grup };
    }).sort(function (a, b) { return a.bas - b.bas; });
  }
  // [bas, bit] aralığındaki günlerin yarışmaları
  function aralik(bas, bit) {
    var l = [];
    for (var t = gunBasi(gunAnahtar(bas)); t <= bit; t += GUN) l = l.concat(gunun(gunAnahtar(t + 3600e3)));
    return l;
  }
  // Tahmini süre (şerit için): soru + cevap süreleri; grafikli sorular için biraz pay
  function tahminiSure() { return (CFG.soruSayisi || 10) * ((CFG.soruSure || 20) + (CFG.cevapSure || 8) + 2) * 1000; }
  function sure(ms) {
    var dk = Math.ceil(ms / 60e3);
    if (dk < 60) return dk + " dk sonra";
    var sa = Math.floor(dk / 60), kalan = dk % 60;
    return sa + " sa" + (kalan ? " " + kalan + " dk" : "") + " sonra";
  }
  // "YKS 17:30 · 20:00 · Calculus 21:00"
  function programYazi(liste) {
    var gr = [], s = {};
    liste.forEach(function (y) { if (!s[y.grup]) { s[y.grup] = []; gr.push(y.grup); } s[y.grup].push(y.saat); });
    return gr.map(function (g) { return (AD[g] || g) + " " + s[g].join(" · "); }).join(" · ");
  }

  window.KK_TAKVIM = { CFG: CFG, AD: AD, TR: TR, gunAnahtar: gunAnahtar, gunun: gunun, aralik: aralik, programYazi: programYazi, sure: sure, tahminiSure: tahminiSure };

  // ---- Şerit: [data-canli-serit] (ana sayfa, Testler) ----
  var seritler = document.querySelectorAll("[data-canli-serit]");
  if (!seritler.length) return;
  if (CFG.aktif === false) return;
  function ciz() {
    var simdi = Date.now(), bugun = gunun(gunAnahtar(simdi));
    var canli = aralik(simdi - GUN, simdi).filter(function (y) { return y.bas <= simdi && simdi < y.bas + tahminiSure(); })[0];
    var sira = aralik(simdi, simdi + 2 * GUN).filter(function (y) { return y.bas > simdi; })[0];
    var durum = canli ? "🔴 Şimdi canlı: " + canli.ad + " " + canli.saat + " · Katıl →"
      : sira ? "Sıradaki: " + sira.ad + " " + sira.saat + (sira.gun !== gunAnahtar(simdi) ? " (yarın)" : "") + " · " + sure(sira.bas - simdi) : "";
    Array.prototype.forEach.call(seritler, function (el) {
      el.hidden = false;
      el.classList.toggle("simdi", !!canli);
      el.innerHTML = '<span class="canli-nokta" aria-hidden="true"></span>' +
        '<span class="canli-serit-ic"><strong>Canlı Yarışma</strong>' +
        '<span class="canli-serit-program">Bugün · ' + (bugun.length ? programYazi(bugun) : "Bugün yarışma yok") + "</span></span>" +
        '<span class="canli-serit-durum">' + durum + "</span>";
    });
  }
  ciz();
  setInterval(ciz, 20e3);
})();
