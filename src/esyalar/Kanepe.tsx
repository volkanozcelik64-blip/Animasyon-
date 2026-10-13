import React from 'react';
import { ESYA, kontur, detay } from './stil';
import { OTURAK_Y } from './Sandalye';

// Kanepe (önden), zemin y=0, merkez x=0. Minder üstü = Nod'un oturma yüksekliği (diz hizası).
// minderler: iki oturak minderinin yerinde olup olmadığı (fırlatılınca sahne ayrı <Minder /> çizer).
export const KANEPE = { genislik: 470, minderUst: OTURAK_Y, minderKalinlik: 30, minderGen: 196 } as const;

export const Minder: React.FC<{ renk?: string }> = ({ renk = ESYA.vurguAcik }) => (
  <g>
    <rect x={-KANEPE.minderGen / 2} y={0} width={KANEPE.minderGen} height={KANEPE.minderKalinlik} rx="14" fill={renk} {...kontur} />
    <path d={`M${-KANEPE.minderGen / 2 + 16} 10H${KANEPE.minderGen / 2 - 16}`} {...detay} stroke="#ffffff" strokeWidth="4" />
  </g>
);

export const Kanepe: React.FC<{ minderler?: [boolean, boolean] }> = ({ minderler = [true, true] }) => {
  const h = KANEPE.genislik / 2;
  const mu = KANEPE.minderUst;
  const govdeUst = mu + KANEPE.minderKalinlik;
  return (
    <g>
      {/* arkalık */}
      <rect x={-h + 18} y={mu - 170} width={KANEPE.genislik - 36} height={200} rx="34" fill={ESYA.dolgu} {...kontur} />
      <path d={`M${-h + 50} ${mu - 140}Q0 ${mu - 155} ${h - 50} ${mu - 140}`} {...detay} stroke={ESYA.golge} strokeWidth="6" />
      {/* bacaklar */}
      {[-h + 30, h - 44].map((x) => <rect key={x} x={x} y={-30} width="14" height="30" rx="4" fill={ESYA.koyu} {...kontur} strokeWidth={4} />)}
      {/* oturak gövdesi */}
      <rect x={-h + 10} y={govdeUst} width={KANEPE.genislik - 20} height={-govdeUst - 26} rx="14" fill={ESYA.dolgu} {...kontur} />
      {/* minderler */}
      {minderler[0] && <g transform={`translate(${-KANEPE.minderGen / 2 - 2} ${mu})`}><Minder /></g>}
      {minderler[1] && <g transform={`translate(${KANEPE.minderGen / 2 + 2} ${mu})`}><Minder /></g>}
      {/* kolçaklar */}
      {[-1, 1].map((s) => (
        <rect key={s} x={s < 0 ? -h - 6 : h - 44} y={mu - 70} width="50" height={-(mu - 70) - 26} rx="22" fill={ESYA.dolgu} {...kontur} />
      ))}
    </g>
  );
};
