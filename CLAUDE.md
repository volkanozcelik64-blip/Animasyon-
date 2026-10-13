# Animasyon — project rules

## Karakter (güncel): Nod — React/SVG
- Referans: `assets/karakter-referans.png`. Tek kaynak `src/karakter/` (`Nod.tsx`, ölçü/renk `olculer.ts`); eşyalar `src/esyalar/`.
- Eski karakter ve eski çizim kodu (Blender modeli, `*.html` videolar) KULLANILMAZ.
- Önizleme PNG'leri: `npm run onizleme` → `onizleme/karakter/`. Her değişiklikten sonra PNG'leri açıp referansla karşılaştır.
- **nod-temel** (onaylı temel; git etiketi `nod-temel`): `src/sahneler/NodTemel.tsx` + `video/nod-temel.mp4` (18 sn, 1920×1080, 30 fps).
  Yeni videolar bunun üzerine kurulur: Nod bileşeni, `src/karakter/hareketler.ts` (yürü, adım, otur/kalk, zıpla, giris, fikir, onay, idle)
  ve sahne yapısı (saf `sahneKaresi(kare)` + sıralı zaman çizelgesi). Render: `npm run render:temel`.
- Render'dan önce kritik kareleri `npm run kareler -- <kare,kare,...> <çıktı.png> [x,y,w,h]` ile çıkarıp kontrol et.

## Konuşma balonları (seslendirme YOK)
- Nod konuşmaz; replikler `<Balon />` (`src/karakter/Balon.tsx`) ile gösterilir. Seslendirme/TTS kullanılmaz.
- Stil: beyaz dolgu, kalın siyah kontur, kuyruk ağza doğru; el yazısı, kalın, BÜYÜK HARF yazı (Patrick Hand, `assets/fonts/`, aile `NodYazi`; Remotion'da `Root.tsx` FontFace + delayRender ile yükler).
- Tipler: `normal` (yuvarlak), `bagirma` (dikenli, büyük yazı, titrer), `fisilti` (kesikli kontur, küçük yazı), `dusunce` (bulut, kuyruk yerine küçük daireler).
- Animasyon: yayla "pop" açılış → daktilo yazı → kısa küçülerek kapanış. Her kelime ekranda ≥0,3 sn (`balonSuresi`).
- Balon yazılırken Nod'un ağzı sessizce açılıp kapanır (`sessizAgiz`), baş sallamaları sürer. Balon yüzü kapatmaz; düşünce/fısıltı kuyruğu baş üstüne yönelir. Karanlıkta `karanlik` (siyah dolgu, beyaz kontur).
- Ses efektleri sentezlenir: `npm run sfx` → `assets/sfx/*.wav`; sahne `SESLER` listesiyle `<Sequence><Audio/></Sequence>`.
- Örnek: "1% Battery" `src/sahneler/NodPil.tsx` → `npm run render:pil` → `video/nod-pil.mp4` (35 sn, 1920×1080, 30 fps). Kontrol: `SAHNE=pil npm run kareler -- …`.
- "1% Battery" 5 bölüm: ortak oda `src/sahneler/pil/Oda.tsx`; bölüm 1 `src/sahneler/Sarj1.tsx` → `npm run render:sarj1` → `video/sarj1.mp4`. Telefon: `src/esyalar/ModernTelefon.tsx` (9:19,5; durum çubuğu; ekranda Just Nod kanal sayfası, marka logosu yok).

## Pipeline (current): Mixamo + Blender, flat 2D cartoon look
- Blender runs headless only: `blender -b -P script.py [-- args]` (Ubuntu package, Blender 4.0.2; EEVEE renders via Mesa software EGL).
- `blender/build_nod.py` builds Nod and exports `nod_tpose.fbx`: T-pose, ONE joined mesh (<10k tris, no armature/animation/modifiers/extra objects), exactly 1.80 m, origin at the feet, facing -Y, metres; FBX written Y-up with `bake_space_transform=True` + `FBX_SCALE_UNITS` (no rotation on the FBX model node — otherwise Mixamo shows it huge/off-centre).
- Mixamo is done by hand: upload `nod_tpose.fbx`, auto-rig, download clips into `mixamo/` (see `mixamo/README.md`).
- `blender/toon.py` is the single source of the look; every render script imports it.

## Look
- Toon shader: flat colours with one hard shade step, emitted — no realistic lighting, no speculars, no AO/bloom/SSR.
- Thick black ink outlines (Freestyle): heavy line on body silhouettes, thin line on face/scarf details (Freestyle face marks).
- Orthographic camera only. Cream lined-notebook-paper background (blue rules, red margin). 9:16, 1080×1920, 30 fps.

## Hard rules
1. One continuous set: a single living-room scene file; every shot is a camera on that set, never a separately built room.
2. Consistent characters: Nod (and later Mom/Dad) are built once and reused; never re-model or re-colour per shot.
3. No motion blur — `render.use_motion_blur = False` always; no smear/ghost post effects.
4. Feet locked to the floor: planted feet must not slide or sink; root motion and foot contacts are checked/fixed after retargeting.
5. Smooth transitions: blend between Mixamo clips (NLA cross-fades), never hard-switch actions mid-shot (no pops).
6. Contact sheet check after every render: tile frames into a sheet and look at it before reporting a render as done.
