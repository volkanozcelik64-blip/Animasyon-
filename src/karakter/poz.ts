import type { ElPozu, Gorunus } from './parcalar';
import type { Duygu } from './yuz';
import { OLCU } from './olculer';

/** Bir taraf (sag = karakterin sağı; önden bakışta ekranın solu). Açılar SVG derecesi:
 *  0 = aşağı sarkıyor, + saat yönü. Dirsek/diz/bilek bir önceki parçaya göredir. */
export interface Kol {
  omuz: number; dirsek: number; bilek: number; el: ElPozu; ayna?: boolean;
  /** kol gövdenin arkasında çizilir (eller arkada) */
  arkada?: boolean;
}
export interface Bacak { kalca: number; diz: number; ayak?: number /* ayakkabının mutlak açısı, vars. 0 = yere paralel */ }

export interface Poz {
  gorunus: Gorunus;
  /** kalça merkezinin yeri (zemin 0) */
  kok: { x: number; y: number };
  /** üst gövde eğimi (kalçadan) */
  egim: number;
  kafaEgim: number;
  sagKol: Kol; solKol: Kol;
  sagBacak: Bacak; solBacak: Bacak;
  /** atkının sarkan ucu: kök ve alt bölüm açıları (yay benzetiminden gelir) */
  atki: { a1: number; a2: number };
}

const ON_SARKIK = 13;

export const AYAKTA: Record<Gorunus, Poz> = {
  arka: {
    gorunus: 'arka', kok: { x: 0, y: OLCU.kalcaY }, egim: 0, kafaEgim: 0,
    sagKol: { omuz: -ON_SARKIK, dirsek: 3, bilek: 0, el: 'acik' },
    solKol: { omuz: ON_SARKIK, dirsek: -3, bilek: 0, el: 'acik' },
    sagBacak: { kalca: -4.5, diz: 0 }, solBacak: { kalca: 4.5, diz: 0 },
    atki: { a1: 0, a2: 0 },
  },
  on: {
    gorunus: 'on', kok: { x: 0, y: OLCU.kalcaY }, egim: 0, kafaEgim: 0,
    sagKol: { omuz: ON_SARKIK, dirsek: -3, bilek: 0, el: 'acik' },
    solKol: { omuz: -ON_SARKIK, dirsek: 3, bilek: 0, el: 'acik' },
    sagBacak: { kalca: 4.5, diz: 0 }, solBacak: { kalca: -4.5, diz: 0 },
    atki: { a1: -4, a2: 3 },
  },
  ucdort: {
    gorunus: 'ucdort', kok: { x: 0, y: OLCU.kalcaY }, egim: 0, kafaEgim: 0,
    sagKol: { omuz: 8, dirsek: -6, bilek: 0, el: 'acik' },
    solKol: { omuz: -8, dirsek: 6, bilek: 0, el: 'acik' },
    sagBacak: { kalca: 3, diz: -3 }, solBacak: { kalca: -4, diz: 4 },
    atki: { a1: -3, a2: 2 },
  },
  yan: {
    gorunus: 'yan', kok: { x: 0, y: OLCU.kalcaY }, egim: 0, kafaEgim: 0,
    sagKol: { omuz: 3, dirsek: -6, bilek: 0, el: 'acik' },
    solKol: { omuz: -4, dirsek: -6, bilek: 0, el: 'acik' },
    sagBacak: { kalca: -1, diz: 1 }, solBacak: { kalca: 2, diz: -2 },
    atki: { a1: 0, a2: 0 },
  },
};

/** Sandalyede yandan oturan (profil): dizler 90°, eller dizlerde. */
export const OTURAN: Poz = {
  // kalça yüksekliği = alt bacak + bilek: baldır dik, ayak yerde
  // baldır 8° öne açık: topuk sandalyenin ön bacağından uzak kalır; kalça bu kadar alçalır ki ayak yerde olsun
  gorunus: 'yan', kok: { x: 0, y: -(OLCU.altBacak * Math.cos((8 * Math.PI) / 180) - OLCU.bilekY) }, egim: -2, kafaEgim: 0,
  sagKol: { omuz: -15, dirsek: -27, bilek: -48, el: 'acik' },
  solKol: { omuz: -11, dirsek: -29, bilek: -50, el: 'acik' },
  sagBacak: { kalca: -90, diz: 82 }, solBacak: { kalca: -88, diz: 80 },
  atki: { a1: 2, a2: 2 },
};

/** El sallayan (önden): karakterin sol kolu havada. */
export const EL_SALLAYAN: Poz = {
  ...AYAKTA.on,
  solKol: { omuz: -106, dirsek: -58, bilek: -4, el: 'salla', ayna: true },
  sagKol: { omuz: ON_SARKIK, dirsek: -3, bilek: 0, el: 'acik' },
  kafaEgim: 4,
  atki: { a1: -10, a2: 6 },
};

/** İşaret eden (3/4): ön kol ileri uzanmış, işaret parmağı. */
export const ISARET_EDEN: Poz = {
  ...AYAKTA.ucdort,
  sagKol: { omuz: -78, dirsek: -10, bilek: 2, el: 'isaret', ayna: true },
  solKol: { omuz: -6, dirsek: 4, bilek: 0, el: 'acik' },
  egim: 3,
  kafaEgim: 3,
  atki: { a1: 8, a2: -4 },
};

// ---------------------------------------------------------------- ek duygu pozları (§3)
// Açılar önden bakış için hesaplandı (omuz/dirsek/bilek zinciri; uzuv boyları sabit).
export const DUYGU_POZLARI: Partial<Record<Duygu, Poz>> = {
  /** eli çenesinde: dirsek dışarıda bükülü, işaret parmağı yanakta, başparmak çenenin altında; kafa ele doğru ~6° yatık.
   *  İki kemikli çözüm: omuz (-30,-124), bilek (-34,-127), dirsek (-64,-82); el 195° (yukarı-içe),
   *  işaret parmağı ucu sol yanakta (-31,-203), başparmak ucu çenenin altında (8,-162). Uzuv boyları sabit. */
  dusunceli: {
    ...AYAKTA.on,
    sagKol: { omuz: 39.5, dirsek: 175, bilek: -19.6, el: 'cene', ayna: true },
    kafaEgim: -6,
    atki: { a1: 0, a2: 0 },
  },
  /** kollar hafif açılır */
  sasirmis: {
    ...AYAKTA.on,
    sagKol: { omuz: 34, dirsek: -28, bilek: 0, el: 'salla', ayna: true },
    solKol: { omuz: -34, dirsek: 28, bilek: 0, el: 'salla', ayna: true },
    atki: { a1: 0, a2: 0 },
  },
  /** göğüs önde: 3/4'te üst gövde geriye yaslanır, eller belde */
  gururlu: {
    ...AYAKTA.ucdort,
    egim: -7, kafaEgim: -3,
    // dirsekler dışarıda, yumruklar kalça yanında aşağı bakar (el gövde kenarının dışında)
    sagKol: { omuz: 45, dirsek: -79, bilek: 34, el: 'yumruk' },
    solKol: { omuz: -45, dirsek: 79, bilek: -34, el: 'yumruk' },
    atki: { a1: 0, a2: 0 },
  },
  /** yanak avuca dayalı (el ağzın yanında, ağzı kapatmaz), kafa ele doğru 8° yatık.
   *  Açılar omuz (30,-124) → bilek (88,-156) çözümünden; avuç yanağın sağ altına değer. */
  sikilmis: {
    ...AYAKTA.on,
    solKol: { omuz: -67, dirsek: -105, bilek: -28, el: 'acik', ayna: true },
    kafaEgim: 8,
    atki: { a1: 0, a2: 0 },
  },
  /** eller arkada, kafa hafif eğik */
  utangac: {
    ...AYAKTA.on,
    sagKol: { omuz: -4, dirsek: -55, bilek: 0, el: 'acik', arkada: true },
    solKol: { omuz: 4, dirsek: 55, bilek: 0, el: 'acik', arkada: true },
    kafaEgim: -6,
    atki: { a1: 0, a2: 0 },
  },
};

/** Fikir anı: işaret parmağı havada (atkı ünlem gibi dikleşir, ampul belirir: <Nod fikir />). */
export const FIKIR: Poz = {
  ...AYAKTA.on,
  solKol: { omuz: -150, dirsek: -12, bilek: 0, el: 'isaret', ayna: true },
  atki: { a1: 0, a2: 0 },
};

// ---------------------------------------------------------------- ara değer (yumuşak geçiş)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const kolKar = (a: Kol, b: Kol, t: number): Kol => ({
  omuz: lerp(a.omuz, b.omuz, t), dirsek: lerp(a.dirsek, b.dirsek, t), bilek: lerp(a.bilek, b.bilek, t),
  el: t < 0.5 ? a.el : b.el, ayna: t < 0.5 ? a.ayna : b.ayna, arkada: t < 0.5 ? a.arkada : b.arkada,
});
const bacakKar = (a: Bacak, b: Bacak, t: number): Bacak => ({
  kalca: lerp(a.kalca, b.kalca, t), diz: lerp(a.diz, b.diz, t), ayak: lerp(a.ayak ?? 0, b.ayak ?? 0, t),
});

/** İki poz arası (aynı görünüşte). */
export function pozKaristir(a: Poz, b: Poz, t: number): Poz {
  return {
    gorunus: t < 0.5 ? a.gorunus : b.gorunus,
    kok: { x: lerp(a.kok.x, b.kok.x, t), y: lerp(a.kok.y, b.kok.y, t) },
    egim: lerp(a.egim, b.egim, t), kafaEgim: lerp(a.kafaEgim, b.kafaEgim, t),
    sagKol: kolKar(a.sagKol, b.sagKol, t), solKol: kolKar(a.solKol, b.solKol, t),
    sagBacak: bacakKar(a.sagBacak, b.sagBacak, t), solBacak: bacakKar(a.solBacak, b.solBacak, t),
    atki: { a1: lerp(a.atki.a1, b.atki.a1, t), a2: lerp(a.atki.a2, b.atki.a2, t) },
  };
}

// ---------------------------------------------------------------- duygu geçişi
export const yumusak = (t: number) => t * t * (3 - 2 * t);

export interface DuyguDurumu { duygu: Duygu; onceki?: Duygu; t: number }

/** Çizelgeye göre o karedeki duygu. Her değişim `sure` karede (6–10) yumuşakça geçer. */
export function duyguAt(cizelge: { kare: number; duygu: Duygu }[], kare: number, sure = 8): DuyguDurumu {
  const s = Math.max(6, Math.min(10, sure));
  let i = 0;
  while (i + 1 < cizelge.length && cizelge[i + 1].kare <= kare) i++;
  const simdi = cizelge[i];
  if (i === 0) return { duygu: simdi.duygu, t: 1 };
  const t = Math.min(1, (kare - simdi.kare) / s);
  return { duygu: simdi.duygu, onceki: cizelge[i - 1].duygu, t: yumusak(t) };
}
