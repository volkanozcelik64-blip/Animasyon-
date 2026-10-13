// Nod'un hazır hareketleri (§5, §6, §7). Hepsi Nod YERELİNDE (sağa bakan) çalışır; sahne dünya konumunu,
// aynalamayı ve ekran ölçeğini ekler. Doğrusal hareket yok: yumuşatma, anticipation, overshoot, follow-through.
// Rastgelelik yalnızca Remotion random(seed) ile.
import { random } from 'remotion';
import { OLCU, GORUNUS } from './olculer';
import { AYAKTA, OTURAN, pozKaristir, type Poz, type Kol } from './poz';
import { bacakIK, kolIK, bilekNerede, ikiKemik, type V } from './ik';
import type { Agiz } from './olculer';

// ---------------------------------------------------------------- yumuşatma
export const sinirla = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const yumusak = (t: number) => { const x = sinirla(t); return x * x * (3 - 2 * x); };
export const cikis = (t: number) => 1 - (1 - sinirla(t)) ** 3;
export const giris3 = (t: number) => sinirla(t) ** 3;
/** hedefi biraz geçip geri gelir (overshoot) */
export const geriTepme = (t: number, s = 1.6) => { const x = sinirla(t) - 1; return 1 + x * x * ((s + 1) * x + s); };
export const aralik = (k: number, bas: number, son: number) => sinirla((k - bas) / (son - bas));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const KALCA_Y: number = OLCU.kalcaY;
const BILEK_Y: number = OLCU.bilekY;
const OMUZ_Y = OLCU.omuzY - OLCU.kalcaY; // üst gövde yerelinde

/** Kolu iki kemikli IK ile hedefe götür; dirseği aşağıda kalan çözümü seç. */
export function kolHedef(omuzX: number, bilek: V, elAci: number, el: Kol['el'], ayna = false): Kol {
  const S = { x: omuzX, y: OMUZ_Y };
  const a = ikiKemik(S, bilek, OLCU.ustKol, OLCU.onKol, 1);
  const b = ikiKemik(S, bilek, OLCU.ustKol, OLCU.onKol, -1);
  const taraf: 1 | -1 = a.dirsek.y >= b.dirsek.y ? 1 : -1;
  const r = kolIK(S, bilek, elAci, taraf);
  return { omuz: r.omuz, dirsek: r.dirsek, bilek: r.bilek, el, ayna };
}

const kolKar = (a: Kol, b: Kol, t: number): Kol => ({
  omuz: lerp(a.omuz, b.omuz, t), dirsek: lerp(a.dirsek, b.dirsek, t), bilek: lerp(a.bilek, b.bilek, t),
  el: t < 0.5 ? a.el : b.el, ayna: t < 0.5 ? a.ayna : b.ayna, arkada: t < 0.5 ? a.arkada : b.arkada,
});

// ---------------------------------------------------------------- yürüyüş (§7): sekerek, neşeli
export const YURU = { periyot: 16, adim: 80, kaldirma: 24, sekme: 11 } as const;

/**
 * Yan görünüşte sekerek yürüme. faz: kare / periyot. Ayaklar dünyada sabit basar (kaymaz): her ayak
 * yarım döngü yerde, yarım döngü havada; kalça ayakların üstünden geçer, basan ayağın tam üstündeyken en yukarıda.
 * son: durma noktası (kalçanın varacağı x); son adımda arka ayak öndekinin yanına gelir.
 * Dönüş: kalça dünya x (başlangıç 0'a göre) ve poz.
 */
export function yuru(faz: number, son?: number): { kalcaX: number; poz: Poz } {
  const L = YURU.adim;
  const s0 = 0;
  const A = GORUNUS.yan;
  // ayak (o: faz kayması, taban: ilk basma noktası)
  const ayak = (o: number, taban: number) => {
    const psi = faz + o;
    const n = Math.floor(psi), f = psi - n;
    const u = f < 0.5 ? 0 : yumusak((f - 0.5) / 0.5);
    const x = taban + 2 * L * (n + u);
    const y = f < 0.5 ? BILEK_Y : BILEK_Y - Math.sin(Math.PI * (f - 0.5) / 0.5) * YURU.kaldirma;
    return { x, y };
  };
  let kx = s0 + 2 * L * (faz - 0.25);
  let a = ayak(0, s0); // sağ (yakın) bacak
  let b = ayak(0.5, s0 - L); // sol (uzak) bacak
  // kalça: basan ayağın üstünde en yüksek (sekme), topuk vuruşunda en alçak
  let ky = KALCA_Y + 9 - YURU.sekme * (0.5 + 0.5 * Math.cos(4 * Math.PI * (faz - 0.25)));
  if (son !== undefined) {
    // durma: kalça son'a yumuşakça varır, ayaklar son'u geçmez, son adım yarım adım olur
    const asim = kx - (son - 1.5 * L);
    if (asim > 0) {
      const t = sinirla(asim / (1.5 * L * 1.2));
      kx = son - 1.5 * L + 1.5 * L * cikis(t);
      const sabitle = (p: V) => (p.x >= son ? { x: son, y: p.x > son + 4 ? BILEK_Y : p.y } : p);
      a = sabitle(a);
      b = sabitle(b);
      ky = lerp(ky, KALCA_Y, yumusak(t));
    }
  }
  const sag = bacakIK({ x: A.kalcaX.sag, y: ky }, { x: a.x - kx, y: a.y });
  const sol = bacakIK({ x: A.kalcaX.sol, y: ky }, { x: b.x - kx, y: b.y });
  // kollar bacaklarla karşılıklı sallanır (+ = geri)
  const sal = Math.cos(2 * Math.PI * faz) * 30;
  const poz: Poz = {
    ...AYAKTA.yan,
    kok: { x: 0, y: ky },
    egim: 5,
    kafaEgim: -2 + 2 * Math.cos(4 * Math.PI * (faz - 0.35)), // kafa gövdeden biraz geç
    sagKol: { omuz: sal, dirsek: -22, bilek: 0, el: 'acik' },
    solKol: { omuz: -sal, dirsek: -22, bilek: 0, el: 'acik' },
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
  return { kalcaX: kx, poz };
}

// ---------------------------------------------------------------- tek adım (yandan): duruştan duruşa
export const ADIM_SURE = 22;

/**
 * Bulunduğu yerden `mesafe` kadar ileri (yerel +x) sekerek bir adım: önce yakın ayak, sonra uzak ayak
 * öne gelir; basan ayak kaymaz, kalça iki ayağın ortasında kalır, her ayak kalkışında hafif sekme.
 * Dönüş: kalçanın aldığı yol ve poz (yan görünüş).
 */
export function adim(k: number, mesafe: number): { kalcaX: number; poz: Poz } {
  const A = GORUNUS.yan;
  const ayak = (bas: number, son: number) => {
    const t = aralik(k, bas, son);
    return { x: mesafe * yumusak(t), y: BILEK_Y - Math.sin(Math.PI * t) * YURU.kaldirma };
  };
  const a = ayak(0, 12); // yakın (sağ) ayak önce
  const b = ayak(9, ADIM_SURE); // sonra uzak (sol) ayak
  const kx = (a.x + b.x) / 2;
  const sekme = 8 * (Math.sin(Math.PI * aralik(k, 0, 12)) + Math.sin(Math.PI * aralik(k, 9, ADIM_SURE))) / 2;
  const ky = KALCA_Y + 5 - sekme;
  const sag = bacakIK({ x: A.kalcaX.sag, y: ky }, { x: A.kalcaX.sag + a.x - kx, y: a.y });
  const sol = bacakIK({ x: A.kalcaX.sol, y: ky }, { x: A.kalcaX.sol + b.x - kx, y: b.y });
  const sal = 26 * Math.sin(Math.PI * aralik(k, 0, ADIM_SURE) * 2);
  const poz: Poz = {
    ...AYAKTA.yan,
    kok: { x: 0, y: ky },
    egim: 5 * Math.sin(Math.PI * aralik(k, 0, ADIM_SURE)),
    sagKol: { omuz: sal, dirsek: -20, bilek: 0, el: 'acik' },
    solKol: { omuz: -sal, dirsek: -20, bilek: 0, el: 'acik' },
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
  return { kalcaX: kx, poz };
}

// ---------------------------------------------------------------- oturma / kalkma (§7, yandan)
/** Oturmuş Nod'un kalçası, ayak bileklerinin ne kadar gerisinde (ayaklar yerde, baldır 8° önde). */
export const OTURMA_ILERI = OLCU.ustBacak + OLCU.altBacak * Math.sin((8 * Math.PI) / 180);

/**
 * Otur: p 0 → 1. Kalça (0,0 = oturak) yerel; ayaklar başta kalçanın altında, sonuna kadar yerinde (IK).
 * Anticipation: önce gövde öne eğilir ve kalça geri itilir, sonra iner, oturakta hafif yaylanır.
 */
export function otur(p: number): Poz {
  const A = GORUNUS.yan;
  const ayakX = (tf: 'sag' | 'sol') => OTURMA_ILERI + A.kalcaX[tf];
  const inis = yumusak(aralik(p, 0.12, 0.85));
  const kx = OTURMA_ILERI * (1 - inis);
  const yay = Math.sin(Math.PI * aralik(p, 0.85, 1)) * 4; // oturağa değince yaylanma
  const ky = lerp(KALCA_Y, OTURAN.kok.y, yumusak(aralik(p, 0.18, 0.88))) + yay;
  const egim = 30 * Math.sin(Math.PI * aralik(p, 0, 0.95)) * (1 - 0.3 * aralik(p, 0.6, 1)) + OTURAN.egim * aralik(p, 0.8, 1);
  const sag = bacakIK({ x: kx + A.kalcaX.sag, y: ky }, { x: ayakX('sag'), y: BILEK_Y });
  const sol = bacakIK({ x: kx + A.kalcaX.sol, y: ky }, { x: ayakX('sol'), y: BILEK_Y });
  // kollar: denge için öne uzanır, sonunda dizlere yerleşir
  const ileri: Kol = { omuz: -55, dirsek: -15, bilek: 0, el: 'acik' };
  const kol = (bas: Kol, son: Kol) => {
    const a = aralik(p, 0.1, 0.5), b = aralik(p, 0.55, 1);
    return a < 1 ? kolKar(bas, ileri, yumusak(a)) : kolKar(ileri, son, yumusak(b));
  };
  return {
    ...OTURAN,
    kok: { x: kx, y: ky },
    egim,
    kafaEgim: -egim * 0.35, // kafa gövdeden geç gelir, dik kalmaya çalışır
    sagKol: kol(AYAKTA.yan.sagKol, OTURAN.sagKol),
    solKol: kol(AYAKTA.yan.solKol, OTURAN.solKol),
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
}

/** Kalk: p 0 → 1. Gövde öne eğilir, eller dizlere basar, bacaklar açılır, kafa en son yerine oturur. */
export function kalk(p: number): Poz {
  const A = GORUNUS.yan;
  const ayakX = (tf: 'sag' | 'sol') => OTURMA_ILERI + A.kalcaX[tf];
  const kalkis = yumusak(aralik(p, 0.3, 0.9));
  const kx = OTURMA_ILERI * kalkis;
  const ky = lerp(OTURAN.kok.y, KALCA_Y, yumusak(aralik(p, 0.32, 0.92)));
  const egim = 34 * Math.sin(Math.PI * aralik(p, 0, 0.92)) + OTURAN.egim * (1 - aralik(p, 0, 0.3));
  const sag = bacakIK({ x: kx + A.kalcaX.sag, y: ky }, { x: ayakX('sag'), y: BILEK_Y });
  const sol = bacakIK({ x: kx + A.kalcaX.sol, y: ky }, { x: ayakX('sol'), y: BILEK_Y });
  // eller dizlere basar (0.15–0.6), sonra yanlara iner
  const bas: Kol = { omuz: -18, dirsek: -40, bilek: -30, el: 'acik' };
  const kol = (oturan: Kol, son: Kol) => {
    const a = aralik(p, 0, 0.2), b = aralik(p, 0.6, 1);
    return a < 1 ? kolKar(oturan, bas, yumusak(a)) : kolKar(bas, son, yumusak(b));
  };
  // kafa en son: gövdeden 2-3 kare geç (gecikmeli eğim)
  const egimGec = 34 * Math.sin(Math.PI * aralik(p - 0.08, 0, 0.92));
  return {
    ...OTURAN,
    kok: { x: kx, y: ky },
    egim,
    kafaEgim: -(egim - egimGec) * 0.8 - egim * 0.25,
    sagKol: kol(OTURAN.sagKol, AYAKTA.yan.sagKol),
    solKol: kol(OTURAN.solKol, AYAKTA.yan.solKol),
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
}

// ---------------------------------------------------------------- zıplama (§7)
export const ZIPLA = { comel: 8, itis: 12, inis: 31, sakin: 44, yukseklik: 150 } as const;
export const ZIPLA_SURE = ZIPLA.sakin;

/**
 * Ayakta zıpla (her görünüşte; izleyiciye dönük için 'ucdort' ya da 'on'):
 * belirgin çömelme (8 kare: kalça iner, dizler bükülür, kollar geride) → fırlama (gerilme) →
 * havada kollar V şeklinde yukarı açık, atkı yukarı savrulur, tepe ≥ 1 kafa boyu (150 birim) →
 * iniş: gövde %10 basık, dizler bükülü → toparlanma. k: 0 … ZIPLA_SURE.
 * Dönüş: poz, havada (zeminden yükseklik), ezilme (sx, sy; hacim korunur), atkiHavada (0 … 1).
 */
export function zipla(k: number, gorunus: Poz['gorunus'] = 'ucdort'): {
  poz: Poz; havada: number; ezilme: { x: number; y: number }; atkiHavada: number;
} {
  const A = GORUNUS[gorunus];
  const T = ZIPLA;
  let ky = KALCA_Y, havada = 0, sy = 1, kolA = 0, atkiHavada = 0;
  if (k < T.comel) {
    const t = yumusak(k / T.comel);
    ky = KALCA_Y + 40 * t; kolA = -t; sy = 1 - 0.04 * t;
  } else if (k < T.itis) {
    const t = aralik(k, T.comel, T.itis);
    ky = lerp(KALCA_Y + 40, KALCA_Y, cikis(t)); kolA = lerp(-1, 1, cikis(t)); sy = 1 + 0.08 * cikis(t);
  } else if (k < T.inis) {
    // balistik kavis, tepede yavaşlar (asılı kalma)
    const t = aralik(k, T.itis, T.inis);
    havada = T.yukseklik * Math.sin(Math.PI * t) ** 0.8;
    kolA = 1;
    sy = 1 + 0.07 * (1 - t) * (t < 0.5 ? 1 : 0.4);
    ky = KALCA_Y + 16 * Math.sin(Math.PI * t); // havada dizler hafif toplanır
    atkiHavada = yumusak(aralik(t, 0.2, 0.55));
  } else {
    // iniş: %10 basıklık + dizler bükülür, sonra toparlanır
    const t = aralik(k, T.inis, T.sakin);
    const ez = Math.sin(Math.PI * Math.min(1, aralik(k, T.inis, T.inis + 8)));
    sy = 1 - 0.1 * ez;
    ky = KALCA_Y + 34 * ez * (1 - 0.3 * t);
    kolA = lerp(0.6, 0, yumusak(t));
    atkiHavada = 1 - yumusak(aralik(k, T.inis, T.inis + 8));
  }
  const ayakY = BILEK_Y;
  const sag = bacakIK({ x: A.kalcaX.sag, y: ky }, { x: A.kalcaX.sag + 3, y: ayakY });
  const sol = bacakIK({ x: A.kalcaX.sol, y: ky }, { x: A.kalcaX.sol + 3, y: ayakY });
  // kollar: çömelirken geride, havada V (yakın kol bir yana, uzak kol öbür yana açılır)
  const V = 148;
  const kol = (taraf: 1 | -1, temel: Kol): Kol => {
    const omuz = kolA >= 0 ? lerp(temel.omuz, taraf * V, kolA) : lerp(temel.omuz, 32, -kolA);
    return { omuz, dirsek: -6 * taraf * Math.max(0, kolA), bilek: 0, el: kolA > 0.5 ? 'salla' : 'acik', ayna: taraf < 0 };
  };
  const temel = AYAKTA[gorunus];
  const poz: Poz = {
    ...temel,
    kok: { x: 0, y: ky },
    egim: k < T.itis ? 5 * Math.sin(Math.PI * aralik(k, 0, T.itis)) : 0,
    kafaEgim: k < T.comel ? -3 : 0,
    sagKol: kol(1, temel.sagKol),
    solKol: kol(-1, temel.solKol),
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
  return { poz, havada, ezilme: { x: 1 / Math.sqrt(sy), y: sy }, atkiHavada };
}

// ---------------------------------------------------------------- idle (§5): nefes, göz kırpma, yaylanma
/** Hafif nefes: kalça/gövde 1-2 birim iner kalkar (~2 sn). */
export const nefes = (k: number) => 1.4 * Math.sin((2 * Math.PI * k) / 64);

/** 3-5 sn'de bir göz kırpma (random(seed) ile aralık); 0 … 1. */
export function gozKirp(k: number, tohum = 'nod'): number {
  let t = 20;
  for (let i = 0; i < 200 && t <= k + 6; i++) {
    const d = k - t;
    if (d >= 0 && d < 6) return Math.sin((Math.PI * d) / 6) ** 0.7;
    t += 90 + Math.floor(random(`${tohum}-kirp-${i}`) * 60);
  }
  return 0;
}

/** Ara sıra ayakları üzerinde hafif yaylanma: kalça birkaç birim çöker (dizler bükülür). */
export function yaylanma(k: number, tohum = 'nod'): number {
  const periyot = 150;
  const i = Math.floor(k / periyot);
  const bas = i * periyot + 40 + Math.floor(random(`${tohum}-yay-${i}`) * 60);
  const d = k - bas;
  return d >= 0 && d < 14 ? 5 * Math.sin((Math.PI * d) / 14) : 0;
}

/** Ayakta pozu verilen çökme ile güncelle (ayaklar yerde kalır: IK). */
export function ayaktaCok(poz: Poz, cokme: number): Poz {
  if (cokme === 0) return poz;
  const A = GORUNUS[poz.gorunus];
  const ky = poz.kok.y + cokme;
  const ik = (tf: 'sag' | 'sol', b: Poz['sagBacak']) => {
    const kx = A.kalcaX[tf];
    // bileğin mevcut yerini koru
    const L1 = OLCU.ustBacak, L2 = OLCU.altBacak, d = Math.PI / 180;
    const diz = { x: kx - L1 * Math.sin(b.kalca * d), y: poz.kok.y + L1 * Math.cos(b.kalca * d) };
    const a2 = b.kalca + b.diz;
    const bilek = { x: diz.x - L2 * Math.sin(a2 * d), y: diz.y + L2 * Math.cos(a2 * d) };
    return { ...b, ...bacakIK({ x: kx, y: ky }, bilek) };
  };
  if (poz.gorunus !== 'yan') {
    // önden/arkadan dizler öne kırılır: yalnızca kalçayı indir, bacak boyu küçük farkı kaldırır
    return { ...poz, kok: { ...poz.kok, y: poz.kok.y + Math.min(cokme, 3) } };
  }
  return { ...poz, kok: { ...poz.kok, y: ky }, sagBacak: ik('sag', poz.sagBacak), solBacak: ik('sol', poz.solBacak) };
}

// ---------------------------------------------------------------- konuşma
/** Konuşurken ara ara küçük onay sallamaları: bas değeri (0 … ~0.35). */
export function konusmaSallama(k: number): number {
  const periyot = 26;
  const d = k % periyot;
  return d < 8 ? 0.35 * Math.sin((Math.PI * d) / 8) : 0;
}

/** Basit ağız sırası (sesten değil, metin hecelerinden): 3 karede bir şekil. */
export function agizSirasi(k: number, sira: Agiz[]): Agiz {
  if (k < 0) return 'kapali';
  const i = Math.floor(k / 3);
  return i < sira.length ? sira[i] : 'kapali';
}
/** "Selam, ben Nod!" */
export const SELAM: Agiz[] = ['E', 'A', 'MBP', 'A', 'kapali', 'MBP', 'E', 'I', 'kapali', 'I', 'O', 'O', 'kapali'];

// ---------------------------------------------------------------- imza hareketleri (§5)
export const GIRIS_SURE = 60;

/**
 * giris (önden): atkısını iki eliyle düzeltir (0–20), kafasını sallar (20–32), el sallar + "Selam, ben Nod!" (32–60).
 * Dönüş: poz + kafa dönüşü + bas + ağız.
 */
export function giris(k: number): { poz: Poz; kafaDonus: number; bas: number; agiz: Agiz } {
  const A = GORUNUS.on;
  const temel = AYAKTA.on;
  // 1) atkı düzeltme: yumruklar atkının iki yanında, iki kez aşağı çekiştirir
  const cek = k >= 6 && k < 18 ? 4 * Math.sin((2 * Math.PI * (k - 6)) / 6) : 0;
  const tutSag = kolHedef(A.omuzX.sag, bilekNerede({ x: -34, y: OLCU.boyunY - OLCU.kalcaY + 2 + Math.max(0, cek) }, 200, 14), 200, 'yumruk', true);
  const tutSol = kolHedef(A.omuzX.sol, bilekNerede({ x: 34, y: OLCU.boyunY - OLCU.kalcaY + 2 + Math.max(0, cek) }, 160, 14), 160, 'yumruk', false);
  const tutma = yumusak(aralik(k, 0, 6)) * (1 - yumusak(aralik(k, 18, 24)));
  let sagKol = kolKar(temel.sagKol, tutSag, tutma);
  let solKol = kolKar(temel.solKol, tutSol, tutma);
  // 2) kafa sallama
  const sallaT = aralik(k, 20, 32);
  const kafaDonus = k >= 20 && k < 32 ? 0.2 * Math.sin(2 * Math.PI * sallaT * 2) * (1 - sallaT * 0.5) : 0;
  // 3) el sallama (anticipation: kol önce hafif iner, sonra fırlar ve biraz geçer)
  const kalk = geriTepme(aralik(k, 30, 38));
  const sallaKol: Kol = { omuz: -106, dirsek: -58, bilek: -4 + 22 * Math.sin((2 * Math.PI * (k - 36)) / 8), el: 'salla', ayna: true };
  const in1 = k < 30 ? 0 : k < 32 ? -0.08 * aralik(k, 30, 32) : kalk;
  const in2 = yumusak(aralik(k, 54, 60));
  solKol = kolKar(solKol, sallaKol, sinirla(in1, -0.1, 1.05) * (1 - in2));
  const agiz = agizSirasi(k - 38, SELAM);
  const bas = (k >= 6 && k < 18 ? 0.15 : 0) + (k >= 38 ? konusmaSallama(k - 38) : 0);
  return { poz: { ...temel, sagKol, solKol, kafaEgim: k >= 32 ? 4 * yumusak(aralik(k, 32, 38)) : 0 }, kafaDonus, bas, agiz };
}

export const FIKIR_DURAKSAMA = 15; // ampul belirdikten sonra 0,5 sn
export const FIKIR_SURE = FIKIR_DURAKSAMA + 22;

/**
 * fikir: önce ampul belirir (0–8, overshoot), 0,5 sn duraksama (Nod ampule bakar), sonra işaret parmağını
 * kaldırır (küçük anticipation + overshoot) ve atkının ucu ünlem gibi dikleşir.
 * temel: o anki poz (ayakta ya da oturan); yakın kol (sag) kalkar.
 */
export function fikir(k: number, temel: Poz): { poz: Poz; fikir: boolean; parlama: number; atkiUnlem: boolean } {
  const A = GORUNUS[temel.gorunus];
  // el yüzü kapatmadan yukarıda: yandan bakışta omzun önünde-yukarısında; önden kafanın yanında (dışa doğru)
  const yukari: Kol = temel.gorunus === 'on'
    ? kolHedef(A.omuzX.sag, { x: A.omuzX.sag - 52, y: OMUZ_Y - 78 }, 186, 'isaret', true)
    : kolHedef(A.omuzX.sag, { x: A.omuzX.sag + 76, y: OMUZ_Y - 64 }, 176, 'isaret', true);
  const h = k - FIKIR_DURAKSAMA;
  const once = h < 0 ? 0 : h < 5 ? -0.12 * yumusak(h / 5) : geriTepme(aralik(h, 5, 13));
  const sagKol = kolKar(temel.sagKol, yukari, sinirla(once, -0.12, 1.08));
  const parlama = geriTepme(aralik(k, 0, 8), 2.2);
  return { poz: { ...temel, sagKol }, fikir: true, parlama, atkiUnlem: h >= 7 };
}

export const ONAY_SURE = 16;

/** onay: iki kez hızlı kafa sallama (bas: + = öne). */
export function onay(k: number): number {
  if (k < 0 || k >= ONAY_SURE) return 0;
  const vurus = (d: number) => (d >= 0 && d < 7 ? Math.sin((Math.PI * d) / 7) : 0);
  return 0.9 * vurus(k) + 0.8 * vurus(k - 8);
}

export { pozKaristir };
