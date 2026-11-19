// Kuzey Kampüs – Calculus oyunu (kayıt yok; puanlar sadece bu cihazda, localStorage'da)
(function () {
  "use strict";
  var O = window.KK_OYUN;
  if (!O || !document.getElementById("oyun-giris")) return;

  var DEPO = "kk-oyun-v1";
  var $ = function (id) { return document.getElementById(id); };
  var SEVIYELER = O.seviyeler || [{ id: "orta", ad: "Orta", sure: 15 }];
  var UYARI = O.uyari == null ? 5 : O.uyari;   // turuncu yanıp sönme başlar
  var KRITIK = O.kritik == null ? 3 : O.kritik; // kırmızı yanıp sönme başlar
  var durum = { konu: null, seviye: null, sorular: [], i: 0, puan: 0, kacan: [], kalan: 0 };
  var sayac = null, sayacBitis = 0;
  var DY = window.KK_DY || null;
  var dy = { id: null, liste: [], i: 0, puan: 0, seri: 0, enSeri: 0, kacan: [], kilit: false };
  function dyId(id) { var m = /^dy-(tum|yks|\d+)$/.exec(id || ""); return m ? m[1] : null; }

  // 📘 YKS soruları (data/yks-sorular.js): konular "yks-" ile başlar, Üniversite turlarına karışmaz.
  var YKS = window.KK_YKS || null;
  if (YKS) {
    (YKS.konular || []).forEach(function (k) {
      k.grup = "yks";
      O.konular.push(k);
      O.sorular[k.id] = (YKS.sorular[k.id] || []).map(function (q) { q.b = q.b || "yks"; q.k = k.id; return q; });
    });
    // Sadece listedeki konuların ifadeleri gelir; konusu henüz açılmamış ifadeler dosyada bekler.
    var acik = {}; (YKS.konular || []).forEach(function (k) { acik[k.id] = true; });
    // 🔁 Konu Tekrarı: kendi sorusu yok; öğrencinin seçtiği konuların sorularından karma 10 soru (havuz → tekrarHavuz)
    O.konular.push({ id: "yks-tekrar", ad: "Konu Tekrarı", grup: "yks", gizli: true });
    O.konular.push({ id: "yks-tumtekrar", ad: "Tüm konuların tekrarı", grup: "yks", gizli: true });
    if (DY) DY.ifadeler = DY.ifadeler.concat((YKS.dogruYanlis || []).filter(function (q) { return acik[q.k]; })
      .map(function (q) { q.b = "yks"; return q; }));
  }
  function yksMi(id) { return /^yks-/.test(id || "") || id === "dy-yks"; }

  function oku() {
    try { return JSON.parse(localStorage.getItem(DEPO)) || {}; } catch (e) { return {}; }
  }
  function yaz(v) {
    try { localStorage.setItem(DEPO, JSON.stringify(v)); } catch (e) { /* özel pencere vb. */ }
  }
  function karistir(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var BOLUMLER = O.bolumler || [];
  function bolumNo(id) { var m = /^bolum-(\d+)$/.exec(id || ""); return m ? +m[1] : null; }
  // Üniversite (Calculus) soruları; YKS listeleri hariç.
  function tumSorular() {
    return Object.keys(O.sorular).filter(function (k) { return !/^yks-/.test(k); })
      .reduce(function (h, k) { return h.concat(O.sorular[k]); }, []);
  }
  function yksSorular() {
    return Object.keys(O.sorular).filter(function (k) { return /^yks-/.test(k); })
      .reduce(function (h, k) { return h.concat(O.sorular[k]); }, []);
  }
  // Bir testin (konu turu ya da bölüm sonu testi) bilgileri
  function testBilgi(id) {
    var no = bolumNo(id);
    if (no) {
      var b = BOLUMLER.filter(function (x) { return x.no === no; })[0] || { no: no, ad: "" };
      return { id: id, bolum: true, ad: "Chapter " + no + " · " + b.ad, kisaAd: "Chapter " + no, ders: b.ders, sayi: O.bolumSoruSayisi || 5 };
    }
    var k = bul(O.konular, id) || {};
    return { id: id, bolum: false, yks: k.grup === "yks", ad: k.ad || "", kisaAd: k.ad || "", ders: k.ders, sonuc: k.sonuc, sayi: O.soruSayisi };
  }
  function havuz(id) {
    var d = dyId(id);
    if (d) {
      var hepsi = (DY && DY.ifadeler) || [];
      if (d === "tum") return hepsi.filter(function (q) { return q.b !== "yks"; });
      return hepsi.filter(function (q) { return String(q.b).split(".")[0] === d; });
    }
    var no = bolumNo(id);
    if (no) return tumSorular().filter(function (q) { return String(q.b).split(".")[0] === String(no); });
    if (id === "karisik") return tumSorular();
    if (tekrarMi(id)) return tekrarHavuz(id);
    return O.sorular[id] || [];
  }
  // ∫ ve Σ işaretlerinin alt/üst sınırlarını ders kitabındaki gibi alt alta yazar.
  function bicim(html) {
    return String(html).replace(/([∫Σ])<sub>((?:(?!<\/sub>).)*)<\/sub><sup>((?:<sup>.*?<\/sup>|(?!<\/sup>).)*)<\/sup>/g,
      '$1<span class="sinir"><span class="ust">$3</span><span class="alt">$2</span></span>');
  }
  // Grafikli sorular: q.g = { x: [min, max], y: [min, max], p: [{ f: "x/2 + 1", a: 0, b: 3 }], bos: [[x, y]], dolu: [[x, y]], harf: { a: 1 } }
  // p: eğri parçaları (JavaScript ifadesi, a ≤ x ≤ b; ek: true ise turuncu kesikli, n: nokta sayısı), bos: boş daire (delik), dolu: dolu nokta, harf: x eksenindeki harfli noktalar, dikey: kesik çizgiyle dikey asimptotlar,
  // ek: [{ f, a, b, k }] kesen/teğet doğruları (turuncu, k: kesikli), yazi: [[x, y, "P"]] nokta adı.
  var grafikNo = 0;
  function grafik(g) {
    var W = 320, H = 210, sl = 26, sr = 10, su = 10, sa = 26;
    var x0 = g.x[0], x1 = g.x[1], y0 = g.y[0], y1 = g.y[1];
    var X = function (x) { return sl + (x - x0) / (x1 - x0) * (W - sl - sr); };
    var Y = function (y) { return su + (y1 - y) / (y1 - y0) * (H - su - sa); };
    var r = function (v) { return Math.round(v * 10) / 10; };
    var o = '<svg class="oyun-grafik" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Fonksiyon grafiği">';
    var i, k;
    for (i = Math.ceil(x0); i <= x1; i++) o += '<line class="iz" x1="' + r(X(i)) + '" y1="' + su + '" x2="' + r(X(i)) + '" y2="' + (H - sa) + '"/>';
    for (i = Math.ceil(y0); i <= y1; i++) o += '<line class="iz" x1="' + sl + '" y1="' + r(Y(i)) + '" x2="' + (W - sr) + '" y2="' + r(Y(i)) + '"/>';
    if (y0 <= 0 && y1 >= 0) o += '<line class="eksen" x1="' + sl + '" y1="' + r(Y(0)) + '" x2="' + (W - sr) + '" y2="' + r(Y(0)) + '"/>';
    if (x0 <= 0 && x1 >= 0) o += '<line class="eksen" x1="' + r(X(0)) + '" y1="' + su + '" x2="' + r(X(0)) + '" y2="' + (H - sa) + '"/>';
    var harfX = {};
    Object.keys(g.harf || {}).forEach(function (h) { harfX[g.harf[h]] = h; });
    var tabanY = Math.min(H - sa, Math.max(su, Y(Math.max(y0, Math.min(0, y1)))));
    for (i = Math.ceil(x0); i <= x1; i++) if (i !== 0 && !(i in harfX)) o += '<text class="sayi" x="' + r(X(i)) + '" y="' + r(tabanY + 15) + '">' + String(i).replace("-", "−") + "</text>";
    for (i = Math.ceil(y0); i <= y1; i++) if (i !== 0) o += '<text class="sayi" x="' + r((x0 <= 0 && x1 >= 0 ? X(0) : sl) - 6) + '" y="' + r(Y(i) + 4) + '" text-anchor="end">' + String(i).replace("-", "−") + "</text>";
    Object.keys(g.harf || {}).forEach(function (h) {
      var hx = r(X(g.harf[h]));
      o += '<line class="kesik" x1="' + hx + '" y1="' + su + '" x2="' + hx + '" y2="' + r(tabanY) + '"/>' +
        '<text class="harf" x="' + hx + '" y="' + r(tabanY + 17) + '">' + h + "</text>";
    });
    (g.dikey || []).forEach(function (a) { o += '<line class="kesik" x1="' + r(X(a)) + '" y1="' + su + '" x2="' + r(X(a)) + '" y2="' + (H - sa) + '"/>'; });
    (g.p || []).forEach(function (pr) {
      var f = new Function("x", "return " + pr.f), d = "", n = pr.n || 60;
      for (k = 0; k <= n; k++) { var x = pr.a + (pr.b - pr.a) * k / n; d += (k ? "L" : "M") + r(X(x)) + "," + r(Y(f(x))); }
      o += '<path class="egri' + (pr.ek ? " ek" : "") + '" d="' + d + '"/>';
    });
    // Kesen/teğet gibi yardımcı doğrular (turuncu; k: true ise kesikli), grafik alanının dışına taşmaz.
    var kirp = "kk-kirp-" + (++grafikNo);
    if (g.ek) {
      o += '<clipPath id="' + kirp + '"><rect x="' + sl + '" y="' + su + '" width="' + (W - sl - sr) + '" height="' + (H - su - sa) + '"/></clipPath><g clip-path="url(#' + kirp + ')">';
      g.ek.forEach(function (pr) {
        var f = new Function("x", "return " + pr.f);
        o += '<line class="ek' + (pr.k ? " kesikli" : "") + '" x1="' + r(X(pr.a)) + '" y1="' + r(Y(f(pr.a))) + '" x2="' + r(X(pr.b)) + '" y2="' + r(Y(f(pr.b))) + '"/>';
      });
      o += "</g>";
    }
    (g.bos || []).forEach(function (n) { o += '<circle class="bos" cx="' + r(X(n[0])) + '" cy="' + r(Y(n[1])) + '" r="4.5"/>'; });
    (g.dolu || []).forEach(function (n) { o += '<circle class="dolu" cx="' + r(X(n[0])) + '" cy="' + r(Y(n[1])) + '" r="4.5"/>'; });
    (g.yazi || []).forEach(function (n) { o += '<text class="yazi" x="' + r(X(n[0]) - 7) + '" y="' + r(Y(n[1]) - 8) + '">' + n[2] + "</text>"; });
    return o + "</svg>";
  }
  // Kesir daireleri: q.g = { pasta: [{ n: 8, k: 3 }, …] } → her daire n eşit parçaya bölünür, ilk k parça boyalı.
  function pastaCiz(daireler) {
    var R = 46, A = 2 * R + 12, W = daireler.length * A, H = A;
    var o = '<svg class="oyun-grafik oyun-pasta" style="max-width:' + (daireler.length * 150) + 'px" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Parçalara bölünmüş daire">';
    daireler.forEach(function (d, i) {
      var cx = i * A + A / 2, cy = H / 2;
      for (var j = 0; j < d.n; j++) {
        var a1 = -Math.PI / 2 + 2 * Math.PI * j / d.n, a2 = -Math.PI / 2 + 2 * Math.PI * (j + 1) / d.n;
        var x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        var yay = d.n === 1 ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"' :
          '<path d="M' + cx + "," + cy + " L" + x1.toFixed(1) + "," + y1.toFixed(1) + " A" + R + "," + R + " 0 " + (a2 - a1 > Math.PI ? 1 : 0) + " 1 " + x2.toFixed(1) + "," + y2.toFixed(1) + ' Z"';
        o += yay + ' class="dilim' + (j < d.k ? " boyali" : "") + '"/>';
      }
    });
    return o + "</svg>";
  }
  function soruHtml(q) { return bicim(q.s) + (q.g ? (q.g.pasta ? pastaCiz(q.g.pasta) : grafik(q.g)) : ""); }
  function anahtar(q) { return q.g ? q.s + "#" + JSON.stringify(q.g) : q.s; }
  function bul(liste, id) { return (liste || []).filter(function (x) { return x.id === id; })[0]; }
  // Listeden n soru seçer; bölüm testlerinde soruları alt bölümlere (2.1, 2.2…) yayar.
  function dengeliSec(liste, n, yay) {
    liste = karistir(liste);
    if (!yay) return liste.slice(0, n);
    var gruplar = {}, sira = [];
    liste.forEach(function (q) { var k = String(q.b); if (!gruplar[k]) { gruplar[k] = []; sira.push(k); } gruplar[k].push(q); });
    sira = karistir(sira);
    var sec = [];
    while (sec.length < n && sira.length) {
      sira = sira.filter(function (k) { return gruplar[k].length; });
      for (var i = 0; i < sira.length && sec.length < n; i++) sec.push(gruplar[sira[i]].shift());
    }
    return karistir(sec);
  }
  // Soru geçmişi (sadece bu cihazda): kayit.cevap[anahtar] = [1 çözüldü | 0 çözülemedi, tur no].
  // Seçim sırası: önce hiç görülmemiş sorular; onlar bitince çözülemeyenler (en eski denenen önce,
  // yani yine çözülemeyen bir sonraki tura kalır); hepsi çözülünce daha önce çözülenler (puansız).
  function cevaplar(kayit) { return (kayit.cevap = kayit.cevap || {}); }
  function cozulenSayi(liste, kayit) {
    var c = cevaplar(kayit);
    return liste.filter(function (q) { var x = c[anahtar(q)]; return x && x[0] === 1; }).length;
  }
  function eskidenSec(liste, m, c) {
    return karistir(liste).sort(function (a, b) { return c[anahtar(a)][1] - c[anahtar(b)][1]; }).slice(0, m);
  }
  // ---- 🔁 Konu Tekrarı ----
  // TEKRAR: öğrencinin seçtiği 3–5 konu · TUM_TEKRAR: Konu Testi'ndeki bütün konular
  var TEKRAR = "yks-tekrar", TUM_TEKRAR = "yks-tumtekrar", TEKRAR_EN_AZ = 3, TEKRAR_EN_COK = 5;
  function tekrarMi(id) { return id === TEKRAR || id === TUM_TEKRAR; }
  function yksKonuIdleri() { return O.konular.filter(function (k) { return k.grup === "yks" && !k.gizli; }).map(function (k) { return k.id; }); }
  function tekrarSecim() {
    var k = oku().tekrar || {};
    return { k: (k.k || []).filter(function (id) { return O.sorular[id] && id !== TEKRAR; }), c: k.c === true };
  }
  function cozulduMu(q, c) { var x = (c || cevaplar(oku()))[anahtar(q)]; return !!(x && x[0] === 1); }
  // c: true → çözdüğü sorular da gelir (puansız); false → sadece çözmedikleri (görmediği + kaçırdığı)
  function tekrarHavuz(tid) {
    var s = tekrarSecim(), c = cevaplar(oku()), h = [];
    (tid === TUM_TEKRAR ? yksKonuIdleri() : s.k).forEach(function (id) { (O.sorular[id] || []).forEach(function (q) { if (s.c || !cozulduMu(q, c)) h.push(q); }); });
    return h;
  }
  // Seçilen konulardan sırayla birer soru alarak dengeli bir karma kurar
  function tekrarSec(n, tid) {
    var c = cevaplar(oku()), gr = {}, sira = [], sec = [];
    karistir(tekrarHavuz(tid)).forEach(function (q) { if (!gr[q.k]) { gr[q.k] = []; sira.push(q.k); } gr[q.k].push(q); });
    if (!tekrarSecim().c) sira.forEach(function (k) { gr[k].sort(function (a, b) { return (c[anahtar(a)] ? 1 : 0) - (c[anahtar(b)] ? 1 : 0); }); });
    while (sec.length < n) {
      var eklendi = false;
      sira.forEach(function (k) { if (sec.length < n && gr[k].length) { sec.push(gr[k].shift()); eklendi = true; } });
      if (!eklendi) break;
    }
    return karistir(sec);
  }
  function soruSec(id, n) {
    if (tekrarMi(id)) return tekrarSec(n, id);
    var kayit = oku(), c = cevaplar(kayit), h = havuz(id), yay = !!bolumNo(id);
    var yeni = h.filter(function (q) { return !c[anahtar(q)]; });
    var kacan = h.filter(function (q) { var x = c[anahtar(q)]; return x && x[0] === 0; });
    var cozulen = h.filter(function (q) { var x = c[anahtar(q)]; return x && x[0] === 1; });
    var sec = dengeliSec(yeni, n, yay);
    if (sec.length < n) sec = sec.concat(eskidenSec(kacan, n - sec.length, c));
    if (sec.length < n) sec = sec.concat(eskidenSec(cozulen, n - sec.length, c));
    return karistir(sec);
  }
  // Cevabı kaydeder; soru ilk kez doğru çözüldüyse true döner (yeni puan). Her soru en fazla 1 puan getirir.
  function cevapYaz(q, dogru) {
    var kayit = oku(), c = cevaplar(kayit), k = anahtar(q), once = c[k];
    var yeniPuan = dogru && !(once && once[0] === 1);
    c[k] = [dogru || (once && once[0] === 1) ? 1 : 0, kayit.tur || 0];
    delete kayit.gorulen;
    yaz(kayit);
    return yeniPuan;
  }
  function turArtir() { var k = oku(); k.tur = (k.tur || 0) + 1; yaz(k); }
  function seviye() { return bul(SEVIYELER, durum.seviye) || SEVIYELER[0]; }
  function rekorAnahtar(konu) { return konu + ":" + seviye().id; }

  // ---- ⭐ Tam doğru bonusu: 10 soruluk testlerde tüm sorular doğruysa (data/sorular.js → tamBonus).
  // Bonus, turda puan getiren en az bir soru varsa toplam puana eklenir (kayit.bonus["konu:seviye"] birikir).
  // Konunun tüm soruları çözüldükten sonraki turlarda, sorularda olduğu gibi bonus da eklenmez; kutlama yine gösterilir.
  // hiz: true → soru başına ortalama kaç saniye erken bitirdiyse o kadar ek bonus (12 sn'lik soruyu 9 sn'de çözen +3).
  var TAM_BONUS = O.tamBonus || { kolay: { puan: 1 }, orta: { puan: 2 }, zor: { puan: 1, hiz: true } };
  function bonusHesap(seviyeId, kalanSn, n) {
    var b = TAM_BONUS[seviyeId] || { puan: 0 };
    var ort = n ? kalanSn / n : 0, hiz = b.hiz ? Math.round(ort) : 0;
    return { sabit: b.puan || 0, hiz: hiz, ort: Math.round(ort * 10) / 10, toplam: (b.puan || 0) + hiz, saniyeli: !!b.hiz };
  }
  function bonusKonu(kayit, konu) {
    var b = kayit.bonus || {}, top = 0;
    Object.keys(b).forEach(function (k) { if (k.slice(0, k.lastIndexOf(":")) === konu) top += b[k]; });
    return top;
  }
  function bonusGrup(kayit, yks) {
    var b = kayit.bonus || {}, top = 0;
    Object.keys(b).forEach(function (k) { if (/^yks-/.test(k) === !!yks) top += b[k]; });
    return top;
  }
  function bonusRozet(kayit, konu) { var b = bonusKonu(kayit, konu); return b ? '<span class="skor bonus-rozet">⭐ Bonus: +' + b + "</span>" : ""; }
  // "YKS toplam puanın: 52 (40 / 120 soru + 12 bonus)"
  function toplamYazi(ad, liste, kayit, yks) {
    var c = cozulenSayi(liste, kayit), b = bonusGrup(kayit, yks);
    return ad + " toplam puanın: " + (c + b) + " (" + c + " / " + liste.length + " soru" + (b ? " + " + b + " bonus" : "") + ")";
  }

  if (O.ad) { $("oyun-ad").textContent = O.ad; document.title = O.ad + " – Kuzey Kampüs"; }
  // ---- Sesler (Web Audio; ses dosyası yok). Öğrenci 🔊 düğmesiyle kapatabilir; seçim cihazda hatırlanır. ----
  var sesAcik = oku().ses !== false, actx = null;
  function sesBaglam() {
    if (!actx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      try { actx = new A(); } catch (e) { return null; }
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function ton(c, frekans, bas, sure, tip, siddet) {
    var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + bas;
    o.type = tip || "sine"; o.frequency.setValueAtTime(frekans, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(siddet || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + sure + 0.05);
  }
  var SESLER = {
    // Saat tıkırtısı: kısa, tok bir "tik" (her saniyede bir)
    tik: function (c) { ton(c, 1500, 0, 0.05, "square", 0.08); ton(c, 900, 0, 0.08, "sine", 0.15); },
    // Sayfa çevirme: süzgeçten geçen kısa bir hışırtı
    sayfa: function (c) {
      var n = Math.floor(c.sampleRate * 0.35), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime;
      src.buffer = buf; f.type = "bandpass"; f.Q.value = 0.8;
      f.frequency.setValueAtTime(700, t0); f.frequency.exponentialRampToValueAtTime(3500, t0 + 0.3);
      g.gain.setValueAtTime(0.5, t0);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t0);
    },
    // Kutlama: yükselen kısa bir melodi ve parıltılar
    kutlama: function (c) {
      [523, 659, 784, 1047].forEach(function (fr, i) { ton(c, fr, i * 0.11, 0.3, "triangle", 0.22); });
      [1047, 1319, 1568].forEach(function (fr) { ton(c, fr, 0.5, 0.9, "triangle", 0.12); });
      for (var i = 0; i < 8; i++) ton(c, 2000 + Math.random() * 2000, 0.7 + i * 0.12, 0.12, "sine", 0.05);
    }
  };
  function cal(ad) {
    if (!sesAcik) return;
    var c = sesBaglam();
    if (c) { try { SESLER[ad](c); } catch (e) { /* ses çalmazsa oyun devam eder */ } }
  }
  function sesDugmeleri() {
    Array.prototype.forEach.call(document.querySelectorAll(".ses-dugme"), function (b) {
      b.textContent = sesAcik ? "🔊" : "🔇";
      b.setAttribute("aria-pressed", String(!sesAcik));
      b.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç");
      b.title = sesAcik ? "Sesi kapat" : "Sesi aç";
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".ses-dugme"), function (b) {
    b.addEventListener("click", function () {
      sesAcik = !sesAcik;
      var k = oku(); k.ses = sesAcik; yaz(k);
      sesDugmeleri();
      if (sesAcik) sesBaglam();
    });
  });
  sesDugmeleri();

  function goster(bolum) {
    ["oyun-giris", "oyun-soru", "dy-soru", "oyun-sonuc"].forEach(function (b) { $(b).hidden = b !== bolum; });
    window.scrollTo(0, 0);
  }

  // ---- Sayaç ----
  function sayaciDurdur() {
    if (sayac) { clearInterval(sayac); sayac = null; }
  }
  function sayaciBaslat(sureBitti, elId, ozelSure, esik) {
    sayaciDurdur();
    var el = $(elId || "oyun-sure"), sure = ozelSure || seviye().sure;
    var uyari = esik ? esik.uyari : UYARI, kritik = esik ? esik.kritik : KRITIK;
    if (!sure) { el.hidden = true; return; }
    el.hidden = false;
    var bitis = Date.now() + sure * 1000, sonSn = null;
    sayacBitis = bitis;
    function guncelle() {
      var kalan = Math.max(0, bitis - Date.now());
      var sn = Math.ceil(kalan / 1000);
      el.textContent = sn;
      if (sn !== sonSn) { sonSn = sn; if (sn > 0 && sn <= kritik) cal("tik"); }
      el.classList.toggle("az", sn <= kritik);
      el.classList.toggle("uyari", sn > kritik && sn <= uyari);
      if (kalan <= 0) { sayaciDurdur(); sureBitti(); }
    }
    guncelle();
    sayac = setInterval(guncelle, 100);
  }

  // ---- Giriş ekranı ----
  var HAZIRLIK = O.hazirlikTesti || "precalculus";
  function enIyiYazi(r, n, sev) { return r != null ? '<span class="skor">En iyi: ' + r + "/" + n + (sev ? " (" + sev + ")" : "") + "</span>" : ""; }
  function baglan(kap, sec, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(kap + " " + sec), function (b) { b.addEventListener("click", function () { fn(b); }); });
  }
  function girisCiz() {
    sayaciDurdur();
    seviyeKapat();
    var kayit = oku(), rek = kayit.rekor || {};
    durum.seviye = bul(SEVIYELER, durum.seviye) ? durum.seviye : (bul(SEVIYELER, kayit.seviye) ? kayit.seviye : SEVIYELER[0].id);
    var sevAd = seviye().ad;

    // 🧭 Calculus'a Hazır mısın?
    var hz = bul(O.konular, HAZIRLIK) || {};
    $("oyun-hazirlik").innerHTML = '<div><strong>Precalculus hazırlık testi</strong><p>' + (hz.aciklama || "") + "</p>" +
      enIyiYazi(rek[rekorAnahtar(HAZIRLIK)], O.soruSayisi, sevAd) + bonusRozet(kayit, HAZIRLIK) + "</div>" +
      '<button type="button" class="btn big hazirlik-btn" data-konu="' + HAZIRLIK + '">Teste başla →</button>';
    baglan("#oyun-hazirlik", "[data-konu]", function (b) { seviyeSor(b.getAttribute("data-konu")); });

    // 📝 Sınava Hazır mısın?
    if (O.bolumBaslik) $("oyun-bolum-baslik").textContent = "📝 " + O.bolumBaslik;
    $("oyun-bolumler").innerHTML = BOLUMLER.map(function (b) {
      var id = "bolum-" + b.no;
      return '<button type="button" class="sec s1" data-konu="' + id + '"><small>Chapter ' + b.no + "</small><strong>" + b.ad + "</strong>" +
        enIyiYazi(rek[rekorAnahtar(id)], testBilgi(id).sayi, sevAd) + "</button>";
    }).join("");
    baglan("#oyun-bolumler", "[data-konu]", function (b) { seviyeSor(b.getAttribute("data-konu")); });

    // 🎯 Konu turları (hazırlık testi hariç)
    $("oyun-konular").innerHTML = O.konular.filter(function (k) { return k.id !== HAZIRLIK && k.grup !== "yks"; }).map(function (k) {
      var hk = havuz(k.id), ust = (k.id === "karisik" ? "Tüm konular · " : "") + "Puan: " + cozulenSayi(hk, kayit) + " / " + hk.length;
      return '<button type="button" class="sec s2" data-konu="' + k.id + '"><small>' + ust + "</small><strong>" + k.ad + "</strong>" +
        enIyiYazi(rek[rekorAnahtar(k.id)], O.soruSayisi, sevAd) + bonusRozet(kayit, k.id) + "</button>";
    }).join("");
    baglan("#oyun-konular", "[data-konu]", function (b) { seviyeSor(b.getAttribute("data-konu")); });

    // ⚡ Doğru / Yanlış
    var dyN = (DY && DY.soruSayisi) || 5;
    $("oyun-dy").innerHTML = BOLUMLER.filter(function (b) { return havuz("dy-" + b.no).length; }).map(function (b) {
      return '<button type="button" class="sec s3" data-dy="dy-' + b.no + '"><small>Chapter ' + b.no + "</small><strong>" + b.ad + "</strong>" +
        enIyiYazi(rek["dy-" + b.no], dyN) + "</button>";
    }).join("") + (havuz("dy-tum").length ? '<button type="button" class="sec s3" data-dy="dy-tum"><small>Hepsi</small><strong>Tüm chapter\'lar</strong>' +
      enIyiYazi(rek["dy-tum"], dyN) + "</button>" : "");
    baglan("#oyun-dy", "[data-dy]", function (b) { dyBasla(b.getAttribute("data-dy")); });

    var PUAN_NOT = " Her soru, ilk kez doğru çözdüğünde 1 puan getirir; 10 soruluk bir testin hepsini doğru yaparsan ⭐ bonus da kazanırsın. Puanların sadece bu cihazda tutulur.";
    var uni = tumSorular();
    $("oyun-toplam").textContent = toplamYazi("Üniversite", uni, kayit, false) + "." + PUAN_NOT;

    // 📘 YKS
    if ($("panel-yks")) {
      var yk = O.konular.filter(function (k) { return k.grup === "yks" && !k.gizli; });
      $("yks-konular").innerHTML = yk.map(function (k) {
        var hk = havuz(k.id);
        return '<button type="button" class="sec s1" data-konu="' + k.id + '"><small>' + (k.ust || k.sinav || "") + "</small><strong>" + k.ad + "</strong>" +
          '<span class="skor">Puan: ' + cozulenSayi(hk, kayit) + " / " + hk.length + "</span>" +
          enIyiYazi(rek[rekorAnahtar(k.id)], O.soruSayisi, sevAd) + bonusRozet(kayit, k.id) + "</button>";
      }).join("") + (function () {
        var hepsi = [], c = cevaplar(kayit);
        yk.forEach(function (k) { hepsi = hepsi.concat(O.sorular[k.id] || []); });
        var kalan = hepsi.filter(function (q) { return !cozulduMu(q, c); }).length;
        return '<button type="button" class="sec s1 tum-tekrar" data-konu="' + TUM_TEKRAR + '"><small>🔁 Konu tekrarı · ' + yk.length + " konu</small>" +
          "<strong>Yukarıdaki konuların hepsinden karışık 10 soru</strong>" +
          '<span class="skor">' + (kalan ? "Çözmediğin: " + kalan + " / " + hepsi.length : "✓ Hepsini çözdün") + bonusRozet(kayit, TUM_TEKRAR) + "</span></button>";
      })();
      baglan("#yks-konular", "[data-konu]", function (b) {
        var id = b.getAttribute("data-konu");
        if (secimModu && id !== TUM_TEKRAR) tekrarSec_(id, b); else seviyeSor(id);
      });
      tekrarModuUygula();
      $("yks-dy").innerHTML = havuz("dy-yks").length ? '<button type="button" class="sec s3" data-dy="dy-yks"><small>' + havuz("dy-yks").length +
        " ifade</small><strong>Temel Kavramlar</strong>" + enIyiYazi(rek["dy-yks"], dyN) + "</button>" : "";
      baglan("#yks-dy", "[data-dy]", function (b) { dyBasla(b.getAttribute("data-dy")); });
      var ys = yksSorular();
      $("yks-toplam").textContent = toplamYazi("YKS", ys, kayit, true) + "." + PUAN_NOT;
    }
    goster("oyun-giris");
  }

  // ---- Seviye seçimi (teste başlarken) ----
  var seviyeHedef = null;
  function seviyeSor(id) {
    var t = testBilgi(id);
    seviyeHedef = id;
    var tur = id === TEKRAR ? "📘 YKS · 🔁 Konu Tekrarı" : id === TUM_TEKRAR ? "📘 YKS · 🔁 Tüm konular" : t.yks ? "📘 YKS · 📝 Konu Testi" : t.bolum ? "📝 " + (O.bolumBaslik || "Sınava Hazır mısın?") : id === HAZIRLIK ? "🧭 Calculus'a Hazır mısın?" : "🎯 Konu Turları";
    $("seviye-tur").textContent = tur;
    $("seviye-baslik").textContent = t.bolum ? t.ad : (id === HAZIRLIK ? "Precalculus hazırlık testi" : t.ad);
    // Tekrar testlerinde "çözdüklerim de gelsin" seçeneği pencerede sorulur
    $("yks-tekrar-secenek").hidden = !tekrarMi(id);
    var aciklamaYaz = function () {
      var n = tekrarMi(id) ? Math.min(t.sayi, havuz(id).length) : t.sayi;
      $("seviye-aciklama").textContent = tekrarMi(id) && !n ? "Bu konulardaki bütün soruları çözmüşsün. “Çözdüklerim de gelsin”i seç."
        : n + " soru. Her soru için ne kadar süre istersin?";
      Array.prototype.forEach.call(document.querySelectorAll("#oyun-seviyeler button"), function (b) { b.disabled = !n; });
    };
    if (tekrarMi(id)) {
      var sc = tekrarSecim().c;
      Array.prototype.forEach.call(document.querySelectorAll("#yks-tekrar-secenek input"), function (r) {
        r.checked = (r.value === "hepsi") === sc;
        r.onchange = function () { var s = tekrarSecim(); s.c = r.value === "hepsi"; tekrarKaydet(s); aciklamaYaz(); };
      });
    }
    $("oyun-seviyeler").innerHTML = SEVIYELER.map(function (s) {
      var secili = s.id === durum.seviye;
      return '<button type="button" class="oyun-seviye' + (secili ? " secili" : "") + '" data-seviye="' + s.id +
        '" aria-pressed="' + secili + '"><strong>' + s.ad + "</strong><span>" + s.sure + " saniye</span></button>";
    }).join("");
    baglan("#oyun-seviyeler", "[data-seviye]", function (b) {
      durum.seviye = b.getAttribute("data-seviye");
      var k = oku(); k.seviye = durum.seviye; yaz(k);
      var h = seviyeHedef; seviyeKapat(); basla(h);
    });
    aciklamaYaz();
    $("seviye-perde").hidden = false;
    var sec = document.querySelector("#oyun-seviyeler .secili") || document.querySelector("#oyun-seviyeler button");
    if (sec) sec.focus();
  }
  function seviyeKapat() { $("seviye-perde").hidden = true; seviyeHedef = null; }
  $("seviye-vazgec").addEventListener("click", seviyeKapat);
  $("seviye-perde").addEventListener("click", function (e) { if (e.target === this) seviyeKapat(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("seviye-perde").hidden) seviyeKapat(); });

  // ---- Oyun ----
  function basla(konu) {
    if (secimModu) tekrarModu(false);
    durum.konu = konu;
    var t = testBilgi(konu);
    durum.sorular = soruSec(konu, t.sayi);
    durum.i = 0; durum.puan = 0; durum.kacan = []; durum.yeniPuan = 0; durum.kalan = 0; durum.puansiz = 0;
    if (sesAcik) sesBaglam();
    turArtir();
    $("oyun-konu-adi").textContent = t.kisaAd + " · " + seviye().ad;
    soruCiz();
    goster("oyun-soru");
  }

  function soruCiz() {
    var q = durum.sorular[durum.i];
    $("oyun-ilerleme").textContent = "Soru " + (durum.i + 1) + " / " + durum.sorular.length;
    $("oyun-puan").textContent = durum.puan;
    $("oyun-bar-dolu").style.width = (durum.i / durum.sorular.length * 100) + "%";
    $("oyun-metin").innerHTML = soruHtml(q);
    var secenekler = karistir(q.c.map(function (m, j) { return { m: m, dogru: j === 0 }; }));
    $("oyun-secenekler").innerHTML = secenekler.map(function (s, j) {
      return '<button type="button" class="oyun-secenek" data-j="' + j + '">' + bicim(s.m) + "</button>";
    }).join("");
    $("oyun-aciklama").hidden = true;
    $("oyun-sonraki").hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-secenek"), function (b) {
      b.addEventListener("click", function () { cevapla(b, secenekler, q); });
    });
    // Grafikli ve parçalı fonksiyonlu sorular daha uzun okunur: her seviyede ek süre.
    var ek = (q.g || /class="parcali"/.test(q.s)) ? (O.ekSure == null ? 5 : O.ekSure) : 0;
    sayaciBaslat(function () {
      // Süre doldu: puan yok, doğrudan sonraki soruya geç; doğru cevap sonuç ekranında gösterilir.
      durum.kacan.push({ q: q, neden: "sure", once: cozulduMu(q) });
      cevapYaz(q, false);
      cal("sayfa");
      sonraki();
    }, null, seviye().sure + ek);
  }

  function cevapla(btn, secenekler, q) {
    var kalanSn = Math.max(0, (sayacBitis - Date.now()) / 1000); // tam ölçüm; bonusta ortalama alınıp yuvarlanır
    sayaciDurdur();
    $("oyun-sure").classList.remove("az", "uyari");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-secenek"), function (b, j) {
      b.disabled = true;
      if (secenekler[j].dogru) b.classList.add("dogru");
    });
    var dogru = secenekler[+btn.getAttribute("data-j")].dogru;
    var onceCozulmus = cozulduMu(q);
    if (dogru) { durum.puan++; durum.kalan += kalanSn; if (onceCozulmus) durum.puansiz++; } else { btn.classList.add("yanlis"); durum.kacan.push({ q: q, neden: "yanlis", once: onceCozulmus }); }
    var yeniPuan = cevapYaz(q, dogru);
    if (yeniPuan) durum.yeniPuan++;
    $("oyun-puan").textContent = durum.puan;
    var ac = $("oyun-aciklama");
    ac.innerHTML = (dogru ? "<strong>Doğru! " + (yeniPuan ? "+1 puan" : "Bu soruyu daha önce çözüp puan almıştın; puan tekrar eklenmez.") + "</strong> "
      : "<strong>" + (onceCozulmus ? "Bu soruyu daha önce doğru çözmüştün, bu sefer kaçırdın. " : "") + "Doğru cevap yukarıda yeşil.</strong> ") + bicim(q.a);
    ac.className = "oyun-aciklama " + (dogru ? "iyi" : "kotu");
    ac.hidden = false;
    var son = durum.i === durum.sorular.length - 1;
    $("oyun-sonraki").textContent = son ? "Sonucu gör →" : "Sonraki soru →";
    $("oyun-sonraki").hidden = false;
    $("oyun-sonraki").focus();
  }

  function sonraki() {
    if (durum.i < durum.sorular.length - 1) { durum.i++; soruCiz(); } else { bitir(); }
  }
  $("oyun-sonraki").addEventListener("click", sonraki);

  // ---- ⚡ Doğru / Yanlış ----
  function dyBasla(id) {
    sayaciDurdur();
    if (sesAcik) sesBaglam();
    var n = (DY && DY.soruSayisi) || 5;
    var liste = soruSec(id, n);
    // En az bir doğru ve bir yanlış ifade olsun
    var h = havuz(id);
    [true, false].forEach(function (deger) {
      if (liste.length > 1 && !liste.some(function (q) { return q.d === deger; })) {
        var aday = karistir(h.filter(function (q) { return q.d === deger; }))[0];
        if (aday) liste[liste.length - 1] = aday;
      }
    });
    turArtir();
    dy.id = id; dy.liste = karistir(liste); dy.i = 0; dy.puan = 0; dy.seri = 0; dy.enSeri = 0; dy.kacan = [];
    var d = dyId(id);
    var b = BOLUMLER.filter(function (x) { return String(x.no) === d; })[0];
    $("dy-ad").textContent = "⚡ " + (d === "yks" ? "YKS · Temel Kavramlar" : d === "tum" ? "Tüm chapter'lar" : "Chapter " + d);
    $("dy-sn").textContent = (DY && DY.sure) || 5;
    dyCiz();
    goster("dy-soru");
  }
  function dyCiz() {
    var q = dy.liste[dy.i];
    dy.kilit = false;
    $("dy-ilerleme").textContent = (dy.i + 1) + " / " + dy.liste.length;
    $("dy-puan").textContent = dy.puan;
    $("dy-seri").textContent = "🔥 " + dy.seri;
    $("dy-bar").style.width = (dy.i / dy.liste.length * 100) + "%";
    $("dy-ifade").innerHTML = bicim(q.s);
    $("dy-kart").className = "dy-kart";
    $("dy-not").textContent = ""; $("dy-not").className = "dy-not";
    $("dy-dogru").disabled = false; $("dy-yanlis").disabled = false;
    $("dy-dogru").classList.remove("secildi"); $("dy-yanlis").classList.remove("secildi");
    sayaciBaslat(function () { cal("sayfa"); dyCevapla(null); }, "dy-sure", (DY && DY.sure) || 5,
      { uyari: DY && DY.uyari != null ? DY.uyari : 4, kritik: DY && DY.kritik != null ? DY.kritik : 2 });
  }
  function dyCevapla(cevap) {
    if (dy.kilit) return;
    dy.kilit = true;
    sayaciDurdur();
    $("dy-sure").classList.remove("az", "uyari");
    $("dy-dogru").disabled = true; $("dy-yanlis").disabled = true;
    if (cevap !== null) $(cevap ? "dy-dogru" : "dy-yanlis").classList.add("secildi");
    var q = dy.liste[dy.i], dogru = cevap !== null && cevap === q.d;
    var not = $("dy-not");
    if (dogru) {
      cevapYaz(q, true);
      dy.puan++; dy.seri++; dy.enSeri = Math.max(dy.enSeri, dy.seri);
      $("dy-kart").className = "dy-kart yesil";
      not.textContent = "✓ Doğru bildin!"; not.className = "dy-not iyi";
    } else {
      dy.seri = 0;
      dy.kacan.push({ q: q, neden: cevap === null ? "sure" : "yanlis" });
      cevapYaz(q, false);
      $("dy-kart").className = "dy-kart kirmizi";
      not.textContent = (cevap === null ? "⏱ Süre doldu · " : "✗ ") +
        (q.d ? "Bu ifade doğruydu." : "Bu ifade yanlıştı" + (q.n ? " · doğrusu: " + q.n : "."));
      not.className = "dy-not kotu";
    }
    $("dy-puan").textContent = dy.puan;
    $("dy-seri").textContent = "🔥 " + dy.seri;
    setTimeout(function () {
      if (dy.i < dy.liste.length - 1) { dy.i++; dyCiz(); } else { dyBitir(); }
    }, dogru ? 700 : 1600);
  }
  $("dy-dogru").addEventListener("click", function () { dyCevapla(true); });
  $("dy-yanlis").addEventListener("click", function () { dyCevapla(false); });
  document.addEventListener("keydown", function (e) {
    if ($("dy-soru").hidden) return;
    if (e.key === "d" || e.key === "D" || e.key === "ArrowLeft") dyCevapla(true);
    if (e.key === "y" || e.key === "Y" || e.key === "ArrowRight") dyCevapla(false);
  });

  function dyBitir() {
    sayaciDurdur();
    var n = dy.liste.length, p = dy.puan, kayit = oku();
    kayit.rekor = kayit.rekor || {};
    var eski = kayit.rekor[dy.id], yeniRekor = eski == null || p > eski;
    if (yeniRekor) kayit.rekor[dy.id] = p;
    delete kayit.toplam;
    kayit.oyun = (kayit.oyun || 0) + 1;
    yaz(kayit);
    var d = dyId(dy.id), so = (DY && DY.sonuc) || {};
    var b = BOLUMLER.filter(function (x) { return String(x.no) === d; })[0];
    $("oyun-sonuc-baslik").textContent = "⚡ " + (d === "yks" ? "YKS · Temel Kavramlar" : d === "tum" ? "Tüm chapter'lar" : "Chapter " + d + (b ? " · " + b.ad : ""));
    $("oyun-sonuc-puan").textContent = p;
    $("oyun-sonuc-toplam").textContent = n;
    var mesaj = p === n ? so.tam : p >= n * 0.8 ? so.iyi : p >= n * 0.6 ? so.orta : so.zayif;
    if (d === "tum" || d === "yks") mesaj = mesaj.replace(/ ?Şimdi.*$| ?sonra 5 soruluk teste geç\.| ?5 soruluk teste geçmeden önce chapter'ın derslerine dön\./, "");
    $("oyun-sonuc-mesaj").textContent = mesaj;
    $("oyun-rekor").textContent = "🔥 En uzun seri: " + dy.enSeri + (yeniRekor && eski != null ? " · Yeni rekor! (Önceki en iyi: " + eski + ")" : "");
    var liste = $("oyun-kacan");
    if (dy.kacan.length) {
      liste.innerHTML = "<h3>Kaçırdıkların</h3>" + dy.kacan.map(function (k) {
        return '<div class="oyun-kacan-soru"><p class="s">' + bicim(k.q.s) + "</p>" +
          '<p class="c"><strong>' + (k.q.d ? "Doğru" : "Yanlış") + ".</strong>" +
          (!k.q.d && k.q.n ? " Doğrusu: " + k.q.n : "") +
          (k.neden === "sure" ? ' <span class="etiket">süre doldu</span>' : "") + "</p></div>";
      }).join("");
      liste.hidden = false;
    } else { liste.hidden = true; }
    $("oyun-test-gec").hidden = d === "tum" || d === "yks";
    $("oyun-test-gec").setAttribute("data-hedef", "bolum-" + d);
    $("oyun-tekrar").textContent = "⚡ Yeni ifadelerle tekrar";
    $("oyun-tekrar").classList.toggle("primary", d === "tum" || d === "yks");
    $("oyun-tekrar").setAttribute("data-hedef", dy.id);
    $("oyun-konu-degis").textContent = "Geri dön";
    $("oyun-ders-link").hidden = !(b && b.ders);
    if (b && b.ders) { $("oyun-ders-link").href = b.ders; $("oyun-ders-link").textContent = "Chapter'ın derslerine dön"; }
    $("dy-bar").style.width = "100%";
    goster("oyun-sonuc");
  }
  $("oyun-test-gec").addEventListener("click", function () { seviyeSor(this.getAttribute("data-hedef")); });

  // ---- Sonuç ----
  function bitir() {
    sayaciDurdur();
    $("oyun-test-gec").hidden = true;
    $("oyun-tekrar").classList.add("primary");
    $("oyun-tekrar").setAttribute("data-hedef", durum.konu);
    $("oyun-konu-degis").textContent = "Konu değiştir";
    var n = durum.sorular.length, p = durum.puan;
    var kayit = oku();
    kayit.rekor = kayit.rekor || {};
    var anahtar = rekorAnahtar(durum.konu);
    var eski = kayit.rekor[anahtar];
    var yeniRekor = eski == null || p > eski;
    if (yeniRekor) kayit.rekor[anahtar] = p;
    delete kayit.toplam;
    kayit.oyun = (kayit.oyun || 0) + 1;
    // ⭐ Tam doğru bonusu (sadece 10 soruluk testler; chapter testleri 5 soru olduğu için hariç)
    var bonus = null;
    if (p === n && n >= (O.soruSayisi || 10) && !testBilgi(durum.konu).bolum) {
      bonus = bonusHesap(seviye().id, durum.kalan, n);
      bonus.eklendi = durum.yeniPuan > 0;   // turda yeni puan yoksa konu zaten bitmiştir: bonus eklenmez
      if (bonus.eklendi) { kayit.bonus = kayit.bonus || {}; kayit.bonus[anahtar] = (kayit.bonus[anahtar] || 0) + bonus.toplam; }
    }
    yaz(kayit);

    var enZor = seviye().id === SEVIYELER[SEVIYELER.length - 1].id;
    $("oyun-sonuc-puan").textContent = p;
    $("oyun-sonuc-toplam").textContent = n;
    $("oyun-sonuc-baslik").textContent = p === n ? "Mükemmel! 🎉" : p >= n * 0.7 ? "Çok iyi!" : p >= n * 0.4 ? "Fena değil" : "Tekrar zamanı";
    var konuBilgi = testBilgi(durum.konu);
    var oz = konuBilgi.sonuc, bs = O.bolumSonuc || {};
    if (konuBilgi.bolum) $("oyun-sonuc-baslik").textContent = konuBilgi.ad;
    $("oyun-sonuc-mesaj").textContent = konuBilgi.bolum
      ? (p === n ? bs.tam : p >= n * 0.8 ? bs.iyi : p >= n * 0.6 ? bs.orta : bs.zayif)
      : oz ? (p >= n * 0.8 ? oz.iyi : p >= n * 0.5 ? oz.orta : oz.zayif) : p === n
      ? (enZor ? "Hepsini doğru bildin. Başka bir konuya geçmeye ne dersin?" : "Hepsini doğru bildin. Bir üst seviyeyi dene!")
      : p >= n * 0.7 ? "Temelin sağlam. Kaçırdığın soruların cevapları aşağıda."
      : konuBilgi.yks ? "Kaçırdığın soruların cevapları aşağıda. Çözemediğin sorular, yeni sorular bitince tekrar karşına çıkacak."
      : "Kaçırdığın soruların cevapları aşağıda. Konu anlatımını izleyip tekrar dene.";
    var hk = havuz(durum.konu), bitti = !tekrarMi(durum.konu) && hk.length && cozulenSayi(hk, kayit) === hk.length;
    $("oyun-rekor").textContent = (tekrarMi(durum.konu) ? "" : yeniRekor && eski != null ? "Yeni rekor! (Önceki en iyi: " + eski + ") · "
      : eski != null ? seviye().ad + " seviyesinde en iyi skorun: " + Math.max(eski, p) + " · " : "") +
      "Bu turda " + durum.yeniPuan + " yeni puan" + (bonus && bonus.eklendi ? " + " + bonus.toplam + " bonus" : "") + " · " +
      toplamYazi(konuBilgi.yks ? "YKS" : "Üniversite", konuBilgi.yks ? yksSorular() : tumSorular(), kayit, konuBilgi.yks) +
      (bitti ? " · ✓ Bu konudaki tüm soruları çözdün! Sorular yine gelir ama artık puan ve bonus eklenmez." : "");

    var kayipSayi = durum.kacan.filter(function (k) { return k.once; }).length;
    var notlar = [];
    if (durum.puansiz) notlar.push("Daha önce çözüp puan aldığın " + durum.puansiz + " soruyu yine doğru yaptın; bu soruların puanı toplamına tekrar eklenmedi.");
    if (kayipSayi) notlar.push("Daha önce doğru çözdüğün " + kayipSayi + " soruyu bu sefer kaçırdın (aşağıda işaretli). Puanın silinmedi.");
    $("oyun-tekrar-not").innerHTML = notlar.join("<br>");
    $("oyun-tekrar-not").hidden = !notlar.length;

    var liste = $("oyun-kacan");
    if (durum.kacan.length) {
      liste.innerHTML = "<h3>Kaçırdığın sorular</h3>" + durum.kacan.map(function (k) {
        return '<div class="oyun-kacan-soru"><p class="s">' + soruHtml(k.q) + "</p>" +
          '<p class="c">Doğru cevap: <strong>' + bicim(k.q.c[0]) + "</strong>" +
          (k.neden === "sure" ? ' <span class="etiket">süre doldu</span>' : "") + "</p>" +
          (k.once ? '<p class="once-not">Bu soruyu daha önce doğru çözmüştün ama bu sefer ' + (k.neden === "sure" ? "süre doldu" : "yanlış yaptın") + ". (Puanın silinmedi.)</p>" : "") +
          '<p class="a">' + bicim(k.q.a) + "</p></div>";
      }).join("");
      liste.hidden = false;
    } else {
      liste.hidden = true;
    }
    $("oyun-ders-link").hidden = !konuBilgi.ders && (konuBilgi.bolum || konuBilgi.yks);
    $("oyun-ders-link").href = konuBilgi.ders || "ders.html?liste=calc1";
    $("oyun-ders-link").textContent = konuBilgi.bolum ? "Chapter'ın derslerine dön" : "Konu anlatımını izle";
    $("oyun-tekrar").textContent = konuBilgi.bolum ? "Yeni sorularla tekrar dene" : "Tekrar oyna";
    $("oyun-bar-dolu").style.width = "100%";
    goster("oyun-sonuc");
    if (bonus) kutla(bonus);
  }

  // ---- 🎆 Kutlama penceresi: büyük yazı, havai fişek ve yıldızlar ----
  function kutla(b) {
    var eski = $("kutlama"); if (eski) eski.remove();
    var detay = b.saniyeli
      ? (b.hiz ? "+" + b.sabit + " tam doğru · +" + b.hiz + " hız bonusu (soru başına ortalama " + String(b.ort).replace(".", ",") + " sn erken)"
        : "+" + b.sabit + " tam doğru · Soruları daha erken bitirirsen her saniye için +1 hız bonusu")
      : seviye().ad + " seviyede tam doğru";
    var not = b.eklendi ? "Toplam puanına +" + b.toplam + " eklendi."
      : "Bu konudaki tüm soruları daha önce çözmüştün; bu tur puan ve bonus eklenmedi. Yeni konulara geç!";
    var d = document.createElement("div");
    d.id = "kutlama"; d.className = "kutlama";
    d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "kutlama-baslik");
    d.innerHTML = '<canvas class="kutlama-fisek" aria-hidden="true"></canvas>' +
      '<div class="kutlama-kutu"><div class="kutlama-yildiz" aria-hidden="true">⭐ 🌟 ⭐</div>' +
      '<h2 id="kutlama-baslik">Tebrikler!</h2><p class="kutlama-metin">Tüm soruları doğru cevapladın.</p>' +
      (b.eklendi ? '<p class="kutlama-bonus">+' + b.toplam + ' bonus</p><p class="kutlama-detay">' + detay + "</p>"
        : '<p class="kutlama-bonus kucuk">⭐ Tam doğru!</p>') +
      (not ? '<p class="kutlama-not">' + not + "</p>" : "") +
      '<button type="button" class="btn primary big" id="kutlama-kapat">Harika! →</button></div>';
    document.body.appendChild(d);
    var kapat = function () { d.remove(); document.removeEventListener("keydown", tus); };
    var tus = function (e) { if (e.key === "Escape") kapat(); };
    $("kutlama-kapat").addEventListener("click", kapat);
    d.addEventListener("click", function (e) { if (e.target === d || e.target.tagName === "CANVAS") kapat(); });
    document.addEventListener("keydown", tus);
    $("kutlama-kapat").focus();
    cal("kutlama");
    if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) fisekler(d.querySelector("canvas"));
  }
  function fisekler(cv) {
    var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return;
    var dpr = window.devicePixelRatio || 1, W, H, parca = [], bas = Date.now(), SURE = 3200;
    function boyut() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    boyut();
    var renkler = ["#f5b700", "#e67e22", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6", "#ff6fb5"];
    function patlat() {
      var x = W * (0.15 + Math.random() * 0.7), y = H * (0.12 + Math.random() * 0.35);
      var r = renkler[Math.floor(Math.random() * renkler.length)], adet = 46;
      for (var i = 0; i < adet; i++) {
        var a = (Math.PI * 2 * i) / adet, h = 2 + Math.random() * 3.2;
        parca.push({ x: x, y: y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, omur: 1, renk: Math.random() < 0.25 ? "#fff6c2" : r, yildiz: Math.random() < 0.12 });
      }
    }
    var zamanlar = [0, 350, 700, 1100, 1500, 1900, 2300], z = 0;
    function yildizCiz(x, y, r) {
      ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r / 2.4 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
    }
    (function kare() {
      if (!cv.isConnected) return;
      var g = Date.now() - bas;
      while (z < zamanlar.length && g >= zamanlar[z]) { patlat(); z++; }
      ctx.clearRect(0, 0, W, H);
      parca = parca.filter(function (q) { return q.omur > 0.02; });
      parca.forEach(function (q) {
        q.x += q.vx; q.y += q.vy; q.vy += 0.05; q.vx *= 0.985; q.vy *= 0.985; q.omur *= 0.975;
        ctx.globalAlpha = q.omur; ctx.fillStyle = q.renk;
        if (q.yildiz) yildizCiz(q.x, q.y, 6); else { ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
      if (g < SURE || parca.length) requestAnimationFrame(kare); else ctx.clearRect(0, 0, W, H);
    })();
  }

  $("oyun-tekrar").addEventListener("click", function () {
    var h = this.getAttribute("data-hedef") || durum.konu;
    if (dyId(h)) dyBasla(h); else basla(h);
  });
  $("oyun-konu-degis").addEventListener("click", girisCiz);

  // 🔁 Konu Tekrarı: şeritteki düğme Konu Testi kartlarını seçim moduna alır; altta seçim çubuğu çıkar
  var secimModu = false;
  function tekrarKaydet(s) { var k = oku(); k.tekrar = { k: s.k, c: s.c }; yaz(k); }
  function tekrarModuUygula() {
    var s = tekrarSecim();
    Array.prototype.forEach.call(document.querySelectorAll("#yks-konular [data-konu]"), function (b) {
      var sec = secimModu && s.k.indexOf(b.getAttribute("data-konu")) >= 0;
      b.classList.toggle("secili", sec);
      if (secimModu) b.setAttribute("aria-pressed", String(sec)); else b.removeAttribute("aria-pressed");
    });
    if (secimModu) tekrarDurum();
  }
  function tekrarModu(acik) {
    secimModu = acik;
    if (!$("panel-yks")) return;
    $("panel-yks").classList.toggle("secim-modu", acik);
    $("tekrar-cubuk").hidden = !acik;
    tekrarModuUygula();
    if (acik) {
      var hedef = $("yks-konular").closest(".serit");
      hedef.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }
  function tekrarSec_(id, b) {
    var s = tekrarSecim(), i = s.k.indexOf(id);
    if (i >= 0) s.k.splice(i, 1);
    else if (s.k.length >= TEKRAR_EN_COK) { $("yks-tekrar-not").textContent = "En fazla " + TEKRAR_EN_COK + " konu seçebilirsin."; return; }
    else s.k.push(id);
    tekrarKaydet(s);
    tekrarModuUygula();
  }
  function tekrarDurum() {
    var s = tekrarSecim(), n = s.k.length;
    $("yks-tekrar-basla").disabled = !(n >= TEKRAR_EN_AZ && n <= TEKRAR_EN_COK);
    $("yks-tekrar-not").textContent = "🔁 Tekrar için " + TEKRAR_EN_AZ + "–" + TEKRAR_EN_COK + " konu seç · " + n + " seçili";
  }
  if ($("tekrar-ac")) {
    $("tekrar-ac").addEventListener("click", function () { tekrarModu(true); });
    $("tekrar-vazgec").addEventListener("click", function () { tekrarModu(false); });
    $("yks-tekrar-basla").addEventListener("click", function () { if (!this.disabled) seviyeSor(TEKRAR); });
  }

  // ---- Sekmeler: 🎓 Üniversite / 📘 YKS ----
  function sekmeAc(ad) {
    if (!$("panel-yks")) return;
    ["uni", "yks"].forEach(function (x) {
      $("panel-" + x).hidden = x !== ad;
      $("sekme-" + x).setAttribute("aria-selected", String(x === ad));
    });
    var k = oku(); k.sekme = ad; yaz(k);
    if (ad !== "yks" && secimModu) tekrarModu(false);
  }
  ["uni", "yks"].forEach(function (x) {
    if ($("sekme-" + x)) $("sekme-" + x).addEventListener("click", function () { sekmeAc(x); });
  });

  girisCiz();
  // oyun.html#bolum-2, #limit, #yks, #yks-rakam gibi linkler ilgili sekmeyi açar ve testi başlatır
  var hedef = decodeURIComponent((location.hash || "").slice(1));
  sekmeAc(hedef === "yks" || yksMi(hedef) ? "yks" : hedef ? "uni" : (oku().sekme === "yks" ? "yks" : "uni"));
  if (hedef && havuz(hedef).length) { if (dyId(hedef)) dyBasla(hedef); else seviyeSor(hedef); }
})();
