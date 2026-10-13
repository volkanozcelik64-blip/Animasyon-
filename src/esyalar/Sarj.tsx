import React from 'react';
import { random } from 'remotion';
import { ESYA, kontur } from './stil';

type V = { x: number; y: number };

/** Şarj aleti (adaptör) yandan: gövde + priz pimleri; (0,0) pimlerin ucu, pimler +x yönünde. */
export const Adaptor: React.FC = () => (
  <g>
    <rect x="-44" y="-20" width="32" height="40" rx="6" fill={ESYA.dolgu} {...kontur} />
    <rect x="-14" y="-12" width="9" height="24" rx="3" fill={ESYA.dolgu} {...kontur} strokeWidth={3.5} />
    {[-6, 6].map((y) => <rect key={y} x="-6" y={y - 2.5} width="7" height="5" rx="2" fill="#b9bfc9" stroke="#141414" strokeWidth="2" />)}
    <path d="M-36 -8V8" stroke={ESYA.vurgu} strokeWidth="3" strokeLinecap="round" />
  </g>
);

/** Kablo ucu (fiş): 'usbc' küçük (telefona uyar), 'usba' büyük (uymaz). (0,0) ucun burnu, uç +x yönünde. */
export const KabloUcu: React.FC<{ tur?: 'usbc' | 'usba' }> = ({ tur = 'usbc' }) => {
  const b = tur === 'usba' ? { gL: 26, gH: 18, mL: 16, mH: 13 } : { gL: 18, gH: 11, mL: 8, mH: 5 };
  return (
    <g>
      <rect x={-b.gL - b.mL} y={-b.gH / 2} width={b.gL} height={b.gH} rx="4" fill={ESYA.dolgu} {...kontur} strokeWidth={3.5} />
      <rect x={-b.mL} y={-b.mH / 2} width={b.mL} height={b.mH} rx={tur === 'usba' ? 1 : 2.5} fill="#b9bfc9" stroke="#141414" strokeWidth="2.4" />
      {tur === 'usba' && <rect x={-b.mL + 3} y={-2} width={b.mL - 6} height="4" fill="#3B8FD9" />}
    </g>
  );
};

/** Kablo: noktalardan geçen yumuşak eğri (siyah kontur + beyaz iç). */
export const Kablo: React.FC<{ noktalar: V[]; kalinlik?: number }> = ({ noktalar, kalinlik = 7 }) => {
  if (noktalar.length < 2) return null;
  let d = `M${noktalar[0].x} ${noktalar[0].y}`;
  for (let i = 1; i < noktalar.length; i++) {
    const a = noktalar[i - 1], b = noktalar[i];
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    d += i === 1 ? `L${m.x} ${m.y}` : `Q${a.x} ${a.y} ${m.x} ${m.y}`;
  }
  const son = noktalar[noktalar.length - 1];
  d += `L${son.x} ${son.y}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#141414" strokeWidth={kalinlik + 5} />
      <path d={d} stroke="#ffffff" strokeWidth={kalinlik} />
    </g>
  );
};

/** Düğümlü kablo yumağı: (0,0) merkez, r yarıçap. Rastgelelik random(seed) ile, her karede aynı. */
export const KabloYumagi: React.FC<{ r?: number; tohum?: string }> = ({ r = 64, tohum = 'yumak' }) => {
  const halkalar = Array.from({ length: 16 }, (_, i) => {
    const q = (k: string) => random(`${tohum}-${i}-${k}`);
    const a = q('a') * Math.PI * 2;
    const p = (s: number, j: string) => ({ x: Math.cos(a + s) * r * (0.35 + 0.6 * q(j)), y: Math.sin(a + s) * r * (0.35 + 0.6 * q(j + 'y')) });
    const p0 = p(0, 'p0'), p1 = p(2.2, 'p1'), p2 = p(4.1, 'p2');
    return { d: `M${p0.x} ${p0.y}C${p1.x * 1.6} ${p1.y * 1.6} ${p2.x * 1.6} ${p2.y * 1.6} ${p0.x * -0.4} ${p0.y * 0.7}`, renk: i % 5 === 0 ? '#3B8FD9' : i % 7 === 0 ? '#141414' : '#ffffff' };
  });
  return (
    <g fill="none" strokeLinecap="round">
      {halkalar.map((h, i) => <path key={`k${i}`} d={h.d} stroke="#141414" strokeWidth="11" />)}
      {halkalar.map((h, i) => <path key={`b${i}`} d={h.d} stroke={h.renk === '#141414' ? '#4b4d5e' : h.renk} strokeWidth="6" />)}
    </g>
  );
};
