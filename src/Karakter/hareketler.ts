// <Karakter hareket="..."> hareket sistemi: yuru, otur, kalk, zipla (+ dur).
//
// Her hareket yerel zamanın (kare − baslangic) saf fonksiyonudur. Hareketler sıralanabilir:
// yeni hareket, öncekinin geçiş anındaki durumunu (gövde konumu, yerdeki ayaklar, oturma) devralır,
// böylece ayaklar hiçbir geçişte kaymaz. Kalça ofseti, basılma, eğim ve kollar kısa bir yayla karışır.
// Dönüş noktaları: kalça + diz (bacak IK), omuz + dirsek (kol açıları).

import {Easing, spring, SpringConfig} from 'remotion';
import {Anahtar, YAY, kalcaYuksekligi, sinirla, yayToplami, ziplamaEgrisi} from './hareket';
import {GEO} from './pozlar';

export type HareketAdi = 'dur' | 'yuru' | 'otur' | 'kalk' | 'zipla';

export type HareketAdimi = {
  hareket: HareketAdi;
  /** Hareketin başladığı kare. */
  baslangic: number;
  /** Başlangıç gövde x'i (viewBox birimi). Yalnızca ilk adımda gerekir; sonrakiler öncekinden devralır. */
  x?: number;
  /** yuru: alınacak yol (birim, − sola). Varsayılan 240. */
  mesafe?: number;
  /** yuru: süre (kare). Varsayılan mesafeye göre (~3.6 birim/kare). */
  sure?: number;
  /** zipla: yükseklik (birim). Varsayılan 60. */
  yukseklik?: number;
};

type Nokta = {x: number; y: number};
type Kol = [number, number];

/** Bir karede hareketin karaktere verdiği her şey. */
export type HareketDurumu = {
  gx: number; // gövde x
  ziplama: number; // kalça yüksekliği (Poz.ziplama)
  ezilme: number; // squash & stretch
  govdeEgim: number;
  kafaEgim: number;
  oneEgim: number; // 0..1, öne eğilme (kafa iner, bakış aşağı)
  ayaklar: [Nokta, Nokta]; // IK hedefleri (dünya, viewBox)
  kolSol: Kol;
  kolSag: Kol;
  kolAgirlik: number; // 0 → duygunun kolları, 1 → hareketin kolları
  sandalyeX: number | null; // varsa sandalye bu gövde x'inde
};

// ───────────────────────────── sabitler ─────────────────────────────

const Z = GEO.zemin - 2; // ayak tabanı
const L = GEO.uyluk + GEO.baldir;
const KALCA_DX = GEO.kalcaSag.x - 120;
const KALCA_Y0 = GEO.kalcaSol.y;
const DURUS = 11; // ayakta duruşta ayakların gövdeye uzaklığı
const KAPALI = 2; // yürüyüş döngüsü başında
/** Sandalye oturağı (gövde altı buraya iner). */
export const SANDALYE_UST = GEO.govdeAlt + 16;
const OTURMA = GEO.govdeAlt - SANDALYE_UST; // kalça ofseti (−)
const GECIS = 10; // hareketler arası karışım (kare)

/** Hareketin bir sonrakine devrettiği durum. */
type Giris = {gx: number; ayaklar: [Nokta, Nokta]; oturma: number};

/** Hareket fonksiyonunun ham çıktısı (kalça, ayaklara göre sonra hesaplanır). */
type Ham = {
  gx: number;
  ayaklar: [Nokta, Nokta];
  ofset: number; // ayakların izin verdiği en yüksek kalçaya göre (− aşağı)
  hava: number; // >0 ise havada: kalça sınırlanmaz, ayaklar toplanır
  ezilme: number;
  govdeEgim: number;
  kafaEgim: number;
  oneEgim: number;
  kolSol: Kol;
  kolSag: Kol;
  kolAgirlik: number;
  oturma: number;
};

const durus = (gx: number): [Nokta, Nokta] => [
  {x: 120 + gx - DURUS, y: Z},
  {x: 120 + gx + DURUS, y: Z},
];

const tabanZiplama = (ayak: [Nokta, Nokta], gx: number) =>
  KALCA_Y0 -
  Math.max(kalcaYuksekligi(ayak[0], 120 + gx - KALCA_DX, L), kalcaYuksekligi(ayak[1], 120 + gx + KALCA_DX, L));

/** Çok kanallı yay toplamı (kollar için). */
const yayKol = (anahtarlar: {f: number; k: Kol; yay?: Partial<SpringConfig>}[], t: number, fps: number): Kol => [
  yayToplami(anahtarlar.map((a) => ({f: a.f, deger: a.k[0], yay: a.yay ?? YAY.kol})), t, fps),
  yayToplami(anahtarlar.map((a) => ({f: a.f, deger: a.k[1], yay: a.yay ?? YAY.kol})), t, fps),
];

const bos = (g: Giris): Ham => ({
  gx: g.gx,
  ayaklar: g.ayaklar,
  ofset: g.oturma,
  hava: 0,
  ezilme: 0,
  govdeEgim: 0,
  kafaEgim: 0,
  oneEgim: 0,
  kolSol: [20, -20],
  kolSag: [20, -20],
  kolAgirlik: 0,
  oturma: g.oturma,
});

// ───────────────────────────── hareketler ─────────────────────────────

/** dur: ayaklar yerinde, oturuyorsa oturmaya devam. */
const dur = (_t: number, g: Giris): Ham => bos(g);

/**
 * yuru: önden görünüşte yan adım. Önce gidiş yönündeki ayak açılır, sonra arkadaki kapanır
 * (ayaklar çaprazlanmaz). Adımlar alınan yola bağlıdır → yerdeki ayak kaymaz.
 * Kollar bacaklarla karşılıklı sallanır (öndeki ayak açılırken arkadaki kol öne).
 */
const yuru = (t: number, g: Giris, a: HareketAdimi, fps: number): Ham => {
  const mesafe = a.mesafe ?? 240;
  const yon = Math.sign(mesafe) || 1;
  const yol = Math.abs(mesafe);
  const sure = a.sure ?? Math.max(fps * 0.6, yol / 3.6);
  const n = Math.max(1, Math.round(yol / 34));
  const D = yol / n;
  const d = yol * Easing.bezier(0.3, 0.15, 0.42, 1)(sinirla(t / sure));
  const c = Math.min(Math.floor(d / D), n);
  const v = c >= n ? 0 : d / D - c;
  const x0 = 120 + g.gx;
  const on = yon > 0 ? 1 : 0; // gidiş yönündeki ayak
  const arka = 1 - on;
  const planOn = (k: number) => (k <= 0 ? g.ayaklar[on].x : x0 + yon * (k * D + KAPALI));
  const planArka = (k: number) => (k <= 0 ? g.ayaklar[arka].x : x0 + yon * (k * D - KAPALI));
  const sal = (bas: number, son: number, w: number): Nokta => {
    const e = Easing.inOut(Easing.sin)(w);
    return {x: bas + (son - bas) * e, y: Z - 12 * Math.sin(Math.PI * w)};
  };
  const ayak: Nokta[] = [];
  if (c >= n) {
    ayak[on] = {x: planOn(n), y: Z};
    ayak[arka] = {x: planArka(n), y: Z};
  } else if (v < 0.5) {
    ayak[on] = sal(planOn(c), planOn(c + 1), v / 0.5);
    ayak[arka] = {x: planArka(c), y: Z};
  } else {
    ayak[on] = {x: planOn(c + 1), y: Z};
    ayak[arka] = sal(planArka(c), planArka(c + 1), (v - 0.5) / 0.5);
  }
  // kollar: adım fazıyla karşılıklı salınım; biraz gecikmeli (follow-through)
  const faz = (2 * Math.PI * d) / D - 0.5;
  const s = Math.sin(faz) * yon;
  const agirlik =
    spring({frame: t, fps, config: {damping: 200}, durationInFrames: 8}) *
    (1 - spring({frame: t - sure, fps, config: {damping: 200}, durationInFrames: 10}));
  return {
    ...bos(g),
    gx: g.gx + yon * d,
    ayaklar: [ayak[0], ayak[1]],
    ofset: 0,
    oturma: 0,
    kolSol: [22 - 26 * s, -28 + 16 * s],
    kolSag: [22 + 26 * s, -28 - 16 * s],
    kolAgirlik: agirlik,
    kafaEgim: 3 * Math.sin(faz + 0.6) * agirlik,
  };
};

/** otur: hafif doğrul (anticipation) → dizler bükülür, gövde sandalyeye iner → değince basılır. */
const otur = (t: number, g: Giris, _a: HareketAdimi, fps: number): Ham => {
  const ofset: Anahtar[] = [
    {f: 0, deger: g.oturma},
    {f: 7, deger: OTURMA, yay: YAY.oturma},
  ];
  const ezilme: Anahtar[] = [
    {f: 0, deger: 0},
    {f: 0, deger: 0.05}, // doğrulurken uza
    {f: 7, deger: 0.03},
    {f: 15, deger: -0.09, yay: {damping: 14, stiffness: 220}}, // oturağa değince basıl
    {f: 20, deger: 0, yay: {damping: 10, stiffness: 120}},
  ];
  const agirlik: Anahtar[] = [
    {f: 0, deger: 0},
    {f: 0, deger: 1, yay: {damping: 200, stiffness: 120}},
    {f: 20, deger: 0, yay: {damping: 200, stiffness: 60}},
  ];
  return {
    ...bos(g),
    ofset: yayToplami(ofset, t, fps),
    oturma: yayToplami(ofset, t, fps),
    ezilme: yayToplami(ezilme, t, fps),
    oneEgim: yayToplami([{f: 0, deger: 0}, {f: 4, deger: 0.5}, {f: 12, deger: 0}], t, fps),
    // dengelemek için kollar öne-yana açılır, oturunca bırakılır
    kolSol: yayKol([{f: 0, k: [20, -20]}, {f: 2, k: [48, -40]}, {f: 14, k: [30, -50]}], t, fps),
    kolSag: yayKol([{f: 0, k: [20, -20]}, {f: 2, k: [48, -40]}, {f: 14, k: [30, -50]}], t, fps),
    kolAgirlik: sinirla(yayToplami(agirlik, t, fps)),
  };
};

/** kalk: öne eğil + basıl (anticipation) → it ve yukarı uza → otur. */
const kalk = (t: number, g: Giris, _a: HareketAdimi, fps: number): Ham => {
  const ofset: Anahtar[] = [
    {f: 0, deger: g.oturma},
    {f: 0, deger: g.oturma - 3, yay: YAY.govde},
    {f: 9, deger: 0, yay: {damping: 12, stiffness: 150}},
  ];
  const ezilme: Anahtar[] = [
    {f: 0, deger: 0},
    {f: 0, deger: -0.09},
    {f: 9, deger: 0.11, yay: {damping: 12, stiffness: 220}},
    {f: 15, deger: 0, yay: {damping: 9, stiffness: 120}},
  ];
  const agirlik: Anahtar[] = [
    {f: 0, deger: 0},
    {f: 0, deger: 1, yay: {damping: 200, stiffness: 160}},
    {f: 16, deger: 0, yay: {damping: 200, stiffness: 60}},
  ];
  return {
    ...bos(g),
    ofset: yayToplami(ofset, t, fps),
    oturma: Math.min(0, yayToplami(ofset, t, fps)),
    ezilme: yayToplami(ezilme, t, fps),
    oneEgim: sinirla(yayToplami([{f: 0, deger: 0}, {f: 0, deger: 1}, {f: 9, deger: 0, yay: {damping: 13, stiffness: 140}}], t, fps)),
    // kollar önce aşağı-geri savrulur, kalkarken yukarı-öne
    kolSol: yayKol([{f: 0, k: [20, -20]}, {f: 0, k: [42, 14]}, {f: 8, k: [70, -40]}], t, fps),
    kolSag: yayKol([{f: 0, k: [20, -20]}, {f: 0, k: [42, 14]}, {f: 8, k: [70, -40]}], t, fps),
    kolAgirlik: sinirla(yayToplami(agirlik, t, fps)),
  };
};

/** zipla: çömel (anticipation) → fırla, kollar kalkar → kavisli uçuş → iniş (squash) → dur. */
const zipla = (t: number, g: Giris, a: HareketAdimi, fps: number): Ham => {
  const hazirlik = 7;
  const havada = 15;
  const z = ziplamaEgrisi(t, fps, {hazirlik, havada, yukseklik: a.yukseklik ?? 60, cokme: 10});
  const kollar = [
    {f: 0, k: [20, -20] as Kol},
    {f: 0, k: [34, 20] as Kol}, // çömelirken aşağı-geri
    {f: hazirlik - 1, k: [152, -16] as Kol}, // kalkışta yukarı
    {f: hazirlik + havada - 3, k: [70, -30] as Kol}, // inerken yana
  ];
  const agirlik: Anahtar[] = [
    {f: 0, deger: 0},
    {f: 0, deger: 1, yay: {damping: 200, stiffness: 200}},
    {f: hazirlik + havada + 8, deger: 0, yay: {damping: 200, stiffness: 60}},
  ];
  return {
    ...bos(g),
    ofset: g.oturma + z.y,
    hava: z.havadaMi,
    ezilme: z.ezilme,
    kolSol: yayKol(kollar, t, fps),
    kolSag: yayKol(kollar, t, fps),
    kolAgirlik: sinirla(yayToplami(agirlik, t, fps)),
  };
};

const FONK: Record<HareketAdi, (t: number, g: Giris, a: HareketAdimi, fps: number) => Ham> = {dur, yuru, otur, kalk, zipla};

// ───────────────────────────── birleştirme ─────────────────────────────

const ham = (adimlar: HareketAdimi[], i: number, f: number, fps: number): Ham => {
  const a = adimlar[i];
  return FONK[a.hareket](f - a.baslangic, giris(adimlar, i, fps), a, fps);
};

/** i. adımın devraldığı durum = (i−1). adımın, i. adımın başladığı karedeki hali. */
const giris = (adimlar: HareketAdimi[], i: number, fps: number): Giris => {
  if (i === 0) {
    const gx = adimlar[0].x ?? 0;
    return {gx, ayaklar: durus(gx), oturma: 0};
  }
  const h = ham(adimlar, i - 1, adimlar[i].baslangic, fps);
  return {gx: h.gx, ayaklar: h.ayaklar, oturma: h.oturma};
};

const karistir = (a: number, b: number, w: number) => a + (b - a) * w;
const karistirKol = (a: Kol, b: Kol, w: number): Kol => [karistir(a[0], b[0], w), karistir(a[1], b[1], w)];

/** Hareket listesinin f karesindeki durumu (sahne de bunu kullanabilir: kafa konumu vb.). */
export const hareketDurumu = (adimlarHam: HareketAdimi[], f: number, fps: number): HareketDurumu => {
  const adimlar = [...adimlarHam].sort((a, b) => a.baslangic - b.baslangic);
  let i = -1;
  for (let k = 0; k < adimlar.length; k++) if (adimlar[k].baslangic <= f) i = k;

  let h: Ham;
  if (i < 0) {
    h = bos(giris(adimlar, 0, fps));
  } else {
    h = ham(adimlar, i, f, fps);
    // önceki hareketten yumuşak geçiş (ayaklar ve gövde x devralındığı için karışmaz)
    const t = f - adimlar[i].baslangic;
    if (i > 0 && t < GECIS * 2) {
      const o = ham(adimlar, i - 1, f, fps);
      const w = spring({frame: t, fps, config: {damping: 200}, durationInFrames: GECIS});
      h = {
        ...h,
        ofset: karistir(o.ofset, h.ofset, w),
        ezilme: karistir(o.ezilme, h.ezilme, w),
        govdeEgim: karistir(o.govdeEgim, h.govdeEgim, w),
        kafaEgim: karistir(o.kafaEgim, h.kafaEgim, w),
        oneEgim: karistir(o.oneEgim, h.oneEgim, w),
        kolSol: karistirKol(o.kolAgirlik > 0.001 ? o.kolSol : h.kolSol, h.kolSol, w),
        kolSag: karistirKol(o.kolAgirlik > 0.001 ? o.kolSag : h.kolSag, h.kolSag, w),
        kolAgirlik: karistir(o.kolAgirlik, h.kolAgirlik, w),
      };
    }
  }

  // kalça: ayakların izin verdiği en yüksek nokta + hareket ofseti; yerdeyken bacak boyunu aşamaz
  const taban = tabanZiplama(h.ayaklar, h.gx);
  const ziplama = h.hava > 0 ? taban + h.ofset : Math.min(taban, taban + h.ofset);
  // havadayken ayaklar kalçanın altında toplanır (tuck); yerdeyken yerinde kalır
  const kalcaY = KALCA_Y0 - ziplama;
  const ayaklar = h.ayaklar.map((a, j) => {
    if (h.hava <= 0) return a;
    const kx = 120 + h.gx + (j === 0 ? -KALCA_DX : KALCA_DX);
    const dx = Math.abs(a.x - kx);
    const erisim = Math.sqrt(Math.max(0, (L * 0.985) ** 2 - dx * dx));
    return {x: a.x + (j === 0 ? -4 : 4) * h.hava, y: Math.min(a.y, kalcaY + erisim - 12 * h.hava)};
  }) as [Nokta, Nokta];

  // sandalye: listede otur varsa, oturulan yerde
  const oi = adimlar.findIndex((a) => a.hareket === 'otur');
  const sandalyeX = oi >= 0 ? giris(adimlar, oi, fps).gx : null;

  return {
    gx: h.gx,
    ziplama,
    ezilme: h.ezilme,
    govdeEgim: h.govdeEgim,
    kafaEgim: h.kafaEgim,
    oneEgim: h.oneEgim,
    ayaklar,
    kolSol: h.kolSol,
    kolSag: h.kolSag,
    kolAgirlik: sinirla(h.kolAgirlik),
    sandalyeX,
  };
};
