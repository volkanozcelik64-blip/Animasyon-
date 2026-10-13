import React from 'react';
import { OLCU } from '../karakter/olculer';
import { ESYA, kontur, detay } from './stil';

// Yandan sandalye (sağa bakan Nod için), zemin y=0. Masayla aynı kalın kontur.
// Minder üstü = oturan Nod'un uyluk alt kenarı = diz hizası (baldır dik, ayak yerde);
// Nod'un ölçüleri değişirse sandalye de uyar.
// Katman sırası (§7): <SandalyeArka /> → <Nod /> → <SandalyeOn />
export const OTURAK_Y = -(OLCU.altBacak - OLCU.bilekY) + OLCU.bacakKalinlik / 2;
const Y = OTURAK_Y;
const MINDER = 10;
const OTURAK_KALINLIK = 22;
const OTURAK_ALT = Y + MINDER + OTURAK_KALINLIK;

/** Arkalık, arka bacak, oturak, destek: Nod'un arkasında kalan her şey. */
export const SandalyeArka: React.FC = () => (
  <g>
    {/* arka bacak + arkalık dikmesi (tek parça) */}
    <rect x="-58" y={Y - 168} width="20" height={-Y + 168} rx="7" fill={ESYA.dolgu} {...kontur} />
    {/* arkalık paneli (hafif geriye yatık) */}
    <g transform={`rotate(-4 -48 ${Y})`}>
      <rect x="-66" y={Y - 160} width="40" height="108" rx="14" fill={ESYA.dolgu} {...kontur} />
      <path d={`M-56 ${Y - 140}H-36M-56 ${Y - 118}H-36`} {...detay} />
    </g>
    {/* bacaklar arası destek */}
    <rect x="-44" y="-58" width="92" height="12" rx="5" fill={ESYA.dolgu} {...kontur} />
    {/* oturak + minder (az renk) */}
    <rect x="-66" y={Y + MINDER} width="130" height={OTURAK_KALINLIK} rx="9" fill={ESYA.dolgu} {...kontur} />
    <path d={`M-56 ${OTURAK_ALT - 7}H54`} {...detay} stroke={ESYA.golge} strokeWidth="4" />
    <rect x="-60" y={Y} width="118" height={MINDER + 4} rx="6" fill={ESYA.vurguAcik} {...kontur} />
  </g>
);

/** Ön bacak: Nod'un önünde; Nod'un baldırından geride kalır, içinden geçmez. */
export const SandalyeOn: React.FC = () => (
  <rect x="34" y={OTURAK_ALT - 6} width="20" height={-(OTURAK_ALT - 6)} rx="7" fill={ESYA.dolgu} {...kontur} />
);

/** Tek parça (Nod oturmuyorken). */
export const Sandalye: React.FC = () => (
  <g>
    <SandalyeArka />
    <SandalyeOn />
  </g>
);
