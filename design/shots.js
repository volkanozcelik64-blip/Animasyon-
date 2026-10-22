// "Midnight Snack" — the shot list. Single source for the storyboard AND the camera frames on the location sheet.
// cam = 9:16 orthographic crop of the one living-room set (centre cx, cy and width w in room cm).
(function (G) {
  const { nodPose, K, parts, floorY } = ROOM;
  const sfx = (x, y, t, size = 22, rot = -8, col = '#fff') => `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Inter Display, Inter" font-weight="900" font-style="italic" font-size="${size}" fill="${col}" stroke="${K.ink}" stroke-width="${size / 7}" paint-order="stroke" text-anchor="middle">${t}</text>`;
  const arrow = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="${K.red}" stroke-width="${w}" stroke-dasharray="6 5" stroke-linecap="round"/>`;
  const head = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.red}"/>`;
  const spark = (x, y, s) => `<path d="M${x},${y - s} L${x + s * .25},${y - s * .25} L${x + s},${y} L${x + s * .25},${y + s * .25} L${x},${y + s} L${x - s * .25},${y + s * .25} L${x - s},${y} L${x - s * .25},${y - s * .25}Z" fill="#fff6c8" stroke="${K.ink}" stroke-width="1"/>`;
  const sitBelly = Object.assign({}, NOD.POSES.sit, { armB: { t: [6, -74], bend: 1 } });
  const onChair = -114;   // armchair back top, relative to its floor line (Nod stands on it)

  const SHOTS = [
    { t: '0:00–0:03', cam: 'C1', size: 'WIDE', c: { cx: 500, cy: -60, w: 270 }, o: { tv: true },
      chars: () => nodPose('sit', 500, 40, { expr: 'sleepy' }), fx: () => sfx(528, -112, 'zz…', 14, 0),
      action: '11:58 PM. Nod is alone on the sofa, lit by the TV. Slow blinks.', clip: 'sit_idle (loop)', sound: 'TV murmur, clock tick' },
    { t: '0:03–0:06', cam: 'C2', size: 'MEDIUM', c: { cx: 500, cy: -55, w: 130 }, o: { tv: true },
      chars: () => nodPose('sit', 500, 40, Object.assign({}, sitBelly, { expr: 'hungry', look: [3, -3] })), fx: () => sfx(478, -22, 'GRRRWL', 11, -12, '#f2c230'),
      action: 'Tummy growls. Hand on belly, eyes slide up and to the right… toward the bookshelf.', clip: 'sit_idle + head/eye turn (additive)', sound: 'stomach growl' },
    { t: '0:06–0:08', cam: 'C3', size: 'INSERT', c: { cx: 846, cy: -214, w: 92 }, o: {},
      chars: () => '', fx: () => spark(822, -244, 6) + spark(872, -232, 4) + spark(866, -258, 3) + sfx(846, -168, 'ting!', 13, 0, '#fff6c8'),
      action: 'Push-in on the cookie jar on top of the bookshelf. It sparkles.', clip: '— (no character)', sound: '“ting!” chime' },
    { t: '0:08–0:12', cam: 'C1', size: 'WIDE', c: { cx: 610, cy: -60, w: 270 }, o: {},
      chars: () => nodPose('tiptoe', 610, 110, { yaw: 60, expr: 'sneaky' }), fx: () => arrow('M520,78 Q560,60 590,72 M640,72 Q680,64 720,78') + head(722, 79),
      action: 'He slides off the sofa and tiptoes across the rug toward the shelf. Each planted foot stays locked.', clip: 'sit_to_stand → tiptoe (10 f blend)', sound: 'soft pizzicato steps' },
    { t: '0:12–0:14', cam: 'C4', size: 'LOW CLOSE', c: { cx: 648, cy: 48, w: 84 }, o: {},
      chars: () => nodPose('tiptoe', 628, 196, { yaw: 60, expr: 'scared', legA: { t: [22, -14], bend: -1 } }), fx: () => sfx(640, 40, 'SQUEAK!', 15, -10, '#f2c230'),
      action: 'His foot lands on the rubber duck. SQUEAK! Nod freezes mid-step.', clip: 'tiptoe → scared (6 f blend)', sound: 'loud squeak, music stops' },
    { t: '0:14–0:17', cam: 'C5', size: 'MEDIUM', c: { cx: 270, cy: -95, w: 210 }, o: {},
      chars: () => nodPose('scared', 325, 130, { expr: 'scared' }), fx: () => sfx(362, -116, '!!', 22, 6, '#fff'),
      action: 'A huge horned shadow looms on the wall by the door. Nod shakes, scarf wraps tight.', clip: 'scared (loop)', sound: 'low drone, heartbeat' },
    { t: '0:17–0:20', cam: 'C1', size: 'WIDE', c: { cx: 500, cy: -40, w: 250 }, o: { front: ['table'] },
      chars: () => nodPose('crawl', 470, 152, { yaw: 62, expr: 'determined' }), fx: () => arrow('M380,90 Q420,100 440,92'),
      action: 'He drops and crawls under the coffee table to hide.', clip: 'scared → crawl (10 f blend)', sound: 'shuffle, tense strings' },
    { t: '0:20–0:23', cam: 'C2', size: 'CLOSE', c: { cx: 618, cy: 20, w: 120 }, o: { front: ['table'] },
      chars: () => nodPose('peek', 576, 152, { yaw: 62, expr: 'relieved' }),
      fx: () => `<g><ellipse cx="646" cy="-55" rx="34" ry="30" fill="#fff" stroke="${K.ink}" stroke-width="1.6"/><circle cx="628" cy="-18" r="4" fill="#fff" stroke="${K.ink}" stroke-width="1.2"/><circle cx="622" cy="-8" r="2.4" fill="#fff" stroke="${K.ink}" stroke-width="1"/>` +
        `<g transform="translate(646 -50) scale(.22) translate(-300 60)">${parts.rack({ coat: true })}</g></g>`,
      action: 'Peeking out, he squints at the “monster”: it is only Dad’s coat and hat on the rack, lit by the lamp. Phew.', clip: 'crawl → peek (new clip)', sound: 'relieved sigh, music returns' },
    { t: '0:23–0:26', cam: 'C6', size: 'WIDE', c: { cx: 720, cy: -70, w: 290 }, o: {},
      chars: () => nodPose('run', 640, 120, { yaw: 75, expr: 'determined' }), fx: () => arrow('M690,30 Q720,-140 740,-90') + head(740, -88),
      action: 'He scrambles out, runs for the armchair and jumps up onto its back.', clip: 'crawl → run (8 f) → jump (6 f); run in place + scripted travel', sound: 'scramble, whoosh' },
    { t: '0:26–0:30', cam: 'C6', size: 'MEDIUM', c: { cx: 790, cy: -135, w: 160 }, o: {},
      chars: () => nodPose('cheer', 740, 62, { lift: onChair, expr: 'joy' }), fx: () => sfx(826, -150, 'YESSS!', 13, -8, '#f2c230'),
      action: 'Lands on the chair back (squash), grabs a cookie from the jar and cheers.', clip: 'jump → land → cheer (8 f blends); feet locked on landing', sound: 'thump, jar clink, “Yesss!”' },
    { t: '0:30–0:33', cam: 'C7', size: 'WIDE', c: { cx: 110, cy: -100, w: 200 }, o: { night: false, lit: true, parents: true, lampOn: true },
      chars: () => '', fx: () => sfx(160, -150, 'CLICK', 15, -6, '#fff'),
      action: 'CLICK. The lights come on. Mom and Dad are standing in the hallway doorway.', clip: 'Mom & Dad: placeholder silhouettes (built later, rule 2)', sound: 'switch click, music cuts' },
    { t: '0:33–0:36', cam: 'C6', size: 'CLOSE', c: { cx: 760, cy: -150, w: 110 }, o: { night: false },
      chars: () => nodPose('bite', 740, 62, { lift: onChair, expr: 'caught' }),
      fx: () => `<circle cx="752" cy="-140" r="1.6" fill="#c98a4b" stroke="${K.ink}" stroke-width=".6"/>` + sfx(760, -62, 'MIDNIGHT SNACK', 10, 0, '#fff'),
      action: 'Nod freezes mid-bite, cheeks pink. A crumb falls. Hold, then title card.', clip: 'cheer → idle (hold on last frame)', sound: 'crumb “tik”, sting' },
  ];
  // one entry per camera for the location sheet
  const CAMS = {
    C1: 'Front wide: sofa, table, rug', C2: 'Front medium/close on sofa & table', C3: 'Insert: cookie jar', C4: 'Low close: floor & rubber duck',
    C5: 'Door wall: coat rack & shadow', C6: 'Armchair & bookshelf', C7: 'Hallway door & light switch',
  };
  G.FILM = { title: 'Midnight Snack', SHOTS, CAMS };
})(typeof window !== 'undefined' ? window : globalThis);
