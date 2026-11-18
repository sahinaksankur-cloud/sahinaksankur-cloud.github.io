// Kuzey Kampüs – Testler · 📘 YKS soru bankası
// Her konu: id ("yks-" ile başlar), ad, ust (üst başlık), sinav ("TYT" / "AYT"), sinif (9–12).
// Soru biçimi Üniversite tarafıyla aynı: { s: "soru (HTML)", c: ["DOĞRU", "yanlış", "yanlış"], a: "kısa açıklama" }.
// İlk seçenek doğru cevaptır, oyunda karıştırılır. Doğru/Yanlış: { k: konu id, s, d: true/false, n: "yanlışsa doğrusu" }.
window.KK_YKS = {
  konular: [
    { id: "yks-rakam", ad: "Rakamlar", ust: "Sayı Kümeleri", sinav: "TYT", sinif: 9 },
    { id: "yks-dogal", ad: "Doğal Sayılar", ust: "Sayı Kümeleri", sinav: "TYT", sinif: 9 },
    { id: "yks-tam", ad: "Tam Sayılar", ust: "Sayı Kümeleri", sinav: "TYT", sinif: 9 }
  ],

  sorular: {
    "yks-rakam": [
      { s: "Rakam nedir?", c: ["Sayıları yazmaya yarayan semboller", "0 ile 9 arasındaki tüm sayılar", "Tek basamaklı pozitif sayılar"], a: "Rakam bir semboldür: 0, 1, 2, …, 9. Sayılar bu sembollerle yazılır." },
      { s: "Onluk sayı sisteminde kaç rakam vardır?", c: ["10", "9", "11"], a: "0, 1, 2, 3, 4, 5, 6, 7, 8, 9: on rakam." },
      { s: "Hangisi bir rakam değildir?", c: ["10", "0", "9"], a: "10 bir sayıdır; iki rakamla (1 ve 0) yazılır." },
      { s: "2026 sayısı kaç farklı rakamla yazılır?", c: ["3", "4", "2"], a: "Kullanılan rakamlar 2, 0 ve 6: üç farklı rakam. Sayı dört basamaklıdır ama 2 iki kez kullanılmış." },
      { s: "7 için hangisi doğrudur?", c: ["Hem bir rakam hem bir sayıdır", "Sadece bir rakamdır", "Sadece bir sayıdır"], a: "7 sembolü bir rakamdır; gösterdiği değer ise bir sayıdır." },
      { s: "a, b, c birbirinden farklı rakamlardır. a + b + c en çok kaçtır?", c: ["24", "27", "25"], a: "En büyük üç farklı rakam: 9 + 8 + 7 = 24. 27 için 9 üç kez kullanılmalı." },
      { s: "a, b, c birbirinden farklı rakamlardır. a + b + c en az kaçtır?", c: ["3", "6", "0"], a: "0 da bir rakamdır: 0 + 1 + 2 = 3." },
      { s: "a, b, c birbirinden farklı <u>pozitif</u> rakamlardır. a + b + c en az kaçtır?", c: ["6", "3", "0"], a: "0 pozitif değildir: 1 + 2 + 3 = 6." },
      { s: "a ve b rakamdır. a · b = 12 ise a + b en çok kaçtır?", c: ["8", "7", "13"], a: "2 · 6 → 8, 3 · 4 → 7. 1 · 12 olmaz: 12 bir rakam değildir." },
      { s: "a ve b birbirinden farklı rakamlardır. a − b en çok kaçtır?", c: ["9", "8", "10"], a: "En büyük rakamdan en küçüğü: 9 − 0 = 9." }
    ],

    "yks-dogal": [
      { s: "Hangisi bir doğal sayı değildir?", c: ["−1", "0", "15"], a: "Doğal sayılar: 0, 1, 2, 3, … Negatif sayılar doğal sayı değildir." },
      { s: "En küçük doğal sayı kaçtır?", c: ["0", "1", "−1"], a: "ℕ = {0, 1, 2, …}: en küçüğü 0." },
      { s: "ℕ ile ℕ<sup>+</sup> arasındaki fark nedir?", c: ["ℕ'de 0 var, ℕ<sup>+</sup>'da yok", "ℕ<sup>+</sup>'da 0 var", "Fark yoktur"], a: "ℕ = {0, 1, 2, …}, sayma sayıları ℕ<sup>+</sup> = {1, 2, 3, …}." },
      { s: "Hangisi doğrudur?", c: ["Her sayma sayısı bir doğal sayıdır", "Her doğal sayı bir sayma sayısıdır", "Doğal sayıların en büyüğü vardır"], a: "ℕ<sup>+</sup>, ℕ'nin içindedir. 0 doğal sayıdır ama sayma sayısı değildir." },
      { s: "x bir doğal sayıdır ve x &lt; 3. x kaç farklı değer alabilir?", c: ["3", "2", "4"], a: "0, 1, 2: üç değer. 0'ı unutma." },
      { s: "x bir sayma sayısıdır ve x &lt; 3. x kaç farklı değer alabilir?", c: ["2", "3", "4"], a: "Sayma sayıları 1'den başlar: 1, 2." },
      { s: "x bir doğal sayıdır ve 2x + 1 &lt; 9. x kaç farklı değer alabilir?", c: ["4", "3", "5"], a: "2x &lt; 8 → x &lt; 4: 0, 1, 2, 3." },
      { s: "x ve y doğal sayılardır, x + y = 5. x · y en az kaçtır?", c: ["0", "4", "6"], a: "x = 0, y = 5 olabilir: 0 · 5 = 0." },
      { s: "Pozitif olmayan en büyük doğal sayı kaçtır?", c: ["0", "−1", "Yoktur"], a: "Doğal sayılar içinde pozitif olmayan tek sayı 0'dır." },
      { s: "İki basamaklı en küçük doğal sayı kaçtır?", c: ["10", "−99", "0"], a: "Doğal sayılar negatif olamaz: iki basamaklı en küçük doğal sayı 10." }
    ],

    "yks-tam": [
      { s: "Hangisi bir tam sayı değildir?", c: ["1/2", "−7", "0"], a: "Tam sayılar: …, −2, −1, 0, 1, 2, … 1/2 bir tam sayı değildir." },
      { s: "Hangisi ne pozitif ne negatif bir tam sayıdır?", c: ["0", "1", "−1"], a: "0 ne pozitiftir ne negatiftir." },
      { s: "En büyük negatif tam sayı kaçtır?", c: ["−1", "0", "Yoktur"], a: "Negatif tam sayılar: −1, −2, −3, … En büyüğü −1. 0 negatif değildir." },
      { s: "En küçük pozitif tam sayı kaçtır?", c: ["1", "0", "Yoktur"], a: "Pozitif tam sayılar: 1, 2, 3, … 0 pozitif değildir." },
      { s: "En küçük tam sayı kaçtır?", c: ["Yoktur", "0", "−1"], a: "Tam sayılar eksi yönde sonsuza kadar gider; en küçüğü yoktur. (Doğal sayıların en küçüğü 0'dır.)" },
      { s: "Hangisi doğrudur?", c: ["Her doğal sayı bir tam sayıdır", "Her tam sayı bir doğal sayıdır", "0 pozitif bir tam sayıdır"], a: "ℕ ⊂ ℤ. Ama −1 gibi negatif tam sayılar doğal sayı değildir." },
      { s: "−3 &lt; x &lt; 2 koşulunu sağlayan kaç tam sayı vardır?", c: ["4", "5", "6"], a: "−2, −1, 0, 1: dört tam sayı. Uçlar dahil değil." },
      { s: "−3 ≤ x ≤ 2 koşulunu sağlayan kaç tam sayı vardır?", c: ["6", "5", "4"], a: "−3, −2, −1, 0, 1, 2: altı tam sayı. Bu sefer uçlar dahil." },
      { s: "x negatif bir tam sayıdır ve x > −4. x kaç farklı değer alabilir?", c: ["3", "4", "2"], a: "−3, −2, −1. 0 negatif değildir." },
      { s: "x ve y tam sayılardır, x · y = 6. x + y en az kaçtır?", c: ["−7", "5", "−5"], a: "Negatif çarpanları unutma: (−1) · (−6) = 6 ve −1 + (−6) = −7." },
      { s: "İki basamaklı en küçük tam sayı kaçtır?", c: ["−99", "10", "−10"], a: "Tam sayılar negatif olabilir: iki basamaklı en küçük tam sayı −99." },
      { s: "Bir basamaklı kaç tane tam sayı vardır?", c: ["19", "10", "18"], a: "−9'dan 9'a kadar: 9 negatif, 9 pozitif ve 0 → 19." },
      { s: "Rakamları birbirinden farklı üç basamaklı en küçük tam sayı kaçtır?", c: ["−987", "102", "−999"], a: "Negatif olabilir: rakamları farklı en büyük üç basamaklı sayı 987, en küçüğü −987. −999'un rakamları farklı değil." },
      { s: "İki basamaklı tam sayıların toplamı kaçtır?", c: ["0", "4905", "−4905"], a: "10 ile −10, 11 ile −11, …, 99 ile −99 birbirini götürür: toplam 0." },
      // Tam sayılarda işlemler: işaret, parantez, yazım, işlem önceliği
      { s: "−3 + 5 = ?", c: ["2", "−8", "8"], a: "Farklı işaretli sayılar: büyükten küçüğü çıkar, büyüğün işaretini al: 5 − 3 = 2." },
      { s: "−3 − 5 = ?", c: ["−8", "2", "−2"], a: "Eksi yönde 3, sonra 5 daha: −8." },
      { s: "−3 − (−5) = ?", c: ["2", "−8", "8"], a: "Negatif bir sayıyı çıkarmak, onu eklemektir: −3 + 5 = 2." },
      { s: "(−3) · (−4) = ?", c: ["12", "−12", "−7"], a: "Aynı işaretli iki sayının çarpımı pozitiftir: 12." },
      { s: "−(−(−4)) = ?", c: ["−4", "4", "0"], a: "Üç eksi: −(−(−4)) = −(4) = −4. Tek sayıda eksi varsa sonuç negatif." },
      { s: "“3 · −4” yazımı için hangisi doğrudur?", c: ["Yanlış; 3 · (−4) yazılmalı", "Doğru bir yazımdır", "3 − 4 demektir"], a: "İki işlem işareti yan yana yazılmaz; negatif sayı paranteze alınır: 3 · (−4) = −12." },
      { s: "Hangisi doğru yazılmıştır?", c: ["5 · (−2)", "5 · −2", "5 −· 2"], a: "Negatif sayı bir işlem işaretinden sonra geliyorsa parantez içinde yazılır." },
      { s: "x = −2 ise 5 − 3x = ?", c: ["11", "−1", "−4"], a: "x yerine (−2) yaz: 5 − 3 · (−2) = 5 + 6 = 11." },
      { s: "x = −3 ise −x = ?", c: ["3", "−3", "0"], a: "−x = −(−3) = 3." },
      { s: "5 − (−2) · 3 = ?", c: ["11", "21", "−1"], a: "Önce çarpma: (−2) · 3 = −6. Sonra 5 − (−6) = 11." },
      { s: "−7 + 3 · (−2) = ?", c: ["−13", "8", "−1"], a: "Önce çarpma: 3 · (−2) = −6. Sonra −7 + (−6) = −13." },
      { s: "−12 ÷ (−3) · 2 = ?", c: ["8", "2", "−8"], a: "Bölme ve çarpma soldan sağa: −12 ÷ (−3) = 4, sonra 4 · 2 = 8." },
      { s: "(−6) ÷ 2 · (−3) = ?", c: ["9", "1", "−9"], a: "Soldan sağa: (−6) ÷ 2 = −3, sonra (−3) · (−3) = 9." },
      { s: "2 · (−3) − (−4) · 2 = ?", c: ["2", "−14", "−2"], a: "Önce çarpmalar: −6 ve −8. Sonra −6 − (−8) = −6 + 8 = 2." },
      { s: "20 ÷ (−4) − (−3) · 2 = ?", c: ["1", "−11", "−4"], a: "Önce bölme ve çarpma: −5 ve −6. Sonra −5 − (−6) = 1." },
      { s: "10 − (3 − 7) = ?", c: ["14", "0", "6"], a: "Önce parantez: 3 − 7 = −4. Sonra 10 − (−4) = 14." },
      { s: "−2 · (5 − 8) = ?", c: ["6", "−6", "−18"], a: "Önce parantez: 5 − 8 = −3. Sonra −2 · (−3) = 6." },
      { s: "(−4 + 1) · (2 − 6) = ?", c: ["12", "−12", "−8"], a: "Parantezler: −3 ve −4. Çarpım: (−3) · (−4) = 12." },
      { s: "−8 − 2 · (3 − 5) = ?", c: ["−4", "−12", "20"], a: "Önce parantez (−2), sonra çarpma: 2 · (−2) = −4. Son olarak −8 − (−4) = −4." },
      { s: "−[3 − (5 − 9)] = ?", c: ["−7", "11", "7"], a: "İçten dışa: 5 − 9 = −4; 3 − (−4) = 7; −[7] = −7." },
      { s: "−(−2 + 5) = ?", c: ["−3", "7", "3"], a: "Önce parantez: −2 + 5 = 3. Sonra −(3) = −3. Eksi sadece ilk terime değil, parantezin tamamına uygulanır." },
      { s: "6 − 2 · (3 + 1) = ?", c: ["−2", "1", "16"], a: "Önce parantez: 4. Sonra çarpma: 2 · 4 = 8. Son olarak 6 − 8 = −2." },
      { s: "Hangisi 12'ye eşittir?", c: ["(2 + 4) · 2", "2 + 4 · 2", "2 · 4 + 2"], a: "(2 + 4) · 2 = 6 · 2 = 12. Parantez olmadan çarpma önce yapılır: 2 + 8 = 10 ve 8 + 2 = 10." },
      { s: "2 − (−3) · 4 = ?", c: ["14", "−10", "20"], a: "Önce çarpma: (−3) · 4 = −12. Sonra 2 − (−12) = 14." },
      { s: "−(−1) − (−1) = ?", c: ["2", "−2", "0"], a: "−(−1) = 1 ve − (−1) = + 1: 1 + 1 = 2." },
      { s: "(−2) · (−3) − (−3) = ?", c: ["9", "3", "−9"], a: "Önce çarpma: 6. Sonra 6 − (−3) = 6 + 3 = 9." },
      { s: "−4'ün 3 katının 2 eksiği kaçtır?", c: ["−14", "−18", "14"], a: "Önce 3 katı: 3 · (−4) = −12. Sonra 2 eksiği: −12 − 2 = −14." },
      { s: "3 − 2 · [4 − (1 − 3)] = ?", c: ["−9", "3", "6"], a: "İçten dışa: 1 − 3 = −2; 4 − (−2) = 6; 2 · 6 = 12; 3 − 12 = −9." }
    ]
  },

  dogruYanlis: [
    { k: "yks-rakam", s: "10 bir rakamdır.", d: false, n: "10, iki rakamla (1 ve 0) yazılan bir sayıdır" },
    { k: "yks-rakam", s: "0 bir rakamdır.", d: true },
    { k: "yks-rakam", s: "Rakamlar, sayıları yazmak için kullanılan sembollerdir.", d: true },
    { k: "yks-dogal", s: "0 bir doğal sayıdır.", d: true },
    { k: "yks-dogal", s: "0 bir sayma sayısıdır.", d: false, n: "Sayma sayıları 1'den başlar" },
    { k: "yks-dogal", s: "En büyük doğal sayı vardır.", d: false, n: "Her doğal sayıdan daha büyük bir doğal sayı vardır" },
    { k: "yks-dogal", s: "İki doğal sayının farkı her zaman bir doğal sayıdır.", d: false, n: "2 − 5 = −3 doğal sayı değil" },
    { k: "yks-dogal", s: "İki doğal sayının çarpımı her zaman bir doğal sayıdır.", d: true },
    { k: "yks-dogal", s: "İki doğal sayının bölümü her zaman bir doğal sayıdır.", d: false, n: "1 ÷ 2 = 1/2 doğal sayı değil; 5 ÷ 0 tanımsız" },
    { k: "yks-dogal", s: "Negatif olmayan iki doğal sayının çarpımı pozitiftir.", d: false, n: "0 · 5 = 0 ve 0 pozitif değildir" },
    { k: "yks-tam", s: "0 ne pozitif ne negatiftir.", d: true },
    { k: "yks-tam", s: "Her doğal sayı bir tam sayıdır.", d: true },
    { k: "yks-tam", s: "İki tam sayının farkı her zaman bir tam sayıdır.", d: true },
    { k: "yks-tam", s: "İki tam sayının bölümü her zaman bir tam sayıdır.", d: false, n: "1 ÷ 2 = 1/2 tam sayı değil" },
    { k: "yks-tam", s: "En küçük tam sayı −1'dir.", d: false, n: "En küçük tam sayı yoktur; −1 en büyük negatif tam sayıdır" },
    { k: "yks-tam", s: "Bir basamaklı tam sayıların toplamı 0'dır.", d: true },
    { k: "yks-tam", s: "3 · −4 doğru bir yazımdır.", d: false, n: "İki işlem işareti yan yana gelmez: 3 · (−4)" },
    { k: "yks-tam", s: "İki negatif sayının çarpımı pozitiftir.", d: true },
    { k: "yks-tam", s: "İki negatif sayının toplamı pozitiftir.", d: false, n: "−2 + (−3) = −5" },
    { k: "yks-tam", s: "a − (−b) = a + b", d: true },
    { k: "yks-tam", s: "10 − (3 − 7) = 10 − 3 − 7", d: false, n: "Önündeki eksi parantezdeki her terimin işaretini değiştirir: 10 − 3 + 7" },
    { k: "yks-tam", s: "Çarpma ve bölme soldan sağa doğru yapılır.", d: true }
  ]
};
