# Nod ile Matematik

Dört işlemi **Nod**'un (beyaz, kırmızı atkılı defter karakteri) süper güçleriyle çözdüğü, tarayıcıda çalışan matematik animasyonu.
Sahne bir defter sayfası; sayılar kalın, elle çizilmiş rakamlardır ve Nod onlarla fiziksel olarak boğuşur ("Animator vs Math" tarzı). Her işlemde farklı bir alet kullanır:

| İşlem | Silah | Ne oluyor? |
|---|---|---|
| ➕ Toplama | Mıknatıs | `+` işareti mıknatısa dönüşür, iki sayıyı çekip tek sayıda kaynaştırır. |
| ➖ Çıkarma | Çekiç | Eksilen sayı büyük sayıya yapışır, çekiç darbesiyle koparılıp uçurulur; kalan sayı küçülerek sayar. |
| ✖️ Çarpma | Sihirli değnek | İkinci sayı yıldızlara dönüşür, her yıldız bir kopya yaratır (`4 + 4 + 4`), sonra hepsi birleşir. |
| ➗ Bölme | Kılıç | Ninja tek hamlede sayıyı eşit parçalara keser, parçalar sonuca dönüşür. |

Gösteri: Nod yürüyerek gelir, el sallar ("Merhaba! Ben Nod.") ve zıplar → aletler tanıtılır → 8 soru (her biri "Sen de düşün!" geri sayımıyla) → karışık **Boss sorusu** `(6 + 2) × 3 ÷ 4` → kapanış ("Sen kaçını bildin? Yorumlara yaz!", göz kırpıp "Abone olmayı unutma!").

## Çalıştırma

Ek kurulum yok. `index.html` dosyasını tarayıcıda açıp **▶ Başlat**'a ya da sahneye tıkla.

## Özellikler

- **Kendi sorun:** `24 ÷ 4`, `9 - 4`, `6 x 3`, `20 / 4` gibi yazıp **Çöz!**
- **📱 Dikey (9:16)** mod: Shorts / Reels / TikTok için.
- **⏺ Video Kaydet:** gösteriyi baştan oynatır ve bitince sesli `.webm` olarak indirir (Chrome / Edge).
- Hız ayarı (0.75×–1.5×), duraklatma (Boşluk tuşu), müzik aç/kapa.
- Efektler: kamera yakınlaştırma, darbe anında donma (hit-stop), anime hız çizgileri, renk ters çevirme flaşı, çizgi roman patlama balonları, ışık huzmeleri, toz bulutları, ateş ve yıldız izleri, sakura yaprakları, havai fişekler.
- Tüm grafikler ve sesler kodla üretilir (Canvas + Web Audio); dış dosya yok.

## Video: Nod ve Sayılar (`video.html`)

"Animator vs Math" tarzında, siyah zeminde Nod'un büyüyen bir denklemin içinde dört işlemle boğuştuğu 78 saniyelik kısa film.
Hazır video: [`video/nod-ile-matematik.mp4`](video/nod-ile-matematik.mp4) (1920×1080, 30 fps, sesli).

Efektler: hareket bulanıklığı, hızlı uçan rakamların arkasında iz, darbelerde RGB ayrışması ve çizgi roman darbe çizgileri, dramatik anlarda sinema şeritleri, kılıç parlamasında yatay ışık çizgisi, yuvarlanan sıfırdan kıvılcımlar, arka planda süzülen ışık zerreleri, rakamlarda hafif parlama, film greni, kapanışta havai fişekler.

Akış: `1` → `1+1=2` → +1'lerle `=10`'a kadar sayma → mıknatısla `2+2+2+2+2` → değnekle `5×2`, sonra `5×20=100` → çekiçle `100−1−1−98=0` → Nod sıfırın üstünde yuvarlanır → gökten `12` düşer, kılıçla `12÷3=4`, `4÷2=2`, `2÷2=1` → "Bir daha?" → `1 + 1 = ?` → kapanış.

`video.html` tarayıcıda oynatılabilir. Videoyu yeniden üretmek için (Chromium + Playwright + ffmpeg gerekir):

```bash
python3 tools/build-video.py tools/video.tpl.html   # index.html'deki Nod çizimini alıp video.html'i üretir
NODE_PATH=$(npm root -g) node tools/render-video.js $PWD/video.html $PWD/video/nod-ile-matematik.mp4
```

## Video 2: Sayıların Sihri (`video2.html`)

Yatay (16:9) ~90 saniyelik, konuşmasız kısa film. Beyaz zemin, koyu rakamlar, kırmızı vurgular; kahraman kırmızı atkılı çöp adam.
Hazır video: [`video/sayilarin-sihri.mp4`](video/sayilarin-sihri.mp4) (1920×1080, 30 fps, sesli). `video2.html?v=1` dikey (9:16) sürümü açar.

Akış: gökten düşen Nod → `9 × 7 = 63`, 63'ün üstünde tepinince `6 + 3 = 9` → hızlanan turlar (`9 × 8`, `9 × 123`, `9 × 4567`, hep 9) →
`142857` düşer, rakamlar çarka dönüşür, Nod hamster tekerleği gibi koşarken `×2 … ×6` hep aynı rakamlar → `×7` çarpar: `999999` →
dokuz tane `1`, `111111111²` → Nod `12345678987654321` piramidine tırmanır → `0,9`'un peşinde sonsuz dokuzlar, sonunda `0,999… = 1` →
kâğıt katlama `2⁰ … 2⁴²`, gökyüzü ve uzay, Nod Ay'a çarpar (≈ 439.805 km) → geri düşüp `1`'in üstüne konar, göz kırpar, havai fişekler.

Efektler: darbede donma, RGB ayrışması, darbe çizgileri, flaş ve renk ters çevirme, sinema şeritleri, hız çizgileri, hareket bulanıklığı, rakam izleri, parçalanan rakamlar, film greni.

```bash
NODE_PATH=$(npm root -g) node tools/render-video.js $PWD/video2.html $PWD/video/sayilarin-sihri.mp4      # yatay 1920×1080 (dikey için sona 1 ekle)
```

## Video 3: Nod vs Numbers (`nod-shorts.html`)

30 saniyelik dikey (9:16) YouTube Shorts animasyonu, 1080×1920, 24 fps, konuşmasız. Saf siyah zemin; nane yeşili (#3EE0A8) yüzsüz, yuvarlak kare kafalı, tek antenli Nod
duygularını yalnızca anteni ve duruşuyla gösterir. Rakamlar ve semboller beyaz, sade sans-serif çizgilerdir ve ağır fiziksel nesneler gibi davranır.
Hazır video: [`video/nod-shorts.mp4`](video/nod-shorts.mp4).

Akış: `1` kafasına düşer → ikinci `1` bovling topu gibi yuvarlanır, iki `1` öfkeyle saldırır → Nod `+`'yı aralarına bırakır: `1 + 1 = 2` (anten parlar) →
`+` kalkan olur, koşan `3` çarpar: `2 + 3 = 5` → koca `5` bayrağını çekiç gibi savurur, Nod eğilir, `+`'yı 45° çevirip `×` yapar ve shuriken gibi fırlatır: `5 × 2 = 10` →
`10` devleşir, `0` kopup tekerlek gibi kovalar, Nod `−` ve iki noktayı `÷` yapar, ayakta duran `5`'in önüne diker: `10 ÷ 5 = 2` →
dev `2` küçülüp Nod'un eline düşer, karate darbesiyle iki `1`'e bölünür, `÷` kesir çizgisine döner: `½` → Nod tek ayak üstünde döner, anten parlar, siyah.

Ses: çizgi film darbeleri, her sembolde yumuşak "tik", sayılar büyürken derin "bum", anten parlarken "ding", hafif synth ritmi (hepsi Web Audio ile sentezlenir).
Her kare zamanın saf fonksiyonudur (`draw(t)`), bu yüzden render kare kare deterministiktir.

```bash
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-shorts.html video/nod-shorts.mp4
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-shorts.html kareler --stills 1,9.9,23.6   # tek tek PNG kareler
```

## Video 4: Nod — SIUUU! (`nod-siuuu.html`)

30-second vertical (9:16) cartoon, 1080×1920, 30 fps, with sound. Hand-drawn style on cream notebook paper (blue lines, red margin), thick black outlines, soft grey shading; speech appears only in white bubbles.
Ready video: [`video/nod-siuuu.mp4`](video/nod-siuuu.mp4).

Story: Nod sprawled in the armchair (chips on his right, cola on his left) → GOAL on TV → chips explode, he launches out and sprints across the rug →
jump, 180° spin, "SIUUU!" landing (paper lines shake) → his arm swings back, the blue vase wobbles in slow motion and shatters → "Oh no!" + thought cloud of Mom's flying slipper →
frantic repair montage (collecting shards, ripping tape with his teeth, wrap-wrap-wrap, crooked vase stands) → one finger, let go… it holds → tiny "siu…" →
door bursts open, Mom spots the vase: red face, steam, bun pops → "NOOOD!", slipper flies at the camera, Nod dives behind the armchair, Dad covers his eyes → smash cut to black.

Sound (all synthesized with Web Audio): TV crowd roar, whoosh, formant-synth "SIUUU" shout, glass shatter, tape rips and squeaks, whispered "siu", door bang, Mom's "NOOOD!", kettle steam, slipper whoosh.

```bash
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-siuuu.html video/nod-siuuu.mp4
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-siuuu.html frames --stills 3.2,9.9,13.6   # single PNG frames
```
