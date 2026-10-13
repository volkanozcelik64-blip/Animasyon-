import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Karakter} from './Karakter/Karakter';
import {DUYGULAR, Duygu} from './Karakter/pozlar';
import {ETIKET, YAZI} from './font';

// Referans görselin (assets/duygular.png, 1408×768) düzeni. Her figür için görseldeki merkez x'i ve
// zemin çizgisi ölçülmüştür; bizim karakter aynı noktaya, aynı kafa boyutuyla (çap ≈ 66 px) yerleşir.
const REF = {w: 1408, h: 768};
const SATIR = [
  {zemin: 219, etiket: 243},
  {zemin: 393, etiket: 416},
  {zemin: 551, etiket: 570},
  {zemin: 700, etiket: 720},
];
const YERLESIM: {duygu: Duygu; satir: number; x: number; etiketX?: number}[] = [
  {duygu: 'mutlu', satir: 0, x: 345},
  {duygu: 'cok-mutlu', satir: 0, x: 515},
  {duygu: 'heyecanli', satir: 0, x: 695},
  {duygu: 'gulen', satir: 0, x: 851},
  {duygu: 'sok-olmus', satir: 0, x: 998},
  {duygu: 'kizgin', satir: 0, x: 1152, etiketX: 1156},
  {duygu: 'somurtan', satir: 1, x: 349},
  {duygu: 'uzgun', satir: 1, x: 520},
  {duygu: 'aglayan', satir: 1, x: 696},
  {duygu: 'huzunlu', satir: 1, x: 855},
  {duygu: 'hayal-kirikligi', satir: 1, x: 1010},
  {duygu: 'hayal-kirikligi-2', satir: 1, x: 1160},
  {duygu: 'utangac', satir: 2, x: 347},
  {duygu: 'kizarmis', satir: 2, x: 523},
  {duygu: 'mahcup', satir: 2, x: 694, etiketX: 700},
  {duygu: 'kafasi-karisik', satir: 2, x: 862, etiketX: 870},
  {duygu: 'dusunceli', satir: 2, x: 1017},
  {duygu: 'yorgun', satir: 3, x: 350},
  {duygu: 'hasta', satir: 3, x: 520, etiketX: 526},
  {duygu: 'uyuyan', satir: 3, x: 688, etiketX: 700},
  {duygu: 'sinirli', satir: 3, x: 872, etiketX: 877},
  {duygu: 'gizemli', satir: 3, x: 1082},
];
const BIRIM = 0.66; // ref px / karakter birimi (kafa çapı 100 birim → 66 px)
const KAGIT = '#f1f1f0';

/** Referans koordinatını 1920×1080 sahneye taşır (genişliğe sığdır, dikeyde ortala). */
const useOlcek = (w: number, h: number) => {
  const s = Math.min(w / REF.w, h / REF.h);
  return {s, ox: (w - REF.w * s) / 2, oy: (h - REF.h * s) / 2};
};

/** Referans görselin kendisi, aynı ölçek ve konumda (karşılaştırma için). */
export const Referans: React.FC = () => {
  const {s, ox, oy} = useOlcek(1920, 1080);
  return (
    <AbsoluteFill style={{backgroundColor: KAGIT}}>
      <Img src={staticFile('duygular.png')} style={{position: 'absolute', left: ox, top: oy, width: REF.w * s}} />
    </AbsoluteFill>
  );
};

/** Tüm duygular, referans görselle aynı ızgarada. */
export const DuyguIzgarasi: React.FC<{seffaf?: boolean; zaman?: number}> = ({seffaf, zaman = 0}) => {
  const {s, ox, oy} = useOlcek(1920, 1080);
  const k = BIRIM * s; // ekran px / karakter birimi
  return (
    <AbsoluteFill style={{backgroundColor: seffaf ? 'transparent' : KAGIT}}>
      {/* başlık */}
      <div
        style={{
          position: 'absolute',
          left: ox + 58 * s,
          top: oy + 18 * s,
          fontFamily: YAZI,
          fontSize: 40 * s,
          color: '#1d1b1b',
          lineHeight: 1.2,
        }}
      >
        Duygular ve Mimikler
      </div>
      <div
        style={{
          position: 'absolute',
          left: ox + 54 * s,
          top: oy + 71 * s,
          width: 388 * s,
          height: 2 * s,
          background: '#1d1b1b',
          borderRadius: 2,
        }}
      />
      {YERLESIM.map(({duygu, satir, x, etiketX}) => {
        const sat = SATIR[satir];
        return (
          <React.Fragment key={duygu}>
            <div style={{position: 'absolute', left: ox + x * s - 120 * k, top: oy + sat.zemin * s - 300 * k}}>
              <Karakter duygu={duygu} width={240 * k} height={320 * k} zaman={zaman} idle={false} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: ox + (etiketX ?? x) * s - 150,
                width: 300,
                top: oy + sat.etiket * s - 16 * s,
                textAlign: 'center',
                fontFamily: ETIKET,
                fontSize: 23.5 * s,
                color: '#1d1b1b',
                letterSpacing: 0.6,
              }}
            >
              {DUYGULAR[duygu].ad}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/** Duygu başına yan yana: solda referanstan kesilen PNG, sağda SVG karakter. */
export const YanYana: React.FC = () => {
  const SUTUN = 6;
  const W = 1920 / SUTUN;
  const Hc = 1080 / 4;
  const k = 0.96; // ekran px / birim → kafa çapı 96 px
  const refOlcek = 1.45; // referans PNG'de kafa ≈ 66 px → 96 px
  return (
    <AbsoluteFill style={{backgroundColor: KAGIT}}>
      {YERLESIM.map(({duygu}, i) => {
        const x = (i % SUTUN) * W;
        const y = Math.floor(i / SUTUN) * Hc;
        return (
          <div key={duygu} style={{position: 'absolute', left: x, top: y, width: W, height: Hc, borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd'}}>
            <div style={{position: 'absolute', left: 0, width: W / 2, top: 18, bottom: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
              <Img src={staticFile(`emotions/${duygu}.png`)} style={{transform: `scale(${refOlcek})`, transformOrigin: 'bottom center'}} />
            </div>
            <div style={{position: 'absolute', left: (3 * W) / 4 - 120 * k, top: Hc - 34 - 300 * k}}>
              <Karakter duygu={duygu} width={240 * k} height={320 * k} idle={false} />
            </div>
            <div style={{position: 'absolute', bottom: 6, width: '100%', textAlign: 'center', fontFamily: ETIKET, fontSize: 24, color: '#1d1b1b'}}>
              {DUYGULAR[duygu].ad}
              <span style={{color: '#888', fontSize: 18}}> · referans | SVG</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 6 sn: referans ile SVG ızgara arasında yatay perde (wipe) gidip gelir. */
export const Karsilastirma: React.FC = () => {
  const f = useCurrentFrame();
  const perde = interpolate(f, [15, 75, 105, 165], [0, 1920, 1920, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill>
      <Referans />
      <AbsoluteFill style={{clipPath: `inset(0 ${1920 - perde}px 0 0)`}}>
        <DuyguIzgarasi />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: perde - 2, top: 0, width: 4, height: 1080, background: '#e2404a', opacity: perde > 0 && perde < 1920 ? 1 : 0}} />
      <div style={{position: 'absolute', right: 24, bottom: 16, fontFamily: ETIKET, fontSize: 26, color: '#e2404a'}}>
        ◀ SVG | referans ▶
      </div>
    </AbsoluteFill>
  );
};
