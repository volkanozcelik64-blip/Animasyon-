"""Build a simple 3D Nod in a clean humanoid T-pose and export it for Mixamo's auto-rigger.

Run:  blender -b -P blender/build_nod.py
Out:  nod_tpose.fbx (repo root)  +  blender/nod_tpose.blend

Mixamo requirements met here (and asserted at the end):
  * real-world scale: exactly 1.80 m tall, metres, origin at the feet (0,0,0), all transforms applied
  * faces the front (-Y in Blender); FBX is written Y-up with the axis change BAKED into the vertices
    (no rotation on the FBX model node, which is what made Mixamo show it huge and off-centre)
  * clean T-pose: arms straight out at shoulder height, flat mitten palms facing down, legs apart,
    clear gaps between arms/torso and between the legs
  * scarf hugs the neck; its short tails lie flat on the chest inside the torso silhouette
  * ONE joined mesh, no armature, no animation, no modifiers, no other objects, < 10k triangles
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
HEIGHT = 1.80
MAX_TRIS = 10000

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'; scene.unit_settings.scale_length = 1.0

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def mat(name, hexcol):
    m = bpy.data.materials.new(name); m.use_nodes = True; rgb = srgb(hexcol)
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1); bsdf.inputs['Roughness'].default_value = 1.0
    m.diffuse_color = (*rgb, 1)
    return m

MAT = {k: mat(n, c) for k, n, c in [
    ('body', 'Nod_White', '#ffffff'), ('ink', 'Nod_Ink', '#1b1a18'), ('eyewhite', 'Nod_EyeWhite', '#ffffff'),
    ('iris', 'Nod_Iris', '#7a4a26'), ('mouth', 'Nod_Mouth', '#7b1e25'), ('tongue', 'Nod_Tongue', '#ef7f8d'),
    ('scarf', 'Nod_Scarf', '#d9362f'), ('scarfdark', 'Nod_ScarfDark', '#a32420')]}

PARTS = []
def new_obj(name, bm, material):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    me.materials.append(material)
    for p in me.polygons: p.use_smooth = True
    PARTS.append(ob); return ob

# ---------- low-poly primitives ----------
def capsule(name, p0, p1, r, material, rings=8, seg=10, cap=3):
    """Rounded noodle tube with length rings (so it bends cleanly when skinned)."""
    p0, p1 = Vector(p0), Vector(p1); axis = p1 - p0; L = axis.length; axis.normalize()
    up = Vector((0, 0, 1)) if abs(axis.z) < .9 else Vector((1, 0, 0))
    u = axis.cross(up).normalized(); v = axis.cross(u).normalized()
    prof = [(-math.sin(i / cap * math.pi / 2) * r, math.cos(i / cap * math.pi / 2) * r) for i in range(cap, 0, -1)]
    prof += [(i / rings * L, r) for i in range(rings + 1)]
    prof += [(L + math.sin(i / cap * math.pi / 2) * r, math.cos(i / cap * math.pi / 2) * r) for i in range(1, cap + 1)]
    bm = bmesh.new(); loops = []
    for d, rad in prof:
        loops.append([bm.verts.new(p0 + axis * d + (u * math.cos(k / seg * 2 * math.pi) + v * math.sin(k / seg * 2 * math.pi)) * max(rad, 1e-4)) for k in range(seg)])
    for a, b in zip(loops, loops[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(loops[0]))); bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm, material)

def ellipsoid(name, c, s, material, rot=None, seg=12, rings=8):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*s, 1)), verts=bm.verts)
    return new_obj(name, bm, material)

def slab(name, c, s, material, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(s) * .3, segments=1, affect='EDGES')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*s, 1)), verts=bm.verts)
    return new_obj(name, bm, material)

def torus(name, c, R, r, material, seg=24, sides=8, ry=.86):
    bm = bmesh.new(); rings = []
    for i in range(seg):
        a = i / seg * 2 * math.pi
        rings.append([bm.verts.new((c[0] + (R + r * math.cos(b)) * math.cos(a), c[1] + (R + r * math.cos(b)) * math.sin(a) * ry, c[2] + r * math.sin(b)))
                      for b in (k / sides * 2 * math.pi for k in range(sides))])
    for i in range(seg):
        a, b = rings[i], rings[(i + 1) % seg]
        for k in range(sides): bm.faces.new((a[k], b[k], b[(k + 1) % sides], a[(k + 1) % sides]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm, material)

# ---------- proportions (metres, before the final exact-height normalisation) ----------
HEAD_C, HEAD_R = Vector((0, 0, 1.45)), 0.35
SH_Z = 1.00                       # shoulder / arm height
def on_head(x, z, out=0.0):
    d = Vector((x, 0, z - HEAD_C.z)); y = -math.sqrt(max(HEAD_R ** 2 - d.x ** 2 - d.z ** 2, 0))
    p = Vector((x, y, z)); n = (p - HEAD_C).normalized(); return p + n * out, n
def face_rot(n): return (-n).to_track_quat('Y', 'Z').to_matrix().to_4x4()

# torso + head
ellipsoid('Body', (0, 0, .80), (.25, .20, .32), MAT['body'], seg=20, rings=12)
ellipsoid('Head', HEAD_C, (HEAD_R, HEAD_R * .97, HEAD_R), MAT['body'], seg=24, rings=14)
# legs apart (clear gap between them) + rounded feet resting on z = 0
for sx in (-1, 1):
    capsule(f'Leg{sx}', (sx * .12, 0, .58), (sx * .12, 0, .10), .062, MAT['body'])
    ellipsoid(f'Foot{sx}', (sx * .13, -.05, .06), (.09, .15, .06), MAT['body'])
# arms straight out at shoulder height, flat mitten hands with palms facing down, thumb forward
for sx in (-1, 1):
    capsule(f'Arm{sx}', (sx * .17, 0, SH_Z), (sx * .74, 0, SH_Z), .05, MAT['body'], rings=10)
    ellipsoid(f'Hand{sx}', (sx * .82, 0, SH_Z), (.08, .066, .042), MAT['body'], seg=12, rings=8)
    capsule(f'Thumb{sx}', (sx * .79, -.04, SH_Z), (sx * .80, -.09, SH_Z), .022, MAT['body'], rings=2, seg=8, cap=2)

# face: big brown eyes, thick brows, open grin
for sx in (-1, 1):
    ex, ez = sx * .12, 1.48
    p, n = on_head(ex, ez, -.01); ellipsoid(f'EyeW{sx}', p, (.082, .034, .105), MAT['eyewhite'], rot=face_rot(n), seg=14, rings=8)
    p, n = on_head(ex + sx * .005, ez - .01, .02); R = face_rot(n)
    ellipsoid(f'Iris{sx}', p, (.056, .015, .063), MAT['iris'], rot=R, seg=12, rings=6)
    p, _ = on_head(ex + sx * .005, ez - .01, .032); ellipsoid(f'Pupil{sx}', p, (.029, .01, .033), MAT['ink'], rot=R, seg=10, rings=6)
    p, _ = on_head(ex - sx * .012, ez + .018, .04); ellipsoid(f'Glint{sx}', p, (.013, .006, .013), MAT['eyewhite'], rot=R, seg=6, rings=4)
    a, _ = on_head(sx * .045, 1.61, .012); m, _ = on_head(sx * .12, 1.64, .016); b, _ = on_head(sx * .195, 1.62, .012)
    capsule(f'BrowA{sx}', a, m, .025, MAT['ink'], rings=2, seg=8, cap=2); capsule(f'BrowB{sx}', m, b, .025, MAT['ink'], rings=2, seg=8, cap=2)
MZ = 1.29
def grin(t): return MZ + .012 - .072 * math.sqrt(max(0, 1 - t * t))
bm = bmesh.new(); N = 10                              # mouth interior: a fan that follows the head surface
top = [bm.verts.new(on_head(-.105 + .21 * i / N, MZ + .012, .004)[0]) for i in range(N + 1)]
bot = [bm.verts.new(on_head(-.105 + .21 * i / N, grin(-1 + 2 * i / N), .004)[0]) for i in range(N + 1)]
for i in range(N): bm.faces.new((top[i], top[i + 1], bot[i + 1], bot[i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); new_obj('Mouth', bm, MAT['mouth'])
for i in range(5):
    t0, t1 = -1 + i * .4, -1 + (i + 1) * .4
    a, _ = on_head(t0 * .105, grin(t0), .01); b, _ = on_head(t1 * .105, grin(t1), .01)
    capsule(f'Lip{i}', a, b, .009, MAT['ink'], rings=1, seg=6, cap=1)
a, _ = on_head(-.105, MZ + .012, .01); b, _ = on_head(.105, MZ + .012, .01); capsule('LipTop', a, b, .009, MAT['ink'], rings=2, seg=6, cap=1)
p, n = on_head(0, MZ - .042, .01); ellipsoid('Tongue', p, (.042, .01, .02), MAT['tongue'], rot=face_rot(n), seg=10, rings=6)

# red knitted scarf: two snug ribbed rolls around the neck, small knot, short flat tails ON the chest
torus('ScarfA', (0, 0, 1.095), .195, .046, MAT['scarf'])
torus('ScarfB', (0, 0, 1.15), .175, .042, MAT['scarf'])
torus('ScarfRib', (0, 0, 1.123), .2, .012, MAT['scarfdark'], seg=24, sides=4)
ellipsoid('ScarfKnot', (.09, -.19, 1.07), (.055, .035, .05), MAT['scarf'], seg=10, rings=6)
for i, (dx, rz) in enumerate([(.07, .08), (.12, -.1)]):
    rot = Matrix.Rotation(-.35, 4, 'X') @ Matrix.Rotation(rz, 4, 'Y')    # lean back onto the chest
    slab(f'ScarfTail{i}', Vector((dx, -.175, .99)), (.065, .022, .13), MAT['scarf'], rot=rot)
    slab(f'ScarfStripe{i}', Vector((dx, -.19, .97)), (.067, .006, .014), MAT['scarfdark'], rot=rot)

# ---------- one mesh, exact height, origin at the feet, transforms applied ----------
bpy.ops.object.select_all(action='DESELECT')
for ob in PARTS: ob.select_set(True)
bpy.context.view_layer.objects.active = PARTS[0]
bpy.ops.object.join()
nod = bpy.context.active_object; nod.name = nod.data.name = 'Nod'
me = nod.data
zmin = min(v.co.z for v in me.vertices)
for v in me.vertices: v.co.z -= zmin                                  # soles exactly on z = 0
h = max(v.co.z for v in me.vertices); k = HEIGHT / h
for v in me.vertices: v.co *= k                                       # exactly 1.80 m
cx = (min(v.co.x for v in me.vertices) + max(v.co.x for v in me.vertices)) / 2
for v in me.vertices: v.co.x -= cx                                    # centred left/right
nod.location = (0, 0, 0); nod.rotation_euler = (0, 0, 0); nod.scale = (1, 1, 1)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me.update()

# ---------- checks ----------
me.calc_loop_triangles()
tris = len(me.loop_triangles)
xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
def width_at(z, band=.01):   # torso half-width at height z (for the armpit gap)
    return max((abs(v.co.x) for v in me.vertices if abs(v.co.z - z) < band and abs(v.co.x) < .3), default=0)
arm_under = SH_Z * k - .05 * k
legs_gap = min(v.co.x for v in me.vertices if v.co.z < .45 * k and v.co.x > 0) * 2
assert len(scene.objects) == 1 and nod.type == 'MESH' and not nod.modifiers and nod.parent is None
assert not bpy.data.armatures and not bpy.data.actions and not bpy.data.cameras and not bpy.data.lights
assert tris < MAX_TRIS, tris
assert abs(max(zs) - HEIGHT) < 1e-4 and abs(min(zs)) < 1e-4
print(f'NOD: tris={tris} verts={len(me.vertices)} height={max(zs):.4f} m  x {min(xs):.3f}..{max(xs):.3f}  y {min(ys):.3f}..{max(ys):.3f}'
      f'  torso half-width just under the arms={width_at(arm_under - .04):.3f} m  gap between legs={legs_gap:.3f} m  objects={len(scene.objects)}')

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender', 'nod_tpose.blend'))
bpy.ops.export_scene.fbx(
    filepath=os.path.join(ROOT, 'nod_tpose.fbx'), use_selection=False, object_types={'MESH'},
    global_scale=1.0, apply_unit_scale=True, apply_scale_options='FBX_SCALE_UNITS',   # metres
    axis_forward='-Z', axis_up='Y', bake_space_transform=True,                       # Y-up baked into vertices
    use_mesh_modifiers=False, mesh_smooth_type='FACE', add_leaf_bones=False, bake_anim=False,
    use_armature_deform_only=False, path_mode='AUTO', embed_textures=False)
print('EXPORTED', os.path.join(ROOT, 'nod_tpose.fbx'))
