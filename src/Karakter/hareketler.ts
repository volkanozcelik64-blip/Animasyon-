// <Karakter hareket="..."> hareket sistemi: yuru, otur, kalk, zipla (+ dur).
//
// Her hareket yerel zamanın (kare − baslangic) saf fonksiyonudur. Hareketler sıralanabilir:
// yeni hareket, öncekinin geçiş anındaki durumunu (gövde konumu, yerdeki ayaklar, oturma) devralır,
// böylece ayaklar hiçbir geçişte kaymaz. Kalça ofseti, basılma, eğim ve kollar kısa bir yayla karışır.
// Dönüş noktaları: kalça + diz (bacak IK), omuz + dirsek (kol açıları).

import {Easing, spring, SpringConfig} from 'remotion';
import {Anahtar, YAY, kalcaYuksekligi, sinirla, yayToplami, ziplamaEgrisi} from './hareket';
import {GEO, kalcaDX, omuzDX, uzakKalcaDY} from './pozlar';

export type HareketAdi = 'dur' | 'yuru' | 'otur' | 'dusun' | 'kalk' | 'zipla';

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
  donus: number; // 0 = önden, 1 = 3/4 sağa dönük (oturma)
  ayaklar: [Nokta, Nokta]; // IK hedefleri (dünya, viewBox)
  kolSol: Kol;
  kolSag: Kol;
  kolAgirlik: number; // 0 → duygunun kolları, 1 → hareketin kolları
  sandalyeX: number | null; // varsa sandalye bu gövde x'inde
};

// ───────────────────────────── sabitler ─────────────────────────────

const Z = GEO.zemin - 2; // ayak tabanı
const L = GEO.uyluk + GEO.baldir;
const KALCA_Y0 = GEO.kalcaSol.y;
const DURUS = 11; // ayakta duruşta ayakların gövdeye uzaklığı
const KAPALI = 2; // yürüyüş döngüsü başında
// ── oturma geometrisi (yan görünüş, donus = 1) ──
// Kalça oturağa iner, üst bacaklar yatay ileri, diz 90°, alt bacak yere dik, ayak yere basar.
const KALCA_OTUR_Y = Z - 3 - GEO.baldir; // oturunca yakın kalça y'si (alt bacak boyu kadar yerden yukarıda)
const OTURMA_Z = KALCA_Y0 - KALCA_OTUR_Y; // oturunca Poz.ziplama (−)
/** Ayakta duruştan oturma noktasına kalçanın geriye gittiği yol. */
const GERI = 15;
/** Sandalye (yan görünüş) ölçüleri, oturan gövde x'ine (c) göre. */
export const SANDALYE = {
  ust: KALCA_OTUR_Y + 2.5, // oturak üstü (kalça çizgisinin hemen altı)
  kalinlik: 4,
  arka: -17, // arkalık x (c + arka): gövdenin arka kenarının gerisinde, görünür kalsın
  on: 6, // oturak ön kenarı x: uzak alt bacağın gerisinde
  arkalikBoy: 56,
};
/** Oturunca ayak noktaları (yakın = sağ, uzak = sol), c = gövde x'i. */
const oturmaAyaklari = (c: number): [Nokta, Nokta] => [
  {x: 120 + c - kalcaDX(1) + GEO.uyluk, y: Z + uzakKalcaDY(1)},
  {x: 120 + c + kalcaDX(1) + GEO.uyluk, y: Z},
];
const GECIS = 10; // hareketler arası karışım (kare)

/** Hareketin bir sonrakine devrettiği durum. */
type Giris = {gx: number; ayaklar: [Nokta, Nokta]; oturma: number; donus: number};

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
  donus: number;
  /** Verilirse kalça yüksekliği (Poz.ziplama) doğrudan budur (yine bacak boyunu aşamaz). */
  ziplamaMutlak?: number;
};

const durus = (gx: number): [Nokta, Nokta] => [
  {x: 120 + gx - DURUS, y: Z},
  {x: 120 + gx + DURUS, y: Z},
];

const tabanZiplama = (ayak: [Nokta, Nokta], gx: number, donus = 0) => {
  const dx = kalcaDX(donus);
  return (
    KALCA_Y0 -
    Math.max(
      kalcaYuksekligi(ayak[0], 120 + gx - dx, L) - uzakKalcaDY(donus),
      kalcaYuksekligi(ayak[1], 120 + gx + dx, L),
    )
  );
};

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
  donus: g.donus,
  ziplamaMutlak: g.oturma < 0 ? OTURMA_Z : undefined,
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

// ── oturan kollar (yan görünüş) ──
// Kol (üst+ön ≈ 50 birim) oturan gövdeye göre uzundur: doğal duruş "dirsekler dizlerde"dir.
// Omuzdan dize mesafe ≈ üst kol boyu, dizden çeneye ≈ ön kol boyu → düşünen adam pozu tam oturur.
const D = 180 / Math.PI;
const yonAci = (dx: number, dy: number) => Math.atan2(dx, dy) * D; // 0 = aşağı, + = ileri (+x)

/** Yan görünüşte omuz noktası (oturan gövde, c = gövde x'i). */
const yanOmuz = (taraf: 'sol' | 'sag', c: number): Nokta => ({
  x: 120 + c + (taraf === 'sol' ? -1 : 1) * omuzDX(1),
  y: GEO.omuzSol.y - OTURMA_Z,
});

/** Dirsek dizde; ön kol `elAci` yönünde (0 = aşağı, 90 = ileri, 180 = yukarı) ya da `el` noktasına doğru. */
const dirsekDizde = (taraf: 'sol' | 'sag', c: number, el: {aci?: number; nokta?: Nokta}): Kol => {
  const o = yanOmuz(taraf, c);
  const ayak = oturmaAyaklari(c)[taraf === 'sol' ? 0 : 1];
  const diz = {x: ayak.x, y: KALCA_OTUR_Y + (taraf === 'sol' ? uzakKalcaDY(1) : 0) - 2};
  const ust = yonAci(diz.x - o.x, diz.y - o.y);
  const r = (ust / D);
  const dirsek = {x: o.x + Math.sin(r) * GEO.ustKol, y: o.y + Math.cos(r) * GEO.ustKol};
  const on = el.nokta ? yonAci(el.nokta.x - dirsek.x, el.nokta.y - dirsek.y) : el.aci ?? 135;
  return [ust, on - ust];
};

/** Oturunca: dirsekler dizlerde, eller önde hafif yukarıda (rahat oturuş). */
const dizdeEller = (c: number): [Kol, Kol] => [dirsekDizde('sol', c, {aci: 128}), dirsekDizde('sag', c, {aci: 138})];

/** Küçük yerinde adım: ayak kalkar, kavisle yeni yerine konar (kaymaz). */
const adim = (bas: Nokta, son: Nokta, w: number, yuk = 6): Nokta => {
  const k = sinirla(w);
  const e = Easing.inOut(Easing.sin)(k);
  return {x: bas.x + (son.x - bas.x) * e, y: bas.y + (son.y - bas.y) * e - yuk * Math.sin(Math.PI * k)};
};

/**
 * otur: sandalyenin önünde durur → iki küçük adımla arkasını sandalyeye döner (3/4 yan) →
 * kalça geriye ve aşağı kavis çizerken gövde öne eğilir, dizler bükülür → oturağa iner, değince basılır.
 * Sonunda üst bacaklar yatay, dizler 90°, alt bacaklar yere dik; eller dizlerde.
 */
const otur = (t: number, g: Giris, _a: HareketAdimi, fps: number): Ham => {
  const c = g.gx - GERI; // oturulacak gövde x'i
  const hedef = oturmaAyaklari(c);
  // 1) dönüş: önce uzak (sol) ayak, sonra yakın (sağ) ayak küçük bir adımla yerine
  const sol = t < 7 ? adim(g.ayaklar[0], hedef[0], t / 7) : hedef[0];
  const sag = t < 5 ? g.ayaklar[1] : t < 12 ? adim(g.ayaklar[1], hedef[1], (t - 5) / 7) : hedef[1];
  const donus = spring({frame: t - 1, fps, config: {damping: 200}, durationInFrames: 11});
  // 2) oturma: kalça önce geri (px), biraz geriden aşağı (pd) → kavisli yol
  const px = spring({frame: t - 12, fps, config: {damping: 16, stiffness: 90, overshootClamping: true}});
  const pd = spring({frame: t - 15, fps, config: {damping: 16, stiffness: 90, overshootClamping: true}});
  const gx = g.gx - GERI * px;
  const ayakta = tabanZiplama([sol, sag], gx, donus);
  const ziplama = ayakta + (OTURMA_Z - ayakta) * pd;
  // denge: inerken gövde öne eğilir, oturunca dikleşir
  const egim = 20 * Math.sin(Math.PI * Math.min(1, pd)) * (1 - 0.15 * pd);
  const [dizSol, dizSag] = dizdeEller(c);
  const ileri: Kol = [70, -25]; // inerken kollar öne uzanır
  const durus: Kol = [3, -2];
  const kol = (diz: Kol): Kol => {
    if (t < 12) return durus;
    const a = sinirla((t - 12) / 8);
    const b = spring({frame: t - 24, fps, config: {damping: 14, stiffness: 110}});
    const ara: Kol = [durus[0] + (ileri[0] - durus[0]) * Easing.out(Easing.quad)(a), durus[1] + (ileri[1] - durus[1]) * a];
    return [ara[0] + (diz[0] - ara[0]) * b, ara[1] + (diz[1] - ara[1]) * b];
  };
  const ezilme = yayToplami(
    [
      {f: 0, deger: 0},
      {f: 28, deger: -0.07, yay: {damping: 14, stiffness: 220}}, // oturağa değince basıl
      {f: 33, deger: 0, yay: {damping: 10, stiffness: 120}},
    ],
    t,
    fps,
  );
  return {
    ...bos(g),
    gx,
    ayaklar: [sol, sag],
    ofset: 0,
    ziplamaMutlak: ziplama,
    oturma: pd > 0.98 ? OTURMA_Z : 0,
    donus,
    govdeEgim: egim,
    ezilme,
    kolSol: kol(dizSol),
    kolSag: kol(dizSag),
    kolAgirlik: 1,
  };
};

/** dusun: otururken yakın el çeneye, dirsek dize; uzak el dizde kalır. */
const dusun = (t: number, g: Giris, _a: HareketAdimi, fps: number): Ham => {
  const c = g.gx;
  const [dizSol, dizSag] = dizdeEller(c);
  const kafaX = 120 + c + 14; // yüz yan görünüşte öne kayar
  const kafaY = GEO.kafa.y - OTURMA_Z;
  const cene = dirsekDizde('sag', c, {nokta: {x: kafaX + 3, y: kafaY + 46}});
  const w = spring({frame: t, fps, config: {damping: 13, stiffness: 90}});
  return {
    ...bos(g),
    kolSol: dizSol,
    kolSag: [dizSag[0] + (cene[0] - dizSag[0]) * w, dizSag[1] + (cene[1] - dizSag[1]) * w],
    kolAgirlik: 1,
    govdeEgim: 4 * w,
    kafaEgim: 5 * w,
  };
};

/**
 * kalk: öne eğil (anticipation, kollar öne) → kalça öne-yukarı ayakların üstüne → dikleş →
 * iki küçük adımla yeniden önüne dön.
 */
const kalk = (t: number, g: Giris, _a: HareketAdimi, fps: number): Ham => {
  const c = g.gx;
  const ayak0 = g.ayaklar;
  const egil = spring({frame: t, fps, config: {damping: 15, stiffness: 120}});
  const it = spring({frame: t - 8, fps, config: {damping: 13, stiffness: 100}});
  const gx = c + GERI * Math.min(1, it) + 2 * egil * (1 - it);
  // kalkarken gövde önce öne eğilir, ayağa kalkınca dikleşir
  const egim = 24 * egil * (1 - spring({frame: t - 14, fps, config: {damping: 14, stiffness: 110}}));
  // dönüş: kalktıktan sonra iki adımla önden duruşa
  const donus = 1 - spring({frame: t - 24, fps, config: {damping: 200}, durationInFrames: 11});
  // önden duruşa dönerken sol ayak sandalyenin ön bacağından uzakta kalsın (ayaklar biraz öne açılır)
  const hedefSol = {x: Math.max(120 + c + GERI - 11, 120 + c + SANDALYE.on + 5), y: Z};
  const hedefSag = {x: 120 + c + GERI + 12, y: Z};
  const sol = t < 24 ? ayak0[0] : t < 31 ? adim(ayak0[0], hedefSol, (t - 24) / 7) : hedefSol;
  const sag = t < 29 ? ayak0[1] : t < 36 ? adim(ayak0[1], hedefSag, (t - 29) / 7) : hedefSag;
  const ayakta = tabanZiplama([sol, sag], gx, donus);
  const ziplama = OTURMA_Z + (ayakta - OTURMA_Z) * Math.min(1, it);
  const [dizSol, dizSag] = dizdeEller(c);
  const ileri: Kol = [62, -30];
  const kol = (diz: Kol): Kol => {
    const a = egil;
    const b = spring({frame: t - 16, fps, config: {damping: 14, stiffness: 100}});
    const ara: Kol = [diz[0] + (ileri[0] - diz[0]) * a, diz[1] + (ileri[1] - diz[1]) * a];
    return [ara[0] + (3 - ara[0]) * b, ara[1] + (-2 - ara[1]) * b];
  };
  const ezilme = yayToplami(
    [
      {f: 0, deger: 0},
      {f: 4, deger: -0.06},
      {f: 12, deger: 0.08, yay: {damping: 12, stiffness: 200}}, // kalkarken uza
      {f: 18, deger: 0, yay: {damping: 10, stiffness: 120}},
    ],
    t,
    fps,
  );
  const agirlik = 1 - spring({frame: t - 36, fps, config: {damping: 200}, durationInFrames: 12});
  return {
    ...bos(g),
    gx,
    ayaklar: [sol, sag],
    ofset: 0,
    ziplamaMutlak: ziplama,
    oturma: it > 0.5 ? 0 : OTURMA_Z,
    donus,
    govdeEgim: egim,
    oneEgim: 0.6 * egil * (1 - it),
    ezilme,
    kolSol: kol(dizSol),
    kolSag: kol(dizSag),
    kolAgirlik: agirlik,
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

const FONK: Record<HareketAdi, (t: number, g: Giris, a: HareketAdimi, fps: number) => Ham> = {dur, yuru, otur, dusun, kalk, zipla};

// ───────────────────────────── birleştirme ─────────────────────────────

const ham = (adimlar: HareketAdimi[], i: number, f: number, fps: number): Ham => {
  const a = adimlar[i];
  return FONK[a.hareket](f - a.baslangic, giris(adimlar, i, fps), a, fps);
};

/** i. adımın devraldığı durum = (i−1). adımın, i. adımın başladığı karedeki hali. */
const giris = (adimlar: HareketAdimi[], i: number, fps: number): Giris => {
  if (i === 0) {
    const gx = adimlar[0].x ?? 0;
    return {gx, ayaklar: durus(gx), oturma: 0, donus: 0};
  }
  const h = ham(adimlar, i - 1, adimlar[i].baslangic, fps);
  return {gx: h.gx, ayaklar: h.ayaklar, oturma: h.oturma, donus: h.donus};
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
        donus: karistir(o.donus, h.donus, w),
        ziplamaMutlak:
          h.ziplamaMutlak === undefined && o.ziplamaMutlak === undefined
            ? undefined
            : karistir(o.ziplamaMutlak ?? tabanZiplama(o.ayaklar, o.gx, o.donus) + o.ofset, h.ziplamaMutlak ?? tabanZiplama(h.ayaklar, h.gx, h.donus) + h.ofset, w),
        kolSol: karistirKol(o.kolAgirlik > 0.001 ? o.kolSol : h.kolSol, h.kolSol, w),
        kolSag: karistirKol(o.kolAgirlik > 0.001 ? o.kolSag : h.kolSag, h.kolSag, w),
        kolAgirlik: karistir(o.kolAgirlik, h.kolAgirlik, w),
      };
    }
  }

  // kalça: ayakların izin verdiği en yüksek nokta + hareket ofseti; yerdeyken bacak boyunu aşamaz
  const taban = tabanZiplama(h.ayaklar, h.gx, h.donus);
  const ziplama =
    h.hava > 0 ? taban + h.ofset : Math.min(taban, h.ziplamaMutlak !== undefined ? h.ziplamaMutlak : taban + h.ofset);
  // havadayken ayaklar kalçanın altında toplanır (tuck); yerdeyken yerinde kalır
  const kalcaY = KALCA_Y0 - ziplama;
  const ayaklar = h.ayaklar.map((a, j) => {
    if (h.hava <= 0) return a;
    const kx = 120 + h.gx + (j === 0 ? -kalcaDX(h.donus) : kalcaDX(h.donus));
    const dx = Math.abs(a.x - kx);
    const erisim = Math.sqrt(Math.max(0, (L * 0.985) ** 2 - dx * dx));
    return {x: a.x + (j === 0 ? -4 : 4) * h.hava, y: Math.min(a.y, kalcaY + erisim - 12 * h.hava)};
  }) as [Nokta, Nokta];

  // sandalye: listede otur varsa, oturulan yerde
  const oi = adimlar.findIndex((a) => a.hareket === 'otur');
  const sandalyeX = oi >= 0 ? giris(adimlar, oi, fps).gx - GERI : null;

  return {
    gx: h.gx,
    ziplama,
    ezilme: h.ezilme,
    govdeEgim: h.govdeEgim,
    kafaEgim: h.kafaEgim,
    oneEgim: h.oneEgim,
    donus: h.donus,
    ayaklar,
    kolSol: h.kolSol,
    kolSag: h.kolSag,
    kolAgirlik: sinirla(h.kolAgirlik),
    sandalyeX,
  };
};
