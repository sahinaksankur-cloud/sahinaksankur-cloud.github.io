// Kuzey Kampüs – Calculus oyunu soru bankası
// Her soru: s = soru, c = 3 seçenek (İLK seçenek doğru cevap; oyunda karıştırılır), a = kısa açıklama.
// Matematik HTML ile yazılır: <sup>2</sup> üs, <sub>x→2</sub> alt yazı, − eksi işareti.

window.KK_OYUN = {
  // Oyunun adı: sayfa başlığında görünür. Değiştirmek için sadece burayı düzenleyin.
  ad: "Calculus Oyunu",

  // Konular: yeni bir konu (ör. lise, ortaokul) eklemek için buraya bir satır ve aşağıda aynı id ile bir soru listesi ekleyin.
  konular: [
    { id: "limit", ad: "Limit", aciklama: "Doğrudan yerine koyma, 0/0, sonsuzda limit, asimptotlar." },
    { id: "turev", ad: "Türev", aciklama: "Türev kuralları, zincir kuralı, türevin anlamı." },
    { id: "karisik", ad: "Karışık", aciklama: "Limit ve türevden karışık sorular." }
  ],
  soruSayisi: 10,
  sure: 10,          // her soru için saniye (0 yazılırsa sayaç kapanır)

  sorular: {
    limit: [
      { s: "lim<sub>x→∞</sub> 1/x = ?", c: ["0", "1", "∞"], a: "x büyüdükçe 1/x küçülür ve 0'a yaklaşır." },
      { s: "lim<sub>x→2</sub> (x<sup>2</sup> + 1) = ?", c: ["5", "4", "3"], a: "Polinomda doğrudan yerine koyarız: 2<sup>2</sup> + 1 = 5." },
      { s: "lim<sub>x→3</sub> (2x − 1) = ?", c: ["5", "6", "7"], a: "Yerine koy: 2·3 − 1 = 5." },
      { s: "lim<sub>x→−1</sub> x<sup>3</sup> = ?", c: ["−1", "1", "0"], a: "(−1)<sup>3</sup> = −1." },
      { s: "lim<sub>x→4</sub> √x = ?", c: ["2", "4", "16"], a: "√4 = 2." },
      { s: "Bir limitte değeri yerine koyunca 0/0 çıktı. Ne söyleyebiliriz?", c: ["Henüz bir şey söyleyemeyiz; limit olabilir de olmayabilir de", "Limit yoktur", "Limit 0'dır"], a: "0/0 belirsizliktir. Önce sadeleştirme gibi yöntemlerle ifadeyi düzenleriz." },
      { s: "lim<sub>x→2</sub> (x<sup>2</sup> − 4) / (x − 2) = ?", c: ["4", "0", "Limit yok"], a: "(x − 2)(x + 2) / (x − 2) = x + 2 → 4." },
      { s: "lim<sub>x→1</sub> (x − 1) / (x<sup>2</sup> − 1) = ?", c: ["1/2", "0", "1"], a: "(x − 1) / ((x − 1)(x + 1)) = 1/(x + 1) → 1/2." },
      { s: "lim<sub>x→2</sub> (x<sup>2</sup> − 4) / (x − 2)<sup>2</sup> = ?", c: ["Limit yok", "4", "0"], a: "Sadeleşince (x + 2)/(x − 2) olur, 4/0 çıkar. Soldan −∞, sağdan +∞: limit yok." },
      { s: "lim<sub>x→0</sub> (√(x + 1) − 1) / x = ?", c: ["1/2", "0", "1"], a: "Eşlenikle çarp: 1 / (√(x + 1) + 1) → 1/2." },
      { s: "lim<sub>x→0</sub> sin x / x = ?", c: ["1", "0", "Limit yok"], a: "Calculus'un en ünlü limitlerinden biri: 1." },
      { s: "lim<sub>x→0</sub> sin(3x) / x = ?", c: ["3", "1", "1/3"], a: "3 · sin(3x)/(3x) → 3 · 1 = 3." },
      { s: "lim<sub>x→0</sub> tan x / x = ?", c: ["1", "0", "Limit yok"], a: "tan x / x = (sin x / x) · (1 / cos x) → 1 · 1 = 1." },
      { s: "lim<sub>x→0</sub> (1 − cos x) / x = ?", c: ["0", "1", "Limit yok"], a: "Bilinen limit: (1 − cos x)/x → 0." },
      { s: "lim<sub>x→0<sup>+</sup></sub> 1/x = ?", c: ["+∞", "−∞", "0"], a: "Sağdan 0'a yaklaşırken x küçük pozitif, 1/x çok büyük pozitif olur." },
      { s: "lim<sub>x→0<sup>−</sup></sub> 1/x = ?", c: ["−∞", "+∞", "0"], a: "Soldan yaklaşırken x küçük negatif, 1/x çok büyük negatif olur." },
      { s: "lim<sub>x→0</sub> 1/x = ?", c: ["Limit yok", "0", "+∞"], a: "Sağdan +∞, soldan −∞. Tek taraflı limitler farklı: limit yok." },
      { s: "lim<sub>x→0</sub> |x| / x = ?", c: ["Limit yok", "1", "−1"], a: "Sağdan 1, soldan −1. Eşit değiller: limit yok." },
      { s: "lim<sub>x→0<sup>+</sup></sub> |x| / x = ?", c: ["1", "−1", "Limit yok"], a: "x > 0 iken |x| = x, yani |x|/x = 1." },
      { s: "lim<sub>x→a</sub> f(x)'in var olması için sağdan ve soldan limitler…", c: ["İkisi de var ve birbirine eşit olmalı", "Farklı olabilir", "Var olmak zorunda değil"], a: "Limit, ancak iki tek taraflı limit var ve eşitse vardır." },
      { s: "lim<sub>x→∞</sub> (3x + 1) / (x − 2) = ?", c: ["3", "1", "∞"], a: "Derece eşit: baş katsayıların oranı 3/1 = 3." },
      { s: "lim<sub>x→∞</sub> 2x<sup>2</sup> / (x<sup>2</sup> + 5) = ?", c: ["2", "0", "∞"], a: "Derece eşit: 2/1 = 2." },
      { s: "lim<sub>x→∞</sub> x / (x<sup>2</sup> + 1) = ?", c: ["0", "1", "∞"], a: "Paydanın derecesi daha büyük: limit 0." },
      { s: "lim<sub>x→∞</sub> (x<sup>2</sup> + 1) / x = ?", c: ["∞", "1", "0"], a: "Payın derecesi daha büyük: ifade sınırsız büyür." },
      { s: "lim<sub>x→∞</sub> e<sup>−x</sup> = ?", c: ["0", "1", "∞"], a: "e<sup>−x</sup> = 1/e<sup>x</sup>, payda sınırsız büyür: 0." },
      { s: "lim<sub>x→∞</sub> sin x / x = ?", c: ["0", "1", "Limit yok"], a: "−1/x ≤ sin x / x ≤ 1/x. Sıkıştırma teoremi: 0." },
      { s: "lim<sub>x→0</sub> x · sin(1/x) = ?", c: ["0", "1", "Limit yok"], a: "−|x| ≤ x·sin(1/x) ≤ |x|. Sıkıştırma teoremi: 0." },
      { s: "y = 1/(x − 3) fonksiyonunun dikey asimptotu hangisi?", c: ["x = 3", "x = −3", "y = 0"], a: "Payda x = 3'te sıfır olur, pay sıfır olmaz: dikey asimptot x = 3." },
      { s: "y = (2x + 1)/(x − 1) fonksiyonunun yatay asimptotu hangisi?", c: ["y = 2", "y = 1", "y = 0"], a: "x → ±∞ iken oran 2/1 = 2'ye gider." },
      { s: "f(x) = x<sup>2</sup> fonksiyonu x = 3'te sürekli mi?", c: ["Evet, çünkü lim<sub>x→3</sub> f(x) = f(3) = 9", "Hayır", "Sadece sağdan sürekli"], a: "Polinomlar her yerde süreklidir: limit ile fonksiyon değeri eşit." }
    ],

    turev: [
      { s: "d/dx (5) = ?", c: ["0", "5", "1"], a: "Sabit değişmez; değişim hızı 0'dır." },
      { s: "d/dx (x<sup>2</sup>) = ?", c: ["2x", "x", "2"], a: "Kuvvet kuralı: n·x<sup>n−1</sup> = 2x." },
      { s: "d/dx (x<sup>3</sup>) = ?", c: ["3x<sup>2</sup>", "x<sup>2</sup>", "3x"], a: "Kuvvet kuralı: 3x<sup>2</sup>." },
      { s: "d/dx (5x<sup>4</sup>) = ?", c: ["20x<sup>3</sup>", "5x<sup>3</sup>", "20x<sup>4</sup>"], a: "5 · 4x<sup>3</sup> = 20x<sup>3</sup>." },
      { s: "d/dx (3x + 7) = ?", c: ["3", "7", "3x"], a: "3x'in türevi 3, sabit 7'nin türevi 0." },
      { s: "d/dx (sin x) = ?", c: ["cos x", "−cos x", "−sin x"], a: "Sinüsün türevi kosinüstür." },
      { s: "d/dx (cos x) = ?", c: ["−sin x", "sin x", "−cos x"], a: "Kosinüsün türevi −sin x." },
      { s: "d/dx (tan x) = ?", c: ["sec<sup>2</sup> x", "−csc<sup>2</sup> x", "sec x · tan x"], a: "tan x = sin x / cos x, bölüm kuralıyla 1/cos<sup>2</sup> x = sec<sup>2</sup> x." },
      { s: "d/dx (e<sup>x</sup>) = ?", c: ["e<sup>x</sup>", "x·e<sup>x−1</sup>", "e"], a: "e<sup>x</sup> türevi kendisine eşit olan özel fonksiyondur." },
      { s: "d/dx (ln x) = ?   (x > 0)", c: ["1/x", "ln x", "x"], a: "ln x'in türevi 1/x." },
      { s: "d/dx (√x) = ?", c: ["1 / (2√x)", "2√x", "1 / √x"], a: "√x = x<sup>1/2</sup> → (1/2)x<sup>−1/2</sup>." },
      { s: "d/dx (1/x) = ?", c: ["−1/x<sup>2</sup>", "1/x<sup>2</sup>", "ln x"], a: "1/x = x<sup>−1</sup> → −x<sup>−2</sup>." },
      { s: "d/dx (arctan x) = ?", c: ["1 / (1 + x<sup>2</sup>)", "−1 / (1 + x<sup>2</sup>)", "1 / √(1 − x<sup>2</sup>)"], a: "Ters tanjantın türevi 1/(1 + x<sup>2</sup>)." },
      { s: "d/dx (x<sup>2</sup> · sin x) = ?", c: ["2x·sin x + x<sup>2</sup>·cos x", "2x·cos x", "2x·sin x − x<sup>2</sup>·cos x"], a: "Çarpım kuralı: u′v + uv′." },
      { s: "d/dx (x · e<sup>x</sup>) = ?", c: ["e<sup>x</sup> + x·e<sup>x</sup>", "x·e<sup>x</sup>", "e<sup>x</sup>"], a: "Çarpım kuralı: 1·e<sup>x</sup> + x·e<sup>x</sup>." },
      { s: "Bölüm kuralı: (u/v)′ = ?", c: ["(u′v − uv′) / v<sup>2</sup>", "(u′v + uv′) / v<sup>2</sup>", "u′ / v′"], a: "Payda kare, payda eksi işareti var: (u′v − uv′)/v<sup>2</sup>." },
      { s: "d/dx (sin 2x) = ?", c: ["2·cos 2x", "cos 2x", "−2·cos 2x"], a: "Zincir kuralı: cos 2x · (2x)′ = 2 cos 2x." },
      { s: "d/dx (e<sup>3x</sup>) = ?", c: ["3e<sup>3x</sup>", "e<sup>3x</sup>", "3x·e<sup>3x−1</sup>"], a: "Zincir kuralı: e<sup>3x</sup> · 3." },
      { s: "d/dx (x<sup>2</sup> + 1)<sup>3</sup> = ?", c: ["6x(x<sup>2</sup> + 1)<sup>2</sup>", "3(x<sup>2</sup> + 1)<sup>2</sup>", "2x(x<sup>2</sup> + 1)<sup>3</sup>"], a: "Zincir kuralı: 3(x<sup>2</sup> + 1)<sup>2</sup> · 2x." },
      { s: "d/dx ln(x<sup>2</sup>) = ?   (x > 0)", c: ["2/x", "1/x<sup>2</sup>", "2x"], a: "(1/x<sup>2</sup>) · 2x = 2/x." },
      { s: "f(x) = x<sup>2</sup> ise f′(3) = ?", c: ["6", "9", "3"], a: "f′(x) = 2x → f′(3) = 6." },
      { s: "y = x<sup>2</sup> eğrisine x = 1'deki teğetin eğimi kaçtır?", c: ["2", "1", "0"], a: "Eğim = f′(1) = 2·1 = 2." },
      { s: "Konum s(t) = t<sup>2</sup> ise t = 2'deki hız kaçtır?", c: ["4", "2", "8"], a: "Hız = s′(t) = 2t → s′(2) = 4." },
      { s: "Türevin tanımı f′(x) = ?", c: ["lim<sub>h→0</sub> [f(x + h) − f(x)] / h", "lim<sub>h→0</sub> [f(x + h) + f(x)] / h", "lim<sub>h→∞</sub> [f(x + h) − f(x)] / h"], a: "Kesen doğrunun eğiminin h → 0 iken limiti." },
      { s: "Bir noktadaki türevin geometrik anlamı nedir?", c: ["O noktadaki teğet doğrunun eğimi", "Eğrinin altındaki alan", "Fonksiyonun en büyük değeri"], a: "Türev, teğetin eğimidir." },
      { s: "Bir aralıkta f′(x) > 0 ise f orada…", c: ["Artandır", "Azalandır", "Sabittir"], a: "Pozitif eğim: fonksiyon artar." },
      { s: "f′(c) = 0 ise (veya f′(c) tanımsızsa) c noktasına ne denir?", c: ["Kritik nokta", "Dönüm noktası", "Asimptot"], a: "Ekstremumlar kritik noktalarda aranır." },
      { s: "Bir aralıkta f″(x) > 0 ise grafik orada…", c: ["Yukarı doğru konkavdır (∪)", "Aşağı doğru konkavdır (∩)", "Azalandır"], a: "İkinci türev pozitif: grafik yukarı bükülür." },
      { s: "f, x = a'da türevlenebiliyorsa a'da…", c: ["Süreklidir", "Sürekli olmayabilir", "Değeri 0'dır"], a: "Türevlenebilirlik süreklilik gerektirir." },
      { s: "f(x) = |x| fonksiyonu x = 0'da…", c: ["Sürekli ama türevlenemez", "Türevlenebilir", "Süreksiz"], a: "x = 0'da sivri köşe var: sağ ve sol eğimler 1 ve −1." }
    ]
  }
};
