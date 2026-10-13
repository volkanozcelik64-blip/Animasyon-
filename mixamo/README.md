# Mixamo clips go here

1. Go to https://www.mixamo.com → Upload Character → `nod_tpose.fbx` (repo root).
2. Auto-rigger markers: chin, wrists, elbows (middle of each arm), knees (middle of each leg), groin (where the legs meet the body).
   Skeleton LOD: **Standard Skeleton (65)** or **No Fingers** (Nod has mitten hands — "No Fingers" is safest).
3. Download clips as **FBX Binary (.fbx)**, **30 fps**, **Keyframe Reduction: none**:
   - first clip **With Skin** (this becomes the rigged Nod),
   - every other clip **Without Skin**.
   - Use **In Place** for loops (walk/run) where Mixamo offers it; the scene script adds travel itself so feet stay locked.
4. Name files by what they are, e.g. `idle.fbx`, `sit_idle.fbx`, `cheer.fbx`, `run.fbx`, `jump.fbx`, `land.fbx`, `crawl.fbx`, `scared.fbx`, `tiptoe.fbx`.
