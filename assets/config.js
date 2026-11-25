// Kuzey Kampüs – site ayarları
// Bu dosyadaki değerleri değiştirmek için kod bilmenize gerek yok.

window.KK_CONFIG = {
  // Google E-Tablo "Web'de yayınla → CSV" linki.
  // Boş bırakılırsa sitedeki data/videos.csv dosyası kullanılır.
  sheetCsvUrl: "",

  youtubeKanal: "https://www.youtube.com/@kuzeykampus",

  // WhatsApp duyuru kanalı (boş bırakılırsa sitedeki kanal bağlantıları görünmez)
  whatsappKanal: "https://whatsapp.com/channel/0029Vb9Rc15KWEKtFHrbE23i",

  // Ders sayfasında PDF'lerin yanında "İndir" düğmesi görünsün mü (true / false)
  pdfIndirme: true,

  // İletişim sayfası
  iletisimEposta: "iletisim@kuzeykampuscalculus.com",
  whatsapp: "",         // örnek: "905xxxxxxxxx" (boş bırakılırsa WhatsApp düğmesi görünmez)

  // 🔴 Canlı Yarışma (canli.html): her gün aynı saatlerde, herkese aynı anda aynı 10 soru.
  // Saatler Türkiye saatidir. gunler: 1 Pazartesi … 5 Cuma, 6 Cumartesi, 0 Pazar (yazılmazsa her gün).
  canli: {
    aktif: true,          // false: ana sayfa ve Testler'deki Canlı Yarışma şeridi gizlenir
    soruSayisi: 10,
    soruSure: 20,         // her soru (saniye); grafikli ve parçalı fonksiyonlu sorulara +5 sn
    cevapSure: 8,         // süre bitince doğru cevabın ekranda kalma süresi (saniye)
    program: [
      // Saatler Kuzey Kampüs Kamplarının molalarına denk gelir (kamplar: 08:00, 13:00, 19:00; bkz. kamplar.duzen)
      { grup: "yks", saat: "10:45", gunler: [6, 0] },          // Sabah Kampı uzun molası (10:40–11:00)
      { grup: "yks", saat: "18:00", gunler: [1, 2, 3, 4, 5] }, // Öğle ve Akşam kampları arası
      { grup: "yks", saat: "19:51" },                          // Akşam Kampı 1. mola (19:50–20:00)
      { grup: "calculus", saat: "21:45" },                     // Akşam Kampı uzun molası (21:40–22:00)
      { grup: "ingilizce", saat: "12:51" }   // Sabah Kampı ile Öğle Kampı arası; öğle arası (deneme)
    ],
    // Yarışmanın yapılmayacağı günler: "2026-12-31" (o günün tüm yarışmaları) ya da "2026-12-31 20:00" (sadece o saat)
    iptal: [],
    // Calculus yarışmasının soruları bu konulardan gelir (data/sorular.js)
    calculusKonular: ["limit", "turev", "integral", "uygulama"]
    // İngilizce yarışmasının soruları data/ingilizce.js'teki bütün kelime gruplarından gelir (A1–C1 karışık; Eş / Zıt hariç)
  },

  // 🏕 Kuzey Kampüs Ders Çalışma Kampları (kamp.html): birlikte ders çalışma kampları. Herkes aynı saatte çalışır, aynı saatte molaya çıkar.
  // Saatler Türkiye saatidir. duzen: [ders dakikası, ardından mola dakikası] sırayla (son molanın sonunda kamp biter).
  kamplar: {
    aktif: true,          // false: ana sayfadaki kamp şeridi gizlenir
    duzen: [[50, 10], [50, 10], [40, 20], [50, 10], [50, 0]],   // 5 ders, 240 dk çalışma
    liste: [
      { id: "sabah", ad: "Sabah Çalışma Kampı", ikon: "🌅", bas: "08:00", not: "Mezunlar ve üniversiteliler için" },
      { id: "ogle", ad: "Öğle Çalışma Kampı", ikon: "☀️", bas: "13:00", not: "Mezunlar ve üniversiteliler için" },
      { id: "aksam", ad: "Akşam Çalışma Kampı", ikon: "🌙", bas: "19:00" }
    ],
    // Kampın yapılmayacağı günler: "2026-12-31" (o günün tüm kampları) ya da "2026-12-31 19:00" (sadece o kamp)
    iptal: []
  },

  // Sitedeki dersler. "id", tablodaki "liste" sütunuyla aynı olmalı.
  dersler: [
    {
      id: "calc1",
      ad: "Calculus 1 | Sıfırdan Zirveye",
      kisaAd: "Calculus 1",
      aciklama:
        "Fonksiyonlardan integrale Calculus 1 konu anlatımı ve çözümlü örnekler. Anlatım Türkçe, matematiksel gösterim İngilizce.",
      playlist: "PLQMBWHXZe7fkMKnPDahblrm7dAK8ejwZ0",
      dil: "tr",
      aktif: true
    },
    {
      id: "calc2",
      ad: "Calculus 2 | Sıfırdan Zirveye",
      kisaAd: "Calculus 2",
      aciklama: "Diziler ve seriler, parametrik eğriler, kutupsal koordinatlar, konikler ve vektörler.",
      playlist: "PLQMBWHXZe7fl6qeCuYTQEkxC6m1xdB9Dd",
      dil: "tr",
      aktif: true
    },
    {
      id: "calc1-soru",
      ad: "Calculus Çalışma Soruları",
      kisaAd: "Çalışma Soruları",
      aciklama: "Konu anlatımlarıyla aynı bölüm numaralarını izleyen çözümlü çalışma soruları. Şu an limitten integrale Calculus 1 konuları var.",
      playlist: "PLQMBWHXZe7fn-pXsh_1DtA5rli_-DYcMD",
      dil: "tr",
      aktif: true
    },
    {
      id: "en-calc",
      ad: "North Campus Calculus",
      kisaAd: "English",
      aciklama: "Calculus lessons in English, chapter by chapter.",
      playlist: "",
      dil: "en",
      aktif: false
    }
  ]
};
