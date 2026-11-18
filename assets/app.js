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

    loadVideos().then(function (all) {
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
            (v.pdfs.length ? '<span class="pdf-dot">PDF</span>' : "") + "</span></button></li>";
        }).join("");
        countEl.textContent = q ? shown + " sonuç" : videos.length + " video";
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
    if (document.getElementById("courses")) renderHome();
    if (document.getElementById("ana-dersler")) renderAnaDersler();
    if (document.getElementById("course")) renderCourse();
  });
})();
