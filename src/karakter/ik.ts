// İki kemikli IK (kol ve bacak). Açı kuralı Nod ile aynı: yön (−sin a, cos a); 0 = aşağı, + saat yönü.
// Uzuv boyları değişmez; hedef erişilemezse uzuv dümdüz hedefe uzanır.
import { OLCU } from './olculer';

export interface V { x: number; y: number }

const R2D = 180 / Math.PI;
export const aci = (v: V) => Math.atan2(-v.x, v.y) * R2D;
export const yon = (a: number): V => ({ x: -Math.sin(a / R2D), y: Math.cos(a / R2D) });
export const normal = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/**
 * kok: omuz/kalça, hedef: bilek/ayak bileği. taraf: +1/-1 orta eklemin hangi yana kırılacağı
 * (bacakta −1 = diz ileri (+x); kolda dirsek yönü sahneye göre seçilir).
 * Dönüş: ust (mutlak), orta (üste göre), alt yön açısı (mutlak).
 */
export function ikiKemik(kok: V, hedef: V, L1: number, L2: number, taraf: 1 | -1) {
  const D = { x: hedef.x - kok.x, y: hedef.y - kok.y };
  const d = Math.max(Math.abs(L1 - L2) + 0.01, Math.min(L1 + L2 - 0.01, Math.hypot(D.x, D.y)));
  const a0 = aci(D);
  const alfa = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))) * R2D;
  const ust = a0 + taraf * alfa;
  const e = yon(ust);
  const E = { x: kok.x + e.x * L1, y: kok.y + e.y * L1 };
  const alt = aci({ x: hedef.x - E.x, y: hedef.y - E.y });
  return { ust: normal(ust), orta: normal(alt - ust), alt: normal(alt), dirsek: E };
}

/** Bacak: kalça eklemi → ayak bileği (Nod yerelinde, sağa bakan). Diz ileri (+x) kırılır. */
export function bacakIK(kalca: V, bilek: V) {
  const r = ikiKemik(kalca, bilek, OLCU.ustBacak, OLCU.altBacak, -1);
  return { kalca: r.ust, diz: r.orta };
}

/**
 * Kol: omuz → bilek (üst gövde yerelinde). elAci: elin mutlak yönü (0 = aşağı, 180 = yukarı).
 * dirsekTaraf: +1 / −1 (dirseğin hangi yana kırılacağı).
 */
export function kolIK(omuz: V, bilek: V, elAci: number, dirsekTaraf: 1 | -1) {
  const r = ikiKemik(omuz, bilek, OLCU.ustKol, OLCU.onKol, dirsekTaraf);
  return { omuz: r.ust, dirsek: r.orta, bilek: normal(elAci - r.alt) };
}

/** Elin bir noktası (el yerelinde, ölçeksiz) hedefe gelsin diye bilek nerede olmalı. */
export function bilekNerede(hedef: V, elAci: number, elYerel: number): V {
  const d = yon(elAci);
  const L = elYerel * OLCU.elOlcek;
  return { x: hedef.x - d.x * L, y: hedef.y - d.y * L };
}
