import React from 'react';
import { RENK, OLCU, CIZGI } from './olculer';
import { seritYolu, type AtkiSekli } from './atkiTepki';

import type { GorunusAdi } from './olculer';
export type Gorunus = GorunusAdi;
/** cene: düşünme eli — işaret parmağı yanakta, başparmak çenenin altında (çeneyi tutar). */
export type ElPozu = 'acik' | 'yumruk' | 'isaret' | 'salla' | 'tut' | 'cene';

// ---------------------------------------------------------------- defs
// Örgü dokusu: koyu ince ilmek çizgileri + açık ilmek noktaları.
export const Tanimlar: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <pattern id={`${id}-orgu`} width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill={RENK.atki} />
      <path d="M0 0.5L2.5 4.5L5 0.5" fill="none" stroke={RENK.atkiKoyu} strokeWidth="0.9" />
      <path d="M0.9 0.6L2.5 3.1L4.1 0.6" fill="none" stroke={RENK.atkiAcik} strokeWidth="0.6" opacity="0.8" />
    </pattern>
    <pattern id={`${id}-orguK`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
      <rect width="5" height="5" fill={RENK.atki} />
      <path d="M0 0.5L2.5 4.5L5 0.5" fill="none" stroke={RENK.atkiKoyu} strokeWidth="0.9" />
      <path d="M0.9 0.6L2.5 3.1L4.1 0.6" fill="none" stroke={RENK.atkiAcik} strokeWidth="0.6" opacity="0.8" />
    </pattern>
    <radialGradient id={`${id}-kizgin`} cx="0.5" cy="0.38" r="0.6">
      <stop offset="0" stopColor={RENK.kizginKirmizi} stopOpacity="0.85" />
      <stop offset="0.55" stopColor={RENK.kizginKirmizi} stopOpacity="0.35" />
      <stop offset="1" stopColor={RENK.kizginKirmizi} stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`${id}-korku`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={RENK.korkuMavi} stopOpacity="1" />
      <stop offset="0.6" stopColor={RENK.korkuMavi} stopOpacity="0.45" />
      <stop offset="1" stopColor={RENK.korkuMavi} stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${id}-yanak`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={RENK.yanak} stopOpacity="0.9" />
      <stop offset="1" stopColor={RENK.yanak} stopOpacity="0" />
    </radialGradient>
    <clipPath id={`${id}-kafa`}>
      <circle r={OLCU.kafaR} />
    </clipPath>
  </defs>
);

// ---------------------------------------------------------------- eldiven
// Bilek (0,0), el +y yönünde uzanır. s: başparmak tarafı (+1 / -1).
type Sekil =
  | { t: 'c'; x: number; y: number; r: number }
  | { t: 'k'; x1: number; y1: number; x2: number; y2: number; w: number };
type Parca = Sekil & { kat: 'alt' | 'birlesik' | 'ust' };

const O = CIZGI.eldiven; // eldiven kontur kalınlığı

function sekilCiz(s: Sekil, fill: string, ek: number, key: string) {
  if (s.t === 'c') return <circle key={key} cx={s.x} cy={s.y} r={s.r + ek} fill={fill} />;
  return (
    <line key={key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={fill}
      strokeWidth={s.w + 2 * ek} strokeLinecap="round" />
  );
}

function elParcalari(poz: ElPozu, s: number): Parca[] {
  const avuc: Parca = { t: 'c', x: 0, y: 15, r: 10.5, kat: 'birlesik' };
  switch (poz) {
    case 'acik':
      // dinlenen el: parmaklar bitişik (eldiven), başparmak gövdeye dönük, araları çentikle ayrılır
      return [
        { t: 'k', x1: -1.5 * s, y1: 10, x2: -2 * s, y2: 25, w: 18.5, kat: 'birlesik' },
        { t: 'k', x1: 7.5 * s, y1: 14, x2: 8.5 * s, y2: 24, w: 6.5, kat: 'ust' },
      ];
    case 'salla':
      return [
        { t: 'k', x1: -6, y1: 19, x2: -13, y2: 32, w: 7, kat: 'alt' },
        { t: 'k', x1: 6, y1: 19, x2: 13, y2: 32, w: 7, kat: 'alt' },
        { t: 'k', x1: 0, y1: 21, x2: 0, y2: 36, w: 7, kat: 'alt' },
        avuc,
        { t: 'k', x1: 6 * s, y1: 12, x2: 19 * s, y2: 13, w: 7, kat: 'birlesik' },
      ];
    case 'yumruk':
      return [
        { t: 'c', x: 0, y: 14, r: 11.5, kat: 'birlesik' },
        { t: 'k', x1: -5, y1: 22, x2: 5, y2: 22, w: 13, kat: 'birlesik' },
        { t: 'k', x1: 10 * s, y1: 12, x2: 0, y2: 18, w: 6.5, kat: 'ust' },
      ];
    case 'isaret':
      return [
        { t: 'k', x1: -5 * s, y1: 24, x2: -5 * s, y2: 42, w: 7, kat: 'alt' },
        { t: 'c', x: 0, y: 14, r: 11.5, kat: 'birlesik' },
        { t: 'k', x1: -5, y1: 22, x2: 5, y2: 22, w: 13, kat: 'birlesik' },
        { t: 'k', x1: 10 * s, y1: 12, x2: 0, y2: 18, w: 6.5, kat: 'ust' },
      ];
    case 'cene':
      return [
        // işaret parmağı dış yanda yukarı (yanak boyunca), başparmak içe doğru yatay (çenenin altı): L biçimi
        { t: 'k', x1: -5 * s, y1: 22, x2: -9 * s, y2: 40, w: 7, kat: 'alt' },
        { t: 'c', x: 0, y: 14, r: 11.5, kat: 'birlesik' },
        { t: 'k', x1: -5, y1: 22, x2: 5, y2: 22, w: 13, kat: 'birlesik' },
        { t: 'k', x1: 8 * s, y1: 20, x2: 17 * s, y2: 24, w: 6.5, kat: 'ust' },
      ];
    case 'tut':
      return [
        { t: 'c', x: 0, y: 15, r: 11, kat: 'birlesik' },
        // nesne avuç ile parmaklar arasına çizilir (bkz. El)
        { t: 'k', x1: -9 * s, y1: 20, x2: 3 * s, y2: 20, w: 6.5, kat: 'ust' },
        { t: 'k', x1: -9 * s, y1: 26, x2: 3 * s, y2: 26, w: 6.5, kat: 'ust' },
        { t: 'k', x1: -8 * s, y1: 32, x2: 2 * s, y2: 31, w: 6.5, kat: 'ust' },
        { t: 'k', x1: 9 * s, y1: 12, x2: 6 * s, y2: 23, w: 6.5, kat: 'ust' },
      ];
  }
}

/** Tutulan nesne (varsayılan: kalem). El yerel koordinatında, y≈26 hizasında yatay. */
export const Kalem: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`translate(0 26) scale(${s} 1)`}>
    <path d="M-30 -4H14L24 0L14 4H-30Z" fill="#f5c542" stroke={RENK.murekkep} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M14 -4L24 0L14 4Z" fill="#f2d7a8" stroke={RENK.murekkep} strokeWidth="2" strokeLinejoin="round" />
    <path d="M21 -1.2L24 0L21 1.2Z" fill={RENK.murekkep} />
    <rect x="-36" y="-4" width="7" height="8" rx="2" fill="#f08c9a" stroke={RENK.murekkep} strokeWidth="2.2" />
  </g>
);

export const El: React.FC<{ poz: ElPozu; s?: number; nesne?: React.ReactNode }> = ({ poz, s = 1, nesne }) => {
  const p = elParcalari(poz, s);
  const alt = p.filter((x) => x.kat === 'alt');
  const bir = p.filter((x) => x.kat === 'birlesik');
  const ust = p.filter((x) => x.kat === 'ust');
  return (
    <g>
      {/* 1) tek parça siyah siluet */}
      {[...alt, ...bir].map((x, i) => sekilCiz(x, RENK.murekkep, O, `o${i}`))}
      {/* 2) parmaklar tek tek (aralarında çizgi kalsın) */}
      {alt.map((x, i) => (
        <g key={`a${i}`}>
          {sekilCiz(x, RENK.murekkep, O, 'k')}
          {sekilCiz(x, RENK.beyaz, 0, 'b')}
        </g>
      ))}
      {/* 3) avuç + başparmak birleşik beyaz */}
      {bir.map((x, i) => sekilCiz(x, RENK.beyaz, 0, `b${i}`))}
      {poz === 'tut' && (nesne ?? <Kalem s={s} />)}
      {/* 4) üstteki kıvrık parmaklar */}
      {ust.map((x, i) => (
        <g key={`u${i}`}>
          {sekilCiz(x, RENK.murekkep, O, 'k')}
          {sekilCiz(x, RENK.beyaz, 0, 'b')}
        </g>
      ))}
      {/* yumruk: kıvrık parmak çizgileri */}
      {(poz === 'yumruk' || poz === 'isaret' || poz === 'cene') && (
        <path d={poz === 'yumruk' ? 'M-4 21V29M1.5 21.5V29.5M7 21V28' : poz === 'cene' ? `M${2 * s} 21.5V29M${-1.5 * s} 21.5V29.5` : `M${-0.5 * s} 21.5V29.5M${5 * s} 21V28.5`}
          stroke={RENK.murekkep} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {/* eldiven sırt dikişleri (çizgi film eldiveni) */}
      {poz === 'salla' && (
        <path d="M-3 9V15M3 9V15" stroke={RENK.murekkep} strokeWidth={CIZGI.atkiDetay} strokeLinecap="round" opacity="0.8" />
      )}
      {/* bileklik */}
      <rect x="-10" y="-3" width="20" height="10" rx="3" fill={RENK.bileklik}
        stroke={RENK.murekkep} strokeWidth={CIZGI.bileklik} />
      <path d="M-7.5 -0.5H7.5" stroke="#8cc4f2" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- ayakkabı
// Yüksek bilekli spor ayakkabı. Ayak bileği (0,0), zemin y=-OLCU.bilekY (53).
// s: burnun baktığı yön (+1 sağ / -1 sol). Önden bakışta burunlar dışa döner.
export const Ayakkabi: React.FC<{ gorunus: Gorunus; s?: number }> = ({ gorunus, s = 1 }) => {
  const k = RENK.murekkep;
  const w = CIZGI.ayakkabi;
  if (gorunus === 'arka') {
    return (
      <g transform={`translate(0 ${-OLCU.bilekY}) scale(${OLCU.ayakOlcek}) translate(0 ${OLCU.bilekY}) translate(${6 * s} 0)`} strokeLinejoin="round">
        <path d="M-15 12Q-16 6 -10 6L10 6Q16 6 15 12L16 44L-16 44Z" fill={RENK.ayakkabi} stroke={k} strokeWidth={w} />
        <path d="M-5 10H5L4 40H-4Z" fill={RENK.ayakkabiAcik} />
        <path d="M-12 -3Q-12 -7 -8 -7L8 -7Q12 -7 12 -3L12 9L-12 9Z" fill={RENK.ayakkabiYaka} stroke={k} strokeWidth={w} />
        <path d="M-17 43L17 43Q20 43 20 47.5Q20 53 16 53L-16 53Q-20 53 -20 48Q-20 43 -17 43Z" fill={RENK.taban} stroke={k} strokeWidth={w} />
      </g>
    );
  }
  const sx = gorunus === 'ucdort' ? 0.9 : gorunus === 'yan' ? 1.08 : 1;
  return (
    <g transform={`translate(0 ${-OLCU.bilekY}) scale(${OLCU.ayakOlcek}) translate(0 ${OLCU.bilekY}) scale(${sx * s} 1)`} strokeLinejoin="round">
      {/* üst (saya) */}
      <path d="M-17 10Q-18 3 -11 3L8 3Q14 3 14 9L15 25Q25 27 31 36L34 44L-18 44Z" fill={RENK.ayakkabi} stroke={k} strokeWidth={w} />
      {/* topuk tarafı açık panel */}
      <path d="M-15.5 12Q-15.5 8 -11 8L-3 8L-3 42L-16 42Z" fill={RENK.ayakkabiAcik} />
      <circle cx="-9" cy="27" r="4.2" fill={RENK.ayakkabiNokta} stroke={k} strokeWidth="1.2" />
      {/* bağcıklar */}
      <path d="M3 14L12 12.5M4 20L13.5 18.5M5 26L16 25" stroke={RENK.bagcik} strokeWidth="3" strokeLinecap="round" />
      {/* bilek yakası */}
      <path d="M-14 -3Q-14 -7 -10 -7L7 -7Q11 -7 11 -3L11 8L-14 8Z" fill={RENK.ayakkabiYaka} stroke={k} strokeWidth={w} />
      {/* beyaz burun */}
      <path d="M3 27Q20 24 32 35Q38 42 34 46L0 46Q-3 35 3 27Z" fill={RENK.burun} stroke={k} strokeWidth={w} />
      {/* taban */}
      <path d="M-19 43L33 43Q38 43 38 47.5Q38 53 32 53L-15 53Q-20 53 -20 48.5Q-20 43 -19 43Z" fill={RENK.taban} stroke={k} strokeWidth={w} />
    </g>
  );
};

// ---------------------------------------------------------------- atkı
// Boyun merkezi (0,0). Sarılı kısım ve sarkan uç ayrı parçalar.
const ak = { stroke: RENK.atkiKontur, strokeWidth: OLCU.inceKontur, strokeLinejoin: 'round' as const };

/** Sarkan ucun bağlandığı nokta (boyun yerelinde). */
export function atkiUcNoktasi(g: Gorunus): [number, number] {
  if (g === 'yan') return [26, 8];
  if (g === 'arka') return [-13, 10]; // arkadan: ensede düğüm, uç ondan sarkar
  if (g === 'ucdort') return [22, 10];
  return [14, 10];
}

/** Arkadaki yaka bandı + bobinler (kafanın önünde, uçun arkasında). */
export const AtkiSarili: React.FC<{ id: string; gorunus: Gorunus }> = ({ id, gorunus }) => {
  const f = `url(#${id}-orgu)`;
  if (gorunus === 'arka') {
    // arkadan: ense üstünde iki kat sarılı bant, uç ve kıvrım önde kaldığı için görünmez
    return (
      <g>
        <path d="M-46 -6C-50 -26 -20 -30 0 -28C20 -30 50 -26 46 -6C48 14 36 26 0 26C-36 26 -48 14 -46 -6Z" fill={f} {...ak} />
        <path d="M-44 0C-20 8 20 8 44 0" fill="none" stroke={RENK.atkiKontur} strokeWidth="2.2" />
        <path d="M-38 -16C-14 -10 14 -10 38 -16M-40 14C-16 20 16 20 40 14" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
      </g>
    );
  }
  if (gorunus === 'yan') {
    return (
      <g>
        {/* boynu saran bant */}
        <path d="M-26 -12C-28 -26 -6 -30 8 -28C24 -26 30 -16 28 -4C26 10 14 18 -2 18C-18 18 -28 8 -26 -12Z" fill={f} {...ak} />
        <path d="M-24 -2C-12 6 10 6 26 -6" fill="none" stroke={RENK.atkiKoyu} strokeWidth="2" />
        <path d="M-22 10C-10 16 8 16 20 10" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
        <path d="M-20 -20C-8 -14 10 -14 24 -20" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
      </g>
    );
  }
  return (
    <g>
      {/* üst yaka bandı */}
      <path d="M-44 -6C-48 -24 -20 -29 0 -27C20 -29 48 -24 44 -6C38 4 -38 4 -44 -6Z" fill={f} {...ak} />
      <path d="M-36 -14C-14 -9 14 -9 36 -14" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.8" />
      {/* sol ve sağ bobin */}
      <ellipse cx="-33" cy="5" rx="17" ry="17" fill={f} {...ak} />
      <path d="M-44 2C-38 8 -30 10 -20 8M-46 12C-38 18 -30 19 -22 17" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
      <ellipse cx="33" cy="3" rx="17" ry="17" fill={f} {...ak} />
      <path d="M22 0C30 6 38 6 46 0M22 10C30 16 38 16 45 10" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
      {/* alt bant */}
      <path d="M-40 8C-30 27 30 27 40 8C30 16 -30 16 -40 8Z" fill={f} {...ak} />
    </g>
  );
};

/** Çapraz kıvrım (ön) ya da profilde düğüm. Sarkan ucun ÜSTÜNE çizilir, ucun kökünü örter. */
export const AtkiOn: React.FC<{ id: string; gorunus: Gorunus }> = ({ id, gorunus }) => {
  const f = `url(#${id}-orguK)`;
  if (gorunus === 'yan') {
    return (
      <g>
        <path d="M14 -10C24 -16 38 -10 38 2C38 14 26 18 18 14C8 10 6 -4 14 -10Z" fill={f} {...ak} />
        <path d="M18 -6C26 -4 32 2 32 10M14 2C20 4 24 8 26 14" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.6" />
      </g>
    );
  }
  return (
    <g>
      <path d="M-44 -12C-22 -16 10 -4 32 10C38 15 34 25 25 24C4 21 -20 10 -40 8C-50 4 -50 -10 -44 -12Z" fill={f} {...ak} />
      <path d="M-40 -3C-20 -1 6 8 26 18" fill="none" stroke={RENK.atkiKoyu} strokeWidth="1.8" />
      <path d="M-38 -9C-16 -8 6 0 22 9" fill="none" stroke={RENK.atkiAcik} strokeWidth={CIZGI.atkiDetay} opacity="0.8" />
    </g>
  );
};

/** Arkadan görünüşte ensedeki düğüm (sarkan ucun kökünü örter). */
export const AtkiDugumArka: React.FC<{ id: string }> = ({ id }) => (
  <g transform="translate(-13 6)">
    <ellipse cx="-12" cy="-1" rx="15" ry="12" fill={`url(#${id}-orguK)`} {...ak} />
    <ellipse cx="12" cy="0" rx="14" ry="11" fill={`url(#${id}-orguK)`} {...ak} />
    <ellipse cx="0" cy="2" rx="10" ry="11" fill={`url(#${id}-orgu)`} {...ak} />
    <path d="M-4 -3Q0 2 4 -3M-4 4Q0 8 4 4" fill="none" stroke={RENK.atkiKoyu} strokeWidth={CIZGI.atkiDetay} />
  </g>
);

/** Sarkan uç: duyguya göre biçimlenen örgü şerit (bkz. atkiTepki.ts).
 *  Önce kalın kontur, sonra dolgu: kendi üstüne kıvrılınca (kalp, soru işareti) iç çizgiler kaybolmaz ama kopmaz. */
export const AtkiUcu: React.FC<{ id: string; sekil: AtkiSekli }> = ({ id, sekil }) => {
  const { yol, dikis, uc } = seritYolu(sekil);
  const f = `url(#${id}-orgu)`;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={yol} fill={f} stroke={RENK.atkiKontur} strokeWidth={OLCU.inceKontur * 2} />
      <path d={yol} fill={f} />
      <path d={dikis} fill="none" stroke={RENK.atkiKoyu} strokeWidth={CIZGI.atkiDetay} />
      <path d={uc} fill="none" stroke={RENK.atkiKoyu} strokeWidth={CIZGI.atkiDetay} />
      {/* öndeki biçimlerde kök: kıvrımın içinden çıkan küçük düğüm */}
      {sekil.onde && (
        <g>
          <ellipse cx="0" cy="-2" rx="11" ry="9" fill={`url(#${id}-orguK)`} stroke={RENK.atkiKontur} strokeWidth={OLCU.inceKontur} />
          <path d="M-7 -4Q0 1 7 -4" fill="none" stroke={RENK.atkiKoyu} strokeWidth={CIZGI.atkiDetay} />
        </g>
      )}
    </g>
  );
};
