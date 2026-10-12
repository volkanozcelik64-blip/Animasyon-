// Kullanım: NODE_PATH=$(npm root -g) node tools/render-video.js $PWD/video.html $PWD/video/nod-ile-matematik.mp4 [dikey=0|1] [maxSaniye]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const [html, out, v = '0', maxS = '0'] = process.argv.slice(2);
  const vert = v === '1', w = vert ? 1080 : 1920, h = vert ? 1920 : 1080;
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + html + '?render=1' + (vert ? '&v=1' : ''));
  await p.evaluate(() => R_init());
  await p.evaluate(() => R_start());
  const tmpV = out + '.video.mp4';
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-s', `${w}x${h}`, tmpV], { stdio: ['pipe', 'inherit', 'inherit'] });
  let i = 0, tail = 0;
  const max = +maxS * 30;
  while (true) {
    const d = await p.evaluate(() => R_step());
    const buf = Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    i++;
    if (i % 300 === 0) console.log('frame', i, (i / 30).toFixed(1) + 's');
    const done = await p.evaluate(() => !!window.R_done);
    if (done) tail++;
    if (tail > 15 || (max && i >= max) || errs.length) break;
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  const wav = await p.evaluate(() => R_audio());
  fs.writeFileSync(out + '.wav', Buffer.from(wav, 'base64'));
  await b.close();
  await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-i', tmpV, '-i', out + '.wav', '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], { stdio: 'inherit' }).on('close', r));
  fs.unlinkSync(tmpV); fs.unlinkSync(out + '.wav');
  console.log('frames', i, 'errors', errs);
})();
