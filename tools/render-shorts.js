// Kullanım:
//   NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-shorts.html video/nod-shorts.mp4
//   NODE_PATH=$(npm root -g) node tools/render-shorts.js nod-shorts.html out-dir --stills 0.5,1,2.3   (PNG kareler)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const [html, out, flag, list] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(html) + '?render=1');
  if (flag === '--stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const s of list.split(',')) {
      const d = await p.evaluate(s => R_png(+s), s);
      fs.writeFileSync(path.join(out, `t${(+s).toFixed(2)}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    console.log('stills', list, 'errors', errs); await b.close(); return;
  }
  const fps = await p.evaluate(() => R_fps), n = await p.evaluate(() => R_frames);
  const tmpV = out + '.video.mp4', wav = out + '.wav';
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), tmpV], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const d = await p.evaluate(i => R_frame(i), i);
    if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 120 === 0) console.log('frame', i, '/', n);
    if (errs.length) break;
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  fs.writeFileSync(wav, Buffer.from(await p.evaluate(() => R_audio()), 'base64'));
  await b.close();
  await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-i', tmpV, '-i', wav, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', r));
  fs.unlinkSync(tmpV); fs.unlinkSync(wav);
  console.log('frames', n, 'errors', errs);
})();
