// 18 sn test: Nod soldan sekerek girer → giris → sandalyeye oturur → düşünceli → fikir → kalkıp heyecanla zıplar → onay.
// 1920x1080, 30 fps (§11). Sahne saf bir fonksiyondur (kare → çizim); Remotion bileşeni yalnızca kareyi verir,
// böylece önizleme PNG'leri ve video aynı kareleri çizer.
import React from 'react';
import { Nod, type Poz } from '../karakter/Nod';
import { RENK, OLCU, GORUNUS, ekranOlcegi, type Bakis, type Agiz } from '../karakter/olculer';
import { AYAKTA, duyguAt, pozKaristir } from '../karakter/poz';
import type { Duygu } from '../karakter/yuz';
import { AtkiYayi, type AtkiDurumu } from '../karakter/atki';
import {
  yuru, otur, kalk, zipla, giris, fikir, onay, nefes, gozKirp, yaylanma, ayaktaCok,
  aralik, yumusak, OTURMA_ILERI, ZIPLA_SURE, GIRIS_SURE, FIKIR_SURE, ONAY_SURE, YURU,
} from '../karakter/hareketler';
import { bilekNerede, yon } from '../karakter/ik';
import { SandalyeArka, SandalyeOn } from '../esyalar/Sandalye';

export const GENISLIK = 1920;
export const YUKSEKLIK = 1080;
export const FPS = 30;
export const SURE = 540;

const S = ekranOlcegi(YUKSEKLIK, 0.5); // ayakta ekranın %50'si
const ZEMIN = 960; // ayak tabanı (px)
const CX = 820 / S; // sandalye (Nod birimi, dünya)
const XS = CX - OTURMA_ILERI; // Nod'un sandalyenin önünde durduğu yer (kalça)
const BASLA = -130; // yürüyüş başlangıcı (kalça, ekran dışı)

// zaman çizelgesi (kare). Ana hareketler arasında 8 karelik nefes payı (poz tutulur, nefes + göz kırpma sürer).
const NEFES = 8;
const Z = {
  yuru: [0, 90],
  don1: [98, 104],
  giris: [104, 104 + GIRIS_SURE], // 104–164
  don2: [172, 178],
  otur: [178, 214],
  dus: [222, 300], // el çeneye 12 karede gelir, poz 2+ sn kalır; atkı ucu yavaşça daire çizer
  fikir: [300, 300 + FIKIR_SURE], // ampul 300, 0,5 sn duraksama, parmak 315
  kalk: [352, 382],
  don3: [390, 394], // yan → 3/4 (izleyiciye dönük)
  zipla1: [394, 394 + ZIPLA_SURE],
  zipla2: [394 + ZIPLA_SURE + 4, 394 + 2 * ZIPLA_SURE + 4], // 442–486
  don4: [494, 498], // 3/4 → önden
  onay: [498, 498 + ONAY_SURE],
} as const;

const DUYGULAR: { kare: number; duygu: Duygu }[] = [
  { kare: 0, duygu: 'mutlu' },
  { kare: 224, duygu: 'dusunceli' },
  { kare: 300, duygu: 'sasirmis' },
  { kare: 316, duygu: 'heyecanli' },
  { kare: 496, duygu: 'mutlu' },
];

export interface SahneKaresi {
  x: number; // Nod kökü (dünya, Nod birimi)
  ayna: boolean; // sola bakıyor
  poz: Poz;
  havada: number;
  ezilme: { x: number; y: number };
  kafaDonus: number;
  bas: number;
  agiz: Agiz;
  bak: Bakis;
  fikir: boolean;
  parlama: number;
  atkiUnlem: boolean;
  atkiHavada: number;
  sandalye: boolean;
}

const icinde = (k: number, [a, b]: readonly [number, number]) => k >= a && k < b;

/** Dönüş: görünüş sırası (2'şer kare), ayna değişimi 3/4'te. */
function donus(k: number, [a]: readonly [number, number], sira: [Poz['gorunus'], boolean][]): { g: Poz['gorunus']; ayna: boolean } {
  const i = Math.min(sira.length - 1, Math.floor((k - a) / 2));
  return { g: sira[i][0], ayna: sira[i][1] };
}

/** Oturan + düşünceli (yan görünüş, üst gövde yerelinde, omuz (-5,-124), kafa -5° eğik). İki kemikli çözüm (el 158°):
 *  avuç merkezi (35,-172) çenenin ön-alt konturuna değer; bükülü işaret parmağının boğumu ve ucu kafa merkezine
 *  53 / 42 birim (parmak kalınlığı + kontur dahil 66'lık kafa konturunun içinde, yanağa yaslı);
 *  başparmak geriye, çenenin altında (-1,-177). */
function cenedeKol(): Poz['sagKol'] {
  return { omuz: -56.1, dirsek: -118.9, bilek: -27.0, el: 'cene', ayna: false };
}

/** Bir karenin tüm durumu (atkı salınımı hariç). */
export function sahneKaresi(k: number): SahneKaresi {
  const z: SahneKaresi = {
    x: XS, ayna: false, poz: AYAKTA.on, havada: 0, ezilme: { x: 1, y: 1 },
    kafaDonus: 0, bas: 0, agiz: 'kapali', bak: 'izleyici', fikir: false, parlama: 0,
    atkiUnlem: false, atkiHavada: 0, sandalye: true,
  };
  const oturan = otur(1);
  const dusunen: Poz = { ...oturan, sagKol: cenedeKol(), kafaEgim: -5 };
  const fikirSon = fikir(FIKIR_SURE - 1, dusunen).poz;

  if (k < Z.yuru[1]) {
    const w = yuru(k / YURU.periyot, XS - BASLA);
    z.x = BASLA + w.kalcaX;
    z.poz = w.poz;
  } else if (k < Z.don1[0]) {
    z.poz = AYAKTA.yan; // nefes payı
  } else if (k < Z.don1[1]) {
    z.poz = AYAKTA[donus(k, Z.don1, [['yan', false], ['ucdort', false], ['on', false]]).g];
  } else if (k < Z.giris[1]) {
    const g = giris(k - Z.giris[0]);
    Object.assign(z, { poz: g.poz, kafaDonus: g.kafaDonus, bas: g.bas, agiz: g.agiz });
  } else if (k < Z.don2[0]) {
    z.poz = AYAKTA.on;
  } else if (k < Z.don2[1]) {
    const d = donus(k, Z.don2, [['on', false], ['ucdort', true], ['yan', true]]);
    z.poz = AYAKTA[d.g]; z.ayna = d.ayna;
  } else if (k < Z.otur[1]) {
    z.ayna = true; z.x = CX;
    z.poz = otur(aralik(k, Z.otur[0], Z.otur[1] - 1));
  } else if (k < Z.dus[0]) {
    z.ayna = true; z.x = CX; z.poz = oturan;
  } else if (k < Z.dus[1]) {
    z.ayna = true; z.x = CX;
    z.poz = pozKaristir(oturan, dusunen, yumusak(aralik(k, Z.dus[0], Z.dus[0] + 12)));
    z.bak = 'yukari';
  } else if (k < Z.fikir[1]) {
    z.ayna = true; z.x = CX;
    const f = fikir(k - Z.fikir[0], dusunen);
    z.poz = { ...f.poz, kafaEgim: -5 * (1 - aralik(k, Z.fikir[0], Z.fikir[0] + 8)) };
    z.fikir = f.fikir; z.parlama = f.parlama; z.atkiUnlem = f.atkiUnlem;
    z.bak = 'yukari'; // ampule bakar
  } else if (k < Z.kalk[0]) {
    z.ayna = true; z.x = CX; z.poz = fikirSon;
    z.fikir = true; z.parlama = 1; z.atkiUnlem = true;
  } else if (k < Z.kalk[1]) {
    z.ayna = true; z.x = CX;
    const p = aralik(k, Z.kalk[0], Z.kalk[1] - 1);
    z.poz = pozKaristir(fikirSon, kalk(p), yumusak(aralik(k, Z.kalk[0], Z.kalk[0] + 9)));
    const s = 1 - aralik(k, Z.kalk[0], Z.kalk[0] + 8); // ampul söner
    z.fikir = s > 0; z.parlama = s;
  } else if (k < Z.don3[0]) {
    z.ayna = true; z.poz = AYAKTA.yan;
  } else if (k < Z.don3[1]) {
    const d = donus(k, Z.don3, [['yan', true], ['ucdort', true]]);
    z.poz = AYAKTA[d.g]; z.ayna = d.ayna;
  } else if (k < Z.don4[0]) {
    z.ayna = true;
    const ilk = k < Z.zipla1[1];
    const bas = ilk ? Z.zipla1[0] : Z.zipla2[0];
    const kk = Math.min(ZIPLA_SURE - 1, Math.max(0, k - bas));
    const j = zipla(kk, 'ucdort');
    Object.assign(z, { poz: j.poz, havada: j.havada, ezilme: j.ezilme, atkiHavada: j.atkiHavada });
  } else if (k < Z.don4[1]) {
    const d = donus(k, Z.don4, [['ucdort', true], ['on', false]]);
    z.poz = AYAKTA[d.g]; z.ayna = d.ayna;
  } else {
    z.poz = AYAKTA.on;
    z.bas = onay(k - Z.onay[0]);
  }
  // idle: nefes (yürüme/zıplama dışında), sonda ayakları üzerinde hafif yaylanma
  const hareketli = k < Z.yuru[1] || (k >= Z.zipla1[0] && k < Z.zipla2[1]);
  if (!hareketli) z.poz = { ...z.poz, kok: { ...z.poz.kok, y: z.poz.kok.y + nefes(k) } };
  if (k >= Z.onay[1]) z.poz = ayaktaCok(z.poz, yaylanma(k));
  return z;
}

/** Ayak bileklerinin ortası (Nod yerelinde x) — gölge için. */
function ayakOrtasi(poz: Poz): number {
  const A = GORUNUS[poz.gorunus];
  const bil = (tf: 'sag' | 'sol') => {
    const b = tf === 'sag' ? poz.sagBacak : poz.solBacak;
    const d1 = yon(b.kalca), d2 = yon(b.kalca + b.diz);
    return poz.kok.x + A.kalcaX[tf] + d1.x * OLCU.ustBacak + d2.x * OLCU.altBacak;
  };
  return (bil('sag') + bil('sol')) / 2;
}

// atkı follow-through: tüm kareler bir kez, sırayla (her kare bağımsız çizilse de aynı sonuç)
let atkiOnbellek: AtkiDurumu[] | null = null;
export function atkiAcilari(): AtkiDurumu[] {
  if (atkiOnbellek) return atkiOnbellek;
  const yay = new AtkiYayi();
  const boyun = (k: number) => {
    const z = sahneKaresi(k);
    const dir = z.ayna ? -1 : 1;
    const e = (z.poz.egim * Math.PI) / 180;
    return z.x + dir * (z.poz.kok.x + Math.sin(e) * (OLCU.kalcaY - OLCU.boyunY));
  };
  const out: AtkiDurumu[] = [];
  let x0 = boyun(0), v0 = 0;
  for (let k = 0; k < SURE; k++) {
    const z = sahneKaresi(k);
    const x = boyun(k);
    const v = x - x0;
    const a = v - v0;
    x0 = x; v0 = v;
    const yd = z.ayna ? -1 : 1;
    out.push(yay.ilerle(yd * a, 0, yd * v));
  }
  atkiOnbellek = out;
  return out;
}

export const Sahne: React.FC<{ kare: number }> = ({ kare }) => {
  const z = sahneKaresi(kare);
  // katman (§7): arkalık → Nod → ön bacak, yalnızca Nod sandalyedeyken; ayaktayken sandalyenin tamamı arkada
  const oturuyor = kare >= Z.otur[0] && kare < Z.kalk[1];
  const d = duyguAt(DUYGULAR, kare, 8);
  const atki = atkiAcilari()[Math.min(SURE - 1, kare)];
  const poz: Poz = { ...z.poz, atki };
  const dir = z.ayna ? -1 : 1;
  const ayakX = z.x + dir * ayakOrtasi(poz);
  const golge = Math.max(0.45, 1 - z.havada / 220);
  const nodX = z.x * S;
  const ayakPx = ayakX * S;
  return (
    <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      {/* gölge: ayakların altında, yükseldikçe küçülür */}
      <ellipse cx={ayakPx} cy={ZEMIN + 2 * S} rx={70 * S * golge} ry={8 * S * golge} fill={RENK.golge} />
      {z.sandalye && <g transform={`translate(${CX * S} ${ZEMIN}) scale(${-S} ${S})`}><SandalyeArka />{!oturuyor && <SandalyeOn />}</g>}
      <g transform={`translate(${ayakPx} ${ZEMIN}) scale(${z.ezilme.x} ${z.ezilme.y}) translate(${-ayakPx} ${-ZEMIN})`}>
        <Nod
          id="nod" x={nodX} y={ZEMIN - z.havada * S} olcek={S} sola={z.ayna} bak={z.bak} poz={poz}
          duygu={d.duygu} oncekiDuygu={d.onceki} gecis={d.t} kare={kare} golge={false}
          kirp={gozKirp(kare)} bas={z.bas} kafaDonus={z.kafaDonus} agiz={z.agiz}
          fikir={z.fikir} fikirParlama={z.parlama} atkiUnlem={z.atkiUnlem} atkiHavada={z.atkiHavada}
        />
      </g>
      {z.sandalye && oturuyor && <g transform={`translate(${CX * S} ${ZEMIN}) scale(${-S} ${S})`}><SandalyeOn /></g>}
    </svg>
  );
};
