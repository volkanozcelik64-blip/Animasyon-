import React from 'react';
import { RENK, OLCU, CIZGI, BAKIS, type Agiz, type Bakis } from './olculer';

/** Referanstaki 9 duygu. Ayrıca 'sakin': tam boy referanstaki varsayılan yüz. */
export const DUYGULAR = [
  'mutlu', 'notr', 'heyecanli',
  'uzgun', 'kizgin', 'korkmus',
  'kafasi_karisik', 'uykulu', 'asik',
] as const;
/** Skill'deki ek duygular (yüz + bkz. poz.ts DUYGU_POZLARI). */
export const EK_DUYGULAR = ['dusunceli', 'sasirmis', 'gururlu', 'sikilmis', 'utangac'] as const;
export type Duygu = (typeof DUYGULAR)[number] | (typeof EK_DUYGULAR)[number] | 'sakin';

const R = OLCU.kafaR;
const K = RENK.murekkep;
const cizgi = (w: number = CIZGI.yuz) => ({ stroke: K, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

// ---------------------------------------------------------------- küre izdüşümü
// Yüz parçaları kafa küresinin üstüne yapışık: yaw ile dönünce kayar ve daralır.
type Yerlestir = (ax: number, ay: number, el: React.ReactNode, key: string, yariGen?: number) => React.ReactNode;

function yerlestirici(yaw: number): Yerlestir {
  return (ax, ay, el, key, yariGen = 10) => {
    const r = Math.sqrt(Math.max(1, R * R - ay * ay));
    const phi = Math.asin(Math.max(-1, Math.min(1, ax / r))) + yaw;
    const c = Math.cos(phi);
    if (c < 0.35) return null; // kenara dönmüş parça görünmez
    // yan görünüşte parça kafa konturunun dışına taşmasın (ağız kenara yaslanır)
    const x = Math.min(r * Math.sin(phi), r - 5 - yariGen * c);
    // kenara yaklaşınca hafif soluklaşma yok — düz renk; sadece daralma
    return (
      <g key={key} transform={`translate(${x.toFixed(2)} ${ay}) scale(${c.toFixed(3)} 1)`}>
        {el}
      </g>
    );
  };
}

// ---------------------------------------------------------------- küçük şekiller
const yildiz = (r: number) => `M0 ${-r}Q0 0 ${r} 0Q0 0 0 ${r}Q0 0 ${-r} 0Q0 0 0 ${-r}Z`;
export const kalpYolu = 'M0 7C-3 4.5 -11 -0.5 -11 -5.5C-11 -11 -3.5 -12 0 -6.5C3.5 -12 11 -11 11 -5.5C11 -0.5 3 4.5 0 7Z';

const Yanak: React.FC<{ id: string; tarama?: boolean; op?: number }> = ({ id, tarama, op = 0.9 }) => (
  <g opacity={op}>
    <ellipse rx="10" ry="5.5" fill={`url(#${id}-yanak)`} />
    {tarama && <path d="M-5 2L-2 -2M-1 2L2 -2M3 2L6 -2" stroke="#e8818a" strokeWidth="1.1" strokeLinecap="round" />}
  </g>
);

const Kalp: React.FC<{ olcek?: number }> = ({ olcek = 1 }) => (
  <g transform={`scale(${olcek})`}>
    <path d={kalpYolu} fill={RENK.kalp} stroke="#d93e57" strokeWidth="1.2" />
    <ellipse cx="-5" cy="-6" rx="2.6" ry="1.8" fill={RENK.kalpAcik} transform="rotate(-30 -5 -6)" />
    <circle cx="-6.5" cy="-6.5" r="1" fill="#fff" opacity="0.9" />
  </g>
);

// ---------------------------------------------------------------- 9 yüz
/** Bir duygunun kaş/göz/ağız/yanak çizimi (kafa yerelinde, merkez 0,0). */
/** Gözleri açık nokta olan duygular: bakışta göz bebeği kenara kadar kayar, aşağı bakışta göz kapağı iner. */
const ACIK_GOZ: Duygu[] = ['sakin', 'notr', 'sasirmis', 'dusunceli', 'utangac', 'kafasi_karisik', 'heyecanli'];

function yuzParcalari(d: Duygu, id: string, P: Yerlestir, bak: Bakis, agiz: Agiz): React.ReactNode[] {
  const [bx, by] = bakisKaymasi(bak);
  const acik = ACIK_GOZ.includes(d);
  const kapak = bak === 'asagi' && acik;
  // göz bebekleri (g*) göz alanının kenarına kadar kayar; kapalı/kalp gözler az kayar.
  // Kafanın dönüşü/eğimi (yüzün tamamı) Nod.tsx'te yaw ve dikey kayma olarak eklenir.
  const lid: React.ReactNode[] = [];
  const g = (ax: number, ay: number, el: React.ReactNode, k: string) => {
    if (k === 'a' && agiz !== 'kapali') return null;
    if (k[0] === 'g') {
      const o = acik ? 1 : 0.35;
      if (kapak) lid.push(P(ax, ay, <GozKapagi />, `l${k}`, 11));
      return P(ax + bx * o, ay + by * o, el, k, 11);
    }
    // yukarı bakınca kaşlar kalkar
    const kas = k[0] === 'k' && bak === 'yukari' ? -BAKIS.kasKalkma : 0;
    return P(ax, ay + kas, el, k, ax === 0 ? 26 : 11);
  };
  const konusma = agiz !== 'kapali' ? [P(0, 31, <AgizSekli agiz={agiz} />, 'ka', 20)] : [];
  return [...duyguYuzu(d, id, g), ...lid, ...konusma];
}

/** Aşağı bakışta inik göz kapağı: göz bebeğinin üst kısmını örter. (Göz yuvasının merkezine göre.) */
const GozKapagi: React.FC = () => (
  <g>
    <path d="M-13 -12H13V4Q0 7 -13 4Z" fill="#fff" />
    <path d="M-10 4Q0 7 10 4" {...cizgi(3.4)} />
  </g>
);

export function bakisKaymasi(b: Bakis): [number, number] {
  const k = BAKIS.gozBebegi, v = BAKIS.gozBebegiDikey;
  return b === 'sol' ? [-k, 0] : b === 'sag' ? [k, 0] : b === 'yukari' ? [0, -v] : b === 'asagi' ? [0, v] : [0, 0];
}

/** Kafanın bakış yönüne dönüşü: [yaw ekleme (radyan), yüzün dikey kayması]. */
export function bakisKafa(b: Bakis): [number, number] {
  return b === 'sol' ? [-BAKIS.kafaDonus, 0] : b === 'sag' ? [BAKIS.kafaDonus, 0]
    : b === 'yukari' ? [0, -BAKIS.kafaEgim] : b === 'asagi' ? [0, BAKIS.kafaEgim] : [0, 0];
}

// ---------------------------------------------------------------- konuşma ağızları (§8)
/** 8 ağız şekli; ağız merkezinde (0,0) çizilir, duygunun gözleri/kaşları üstünde kalır. */
export const AgizSekli: React.FC<{ agiz: Agiz }> = ({ agiz }) => {
  const kontur = { stroke: K, strokeWidth: 3.4, strokeLinejoin: 'round' as const };
  switch (agiz) {
    case 'A':
      return (
        <g>
          <path d="M-14 -6Q0 -10 14 -6Q15 12 0 15Q-15 12 -14 -6Z" fill={RENK.agizIc} {...kontur} />
          <path d="M-8 10Q0 4 8 10Q4 13 0 13Q-4 13 -8 10Z" fill={RENK.dil} />
        </g>
      );
    case 'E':
      return (
        <g>
          <path d="M-18 -4Q0 -7 18 -4Q16 9 0 10Q-16 9 -18 -4Z" fill={RENK.agizIc} {...kontur} />
          <path d="M-15 -3Q0 -5 15 -3L14 0.5Q0 2 -14 0.5Z" fill="#fff" />
        </g>
      );
    case 'I':
      return (
        <g>
          <path d="M-17 -3Q0 0 17 -3Q15 6 0 7Q-15 6 -17 -3Z" fill="#fff" {...kontur} />
          <path d="M-15 1.5Q0 3.5 15 1.5" fill="none" stroke={K} strokeWidth="1.6" />
        </g>
      );
    case 'O':
      return <ellipse rx="8" ry="10" fill={RENK.agizIc} {...kontur} />;
    case 'U':
      // öne büzülmüş dudak: O'dan dar ve küçük; pembe dudak halkası + küçük koyu iç + büzülme çizgileri
      return (
        <g>
          <ellipse rx="6" ry="7.5" fill={RENK.dil} stroke={K} strokeWidth="3" />
          <ellipse rx="2.2" ry="3.2" fill={RENK.agizIc} />
          <path d="M-10.5 -2.5L-8 -1M-10.5 2.5L-8 1M10.5 -2.5L8 -1M10.5 2.5L8 1" stroke={K} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case 'MBP':
      return (
        <g>
          <path d="M-11 0Q0 2.5 11 0" {...cizgi(4)} />
          <path d="M-5 4Q0 6 5 4" {...cizgi(1.6)} />
        </g>
      );
    case 'FV':
      return (
        <g>
          <path d="M-12 -2Q0 -5 12 -2Q10 7 0 7Q-10 7 -12 -2Z" fill={RENK.agizIc} {...kontur} />
          <rect x="-8" y="-3.2" width="16" height="4.6" rx="1" fill="#fff" />
        </g>
      );
    default:
      return null;
  }
};

/** Bir duygunun kaş/göz/ağız/yanak çizimi. */
function duyguYuzu(d: Duygu, id: string, g: (ax: number, ay: number, el: React.ReactNode, k: string) => React.ReactNode): React.ReactNode[] {
  switch (d) {
    case 'dusunceli':
      // gözler yukarı-yana, bir kaş hafif kalkık, ağız kenara çekik
      return [
        g(-23, -23, <path d="M-9 1Q0 -1 9 1" {...cizgi(3.6)} />, 'k1'),
        g(24, -33, <path d="M-10 4Q-1 -7 10 -1" {...cizgi(3.6)} />, 'k2'),
        g(-13, -9, <ellipse rx="5.5" ry="7" fill={K} />, 'g1'),
        g(31, -9, <ellipse rx="5.5" ry="7" fill={K} />, 'g2'),
        g(12, 31, <path d="M-6 1Q0 0.5 6 -2" {...cizgi(3.4)} />, 'a'),
      ];
    case 'sasirmis':
      // kaşlar yukarıda, büyük nokta gözler, O ağız (olumlu)
      return [
        g(-24, -36, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k1'),
        g(24, -36, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k2'),
        ...[-1, 1].map((s) => g(23 * s, -4, (
          <g><ellipse rx="6.5" ry="8.5" fill={K} /><circle cx="-2" cy="-3" r="2" fill="#fff" /></g>
        ), `g${s}`)),
        g(-35, 13, <Yanak id={id} op={0.6} />, 'y1'),
        g(35, 13, <Yanak id={id} op={0.6} />, 'y2'),
        g(0, 32, <ellipse rx="6.5" ry="8" fill={RENK.agizIc} stroke={K} strokeWidth="3.2" />, 'a'),
      ];
    case 'gururlu':
      // gözler kapalı (memnun), kaşlar hafif kalkık, yarım gülümseme
      return [
        g(-24, -27, <path d="M-10 2Q0 -5 10 1" {...cizgi(3.6)} />, 'k1'),
        g(24, -27, <path d="M-10 1Q0 -5 10 2" {...cizgi(3.6)} />, 'k2'),
        g(-23, -3, <path d="M-10 -2Q0 6 10 -2" {...cizgi(4.2)} />, 'g1'),
        g(23, -3, <path d="M-10 -2Q0 6 10 -2" {...cizgi(4.2)} />, 'g2'),
        g(-36, 12, <Yanak id={id} op={0.5} />, 'y1'),
        g(36, 12, <Yanak id={id} op={0.5} />, 'y2'),
        g(4, 30, <path d="M-12 1Q2 7 14 -4" {...cizgi(3.6)} />, 'a'),
      ];
    case 'sikilmis':
      // yarı kapalı gözler (göz kapağı + yarım göz bebeği), düz kaşlar, yamuk düz ağız
      return [
        g(-23, -19, <path d="M-9 0H9" {...cizgi(3.4)} />, 'k1'),
        g(23, -19, <path d="M-9 0H9" {...cizgi(3.4)} />, 'k2'),
        ...[-1, 1].map((s) => g(22 * s, -1, (
          <g><path d="M-6 0A6 6.5 0 0 0 6 0Z" fill={K} /><path d="M-10 0H10" {...cizgi(3.6)} /></g>
        ), `g${s}`)),
        g(4, 31, <path d="M-9 1L9 -1" {...cizgi(3.4)} />, 'a'),
      ];
    case 'utangac':
      // gözler yana kaçar, pembe yanak (taramalı), küçük dalgalı gülümseme
      return [
        g(-24, -25, <path d="M-9 3Q-2 -1 9 -2" {...cizgi(3.2)} />, 'k1'),
        g(24, -25, <path d="M-9 -2Q2 -1 9 3" {...cizgi(3.2)} />, 'k2'),
        g(-17, -2, <ellipse rx="4.5" ry="6" fill={K} />, 'g1'),
        g(29, -2, <ellipse rx="4.5" ry="6" fill={K} />, 'g2'),
        g(-34, 12, <Yanak id={id} tarama />, 'y1'),
        g(34, 12, <Yanak id={id} tarama />, 'y2'),
        g(2, 31, <path d="M-8 0Q-4 3 0 0Q4 3 8 0" {...cizgi(3)} />, 'a'),
      ];
    case 'sakin':
      // tam boy referans: ince kavisli kaşlar, dikey oval gözler, hafif gülümseme
      return [
        g(-22, -18, <path d="M-9 2Q0 -3 9 1" {...cizgi(4)} />, 'k1'),
        g(22, -18, <path d="M-9 1Q0 -3 9 2" {...cizgi(4)} />, 'k2'),
        g(-21, 6, <ellipse rx="7" ry="9.5" fill={K} />, 'g1'),
        g(21, 6, <ellipse rx="7" ry="9.5" fill={K} />, 'g2'),
        g(0, 31, <path d="M-16 -1Q0 7 16 -1" {...cizgi(3.8)} />, 'a'),
      ];
    case 'mutlu':
      return [
        g(-27, -30, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k1'),
        g(27, -30, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k2'),
        g(-27, -6, <path d="M-11 4Q0 -10 11 4" {...cizgi(5)} />, 'g1'),
        g(27, -6, <path d="M-11 4Q0 -10 11 4" {...cizgi(5)} />, 'g2'),
        g(0, 30, (
          <g>
            <path d="M-30 -7Q0 0 30 -7Q26 22 0 23Q-26 22 -30 -7Z" fill="#fff" stroke={K} strokeWidth="3.6" strokeLinejoin="round" />
            <path d="M-25 8Q0 16 25 8Q22 19 0 20Q-22 19 -25 8Z" fill={K} />
            <path d="M-12 -2.5V8M0 -1V9.5M12 -2.5V8" stroke="#c9ccd2" strokeWidth="1" />
          </g>
        ), 'a'),
      ];
    case 'notr':
      return [
        g(-25, -2, <ellipse rx="4.6" ry="5.2" fill={K} />, 'g1'),
        g(25, -2, <ellipse rx="4.6" ry="5.2" fill={K} />, 'g2'),
        g(0, 30, <path d="M-9 0H9" {...cizgi(3.6)} />, 'a'),
      ];
    case 'heyecanli':
      return [
        g(-27, -33, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k1'),
        g(27, -33, <path d="M-10 3Q0 -6 10 3" {...cizgi(3.6)} />, 'k2'),
        ...[-1, 1].map((s) =>
          g(26 * s, -4, (
            <g>
              <ellipse rx="11" ry="12.5" fill={K} />
              <path d={yildiz(7.5)} fill="#fff" />
            </g>
          ), `g${s}`)),
        ...[-1, 1].map((s) =>
          g(46 * s, -18, <path d={yildiz(5)} fill="#fff" stroke={K} strokeWidth="1.6" strokeLinejoin="round" />, `p${s}`)),
        g(-36, 12, <Yanak id={id} />, 'y1'),
        g(36, 12, <Yanak id={id} />, 'y2'),
        g(0, 30, (
          <g>
            <path d="M-26 -8Q0 -2 26 -8Q22 20 0 20Q-22 20 -26 -8Z" fill={RENK.agizIc} stroke={K} strokeWidth="3.4" strokeLinejoin="round" />
            <path d="M-23 -5.5Q0 -0.5 23 -5.5L22 -1Q0 3 -22 -1Z" fill="#fff" />
            <path d="M-12 15Q0 6 12 15Q6 19 0 19Q-6 19 -12 15Z" fill={RENK.dil} />
          </g>
        ), 'a'),
      ];
    case 'uzgun':
      return [
        g(-25, -27, <path d="M-11 5Q-4 2 11 -4" {...cizgi(3.4)} />, 'k1'),
        g(25, -27, <path d="M-11 -4Q4 2 11 5" {...cizgi(3.4)} />, 'k2'),
        g(-25, -4, <path d="M-7 7V1Q-7 -6 0 -6Q7 -6 7 1V7" {...cizgi(4)} />, 'g1'),
        g(25, -4, <path d="M-7 7V1Q-7 -6 0 -6Q7 -6 7 1V7" {...cizgi(4)} />, 'g2'),
        g(0, 34, <path d="M-14 6Q0 -9 14 6" {...cizgi(3.8)} />, 'a'),
      ];
    case 'kizgin':
      return [
        g(-23, -20, <path d="M-14 -8L10 4L9 8L-14 -3Z" fill={K} stroke={K} strokeWidth="2" strokeLinejoin="round" />, 'k1'),
        g(23, -20, <path d="M14 -8L-10 4L-9 8L14 -3Z" fill={K} stroke={K} strokeWidth="2" strokeLinejoin="round" />, 'k2'),
        g(0, -28, <path d="M-3 -6L-1 2M3 -6L1 2M-7 -3L-4 3M7 -3L4 3" stroke="#c23030" strokeWidth="1.5" strokeLinecap="round" />, 'st'),
        g(-21, -1, (
          <g>
            <path d="M-8 -3L8 1Q8 9 0 9Q-8 9 -8 1Z" fill={K} />
            <circle cx="-2" cy="2" r="1.8" fill="#fff" />
          </g>
        ), 'g1'),
        g(21, -1, (
          <g>
            <path d="M8 -3L-8 1Q-8 9 0 9Q8 9 8 1Z" fill={K} />
            <circle cx="2" cy="2" r="1.8" fill="#fff" />
          </g>
        ), 'g2'),
        g(-38, 12, <Yanak id={id} tarama />, 'y1'),
        g(38, 12, <Yanak id={id} tarama />, 'y2'),
        g(0, 32, (
          <g>
            <path d="M-22 -9Q0 -12 22 -9Q26 0 22 9Q0 12 -22 9Q-26 0 -22 -9Z" fill="#fff" stroke={K} strokeWidth="3.4" strokeLinejoin="round" />
            <path d="M-23 0Q0 2 23 0M-12 -10V10M0 -11V11M12 -10V10M-18 -9.5V9.5M18 -9.5V9.5" stroke={K} strokeWidth="1.8" fill="none" />
          </g>
        ), 'a'),
      ];
    case 'korkmus':
      return [
        g(-25, -34, <path d="M-11 4Q-4 1 10 -4" {...cizgi(3.2)} />, 'k1'),
        g(25, -34, <path d="M-10 -4Q4 1 11 4" {...cizgi(3.2)} />, 'k2'),
        ...[-1, 1].map((s) =>
          g(25 * s, -4, (
            <g>
              <circle r="14" fill="#fff" stroke={K} strokeWidth="3.4" />
              <circle r="3.6" fill={K} />
            </g>
          ), `g${s}`)),
        ...[-1, 1].map((s) =>
          g(46 * s, -4, <path d={s < 0 ? 'M3 -9Q-1 0 3 9M-2 -6Q-5 0 -2 6' : 'M-3 -9Q1 0 -3 9M2 -6Q5 0 2 6'} {...cizgi(1.6)} />, `t${s}`)),
        g(-36, 14, <Yanak id={id} op={0.5} />, 'y1'),
        g(36, 14, <Yanak id={id} op={0.5} />, 'y2'),
        g(0, 33, (
          <g>
            <path d="M-11 -7Q0 -11 11 -7Q16 5 10 9Q0 12 -10 9Q-16 5 -11 -7Z" fill={RENK.korkuAgiz} stroke={K} strokeWidth="3.2" strokeLinejoin="round" />
            <path d="M-7 -3Q0 -6 7 -3Q8 2 0 3Q-8 2 -7 -3Z" fill="#9a3328" />
          </g>
        ), 'a'),
      ];
    case 'kafasi_karisik':
      return [
        g(-25, -22, <path d="M-12 2Q-3 -4 11 -1" {...cizgi(3.4)} />, 'k1'),
        g(-25, -32, <path d="M-6 -2Q-2 -5 3 -4M-4 2Q0 0 4 0" {...cizgi(1.3)} />, 'kr'),
        g(26, -38, <path d="M-10 6Q-3 -8 10 0" {...cizgi(3.6)} />, 'k2'),
        g(-23, -2, <ellipse rx="5" ry="6.5" fill={K} />, 'g1'),
        g(25, -4, <ellipse rx="6.2" ry="8" fill={K} />, 'g2'),
        g(0, 31, <path d="M-18 3Q-15 -4 -10 1T-1 1T8 1T17 -1" {...cizgi(3.4)} />, 'a'),
      ];
    case 'uykulu':
      return [
        g(-24, -2, (
          <g>
            <path d="M-11 -1Q0 5 11 -1" {...cizgi(3.8)} />
            <path d="M-10 -2.5Q0 -1 10 -2.5" stroke={K} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M-8 6Q0 9 8 6" stroke="#b8bfca" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        ), 'g1'),
        g(24, -2, (
          <g>
            <path d="M-11 -1Q0 5 11 -1" {...cizgi(3.8)} />
            <path d="M-10 -2.5Q0 -1 10 -2.5" stroke={K} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M-8 6Q0 9 8 6" stroke="#b8bfca" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        ), 'g2'),
        g(0, 31, <path d="M-6 1Q0 -2 6 1Q0 3 -6 1Z" fill={K} stroke={K} strokeWidth="2.4" strokeLinejoin="round" />, 'a'),
      ];
    case 'asik':
      return [
        g(-25, -3, <Kalp olcek={1.45} />, 'g1'),
        g(25, -3, <Kalp olcek={1.45} />, 'g2'),
        g(-37, 14, <Yanak id={id} tarama />, 'y1'),
        g(37, 14, <Yanak id={id} tarama />, 'y2'),
        g(0, 30, <path d="M-13 -2Q0 10 13 -2" {...cizgi(3.6)} />, 'a'),
      ];
  }
}

/** Kafa dolgusunun üstündeki ton (kızgın: kırmızı radyal, korkmuş: açık mavi). */
export const YuzTonu: React.FC<{ duygu: Duygu; id: string }> = ({ duygu, id }) => {
  if (duygu === 'kizgin') return <circle r={R} fill={`url(#${id}-kizgin)`} />;
  if (duygu === 'korkmus') return <circle r={R} fill={`url(#${id}-korku)`} />;
  return null;
};

export const YuzOzellikleri: React.FC<{ duygu: Duygu; id: string; yaw: number; bak?: Bakis; agiz?: Agiz }> = ({
  duygu, id, yaw, bak = 'izleyici', agiz = 'kapali',
}) => <g>{yuzParcalari(duygu, id, yerlestirici(yaw), bak, agiz)}</g>;

// ---------------------------------------------------------------- ekler (ayrı katman, hareketli)
const dalga = (k: number, hiz: number, faz = 0) => Math.sin(k * hiz + faz);
const dongu = (k: number, periyot: number, faz = 0) => (((k + faz) % periyot) + periyot) % periyot / periyot;

/** Kafa yanındaki ekler. yon: karakterin baktığı taraf (+1 sağ / -1 sol) — ekler arkaya doğru değil, bakış yönünün üstüne yerleşir. */
export const Ekler: React.FC<{ duygu: Duygu; kare: number; yaw: number; ayna?: boolean }> = ({ duygu, kare: k, yaw, ayna }) => {
  const yazi = ayna ? 'scale(-1 1)' : ''; // aynalı karakterde ? ve z ters okunmasın
  const kay = Math.sin(yaw) * 14; // kafa dönünce ekler de hafifçe kayar
  switch (duygu) {
    case 'heyecanli': {
      const s = 1 + 0.12 * dalga(k, 0.5);
      return (
        <g transform={`translate(${62 + kay} -64) scale(${s})`}>
          <path d="M-4 -8L-6 -18M4 -4L12 -12M8 4L18 2" {...cizgi(3.2)} />
        </g>
      );
    }
    case 'uzgun': {
      // gözyaşı sağ gözün altından süzülür, sonra yeniden belirir
      const t = dongu(k, 48);
      const y = 12 + t * 16;
      const op = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
      const ex = Math.sin(Math.asin(31 / R) + yaw) * R;
      if (Math.cos(Math.asin(31 / R) + yaw) < 0.12) return null;
      return (
        <g transform={`translate(${ex} ${y})`} opacity={op}>
          <path d="M0 -9C3 -3 7 1 7 5A7 7 0 0 1 -7 5C-7 1 -3 -3 0 -9Z" fill={RENK.gozyasi} stroke="#2f6fa8" strokeWidth="1.6" />
          <ellipse cx="-2.5" cy="4" rx="1.6" ry="2.4" fill="#fff" opacity="0.8" />
        </g>
      );
    }
    case 'korkmus': {
      // titreme çizgileri: her karede yer değiştiren küçük dalgalı çizgiler
      const j = (k % 2 === 0 ? 1 : -1) * 1.8;
      const j2 = (k % 3 === 0 ? -1 : 1) * 1.2;
      const t = 'M0 -10Q4 -5 0 0Q-4 5 0 10';
      const tKisa = 'M0 -7Q3 -3.5 0 0Q-3 3.5 0 7';
      return (
        <g>
          <g transform={`translate(${-72 + j} ${-46 + j2}) rotate(30)`}><path d={t} {...cizgi(2.2)} /></g>
          <g transform={`translate(${-80 - j} ${-30}) rotate(30)`}><path d={tKisa} {...cizgi(2.2)} /></g>
          <g transform={`translate(${72 - j} ${-46 - j2}) rotate(-30)`}><path d={t} {...cizgi(2.2)} /></g>
          <g transform={`translate(${80 + j} ${-30}) rotate(-30)`}><path d={tKisa} {...cizgi(2.2)} /></g>
          <g transform={`translate(${-74 - j} ${36 + j2}) rotate(-20)`}><path d={t} {...cizgi(2.2)} /></g>
          <g transform={`translate(${74 + j} ${36 - j2}) rotate(20)`}><path d={t} {...cizgi(2.2)} /></g>
        </g>
      );
    }
    case 'kafasi_karisik': {
      const y = -78 + dalga(k, 0.12) * 3;
      const r = dalga(k, 0.09, 1) * 7;
      return (
        <g transform={`translate(${70 + kay} ${y}) ${yazi} rotate(${12 + r})`}>
          <path d="M-7 -6C-7 -15 8 -15 8 -6C8 0 1 1 1 7" {...cizgi(4.4)} />
          <circle cx="1" cy="14" r="2.8" fill={K} />
        </g>
      );
    }
    case 'uykulu': {
      // "zz": küçük z alt-solda, büyük z üst-sağda; yukarı-sağa süzülüp geri gelir
      const z = (x: number, y: number, olcek: number, faz: number) => (
        <g key={faz} transform={`translate(${x + kay + dalga(k, 0.07, faz) * 3} ${y + dalga(k, 0.09, faz) * 4 - 2}) ${yazi} scale(${olcek}) rotate(${dalga(k, 0.08, faz) * 6})`}>
          <path d="M-5 -5H5L-5 5H5" {...cizgi(3.2)} />
        </g>
      );
      return <g>{z(54, -64, 0.95, 0)}{z(70, -78, 1.3, 1.6)}</g>;
    }
    case 'asik': {
      // uçuşan kalpler yükselir, sallanır, tepede solar
      const kalpler: [number, number, number, number][] = [
        [-78, -40, 0, 0.95],
        [68, -62, 20, 1.05],
        [82, -36, 36, 0.7],
        [-60, -70, 50, 0.6],
      ];
      return (
        <g>
          {kalpler.map(([x, y, faz, o], i) => {
            const t = dongu(k, 70, faz);
            const op = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
            return (
              <g key={i} transform={`translate(${x + dalga(k, 0.15, faz) * 3} ${y - t * 22})`} opacity={op}>
                <Kalp olcek={o} />
              </g>
            );
          })}
        </g>
      );
    }
    default:
      return null;
  }
};
