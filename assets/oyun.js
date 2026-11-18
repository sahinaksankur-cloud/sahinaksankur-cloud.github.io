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
  var durum = { konu: null, seviye: null, sorular: [], i: 0, puan: 0, kacan: [] };
  var sayac = null;
  var DY = window.KK_DY || null;
  var dy = { id: null, liste: [], i: 0, puan: 0, seri: 0, enSeri: 0, kacan: [], kilit: false };
  function dyId(id) { var m = /^dy-(tum|\d+)$/.exec(id || ""); return m ? m[1] : null; }

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
  function tumSorular() {
    return Object.keys(O.sorular).reduce(function (h, k) { return h.concat(O.sorular[k]); }, []);
  }
  // Bir testin (konu turu ya da bölüm sonu testi) bilgileri
  function testBilgi(id) {
    var no = bolumNo(id);
    if (no) {
      var b = BOLUMLER.filter(function (x) { return x.no === no; })[0] || { no: no, ad: "" };
      return { id: id, bolum: true, ad: "Chapter " + no + " · " + b.ad, kisaAd: "Chapter " + no, ders: b.ders, sayi: O.bolumSoruSayisi || 5 };
    }
    var k = bul(O.konular, id) || {};
    return { id: id, bolum: false, ad: k.ad || "", kisaAd: k.ad || "", ders: k.ders, sonuc: k.sonuc, sayi: O.soruSayisi };
  }
  function havuz(id) {
    var d = dyId(id);
    if (d) {
      var hepsi = (DY && DY.ifadeler) || [];
      return d === "tum" ? hepsi : hepsi.filter(function (q) { return String(q.b).split(".")[0] === d; });
    }
    var no = bolumNo(id);
    if (no) return tumSorular().filter(function (q) { return String(q.b).split(".")[0] === String(no); });
    if (id === "karisik") {
      return Object.keys(O.sorular).reduce(function (h, k) { return h.concat(O.sorular[k]); }, []);
    }
    return O.sorular[id] || [];
  }
  // ∫ ve Σ işaretlerinin alt/üst sınırlarını ders kitabındaki gibi alt alta yazar.
  function bicim(html) {
    return String(html).replace(/([∫Σ])<sub>((?:(?!<\/sub>).)*)<\/sub><sup>((?:<sup>.*?<\/sup>|(?!<\/sup>).)*)<\/sup>/g,
      '$1<span class="sinir"><span class="ust">$3</span><span class="alt">$2</span></span>');
  }
  // Grafikli sorular: q.g = { x: [min, max], y: [min, max], p: [{ f: "x/2 + 1", a: 0, b: 3 }], bos: [[x, y]], dolu: [[x, y]], harf: { a: 1 } }
  // p: eğri parçaları (JavaScript ifadesi, a ≤ x ≤ b), bos: boş daire (delik), dolu: dolu nokta, harf: x eksenindeki harfli noktalar, dikey: kesik çizgiyle dikey asimptotlar,
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
      var f = new Function("x", "return " + pr.f), d = "", n = 60;
      for (k = 0; k <= n; k++) { var x = pr.a + (pr.b - pr.a) * k / n; d += (k ? "L" : "M") + r(X(x)) + "," + r(Y(f(x))); }
      o += '<path class="egri" d="' + d + '"/>';
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
  function soruHtml(q) { return bicim(q.s) + (q.g ? grafik(q.g) : ""); }
  function anahtar(q) { return q.g ? q.s + "#" + JSON.stringify(q.g) : q.s; }
  function bul(liste, id) { return (liste || []).filter(function (x) { return x.id === id; })[0]; }
  // Daha önce sorulmamış sorulara öncelik verir; havuz bitince baştan başlar.
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
  function soruSec(id, n) {
    var kayit = oku(), gor = (kayit.gorulen = kayit.gorulen || {}), h = havuz(id), yay = !!bolumNo(id);
    var eski = gor[id] || [];
    var yeni = h.filter(function (q) { return eski.indexOf(anahtar(q)) < 0; });
    if (yeni.length < n) {
      var secilen = yeni.slice();
      var kalan = h.filter(function (q) { return secilen.indexOf(q) < 0; });
      secilen = secilen.concat(dengeliSec(kalan, n - secilen.length, yay));
      gor[id] = secilen.map(anahtar);
      yaz(kayit);
      return karistir(secilen);
    }
    var sec = dengeliSec(yeni, n, yay);
    gor[id] = eski.concat(sec.map(anahtar));
    yaz(kayit);
    return sec;
  }
  function seviye() { return bul(SEVIYELER, durum.seviye) || SEVIYELER[0]; }
  function rekorAnahtar(konu) { return konu + ":" + seviye().id; }

  if (O.ad) { $("oyun-ad").textContent = O.ad; document.title = O.ad + " – Kuzey Kampüs"; }
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
    var bitis = Date.now() + sure * 1000;
    function guncelle() {
      var kalan = Math.max(0, bitis - Date.now());
      var sn = Math.ceil(kalan / 1000);
      el.textContent = sn;
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
      enIyiYazi(rek[rekorAnahtar(HAZIRLIK)], O.soruSayisi, sevAd) + "</div>" +
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
    $("oyun-konular").innerHTML = O.konular.filter(function (k) { return k.id !== HAZIRLIK; }).map(function (k) {
      var ust = k.id === "karisik" ? "Tüm konular" : havuz(k.id).length + " soru";
      return '<button type="button" class="sec s2" data-konu="' + k.id + '"><small>' + ust + "</small><strong>" + k.ad + "</strong>" +
        enIyiYazi(rek[rekorAnahtar(k.id)], O.soruSayisi, sevAd) + "</button>";
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

    var top = kayit.toplam || 0;
    $("oyun-toplam").textContent = top ? "Bu cihazda toplam puanın: " + top : "";
    goster("oyun-giris");
  }

  // ---- Seviye seçimi (teste başlarken) ----
  var seviyeHedef = null;
  function seviyeSor(id) {
    var t = testBilgi(id);
    seviyeHedef = id;
    var tur = t.bolum ? "📝 " + (O.bolumBaslik || "Sınava Hazır mısın?") : id === HAZIRLIK ? "🧭 Calculus'a Hazır mısın?" : "🎯 Konu Turları";
    $("seviye-tur").textContent = tur;
    $("seviye-baslik").textContent = t.bolum ? t.ad : (id === HAZIRLIK ? "Precalculus hazırlık testi" : t.ad);
    $("seviye-aciklama").textContent = t.sayi + " soru. Her soru için ne kadar süre istersin?";
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
    durum.konu = konu;
    var t = testBilgi(konu);
    durum.sorular = soruSec(konu, t.sayi);
    durum.i = 0; durum.puan = 0; durum.kacan = [];
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
    sayaciBaslat(function () {
      // Süre doldu: puan yok, doğrudan sonraki soruya geç; doğru cevap sonuç ekranında gösterilir.
      durum.kacan.push({ q: q, neden: "sure" });
      sonraki();
    });
  }

  function cevapla(btn, secenekler, q) {
    sayaciDurdur();
    $("oyun-sure").classList.remove("az", "uyari");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-secenek"), function (b, j) {
      b.disabled = true;
      if (secenekler[j].dogru) b.classList.add("dogru");
    });
    var dogru = secenekler[+btn.getAttribute("data-j")].dogru;
    if (dogru) durum.puan++; else { btn.classList.add("yanlis"); durum.kacan.push({ q: q, neden: "yanlis" }); }
    $("oyun-puan").textContent = durum.puan;
    var ac = $("oyun-aciklama");
    ac.innerHTML = (dogru ? "<strong>Doğru!</strong> " : "<strong>Doğru cevap yukarıda yeşil.</strong> ") + bicim(q.a);
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
    dy.id = id; dy.liste = karistir(liste); dy.i = 0; dy.puan = 0; dy.seri = 0; dy.enSeri = 0; dy.kacan = [];
    var d = dyId(id);
    var b = BOLUMLER.filter(function (x) { return String(x.no) === d; })[0];
    $("dy-ad").textContent = "⚡ " + (d === "tum" ? "Tüm chapter'lar" : "Chapter " + d);
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
    sayaciBaslat(function () { dyCevapla(null); }, "dy-sure", (DY && DY.sure) || 5,
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
      dy.puan++; dy.seri++; dy.enSeri = Math.max(dy.enSeri, dy.seri);
      $("dy-kart").className = "dy-kart yesil";
      not.textContent = "✓ Doğru bildin!"; not.className = "dy-not iyi";
    } else {
      dy.seri = 0;
      dy.kacan.push({ q: q, neden: cevap === null ? "sure" : "yanlis" });
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
    kayit.toplam = (kayit.toplam || 0) + p;
    kayit.oyun = (kayit.oyun || 0) + 1;
    yaz(kayit);
    var d = dyId(dy.id), so = (DY && DY.sonuc) || {};
    var b = BOLUMLER.filter(function (x) { return String(x.no) === d; })[0];
    $("oyun-sonuc-baslik").textContent = "⚡ " + (d === "tum" ? "Tüm chapter'lar" : "Chapter " + d + (b ? " · " + b.ad : ""));
    $("oyun-sonuc-puan").textContent = p;
    $("oyun-sonuc-toplam").textContent = n;
    var mesaj = p === n ? so.tam : p >= n * 0.8 ? so.iyi : p >= n * 0.6 ? so.orta : so.zayif;
    if (d === "tum") mesaj = mesaj.replace(/ ?Şimdi.*$| ?sonra 5 soruluk teste geç\.| ?5 soruluk teste geçmeden önce chapter'ın derslerine dön\./, "");
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
    $("oyun-test-gec").hidden = d === "tum";
    $("oyun-test-gec").setAttribute("data-hedef", "bolum-" + d);
    $("oyun-tekrar").textContent = "⚡ Yeni ifadelerle tekrar";
    $("oyun-tekrar").classList.toggle("primary", d === "tum");
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
    kayit.toplam = (kayit.toplam || 0) + p;
    kayit.oyun = (kayit.oyun || 0) + 1;
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
      : "Kaçırdığın soruların cevapları aşağıda. Konu anlatımını izleyip tekrar dene.";
    $("oyun-rekor").textContent = yeniRekor && eski != null ? "Yeni rekor! (Önceki en iyi: " + eski + ")"
      : eski != null ? seviye().ad + " seviyesinde en iyi skorun: " + Math.max(eski, p) : "";

    var liste = $("oyun-kacan");
    if (durum.kacan.length) {
      liste.innerHTML = "<h3>Kaçırdığın sorular</h3>" + durum.kacan.map(function (k) {
        return '<div class="oyun-kacan-soru"><p class="s">' + soruHtml(k.q) + "</p>" +
          '<p class="c">Doğru cevap: <strong>' + bicim(k.q.c[0]) + "</strong>" +
          (k.neden === "sure" ? ' <span class="etiket">süre doldu</span>' : "") + "</p>" +
          '<p class="a">' + bicim(k.q.a) + "</p></div>";
      }).join("");
      liste.hidden = false;
    } else {
      liste.hidden = true;
    }
    $("oyun-ders-link").hidden = !konuBilgi.ders && konuBilgi.bolum;
    $("oyun-ders-link").href = konuBilgi.ders || "ders.html?liste=calc1";
    $("oyun-ders-link").textContent = konuBilgi.bolum ? "Chapter'ın derslerine dön" : "Konu anlatımını izle";
    $("oyun-tekrar").textContent = konuBilgi.bolum ? "Yeni sorularla tekrar dene" : "Tekrar oyna";
    $("oyun-bar-dolu").style.width = "100%";
    goster("oyun-sonuc");
  }

  $("oyun-tekrar").addEventListener("click", function () {
    var h = this.getAttribute("data-hedef") || durum.konu;
    if (dyId(h)) dyBasla(h); else basla(h);
  });
  $("oyun-konu-degis").addEventListener("click", girisCiz);

  girisCiz();
  // oyun.html#bolum-2 ya da oyun.html#limit gibi linkler testi doğrudan başlatır
  var hedef = decodeURIComponent((location.hash || "").slice(1));
  if (hedef && havuz(hedef).length) { if (dyId(hedef)) dyBasla(hedef); else seviyeSor(hedef); }
})();
