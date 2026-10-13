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

Effects: hit-stop freezes with shudder on impacts, motion blur on fast moves (launch, jump-spin, scramble, tape wrap, slipper throw), inverted impact frames, comic starbursts, manga focus lines, slow-motion desaturation during the vase wobble, red rage vignette, sparkles, flickering paper grain, line boil, camera shake.
Preview stills: [`onizleme/`](onizleme/).

Sound (all synthesized with Web Audio): TV crowd roar, whoosh, formant-synth "SIUUU" shout, glass shatter, tape rips and squeaks, whispered "siu", door bang, Mom's "NOOOD!", kettle steam, slipper whoosh.

```bash
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-siuuu.html video/nod-siuuu.mp4
NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-siuuu.html frames --stills 3.2,9.9,13.6   # single PNG frames
```

## Remotion projesi (`src/`)

Kök klasör bir Remotion projesidir (`npm install`, sonra `npm run studio` → http://localhost:3000).
Varsayılan sahne `Ana` 1920×1080, 30 fps. Statik dosyalar `assets/` klasöründen sunulur
(`staticFile('duygular.png')`, `staticFile('emotions/mutlu.png')`, `staticFile('fonts/…')`).

### Duygular karakteri — `<Karakter duygu="mutlu" />`

`assets/duygular.png`'deki çizgi karakterin React/SVG olarak yeniden çizimi (`src/Karakter/`):
siyah el çizimi kontur, beyaz dolgu, yanakta hafif pembe, kızgın/kızarmış/üzgün/yorgun hallerinde
yüz rengi; gözyaşı, ter, soru işareti, zZz, buhar, pırıltı, şapka, palto, termometre gibi ekler.
Oranlar görseldeki gibidir: büyük kafa, kafanın altı ≈ 0.6 kafa çapı; pasif duruşlarda kollar
gizlenir ve gövde kafadan yere inen iki çizgi olarak görünür.

- **Ayrı parçalar:** kafa, gözler, kaşlar, ağız, yanaklar, gövde; her kolda üst kol / ön kol / el,
  her bacakta üst bacak / alt bacak / ayak (`className` ile seçilebilir, her uzuv açı çiftiyle döner).
- **22 duygu, her biri ayrı tanımlı** (`src/Karakter/pozlar.ts` → `DUYGULAR`): poz (iskelet açıları,
  el hedefleri `kolIK` ile kafaya göre) + yüz (göz, kaş, ağız, yanak, yüz rengi, ekler, el biçimi).
  `mutlu, cok-mutlu, heyecanli, gulen, sok-olmus, kizgin, somurtan, uzgun, aglayan, huzunlu,
  hayal-kirikligi, hayal-kirikligi-2, utangac, kizarmis, mahcup, kafasi-karisik, dusunceli, yorgun,
  hasta, uyuyan, sinirli, gizemli`. (Görselde 22 çizim var; HAYAL KIRIKLIĞI iki kez geçiyor.)
- **Referansla karşılaştırma sahneleri:**
  - `DuyguIzgarasi` — tüm duygular, görseldeki ızgarayla aynı konum ve kafa boyutunda (1920×1080).
  - `Referans` — görselin kendisi aynı ölçekte; Studio'da ikisi arasında geçiş yaparak karşılaştır.
  - `Karsilastirma` — 6 sn: referans ile SVG ızgara arasında kayan perde.
  - `YanYana` — her duygu için solda görselden kesilen PNG, sağda SVG.
  - `Karakter-<duygu>` — tek karakter, idle animasyonuyla (1080×1080).
  - `HareketOrnekleri` — yuru, otur → kalk, zipla, zipla → zipla yan yana (1920×1080).
- **Poz:** `poz` prop'u duygunun pozunun üstüne yazar (`kolSol: [omuz, dirsek]`, `bacakSag: [kalça, diz]`,
  `kafaEgim`, `govdeEgim`, `ziplama`, `bakisX/Y`, `kolGorunurSol/Sag`). `kolIK('sag', x, y)` eli bir noktaya götürür.
- **Geçiş:** `onceki` + `gecis` (0→1): açılar karışır, yüzler çapraz geçer — sert değişim yok.
- **Idle (varsayılan açık):** hafif nefes (gövde uzar, omuz/kafa kalkar, kollar gecikmeli sallanır) ve
  `tohum`'a göre 3–5 sn'de bir rastgele göz kırpma (ara sıra çift). `idle={false}` ile kapatılır.
- **Squash & stretch:** `ezilme` (+ uzama, − basılma); gövde hacmi korunur, kafa yarı oranda deforme olur.
- **Ayaklar yere kilitli:** `ayaklar={{sol: {x, y}, sag: {x, y}}}` verilirse bacaklar 2 kemikli IK ile
  bu noktalara basar; gövde `govdeX` ve `poz.ziplama` ile hareket ederken ayak yerinde kalır.
- **Yüz geçişi:** kaşlar biçim olarak dönüşür, gözler geçişin ortasında bir kırpmanın arkasında değişir,
  ağız küçülerek söner/büyüyerek belirir, yüz rengi ve süsler çapraz geçer.
- `kirpma` (0..1) ek göz kırpma; `zaman` varsayılan olarak `useCurrentFrame()`.

#### Hareket sistemi — `hareket`, `baslangic`, `hareketler`

```tsx
<Karakter duygu="mutlu" hareket="zipla" baslangic={30} />
<Karakter duygu="gulen" hareketler={[
  {hareket: 'yuru', baslangic: 0, x: -300, mesafe: 300, sure: 66},
  {hareket: 'otur', baslangic: 72},
  {hareket: 'kalk', baslangic: 200},
  {hareket: 'zipla', baslangic: 222},
]} />
```

Karakter kalça + diz (bacak IK) ve omuz + dirsek (kol açıları) noktalarından döner (`src/Karakter/hareketler.ts`):

- **yuru** — önden görünüşte yan adım; kollar ve bacaklar karşılıklı sallanır. `mesafe` (birim, − sola), `sure`.
- **otur** — önce hafifçe doğrulur, dizler bükülür, gövde sandalyeye iner, değince basılır; kollar
  dengelemek için açılıp bırakılır. Sandalye (basit çizgi) oturulan yerde otomatik çizilir (`sandalye` ile aç/kapa).
- **kalk** — öne eğilir (kafa iner, bakış aşağı, gövde basılır), sonra itip yukarı uzar ve yerleşir.
- **zipla** — çömelir, kollar aşağı-geri → fırlar, kollar kalkar → kavisli uçuş, havada ayaklar toplanır
  ve gölge küçülür → inişte basılır, durur. `yukseklik`.
- **dur** — yerinde durur (oturuyorsa oturmaya devam eder).

Hareketler birbirine geçer: her hareket öncekinin bıraktığı gövde konumunu ve yerdeki ayakları
devralır (ayaklar hiçbir geçişte kaymaz), kalça, basılma, eğim ve kollar kısa bir yayla karışır.
Hareket kollarından duygu kollarına (`kolAgirlik`) yumuşak dönülür; örn. oturduktan sonra
düşünceli duygusunun "çenede el" pozu görünür. `hareketDurumu(adimlar, kare, fps)` sahnenin de
kafa/gövde konumunu bilmesi için dışa açıktır. Örnekler: `HareketOrnekleri` kompozisyonu.

#### Hareket yardımcıları (`src/Karakter/hareket.ts`)

- `yayToplami(anahtarlar, f, fps)` — her anahtar kendi `spring()`'ini başlatır, değişimler toplanır:
  önceki yay bitmeden yeni hedef gelse de değer süreklidir (pop yok), yaylar hafif aşıp oturur.
- `ziplamaEgrisi(t, fps, {hazirlik, havada, yukseklik, cokme})` — çömelme (anticipation, basılma) →
  kalkışta uzama → parabolik (kavisli) uçuş → inişte darbe yayı ile basılma ve toparlanma.
- `bacakIK`, `kalcaYuksekligi` — diz dışa kırılan bacak IK'sı ve ayakların izin verdiği en yüksek kalça.
- `kirpmaDegeri`, `nefes` — idle; `takipci` — gecikmeli ikinci derece yay (follow-through).

### Çalıştırma

```bash
npm install
npm run studio               # Remotion Studio (önizleme)
npm run duygu:izgara         # out/duygu-izgarasi.png
npm run duygu:yanyana        # out/duygu-yanyana.png
npm run duygu:karsilastirma  # out/duygu-karsilastirma.mp4
npm run duygu:test           # out/duygu-testi.mp4 (1080×1920, 10 sn animasyon testi)
```

Bulut ortamında Remotion'un kendi Chrome'unu indirmek yerine
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

Test videosu (`DuyguTesti`, hazır çıktı `video/duygu-testi.mp4`), yalnızca `hareketler` listesiyle:
mutlu yürüyerek girer → sandalyeye oturur → düşünceli olur (düşünce balonu) → heyecanlanır → öne eğilip kalkar → iki kez zıplar.

Yazı tipleri: Patrick Hand ve PT Sans Narrow (SIL Open Font License), `assets/fonts/`.

### PNG kesimleri

`python3 tools/slice-emotions.py` referans görseli `assets/emotions/*.png` olarak şeffaf
arka planla keser (kontur içindeki beyaz dolgu opak kalır).
