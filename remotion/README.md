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
- `kirpma` (0..1) göz kırpma, `zaman` (kare) pırıltı/zzz/gözyaşı gibi süslerin kendi hareketi.

## Çalıştırma

```bash
cd remotion && npm install
npm run studio                       # önizleme
npm run render                       # out/duygu-testi.mp4 (1080×1920, 30 fps, 10 sn)
npm run galeri                       # out/duygu-galerisi.png (tüm duygular)
```

Bulut ortamında Remotion'un kendi Chrome'unu indirmek yerine:
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

Test videosu (`DuyguTesti`): karakter mutlu yürüyerek girer ve sevinçle zıplar → düşünceli
(çeneye el, düşünce balonu) → ampul yanar → heyecanlı zıplar. Hazır çıktı: `video/duygu-testi.mp4`.

Yazı tipi: Patrick Hand (SIL Open Font License), `public/` içinde.

## PNG kesimleri

`python3 tools/slice-emotions.py` referans görseli `assets/emotions/*.png` olarak şeffaf
arka planla keser (kontur içindeki beyaz dolgu opak kalır).
