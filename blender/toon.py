"""Shared flat-2D cartoon look: toon materials, Freestyle ink outlines, notebook-paper backdrop,
orthographic 9:16 camera, 30 fps, no motion blur. Imported by the preview and the final render scripts."""
import bpy, math, os
import numpy as np

W, H, FPS = 1080, 1920, 30
INK = (0.012, 0.011, 0.010, 1)   # linear #1b1a18

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def setup_render(scene, res_scale=100):
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y = W, H
    scene.render.resolution_percentage = res_scale
    scene.render.fps = FPS
    scene.render.use_motion_blur = False                      # rule: no motion blur
    scene.eevee.taa_render_samples = 16
    scene.eevee.use_gtao = False; scene.eevee.use_bloom = False; scene.eevee.use_ssr = False
    scene.eevee.shadow_cube_size = '512'; scene.eevee.use_soft_shadows = False
    scene.view_settings.view_transform = 'Standard'           # exact flat colours, no filmic curve
    scene.view_settings.look = 'None'
    scene.render.film_transparent = False
    if scene.world is None: scene.world = bpy.data.worlds.new('World')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (*srgb('#f7efdc'), 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    # Freestyle ink outlines
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = 'ABSOLUTE'
    scene.render.line_thickness = 2.2 * res_scale / 100
    vl = scene.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    while len(fs.linesets) < 2: fs.linesets.new(f'Ink{len(fs.linesets)}')
    sets = list(fs.linesets)[:2]
    # set 0: thick ink on body silhouettes; set 1: thin ink on face details (Freestyle face marks)
    for ls, px, detail in [(sets[0], float(os.environ.get('INK_OUTER', 15)), False), (sets[1], float(os.environ.get('INK_INNER', 5)), True)]:
        ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
        ls.select_silhouette = ls.select_border = True; ls.select_crease = False
        ls.select_by_face_marks = True; ls.face_mark_condition = 'ONE'
        ls.face_mark_negation = 'INCLUSIVE' if detail else 'EXCLUSIVE'
        if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new(ls.name)
        ls.linestyle.color = INK[:3]; ls.linestyle.thickness = px * res_scale / 100
        ls.linestyle.caps = 'ROUND'; ls.linestyle.chaining = 'PLAIN'
    ls = sets
    return ls

def toon_material(m, base=None, shade=0.82):
    """Flat cel material: one lit tone + one soft grey shade tone (hard step), emitted so there is
    no realistic lighting, specular or falloff."""
    if base is None:
        n = m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
        base = tuple(n.inputs['Base Color'].default_value) if n else tuple(m.diffuse_color)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (shade, shade, shade, 1)
    ramp.color_ramp.elements[1].position = 0.55; ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
    mix.inputs[6].default_value = base
    emit = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(dif.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], mix.inputs[7]); nt.links.new(mix.outputs[2], emit.inputs['Color'])
    nt.links.new(emit.outputs[0], out.inputs['Surface'])
    return m

def key_light(scene):
    sun = bpy.data.lights.new('Key', 'SUN'); sun.energy = 1.0; sun.use_shadow = False
    ob = bpy.data.objects.new('Key', sun); scene.collection.objects.link(ob)
    ob.rotation_euler = (math.radians(55), 0, math.radians(-35))   # from upper-left front → shade lower right
    return ob

def paper_image(name='NotebookPaper', w=W, h=H):
    """Cream lined notebook paper: blue rules, red margin, faint grain (generated, no external files)."""
    img = bpy.data.images.get(name)
    if img: return img
    rng = np.random.default_rng(7)
    px = np.empty((h, w, 4), np.float32); px[...] = (*srgb('#f7efdc'), 1)
    px[..., :3] *= (1 - rng.random((h, w, 1)) * 0.035)
    yy = np.arange(h)[:, None]; xx = np.arange(w)[None, :]
    vign = np.clip(1 - 0.17 * (((xx - w / 2) / (w * .62)) ** 2 + ((yy - h / 2) / (h * .62)) ** 2), 0, 1)
    px[..., :3] *= vign[..., None]
    blue, red = srgb('#5692d6'), srgb('#de544c')
    for i in range(30):                                   # blue rules (image rows are bottom-up)
        y = h - 1 - (150 + i * 62)
        if 0 <= y < h: px[y - 1:y + 2, :, :3] = px[y - 1:y + 2, :, :3] * .45 + np.array(blue) * .55
    for x in (118, 126):
        px[:, x - 1:x + 2, :3] = px[:, x - 1:x + 2, :3] * .25 + np.array(red) * .75
    img = bpy.data.images.new(name, w, h, alpha=False, float_buffer=True)
    img.pixels.foreach_set(px.ravel()); img.pack()
    return img

def paper_backdrop(scene, cam, dist=20.0):
    """Paper plane parented to the orthographic camera, filling the frame exactly, emission only,
    excluded from Freestyle (it lives in its own collection)."""
    col = bpy.data.collections.get('Backdrop') or bpy.data.collections.new('Backdrop')
    if col.name not in scene.collection.children: scene.collection.children.link(col)
    me = bpy.data.meshes.new('Paper')
    s = cam.data.ortho_scale; hw, hh = s / 2 * (W / H if W < H else 1), s / 2 * (1 if W < H else H / W)
    if W < H: hw, hh = s / 2 * W / H, s / 2
    me.from_pydata([(-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0)], [], [(0, 1, 2, 3)])
    me.uv_layers.new(); uv = me.uv_layers[0].data
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]): uv[i].uv = c
    ob = bpy.data.objects.new('Paper', me); col.objects.link(ob)
    ob.parent = cam; ob.location = (0, 0, -dist)
    m = bpy.data.materials.new('Paper'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = paper_image(); tex.interpolation = 'Closest'
    em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs[0], out.inputs['Surface'])
    me.materials.append(m)
    ob.visible_shadow = False
    return ob, col

def ortho_camera(scene, loc, look_at, ortho_scale):
    from mathutils import Vector
    cd = bpy.data.cameras.new('Cam'); cd.type = 'ORTHO'; cd.ortho_scale = ortho_scale; cd.clip_end = 100
    cam = bpy.data.objects.new('Cam', cd); scene.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(look_at) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    return cam

def exclude_from_lines(sets, col):
    for ls in sets: ls.select_by_collection = True; ls.collection = col; ls.collection_negation = 'EXCLUSIVE'

DETAIL_MATS = ('Nod_Eye', 'Nod_ScarfDark')
def mark_details(ob, names=DETAIL_MATS):
    """Freestyle face marks on small face/scarf details so they get thin lines, not the thick body ink."""
    idx = {i for i, m in enumerate(ob.data.materials) if m and m.name.split('.')[0] in names}
    for p in ob.data.polygons: p.use_freestyle_mark = p.material_index in idx
