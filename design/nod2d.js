// Nod as a flat 2D ink drawing for the design sheets (character sheet, location, storyboard).
// Proportions copy blender/build_nod.py: units are centimetres of the 1.80 m model, y points DOWN, feet at y = 0.
// nod({...}) returns an SVG <g> string. Poses: limbs by absolute angles [upper, lower] (0 = straight down,
// +90 = screen right), by IK target {t:[x,y], bend:±1}, by world target {w:[x,y]}, or explicit joints {p:[[ex,ey],[tx,ty]]}.
(function (G) {
  const C = {
    ink: '#1b1a18', white: '#ffffff', iris: '#7a4a26', mouth: '#7b1e25', tongue: '#ef7f8d',
    scarf: '#d9362f', scarfDark: '#a32420', blush: '#f5a3a3', sweat: '#8fc3ef', cookie: '#c98a4b', choc: '#5a3a22',
  };
  const OUT = 3.0, THIN = 1.4, D = Math.PI / 180;
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
  function limb(s, spec, L1, L2, toLocal) {
    let e, t;
    if (Array.isArray(spec)) spec = { a: spec };
    if (spec.w) spec = { t: toLocal(spec.w), bend: spec.bend };
    if (spec.t) [e, t] = ik(s, spec.t, L1, L2, spec.bend || 1);
    else if (spec.p) [e, t] = spec.p;
    else { const k = spec.k || [1, 1]; e = add(s, dir(spec.a[0]), L1 * k[0]); t = add(e, dir(spec.a[1]), L2 * k[1]); }
    const dx = t[0] - e[0], dy = t[1] - e[1], n = Math.hypot(dx, dy) || 1;
    return { s, e, t, ld: [dx / n, dy / n] };
  }
  // outline pass + fill pass so touching parts merge into one inked silhouette
  const ol = (el, w = OUT) => el.replace('/>', ` fill="${C.ink}" stroke="${C.ink}" stroke-width="${2 * w}" stroke-linejoin="round"/>`);
  const fl = (el, col = C.white) => el.replace('/>', ` fill="${col}"/>`);
  const tubeO = (l, r, cap) => `<path d="M${pt(l.s)}L${pt(l.e)}L${pt(l.t)}" fill="none" stroke="${C.ink}" stroke-width="${2 * r + 2 * OUT}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const tubeF = (l, r, cap) => `<path d="M${pt(l.s)}L${pt(l.e)}L${pt(l.t)}" fill="none" stroke="${C.white}" stroke-width="${2 * r}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;

  function handEls(l, style, mirror) {
    const ang = Math.atan2(l.ld[1], l.ld[0]) / D, c = add(l.t, l.ld, 5), out = [];
    if (style === 'fist') { const e = `<circle cx="${n2(c[0])}" cy="${n2(c[1])}" r="7"/>`; return [[ol(e)], [fl(e)]]; }
    const pr = [-l.ld[1] * mirror, l.ld[0] * mirror], th = add(add(c, pr, 5.5), l.ld, -1.5);
    const thumb = `<ellipse cx="${n2(th[0])}" cy="${n2(th[1])}" rx="3.6" ry="2.6" transform="rotate(${n2(ang - 50 * mirror)} ${pt(th)})"/>`;
    const palm = `<ellipse cx="${n2(c[0])}" cy="${n2(c[1])}" rx="${style === 'open' ? 9 : 8}" ry="${style === 'open' ? 7.4 : 6.6}" transform="rotate(${n2(ang)} ${pt(c)})"/>`;
    out.push(ol(thumb), fl(thumb), ol(palm), fl(palm));
    if (style === 'cookie') {
      const k = add(c, l.ld, 6);
      out.push(`<circle cx="${n2(k[0])}" cy="${n2(k[1])}" r="7.5" fill="${C.cookie}" stroke="${C.ink}" stroke-width="2"/>`);
      for (const [dx, dy] of [[-3, -2], [2.5, -3], [0, 2.5], [3.5, 2]]) out.push(`<circle cx="${n2(k[0] + dx)}" cy="${n2(k[1] + dy)}" r="1.2" fill="${C.choc}"/>`);
      out.push(fl(palm));       // fingers wrap over the cookie
    }
    return [[], out];
  }

  // ---------- face ----------
  const HR = 35;
  function proj(fx, yaw) {
    const a0 = Math.asin(Math.max(-1, Math.min(1, fx / HR))), a = a0 + yaw * D;
    return { x: HR * Math.sin(a), sx: Math.cos(a) / Math.cos(a0), vis: Math.cos(a) > 0.1 };
  }
  const EXPR = {
    happy: { eyes: ['open', 'open'], mouth: 'grin' },
    joy: { eyes: ['happy', 'happy'], brows: [[-3, -4, -2], [-3, -4, -2]], mouth: 'bigGrin', blush: 1 },
    surprised: { eyes: ['wide', 'wide'], brows: [[-7, -9, -6], [-7, -9, -6]], mouth: 'O' },
    thoughtful: { eyes: ['open', 'open'], look: [-2.6, -3.6], brows: [[-1, -2, -1], [-7, -9, -6]], mouth: 'side' },
    wink: { eyes: ['open', 'wink'], brows: [[-3, -4, -3], [3, 2, 3]], mouth: 'smirk', blush: 1 },
    scared: { eyes: ['tiny', 'tiny'], brows: [[-10, -6, 0], [-10, -6, 0]], mouth: 'wobble', sweat: 1, shake: 1 },
    sneaky: { eyes: ['half', 'half'], look: [3, 0.5], brows: [[3, 1, -2], [3, 1, -2]], mouth: 'tight' },
    relieved: { eyes: ['closed', 'closed'], brows: [[-5, -3, 0], [-5, -3, 0]], mouth: 'smile', sweat: 1 },
    hungry: { eyes: ['open', 'open'], look: [3, -1.5], brows: [[-5, -4, -1], [-5, -4, -1]], mouth: 'O', drool: 1 },
    caught: { eyes: ['tiny', 'tiny'], brows: [[-9, -10, -8], [-9, -10, -8]], mouth: 'chomp', blush: 1 },
    sleepy: { eyes: ['half', 'half'], brows: [[1, 1, 1], [1, 1, 1]], mouth: 'smile' },
    determined: { eyes: ['open', 'open'], look: [2, 0], brows: [[5, 1, -3], [5, 1, -3]], mouth: 'smirk' },
  };

  function eye(x, y, sx, kind, look) {
    const g = `transform="translate(${n2(x)} ${n2(y)}) scale(${n2(Math.max(sx, 0.2))} 1)"`, id = 'e' + (++uid);
    const line = (d, w = 2.6) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
    if (kind === 'happy') return `<g ${g}>${line('M-7.5,3 Q0,-8 7.5,3', 3)}</g>`;
    if (kind === 'closed') return `<g ${g}>${line('M-7.5,-1 Q0,6 7.5,-1', 3)}</g>`;
    if (kind === 'wink') return `<g ${g}>${line('M-7.5,1 Q0,-5 7.5,1', 3)}${line('M6,-1 L9.5,-4', 2)}${line('M6.5,2 L10,2', 2)}</g>`;
    const big = kind === 'wide' || kind === 'tiny', rx = big ? 8.8 : 8.2, ry = big ? 11.4 : 10.5;
    let s = `<g ${g}><clipPath id="${id}"><ellipse rx="${rx}" ry="${ry}"/></clipPath>`;
    s += `<ellipse rx="${rx}" ry="${ry}" fill="${C.white}" stroke="${C.ink}" stroke-width="${THIN}"/>`;
    s += `<g clip-path="url(#${id})">`;
    const [lx, ly] = look;
    if (kind === 'tiny') s += `<ellipse cx="${lx}" cy="${ly}" rx="2.6" ry="3.2" fill="${C.ink}"/>`;
    else {
      const ir = kind === 'wide' ? 0.8 : 1;
      s += `<ellipse cx="${lx}" cy="${ly + 1}" rx="${5.6 * ir}" ry="${6.3 * ir}" fill="${C.iris}"/>`;
      s += `<ellipse cx="${lx}" cy="${ly + 1}" rx="${3 * ir}" ry="${3.4 * ir}" fill="${C.ink}"/>`;
      s += `<circle cx="${lx - 1.8}" cy="${ly - 1.6}" r="1.5" fill="${C.white}"/>`;
    }
    if (kind === 'half') s += `<rect x="-10" y="-13" width="20" height="11" fill="${C.white}"/>`;
    s += `</g>`;
    if (kind === 'half') s += line('M-8.6,-2 L8.6,-2', 2.4);
    return s + `</g>`;
  }
  function mouth(x, sx, kind) {
    const g = `transform="translate(${n2(x)} 0) scale(${n2(Math.max(sx, 0.45))} 1)"`, id = 'm' + (++uid);
    const line = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const open = (d, ty) => `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${C.mouth}"/>` +
      `<ellipse cx="0" cy="${ty}" rx="6" ry="3.4" fill="${C.tongue}" clip-path="url(#${id})"/>` +
      `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    let s;
    switch (kind) {
      case 'grin': s = open('M-10.5,-130 H10.5 A10.5,8 0 0 1 -10.5,-130 Z', -121.5); break;
      case 'bigGrin': s = open('M-13,-131 Q0,-128 13,-131 A13,11 0 0 1 -13,-131 Z', -120.5); break;
      case 'O': s = open('M0,-131 a4.6,5.8 0 1 0 0.01,0 Z', -121.5); break;
      case 'chomp': s = open('M-7,-129 Q0,-133 7,-129 Q8,-121 0,-120 Q-8,-121 -7,-129 Z', -120) +
        `<path d="M2,-130 a6,6 0 1 1 9,7 l-3,-2 l-2,3 l-2,-3 z" fill="${C.cookie}" stroke="${C.ink}" stroke-width="1.6"/>`; break;
      case 'smile': s = line('M-9,-130 Q0,-121 9,-130'); break;
      case 'smirk': s = line('M-8,-127 Q1,-123 9,-131'); break;
      case 'side': s = line('M-3,-126 Q3,-125 8,-128'); break;
      case 'wobble': s = line('M-10,-126 l2.5,-2.5 l2.5,2.5 l2.5,-2.5 l2.5,2.5 l2.5,-2.5 l2.5,2.5 l2.5,-2.5 l2.5,2.5'); break;
      case 'tight': s = line('M-6,-127 Q0,-125.5 6,-127'); break;
      default: s = line('M-6,-127 H6');
    }
    return `<g ${g}>${s}</g>`;
  }
  function face(p) {
    const E = Object.assign({ eyes: ['open', 'open'], brows: [[0, 0, 0], [0, 0, 0]], look: [0, 0], mouth: 'grin' }, EXPR[p.expr] || {}, p.face || {});
    const look = p.look || E.look, yaw = p.yaw;
    let s = '';
    [-1, 1].forEach((sd, i) => {
      if (E.blush) { const q = proj(sd * 21, yaw); if (q.vis) s += `<ellipse cx="${n2(q.x)}" cy="-134" rx="${n2(6 * q.sx)}" ry="3.4" fill="${C.blush}" opacity=".85"/>`; }
    });
    [-1, 1].forEach((sd, i) => {
      const q = proj(sd * 12, yaw);
      if (q.vis) s += eye(q.x, -148, q.sx, E.eyes[i], look);
      const bp = [4.5, 12, 19.5].map((fx, k) => { const r = proj(sd * fx, yaw); return r.vis ? [r.x, [-161, -164, -162][k] + E.brows[i][k]] : null; }).filter(Boolean);
      if (bp.length === 3) s += `<path d="M${pt(bp[0])}Q${pt([2 * bp[1][0] - (bp[0][0] + bp[2][0]) / 2, 2 * bp[1][1] - (bp[0][1] + bp[2][1]) / 2])} ${pt(bp[2])}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
      else if (bp.length === 2) s += `<path d="M${pt(bp[0])}L${pt(bp[1])}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
    });
    const m = proj(0, yaw);
    if (Math.cos(yaw * D) > -0.05) s += mouth(Math.min(m.x, 29), m.sx, E.mouth);
    if (E.drool) { const q = proj(4, yaw); s += `<path d="M${n2(q.x)},-125 q-2,6 0,8 q2,-2 0,-8z" fill="${C.sweat}" stroke="${C.ink}" stroke-width="1"/>`; }
    if (E.sweat) s += `<path d="M30,-172 q-6,9 -2,12 q5,2 6,-4 q0,-4 -4,-8z" fill="${C.sweat}" stroke="${C.ink}" stroke-width="1.4"/>`;
    if (E.shake) for (const sd of [-1, 1]) s += `<path d="M${sd * 42},-160 q${sd * 5},6 0,12 M${sd * 47},-156 q${sd * 4},5 0,9" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
    return s;
  }

  // ---------- scarf ----------
  function scarfTail(start, ang, wave, len) {
    const pts = [start]; let a = ang;
    for (let i = 1; i <= 5; i++) { a = ang + wave * Math.sin(i * 1.3); pts.push(add(pts[i - 1], dir(a), len / 5)); }
    const L = [], R = [];
    pts.forEach((q, i) => {
      const nx = i < 5 ? pts[i + 1][0] - q[0] : q[0] - pts[i - 1][0], ny = i < 5 ? pts[i + 1][1] - q[1] : q[1] - pts[i - 1][1], n = Math.hypot(nx, ny) || 1;
      const w = 4.2 - i * 0.12; L.push([q[0] - ny / n * w, q[1] + nx / n * w]); R.push([q[0] + ny / n * w, q[1] - nx / n * w]);
    });
    const body = `<path d="M${L.map(pt).join('L')}L${R.slice().reverse().map(pt).join('L')}Z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const st = (i) => `<path d="M${pt(L[i])}L${pt(R[i])}" stroke="${C.scarfDark}" stroke-width="2"/>`;
    const end = pts[5], dv = dir(a), pr = [-dv[1], dv[0]];
    let fr = '';
    for (let k = -2; k <= 2; k++) { const b = add(end, pr, k * 1.8); fr += `<path d="M${pt(b)}l${n2(dv[0] * 4)},${n2(dv[1] * 4)}" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/>`; }
    return fr + body + st(2) + st(4);
  }
  function scarfWrap(yaw) {
    let s = `<path d="M-21,-120 Q0,-114 21,-120 Q26,-113 23,-105 Q0,-96 -23,-105 Q-26,-113 -21,-120Z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<path d="M-23,-111.5 Q0,-104 23,-111.5" fill="none" stroke="${C.scarfDark}" stroke-width="1.6"/>`;
    for (let i = -4; i <= 4; i++) {          // knit "v" stitches
      const x = i * 4.6 - ((yaw % 360) / 360) * 4.6, y1 = -116 + Math.abs(x) * 0.03, y2 = -106 + Math.abs(x) * 0.05;
      if (Math.abs(x) < 20) s += `<path d="M${n2(x - 1.4)},${n2(y1 - 1.2)} l1.4,2 l1.4,-2 M${n2(x - 1.4)},${n2(y2 - 1.2)} l1.4,2 l1.4,-2" fill="none" stroke="${C.scarfDark}" stroke-width="1" stroke-linecap="round"/>`;
    }
    return s;
  }

  function nod(o) {
    const p = Object.assign({
      x: 0, y: 0, s: 1, flip: false, yaw: 0, expr: 'happy', tilt: 0, headTilt: 0, squash: 1, hipY: -58,
      armA: [-24, -12], armB: [24, 12], legA: [0, 0], legB: [0, 0], handA: 'mitten', handB: 'mitten', footA: 0, footB: 0,
      tail: 6, wave: 0, tailLen: 26, frontArms: null,
    }, o);
    const yaw = p.yaw, c = Math.cos(yaw * D), sn = Math.sin(yaw * D), side = Math.abs(sn) > 0.3;
    const dy = p.hipY + 58, hip = [0, p.hipY];
    const toLocal = w => { const q = rot(w, hip, -p.tilt); return [q[0], q[1] - dy]; };   // world → upper-body frame
    const hipA = [-12 * c, p.hipY], hipB = [12 * c, p.hipY], shA = [-17 * c, -100], shB = [17 * c, -100];
    const lA = limb(hipA, p.legA, 24, 24, w => w), lB = limb(hipB, p.legB, 24, 24, w => w);
    const toUp = w => toLocal(w);
    const aA = limb(shA, p.armA, 26, 26, toUp), aB = limb(shB, p.armB, 26, 26, toUp);
    const footEl = (l, ang) => {
      const fw = Math.hypot(9 * c, 15 * sn), fwd = 6 * sn, cx = l.t[0] + fwd, cy = l.t[1] + 4;
      return `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(fw)}" ry="6" transform="rotate(${n2(ang)} ${n2(l.t[0])} ${n2(l.t[1])})"/>`;
    };
    const upT = `transform="rotate(${n2(p.tilt)} ${pt(hip)}) translate(0 ${n2(dy)})"`;
    const sqx = 1 + (1 - p.squash) * 0.7;
    let s = `<g transform="translate(${n2(p.x)} ${n2(p.y)}) scale(${n2(p.s * (p.flip ? -1 : 1) * sqx)} ${n2(p.s * p.squash)})">`;
    const back = c < -0.3;
    const farArm = side ? (sn > 0 ? 'B' : 'A') : null;
    // far limbs (behind the body)
    if (farArm) {
      const a = farArm === 'B' ? aB : aA, h = handEls(a, farArm === 'B' ? p.handB : p.handA, farArm === 'B' ? 1 : -1);
      s += `<g ${upT}>${tubeO(a, 5, 'round')}${h[0].join('')}${tubeF(a, 5, 'round')}${h[1].join('')}</g>`;
      const l = farArm === 'B' ? lB : lA, fe = footEl(l, farArm === 'B' ? p.footB : p.footA);
      s += tubeO(l, 6.2, 'round') + ol(fe) + tubeF(l, 6.2, 'round') + fl(fe);
    }
    // merged body layer: near legs + feet + torso + shoulder balls
    const legs = farArm ? [farArm === 'B' ? [lA, p.footA] : [lB, p.footB]] : [[lA, p.footA], [lB, p.footB]];
    const torso = `<ellipse cx="0" cy="-80" rx="${n2(Math.hypot(25 * c, 20 * sn))}" ry="32"/>`;
    const balls = (farArm ? [farArm === 'B' ? shA : shB] : [shA, shB]).map(q => `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="5.5"/>`);
    s += legs.map(([l]) => tubeO(l, 6.2, 'round')).join('') + legs.map(([l, f]) => ol(footEl(l, f))).join('');
    s += `<g ${upT}>${ol(torso)}${balls.map(b => ol(b)).join('')}</g>`;
    s += legs.map(([l]) => tubeF(l, 6.2, 'round')).join('') + legs.map(([l, f]) => fl(footEl(l, f))).join('');
    s += `<g ${upT}>${fl(torso)}${balls.map(b => fl(b)).join('')}`;
    // head (+ scarf, face)
    const knotA = Math.asin(9 / 22) / D + yaw, knotVis = Math.cos(knotA * D) > -0.2 && !back;
    const kx = 22 * Math.sin(Math.min(knotA, 92) * D);
    s += `<g transform="rotate(${n2(p.headTilt)} 0 -112)">${ol('<circle cx="0" cy="-145" r="35"/>')}${fl('<circle cx="0" cy="-145" r="35"/>')}${face(p)}</g>`;
    s += scarfWrap(yaw);
    if (knotVis) {
      s += scarfTail([kx + 1, -101], p.tail, p.wave, p.tailLen);
      s += `<ellipse cx="${n2(kx)}" cy="-104" rx="${n2(4 + 2 * Math.abs(Math.cos(knotA * D)))}" ry="5.4" fill="${C.scarf}" stroke="${C.ink}" stroke-width="2.2"/>`;
    } else if (back) s += scarfTail([-6 * c, -103], p.tail, p.wave, p.tailLen);
    // near arms
    const near = farArm ? [farArm === 'B' ? ['A', aA] : ['B', aB]] : [['A', aA], ['B', aB]];
    for (const [k, a] of near) {
      const h = handEls(a, k === 'A' ? p.handA : p.handB, k === 'B' ? 1 : -1);
      s += tubeO(a, 5, 'butt') + h[0].join('') + tubeF(a, 5, 'butt') + h[1].join('');
    }
    s += `</g></g>`;
    return s;
  }

  // Ready-made poses used by the sheets (yaw 0 front, ~40 three-quarter, 80 profile, 180 back)
  const POSES = {
    stand: {},
    wave: { armB: [112, 158], handB: 'open', armA: [-22, -8] },
    think: { armB: { t: [12, -116], bend: 1 }, armA: [-22, -8], handB: 'fist', headTilt: -6 },
    belly: { armB: { t: [6, -76], bend: 1 }, armA: [-24, -12] },
    walk: { tilt: 3, legA: [24, 6], legB: [-18, -32], footB: -22, armA: [-24, -14], armB: [26, 50] },
    tiptoe: { tilt: 10, hipY: -55, legA: { t: [20, -14], bend: -1 }, legB: { t: [-14, -16], bend: -1 }, footA: -32, footB: -38,
      armA: { t: [24, -98], bend: 1 }, armB: { t: [30, -104], bend: 1 }, handA: 'fist', handB: 'fist' },
    scared: { hipY: -53, legA: { t: [-5, -10], bend: 1 }, legB: { t: [5, -10], bend: -1 }, armA: { t: [-30, -124], bend: -1 }, armB: { t: [30, -124], bend: 1 }, tail: -10, tailLen: 16 },
    run: { tilt: 16, hipY: -60, legA: [58, -8], legB: [-32, -78], footB: -60, armA: [50, 135], armB: [-55, -20], tail: -100, wave: 12 },
    jump: { tilt: -4, hipY: -60, legA: [55, -25], legB: [30, -40], footA: -20, footB: -30, armA: [-155, -170], armB: [155, 170], handA: 'open', handB: 'open', tail: 160, wave: 15 },
    land: { squash: 0.88, hipY: -50, legA: { t: [-16, -10], bend: 1 }, legB: { t: [16, -10], bend: -1 }, armA: [-80, -110], armB: [80, 110], handA: 'open', handB: 'open', tail: 40, wave: 10 },
    cheer: { armA: [-150, -175], armB: [150, 175], handA: 'fist', handB: 'cookie', legA: [-6, 0], legB: [6, 0] },
    sit: { hipY: -85, legA: { p: [[-13, -79], [-14, -40]] }, legB: { p: [[13, -79], [14, -40]] }, armA: [-20, 40], armB: [20, -40] },
    crawl: { tilt: 72, hipY: -40, legA: { t: [-30, -10], bend: -1 }, legB: { t: [-20, -10], bend: -1 }, footA: -80, footB: -80,
      armA: { w: [62, -10], bend: -1 }, armB: { w: [48, -10], bend: -1 }, headTilt: -62, tail: 80 },
    peek: { tilt: 72, hipY: -40, legA: { t: [-30, -10], bend: -1 }, legB: { t: [-20, -10], bend: -1 }, footA: -80, footB: -80,
      armA: { w: [56, -10], bend: -1 }, armB: { w: [60, -10], bend: -1 }, headTilt: -78, tail: 70 },
    bite: { armB: { t: [6, -118], bend: -1 }, handB: 'cookie', armA: [-24, -12] },
  };
  G.NOD = { nod, POSES, COLORS: C, EXPR, pose: (name, extra) => nod(Object.assign({}, POSES[name], extra)) };
})(typeof window !== 'undefined' ? window : globalThis);
