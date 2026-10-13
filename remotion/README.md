# Duygular — Remotion karakteri

`assets/duygular.png`'deki çizgi karakterin React/SVG olarak yeniden çizilmiş hali.
Siyah el çizimi kontur (SVG turbulence ile hafif titrek), beyaz dolgu, pembe yanaklar,
kızgın/kızarmış/utangaç/üzgün/yorgun hallerinde yüz rengi.

```tsx
import {Karakter} from './src/Karakter/Karakter';

<Karakter duygu="mutlu" />
<Karakter duygu="heyecanli" onceki="dusunceli" gecis={0.4} zaman={frame} />
<Karakter duygu="gulen" poz={{kolSag: [150, 20]}} kirpma={0.5} />
```

- **Duygular (22):** `mutlu, cok-mutlu, heyecanli, gulen, sok-olmus, kizgin, somurtan, uzgun, aglayan,
  huzunlu, hayal-kirikligi, hayal-kirikligi-2, utangac, kizarmis, mahcup, kafasi-karisik, dusunceli,
  yorgun, hasta, uyuyan, sinirli, gizemli` (`src/Karakter/pozlar.ts`).
- **Ayrı parçalar:** kafa (`.kafa`), gözler, kaşlar, ağız, yanaklar, iki kol (üst kol / ön kol / el),
  iki bacak (uyluk / baldır / ayak), gövde. Her uzuv bir açı çifti ile döner.
- **Poz:** `poz` prop'u duygunun pozunun üstüne yazar (`kolSol: [omuz, dirsek]`, `bacakSag: [kalça, diz]`,
  `kafaEgim`, `govdeEgim`, `ziplama`, `bakisX/Y`). `kolIK('sag', x, y)` eli bir noktaya götürür.
- **Geçiş:** `onceki` + `gecis` (0→1): açılar karışır, yüzler çapraz geçer — sert değişim yok.
- **Idle (varsayılan açık):** hafif nefes (gövde uzar, omuz/kafa kalkar, kollar gecikmeli sallanır) ve
  `tohum`'a göre 3–5 sn'de bir rastgele göz kırpma (ara sıra çift). `idle={false}` ile kapatılır.
- **Squash & stretch:** `ezilme` (+ uzama, − basılma); gövde hacmi korunur, kafa yarı oranda deforme olur.
- **Ayaklar yere kilitli:** `ayaklar={{sol: {x, y}, sag: {x, y}}}` verilirse bacaklar 2 kemikli IK ile
  bu noktalara basar; gövde `govdeX` ve `poz.ziplama` ile hareket ederken ayak yerinde kalır.
- **Yüz geçişi:** kaşlar biçim olarak dönüşür, gözler geçişin ortasında bir kırpmanın arkasında değişir,
  ağız küçülerek söner/büyüyerek belirir, yüz rengi ve süsler çapraz geçer.
- `kirpma` (0..1) ek göz kırpma; `zaman` varsayılan olarak `useCurrentFrame()`.

### Hareket yardımcıları (`src/Karakter/hareket.ts`)

- `yayToplami(anahtarlar, f, fps)` — her anahtar kendi `spring()`'ini başlatır, değişimler toplanır:
  önceki yay bitmeden yeni hedef gelse de değer süreklidir (pop yok), yaylar hafif aşıp oturur.
- `ziplamaEgrisi(t, fps, {hazirlik, havada, yukseklik, cokme})` — çömelme (anticipation, basılma) →
  kalkışta uzama → parabolik (kavisli) uçuş → inişte darbe yayı ile basılma ve toparlanma.
- `bacakIK`, `kalcaYuksekligi` — diz dışa kırılan bacak IK'sı ve ayakların izin verdiği en yüksek kalça.
- `kirpmaDegeri`, `nefes` — idle; `takipci` — gecikmeli ikinci derece yay (follow-through).

## Çalıştırma

```bash
cd remotion && npm install
npm run studio                       # önizleme
npm run render                       # out/duygu-testi.mp4 (1080×1920, 30 fps, 10 sn)
npm run galeri                       # out/duygu-galerisi.png (tüm duygular)
```

Bulut ortamında Remotion'un kendi Chrome'unu indirmek yerine:
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

Test videosu (`DuyguTesti`, hazır çıktı `video/duygu-testi.mp4`): mutlu yan adımlarla girer (ayaklar
kaymaz) → çömelip sevinçle zıplar, inişte basılır → hafif kalkıp tabureye oturur, düşünceli olur
(çeneye el, düşünce balonu) → fikir! ampul yanar, heyecanlı olur → öne basılıp kalkar → iki heyecanlı
zıplama. Kollar ve kafa gecikmeli bir yay takipçisiyle izler; gövdenin düşüş hızı kollara sürüklenme
olarak geçer. Hiçbir hareket doğrusal değildir (spring / easing).

Yazı tipi: Patrick Hand (SIL Open Font License), `public/` içinde.

## PNG kesimleri

`python3 tools/slice-emotions.py` referans görseli `assets/emotions/*.png` olarak şeffaf
arka planla keser (kontur içindeki beyaz dolgu opak kalır).
