import React from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Karakter, MUREKKEP} from './Karakter/Karakter';
import {Anahtar, YAY, ara, kalcaYuksekligi, sinirla, yayToplami, ziplamaEgrisi} from './Karakter/hareket';
import {DUYGULAR, GEO, Poz} from './Karakter/pozlar';
import {Kagit} from './Kagit';
import {YAZI} from './font';

// 10 sn test (300 kare, 30 fps):
//   0–70   mutlu yan adımlarla girer (ayaklar IK ile yere basar, kaymaz)
//  80–110  sevinç zıplaması: çömelme (anticipation) → uzama → kavisli uçuş → inişte basılma
// 118–145  tabureye oturur (önce hafif kalkar, sonra çöker), yüz düşünceliye geçer
// 145–200  düşünür (nefes, kafa sallanır, düşünce balonu)
// 200      fikir! ampul yanar, yüz heyecanlıya geçer
// 214–232  kalkar (öne eğilip basılma → yukarı uzama)
// 234–300  iki heyecanlı zıplama
// Kollar ve kafa gecikmeli bir yay takipçisiyle izler (follow-through); hiçbir hareket doğrusal değil.

const FPS = 30;
const Z = GEO.zemin - 2; // ayak tabanı (viewBox birimi)
const L = GEO.uyluk + GEO.baldir;
const KALCA_DX = GEO.kalcaSag.x - 120;
const KALCA_Y0 = GEO.kalcaSol.y;
const TABURE_UST = GEO.govdeAlt + 16; // oturunca gövde altı tabure üstüne iner

const S = {
  yurumeBit: 70,
  zipla: 80,
  otur: 118,
  dusunYuz: 122,
  fikir: 200,
  heyecanYuz: 203,
  kalk: 214,
  hop1: 234,
  hop2: 263,
};

// ── yürüyüş: mesafe tabanlı yan adım (önden görünüş) → ayaklar çaprazlanmaz ──
// Her döngüde önce öndeki (sağ) ayak açılır, sonra arkadaki (sol) ayak kapanır. Ayaklar gövdenin
// aldığı yola bağlıdır, zamana değil: yerdeki ayak gövde hızlansa/yavaşlasa da yerinde kalır.
const DONGU = 33.75;
const DONGU_SAYI = 8;
const YOL = DONGU * DONGU_SAYI; // 270
const BASLA_X = -290;
const SON_X = BASLA_X + YOL; // -20
const KAPALI = 2; // döngü başında ayakların gövdeye uzaklığı (kapalı duruş)
const INIS_ARA = 15; // inişten sonra açık duruş

const yolEase = Easing.bezier(0.3, 0.3, 0.42, 1); // sabit hızla girer, yavaşlayarak durur
const yurumeMesafe = (f: number) => YOL * yolEase(sinirla(f / S.yurumeBit));

type Nokta = {x: number; y: number};

const yurumeAyaklari = (d: number): [Nokta, Nokta] => {
  const c = Math.min(Math.floor(d / DONGU), DONGU_SAYI);
  const v = c >= DONGU_SAYI ? 0 : d / DONGU - c;
  const x0 = BASLA_X + 120;
  const sal = (bas: number, w: number, yan: number): Nokta => {
    const e = Easing.inOut(Easing.sin)(w);
    return {x: x0 + bas + DONGU * e + yan, y: Z - 12 * Math.sin(Math.PI * w)};
  };
  const sag = v < 0.5 ? sal(c * DONGU, v / 0.5, KAPALI) : {x: x0 + (c + 1) * DONGU + KAPALI, y: Z};
  const sol = v < 0.5 ? {x: x0 + c * DONGU - KAPALI, y: Z} : sal(c * DONGU, (v - 0.5) / 0.5, -KAPALI);
  return [sol, sag];
};

/** Gövde x (viewBox birimi, 0 = taburenin önü). */
const govdeX = (f: number) => {
  if (f <= S.yurumeBit) return BASLA_X + yurumeMesafe(f);
  // zıplamada kavisli yolla tabureye doğru ilerler
  const z = ziplamaEgrisi(f - S.zipla, FPS, ZIPLA1);
  const ilerle = f < S.zipla + ZIPLA1.hazirlik ? 0 : z.u >= 1 ? 1 : Easing.inOut(Easing.sin)(z.u);
  return SON_X + (0 - SON_X) * ilerle;
};

const ZIPLA1 = {hazirlik: 8, havada: 16, yukseklik: 72, cokme: 14};
const HOP = {hazirlik: 6, havada: 14, yukseklik: 52, cokme: 10};

/** Yerdeki (planlı) ayak noktaları; havadayken kalçaya göre toplanır. */
const yerAyaklari = (f: number): [Nokta, Nokta] => {
  if (f <= S.yurumeBit) return yurumeAyaklari(yurumeMesafe(f));
  const son = yurumeAyaklari(YOL);
  if (f < S.zipla + ZIPLA1.hazirlik) return son;
  // zıplamadan sonra tabure önünde açık duruş
  const z = ziplamaEgrisi(f - S.zipla, FPS, ZIPLA1);
  const e = z.u >= 1 ? 1 : Easing.inOut(Easing.sin)(z.u);
  const once = [son[0].x, son[1].x];
  const sonra = [120 - INIS_ARA, 120 + INIS_ARA];
  return [0, 1].map((j) => ({x: once[j] + (sonra[j] - once[j]) * e, y: Z})) as [Nokta, Nokta];
};

/** Ayaklar yerdeyken kalçanın çıkabileceği en yüksek nokta → ziplama tabanı (negatif = aşağı). */
const tabanZiplama = (ayak: [Nokta, Nokta], gx: number) => {
  const hy = Math.max(
    kalcaYuksekligi(ayak[0], 120 + gx - KALCA_DX, L),
    kalcaYuksekligi(ayak[1], 120 + gx + KALCA_DX, L),
  );
  return KALCA_Y0 - hy;
};

// oturma / kalkma: kalça ofseti (yay toplamı). Gövde altı tabure üstüne iner.
const OTURMA: Anahtar[] = [
  {f: 0, deger: 0},
  {f: S.otur, deger: 3, yay: YAY.govde}, // anticipation: hafif kalk
  {f: S.otur + 7, deger: GEO.govdeAlt - TABURE_UST, yay: YAY.oturma}, // tabureye çök
  {f: S.kalk, deger: GEO.govdeAlt - TABURE_UST - 3, yay: YAY.govde}, // anticipation: öne eğil, bas
  {f: S.kalk + 7, deger: 0, yay: {damping: 12, stiffness: 150}}, // it ve kalk
];

const EZILME: Anahtar[] = [
  {f: 0, deger: 0},
  {f: S.otur, deger: 0.05}, // kalkarken uza
  {f: S.otur + 7, deger: 0.04},
  {f: S.otur + 14, deger: -0.09, yay: {damping: 14, stiffness: 220}}, // tabureye değince basıl
  {f: S.otur + 19, deger: 0, yay: {damping: 10, stiffness: 120}},
  {f: S.fikir, deger: 0.09, yay: {damping: 10, stiffness: 260}}, // fikir! irkilme
  {f: S.fikir + 5, deger: 0, yay: {damping: 9, stiffness: 120}},
  {f: S.kalk, deger: -0.08}, // kalkmadan önce basıl
  {f: S.kalk + 7, deger: 0.1, yay: {damping: 12, stiffness: 220}}, // yukarı uza
  {f: S.kalk + 13, deger: 0, yay: {damping: 9, stiffness: 120}},
];

const ziplamalar = (f: number) => {
  const a = ziplamaEgrisi(f - S.zipla, FPS, ZIPLA1);
  const b = ziplamaEgrisi(f - S.hop1, FPS, HOP);
  const c = ziplamaEgrisi(f - S.hop2, FPS, HOP);
  return {y: a.y + b.y + c.y, ezilme: a.ezilme + b.ezilme + c.ezilme, hava: a.havadaMi + b.havadaMi + c.havadaMi, u: [a, b, c]};
};

type Durum = {gx: number; zipla: number; ezilme: number; ayak: [Nokta, Nokta]; hava: number};

const durumOnbellek = new Map<number, Durum>();
export const durum = (f: number): Durum => {
  const c = durumOnbellek.get(f);
  if (c) return c;
  const gx = govdeX(f);
  const yer = yerAyaklari(f);
  const taban = tabanZiplama(yer, gx);
  const z = ziplamalar(f);
  const oturma = Math.min(0, yayToplami(OTURMA, f, FPS));
  const kalkis = Math.max(0, yayToplami(OTURMA, f, FPS)); // oturmadan önceki hafif kalkış: ayaklar yerde, gövde uzar
  const zipla = taban + oturma + z.y;
  const kalcaY = KALCA_Y0 - zipla;
  // havadayken ayaklar kalçanın altında toplanır (tuck), yere değmeden önce açılır
  const tuck = 14 * z.hava;
  const ayak = yer.map((a, j) => {
    const kx = 120 + gx + (j === 0 ? -KALCA_DX : KALCA_DX);
    const dx = Math.abs(a.x - kx);
    const erisim = Math.sqrt(Math.max(0, (L * 0.985) ** 2 - dx * dx));
    return {x: a.x + (j === 0 ? -4 : 4) * z.hava, y: Math.min(a.y, kalcaY + erisim - tuck * (j === 0 ? 1.15 : 0.85))};
  }) as [Nokta, Nokta];
  const ezilme = z.ezilme + yayToplami(EZILME, f, FPS) + kalkis * 0.012;
  const d = {gx, zipla, ezilme, ayak, hava: z.hava};
  durumOnbellek.set(f, d);
  return d;
};

// ── kollar + kafa: yay anahtarları → gecikmeli takipçi ──
const P = DUYGULAR;
type Kanal = [number, number, number, number, number, number, number]; // solO solD sagO sagD kafa bakisX bakisY
const pozKanal = (p: Poz, kafa = p.kafaEgim): Kanal => [p.kolSol[0], p.kolSol[1], p.kolSag[0], p.kolSag[1], kafa, p.bakisX, p.bakisY];

const KOL_ANAHTAR: {f: number; k: Kanal; yay?: Anahtar['yay']}[] = [
  {f: 0, k: [22, -30, 22, -30, 0, 0, 0]},
  {f: S.zipla, k: [32, 18, 32, 18, -2, 0, 0.2]}, // çömelirken kollar aşağı-geri
  {f: S.zipla + ZIPLA1.hazirlik - 1, k: [150, -18, 150, -18, -4, 0, -0.3]}, // kalkışta yukarı fırlar
  {f: S.zipla + ZIPLA1.hazirlik + ZIPLA1.havada - 3, k: pozKanal(P.mutlu.poz)}, // inerken mutlu kollar
  {f: S.otur, k: [40, -20, 40, -20, 0, 0, 0.2]}, // oturmaya hazırlık
  {f: S.otur + 9, k: pozKanal(P.dusunceli.poz)},
  {f: S.fikir, k: [150, -30, 30, -150, 0, 0, -0.8]}, // fikir: sol kol havaya
  {f: S.heyecanYuz + 4, k: pozKanal(P.heyecanli.poz)},
  {f: S.kalk, k: [48, 12, 48, 12, -3, 0, 0.3]}, // kalkmadan önce kollar geri
  {f: S.kalk + 7, k: pozKanal(P.heyecanli.poz)},
];

const kanalOnbellek = new Map<number, Kanal>();
const kolHedef = (f: number): Kanal => {
  const c = kanalOnbellek.get(f);
  if (c) return c;
  const out = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    yayToplami(
      KOL_ANAHTAR.map((a) => ({f: a.f, deger: a.k[i], yay: a.yay ?? YAY.kol})),
      f,
      FPS,
    ),
  ) as Kanal;
  // yürürken kol salınımı (adım fazına bağlı → kavisli yay hareketi)
  const yw = 1 - ara(f, S.yurumeBit - 10, S.yurumeBit + 4);
  if (yw > 0) {
    const faz = (2 * Math.PI * yurumeMesafe(Math.min(f, S.yurumeBit))) / DONGU;
    const s = Math.sin(faz);
    out[0] += yw * 24 * s;
    out[1] += yw * -14 * s;
    out[2] += yw * -24 * s;
    out[3] += yw * 14 * s;
    out[4] += yw * 3 * Math.sin(faz + 0.6);
  }
  // heyecanlı zıplamalarda kollar havaya
  const z = ziplamalar(f);
  const h = z.u[1].havadaMi + z.u[2].havadaMi;
  out[0] += 85 * h;
  out[1] += 60 * h;
  out[2] += 85 * h;
  out[3] += 60 * h;
  // düşünürken kafa yavaşça sallanır
  const dw = ara(f, S.otur + 10, S.otur + 30) * (1 - ara(f, S.fikir - 4, S.fikir + 4));
  out[4] += dw * 4 * Math.sin(((f - S.otur) / FPS) * Math.PI * 0.9);
  // gövdenin dikey hızı kollara sürüklenme olarak geçer (düşerken kollar havada kalır)
  const vy = durum(f).zipla - durum(Math.max(0, f - 1)).zipla;
  out[0] -= vy * 1.6;
  out[2] -= vy * 1.6;
  kanalOnbellek.set(f, out);
  return out;
};

// takipçi durumu kare kare biriktirilir (her kare O(1))
const takipX: Kanal[] = [];
const takipV: Kanal[] = [];
const kolTakip = (f: number): Kanal => {
  if (takipX.length === 0) {
    takipX.push(kolHedef(0));
    takipV.push([0, 0, 0, 0, 0, 0, 0]);
  }
  for (let i = takipX.length; i <= f; i++) {
    const h = kolHedef(i);
    const x = takipX[i - 1].slice() as Kanal;
    const v = takipV[i - 1].slice() as Kanal;
    for (let j = 0; j < 7; j++) {
      const sert = j === 4 ? 0.3 : j >= 5 ? 0.5 : 0.24; // kafa biraz, bakış hiç gecikmesin
      v[j] += sert * (h[j] - x[j]) - 0.48 * v[j];
      x[j] += v[j];
    }
    takipX.push(x);
    takipV.push(v);
  }
  return takipX[f];
};

// ── sahne öğeleri ──

const Etiket: React.FC<{yazi: string; opak: number; y: number}> = ({yazi, opak, y}) => (
  <div
    style={{
      position: 'absolute',
      top: 230 + y,
      width: '100%',
      textAlign: 'center',
      fontFamily: YAZI,
      fontSize: 120,
      color: MUREKKEP,
      opacity: opak,
      letterSpacing: 4,
    }}
  >
    {yazi}
  </div>
);

const Tabure: React.FC = () => (
  <g stroke={MUREKKEP} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round">
    <path d={`M84 ${TABURE_UST + 6} L80 298 M156 ${TABURE_UST + 6} L160 298`} fill="none" />
    <path d={`M72 ${TABURE_UST} Q120 ${TABURE_UST - 5} 168 ${TABURE_UST} L168 ${TABURE_UST + 8} Q120 ${TABURE_UST + 11} 72 ${TABURE_UST + 8} Z`} fill="#e8c79c" />
  </g>
);

const Ampul: React.FC<{olcek: number; parilti: number}> = ({olcek, parilti}) => (
  <svg viewBox="-60 -70 120 140" width={240} height={280} style={{overflow: 'visible'}}>
    <g transform={`scale(${olcek})`} stroke={MUREKKEP} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <g opacity={parilti} fill="none" strokeWidth={4} transform={`scale(${0.8 + 0.2 * parilti})`}>
        <path d="M0 -62 L0 -50 M-44 -40 L-35 -32 M44 -40 L35 -32 M-54 -2 L-42 -2 M54 -2 L42 -2" />
      </g>
      <path d="M-14 26 Q-14 12 -22 4 Q-34 -10 -28 -26 Q-20 -44 0 -44 Q20 -44 28 -26 Q34 -10 22 4 Q14 12 14 26 Z" fill="#ffe36b" />
      <path d="M-8 22 L-4 2 L0 10 L4 2 L8 22" fill="none" strokeWidth={2.6} />
      <rect x={-14} y={26} width={28} height={16} rx={4} fill="#c9c6c0" />
      <path d="M-14 33 L14 33" strokeWidth={2.6} />
    </g>
  </svg>
);

const DusunceBalonu: React.FC<{f: number; fps: number}> = ({f, fps}) => (
  <svg viewBox="0 0 200 200" width={300} height={300} style={{overflow: 'visible'}}>
    <g stroke={MUREKKEP} strokeWidth={4} fill="#fff">
      {[
        {x: 20, y: 170, r: 9, d: 0},
        {x: 48, y: 135, r: 14, d: 8},
        {x: 92, y: 88, r: 22, d: 16},
      ].map((b, i) => {
        const s = spring({frame: f - b.d, fps, config: {damping: 9, stiffness: 140}});
        const sal = Math.sin((f + i * 9) / 9) * 2.5;
        return <circle key={i} cx={b.x} cy={b.y + sal} r={b.r * s} />;
      })}
    </g>
  </svg>
);

export const DuyguTesti: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  // ── yüz: yay sürüşlü geçişler ──
  const yuzGecis = (bas: number) => spring({frame: f - bas, fps, config: YAY.yuz, durationInFrames: 22});
  type Uc = 'mutlu' | 'dusunceli' | 'heyecanli';
  let duygu: Uc = 'mutlu' as Uc;
  let onceki: Uc | undefined;
  let gecis = 1;
  if (f >= S.heyecanYuz) {
    duygu = 'heyecanli';
    onceki = 'dusunceli';
    gecis = yuzGecis(S.heyecanYuz);
  } else if (f >= S.dusunYuz) {
    duygu = 'dusunceli';
    onceki = 'mutlu';
    gecis = yuzGecis(S.dusunYuz);
  }

  const d = durum(f);
  const k = kolTakip(f);
  const poz: Partial<Poz> = {
    kolSol: [k[0], k[1]],
    kolSag: [k[2], k[3]],
    kafaEgim: k[4],
    bakisX: k[5],
    bakisY: k[6],
    govdeEgim: 0,
    ziplama: d.zipla,
  };

  // ── yerleşim: karakter svg'si sabit, gövde içeride govdeX ile hareket eder ──
  const K = 640;
  const u = K / 240;
  const ayakY = 1600;
  const svgSol = width / 2 - 120 * u;
  const svgUst = ayakY - Z * u;
  const kafaX = svgSol + (120 + d.gx) * u;
  const kafaY = svgUst + (GEO.kafa.y - d.zipla) * u;

  // etiketler (yay ile)
  const etiket = (bas: number, bit?: number) => {
    const gir = spring({frame: f - bas, fps, config: {damping: 14, stiffness: 120}});
    const cik = bit === undefined ? 0 : spring({frame: f - bit, fps, config: {damping: 200}, durationInFrames: 10});
    return {opak: gir * (1 - cik), y: (1 - gir) * 30 - cik * 20};
  };
  const e1 = etiket(0, S.dusunYuz - 2);
  const e2 = etiket(S.dusunYuz + 4, S.heyecanYuz - 2);
  const e3 = etiket(S.heyecanYuz + 4);

  const balonBas = S.otur + 32;
  const balonCik = 1 - spring({frame: f - (S.fikir - 2), fps, config: {damping: 200}, durationInFrames: 8});
  const ampul = spring({frame: f - S.fikir, fps, config: {damping: 8, stiffness: 170}});
  const ampulCik = 1 - spring({frame: f - (S.kalk + 4), fps, config: {damping: 200}, durationInFrames: 12});
  const parilti = spring({frame: f - S.fikir - 4, fps, config: {damping: 10}});

  return (
    <AbsoluteFill>
      <Kagit />
      <Etiket yazi="MUTLU" {...e1} />
      <Etiket yazi="DÜŞÜNCELİ" {...e2} />
      <Etiket yazi="HEYECANLI" {...e3} />

      <svg
        viewBox="0 0 240 320"
        width={K}
        height={320 * u}
        style={{position: 'absolute', left: svgSol, top: svgUst, overflow: 'visible'}}
      >
        <Tabure />
      </svg>

      {f >= balonBas && balonCik > 0.001 && (
        <div style={{position: 'absolute', left: kafaX + 70, top: kafaY - 390, opacity: balonCik}}>
          <DusunceBalonu f={f - balonBas} fps={fps} />
        </div>
      )}
      {f >= S.fikir && ampulCik > 0.001 && (
        <div style={{position: 'absolute', left: kafaX - 120, top: kafaY - 470 - (1 - ampulCik) * 40, opacity: ampulCik}}>
          <Ampul olcek={ampul} parilti={parilti} />
        </div>
      )}

      <div style={{position: 'absolute', left: svgSol, top: svgUst}}>
        <Karakter
          duygu={duygu}
          onceki={onceki}
          gecis={gecis}
          poz={poz}
          govdeX={d.gx}
          ezilme={d.ezilme}
          ayaklar={{sol: d.ayak[0], sag: d.ayak[1]}}
          tohum="duygu-testi"
          width={K}
          height={320 * u}
        />
      </div>
    </AbsoluteFill>
  );
};

