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
export const OLCU = {
  kafaR: 66,
  kontur: 5.5, // kalın siyah kontur
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
