// "1% Battery" (35 sn, 1920x1080, 30 fps; nod-temel ile aynı ölçek). Nod konuşmaz: replikler balonla.
// Oda soldan sağa: kanepe → çekmeceli dolap → duvar prizi (zemine yakın); tavan lambası üstte.
// Kamera yatay kaydırma + zoom ile takip eder; telefon ekranı, kablo ucu ve fiş için yakın çekim.
// Sahne saf bir fonksiyondur (kare → durum → çizim); önizleme kareleri ve render aynı kareleri çizer.
import React from 'react';
import { random } from 'remotion';
import { Nod, type Poz, type Duygu } from '../karakter/Nod';
import { RENK, OLCU, GORUNUS, ekranOlcegi, type Agiz, type Bakis } from '../karakter/olculer';
import { AYAKTA, duyguAt, pozKaristir } from '../karakter/poz';
import type { AtkiDurumAdi } from '../karakter/atkiTepki';
import {
  otur, kalk, yuru, nefes, gozKirp, konusmaSallama, kolHedef, elKonumu, kafaKonumu,
  aralik, yumusak, cikis, geriTepme, sinirla, OTURMA_ILERI,
} from '../karakter/hareketler';
import { bilekNerede, bacakIK, type V } from '../karakter/ik';
import { Balon, balonDurumu, sessizAgiz, type BalonTipi } from '../karakter/Balon';
import { Minder, KANEPE } from '../esyalar/Kanepe';
import { DOLAP } from '../esyalar/Dolap';
import { AkilliTelefon, type TelefonEkrani } from '../esyalar/Telefon';
import { Adaptor, KabloUcu, Kablo, KabloYumagi } from '../esyalar/Sarj';

export const GENISLIK = 1920;
export const YUKSEKLIK = 1080;
export const FPS = 30;
export const SURE = 1050; // 35 sn

const S = ekranOlcegi(YUKSEKLIK, 0.5); // nod-temel ile aynı: ayakta ekranın %50'si (zoom 1'de)

import { ODA, Oda } from './pil/Oda';
const ADAPTOR_ACIK = { x: 1515, y: -30 }; // pimlerin ucu: prize takılı DEĞİL (araya boşluk)
const ADAPTOR_TAKILI = { x: 1544, y: -40 };

// ---------------------------------------------------------------- zaman çizelgesi (kare)
export const Z = {
  s1: 0, telefonaZoom: 60, uyari: 96, zoomGeri: 140,
  s2: 150, don: 152, sok: 166, sokBalon: 172,
  s3: 270, kalk: 270, firlat1: 292, firlat2: 312, kos: 336, cekmece: 410,
  s4: 420, yumak: 420, dene: 450, bonk: 470, firlat: 484, yanlisBalon: 500,
  s5: 540, al: 540, yuru: 558, dal: 602, yat: 620,
  s6: 690, tak: 690, bekle: 705, kabloTakip: 720, fis: 746, donus: 760, bakis: 772, dusunceBalon: 776,
  s7: 800, fisTak: 802, ding: 813, yuvarlan: 822, rahat: 834, rahatBalon: 840,
  s8: 900, genis: 900, sessiz: 918, karanlik: 940, kirp1: 962, kirp2: 994, fisilti: 1008,
} as const;

// ---------------------------------------------------------------- yardımcılar
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

interface NodDurumu {
  x: number; // kök (dünya)
  sola: boolean;
  poz: Poz;
  don: number; // kalça çevresinde dönüş (derece): 90 = yüzüstü (baş +x)
  ezil: number; // yuvarlanma için dikey basıklık (1 = yok)
  havada: number;
  duygu: Duygu; onceki?: Duygu; gecis: number;
  bak: Bakis; bas: number; agiz: Agiz; kirp: number; kafaDonus: number; kafaYaw?: number;
  atkiDurum?: AtkiDurumAdi; atkiDurum2?: AtkiDurumAdi; atkiKarisim?: number;
}

/** Nod yerelindeki bir noktayı dünyaya taşı (aynalama + kalça çevresinde dönüş + yuvarlanma basıklığı). */
function dunya(n: NodDurumu, p: V): V {
  const m = n.sola ? -1 : 1;
  const q = { x: n.x + m * p.x, y: p.y - n.havada };
  const kalca = { x: n.x + m * n.poz.kok.x, y: n.poz.kok.y - n.havada };
  const a = (n.don * Math.PI) / 180;
  const dx = q.x - kalca.x, dy = q.y - kalca.y;
  const r = { x: kalca.x + dx * Math.cos(a) - dy * Math.sin(a), y: kalca.y + dx * Math.sin(a) + dy * Math.cos(a) };
  return { x: r.x, y: kalca.y + (r.y - kalca.y) * n.ezil };
}

// ---------------------------------------------------------------- pozlar
const A_UC = GORUNUS.ucdort, A_YAN = GORUNUS.yan;
const OMUZ = OLCU.omuzY - OLCU.kalcaY;

/** Kanepede oturan (3/4, sağa dönük), yakın el telefonu göğüs önünde tutar. */
export function kanepedeOturan(telefonYukari = 0): Poz {
  const p = otur(1, 'ucdort');
  const avuc = { x: 34, y: OMUZ + 52 - telefonYukari };
  return { ...p, egim: 2, kafaEgim: 6, sagKol: kolHedef(A_UC.omuzX.sag, bilekNerede(avuc, 160, 14), 160, 'tut', true) };
}

/** Yüzüstü (yerel: sağa bakan; sahne 90° döndürür → baş +x, yüz yere). Yakın kol prize gergin, uzak el telefonda. */
function yuzustu(k: number, uzanma = 0): Poz {
  const sal = (f: number) => 105 + 28 * Math.sin(k * 0.32 + f);
  return {
    ...AYAKTA.yan,
    kok: { x: 0, y: ODA.yatY },
    egim: 0,
    kafaEgim: -70,
    sagKol: { omuz: 178 - uzanma * 2, dirsek: -uzanma * 4, bilek: 0, el: 'tut' },
    solKol: kolHedef(A_YAN.omuzX.sol, bilekNerede({ x: 4, y: -188 }, 180, 14), 180, 'tut'),
    sagBacak: { kalca: -4, diz: sal(0), ayak: 0 },
    solBacak: { kalca: 4, diz: sal(Math.PI), ayak: 0 },
    atki: { a1: 0, a2: 0 }, // yerel aşağı = dünyada gövde boyunca: atkı yerde uzanır
  };
}

/** Sırtüstü (sahne aynalar + 90° döndürür → baş +x, yüz yukarı): kollar açık, rahat. */
function sirtustu(k: number): Poz {
  return {
    ...AYAKTA.yan,
    kok: { x: 0, y: ODA.yatY },
    egim: 0, kafaEgim: 0,
    // aynalı + 90°: omuz -163 → baş üstüne, yere paralel açık; -60 → göğsün üstünde gevşek
    sagKol: { omuz: -163, dirsek: 8, bilek: 0, el: 'acik' },
    solKol: { omuz: -60, dirsek: -15, bilek: 0, el: 'acik' },
    sagBacak: { kalca: 6, diz: -4, ayak: 0 },
    solBacak: { kalca: -8, diz: 6, ayak: 0 },
    atki: { a1: 0, a2: 0 },
  };
}

// ---------------------------------------------------------------- duygular
const DUYGULAR: { kare: number; duygu: Duygu }[] = [
  { kare: 0, duygu: 'mutlu' },
  { kare: Z.sok, duygu: 'korkmus' },
  { kare: Z.yumak + 6, duygu: 'kafasi_karisik' },
  { kare: Z.bonk + 2, duygu: 'kizgin' },
  { kare: Z.al, duygu: 'heyecanli' },
  { kare: Z.donus, duygu: 'notr' },
  { kare: Z.ding, duygu: 'mutlu' },
  { kare: Z.karanlik, duygu: 'notr' },
];

// ---------------------------------------------------------------- balonlar (ekranda kalma: kelime başına ≥0,3 sn)
interface BalonPlani { tip: BalonTipi; metin: string; bas: number; sure: number; ofset: V; karanlik?: boolean; olcek?: number }
export const BALONLAR: BalonPlani[] = [
  { tip: 'bagirma', metin: 'WAIT... 1%?! NO NO NO!', bas: Z.sokBalon, sure: 90, ofset: { x: 380, y: -160 } },
  { tip: 'bagirma', metin: 'WRONG ONE!', bas: Z.yanlisBalon, sure: 36, ofset: { x: 280, y: -150 } },
  { tip: 'dusunce', metin: '...', bas: Z.dusunceBalon, sure: 24, ofset: { x: 90, y: -330 }, olcek: 1.5 },
  { tip: 'normal', metin: 'Ahhh... finally.', bas: Z.rahatBalon, sure: 56, ofset: { x: 40, y: -230 } },
  { tip: 'fisilti', metin: '...seriously?', bas: Z.fisilti, sure: 30, ofset: { x: 60, y: -270 }, karanlik: true, olcek: 1.5 },
];

// ---------------------------------------------------------------- Nod'un her karedeki durumu
export function nodDurumu(k: number): NodDurumu {
  const d = duyguAt(DUYGULAR, k, k >= Z.sok && k < Z.sok + 8 ? 6 : 8);
  const n: NodDurumu = {
    x: ODA.oturX, sola: false, poz: kanepedeOturan(), don: 0, ezil: 1, havada: 0,
    duygu: d.duygu, onceki: d.onceki, gecis: d.t, bak: 'izleyici', bas: 0, agiz: 'kapali',
    kirp: gozKirp(k, 'pil'), kafaDonus: 0,
  };
  let nefesVar = true;

  if (k < Z.s2) {
    // 1) kanepede telefona bakıp gülüyor: kıkırdama (kısa hızlı kafa sallamaları), atkı kuyruk gibi
    n.poz = kanepedeOturan();
    n.bak = 'asagi';
    n.bas = k < Z.uyari ? 0.22 * Math.max(0, Math.sin(k * 0.9)) : 0;
  } else if (k < Z.s3) {
    // 2) donar (nefes de durur) → şok: zıplar gibi irkilir, atkı dimdik, yüz mavi
    n.poz = kanepedeOturan();
    nefesVar = k >= Z.sok + 20;
    if (k >= Z.sok) {
      const irk = Math.sin(Math.PI * sinirla((k - Z.sok) / 8)) * 14;
      n.poz = { ...n.poz, kok: { ...n.poz.kok, y: n.poz.kok.y - irk } };
      n.atkiDurum = 'fikir';
      n.bak = 'izleyici';
    } else n.bak = 'asagi';
  } else if (k < Z.s4) {
    // 3) panik: kalk → minderleri fırlat → sağa koş → çekmeceyi aç
    n.duygu = 'korkmus'; n.onceki = undefined; n.gecis = 1;
    if (k < Z.firlat1) {
      n.poz = kalk(aralik(k, Z.kalk, Z.firlat1 - 1), 'ucdort');
    } else if (k < Z.kos) {
      const ayakta = { ...AYAKTA.ucdort, kok: { x: OTURMA_ILERI, y: AYAKTA.ucdort.kok.y } };
      const atis = (bas: number, taraf: 'sag' | 'sol') => {
        const t = aralik(k, bas, bas + 16);
        // kol önce geride-aşağıda (minderi kavrar), sonra omuz üstünden ileri-yukarı savurur
        const omuz = t < 0.35 ? lerp(10, 60, yumusak(t / 0.35)) : lerp(60, -160, cikis((t - 0.35) / 0.65));
        return { omuz: taraf === 'sag' ? omuz : -omuz, dirsek: -20, bilek: 0, el: (t < 0.6 ? 'yumruk' : 'acik') as Poz['sagKol']['el'] };
      };
      n.poz = {
        ...ayakta,
        sagKol: k < Z.firlat2 ? atis(Z.firlat1, 'sag') : ayakta.sagKol,
        solKol: k >= Z.firlat2 ? atis(Z.firlat2, 'sol') : ayakta.solKol,
        egim: 6 * Math.sin(k * 0.6),
      };
    } else if (k < Z.cekmece) {
      // koşu: yan görünüş, hızlı sekerek; dolabın önünde durur
      const w = yuru((k - Z.kos) / 12, ODA.dolapOnu - (ODA.oturX + OTURMA_ILERI));
      n.x = ODA.oturX + OTURMA_ILERI + w.kalcaX;
      n.poz = w.poz;
      nefesVar = false;
    } else {
      n.x = ODA.dolapOnu;
      const t = yumusak(aralik(k, Z.cekmece, Z.cekmece + 6));
      const tutamak = { x: ODA.dolapX - ODA.dolapOnu - DOLAP.genislik / 2 + 30 + t * 16, y: -DOLAP.yukseklik + 14 + 39 - OLCU.kalcaY };
      n.poz = { ...AYAKTA.yan, sagKol: kolHedef(A_YAN.omuzX.sag, bilekNerede(tutamak, -90, 14), -90, 'yumruk', true) };
    }
  } else if (k < Z.s5) {
    // 4) düğümlü kablo yumağı: önden; uymayan uç ("bonk"); kızgın, fırlatır
    n.x = ODA.dolapOnu;
    const temel = AYAKTA.on;
    if (k < Z.yumak + 6) n.poz = AYAKTA.ucdort;
    else if (k < Z.dene) {
      // yumağı iki eliyle göğsünde tutar
      n.poz = {
        ...temel,
        sagKol: kolHedef(GORUNUS.on.omuzX.sag, bilekNerede({ x: -70, y: -70 }, -50, 14), -50, 'tut'),
        solKol: kolHedef(GORUNUS.on.omuzX.sol, bilekNerede({ x: 70, y: -70 }, 50, 14), 50, 'tut', true),
      };
    } else {
      // uç sağ elde, telefon sol elde; eller ortada buluşur, uç uymaz → geri seker
      const yakin = k < Z.bonk ? yumusak(aralik(k, Z.dene, Z.bonk)) : 1 - 0.6 * Math.sin(Math.PI * Math.min(1, (k - Z.bonk) / 6));
      const atis = k >= Z.firlat ? cikis(aralik(k, Z.firlat, Z.firlat + 10)) : 0;
      n.poz = {
        ...temel,
        sagKol: atis > 0
          ? { omuz: lerp(40, -150, atis), dirsek: -10, bilek: 0, el: 'acik' }
          : kolHedef(GORUNUS.on.omuzX.sag, bilekNerede({ x: 4, y: lerp(-40, -84, yakin) }, 180, 14), 180, 'tut'),
        solKol: kolHedef(GORUNUS.on.omuzX.sol, bilekNerede({ x: 6, y: -150 }, 180, 14), 180, 'tut', true),
      };
      if (k >= Z.bonk && k < Z.bonk + 6) n.bas = 0.4;
    }
    if (k >= Z.yanlisBalon - 2) n.bak = 'izleyici';
  } else if (k < Z.s6) {
    // 5) doğru kablo (kısa): dolaptan alır, prize yürür, yüzüstü uzanır; bacaklar havada sallanır, atkı yerde
    if (k < Z.yuru) {
      n.x = ODA.dolapOnu;
      const t = Math.sin(Math.PI * aralik(k, Z.al, Z.yuru));
      const tutamak = { x: ODA.dolapX - ODA.dolapOnu - DOLAP.genislik / 2 + 46, y: -DOLAP.yukseklik + 30 - OLCU.kalcaY };
      n.poz = pozKaristir(AYAKTA.yan, { ...AYAKTA.yan, sagKol: kolHedef(A_YAN.omuzX.sag, bilekNerede(tutamak, -90, 14), -90, 'tut', true) }, t);
    } else if (k < Z.dal) {
      const w = yuru((k - Z.yuru) / 16, 1080 - ODA.dolapOnu);
      n.x = ODA.dolapOnu + w.kalcaX; n.poz = w.poz; nefesVar = false;
    } else {
      // dalış: 0 → 90° döner, kalça öne ve aşağı
      const t = k < Z.yat ? yumusak(aralik(k, Z.dal, Z.yat)) : 1;
      n.x = lerp(1080, ODA.yatX, t);
      n.poz = pozKaristir({ ...AYAKTA.yan, egim: 20 * t }, yuzustu(k), t);
      n.poz = { ...n.poz, kok: { x: 0, y: lerp(OLCU.kalcaY, ODA.yatY, t) } };
      n.don = 90 * t;
      nefesVar = false;
    }
  } else if (k < Z.s7) {
    // 6) telefonu takar, şarj olmaz; duraksama; kamera fişe gider; Nod kameraya düz bakar
    n.x = ODA.yatX; n.don = 90;
    const salla = k < Z.bekle ? Math.sin(k * 1.8) * 4 : 0;
    n.poz = yuzustu(k, 0);
    n.poz = { ...n.poz, solKol: { ...n.poz.solKol, bilek: n.poz.solKol.bilek + salla } };
    if (k >= Z.bakis) {
      // kafa dikleşir ve yüz kameraya döner: düz bakış
      const t = yumusak(aralik(k, Z.bakis, Z.bakis + 5));
      n.poz = { ...n.poz, kafaEgim: lerp(-70, -90, t) };
      n.kafaYaw = lerp(0.92, 0, t);
    }
    nefesVar = false;
  } else if (k < Z.s8) {
    // 7) fişi takar → "ding" → sırtüstü yere yayılır; atkı kalp
    n.x = ODA.yatX; n.don = 90;
    if (k < Z.yuvarlan) {
      const it = yumusak(aralik(k, Z.fisTak, Z.fisTak + 8));
      n.poz = yuzustu(k, it * 4);
      n.kafaYaw = 0; n.poz = { ...n.poz, kafaEgim: -90 };
    } else {
      // yuvarlanma: gövde basılıp (yüzüstü) yeniden açılır (sırtüstü, aynalı)
      const t = aralik(k, Z.yuvarlan, Z.rahat);
      n.ezil = Math.max(0.12, Math.abs(Math.cos(Math.PI * t)));
      if (t < 0.5) { n.poz = { ...yuzustu(k, 4), kafaEgim: -90 }; n.kafaYaw = 0; }
      else { n.poz = sirtustu(k); n.sola = true; n.kafaYaw = 0; n.poz = { ...n.poz, kafaEgim: 90 }; }
      if (t >= 1) n.ezil = 1;
      n.atkiDurum = 'asik';
      n.bak = 'izleyici';
    }
  } else {
    // 8) geniş plan; elektrik kesilir; karanlıkta beyaz gözler iki kez yavaşça kırpılır; atkı yavaşça sarkar
    n.x = ODA.yatX; n.don = 90; n.sola = true;
    n.poz = { ...sirtustu(k), kafaEgim: 90 };
    n.kafaYaw = 0;
    n.atkiDurum = 'asik';
    if (k >= Z.karanlik) {
      n.atkiDurum2 = 'uzgun';
      n.atkiKarisim = yumusak(aralik(k, Z.karanlik + 10, Z.karanlik + 80));
      const yavas = (bas: number) => { const d2 = k - bas; return d2 >= 0 && d2 < 22 ? Math.sin((Math.PI * d2) / 22) : 0; };
      n.kirp = Math.max(yavas(Z.kirp1), yavas(Z.kirp2));
    }
    nefesVar = k < Z.sessiz;
  }

  if (nefesVar && n.don === 0) n.poz = { ...n.poz, kok: { ...n.poz.kok, y: n.poz.kok.y + nefes(k) } };

  // sessiz konuşma: balon yazılırken ağız hafifçe açılıp kapanır, ara sıra küçük kafa sallaması
  for (const b of BALONLAR) {
    const bd = balonDurumu({ metin: b.metin, tip: b.tip, kare: k, baslangic: b.bas, sure: b.sure });
    if (bd.yaziyor && b.tip !== 'dusunce') {
      n.agiz = sessizAgiz(b.metin, bd.harf, k, b.tip === 'bagirma');
      n.bas = Math.max(n.bas, konusmaSallama(k - b.bas) * 0.8);
    }
  }
  return n;
}

// ---------------------------------------------------------------- kamera
interface Kamera { x: number; y: number; zoom: number }

function telefonKonumu(k: number): V {
  const n = nodDurumu(k);
  const el = elKonumu(n.poz, n.don ? 'sol' : 'sag');
  return dunya(n, el.avuc);
}

const ORTA: Kamera = { x: 40, y: -330, zoom: 1.3 };

export function kamera(k: number): Kamera & { sars: V } {
  const k1 = (a: Kamera, b: Kamera, t: number): Kamera => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)) });
  let c: Kamera;
  const tel = (kk: number): Kamera => { const p = telefonKonumu(kk); return { x: p.x, y: p.y, zoom: 5.4 }; };
  if (k < Z.telefonaZoom) c = ORTA;
  else if (k < Z.telefonaZoom + 26) c = k1(ORTA, tel(Z.telefonaZoom + 26), yumusak(aralik(k, Z.telefonaZoom, Z.telefonaZoom + 26)));
  else if (k < Z.zoomGeri) c = tel(Z.telefonaZoom + 26);
  else if (k < Z.s3) c = k1(tel(Z.telefonaZoom + 26), ORTA, yumusak(aralik(k, Z.zoomGeri, Z.zoomGeri + 14)));
  else if (k < Z.kos) c = k1(ORTA, { x: 60, y: -420, zoom: 1.0 }, yumusak(aralik(k, Z.s3, Z.s3 + 14)));
  else if (k < Z.s4) {
    // koşuyu takip: kamera Nod'u gecikmeli izler
    const nx = nodDurumu(Math.max(Z.kos, k - 4)).x;
    c = k1({ x: 60, y: -420, zoom: 1.0 }, { x: nx + 60, y: -360, zoom: 1.2 }, yumusak(aralik(k, Z.kos, Z.kos + 12)));
  } else if (k < Z.dene) c = { x: ODA.dolapOnu + 60, y: -340, zoom: 1.3 };
  else if (k < Z.firlat) {
    // uç ve telefon: yakın çekim (ellerin buluştuğu nokta)
    const n = nodDurumu(Z.bonk);
    const p = dunya(n, elKonumu(n.poz, 'sol').avuc);
    c = k1({ x: ODA.dolapOnu + 60, y: -340, zoom: 1.3 }, { x: p.x, y: p.y + 40, zoom: 3.6 }, yumusak(aralik(k, Z.dene, Z.dene + 14)));
  } else if (k < Z.s5) c = k1({ x: ODA.dolapOnu, y: -280, zoom: 4.2 }, { x: ODA.dolapOnu + 80, y: -360, zoom: 1.15 }, yumusak(aralik(k, Z.firlat, Z.firlat + 10)));
  else if (k < Z.yat) {
    const nx = nodDurumu(Math.max(Z.s5, k - 4)).x;
    c = { x: nx + 120, y: -330, zoom: 1.15 };
  } else if (k < Z.s6) c = k1({ x: 1200, y: -330, zoom: 1.15 }, { x: 1330, y: -130, zoom: 1.6 }, yumusak(aralik(k, Z.yat - 18, Z.yat + 10)));
  else if (k < Z.kabloTakip) c = k1({ x: 1330, y: -130, zoom: 1.6 }, { x: 1405, y: -45, zoom: 3.2 }, yumusak(aralik(k, Z.s6, Z.s6 + 10)));
  else if (k < Z.donus) c = k1({ x: 1405, y: -45, zoom: 3.2 }, { x: 1532, y: -36, zoom: 4.4 }, yumusak(aralik(k, Z.kabloTakip, Z.fis)));
  else if (k < Z.s7) c = k1({ x: 1532, y: -36, zoom: 4.4 }, { x: 1390, y: -95, zoom: 2.6 }, yumusak(aralik(k, Z.donus, Z.donus + 10)));
  else if (k < Z.yuvarlan) c = k1({ x: 1390, y: -95, zoom: 2.6 }, { x: 1470, y: -70, zoom: 2.1 }, yumusak(aralik(k, Z.s7, Z.s7 + 8)));
  else if (k < Z.s8) c = k1({ x: 1470, y: -70, zoom: 2.1 }, { x: 1300, y: -160, zoom: 1.5 }, yumusak(aralik(k, Z.yuvarlan, Z.rahat)));
  else if (k < Z.karanlik + 10) c = k1({ x: 1300, y: -160, zoom: 1.5 }, { x: 680, y: -470, zoom: 0.92 }, yumusak(aralik(k, Z.genis, Z.sessiz)));
  // karanlıkta yavaşça gözlere doğru yaklaş (gözler ve fısıltı okunur)
  else c = k1({ x: 680, y: -470, zoom: 0.92 }, { x: 1330, y: -230, zoom: 1.7 }, yumusak(aralik(k, Z.karanlik + 10, Z.fisilti)));
  // şokta kamera sarsıntısı (deterministik), bonk'ta küçük sarsıntı
  const sars = (bas: number, sure: number, g: number) => {
    const t = k - bas;
    if (t < 0 || t >= sure) return { x: 0, y: 0 };
    const s = g * (1 - t / sure);
    return { x: (random(`sx${k}`) - 0.5) * 2 * s, y: (random(`sy${k}`) - 0.5) * 2 * s };
  };
  const a = sars(Z.sok, 16, 18), b = sars(Z.bonk, 6, 8);
  return { ...c, sars: { x: a.x + b.x, y: a.y + b.y } };
}

// ---------------------------------------------------------------- eşyaların durumu
function minder(k: number, i: 0 | 1): { gorunur: boolean; konum: V; aci: number; yerinde: boolean } {
  const bas = i === 0 ? Z.firlat1 + 6 : Z.firlat2 + 6;
  const yer = { x: ODA.kanepeX + (i === 0 ? -1 : 1) * (KANEPE.minderGen / 2 + 2), y: KANEPE.minderUst };
  if (k < bas) return { gorunur: false, konum: yer, aci: 0, yerinde: true };
  const t = (k - bas) / 30;
  const hedef = i === 0 ? { x: -760, y: -300 } : { x: 260, y: -1250 };
  const konum = { x: lerp(yer.x, hedef.x, t), y: lerp(yer.y, hedef.y, t) - 420 * Math.sin(Math.PI * Math.min(1, t)) * (i === 0 ? 1 : 0.2) };
  return { gorunur: t < 1.4, konum, aci: (i === 0 ? -1 : 1) * t * 520, yerinde: false };
}

function telefonEkrani(k: number): { ekran: TelefonEkrani; uyari: number } {
  if (k < Z.uyari) return { ekran: 'video', uyari: 0 };
  if (k < Z.ding) return { ekran: 'pil', uyari: sinirla((k - Z.uyari) / 8) };
  if (k < Z.karanlik) return { ekran: 'sarj', uyari: 0 };
  return { ekran: 'karanlik', uyari: 0 };
}

// ---------------------------------------------------------------- çizim
const YAZI_UI = "'DejaVu Sans', sans-serif";

export const Sahne: React.FC<{ kare: number }> = ({ kare: k }) => {
  const n = nodDurumu(k);
  const cam = kamera(k);
  const olc = cam.zoom * S;
  const ekranX = (p: V) => GENISLIK / 2 + (p.x - cam.x) * olc + cam.sars.x;
  const ekranY = (p: V) => YUKSEKLIK / 2 + (p.y - cam.y) * olc + cam.sars.y;
  const dunyaG = `translate(${GENISLIK / 2 + cam.sars.x} ${YUKSEKLIK / 2 + cam.sars.y}) scale(${olc}) translate(${-cam.x} ${-cam.y})`;
  const karanlik = k >= Z.karanlik;
  const lambaAcik = !karanlik;
  const kalcaD = { x: n.x + (n.sola ? -1 : 1) * n.poz.kok.x, y: n.poz.kok.y - n.havada };

  // telefon nerede: S1-2 sağ elde (oturan), S4 sol elde, S5-7 sol elde (yatarken), S7 sonrası göğsünde
  const ekr = telefonEkrani(k);
  let telefon: { p: V; aci: number; olcek: number } | null = null;
  if (k < Z.firlat1) telefon = { p: dunya(n, elKonumu(n.poz, 'sag').avuc), aci: -8, olcek: 1 };
  else if (k >= Z.dene - 4 && k < Z.firlat + 6) telefon = { p: dunya(n, elKonumu(n.poz, 'sol').avuc), aci: 0, olcek: 1 };
  else if (k >= Z.dal && k < Z.yuvarlan + 6) telefon = { p: dunya(n, elKonumu(n.poz, 'sol').avuc), aci: 0, olcek: 0.85 };
  else if (k >= Z.yuvarlan + 6) telefon = { p: { x: kalcaD.x + 70, y: kalcaD.y - 34 }, aci: -12, olcek: 0.85 };

  // kablo: S4 yanlış uç (yumaktan), S5+ doğru kablo (adaptör → telefon)
  const yumakYeri = (): { p: V; aci: number } | null => {
    if (k < Z.yumak) return null;
    if (k < Z.dene) {
      const n2 = nodDurumu(k);
      const a = dunya(n2, elKonumu(n2.poz, 'sag').avuc), b = dunya(n2, elKonumu(n2.poz, 'sol').avuc);
      const tut = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 10 };
      const cik = { x: ODA.dolapX - 40, y: -DOLAP.yukseklik + 30 };
      return { p: lerpV(cik, tut, yumusak(aralik(k, Z.yumak, Z.yumak + 10))), aci: 0 };
    }
    // denerken ayak dibinde; fırlatınca sağa-yukarı uçar
    const yer = { x: ODA.dolapOnu - 110, y: -78 };
    if (k < Z.firlat) return { p: lerpV({ x: ODA.dolapOnu, y: -235 }, yer, cikis(aralik(k, Z.dene, Z.dene + 6))), aci: 0 };
    const t = (k - Z.firlat) / 22;
    if (t > 1.3) return null;
    return { p: { x: yer.x + t * 900, y: yer.y - 520 * Math.sin(Math.PI * Math.min(1, t * 0.9)) }, aci: t * 400 };
  };
  const yumak = yumakYeri();

  const sagAvuc = dunya(n, elKonumu(n.poz, 'sag').avuc);
  const adaptor = k < Z.fisTak ? ADAPTOR_ACIK : lerpV(ADAPTOR_ACIK, ADAPTOR_TAKILI, yumusak(aralik(k, Z.fisTak, Z.fisTak + 8)));
  const dogruKablo = k >= Z.al + 8;
  const adaptorYeri = k < Z.dal ? { x: sagAvuc.x + 30, y: sagAvuc.y } : adaptor;

  // ses efekti anlarını görsel olarak da destekle: bonk yıldızı, ding parıltısı
  const bonkYildiz = k >= Z.bonk && k < Z.bonk + 8;
  const dingParilti = k >= Z.ding && k < Z.ding + 14;

  const nodProps = {
    poz: n.poz, sola: n.sola, bak: n.bak, golge: false, duygu: n.duygu, oncekiDuygu: n.onceki, gecis: n.gecis,
    kare: k, kirp: n.kirp, bas: n.bas, agiz: n.agiz, kafaDonus: n.kafaDonus, kafaYaw: n.kafaYaw,
    atkiDurum: n.atkiDurum, atkiDurum2: n.atkiDurum2, atkiKarisim: n.atkiKarisim,
    sagNesne: <g />, solNesne: <g />, // tutulan eşyalar (telefon, uç, adaptör) sahnede ayrı çizilir
  } as const;
  const nodSar = (icerik: React.ReactNode) => (
    <g transform={`translate(0 ${kalcaD.y}) scale(1 ${n.ezil}) translate(0 ${-kalcaD.y})`}>
      <g transform={`rotate(${n.don} ${kalcaD.x} ${kalcaD.y})`}>{icerik}</g>
    </g>
  );

  // gölge: ayakta/otururken ayak dibinde; yatarken gövde boyunca
  const golge = n.don > 30
    ? { x: kalcaD.x + 90, rx: 230, ry: 9 }
    : { x: n.x + (n.sola ? -1 : 1) * (n.poz.kok.x + (n.poz.kok.y > -180 ? OTURMA_ILERI : 0)), rx: 70, ry: 8 };

  const balonlar = BALONLAR.map((b, i) => {
    const kafa = dunya(n, kafaKonumu(n.poz).merkez);
    const agiz = dunya(n, kafaKonumu(n.poz).agiz);
    const bx = ekranX(kafa) + b.ofset.x, by = ekranY(kafa) + b.ofset.y;
    // düşünce/fısıltı balonu yukarıda: kuyruk kafanın tepesine yönelir (yüzün üstünden geçmez)
    const tepe = { x: ekranX(kafa), y: ekranY(kafa) - OLCU.kafaR * olc * 1.05 };
    const hedef = b.tip === 'dusunce' || b.tip === 'fisilti' ? tepe : { x: ekranX(agiz), y: ekranY(agiz) };
    return (
      <Balon key={i} tip={b.tip} metin={b.metin} x={bx} y={by} hedef={hedef}
        kare={k} baslangic={b.bas} sure={b.sure} karanlik={b.karanlik} olcek={b.olcek} />
    );
  });

  return (
    <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      <g transform={dunyaG}>
        {/* oda: tüm bölümlerde aynı set */}
        <Oda lambaAcik={lambaAcik} minderler={[minder(k, 0).yerinde, minder(k, 1).yerinde]}
          cekmece={k < Z.cekmece + 2 ? 0 : yumusak(aralik(k, Z.cekmece + 2, Z.cekmece + 9))} />
        {/* fırlayan minderler */}
        {[0, 1].map((i) => { const m = minder(k, i as 0 | 1); return m.gorunur && !m.yerinde ? <g key={i} transform={`translate(${m.konum.x} ${m.konum.y}) rotate(${m.aci})`}><g transform={`translate(0 ${-KANEPE.minderKalinlik / 2})`}><Minder /></g></g> : null; })}
        {/* doğru kablo: adaptör ve kablo (Nod'un arkasında kalan kısım) */}
        {dogruKablo && k >= Z.dal && telefon && (
          <Kablo noktalar={[{ x: adaptor.x - 44, y: adaptor.y + 2 }, { x: (adaptor.x + telefon.p.x) / 2 - 20, y: 6 }, { x: telefon.p.x, y: telefon.p.y + 37 * telefon.olcek }]} />
        )}
        {/* gölge */}
        <ellipse cx={golge.x} cy={2} rx={golge.rx} ry={golge.ry} fill={RENK.golge} />
        {/* Nod */}
        {nodSar(<Nod id="nodp" x={n.x} y={-n.havada} olcek={1} {...nodProps} />)}
        {/* adaptör elin önünde (eli onu tutuyor) */}
        {dogruKablo && k >= Z.dal && <g transform={`translate(${adaptor.x} ${adaptor.y})`}><Adaptor /></g>}
        {/* yumak ve yanlış uç (S4) */}
        {yumak && (
          <g>
            {k >= Z.dene && k < Z.firlat && (
              <Kablo noktalar={[yumak.p, { x: yumak.p.x - 40, y: yumak.p.y - 30 }, { x: sagAvuc.x, y: sagAvuc.y + 40 }, { x: sagAvuc.x, y: sagAvuc.y + 6 }]} kalinlik={6} />
            )}
            <g transform={`translate(${yumak.p.x} ${yumak.p.y}) rotate(${yumak.aci})`}><KabloYumagi r={80} /></g>
          </g>
        )}
        {yumak && k >= Z.dene && k < Z.firlat && (
          <g transform={`translate(${sagAvuc.x} ${sagAvuc.y - 12}) rotate(-90)`}><KabloUcu tur="usba" /></g>
        )}
        {/* doğru kablo elde (yürürken) */}
        {dogruKablo && k < Z.dal && (
          <g transform={`translate(${adaptorYeri.x} ${adaptorYeri.y}) scale(0.9)`}><Adaptor /></g>
        )}
        {/* telefon */}
        {telefon && (
          <g transform={`translate(${telefon.p.x} ${telefon.p.y}) rotate(${telefon.aci}) scale(${telefon.olcek})`}>
            <AkilliTelefon ekran={ekr.ekran === 'karanlik' ? 'sarj' : ekr.ekran} uyari={ekr.uyari} />
          </g>
        )}
        {bonkYildiz && telefon && (
          <g transform={`translate(${telefon.p.x + 14} ${telefon.p.y + 40}) scale(${0.7 + 0.1 * (k - Z.bonk)})`}>
            <path d="M0 -14L4 -4L14 -4L6 2L9 13L0 6L-9 13L-6 2L-14 -4L-4 -4Z" fill="#ffd21f" stroke={RENK.murekkep} strokeWidth="2.4" strokeLinejoin="round" />
          </g>
        )}
        {dingParilti && telefon && (
          <g transform={`translate(${telefon.p.x} ${telefon.p.y})`} opacity={1 - (k - Z.ding) / 14}>
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path key={a} d={`M0 ${-48 - (k - Z.ding) * 2}V${-60 - (k - Z.ding) * 2}`} transform={`rotate(${a})`} stroke={RENK.murekkep} strokeWidth="3.4" strokeLinecap="round" />
            ))}
          </g>
        )}
      </g>

      {/* karanlık: elektrik kesildi. Yalnız beyaz gözler, soluk atkı ve telefonda parlayan "1%" görünür */}
      {karanlik && (
        <g>
          <rect width={GENISLIK} height={YUKSEKLIK} fill="#000000" />
          <g transform={dunyaG}>
            {nodSar(<Nod id="nodk" x={n.x} y={-n.havada} olcek={1} {...nodProps} karanlik kaynama={false} />)}
            {telefon && (
              <g transform={`translate(${telefon.p.x} ${telefon.p.y}) rotate(${telefon.aci}) scale(${telefon.olcek})`}>
                <AkilliTelefon ekran="karanlik" parlama={0.75 + 0.25 * Math.sin(k * 0.18)} />
              </g>
            )}
          </g>
        </g>
      )}

      {/* balonlar ekran ölçeğinde (yakın çekimde de okunur), Nod'un yüzünü kapatmayacak yerde */}
      {balonlar}

      {/* altyazı yok; telefon yazıları sahnenin içinde */}
      <text x={-100} y={-100} fontFamily={YAZI_UI}> </text>
    </svg>
  );
};

/** Ses efektleri (assets/sfx/*.wav): kare → dosya. */
export const SESLER: { kare: number; dosya: string; ses?: number }[] = [
  { kare: Z.uyari, dosya: 'dusuk-pil' },
  { kare: Z.sok - 3, dosya: 'dun-dun' },
  { kare: Z.firlat1 + 6, dosya: 'whoosh' },
  { kare: Z.firlat2 + 6, dosya: 'whoosh' },
  { kare: Z.cekmece + 2, dosya: 'cekmece' },
  { kare: Z.bonk, dosya: 'bonk' },
  { kare: Z.firlat + 2, dosya: 'whoosh' },
  { kare: Z.dal, dosya: 'whoosh', ses: 0.7 },
  { kare: Z.ding, dosya: 'ding' },
  { kare: Z.yuvarlan, dosya: 'whoosh', ses: 0.6 },
  { kare: Z.karanlik, dosya: 'tik' },
  ...BALONLAR.filter((b) => b.tip !== 'fisilti').map((b) => ({ kare: b.bas, dosya: 'pop', ses: 0.8 })),
  ...BALONLAR.filter((b) => b.tip === 'fisilti').map((b) => ({ kare: b.bas, dosya: 'pop', ses: 0.3 })),
];
