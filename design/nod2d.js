// Nod as a flat 2D ink drawing for the design sheets (character sheet, location, storyboard).
// NEW NOD: big round matte-black head, two glowing white eyes (top inner corner cut = determined look),
// no mouth, no brows; thin black stick body and limbs; chunky red knitted scarf with long fringed tails;
// optional dark backpack. Units = cm of the 1.80 m rig, y points DOWN, feet at y = 0.
// nod({...}) returns an SVG <g> string. Limbs: absolute angles [upper, lower] (0 = straight down, +90 = screen right),
// IK target {t:[x,y], bend:±1}, world target {w:[x,y]}, or explicit joints {p:[[ex,ey],[tx,ty]]}.
(function (G) {
  const C = {
    ink: '#111113', body: '#1d1d20', limb: '#2b2b30', head: '#2a2a2e', headShade: '#151517', headLight: '#3b3b41',
    eye: '#fbfbf4', eyeEdge: '#c9c9c2', scarf: '#d9362f', scarfDark: '#a32420', blush: '#f08a8a', sweat: '#8fc3ef',
    cookie: '#c98a4b', choc: '#5a3a22', pack: '#5a544d', packDark: '#403b36', buckle: '#a07a52', white: '#ffffff',
  };
  const OUT = 2.4, D = Math.PI / 180, HR = 33, HY = -147;
  const LIMB_R = 2.7, ARM = [24, 24], LEG = [26, 26];
  let uid = 0;
  const dir = a => [Math.sin(a * D), Math.cos(a * D)];
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const n2 = v => +v.toFixed(2);
  const pt = p => `${n2(p[0])},${n2(p[1])}`;
  const rot = (p, c, a) => { const s = Math.sin(a * D), co = Math.cos(a * D), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };

  function ik(s, t, L1, L2, bend) {
    let dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy) || 1e-3;
    const dm = L1 + L2 - 0.05;
    if (d > dm) { t = [s[0] + dx / d * dm, s[1] + dy / d * dm]; dx = t[0] - s[0]; dy = t[1] - s[1]; d = dm; }
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(L1 * L1 - a * a, 0)), ux = dx / d, uy = dy / d;
    return [[s[0] + ux * a - uy * h * bend, s[1] + uy * a + ux * h * bend], t];
  }
  function limb(s, spec, L, toLocal) {
    let e, t;
    if (Array.isArray(spec)) spec = { a: spec };
    if (spec.w) spec = { t: toLocal(spec.w), bend: spec.bend };
    if (spec.t) [e, t] = ik(s, spec.t, L[0], L[1], spec.bend || 1);
    else if (spec.p) [e, t] = spec.p;
    else { const k = spec.k || [1, 1]; e = add(s, dir(spec.a[0]), L[0] * k[0]); t = add(e, dir(spec.a[1]), L[1] * k[1]); }
    const dx = t[0] - e[0], dy = t[1] - e[1], n = Math.hypot(dx, dy) || 1;
    return { s, e, t, ld: [dx / n, dy / n] };
  }
  // outline pass + fill pass so touching parts merge into one inked silhouette
  const ol = (el, w = OUT) => el.replace('/>', ` fill="${C.ink}" stroke="${C.ink}" stroke-width="${2 * w}" stroke-linejoin="round"/>`);
  const fl = (el, col = C.body) => el.replace('/>', ` fill="${col}"/>`);
  const tube = (l, r, col, w) => `<path d="M${pt(l.s)}L${pt(l.e)}L${pt(l.t)}" fill="none" stroke="${col}" stroke-width="${2 * r + 2 * w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const tubeO = l => tube(l, LIMB_R, C.ink, OUT), tubeF = (l, col = C.body) => tube(l, LIMB_R, col, 0);

  function handEls(l, style, col) {
    const ang = Math.atan2(l.ld[1], l.ld[0]) / D, c = add(l.t, l.ld, 2.5);
    const palm = style === 'open' ? `<ellipse cx="${n2(c[0])}" cy="${n2(c[1])}" rx="5.4" ry="4.2" transform="rotate(${n2(ang)} ${pt(c)})"/>`
      : `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="${style === 'fist' ? 4.4 : 4}"/>`;
    const out = [ol(palm), fl(palm, col)];
    if (style === 'cookie') {
      const k = add(c, l.ld, 5);
      out.push(`<circle cx="${n2(k[0])}" cy="${n2(k[1])}" r="7" fill="${C.cookie}" stroke="${C.ink}" stroke-width="1.8"/>`);
      for (const [dx, dy] of [[-3, -2], [2.5, -3], [0, 2.5], [3.5, 2]]) out.push(`<circle cx="${n2(k[0] + dx)}" cy="${n2(k[1] + dy)}" r="1.1" fill="${C.choc}"/>`);
      out.push(fl(palm, col));
    }
    return out.join('');
  }

  // ---------- face: eyes only ----------
  function proj(fx, yaw) {
    const a0 = Math.asin(Math.max(-1, Math.min(1, fx / HR))), a = a0 + yaw * D;
    return { x: HR * Math.sin(a), sx: Math.cos(a) / Math.cos(a0), vis: Math.cos(a) > 0.12 };
  }
  // lid = [inner, outer]: the eye is cut above the line from the inner to the outer edge (eye-local y)
  const EXPR = {
    happy: { eyes: ['open', 'open'], lid: [[-4, -13], [-4, -13]] },
    joy: { eyes: ['happy', 'happy'], blush: 1, sparkle: 1 },
    surprised: { eyes: ['round', 'round'] },
    thoughtful: { eyes: ['open', 'open'], look: [-2, -2.5], lid: [[0, -6], [-11, -13]] },
    wink: { eyes: ['open', 'wink'], lid: [[-4, -12], [0, 0]] },
    scared: { eyes: ['tiny', 'tiny'], sweat: 1, shake: 1 },
    sneaky: { eyes: ['open', 'open'], look: [2.5, 1], lid: [[1, -2], [1, -2]] },
    relieved: { eyes: ['closed', 'closed'], sweat: 1 },
    hungry: { eyes: ['round', 'round'], look: [2, -2.5] },
    caught: { eyes: ['tiny', 'tiny'], blush: 1 },
    sleepy: { eyes: ['open', 'open'], lid: [[1, 1], [1, 1]] },
    determined: { eyes: ['open', 'open'], look: [1.5, 0], lid: [[0, -11], [0, -11]] },
    sad: { eyes: ['open', 'open'], look: [0, 1.5], lid: [[-12, -2], [-12, -2]] },
  };
  function eye(x, y, sx, kind, look, lid, sd) {
    const g = `transform="translate(${n2(x + look[0] * sx)} ${n2(y + look[1])}) scale(${n2(Math.max(sx, 0.18))} 1)"`;
    const arc = d => `<path d="${d}" fill="none" stroke="${C.eye}" stroke-width="3.6" stroke-linecap="round"/>`;
    if (kind === 'happy') return `<g ${g}>${arc('M-7,4 Q0,-8 7,4')}</g>`;
    if (kind === 'closed') return `<g ${g}>${arc('M-7,-1 Q0,6 7,-1')}</g>`;
    if (kind === 'wink') return `<g ${g}>${arc('M-7,1 Q0,-6 7,1')}</g>`;
    if (kind === 'tiny') return `<g ${g}><circle r="4" fill="${C.eye}"/></g>`;
    const rx = kind === 'round' ? 8.6 : 8, ry = kind === 'round' ? 12.6 : 12, id = 'e' + (++uid);
    const [li, lo] = lid || [-14, -14];
    const clip = `<clipPath id="${id}"><path d="M${-sd * 10},${li} L${sd * 10},${lo} L${sd * 10},15 L${-sd * 10},15 Z"/></clipPath>`;
    return `<g ${g}>${clip}<ellipse rx="${rx}" ry="${ry}" fill="${C.eye}" stroke="${C.eyeEdge}" stroke-width=".8" clip-path="url(#${id})"/></g>`;
  }
  function face(p) {
    const E = Object.assign({ eyes: ['open', 'open'], look: [0, 0] }, EXPR[p.expr] || {}, p.face || {});
    const look = p.look || E.look, yaw = p.yaw;
    let s = '';
    [-1, 1].forEach((sd, i) => {
      const q = proj(sd * 12.5, yaw);
      if (q.vis) s += eye(q.x, HY - 3, q.sx, E.eyes[i], look, E.lid && E.lid[i], sd);
      if (E.blush) { const b = proj(sd * 17, yaw); if (b.vis) s += `<path d="M${n2(b.x - 4)},${HY + 10} l2,-3 M${n2(b.x)},${HY + 10} l2,-3 M${n2(b.x + 4)},${HY + 10} l2,-3" stroke="${C.blush}" stroke-width="1.6" stroke-linecap="round"/>`; }
    });
    if (E.sweat) s += `<path d="M28,${HY - 24} q-6,9 -2,12 q5,2 6,-4 q0,-4 -4,-8z" fill="${C.sweat}" stroke="${C.ink}" stroke-width="1.3"/>`;
    if (E.shake) for (const sd of [-1, 1]) s += `<path d="M${sd * 40},${HY - 12} q${sd * 5},6 0,12 M${sd * 45},${HY - 8} q${sd * 4},5 0,9" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
    if (E.sparkle) for (const [x, y, k] of [[-38, HY - 20, 4], [38, HY - 26, 5], [42, HY + 4, 3]]) s += `<path d="M${x},${y - k}L${x + k * .3},${y - k * .3}L${x + k},${y}L${x + k * .3},${y + k * .3}L${x},${y + k}L${x - k * .3},${y + k * .3}L${x - k},${y}L${x - k * .3},${y - k * .3}Z" fill="#fff6c8" stroke="${C.ink}" stroke-width=".9"/>`;
    return s;
  }
  function headEl() {   // matte black ball: one hard shade step (lit upper-left), thin rim of light
    const id = 'h' + (++uid);
    return ol(`<circle cx="0" cy="${HY}" r="${HR}"/>`) +
      `<clipPath id="${id}"><circle cx="0" cy="${HY}" r="${HR}"/></clipPath><g clip-path="url(#${id})">` +
      `<rect x="-40" y="${HY - 40}" width="80" height="80" fill="${C.headShade}"/><circle cx="-6" cy="${HY - 6}" r="${HR - 1}" fill="${C.head}"/>` +
      `<path d="M-24,${HY - 18} A28,28 0 0 1 -6,${HY - 30}" fill="none" stroke="${C.headLight}" stroke-width="3" stroke-linecap="round"/></g>`;
  }

  // ---------- scarf ----------
  function scarfTail(start, ang, wave, len, w0 = 5.4) {
    const pts = [start]; let a = ang;
    for (let i = 1; i <= 6; i++) { a = ang + wave * Math.sin(i * 1.15); pts.push(add(pts[i - 1], dir(a), len / 6)); }
    const L = [], R = [];
    pts.forEach((q, i) => {
      const nx = i < 6 ? pts[i + 1][0] - q[0] : q[0] - pts[i - 1][0], ny = i < 6 ? pts[i + 1][1] - q[1] : q[1] - pts[i - 1][1], n = Math.hypot(nx, ny) || 1;
      const w = w0 - i * 0.12; L.push([q[0] - ny / n * w, q[1] + nx / n * w]); R.push([q[0] + ny / n * w, q[1] - nx / n * w]);
    });
    const body = `<path d="M${L.map(pt).join('L')}L${R.slice().reverse().map(pt).join('L')}Z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    let st = '';
    for (let i = 1; i < 6; i++) st += `<path d="M${pt(L[i])}L${pt(R[i])}" stroke="${C.scarfDark}" stroke-width="1.1"/>`;   // knit rows
    const end = pts[6], dv = dir(a), pr = [-dv[1], dv[0]];
    let fr = '';
    for (let k = -2; k <= 2; k++) { const b = add(end, pr, k * 2); fr += `<path d="M${pt(b)}l${n2(dv[0] * 5)},${n2(dv[1] * 5)}" stroke="${C.scarfDark}" stroke-width="1.6" stroke-linecap="round"/>`; }
    return fr + body + st;
  }
  function scarfWrap(yaw) {
    let s = `<path d="M-15,-122 Q0,-117 15,-122 Q21,-114 18,-104 Q0,-96 -18,-104 Q-21,-114 -15,-122Z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<path d="M-19,-112.5 Q0,-106 19,-112.5" fill="none" stroke="${C.scarfDark}" stroke-width="1.5"/>`;
    for (let i = -3; i <= 3; i++) {          // chunky knit "v" stitches
      const x = i * 4.6 - ((yaw % 360) / 360) * 4.6, y1 = -117.5, y2 = -107;
      if (Math.abs(x) < 15) s += `<path d="M${n2(x - 1.5)},${n2(y1 - 1.2)} l1.5,2.2 l1.5,-2.2 M${n2(x - 1.5)},${n2(y2 - 1.2)} l1.5,2.2 l1.5,-2.2" fill="none" stroke="${C.scarfDark}" stroke-width="1" stroke-linecap="round"/>`;
    }
    return s;
  }

  // ---------- backpack ----------
  function pack(yaw, part) {
    const c = Math.cos(yaw * D), sn = Math.sin(yaw * D);
    if (part === 'straps' && c > -0.3) {                 // seen from the front / side: shoulder straps
      return [-1, 1].map(sd => { const x = sd * 6 * c; return Math.abs(c) < 0.3 && sd * sn > 0 ? '' :
        `<path d="M${n2(x)},-108 Q${n2(x + sd * 5 * c)},-90 ${n2(x + sd * 2 * c)},-72" fill="none" stroke="${C.packDark}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<rect x="${n2(x + sd * 3 * c - 2)}" y="-92" width="4" height="3" fill="${C.buckle}"/>`; }).join('');
    }
    if (part === 'back' && c > -0.3 && Math.abs(sn) > 0.3) {   // side / 3-4: bag sticks out behind the back
      const x = -Math.sign(sn) * (10 + 6 * Math.abs(sn)), w = 12 + 8 * Math.abs(sn);
      return `<rect x="${n2(x - w / 2)}" y="-108" width="${n2(w)}" height="34" rx="6" fill="${C.pack}" stroke="${C.ink}" stroke-width="2.2"/>` +
        `<path d="M${n2(x - w / 2)},-96 h${n2(w)}" stroke="${C.packDark}" stroke-width="2"/>`;
    }
    if (part === 'front' && c <= -0.3) {                  // back view: the whole bag over the torso
      return `<rect x="-15" y="-112" width="30" height="42" rx="7" fill="${C.pack}" stroke="${C.ink}" stroke-width="2.4"/>` +
        `<path d="M-14,-97 Q0,-92 14,-97 V-110 H-14Z" fill="${C.packDark}" stroke="${C.ink}" stroke-width="1.6"/>` +
        `<rect x="-8" y="-88" width="16" height="11" rx="3" fill="${C.packDark}" stroke="${C.ink}" stroke-width="1.4"/>` +
        `<rect x="-3" y="-99" width="6" height="5" rx="1" fill="${C.buckle}"/>`;
    }
    return '';
  }

  function nod(o) {
    const p = Object.assign({
      x: 0, y: 0, s: 1, flip: false, yaw: 0, expr: 'happy', tilt: 0, headTilt: 0, squash: 1, hipY: -60,
      armA: [-20, -10], armB: [20, 10], legA: [0, 0], legB: [0, 0], handA: 'ball', handB: 'ball', footA: 0, footB: 0,
      tail: 18, wave: 6, tailLen: 40, tail2: true, backpack: false,
    }, o);
    const yaw = p.yaw, c = Math.cos(yaw * D), sn = Math.sin(yaw * D), side = Math.abs(sn) > 0.3;
    const dy = p.hipY + 60, hip = [0, p.hipY];
    const toLocal = w => { const q = rot(w, hip, -p.tilt); return [q[0], q[1] - dy]; };   // world → upper-body frame
    const hipA = [-6.5 * c, p.hipY], hipB = [6.5 * c, p.hipY], shA = [-7 * c, -104], shB = [7 * c, -104];
    // seen from behind, screen left/right swap: mirror angle-posed limbs so arms still hang outward
    const mir = sp => (c < -0.3 && Array.isArray(sp) ? sp.map(a => -a) : sp);
    const lA = limb(hipA, mir(p.legA), LEG, w => w), lB = limb(hipB, mir(p.legB), LEG, w => w);
    const aA = limb(shA, mir(p.armA), ARM, toLocal), aB = limb(shB, mir(p.armB), ARM, toLocal);
    const footEl = (l, ang) => {
      const fw = Math.hypot(6 * c, 10 * sn), fwd = 4 * sn, cx = l.t[0] + fwd, cy = l.t[1] + 4;
      return `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(fw)}" ry="4.2" transform="rotate(${n2(ang)} ${n2(l.t[0])} ${n2(l.t[1])})"/>`;
    };
    const upT = `transform="rotate(${n2(p.tilt)} ${pt(hip)}) translate(0 ${n2(dy)})"`;
    const sqx = 1 + (1 - p.squash) * 0.7;
    let s = `<g transform="translate(${n2(p.x)} ${n2(p.y)}) scale(${n2(p.s * (p.flip ? -1 : 1) * sqx)} ${n2(p.s * p.squash)})">`;
    const back = c < -0.3, farK = side ? (sn > 0 ? 'B' : 'A') : null;
    const knotA = Math.asin(7 / 16) / D + yaw, kx = 16 * Math.sin(Math.min(knotA, 92) * D);
    // scarf tails fly behind everything when they blow backwards
    const tailStart = back ? [-5 * c, -104] : [kx + 1, -103];
    const tails = scarfTail(tailStart, p.tail, p.wave, p.tailLen) + (p.tail2 ? scarfTail(add(tailStart, [-2, 1]), p.tail + 14, p.wave * 1.3, p.tailLen * 0.8, 4.8) : '');
    const tailsBehind = !back && Math.abs(p.tail) > 60;
    if (tailsBehind) s += `<g ${upT}>${tails}</g>`;
    // far limbs (behind the body)
    if (farK) {
      const a = farK === 'B' ? aB : aA, l = farK === 'B' ? lB : lA, fe = footEl(l, farK === 'B' ? p.footB : p.footA);
      s += `<g ${upT}>${tubeO(a)}${tubeF(a)}${handEls(a, farK === 'B' ? p.handB : p.handA, C.body)}</g>`;
      s += tubeO(l) + ol(fe) + tubeF(l) + fl(fe);
    }
    if (p.backpack) s += `<g ${upT}>${pack(yaw, 'back')}</g>`;
    // merged body layer: near legs + feet + thin torso + neck
    const legs = farK ? [farK === 'B' ? [lA, p.footA] : [lB, p.footB]] : [[lA, p.footA], [lB, p.footB]];
    const ac = Math.abs(c), as = Math.abs(sn);
    const torso = `<path d="M${n2(-6.5 * ac - 4 * as)},-110 Q${n2(-10 * ac - 6 * as)},-84 ${n2(-6 * ac - 4 * as)},-58 Q0,-52 ${n2(6 * ac + 4 * as)},-58 Q${n2(10 * ac + 6 * as)},-84 ${n2(6.5 * ac + 4 * as)},-110 Z"/>`;
    const neck = `<rect x="-3" y="-118" width="6" height="12"/>`;
    s += legs.map(([l]) => tubeO(l)).join('') + legs.map(([l, f]) => ol(footEl(l, f))).join('');
    s += `<g ${upT}>${ol(torso)}${ol(neck)}</g>`;
    s += legs.map(([l]) => tubeF(l)).join('') + legs.map(([l, f]) => fl(footEl(l, f), C.limb)).join('');
    s += `<g ${upT}>${fl(torso)}${fl(neck)}`;
    if (p.backpack) s += pack(yaw, 'straps');
    s += `<g transform="rotate(${n2(p.headTilt)} 0 -114)">${headEl()}${face(p)}</g>`;
    s += scarfWrap(yaw);
    if (!tailsBehind) s += tails;
    if (!back && Math.cos(knotA * D) > -0.2) s += `<ellipse cx="${n2(kx)}" cy="-104" rx="${n2(3.6 + 2 * Math.abs(Math.cos(knotA * D)))}" ry="4.8" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2"/>`;
    // near arms: slightly lighter than the body so they read when crossing it
    const near = farK ? [farK === 'B' ? ['A', aA] : ['B', aB]] : [['A', aA], ['B', aB]];
    for (const [k, a] of near) s += tubeO(a) + tubeF(a, C.limb) + handEls(a, k === 'A' ? p.handA : p.handB, C.limb);
    if (p.backpack) s += pack(yaw, 'front');
    s += `</g></g>`;
    return s;
  }

  // Ready-made poses used by the sheets (yaw 0 front, ~40 three-quarter, 80 profile, 180 back)
  const POSES = {
    stand: {},
    wave: { armB: [105, 150], handB: 'open', armA: [-18, -8], tail: 70, wave: 12 },
    think: { armB: { t: [10, -118], bend: 1 }, armA: [-18, -8], handB: 'fist', headTilt: -6 },
    belly: { armB: { t: [4, -80], bend: 1 }, armA: [-20, -10] },
    walk: { tilt: 3, legA: [24, 6], legB: [-18, -32], footB: -22, armA: [-24, -14], armB: [26, 50], tail: -80, wave: 10 },
    tiptoe: { tilt: 10, hipY: -57, legA: { t: [20, -12], bend: -1 }, legB: { t: [-14, -14], bend: -1 }, footA: -32, footB: -38,
      armA: { t: [16, -100], bend: 1 }, armB: { t: [22, -104], bend: 1 }, handA: 'fist', handB: 'fist', tail: 10, wave: 4 },
    scared: { hipY: -55, legA: { t: [-4, -8], bend: 1 }, legB: { t: [4, -8], bend: -1 }, armA: { t: [-26, -128], bend: -1 }, armB: { t: [26, -128], bend: 1 }, tail: -6, tailLen: 22, wave: 2, tail2: false },
    run: { tilt: 16, hipY: -62, legA: [58, -8], legB: [-32, -78], footB: -60, armA: [50, 135], armB: [-55, -20], tail: -100, wave: 12 },
    jump: { tilt: -4, hipY: -62, legA: [55, -25], legB: [30, -40], footA: -20, footB: -30, armA: [-155, -170], armB: [155, 170], handA: 'open', handB: 'open', tail: 160, wave: 14 },
    land: { squash: 0.88, hipY: -50, legA: { t: [-16, -8], bend: 1 }, legB: { t: [16, -8], bend: -1 }, armA: [-80, -110], armB: [80, 110], handA: 'open', handB: 'open', tail: 40, wave: 10 },
    cheer: { armA: [-150, -175], armB: [150, 175], handA: 'fist', handB: 'cookie', legA: [-6, 0], legB: [6, 0], tail: 60, wave: 14 },
    sit: { hipY: -85, legA: { p: [[-6, -79], [-7, -36]] }, legB: { p: [[6, -79], [7, -36]] }, armA: [-20, 30], armB: [20, -30], tail: 8, wave: 3 },
    crawl: { tilt: 72, hipY: -40, legA: { t: [-32, -8], bend: -1 }, legB: { t: [-22, -8], bend: -1 }, footA: -80, footB: -80,
      armA: { w: [62, -8], bend: -1 }, armB: { w: [48, -8], bend: -1 }, headTilt: -62, tail: 90, wave: 6 },
    peek: { tilt: 72, hipY: -40, legA: { t: [-32, -8], bend: -1 }, legB: { t: [-22, -8], bend: -1 }, footA: -80, footB: -80,
      armA: { w: [56, -8], bend: -1 }, armB: { w: [60, -8], bend: -1 }, headTilt: -78, tail: 80, wave: 6 },
    bite: { armB: { t: [6, -128], bend: -1 }, handB: 'cookie', armA: [-20, -10] },
    hike: { backpack: true, armA: { t: [-6, -96], bend: -1 }, armB: { t: [6, -96], bend: 1 }, tail: -70, wave: 12 },
  };
  G.NOD = { nod, POSES, COLORS: C, EXPR, pose: (name, extra) => nod(Object.assign({}, POSES[name], extra)) };
})(typeof window !== 'undefined' ? window : globalThis);
