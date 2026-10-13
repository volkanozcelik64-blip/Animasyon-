// Lip sync testi (8 sn): Nod izleyiciye dönük, assets/ses.mp3 ile konuşur.
// Ağız şekilleri sesten (assets/ses.lipsync.json, @remotion/media-utils analizi); vurgulu hecelerde küçük kafa
// sallamaları; "Hmm… where should I start?" duraklamasında düşünceli (el çenede), "Okay, got it!" ile fikir.
// Bölüm sınırları elle değil, ses analizinden bulunur (duraklama başı, son patlama).
import React from 'react';
import { Nod, type Poz } from '../karakter/Nod';
import { RENK, ekranOlcegi, type Bakis } from '../karakter/olculer';
import { AYAKTA, DUYGU_POZLARI, duyguAt, pozKaristir } from '../karakter/poz';
import type { Duygu } from '../karakter/yuz';
import { fikir, nefes, gozKirp, aralik, yumusak, FIKIR_DURAKSAMA } from '../karakter/hareketler';
import { agizSec, konusmaVurgu, sessizlikBaslangici, sonPatlama, type SesAnalizi } from '../karakter/lipsync';
import analizJson from '../../assets/ses.lipsync.json';

const ANALIZ = analizJson as SesAnalizi;

export const GENISLIK = 1920;
export const YUKSEKLIK = 1080;
export const FPS = 30;
export const SURE = 240; // 8 sn (ses 7,47 sn + kısa kapanış)
export const SES_DOSYASI = 'ses.mp3'; // assets/ (Remotion public dizini)

const S = ekranOlcegi(YUKSEKLIK, 0.5);
const ZEMIN = 960;
const X = GENISLIK / 2 / S;

// bölümler (kare), sesten
export const BOLUM = (() => {
  const dus = sessizlikBaslangici(ANALIZ, FPS); // ilk konuşmadan sonraki "Hmm…" duraklaması
  const fik = sonPatlama(ANALIZ); // "Okay, got it!"
  return { dus, fik };
})();

const DUYGULAR: { kare: number; duygu: Duygu }[] = [
  { kare: 0, duygu: 'sakin' },
  { kare: BOLUM.dus, duygu: 'dusunceli' },
  { kare: BOLUM.fik, duygu: 'sasirmis' },
  { kare: BOLUM.fik + FIKIR_DURAKSAMA, duygu: 'heyecanli' },
  { kare: BOLUM.fik + FIKIR_DURAKSAMA + 30, duygu: 'mutlu' },
];

export interface KonusmaKaresi {
  poz: Poz; bak: Bakis; bas: number; agiz: ReturnType<typeof agizSec>;
  fikir: boolean; parlama: number; atkiUnlem: boolean;
}

export function konusmaKaresi(k: number): KonusmaKaresi {
  const ayakta = AYAKTA.on;
  const dusunen = DUYGU_POZLARI.dusunceli!;
  let poz: Poz = ayakta;
  let bak: Bakis = 'izleyici';
  let f = { fikir: false, parlama: 0, atkiUnlem: false };
  if (k >= BOLUM.dus && k < BOLUM.fik) {
    // el 12 karede çeneye gelir; gözler yukarı
    poz = pozKaristir(ayakta, dusunen, yumusak(aralik(k, BOLUM.dus, BOLUM.dus + 12)));
    bak = 'yukari';
  } else if (k >= BOLUM.fik) {
    const r = fikir(k - BOLUM.fik, dusunen);
    // fikir anında elin çeneden kalkışı da fikir() içinde (temel = düşünen poz)
    poz = { ...r.poz, kafaEgim: dusunen.kafaEgim * (1 - aralik(k, BOLUM.fik, BOLUM.fik + 10)) };
    f = { fikir: r.fikir, parlama: r.parlama, atkiUnlem: r.atkiUnlem };
    bak = k - BOLUM.fik < FIKIR_DURAKSAMA + 4 ? 'yukari' : 'izleyici';
  }
  poz = { ...poz, kok: { ...poz.kok, y: poz.kok.y + nefes(k) } };
  // vurgulu hecelerde küçük onay sallaması (fikir hareketinde değil)
  const bas = k < BOLUM.fik ? konusmaVurgu(ANALIZ, k) : 0;
  return { poz, bak, bas, agiz: agizSec(ANALIZ, k), ...f };
}

export const Sahne: React.FC<{ kare: number }> = ({ kare }) => {
  const z = konusmaKaresi(kare);
  const d = duyguAt(DUYGULAR, kare, 8);
  return (
    <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      <ellipse cx={X * S} cy={ZEMIN + 2 * S} rx={70 * S} ry={8 * S} fill={RENK.golge} />
      <Nod
        id="nodk" x={X * S} y={ZEMIN} olcek={S} poz={z.poz} bak={z.bak} golge={false}
        duygu={d.duygu} oncekiDuygu={d.onceki} gecis={d.t} kare={kare}
        kirp={gozKirp(kare, 'konusma')} bas={z.bas} agiz={z.agiz}
        fikir={z.fikir} fikirParlama={z.parlama} atkiUnlem={z.atkiUnlem}
      />
    </svg>
  );
};
