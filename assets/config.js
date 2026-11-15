// Kuzey Kampüs – site ayarları
// Bu dosyadaki değerleri değiştirmek için kod bilmenize gerek yok.

window.KK_CONFIG = {
  // Google E-Tablo "Web'de yayınla → CSV" linki.
  // Boş bırakılırsa sitedeki data/videos.csv dosyası kullanılır.
  sheetCsvUrl: "",

  youtubeKanal: "https://www.youtube.com/@kuzeykampus",

  // İletişim sayfası
  iletisimEposta: "iletisim@kuzeykampuscalculus.com",
  whatsapp: "",         // örnek: "905xxxxxxxxx" (boş bırakılırsa WhatsApp düğmesi görünmez)

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
      ad: "Calculus 1 | Çalışma Soruları",
      kisaAd: "Calculus 1 Sorular",
      aciklama: "Limitten integrale, Calculus 1 konularının çözümlü çalışma soruları. Konu anlatımlarıyla aynı bölüm numaralarını izler.",
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
