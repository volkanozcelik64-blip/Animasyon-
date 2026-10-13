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
  ayakkabi: '#1f2a4f',
  ayakkabiAcik: '#33416e',
  taban: '#ffffff',
  golge: '#cfe3f6',
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

// Ölçüler (birim: SVG birimi; ayak tabanı y=0, yukarı negatif)
export const OLCU = {
  kafaR: 66,
  kontur: 5.5, // kalın siyah kontur
  inceKontur: 2.6, // atkı/yüz detayı
  kolKalinlik: 12,
  bacakKalinlik: 13,
  ustKol: 64,
  onKol: 60,
  ustBacak: 76,
  altBacak: 76,
  bilekY: -12, // ayak bileği yüksekliği (ayakta)
  kalcaY: -164,
  boyunY: -298, // atkı merkezi
  omuzY: -284,
  kafaY: -388,
} as const;
