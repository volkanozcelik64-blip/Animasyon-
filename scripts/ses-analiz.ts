// Ses analizi (§8): @remotion/media-utils ile her karenin ses şiddeti ve frekans dengesi.
// media-utils tarayıcıda çalışır (AudioContext); bu yüzden bir kez başsız Chromium'da çalıştırıp sonucu
// JSON'a yazıyoruz. Önizleme kareleri ve Remotion render'ı aynı veriyi okur → ağız şekilleri birebir aynı.
// npx tsx scripts/ses-analiz.ts assets/ses.mp3 [fps]
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(__dirname, '..');
const girdi = path.resolve(process.argv[2] ?? path.join(KOK, 'assets', 'ses.mp3'));
const fps = Number(process.argv[3] ?? 30);
const cikti = girdi.replace(/\.[a-z0-9]+$/i, '.lipsync.json');

const tarayiciKodu = `
import { getAudioData, visualizeAudio } from '@remotion/media-utils';
window.analiz = async (src, fps) => {
  const ses = await getAudioData(src);
  const kareSayisi = Math.ceil(ses.durationInSeconds * fps);
  const kareler = [];
  for (let k = 0; k < kareSayisi; k++) {
    // 32 frekans kutusu (düşükten yükseğe)
    const b = visualizeAudio({ audioData: ses, frame: k, fps, numberOfSamples: 32 });
    const top = (a, z) => b.slice(a, z).reduce((x, y) => x + y, 0);
    // ses şiddeti: bu karenin örneklerinin RMS'i
    const ch = ses.channelWaveforms[0];
    const bas = Math.floor((k / fps) * ses.sampleRate), son = Math.min(ch.length, Math.floor(((k + 1) / fps) * ses.sampleRate));
    let s = 0; for (let i = bas; i < son; i++) s += ch[i] * ch[i];
    kareler.push({ ses: Math.sqrt(s / Math.max(1, son - bas)), alcak: top(0, 4), orta: top(4, 12), yuksek: top(12, 32) });
  }
  return { fps, sure: ses.durationInSeconds, kareler };
};
`;

async function main() {
  const paket = await build({
    stdin: { contents: tarayiciKodu, resolveDir: KOK, loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
  });
  const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const sayfa = await tarayici.newPage();
  await sayfa.setContent('<html><body></body></html>');
  await sayfa.addScriptTag({ content: paket.outputFiles[0].text });
  const src = `data:audio/mpeg;base64,${fs.readFileSync(girdi).toString('base64')}`;
  const sonuc = await sayfa.evaluate(([s, f]) => (window as any).analiz(s, f), [src, fps] as const);
  // normalize (en yüksek ses = 1)
  const enFazla = Math.max(...sonuc.kareler.map((k: any) => k.ses));
  const yuvarla = (x: number) => Math.round(x * 1000) / 1000;
  const kareler = sonuc.kareler.map((k: any) => {
    const t = k.alcak + k.orta + k.yuksek || 1;
    return { ses: yuvarla(k.ses / enFazla), alcak: yuvarla(k.alcak / t), orta: yuvarla(k.orta / t), yuksek: yuvarla(k.yuksek / t) };
  });
  fs.writeFileSync(cikti, JSON.stringify({ kaynak: path.basename(girdi), fps, sure: sonuc.sure, kareler }));
  console.log('yazıldı', path.relative(KOK, cikti), `${kareler.length} kare, ${sonuc.sure.toFixed(2)} sn`);
  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
