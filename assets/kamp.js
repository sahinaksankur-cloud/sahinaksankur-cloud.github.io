// Kuzey Kampüs – 🏕 Kuzey Kampüs Kampları (kamp.html): birlikte ders çalışma.
// Sunucu yok. Kamplar saate bağlıdır (assets/kamp-takvim.js): herkes aynı saatte derse başlar, aynı saatte molaya çıkar.
// "Kendi saatinde çalış": 30 / 40 / 50 dk ders; 10 dk mola, iki kısa moladan sonra bir kez 20 dk uzun mola.
// Mola bitince okul zili + tarayıcının sesiyle "Kuzey Kampüs. Molanız bitti…" (ses dosyası yok, Web Audio + speechSynthesis).
// Ders sırasında ekran açılırsa "Ekranını kapat, çalışman bitmedi" uyarısı (Page Visibility).
// Arka plan sesleri (su, yağmur, hafif müzik) Web Audio ile üretilir.
// Rapor ve ayarlar sadece bu cihazda: localStorage → kk-kamp-v1 { gun: { "2026-11-25": saniye }, hedef: [...], ayar, aktif }.
// 🔥 Derse Isınma: seçilen konudan 5 soru (data/*.js ve oyun.js sayfa açıldıktan sonra yüklenir; puan Testler'e işlenir).
(function () {
  "use strict";
  var K = window.KK_KAMP, $ = function (id) { return document.getElementById(id); };
  if (!K || !$("kamp-giris")) return;
  var DEPO = "kk-kamp-v1", DK = 60e3, GUN = 86400e3;
  var KISA = 10, UZUN = 20, UZUN_ICIN = 2;         // 20 dk'lık mola için önce iki 10 dk'lık mola
  var KATIL_ONCE = 30 * DK;                          // kampa başlamadan 30 dk önce katılınabilir
  var GUN_AD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  function oku() { try { return JSON.parse(localStorage.getItem(DEPO)) || {}; } catch (e) { return {}; } }
  function yaz() { try { localStorage.setItem(DEPO, JSON.stringify(kayit)); } catch (e) { /* özel pencere */ } }
  var kayit = oku();
  kayit.gun = kayit.gun || {};
  kayit.hedef = kayit.hedef || [];
  kayit.ayar = kayit.ayar || {};
  var ayar = kayit.ayar;
  if (!ayar.sure) ayar.sure = 40;
  if (!ayar.arka) ayar.arka = "yok";
  if (ayar.ses == null) ayar.ses = 50;
  if (ayar.haber == null) ayar.haber = true;

  // ---- Saat: sitenin sunucusunun saati (telefon saati 1 sn'den fazla kaymışsa düzeltilir) ----
  var fark = 0;
  function simdi() { return Date.now() + fark; }
  var t0 = Date.now();
  fetch(location.pathname + "?saat=" + t0, { method: "HEAD", cache: "no-store" }).then(function (r) {
    var t1 = Date.now(), d = Date.parse(r.headers.get("Date") || "");
    if (!isNaN(d)) { var f = d + 500 - (t0 + t1) / 2; fark = Math.abs(f) > 1000 ? f : 0; }
  }).catch(function () { /* çevrimdışı: telefonun saati */ });

  // ---- Yazı yardımcıları ----
  function dkMetin(sn) {
    var dk = Math.floor((sn || 0) / 60), sa = Math.floor(dk / 60);
    return sa ? sa + " sa" + (dk % 60 ? " " + (dk % 60) + " dk" : "") : dk + " dk";
  }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), iki = function (n) { return ("0" + n).slice(-2); };
    return (s >= 3600 ? Math.floor(s / 3600) + ":" : "") + iki(Math.floor(s % 3600 / 60)) + ":" + iki(s % 60);
  }
  // "19:00" → "19:00'da", "08:00" → "08:00'de", "13:00" → "13:00'te" (sayının okunuşuna göre ek)
  function saatEk(hm) {
    var p = hm.split(":"), n = +p[1] || +p[0], son = n % 10;
    var ek = son ? ["", "de", "de", "te", "te", "te", "da", "de", "de", "da"][son] : n % 100 === 0 ? "de" : ["", "da", "de", "da", "ta", "de", "da", "de", "de", "da"][(n % 100) / 10];
    return hm + "'" + ek;
  }
  function kacis(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---- Rapor: çalışılan süre güne yazılır (saniye) ----
  function ekle(bas, ms) {
    if (!(ms > 0)) return;
    var g = K.gunAnahtar(bas);
    kayit.gun[g] = Math.round((kayit.gun[g] || 0) + ms / 1000);
    yaz();
  }
  // Kampta: katıldığı andan bitişe kadar ders bloklarıyla örtüşen süre
  function kampSure(a, bitis) {
    var k = K.bul(a.kamp), top = 0;
    if (!k) return 0;
    k.bloklar.forEach(function (b) {
      if (b.tur !== "ders") return;
      var x = Math.max(b.bas, a.katil), y = Math.min(b.bit, bitis);
      if (y > x) top += y - x;
    });
    return top;
  }
  // Henüz rapora yazılmamış, süren çalışmanın süresi (ms)
  function surenCalisma() {
    var a = kayit.aktif, s = simdi();
    if (!a) return 0;
    if (a.tur === "kamp") return kampSure(a, s);
    return a.faz === "ders" ? Math.min(s - a.fazBas, dersSiniri(a)) : 0;
  }
  function dersSiniri(a) { return (a.sure + 30) * DK; }   // sayfa açık unutulursa en fazla süre + 30 dk sayılır

  // ---- Sesler: okul zili, kısa çan, konuşma, arka plan ----
  var ctx = null;
  function baglam() {
    if (!ctx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      try { ctx = new A(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function zil(c) {
    var t = c.currentTime, sure = 2.4, cikis = c.createGain(), trem = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    cikis.gain.setValueAtTime(0.0001, t);
    cikis.gain.exponentialRampToValueAtTime(0.45, t + 0.03);
    cikis.gain.setValueAtTime(0.45, t + sure);
    cikis.gain.exponentialRampToValueAtTime(0.0001, t + sure + 0.7);
    trem.gain.value = 0.55; lfo.type = "square"; lfo.frequency.value = 19; lg.gain.value = 0.45;
    lfo.connect(lg); lg.connect(trem.gain);
    [[1250, 0.32], [2710, 0.18], [3920, 0.1], [5300, 0.05]].forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = p[0]; g.gain.value = p[1];
      o.connect(g); g.connect(trem); o.start(t); o.stop(t + sure + 0.8);
    });
    trem.connect(cikis); cikis.connect(c.destination);
    lfo.start(t); lfo.stop(t + sure + 0.8);
  }
  function can(c) {
    [[784, 0, 0.18], [1175, 0.18, 0.14], [1568, 0.36, 0.08]].forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + p[1];
      o.type = "sine"; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p[2], t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 2.3);
    });
  }
  function turkceSes() {
    var l = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return l.filter(function (v) { return /^tr/i.test(v.lang); })[0] || null;
  }
  if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", turkceSes);
  function konus(metin) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var u = new SpeechSynthesisUtterance(metin), v = turkceSes();
      u.lang = "tr-TR"; u.rate = 0.95; if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* konuşma yoksa zil yeter */ }
  }
  // Tarayıcılar sesi ve konuşmayı ancak bir dokunuştan sonra açar: başlarken bir kez "kilidi aç"
  function sesKilidiAc() {
    baglam();
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* yok */ }
    }
  }
  var MOLA_BITTI = "Kuzey Kampüs. Molanız bitti, lütfen çalışmaya dönün. Hadi bakalım, derse!";
  function alarm(metin) {
    var c = baglam();
    if (c) { try { zil(c); } catch (e) { /* ses yoksa yazı yeter */ } }
    setTimeout(function () { konus(metin || MOLA_BITTI); }, c ? 2900 : 0);
    if (navigator.vibrate) { try { navigator.vibrate([500, 250, 500, 250, 500]); } catch (e) { /* yok */ } }
  }

  // Arka plan sesleri (bilgisayar / tablet): su, yağmur, hafif müzik
  var arka = null;
  function gurultu(c, tur) {
    var n = c.sampleRate * 4, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0), son = 0, b = [0, 0, 0];
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      if (tur === "kahve") { son = (son + 0.02 * w) / 1.02; d[i] = son * 3.5; }
      else { b[0] = 0.99765 * b[0] + w * 0.099; b[1] = 0.963 * b[1] + w * 0.2965; b[2] = 0.57 * b[2] + w * 1.0526; d[i] = (b[0] + b[1] + b[2] + w * 0.1848) * 0.22; }
    }
    var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    return src;
  }
  function arkaSiddet() { var v = (ayar.ses || 0) / 100; return v * v * 0.9; }
  function arkaDurdur() {
    if (!arka) return;
    arka.zaman.forEach(clearInterval);
    try { arka.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); } catch (e) { /* yok */ }
    var eski = arka;
    setTimeout(function () { eski.kaynak.forEach(function (s) { try { s.stop(); } catch (e) { /* bitti */ } }); try { eski.g.disconnect(); } catch (e) { /* yok */ } }, 1200);
    arka = null;
  }
  function pad(c, hedef, frekanslar, sure) {
    var t = c.currentTime;
    frekanslar.forEach(function (f, i) {
      [["sine", 1, 0.05], ["triangle", 1.003, 0.018]].forEach(function (p) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = p[0]; o.frequency.value = f * p[1];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p[2] / (1 + i * 0.25), t + 2.5);
        g.gain.setValueAtTime(p[2] / (1 + i * 0.25), t + sure - 3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
        o.connect(g); g.connect(hedef); o.start(t); o.stop(t + sure + 0.1);
      });
    });
  }
  function nota(c, hedef, f, bas) {
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + bas;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    o.connect(g); g.connect(hedef); o.start(t); o.stop(t + 3.1);
  }
  function arkaBaslat() {
    arkaDurdur();
    if (ayar.arka === "yok") return;
    var c = baglam();
    if (!c) return;
    var g = c.createGain(), kaynak = [], zaman = [];
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.setTargetAtTime(arkaSiddet() || 0.0001, c.currentTime, 0.8);
    g.connect(c.destination);
    if (ayar.arka === "su") {
      // Akan su: kahverengi gürültü, süzgecin frekansı yavaşça dalgalanır
      var s = gurultu(c, "kahve"), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
      lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.7;
      lfo.frequency.value = 0.13; lg.gain.value = 350; lfo.connect(lg); lg.connect(lp.frequency);
      var s2 = gurultu(c, "pembe"), bp = c.createBiquadFilter(), g2 = c.createGain();
      bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 1.2; g2.gain.value = 0.12;
      s.connect(lp); lp.connect(g); s2.connect(bp); bp.connect(g2); g2.connect(g);
      s.start(); s2.start(); lfo.start(); kaynak.push(s, s2, lfo);
    } else if (ayar.arka === "yagmur") {
      // Yağmur: pembe gürültü + ara ara damla sesleri
      var y = gurultu(c, "pembe"), hp = c.createBiquadFilter(), lp2 = c.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 500; lp2.type = "lowpass"; lp2.frequency.value = 7000;
      y.connect(hp); hp.connect(lp2); lp2.connect(g); y.start(); kaynak.push(y);
      zaman.push(setInterval(function () {
        if (Math.random() < 0.5) return;
        var o = c.createOscillator(), dg = c.createGain(), t = c.currentTime;
        o.type = "sine"; o.frequency.setValueAtTime(1800 + Math.random() * 2500, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        dg.gain.setValueAtTime(0.0001, t); dg.gain.exponentialRampToValueAtTime(0.05 * Math.random() + 0.01, t + 0.005); dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(dg); dg.connect(g); o.start(t); o.stop(t + 0.08);
      }, 90));
    } else if (ayar.arka === "muzik") {
      // Hafif müzik: yumuşak akorlar (Cmaj7 – Am7 – Fmaj7 – G6) ve ara ara tek notalar
      var lpm = c.createBiquadFilter(); lpm.type = "lowpass"; lpm.frequency.value = 1600; lpm.connect(g);
      var akorlar = [[130.81, 164.81, 196, 246.94], [110, 130.81, 164.81, 196], [87.31, 110, 130.81, 164.81], [98, 123.47, 146.83, 164.81]];
      var notalar = [523.25, 587.33, 659.25, 783.99, 880], i = 0;
      var cal = function () {
        pad(c, lpm, akorlar[i % 4], 9);
        if (Math.random() < 0.7) nota(c, lpm, notalar[Math.floor(Math.random() * notalar.length)], 2 + Math.random() * 3);
        i++;
      };
      cal(); zaman.push(setInterval(cal, 8000));
    }
    arka = { g: g, kaynak: kaynak, zaman: zaman };
  }

  // ---- Ekranı açık tutma: sadece molada (mola bitince zil duyulsun diye). Ders sırasında kullanılmaz. ----
  var kilit = null;
  function kilitAl() {
    if (kilit || !navigator.wakeLock || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(function (l) { kilit = l; l.addEventListener("release", function () { kilit = null; }); }).catch(function () { /* izin yok */ });
  }
  function kilitBirak() { if (kilit) { try { kilit.release(); } catch (e) { /* yok */ } kilit = null; } }

  // ---- Şu anki durum: { faz: "ders" | "mola" | "donus" | "bekle", kalan, toplam, ... } ----
  function hal() {
    var a = kayit.aktif, s = simdi();
    if (!a) return null;
    if (a.tur === "kisisel") {
      if (a.faz === "ders") return { faz: "ders", gecen: s - a.fazBas, toplam: a.sure * DK, kalan: a.sure * DK - (s - a.fazBas), no: a.dersNo };
      if (a.faz === "mola") return { faz: "mola", toplam: a.molaSure * DK, kalan: a.molaSure * DK - (s - a.fazBas), no: a.dersNo };
      return { faz: "donus", gecen: s - a.fazBas, no: a.dersNo };
    }
    var k = K.bul(a.kamp);
    if (!k) return null;
    if (s < k.bas) return { faz: "bekle", kamp: k, kalan: k.bas - s };
    if (s >= k.bit) return { faz: "bitti", kamp: k };
    var b = k.bloklar.filter(function (x) { return x.bas <= s && s < x.bit; })[0];
    return { faz: b.tur, kamp: k, blok: b, no: b.no, kalan: b.bit - s, toplam: b.bit - b.bas };
  }
  function dersteMi() { var h = hal(); return !!(h && h.faz === "ders" && h.kalan > 0); }

  // ---- Başlatma / bitirme ----
  function kisiselBasla() {
    sesKilidiAc();
    kayit.aktif = { tur: "kisisel", sure: ayar.sure, faz: "ders", fazBas: simdi(), dersNo: 1, kisa: 0, toplam: 0, bas: simdi() };
    yaz(); haberVerildi = false; ekranGoster(); arkaBaslat();
  }
  function kampaKatil(anahtar) {
    sesKilidiAc();
    kayit.aktif = { tur: "kamp", kamp: anahtar, katil: simdi() };
    yaz(); ekranGoster(); arkaBaslat();
  }
  var sonMesaj = "";
  function bitir(mesaj) {
    var a = kayit.aktif, s = simdi(), ms = 0;
    if (!a) return;
    if (a.tur === "kamp") {
      var k = K.bul(a.kamp);
      ms = kampSure(a, Math.min(s, k ? k.bit : s));
      ekle(a.katil, ms);
      sonMesaj = mesaj || "✓ Kamptan ayrıldın" + (k ? " (" + k.ad + ")" : "") + ". Bu kampta " + dkMetin(ms / 1000) + " çalıştın.";
    } else {
      if (a.faz === "ders") { ms = Math.min(s - a.fazBas, dersSiniri(a)); ekle(a.fazBas, ms); }
      sonMesaj = "✓ Çalışmanı bitirdin. Bu oturumda " + dkMetin(((a.toplam || 0) + ms) / 1000) + " çalıştın.";
    }
    kayit.aktif = null; yaz();
    arkaDurdur(); kilitBirak();
    document.body.classList.remove("calisiyor");
    girisGoster();
  }
  function molayaCik(dk) {
    var a = kayit.aktif, s = simdi();
    if (!a || a.tur !== "kisisel" || a.faz !== "ders") return;
    var ms = Math.min(s - a.fazBas, dersSiniri(a));
    ekle(a.fazBas, ms); a.toplam = (a.toplam || 0) + ms;
    a.kisa = dk === UZUN ? 0 : (a.kisa || 0) + 1;
    a.faz = "mola"; a.fazBas = s; a.molaSure = dk;
    yaz(); kilitAl(); ciz();
  }
  function derseDon() {
    var a = kayit.aktif;
    if (!a || a.tur !== "kisisel") return;
    a.faz = "ders"; a.fazBas = simdi(); a.dersNo = (a.dersNo || 1) + 1;
    yaz(); haberVerildi = false; alarmSayi = 0; kilitBirak(); ciz();
  }

  // ---- Ekranlar ----
  function goster(b) {
    ["kamp-giris", "kamp-calis", "kamp-isinma"].forEach(function (x) { $(x).hidden = x !== b; });
    window.scrollTo(0, 0);
  }
  function girisGoster() {
    goster("kamp-giris");
    document.title = "Kuzey Kampüs Kampları – Birlikte Ders Çalışma";
    $("kamp-devam").hidden = !sonMesaj;
    $("kamp-devam").textContent = sonMesaj;
    kartlar(true); rapor();
  }
  function ekranGoster() {
    goster("kamp-calis");
    document.body.classList.add("calisiyor");
    $("calis-bitir").textContent = kayit.aktif.tur === "kamp" ? "Kamptan ayrıl" : "Çalışmayı bitir";
    $("hedef").value = kayit.aktif.hedef || "";
    sesDugmeleri();
    sonFaz = null;
    ciz();
  }

  // Çalışma ekranını çizer; fazlar arası geçişte zil / haber
  var sonFaz = null, haberVerildi = false, alarmSayi = 0, sonAlarm = 0, sonDk = null;
  function ciz() {
    var a = kayit.aktif;
    if (!a || $("kamp-calis").hidden) return;
    var h = hal(), s = simdi();
    if (!h) { bitir(); return; }
    // Kamp bittiyse
    if (h.faz === "bitti") {
      var k0 = h.kamp;
      konus("Kuzey Kampüs. " + k0.ad + " bitti. Bugün harika çalıştın!");
      var c0 = baglam(); if (c0) can(c0);
      var ms0 = kampSure(a, k0.bit);
      bitir("🏕 " + k0.ad + " bitti. Bu kampta " + dkMetin(ms0 / 1000) + " çalıştın. Yarın aynı saatte görüşürüz!");
      return;
    }
    // Kişisel: mola süresi dolduysa "dönüş" fazına geç
    if (a.tur === "kisisel" && a.faz === "mola" && h.kalan <= 0) {
      a.faz = "donus"; a.fazBas = a.fazBas + a.molaSure * DK; yaz(); h = hal();
    }
    var fazAnah = h.faz + "|" + (h.blok ? h.blok.bas : a.fazBas);
    if (sonFaz && sonFaz !== fazAnah) gecis(sonFaz.split("|")[0], h);
    sonFaz = fazAnah;

    var etiket = a.tur === "kamp" ? h.kamp.ikon + " " + h.kamp.ad : "⏱ Kendi saatinde · " + a.sure + " dk ders";
    var faz = "", sure = "", mesaj = "", dugmeler = "", oran = 0, gizli = false;
    if (h.faz === "bekle") {
      faz = "Kamp saat " + saatEk(h.kamp.saat) + " başlıyor";
      sure = mmss(h.kalan); oran = 0;
      mesaj = "Kitabını, defterini hazırla. Saat gelince zil çalar ve ilk ders başlar. Sayfayı açık tut.";
      document.title = "🏕 " + mmss(h.kalan) + " · Kamp başlıyor";
    } else if (h.faz === "ders") {
      faz = "📖 " + h.no + ". ders" + (a.tur === "kamp" ? " / " + h.kamp.dersSayisi : "");
      if (h.kalan > 0) {
        oran = 1 - h.kalan / h.toplam;
        gizli = !!ayar.gizle;
        sure = "yaklaşık " + K.dkYaz(h.kalan) + " kaldı";
        mesaj = "Telefonunu kenara koy, kitabına dön. Molan geldiğinde burada olacak.";
      } else {
        oran = 1;
        sure = h.toplam / DK + " dakikayı tamamladın";
        mesaj = "Molaya çıkabilirsin. İstersen biraz daha devam et.";
        var uzunOlur = (a.kisa || 0) >= UZUN_ICIN;
        dugmeler = '<button type="button" class="btn primary big" data-mola="' + KISA + '">☕ ' + KISA + " dk mola</button>" +
          '<button type="button" class="btn big" data-mola="' + UZUN + '"' + (uzunOlur ? "" : " disabled") + ">🛋 " + UZUN + " dk uzun mola</button>" +
          (uzunOlur ? "" : '<span class="kamp-kucuk">Uzun mola için ' + (UZUN_ICIN - (a.kisa || 0)) + " kısa mola daha.</span>");
        if (!haberVerildi) { haberVerildi = true; if (ayar.haber) haberVer(); }
      }
      document.title = "📖 " + h.no + ". ders · Kuzey Kampüs";
    } else if (h.faz === "mola") {
      faz = h.blok && h.blok.uzun || a.molaSure === UZUN ? "🛋 Uzun mola" : "☕ Mola";
      sure = mmss(h.kalan); oran = 1 - h.kalan / h.toplam;
      mesaj = "Kalk, su iç, biraz hareket et. Mola bitince zil çalacak; sayfayı kapatma.";
      if (a.tur === "kisisel") dugmeler = '<button type="button" class="btn big" data-don>Molayı bitir, derse dön</button>';
      dugmeler += yarismaLink(s, s + h.kalan);
      document.title = "☕ " + mmss(h.kalan) + " · Mola";
      kilitAl();
    } else if (h.faz === "donus") {
      faz = "🔔 Molan bitti!";
      var uzadi = Math.floor(h.gecen / DK);
      sure = uzadi >= 1 ? "Molan " + uzadi + " dk uzadı" : "Hadi bakalım, derse!";
      mesaj = "Derse dönünce aşağıdaki düğmeye dokun; sayaç yeniden başlar.";
      dugmeler = '<button type="button" class="btn primary big" data-don>📖 Derse döndüm</button>';
      document.title = "🔔 Molan bitti! · Kuzey Kampüs";
      // Dönmezse her dakika yeniden hatırlat (en fazla 5 kez)
      if (alarmSayi < 5 && s - sonAlarm >= DK && document.visibilityState === "visible") { alarmSayi++; sonAlarm = s; alarm(); }
      kilitAl();
    }
    $("calis-etiket").textContent = etiket;
    $("calis-faz").textContent = faz;
    $("calis-sure").textContent = gizli ? "" : sure;
    $("calis-sure").classList.toggle("buyuk", h.faz === "mola" || h.faz === "bekle");
    $("calis-bar-kutu").hidden = gizli || h.faz === "donus";
    $("calis-bar").style.width = Math.round(Math.min(1, Math.max(0, oran)) * 100) + "%";
    $("calis-kart").className = "calis-kart faz-" + h.faz;
    $("calis-mesaj").textContent = mesaj;
    if ($("calis-dugmeler").getAttribute("data-html") !== dugmeler) {
      $("calis-dugmeler").innerHTML = dugmeler;
      $("calis-dugmeler").setAttribute("data-html", dugmeler);
    }
    var hd = a.hedef || "";
    $("calis-hedef").hidden = !hd;
    $("calis-hedef").textContent = hd ? "🎯 " + hd : "";
    if (h.faz === "ders" && h.kalan > 0) kilitBirak();
  }
  // Molada Canlı Yarışma varsa (ya da sürüyorsa): yeni sekmede açılır, kamp sayfası açık kalır ve zil burada çalar
  function yarismaLink(bas, bit) {
    var T = window.KK_TAKVIM;
    if (!T || T.CFG.aktif === false) return "";
    var y = T.aralik(bas - 10 * DK, bit).filter(function (x) { return x.bas < bit && x.bas + T.tahminiSure() > bas; })[0];
    if (!y) return "";
    var basladi = y.bas <= bas;
    return '<a class="btn kamp-yarisma" href="canli.html" target="_blank" rel="noopener">🔴 Molada Canlı Yarışma: ' + y.ad + " " + y.saat +
      (basladi ? " · şimdi" : "") + " →</a>" + '<span class="kamp-kucuk">Yarışma yeni sekmede açılır. Bu sayfayı kapatma; mola bitince zil burada çalar.</span>';
  }
  // Faz değişince (sayfa açıkken): molaya geçişte haber, derse geçişte zil + konuşma
  function gecis(eski, h) {
    var a = kayit.aktif;
    if (h.faz === "mola" && a.tur === "kamp") { if (ayar.haber) haberVer(); kilitAl(); }
    if (h.faz === "ders" && a.tur === "kamp") {
      alarm(eski === "bekle" ? "Kuzey Kampüs. " + h.kamp.ad + " başlıyor. Hadi bakalım, derse!" : MOLA_BITTI);
      kilitBirak();
    }
    if (h.faz === "donus") { alarmSayi = 1; sonAlarm = simdi(); alarm(); }
  }
  // Ders süresi bitti: sessiz haber (yazı + başlık); arka plan sesi açıksa kısa bir çan
  function haberVer() {
    if (ayar.arka !== "yok") { var c = baglam(); if (c) can(c); }
    $("calis-kart").classList.add("haber");
    setTimeout(function () { $("calis-kart").classList.remove("haber"); }, 4000);
  }

  // ---- Ders sırasında ekran açılırsa ----
  var gizlendi = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { gizlendi = Date.now(); return; }
    var once = gizlendi; gizlendi = 0;
    if (!kayit.aktif) return;
    ciz();
    if (once && Date.now() - once > 1500 && dersteMi()) {
      var h = hal();
      $("ekran-metin").textContent = "Bu dersin bitmesine yaklaşık " + K.dkYaz(h.kalan) + " var. Telefonunu kenara koy, kitabına dön. Molan geldiğinde zil çalacak.";
      $("ekran-perde").hidden = false;
    }
  });
  $("ekran-tamam").addEventListener("click", function () { $("ekran-perde").hidden = true; });

  // ---- Kamp kartları ----
  var kartHtml = "";
  function kartlar(zorla) {
    var s = simdi(), bugun = K.gunun(K.gunAnahtar(s)), html = "";
    if (!bugun.length) { $("kamp-kartlar").innerHTML = '<p class="kamp-kucuk">Bugün kamp yok.</p>'; return; }
    bugun.forEach(function (k) {
      var durum, dugme, sinif = "";
      var b = k.bloklar.filter(function (x) { return x.bas <= s && s < x.bit; })[0];
      if (s >= k.bit) { durum = "Bugünkü kamp bitti · Yarın saat " + saatEk(k.saat); dugme = ""; sinif = "bitti"; }
      else if (b) {
        durum = b.tur === "ders" ? "Şimdi " + b.no + ". ders · " + K.dkYaz(b.bit - s) + " kaldı" : "Şimdi mola · " + K.dkYaz(b.bit - s) + " sonra " + (b.no + 1) + ". ders";
        dugme = '<button type="button" class="btn primary" data-katil="' + k.anahtar + '">Kampa katıl</button>'; sinif = "simdi";
      } else {
        durum = 'Başlamasına <span class="canli-saat kucuk" data-geri="' + k.bas + '">' + K.saat(k.bas - s) + "</span>";
        dugme = k.bas - s <= KATIL_ONCE ? '<button type="button" class="btn primary" data-katil="' + k.anahtar + '">Kampa katıl</button>'
          : '<span class="kamp-kucuk">Başlamadan 30 dk önce katılabilirsin.</span>';
      }
      var plan = k.bloklar.map(function (x) {
        return "<li" + (x.bas <= s && s < x.bit ? ' class="su-an"' : "") + "><span>" + K.saatYaz(x.bas) + "–" + K.saatYaz(x.bit) + "</span> " +
          (x.tur === "ders" ? x.no + ". ders (" + x.dk + " dk)" : x.uzun ? "Uzun mola (" + x.dk + " dk)" : "Mola") + "</li>";
      }).join("");
      html += '<article class="kamp-kart ' + sinif + '">' +
        '<h3><span aria-hidden="true">' + k.ikon + "</span> " + k.ad + "</h3>" +
        '<p class="kamp-saatler">' + k.saat + "–" + k.bitSaat + " · " + k.dersSayisi + " ders · " + dkMetin(k.dersDk * 60) + " çalışma</p>" +
        (k.not ? '<p class="kamp-not">' + k.not + "</p>" : "") +
        '<p class="kamp-durum">' + durum + "</p>" + dugme +
        "<details><summary>Ders saatleri</summary><ul class=\"kamp-plan\">" + plan + "</ul></details></article>";
    });
    // Geri sayım her saniye değişir: kartı yeniden kurmadan sadece saati güncelle (açık "Ders saatleri" kapanmasın)
    var sade = html.replace(/data-geri="(\d+)">[^<]*</g, 'data-geri="$1"><');
    if (zorla || sade !== kartHtml) { kartHtml = sade; acikDetay(function () { $("kamp-kartlar").innerHTML = html; }); }
    else Array.prototype.forEach.call(document.querySelectorAll("[data-geri]"), function (el) { el.textContent = K.saat(+el.getAttribute("data-geri") - s); });
  }
  function acikDetay(f) {
    var acik = Array.prototype.map.call(document.querySelectorAll("#kamp-kartlar details"), function (d) { return d.open; });
    f();
    Array.prototype.forEach.call(document.querySelectorAll("#kamp-kartlar details"), function (d, i) { d.open = !!acik[i]; });
  }
  $("kamp-kartlar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-katil]");
    if (b) { sonMesaj = ""; kampaKatil(b.getAttribute("data-katil")); }
  });

  // ---- Rapor ----
  function gunSn(g) { return kayit.gun[g] || 0; }
  function rapor() {
    var s = simdi(), bugun = K.gunAnahtar(s), ek = surenCalisma() / 1000;
    var hg = new Date(s + K.TR).getUTCDay(), pzt = (hg + 6) % 7, hafta = 0, ay = 0, top = 0, ayBas = bugun.slice(0, 7);
    for (var i = 0; i <= pzt; i++) hafta += gunSn(K.gunAnahtar(s - i * GUN));
    Object.keys(kayit.gun).forEach(function (g) { top += kayit.gun[g]; if (g.slice(0, 7) === ayBas) ay += kayit.gun[g]; });
    var bugunSn = gunSn(bugun) + ek;
    hafta += ek; ay += ek; top += ek;
    // 🔥 Seri: en az 10 dk çalışılan art arda günler (bugün henüz çalışmadıysa dünden geriye)
    var seri = 0, j = bugunSn >= 600 ? 0 : 1;
    while (gunSn(K.gunAnahtar(s - j * GUN)) + (j === 0 ? ek : 0) >= 600) { seri++; j++; }
    var kutu = function (ad, sn) { return '<div class="rapor-sayi"><strong>' + dkMetin(sn) + "</strong><span>" + ad + "</span></div>"; };
    $("rapor-sayilar").innerHTML = kutu("Bugün", bugunSn) + kutu("Bu hafta", hafta) + kutu("Bu ay", ay) + kutu("Toplam", top) +
      '<div class="rapor-sayi"><strong>🔥 ' + seri + " gün</strong><span>Çalışma serisi</span></div>";
    var gunler = [], enCok = 3600;
    for (var k = 6; k >= 0; k--) {
      var ms = s - k * GUN, g = K.gunAnahtar(ms), sn = gunSn(g) + (k === 0 ? ek : 0);
      gunler.push({ ad: k === 0 ? "Bugün" : GUN_AD[new Date(ms + K.TR).getUTCDay()], sn: sn });
      enCok = Math.max(enCok, sn);
    }
    $("rapor-grafik").innerHTML = gunler.map(function (x) {
      var y = Math.round(x.sn / enCok * 100);
      return '<div class="rapor-gun"><span class="rapor-deger">' + (x.sn >= 60 ? dkMetin(x.sn) : "") + '</span><div class="rapor-sutun"><div style="height:' + y + '%"></div></div><span>' + x.ad + "</span></div>";
    }).join("");
    var hd = kayit.hedef.slice(-5).reverse();
    $("rapor-hedefler").innerHTML = hd.length ? '<h3>🎯 Son hedeflerin</h3><ul class="rapor-hedef">' + hd.map(function (x) {
      return "<li><span>" + x.g.split("-").reverse().slice(0, 2).join(".") + "</span> " + kacis(x.t) + "</li>";
    }).join("") + "</ul>" : "";
  }

  // ---- Ayarlar ----
  function sesDugmeleri() {
    Array.prototype.forEach.call(document.querySelectorAll("#arka-sesler button"), function (b) {
      var sec = b.getAttribute("data-arka") === ayar.arka;
      b.classList.toggle("secili", sec); b.setAttribute("aria-pressed", String(sec));
    });
    $("arka-ses").value = ayar.ses;
    $("ayar-haber").checked = !!ayar.haber;
    $("ayar-gizle").checked = !!ayar.gizle;
  }
  $("arka-sesler").addEventListener("click", function (e) {
    var b = e.target.closest("[data-arka]");
    if (!b) return;
    ayar.arka = b.getAttribute("data-arka"); yaz(); sesDugmeleri(); arkaBaslat();
  });
  $("arka-ses").addEventListener("input", function () {
    ayar.ses = +this.value; yaz();
    if (arka && ctx) arka.g.gain.setTargetAtTime(arkaSiddet() || 0.0001, ctx.currentTime, 0.1);
  });
  $("ayar-haber").addEventListener("change", function () { ayar.haber = this.checked; yaz(); });
  $("ayar-gizle").addEventListener("change", function () { ayar.gizle = this.checked; yaz(); ciz(); });
  $("hedef").addEventListener("change", function () {
    var t = this.value.trim(), g = K.gunAnahtar(simdi());
    if (!kayit.aktif) return;
    kayit.aktif.hedef = t;
    kayit.hedef = kayit.hedef.filter(function (x) { return x.g !== g; });
    if (t) kayit.hedef.push({ g: g, t: t });
    kayit.hedef = kayit.hedef.slice(-30);
    yaz(); ciz();
  });
  $("zil-dene").addEventListener("click", function () { sesKilidiAc(); alarm(); });
  $("calis-bitir").addEventListener("click", function () { bitir(); });
  $("calis-dugmeler").addEventListener("click", function (e) {
    var m = e.target.closest("[data-mola]"), d = e.target.closest("[data-don]");
    if (m && !m.disabled) molayaCik(+m.getAttribute("data-mola"));
    if (d) derseDon();
  });
  // Kendi saatinde: süre seçimi
  function sureCiz() {
    Array.prototype.forEach.call(document.querySelectorAll(".kamp-sure"), function (b) {
      var sec = +b.getAttribute("data-sure") === ayar.sure;
      b.classList.toggle("secili", sec); b.setAttribute("aria-checked", String(sec));
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".kamp-sure"), function (b) {
    b.addEventListener("click", function () { ayar.sure = +b.getAttribute("data-sure"); yaz(); sureCiz(); });
  });
  sureCiz();
  $("kisisel-basla").addEventListener("click", function () { sonMesaj = ""; kisiselBasla(); });

  // ---- 🔥 Derse Isınma ----
  var O = null, A = null, isin = null;
  function betik(dosya) {
    return new Promise(function (ok, hata) {
      var sc = document.createElement("script"), v = /\?v=[^"'&]*/.exec((document.querySelector('script[src*="assets/kamp.js"]') || {}).src || "");
      sc.src = dosya + (v ? v[0] : ""); sc.onload = ok; sc.onerror = hata;
      document.body.appendChild(sc);
    });
  }
  function isinmaYukle() {
    var l = ["data/sorular.js", "data/yks-sorular.js", "data/ingilizce.js", "assets/oyun.js"], p = Promise.resolve();
    l.forEach(function (d) { p = p.then(function () { return betik(d); }); });
    p.then(function () {
      O = window.KK_OYUN; A = window.KK_ARAC;
      if (!O || !A || !A.soruSec) throw new Error("yok");
      var gr = [
        ["Calculus", O.konular.filter(function (k) { return !k.grup && !k.gizli && (O.sorular[k.id] || k.id === "karisik"); })],
        ["YKS", O.konular.filter(function (k) { return k.grup === "yks" && !k.gizli && (O.sorular[k.id] || []).length; })],
        ["İngilizce kelimeler", O.konular.filter(function (k) { return k.grup === "en" && !k.ez && !k.bd && !k.ty && !k.yz && !k.zor && !k.alan && (O.sorular[k.id] || []).length; })]
      ];
      $("isinma-konu").innerHTML = gr.map(function (g) {
        return '<optgroup label="' + g[0] + '">' + g[1].map(function (k) {
          return '<option value="' + k.id + '"' + (k.id === ayar.isinma ? " selected" : "") + ">" + kacis(k.ad) + "</option>";
        }).join("") + "</optgroup>";
      }).join("");
      $("isinma-konu").disabled = false; $("isinma-basla").disabled = false;
    }).catch(function () {
      $("isinma-konu").innerHTML = "<option>Konular yüklenemedi. Sayfayı yenile.</option>";
    });
  }
  $("isinma-konu").addEventListener("change", function () { ayar.isinma = this.value; yaz(); });
  $("isinma-basla").addEventListener("click", function () {
    var id = $("isinma-konu").value, k = O.konular.filter(function (x) { return x.id === id; })[0];
    ayar.isinma = id; yaz();
    var qs = A.soruSec(id, 5);
    if (!qs.length) return;
    isin = { id: id, ad: k ? k.ad : "", sorular: qs, i: 0, puan: 0 };
    A.sesBaglam();
    goster("kamp-isinma");
    $("isinma-kart").hidden = false; $("isinma-sonuc").hidden = true;
    soruCiz();
  });
  function karistir(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function soruCiz() {
    var q = isin.sorular[isin.i];
    $("isinma-ad").textContent = isin.ad;
    $("isinma-ilerleme").textContent = (isin.i + 1) + " / " + isin.sorular.length;
    $("isinma-metin").innerHTML = A.soruHtml(q);
    $("isinma-secenekler").innerHTML = karistir(q.c.map(function (m, i) { return i; })).map(function (i) {
      return '<button type="button" class="oyun-secenek" data-i="' + i + '">' + A.bicim(q.c[i]) + "</button>";
    }).join("");
    $("isinma-aciklama").hidden = true; $("isinma-sonraki").hidden = true;
  }
  $("isinma-secenekler").addEventListener("click", function (e) {
    var b = e.target.closest("[data-i]");
    if (!b || b.disabled) return;
    var q = isin.sorular[isin.i], dogru = b.getAttribute("data-i") === "0";
    Array.prototype.forEach.call(this.querySelectorAll("button"), function (x) {
      x.disabled = true;
      if (x.getAttribute("data-i") === "0") x.classList.add("dogru");
    });
    if (!dogru) b.classList.add("yanlis");
    A.cal(dogru ? "dogru" : "yanlis");
    A.cevapYaz(q, dogru);
    if (dogru) isin.puan++;
    var ac = $("isinma-aciklama");
    ac.className = "oyun-aciklama " + (dogru ? "iyi" : "kotu");
    ac.innerHTML = (dogru ? "✓ Doğru! " : "✗ Doğrusu: " + A.bicim(q.c[0]) + ". ") + (q.a ? A.bicim(q.a) : "") + " " + A.hataLink(q, "Derse Isınma");
    ac.hidden = false;
    $("isinma-sonraki").textContent = isin.i + 1 < isin.sorular.length ? "Sonraki soru →" : "Sonucu gör →";
    $("isinma-sonraki").hidden = false;
  });
  $("isinma-sonraki").addEventListener("click", function () {
    isin.i++;
    if (isin.i < isin.sorular.length) { soruCiz(); window.scrollTo(0, 0); return; }
    $("isinma-kart").hidden = true; $("isinma-sonuc").hidden = false;
    $("isinma-puan").textContent = isin.puan;
    $("isinma-mesaj").textContent = isin.puan === 5 ? "Harika, zihnin hazır! Şimdi çalışmaya başla."
      : isin.puan >= 3 ? "İyi bir başlangıç. Kaçırdıklarına çalışırken bir göz at."
      : "Kaçırdığın sorular bugün nereden başlaman gerektiğini gösteriyor. Hadi başlayalım!";
    var d = K.durum(simdi()), dug = "";
    var kamp = d.kamp || (d.sira && d.sira.bas - simdi() <= KATIL_ONCE ? d.sira : null);
    if (kamp) dug += '<button type="button" class="btn primary big" data-katil="' + kamp.anahtar + '">🏕 ' + kamp.ad + "na katıl</button>";
    dug += '<button type="button" class="btn ' + (kamp ? "" : "primary ") + 'big" data-kisisel>⏱ Kendi saatinde çalışmaya başla (' + ayar.sure + " dk)</button>";
    dug += '<button type="button" class="btn big" data-geri>Kamplar sayfasına dön</button>';
    $("isinma-dugmeler").innerHTML = dug;
    window.scrollTo(0, 0);
  });
  $("isinma-dugmeler").addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    sonMesaj = "";
    if (t.hasAttribute("data-katil")) kampaKatil(t.getAttribute("data-katil"));
    else if (t.hasAttribute("data-kisisel")) kisiselBasla();
    else girisGoster();
  });

  // ---- Açılış ----
  if (kayit.aktif) {
    var h0 = hal();
    if (!h0 || h0.faz === "bitti") bitir(h0 ? "🏕 " + h0.kamp.ad + " bitti. Bu kampta " + dkMetin(kampSure(kayit.aktif, h0.kamp.bit) / 1000) + " çalıştın." : "");
    else ekranGoster();
  } else girisGoster();
  if (kayit.aktif) { $("kamp-devam").hidden = true; }
  setInterval(function () {
    if (!$("kamp-calis").hidden) ciz();
    else if (!$("kamp-giris").hidden) { kartlar(); var d = Math.floor(simdi() / DK); if (d !== sonDk) { sonDk = d; rapor(); } }
  }, 1000);
  // Arka plan sesi bir dokunuş gerektirir: sayfa yeniden açıldıysa ilk dokunuşta başlat
  document.addEventListener("pointerdown", function ilk() {
    document.removeEventListener("pointerdown", ilk);
    if (kayit.aktif && !arka) { sesKilidiAc(); arkaBaslat(); }
  });
  setTimeout(isinmaYukle, 600);
})();
