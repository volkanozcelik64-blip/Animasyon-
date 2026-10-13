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
  /** Kolların görünürlüğü 0..1. Pasif duruşlarda (görseldeki GÜLEN, ÜZGÜN…) kollar gövde çizgisine karışır. */
  kolGorunurSol: number;
  kolGorunurSag: number;
};

/** El biçimi: yumruk (MUTLU, KIZGIN), açık parmaklı (ÇOK MUTLU, ŞOK), düz yuvarlak uç. */
export type ElTipi = 'yumruk' | 'acik' | 'duz';

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
  | 'hirs'
  | 'hmm';

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
  | 'bas'
  | 'hareketCizgileri'
  | 'palto'
  | 'ic';

export type YuzRengi = 'yok' | 'kirmizi' | 'mavi' | 'mor' | 'pembe';

export type Yuz = {
  goz: GozTipi;
  kas: KasTipi;
  agiz: AgizTipi;
  yanak: number; // pembe yanak opaklığı 0..1
  renk: YuzRengi;
  ekstralar: Ekstra[];
  eller?: ElTipi;
};

/**
 * Karakter iskeleti (SVG viewBox 0 0 240 320, yer y=300).
 * Oranlar referans görseldeki gibi: büyük kafa (çap 100), kafanın altından yere kadar gövde+bacak ≈ 0.6 kafa çapı.
 * Gövde yanları ve bacaklar aynı hizada → kollar gizliyken kafadan yere inen iki çizgi görünür.
 */
export const GEO = {
  kafa: {x: 120, y: 192, r: 50},
  boyun: {x: 120, y: 236},
  govdeUst: 234,
  govdeAlt: 264,
  omuzSol: {x: 109, y: 246},
  omuzSag: {x: 131, y: 246},
  kalcaSol: {x: 108, y: 264},
  kalcaSag: {x: 132, y: 264},
  ustKol: 26,
  onKol: 24,
  uyluk: 17,
  baldir: 15,
  zemin: 300,
};

/** Kafa merkezine göre bir nokta (yüzdeki hedefler için). */
const H = (dx: number, dy: number): [number, number] => [GEO.kafa.x + dx, GEO.kafa.y + dy];

const D = 180 / Math.PI;

/**
 * 2 kemikli kol IK (yerel uzay: omuz orijinde, 0° = aşağı, + açı yerel −x yönüne).
 * secim: 'disa' dirsek yerel −x tarafında, 'ice' tersi, 'asagi' dirsek daha aşağıda olan çözüm.
 */
export const kolIKYerel = (tx: number, ty: number, secim: 'disa' | 'ice' | 'asagi' = 'disa'): [number, number] => {
  const L1 = GEO.ustKol;
  const L2 = GEO.onKol;
  const d = Math.max(0.01, Math.min(Math.hypot(tx, ty), L1 + L2 - 0.01));
  const aT = Math.atan2(-tx, ty);
  const alfa = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const [a1, a2] = [aT + alfa, aT - alfa];
  let omuz: number;
  if (secim === 'asagi') omuz = Math.cos(a1) > Math.cos(a2) ? a1 : a2;
  else {
    const disa = -Math.sin(a1) < -Math.sin(a2) ? a1 : a2;
    omuz = secim === 'disa' ? disa : disa === a1 ? a2 : a1;
  }
  const ex = -Math.sin(omuz) * L1;
  const ey = Math.cos(omuz) * L1;
  const phi = Math.atan2(-(tx - ex), ty - ey);
  let dirsek = (phi - omuz) * D;
  while (dirsek > 180) dirsek -= 360;
  while (dirsek < -180) dirsek += 360;
  return [omuz * D, dirsek];
};

/**
 * Önden görünüş kol IK'sı: eli (x, y) noktasına götüren [omuz, dirsek] açıları.
 * dirsekDisa=true → dirsek gövdeden dışarı doğru kırılır.
 */
export const kolIK = (taraf: 'sol' | 'sag', x: number, y: number, dirsekDisa = true): [number, number] => {
  const o = taraf === 'sol' ? GEO.omuzSol : GEO.omuzSag;
  const tx = taraf === 'sol' ? x - o.x : o.x - x; // yerel uzay: -x = dışarı
  return kolIKYerel(tx, y - o.y, dirsekDisa ? 'disa' : 'ice');
};

// ── 3/4 yan görünüş (donus: 0 = önden, 1 = sağa dönük) ──
// Yan görünüşte kalçalar ve omuzlar birbirine yaklaşır; sol taraf "uzak" taraftır (gövdenin arkasında çizilir).
/** Kalçanın gövde merkezine yatay uzaklığı. */
export const kalcaDX = (donus: number) => (GEO.kalcaSag.x - 120) * (1 - 0.67 * donus);
/** Uzak kalçanın yukarı kayması (derinlik hissi). */
export const uzakKalcaDY = (donus: number) => -2 * donus;
/** Omzun gövde merkezine yatay uzaklığı. */
export const omuzDX = (donus: number) => (GEO.omuzSag.x - 120) * (1 - 0.7 * donus);
/** Yan görünüşte (donus > 0.5) iki kol da "ileri = +x" aynasıyla çizilir. */
export const yanMi = (donus: number) => donus > 0.5;

/**
 * Yan görünüş kol IK'sı (dünya koordinatı): omuz noktasından ele. Açılar "ileri = +" kuralında.
 * secim 'asagi': dirsek aşağıda (dizde dirsek, çenede el gibi pozlar için).
 */
export const kolIKYan = (omuz: {x: number; y: number}, el: {x: number; y: number}, secim: 'disa' | 'ice' | 'asagi' = 'asagi') =>
  kolIKYerel(-(el.x - omuz.x), el.y - omuz.y, secim);

const ik = (taraf: 'sol' | 'sag', n: [number, number], dirsekDisa = true) => kolIK(taraf, n[0], n[1], dirsekDisa);
const GIZLI = {kolSol: [0, 0] as [number, number], kolSag: [0, 0] as [number, number], kolGorunurSol: 0, kolGorunurSag: 0};

const P = (p: Partial<Poz>): Poz => ({
  kolSol: [8, -4],
  kolSag: [8, -4],
  bacakSol: [3, 0],
  bacakSag: [3, 0],
  kolGorunurSol: 1,
  kolGorunurSag: 1,
  kafaEgim: 0,
  govdeEgim: 0,
  ziplama: 0,
  bakisX: 0,
  bakisY: 0,
  ...p,
});

// Her duygu ayrı tanımlıdır: poz (iskelet açıları) + yüz (gözler, kaşlar, ağız, renk, ekler, el biçimi).
export const DUYGULAR: Record<Duygu, {ad: string; poz: Poz; yuz: Yuz}> = {
  mutlu: {
    ad: 'MUTLU',
    // havada: kollar yana açık, yumruklar yukarı; bir diz önde, bir ayak geride
    poz: P({kolSol: [102, 48], kolSag: [96, 52], bacakSol: [-6, 80], bacakSag: [28, -62], ziplama: 26, kafaEgim: -4}),
    yuz: {goz: 'mutluKapali', kas: 'yok', agiz: 'kocamanGulus', yanak: 0.5, renk: 'yok', ekstralar: ['golge'], eller: 'yumruk'},
  },
  'cok-mutlu': {
    ad: 'ÇOK MUTLU',
    poz: P({kolSol: [142, -14], kolSag: [142, -14], bacakSol: [24, -78], bacakSag: [-6, 34], ziplama: 30}),
    yuz: {goz: 'mutluKapali', kas: 'yok', agiz: 'kocamanGulus', yanak: 0.6, renk: 'yok', ekstralar: ['sevincCizgileri'], eller: 'acik'},
  },
  heyecanli: {
    ad: 'HEYECANLI',
    // yumruklar omuz hizasında, bir bacak kıvrık havada
    poz: P({kolSol: ik('sol', H(-38, 54)), kolSag: ik('sag', H(38, 54)), bacakSol: [-14, 86], bacakSag: [4, 0], ziplama: 8, kafaEgim: 4}),
    yuz: {goz: 'parlak', kas: 'kalkik', agiz: 'gulus', yanak: 0.7, renk: 'yok', ekstralar: ['pirilti', 'golge', 'hareketCizgileri'], eller: 'yumruk'},
  },
  gulen: {
    ad: 'GÜLEN',
    poz: P({...GIZLI, bacakSol: [3, 0], bacakSag: [3, 0]}),
    yuz: {goz: 'nokta', kas: 'yok', agiz: 'gulumseme', yanak: 0.55, renk: 'yok', ekstralar: []},
  },
  'sok-olmus': {
    ad: 'ŞOK OLMUŞ',
    // eller yanaklarda, dizler dışa kırık çömelme
    poz: P({kolSol: ik('sol', H(-31, 26)), kolSag: ik('sag', H(31, 26)), bacakSol: [30, -52], bacakSag: [30, -52], ziplama: -9}),
    yuz: {goz: 'genis', kas: 'kalkik', agiz: 'o', yanak: 0, renk: 'yok', ekstralar: ['yildizKalp'], eller: 'acik'},
  },
  kizgin: {
    ad: 'KIZGIN',
    poz: P({kolSol: ik('sol', H(-11, 66)), kolSag: ik('sag', H(11, 66)), bacakSol: [5, 0], bacakSag: [5, 0]}),
    yuz: {goz: 'kisik', kas: 'kizgin', agiz: 'hirs', yanak: 0, renk: 'kirmizi', ekstralar: ['buhar', 'ofke'], eller: 'yumruk'},
  },
  somurtan: {
    ad: 'SOMURTAN',
    // kollar göğüste kavuşturulmuş
    poz: P({kolSol: ik('sol', H(17, 64)), kolSag: ik('sag', H(-17, 68)), bacakSol: [3, 0], bacakSag: [3, 0]}),
    yuz: {goz: 'genis', kas: 'kalkik', agiz: 'kucukO', yanak: 0, renk: 'yok', ekstralar: [], eller: 'duz'},
  },
  uzgun: {
    ad: 'ÜZGÜN',
    poz: P({...GIZLI, kafaEgim: 2}),
    yuz: {goz: 'nokta', kas: 'cokEndiseli', agiz: 'dalgali', yanak: 0, renk: 'mavi', ekstralar: ['ter', 'titreme']},
  },
  aglayan: {
    ad: 'AĞLAYAN',
    // yumruklar kalça yanında, dirsekler dışarıda
    poz: P({kolSol: ik('sol', H(-30, 82)), kolSag: ik('sag', H(30, 82)), bacakSol: [3, 0], bacakSag: [3, 0]}),
    yuz: {goz: 'sikili', kas: 'cokEndiseli', agiz: 'aglama', yanak: 0, renk: 'yok', ekstralar: ['akanYas'], eller: 'yumruk'},
  },
  huzunlu: {
    ad: 'HÜZÜNLÜ',
    poz: P({...GIZLI, kafaEgim: -3}),
    yuz: {goz: 'kapali', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['gozyasi', 'ic']},
  },
  'hayal-kirikligi': {
    ad: 'HAYAL KIRIKLIĞI',
    poz: P({...GIZLI, kafaEgim: 5, govdeEgim: 1}),
    yuz: {goz: 'kapali', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: []},
  },
  'hayal-kirikligi-2': {
    ad: 'HAYAL KIRIKLIĞI',
    // kafa sağ ele yaslı, sol kol dizlerin üstünde; çömelmiş
    poz: P({kolSol: ik('sol', H(20, 84)), kolSag: ik('sag', H(36, 30)), bacakSol: [58, -120], bacakSag: [58, -120], ziplama: -14, kafaEgim: 12, bakisY: 0.4}),
    yuz: {goz: 'yarim', kas: 'endiseli', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: [], eller: 'duz'},
  },
  utangac: {
    ad: 'UTANGAÇ',
    poz: P({kolSol: ik('sol', H(-7, 32)), kolSag: ik('sag', H(7, 34)), bacakSol: [-3, 0], bacakSag: [-3, 0], kafaEgim: 4}),
    yuz: {goz: 'nokta', kas: 'endiseli', agiz: 'duz', yanak: 0.9, renk: 'pembe', ekstralar: ['tarama'], eller: 'duz'},
  },
  kizarmis: {
    ad: 'KIZARMIŞ',
    poz: P({...GIZLI}),
    yuz: {goz: 'nokta', kas: 'endiseli', agiz: 'dalgali', yanak: 0.9, renk: 'kirmizi', ekstralar: ['tarama']},
  },
  mahcup: {
    ad: 'MAHCUP',
    // sağ el kafanın yanını kaşır
    poz: P({kolSol: [0, 0], kolGorunurSol: 0, kolSag: ik('sag', H(40, 12)), kafaEgim: -6}),
    yuz: {goz: 'nokta', kas: 'cokEndiseli', agiz: 'dalgali', yanak: 0.6, renk: 'yok', ekstralar: ['tarama', 'ter'], eller: 'duz'},
  },
  'kafasi-karisik': {
    ad: 'KAFASI KARIŞIK',
    poz: P({...GIZLI, bacakSol: [5, 0], bacakSag: [5, 0], kafaEgim: -7, bakisX: 0.2, bakisY: -0.2}),
    yuz: {goz: 'nokta', kas: 'tekKalkik', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['soru']},
  },
  dusunceli: {
    ad: 'DÜŞÜNCELİ',
    // sağ el çenede, sol kol sağ dirseği destekler; gözler yukarı-yana bakar
    poz: P({kolSol: ik('sol', H(24, 66)), kolSag: ik('sag', H(9, 44)), kafaEgim: 5, bakisX: 0.6, bakisY: -0.8}),
    yuz: {goz: 'nokta', kas: 'tekKalkik', agiz: 'hmm', yanak: 0, renk: 'yok', ekstralar: [], eller: 'duz'},
  },
  yorgun: {
    ad: 'YORGUN',
    poz: P({...GIZLI, bacakSol: [4, 0], bacakSag: [4, 0], kafaEgim: 3, govdeEgim: 1}),
    yuz: {goz: 'yarim', kas: 'yok', agiz: 'duz', yanak: 0, renk: 'mor', ekstralar: []},
  },
  hasta: {
    ad: 'HASTA',
    poz: P({...GIZLI, bacakSol: [5, 0], bacakSag: [5, 0], kafaEgim: -3}),
    yuz: {goz: 'spiral', kas: 'endiseli', agiz: 'aglama', yanak: 0, renk: 'yok', ekstralar: ['termometre', 'bas', 'ter', 'titreme']},
  },
  uyuyan: {
    ad: 'UYUYAN',
    poz: P({...GIZLI, bacakSol: [5, 0], bacakSag: [5, 0], kafaEgim: -10, govdeEgim: -2}),
    yuz: {goz: 'kapali', kas: 'yok', agiz: 'kucukO', yanak: 0, renk: 'yok', ekstralar: ['zzz']},
  },
  sinirli: {
    ad: 'SİNİRLİ',
    poz: P({...GIZLI, bacakSol: [4, 0], bacakSag: [4, 0], kafaEgim: 3, bakisX: 0.5}),
    yuz: {goz: 'kisik', kas: 'kizgin', agiz: 'uzgun', yanak: 0, renk: 'yok', ekstralar: ['sinirCizgileri']},
  },
  gizemli: {
    ad: 'GİZEMLİ',
    // trençkot ve fötr şapka; kollar paltonun içinde
    poz: P({...GIZLI, bacakSol: [4, 0], bacakSag: [4, 0], kafaEgim: -4, bakisX: 0.6}),
    yuz: {goz: 'yan', kas: 'kizgin', agiz: 'sirit', yanak: 0, renk: 'yok', ekstralar: ['sapka', 'palto']},
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
  kolGorunurSol: lerp(a.kolGorunurSol, b.kolGorunurSol, t),
  kolGorunurSag: lerp(a.kolGorunurSag, b.kolGorunurSag, t),
});
