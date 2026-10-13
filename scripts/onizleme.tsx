// Önizleme PNG'leri: npx tsx scripts/render.tsx [cikti_klasoru]
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { Nod } from '../src/karakter/Nod';
import { Masa, MASA_Y } from '../src/esyalar/Masa';
import { Laptop } from '../src/esyalar/Laptop';
import { Telefon } from '../src/esyalar/Telefon';
import { Kitap } from '../src/esyalar/Kitap';
import { Ampul } from '../src/esyalar/Ampul';
import { Sandalye } from '../src/esyalar/Sandalye';
import { SandalyeArka, SandalyeOn } from '../src/esyalar/Sandalye';
import { DUYGULAR, EK_DUYGULAR, type Duygu } from '../src/karakter/yuz';
import { AYAKTA, OTURAN, EL_SALLAYAN, ISARET_EDEN, DUYGU_POZLARI, FIKIR, type Poz } from '../src/karakter/poz';
import { AGIZLAR, type Agiz, type Bakis } from '../src/karakter/olculer';
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
        <Nod id={`d${d}`} duygu={d} kare={kare} golge={false} atkiTepki={false} />
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
  const gorunusler = `<div style="display:flex">${(['on', 'ucdort', 'yan', 'arka'] as const).map((g, i) =>
    `<div>${tamBoy(AYAKTA[g], 'sakin', `g${i}`, 330)}<div class="etiket">${['ÖNDEN', '3/4 YAN', 'PROFİL', 'ARKADAN'][i]}</div></div>`).join('')}</div>`;
  await cek('gorunusler.png', gorunusler, 1320, 620);

  // referans tam boy | bizim önden (aynı boy ölçeğinde) + 3/4 + profil
  await cek('gorunusler-karsilastirma.png', `
    <div style="display:flex;gap:20px;padding:10px;align-items:flex-start">
      <div><div class="baslik">Referans (tam boy)</div><div style="padding-top:0px">${refKirp(610, 175, 270, 660, 1.08)}</div></div>
      <div><div class="baslik">SVG — önden / 3/4 / profil</div>${gorunusler}</div>
    </div>`, 1640, 800);

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

  // ------------------------------------------------ §3 ek duygular (kendi pozlarıyla) + fikir anı
  const ekler: [Duygu, string, boolean?][] = [
    ['dusunceli', 'DÜŞÜNCELİ'], ['sasirmis', 'ŞAŞIRMIŞ'], ['gururlu', 'GURURLU'], ['sikilmis', 'SIKILMIŞ'], ['utangac', 'UTANGAÇ'],
    ['mutlu', 'FİKİR ANI', true],
  ];
  await cek('ek-duygular.png', `<div style="display:flex">${ekler.map(([d, ad, fikir], i) => `<div>${svg(
    <svg viewBox={`-180 ${OLCU.kafaY - 150} 360 ${-OLCU.kafaY + 175}`} width="300" height={300 * (-OLCU.kafaY + 175) / 360}>
      <Nod id={`e${i}`} duygu={d} poz={fikir ? FIKIR : DUYGU_POZLARI[d]} fikir={fikir} kare={20}
        bak={d === 'dusunceli' ? 'yukari' : d === 'utangac' ? 'sag' : 'izleyici'} />
    </svg>)}<div class="etiket">${ad}</div></div>`).join('')}</div>`, 1800, 680);

  // ------------------------------------------------ §4 atkı tepkileri (her duygu + fikir)
  const tepkiler: (Duygu | 'fikir')[] = [...DUYGULAR, ...EK_DUYGULAR, 'fikir'];
  const tepkiAd: Record<string, string> = { kafasi_karisik: 'kafası karışık', heyecanli: 'heyecanlı', uzgun: 'üzgün', kizgin: 'kızgın', korkmus: 'korkmuş', asik: 'aşık', notr: 'nötr', dusunceli: 'düşünceli', sasirmis: 'şaşırmış', sikilmis: 'sıkılmış', utangac: 'utangaç' };
  await cek('atki-tepkileri.png', `<div style="display:grid;grid-template-columns:repeat(5,300px)">${tepkiler.map((d, i) => `<div>${svg(
    <svg viewBox={`-150 ${OLCU.kafaY - 95} 300 290`} width="300" height="290">
      <Nod id={`r${i}`} gorunus="on" duygu={d === 'fikir' ? 'mutlu' : d} fikir={d === 'fikir'} kare={14} golge={false} />
    </svg>)}<div class="etiket" style="margin:-4px 0 14px">${(tepkiAd[d] ?? d).toUpperCase()}</div></div>`).join('')}</div>`, 1500, 1020);

  // ------------------------------------------------ §8 ağız şekilleri (sakin yüz üstünde)
  await cek('agiz-sekilleri.png', `<div style="display:flex">${AGIZLAR.map((a, i) => `<div>${svg(
    <svg viewBox={`-80 ${OLCU.kafaY - 75} 160 150`} width="200" height="188">
      <Nod id={`m${i}`} agiz={a} golge={false} kaynama={false} />
    </svg>)}<div class="etiket">${a}</div></div>`).join('')}</div>`, 1600, 230);

  // ------------------------------------------------ §2 bakış yönleri
  const bakislar: Bakis[] = ['sol', 'sag', 'yukari', 'asagi', 'izleyici'];
  await cek('bakis.png', `<div style="display:flex">${bakislar.map((b, i) => `<div>${svg(
    <svg viewBox={`-80 ${OLCU.kafaY - 75} 160 150`} width="200" height="188">
      <Nod id={`b${i}`} bak={b} golge={false} kaynama={false} />
    </svg>)}<div class="etiket">${b.toUpperCase()}</div></div>`).join('')}</div>`, 1000, 230);

  // ------------------------------------------------ KARAKTER SAYFASI (tek PNG)
  const bolum = (baslik: string, icerik: string, not = '') =>
    `<div style="margin:0 40px 34px"><div class="bolum">${baslik}${not ? `<span class="not">${not}</span>` : ''}</div>${icerik}</div>`;
  const kafa = (id: string, el: React.ReactElement, w = 200) => svg(
    <svg viewBox={`-85 ${OLCU.kafaY - 80} 170 165`} width={w} height={w * 165 / 170}>{el}</svg>);
  const hucreler = (xs: string[]) => `<div style="display:flex;gap:6px;flex-wrap:wrap">${xs.join('')}</div>`;
  const etiketli = (svgStr: string, ad: string, gen?: number) => `<div style="text-align:center;${gen ? `width:${gen}px` : ''}">${svgStr}<div class="etiket" style="font-size:18px">${ad}</div></div>`;
  const boyVB = (ust = 150, alt = 25, gen = 360) => `-${gen / 2} ${OLCU.kafaY - ust} ${gen} ${-OLCU.kafaY + ust + alt}`;
  const boy = (id: string, el: React.ReactElement, w = 270, vb = boyVB()) => {
    const [, , vw, vh] = vb.split(' ').map(Number);
    return svg(<svg viewBox={vb} width={w} height={w * vh / vw}>{el}</svg>);
  };

  const agizOrnek: [Duygu, Agiz][] = [['heyecanli', 'A'], ['uzgun', 'O'], ['kizgin', 'E'], ['asik', 'MBP']];
  const sAgiz = bolum('1 · LIP SYNC — 8 AĞIZ ŞEKLİ', hucreler([
    ...AGIZLAR.map((a, i) => etiketli(kafa(`sa${i}`, <Nod id={`sa${i}`} agiz={a} golge={false} />), a)),
  ]) + `<div class="alt">Her duygunun üzerine uygulanır:</div>` + hucreler(
    agizOrnek.map(([d, a], i) => etiketli(kafa(`so${i}`, <Nod id={`so${i}`} duygu={d} agiz={a} kare={18} golge={false} />), `${d} + ${a}`)),
  ), 'kapali = duygunun kendi ağzı');

  const sArka = bolum('2 · ARKADAN GÖRÜNÜŞ', hucreler([
    etiketli(boy('ar0', <Nod id="ar0" gorunus="arka" />, 300), 'ARKADAN — sakin', 330),
    etiketli(boy('ar1', <Nod id="ar1" gorunus="arka" duygu="mutlu" kare={6} />, 300), 'ARKADAN — mutlu: uç sallanır', 330),
    etiketli(boy('ar2', <Nod id="ar2" gorunus="arka" duygu="uykulu" kare={18} />, 300), 'ARKADAN — uykulu: uç omza düşer', 330),
    etiketli(boy('ar3', <Nod id="ar3" gorunus="on" />, 300), 'ÖNDEN — karşılaştırma', 330),
  ]), 'düğüm ensede, sarkan uç düğümden çıkar');

  const yeni: [Duygu, string, Bakis][] = [
    ['dusunceli', 'DÜŞÜNCELİ — eli çenesinde, gözler yukarı', 'yukari'],
    ['sasirmis', 'ŞAŞIRMIŞ — kaşlar yukarı, O ağız', 'izleyici'],
    ['gururlu', 'GURURLU — göğüs önde, gözler kapalı', 'izleyici'],
    ['sikilmis', 'SIKILMIŞ — yarı kapalı göz, yanak elde', 'izleyici'],
    ['utangac', 'UTANGAÇ — gözler yana, eller arkada', 'sag'],
  ];
  const sDuygu = bolum('3 · YENİ DUYGULAR', hucreler(yeni.map(([d, ad, b], i) =>
    `<div style="width:352px;text-align:center">${boy(`yd${i}`, <Nod id={`yd${i}`} duygu={d} bak={b} kare={20} />, 330)}<div class="etiket" style="font-size:17px">${ad}</div></div>`)));

  const bakislar5: Bakis[] = ['sol', 'sag', 'yukari', 'asagi', 'izleyici'];
  const sBakis = bolum('4 · BAKIŞ — bak="sol|sag|yukari|asagi|izleyici"', hucreler(
    bakislar5.map((b, i) => etiketli(kafa(`bk${i}`, <Nod id={`bk${i}`} bak={b} golge={false} />, 230), b)),
  ), 'göz bebekleri tam, yüz yarısı kadar kayar');

  const esyaVB = `-160 -560 320 590`;
  const esya = (el: React.ReactElement, w = 250) => svg(<svg viewBox={esyaVB} width={w} height={w * 590 / 320}>{el}</svg>);
  const sEsya = bolum('5 · EŞYALAR (src/esyalar) — Nod ölçeğinde', hucreler([
    etiketli(svg(<svg viewBox="-330 -560 660 590" width="500" height={500 * 590 / 660}>
      <g transform="translate(-170 0)"><Nod id="es0" kare={4} /></g>
      <g transform="translate(110 0)"><Masa /><g transform={`translate(-40 ${MASA_Y})`}><Laptop /></g>
        <g transform={`translate(75 ${MASA_Y})`}><Kitap /></g></g>
    </svg>), 'MASA + LAPTOP + KİTAP (Nod ölçeğinde)'),
    etiketli(esya(<Sandalye />, 250), 'SANDALYE'),
    etiketli(esya(<g transform="translate(0 -230) scale(2)"><Laptop /></g>, 250), 'LAPTOP'),
    etiketli(esya(<g transform="translate(0 -260) scale(2)"><Telefon /></g>, 250), 'TELEFON'),
    etiketli(esya(<g transform="translate(0 -180) scale(2)"><Kitap /></g>, 250), 'KİTAP'),
    etiketli(esya(<g transform="translate(0 -210) scale(2)"><Ampul /></g>, 250), 'AMPUL'),
  ]));

  const sayfaHtml = `<style>
    .bolum{font-size:26px;font-weight:bold;color:#222;border-bottom:3px solid #222;padding-bottom:6px;margin-bottom:12px}
    .not{font-size:17px;font-weight:normal;color:#666;margin-left:16px}
    .alt{font-size:18px;color:#555;margin:6px 0 4px}
  </style>
  <div style="padding:26px 40px 10px;font-size:40px;font-weight:bold">NOD — Karakter Sayfası</div>
  ${sAgiz}${sArka}${sDuygu}${sBakis}${sEsya}`;
  await cek('karakter-sayfasi.png', sayfaHtml, 1920, 2850);

  await tarayici.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
