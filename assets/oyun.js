// Kuzey Kampüs – Calculus oyunu (kayıt yok; puanlar sadece bu cihazda, localStorage'da)
(function () {
  "use strict";
  var O = window.KK_OYUN;
  if (!O || !document.getElementById("oyun-giris")) return;

  var DEPO = "kk-oyun-v1";
  var $ = function (id) { return document.getElementById(id); };
  var durum = { konu: null, sorular: [], i: 0, puan: 0 };
  var SURE = O.sure == null ? 10 : O.sure;
  var sayac = null, otomatik = null;

  function sayaciDurdur() {
    if (sayac) { clearInterval(sayac); sayac = null; }
  }
  function sayaciBaslat(sureBitti) {
    sayaciDurdur();
    var el = $("oyun-sure");
    if (!SURE) { el.hidden = true; return; }
    el.hidden = false;
    var bitis = Date.now() + SURE * 1000;
    function guncelle() {
      var kalan = Math.max(0, bitis - Date.now());
      var sn = Math.ceil(kalan / 1000);
      el.textContent = sn;
      el.classList.toggle("az", sn <= 3);
      if (kalan <= 0) { sayaciDurdur(); sureBitti(); }
    }
    guncelle();
    sayac = setInterval(guncelle, 100);
  }

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
  if (O.ad) { $("oyun-ad").textContent = O.ad; document.title = O.ad + " – Kuzey Kampüs"; }
  function goster(bolum) {
    ["oyun-giris", "oyun-soru", "oyun-sonuc"].forEach(function (b) { $(b).hidden = b !== bolum; });
    window.scrollTo(0, 0);
  }

  function girisCiz() {
    var kayit = oku();
    $("oyun-konular").innerHTML = O.konular.map(function (k) {
      var r = (kayit.rekor || {})[k.id];
      return '<button type="button" class="card oyun-konu" data-konu="' + k.id + '">' +
        "<h3>" + k.ad + "</h3><p>" + k.aciklama + "</p>" +
        '<span class="meta">' + havuz(k.id).length + " soru" + (r != null ? " · En iyi: " + r + "/" + O.soruSayisi : "") + "</span></button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-konu"), function (b) {
      b.addEventListener("click", function () { basla(b.getAttribute("data-konu")); });
    });
    var top = kayit.toplam || 0;
    $("oyun-toplam").textContent = top ? "Bu cihazda toplam puanın: " + top : "";
    goster("oyun-giris");
  }

  function basla(konu) {
    durum.konu = konu;
    durum.sorular = karistir(havuz(konu)).slice(0, O.soruSayisi);
    durum.i = 0; durum.puan = 0;
    var k = O.konular.filter(function (x) { return x.id === konu; })[0];
    $("oyun-konu-adi").textContent = k ? k.ad : "";
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
    if (otomatik) { clearTimeout(otomatik); otomatik = null; }
    $("oyun-sure").classList.remove("bitti");
    Array.prototype.forEach.call(document.querySelectorAll(".oyun-secenek"), function (b) {
      b.addEventListener("click", function () { cevapla(b, secenekler, q); });
    });
    sayaciBaslat(function () { cevapla(null, secenekler, q); });
  }

  function cevapla(btn, secenekler, q) {
    sayaciDurdur();
    var dugmeler = document.querySelectorAll(".oyun-secenek");
    Array.prototype.forEach.call(dugmeler, function (b, j) {
      b.disabled = true;
      if (secenekler[j].dogru) b.classList.add("dogru");
    });
    var sureDoldu = !btn;
    var dogru = !sureDoldu && secenekler[+btn.getAttribute("data-j")].dogru;
    if (dogru) durum.puan++; else if (btn) btn.classList.add("yanlis");
    $("oyun-puan").textContent = durum.puan;
    var ac = $("oyun-aciklama");
    ac.innerHTML = (dogru ? "<strong>Doğru!</strong> " : sureDoldu ? "<strong>Süre doldu!</strong> Doğru cevap yeşil. "
      : "<strong>Doğru cevap yukarıda yeşil.</strong> ") + q.a;
    ac.className = "oyun-aciklama " + (dogru ? "iyi" : "kotu");
    ac.hidden = false;
    var son = durum.i === durum.sorular.length - 1;
    $("oyun-sonraki").textContent = son ? "Sonucu gör →" : "Sonraki soru →";
    $("oyun-sonraki").hidden = false;
    if (sureDoldu) {
      $("oyun-sure").classList.add("bitti");
      otomatik = setTimeout(sonraki, 2500);
    } else {
      $("oyun-sonraki").focus();
    }
  }

  function sonraki() {
    if (otomatik) { clearTimeout(otomatik); otomatik = null; }
    if (durum.i < durum.sorular.length - 1) { durum.i++; soruCiz(); } else { bitir(); }
  }

  $("oyun-sonraki").addEventListener("click", sonraki);

  function bitir() {
    sayaciDurdur();
    var n = durum.sorular.length, p = durum.puan;
    var kayit = oku();
    kayit.rekor = kayit.rekor || {};
    var eski = kayit.rekor[durum.konu];
    var yeniRekor = eski == null || p > eski;
    if (yeniRekor) kayit.rekor[durum.konu] = p;
    kayit.toplam = (kayit.toplam || 0) + p;
    kayit.oyun = (kayit.oyun || 0) + 1;
    yaz(kayit);

    $("oyun-sonuc-puan").textContent = p;
    $("oyun-sonuc-toplam").textContent = n;
    $("oyun-sonuc-baslik").textContent = p === n ? "Mükemmel! 🎉" : p >= n * 0.7 ? "Çok iyi!" : p >= n * 0.4 ? "Fena değil" : "Tekrar zamanı";
    $("oyun-sonuc-mesaj").textContent = p === n ? "Hepsini doğru bildin. Başka bir konuya geçmeye ne dersin?"
      : p >= n * 0.7 ? "Temelin sağlam. Yanlış yaptığın konulara bir göz at."
      : "Konu anlatımını izleyip tekrar dene; ikinci turda fark göreceksin.";
    $("oyun-rekor").textContent = yeniRekor && eski != null ? "Yeni rekor! (Önceki en iyi: " + eski + ")"
      : eski != null ? "Bu konudaki en iyi skorun: " + Math.max(eski, p) : "";
    $("oyun-bar-dolu").style.width = "100%";
    goster("oyun-sonuc");
  }

  $("oyun-tekrar").addEventListener("click", function () { basla(durum.konu); });
  $("oyun-konu-degis").addEventListener("click", function () { sayaciDurdur(); girisCiz(); });

  girisCiz();
})();
