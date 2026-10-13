import React from 'react';
import { RENK, OLCU } from '../karakter/olculer';

// Yandan sandalye, zemin y=0. Oturak üstü, oturan Nod'un uyluk alt kenarına denk gelir
// (baldır dik, ayak yerde): Nod'un ölçüleri değişirse sandalye de uyar.
// Katman sırası: <SandalyeArka /> → <Nod /> → <SandalyeOn />
export const OTURAK_Y = -(OLCU.altBacak - OLCU.bilekY) + OLCU.bacakKalinlik / 2;

const AHSAP = '#c98a4b';
const AHSAP_ACIK = '#e0a868';
const AHSAP_KOYU = '#b5733a';
const cizgi = { stroke: RENK.murekkep, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const Bacak: React.FC<{ x: number; ust: number }> = ({ x, ust }) => (
  <>
    <path d={`M${x} 0V${ust}`} {...cizgi} strokeWidth="12" />
    <path d={`M${x} -2V${ust + 2}`} stroke={AHSAP_KOYU} strokeWidth="4.5" strokeLinecap="round" />
  </>
);

const Y = OTURAK_Y;

/** Arkalık, arka bacak, oturak, destek: Nod'un arkasında kalan her şey. */
export const SandalyeArka: React.FC = () => (
  <g>
    <Bacak x={-48} ust={Y - 150} />
    <rect x="-59" y={Y - 132} width="18" height="110" rx="6" fill={AHSAP} {...cizgi} strokeWidth="5" />
    <path d={`M-54 ${Y - 122}V${Y - 32}`} stroke={AHSAP_ACIK} strokeWidth="2.2" />
    <path d={`M-48 ${Y * 0.38}H44`} {...cizgi} strokeWidth="7" />
    <path d={`M-48 ${Y * 0.38}H44`} stroke={AHSAP_KOYU} strokeWidth="2" />
    <rect x="-62" y={Y} width="118" height="15" rx="6" fill={AHSAP} {...cizgi} strokeWidth="5" />
    <path d={`M-55 ${Y + 4}H49`} stroke={AHSAP_ACIK} strokeWidth="2.2" />
  </g>
);

/** Ön bacak: Nod'un önünde. */
export const SandalyeOn: React.FC = () => (
  <g>
    <Bacak x={44} ust={Y + 12} />
  </g>
);
