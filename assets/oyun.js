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
  function havuz(id) {
    if (id === "karisik") {
      return Object.keys(O.sorular).reduce(function (h, k) { return h.concat(O.sorular[k]); }, []);
    }
    return O.sorular[id] || [];
  }
  function bul(liste, id) { return liste.filter(function (x) { return x.id === id; })[0]; }
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

    $("oyun-konular").innerHTML = O.konular.map(function (k) {
      var r = (kayit.rekor || {})[rekorAnahtar(k.id)];
      return '<button type="button" class="card oyun-konu" data-konu="' + k.id + '">' +
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
    durum.sorular = karistir(havuz(konu)).slice(0, O.soruSayisi);
    durum.i = 0; durum.puan = 0; durum.kacan = [];
    var k = bul(O.konular, konu);
    $("oyun-konu-adi").textContent = (k ? k.ad : "") + " · " + seviye().ad;
    soruCiz();
    goster("oyun-soru");
  }

  function soruCiz() {
    var q = durum.sorular[durum.i];
    $("oyun-ilerleme").textContent = "Soru " + (durum.i + 1) + " / " + durum.sorular.length;
    $("oyun-puan").textContent = durum.puan;
    $("oyun-bar-dolu").style.width = (durum.i / durum.sorular.length * 100) + "%";
    $("oyun-metin").innerHTML = q.s;
    var secenekler = karistir(q.c.map(function (m, j) { return { m: m, dogru: j === 0 }; }));
    $("oyun-secenekler").innerHTML = secenekler.map(function (s, j) {
      return '<button type="button" class="oyun-secenek" data-j="' + j + '">' + s.m + "</button>";
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
    ac.innerHTML = (dogru ? "<strong>Doğru!</strong> " : "<strong>Doğru cevap yukarıda yeşil.</strong> ") + q.a;
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
    $("oyun-sonuc-mesaj").textContent = p === n
      ? (enZor ? "Hepsini doğru bildin. Başka bir konuya geçmeye ne dersin?" : "Hepsini doğru bildin. Bir üst seviyeyi dene!")
      : p >= n * 0.7 ? "Temelin sağlam. Kaçırdığın soruların cevapları aşağıda."
      : "Kaçırdığın soruların cevapları aşağıda. Konu anlatımını izleyip tekrar dene.";
    $("oyun-rekor").textContent = yeniRekor && eski != null ? "Yeni rekor! (Önceki en iyi: " + eski + ")"
      : eski != null ? seviye().ad + " seviyesinde en iyi skorun: " + Math.max(eski, p) : "";

    var liste = $("oyun-kacan");
    if (durum.kacan.length) {
      liste.innerHTML = "<h3>Kaçırdığın sorular</h3>" + durum.kacan.map(function (k) {
        return '<div class="oyun-kacan-soru"><p class="s">' + k.q.s + "</p>" +
          '<p class="c">Doğru cevap: <strong>' + k.q.c[0] + "</strong>" +
          (k.neden === "sure" ? ' <span class="etiket">süre doldu</span>' : "") + "</p>" +
          '<p class="a">' + k.q.a + "</p></div>";
      }).join("");
      liste.hidden = false;
    } else {
      liste.hidden = true;
    }
    $("oyun-bar-dolu").style.width = "100%";
    goster("oyun-sonuc");
  }

  $("oyun-tekrar").addEventListener("click", function () { basla(durum.konu); });
  $("oyun-konu-degis").addEventListener("click", girisCiz);

  girisCiz();
})();
