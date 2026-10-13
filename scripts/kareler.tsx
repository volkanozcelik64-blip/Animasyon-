// Kritik kareleri PNG olarak çıkarıp tek bir kontak sayfasında dizer (render'dan önce kontrol, §10).
// npx tsx scripts/kareler.tsx [kare,kare,...] [cikti.png]
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import * as Temel from '../src/sahneler/NodTemel';
import * as Konusma from '../src/sahneler/NodKonusma';
import * as Pil from '../src/sahneler/NodPil';
import * as Hazirlik from '../src/sahneler/pil/Hazirlik';
import * as Sarj1 from '../src/sahneler/Sarj1';
import { yaziCss } from './yazi';

// SAHNE=konusma npx tsx scripts/kareler.tsx … → lip sync sahnesi
const sahneler = { temel: Temel, konusma: Konusma, pil: Pil, hazirlik: Hazirlik, sarj1: Sarj1 } as const;
const { Sahne, GENISLIK, YUKSEKLIK } = sahneler[(process.env.SAHNE as keyof typeof sahneler) ?? 'temel'] ?? Temel;

const KOK = path.resolve(__dirname, '..');
const kareler = (process.argv[2] ?? '10,30,50,80,92,104,122,140,170,186,197,222,252,264,284,296,305,316,327,337,346,359')
  .split(',').map(Number);
const cikti = path.resolve(process.argv[3] ?? path.join(KOK, 'onizleme', 'karakter', 'test-kareleri.png'));
// isteğe bağlı kırpma: x,y,w,h (px) — yakından kontrol için
const kirp = process.argv[4]?.split(',').map(Number);

async function main() {
  const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const sayfa = await tarayici.newPage();
  const [kx, ky, kw, kh] = kirp ?? [0, 0, GENISLIK, YUKSEKLIK];
  const tek = kareler.length === 1; // tek kare: tam çözünürlük, etiketsiz
  const W = tek ? kw : 480, H = (W * kh) / kw, SUTUN = Math.min(4, kareler.length);
  const hucre = (k: number) => `<div style="position:relative;width:${W}px;height:${H}px;border:1px solid #ccc;overflow:hidden">
    <div style="width:${GENISLIK}px;height:${YUKSEKLIK}px;transform:scale(${W / kw}) translate(${-kx}px,${-ky}px);transform-origin:0 0">${renderToStaticMarkup(<Sahne kare={k} />)}</div>
    ${tek ? '' : `<div style="position:absolute;left:6px;top:4px;font:bold 15px sans-serif;color:#333">kare ${k} · ${(k / 30).toFixed(2)} sn</div>`}</div>`;
  const satir = Math.ceil(kareler.length / SUTUN);
  const w = SUTUN * (W + 6), h = satir * (H + 6);
  await sayfa.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
  await sayfa.setContent(`<html><head>${yaziCss()}</head><body style="margin:0;background:#eee"><div style="display:grid;grid-template-columns:repeat(${SUTUN},${W + 4}px);gap:2px">${kareler.map(hucre).join('')}</div></body>`);
  await sayfa.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  await sayfa.screenshot({ path: cikti });
  console.log('yazıldı', path.relative(KOK, cikti));
  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
