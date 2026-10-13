import React from 'react';
import { RENK } from '../karakter/olculer';

/** Fikir ampulü: Nod tarzında kalın siyah kontur, az renk. (0,0) ampulün dibi.
 *  parlama: 0..1 (belirme/ışık çizgileri). */
export const Ampul: React.FC<{ parlama?: number }> = ({ parlama = 1 }) => {
  const k = RENK.murekkep;
  const s = 0.6 + 0.4 * parlama;
  return (
    <g transform={`scale(${s})`} opacity={Math.min(1, parlama * 1.5)} strokeLinejoin="round" strokeLinecap="round">
      {/* ışık çizgileri */}
      <g stroke={k} strokeWidth="3.4" opacity={parlama}>
        <path d="M0 -58V-68M-26 -48L-33 -55M26 -48L33 -55M-36 -26H-46M36 -26H46" />
      </g>
      {/* cam */}
      <path d="M-10 -6C-10 -14 -22 -18 -22 -32A22 22 0 0 1 22 -32C22 -18 10 -14 10 -6Z" fill="#ffe36a" stroke={k} strokeWidth="4" />
      <path d="M-12 -34A13 13 0 0 1 -2 -46" stroke="#fff6c4" strokeWidth="4" fill="none" />
      <path d="M-4 -8L-6 -22L0 -18L6 -22L4 -8" stroke="#c99a1c" strokeWidth="2" fill="none" />
      {/* duy */}
      <rect x="-10" y="-7" width="20" height="12" rx="3" fill="#b9bfc9" stroke={k} strokeWidth="3.4" />
      <path d="M-9 -1H9" stroke={k} strokeWidth="1.8" />
      <path d="M-5 5Q0 10 5 5" fill="#6d7380" stroke={k} strokeWidth="3" />
    </g>
  );
};
