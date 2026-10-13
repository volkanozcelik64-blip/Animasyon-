// Önizleme PNG'leri: npx tsx scripts/render.tsx [cikti_klasoru]
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { Nod } from '../src/karakter/Nod';
import { SandalyeArka, SandalyeOn } from '../src/esyalar/Sandalye';
import { DUYGULAR, type Duygu } from '../src/karakter/yuz';
import { AYAKTA, OTURAN, EL_SALLAYAN, ISARET_EDEN, type Poz } from '../src/karakter/poz';
import { El, type ElPozu } from '../src/karakter/parcalar';
import { OLCU, RENK } from '../src/karakter/olculer';
import { atkiSimule } from '../src/karakter/atki';

const KOK = path.resolve(__dirname, '..');
const CIKTI = path.resolve(process.argv[2] ?? path.join(KOK, 'onizleme', 'karakter'));
const REF = path.join(KOK, 'assets', 'karakter-referans.png');
fs.mkdirSync(CIKTI, { recursive: true });

const refUri = `data:image/png;base64,${fs.readFileSync(REF).toString('base64')}`;
const svg = (el: React.ReactElement) => renderToStaticMarkup(el);
// referans görseli 2973x880: solda tam boy, sağda 9 duygu ızgarası
const REF_W = 2973, REF_H = 880;
const refKirp = (x: number, y: number, w: number, h: number, o = 1) =>
  `<div style="width:${w * o}px;height:${h * o}px;overflow:hidden;position:relative">
    <img src="${refUri}" style="position:absolute;left:${-x * o}px;top:${-y * o}px" width="${REF_W * o}" height="${REF_H * o}"></div>`;

const sayfa = (govde: string, w: number, h: number) => `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#fff;font-family:'DejaVu Sans',sans-serif}
.etiket{font-size:22px;color:#333;text-align:center;letter-spacing:1px}
.baslik{font-size:26px;font-weight:bold;color:#222;padding:14px 20px 0}
</style></head><body style="width:${w}px;height:${h}px;overflow:hidden">${govde}</body></html>`;

async function main() {
  const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const sayfaAc = await tarayici.newPage();
  const cek = async (ad: string, html: string, w: number, h: number) => {
    w = Math.ceil(w); h = Math.ceil(h);
    await sayfaAc.setViewportSize({ width: w, height: h });
    await sayfaAc.setContent(sayfa(html, w, h));
    const dosya = path.join(CIKTI, ad);
    await sayfaAc.screenshot({ path: dosya });
    console.log('yazıldı', path.relative(KOK, dosya));
  };

  // ------------------------------------------------ 1) 9 duygu ızgarası (referans kadrajında)
  // Referans hücreleri: kafa + atkı + kol/gövde başlangıcı; 3x3.
  const ihH = 250, ihW = 460;
  const hucre = (d: Duygu, kare: number) => {
    // referans hücresinde kafa çapı ≈ hücre yüksekliğinin %44'ü, tepesi üstten ~%14
    const vbH = (2 * OLCU.kafaR) / 0.45;
    const vbW = vbH * ihW / ihH;
    return svg(
      <svg viewBox={`${-vbW / 2} ${OLCU.kafaY - OLCU.kafaR - vbH * 0.17} ${vbW} ${vbH}`} width={ihW} height={ihH}>
        <Nod id={`d${d}`} duygu={d} kare={kare} golge={false} />
      </svg>,
    );
  };
  const izgara = (kare: number) => `<div style="display:grid;grid-template-columns:repeat(3,${ihW}px);gap:0">
    ${DUYGULAR.map((d, i) => `<div style="border-right:${i % 3 < 2 ? '2px solid #eee' : 'none'};border-bottom:${i < 6 ? '2px solid #eee' : 'none'}">${hucre(d, kare)}</div>`).join('')}</div>`;
  await cek('duygular-izgara.png', izgara(18), ihW * 3 + 4, ihH * 3 + 4);

  // yan yana: referans | bizim
  await cek('duygular-karsilastirma.png', `
    <div style="display:flex;gap:24px;padding:10px;align-items:flex-start">
      <div><div class="baslik">Referans</div>${refKirp(1600, 95, 1300, 760)}</div>
      <div><div class="baslik">SVG bileşeni</div>${izgara(18)}</div>
    </div>`, 1300 + ihW * 3 + 70, 840);

  // ------------------------------------------------ 2) üç görünüş, tam boy
  const tamBoy = (poz: Poz, duygu: Duygu, ad: string, w = 360, ekstra?: React.ReactNode, on?: React.ReactNode) =>
    svg(
      <svg viewBox={`-180 ${OLCU.kafaY - 100} 360 ${-OLCU.kafaY + 125}`} width={w} height={w * (-OLCU.kafaY + 125) / 360}>
        {ekstra}
        <Nod id={ad} poz={poz} duygu={duygu} kare={18} />
        {on}
      </svg>,
    );
  const gorunusler = `<div style="display:flex">${(['on', 'ucdort', 'yan'] as const).map((g, i) =>
    `<div>${tamBoy(AYAKTA[g], 'sakin', `g${i}`, 420)}<div class="etiket">${['ÖNDEN', '3/4 YAN', 'PROFİL'][i]}</div></div>`).join('')}</div>`;
  await cek('gorunusler.png', gorunusler, 1260, 760);

  // referans tam boy | bizim önden (aynı boy ölçeğinde) + 3/4 + profil
  await cek('gorunusler-karsilastirma.png', `
    <div style="display:flex;gap:20px;padding:10px;align-items:flex-start">
      <div><div class="baslik">Referans (tam boy)</div><div style="padding-top:0px">${refKirp(610, 175, 270, 660, 1.08)}</div></div>
      <div><div class="baslik">SVG — önden / 3/4 / profil</div>${gorunusler}</div>
    </div>`, 1580, 800);

  // ------------------------------------------------ 3) dört poz
  const pozlar: [Poz, Duygu, string, React.ReactNode?, React.ReactNode?][] = [
    [AYAKTA.on, 'mutlu', 'AYAKTA'],
    [OTURAN, 'notr', 'SANDALYEDE (YANDAN)', <SandalyeArka />, <SandalyeOn />],
    [EL_SALLAYAN, 'heyecanli', 'EL SALLAYAN'],
    [ISARET_EDEN, 'mutlu', 'İŞARET EDEN'],
  ];
  await cek('pozlar.png', `<div style="display:flex">${pozlar.map(([pz, d, e, ek, on], i) =>
    `<div>${tamBoy(pz, d, `p${i}`, 400, ek, on)}<div class="etiket">${e}</div></div>`).join('')}</div>`, 1600, 740);

  // ------------------------------------------------ ek: el pozları
  const eller: [ElPozu, string][] = [['acik', 'AÇIK'], ['yumruk', 'YUMRUK'], ['isaret', 'İŞARET'], ['salla', 'EL SALLAMA'], ['tut', 'NESNE TUTMA']];
  await cek('el-pozlari.png', `<div style="display:flex">${eller.map(([e, ad]) => `<div>${svg(
    <svg viewBox="-45 -20 90 80" width="240" height="213">
      <line x1="0" y1="-30" x2="0" y2="0" stroke={RENK.murekkep} strokeWidth={OLCU.kolKalinlik} strokeLinecap="round" />
      <El poz={e} s={1} />
    </svg>)}<div class="etiket">${ad}</div></div>`).join('')}</div>`, 1200, 260);

  // ------------------------------------------------ ek: duygu geçişi (mutlu → kizgin, 8 kare)
  const gecisKareleri = Array.from({ length: 10 }, (_, i) => i);
  await cek('duygu-gecisi.png', `<div style="display:flex">${gecisKareleri.map((i) => {
    const t = Math.min(1, i / 8); const e = t * t * (3 - 2 * t);
    return `<div>${svg(<svg viewBox={`-90 ${OLCU.kafaY - 80} 180 170`} width="160" height="151">
      <Nod id={`t${i}`} duygu="kizgin" oncekiDuygu="mutlu" gecis={e} golge={false} />
    </svg>)}<div class="etiket" style="font-size:16px">kare ${i}</div></div>`;
  }).join('')}</div>`, 1600, 185);

  // ------------------------------------------------ ek: atkı follow-through (sağa koşup durma)
  const yol = Array.from({ length: 40 }, (_, k) => {
    const t = Math.min(1, k / 14); const x = 160 * (t * t * (3 - 2 * t));
    return { x, y: OLCU.boyunY };
  });
  const aci = atkiSimule(yol);
  const goster = [0, 4, 7, 10, 13, 15, 17, 20, 24, 30];
  await cek('atki-follow-through.png', `<div style="display:flex">${goster.map((k) => svg(
    <svg viewBox={`-120 ${OLCU.kafaY - 80} 240 ${-OLCU.kafaY + 100}`} width="160" height={160 * (-OLCU.kafaY + 100) / 240}>
      <Nod id={`a${k}`} poz={{ ...AYAKTA.on, atki: aci[k] }} duygu="mutlu" />
      <text x="0" y="16" fontSize="16" textAnchor="middle" fill="#555">kare {k}</text>
    </svg>)).join('')}</div>`, 1600, 160 * (-OLCU.kafaY + 100) / 240 + 4);

  await tarayici.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
