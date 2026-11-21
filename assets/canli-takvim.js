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
  // Dijital saat: 02:35:14
  function saat(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), iki = function (n) { return ("0" + n).slice(-2); };
    return iki(Math.floor(s / 3600)) + ":" + iki(Math.floor(s % 3600 / 60)) + ":" + iki(s % 60);
  }
  // "YKS 17:30 · 20:00 · Calculus 21:00"
  function programYazi(liste) {
    var gr = [], s = {};
    liste.forEach(function (y) { if (!s[y.grup]) { s[y.grup] = []; gr.push(y.grup); } s[y.grup].push(y.saat); });
    return gr.map(function (g) { return (AD[g] || g) + " " + s[g].join(" · "); }).join(" · ");
  }

  window.KK_TAKVIM = { CFG: CFG, AD: AD, TR: TR, gunAnahtar: gunAnahtar, gunun: gunun, aralik: aralik, programYazi: programYazi, sure: sure, saat: saat, tahminiSure: tahminiSure };

  if (CFG.aktif === false) return;

  // ---- Sitedeki herkese küçük uyarı: 5 dakika ve 1 dakika kala (yarışma sayfası dışındaki tüm sayfalarda), kısa bip sesiyle.
  // Ekranı kapatmaz; köşede durur, ✕ ile kapanır. Kapatılan uyarı o aşama için bir daha çıkmaz.
  // Bip her aşamada bir kez çalar (canliBip). Tarayıcılar, sayfaya bir kez dokunulmadan ses çalmaya izin vermez.
  var actx = null;
  document.addEventListener("pointerdown", function () {
    var A = window.AudioContext || window.webkitAudioContext;
    if (!actx && A) { try { actx = new A(); } catch (e) { actx = null; } }
    if (actx && actx.state === "suspended") actx.resume();
  });
  function bip() {
    if (depo().ses === false) return true;
    if (!actx) return false;
    try {
      [0, 0.22].forEach(function (bas) {
        var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + bas;
        o.type = "sine"; o.frequency.setValueAtTime(880, t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + 0.2);
      });
    } catch (e) { /* ses çalmazsa uyarı yine görünür */ }
    return true;
  }
  function depo() { try { return JSON.parse(localStorage.getItem("kk-oyun-v1")) || {}; } catch (e) { return {}; } }
  function depoYaz(k) { try { localStorage.setItem("kk-oyun-v1", JSON.stringify(k)); } catch (e) { /* özel pencere */ } }
  var kok = /\/makaleler\//.test(location.pathname) ? "../" : "";
  function hatirlat() {
    if (document.getElementById("canli-lobi")) return;
    var k = depo(), simdi = Date.now();
    var y = aralik(simdi, simdi + 2 * GUN).filter(function (x) { return x.bas > simdi; })[0], anah = y && y.anahtar;
    var el = document.getElementById("canli-hatirlat");
    var kalan = y ? y.bas - simdi : -1;
    var asama = kalan > 0 && kalan <= 60e3 ? "1" : kalan > 60e3 && kalan <= 5 * 60e3 ? "5" : null;
    var kapali = k.canliHatirlat && k.canliHatirlat[anah + "|" + asama];
    if (!asama || kapali) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "canli-hatirlat"; el.className = "canli-hatirlat"; el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    var metin = "⏰ " + y.ad + " " + y.saat + " yarışması " + (asama === "1" ? Math.ceil(kalan / 1000) + " saniye" : Math.ceil(kalan / 60e3) + " dakika") + " sonra başlıyor.";
    if (!(k.canliBip && k.canliBip[anah + "|" + asama])) {
      if (bip()) { k.canliBip = {}; k.canliBip[anah + "|" + asama] = 1; depoYaz(k); }   // dokunulmadıysa ilk dokunuşta çalar
    }
    if (el.getAttribute("data-asama") !== asama) {
      el.setAttribute("data-asama", asama);
      el.innerHTML = '<span class="canli-hatirlat-metin"></span><a class="btn primary" href="' + kok + 'canli.html">Yarışmaya git</a>' +
        '<button type="button" class="canli-hatirlat-kapat" aria-label="Uyarıyı kapat">✕</button>';
      el.querySelector("button").addEventListener("click", function () {
        var k2 = depo(); k2.canliHatirlat = {}; k2.canliHatirlat[anah + "|" + asama] = 1; depoYaz(k2); el.remove();
      });
    }
    el.querySelector(".canli-hatirlat-metin").textContent = metin;
  }
  hatirlat();
  setInterval(hatirlat, 1000);

  // ---- Şerit: [data-canli-serit] (ana sayfa, Testler) ----
  var seritler = document.querySelectorAll("[data-canli-serit]");
  if (!seritler.length) return;
  function ciz() {
    var simdi = Date.now(), bugun = gunun(gunAnahtar(simdi));
    var canli = aralik(simdi - GUN, simdi).filter(function (y) { return y.bas <= simdi && simdi < y.bas + tahminiSure(); })[0];
    var sira = aralik(simdi, simdi + 2 * GUN).filter(function (y) { return y.bas > simdi; })[0];
    var yakin = !canli && sira && sira.bas - simdi <= 60e3;
    var durum = canli ? "🔴 Şimdi canlı: " + canli.ad + " " + canli.saat + " · Katıl →"
      : yakin ? '<span class="canli-saat-etiket">⏰ ' + sira.ad + " " + sira.saat + ' 1 dakikadan az kaldı · Katıl →</span><span class="canli-saat" role="timer">' + saat(sira.bas - simdi) + "</span>"
      : sira ? '<span class="canli-saat-etiket">Sıradaki yarışmaya (' + sira.ad + " " + sira.saat + (sira.gun !== gunAnahtar(simdi) ? ", yarın" : "") +
        ') kalan süre</span><span class="canli-saat" role="timer">' + saat(sira.bas - simdi) + "</span>" : "";
    Array.prototype.forEach.call(seritler, function (el) {
      el.hidden = false;
      el.classList.toggle("simdi", !!canli);
      el.classList.toggle("yakin", !!yakin);
      el.innerHTML = '<span class="canli-nokta" aria-hidden="true"></span>' +
        '<span class="canli-serit-ic"><strong>Canlı Yarışma</strong>' +
        '<span class="canli-serit-program">Bugün · ' + (bugun.length ? programYazi(bugun) : "Bugün yarışma yok") + "</span></span>" +
        '<span class="canli-serit-durum">' + durum + "</span>";
    });
  }
  ciz();
  setInterval(ciz, 1000);
})();
