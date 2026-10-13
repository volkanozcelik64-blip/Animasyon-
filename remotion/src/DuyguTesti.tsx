import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Karakter, MUREKKEP} from './Karakter/Karakter';
import {DUYGULAR, Duygu, Poz, karistirPoz} from './Karakter/pozlar';
import {Kagit} from './Kagit';
import {YAZI} from './font';

// 10 sn test: mutlu yürüyerek girer + sevinç zıplaması → düşünceli → fikir! → heyecanlı zıplar.
// Tüm geçişler karıştırmalı (poz açıları + yüz çapraz geçişi); sert değişim yok.

const SAHNE = {
  yurumeBitis: 62,
  ziplamaBas: 64,
  ziplamaBit: 100,
  dusunGecisBas: 104,
  dusunGecisBit: 124,
  fikir: 196,
  heyecanGecisBas: 206,
  heyecanGecisBit: 222,
};

const ease = Easing.inOut(Easing.cubic);
const aralik = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

const KIRPMALAR = [38, 150, 178, 262];
const kirpma = (f: number) =>
  KIRPMALAR.reduce((m, k) => Math.max(m, interpolate(f, [k - 2, k, k + 3], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})), 0);

/** Önden görünüşte yürüme: bacak sırayla kalkar, kollar sallanır, gövde yaylanır. */
const yurumePozu = (f: number, taban: Poz): Poz => {
  const faz = (f / 30) * Math.PI * 2 * 1.7;
  const s = Math.sin(faz);
  const solKalk = Math.max(0, s);
  const sagKalk = Math.max(0, -s);
  return {
    ...taban,
    kolSol: [22 - 16 * s, -25 - 10 * s],
    kolSag: [22 + 16 * s, -25 + 10 * s],
    bacakSol: [6 + 10 * solKalk, -38 * solKalk],
    bacakSag: [6 + 10 * sagKalk, -38 * sagKalk],
    ziplama: 7 * Math.abs(Math.cos(faz)),
    govdeEgim: 3 * s,
    kafaEgim: -3 * s,
  };
};

const Etiket: React.FC<{yazi: string; opak: number; y: number}> = ({yazi, opak, y}) => (
  <div
    style={{
      position: 'absolute',
      top: 230 + y,
      width: '100%',
      textAlign: 'center',
      fontFamily: YAZI,
      fontSize: 120,
      color: MUREKKEP,
      opacity: opak,
      letterSpacing: 4,
    }}
  >
    {yazi}
  </div>
);

const Ampul: React.FC<{olcek: number; parilti: number}> = ({olcek, parilti}) => (
  <svg viewBox="-60 -70 120 140" width={240} height={280} style={{overflow: 'visible'}}>
    <g transform={`scale(${olcek})`} stroke={MUREKKEP} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <g opacity={parilti} fill="none" strokeWidth={4}>
        <path d="M0 -62 L0 -50 M-44 -40 L-35 -32 M44 -40 L35 -32 M-54 -2 L-42 -2 M54 -2 L42 -2" />
      </g>
      <path d="M-14 26 Q-14 12 -22 4 Q-34 -10 -28 -26 Q-20 -44 0 -44 Q20 -44 28 -26 Q34 -10 22 4 Q14 12 14 26 Z" fill="#ffe36b" />
      <path d="M-8 22 L-4 2 L0 10 L4 2 L8 22" fill="none" strokeWidth={2.6} />
      <rect x={-14} y={26} width={28} height={16} rx={4} fill="#c9c6c0" />
      <path d="M-14 33 L14 33" strokeWidth={2.6} />
    </g>
  </svg>
);

const DusunceBalonu: React.FC<{u: number}> = ({u}) => (
  <svg viewBox="0 0 200 200" width={300} height={300} style={{overflow: 'visible'}}>
    <g stroke={MUREKKEP} strokeWidth={4} fill="#fff">
      {[
        {x: 20, y: 170, r: 9, a: 0},
        {x: 48, y: 135, r: 14, a: 0.25},
        {x: 92, y: 88, r: 22, a: 0.5},
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r * interpolate(u, [d.a, d.a + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))})} />
      ))}
    </g>
  </svg>
);

export const DuyguTesti: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const S = SAHNE;

  // ── hangi duygu, hangi geçiş ──
  let duygu: Duygu = 'mutlu';
  let onceki: Duygu | undefined;
  let gecis = 1;
  if (f >= S.heyecanGecisBas) {
    duygu = 'heyecanli';
    onceki = 'dusunceli';
    gecis = aralik(f, S.heyecanGecisBas, S.heyecanGecisBit);
  } else if (f >= S.dusunGecisBas) {
    duygu = 'dusunceli';
    onceki = 'mutlu';
    gecis = aralik(f, S.dusunGecisBas, S.dusunGecisBit);
  }
  const taban = onceki ? karistirPoz(DUYGULAR[onceki].poz, DUYGULAR[duygu].poz, gecis) : DUYGULAR[duygu].poz;

  // ── poz katmanları ──
  let poz: Poz = taban;
  // 1) yürüme → mutlu pozuna yumuşak karışım
  const yurumeAgirlik = 1 - aralik(f, S.yurumeBitis - 6, S.ziplamaBas + 6);
  if (yurumeAgirlik > 0) poz = karistirPoz(poz, yurumePozu(f, poz), yurumeAgirlik);

  // 2) sevinç zıplaması: çömel → yüksel → in → yaylan
  if (f < S.dusunGecisBit) {
    const z = interpolate(
      f,
      [S.ziplamaBas, S.ziplamaBas + 6, S.ziplamaBas + 18, S.ziplamaBit - 6, S.ziplamaBit, S.ziplamaBit + 6],
      [0, -10, 90, 10, -6, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)},
    );
    const zAgirlik = 1 - yurumeAgirlik;
    poz = {...poz, ziplama: poz.ziplama * yurumeAgirlik + z * zAgirlik};
    // yere inince bacakları düzelt (mutlu pozunun havadaki bacakları yerde kalmasın)
    const yerde = aralik(f, S.ziplamaBit - 8, S.ziplamaBit + 2);
    poz = karistirPoz(poz, {...poz, bacakSol: [6, 0], bacakSag: [6, 0]}, yerde);
  }

  // 3) düşünürken kafa hafifçe sallanır
  if (f >= S.dusunGecisBas && f < S.heyecanGecisBit) {
    const w = aralik(f, S.dusunGecisBas, S.dusunGecisBit) * (1 - aralik(f, S.heyecanGecisBas, S.heyecanGecisBit));
    poz = {...poz, kafaEgim: poz.kafaEgim + w * 4 * Math.sin((f / fps) * Math.PI * 1.2)};
  }

  // 4) heyecanlı zıplamalar (her biri tam döngü, yere tam temasla)
  if (f >= S.heyecanGecisBas) {
    const w = aralik(f, S.heyecanGecisBas, S.heyecanGecisBit);
    const t = Math.max(0, f - S.heyecanGecisBit + 8);
    const sekme = Math.abs(Math.sin((t / fps) * Math.PI * 2.2));
    const salla = Math.sin((t / fps) * Math.PI * 4.4);
    poz = {
      ...poz,
      ziplama: w * 44 * sekme,
      bacakSol: [poz.bacakSol[0] * (1 - w + w * sekme), poz.bacakSol[1] * (1 - w + w * sekme)],
      bacakSag: [poz.bacakSag[0] * (1 - w + w * sekme), poz.bacakSag[1] * (1 - w + w * sekme)],
      kafaEgim: poz.kafaEgim + w * 5 * salla,
      kolSol: [poz.kolSol[0] + w * 10 * salla, poz.kolSol[1]],
      kolSag: [poz.kolSag[0] - w * 10 * salla, poz.kolSag[1]],
    };
  }

  // ── yerleşim ──
  const K = 640; // karakter genişliği (px), viewBox 240 → ölçek 2.667
  const olcek = K / 240;
  const ayakY = 1560;
  const giris = interpolate(f, [0, S.yurumeBitis], [-420, width / 2], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const solX = giris - K / 2;
  const ustY = ayakY - 300 * olcek;
  const kafaX = giris; // kafa merkezi
  const kafaY = ustY + (78 - poz.ziplama) * olcek;

  // etiketler
  const e1 = 1 - aralik(f, S.dusunGecisBas, S.dusunGecisBas + 10);
  const e2 = aralik(f, S.dusunGecisBas + 6, S.dusunGecisBit) * (1 - aralik(f, S.heyecanGecisBas, S.heyecanGecisBas + 10));
  const e3 = aralik(f, S.heyecanGecisBas + 6, S.heyecanGecisBit);

  const balon = interpolate(f, [S.dusunGecisBit + 6, S.dusunGecisBit + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const balonCik = 1 - aralik(f, S.fikir - 4, S.fikir + 4);
  const ampul = spring({frame: f - S.fikir, fps, config: {damping: 9, stiffness: 160}});
  const ampulCik = 1 - aralik(f, S.heyecanGecisBit + 20, S.heyecanGecisBit + 30);

  return (
    <AbsoluteFill>
      <Kagit />
      <Etiket yazi="MUTLU" opak={e1 * interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'})} y={0} />
      <Etiket yazi="DÜŞÜNCELİ" opak={e2} y={(1 - e2) * 20} />
      <Etiket yazi="HEYECANLI" opak={e3} y={(1 - e3) * 20} />

      {balon > 0 && balonCik > 0 && (
        <div style={{position: 'absolute', left: kafaX + 70, top: kafaY - 390, opacity: balonCik}}>
          <DusunceBalonu u={balon} />
        </div>
      )}
      {f >= S.fikir && ampulCik > 0 && (
        <div style={{position: 'absolute', left: kafaX - 120, top: kafaY - 470, opacity: ampulCik}}>
          <Ampul olcek={ampul} parilti={interpolate(f, [S.fikir + 4, S.fikir + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        </div>
      )}

      <div style={{position: 'absolute', left: solX, top: ustY}}>
        <Karakter
          duygu={duygu}
          onceki={onceki}
          gecis={gecis}
          poz={poz}
          kirpma={kirpma(f)}
          zaman={f}
          width={K}
          height={320 * olcek}
        />
      </div>
    </AbsoluteFill>
  );
};
