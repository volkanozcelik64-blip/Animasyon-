// Telefonu iki elle kavrayan eldivenler (Nod'un eldiven tarzı: beyaz dolgu, kalın siyah kontur, mavi bileklik).
// Telefon ELLERİN İÇİNDE durur ve bileklere bağlıdır (child transform): yeri iki bilekten hesaplanır,
// böylece eller nereye giderse telefon da oraya gider.
// Koordinat: telefonun yerel çerçevesi (merkez 0,0; y aşağı; Nod birimi). Telefon boyu 120.
// Katmanlar (izleyiciden uzaktan yakına):
//   ekran bize dönük (omuz arkası): avuçlar + arkadan dolanan parmaklar → telefon → başparmaklar (ekranın alt yarısında)
//   sırt bize dönük (önden):        avuçlar (yanlarda) → telefon → dört parmak sırtı sarar (başparmaklar görünmez)
import React from 'react';
import { RENK, OLCU, CIZGI } from './olculer';
import { ModernTelefon, TELEFON, type ModernTelefonProps } from '../esyalar/ModernTelefon';

export const TEL_OLCEK = 120 / TELEFON.yuk;
export const TEL_YARI = { x: (TELEFON.gen / 2) * TEL_OLCEK, y: (TELEFON.yuk / 2) * TEL_OLCEK };

type V = { x: number; y: number };

export interface Kavrayis {
  /** avuç merkezinin telefon yerelindeki yüksekliği (+ = alt yarı) */
  tutY: number;
  /** eldiven ölçeği (1 = Nod'un eldiveni) */
  el: number;
}
export const ONDEN: Kavrayis = { tutY: 14, el: 1 };
export const OMUZ_ARKASI: Kavrayis = { tutY: 44, el: 0.6 };

/** Bileğin telefon yerelindeki yeri (t = -1 sol kenar, +1 sağ kenar). */
export function bilekYerel(t: 1 | -1, kv: Kavrayis): V {
  return { x: t * (TEL_YARI.x + 15 * kv.el), y: kv.tutY + 6 * kv.el };
}

/** Telefonun dünyadaki yeri, iki bilekten (child transform). */
export function telefonYeri(bilekSol: V, bilekSag: V, kv: Kavrayis): { x: number; y: number; aci: number } {
  const aci = Math.atan2(bilekSag.y - bilekSol.y, bilekSag.x - bilekSol.x);
  const m = { x: (bilekSol.x + bilekSag.x) / 2, y: (bilekSol.y + bilekSag.y) / 2 };
  const oy = bilekYerel(1, kv).y; // bileklerin telefon merkezine göre aşağısı
  return { x: m.x + Math.sin(aci) * oy, y: m.y - Math.cos(aci) * oy, aci: (aci * 180) / Math.PI };
}

/** Telefon yerelindeki bir noktayı dünyaya (bilekleri hedeflemek için). */
export function yereldenDunyaya(merkez: V, aciDer: number, p: V): V {
  const a = (aciDer * Math.PI) / 180;
  return { x: merkez.x + p.x * Math.cos(a) - p.y * Math.sin(a), y: merkez.y + p.x * Math.sin(a) + p.y * Math.cos(a) };
}

const K = RENK.murekkep, B = RENK.beyaz;

/** Kontürlü kapsül (parmak). */
const Parmak: React.FC<{ a: V; b: V; w: number; o: number }> = ({ a, b, w, o }) => (
  <g>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={K} strokeWidth={w + 2 * o} strokeLinecap="round" />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={B} strokeWidth={w} strokeLinecap="round" />
  </g>
);

/** Kıvrık parmak: kökten uca hafif yay (boğum) çizen kontürlü kalın çizgi. */
const Kivrik: React.FC<{ a: V; c: V; b: V; w: number; o: number }> = ({ a, c, b, w, o }) => {
  const d = `M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={K} strokeWidth={w + 2 * o} />
      <path d={d} stroke={B} strokeWidth={w} />
    </g>
  );
};

/** Avuç: kenarı saran dikey oval eldiven. */
const Avuc: React.FC<{ p: V; rx: number; ry: number; o: number; aci?: number }> = ({ p, rx, ry, o, aci = 0 }) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${aci})`}>
    <ellipse rx={rx + o} ry={ry + o} fill={K} />
    <ellipse rx={rx} ry={ry} fill={B} />
  </g>
);

export interface TelefonluEllerProps extends Omit<ModernTelefonProps, 'yuz'> {
  yuz: 'ekran' | 'sirt';
  kavrayis: Kavrayis;
  /** ön kol yönü (dünya açısı, derece; dirsekten bileğe) — bileklik buna dik durur */
  onKolSol?: number;
  onKolSag?: number;
  /** telefonun dünya açısı (bileklik açısını yerele çevirmek için) */
  aci?: number;
}

/** Telefon + kavrayan eller; telefonun yerel çerçevesinde çizilir (çağıran telefonYeri ile yerleştirir). */
export const TelefonluEller: React.FC<TelefonluEllerProps> = ({ yuz, kavrayis: kv, onKolSol = 0, onKolSag = 0, aci = 0, ...tel }) => {
  const s = kv.el;
  const r = 11 * OLCU.elOlcek * s; // avuç
  const o = CIZGI.eldiven * OLCU.elOlcek * s; // eldiven konturu
  const w = 6.5 * OLCU.elOlcek * s; // parmak kalınlığı
  const hx = TEL_YARI.x, hy = TEL_YARI.y;

  const avuclar = ([-1, 1] as const).map((t) => {
    // avuç kenarı sarar: dikey oval, telefonun kenarına yaslı, hafif içe eğik
    const avuc = { x: t * (hx + 1.5 * s), y: kv.tutY + 5 * s };
    const bilek = bilekYerel(t, kv);
    const onKol = (t < 0 ? onKolSol : onKolSag) - aci;
    return (
      <g key={`a${t}`}>
        {/* bilek: avuçtan bilekliğe eldiven gövdesi */}
        <Parmak a={avuc} b={bilek} w={r * 1.2} o={o} />
        <Avuc p={avuc} rx={r * 0.78} ry={r * 1.12} o={o} aci={t * -8} />
        <circle cx={bilek.x} cy={bilek.y} r={r * 0.6} fill={B} />
        {/* bileklik: ön kola dik */}
        <g transform={`translate(${bilek.x} ${bilek.y}) rotate(${onKol - 90}) scale(${OLCU.elOlcek * s})`}>
          <rect x="-10" y="-5" width="20" height="10" rx="3" fill={RENK.bileklik} stroke={K} strokeWidth={CIZGI.bileklik} />
          <path d="M-7.5 -2.5H7.5" stroke="#8cc4f2" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
    );
  });

  if (yuz === 'sirt') {
    // önden: avuçlar kenarları sarar → telefon → parmaklar sırtta yelpaze gibi açılır (farklı boy ve açı);
    // serçe parmak küçük ve alttan destekler; başparmaklar ekran tarafında, görünmez
    const parmaklar = [
      // [kök y, uç x içeri, uç y, kalınlık oranı, yay]
      { y: -15, ic: 12, uy: -21, k: 0.9, yay: -3 }, // işaret
      { y: -4, ic: 15, uy: -7, k: 0.95, yay: -3 }, // orta
      { y: 7, ic: 13, uy: 6, k: 0.92, yay: -2.5 }, // yüzük
      { y: 17, ic: 8, uy: 19, k: 0.8, yay: -1.5 }, // serçe
    ];
    return (
      <g>
        {avuclar}
        <g transform={`scale(${TEL_OLCEK * 0.92} ${TEL_OLCEK})`}><ModernTelefon {...tel} yuz="sirt" /></g>
        {([-1, 1] as const).map((t) => (
          <g key={`p${t}`}>
            {parmaklar.map((f, i) => {
              const a = { x: t * (hx + 4 * s), y: kv.tutY + f.y * s };
              const b = { x: t * (hx - f.ic * s), y: kv.tutY + f.uy * s };
              const c = { x: (a.x + b.x) / 2 + t * 1 * s, y: (a.y + b.y) / 2 + f.yay * s };
              return <Kivrik key={i} a={a} c={c} b={b} w={w * f.k} o={o} />;
            })}
          </g>
        ))}
      </g>
    );
  }

  // omuz arkası: parmak uçları telefonun arkasından yan kenarlarda hafifçe görünür → avuçlar alt köşeleri kavrar
  // → telefon → başparmaklar ekranın alt yarısında, kenara yakın, hafif kıvrık
  return (
    <g>
      {([-1, 1] as const).map((t) => (
        <g key={`p${t}`}>
          {[-30, -20, -10].map((dy, i) => (
            <Kivrik key={i} a={{ x: t * (hx - 8 * s), y: kv.tutY + dy * s }} c={{ x: t * (hx - 1 * s), y: kv.tutY + (dy - 2.5) * s }}
              b={{ x: t * (hx + (3.5 - i * 0.6) * s), y: kv.tutY + (dy - 1) * s }} w={w * 0.88} o={o} />
          ))}
        </g>
      ))}
      {avuclar}
      <g transform={`scale(${TEL_OLCEK})`}><ModernTelefon {...tel} yuz="ekran" /></g>
      {([-1, 1] as const).map((t) => (
        <Kivrik key={`b${t}`} a={{ x: t * (hx + 4 * s), y: kv.tutY + 1 * s }} c={{ x: t * (hx - 2 * s), y: kv.tutY - 11 * s }}
          b={{ x: t * (hx - 9 * s), y: kv.tutY - 14 * s }} w={w * 0.95} o={o} />
      ))}
    </g>
  );
};
