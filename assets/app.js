(function () {
  "use strict";

  var CFG = window.KK_CONFIG;

  // ---------- Veri ----------

  function parseCSV(text) {
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }

    var header = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    return rows
      .filter(function (r) { return r.some(function (v) { return v.trim() !== ""; }); })
      .map(function (r) {
        var o = {};
        header.forEach(function (h, idx) { o[h] = (r[idx] || "").trim(); });
        return o;
      });
  }

  function videoId(value) {
    if (!value) return "";
    var m = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : "";
  }

  // Google Drive linkini, indirme düğmesi olmayan önizleme linkine çevirir.
  // Klasör linkleri, klasörün içeriğini gösteren listeye çevrilir.
  function pdfEmbedUrl(link) {
    var f = link.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
    if (f) return "https://drive.google.com/embeddedfolderview?id=" + f[1] + "#list";
    var m = link.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]+)/);
    if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";
    return link;
  }

  // PDF'i indirme linki. Klasör linkinde klasörü Drive'da açar.
  function pdfDownloadUrl(link) {
    if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(link)) return link;
    var m = link.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    return link;
  }

  // "Boş PDF=pdf/calc1/045-bos.pdf | Çözümlü PDF=https://..." biçimini okur.
  // Link, sitedeki bir dosya (pdf/...) ya da Google Drive linki olabilir.
  // Etiket yazılmazsa "PDF 1", "PDF 2" kullanılır.
  function pdfList(value) {
    if (!value) return [];
    return value.split("|").map(function (s) { return s.trim(); }).filter(Boolean).map(function (s, i) {
      var m = s.match(/^([^=:/]+?)\s*=\s*(.+)$/);
      return m ? { ad: m[1].trim(), url: m[2].trim() } : { ad: "PDF " + (i + 1), url: s };
    });
  }

  // Sitenin kendi içindeki PDF mi (Drive değil)?
  function isLocalPdf(url) { return !/^https?:\/\//i.test(url); }

  // İndirilen dosyanın adı: "Kuzey Kampus - <video başlığı> - <PDF adı>.pdf"
  function pdfFileName(v, p) {
    var name = "Kuzey Kampus - " + v.baslik + (p.ad && !/^PDF( \d+)?$/.test(p.ad) ? " - " + p.ad.replace(/\s*PDF$/i, "") : "");
    return name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150) + ".pdf";
  }

  // PDF.js'i (assets/pdfjs) sadece gerektiğinde yükler.
  var pdfjsReady = null;
  function loadPdfjs() {
    if (pdfjsReady) return pdfjsReady;
    pdfjsReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "assets/pdfjs/pdf.min.js";
      s.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/pdfjs/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = function () { pdfjsReady = null; reject(new Error("pdf.js yüklenemedi")); };
      document.head.appendChild(s);
    });
    return pdfjsReady;
  }

  // PDF'i sayfa sayfa, ekrana geldikçe çizer. Her cihazda (telefon dahil) çalışır.
  var pdfRenderToken = 0;
  function renderPdf(el, url, fallbackHtml) {
    var token = ++pdfRenderToken;
    el.innerHTML = '<div class="pdf-loading">PDF yükleniyor…</div>';
    loadPdfjs().then(function (pdfjsLib) {
      return pdfjsLib.getDocument(url).promise;
    }).then(function (doc) {
      if (token !== pdfRenderToken) return;
      el.innerHTML = "";
      var pages = [];
      for (var i = 1; i <= doc.numPages; i++) {
        var holder = document.createElement("div");
        holder.className = "pdf-page";
        holder.setAttribute("data-page", i);
        holder.style.aspectRatio = "612 / 792";
        el.appendChild(holder);
        pages.push(holder);
      }
      function draw(holder) {
        if (holder.getAttribute("data-done")) return;
        holder.setAttribute("data-done", "1");
        doc.getPage(+holder.getAttribute("data-page")).then(function (page) {
          if (token !== pdfRenderToken) return;
          var base = page.getViewport({ scale: 1 });
          var ratio = Math.min(window.devicePixelRatio || 1, 2);
          var scale = (holder.clientWidth || el.clientWidth || base.width) / base.width;
          var vp = page.getViewport({ scale: scale * ratio });
          var canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          holder.style.aspectRatio = base.width + " / " + base.height;
          holder.appendChild(canvas);
          page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
        });
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } });
        }, { root: el, rootMargin: "600px 0px" });
        pages.forEach(function (p) { io.observe(p); });
      } else {
        pages.forEach(draw);
      }
    }).catch(function () {
      if (token !== pdfRenderToken) return;
      el.innerHTML = fallbackHtml;
    });
  }

  function loadVideos() {
    var sources = [];
    if (CFG.sheetCsvUrl) sources.push(CFG.sheetCsvUrl);
    sources.push("data/videos.csv?v=" + Date.now());

    function tryNext(i) {
      if (i >= sources.length) return Promise.resolve([]);
      return fetch(sources[i], { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) {
          var rows = parseCSV(t);
          if (!rows.length && i + 1 < sources.length) return tryNext(i + 1);
          return rows;
        })
        .catch(function () { return tryNext(i + 1); });
    }

    return tryNext(0).then(function (rows) {
      return rows
        .map(function (r) {
          return {
            liste: r.liste,
            sira: parseInt(r.sira, 10) || 0,
            baslik: r.baslik || "",
            id: videoId(r.video),
            pdfs: pdfList(r.pdf)
          };
        })
        .filter(function (v) { return v.id; });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function norm(s) {
    return String(s).toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // ---------- Ana sayfa ----------

  function renderHome() {
    var box = document.getElementById("courses");
    loadVideos().then(function (videos) {
      box.innerHTML = CFG.dersler.map(function (d) {
        var n = videos.filter(function (v) { return v.liste === d.id; }).length;
        // Ortak klasör linki "PDF'li ders" sayısına katılmaz; sadece derse özel PDF'ler sayılır.
        var withPdf = videos.filter(function (v) {
          return v.liste === d.id && v.pdfs.some(function (p) { return !/\/folders\//.test(p.url); });
        }).length;
        if (!d.aktif) {
          return '<div class="card soon"><span class="badge">Yakında</span><h3>' + esc(d.ad) +
            "</h3><p>" + esc(d.aciklama) + "</p></div>";
        }
        return '<a class="card" href="ders.html?liste=' + encodeURIComponent(d.id) + '">' +
          '<span class="badge">' + (d.dil === "en" ? "English" : "Türkçe") + "</span>" +
          "<h3>" + esc(d.ad) + "</h3><p>" + esc(d.aciklama) + "</p>" +
          '<div class="meta">' + (n ? n + " video" + (withPdf ? " · " + withPdf + " PDF'li ders" : "") : "Videolar ekleniyor") +
          "</div></a>";
      }).join("");
    });
  }

  // Ana sayfadaki Dersler kutusu: aktif dersler ve video sayıları
  function renderAnaDersler() {
    var box = document.getElementById("ana-dersler");
    loadVideos().then(function (videos) {
      box.innerHTML = CFG.dersler.filter(function (d) { return d.aktif; }).map(function (d) {
        var n = videos.filter(function (v) { return v.liste === d.id; }).length;
        return '<a href="ders.html?liste=' + encodeURIComponent(d.id) + '">' + esc(d.kisaAd || d.ad) +
          (n ? " <small>" + n + " video</small>" : "") + "</a>";
      }).join("");
    });
  }

  // ---------- Ders sayfası ----------

  // ✏️ Kendini test et: videoya bağlı çalışma soruları (data/video-sorular/<ders id>.js → window.KK_VS).
  // Öğrenci soruyu kâğıtta çözer, cevaba bakar, "Çözdüm" ya da "Çözemedim" der. Puan yok.
  // Kayıt sadece cihazda: localStorage "kk-ders-v1" → vs[video kimliği][soru no] = 1 çözdü | 0 çözemedi.
  var KT_DEPO = "kk-ders-v1";
  var SURUM = (function () {
    var sc = document.currentScript, m = sc && /[?&]v=(\w+)/.exec(sc.src);
    return m ? m[1] : String(Date.now());
  })();
  function ktOku() { try { return JSON.parse(localStorage.getItem(KT_DEPO)) || {}; } catch (e) { return {}; } }
  function ktYaz(k) { try { localStorage.setItem(KT_DEPO, JSON.stringify(k)); } catch (e) {} }
  function scriptYukle(src) {
    return new Promise(function (ok) {
      var el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = ok;
      document.head.appendChild(el);
    });
  }

  function renderCourse() {
    var params = new URLSearchParams(location.search);
    var dersId = params.get("liste") || "calc1";
    var ders = CFG.dersler.filter(function (d) { return d.id === dersId; })[0];
    var main = document.getElementById("course");

    if (!ders) {
      main.innerHTML = '<div class="notice">Bu ders bulunamadı. <a href="dersler.html">Derslere dön</a></div>';
      return;
    }

    document.title = ders.ad + " – Kuzey Kampüs";
    document.getElementById("course-title").textContent = ders.ad;
    document.getElementById("course-desc").textContent = ders.aciklama;

    var soruYukle = ders.sorular ? scriptYukle("data/video-sorular/" + ders.id + ".js?v=" + SURUM) : Promise.resolve();
    Promise.all([loadVideos(), soruYukle]).then(function (sonuc) {
      var all = sonuc[0];
      var videos = all
        .filter(function (v) { return v.liste === ders.id; })
        .sort(function (a, b) { return a.sira - b.sira; });

      if (!videos.length) {
        var yt = ders.playlist ? ' Bu arada tüm dersleri <a href="https://www.youtube.com/playlist?list=' +
          esc(ders.playlist) + '" target="_blank" rel="noopener">YouTube oynatma listesinden</a> izleyebilirsiniz.' : "";
        main.innerHTML = '<div class="notice">Bu dersin videoları siteye ekleniyor.' + yt + "</div>";
        return;
      }

      var listEl = document.getElementById("list");
      var searchEl = document.getElementById("search");
      var countEl = document.getElementById("count");
      var current = 0;

      function hashIndex() {
        var m = location.hash.match(/v=([A-Za-z0-9_-]{11})/);
        if (!m) return 0;
        for (var i = 0; i < videos.length; i++) if (videos[i].id === m[1]) return i;
        return 0;
      }

      function drawList() {
        var q = norm(searchEl.value.trim());
        var shown = 0;
        listEl.innerHTML = videos.map(function (v, i) {
          if (q && norm(v.baslik).indexOf(q) === -1) return "";
          shown++;
          return '<li><button type="button" data-i="' + i + '"' + (i === current ? ' class="active"' : "") + ">" +
            '<span class="num">' + (i + 1) + "</span><span>" + esc(v.baslik) +
            (v.pdfs.length ? '<span class="pdf-dot">PDF</span>' : "") + "</span>" + ktIsaret(v) + "</button></li>";
        }).join("");
        countEl.textContent = q ? shown + " sonuç" : videos.length + " video";
      }

      // ---- ✏️ Kendini test et ----
      var KT = window.KK_VS || {}, GECME = (CFG.kendiniTest && CFG.kendiniTest.gecme) || 3;
      var ktEl = document.getElementById("kt"), ozetEl = document.getElementById("kt-ozet");
      var kt = null;   // süren tur: { v, deste, i, cozdu, acik }
      function ktSorular(v) { return (KT[v.id] && KT[v.id].sorular) || []; }
      function ktDurum(v) {
        var sor = ktSorular(v), kayit = (ktOku().vs || {})[v.id] || {}, c = 0, d = 0;
        sor.forEach(function (q) { if (kayit[q.no] === 1) c++; if (kayit[q.no] != null) d++; });
        var hedef = Math.min(GECME, sor.length);
        return { n: sor.length, cozulen: c, denendi: d > 0, hedef: hedef, tamam: sor.length > 0 && c >= hedef, kayit: kayit };
      }
      function ktIsaret(v) {
        var d = ktDurum(v);
        if (!d.n) return "";
        if (d.tamam) return '<span class="kt-isaret tamam" title="Ders tamam: soruları çözdün" aria-label="Ders tamam">✓</span>';
        if (d.denendi) return '<span class="kt-isaret yarim" title="Sorular bitmedi: ' + d.cozulen + " / " + d.hedef + '" aria-label="Sorular bitmedi, ' + d.cozulen + " / " + d.hedef + '">✗ ' + d.cozulen + "/" + d.hedef + "</span>";
        return '<span class="kt-isaret bos" title="' + d.n + ' soru seni bekliyor" aria-label="Sorular denenmedi"></span>';
      }
      function ktOzet() {
        var top = 0, coz = 0, tamam = 0, yarim = 0;
        videos.forEach(function (v) {
          var d = ktDurum(v);
          if (!d.n) return;
          top += d.n; coz += d.cozulen;
          if (d.tamam) tamam++; else if (d.denendi) yarim++;
        });
        if (!top) { ozetEl.hidden = true; return; }
        var yuzde = Math.round(coz * 100 / top);
        ozetEl.hidden = false;
        ozetEl.innerHTML = '<div class="kt-ozet-yazi"><strong>✏️ Çalışma soruları: %' + yuzde + " çözüldü</strong> <span>(" + coz + " / " + top + ")" +
          (tamam ? ' · <b class="kt-yesil">✓ ' + tamam + " ders tamam</b>" : "") + (yarim ? ' · <b class="kt-kirmizi">✗ ' + yarim + " ders yarım</b>" : "") + "</span></div>" +
          '<div class="kt-cubuk" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + yuzde + '"><div style="width:' + yuzde + '%"></div></div>';
      }
      function ktGiris(v) {
        kt = null;
        var d = ktDurum(v);
        if (!d.n) { ktEl.hidden = true; ktEl.innerHTML = ""; return; }
        var kalan = ktSorular(v).filter(function (q) { return d.kayit[q.no] !== 1; }).length;
        var hedefYazi = d.hedef === d.n ? (d.n === 1 ? "Soruyu" : d.n + " sorunun hepsini") : d.n + " sorudan " + d.hedef + " tanesini";
        ktEl.hidden = false;
        ktEl.className = "kt" + (d.tamam ? " tamam" : "");
        ktEl.innerHTML = '<div class="kt-bas"><h3>✏️ Kendini test et</h3>' + ktIsaret(v) + "</div>" +
          (d.tamam
            ? "<p>🟢 <strong>Bu ders tamam!</strong> " + d.cozulen + " / " + d.n + " soruyu çözdün." + (kalan ? " İstersen kalan " + kalan + " soruyu da çöz." : "") + "</p>"
            : "<p>Videoyu izledikten sonra kitaptaki çalışma sorularından " + d.n + " soruyu kâğıtta çöz" +
              (KT[v.id] && KT[v.id].kaynak ? " (" + esc(KT[v.id].kaynak) + ")" : "") + ". " +
              hedefYazi + " çözünce bu ders yeşil ✓ olur.</p>" + (d.denendi ? '<p class="kt-durum">Şu ana kadar ' + d.cozulen + " / " + d.n + " soru çözdün.</p>" : "")) +
          '<div class="kt-dugmeler"><button type="button" class="btn primary" data-kt="basla">' +
          (kalan ? (d.denendi ? "Kalan " + kalan + " soruyu çöz →" : "Teste başla →") : "🔁 Yeniden çöz") + "</button></div>";
        ktEl.querySelector('[data-kt="basla"]').addEventListener("click", function () { ktBasla(v); });
      }
      function ktBasla(v) {
        var d = ktDurum(v), sor = ktSorular(v);
        var kalan = sor.filter(function (q) { return d.kayit[q.no] !== 1; });
        kt = { v: v, deste: kalan.length ? kalan : sor.slice(), i: 0, cozdu: 0, onceTamam: d.tamam };
        ktSoru();
      }
      function ktSoru() {
        var q = kt.deste[kt.i], kaynak = (KT[kt.v.id] && KT[kt.v.id].kaynak) || "";
        ktEl.innerHTML = '<div class="kt-bas"><h3>✏️ Soru ' + (kt.i + 1) + " / " + kt.deste.length + "</h3>" +
          '<span class="kt-kaynak">' + esc(kaynak) + (q.no ? " · no. " + q.no : "") + "</span></div>" +
          '<div class="kt-soru">' + q.s + "</div>" +
          '<p class="kt-ipucu">Kâğıtta çöz, sonra cevaba bak.</p>' +
          '<div class="kt-dugmeler"><button type="button" class="btn primary" data-kt="goster">Cevabı göster</button></div>';
        ktEl.querySelector('[data-kt="goster"]').addEventListener("click", ktCevap);
        ktEl.querySelector('[data-kt="goster"]').focus({ preventScroll: true });
      }
      function ktCevap() {
        var q = kt.deste[kt.i];
        var dug = ktEl.querySelector(".kt-dugmeler");
        ktEl.querySelector(".kt-ipucu").remove();
        dug.insertAdjacentHTML("beforebegin", '<div class="kt-cevap"><div>Cevap: <strong>' + q.c + "</strong></div>" +
          (q.cozum ? '<div class="kt-cozum">' + q.cozum + "</div>" : "") + "</div>" + '<p class="kt-soru-alt">Sen de bunu buldun mu?</p>');
        dug.innerHTML = '<button type="button" class="btn kt-evet" data-kt="evet">✓ Çözdüm</button><button type="button" class="btn kt-hayir" data-kt="hayir">✗ Çözemedim</button>';
        dug.querySelector('[data-kt="evet"]').addEventListener("click", function () { ktIsle(true); });
        dug.querySelector('[data-kt="hayir"]').addEventListener("click", function () { ktIsle(false); });
        dug.querySelector('[data-kt="evet"]').focus({ preventScroll: true });
      }
      function ktIsle(cozdu) {
        var q = kt.deste[kt.i], k = ktOku();
        k.vs = k.vs || {};
        var vk = k.vs[kt.v.id] = k.vs[kt.v.id] || {};
        vk[q.no] = cozdu || vk[q.no] === 1 ? 1 : 0;   // çözülmüş soru çözülmüş kalır
        ktYaz(k);
        if (cozdu) kt.cozdu++;
        drawList(); ktOzet();
        kt.i++;
        if (kt.i < kt.deste.length) ktSoru(); else ktSon();
      }
      function ktSon() {
        var v = kt.v, d = ktDurum(v), m = kt.deste.length, yeniTamam = d.tamam && !kt.onceTamam;
        var sonraki = current < videos.length - 1;
        var pdfVar = v.pdfs.length > 0;
        ktEl.className = "kt" + (d.tamam ? " tamam" : "");
        ktEl.innerHTML = '<div class="kt-bas"><h3>' + (yeniTamam ? "🟢 Tebrikler, bu ders tamam!" : d.tamam ? "🟢 Bu ders tamam" : "✏️ Tur bitti") + "</h3>" + ktIsaret(v) + "</div>" +
          "<p>Bu turda " + m + " sorudan <strong>" + kt.cozdu + "</strong> tanesini çözdün. Toplam: " + d.cozulen + " / " + d.n + ".</p>" +
          (d.tamam ? "" : '<p class="kt-durum">Çözemediğin sorular için videonun ilgili kısmını tekrar izle, sonra yeniden dene. Ders, ' +
            (d.hedef === d.n ? "soruların hepsini" : d.hedef + " soruyu") + " çözünce yeşil ✓ olur.</p>") +
          (pdfVar ? '<p class="kt-durum">Daha fazla pratik istersen bütün çalışma soruları PDF\'te.</p>' : "") +
          '<div class="kt-dugmeler">' +
          (d.tamam && sonraki ? '<button type="button" class="btn primary" data-kt="sonraki">Sonraki derse geç →</button>' : "") +
          (!d.tamam ? '<button type="button" class="btn primary" data-kt="tekrar">Kalan soruları yeniden dene</button>' : "") +
          '<button type="button" class="btn" data-kt="kapat">Kapat</button></div>';
        var b;
        if ((b = ktEl.querySelector('[data-kt="sonraki"]'))) b.addEventListener("click", function () { select(current + 1, { scroll: true }); });
        if ((b = ktEl.querySelector('[data-kt="tekrar"]'))) b.addEventListener("click", function () { ktBasla(v); });
        ktEl.querySelector('[data-kt="kapat"]').addEventListener("click", function () { ktGiris(v); });
        if (yeniTamam && window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) ktEl.classList.add("kutla");
      }

      function showPdf(v, k) {
        var box = document.getElementById("pdf");
        if (!v.pdfs.length) {
          box.innerHTML = '<header><strong>Ders notu</strong></header><div class="pdf-empty">Bu dersin PDF\'i yakında eklenecek.</div>';
          return;
        }
        var tabs = v.pdfs.length > 1 ? v.pdfs.map(function (p, j) {
          return '<button type="button" class="tab' + (j === k ? " active" : "") + '" data-k="' + j + '">' + esc(p.ad) + "</button>";
        }).join("") : "";
        var head = v.pdfs.length > 1 ? "Ders notları" : esc(v.pdfs[0].ad);
        var url = v.pdfs[k].url;
        var local = isLocalPdf(url);
        var folder = /\/folders\//.test(url);
        var dl = CFG.pdfIndirme === false ? "" : local ?
          '<a class="btn" href="' + esc(url) + '" download="' + esc(pdfFileName(v, v.pdfs[k])) + '">⬇ İndir</a>' :
          '<a class="btn" href="' + esc(pdfDownloadUrl(url)) + '" target="_blank" rel="noopener"' + (folder ? "" : " download") + ">" +
          (folder ? "Klasörü aç" : "⬇ İndir") + "</a>";
        var openFull = local ? '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Tam ekran</a>' : "";
        box.innerHTML = "<header><strong>" + head + "</strong>" + tabs + openFull + dl + "</header>" +
          (local ? '<div class="pdf-frame pdf-view" aria-label="' + esc(v.pdfs[k].ad) + '"></div>' :
          '<iframe class="pdf-frame" src="' + esc(pdfEmbedUrl(v.pdfs[k].url)) + '" title="' + esc(v.pdfs[k].ad) + '" loading="lazy"></iframe>');
        if (local) {
          renderPdf(box.querySelector(".pdf-view"), url,
            '<div class="pdf-empty">PDF burada gösterilemedi. <a href="' + esc(url) + '" target="_blank" rel="noopener">Yeni sekmede açın</a>.</div>');
        }
        Array.prototype.forEach.call(box.querySelectorAll(".tab"), function (t) {
          t.addEventListener("click", function () { showPdf(v, +t.getAttribute("data-k")); });
        });
      }

      function select(i, opts) {
        current = Math.max(0, Math.min(videos.length - 1, i));
        var v = videos[current];
        document.getElementById("player").innerHTML =
          '<iframe src="https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0" title="' + esc(v.baslik) +
          '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        document.getElementById("now-title").textContent = v.baslik;
        document.getElementById("now-sub").textContent = (current + 1) + " / " + videos.length;
        document.getElementById("prev").disabled = current === 0;
        document.getElementById("next").disabled = current === videos.length - 1;
        document.getElementById("yt").href = "https://www.youtube.com/watch?v=" + v.id;
        showPdf(v, 0);
        ktGiris(v);
        if (!opts || !opts.fromHash) history.replaceState(null, "", "#v=" + v.id);
        drawList();
        if (opts && opts.scroll) window.scrollTo({ top: 0, behavior: "smooth" });
      }

      listEl.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (b) select(+b.getAttribute("data-i"), { scroll: window.innerWidth <= 900 });
      });
      searchEl.addEventListener("input", drawList);
      document.getElementById("prev").addEventListener("click", function () { select(current - 1); });
      document.getElementById("next").addEventListener("click", function () { select(current + 1); });
      window.addEventListener("hashchange", function () { select(hashIndex(), { fromHash: true }); });

      ktOzet();
      select(hashIndex(), { fromHash: true });
    });
  }

  // ---------- İletişim sayfası ----------

  function renderContact() {
    var form = document.getElementById("contact-form");
    var mail = CFG.iletisimEposta;
    var line = document.getElementById("contact-email-line");
    line.innerHTML = mail
      ? 'E-posta: <a href="mailto:' + esc(mail) + '">' + esc(mail) + "</a>"
      : "E-posta adresi yakında eklenecek.";

    if (CFG.whatsapp) {
      var wa = document.getElementById("wa-btn");
      wa.href = "https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") +
        "?text=" + encodeURIComponent("Merhaba, Kuzey Kampüs sitesinden yazıyorum.");
      wa.hidden = false;
    }

    // iletisim.html?konu=kampus gibi linkler konu seçimini doldurur
    var konuParam = new URLSearchParams(location.search).get("konu");
    var konuHarita = { "kampus": "Kampüsün İçinden – paylaşım", "kampus-okul": "Kampüsün İçinden – okulumu ekleyin",
      "kampus-sinav": "Kampüsün İçinden – geçmiş sınav gönderiyorum" };
    var okulHarita = { odtu: "ODTÜ", bogazici: "Boğaziçi", itu: "İTÜ" };
    if (konuParam && konuHarita[konuParam]) form.elements.konu.value = konuHarita[konuParam];
    if (konuParam === "kampus-sinav") {
      var okulAd = okulHarita[new URLSearchParams(location.search).get("okul")] || "";
      if (okulAd && !form.elements.okul.value) form.elements.okul.value = okulAd;
      if (!form.elements.mesaj.value) form.elements.mesaj.value = (okulAd ? okulAd + " " : "") +
        "geçmiş sınavlarını gönderiyorum (ders, yıl, vize/final):\n\n" +
        "Not: Sınav dosyalarını (PDF ya da fotoğraf) açılacak e-postaya ek olarak eklemeyi unutma.";
    }

    form.addEventListener("input", function () { document.getElementById("form-error").hidden = true; });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var err = document.getElementById("form-error");
      if (!f.ad.value.trim() || !f.mesaj.value.trim()) { err.hidden = false; return; }
      err.hidden = true;
      if (!mail) { err.textContent = "E-posta adresi henüz eklenmedi."; err.hidden = false; return; }
      var subject = "[Kuzey Kampüs] " + f.konu.value + " – " + f.ad.value.trim();
      var body = [
        "Konu: " + f.konu.value,
        "Ad Soyad: " + f.ad.value.trim(),
        "Okul / Bölüm / Sınıf: " + f.okul.value.trim(),
        "",
        f.mesaj.value.trim()
      ].join("\n");
      location.href = "mailto:" + mail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("contact-form")) renderContact();
    var yt = document.querySelectorAll("[data-yt]");
    Array.prototype.forEach.call(yt, function (a) { a.href = CFG.youtubeKanal; });
    if (CFG.whatsappKanal) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-wa-kanal]"), function (a) {
        a.href = CFG.whatsappKanal;
        a.hidden = false;
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-wa-kanal-kutu]"), function (el) {
        el.hidden = false;
      });
    }
    // 📤 Paylaş düğmeleri (data-paylas="adres"): telefonda sistemin paylaşım menüsü, bilgisayarda link kopyalanır.
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-paylas]");
      if (!btn) return;
      e.preventDefault();
      var url = btn.getAttribute("data-paylas") || "https://kuzeykampuscalculus.com/";
      var metin = btn.getAttribute("data-paylas-metin") || "Kuzey Kampüs: matematiği ezberlemeden, anlayarak öğren.";
      var dokunmatik = window.matchMedia && matchMedia("(pointer: coarse)").matches;
      if (navigator.share && dokunmatik) {
        navigator.share({ title: "Kuzey Kampüs", text: metin, url: url }).catch(function () {});
        return;
      }
      var eski = btn.getAttribute("data-eski") || btn.innerHTML;
      btn.setAttribute("data-eski", eski);
      var tamam = function () {
        btn.textContent = "✓ Link kopyalandı";
        setTimeout(function () { btn.innerHTML = eski; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(tamam, function () { window.prompt("Linki kopyala:", url); });
      else window.prompt("Linki kopyala:", url);
    });
    // 👁 Ana sayfanın altındaki küçük sayaç (etiketsiz): GoatCounter'dan toplam ziyaretçi (tekil varsa o, yoksa görüntüleme).
    // GoatCounter ayarlarında "Allow adding visitor counts on your website" açık olmalı; alınamazsa hiç görünmez.
    var sayac = document.querySelector("[data-sayac]");
    if (sayac && window.fetch) {
      fetch("https://kuzeykampus.goatcounter.com/counter/TOTAL.json", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          var say = function (v) { return parseInt(String(v == null ? "" : v).replace(/[^\d]/g, ""), 10) || 0; };
          var n = say(d.count_unique) || say(d.count);   // tekil sayı yoksa ya da 0 gelirse toplam görüntüleme
          if (!n) return;
          sayac.querySelector("span").textContent = n.toLocaleString("tr-TR");
          sayac.hidden = false;
        }).catch(function () {});
    }
    // 💡 Biliyor muydun?: [data-ipucu] olan yere sitedeki bir özelliği tanıtan kısa satır (her açılışta rastgele, açılır pencere değil).
    // "sakla": o sayfada gösterilmez (öğrenci zaten oradadır; adı böyle başlayan sayfalar, "tam": sadece tam o sayfa). oyun.js test sonucunda KK_IPUCU.ciz() ile yeniler.
    var IPUCLARI = [
      { m: 'Her gün sabah, öğle ve akşam <a href="kamp.html">🏕 Ders Çalışma Kampları</a> var: başka öğrencilerle aynı saatte ders çalış, molada zil çalsın.', sakla: "kamp", tam: true },
      { m: 'İngilizce\'de <a href="oyun.html#en-bolume-ozel">🎓 Bölüme Özel İngilizce</a> var: Calculus, Ekonomi, İşletme, Mühendislik, Psikoloji ve Siyaset Bilimi terimleri.' },
      { m: 'Her gün <a href="canli.html">🔴 Canlı Yarışma</a> var: herkes aynı anda aynı soruları çözer. Saatleri Testler\'deki kırmızı şeritte.', sakla: "canli" },
      { m: 'Testlerde kaçırdığın Calculus ve YKS soruları <a href="oyun.html#yks-zor">📌 Zorlandıklarım</a> destesinde toplanır; doğru yapınca desteden çıkar.' },
      { m: 'İngilizce\'de kaçırdığın kelimeler <a href="oyun.html#ingilizce">📌 Zorlandıklarım</a> destesinde toplanır; doğru yapınca desteden çıkar.' },
      { m: 'İngilizce kelimeleri <a href="oyun.html#ingilizce">✍️ klavyeyle yazarak</a> da çalışabilirsin; her grupta Boşluk, Ters yön ve Eş / Zıt testleri de var.' },
      { m: 'Testler\'de <a href="oyun.html#almanca">🇩🇪 Almanca</a>, <a href="oyun.html#fransizca">🇫🇷 Fransızca</a> ve <a href="oyun.html#japonca">🇯🇵 Japonca</a> da var: Testler\'deki 🌍 Diller sekmesinden dilini seç. Kelimeleri sesiyle birlikte ezberle.' },
      { m: 'Testler\'de <a href="oyun.html#yks">📘 YKS</a> sekmesi var: Temel Kavramlar\'ın bütün konuları, 🔁 Konu Tekrarı ve ⚡ Doğru / Yanlış.' },
      { m: 'Okulunun vize–final sınavını <a href="kampus.html">🏛 Kampüsün İçinden</a>\'den gönderebilirsin; okuluna özel hazırlık birlikte büyüyor.', sakla: "kampus" },
      { m: '🚩 Bir soruda hata görürsen cevaptan sonra çıkan "Hata bildir"e dokun; e-postan kendiliğinden hazırlanır.' },
      { m: 'Calculus derslerinin <a href="dersler.html">📚 videoları ve PDF notları</a> bir arada; her dersin notu videonun yanında.', sakla: "ders" }
    ];
    var sayfaAdi = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
    window.KK_IPUCU = {
      ciz: function (el) {
        if (!el) return;
        var l = IPUCLARI.filter(function (t) { return !t.sakla || (t.tam ? sayfaAdi !== t.sakla : sayfaAdi.indexOf(t.sakla) !== 0); });
        var t = l[Math.floor(Math.random() * l.length)];
        el.innerHTML = '<strong>💡 Biliyor muydun?</strong> ' + t.m;
        el.hidden = false;
      }
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-ipucu]"), function (el) { window.KK_IPUCU.ciz(el); });
    if (document.getElementById("courses")) renderHome();
    if (document.getElementById("ana-dersler")) renderAnaDersler();
    if (document.getElementById("course")) renderCourse();
  });
})();
