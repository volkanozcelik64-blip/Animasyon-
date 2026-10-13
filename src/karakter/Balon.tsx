// Konuşma balonu (Nod konuşmaz; replikler balonla). Nod'un çizim tarzında: beyaz dolgu, kalın siyah kontur,
// ağza doğru kuyruk; el yazısı tarzı, kalın, BÜYÜK HARF yazı (Patrick Hand, assets/fonts).
// Tipler: normal (yuvarlak), bagirma (dikenli, büyük yazı, titrer), fisilti (kesikli kontur, küçük yazı),
// dusunce (bulut, kuyruk yerine küçük daireler).
// Animasyon: "pop" ile açılır (yay, hafif büyüyüp oturur), yazı daktilo gibi harf harf belirir,
// sonda kısa küçülerek kaybolur. Okuma süresi: her kelime için en az 0,3 sn.
import React from 'react';
import { random, spring } from 'remotion';
import { RENK, CIZGI } from './olculer';

export type BalonTipi = 'normal' | 'bagirma' | 'fisilti' | 'dusunce';
export const YAZI_AILESI = 'NodYazi';
export const YAZI_DOSYASI = 'fonts/PatrickHand-Regular.ttf';

const AYAR: Record<BalonTipi, { punto: number; hiz: number; kontur: number }> = {
  normal: { punto: 46, hiz: 0.75, kontur: CIZGI.esya },
  bagirma: { punto: 60, hiz: 1.2, kontur: CIZGI.esya + 0.5 },
  fisilti: { punto: 34, hiz: 0.45, kontur: CIZGI.esya - 1 },
  dusunce: { punto: 46, hiz: 0.6, kontur: CIZGI.esya },
};
const ACILIS = 4; // yazı pop'tan sonra başlar
const KAPANIS = 6; // küçülerek kaybolma (kare)
const KELIME_SN = 0.3;

export interface BalonProps {
  tip?: BalonTipi;
  metin: string;
  /** balon merkezi ve kuyruğun yöneldiği nokta (ağız), ebeveyn koordinatında */
  x: number; y: number;
  hedef: { x: number; y: number };
  kare: number;
  baslangic: number;
  /** ekranda kalma (kare); verilmezse/kısaysa okuma süresine göre uzatılır */
  sure?: number;
  fps?: number;
  olcek?: number;
  /** karanlıkta: siyah dolgu, beyaz kontur ve yazı */
  karanlik?: boolean;
  /** yazma hızı çarpanı (Shorts: hızlı) */
  hiz?: number;
}

const kelimeSayisi = (m: string) => m.trim().split(/\s+/).filter(Boolean).length;

/** Yazının tamamlanması + kelime başına 0,3 sn okuma; balonun ekranda kalacağı en kısa süre (kare). */
export function balonSuresi(metin: string, tip: BalonTipi = 'normal', fps = 30, hiz = 1): number {
  const yazma = ACILIS + Math.ceil(metin.length / (AYAR[tip].hiz * hiz));
  return yazma + Math.ceil(kelimeSayisi(metin) * KELIME_SN * fps) + 4;
}

/** Balonun o karede açık olup olmadığı ve yazılan harf sayısı (sessiz konuşma için). */
export function balonDurumu(p: { metin: string; tip?: BalonTipi; kare: number; baslangic: number; sure?: number; fps?: number; hiz?: number }) {
  const tip = p.tip ?? 'normal';
  const hiz = AYAR[tip].hiz * (p.hiz ?? 1);
  const sure = Math.max(p.sure ?? 0, balonSuresi(p.metin, tip, p.fps ?? 30, p.hiz ?? 1));
  const t = p.kare - p.baslangic;
  const harf = Math.max(0, Math.min(p.metin.length, Math.floor((t - ACILIS) * hiz)));
  return { t, sure, gorunur: t >= 0 && t < sure + KAPANIS, yaziyor: t >= ACILIS && harf < p.metin.length, harf };
}

/** Basit satır kırma (büyük harf el yazısı için ortalama harf genişliği ≈ 0,47 punto). */
function satirlar(metin: string, punto: number, enFazlaGenislik: number): string[] {
  const kelimeler = metin.split(/\s+/);
  const out: string[] = [];
  let satir = '';
  for (const k of kelimeler) {
    const aday = satir ? `${satir} ${k}` : k;
    if (aday.length * punto * 0.47 > enFazlaGenislik && satir) { out.push(satir); satir = k; } else satir = aday;
  }
  if (satir) out.push(satir);
  return out;
}

const f = (n: number) => n.toFixed(1);

export const Balon: React.FC<BalonProps> = (p) => {
  const tip = p.tip ?? 'normal';
  const A = AYAR[tip];
  const fps = p.fps ?? 30;
  const d = balonDurumu({ ...p, tip, fps });
  if (!d.gorunur) return null;
  const metin = p.metin.toUpperCase();
  const punto = A.punto * (p.olcek ?? 1);
  const sat = satirlar(metin, punto, punto * 9);
  const gen = Math.max(...sat.map((s) => s.length)) * punto * 0.47;
  const yuk = sat.length * punto * 1.08;
  const rx = gen / 2 + punto * 0.85;
  const ry = yuk / 2 + punto * 0.6;

  // açılış: yay (hafif büyüyüp oturur); kapanış: kısa küçülme
  const ac = spring({ frame: d.t, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const kapa = Math.max(0, Math.min(1, (d.t - d.sure) / KAPANIS));
  const olc = ac * (1 - kapa * kapa);
  // bağırma: hafif titreme (deterministik)
  const tx = tip === 'bagirma' ? (random(`bt${p.baslangic}-${d.t}`) - 0.5) * 5 : 0;
  const ty = tip === 'bagirma' ? (random(`bty${p.baslangic}-${d.t}`) - 0.5) * 5 : 0;

  const dolgu = p.karanlik ? '#000' : RENK.beyaz;
  const cizgi = p.karanlik ? '#fff' : RENK.murekkep;
  const kesik = tip === 'fisilti' ? '12 8' : undefined;

  // kuyruk yönü (balon merkezinden hedefe)
  const hx = p.hedef.x - p.x, hy = p.hedef.y - p.y;
  const hl = Math.hypot(hx, hy) || 1;
  const ux = hx / hl, uy = hy / hl;
  // elips kenarındaki çıkış noktası ve kuyruk ucu (ağza değmez: yolun ~%70'i)
  const kenar = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
  const ucMesafe = kenar + (hl - kenar) * 0.7;
  const uc = { x: ux * ucMesafe, y: uy * ucMesafe };
  const nx = -uy, ny = ux;
  const kok = (s: number) => ({ x: ux * kenar * 0.8 + nx * s * punto * 0.5, y: uy * kenar * 0.8 + ny * s * punto * 0.5 });
  const k1 = kok(1), k2 = kok(-1);
  const kuyruk = `M${f(k1.x)} ${f(k1.y)}Q${f(uc.x * 0.75 + nx * 6)} ${f(uc.y * 0.75 + ny * 6)} ${f(uc.x)} ${f(uc.y)}Q${f(uc.x * 0.7)} ${f(uc.y * 0.7)} ${f(k2.x)} ${f(k2.y)}Z`;

  // gövde yolu
  let govde: string;
  if (tip === 'bagirma') {
    const n = 18;
    const pts = Array.from({ length: n * 2 }, (_, i) => {
      const a = (i / (n * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.28 + random(`bd${p.baslangic}-${i}`) * 0.12 : 1.02;
      return `${f(Math.cos(a) * rx * r)} ${f(Math.sin(a) * ry * r)}`;
    });
    govde = `M${pts.join('L')}Z`;
  } else {
    govde = `M${f(-rx)} 0A${f(rx)} ${f(ry)} 0 1 0 ${f(rx)} 0A${f(rx)} ${f(ry)} 0 1 0 ${f(-rx)} 0Z`;
  }

  // düşünce: bulut tümsekleri + ağza doğru küçülen daireler
  const bulut = tip === 'dusunce'
    ? Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        return { x: Math.cos(a) * rx * 0.92, y: Math.sin(a) * ry * 0.9, r: Math.min(rx, ry) * 0.42 };
      })
    : [];
  const daireler = tip === 'dusunce'
    ? [0.55, 0.75, 0.9].map((s, i) => ({ x: ux * (kenar + (hl - kenar) * s * 0.85), y: uy * (kenar + (hl - kenar) * s * 0.85), r: punto * (0.32 - i * 0.09) }))
    : [];

  const kalin = A.kontur;
  const sekiller = (dolgulu: boolean) => (
    <>
      {tip === 'dusunce' ? (
        <>
          <ellipse rx={rx * 0.95} ry={ry * 0.92} />
          {bulut.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r} />)}
        </>
      ) : (
        <>
          <path d={govde} />
          <path d={kuyruk} />
        </>
      )}
      {!dolgulu && null}
    </>
  );
  const yazilan = metin.slice(0, d.harf);
  return (
    <g transform={`translate(${f(p.x + tx)} ${f(p.y + ty)}) scale(${olc.toFixed(3)})`}>
      {/* 1) kontur katmanı (birleşik siluet), 2) dolgu katmanı: iç çizgiler kaybolur */}
      <g fill={cizgi} stroke={cizgi} strokeWidth={kalin * 2} strokeLinejoin="round" strokeDasharray={kesik}>
        {kesik ? null : sekiller(false)}
      </g>
      <g fill={dolgu} stroke={kesik ? cizgi : 'none'} strokeWidth={kesik ? kalin : 0} strokeDasharray={kesik} strokeLinejoin="round">
        {sekiller(true)}
      </g>
      {daireler.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={dolgu} stroke={cizgi} strokeWidth={kalin} />
      ))}
      {/* yazı: her satır ortalı; daktilo için harf harf */}
      <g fontFamily={`${YAZI_AILESI}, 'Comic Sans MS', sans-serif`} fontWeight={700} fontSize={punto}
        fill={cizgi} textAnchor="middle" letterSpacing={0.5}
        stroke={cizgi} strokeWidth={punto * 0.035} strokeLinejoin="round" paintOrder="stroke">
        {(() => {
          let kalan = yazilan.length;
          return sat.map((s, i) => {
            const goster = s.slice(0, Math.max(0, kalan));
            kalan -= s.length + 1;
            // satırı tam genişlikte yerleştir, görünmeyen harfleri saydam bırak (yazı kaymasın)
            return (
              <text key={i} x={0} y={(i - (sat.length - 1) / 2) * punto * 1.08 + punto * 0.35}>
                <tspan>{goster}</tspan>
                <tspan fillOpacity={0} strokeOpacity={0}>{s.slice(goster.length)}</tspan>
              </text>
            );
          });
        })()}
      </g>
    </g>
  );
};

/** Sessiz konuşma: balon yazılırken o anki harfe göre küçük ağız şekli (ses yok, hafif açılıp kapanır). */
export function sessizAgiz(metin: string, harf: number, kare: number, bagir = false): import('./olculer').Agiz {
  const c = (metin[Math.max(0, harf - 1)] ?? ' ').toLowerCase();
  if (!/[a-zçğıöşü%]/.test(c)) return kare % 6 < 3 ? 'MBP' : 'kapali';
  if ('mbp'.includes(c)) return 'MBP';
  if ('fv'.includes(c)) return 'FV';
  if ('aı'.includes(c)) return bagir ? 'A' : 'E';
  if ('oöuü'.includes(c)) return bagir ? 'O' : 'U';
  if ('ei'.includes(c)) return bagir ? 'E' : 'I';
  return kare % 4 < 2 ? 'I' : 'MBP';
}
