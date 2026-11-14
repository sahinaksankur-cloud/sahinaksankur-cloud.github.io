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
  function pdfEmbedUrl(link) {
    var m = link.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]+)/);
    if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";
    return link;
  }

  // "Boş PDF=https://... | Çözümlü PDF=https://..." biçimini okur.
  // Etiket yazılmazsa "PDF 1", "PDF 2" kullanılır.
  function pdfList(value) {
    if (!value) return [];
    return value.split("|").map(function (s) { return s.trim(); }).filter(Boolean).map(function (s, i) {
      var m = s.match(/^([^=]+?)\s*=\s*(https?:\/\/.+)$/);
      return m ? { ad: m[1].trim(), url: m[2].trim() } : { ad: "PDF " + (i + 1), url: s };
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
        var withPdf = videos.filter(function (v) { return v.liste === d.id && v.pdfs.length; }).length;
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

  // ---------- Ders sayfası ----------

  function renderCourse() {
    var params = new URLSearchParams(location.search);
    var dersId = params.get("liste") || "calc1";
    var ders = CFG.dersler.filter(function (d) { return d.id === dersId; })[0];
    var main = document.getElementById("course");

    if (!ders) {
      main.innerHTML = '<div class="notice">Bu ders bulunamadı. <a href="index.html">Ana sayfaya dön</a></div>';
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
        box.innerHTML = "<header><strong>" + head + "</strong>" + tabs + "</header>" +
          '<iframe class="pdf-frame" src="' + esc(pdfEmbedUrl(v.pdfs[k].url)) + '" title="' + esc(v.pdfs[k].ad) + '" loading="lazy"></iframe>';
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
        "Okul / Bölüm: " + f.okul.value.trim(),
        "Ders / Konu: " + f.ders.value.trim(),
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
    if (document.getElementById("courses")) renderHome();
    if (document.getElementById("course")) renderCourse();
  });
})();
