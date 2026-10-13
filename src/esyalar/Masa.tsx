import React from 'react';
import { ESYA, kontur, detay } from './stil';

/** Masa (önden), zemin y=0, üst yüzey y=MASA_Y. Nod'la orantılı: üstü kalça hizasının biraz üstünde. */
export const MASA_Y = -200;

export const Masa: React.FC<{ genislik?: number }> = ({ genislik = 260 }) => {
  const h = genislik / 2;
  return (
    <g>
      {/* bacaklar */}
      <rect x={-h + 8} y={MASA_Y + 20} width="16" height={-MASA_Y - 20} rx="4" fill={ESYA.dolgu} {...kontur} />
      <rect x={h - 24} y={MASA_Y + 20} width="16" height={-MASA_Y - 20} rx="4" fill={ESYA.dolgu} {...kontur} />
      {/* çekmece bloğu */}
      <rect x={h - 98} y={MASA_Y + 18} width="78" height="64" rx="5" fill={ESYA.dolgu} {...kontur} />
      <path d={`M${h - 98} ${MASA_Y + 50}H${h - 20}`} {...detay} />
      <rect x={h - 70} y={MASA_Y + 30} width="22" height="6" rx="3" {...detay} fill={ESYA.vurgu} />
      <rect x={h - 70} y={MASA_Y + 62} width="22" height="6" rx="3" {...detay} fill={ESYA.vurgu} />
      {/* üst tabla */}
      <rect x={-h} y={MASA_Y} width={genislik} height="20" rx="6" fill={ESYA.dolgu} {...kontur} />
      <path d={`M${-h + 10} ${MASA_Y + 14}H${h - 10}`} {...detay} stroke={ESYA.golge} strokeWidth="4" />
    </g>
  );
};
