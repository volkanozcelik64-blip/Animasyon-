// Lip sync (§8): ses analizinden (scripts/ses-analiz.ts → *.lipsync.json, @remotion/media-utils) ağız şekli.
// Ses şiddeti + frekans dengesi → 8 ağız şeklinden biri; eşik + yumuşatma + en az 2 kare tutma (titreme yok).
// Eşikler her sesin kendi dağılımından (yüzdelikler) hesaplanır: farklı ses kayıtlarında da dengeli şekil dağılımı.
// Sessizlikte duygunun kendi kapalı ağzı ('kapali'); hece arası kısa kapanmalar MBP.
import type { Agiz } from './olculer';

export interface SesKaresi { ses: number; alcak: number; orta: number; yuksek: number }
export interface SesAnalizi { kaynak: string; fps: number; sure: number; kareler: SesKaresi[] }

export const LIPSYNC = {
  sessiz: 0.07, // bunun altı sessizlik
  kisaKapanma: 2, // konuşma içindeki ≤2 karelik sessizlik → MBP (dudaklar kapanır)
  // yüzdelikler (konuşma karelerinin dağılımından)
  acikY: 0.7, // ses bunun üstü → geniş açık (A / O)
  ortaY: 0.4, // ses bunun üstü → orta açık (E / O)
  yuvarlakY: 0.75, // alçak frekans payı bunun üstü → yuvarlak dudak (O / U)
  surtunmeY: 0.85, // yüksek frekans payı bunun üstü + ses orta altı → FV
  inceY: 0.5, // yüksek frekans payı bunun üstü (kısık seste) → I
  tutma: 2, // bir şekil en az bu kadar kare kalır
} as const;

const yuzdelik = (v: number[], p: number) => {
  const s = v.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
};

const onbellek = new WeakMap<SesAnalizi, { agiz: Agiz[]; vurgu: number[] }>();

/** Yumuşatılmış ses şiddeti (komşu karelerle ağırlıklı ortalama). */
export function sesSiddeti(a: SesAnalizi, k: number): number {
  const v = (i: number) => a.kareler[Math.max(0, Math.min(a.kareler.length - 1, i))]?.ses ?? 0;
  if (k < 0 || k >= a.kareler.length) return 0;
  return 0.25 * v(k - 1) + 0.5 * v(k) + 0.25 * v(k + 1);
}

function hesapla(a: SesAnalizi) {
  const n = a.kareler.length;
  const L = LIPSYNC;
  const konusma = a.kareler.filter((_, k) => sesSiddeti(a, k) >= L.sessiz);
  const vs = konusma.map((_, i) => i).map((i) => sesSiddeti(a, a.kareler.indexOf(konusma[i])));
  const esik = {
    acik: yuzdelik(vs, L.acikY), orta: yuzdelik(vs, L.ortaY),
    yuvarlak: yuzdelik(konusma.map((x) => x.alcak), L.yuvarlakY),
    surtunme: yuzdelik(konusma.map((x) => x.yuksek), L.surtunmeY),
    ince: yuzdelik(konusma.map((x) => x.yuksek), L.inceY),
    dip: yuzdelik(vs, 0.3),
  };
  const ham: Agiz[] = [];
  for (let k = 0; k < n; k++) {
    const v = sesSiddeti(a, k);
    const { alcak, yuksek } = a.kareler[k];
    const yerelEnFazla = Math.max(...[-3, -2, -1, 1, 2, 3].map((d) => sesSiddeti(a, k + d)));
    let s: Agiz;
    if (v < L.sessiz) s = 'kapali';
    // hece arası dip: kısa dudak kapanışı
    else if (v < esik.dip && v <= sesSiddeti(a, k - 1) && v <= sesSiddeti(a, k + 1) && yerelEnFazla > 2 * v) s = 'MBP';
    else if (yuksek > esik.surtunme && v < esik.orta) s = 'FV';
    else if (v > esik.acik) s = alcak > esik.yuvarlak ? 'O' : 'A';
    else if (v > esik.orta) s = alcak > esik.yuvarlak ? 'O' : 'E';
    else s = alcak > esik.yuvarlak ? 'U' : yuksek > esik.ince ? 'I' : 'E';
    ham.push(s);
  }
  // konuşma içindeki kısa sessizlikler → MBP (dudak kapanışı), uzun sessizlik → kapali
  for (let k = 0; k < n; k++) {
    if (ham[k] !== 'kapali') continue;
    let son = k;
    while (son < n && ham[son] === 'kapali') son++;
    const uzunluk = son - k;
    if (k > 0 && son < n && uzunluk <= LIPSYNC.kisaKapanma) for (let i = k; i < son; i++) ham[i] = 'MBP';
    k = son - 1;
  }
  // en az `tutma` kare: tek karelik şekiller öncekine katılır
  const agiz = ham.slice();
  for (let k = 1; k < n - 1; k++) {
    if (agiz[k] !== agiz[k - 1] && agiz[k] !== agiz[k + 1]) agiz[k] = agiz[k - 1];
  }
  // uzun ünlü dizilerinde ses dipleri: ağız 2 kare bir kademe kapanır (A→E, O→U, E→I) — heceler okunur
  const yumusat: Partial<Record<Agiz, Agiz>> = { A: 'E', O: 'U', E: 'I' };
  for (let k = 1; k < n - 2; k++) {
    const v = sesSiddeti(a, k);
    const yerel = Math.max(...[-3, -2, -1, 1, 2, 3].map((d) => sesSiddeti(a, k + d)));
    const y = yumusat[agiz[k]];
    if (y && agiz[k - 1] === agiz[k] && v < sesSiddeti(a, k - 1) && v <= sesSiddeti(a, k + 1) && v < 0.85 * yerel) {
      agiz[k] = y; if (agiz[k + 1] !== 'kapali') agiz[k + 1] = y; k++;
    }
  }
  // vurgu: ses alçaktan hızla yükseldiğinde (vurgulu hece) küçük onay sallaması; en az 18 kare arayla
  const vurgu = new Array<number>(n).fill(0);
  let sonVurgu = -99;
  for (let k = 3; k < n; k++) {
    const simdi = sesSiddeti(a, k), once = Math.min(sesSiddeti(a, k - 2), sesSiddeti(a, k - 3));
    if (simdi > 0.45 && once < 0.3 && k - sonVurgu >= 18) {
      sonVurgu = k;
      for (let d = 0; d < 8 && k + d < n; d++) vurgu[k + d] = Math.max(vurgu[k + d], 0.32 * Math.sin((Math.PI * d) / 8));
    }
  }
  return { agiz, vurgu };
}

function sonuc(a: SesAnalizi) {
  let r = onbellek.get(a);
  if (!r) { r = hesapla(a); onbellek.set(a, r); }
  return r;
}

/** O karenin ağız şekli (ses yoksa 'kapali'). */
export function agizSec(a: SesAnalizi, k: number): Agiz {
  return k >= 0 && k < a.kareler.length ? sonuc(a).agiz[k] : 'kapali';
}

/** Konuşurken vurgulu hecelerde küçük kafa sallaması (bas: 0 … ~0.32). */
export function konusmaVurgu(a: SesAnalizi, k: number): number {
  return k >= 0 && k < a.kareler.length ? sonuc(a).vurgu[k] : 0;
}

/** `sonra` karesinden sonra sesin en az `enAz` kare boyunca `esik` altında kaldığı ilk kare (ör. "Hmm…" duraklaması). */
export function sessizlikBaslangici(a: SesAnalizi, sonra: number, enAz = 15, esik = 0.3): number {
  for (let k = sonra; k < a.kareler.length - enAz; k++) {
    let tamam = true;
    for (let d = 0; d < enAz; d++) if (sesSiddeti(a, k + d) >= esik) { tamam = false; break; }
    if (tamam) return k;
  }
  return a.kareler.length;
}

/** Son yüksek ses patlamasının başladığı kare (ör. "Okay, got it!"). */
export function sonPatlama(a: SesAnalizi, esik = 0.6): number {
  let k = a.kareler.length - 1;
  while (k > 0 && sesSiddeti(a, k) < esik) k--;
  while (k > 0 && sesSiddeti(a, k - 1) > LIPSYNC.sessiz) k--;
  return k;
}
