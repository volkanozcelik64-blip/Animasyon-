import React from 'react';
import { ESYA, kontur } from './stil';

/** Duvar prizi (önden), (0,0) merkez. Topraklı (iki yuvarlak delik + yan kulaklar). */
export const Priz: React.FC = () => (
  <g>
    <rect x="-30" y="-30" width="60" height="60" rx="12" fill={ESYA.dolgu} {...kontur} />
    <circle r="19" fill={ESYA.golge} {...kontur} strokeWidth={3.5} />
    <circle cx="-7" r="3.6" fill="#141414" />
    <circle cx="7" r="3.6" fill="#141414" />
    <path d="M-3 -16H3M-3 16H3" stroke="#141414" strokeWidth="3" strokeLinecap="round" />
  </g>
);
