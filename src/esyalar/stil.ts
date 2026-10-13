import { RENK, CIZGI } from '../karakter/olculer';

// Eşyaların ortak tarzı (§9): kalın siyah kontur, beyaz dolgu, az renk.
export const ESYA = {
  dolgu: '#ffffff',
  golge: '#e6eaf0', // tek düz gölge tonu
  vurgu: RENK.bileklik, // az renk: Nod'un mavisi
  vurguAcik: '#cfe2f5',
  koyu: RENK.ayakkabi,
  kirmizi: RENK.atki,
} as const;

export const kontur = {
  stroke: RENK.murekkep,
  strokeWidth: CIZGI.esya,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
export const detay = {
  stroke: RENK.murekkep,
  strokeWidth: CIZGI.esyaDetay,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
  fill: 'none',
};
