// "1% Battery" SHORTS — Short1 (8 sn, DİKEY 1080x1920, 30 fps). Nod konuşmaz: balon.
// Shorts kuralları: Nod ekran yüksekliğinin %40-55'i; önemli her şey ortadaki %70'te; alt %20 ve sağ kenar
// arayüzle kapanır (yazı/balon yok); her 1,5-2 sn'de kesme ya da kamera hareketi; hızlı, abartılı hareket.
// 1) 0-1 sn    HOOK: telefon ekranı yakın plan, Just Nod videosu oynuyor, "1%" yanıp söner, Low Battery PAT diye açılır
// 2) 1-2,5 sn  hızlı zoom out: kanepede Nod, gülümseme → ŞOK (mavi yüz, atkı dimdik, sarsıntı, dun-dun) + "NO NO NO!"
// 3) 2,5-5 sn  kesme: kalkar, minderleri kameraya doğru fırlatır (whoosh), atkı savrulur, dolaba koşar
// 4) 5-8 sn    kesme: çekmeceyi hızla açar, kablo yumağı fırlar ve yüzüne yapışır; kafası karışık, atkı "?"
import React from 'react';
import { random, spring } from 'remotion';
import { Nod, type Poz, type Duygu } from '../karakter/Nod';
import { RENK, OLCU, GORUNUS, ekranOlcegi, type Agiz, type Bakis } from '../karakter/olculer';
import { AYAKTA } from '../karakter/poz';
import type { AtkiDurumAdi } from '../karakter/atkiTepki';
import { kalk, yuru, kolHedef, elKonumu, kafaKonumu, gozKirp, aralik, yumusak, cikis, sinirla, OTURMA_ILERI } from '../karakter/hareketler';
import { bilekNerede, type V } from '../karakter/ik';
import { Balon } from '../karakter/Balon';
import { TelefonluEller, ONDEN, OMUZ_ARKASI, bilekYerel, yereldenDunyaya } from '../karakter/TelefonTutus';
import { Minder, KANEPE } from '../esyalar/Kanepe';
import { DOLAP } from '../esyalar/Dolap';
import { KabloYumagi, Kablo } from '../esyalar/Sarj';
import { ODA, Oda } from './pil/Oda';
import { tutanPoz, telefonVeKollar, gulme } from './Sarj1';

export const GENISLIK = 1080;
export const YUKSEKLIK = 1920;
export const FPS = 30;
export const SURE = 240; // 8 sn

/** Shorts ölçeği: ayakta Nod ekran yüksekliğinin %45'i (zoom 1). */
const S = ekranOlcegi(YUKSEKLIK, 0.45);
/** Güvenli alan: alt %20 ve sağ kenar Shorts arayüzü. */
export const GUVENLI = { x0: 60, x1: 900, y0: 200, y1: YUKSEKLIK * 0.8 } as const;

export const Z = {
  hook: 0, pat: 8,
  zoomOut: 30, sok: 43, balon: 48,
  kesme3: 75, kalk: 75, at1: 84, at2: 98, kos: 116,
  kesme4: 150, cek: 153, firla: 158, yapis: 170, cek1: 196, cek2: 214,
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const NOD_X = ODA.oturX;
const A_UC = GORUNUS.ucdort, A_YAN = GORUNUS.yan;

interface Kamera { x: number; y: number; zoom: number }

function sars(k: number, bas: number, sure: number, g: number): V {
  const t = k - bas;
  if (t < 0 || t >= sure) return { x: 0, y: 0 };
  const s = g * (1 - t / sure);
  return { x: (random(`shx${k}`) - 0.5) * 2 * s, y: (random(`shy${k}`) - 0.5) * 2 * s };
}

// ================================================================ 1) HOOK: telefon ekranı yakın plan
const Hook: React.FC<{ k: number }> = ({ k }) => {
  const uyari = k < Z.pat ? 0 : spring({ frame: k - Z.pat, fps: FPS, config: { damping: 8, stiffness: 320, mass: 0.45 } });
  // sürekli yavaş itme + PAT anında kısa vuruş
  const vurus = k >= Z.pat ? Math.exp(-(k - Z.pat) / 3) * 0.05 : 0;
  const zoom = 1 + 0.06 * (k / 30) + vurus;
  const sh = sars(k, Z.pat, 6, 10);
  const P = 9.2; // px / Nod birimi
  const aci = -4 + 2 * (k / 30);
  const tc = { x: 540 + sh.x, y: 880 + sh.y };
  const bilek = (t: 1 | -1) => { const b = bilekYerel(t, OMUZ_ARKASI); return yereldenDunyaya(tc, aci, { x: b.x * P, y: b.y * P }); };
  const bSol = bilek(-1), bSag = bilek(1);
  const dirsekSol = { x: bSol.x - 260, y: 2150 }, dirsekSag = { x: bSag.x + 200, y: 2150 };
  const ac = (a: V, b: V) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return (
    <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
      <defs><filter id="sh1b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter></defs>
      {/* odak dışı oda */}
      <g filter="url(#sh1b)">
        <rect x={-100} y={-100} width={1300} height={2200} fill="#f4f5f8" />
        <ellipse cx={760} cy={260} rx={420} ry={190} fill="#fff6dc" />
        <rect x={-100} y={1420} width={1300} height={700} fill="#e3e8ef" />
        <rect x={-100} y={1390} width={1300} height={32} fill="#fff" stroke={RENK.murekkep} strokeWidth={4} />
      </g>
      {[[dirsekSol, bSol], [dirsekSag, bSag]].map(([d, b], i) => (
        <line key={i} x1={d.x} y1={d.y} x2={b.x} y2={b.y} stroke={RENK.murekkep} strokeWidth={OLCU.kolKalinlik * P * 0.6} strokeLinecap="round" />
      ))}
      <g transform={`translate(${tc.x} ${tc.y}) rotate(${aci}) scale(${P})`}>
        <TelefonluEller yuz="ekran" kavrayis={OMUZ_ARKASI} aci={aci} onKolSol={ac(dirsekSol, bSol)} onKolSag={ac(dirsekSag, bSag)}
          kare={k} pil={1} uyari={uyari} yanip id="sh1hook" />
      </g>
    </g>
  );
};

// ================================================================ Nod durumu (2-4)
interface Durum {
  x: number; poz: Poz; duygu: Duygu; onceki?: Duygu; gecis: number; bak: Bakis; bas: number; agiz: Agiz; kirp: number;
  atkiDurum?: AtkiDurumAdi; atkiHavada: number; zipla: number; telefonda: boolean; kafaDonus: number;
}

/** Minder atışı: kol önce aşağı-geri (kavrar, 4 kare), sonra omuz üstünden sert savurur. */
function atis(k: number, bas: number, taraf: 'sag' | 'sol') {
  const t = aralik(k, bas, bas + 12);
  const omuz = t < 0.3 ? lerp(10, 70, yumusak(t / 0.3)) : lerp(70, -170, cikis((t - 0.3) / 0.7));
  return { omuz: taraf === 'sag' ? omuz : -omuz, dirsek: -15, bilek: 0, el: (t < 0.55 ? 'yumruk' : 'acik') as Poz['sagKol']['el'] };
}
const BIRAK = 7; // atış başından bırakmaya (kare)

/** Yumağın yüze yapıştığı yer (kafa merkezine göre, 3/4 görünüş: yüz +x'te). */
const YUMAK_YUZ: V = { x: 44, y: 64 }; // ağız/çene ve yanak: gözler açıkta kalır
const YUMAK_R = 56;

export function durum(k: number): Durum {
  const n: Durum = {
    x: NOD_X, poz: tutanPoz(), duygu: 'mutlu', gecis: 1, bak: 'asagi', bas: 0, agiz: 'kapali', kirp: gozKirp(k, 'sh1'),
    atkiHavada: 0, zipla: 0, telefonda: true, kafaDonus: 0,
  };
  if (k < Z.kesme3) {
    // kanepede: gülüyor → şok
    if (k < Z.sok) {
      const gl = gulme(k);
      n.bas = 0.18 * gl.v; n.zipla = 3 * gl.v;
      n.agiz = Math.floor(k / 3) % 2 === 0 ? 'A' : 'E';
      n.poz = tutanPoz({ x: 0, y: 0 }, 4 * gl.v);
    } else {
      const t = k - Z.sok;
      n.duygu = 'korkmus'; n.onceki = 'mutlu'; n.gecis = sinirla(t / 4);
      n.zipla = Math.sin(Math.PI * sinirla(t / 7)) * 22; // sert irkilme
      n.atkiDurum = 'fikir'; n.bak = 'izleyici';
      const tt = t > 5 ? 1 : 0;
      n.poz = tutanPoz({ x: tt * 2.6 * Math.sin(k * 2.3), y: tt * 2 * Math.cos(k * 3.1) });
      if (k >= Z.balon) n.agiz = Math.floor(k / 3) % 2 === 0 ? 'O' : 'A';
    }
    return n;
  }
  n.telefonda = false;
  n.duygu = 'korkmus'; n.onceki = undefined; n.gecis = 1; n.bak = 'izleyici';
  if (k < Z.kesme4) {
    if (k < Z.at1) {
      n.poz = kalk(cikis(aralik(k, Z.kalk, Z.at1 - 1)), 'ucdort');
    } else if (k < Z.kos) {
      const ayakta = { ...AYAKTA.ucdort, kok: { x: OTURMA_ILERI, y: AYAKTA.ucdort.kok.y } };
      n.poz = {
        ...ayakta,
        sagKol: k < Z.at2 ? atis(k, Z.at1, 'sag') : ayakta.sagKol,
        solKol: k >= Z.at2 ? atis(k, Z.at2, 'sol') : ayakta.solKol,
        egim: 9 * Math.sin((k - Z.at1) * 0.45),
      };
      // atkı savrulur
      const s1 = Math.max(0, 1 - Math.abs(k - (Z.at1 + BIRAK)) / 8), s2 = Math.max(0, 1 - Math.abs(k - (Z.at2 + BIRAK)) / 8);
      n.atkiHavada = Math.max(s1, s2);
    } else {
      // dolaba koşu: yan görünüş, hızlı
      const w = yuru((k - Z.kos) / 9, 2000);
      n.x = NOD_X + OTURMA_ILERI + w.kalcaX * 1.3;
      n.poz = w.poz;
      n.atkiHavada = 0.7;
    }
    return n;
  }
  // 4) dolap
  n.x = ODA.dolapOnu;
  const tutamakY = -DOLAP.yukseklik + 14 + 39 - OLCU.kalcaY;
  const tutamakX = ODA.dolapX - ODA.dolapOnu - DOLAP.genislik / 2 + 30;
  if (k < Z.yapis) {
    // kısa hazırlık (geri yaslan) → sert çekiş
    const hazir = aralik(k, Z.kesme4, Z.cek);
    const cek = aralik(k, Z.cek, Z.cek + 4);
    const dx = -6 * hazir + 22 * cikis(cek);
    n.poz = { ...AYAKTA.yan, egim: -7 * hazir + 4 * cek, sagKol: kolHedef(A_YAN.omuzX.sag, bilekNerede({ x: tutamakX + dx, y: tutamakY }, -90, 14), -90, 'yumruk', true) };
    n.bak = k >= Z.firla ? 'yukari' : 'sag';
    if (k >= Z.firla) { n.duygu = 'sasirmis'; }
    return n;
  }
  // yapıştı: geri savrulur, kameraya döner (3/4), kafası karışık, atkı "?"
  const t = k - Z.yapis;
  const geri = spring({ frame: t, fps: FPS, config: { damping: 7, stiffness: 260, mass: 0.5 } });
  n.duygu = 'kafasi_karisik'; n.onceki = 'korkmus'; n.gecis = sinirla(t / 5);
  const temel = AYAKTA.ucdort;
  // yumağı silkelemeye çalışır: iki sert kafa sallaması
  const silk = (bas: number) => (k >= bas && k < bas + 14 ? Math.sin(((k - bas) / 14) * Math.PI * 3) * (1 - (k - bas) / 14) : 0);
  n.kafaDonus = 0.45 * (silk(Z.cek1) + silk(Z.cek2));
  const kollar: Partial<Poz> = {};
  n.poz = { ...temel, egim: -12 * (1 - geri), kafaEgim: -10 * (1 - geri) + 6 * Math.sin(t * 0.25), ...kollar };
  n.kafaDonus += 0.08 * Math.sin(t * 0.3);
  n.bas = 0.15 * (silk(Z.cek1) + silk(Z.cek2));
  n.bak = 'izleyici';
  return n;
}

// ================================================================ kamera (2-4)
function kamera(k: number): Kamera {
  if (k < Z.kesme3) {
    // hızlı zoom out: telefondan kanepeye (sert yay), sonra yavaş itme
    const yakin: Kamera = { x: NOD_X + 30, y: -150, zoom: 6.5 };
    const orta: Kamera = { x: NOD_X + 40, y: -250, zoom: 1.32 };
    const t = spring({ frame: k - Z.zoomOut, fps: FPS, config: { damping: 14, stiffness: 240, mass: 0.6 } });
    const c = { x: lerp(yakin.x, orta.x, t), y: lerp(yakin.y, orta.y, t), zoom: Math.exp(lerp(Math.log(yakin.zoom), Math.log(orta.zoom), t)) };
    c.zoom *= 1 + 0.08 * yumusak(aralik(k, Z.sok, Z.kesme3)); // şokta itme
    return c;
  }
  if (k < Z.kesme4) {
    // minder sahnesi: farklı açı (daha geniş), atışlarda hafif itme; koşuda sağa kaydırma
    const ilk: Kamera = { x: NOD_X + 90, y: -330, zoom: 1.05 };
    const itik: Kamera = { x: NOD_X + 70, y: -320, zoom: 1.18 };
    if (k < Z.kos) return { ...lerpV(ilk, itik, yumusak(aralik(k, Z.kesme3, Z.kos))), zoom: lerp(ilk.zoom, itik.zoom, yumusak(aralik(k, Z.kesme3, Z.kos))) };
    const nx = durum(Math.max(Z.kos, k - 3)).x;
    return { x: lerp(itik.x, nx + 120, yumusak(aralik(k, Z.kos, Z.kos + 10))), y: -320, zoom: lerp(1.18, 1.0, aralik(k, Z.kos, Z.kesme4)) };
  }
  // dolap: orta plan → yumak yapışınca yüze itme → hafif kayma
  const orta: Kamera = { x: ODA.dolapOnu + 80, y: -300, zoom: 1.25 };
  const yuz: Kamera = { x: ODA.dolapOnu + 40, y: -470, zoom: 2.15 };
  const t = spring({ frame: k - (Z.yapis + 4), fps: FPS, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const c = { x: lerp(orta.x, yuz.x, t), y: lerp(orta.y, yuz.y, t), zoom: Math.exp(lerp(Math.log(orta.zoom), Math.log(yuz.zoom), t)) };
  c.x += 12 * Math.sin((k - Z.yapis) * 0.05) * sinirla((k - Z.yapis) / 30);
  return c;
}

// ================================================================ dünya sahnesi (2-4)
const Dunya: React.FC<{ k: number }> = ({ k }) => {
  const n = durum(k);
  const cam = kamera(k);
  const sh = k < Z.kesme3 ? sars(k, Z.sok, 16, 26) : sars(k, Z.yapis, 8, 18);
  const olc = cam.zoom * S;
  const ekran = (p: V): V => ({ x: GENISLIK / 2 + (p.x - cam.x) * olc + sh.x, y: YUKSEKLIK / 2 + (p.y - cam.y) * olc + sh.y });
  const g = `translate(${GENISLIK / 2 + sh.x} ${YUKSEKLIK / 2 + sh.y}) scale(${olc}) translate(${-cam.x} ${-cam.y})`;
  const yer = (p: V): V => ({ x: n.x + p.x, y: p.y - n.zipla });
  const kafa = kafaKonumu(n.poz);
  const kafaD = yer(kafa.merkez), agizD = yer(kafa.agiz);

  // minderler: atışta elde, bırakınca kameraya doğru uçar (ekran uzayında büyüyerek)
  const minderAt = [Z.at1, Z.at2];
  const minderYerinde = (i: number) => k < minderAt[i] + 3;
  const minderElde = (i: number) => k >= minderAt[i] + 3 && k < minderAt[i] + BIRAK;
  const ucan = minderAt.map((bas, i) => {
    const t = (k - bas - BIRAK) / 11;
    if (t < 0 || t > 1) return null;
    const el = ekran(yer(elKonumu(durum(bas + BIRAK).poz, i === 0 ? 'sag' : 'sol').avuc));
    // kameraya doğru: büyüyerek aşağı-yana, kadrajdan çıkar
    const hedef = i === 0 ? { x: -380, y: 1700 } : { x: 1300, y: 1500 };
    const p = lerpV(el, hedef, Math.pow(t, 1.6));
    return { p, olcek: olc * (1 + 6 * t), aci: (i === 0 ? -1 : 1) * (15 + 160 * t) };
  });

  // telefon: sahne 2'de bileklere bağlı; sonra kanepeye bırakılmış
  const tel = n.telefonda ? telefonVeKollar(n.poz, yer) : null;

  // yumak: çekmeceden fırlar → yüze yapışır (kafaya bağlı)
  let yumak: { p: V; r: number; aci: number; ez: number } | null = null;
  if (k >= Z.firla) {
    const cik = { x: ODA.dolapX - 40, y: -DOLAP.yukseklik + 10 };
    const yuzD = (kk: number) => { const d = durum(kk); const kf = kafaKonumu(d.poz).merkez; return { x: d.x + kf.x + YUMAK_YUZ.x, y: kf.y + YUMAK_YUZ.y }; };
    if (k < Z.yapis) {
      const t = (k - Z.firla) / (Z.yapis - Z.firla);
      const hedef = yuzD(Z.yapis);
      const p = lerpV(cik, hedef, t);
      yumak = { p: { x: p.x, y: p.y - 340 * Math.sin(Math.PI * t) }, r: lerp(36, YUMAK_R, t), aci: t * 540, ez: 1 };
    } else {
      const t = k - Z.yapis;
      const ez = 1 - 0.25 * Math.exp(-t / 3) * Math.cos(t * 1.2); // yapışma: ezilip sallanır
      const d = durum(k);
      const p = yuzD(k);
      yumak = { p: { x: p.x + 40 * d.kafaDonus, y: p.y }, r: YUMAK_R, aci: 30 * d.kafaDonus, ez };
    }
  }

  const minderCiz = (i: number) => {
    const el = yer(elKonumu(n.poz, i === 0 ? 'sag' : 'sol').avuc);
    return <g key={`m${i}`} transform={`translate(${el.x} ${el.y}) rotate(${i === 0 ? -20 : 20}) translate(0 ${-KANEPE.minderKalinlik / 2})`}><Minder /></g>;
  };

  return (
    <g>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      <g transform={g}>
        <Oda minderler={[minderYerinde(0), minderYerinde(1)]} cekmece={k < Z.cek ? 0 : spring({ frame: k - Z.cek, fps: FPS, config: { damping: 9, stiffness: 300, mass: 0.4 } })} />
        {/* kanepeye bırakılan telefon */}
        {!n.telefonda && <rect x={NOD_X + 30} y={KANEPE.minderUst - (minderYerinde(0) ? 9 : -KANEPE.minderKalinlik + 9)} width={58} height={9} rx={4} fill="#2b2d33" stroke={RENK.murekkep} strokeWidth={3} />}
        <ellipse cx={n.x + (n.poz.kok.y > -180 ? OTURMA_ILERI : n.poz.kok.x) + 10} cy={2} rx={70} ry={8} fill={RENK.golge} />
        <Nod id="sh1" x={n.x} y={-n.zipla} olcek={1} poz={n.poz} duygu={n.duygu} oncekiDuygu={n.onceki} gecis={n.gecis}
          kare={k} bak={n.bak} bas={n.bas} agiz={n.agiz} kirp={n.kirp} atkiDurum={n.atkiDurum} atkiHavada={n.atkiHavada}
          kafaDonus={n.kafaDonus} golge={false} elleriGizle={n.telefonda} sagNesne={<g />} solNesne={<g />} />
        {[0, 1].map((i) => (minderElde(i) ? minderCiz(i) : null))}
        {tel && (
          <g transform={`translate(${tel.x} ${tel.y}) rotate(${tel.aci})`}>
            <TelefonluEller yuz="sirt" kavrayis={ONDEN} aci={tel.aci} onKolSol={tel.onKolSol} onKolSag={tel.onKolSag} id="sh1sirt" />
          </g>
        )}
        {yumak && (
          <g>
            {k >= Z.yapis && <Kablo noktalar={[{ x: yumak.p.x - 10, y: yumak.p.y + 30 }, { x: yumak.p.x - 30, y: yumak.p.y + 110 }, { x: yumak.p.x + 6, y: yumak.p.y + 170 }, { x: yumak.p.x - 14, y: yumak.p.y + 230 }]} kalinlik={6} />}
            <g transform={`translate(${yumak.p.x} ${yumak.p.y}) rotate(${yumak.aci}) scale(${2 - yumak.ez} ${yumak.ez})`}><KabloYumagi r={yumak.r} tohum="sh1yumak" /></g>
          </g>
        )}
      </g>
      {/* kameraya doğru uçan minderler (ekran uzayı) */}
      {ucan.map((u, i) => u && (
        <g key={`u${i}`} transform={`translate(${u.p.x} ${u.p.y}) rotate(${u.aci}) scale(${u.olcek}) translate(0 ${-KANEPE.minderKalinlik / 2})`}><Minder /></g>
      ))}
      {/* balon: kafanın üstünde, sol-ortada (güvenli alan) */}
      {k >= Z.balon && k < Z.kesme3 && (() => {
        const kf = ekran(kafaD);
        // kuyruk başın tepesine yönelir (yüzün üstünden geçmez)
        const tepe = { x: kf.x, y: kf.y - OLCU.kafaR * olc * 1.05 };
        return <Balon tip="bagirma" metin="NO NO NO!" x={Math.min(GUVENLI.x1 - 300, kf.x + 30)} y={kf.y - 360} hedef={tepe}
          kare={k} baslangic={Z.balon} sure={Z.kesme3 - Z.balon - 6} olcek={1.45} hiz={2.2} />;
      })()}
    </g>
  );
};

// ================================================================ sahne
export const Sahne: React.FC<{ kare: number }> = ({ kare: k }) => (
  <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
    <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
    {k < Z.zoomOut ? <Hook k={k} /> : <Dunya k={k} />}
  </svg>
);

/** Ses efektleri: her aksiyonda. */
export const SESLER: { kare: number; dosya: string; ses?: number }[] = [
  { kare: Z.pat, dosya: 'dusuk-pil' },
  { kare: Z.pat + 1, dosya: 'pop', ses: 0.7 },
  { kare: Z.zoomOut, dosya: 'whoosh', ses: 0.8 },
  { kare: Z.sok - 2, dosya: 'dun-dun' },
  { kare: Z.balon, dosya: 'pop', ses: 0.8 },
  { kare: Z.kesme3, dosya: 'whoosh', ses: 0.5 },
  { kare: Z.at1 + BIRAK - 1, dosya: 'whoosh' },
  { kare: Z.at2 + BIRAK - 1, dosya: 'whoosh' },
  { kare: Z.kos, dosya: 'whoosh', ses: 0.6 },
  { kare: Z.cek, dosya: 'cekmece' },
  { kare: Z.firla, dosya: 'whoosh', ses: 0.8 },
  { kare: Z.yapis, dosya: 'bonk' },
  { kare: Z.cek1 + 3, dosya: 'whoosh', ses: 0.5 },
  { kare: Z.cek2 + 3, dosya: 'whoosh', ses: 0.5 },
];
