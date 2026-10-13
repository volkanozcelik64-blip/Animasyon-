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

// ---------------------------------------------------------------- akıllı telefon (pil ekranlı)
export type TelefonEkrani = 'video' | 'pil' | 'sarj' | 'karanlik';
export const AKILLI = { gen: 40, yuk: 74 } as const;
const UI = "'DejaVu Sans', 'Liberation Sans', sans-serif";

/**
 * Akıllı telefon (önden), (0,0) merkez; alt kenarda şarj girişi (0, yuk/2).
 * ekran: 'video' (komik video + köşede kırmızı pil), 'pil' (kırmızı pil, büyük "1%", isteğe bağlı "Low Battery"),
 * 'sarj' (şimşek), 'karanlik' (kapkara; yalnız parlayan "1%").
 */
export const AkilliTelefon: React.FC<{ ekran?: TelefonEkrani; uyari?: number; yuzde?: number; parlama?: number }> = ({
  ekran = 'video', uyari = 0, yuzde = 1, parlama = 1,
}) => {
  const W = AKILLI.gen, H = AKILLI.yuk;
  const ek = { x: -W / 2 + 3.5, y: -H / 2 + 7, w: W - 7, h: H - 14 };
  const pilIkon = (x: number, y: number, o: number, renk: string, dolu: number, simsek = false) => (
    <g transform={`translate(${x} ${y}) scale(${o})`}>
      <rect x="-9" y="-4.5" width="18" height="9" rx="2" fill="#fff" stroke="#141414" strokeWidth="1.4" />
      <rect x="9" y="-2" width="2.2" height="4" rx="0.8" fill="#141414" />
      <rect x="-7.6" y="-3.1" width={Math.max(0.8, 15.2 * dolu)} height="6.2" rx="1" fill={renk} />
      {simsek && <path d="M1 -6L-4 1H0L-1 6L4 -1H0Z" fill="#ffd21f" stroke="#141414" strokeWidth="0.8" strokeLinejoin="round" />}
    </g>
  );
  const durumCubugu = (
    <g>
      <text x={ek.x + 2} y={ek.y + 4.6} fontSize="3.6" fontFamily={UI} fontWeight={700} fill="#141414">9:41</text>
      <text x={ek.x + ek.w - 11} y={ek.y + 4.6} fontSize="3.4" fontFamily={UI} fontWeight={700} fill="#e0302a" textAnchor="end">{yuzde}%</text>
      {pilIkon(ek.x + ek.w - 5, ek.y + 3.4, 0.28, '#e0302a', 0.06)}
    </g>
  );
  return (
    <g>
      {ekran === 'karanlik' && parlama > 0 && (
        <ellipse rx={W * 1.4} ry={H * 0.9} fill="#ffffff" opacity={0.08 * parlama} />
      )}
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx="7" fill={ekran === 'karanlik' ? '#0b0b0b' : '#ffffff'}
        stroke={ekran === 'karanlik' ? '#555' : '#141414'} strokeWidth="3.6" />
      <rect x={ek.x} y={ek.y} width={ek.w} height={ek.h} rx="2.5"
        fill={ekran === 'karanlik' ? '#000' : ekran === 'video' ? '#cfe2f5' : '#ffffff'} stroke={ekran === 'karanlik' ? 'none' : '#141414'} strokeWidth="1.2" />
      {ekran === 'video' && (
        <g>
          {durumCubugu}
          {/* komik video: gülen yüz + oynat simgesi */}
          <circle cx="0" cy="-4" r="9" fill="#ffe36a" stroke="#141414" strokeWidth="1.4" />
          <path d="M-4 -6.5Q-3 -8 -2 -6.5M2 -6.5Q3 -8 4 -6.5" stroke="#141414" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <path d="M-5 -2.5Q0 3.5 5 -2.5Z" fill="#5a1818" stroke="#141414" strokeWidth="1" />
          <path d="M-3 14L4 18L-3 22Z" fill="#3B8FD9" />
          <rect x={ek.x + 3} y={ek.y + ek.h - 5} width={ek.w - 6} height="1.6" rx="0.8" fill="#9bb6d3" />
          <rect x={ek.x + 3} y={ek.y + ek.h - 5} width={(ek.w - 6) * 0.6} height="1.6" rx="0.8" fill="#e0302a" />
        </g>
      )}
      {(ekran === 'pil' || ekran === 'sarj') && (
        <g>
          {pilIkon(0, -16, 1.15, ekran === 'sarj' ? '#3cc65a' : '#e0302a', ekran === 'sarj' ? 0.12 : 0.06, ekran === 'sarj')}
          <text x="0" y="8" fontSize="15" fontFamily={UI} fontWeight={800} textAnchor="middle" fill={ekran === 'sarj' ? '#2fa64c' : '#e0302a'}>{yuzde}%</text>
          {ekran === 'sarj' && <text x="0" y="17" fontSize="4" fontFamily={UI} fontWeight={700} textAnchor="middle" fill="#2fa64c">Charging</text>}
          {ekran === 'pil' && uyari > 0 && (
            <g transform={`translate(0 ${18 + (1 - uyari) * 30})`} opacity={uyari}>
              <rect x={-ek.w / 2 + 1} y="-6" width={ek.w - 2} height="12" rx="3" fill="#ffd21f" stroke="#141414" strokeWidth="1.2" />
              <text x="0" y="1.9" fontSize="4.3" fontFamily={UI} fontWeight={800} textAnchor="middle" fill="#141414">Low Battery</text>
            </g>
          )}
        </g>
      )}
      {ekran === 'karanlik' && parlama > 0 && (
        <g opacity={parlama}>
          <text x="0" y="5" fontSize="15" fontFamily={UI} fontWeight={800} textAnchor="middle" fill="#ff5a4f" stroke="#ff5a4f" strokeWidth="0.6">1%</text>
          <text x="0" y="5" fontSize="15" fontFamily={UI} fontWeight={800} textAnchor="middle" fill="#ffd0cc" opacity="0.6">1%</text>
        </g>
      )}
      {/* şarj girişi */}
      <rect x="-4" y={H / 2 - 2.4} width="8" height="2.4" rx="1" fill={ekran === 'karanlik' ? '#333' : '#141414'} />
    </g>
  );
};
