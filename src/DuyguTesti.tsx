import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Karakter, MUREKKEP} from './Karakter/Karakter';
import {YAY} from './Karakter/hareket';
import {HareketAdimi, hareketDurumu} from './Karakter/hareketler';
import {Duygu, GEO} from './Karakter/pozlar';
import {Kagit} from './Kagit';
import {YAZI} from './font';

// 10 sn hareket testi (1080×1920, 30 fps). Tüm vücut hareketi <Karakter hareketler={...}> ile:
//   yuru → otur (sandalye) → [düşünceli] → kalk → [heyecanlı] → zipla → zipla
// Duygu geçişleri yay sürüşlü; hareketler birbirinin bıraktığı yerden devam eder (ayaklar kaymaz).

export const ADIMLAR: HareketAdimi[] = [
  {hareket: 'yuru', baslangic: 0, x: -300, mesafe: 300, sure: 66},
  {hareket: 'otur', baslangic: 72},
  {hareket: 'kalk', baslangic: 200},
  {hareket: 'zipla', baslangic: 222, yukseklik: 62},
  {hareket: 'zipla', baslangic: 252, yukseklik: 62},
];

const S = {dusunYuz: 90, fikir: 184, heyecanYuz: 190}; // fikir: düşünce balonu söner

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

const DusunceBalonu: React.FC<{f: number; fps: number}> = ({f, fps}) => (
  <svg viewBox="0 0 200 200" width={300} height={300} style={{overflow: 'visible'}}>
    <g stroke={MUREKKEP} strokeWidth={4} fill="#fff">
      {[
        {x: 20, y: 170, r: 9, d: 0},
        {x: 48, y: 135, r: 14, d: 8},
        {x: 92, y: 88, r: 22, d: 16},
      ].map((b, i) => {
        const s = spring({frame: f - b.d, fps, config: {damping: 9, stiffness: 140}});
        const sal = Math.sin((f + i * 9) / 9) * 2.5;
        return <circle key={i} cx={b.x} cy={b.y + sal} r={b.r * s} />;
      })}
    </g>
  </svg>
);


export const DuyguTesti: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  // ── duygu: yay sürüşlü yüz geçişleri ──
  const yuzGecis = (bas: number) => spring({frame: f - bas, fps, config: YAY.yuz, durationInFrames: 22});
  let duygu: Duygu = 'mutlu';
  let onceki: Duygu | undefined;
  let gecis = 1;
  if (f >= S.heyecanYuz) {
    duygu = 'heyecanli';
    onceki = 'dusunceli';
    gecis = yuzGecis(S.heyecanYuz);
  } else if (f >= S.dusunYuz) {
    duygu = 'dusunceli';
    onceki = 'mutlu';
    gecis = yuzGecis(S.dusunYuz);
  }

  // ── yerleşim: karakter svg'si sabit, gövde içeride hareket eder ──
  const K = 720;
  const u = K / 240;
  const ayakY = 1560;
  const svgSol = width / 2 - 120 * u;
  const svgUst = ayakY - (GEO.zemin - 2) * u;
  const hd = hareketDurumu(ADIMLAR, f, fps);
  const kafaX = svgSol + (120 + hd.gx) * u;
  const kafaY = svgUst + (GEO.kafa.y - hd.ziplama) * u;

  const etiket = (bas: number, bit?: number) => {
    const gir = spring({frame: f - bas, fps, config: {damping: 14, stiffness: 120}});
    const cik = bit === undefined ? 0 : spring({frame: f - bit, fps, config: {damping: 200}, durationInFrames: 10});
    return {opak: gir * (1 - cik), y: (1 - gir) * 30 - cik * 20};
  };
  const e1 = etiket(0, S.dusunYuz - 2);
  const e2 = etiket(S.dusunYuz + 4, S.heyecanYuz - 2);
  const e3 = etiket(S.heyecanYuz + 4);

  const balonBas = S.dusunYuz + 22;
  const balonCik = 1 - spring({frame: f - (S.fikir - 2), fps, config: {damping: 200}, durationInFrames: 8});

  return (
    <AbsoluteFill>
      <Kagit />
      <Etiket yazi="MUTLU" {...e1} />
      <Etiket yazi="DÜŞÜNCELİ" {...e2} />
      <Etiket yazi="HEYECANLI" {...e3} />

      {f >= balonBas && balonCik > 0.001 && (
        <div style={{position: 'absolute', left: kafaX + 80, top: kafaY - 400, opacity: balonCik}}>
          <DusunceBalonu f={f - balonBas} fps={fps} />
        </div>
      )}

      <div style={{position: 'absolute', left: svgSol, top: svgUst}}>
        <Karakter
          duygu={duygu}
          onceki={onceki}
          gecis={gecis}
          hareketler={ADIMLAR}
          tohum="duygu-testi"
          width={K}
          height={320 * u}
        />
      </div>
    </AbsoluteFill>
  );
};
