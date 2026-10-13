import React from 'react';
import { ESYA, kontur, detay } from './stil';

// Çekmeceli dolap (önden), zemin y=0, merkez x=0. acik: üst çekmece 0 (kapalı) … 1 (açık, öne çekilmiş).
export const DOLAP = { genislik: 270, yukseklik: 310 } as const;

export const Dolap: React.FC<{ acik?: number; ici?: React.ReactNode }> = ({ acik = 0, ici }) => {
  const h = DOLAP.genislik / 2;
  const ust = -DOLAP.yukseklik;
  const cekmece = (y: number, i: number, a = 0) => (
    <g key={i} transform={`translate(0 ${a * 16}) scale(${1 + a * 0.05})`}>
      <rect x={-h + 18} y={y} width={DOLAP.genislik - 36} height="78" rx="8" fill={ESYA.dolgu} {...kontur} />
      <rect x={-26} y={y + 33} width="52" height="12" rx="6" fill={ESYA.vurgu} {...kontur} strokeWidth={3.5} />
    </g>
  );
  return (
    <g>
      {[-h + 16, h - 30].map((x) => <rect key={x} x={x} y={-24} width="14" height="24" rx="4" fill={ESYA.koyu} {...kontur} strokeWidth={4} />)}
      <rect x={-h} y={ust} width={DOLAP.genislik} height={DOLAP.yukseklik - 20} rx="10" fill={ESYA.dolgu} {...kontur} />
      <rect x={-h - 10} y={ust - 18} width={DOLAP.genislik + 20} height="22" rx="8" fill={ESYA.dolgu} {...kontur} />
      {cekmece(ust + 186, 2)}
      {cekmece(ust + 100, 1)}
      {/* üst çekmece: açılınca içi (koyu) görünür, ön yüz öne/aşağı gelir */}
      {acik > 0 && <rect x={-h + 22} y={ust + 14} width={DOLAP.genislik - 44} height={10 + acik * 22} rx="4" {...detay} fill={ESYA.koyu} />}
      {acik > 0 && ici}
      {cekmece(ust + 14, 0, acik)}
    </g>
  );
};
