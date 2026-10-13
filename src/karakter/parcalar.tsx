import React from 'react';
import { RENK, OLCU } from './olculer';

export type Gorunus = 'on' | 'ucdort' | 'yan';
export type ElPozu = 'acik' | 'yumruk' | 'isaret' | 'salla' | 'tut';

// ---------------------------------------------------------------- defs
// Örgü dokusu: koyu ince ilmek çizgileri + açık ilmek noktaları.
export const Tanimlar: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <pattern id={`${id}-orgu`} width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill={RENK.atki} />
      <path d="M0 4.6H5M4.6 0V5" stroke={RENK.atkiKoyu} strokeWidth="0.9" />
      <circle cx="2.2" cy="2.2" r="0.9" fill={RENK.atkiAcik} opacity="0.7" />
    </pattern>
    <pattern id={`${id}-orguK`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
      <rect width="5" height="5" fill={RENK.atki} />
      <path d="M0 4.6H5M4.6 0V5" stroke={RENK.atkiKoyu} strokeWidth="0.9" />
      <circle cx="2.2" cy="2.2" r="0.9" fill={RENK.atkiAcik} opacity="0.7" />
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

const O = 2.6; // eldiven kontur kalınlığı

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
      return [
        { t: 'k', x1: -6, y1: 20, x2: -9, y2: 33, w: 7, kat: 'alt' },
        { t: 'k', x1: 6, y1: 20, x2: 9, y2: 33, w: 7, kat: 'alt' },
        { t: 'k', x1: 0, y1: 21, x2: 0, y2: 36, w: 7, kat: 'alt' },
        avuc,
        { t: 'k', x1: 6 * s, y1: 13, x2: 16 * s, y2: 19, w: 7, kat: 'birlesik' },
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
      {(poz === 'yumruk' || poz === 'isaret') && (
        <path d={poz === 'yumruk' ? 'M-4 21V29M1.5 21.5V29.5M7 21V28' : `M${-0.5 * s} 21.5V29.5M${5 * s} 21V28.5`}
          stroke={RENK.murekkep} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {/* eldiven sırt dikişleri (çizgi film eldiveni) */}
      {(poz === 'acik' || poz === 'salla') && (
        <path d="M-3 9V15M3 9V15" stroke={RENK.murekkep} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      )}
      {/* bileklik */}
      <rect x="-9.5" y="-2" width="19" height="9" rx="3.5" fill={RENK.bileklik}
        stroke={RENK.murekkep} strokeWidth="2.4" />
      <path d="M-7 2.5H7" stroke={RENK.bileklikKoyu} strokeWidth="1.3" />
    </g>
  );
};

// ---------------------------------------------------------------- ayakkabı
// Ayak bileği (0,0). Zemin y=+12 (bilek yüksekliği). Yan görünüşte burun +x.
export const Ayakkabi: React.FC<{ gorunus: Gorunus; s?: number }> = ({ gorunus, s = 1 }) => {
  const k = RENK.murekkep;
  if (gorunus === 'on') {
    return (
      <g transform={`translate(${4 * s} 12) scale(1.3) translate(0 -12)`}>
        <path d="M-13 7C-14 -3 -8 -7 0 -7C8 -7 14 -3 13 7Z" fill={RENK.ayakkabi} stroke={k} strokeWidth="3" strokeLinejoin="round" />
        <path d="M-5 -4L5 -4M-6 -0.5L6 -0.5" stroke={RENK.beyaz} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-10 4Q0 0.5 10 4" stroke={RENK.bileklik} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <rect x="-15.5" y="5.5" width="31" height="6.5" rx="3" fill={RENK.taban} stroke={k} strokeWidth="2.8" />
      </g>
    );
  }
  const sx = gorunus === 'ucdort' ? 0.78 : 1;
  return (
    <g transform={`translate(0 12) scale(${1.35 * sx * s} 1.35) translate(-2 -12)`}>
      {/* üst (saya) */}
      <path d="M-13 -6L3 -7C8 -7 10 -2 17 -0.5C26 1 31 3 31 7.5L-14 7.5C-15 2 -15 -2 -13 -6Z"
        fill={RENK.ayakkabi} stroke={k} strokeWidth="3" strokeLinejoin="round" />
      {/* burun kapağı */}
      <path d="M19 0.5C26 1.5 30 3.5 30 7L19 7Z" fill={RENK.ayakkabiAcik} />
      {/* bağcıklar */}
      <path d="M4 -5L8 -1M8 -6L11 -2.5M1 -3L5 0.5" stroke={RENK.beyaz} strokeWidth="1.7" strokeLinecap="round" />
      {/* mavi yan detay */}
      <path d="M-9 4Q4 6 21 1.5" stroke={RENK.bileklik} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* topuk */}
      <path d="M-13.5 -4.5Q-16 0 -14 5" stroke={RENK.bileklik} strokeWidth="2.2" fill="none" />
      {/* taban */}
      <path d="M-15.5 6H31Q34 6 34 9V9.5Q34 12.5 31 12.5H-13Q-16 12.5 -16 9.5V8Q-16 6 -15.5 6Z"
        fill={RENK.taban} stroke={k} strokeWidth="2.8" strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- atkı
// Boyun merkezi (0,0). Sarılı kısım ve sarkan uç ayrı parçalar.
const ak = { stroke: RENK.atkiKontur, strokeWidth: OLCU.inceKontur, strokeLinejoin: 'round' as const };

/** Sarkan ucun bağlandığı nokta (boyun yerelinde). */
export function atkiUcNoktasi(g: Gorunus): [number, number] {
  if (g === 'yan') return [26, 8];
  if (g === 'ucdort') return [22, 10];
  return [14, 10];
}

/** Arkadaki yaka bandı + bobinler (kafanın önünde, uçun arkasında). */
export const AtkiSarili: React.FC<{ id: string; gorunus: Gorunus }> = ({ id, gorunus }) => {
  const f = `url(#${id}-orgu)`;
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
      <path d="M-38 -9C-16 -8 6 0 22 9" fill="none" stroke={RENK.atkiAcik} strokeWidth="1.4" opacity="0.8" />
    </g>
  );
};

/** Sarkan uç: iki bölüm (a1 kökte, a2 alt bölüm), gecikmeli sallanma için.
 *  Önce iki bölümün konturu, sonra dolgusu çizilir: bükülünce ek yeri görünmez, kopmaz. */
export const AtkiUcu: React.FC<{ id: string; a1: number; a2: number; gorunus: Gorunus }> = ({ id, a1, a2, gorunus }) => {
  const f = `url(#${id}-orgu)`;
  const w = gorunus === 'yan' ? 22 : 27;
  const h = w / 2;
  const ust = `M${-h + 0.5} -6L${h - 0.5} -6L${h} 20L${-h} 20Z`;
  const alt = `M${-h} -4L${h} -4L${h - 0.5} 14Q${h - 0.5} 17 ${h - 3.5} 17L${-h + 3} 17Q${-h} 17 ${-h} 14Z`;
  const katman = (dolgu: boolean) => (
    <>
      <path d={ust} fill={f} stroke={dolgu ? 'none' : RENK.atkiKontur} strokeWidth={OLCU.inceKontur * 2} strokeLinejoin="round" />
      <g transform={`translate(0 18) rotate(${a2})`}>
        <path d={alt} fill={f} stroke={dolgu ? 'none' : RENK.atkiKontur} strokeWidth={OLCU.inceKontur * 2} strokeLinejoin="round" />
        {dolgu && <path d={`M${-h + 2} 12H${h - 2}`} stroke={RENK.atkiKoyu} strokeWidth="1.4" />}
        {dolgu && <path d={`M${-h + 4} -2V9`} stroke={RENK.atkiKoyu} strokeWidth="1.4" />}
      </g>
      {dolgu && <path d={`M${-h + 4} 0V18`} stroke={RENK.atkiKoyu} strokeWidth="1.4" />}
    </>
  );
  return (
    <g transform={`rotate(${a1})`}>
      {katman(false)}
      {katman(true)}
    </g>
  );
};
