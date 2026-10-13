import React from 'react';
import { ESYA, kontur, detay } from './stil';

/** Telefon (önden), (0,0) merkez. Elde tutmak için <Nod sagNesne={<Telefon olcek={0.5} />} /> ile kullanılabilir. */
export const Telefon: React.FC<{ olcek?: number; ekranAcik?: boolean }> = ({ olcek = 1, ekranAcik = true }) => (
  <g transform={`scale(${olcek})`}>
    <rect x="-18" y="-34" width="36" height="68" rx="8" fill={ESYA.dolgu} {...kontur} />
    <rect x="-12" y="-26" width="24" height="48" rx="3" {...detay} fill={ekranAcik ? ESYA.vurguAcik : ESYA.koyu} />
    {ekranAcik && <path d="M-7 -18L1 -23M-8 -10L5 -18" {...detay} stroke="#ffffff" strokeWidth="2.6" />}
    <path d="M-4 28H4" {...detay} />
  </g>
);
