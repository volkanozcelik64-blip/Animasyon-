// Tek renk/ölçü kaynağı. Karakter her yerde bu değerlerle çizilir.

export const RENK = {
  murekkep: '#141414',
  beyaz: '#ffffff',
  kafaGolge: '#e3e6ec',
  atki: '#B5302A',
  atkiKoyu: '#7a1a16',
  atkiAcik: '#cc4a3f',
  atkiKontur: '#2a0806',
  bileklik: '#3B8FD9',
  bileklikKoyu: '#2a6fb0',
  ayakkabi: '#2f3c66',
  ayakkabiAcik: '#4a5d93',
  ayakkabiYaka: '#4b4d5e',
  bagcik: '#a9d6f7',
  ayakkabiNokta: '#7cc4f2',
  taban: '#cfe2f5',
  burun: '#ffffff',
  golge: '#dbe5f3',
  yanak: '#f4a3a8',
  kalp: '#f0566d',
  kalpAcik: '#ff8a9a',
  gozyasi: '#5fb0ec',
  korkuMavi: '#a8c3ea',
  kizginKirmizi: '#f04848',
  agizIc: '#5a1818',
  dil: '#e8727a',
  korkuAgiz: '#e0705f',
} as const;

// Ölçüler (birim: SVG birimi; ayak tabanı y=0, yukarı negatif).
// Referans tam boydan ölçüldü: kafa çapı D=132, toplam boy ≈ 3.9 D.
const KAFA_CAPI = 132;

export const OLCU = {
  kafaCapi: KAFA_CAPI,
  kafaR: KAFA_CAPI / 2,
  kontur: 5.5, // kalın siyah kontur (kafa, gövde) — 1080p'de ayakta ~%50 boyda ≈ 6px
  inceKontur: 2.6, // atkı/yüz detayı
  kolKalinlik: 17,
  bacakKalinlik: 17,
  ustKol: 54,
  onKol: 54,
  elOlcek: 1.85, // eldiven + bileklik büyüklüğü
  ayakOlcek: 1.25, // spor ayakkabı büyüklüğü (zemine göre ölçeklenir)
  ustBacak: 82,
  altBacak: 81,
  bilekY: -53, // ayak bileği yüksekliği (yüksek bilekli spor ayakkabı)
  kalcaY: -216,
  boyunY: -363, // atkı merkezi
  omuzY: -340,
  kafaY: -451,
} as const;

/** Çizgi kalınlıkları (karakter yerel ölçüsünde; el ve ayakkabı kendi ölçekleriyle büyür). */
export const CIZGI = {
  kafa: OLCU.kontur,
  govde: OLCU.kontur,
  eldiven: 2.6, // × elOlcek ≈ 4.8
  bileklik: 2.6,
  ayakkabi: 3.6, // × ayakOlcek ≈ 4.5
  atki: OLCU.inceKontur,
  atkiDetay: 1.4,
  yuz: 3.6, // kaş, kapalı göz, ağız çizgileri
  esya: 5, // eşyaların kalın konturu
  esyaDetay: 2.2,
} as const;

/** Çizgi kaynaması (line boil): her `aralik` karede kontur en fazla `enFazla` birim (≈1-2px) kayar. */
export const KAYNAMA = { aralik: 4, enFazla: 2, frekans: 0.03 } as const;

/** Ayakta toplam boy (kafa tepesi → taban). */
export const BOY = -(OLCU.kafaY - OLCU.kafaR);

/** Ayakta Nod ekran yüksekliğinin ~%45-55'i olmalı (vars. %50): <Nod olcek={ekranOlcegi(1080)} />. */
export function ekranOlcegi(ekranYuksekligi: number, oran = 0.5): number {
  const o = Math.max(0.45, Math.min(0.55, oran));
  return (ekranYuksekligi * o) / BOY;
}

export type GorunusAdi = 'on' | 'ucdort' | 'yan' | 'arka';

export interface GorunusAyari {
  yaw: number; // kafa dönüşü (radyan); yüz parçaları küre üstünde kayar (arka: π, yüz görünmez)
  govdeG: number; // gövde paneli genişliği
  omuzX: { sag: number; sol: number };
  kalcaX: { sag: number; sol: number };
  /** gövdenin arkasına çizilen taraf */
  uzak: 'sag' | 'sol' | null;
  golgeRx: number;
  golgeX: number;
}

// önden: karakterin sağı ekranın solunda; arkadan: ekranın sağında
export const GORUNUS: Record<GorunusAdi, GorunusAyari> = {
  on: { yaw: 0, govdeG: 46, omuzX: { sag: -30, sol: 30 }, kalcaX: { sag: -16, sol: 16 }, uzak: null, golgeRx: 70, golgeX: 0 },
  ucdort: { yaw: 0.55, govdeG: 38, omuzX: { sag: -25, sol: 21 }, kalcaX: { sag: -13, sol: 11 }, uzak: 'sol', golgeRx: 70, golgeX: 0 },
  yan: { yaw: 0.92, govdeG: 30, omuzX: { sag: 1, sol: -4 }, kalcaX: { sag: 2, sol: -5 }, uzak: 'sol', golgeRx: 62, golgeX: 10 },
  arka: { yaw: Math.PI, govdeG: 46, omuzX: { sag: 30, sol: -30 }, kalcaX: { sag: 16, sol: -16 }, uzak: null, golgeRx: 70, golgeX: 0 },
};

/** Atkı: önden görünüşte genişlik ölçeği; sarkan ucun bağlandığı nokta (boyun yerelinde). */
export const ATKI = {
  onOlcek: 0.88,
  ucdortOlcek: 0.78,
  ucGenislik: 27,
  ucGenislikYan: 22,
  ucBoy: 46,
} as const;

/** Konuşma ağız şekilleri (§8). */
export const AGIZLAR = ['kapali', 'A', 'E', 'I', 'O', 'U', 'MBP', 'FV'] as const;
export type Agiz = (typeof AGIZLAR)[number];

/** Bakış yönü (§2): göz bebekleri göz alanının kenarına kadar kayar; kafa da o yöne ~5° döner/eğilir. */
export type Bakis = 'sol' | 'sag' | 'yukari' | 'asagi' | 'izleyici';
export const BAKIS = {
  gozBebegi: 14, // yatay göz bebeği kayması (eskisinin 2 katı)
  gozBebegiDikey: 9, // dikey kayma (göz yuvası dikeyde daha dar)
  kafaDonus: 0.09, // sol/sag: kafa dönüşü (radyan, ~5°) — yüz küre üstünde kayar
  kafaEgim: 7, // yukari/asagi: yüzün yukarı/aşağı kayması (~5° eğim)
  kasKalkma: 5, // yukari: kaşlar kalkar
} as const;
