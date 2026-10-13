// Atkı = ikinci yüz (§4). Sarkan uç, kontrol noktalı bir kübik bezier eğrisi (çok parçalı) boyunca çizilen örgü şerittir.
// Biçim = K çapa noktası; her parçanın iki tutamacı Catmull-Rom kuralıyla çapalardan türetilir (C1 = Pi + (Pi+1 − Pi−1)/6 …).
// Geçişte çapalar (dolayısıyla tüm kontrol noktaları) karıştırılır → şekiller arası yumuşak geçiş.
// Her duygu eğriye kendi biçimini verir; yay benzetiminden gelen a1/a2 (follow-through) üstüne eklenir.
// Biçimler kare sayısıyla canlanır (sallanma, titreme, daire çizme). Rastgelelik yok: her şey kareye bağlı.
import type { Duygu } from './yuz';
import type { GorunusAdi } from './olculer';
import { ATKI } from './olculer';

export type AtkiDurumAdi = Duygu | 'fikir' | 'havada';
export interface Nokta { x: number; y: number }
/** onde: uç kıvrımın ÖNÜNDE çizilir (yükselen biçimler); kökü küçük bir düğüm örter. */
export interface AtkiSekli { kontrol: Nokta[]; genislik: number; onde?: boolean }

const N = 40; // biçim üretirken kullanılan yoğun örnek
const K = 15; // bezier çapa noktası sayısı (14 kübik parça; kalp ve soru işareti için yeterli)
const ORNEK = 56; // şerit için eğriden alınan örnek

/** Yoğun noktalardan eşit aralıklı K çapa seç. */
function capalar(p: Nokta[]): Nokta[] {
  return Array.from({ length: K }, (_, i) => p[Math.round((i / (K - 1)) * (p.length - 1))]);
}
const sekil = (p: Nokta[], genislik: number, onde?: boolean): AtkiSekli => ({ kontrol: capalar(p), genislik, onde });

/** Çapalardan kübik bezier parçaları: [P0, C1, C2, P1][]. */
export function bezierParcalari(c: Nokta[]): [Nokta, Nokta, Nokta, Nokta][] {
  const at = (i: number) => c[Math.max(0, Math.min(c.length - 1, i))];
  const out: [Nokta, Nokta, Nokta, Nokta][] = [];
  for (let i = 0; i < c.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    out.push([
      p1,
      { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    ]);
  }
  return out;
}

/** Orta eğrinin SVG yolu (M … C …). */
export function bezierYolu(s: AtkiSekli): string {
  const f = (q: Nokta) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  const parca = bezierParcalari(s.kontrol);
  return `M${f(parca[0][0])}` + parca.map(([, a, b, c]) => `C${f(a)} ${f(b)} ${f(c)}`).join('');
}

/** Bezier eğrisinden şerit için örnek noktalar. */
function ornekle(s: AtkiSekli): Nokta[] {
  const parca = bezierParcalari(s.kontrol);
  const n = Math.ceil(ORNEK / parca.length);
  const p: Nokta[] = [];
  parca.forEach(([a, b, c, d], j) => {
    for (let i = j === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      p.push({
        x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
        y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
      });
    }
  });
  return p;
}
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
  // arkadan bakışta karakterin sol omzu ekranın solunda
  const geri = gorunus === 'yan' || gorunus === 'arka' ? -1 : 1;
  const titre = (k % 2 === 0 ? 1 : -1);
  switch (d) {
    case 'mutlu': // kuyruk gibi sallanır
      return sekil(yoldan((s) => 22 * Math.sin(k * 0.22 - s * 2.2) * s, L), w);
    case 'heyecanli': // havalanıp dalgalanır
      return sekil(
        yoldan((s) => geri * (55 + 55 * s) + 22 * Math.sin(k * 0.45 - s * 6), L * 1.3),
        w * 0.9, true,
      );
    case 'uzgun': // aşağı sarkar, söner gibi düşer (uzar, incelir, kıpırtısız)
      return sekil(yoldan(() => -3 * geri, L * 1.18), w * 0.85);
    case 'kizgin': // dikleşir, kısa sert titrer
      return sekil(yoldan((s) => geri * (48 + 6 * s) + titre * 3.5, L * 0.95), w, true);
    case 'korkmus': // boyna sıkıca sarılır (kısalır), ucu titrer
      return sekil(yoldan((s) => -12 * geri + titre * 9 * s * s, L * 0.5), w * 0.95);
    case 'kafasi_karisik': {
      // soru işareti: önce yukarı, sonra dışa ve aşağı kıvrılır, kısa bir sap
      const phi = (s: number) => (s < 0.72 ? 185 - 235 * (s / 0.72) : -50 + 50 * ((s - 0.72) / 0.28));
      return sekil(yoldan((s) => geri * phi(s) + 4 * Math.sin(k * 0.1), L * 2.2), w * 0.58, true);
    }
    case 'asik': // kalp şekli
      return sekil(kalpYolu(1.6 + 0.05 * Math.sin(k * 0.3)), w * 0.45);
    case 'uykulu': // yastık gibi omza düşer
      return sekil(
        yoldan((s) => geri * (s < 0.45 ? 20 + 80 * (s / 0.45) : 100 - 75 * ((s - 0.45) / 0.55)), L * 1.3),
        w, true,
      );
    case 'dusunceli': {
      // yavaşça daireler çizer: uç bir daire üstünde döner
      const a = k * 0.07;
      return sekil(yoldan((s) => 30 * Math.sin(a) * s, L * (0.92 + 0.08 * Math.cos(a))), w);
    }
    case 'havada': // zıplarken yukarı savrulur, dalgalanır
    {
      // önce dışa, sonra kafanın yanından yukarı kıvrılır (yüzü örtmez), ucu dalgalanır
      const phi = (s: number) => (s < 0.4 ? 100 + 20 * (s / 0.4) : 120 + 55 * ((s - 0.4) / 0.6));
      return sekil(yoldan((s) => geri * phi(s) + 12 * s * Math.sin(k * 0.6 - s * 5), L * 1.7), w * 0.85, true);
    }
    case 'fikir': // ünlem gibi dikleşir
      return sekil(yoldan((s) => geri * (128 + 8 * s), L * 1.35), w * 0.8, true);
    case 'sasirmis': // bir an havalanır
      return sekil(yoldan((s) => geri * (30 + 25 * s), L), w);
    case 'gururlu': // bayrak gibi dalgalanır
      return sekil(yoldan((s) => geri * (70 + 12 * s) + 12 * Math.sin(k * 0.3 - s * 5), L), w, true);
    case 'utangac': // içe kıvrılır
      return sekil(yoldan((s) => -geri * 30 * s * s, L * 0.9), w * 0.95);
    case 'sikilmis':
    case 'notr':
    case 'sakin':
    default:
      return sekil(yoldan(() => 0, L), w);
  }
}

/** İki biçim arası (duygu geçişi 6-10 kare). */
export function atkiKaristir(a: AtkiSekli, b: AtkiSekli, t: number): AtkiSekli {
  return {
    kontrol: a.kontrol.map((p, i) => ({ x: p.x + (b.kontrol[i].x - p.x) * t, y: p.y + (b.kontrol[i].y - p.y) * t })),
    genislik: a.genislik + (b.genislik - a.genislik) * t,
    onde: t < 0.5 ? a.onde : b.onde,
  };
}

/**
 * Rüzgâr (yürürken/koşarken): uç uzar, dalgalanır ve kıvrımın önüne çıkar; böylece geriye savrulduğunda
 * boynun arkasından taşar. r: 0 … 1 (yay açısından türetilir), k: kare (dalgalanma).
 */
export function atkiRuzgar(s: AtkiSekli, r: number, k: number): AtkiSekli {
  if (r <= 0) return s;
  const kok = s.kontrol[0];
  const uzama = 1 + 0.85 * r;
  const kontrol = s.kontrol.map((p, i) => {
    const t = i / (s.kontrol.length - 1);
    const dx = (p.x - kok.x) * uzama, dy = (p.y - kok.y) * uzama;
    // eğriye dik küçük dalga (uca doğru büyür)
    const l = Math.hypot(dx, dy) || 1;
    const dal = Math.sin(k * 0.55 - t * 5) * 5 * r * t;
    return { x: kok.x + dx - (dy / l) * dal, y: kok.y + dy + (dx / l) * dal };
  });
  return { kontrol, genislik: s.genislik, onde: s.onde || r > 0.3 };
}

/** Follow-through: a1 (kök, derece) eğriyi kökten döndürür; a2 alt yarıyı ek olarak büker. + açı = saat yönü. */
export function atkiSalinim(s: AtkiSekli, a1: number, a2: number): AtkiSekli {
  const kok = s.kontrol[0];
  const don = (p: Nokta, m: Nokta, a: number) => {
    const c = Math.cos(a * D), n = Math.sin(a * D);
    const dx = p.x - m.x, dy = p.y - m.y;
    return { x: m.x + dx * c - dy * n, y: m.y + dx * n + dy * c };
  };
  const yari = Math.floor(K / 2);
  const p1 = s.kontrol.map((p) => don(p, kok, a1));
  const orta = p1[yari];
  const p2 = p1.map((p, i) => (i > yari ? don(p, orta, a2 * Math.min(1, ((i - yari) / (K - yari)) * 2)) : p));
  return { kontrol: p2, genislik: s.genislik, onde: s.onde };
}

/** Orta eğriden şerit çokgeni (yuvarlatılmış düz uçlu). */
export function seritYolu(s: AtkiSekli): { yol: string; dikis: string; uc: string } {
  const p = ornekle(s);
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
