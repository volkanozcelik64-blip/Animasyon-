// The ONE living-room set, drawn flat in ink on the notebook paper (walls = the paper itself).
// Room units are centimetres, y DOWN, wall/floor line at y = 0, floor runs forward to y ≈ 140.
// Every storyboard panel is an orthographic crop of this same drawing (CLAUDE.md rule 1).
// Nod is kid-scale on the set: the 1.80 m rig is shown at NOD_SCALE (≈ 1.08 m).
(function (G) {
  const K = {
    ink: '#1b1a18', paper: '#f7efdc', rule: '#5692d6', margin: '#de544c',
    red: '#c8202a', charcoal: '#2d2b2c', brown: '#7a5a44', beige: '#c9b8a4', slate: '#4a5d70',
    slateLt: '#6a7f94', wood: '#a87b55', woodDk: '#6b4a33', floor: '#d9b48a', rug: '#b5483e', rugLt: '#e0a36b',
    sky: '#24314d', moon: '#f6e7a8', lamp: '#ffd36b', yellow: '#f2c230', green: '#5f8f5a', hall: '#3a4658', hallLit: '#f3d99a',
  };
  const NOD_SCALE = 0.6, W = 1000, TOP = -300, BOT = 160;
  const o = (d, fill, w = 2.4, extra = '') => `<path d="${d}" fill="${fill}" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const r = (x, y, w, h, fill, sw = 2.4, rx = 2, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${K.ink}" stroke-width="${sw}" ${extra}/>`;
  const line = (d, col = K.ink, w = 1.4, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;

  // where a thing standing at floor depth z (cm from the wall) touches the floor in the picture
  const floorY = z => z * 0.45;

  const parts = {
    floor() {
      let s = `<rect x="-200" y="0" width="${W + 400}" height="${BOT + 60}" fill="${K.floor}" opacity=".45"/>`;
      for (let y = 14; y < BOT + 40; y += 16 + y * 0.08) s += line(`M-200,${y.toFixed(1)}H${W + 200}`, K.woodDk, 0.9, 'opacity=".45"');
      for (let i = 0; i < 40; i++) { const y = 14 + (i % 6) * 22, x = (i * 137) % W; s += line(`M${x},${y}v${(14 + y * .06).toFixed(1)}`, K.woodDk, 0.8, 'opacity=".35"'); }
      s += `<rect x="-200" y="-8" width="${W + 400}" height="8" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/>`;
      return s;
    },
    door({ lit }) {
      let s = r(32, -222, 106, 222, K.wood, 2.6, 1);
      s += `<rect x="42" y="-212" width="86" height="212" fill="${lit ? K.hallLit : K.hall}" stroke="${K.ink}" stroke-width="2"/>`;
      if (!lit) s += line('M48,-200 L60,-190 M48,-170 L54,-165', '#6d7a90', 1.2);
      return s;
    },
    switch() { return r(150, -128, 12, 18, '#fff', 1.6, 2) + `<rect x="154" y="-123" width="4" height="8" rx="1" fill="${K.ink}"/>`; },
    shadow() {   // the coat rack's lamp shadow: a horned monster on the wall
      return `<path d="M150,-12 C146,-70 150,-120 172,-150 C160,-176 168,-205 178,-214 C186,-196 190,-186 198,-180 C210,-190 228,-192 240,-182 C248,-190 256,-204 266,-214 C272,-196 270,-174 260,-160 C280,-130 290,-90 282,-40 L300,-30 L286,-20 L292,-6 L276,-14 L268,-2 L262,-16 C230,-8 190,-6 170,-12 L160,0 L156,-14 L144,-4 Z"
        fill="#3b2f5c" opacity=".55"/>` +
        `<ellipse cx="200" cy="-158" rx="7" ry="4" fill="#f6e7a8" opacity=".9"/><ellipse cx="236" cy="-158" rx="7" ry="4" fill="#f6e7a8" opacity=".9"/>`;
    },
    rack({ coat = true }) {
      const y0 = floorY(18);
      let s = o(`M286,${y0} L314,${y0} M300,${y0} V-176`, 'none', 3.4);
      s += o(`M300,-170 l-16,-6 M300,-170 l16,-6 M300,-150 l-14,-4 M300,-150 l14,-4`, 'none', 2.6);
      s += o(`M286,${y0} l-10,6 M314,${y0} l10,6 M300,${y0} v7`, 'none', 3);
      if (coat) {
        s += o('M300,-172 l-22,0 q-4,-14 22,-20 q26,6 22,20 z', K.brown);                  // Dad's hat
        s += o('M274,-172 h52 q4,0 2,4 h-56 q-2,-4 2,-4z', K.woodDk, 2);
        s += o('M288,-150 q-14,4 -18,30 l-6,70 q14,6 36,4 q22,2 36,-4 l-6,-70 q-4,-26 -18,-30 z', K.slate); // Dad's coat
        s += line('M300,-150 v96', K.ink, 1.6) + `<circle cx="304" cy="-120" r="1.8" fill="${K.ink}"/><circle cx="304" cy="-96" r="1.8" fill="${K.ink}"/>`;
        s += line('M282,-150 l18,22 l18,-22', K.ink, 1.6);
      }
      return s;
    },
    lamp({ on = true }) {
      const y0 = floorY(22);
      let s = '';
      if (on) s += `<path d="M335,-150 L270,${y0} L410,${y0} Z" fill="url(#lampGlow)" opacity=".55"/>`;
      s += o(`M340,${y0} h28 M354,${y0} V-150`, 'none', 3.2);
      s += o('M332,-150 h44 l-8,-34 h-28 z', on ? '#fbe3a2' : K.beige);
      return s;
    },
    window({ night }) {
      let s = r(414, -238, 152, 128, '#fff', 3, 2);
      s += `<rect x="422" y="-230" width="136" height="112" fill="${night ? K.sky : '#bfe0f2'}"/>`;
      if (night) {
        s += `<circle cx="528" cy="-204" r="12" fill="${K.moon}"/><circle cx="534" cy="-208" r="10" fill="${K.sky}"/>`;
        for (const [x, y] of [[440, -214], [470, -196], [500, -222], [452, -150], [540, -160], [488, -170]]) s += `<path d="M${x},${y - 3}l1,2 2,1 -2,1 -1,2 -1,-2 -2,-1 2,-1z" fill="#fff"/>`;
        s += `<path d="M422,-140 q30,-22 60,-6 q30,-18 76,2 V-118 H422z" fill="#1a2238"/>`;
      } else s += `<circle cx="530" cy="-200" r="12" fill="#fff6c8"/>`;
      s += line('M490,-230 V-118 M422,-174 H558', K.ink, 3);
      s += o('M398,-246 q14,70 4,140 h24 q-6,-70 0,-140 z', K.beige) + o('M582,-246 q-14,70 -4,140 h-24 q6,-70 0,-140 z', K.beige);
      s += o('M392,-248 H588', 'none', 4);
      return s;
    },
    picture() {   // Nod's own drawing, framed
      let s = r(616, -206, 64, 52, K.wood, 2.4, 1) + `<rect x="622" y="-200" width="52" height="40" fill="#fff"/>`;
      s += `<circle cx="648" cy="-186" r="7" fill="none" stroke="${K.ink}" stroke-width="1.4"/><path d="M641,-178 h14" stroke="${K.red}" stroke-width="3"/>`;
      s += line('M648,-176 v8 M648,-170 l-6,6 M648,-170 l6,6 M630,-166 l6,-12 l6,12', K.ink, 1.2);
      return s;
    },
    clock() {
      let s = `<circle cx="720" cy="-232" r="19" fill="#fff" stroke="${K.ink}" stroke-width="3"/>`;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += line(`M${720 + Math.sin(a) * 14},${-232 - Math.cos(a) * 14}l${(Math.sin(a) * 3).toFixed(2)},${(-Math.cos(a) * 3).toFixed(2)}`, K.ink, 1.2); }
      s += line('M720,-232 l-2,-10', K.ink, 2.4) + line('M720,-232 l-3,-14', K.ink, 1.4);   // 11:58
      return s;
    },
    sofa() {
      const y0 = floorY(36);
      let s = '';
      s += o(`M392,${y0 - 70} q0,-30 30,-32 h156 q30,2 30,32 v40 h-216 z`, K.slate);                          // back
      s += o(`M396,${y0 - 34} h208 v26 h-208 z`, K.slate);                                                   // base
      s += o(`M404,${y0 - 50} q0,-6 6,-6 h86 q6,0 6,6 v16 h-98 z`, K.slateLt) + o(`M498,${y0 - 50} q0,-6 6,-6 h86 q6,0 6,6 v16 h-98 z`, K.slateLt);
      s += o(`M376,${y0 - 64} q0,-12 14,-12 q16,0 16,12 v58 h-30 z`, K.slate) + o(`M594,${y0 - 64} q0,-12 16,-12 q14,0 14,12 v58 h-30 z`, K.slate);
      s += o(`M552,${y0 - 86} q16,-8 30,2 q4,18 -4,30 q-14,6 -28,-2 q-6,-14 2,-30 z`, K.red);                 // throw pillow
      s += r(384, y0 - 8, 8, 8, K.woodDk, 1.6, 1) + r(608, y0 - 8, 8, 8, K.woodDk, 1.6, 1);
      return s;
    },
    rug() {
      let s = `<ellipse cx="500" cy="84" rx="210" ry="40" fill="${K.rug}" stroke="${K.ink}" stroke-width="2.4"/>`;
      s += `<ellipse cx="500" cy="84" rx="180" ry="30" fill="none" stroke="${K.rugLt}" stroke-width="3" stroke-dasharray="10 7"/>`;
      s += `<ellipse cx="500" cy="84" rx="120" ry="18" fill="none" stroke="${K.rugLt}" stroke-width="2"/>`;
      return s;
    },
    table() {
      const y0 = floorY(150);
      let s = r(422, y0 - 44, 8, 44, K.woodDk, 2, 1) + r(570, y0 - 44, 8, 44, K.woodDk, 2, 1);
      s += r(434, y0 - 40, 6, 32, K.woodDk, 1.6, 1) + r(560, y0 - 40, 6, 32, K.woodDk, 1.6, 1);
      s += o(`M412,${y0 - 52} h176 l6,10 h-188 z`, K.wood) + r(406, y0 - 42, 188, 7, K.woodDk, 2, 1);
      s += o(`M452,${y0 - 52} q0,-14 18,-14 q18,0 18,14 z`, '#fff') + `<path d="M458,${y0 - 60} q4,-6 8,-2 q4,-6 9,0 q4,-4 6,2" fill="#fff6c8" stroke="${K.ink}" stroke-width="1.2"/>`; // popcorn
      s += r(530, y0 - 64, 14, 13, '#fff', 2, 2) + o(`M544,${y0 - 61} q7,0 7,5 q0,5 -7,4`, 'none', 2);          // mug
      s += r(500, y0 - 56, 20, 4, K.charcoal, 1.4, 1);                                                    // remote
      return s;
    },
    duck() {
      const x = 648, y = 92;
      return o(`M${x - 10},${y} q-2,-10 8,-11 q-2,-10 8,-10 q9,0 8,9 l6,1 l-5,3 q8,6 1,9 z`, K.yellow, 2) + `<circle cx="${x + 6}" cy="${y - 17}" r="1.4" fill="${K.ink}"/>`;
    },
    armchair() {
      const y0 = floorY(62);
      let s = o(`M676,${y0 - 92} q0,-22 22,-22 h56 q22,0 22,22 v62 h-100 z`, K.brown);
      s += o(`M670,${y0 - 40} h112 v30 h-112 z`, K.brown) + o(`M684,${y0 - 52} h84 v14 h-84 z`, '#9a7258');
      s += o(`M660,${y0 - 66} q0,-12 14,-12 q14,0 14,12 v58 h-28 z`, K.brown) + o(`M764,${y0 - 66} q0,-12 14,-12 q14,0 14,12 v58 h-28 z`, K.brown);
      s += r(668, y0 - 8, 7, 8, K.woodDk, 1.6, 1) + r(778, y0 - 8, 7, 8, K.woodDk, 1.6, 1);
      return s;
    },
    shelf({ jar = true }) {
      const y0 = floorY(6), x0 = 798, w = 96, top = -196;
      let s = r(x0, top, w, y0 - top, K.wood, 2.6, 1);
      const books = [[K.red, 12], [K.slate, 9], [K.yellow, 11], [K.green, 10], [K.beige, 8], [K.brown, 12], [K.slateLt, 10]];
      for (let k = 0; k < 4; k++) {
        const sy = top + 10 + k * 50; s += `<rect x="${x0 + 6}" y="${sy}" width="${w - 12}" height="42" fill="${K.woodDk}" opacity=".85"/>`;
        let bx = x0 + 9;
        for (let i = 0; i < 6; i++) { const [c, bw] = books[(i + k * 3) % books.length], bh = 30 + ((i * 7 + k * 5) % 11); if (bx + bw > x0 + w - 8) break; s += r(bx, sy + 42 - bh, bw, bh, c, 1.4, 1); bx += bw + 1.5; }
        s += line(`M${x0 + 4},${sy + 42}H${x0 + w - 4}`, K.ink, 2.4);
      }
      if (jar) {
        s += `<path d="M826,${top} v-34 q0,-6 6,-6 h28 q6,0 6,6 v34 z" fill="#e8f2f4" opacity=".9" stroke="${K.ink}" stroke-width="2.4"/>`;
        for (const [x, y] of [[836, -204], [852, -206], [844, -216], [834, -226], [855, -222]]) s += `<circle cx="${x}" cy="${y}" r="6" fill="#c98a4b" stroke="${K.ink}" stroke-width="1.2"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#5a3a22"/>`;
        s += r(828, -248, 36, 9, K.red, 2.2, 3) + r(841, -253, 10, 5, K.red, 1.8, 2);
        s += r(832, -208, 28, 10, '#fff', 1.2, 1) + `<text x="846" y="-200.5" font-family="Inter" font-weight="700" font-size="5.2" text-anchor="middle" fill="${K.ink}">KURABİYE</text>`;
      }
      return s;
    },
    plant() {
      const y0 = floorY(14);
      let s = o('M928,-100 q-20,-40 -6,-70 q14,22 12,64 M936,-100 q4,-50 26,-74 q10,40 -16,74 M944,-100 q24,-26 44,-24 q-14,26 -38,30', K.green, 2.2);
      s += o(`M922,${y0} l-6,-${y0 + 100} h44 l-6,${y0 + 100} z`, K.red);
      return s;
    },
    parents() {  // Mom & Dad are not designed yet — backlit silhouettes only, same body language as Nod
      const fig = (x, s, hat) => `<g transform="translate(${x} 0) scale(${s})" fill="${K.charcoal}">
        <circle cx="0" cy="-150" r="30"/><ellipse cx="0" cy="-88" rx="24" ry="34"/>
        <path d="M-10,-60 L-12,0 M10,-60 L12,0" stroke="${K.charcoal}" stroke-width="12" stroke-linecap="round"/>
        <path d="M-18,-108 L-36,-84 L-16,-70 M18,-108 L36,-84 L16,-70" fill="none" stroke="${K.charcoal}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        ${hat ? '' : '<path d="M-26,-160 q-14,30 -4,56 q4,-30 30,-40 z"/>'}</g>`;
      return fig(62, .9, true) + fig(110, .84, false);
    },
  };

  // opts: night (default true), lampOn, lit (hall light), jar, coat, shadow, front: names drawn after the characters
  function room(opts = {}) {
    const op = Object.assign({ night: true, lampOn: true, lit: false, jar: true, coat: true, shadow: true, parents: false, front: [] }, opts);
    const order = ['floor', 'door', 'switch', 'shadow', 'window', 'picture', 'clock', 'shelf', 'rug', 'rack', 'lamp', 'sofa', 'armchair', 'plant', 'duck', 'table'];
    let bg = '', fg = '';
    for (const k of order) {
      if (k === 'shadow' && !(op.shadow && op.night && op.lampOn && op.coat)) continue;
      if (k === 'duck' && op.duck === false) continue;
      let s = parts[k](op);
      if (k === 'door' && op.parents) s += parts.parents();
      if (op.front.includes(k)) fg += s; else bg += s;
    }
    return { bg, fg };
  }
  const defs = `<radialGradient id="lampGlow" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="${K.lamp}" stop-opacity=".9"/><stop offset="1" stop-color="${K.lamp}" stop-opacity="0"/></radialGradient>
    <radialGradient id="tvGlow" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#8fd0ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fd0ff" stop-opacity="0"/></radialGradient>`;

  // notebook paper is parented to the camera, so it is drawn in FRAME space (rules/margin don't move with the set)
  function paper(w, h, id) {
    let s = `<rect width="${w}" height="${h}" fill="${K.paper}"/>`;
    const step = h / 31;
    for (let y = step * 2.4; y < h; y += step) s += `<path d="M0,${y.toFixed(1)}H${w}" stroke="${K.rule}" stroke-width="${(h / 1100).toFixed(2)}" opacity=".55"/>`;
    s += `<path d="M${(w * .109).toFixed(1)},0V${h}M${(w * .117).toFixed(1)},0V${h}" stroke="${K.margin}" stroke-width="${(h / 1000).toFixed(2)}" opacity=".75"/>`;
    return s;
  }

  // Any orthographic crop of the set: cam {x0, y0, w, h} in room units → pxW × pxH picture.
  function view(cam, pxW, pxH, opts = {}, chars = '', overlay = '', frame = true) {
    const k = pxW / cam.w, R = room(opts), id = 'c' + (++view.n);
    const T = `transform="scale(${k}) translate(${-cam.x0} ${-cam.y0})"`;
    let s = `<svg viewBox="0 0 ${pxW} ${pxH}" width="${pxW}" height="${pxH}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}<clipPath id="${id}"><rect width="${pxW}" height="${pxH}"/></clipPath></defs><g clip-path="url(#${id})">`;
    s += paper(pxW, pxH);
    s += `<g ${T}>${R.bg}${opts.tv ? '<ellipse cx="490" cy="40" rx="220" ry="160" fill="url(#tvGlow)"/>' : ''}${chars}${R.fg}</g>`;
    if (opts.night !== false) s += `<rect width="${pxW}" height="${pxH}" fill="#1d2a55" opacity=".2" style="mix-blend-mode:multiply"/>`;
    s += `<g ${T}>${overlay}</g></g>`;
    if (frame) s += `<rect x="1" y="1" width="${pxW - 2}" height="${pxH - 2}" fill="none" stroke="${K.ink}" stroke-width="2"/>`;
    return s + '</svg>';
  }
  view.n = 0;
  // A storyboard shot: 9:16 crop centred on (cx, cy), w room units wide (camera ortho scale = w * 16/9 tall).
  const shot = (cam, opts, chars = '', overlay = '', pxW = 300) => {
    const h = cam.w * 16 / 9;
    return view({ x0: cam.cx - cam.w / 2, y0: cam.cy - h / 2, w: cam.w, h }, pxW, Math.round(pxW * 16 / 9), opts, chars, overlay);
  };
  // Nod placed on the set: x = room x of the feet, z = floor depth
  const nodAt = (x, z, o = {}) => NOD.nod(Object.assign({}, o, { x, y: floorY(z) + (o.lift || 0), s: NOD_SCALE * (o.zoom || 1) }));
  const nodPose = (pose, x, z, o = {}) => nodAt(x, z, Object.assign({}, NOD.POSES[pose], o));

  G.ROOM = { K, parts, room, shot, view, paper, defs, floorY, nodAt, nodPose, NOD_SCALE, W, TOP, BOT };
})(typeof window !== 'undefined' ? window : globalThis);
