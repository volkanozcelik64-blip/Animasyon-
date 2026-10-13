import React from 'react';
import { ESYA, kontur, detay } from './stil';

/** Açık laptop (önden), (0,0) masaya değen alt orta. ekran: 0..1 ekran parlaklığı. */
export const Laptop: React.FC<{ ekran?: number }> = ({ ekran = 1 }) => (
  <g>
    {/* ekran kapağı */}
    <rect x="-46" y="-78" width="92" height="66" rx="7" fill={ESYA.dolgu} {...kontur} />
    <rect x="-38" y="-70" width="76" height="50" rx="4" {...detay} fill={ESYA.vurguAcik} opacity={0.4 + 0.6 * ekran} />
    <path d="M-28 -58L-14 -66M-30 -48L-6 -62" {...detay} stroke="#ffffff" strokeWidth="3" />
    <circle cx="0" cy="-16" r="1.6" fill={ESYA.koyu} />
    {/* gövde (klavye kenarı) */}
    <path d="M-56 -12H56L62 -2Q62 2 58 2H-58Q-62 2 -62 -2Z" fill={ESYA.dolgu} {...kontur} />
    <path d="M-10 -7H10" {...detay} />
  </g>
);
