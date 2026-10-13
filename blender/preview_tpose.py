"""Re-import nod_tpose.fbx (exactly what Mixamo will receive) and render front / 3-quarter / side
checks in the toon look.  Run:  blender -b -P blender/preview_tpose.py -- OUT_DIR"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import toon

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(ROOT, 'onizleme')
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.fbx(filepath=os.path.join(ROOT, 'nod_tpose.fbx'))
nod = [o for o in scene.objects if o.type == 'MESH'][0]
zs = [(nod.matrix_world @ v.co).z for v in nod.data.vertices]; ys = [(nod.matrix_world @ v.co).y for v in nod.data.vertices]
print(f'IMPORTED {nod.name}: z {min(zs):.3f}..{max(zs):.3f}  y {min(ys):.3f}..{max(ys):.3f}  (front should be -Y)')
for m in nod.data.materials: toon.toon_material(m)
toon.mark_details(nod)

ls = toon.setup_render(scene, res_scale=50)
toon.key_light(scene)
for name, ang in [('front', 0), ('threequarter', -35), ('side', -90)]:
    r = 6; a = math.radians(ang)
    loc = (r * math.sin(a), -r * math.cos(a), 1.0)
    for o in list(scene.objects):
        if o.type == 'CAMERA' or o.name.startswith('Paper'): bpy.data.objects.remove(o)
    cam = toon.ortho_camera(scene, loc, (0, 0, 0.95), 3.4)
    paper, col = toon.paper_backdrop(scene, cam, dist=10)
    toon.exclude_from_lines(ls, col)
    scene.render.filepath = os.path.join(out, f'nod3d_{name}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', scene.render.filepath)
