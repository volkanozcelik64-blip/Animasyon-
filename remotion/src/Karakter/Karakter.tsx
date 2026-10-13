import React, {useId} from 'react';
import {DUYGULAR, Duygu, Ekstra, GEO, Poz, Yuz as YuzTanimi, karistirPoz} from './pozlar';

// Stil: siyah el çizimi kontur, beyaz dolgu, yanakta hafif pembe.
export const MUREKKEP = '#1d1b1b';
const BEYAZ = '#ffffff';
const KONTUR = 3.4;
const INCE = 2.4;
const YANAK = '#f59aac';
const YAS = '#5fb2e6';

export type KarakterProps = {
  duygu: Duygu;
  /** Geçiş yapılan önceki duygu; `gecis` 0→1 giderken pozlar ve yüzler karışır. */
  onceki?: Duygu;
  gecis?: number;
  /** Duygunun pozunun üstüne yazılan açılar (yürüme, el sallama vb.). */
  poz?: Partial<Poz>;
  /** Göz kırpma 0 (açık) .. 1 (kapalı). */
  kirpma?: number;
  /** Kare sayısı: pırıltı, zzz, buhar gibi süslerin kendi küçük hareketleri için. */
  zaman?: number;
  /** El çizimi titrek çizgi (SVG displacement). */
  elCizimi?: boolean;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
};

const p = (n: number) => n.toFixed(2);

// ───────────────────────────── uzuvlar ─────────────────────────────

/** Kol: omuzdan dirseğe, dirsekten ele; sağ taraf aynalanır. */
const Kol: React.FC<{taraf: 'sol' | 'sag'; aci: [number, number]}> = ({taraf, aci}) => {
  const o = taraf === 'sol' ? GEO.omuzSol : GEO.omuzSag;
  return (
    <g className={`kol kol-${taraf}`} transform={`translate(${o.x} ${o.y}) scale(${taraf === 'sol' ? 1 : -1} 1)`}>
      <g className="ust-kol" transform={`rotate(${p(aci[0])})`}>
        <line x1={0} y1={0} x2={0} y2={GEO.ustKol} />
        <g className="on-kol" transform={`translate(0 ${GEO.ustKol}) rotate(${p(aci[1])})`}>
          <line x1={0} y1={0} x2={0} y2={GEO.onKol} />
          <circle className="el" cx={0} cy={GEO.onKol + 1} r={5.2} fill={BEYAZ} strokeWidth={INCE} />
        </g>
      </g>
    </g>
  );
};

/** Bacak: kalçadan dize, dizden ayağa; ayak dışa bakan kısa bir çizgi. */
const Bacak: React.FC<{taraf: 'sol' | 'sag'; aci: [number, number]}> = ({taraf, aci}) => {
  const k = taraf === 'sol' ? GEO.kalcaSol : GEO.kalcaSag;
  return (
    <g className={`bacak bacak-${taraf}`} transform={`translate(${k.x} ${k.y}) scale(${taraf === 'sol' ? 1 : -1} 1)`}>
      <g className="uyluk" transform={`rotate(${p(aci[0])})`}>
        <line x1={0} y1={0} x2={0} y2={GEO.uyluk} />
        <g className="baldir" transform={`translate(0 ${GEO.uyluk}) rotate(${p(aci[1])})`}>
          <path d={`M0 0 L0 ${GEO.baldir} q-2 3 -8 3`} fill="none" />
        </g>
      </g>
    </g>
  );
};

const Govde: React.FC = () => (
  <path
    className="govde"
    d="M107 122 C104 150 106 178 109 200 L131 200 C134 178 136 150 133 122 Z"
    fill={BEYAZ}
  />
);

// ───────────────────────────── yüz ─────────────────────────────

const Goz: React.FC<{tip: YuzTanimi['goz']; x: number; bx: number; by: number; kirpma: number; ayna: boolean}> = ({
  tip,
  x,
  bx,
  by,
  kirpma,
  ayna,
}) => {
  const y = -2;
  const acik = Math.max(0.06, 1 - kirpma);
  const kapaliCizgi = <path d={`M${x - 7} ${y} Q${x} ${y + 4} ${x + 7} ${y}`} fill="none" strokeWidth={2.8} />;
  // kırpma neredeyse tamsa her göz tipi kapalı çizgiye döner
  if (kirpma > 0.85 && tip !== 'mutluKapali' && tip !== 'kapali' && tip !== 'sikili') return kapaliCizgi;
  const s = (el: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(1 ${p(acik)}) translate(${-x} ${-y})`}>{el}</g>
  );
  switch (tip) {
    case 'nokta':
      return s(
        <g stroke="none">
          <ellipse cx={x + bx * 2.5} cy={y + by * 2.5} rx={4.3} ry={5.6} fill={MUREKKEP} />
          <circle cx={x + bx * 2.5 + 1.5} cy={y + by * 2.5 - 2} r={1.4} fill={BEYAZ} />
        </g>,
      );
    case 'mutluKapali':
      return <path d={`M${x - 8} ${y + 3} Q${x} ${y - 8} ${x + 8} ${y + 3}`} fill="none" strokeWidth={3} />;
    case 'genis':
      return s(
        <g>
          <circle cx={x} cy={y - 1} r={10} fill={BEYAZ} strokeWidth={2.4} />
          <circle cx={x + bx * 4} cy={y - 1 + by * 4} r={4.6} fill={MUREKKEP} stroke="none" />
          <circle cx={x + bx * 4 + 1.6} cy={y - 3 + by * 4} r={1.4} fill={BEYAZ} stroke="none" />
        </g>,
      );
    case 'parlak':
      return s(
        <g stroke="none">
          <circle cx={x} cy={y - 1} r={10.5} fill={MUREKKEP} stroke="#f2c230" strokeWidth={1.6} />
          <circle cx={x + 3} cy={y - 4.5} r={3.6} fill={BEYAZ} />
          <circle cx={x - 3.5} cy={y + 3.5} r={1.7} fill={BEYAZ} />
        </g>,
      );
    case 'kapali':
      return kapaliCizgi;
    case 'yarim':
      return (
        <g>
          <path d={`M${x - 7} ${y - 1} A7 7 0 0 0 ${x + 7} ${y - 1} Z`} fill={MUREKKEP} stroke="none" />
          <path d={`M${x - 9} ${y - 1.5} L${x + 9} ${y - 1.5}`} strokeWidth={2.6} />
          <path d={`M${x - 7} ${y + 10} Q${x} ${y + 13} ${x + 7} ${y + 10}`} fill="none" strokeWidth={1.4} opacity={0.6} />
        </g>
      );
    case 'sikili': {
      const d = ayna ? -1 : 1;
      return (
        <path
          d={`M${x - 8 * d} ${y - 4} Q${x + 2 * d} ${y - 1} ${x + 7 * d} ${y + 2} M${x - 7 * d} ${y + 3} L${x + 7 * d} ${y + 2}`}
          fill="none"
          strokeWidth={2.6}
        />
      );
    }
    case 'spiral':
      return (
        <path
          d={`M${x} ${y} m0 -1 a1.5 1.5 0 1 1 -1.5 1.5 a3.5 3.5 0 1 1 3.5 3.5 a5.5 5.5 0 1 1 -5.5 -5.5 a7.5 7.5 0 1 1 7.5 7.5`}
          fill="none"
          strokeWidth={1.7}
        />
      );
    case 'kisik':
      return s(
        <path
          d={`M${x - 6} ${y - 1} Q${x} ${y - 3} ${x + 6} ${y - 1} Q${x + 1} ${y + 6} ${x - 6} ${y - 1} Z`}
          fill={MUREKKEP}
          strokeWidth={1.5}
        />,
      );
    case 'yan':
      return s(
        <g>
          <path d={`M${x - 9} ${y - 1} Q${x} ${y + 9} ${x + 9} ${y - 1} Z`} fill={BEYAZ} strokeWidth={2.2} />
          <circle cx={x + bx * 5} cy={y + 2.5} r={3.4} fill={MUREKKEP} stroke="none" />
          <path d={`M${x - 10} ${y - 1.5} L${x + 10} ${y - 1.5}`} strokeWidth={2.8} />
        </g>,
      );
  }
};

const Kas: React.FC<{tip: YuzTanimi['kas']}> = ({tip}) => {
  // sol kaş için yol; sağ kaş aynası (x → -x)
  const yollar: Record<YuzTanimi['kas'], [string, string] | null> = {
    yok: null,
    endiseli: ['M-25 -14 Q-18 -17 -10 -21', 'M25 -14 Q18 -17 10 -21'],
    cokEndiseli: ['M-26 -12 Q-18 -15 -9 -23', 'M26 -12 Q18 -15 9 -23'],
    kizgin: ['M-27 -22 Q-18 -18 -8 -12', 'M27 -22 Q18 -18 8 -12'],
    kalkik: ['M-25 -18 Q-17 -26 -9 -19', 'M25 -18 Q17 -26 9 -19'],
    tekKalkik: ['M-25 -15 Q-17 -17 -9 -15', 'M25 -21 Q17 -28 9 -20'],
  };
  const y = yollar[tip];
  if (!y) return null;
  return (
    <g className="kaslar" fill="none" strokeWidth={2.6}>
      <path d={y[0]} />
      <path d={y[1]} />
    </g>
  );
};

const Agiz: React.FC<{tip: YuzTanimi['agiz']}> = ({tip}) => {
  const ic = '#3a1d1f';
  const dil = '#ec6f78';
  switch (tip) {
    case 'kocamanGulus':
      return (
        <g>
          <path d="M-19 12 Q0 16 19 12 Q15 37 0 38 Q-15 37 -19 12 Z" fill={ic} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M-17 13.5 Q0 17 17 13.5 L16 18 Q0 21 -16 18 Z" fill={BEYAZ} stroke="none" />
          <path d="M-10 33 Q0 26 10 33 Q5 37.5 0 37.5 Q-5 37.5 -10 33 Z" fill={dil} stroke="none" />
        </g>
      );
    case 'gulus':
      return (
        <g>
          <path d="M-13 15 Q0 18 13 15 Q10 32 0 33 Q-10 32 -13 15 Z" fill={ic} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M-7 29.5 Q0 24 7 29.5 Q3 32.5 0 32.5 Q-3 32.5 -7 29.5 Z" fill={dil} stroke="none" />
        </g>
      );
    case 'gulumseme':
      return <path d="M-12 18 Q0 29 12 18" fill="none" strokeWidth={2.6} />;
    case 'o':
      return (
        <g>
          <ellipse cx={0} cy={25} rx={7.5} ry={9.5} fill={ic} strokeWidth={2.4} />
          <ellipse cx={0} cy={30} rx={4.5} ry={3} fill={dil} stroke="none" />
        </g>
      );
    case 'kucukO':
      return <ellipse cx={0} cy={25} rx={3.6} ry={4.2} fill={ic} strokeWidth={2} />;
    case 'uzgun':
      return <path d="M-10 27 Q0 19 10 27" fill="none" strokeWidth={2.6} />;
    case 'dalgali':
      return <path d="M-13 25 q3.25 -4 6.5 0 t6.5 0 t6.5 0 t6.5 0" fill="none" strokeWidth={2.4} />;
    case 'aglama':
      return (
        <g>
          <path d="M-17 32 Q-12 14 0 14 Q12 14 17 32 Q0 27 -17 32 Z" fill={ic} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M-9 30 Q0 25 9 30 Q0 29 -9 30 Z" fill={dil} stroke="none" />
          <path d="M-11 17 Q0 15 11 17" fill="none" stroke={BEYAZ} strokeWidth={3} />
        </g>
      );
    case 'duz':
      return <path d="M-8 25 Q0 24 8 25.5" fill="none" strokeWidth={2.6} />;
    case 'sirit':
      return <path d="M-8 25 Q4 27 13 19" fill="none" strokeWidth={2.6} />;
    case 'hirs':
      return (
        <g>
          <path d="M-12 29 Q0 19 12 29" fill="none" strokeWidth={2.8} />
          <path d="M-5 22 L-3 25 M5 22 L3 25" fill="none" strokeWidth={1.4} />
        </g>
      );
  }
};

const YuzRengi: React.FC<{renk: YuzTanimi['renk']; id: string}> = ({renk, id}) => {
  if (renk === 'yok') return null;
  const R = GEO.kafa.r;
  return <circle cx={0} cy={0} r={R - 1.5} fill={`url(#${id}-${renk})`} stroke="none" />;
};

const Yanaklar: React.FC<{opak: number; id: string; tarama: boolean}> = ({opak, id, tarama}) => (
  <g className="yanaklar" stroke="none">
    {opak > 0 && (
      <g filter={`url(#${id}-yumusak)`} opacity={opak}>
        <ellipse cx={-29} cy={12} rx={9.5} ry={5.5} fill={YANAK} />
        <ellipse cx={29} cy={12} rx={9.5} ry={5.5} fill={YANAK} />
      </g>
    )}
    {tarama && (
      <g stroke="#d9435a" strokeWidth={1.3} fill="none" opacity={0.85}>
        {[-35, -31, -27, -23].map((x) => (
          <path key={`s${x}`} d={`M${x} 16 L${x + 4} 8`} />
        ))}
        {[23, 27, 31, 35].map((x) => (
          <path key={`r${x}`} d={`M${x} 16 L${x + 4} 8`} />
        ))}
      </g>
    )}
  </g>
);

// ───────────────────────────── süsler ─────────────────────────────

const Yildiz: React.FC<{x: number; y: number; r: number; renk?: string}> = ({x, y, r, renk = '#f5cf3a'}) => {
  const k = r * 0.28;
  return (
    <path
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`}
      fill={renk}
      strokeWidth={1.6}
    />
  );
};

const Bulut: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M-12 4 Q-16 -4 -8 -6 Q-6 -13 2 -10 Q9 -14 12 -6 Q19 -3 14 4 Q10 9 2 7 Q-6 10 -12 4 Z"
      fill={BEYAZ}
      strokeWidth={2}
    />
  </g>
);

/** Kafaya bağlı süsler (kafa merkezi = 0,0). */
const Ekstralar: React.FC<{liste: Ekstra[]; t: number}> = ({liste, t}) => {
  const var_ = (e: Ekstra) => liste.includes(e);
  const dalga = (hz: number, faz = 0) => Math.sin((t / 30) * Math.PI * 2 * hz + faz);
  return (
    <g className="ekstralar">
      {var_('gozyasi') && <path d="M18 8 q-3 6 0 8 q3 -2 0 -8 Z" fill={YAS} strokeWidth={1.2} />}
      {var_('akanYas') && (
        <g>
          <path d="M-20 2 Q-24 18 -21 34 L-15 34 Q-15 18 -14 4 Z" fill={YAS} strokeWidth={1.4} opacity={0.95} />
          <path d="M20 2 Q24 18 21 34 L15 34 Q15 18 14 4 Z" fill={YAS} strokeWidth={1.4} opacity={0.95} />
          {[0, 1].map((i) => {
            const u = ((t / 18 + i * 0.5) % 1 + 1) % 1;
            return (
              <g key={i} opacity={1 - u}>
                <path d={`M${-40 - u * 14} ${10 + u * 20} q-3 5 0 7 q3 -2 0 -7 Z`} fill={YAS} strokeWidth={1} />
                <path d={`M${40 + u * 14} ${10 + u * 20} q-3 5 0 7 q3 -2 0 -7 Z`} fill={YAS} strokeWidth={1} />
              </g>
            );
          })}
        </g>
      )}
      {var_('ter') && <path d="M-40 -34 q-6 10 0 13 q6 -3 0 -13 Z" fill={YAS} strokeWidth={1.6} />}
      {var_('titreme') && (
        <g fill="none" strokeWidth={1.6}>
          <path d="M-58 -10 q-4 6 0 12 M-63 -14 q-5 10 0 20" />
          <path d="M58 -10 q4 6 0 12 M63 -14 q5 10 0 20" />
        </g>
      )}
      {var_('pirilti') && (
        <g>
          <g transform={`rotate(${dalga(0.7) * 8} -52 -42)`}>
            <Yildiz x={-52} y={-42} r={9 + dalga(1.3) * 1.5} />
          </g>
          <Yildiz x={56} y={-36} r={8 + dalga(1.1, 1) * 1.5} />
          <Yildiz x={44} y={-58} r={5 + dalga(1.7, 2)} />
          <Yildiz x={-62} y={-14} r={4 + dalga(1.5, 3)} />
        </g>
      )}
      {var_('soru') && (
        <g transform={`translate(44 ${-72 + dalga(0.5) * 2}) rotate(10)`} fill="none" strokeWidth={3}>
          <path d="M-7 -6 Q-7 -16 1 -16 Q9 -16 9 -8 Q9 -2 2 1 Q0 3 0 8" />
          <circle cx={0} cy={15} r={1.6} fill={MUREKKEP} />
        </g>
      )}
      {var_('zzz') &&
        [0, 1, 2].map((i) => {
          const u = ((t / 45 + i / 3) % 1 + 1) % 1;
          const s = 0.6 + u * 0.7;
          return (
            <path
              key={i}
              transform={`translate(${36 + u * 22} ${-44 - u * 36}) scale(${s})`}
              d="M-6 -6 L6 -6 L-6 6 L6 6"
              fill="none"
              strokeWidth={2.6}
              opacity={Math.min(1, (1 - u) * 3)}
            />
          );
        })}
      {var_('yildizKalp') && (
        <g>
          <Yildiz x={-40} y={-56} r={8} />
          <Yildiz x={42} y={-56} r={8} />
          <Yildiz x={-56} y={-30} r={5} />
          <Yildiz x={58} y={-30} r={5} />
          <path
            transform={`translate(0 ${-72 + dalga(1) * 2})`}
            d="M0 6 C-14 -4 -9 -14 0 -7 C9 -14 14 -4 0 6 Z"
            fill="#e8474f"
            strokeWidth={1.8}
          />
        </g>
      )}
      {var_('buhar') && (
        <g>
          <Bulut x={-66 - (dalga(1) + 1) * 2} y={4} s={0.9} />
          <Bulut x={66 + (dalga(1, 1) + 1) * 2} y={-6} s={0.9} />
        </g>
      )}
      {var_('ofke') && (
        <g transform="translate(-30 -50)" fill="none" stroke="#d6283a" strokeWidth={2.4}>
          <path d="M-7 -2 Q-2 -2 -2 -7 M7 -2 Q2 -2 2 -7 M-7 2 Q-2 2 -2 7 M7 2 Q2 2 2 7" />
        </g>
      )}
      {var_('sinirCizgileri') && (
        <g fill="none" strokeWidth={1.8}>
          <path d="M54 -20 L64 -26 M56 -12 L68 -12 M54 -4 L64 2" />
        </g>
      )}
      {var_('bas') && (
        <g transform={`translate(-34 -56) rotate(${t * 6})`} fill="none" strokeWidth={1.6}>
          <path d="M0 0 m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0 a8 4 0 1 1 -16 0" />
        </g>
      )}
      {var_('termometre') && (
        <g transform="translate(66 -20) rotate(8)">
          <rect x={-4.5} y={-34} width={9} height={36} rx={4.5} fill={BEYAZ} strokeWidth={2} />
          <rect x={-1.6} y={-20} width={3.2} height={22} fill="#e2404a" stroke="none" />
          <circle cx={0} cy={6} r={7} fill="#e2404a" strokeWidth={2} />
        </g>
      )}
      {var_('sapka') && (
        <g className="sapka">
          <path d="M-66 -22 Q-30 -36 0 -34 Q30 -36 66 -24 Q40 -16 0 -18 Q-40 -16 -66 -22 Z" fill="#c9c6c0" strokeWidth={2.6} />
          <path d="M-36 -26 Q-38 -62 -12 -64 Q0 -56 12 -64 Q38 -62 36 -26 Q0 -20 -36 -26 Z" fill="#d9d6cf" strokeWidth={2.6} />
          <path d="M-35 -32 Q0 -26 35 -32 L35 -27 Q0 -21 -35 -27 Z" fill="#3b3a3a" strokeWidth={1.8} />
        </g>
      )}
      {var_('sevincCizgileri') && (
        <g fill="none" strokeWidth={2.2}>
          <path d="M-46 -60 L-54 -72 M0 -64 L0 -80 M46 -60 L54 -72" />
        </g>
      )}
    </g>
  );
};

/** Bir duygunun yüz katmanı (kafa merkezine göre). */
const YuzKatmani: React.FC<{yuz: YuzTanimi; poz: Poz; kirpma: number; t: number; id: string; opak: number}> = ({
  yuz,
  poz,
  kirpma,
  t,
  id,
  opak,
}) => {
  if (opak <= 0.001) return null;
  return (
    <g className="yuz" opacity={opak}>
      <YuzRengi renk={yuz.renk} id={id} />
      <Yanaklar opak={yuz.yanak} id={id} tarama={yuz.ekstralar.includes('tarama')} />
      <g className="gozler">
        <Goz tip={yuz.goz} x={-17} bx={poz.bakisX} by={poz.bakisY} kirpma={kirpma} ayna={false} />
        <Goz tip={yuz.goz} x={17} bx={poz.bakisX} by={poz.bakisY} kirpma={kirpma} ayna />
      </g>
      <Kas tip={yuz.kas} />
      <g className="agiz">
        <Agiz tip={yuz.agiz} />
      </g>
      <Ekstralar liste={yuz.ekstralar} t={t} />
    </g>
  );
};

// ───────────────────────────── karakter ─────────────────────────────

export const Karakter: React.FC<KarakterProps> = ({
  duygu,
  onceki,
  gecis = 1,
  poz: pozEk,
  kirpma = 0,
  zaman = 0,
  elCizimi = true,
  width,
  height,
  style,
}) => {
  const id = 'k' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const simdi = DUYGULAR[duygu];
  const once = onceki ? DUYGULAR[onceki] : undefined;
  const g = once ? Math.max(0, Math.min(1, gecis)) : 1;
  const tabanPoz = once ? karistirPoz(once.poz, simdi.poz, g) : simdi.poz;
  const poz: Poz = {...tabanPoz, ...pozEk};

  const {kafa} = GEO;
  const boyun = {x: 120, y: 124};
  const zipla = poz.ziplama;
  const golgeVar = simdi.yuz.ekstralar.includes('golge') || once?.yuz.ekstralar.includes('golge') || zipla > 1;
  const golgeOlcek = Math.max(0.45, 1 - Math.max(0, zipla) / 90);

  return (
    <svg viewBox="0 0 240 320" width={width} height={height} style={{overflow: 'visible', ...style}}>
      <defs>
        <filter id={`${id}-el`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.4} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-yumusak`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <radialGradient id={`${id}-kirmizi`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ff4d4d" stopOpacity={0.75} />
          <stop offset="70%" stopColor="#ff7b7b" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ffb0a8" stopOpacity={0.15} />
        </radialGradient>
        <radialGradient id={`${id}-pembe`} cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor="#ff8fa3" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffc2cc" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-mavi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6e93c6" stopOpacity={0.85} />
          <stop offset="55%" stopColor="#a9c3e3" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#dfe9f5" stopOpacity={0.1} />
        </linearGradient>
        <radialGradient id={`${id}-mor`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#8a87a4" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#3f3b58" stopOpacity={0.95} />
        </radialGradient>
      </defs>

      {golgeVar && (
        <ellipse
          className="golge"
          cx={120}
          cy={GEO.zemin + 4}
          rx={30 * golgeOlcek}
          ry={5 * golgeOlcek}
          fill="#000"
          opacity={0.12}
        />
      )}

      <g
        filter={elCizimi ? `url(#${id}-el)` : undefined}
        stroke={MUREKKEP}
        strokeWidth={KONTUR}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <g className="karakter" transform={`translate(0 ${p(-zipla)}) rotate(${p(poz.govdeEgim)} 120 ${GEO.zemin})`}>
          <g className="bacaklar">
            <Bacak taraf="sol" aci={poz.bacakSol} />
            <Bacak taraf="sag" aci={poz.bacakSag} />
          </g>
          <Govde />
          <g className="kafa" transform={`rotate(${p(poz.kafaEgim)} ${boyun.x} ${boyun.y})`}>
            <circle cx={kafa.x} cy={kafa.y} r={kafa.r} fill={BEYAZ} />
            <g transform={`translate(${kafa.x} ${kafa.y})`}>
              {once && <YuzKatmani yuz={once.yuz} poz={poz} kirpma={kirpma} t={zaman} id={id} opak={1 - g} />}
              <YuzKatmani yuz={simdi.yuz} poz={poz} kirpma={kirpma} t={zaman} id={id} opak={g} />
            </g>
          </g>
          <g className="kollar">
            <Kol taraf="sol" aci={poz.kolSol} />
            <Kol taraf="sag" aci={poz.kolSag} />
          </g>
        </g>
      </g>
    </svg>
  );
};
