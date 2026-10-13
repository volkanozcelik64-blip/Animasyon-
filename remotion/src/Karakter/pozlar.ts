// Duygu → poz ve yüz tanımları. Pozlar sayısaldır; iki duygu arasında
// karistirPoz() ile yumuşak geçiş yapılabilir (pop yok).

export type Duygu =
  | 'mutlu'
  | 'cok-mutlu'
  | 'heyecanli'
  | 'gulen'
  | 'sok-olmus'
  | 'kizgin'
  | 'somurtan'
  | 'uzgun'
  | 'aglayan'
  | 'huzunlu'
  | 'hayal-kirikligi'
  | 'hayal-kirikligi-2'
  | 'utangac'
  | 'kizarmis'
  | 'mahcup'
  | 'kafasi-karisik'
  | 'dusunceli'
  | 'yorgun'
  | 'hasta'
  | 'uyuyan'
  | 'sinirli'
  | 'gizemli';

/** Açılar derece. Kol/bacak: 0 = dümdüz aşağı, + = dışa doğru (iki taraf aynada). */
export type Poz = {
  kolSol: [number, number]; // [omuz, dirsek]
  kolSag: [number, number];
  bacakSol: [number, number]; // [kalça, diz]
  bacakSag: [number, number];
  kafaEgim: number; // derece
  govdeEgim: number; // derece
  ziplama: number; // px, + yukarı
  bakisX: number; // göz bebeği kayması (-1..1)
  bakisY: number;
};

export type GozTipi =
  | 'nokta'
  | 'mutluKapali'
  | 'genis'
  | 'parlak'
  | 'kapali'
  | 'yarim'
  | 'sikili'
  | 'spiral'
  | 'kisik'
  | 'yan';

export type KasTipi = 'yok' | 'endiseli' | 'kizgin' | 'kalkik' | 'tekKalkik' | 'cokEndiseli';

export type AgizTipi =
  | 'kocamanGulus'
  | 'gulus'
  | 'gulumseme'
  | 'o'
  | 'kucukO'
  | 'uzgun'
  | 'dalgali'
  | 'aglama'
  | 'duz'
  | 'sirit'
  | 'hirs';

export type Ekstra =
  | 'gozyasi'
  | 'akanYas'
  | 'ter'
  | 'pirilti'
  | 'soru'
  | 'zzz'
  | 'yildizKalp'
  | 'buhar'
  | 'ofke'
  | 'sapka'
  | 'termometre'
  | 'sevincCizgileri'
  | 'golge'
  | 'titreme'
  | 'tarama'
  | 'sinirCizgileri'
  | 'bas';

export type YuzRengi = 'yok' | 'kirmizi' | 'mavi' | 'mor' | 'pembe';

export type Yuz = {
  goz: GozTipi;
  kas: KasTipi;
  agiz: AgizTipi;
  yanak: number; // pembe yanak opaklığı 0..1
  renk: YuzRengi;
  ekstralar: Ekstra[];
};

/** Karakter iskeleti (SVG viewBox 0 0 240 320 içinde). */
export const GEO = {
  kafa: {x: 120, y: 78, r: 50},
  omuzSol: {x: 107, y: 140},
  omuzSag: {x: 133, y: 140},
  kalcaSol: {x: 113, y: 196},
  kalcaSag: {x: 127, y: 196},
  ustKol: 40,
  onKol: 36,
  uyluk: 52,
  baldir: 50,
  zemin: 300,
};

const D = 180 / Math.PI;

/**
 * 2 kemikli IK: eli (x, y) noktasına götüren [omuz, dirsek] açılarını verir.
 * dirsekDisa=true → dirsek gövdeden dışarı doğru kırılır.
 */
export const kolIK = (taraf: 'sol' | 'sag', x: number, y: number, dirsekDisa = true): [number, number] => {
  const o = taraf === 'sol' ? GEO.omuzSol : GEO.omuzSag;
  const tx = taraf === 'sol' ? x - o.x : o.x - x; // yerel uzay: -x = dışarı
  const ty = y - o.y;
  const L1 = GEO.ustKol;
  const L2 = GEO.onKol;
  const d = Math.min(Math.hypot(tx, ty), L1 + L2 - 0.01);
  const aT = Math.atan2(-tx, ty);
  const alfa = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  // iki çözümden dirseği daha dışarıda (yerel -x) olanı ya da içeride olanı seç
  const [a1, a2] = [aT + alfa, aT - alfa];
  const disa = -Math.sin(a1) < -Math.sin(a2) ? a1 : a2;
  const omuz = dirsekDisa ? disa : disa === a1 ? a2 : a1;
  const ex = -Math.sin(omuz) * L1;
  const ey = Math.cos(omuz) * L1;
  const phi = Math.atan2(-(tx - ex), ty - ey);
  let dirsek = (phi - omuz) * D;
  while (dirsek > 180) dirsek -= 360;
  while (dirsek < -180) dirsek += 360;
  return [omuz * D, dirsek];
};

const P = (p: Partial<Poz>): Poz => ({
  kolSol: [12, -8],
  kolSag: [12, -8],
  bacakSol: [6, 0],
  bacakSag: [6, 0],
  kafaEgim: 0,
  govdeEgim: 0,
  ziplama: 0,
  bakisX: 0,
  bakisY: 0,
  ...p,
});

export const DUYGULAR: Record<Duygu, {ad: string; poz: Poz; yuz: Yuz}> = {
  mutlu: {
    ad: 'MUTLU',
    poz: P({kolSol: [100, 45], kolSag: [95, 50], bacakSol: [-8, 70], bacakSag: [22, -55], ziplama: 26, kafaEgim: -4}),
    yuz: {goz: 'mutluKapali', kas: 'yok', agiz: 'kocamanGulus', yanak: 0.5, renk: 'yok', ekstralar: ['golge']},
  },
  'cok-mutlu': {
    ad: 'ÇOK MUTLU',
    poz: P({kolSol: [140, -25], kolSag: [140, -25], bacakSol: [25, -75], bacakSag: [-4, 25], ziplama: 30}),
    yuz: {goz: 'mutluKapali', kas: 'yok', agiz: 'kocamanGulus', yanak: 0.6, renk: 'yok', ekstralar: ['sevincCizgileri']},
  },
  heyecanli: {
    ad: 'HEYECANLI',
    poz: P({kolSol: kolIK('sol', 104, 160), kolSag: kolIK('sag', 136, 160), bacakSol: [-6, 60], bacakSag: [26, -40], ziplama: 14, kafaEgim: 4}),
    yuz: {goz: 'parlak', kas: 'kalkik', agiz: 'gulus', yanak: 0.7, renk: 'yok', ekstralar: ['pirilti', 'golge']},
  },
  gulen: {
    ad: 'GÜLEN',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [3, 0], bacakSag: [3, 0]}),
    yuz: {goz: 'nokta', kas: 'yok', agiz: 'gulumseme', yanak: 0.55, renk: 'yok', ekstralar: []},
  },
  'sok-olmus': {
    ad: 'ŞOK OLMUŞ',
    poz: P({kolSol: kolIK('sol', 94, 100), kolSag: kolIK('sag', 146, 100), bacakSol: [22, -40], bacakSag: [22, -40], ziplama: -6}),
    yuz: {goz: 'genis', kas: 'kalkik', agiz: 'o', yanak: 0, renk: 'yok', ekstralar: ['yildizKalp']},
  },
  kizgin: {
    ad: 'KIZGIN',
    poz: P({kolSol: kolIK('sol', 106, 168), kolSag: kolIK('sag', 134, 168), bacakSol: [10, 0], bacakSag: [10, 0]}),
    yuz: {goz: 'kisik', kas: 'kizgin', agiz: 'hirs', yanak: 0, renk: 'kirmizi', ekstralar: ['buhar', 'ofke']},
  },
  somurtan: {
    ad: 'SOMURTAN',
    poz: P({kolSol: kolIK('sol', 136, 160), kolSag: kolIK('sag', 102, 166), bacakSol: [4, 0], bacakSag: [4, 0]}),
    yuz: {goz: 'genis', kas: 'kalkik', agiz: 'kucukO', yanak: 0, renk: 'yok', ekstralar: []},
  },
  uzgun: {
    ad: 'ÜZGÜN',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [3, 0], bacakSag: [3, 0], kafaEgim: 3}),
    yuz: {goz: 'nokta', kas: 'cokEndiseli', agiz: 'dalgali', yanak: 0, renk: 'mavi', ekstralar: ['ter', 'titreme']},
  },
  aglayan: {
    ad: 'AĞLAYAN',
    poz: P({kolSol: kolIK('sol', 92, 168), kolSag: kolIK('sag', 148, 168), bacakSol: [4, 0], bacakSag: [4, 0]}),
    yuz: {goz: 'sikili', kas: 'cokEndiseli', agiz: 'aglama', yanak: 0, renk: 'yok', ekstralar: ['akanYas']},
  },
  huzunlu: {
    ad: 'HÜZÜNLÜ',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [3, 0], bacakSag: [3, 0], kafaEgim: -4}),
    yuz: {goz: 'kapali', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['gozyasi']},
  },
  'hayal-kirikligi': {
    ad: 'HAYAL KIRIKLIĞI',
    poz: P({kolSol: [7, -3], kolSag: [7, -3], bacakSol: [3, 0], bacakSag: [3, 0], kafaEgim: 6, govdeEgim: 2}),
    yuz: {goz: 'kapali', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: []},
  },
  'hayal-kirikligi-2': {
    ad: 'HAYAL KIRIKLIĞI',
    poz: P({kolSol: kolIK('sol', 142, 170), kolSag: kolIK('sag', 150, 112), bacakSol: [3, 0], bacakSag: [10, 0], kafaEgim: 12, bakisY: 0.4}),
    yuz: {goz: 'yarim', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: []},
  },
  utangac: {
    ad: 'UTANGAÇ',
    poz: P({kolSol: kolIK('sol', 110, 110), kolSag: kolIK('sag', 129, 112), bacakSol: [-6, 0], bacakSag: [-6, 0], kafaEgim: 5}),
    yuz: {goz: 'nokta', kas: 'endiseli', agiz: 'duz', yanak: 0.9, renk: 'pembe', ekstralar: ['tarama']},
  },
  kizarmis: {
    ad: 'KIZARMIŞ',
    poz: P({kolSol: [7, -3], kolSag: [7, -3], bacakSol: [3, 0], bacakSag: [3, 0]}),
    yuz: {goz: 'nokta', kas: 'endiseli', agiz: 'dalgali', yanak: 0.9, renk: 'kirmizi', ekstralar: ['tarama']},
  },
  mahcup: {
    ad: 'MAHCUP',
    poz: P({kolSol: [9, -4], kolSag: kolIK('sag', 156, 84), bacakSol: [3, 0], bacakSag: [3, 0], kafaEgim: -5}),
    yuz: {goz: 'nokta', kas: 'cokEndiseli', agiz: 'dalgali', yanak: 0.6, renk: 'yok', ekstralar: ['tarama', 'ter']},
  },
  'kafasi-karisik': {
    ad: 'KAFASI KARIŞIK',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [6, 0], bacakSag: [6, 0], kafaEgim: -8, bakisX: 0.3, bakisY: -0.3}),
    yuz: {goz: 'nokta', kas: 'tekKalkik', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['soru']},
  },
  dusunceli: {
    ad: 'DÜŞÜNCELİ',
    poz: P({kolSol: kolIK('sol', 142, 168), kolSag: kolIK('sag', 128, 116), bacakSol: [3, 0], bacakSag: [3, 0], kafaEgim: 6, bakisX: 0.5, bakisY: -0.6}),
    yuz: {goz: 'yan', kas: 'tekKalkik', agiz: 'sirit', yanak: 0, renk: 'yok', ekstralar: []},
  },
  yorgun: {
    ad: 'YORGUN',
    poz: P({kolSol: [7, -3], kolSag: [7, -3], bacakSol: [4, 0], bacakSag: [4, 0], kafaEgim: 4, govdeEgim: 2}),
    yuz: {goz: 'yarim', kas: 'yok', agiz: 'duz', yanak: 0, renk: 'mor', ekstralar: []},
  },
  hasta: {
    ad: 'HASTA',
    poz: P({kolSol: [10, -4], kolSag: [10, -4], bacakSol: [6, 0], bacakSag: [6, 0], kafaEgim: -3}),
    yuz: {goz: 'spiral', kas: 'endiseli', agiz: 'dalgali', yanak: 0, renk: 'yok', ekstralar: ['termometre', 'bas', 'ter']},
  },
  uyuyan: {
    ad: 'UYUYAN',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [6, 0], bacakSag: [6, 0], kafaEgim: -12, govdeEgim: -3}),
    yuz: {goz: 'kapali', kas: 'yok', agiz: 'kucukO', yanak: 0, renk: 'yok', ekstralar: ['zzz']},
  },
  sinirli: {
    ad: 'SİNİRLİ',
    poz: P({kolSol: [9, -4], kolSag: [9, -4], bacakSol: [5, 0], bacakSag: [5, 0], kafaEgim: 3, bakisX: 0.4}),
    yuz: {goz: 'kisik', kas: 'kizgin', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['sinirCizgileri']},
  },
  gizemli: {
    ad: 'GİZEMLİ',
    poz: P({kolSol: [6, -8], kolSag: [6, -8], bacakSol: [5, 0], bacakSag: [5, 0], kafaEgim: -4, bakisX: 0.6}),
    yuz: {goz: 'yan', kas: 'kizgin', agiz: 'sirit', yanak: 0, renk: 'yok', ekstralar: ['sapka']},
  },
};

export const DUYGU_LISTESI = Object.keys(DUYGULAR) as Duygu[];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

export const karistirPoz = (a: Poz, b: Poz, t: number): Poz => ({
  kolSol: lerp2(a.kolSol, b.kolSol, t),
  kolSag: lerp2(a.kolSag, b.kolSag, t),
  bacakSol: lerp2(a.bacakSol, b.bacakSol, t),
  bacakSag: lerp2(a.bacakSag, b.bacakSag, t),
  kafaEgim: lerp(a.kafaEgim, b.kafaEgim, t),
  govdeEgim: lerp(a.govdeEgim, b.govdeEgim, t),
  ziplama: lerp(a.ziplama, b.ziplama, t),
  bakisX: lerp(a.bakisX, b.bakisX, t),
  bakisY: lerp(a.bakisY, b.bakisY, t),
});
