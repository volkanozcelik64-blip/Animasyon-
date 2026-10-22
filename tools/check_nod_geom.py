"""Blender-free geometry check for blender/build_nod.py (numpy stand-ins for bpy/bmesh/mathutils).
Usage: python3 tools/check_nod_geom.py blender/build_nod.py out.png   → prints the Mixamo checks, draws front/side views.
Approximate only (painter-sorted faces); the real check is preview_tpose.py in Blender."""
import sys, types, math, numpy as np
from PIL import Image, ImageDraw

class Vector:
    def __init__(s, v): s.v = np.array(v, float)
    x = property(lambda s: s.v[0]); y = property(lambda s: s.v[1]); z = property(lambda s: s.v[2])
    def __add__(s, o): return Vector(s.v + o.v)
    def __sub__(s, o): return Vector(s.v - o.v)
    def __mul__(s, k): return Vector(s.v * k)
    __rmul__ = __mul__
    def __neg__(s): return Vector(-s.v)
    def __getitem__(s, i): return s.v[i]
    def __iter__(s): return iter(s.v)
    def __len__(s): return 3
    length = property(lambda s: float(np.linalg.norm(s.v)))
    def normalize(s): s.v = s.v / np.linalg.norm(s.v)
    def normalized(s): return Vector(s.v / np.linalg.norm(s.v))
    def cross(s, o): return Vector(np.cross(s.v, o.v))
class Matrix:
    def __init__(s, m): s.m = np.array(m, float)
    @staticmethod
    def Translation(c): m = np.eye(4); m[:3, 3] = list(c); return Matrix(m)
    @staticmethod
    def Identity(n): return Matrix(np.eye(n))
    @staticmethod
    def Diagonal(d): return Matrix(np.diag(list(d)))
    @staticmethod
    def Rotation(a, n, ax):
        c, si = math.cos(a), math.sin(a); m = np.eye(4)
        if ax == 'X': m[1:3, 1:3] = [[c, -si], [si, c]]
        if ax == 'Y': m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, si, -si, c
        if ax == 'Z': m[0:2, 0:2] = [[c, -si], [si, c]]
        return Matrix(m)
    def __matmul__(s, o): return Matrix(s.m @ o.m)
mu = types.ModuleType('mathutils'); mu.Vector, mu.Matrix = Vector, Matrix

class V:
    def __init__(s, co): s.co = np.array(list(co), float)
class BM:
    def __init__(s): s.verts = Verts(s); s.faces = Faces(s); s.edges = []
    def to_mesh(s, me): me.V = np.array([v.co for v in s.verts.l]); me.F = [[s.verts.l.index(v) for v in f] for f in s.faces.l]
    def free(s): pass
class Verts:
    def __init__(s, bm): s.l = []
    def new(s, co): v = V(co); s.l.append(v); return v
    def __iter__(s): return iter(s.l)
    def __getitem__(s, i): return s.l[i]
class Faces:
    def __init__(s, bm): s.l = []
    def new(s, vs): s.l.append(list(vs)); return vs
    def __iter__(s): return iter(s.l)
def uvsphere(bm, u_segments, v_segments, radius):
    top = bm.verts.new((0, 0, radius)); bot = bm.verts.new((0, 0, -radius)); rings = []
    for j in range(1, v_segments):
        t = math.pi * j / v_segments
        rings.append([bm.verts.new((radius * math.sin(t) * math.cos(2 * math.pi * i / u_segments), radius * math.sin(t) * math.sin(2 * math.pi * i / u_segments), radius * math.cos(t))) for i in range(u_segments)])
    for i in range(u_segments):
        bm.faces.new((top, rings[0][i], rings[0][(i + 1) % u_segments])); bm.faces.new((bot, rings[-1][(i + 1) % u_segments], rings[-1][i]))
    for a, b in zip(rings, rings[1:]):
        for i in range(u_segments): bm.faces.new((a[i], a[(i + 1) % u_segments], b[(i + 1) % u_segments], b[i]))
def cube(bm, size):
    h = size / 2; vs = [bm.verts.new((x, y, z)) for x in (-h, h) for y in (-h, h) for z in (-h, h)]
    for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]: bm.faces.new([vs[i] for i in f])
def transform(bm, matrix, verts):
    for v in verts: v.co = (matrix.m @ np.append(v.co, 1))[:3]
bmesh = types.ModuleType('bmesh'); bmesh.new = BM
bmesh.ops = types.SimpleNamespace(create_uvsphere=lambda bm, **k: uvsphere(bm, **k), create_cube=lambda bm, size: cube(bm, size),
    bevel=lambda *a, **k: None, transform=lambda bm, matrix, verts: transform(bm, matrix, verts), recalc_face_normals=lambda *a, **k: None)

class NS(types.SimpleNamespace): pass
class Mat:
    def __init__(s, n):
        s.name = n; s.use_nodes = False; s.diffuse_color = (1, 1, 1, 1)
        inp = {k: NS(default_value=None) for k in ('Base Color', 'Roughness')}
        s.node_tree = NS(nodes={'Principled BSDF': NS(inputs=inp)})
class Mesh:
    def __init__(s, n): s.name = n; s.materials = []; s.polygons = []
OBJS = []
class Obj:
    def __init__(s, n, me): s.name = n; s.data = me; OBJS.append(s)
bpy = types.ModuleType('bpy')
scene = NS(unit_settings=NS(), collection=NS(objects=NS(link=lambda o: None)))
bpy.context = NS(scene=scene)
bpy.ops = NS(wm=NS(read_factory_settings=lambda **k: None))
bpy.data = NS(materials=NS(new=Mat), meshes=NS(new=Mesh), objects=NS(new=Obj))
sys.modules.update(bpy=bpy, bmesh=bmesh, mathutils=mu)

src = open(sys.argv[1]).read()
src = src[:src.index('# ---------- one mesh')]
exec(compile(src, sys.argv[1], 'exec'), {'__file__': sys.argv[1], '__name__': 'nodcheck'})

allv = np.vstack([o.data.V for o in OBJS]); zmin, zmax = allv[:, 2].min(), allv[:, 2].max()
k = 1.80 / (zmax - zmin)
print(f'parts={len(OBJS)}  raw height {zmax - zmin:.3f} m (scale k={k:.3f})  x {allv[:,0].min():.3f}..{allv[:,0].max():.3f}  y {allv[:,1].min():.3f}..{allv[:,1].max():.3f}')
tris = sum(sum(len(f) - 2 for f in o.data.F) for o in OBJS); print('triangles ~', tris)
arms = [o for o in OBJS if o.name.startswith(('Arm', 'Hand'))]
rest = [o for o in OBJS if o not in arms and not o.name.startswith('Head')]
av = np.vstack([o.data.V for o in arms]); rv = np.vstack([o.data.V for o in rest])
band = rv[(rv[:, 2] > 0.85) & (rv[:, 2] < av[:, 2].min())]
print(f'arm underside z={av[:,2].min():.3f}; widest non-arm part just under the arms |x|={np.abs(band[:,0]).max():.3f}; arms reach |x|={np.abs(av[:,0]).max():.3f}')
lv = np.vstack([o.data.V for o in OBJS if o.name.startswith(('Leg', 'Foot'))])
print(f'gap between legs/feet = {2 * lv[lv[:,0] > 0][:,0].min():.3f} m')
eyes = [o for o in OBJS if o.name.startswith('Eye')]
for e in eyes:
    d = np.linalg.norm(e.data.V - np.array([0, 0, 1.47]), axis=1); print(f'{e.name}: dist from head centre {d.min():.3f}..{d.max():.3f} (head r .33)  z {e.data.V[:,2].min():.3f}..{e.data.V[:,2].max():.3f}')

COL = {'Nod_Black': (29, 29, 32), 'Nod_Head': (42, 42, 46), 'Nod_Eye': (251, 251, 244), 'Nod_Scarf': (217, 54, 47), 'Nod_ScarfDark': (163, 36, 32)}
W, H, sc = 900, 560, 280
img = Image.new('RGB', (W, H), (247, 239, 220)); d = ImageDraw.Draw(img)
def draw(ox, view):
    polys = []
    for o in OBJS:
        for f in o.data.F:
            P = o.data.V[f]
            far = P[:, 1].mean() if view == 'front' else -P[:, 0].mean()        # front camera at -Y, side camera at +X
            xy = [(ox + (p[0] if view == 'front' else p[1]) * sc, H - 20 - p[2] * sc) for p in P]
            polys.append((far, xy, COL[o.data.materials[0].name]))
    for _, xy, c in sorted(polys, key=lambda t: -t[0]): d.polygon(xy, fill=c)
draw(260, 'front'); draw(700, 'side')
d.text((230, 6), 'FRONT (-Y)', fill=(0, 0, 0)); d.text((660, 6), 'SIDE (+X, front to the left)', fill=(0, 0, 0))
img.save(sys.argv[2]); print('saved', sys.argv[2])
