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

  const el = (t: 1 | -1) => {
    const avuc = { x: t * (hx + 2 * s), y: kv.tutY };
    const bilek = bilekYerel(t, kv);
    return { avuc, bilek };
  };

  const avuclar = ([-1, 1] as const).map((t) => {
    const { avuc, bilek } = el(t);
    const onKol = (t < 0 ? onKolSol : onKolSag) - aci;
    return (
      <g key={`a${t}`}>
        {/* avuç ile bilek arası (eldiven bileği) */}
        <Parmak a={avuc} b={bilek} w={r * 1.25} o={o} />
        <circle cx={avuc.x} cy={avuc.y} r={r + o} fill={K} />
        <circle cx={avuc.x} cy={avuc.y} r={r} fill={B} />
        <circle cx={bilek.x} cy={bilek.y} r={r * 0.62} fill={B} />
        {/* bileklik: ön kola dik */}
        <g transform={`translate(${bilek.x} ${bilek.y}) rotate(${onKol - 90}) scale(${OLCU.elOlcek * s})`}>
          <rect x="-10" y="-5" width="20" height="10" rx="3" fill={RENK.bileklik} stroke={K} strokeWidth={CIZGI.bileklik} />
          <path d="M-7.5 -2.5H7.5" stroke="#8cc4f2" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
    );
  });

  // dört parmak: avucun dış kenarından telefonun gövdesine doğru (alttan yukarı sıralı)
  const parmakY = (i: number) => kv.tutY + 10 * s - i * 11.5 * s;

  if (yuz === 'sirt') {
    // önden: avuçlar yanlarda, telefon avuçların önünde, parmaklar sırtı sarar; uçlar kenardan hafif taşar
    return (
      <g>
        {avuclar}
        <g transform={`scale(${TEL_OLCEK * 0.92} ${TEL_OLCEK})`}><ModernTelefon {...tel} yuz="sirt" /></g>
        {([-1, 1] as const).map((t) => (
          <g key={`p${t}`}>
            {[3, 2, 1, 0].map((i) => {
              const y = parmakY(i);
              // parmak kökü avucun içinde (telefonun dışında), ucu sırtın üstünde
              return <Parmak key={i} a={{ x: t * (hx + 9 * s), y: y + 3 * s }} b={{ x: t * (hx - 13 * s - (i === 0 ? 0 : 2 * s)), y: y - 3 * s }} w={w} o={o} />;
            })}
            {/* parmak boğumu çizgisi: kenarı sarma */}
            <path d={`M${t * (hx + 1)} ${parmakY(3) - 6 * s}V${parmakY(0) + 6 * s}`} stroke={K} strokeWidth={CIZGI.atkiDetay * 1.4} strokeLinecap="round" opacity={0.55} />
          </g>
        ))}
      </g>
    );
  }

  // omuz arkası: parmaklar telefonun arkasından dolanır, uçları yan kenarlardan görünür
  return (
    <g>
      {([-1, 1] as const).map((t) => (
        <g key={`p${t}`}>
          {[0, 1, 2, 3].map((i) => {
            const y = parmakY(i) - 6 * s;
            return <Parmak key={i} a={{ x: t * (hx - 16 * s), y }} b={{ x: t * (hx + 5 * s), y: y - 2 * s }} w={w} o={o} />;
          })}
        </g>
      ))}
      {avuclar}
      <g transform={`scale(${TEL_OLCEK})`}><ModernTelefon {...tel} yuz="ekran" /></g>
      {/* başparmaklar: ekranın alt yarısında, kenarlara yakın */}
      {([-1, 1] as const).map((t) => (
        <Parmak key={`b${t}`} a={{ x: t * (hx + 3 * s), y: kv.tutY - 2 * s }} b={{ x: t * (hx - 9 * s), y: kv.tutY - 15 * s }} w={w} o={o} />
      ))}
    </g>
  );
};
