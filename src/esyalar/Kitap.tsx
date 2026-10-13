import React from 'react';
import { ESYA, kontur, detay } from './stil';

/** Kapalı kitap (dik, hafif 3/4), (0,0) alt orta. renk: kapak sırtı (az renk). */
export const Kitap: React.FC<{ renk?: string }> = ({ renk = ESYA.vurgu }) => (
  <g>
    {/* sayfa bloğu (sağ kenar) */}
    <path d="M26 -78L36 -72V0L26 -6Z" fill={ESYA.dolgu} {...kontur} />
    <path d="M30 -70V-6M33 -68V-3" {...detay} strokeWidth="1.4" />
    {/* ön kapak */}
    <rect x="-30" y="-80" width="58" height="80" rx="4" fill={ESYA.dolgu} {...kontur} />
    {/* sırt şeridi */}
    <rect x="-30" y="-80" width="12" height="80" rx="4" fill={renk} {...kontur} />
    {/* başlık çizgileri */}
    <path d="M-10 -62H18M-10 -54H10" {...detay} />
    <rect x="-8" y="-36" width="24" height="18" rx="3" {...detay} fill="none" />
  </g>
);
