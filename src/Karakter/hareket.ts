// Hareket yardımcıları: yay (spring) toplamları, gecikmeli takipçi (follow-through),
// zıplama eğrisi (anticipation + squash & stretch), bacak IK, idle nefes ve rastgele göz kırpma.
// Hepsi kare numarasının saf fonksiyonudur → Remotion'da her kare bağımsız ve deterministik.

import {Easing, interpolate, random, spring, SpringConfig} from 'remotion';

export const YAY = {
  /** gövde / kalça: hızlı, az salınımlı */
  govde: {damping: 15, stiffness: 140, mass: 1} as Partial<SpringConfig>,
  /** kollar: yumuşak, hafif aşan (overshoot) */
  kol: {damping: 11, stiffness: 90, mass: 1} as Partial<SpringConfig>,
  /** yüz ifadesi geçişi: aşmasız */
  yuz: {damping: 200, stiffness: 60, mass: 1} as Partial<SpringConfig>,
  /** oturma: yere/tabureye çarpıp geri sekmesin */
  oturma: {damping: 18, stiffness: 110, mass: 1, overshootClamping: true} as Partial<SpringConfig>,
};

export const sinirla = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** interpolate + clamp + easing kısayolu (varsayılan inOut cubic). */
export const ara = (f: number, a: number, b: number, e: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

export type Anahtar = {f: number; deger: number; yay?: Partial<SpringConfig>; gecikme?: number};

/**
 * Yay toplamı: değer(f) = ilk + Σ (değer_k − değer_{k−1}) · spring_k(f − f_k).
 * Her anahtar kendi yayını sıfır hızla başlatır; önceki yay bitmemiş olsa bile sonuç süreklidir (pop yok).
 */
export const yayToplami = (anahtarlar: Anahtar[], f: number, fps: number, varsayilan: Partial<SpringConfig> = YAY.govde) => {
  if (anahtarlar.length === 0) return 0;
  let v = anahtarlar[0].deger;
  for (let i = 1; i < anahtarlar.length; i++) {
    const k = anahtarlar[i];
    const t = f - k.f - (k.gecikme ?? 0);
    if (t <= 0) continue;
    v += (k.deger - anahtarlar[i - 1].deger) * spring({frame: t, fps, config: k.yay ?? varsayilan});
  }
  return v;
};

/**
 * Gecikmeli takipçi (follow-through): hedef(f) değerlerini ikinci dereceden bir yayla izler.
 * Hedef durunca takipçi biraz geç kalır ve hafifçe aşıp oturur. 0. kareden f'ye kadar simüle edilir.
 */
export const takipci = (hedef: (f: number) => number[], f: number, sertlik = 0.22, sonum = 0.5): number[] => {
  const x = hedef(0).slice();
  const v = x.map(() => 0);
  for (let i = 1; i <= f; i++) {
    const h = hedef(i);
    for (let j = 0; j < x.length; j++) {
      v[j] += sertlik * (h[j] - x[j]) - sonum * v[j];
      x[j] += v[j];
    }
  }
  return x;
};

/**
 * Tek zıplama: hazırlık (çömelme, squash) → kalkış (stretch) → kavisli uçuş → iniş (squash) → toparlanma.
 * t = zıplama başından beri kare. Dönen y yukarı pozitif (birim), ezilme: + uzama, − basılma.
 */
export const ziplamaEgrisi = (
  t: number,
  fps: number,
  {hazirlik = 7, havada = 14, yukseklik = 60, cokme = 12}: {hazirlik?: number; havada?: number; yukseklik?: number; cokme?: number} = {},
) => {
  if (t <= 0) return {y: 0, ezilme: 0, havadaMi: 0, u: 0};
  if (t < hazirlik) {
    // anticipation: aşağı çömel, gövde basılır
    const a = Easing.inOut(Easing.sin)(t / hazirlik);
    return {y: -cokme * a, ezilme: -0.1 * a, havadaMi: 0, u: 0};
  }
  const ta = t - hazirlik;
  if (ta < havada) {
    const u = ta / havada;
    // parabol (kavisli yol) + çömelmeden hızlı çıkış
    const y = yukseklik * 4 * u * (1 - u) - cokme * Math.pow(1 - u, 6);
    // hız yüksekken uzama, tepe noktasında yuvarlak
    const ezilme = 0.16 * Math.pow(Math.abs(1 - 2 * u), 1.5) - 0.1 * Math.pow(1 - u, 12);
    return {y, ezilme, havadaMi: Math.sin(Math.PI * u), u};
  }
  // iniş: darbe yayı (squash), sonra hafif aşıp yerleşir
  const tl = ta - havada;
  const darbe = (1 - spring({frame: tl, fps, config: {damping: 9, stiffness: 170}})) * (1 - Math.exp(-tl / 1.6));
  return {y: -cokme * 0.9 * darbe, ezilme: -0.17 * darbe, havadaMi: 0, u: 1};
};

/**
 * 2 kemikli bacak IK (dünya koordinatı). Diz dışa doğru kırılır (önden görünüş).
 * Dönen: diz ve ayak noktası (ayak ulaşılamıyorsa bacak boyunca kısaltılır).
 */
export const bacakIK = (
  kalca: {x: number; y: number},
  ayak: {x: number; y: number},
  L1: number,
  L2: number,
  disYon: -1 | 1,
) => {
  const dx = ayak.x - kalca.x;
  const dy = ayak.y - kalca.y;
  const d0 = Math.hypot(dx, dy) || 0.001;
  const d = Math.min(d0, L1 + L2 - 0.05);
  const ux = dx / d0;
  const uy = dy / d0;
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  // iki dik yönden dışa bakanı seç
  let px = -uy;
  let py = ux;
  if (px * disYon < 0) {
    px = -px;
    py = -py;
  }
  const diz = {x: kalca.x + ux * a + px * h, y: kalca.y + uy * a + py * h};
  const uc = {x: kalca.x + ux * d, y: kalca.y + uy * d};
  return {diz, ayak: uc};
};

/** Bacak boyunun izin verdiği en yüksek kalça (ayak düz değil, hafif kırık kalsın). */
export const kalcaYuksekligi = (ayak: {x: number; y: number}, kalcaX: number, L: number, pay = 0.985) => {
  const dx = Math.abs(ayak.x - kalcaX);
  const r = L * pay;
  return ayak.y - Math.sqrt(Math.max(0, r * r - dx * dx));
};

// ───────────────────────────── idle ─────────────────────────────

/** Tohuma göre 3–5 sn aralıklı göz kırpma anları (kare). */
export const kirpmaAnlari = (tohum: string, fps: number, sure = 60 * 60) => {
  const anlar: number[] = [];
  let t = fps * (0.6 + random(`${tohum}-ilk`) * 1.6); // ilk kırpma 0.6–2.2 sn
  let i = 0;
  while (t < sure) {
    anlar.push(Math.round(t));
    // ara sıra çift kırpma
    if (random(`${tohum}-cift-${i}`) < 0.18) anlar.push(Math.round(t + fps * 0.22));
    t += fps * (3 + random(`${tohum}-${i}`) * 2);
    i++;
  }
  return anlar;
};

const kirpmaOnbellek = new Map<string, number[]>();

/** f karesindeki göz kapanma miktarı (0..1): hızlı kapanır, yavaş açılır. */
export const kirpmaDegeri = (f: number, fps: number, tohum: string) => {
  const anahtar = `${tohum}@${fps}`;
  let anlar = kirpmaOnbellek.get(anahtar);
  if (!anlar) {
    anlar = kirpmaAnlari(tohum, fps);
    kirpmaOnbellek.set(anahtar, anlar);
  }
  let m = 0;
  for (const k of anlar) {
    if (k > f + 2) break;
    const t = f - k;
    if (t < -2 || t > 6) continue;
    const v =
      t < 0
        ? Easing.in(Easing.quad)((t + 2) / 2) // 2 karede kapan
        : 1 - Easing.out(Easing.cubic)(t / 6); // 6 karede aç
    m = Math.max(m, v);
  }
  return m;
};

/** Nefes: ~3.4 sn periyot, 0..1 arası yumuşak dalga ve kollar için gecikmeli faz. */
export const nefes = (f: number, fps: number, periyot = 3.4) => {
  const w = (f / fps) * ((Math.PI * 2) / periyot);
  return {deger: (1 - Math.cos(w)) / 2, kol: Math.sin(w - 0.9)};
};
