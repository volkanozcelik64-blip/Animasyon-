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
export const ZIPLA_SURE = 34;

/**
 * Ayakta zıpla (yandan): çömel → fırla (kollar yukarı, atkı savrulur) → tepede kısa asılı kal →
 * iniş (squash) → dengelen. k: 0 … ZIPLA_SURE. Dönüş: poz, havada (zeminden yükseklik),
 * ezilme (sx, sy; hacim korunur), gölge ölçeği.
 */
export function zipla(k: number): { poz: Poz; havada: number; ezilme: { x: number; y: number } } {
  const A = GORUNUS.yan;
  const T = { comel: 7, itis: 11, tepe: 18, inis: 25, sakin: 34 };
  let ky = KALCA_Y, havada = 0, sy = 1;
  let kolA = 0; // 0 = yanlarda, -1 = geride, 1 = yukarıda
  if (k < T.comel) {
    const t = yumusak(k / T.comel);
    ky = KALCA_Y + 34 * t; kolA = -t; sy = 1 - 0.05 * t;
  } else if (k < T.itis) {
    const t = aralik(k, T.comel, T.itis);
    ky = lerp(KALCA_Y + 34, KALCA_Y, cikis(t)); kolA = lerp(-1, 1, cikis(t)); sy = 1 + 0.08 * t;
    havada = 10 * t * t;
  } else if (k < T.inis) {
    // balistik kavis; tepede yavaşlar (asılı kalma)
    const t = aralik(k, T.itis, T.inis);
    havada = 10 + 92 * Math.sin(Math.PI * t) ** 0.85 - 10 * t;
    kolA = 1 - 0.25 * t;
    sy = 1 + 0.07 * (1 - t) - 0.02 * t;
    ky = KALCA_Y + 12 * Math.sin(Math.PI * t); // dizler havada hafif toplanır
  } else {
    const t = aralik(k, T.inis, T.sakin);
    const ez = Math.sin(Math.PI * aralik(k, T.inis, T.inis + 6));
    sy = 1 - 0.11 * ez;
    ky = KALCA_Y + 26 * ez * (1 - t);
    kolA = lerp(0.75, 0, yumusak(t));
  }
  const ayakY = BILEK_Y;
  const sag = bacakIK({ x: A.kalcaX.sag, y: ky }, { x: A.kalcaX.sag + 4, y: ayakY });
  const sol = bacakIK({ x: A.kalcaX.sol, y: ky }, { x: A.kalcaX.sol + 4, y: ayakY });
  // kollar yukarı-ileri (yandan bakınca yüzü kapatmaz), çömelişte geriye
  const kolOmuz = kolA >= 0 ? lerp(4, -128, kolA) : lerp(4, 38, -kolA);
  const poz: Poz = {
    ...AYAKTA.yan,
    kok: { x: 0, y: ky },
    egim: k < T.itis ? 14 * Math.sin(Math.PI * aralik(k, 0, T.itis)) : 0,
    kafaEgim: k < T.comel ? -4 : 0,
    sagKol: { omuz: kolOmuz, dirsek: -14 * Math.max(0, kolA), bilek: 0, el: kolA > 0.5 ? 'salla' : 'acik' },
    solKol: { omuz: kolOmuz + 8, dirsek: -14 * Math.max(0, kolA), bilek: 0, el: kolA > 0.5 ? 'salla' : 'acik' },
    sagBacak: { ...sag, ayak: 0 },
    solBacak: { ...sol, ayak: 0 },
  };
  return { poz, havada, ezilme: { x: 1 / Math.sqrt(sy), y: sy } };
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

export const FIKIR_SURE = 36;

/**
 * fikir: işaret parmağını kaldırır (küçük anticipation + overshoot), atkının ucu ünlem gibi dikleşir,
 * ampul belirir. temel: o anki poz (ayakta ya da oturan); yakın kol (sag) kalkar.
 */
export function fikir(k: number, temel: Poz): { poz: Poz; fikir: boolean; parlama: number } {
  const A = GORUNUS[temel.gorunus];
  // el yüzün önünde ama yüzü kapatmadan: bilek omzun önünde-yukarısında, parmak tepeyi gösterir
  const yukari: Kol = kolHedef(A.omuzX.sag, { x: A.omuzX.sag + 76, y: OMUZ_Y - 64 }, 176, 'isaret', true);
  const once = k < 5 ? -0.12 * yumusak(k / 5) : geriTepme(aralik(k, 5, 13));
  const sagKol = kolKar(temel.sagKol, yukari, sinirla(once, -0.12, 1.08));
  const parlama = k < 8 ? 0 : geriTepme(aralik(k, 8, 16), 2.2);
  return { poz: { ...temel, sagKol }, fikir: k >= 8, parlama };
}

export const ONAY_SURE = 16;

/** onay: iki kez hızlı kafa sallama (bas: + = öne). */
export function onay(k: number): number {
  if (k < 0 || k >= ONAY_SURE) return 0;
  const vurus = (d: number) => (d >= 0 && d < 7 ? Math.sin((Math.PI * d) / 7) : 0);
  return 0.9 * vurus(k) + 0.8 * vurus(k - 8);
}

export { pozKaristir };
