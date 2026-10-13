// Atkı = ikinci yüz (§4). Sarkan uç bir orta eğri (kontrol noktalı) boyunca çizilen örgü şerittir.
// Her duygu eğriye kendi biçimini verir; yay benzetiminden gelen a1/a2 (follow-through) üstüne eklenir.
// Biçimler kare sayısıyla canlanır (sallanma, titreme, daire çizme). Rastgelelik yok: her şey kareye bağlı.
import type { Duygu } from './yuz';
import type { GorunusAdi } from './olculer';
import { ATKI } from './olculer';

export type AtkiDurumAdi = Duygu | 'fikir';
export interface Nokta { x: number; y: number }
/** onde: uç kıvrımın ÖNÜNDE çizilir (yükselen biçimler); kökü küçük bir düğüm örter. */
export interface AtkiSekli { noktalar: Nokta[]; genislik: number; onde?: boolean }

const N = 40; // örnek nokta sayısı (geçişte nokta nokta karıştırılır)
const D = Math.PI / 180;

/** Yön açısı φ(s): 0 = aşağı, +90 = +x, 180 = yukarı. s: 0 (kök) → 1 (uç). Eğri φ boyunca adım adım ilerler. */
function yoldan(phi: (s: number) => number, boy: number, kokY = -6): Nokta[] {
  const p: Nokta[] = [{ x: 0, y: kokY }];
  const ds = boy / (N - 1);
  for (let i = 1; i < N; i++) {
    const s = (i - 0.5) / (N - 1);
    const a = phi(s) * D;
    const o = p[i - 1];
    p.push({ x: o.x + Math.sin(a) * ds, y: o.y + Math.cos(a) * ds });
  }
  return p;
}

/** Kalp: kökten başlayıp kalp çizgisini dolaşan şerit (aşık). */
function kalpYolu(boyut: number): Nokta[] {
  // kısa bir boyun (kıvrımın altından çıkış), sonra kalp çizgisi
  const boyun = 8, ustY = 20;
  const p: Nokta[] = [];
  for (let i = 0; i < boyun; i++) p.push({ x: 0, y: -6 + ((ustY + 6) * i) / boyun });
  for (let i = 0; i < N - boyun; i++) {
    const t = (i / (N - boyun - 1)) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    // kalbin üst çentiği köke (0,-6) gelsin, kalp aşağı sarksın
    p.push({ x: x * boyut, y: (y + 5) * boyut + ustY });
  }
  return p;
}

/**
 * Bir duygunun atkı ucu biçimi.
 * yon: "geri" tarafı (+1 = +x). Önden: +1 (karakterin sol omzu ekranın sağı); yanda: -1 (omuz/sırt arkada).
 */
export function atkiSekli(d: AtkiDurumAdi, k: number, gorunus: GorunusAdi): AtkiSekli {
  const L = ATKI.ucBoy;
  const w = gorunus === 'yan' ? ATKI.ucGenislikYan : ATKI.ucGenislik;
  const geri = gorunus === 'yan' ? -1 : 1;
  const titre = (k % 2 === 0 ? 1 : -1);
  switch (d) {
    case 'mutlu': // kuyruk gibi sallanır
      return { noktalar: yoldan((s) => 22 * Math.sin(k * 0.22 - s * 2.2) * s, L), genislik: w };
    case 'heyecanli': // havalanıp dalgalanır
      return {
        noktalar: yoldan((s) => geri * (55 + 55 * s) + 22 * Math.sin(k * 0.45 - s * 6), L * 1.3),
        genislik: w * 0.9, onde: true,
      };
    case 'uzgun': // aşağı sarkar, söner gibi düşer (uzar, incelir, kıpırtısız)
      return { noktalar: yoldan(() => -3 * geri, L * 1.18), genislik: w * 0.85 };
    case 'kizgin': // dikleşir, kısa sert titrer
      return { noktalar: yoldan((s) => geri * (48 + 6 * s) + titre * 3.5, L * 0.95), genislik: w, onde: true };
    case 'korkmus': // boyna sıkıca sarılır (kısalır), ucu titrer
      return { noktalar: yoldan((s) => -12 * geri + titre * 9 * s * s, L * 0.5), genislik: w * 0.95 };
    case 'kafasi_karisik': {
      // soru işareti: önce yukarı, sonra dışa ve aşağı kıvrılır, kısa bir sap
      const phi = (s: number) => (s < 0.72 ? 185 - 235 * (s / 0.72) : -50 + 50 * ((s - 0.72) / 0.28));
      return { noktalar: yoldan((s) => geri * phi(s) + 4 * Math.sin(k * 0.1), L * 2.2), genislik: w * 0.58, onde: true };
    }
    case 'asik': // kalp şekli
      return { noktalar: kalpYolu(1.6 + 0.05 * Math.sin(k * 0.3)), genislik: w * 0.45 };
    case 'uykulu': // yastık gibi omza düşer
      return {
        noktalar: yoldan((s) => geri * (s < 0.45 ? 20 + 80 * (s / 0.45) : 100 - 75 * ((s - 0.45) / 0.55)), L * 1.3),
        genislik: w, onde: true,
      };
    case 'dusunceli': {
      // yavaşça daireler çizer: uç bir daire üstünde döner
      const a = k * 0.07;
      return { noktalar: yoldan((s) => 30 * Math.sin(a) * s, L * (0.92 + 0.08 * Math.cos(a))), genislik: w };
    }
    case 'fikir': // ünlem gibi dikleşir
      return { noktalar: yoldan((s) => geri * (128 + 8 * s), L * 1.35), genislik: w * 0.8, onde: true };
    case 'sasirmis': // bir an havalanır
      return { noktalar: yoldan((s) => geri * (30 + 25 * s), L), genislik: w };
    case 'gururlu': // bayrak gibi dalgalanır
      return { noktalar: yoldan((s) => geri * (70 + 12 * s) + 12 * Math.sin(k * 0.3 - s * 5), L), genislik: w, onde: true };
    case 'utangac': // içe kıvrılır
      return { noktalar: yoldan((s) => -geri * 30 * s * s, L * 0.9), genislik: w * 0.95 };
    case 'sikilmis':
    case 'notr':
    case 'sakin':
    default:
      return { noktalar: yoldan(() => 0, L), genislik: w };
  }
}

/** İki biçim arası (duygu geçişi 6-10 kare). */
export function atkiKaristir(a: AtkiSekli, b: AtkiSekli, t: number): AtkiSekli {
  return {
    noktalar: a.noktalar.map((p, i) => ({ x: p.x + (b.noktalar[i].x - p.x) * t, y: p.y + (b.noktalar[i].y - p.y) * t })),
    genislik: a.genislik + (b.genislik - a.genislik) * t,
    onde: t < 0.5 ? a.onde : b.onde,
  };
}

/** Follow-through: a1 (kök, derece) eğriyi kökten döndürür; a2 alt yarıyı ek olarak büker. + açı = saat yönü. */
export function atkiSalinim(s: AtkiSekli, a1: number, a2: number): AtkiSekli {
  const kok = s.noktalar[0];
  const don = (p: Nokta, m: Nokta, a: number) => {
    const c = Math.cos(a * D), n = Math.sin(a * D);
    const dx = p.x - m.x, dy = p.y - m.y;
    return { x: m.x + dx * c - dy * n, y: m.y + dx * n + dy * c };
  };
  const yari = Math.floor(N / 2);
  const p1 = s.noktalar.map((p) => don(p, kok, a1));
  const orta = p1[yari];
  const p2 = p1.map((p, i) => (i > yari ? don(p, orta, a2 * Math.min(1, (i - yari) / (N - yari) * 2)) : p));
  return { noktalar: p2, genislik: s.genislik, onde: s.onde };
}

/** Orta eğriden şerit çokgeni (yuvarlatılmış düz uçlu). */
export function seritYolu(s: AtkiSekli): { yol: string; dikis: string; uc: string } {
  const p = s.noktalar;
  const h = s.genislik / 2;
  const sol: Nokta[] = [], sag: Nokta[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    tx /= l; ty /= l;
    sol.push({ x: p[i].x - ty * h, y: p[i].y + tx * h });
    sag.push({ x: p[i].x + ty * h, y: p[i].y - tx * h });
  }
  const f = (q: Nokta) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  const yol = `M${sol.map(f).join('L')}L${sag.slice().reverse().map(f).join('L')}Z`;
  // ilmek sırası çizgisi (kenara yakın) ve uca yakın enine çizgi
  const ic = (i: number) => {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: p[i].x - ((b.y - a.y) / l) * (h - 4), y: p[i].y + ((b.x - a.x) / l) * (h - 4) };
  };
  const dikis = `M${p.slice(3).map((_, i) => f(ic(i + 3))).join('L')}`;
  const j = p.length - 4;
  const uc = `M${f(sol[j])}L${f(sag[j])}`;
  return { yol, dikis, uc };
}
