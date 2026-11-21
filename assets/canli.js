// Kuzey Kampüs – 🔴 Canlı Yarışma (canli.html)
// Sunucu yok: soruları her cihaz kendisi seçer, ama seçimi yarışmanın tarih-saatine göre yaptığı için
// herkes aynı 10 soruyu aynı sırayla, aynı şık sırasıyla görür. Akış saate bağlıdır: soru 20 sn, cevap 8 sn.
// Saat, telefonun saatinden değil sitenin sunucusundan (Date başlığı) alınır.
// Kayıt yok; cevaplar ve seri sadece bu cihazda (kk-oyun-v1 → canli, canliSeri).
// canli.html?ekran=yayin → canlı yayın için büyük ekran (cevap verilmez, QR kod görünür)
// canli.html?deneme=1 (&grup=calculus) → 1 dakika içinde başlayan deneme yarışması (puan ve seri yazılmaz)
(function () {
  "use strict";
  var O = window.KK_OYUN, A = window.KK_ARAC, T = window.KK_TAKVIM;
  if (!O || !A || !T || !document.getElementById("canli-lobi")) return;
  var CFG = T.CFG, $ = function (id) { return document.getElementById(id); };
  var N = CFG.soruSayisi || 10, SORU = CFG.soruSure || 20, CEVAP = CFG.cevapSure || 8;
  var UYARI = O.uyari == null ? 5 : O.uyari, KRITIK = O.kritik == null ? 3 : O.kritik;
  var GUN = 86400e3, HARF = ["A", "B", "C", "D"];
  var URL_SITE = "https://kuzeykampuscalculus.com/canli.html";
  var q_ = new URLSearchParams(location.search);
  var YAYIN = q_.get("ekran") === "yayin";
  var azHareket = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (YAYIN) document.body.classList.add("yayin");
  $("kural-sure").textContent = SORU;

  // ---- Saat: sunucunun saatiyle fark (telefon saati 1 sn'den fazla kaymışsa düzeltilir) ----
  var fark = 0;
  function simdi() { return Date.now() + fark; }
  function saatAyarla() {
    var t0 = Date.now();
    return fetch(location.pathname + "?saat=" + t0, { method: "HEAD", cache: "no-store" }).then(function (r) {
      var t1 = Date.now(), d = Date.parse(r.headers.get("Date") || "");
      if (!isNaN(d)) { var f = d + 500 - (t0 + t1) / 2; fark = Math.abs(f) > 1000 ? f : 0; }
    }).catch(function () { /* çevrimdışıysa telefonun saati kullanılır */ });
  }

  // ---- Aynı girdiye her cihazda aynı sonucu veren karıştırma ----
  function h32(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0; h ^= h >>> 16;
    return h >>> 0;
  }
  function sirala(liste, tohum, anah) {
    return liste.map(function (x) { return { x: x, h: h32(tohum + "|" + anah(x)) }; })
      .sort(function (a, b) { return a.h - b.h; }).map(function (o) { return o.x; });
  }

  // ---- Soru havuzu: YKS → açık YKS konuları; Calculus → config'teki konular ----
  function konular(grup) {
    if (grup === "yks") return O.konular.filter(function (k) { return k.grup === "yks" && !k.gizli && (O.sorular[k.id] || []).length; }).map(function (k) { return k.id; });
    return (CFG.calculusKonular || ["limit", "turev", "integral"]).filter(function (id) { return (O.sorular[id] || []).length; });
  }
  // Konulardan sırayla birer soru alarak dengeli 10 soru; "haric" (son yarışmalarda çıkanlar) mümkünse gelmez
  function sec(tohum, grup, haric) {
    var ks = sirala(konular(grup), tohum, function (k) { return k; }), gr = {}, toplam = 0;
    ks.forEach(function (k) {
      var l = O.sorular[k].filter(function (q) { return !haric[A.anahtar(q)]; });
      gr[k] = sirala(l, tohum, A.anahtar); toplam += l.length;
    });
    if (toplam < N) ks.forEach(function (k) { gr[k] = sirala(O.sorular[k], tohum, A.anahtar); });
    var s = [], gorulen = {};
    while (s.length < N) {
      var eklendi = false;
      ks.forEach(function (k) {
        while (s.length < N && gr[k].length) {
          var q = gr[k].shift(), a = A.anahtar(q);
          if (!gorulen[a]) { gorulen[a] = 1; s.push(q); eklendi = true; break; }
        }
      });
      if (!eklendi) break;
    }
    return sirala(s, tohum + "#", A.anahtar);
  }
  // Aynı gruptaki önceki 6 yarışmanın soruları tekrar gelmesin (zincir 3 gün geriden kurulur)
  var planlar = {};
  function plan(y) {
    if (planlar[y.anahtar]) return planlar[y.anahtar];
    var sorular;
    if (y.deneme) sorular = sec(y.anahtar, y.grup, {});
    else {
      var once = T.aralik(y.bas - 3 * GUN, y.bas).filter(function (x) { return x.grup === y.grup && x.bas < y.bas; }).slice(-6);
      var son = [];
      once.concat([y]).forEach(function (x) {
        var haric = {};
        son.forEach(function (l) { l.forEach(function (q) { haric[A.anahtar(q)] = 1; }); });
        var l = sec(x.anahtar, x.grup, haric);
        son.push(l); if (son.length > 6) son.shift();
        sorular = l;
      });
    }
    var t = y.bas, adimlar = sorular.map(function (q, i) {
      var sure = SORU + ((q.g || /class="parcali"/.test(q.s)) ? A.ekSure : 0);
      var sira = sirala([0, 1, 2].slice(0, q.c.length), y.anahtar + "|" + i, String);
      var o = { q: q, sira: sira, bas: t, cevap: t + sure * 1000, bit: t + (sure + CEVAP) * 1000, sure: sure };
      t = o.bit;
      return o;
    });
    return (planlar[y.anahtar] = { y: y, adim: adimlar, bit: t });
  }

  // ---- Deneme yarışması: bir sonraki tam dakikada başlar (en az 30 sn sonra) ----
  var DENEME = null;
  if (q_.get("deneme")) {
    var dbas = +q_.get("bas") || Math.ceil((Date.now() + 30e3) / 60e3) * 60e3;
    var grp = q_.get("grup") === "calculus" ? "calculus" : "yks";
    var tr = new Date(dbas + T.TR);
    DENEME = { grup: grp, ad: T.AD[grp], saat: ("0" + tr.getUTCHours()).slice(-2) + ":" + ("0" + tr.getUTCMinutes()).slice(-2),
      gun: T.gunAnahtar(dbas), bas: dbas, anahtar: "deneme " + dbas + " " + grp, deneme: true };
    if (!q_.get("bas")) { q_.set("bas", dbas); history.replaceState(null, "", location.pathname + "?" + q_.toString()); }
  }
  function yarismalar(bas, bit) {
    var l = T.aralik(bas, bit);
    if (DENEME && DENEME.bas >= bas - GUN && DENEME.bas <= bit) l = l.concat([DENEME]).sort(function (a, b) { return a.bas - b.bas; });
    return l;
  }
  function adi(y) { return (y.deneme ? "Deneme · " : "") + y.ad + " " + y.saat; }

  // ---- Cihazdaki kayıt: kk-oyun-v1 → canli[anahtar] = { s: {soru: seçilen şık}, g: {gördüğü soru}, k: {puana işlendi}, p: yeni puan } ----
  function kayitAl(y) {
    var k = A.oku(); k.canli = k.canli || {};
    return { k: k, r: k.canli[y.anahtar] || { s: {}, g: {}, k: {}, p: 0 } };
  }
  function kayitYaz(y, o) {
    var k = o.k, sinir = T.gunAnahtar(simdi() - 7 * GUN);
    Object.keys(k.canli).forEach(function (a) { if (a.slice(0, 10) < sinir || (/^deneme/.test(a) && a !== y.anahtar)) delete k.canli[a]; });
    k.canli[y.anahtar] = o.r;
    A.yaz(k);
  }
  function seriAl() {
    var s = A.oku().canliSeri || {}, bugun = T.gunAnahtar(simdi()), dun = T.gunAnahtar(simdi() - GUN);
    return s.son === bugun || s.son === dun ? (s.n || 0) : 0;
  }
  function seriGuncelle() {
    var k = A.oku(), s = k.canliSeri || {}, bugun = T.gunAnahtar(simdi()), dun = T.gunAnahtar(simdi() - GUN);
    if (s.son === bugun) return;
    k.canliSeri = { son: bugun, n: s.son === dun ? (s.n || 0) + 1 : 1 };
    A.yaz(k);
  }
  function seriYazi(n) { return n ? "🔥 " + n + " gündür yarışmadasın" + (n > 1 ? "!" : "") : ""; }

  // ---- Katıl: sesin açılması ve ekranın kararmaması için bir dokunuş gerekir ----
  var katildi = false, kilit = null;
  function uyanik() {
    if (!katildi || kilit || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(function (l) {
      kilit = l; l.addEventListener("release", function () { kilit = null; });
    }).catch(function () { /* desteklenmiyorsa sorun değil */ });
  }
  function katil() {
    katildi = true; A.sesBaglam(); uyanik();
    $("lobi-katil").hidden = true; $("lobi-katildin").hidden = false;
  }
  $("lobi-katil").addEventListener("click", katil);
  document.addEventListener("pointerdown", function () { A.sesBaglam(); }, { once: true });
  var BASLIK = document.title, uyariCalindi = null;
  document.addEventListener("visibilitychange", function () { uyanik(); if (document.visibilityState === "visible") saatAyarla(); });

  function goster(bolum) {
    ["canli-lobi", "canli-soru", "canli-sonuc"].forEach(function (b) { $(b).hidden = b !== bolum; });
  }

  // ---- Soru ekranı ----
  var ekran = { anahtar: null, i: -1, faz: null, mod: null }, sonSn = null;
  function soruCiz(p, i, mod) {
    var a = p.adim[i], q = a.q;
    $("soru-rozet").textContent = mod === "canli" ? "🔴 CANLI" : "📝 Tekrar";
    $("soru-rozet").className = "canli-rozet" + (mod === "canli" ? "" : " tekrar");
    $("soru-ad").textContent = adi(p.y);
    $("soru-ilerleme").textContent = "Soru " + (i + 1) + " / " + p.adim.length;
    $("soru-bar").style.width = (i / p.adim.length * 100) + "%";
    $("soru-metin").innerHTML = A.soruHtml(q);
    $("soru-secenekler").innerHTML = a.sira.map(function (j, n) {
      return '<button type="button" class="oyun-secenek canli-secenek" data-j="' + j + '"' + (YAYIN ? " disabled" : "") +
        '><span class="harf">' + HARF[n] + "</span>" + A.bicim(q.c[j]) + "</button>";
    }).join("");
    $("soru-durum").textContent = YAYIN ? "" : "Süre bitmeden cevabını işaretle. İlk dokunuşun geçerli.";
    $("soru-durum").className = "canli-durum";
    $("soru-aciklama").hidden = true;
    $("soru-sonraki").hidden = true;
    $("soru-sure").hidden = false;
    $("soru-qr").hidden = !YAYIN;
    var f = document.querySelector("#soru-kart canvas"); if (f) f.remove();
    Array.prototype.forEach.call(document.querySelectorAll(".canli-secenek"), function (b) {
      b.addEventListener("click", function () { secildi(+b.getAttribute("data-j")); });
    });
    sonSn = null;
    goster("canli-soru");
    window.scrollTo(0, 0);
  }
  function sayacGoster(kalanMs) {
    var el = $("soru-sure"), sn = Math.max(0, Math.ceil(kalanMs / 1000));
    el.textContent = sn;
    if (sn !== sonSn) { sonSn = sn; if (sn > 0 && sn <= KRITIK) A.cal("tik"); }
    el.classList.toggle("az", sn > 0 && sn <= KRITIK);
    el.classList.toggle("uyari", sn > KRITIK && sn <= UYARI);
  }
  function isaretle(j) {
    Array.prototype.forEach.call(document.querySelectorAll(".canli-secenek"), function (b) {
      b.disabled = true;
      b.classList.toggle("secildi", +b.getAttribute("data-j") === j);
    });
  }
  // Süre bitti: doğru cevap herkese aynı anda; yıldızlar uçuşur
  function cevapGoster(q, secilen, ses) {
    var dogru = secilen === 0;
    Array.prototype.forEach.call(document.querySelectorAll(".canli-secenek"), function (b) {
      var j = +b.getAttribute("data-j");
      b.disabled = true;
      if (j === 0) b.classList.add("dogru");
      else if (j === secilen) b.classList.add("yanlis");
    });
    var el = $("soru-sure"); el.classList.remove("az", "uyari"); el.textContent = "✓";
    var d = $("soru-durum");
    if (YAYIN) { d.textContent = "Doğru cevap"; d.className = "canli-durum iyi"; }
    else if (secilen == null) { d.textContent = "⏱ Süre doldu, cevap vermedin."; d.className = "canli-durum kotu"; }
    else { d.textContent = dogru ? "✓ Doğru bildin!" : "✗ Bu sefer olmadı. Doğru cevap yeşil."; d.className = "canli-durum " + (dogru ? "iyi" : "kotu"); }
    var ac = $("soru-aciklama");
    ac.innerHTML = A.bicim(q.a || ""); ac.className = "oyun-aciklama " + (dogru || YAYIN ? "iyi" : "kotu"); ac.hidden = !q.a;
    if (ses) {
      A.cal(dogru ? "kutlama" : "sayfa");
      if (!azHareket && (dogru || YAYIN)) {
        var cv = document.createElement("canvas"); cv.className = "canli-fisek"; cv.setAttribute("aria-hidden", "true");
        $("soru-kart").appendChild(cv); A.fisekler(cv);
      }
    }
  }

  // ---- Canlı akış ----
  var aktif = null;   // { p, y } – şu an ekrandaki canlı yarışma
  var pratik = null;  // { p, i, secilen, bitis } – biten yarışmayı sonradan çözme
  var sonucAcik = null;
  function secildi(j) {
    if (pratik) return pratikCevap(j);
    if (!aktif || YAYIN || ekran.faz !== "soru") return;
    var y = aktif.y, o = kayitAl(y), i = ekran.i;
    if (o.r.s[i] != null) return;               // ilk dokunuş geçerli
    o.r.s[i] = j; o.r.g[i] = 1;
    kayitYaz(y, o);
    if (!y.deneme) seriGuncelle();
    isaretle(j);
    $("soru-durum").textContent = "Cevabın alındı ✓ Süre bitince doğru cevap gösterilecek.";
    $("soru-durum").className = "canli-durum alindi";
  }
  // Süresi biten ve öğrencinin gördüğü soruları puana işler (her soru bir kez)
  function isle(p, t) {
    if (YAYIN) return;
    var o = kayitAl(p.y), degisti = false;
    p.adim.forEach(function (a, i) {
      if (t < a.cevap || !o.r.g[i] || o.r.k[i]) return;
      o.r.k[i] = 1; degisti = true;
      if (!p.y.deneme && A.cevapYaz(a.q, o.r.s[i] === 0)) o.r.p = (o.r.p || 0) + 1;
    });
    if (degisti) kayitYaz(p.y, o);
  }
  function canliAdim(p, t) {
    for (var i = 0; i < p.adim.length; i++) {
      var a = p.adim[i];
      if (t < a.bit) return { i: i, faz: t < a.cevap ? "soru" : "cevap", a: a };
    }
    return null;
  }
  function dongu() {
    var t = simdi();
    var l = yarismalar(t - GUN, t + 2 * GUN);
    var simdiki = null;
    l.forEach(function (y) { var p = plan(y); if (y.bas <= t && t < p.bit) simdiki = p; });
    if (pratik && !simdiki) return pratikDongu();
    pratik = null;   // canlı yarışma başladıysa sonradan çözme bırakılır
    if (aktif && aktif !== simdiki) {
      // Yarışma bitti: katıldıysa sonucu göster
      isle(aktif, t);
      var biten = aktif; aktif = null; ekran = { anahtar: null };
      var o = kayitAl(biten.y);
      if (!YAYIN && Object.keys(o.r.g).length) { sonucGoster(biten); return; }
    }
    if (simdiki) {
      aktif = simdiki; sonucAcik = null;
      document.title = "🔴 Soru " + (canliAdim(simdiki, t).i + 1) + "/" + simdiki.adim.length + " – " + BASLIK;
      var d = canliAdim(simdiki, t), o2 = kayitAl(simdiki.y);
      isle(simdiki, t);
      if (ekran.anahtar !== simdiki.y.anahtar || ekran.i !== d.i) {
        soruCiz(simdiki, d.i, "canli");
        ekran = { anahtar: simdiki.y.anahtar, i: d.i, faz: null };
        if (d.faz === "soru" && o2.r.s[d.i] != null) {
          isaretle(o2.r.s[d.i]);
          $("soru-durum").textContent = "Cevabın alındı ✓ Süre bitince doğru cevap gösterilecek."; $("soru-durum").className = "canli-durum alindi";
        }
      }
      if (d.faz === "soru") {
        if (ekran.faz !== "soru") ekran.faz = "soru";
        if (document.visibilityState === "visible" && !o2.r.g[d.i] && !YAYIN) { o2.r.g[d.i] = 1; kayitYaz(simdiki.y, o2); }
        sayacGoster(d.a.cevap - t);
      } else if (ekran.faz !== "cevap") {
        var anlik = ekran.faz === "soru";      // soru ekranda açıkken süre bittiyse yıldızlar ve ses
        ekran.faz = "cevap";
        $("soru-bar").style.width = ((d.i + 1) / simdiki.adim.length * 100) + "%";
        cevapGoster(d.a.q, YAYIN ? null : (o2.r.g[d.i] ? (o2.r.s[d.i] == null ? null : o2.r.s[d.i]) : undefined), anlik);
        if (!o2.r.g[d.i] && !YAYIN) { $("soru-durum").textContent = "Bu soruya yetişemedin. Doğru cevap yeşil; sıradaki soru birazdan."; $("soru-durum").className = "canli-durum"; }
      }
      return;
    }
    if (sonucAcik) { document.title = BASLIK; return; }
    lobi(l, t);
  }

  // ---- Bekleme ekranı ----
  var lobiImza = null;
  function lobi(l, t) {
    var sira = l.filter(function (y) { return y.bas > t; })[0];
    if ($("canli-lobi").hidden) goster("canli-lobi");
    $("lobi-qr").hidden = !YAYIN;
    $("lobi-katil").hidden = katildi || YAYIN;
    $("lobi-katildin").hidden = !katildi || YAYIN;
    // Son 60 saniye: sayfada uyarı, sekme başlığında geri sayım, bir kez kısa ses (ekranı kapatan bir pencere açılmaz)
    var yakin = sira && sira.bas - t <= 60e3;
    $("lobi-uyari").hidden = !yakin;
    if (yakin) {
      var sn = Math.ceil((sira.bas - t) / 1000);
      $("lobi-uyari").textContent = "⏰ Yarışma " + sn + " saniye sonra başlıyor!" + (katildi || YAYIN ? "" : " Sesin açılması için “Yarışmaya katıl”a dokun.");
      document.title = "⏰ " + sn + " sn – " + BASLIK;
      if (uyariCalindi !== sira.anahtar) { uyariCalindi = sira.anahtar; A.cal("tik"); }
    } else document.title = BASLIK;
    if (sira) {
      $("lobi-baslik").textContent = adi(sira) + " yarışması";
      var yarin = sira.gun !== T.gunAnahtar(t);
      $("lobi-alt").textContent = (yarin ? "Yarın saat " : "Bugün saat ") + sira.saat + "'de başlıyor · " + N + " soru · her soru " + SORU + " sn";
      $("lobi-geri").textContent = T.saat(sira.bas - t);
      $("lobi-geri").classList.toggle("yakin", sira.bas - t <= 10e3);
    } else {
      $("lobi-baslik").textContent = "Canlı Yarışma";
      $("lobi-alt").textContent = "Şu an planlanmış yarışma yok.";
      $("lobi-geri").textContent = "";
    }
    var seri = seriAl();
    $("lobi-seri").textContent = seriYazi(seri); $("lobi-seri").hidden = !seri || YAYIN;
    // Bugünün programı (dakikada bir değişir; her saniye yeniden çizmeye gerek yok)
    var bugun = T.gunAnahtar(t), gunL = l.filter(function (y) { return y.gun === bugun; });
    Array.prototype.forEach.call(document.querySelectorAll("#lobi-program [data-bas]"), function (el) { el.textContent = T.saat(+el.getAttribute("data-bas") - t); });
    var imza = bugun + "|" + gunL.map(function (y) { return y.anahtar + (y.bas <= t ? "b" : ""); }).join(",");
    if (imza === lobiImza) return;
    lobiImza = imza;
    $("lobi-program").innerHTML = gunL.length ? gunL.map(function (y) {
      var p = plan(y), bitti = p.bit <= t, o = kayitAl(y), gordu = Object.keys(o.r.g).length;
      var dogru = Object.keys(o.r.s).filter(function (i) { return o.r.s[i] === 0; }).length;
      var durum = bitti ? (gordu ? "Katıldın · " + dogru + " / " + gordu + " doğru" : "Bitti") : y.bas <= t ? "Şimdi canlı" : (y === sira ? "Sıradaki · " : "") + "kalan süre";
      var kalan = !bitti && y.bas > t ? '<span class="canli-saat kucuk" data-bas="' + y.bas + '">' + T.saat(y.bas - t) + "</span>" : "";
      return '<li class="' + (bitti ? "bitti" : y === sira ? "sira" : "") + '"><span class="saat">' + y.saat + "</span>" +
        '<span class="ad">' + (y.deneme ? "Deneme · " : "") + y.ad + '<small>' + durum + "</small></span>" + kalan +
        (bitti && !YAYIN ? '<button type="button" class="btn" data-coz="' + y.anahtar + '">Çöz</button>' : "") + "</li>";
    }).join("") : "<li>Bugün yarışma yok.</li>";
    $("lobi-program-not").textContent = gunL.some(function (y) { return plan(y).bit <= t; }) && !YAYIN
      ? "Kaçırdığın yarışmayı “Çöz” ile kendi hızında çözebilirsin. Puanın normal testlerdeki gibi işlenir." : "";
    Array.prototype.forEach.call(document.querySelectorAll("[data-coz]"), function (b) {
      b.addEventListener("click", function () {
        var y = gunL.filter(function (x) { return x.anahtar === b.getAttribute("data-coz"); })[0];
        if (y) pratikBasla(plan(y));
      });
    });
  }

  // ---- Sonuç ----
  function sonucGoster(p) {
    sonucAcik = p;
    var o = kayitAl(p.y), gor = Object.keys(o.r.g).map(Number).sort(function (a, b) { return a - b; });
    var dogru = gor.filter(function (i) { return o.r.s[i] === 0; }).length, n = gor.length;
    var tam = n === p.adim.length && dogru === n;
    $("sonuc-baslik").textContent = tam ? "Tebrikler! " + n + " üzerinden " + n + " tam puan aldın 🎉" : adi(p.y) + " · Canlı Yarışma";
    $("sonuc-puan").textContent = dogru;
    $("sonuc-toplam").textContent = n;
    $("sonuc-mesaj").textContent = (n < p.adim.length ? "Katıldığın " + n + " sorudan " + dogru + " tanesini doğru bildin. " : "") +
      (tam ? adi(p.y) + " yarışmasındaki bütün soruları doğru bildin. Harikasın!" : dogru === n ? "Hepsi doğru, harikasın! 🎉" : dogru >= n * 0.7 ? "Çok iyi! Kaçırdıklarının cevapları aşağıda." : "Kaçırdığın soruların cevapları aşağıda. Bir sonraki yarışmada görüşürüz.") +
      (p.y.deneme ? " (Deneme yarışması: puan ve seri yazılmadı.)" : o.r.p ? " Toplam puanına +" + o.r.p + " eklendi." : "");
    $("sonuc-seri").textContent = seriYazi(seriAl());
    $("sonuc-paylas").setAttribute("data-metin", "Kuzey Kampüs Canlı Yarışma · " + p.y.ad + " " + p.y.saat + ": " + n + " sorudan " + dogru + " doğru" +
      (seriAl() > 1 ? " · 🔥 " + seriAl() + " gündür yarışıyorum" : "") + ". Sen de katıl:");
    var kacan = gor.filter(function (i) { return o.r.s[i] !== 0; });
    $("sonuc-kacan").innerHTML = kacan.length ? "<h3>Kaçırdığın sorular</h3>" + kacan.map(function (i) {
      var q = p.adim[i].q;
      return '<div class="oyun-kacan-soru"><p class="s">' + A.soruHtml(q) + "</p>" +
        '<p class="c">Doğru cevap: <strong>' + A.bicim(q.c[0]) + "</strong>" + (o.r.s[i] == null ? ' <span class="etiket">süre doldu</span>' : "") + "</p>" +
        '<p class="a">' + A.bicim(q.a || "") + "</p></div>";
    }).join("") : "";
    $("sonuc-kacan").hidden = !kacan.length;
    var t = simdi(), sira = yarismalar(t, t + 2 * GUN).filter(function (y) { return y.bas > t; })[0];
    $("sonuc-sira").textContent = sira ? "Sıradaki yarışma: " + adi(sira) + (sira.gun !== T.gunAnahtar(t) ? " (yarın)" : "") : "";
    $("soru-bar").style.width = "100%";
    goster("canli-sonuc");
    window.scrollTo(0, 0);
    var eskiF = document.querySelector("#sonuc-kart canvas"); if (eskiF) eskiF.remove();
    if (tam) {
      A.cal("kutlama");
      if (!azHareket) {
        var cv = document.createElement("canvas"); cv.className = "canli-fisek"; cv.setAttribute("aria-hidden", "true");
        $("sonuc-kart").appendChild(cv); A.fisekler(cv);
      }
    }
  }
  $("sonuc-tamam").addEventListener("click", function () { sonucAcik = null; lobiImza = null; dongu(); window.scrollTo(0, 0); });
  $("sonuc-paylas").addEventListener("click", function () {
    var metin = this.getAttribute("data-metin") || "Kuzey Kampüs Canlı Yarışma";
    if (navigator.share) { navigator.share({ text: metin, url: URL_SITE }).catch(function () {}); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(metin + " " + URL_SITE), "_blank", "noopener");
  });

  // ---- Biten yarışmayı sonradan çözme (kendi hızında; süre yine 20 sn) ----
  function pratikBasla(p) {
    pratik = { p: p, i: 0, dogru: 0, kacan: [] };
    A.sesBaglam();
    pratikSoru();
  }
  function pratikSoru() {
    var a = pratik.p.adim[pratik.i];
    soruCiz(pratik.p, pratik.i, "pratik");
    pratik.bitis = Date.now() + a.sure * 1000; pratik.secilen = undefined;
  }
  function pratikCevap(j) {
    if (pratik.secilen !== undefined) return;
    var q = pratik.p.adim[pratik.i].q;
    pratik.secilen = j;
    if (j === 0) pratik.dogru++; else pratik.kacan.push({ q: q, sure: j == null });
    A.cevapYaz(q, j === 0);
    if (j != null) isaretle(j);
    cevapGoster(q, j, true);
    var son = pratik.i === pratik.p.adim.length - 1;
    $("soru-sonraki").textContent = son ? "Sonucu gör →" : "Sonraki soru →";
    $("soru-sonraki").hidden = false;
    $("soru-sonraki").focus();
  }
  $("soru-sonraki").addEventListener("click", function () {
    if (!pratik) return;
    if (pratik.i < pratik.p.adim.length - 1) { pratik.i++; pratikSoru(); return; }
    var p = pratik.p, n = p.adim.length, d = pratik.dogru, kacan = pratik.kacan;
    pratik = null; sonucAcik = p;
    $("sonuc-baslik").textContent = adi(p.y) + " · Sonradan çözüldü";
    $("sonuc-puan").textContent = d; $("sonuc-toplam").textContent = n;
    $("sonuc-mesaj").textContent = d === n ? "Hepsi doğru! Bir dahaki sefere canlı yarışmada görüşelim. 🎉" : "Kaçırdığın soruların cevapları aşağıda. Bir dahaki yarışmayı canlı yakala!";
    $("sonuc-seri").textContent = "";
    $("sonuc-paylas").setAttribute("data-metin", "Kuzey Kampüs Canlı Yarışma · " + p.y.ad + " " + p.y.saat + " sorularından " + d + "/" + n + " yaptım. Sen de dene:");
    $("sonuc-kacan").innerHTML = kacan.length ? "<h3>Kaçırdığın sorular</h3>" + kacan.map(function (k) {
      return '<div class="oyun-kacan-soru"><p class="s">' + A.soruHtml(k.q) + '</p><p class="c">Doğru cevap: <strong>' + A.bicim(k.q.c[0]) + "</strong>" +
        (k.sure ? ' <span class="etiket">süre doldu</span>' : "") + '</p><p class="a">' + A.bicim(k.q.a || "") + "</p></div>";
    }).join("") : "";
    $("sonuc-kacan").hidden = !kacan.length;
    $("sonuc-sira").textContent = "";
    goster("canli-sonuc");
    window.scrollTo(0, 0);
  });
  function pratikDongu() {
    if (pratik.secilen !== undefined) return;
    var kalan = pratik.bitis - Date.now();
    sayacGoster(kalan);
    if (kalan <= 0) pratikCevap(null);
  }

  saatAyarla().then(dongu);
  setInterval(dongu, 200);
  setInterval(saatAyarla, 5 * 60e3);
})();
