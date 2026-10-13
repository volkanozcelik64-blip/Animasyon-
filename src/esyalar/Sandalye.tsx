import React from 'react';
import { OLCU } from '../karakter/olculer';
import { ESYA, kontur, detay } from './stil';

// Yandan sandalye, zemin y=0. Oturak üstü, oturan Nod'un uyluk alt kenarına denk gelir
// (baldır dik, ayak yerde): Nod'un ölçüleri değişirse sandalye de uyar.
// Katman sırası (§7): <SandalyeArka /> → <Nod /> → <SandalyeOn />
export const OTURAK_Y = -(OLCU.altBacak - OLCU.bilekY) + OLCU.bacakKalinlik / 2;
const Y = OTURAK_Y;

const Bacak: React.FC<{ x: number; ust: number }> = ({ x, ust }) => (
  <rect x={x - 6} y={ust} width="12" height={-ust} rx="4" fill={ESYA.dolgu} {...kontur} />
);

/** Arkalık, arka bacak, oturak, destek: Nod'un arkasında kalan her şey. */
export const SandalyeArka: React.FC = () => (
  <g>
    <Bacak x={-48} ust={Y - 150} />
    <rect x="-60" y={Y - 132} width="20" height="110" rx="7" fill={ESYA.dolgu} {...kontur} />
    <path d={`M-50 ${Y - 120}V${Y - 34}`} {...detay} stroke={ESYA.golge} strokeWidth="5" />
    <rect x="-48" y={Y * 0.38 - 4} width="92" height="8" rx="3" fill={ESYA.dolgu} {...kontur} />
    {/* oturak + minder (az renk) */}
    <rect x="-62" y={Y} width="118" height="15" rx="6" fill={ESYA.dolgu} {...kontur} />
    <rect x="-58" y={Y - 9} width="108" height="11" rx="5" fill={ESYA.vurguAcik} {...kontur} strokeWidth={3.5} />
  </g>
);

/** Ön bacak: Nod'un önünde. */
export const SandalyeOn: React.FC = () => <Bacak x={44} ust={Y + 15} />;

/** Tek parça (Nod oturmuyorken). */
export const Sandalye: React.FC = () => (
  <g>
    <SandalyeArka />
    <SandalyeOn />
  </g>
);
