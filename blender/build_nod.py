"""Build a simple 3D Nod in a humanoid T-pose and export it for Mixamo's auto-rigger.

Run:  blender -b -P blender/build_nod.py
Out:  nod_tpose.fbx  (repo root)  +  blender/nod_tpose.blend

Conventions (what Mixamo expects): one joined mesh, feet on z=0, facing -Y (front),
arms straight out along X, transforms applied, metres, ~1.8 m tall.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# ---------- scene reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ---------- materials (flat base colours; the toon look is applied at render time) ----------
def mat(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = 1.0
    m.diffuse_color = (*rgb, 1)
    return m

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

MAT = {
    'body': mat('Nod_White', srgb('#ffffff')),
    'ink': mat('Nod_Ink', srgb('#1b1a18')),
    'eyewhite': mat('Nod_EyeWhite', srgb('#ffffff')),
    'iris': mat('Nod_Iris', srgb('#7a4a26')),
    'scarf': mat('Nod_Scarf', srgb('#d9362f')),
    'scarfdark': mat('Nod_ScarfDark', srgb('#a32420')),
    'mouth': mat('Nod_Mouth', srgb('#7b1e25')),
}

PARTS = []

def new_obj(name, bm, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    me.materials.append(material)
    for p in me.polygons: p.use_smooth = True
    PARTS.append(ob)
    return ob

# ---------- primitives ----------
def capsule(name, p0, p1, r, material, rings=14, seg=20, cap=6, r1=None):
    """Rounded tube from p0 to p1 (noodle limb) with hemispherical caps and many length rings
    so it bends smoothly when skinned."""
    r1 = r if r1 is None else r1
    p0, p1 = Vector(p0), Vector(p1)
    axis = (p1 - p0); L = axis.length; axis.normalize()
    up = Vector((0, 0, 1)) if abs(axis.z) < .9 else Vector((1, 0, 0))
    u = axis.cross(up).normalized(); v = axis.cross(u).normalized()
    bm = bmesh.new(); profile = []
    for i in range(cap, 0, -1):                       # bottom cap
        a = (i / cap) * (math.pi / 2); profile.append((-math.sin(a) * r, math.cos(a) * r))
    for i in range(rings + 1):                          # body
        t = i / rings; profile.append((t * L, r + (r1 - r) * t))
    for i in range(1, cap + 1):                         # top cap
        a = (i / cap) * (math.pi / 2); profile.append((L + math.sin(a) * r1, math.cos(a) * r1))
    loops = []
    for d, rad in profile:
        ring = []
        for k in range(seg):
            a = k / seg * 2 * math.pi
            ring.append(bm.verts.new(p0 + axis * d + (u * math.cos(a) + v * math.sin(a)) * max(rad, 1e-4)))
        loops.append(ring)
    for a, b in zip(loops, loops[1:]):
        for k in range(seg):
            bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(loops[0]))); bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm, material)

def ellipsoid(name, c, s, material, rot=None, seg=32, rings=20):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    M = Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*s, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return new_obj(name, bm, material)

def box(name, c, s, material, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(s) * .35, segments=3, affect='EDGES')
    M = Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*s, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return new_obj(name, bm, material)

def torus(name, c, R, r, material, sz=1.0, seg=48, sides=14):
    bm = bmesh.new(); rings = []
    for i in range(seg):
        a = i / seg * 2 * math.pi; ring = []
        for k in range(sides):
            b = k / sides * 2 * math.pi
            ring.append(bm.verts.new((c[0] + (R + r * math.cos(b)) * math.cos(a), c[1] + (R + r * math.cos(b)) * math.sin(a) * .88, c[2] + r * math.sin(b) * sz)))
        rings.append(ring)
    for i in range(seg):
        a, b = rings[i], rings[(i + 1) % seg]
        for k in range(sides):
            bm.faces.new((a[k], b[k], b[(k + 1) % sides], a[(k + 1) % sides]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm, material)

def on_head(x, z, out=0.0):
    """Point on the head surface (front, -Y) at given x/z, pushed out along the normal."""
    d = Vector((x, 0, z - HEAD_C.z)); y = -math.sqrt(max(HEAD_R ** 2 - d.x ** 2 - d.z ** 2, 0))
    p = Vector((x, y, z)); n = (p - HEAD_C).normalized()
    return p + n * out, n

def face_rot(n):
    """Rotation whose local -Y points along the surface normal n (so flat discs face outward)."""
    return (-n).to_track_quat('Y', 'Z').to_matrix().to_4x4()

# ---------- proportions (metres) ----------
HEAD_C, HEAD_R = Vector((0, 0, 1.47)), 0.36
SHOULDER_Z, ARM_R, HAND_X = 1.02, 0.055, 0.90

# body: white egg
ellipsoid('Body', (0, 0, .83), (.27, .21, .34), MAT['body'])
# head: big round white head
ellipsoid('Head', HEAD_C, (HEAD_R, HEAD_R * .97, HEAD_R * .97), MAT['body'], seg=48, rings=32)
# noodle legs + rounded feet
for sx in (-1, 1):
    capsule(f'Leg_{"L" if sx > 0 else "R"}', (sx * .1, 0, .6), (sx * .1, 0, .1), .066, MAT['body'], rings=16)
    ellipsoid(f'Foot_{"L" if sx > 0 else "R"}', (sx * .11, -.06, .065), (.105, .165, .07), MAT['body'])
# noodle arms straight out (T-pose) + mitten hands with a thumb nub
for sx in (-1, 1):
    side = 'L' if sx > 0 else 'R'
    capsule(f'Arm_{side}', (sx * .2, 0, SHOULDER_Z), (sx * (HAND_X - .08), 0, SHOULDER_Z), ARM_R, MAT['body'], rings=20)
    ellipsoid(f'Hand_{side}', (sx * HAND_X, 0, SHOULDER_Z), (.09, .075, .085), MAT['body'])
    capsule(f'Thumb_{side}', (sx * (HAND_X - .03), -.05, SHOULDER_Z + .02), (sx * (HAND_X - .01), -.1, SHOULDER_Z + .05), .028, MAT['body'], rings=4, seg=12)

# eyes: big white ovals, brown iris, black pupil, white highlight
for sx in (-1, 1):
    side = 'L' if sx > 0 else 'R'
    ex, ez = sx * .125, 1.49
    p, n = on_head(ex, ez, -.01); R = face_rot(n)
    ellipsoid(f'EyeWhite_{side}', p, (.085, .035, .11), MAT['eyewhite'], rot=R)
    p2, n2 = on_head(ex + sx * .005, ez - .01, .022); R2 = face_rot(n2)
    ellipsoid(f'Iris_{side}', p2, (.058, .016, .066), MAT['iris'], rot=R2)
    p3, _ = on_head(ex + sx * .005, ez - .01, .034)
    ellipsoid(f'Pupil_{side}', p3, (.03, .01, .034), MAT['ink'], rot=R2)
    p4, _ = on_head(ex - sx * .012, ez + .018, .042)
    ellipsoid(f'Glint_{side}', p4, (.013, .006, .013), MAT['eyewhite'], rot=R2)
    # thick dark eyebrows (slightly arched, inner end lower)
    a, _ = on_head(sx * .05, 1.625, .012); b, _ = on_head(sx * .2, 1.635, .012); m, _ = on_head(sx * .125, 1.655, .016)
    capsule(f'Brow_{side}a', a, m, .026, MAT['ink'], rings=4, seg=12)
    capsule(f'Brow_{side}b', m, b, .026, MAT['ink'], rings=4, seg=12)

# mouth: open happy "D" smile (dark red) on the lower face
MZ = 1.30                                            # open grin: flat top lip, round bottom
def grin(t): return MZ + .012 - .075 * math.sqrt(max(0, 1 - t * t))
for i in range(12):                                  # dark red mouth interior, built as wedge strips
    t = -1 + (i + .5) / 6
    top, _ = on_head(t * .11, MZ + .012, .002); bot, _ = on_head(t * .11, grin(t), .002)
    if (top - bot).length > .01: capsule(f'MouthFill_{i}', top, bot, .011, MAT['mouth'], rings=2, seg=10)
for i in range(12):                                  # ink rim: top line + curved bottom
    t0, t1 = -1 + i / 6, -1 + (i + 1) / 6
    a, _ = on_head(t0 * .11, grin(t0), .012); b, _ = on_head(t1 * .11, grin(t1), .012)
    capsule(f'Smile_{i}', a, b, .009, MAT['ink'], rings=2, seg=10)
a, _ = on_head(-.11, MZ + .012, .012); b, _ = on_head(.11, MZ + .012, .012)
capsule('SmileTop', a, b, .009, MAT['ink'], rings=6, seg=10)
tp, tn = on_head(0, MZ - .04, .008)
ellipsoid('Tongue', tp, (.045, .012, .022), mat('Nod_Tongue', srgb('#ef7f8d')), rot=face_rot(tn))

# red knitted scarf: chunky ribbed neck band + two tails with fringe, knot at front right
for k in range(3):                                   # three stacked rolls read as knit ribs
    torus(f'Scarf_{k}', (0, 0, 1.105 + k * .045), .205, .042, MAT['scarf'], sz=.9)
for i, (dx, rz, ln) in enumerate([(.1, .1, .3), (.17, -.08, .26)]):
    top = Vector((dx, -.21, 1.09)); rot = Matrix.Rotation(rz, 4, 'Y')
    c = top + rot @ Vector((0, 0, -ln / 2))
    box(f'ScarfTail_{i}', c, (.09, .035, ln), MAT['scarf'], rot=rot)
    for s in range(3):                               # knit stripes across the tail
        cz = top + rot @ Vector((0, -.02, -ln * (s + 1) / 4))
        box(f'ScarfRib_{i}_{s}', cz, (.094, .006, .012), MAT['scarfdark'], rot=rot)
    end = top + rot @ Vector((0, 0, -ln))
    for f in range(4):                               # fringe
        fx = (f - 1.5) * .022
        a = end + rot @ Vector((fx, 0, 0)); b = end + rot @ Vector((fx, 0, -.05))
        capsule(f'Fringe_{i}_{f}', a, b, .007, MAT['scarfdark'], rings=2, seg=8)
ellipsoid('ScarfKnot', (.13, -.215, 1.11), (.07, .05, .06), MAT['scarf'])

# ---------- join into one mesh, clean up, apply transforms ----------
bpy.ops.object.select_all(action='DESELECT')
for ob in PARTS: ob.select_set(True)
bpy.context.view_layer.objects.active = PARTS[0]
bpy.ops.object.join()
nod = bpy.context.active_object; nod.name = nod.data.name = 'Nod'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')       # origin at world 0 (between the feet)

h = max(v.co.z for v in nod.data.vertices); w = max(v.co.x for v in nod.data.vertices) * 2
print(f'NOD: verts={len(nod.data.vertices)} faces={len(nod.data.polygons)} height={h:.3f} m armspan={w:.3f} m materials={[m.name for m in nod.data.materials]}')

os.makedirs(os.path.join(ROOT, 'blender'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender', 'nod_tpose.blend'))
bpy.ops.export_scene.fbx(filepath=os.path.join(ROOT, 'nod_tpose.fbx'), use_selection=False, object_types={'MESH'},
                         apply_unit_scale=True, apply_scale_options='FBX_SCALE_ALL', axis_forward='-Z', axis_up='Y',
                         mesh_smooth_type='FACE', add_leaf_bones=False, path_mode='COPY', embed_textures=False)
print('EXPORTED', os.path.join(ROOT, 'nod_tpose.fbx'))
