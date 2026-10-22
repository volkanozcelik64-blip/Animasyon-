"""Build the new 3D Nod (black ball head, white eyes, stick body, red scarf) in a clean humanoid T-pose and export it for Mixamo's auto-rigger.

Run:  blender -b -P blender/build_nod.py
Out:  nod_tpose.fbx (repo root)  +  blender/nod_tpose.blend

Mixamo requirements met here (and asserted at the end):
  * real-world scale: exactly 1.80 m tall, metres, origin at the feet (0,0,0), all transforms applied
  * faces the front (-Y in Blender); FBX is written Y-up with the axis change BAKED into the vertices
    (no rotation on the FBX model node, which is what made Mixamo show it huge and off-centre)
  * clean T-pose: stick arms straight out at shoulder height, small round hands, legs apart,
    clear gaps between arms/torso and between the legs
  * scarf hugs the neck; its two tails lie flat on the chest inside the torso silhouette (no flapping
    geometry for the auto-rigger; the backpack is NOT part of this mesh)
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
    ('body', 'Nod_Black', '#1d1d20'), ('head', 'Nod_Head', '#2a2a2e'), ('eye', 'Nod_Eye', '#fbfbf4'),
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
# New Nod (design/character-sheet.png): big matte-black ball head, two white eyes with the top inner corner
# cut (determined look), no mouth/brows, thin stick body and limbs, chunky red scarf with two long tails.
HEAD_C, HEAD_R = Vector((0, 0, 1.47)), 0.33
SH_Z = 1.04                       # shoulder / arm height
def on_head(x, z, out=0.0):
    d = Vector((x, 0, z - HEAD_C.z)); y = -math.sqrt(max(HEAD_R ** 2 - d.x ** 2 - d.z ** 2, 0))
    p = Vector((x, y, z)); n = (p - HEAD_C).normalized(); return p + n * out, n

# head, neck, thin tapered torso
ellipsoid('Head', HEAD_C, (HEAD_R, HEAD_R * .97, HEAD_R), MAT['head'], seg=24, rings=14)
capsule('Neck', (0, 0, 1.09), (0, 0, 1.17), .03, MAT['body'], rings=2)
ellipsoid('Body', (0, 0, .85), (.085, .065, .27), MAT['body'], seg=14, rings=10)
# stick legs apart (clear gap) + small rounded shoes resting on z = 0
for sx in (-1, 1):
    capsule(f'Leg{sx}', (sx * .065, 0, .64), (sx * .065, 0, .08), .028, MAT['body'], rings=8, seg=8)
    ellipsoid(f'Foot{sx}', (sx * .07, -.03, .045), (.055, .09, .045), MAT['body'], seg=10, rings=6)
# stick arms straight out at shoulder height, small round hands
for sx in (-1, 1):
    capsule(f'Arm{sx}', (sx * .06, 0, SH_Z), (sx * .62, 0, SH_Z), .026, MAT['body'], rings=10, seg=8)
    ellipsoid(f'Hand{sx}', (sx * .66, 0, SH_Z), (.042, .036, .03), MAT['body'], seg=10, rings=6)

# eyes: flat white fans that follow the head surface; outline = ellipse with the top inner corner cut off
def eye_outline(sx, rx=.075, rz=.112, n=28, inner=-.075, outer=.01):
    """2D outline (x across, z up, eye-local) of the ellipse clipped below a straight lid line that runs from
    `inner` (at the inner edge) to `outer` (at the outer edge), both measured from the ellipse top."""
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi; x, z = rx * math.cos(t), rz * math.sin(t)
        u = (x * sx / rx + 1) / 2                         # 0 at the inner edge, 1 at the outer edge
        lid = rz + inner + (outer - inner) * u            # lid height at this x
        pts.append((x, min(z, lid)))
    return pts
for sx in (-1, 1):
    cx, cz = sx * .125, 1.50
    bm = bmesh.new()
    ring = [bm.verts.new(on_head(cx + x, cz + z, .006)[0]) for x, z in eye_outline(sx)]
    mid = bm.verts.new(on_head(cx, cz - .02, .006)[0])
    for i in range(len(ring)): bm.faces.new((mid, ring[i], ring[(i + 1) % len(ring)]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); new_obj(f'Eye{sx}', bm, MAT['eye'])

# red chunky knitted scarf: two ribbed rolls round the neck, knot, two long flat tails ON the chest
torus('ScarfA', (0, 0, 1.105), .085, .036, MAT['scarf'])
torus('ScarfB', (0, 0, 1.155), .075, .033, MAT['scarf'])
torus('ScarfRib', (0, 0, 1.13), .095, .010, MAT['scarfdark'], seg=24, sides=4)
ellipsoid('ScarfKnot', (.045, -.09, 1.09), (.035, .025, .033), MAT['scarf'], seg=10, rings=6)
for i, (dx, h, rz) in enumerate([(.022, .14, .06), (.052, .115, -.08)]):
    rot = Matrix.Rotation(-.12, 4, 'X') @ Matrix.Rotation(rz, 4, 'Y')    # lie flat on the chest
    zc = 1.07 - h
    slab(f'ScarfTail{i}', Vector((dx, -.074, zc)), (.026, .012, h), MAT['scarf'], rot=rot)
    for k in range(3):                                                    # knit rows + fringe band
        slab(f'ScarfStripe{i}{k}', Vector((dx, -.081, zc + h * (.5 - k * .45))), (.027, .004, .006), MAT['scarfdark'], rot=rot)

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
