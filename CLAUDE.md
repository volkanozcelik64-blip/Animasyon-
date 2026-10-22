# Animasyon — project rules

## Pipeline (current): Mixamo + Blender, flat 2D cartoon look
- Blender runs headless only: `blender -b -P script.py [-- args]` (Ubuntu package, Blender 4.0.2; EEVEE renders via Mesa software EGL).
- `blender/build_nod.py` builds Nod and exports `nod_tpose.fbx`: T-pose, ONE joined mesh (<10k tris, no armature/animation/modifiers/extra objects), exactly 1.80 m, origin at the feet, facing -Y, metres; FBX written Y-up with `bake_space_transform=True` + `FBX_SCALE_UNITS` (no rotation on the FBX model node — otherwise Mixamo shows it huge/off-centre).
- Mixamo is done by hand: upload `nod_tpose.fbx`, auto-rig, download clips into `mixamo/` (see `mixamo/README.md`).
- `blender/toon.py` is the single source of the look; every render script imports it.

## Nod's design (current, from the user's reference board)
- Big round matte-black head, two large glowing white eyes (top inner corner cut → determined look), NO mouth, NO brows; emotion = eye shape + scarf.
- Thin black stick body and limbs, small round hands, small shoes. Chunky red knitted scarf (#D9362F) with two long fringed tails that react to motion/emotion.
- Optional dark backpack (journey shots only, not at home).
- Nod is the main character. Reference: `design/character-sheet.png` (2D kit: `design/nod2d.js`).
- `blender/build_nod.py` builds this design, but it has not been run in Blender yet; the committed `nod_tpose.fbx`, `blender/nod_tpose.blend` and `onizleme/nod3d_*.png` are still the OLD white Nod. Run `blender -b -P blender/build_nod.py` then `blender -b -P blender/preview_tpose.py` and check the renders before uploading to Mixamo.

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
