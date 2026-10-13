import React from 'react';
import { RENK } from '../karakter/olculer';

// Yandan sandalye (oturak üstü y=-81 = Nod'un oturan uyluk alt kenarı, zemin y=0). Nod ile aynı tarz: kalın siyah kontur, az renk.
// Katman sırası: <SandalyeArka /> → <Nod /> → <SandalyeOn />
const AHSAP = '#c98a4b';
const AHSAP_ACIK = '#e0a868';
const AHSAP_KOYU = '#b5733a';
const cizgi = { stroke: RENK.murekkep, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const Bacak: React.FC<{ x: number; ust: number }> = ({ x, ust }) => (
  <>
    <path d={`M${x} 0V${ust}`} {...cizgi} strokeWidth="11" />
    <path d={`M${x} -2V${ust + 2}`} stroke={AHSAP_KOYU} strokeWidth="4" strokeLinecap="round" />
  </>
);

/** Arkalık, arka bacak, oturak, destek: Nod'un arkasında kalan her şey. */
export const SandalyeArka: React.FC = () => (
  <g>
    <Bacak x={-40} ust={-232} />
    <rect x="-50" y="-215" width="16" height="100" rx="5" fill={AHSAP} {...cizgi} strokeWidth="4.5" />
    <path d="M-46 -205V-125" stroke={AHSAP_ACIK} strokeWidth="2" />
    <path d="M-40 -32H48" {...cizgi} strokeWidth="6" />
    <path d="M-40 -32H48" stroke={AHSAP_KOYU} strokeWidth="1.5" />
    <rect x="-52" y="-81" width="110" height="13" rx="5" fill={AHSAP} {...cizgi} strokeWidth="4.5" />
    <path d="M-46 -77H52" stroke={AHSAP_ACIK} strokeWidth="2" />
  </g>
);

/** Ön bacak: Nod'un önünde. */
export const SandalyeOn: React.FC = () => (
  <g>
    <Bacak x={48} ust={-70} />
  </g>
);
