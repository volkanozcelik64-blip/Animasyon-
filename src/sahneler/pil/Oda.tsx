// "1% Battery" odası: 5 bölümün hepsinde AYNI set (tek oda, her çekim bu odaya bakan bir kamera).
// Soldan sağa: kanepe → çekmeceli dolap → duvar prizi (zemine yakın); tavan lambası üstte, ortada.
// Dünya birimi = Nod birimi; zemin y=0, yukarı negatif.
import React from 'react';
import { RENK } from '../../karakter/olculer';
import { Kanepe } from '../../esyalar/Kanepe';
import { Dolap } from '../../esyalar/Dolap';
import { Priz } from '../../esyalar/Priz';
import { TavanLambasi } from '../../esyalar/TavanLambasi';

export const ODA = {
  kanepeX: 0,
  oturX: -70, // Nod'un kanepede oturduğu kalça x'i
  dolapX: 900,
  dolapOnu: 790, // dolabın önünde durduğu yer (kalça)
  prizX: 1560, prizY: -40,
  lambaX: 680, tavanY: -1180, // lamba kanepe ile priz arasının ortasında
  yatX: 1212, yatY: -24, // yüzüstü/sırtüstü kalça
} as const;

/** Duvar, tavan, süpürgelik, zemin. */
export const OdaDuvar: React.FC = () => (
  <g>
    <rect x={-1400} y={ODA.tavanY} width={4400} height={-ODA.tavanY} fill="#ffffff" />
    <rect x={-1400} y={ODA.tavanY - 40} width={4400} height={40} fill="#f2f4f7" />
    <path d={`M-1400 ${ODA.tavanY}H3000`} stroke={RENK.murekkep} strokeWidth={5} />
    <rect x={-1400} y={0} width={4400} height={700} fill="#eef1f5" />
    <rect x={-1400} y={-18} width={4400} height={18} fill="#ffffff" stroke={RENK.murekkep} strokeWidth={4} />
    <path d="M-1400 0H3000" stroke={RENK.murekkep} strokeWidth={5} />
  </g>
);

export interface OdaProps {
  lambaAcik?: boolean;
  minderler?: [boolean, boolean];
  /** çekmece açıklığı 0..1 */
  cekmece?: number;
}

/** Odanın tamamı (Nod'un arkasında kalan katman). */
export const Oda: React.FC<OdaProps> = ({ lambaAcik = true, minderler = [true, true], cekmece = 0 }) => (
  <g>
    <OdaDuvar />
    <g transform={`translate(${ODA.lambaX} ${ODA.tavanY})`}><TavanLambasi acik={lambaAcik} boy={160} /></g>
    <g transform={`translate(${ODA.kanepeX} 0)`}><Kanepe minderler={minderler} /></g>
    <g transform={`translate(${ODA.dolapX} 0)`}><Dolap acik={cekmece} /></g>
    <g transform={`translate(${ODA.prizX} ${ODA.prizY})`}><Priz /></g>
  </g>
);
