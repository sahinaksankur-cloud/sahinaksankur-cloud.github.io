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
      { s: "İki basamaklı tam sayıların toplamı kaçtır?", c: ["0", "4905", "−4905"], a: "10 ile −10, 11 ile −11, …, 99 ile −99 birbirini götürür: toplam 0." }
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
    { k: "yks-tam", s: "Bir basamaklı tam sayıların toplamı 0'dır.", d: true }
  ]
};
