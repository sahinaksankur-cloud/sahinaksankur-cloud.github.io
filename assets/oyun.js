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
    var yeni = h.filter(function (q) { return eski.indexOf(q.s) < 0; });
    if (yeni.length < n) {
      var secilen = yeni.slice();
      var kalan = h.filter(function (q) { return secilen.indexOf(q) < 0; });
      secilen = secilen.concat(dengeliSec(kalan, n - secilen.length, yay));
      gor[id] = secilen.map(function (q) { return q.s; });
      yaz(kayit);
      return karistir(secilen);
    }
    var sec = dengeliSec(yeni, n, yay);
    gor[id] = eski.concat(sec.map(function (q) { return q.s; }));
    yaz(kayit);
    return sec;
  }
  function seviye() { return bul(SEVIYELER, durum.seviye) || SEVIYELER[0]; }
  function rekorAnahtar(konu) { return konu + ":" + seviye().id; }

  if (O.ad) { $("oyun-ad").textContent = O.ad; document.title = O.ad + " – Kuzey Kampüs"; }
  function goster(bolum) {
    ["oyun-giris", "oyun-soru", "oyun-sonuc"].forEach(function (b) { $(b).hidden = b !== bolum; });
    window.scrollTo(0, 0);
  }

  // ---- Sayaç ----
  function sayaciDurdur() {
    if (sayac) { clearInterval(sayac); sayac = null; }
  }
  function sayaciBaslat(sureBitti) {
    sayaciDurdur();
    var el = $("oyun-sure"), sure = seviye().sure;
    if (!sure) { el.hidden = true; return; }
    el.hidden = false;
    var bitis = Date.now() + sure * 1000;
    function guncelle() {
      var kalan = Math.max(0, bitis - Date.now());
      var sn = Math.ceil(kalan / 1000);
      el.textContent = sn;
      el.classList.toggle("az", sn <= KRITIK);
      el.classList.toggle("uyari", sn > KRITIK && sn <= UYARI);
      if (kalan <= 0) { sayaciDurdur(); sureBitti(); }
    }
    guncelle();
    sayac = setInterval(guncelle, 100);
  }

  // ---- Giriş ekranı ----
  function girisCiz() {
    sayaciDurdur();
    var kayit = oku();
    durum.seviye = bul(SEVIYELER, durum.seviye) ? durum.seviye : (bul(SEVIYELER, kayit.seviye) ? kayit.seviye : SEVIYELER[0].id);

    $("oyun-seviyeler").innerHTML = SEVIYELER.map(function (s) {
      var secili = s.id === durum.seviye;
      return '<button type="button" class="oyun-seviye' + (secili ? " secili" : "") + '" data-seviye="' + s.id +
        '" aria-pressed="' + secili + '"><strong>' + s.ad + "</strong><span>" + s.sure + " saniye</span></button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-seviye"), function (b) {
      b.addEventListener("click", function () {
        durum.seviye = b.getAttribute("data-seviye");
        var k = oku(); k.seviye = durum.seviye; yaz(k);
        girisCiz();
      });
    });

    if (O.bolumBaslik) $("oyun-bolum-baslik").textContent = O.bolumBaslik + " · " + (O.bolumSoruSayisi || 5) + " soru";
    $("oyun-bolumler").innerHTML = BOLUMLER.map(function (b) {
      var id = "bolum-" + b.no, r = (kayit.rekor || {})[rekorAnahtar(id)], t = testBilgi(id);
      return '<button type="button" class="card oyun-konu oyun-bolum" data-konu="' + id + '">' +
        '<span class="badge">Chapter ' + b.no + "</span><h3>" + b.ad + "</h3><p>" + b.aciklama + "</p>" +
        '<span class="meta">' + t.sayi + " soru" + (r != null ? " · En iyi (" + seviye().ad + "): " + r + "/" + t.sayi : "") + "</span></button>";
    }).join("");
    $("oyun-konular").innerHTML = O.konular.map(function (k) {
      var r = (kayit.rekor || {})[rekorAnahtar(k.id)];
      return '<button type="button" class="card oyun-konu" data-konu="' + k.id + '">' +
        (k.etiket ? '<span class="badge">' + k.etiket + "</span>" : "") +
        "<h3>" + k.ad + "</h3><p>" + k.aciklama + "</p>" +
        '<span class="meta">' + havuz(k.id).length + " soru" + (r != null ? " · En iyi (" + seviye().ad + "): " + r + "/" + O.soruSayisi : "") + "</span></button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-konu"), function (b) {
      b.addEventListener("click", function () { basla(b.getAttribute("data-konu")); });
    });
    var top = kayit.toplam || 0;
    $("oyun-toplam").textContent = top ? "Bu cihazda toplam puanın: " + top : "";
    goster("oyun-giris");
  }

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
    $("oyun-metin").innerHTML = bicim(q.s);
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

  // ---- Sonuç ----
  function bitir() {
    sayaciDurdur();
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
        return '<div class="oyun-kacan-soru"><p class="s">' + bicim(k.q.s) + "</p>" +
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

  $("oyun-tekrar").addEventListener("click", function () { basla(durum.konu); });
  $("oyun-konu-degis").addEventListener("click", girisCiz);

  girisCiz();
  // oyun.html#bolum-2 ya da oyun.html#limit gibi linkler testi doğrudan başlatır
  var hedef = decodeURIComponent((location.hash || "").slice(1));
  if (hedef && havuz(hedef).length) basla(hedef);
})();
