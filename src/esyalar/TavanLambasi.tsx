import React from 'react';
import { ESYA, kontur, detay } from './stil';

/** Tavan lambası: (0,0) tavandaki bağlantı, kablo aşağı sarkar. acik: ışık (sarı parıltı). */
export const TavanLambasi: React.FC<{ acik?: boolean; boy?: number }> = ({ acik = true, boy = 150 }) => (
  <g>
    {acik && <ellipse cx="0" cy={boy + 120} rx="260" ry="180" fill="#fff6c4" opacity="0.55" />}
    <path d={`M0 0V${boy}`} {...detay} strokeWidth="4" />
    <rect x="-16" y="-6" width="32" height="10" rx="4" fill={ESYA.dolgu} {...kontur} strokeWidth={4} />
    {/* ampul */}
    <circle cy={boy + 48} r="20" fill={acik ? '#ffe36a' : '#d9dde3'} {...kontur} strokeWidth={4} />
    {/* abajur */}
    <path d={`M-22 ${boy}H22L64 ${boy + 52}H-64Z`} fill={ESYA.dolgu} {...kontur} />
    <path d={`M-50 ${boy + 40}H50`} {...detay} stroke={ESYA.vurgu} strokeWidth="5" />
  </g>
);
