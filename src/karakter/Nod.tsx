import React from 'react';
import { RENK, OLCU } from './olculer';
import {
  Tanimlar, El, Ayakkabi, AtkiSarili, AtkiOn, AtkiUcu, atkiUcNoktasi,
  type Gorunus, type ElPozu,
} from './parcalar';
import { YuzOzellikleri, YuzTonu, Ekler, type Duygu } from './yuz';
import { AYAKTA, type Poz, type Kol, type Bacak } from './poz';

export type { Gorunus, ElPozu, Duygu, Poz };

interface GorunusAyari {
  yaw: number; // kafa dönüşü (radyan); yüz parçaları küre üstünde kayar
  govdeG: number; // gövde paneli genişliği
  omuzX: { sag: number; sol: number };
  kalcaX: { sag: number; sol: number };
  /** arkada kalan (gövdenin arkasına çizilen) taraf */
  uzak: 'sag' | 'sol' | null;
}

const AYAR: Record<Gorunus, GorunusAyari> = {
  on: { yaw: 0, govdeG: 32, omuzX: { sag: -25, sol: 25 }, kalcaX: { sag: -8, sol: 8 }, uzak: null },
  ucdort: { yaw: 0.55, govdeG: 28, omuzX: { sag: -19, sol: 16 }, kalcaX: { sag: -5, sol: 6 }, uzak: 'sol' },
  yan: { yaw: 0.92, govdeG: 24, omuzX: { sag: 1, sol: -3 }, kalcaX: { sag: 1, sol: -3 }, uzak: 'sol' },
};

// kalça merkezine göre yerel yükseklikler
const BOYUN = OLCU.boyunY - OLCU.kalcaY; // -134
const OMUZ = OLCU.omuzY - OLCU.kalcaY; // -120
const KAFA = OLCU.kafaY - OLCU.kalcaY; // -212

export interface NodProps {
  poz?: Poz;
  gorunus?: Gorunus; // poz verilmezse ayakta pozu bu görünüşte
  duygu?: Duygu;
  /** duygu geçişi: önceki duygu ve 0..1 ilerleme (bkz. duyguAt) */
  oncekiDuygu?: Duygu;
  gecis?: number;
  /** ekler (gözyaşı, ?, zz, kalpler, titreme) için kare sayacı */
  kare?: number;
  /** tut el pozunda tutulan nesne */
  sagNesne?: React.ReactNode;
  solNesne?: React.ReactNode;
  golge?: boolean;
  id?: string;
  x?: number;
  y?: number;
  olcek?: number;
  /** bakış yönü: yan/3/4 görünüşler varsayılan sağa bakar; 'sol' aynalar */
  bak?: 'sag' | 'sol';
  /** pozdaki el şeklini her iki el için ezer */
  el?: ElPozu;
}

// ---------------------------------------------------------------- uzuvlar
const Tup: React.FC<{ L: number; w: number }> = ({ L, w }) => (
  <line x1="0" y1="0" x2="0" y2={L} stroke={RENK.murekkep} strokeWidth={w} strokeLinecap="round" />
);

type KolKatmani = 'tup' | 'el' | 'hepsi';

function KolCiz({ kol, x, s, katman, nesne }: { kol: Kol; x: number; s: number; katman: KolKatmani; nesne?: React.ReactNode }) {
  const tup = katman !== 'el';
  const el = katman !== 'tup';
  return (
    <g transform={`translate(${x} ${OMUZ}) rotate(${kol.omuz})`}>
      {tup && <Tup L={OLCU.ustKol} w={OLCU.kolKalinlik} />}
      <g transform={`translate(0 ${OLCU.ustKol}) rotate(${kol.dirsek})`}>
        {tup && <Tup L={OLCU.onKol} w={OLCU.kolKalinlik} />}
        <g transform={`translate(0 ${OLCU.onKol}) rotate(${kol.bilek})`}>
          {el && <g transform="scale(1.25)"><El poz={kol.el} s={kol.ayna ? -s : s} nesne={nesne} /></g>}
        </g>
      </g>
    </g>
  );
}

function BacakCiz({ bacak, x, s, gorunus }: { bacak: Bacak; x: number; s: number; gorunus: Gorunus }) {
  const ayakDuz = (bacak.ayak ?? 0) - bacak.kalca - bacak.diz;
  return (
    <g transform={`translate(${x} 0) rotate(${bacak.kalca})`}>
      <Tup L={OLCU.ustBacak} w={OLCU.bacakKalinlik} />
      <g transform={`translate(0 ${OLCU.ustBacak}) rotate(${bacak.diz})`}>
        <Tup L={OLCU.altBacak} w={OLCU.bacakKalinlik} />
        <g transform={`translate(0 ${OLCU.altBacak}) rotate(${ayakDuz})`}>
          <Ayakkabi gorunus={gorunus} s={s} />
        </g>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- kafa
const Kafa: React.FC<{ id: string; yaw: number; duygu: Duygu; onceki?: Duygu; t: number; kare: number }> = ({
  id, yaw, duygu, onceki, t, kare,
}) => {
  const R = OLCU.kafaR;
  const sikis = 1 - 0.28 * Math.sin(Math.PI * t); // geçişte yüz hafifçe büzülüp açılır (kırpışma)
  const katman = (d: Duygu, op: number, key: string) =>
    op <= 0.001 ? null : (
      <g key={key} opacity={op}>
        <g clipPath={`url(#${id}-kafa)`}><YuzTonu duygu={d} id={id} /></g>
        <g clipPath={`url(#${id}-kafa)`}><g transform={`translate(0 2) scale(1.12 ${1.12 * sikis})`}><YuzOzellikleri duygu={d} id={id} yaw={yaw} /></g></g>
      </g>
    );
  const ek = (d: Duygu, op: number, key: string) =>
    op <= 0.001 ? null : <g key={key} opacity={op}><Ekler duygu={d} kare={kare} yaw={yaw} /></g>;
  const gecisVar = onceki && onceki !== duygu && t < 1;
  return (
    <g>
      <circle r={R} fill={RENK.beyaz} />
      {/* iç gölge: sol alt kenarda ince gri hilal */}
      <g clipPath={`url(#${id}-kafa)`}>
        <circle r={R} fill={RENK.kafaGolge} />
        <circle cx="5" cy="-6" r={R - 2} fill={RENK.beyaz} />
      </g>
      {gecisVar && katman(onceki!, 1 - t, 'o')}
      {katman(duygu, gecisVar ? t : 1, 'y')}
      <circle r={R} fill="none" stroke={RENK.murekkep} strokeWidth={OLCU.kontur} />
      {gecisVar && ek(onceki!, 1 - t, 'eo')}
      {ek(duygu, gecisVar ? t : 1, 'ey')}
    </g>
  );
};

// ---------------------------------------------------------------- karakter
export const Nod: React.FC<NodProps> = (p) => {
  const id = (p.id ?? 'k').replace(/[^a-zA-Z0-9_-]/g, '');
  const temel = p.poz ?? AYAKTA[p.gorunus ?? 'on'];
  const poz: Poz = p.el ? { ...temel, sagKol: { ...temel.sagKol, el: p.el }, solKol: { ...temel.solKol, el: p.el } } : temel;
  const g = poz.gorunus;
  const A = AYAR[g];
  const duygu = p.duygu ?? 'notr';
  const t = p.gecis ?? 1;
  const kare = p.kare ?? 0;
  const [ux, uy] = atkiUcNoktasi(g);

  // ön görünüşte karakterin sağı ekranın solu: ayakkabı/eldiven yönü
  const sS = g === 'on' ? -1 : 1;
  const sSol = g === 'on' ? 1 : 1;
  // başparmak gövdeye doğru (önde), yanda öne doğru
  const elS = { sag: g === 'on' ? 1 : 1, sol: g === 'on' ? -1 : 1 };

  const bacak = (taraf: 'sag' | 'sol') => (
    <BacakCiz key={`b${taraf}`} bacak={taraf === 'sag' ? poz.sagBacak : poz.solBacak}
      x={A.kalcaX[taraf]} s={taraf === 'sag' ? sS : sSol} gorunus={g} />
  );
  const kol = (taraf: 'sag' | 'sol', katman: KolKatmani) => (
    <KolCiz key={`k${taraf}${katman}`} kol={taraf === 'sag' ? poz.sagKol : poz.solKol} x={A.omuzX[taraf]}
      s={elS[taraf]} katman={katman} nesne={taraf === 'sag' ? p.sagNesne : p.solNesne} />
  );
  const yakin: ('sag' | 'sol')[] = A.uzak ? [A.uzak === 'sag' ? 'sol' : 'sag'] : ['sag', 'sol'];

  const atkiDonus = g === 'ucdort' ? 'translate(4 0) scale(0.78 1)' : g === 'on' ? 'scale(0.88 1)' : '';
  const atkiGorunus: Gorunus = g === 'yan' ? 'yan' : 'on';
  const govdeYari = A.govdeG / 2;

  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.olcek ?? 1) * (p.bak === 'sol' ? -1 : 1)} ${p.olcek ?? 1})`}>
      <Tanimlar id={id} />
      {(p.golge ?? true) && (
        <ellipse cx={poz.kok.x + (g === 'yan' ? 8 : 0)} cy="2" rx={g === 'yan' ? 50 : 56} ry="9" fill={RENK.golge} />
      )}
      <g transform={`translate(${poz.kok.x} ${poz.kok.y})`}>
        {/* arka taraf */}
        {A.uzak && bacak(A.uzak)}
        <g transform={`rotate(${poz.egim})`}>{A.uzak && kol(A.uzak, 'hepsi')}</g>
        {/* bacaklar */}
        {yakin.map((tf) => bacak(tf))}
        <g transform={`rotate(${poz.egim})`}>
          {/* gövde paneli: atkının altından kalçaya */}
          <path
            d={`M${-govdeYari} ${BOYUN + 6}L${govdeYari} ${BOYUN + 6}L${govdeYari - 1} 4Q${govdeYari - 1} 7 ${govdeYari - 4} 7L${-govdeYari + 4} 7Q${-govdeYari + 1} 7 ${-govdeYari + 1} 4Z`}
            fill={RENK.beyaz} stroke={RENK.murekkep} strokeWidth={OLCU.kontur} strokeLinejoin="round" />
          {/* kollar (borular atkının arkasında) */}
          {yakin.map((tf) => kol(tf, 'tup'))}
          {/* kafa */}
          <g transform={`translate(0 ${BOYUN}) rotate(${poz.kafaEgim}) translate(0 ${KAFA - BOYUN})`}>
            <Kafa id={id} yaw={A.yaw} duygu={duygu} onceki={p.oncekiDuygu} t={t} kare={kare} />
          </g>
          {/* atkı: sarılı kısım, sarkan uç, önündeki kıvrım/düğüm */}
          <g transform={`translate(0 ${BOYUN})`}>
            <g transform={atkiDonus}><AtkiSarili id={id} gorunus={atkiGorunus} /></g>
            <g transform={`translate(${g === 'ucdort' ? ux * 0.78 + 4 : g === 'on' ? ux * 0.88 : ux} ${uy})`}>
              <AtkiUcu id={id} a1={poz.atki.a1 - poz.egim} a2={poz.atki.a2} gorunus={g} />
            </g>
            <g transform={atkiDonus}><AtkiOn id={id} gorunus={atkiGorunus} /></g>
          </g>
          {/* eller en önde */}
          {yakin.map((tf) => kol(tf, 'el'))}
        </g>
      </g>
    </g>
  );
};

export default Nod;
