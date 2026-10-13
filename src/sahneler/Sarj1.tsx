// "1% Battery" — Bölüm 1 (Sarj1, ~9,5 sn, 1920x1080, 30 fps; nod-temel ile aynı ölçek). Nod konuşmaz: balon.
// 1) 0-2 sn   geniş plan: kanepede, telefonu iki eliyle tutup gülüyor (atkı kuyruk gibi sallanır)
// 2) 2-5 sn   omuz üstü (over-the-shoulder): önde bulanık kafa arkası + atkı + omuz, telefonda kanal videosu
// 3) 5-6 sn   aynı açı: "Low Battery - 1%" bildirimi iner (bip), pil simgesi kırmızı yanıp söner
// 4) 6-9 sn   kamera öne döner: donar → şok (korkmuş, mavi yüz, atkı dimdik, sarsıntı, "dun-dun!") + bağırma balonu
// Sahne saf bir fonksiyondur (kare → çizim); önizleme kareleri ve render aynı kareleri çizer.
import React from 'react';
import { random } from 'remotion';
import { Nod, type Poz, type Duygu } from '../karakter/Nod';
import { RENK, OLCU, GORUNUS, CIZGI, ekranOlcegi, type Agiz, type Bakis } from '../karakter/olculer';
import { AYAKTA } from '../karakter/poz';
import type { AtkiDurumAdi } from '../karakter/atkiTepki';
import { otur, kolHedef, elKonumu, kafaKonumu, gozKirp, aralik, yumusak, sinirla } from '../karakter/hareketler';
import { bilekNerede, type V } from '../karakter/ik';
import { Balon } from '../karakter/Balon';
import { ModernTelefon, TELEFON } from '../esyalar/ModernTelefon';
import { ODA, Oda } from './pil/Oda';

export const GENISLIK = 1920;
export const YUKSEKLIK = 1080;
export const FPS = 30;
export const SURE = 285; // 9,5 sn

const S = ekranOlcegi(YUKSEKLIK, 0.5); // nod-temel ile aynı ölçek (zoom 1)

// ---------------------------------------------------------------- zaman çizelgesi (kare)
export const Z = {
  genis: 0, itme: 36, gecis1: 60, // geniş → omuz üstü (savrulma geçişi, 6 kare)
  omuz: 66, uyari: 150, gulmeBiter: 160,
  gecis2: 180, on: 186, // omuz üstü → önden yüz
  don: 186, sok: 198, balon: 203,
} as const;
const GECIS = 6;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- telefonu iki elle tutan oturuş
const OMUZ = OLCU.omuzY - OLCU.kalcaY;
const A_UC = GORUNUS.ucdort;
/** Telefon dünyada (telefon birimi → Nod birimi): boy 120, en ~55 (9:19,5). */
export const TEL_OLCEK = 120 / TELEFON.yuk;
const TEL_YARI = (TELEFON.gen / 2) * TEL_OLCEK;
const AVUC_R = 11.5 * OLCU.elOlcek; // yumruk avucu
/** Kalçaya göre telefon merkezi: göğüs önünde, çenenin altında. */
const TEL_MERKEZ: V = { x: 30, y: OMUZ + 34 };

/** Avuçlar telefonun iki kenarını alt yarıdan kavrar; kollar aşağıdan gelir. */
function tutanPoz(titre = 0, yukari = 0): Poz {
  const p = otur(1, 'ucdort');
  const c = { x: TEL_MERKEZ.x, y: TEL_MERKEZ.y - yukari + titre };
  const avucSag = { x: c.x + TEL_YARI + 8, y: c.y + 26 };
  const avucSol = { x: c.x - TEL_YARI - 8, y: c.y + 26 };
  return {
    ...p, egim: 2, kafaEgim: 8,
    // uzak kol (sol omuz, önde) telefonun sağ kenarını, yakın kol (sağ omuz) sol kenarını tutar
    solKol: kolHedef(A_UC.omuzX.sol, bilekNerede(avucSag, 165, 14), 165, 'yumruk'),
    sagKol: kolHedef(A_UC.omuzX.sag, bilekNerede(avucSol, -165, 14), -165, 'yumruk', true),
  };
}

interface NodDurumu {
  poz: Poz; duygu: Duygu; onceki?: Duygu; gecis: number; bak: Bakis; bas: number; agiz: Agiz; kirp: number;
  atkiDurum?: AtkiDurumAdi; zipla: number; titre: number;
}

/** Gülme: kısa hızlı sarsıntılar (ağız açılıp kapanır, omuzlar titrer). */
function gulme(k: number) {
  const g = k < Z.gulmeBiter ? 1 : Math.max(0, 1 - (k - Z.gulmeBiter) / 8);
  const v = Math.abs(Math.sin(k * 0.95)) * g;
  return { g, v };
}

export function nodDurumu(k: number): NodDurumu {
  const gl = gulme(k);
  const n: NodDurumu = {
    poz: tutanPoz(), duygu: 'mutlu', gecis: 1, bak: 'asagi', bas: 0, agiz: 'kapali', kirp: gozKirp(k, 'sarj1'),
    zipla: 0, titre: 0,
  };
  if (k < Z.don) {
    n.bas = 0.18 * gl.v;
    n.zipla = 4 * gl.v;
    n.agiz = gl.g > 0.3 ? (Math.floor(k / 3) % 2 === 0 ? 'A' : 'E') : 'kapali';
    n.poz = tutanPoz(0, 4 * gl.v);
    if (k >= Z.gulmeBiter) { n.duygu = 'notr'; n.onceki = 'mutlu'; n.gecis = sinirla((k - Z.gulmeBiter) / 8); }
  } else if (k < Z.sok) {
    // donar: nefes yok, gülüş silinir, gözler telefona kilitli
    n.duygu = 'notr'; n.bak = 'asagi'; n.kirp = 0;
  } else {
    // şok: irkilir (kısa sıçrama), korkmuş, atkı dimdik, gözler izleyiciye
    const t = k - Z.sok;
    n.duygu = 'korkmus'; n.onceki = 'notr'; n.gecis = sinirla(t / 5);
    n.zipla = Math.sin(Math.PI * sinirla(t / 8)) * 16;
    n.atkiDurum = 'fikir';
    n.bak = 'izleyici';
    n.titre = t > 8 ? Math.sin(k * 2.3) * 1.4 : 0;
    n.poz = tutanPoz(n.titre, 0);
    // balon yazılırken ağız sessizce açılıp kapanır
    if (k >= Z.balon) n.agiz = Math.floor(k / 4) % 2 === 0 ? 'O' : 'A';
  }
  return n;
}

// ---------------------------------------------------------------- dünya çekimleri (geniş plan, önden yüz)
interface Kamera { x: number; y: number; zoom: number }
const NOD_X = ODA.oturX;

function kamera(k: number): Kamera {
  const genis: Kamera = { x: 120, y: -400, zoom: 1.0 };
  const yakin: Kamera = { x: NOD_X + 20, y: -330, zoom: 1.55 };
  if (k < Z.on) {
    const t = yumusak(aralik(k, Z.itme, Z.gecis1 + GECIS));
    return { x: lerp(genis.x, yakin.x, t), y: lerp(genis.y, yakin.y, t), zoom: Math.exp(lerp(Math.log(genis.zoom), Math.log(yakin.zoom), t)) };
  }
  // önden yüz: yarım yakın plan (kafa + telefonu tutan eller)
  return { x: NOD_X + 90, y: -330, zoom: 1.95 };
}

function sarsinti(k: number): V {
  const t = k - Z.sok;
  if (t < 0 || t >= 18) return { x: 0, y: 0 };
  const g = 22 * (1 - t / 18);
  return { x: (random(`s1x${k}`) - 0.5) * 2 * g, y: (random(`s1y${k}`) - 0.5) * 2 * g };
}

/** Elde tutulan telefon (dünya): sırtı görünür; parmaklar sırtın kenarlarını sarar. */
const TutulanTelefon: React.FC<{ avucSag: V; avucSol: V; kare: number }> = ({ avucSag, avucSol }) => {
  const c = { x: (avucSag.x + avucSol.x) / 2, y: (avucSag.y + avucSol.y) / 2 - 26 };
  const acı = (Math.atan2(avucSag.y - avucSol.y, avucSag.x - avucSol.x) * 180) / Math.PI;
  const w = 6.5 * OLCU.elOlcek; // parmak kalınlığı
  const o = CIZGI.eldiven * OLCU.elOlcek;
  // kenardan içeri kıvrılan üç parmak (her iki yanda)
  const parmak = (taraf: 1 | -1, dy: number, uz: number) => {
    const x1 = taraf * (TEL_YARI + 4), x2 = taraf * (TEL_YARI - uz);
    return (
      <g key={`${taraf}${dy}`}>
        <line x1={x1} y1={dy} x2={x2} y2={dy - 2} stroke={RENK.murekkep} strokeWidth={w + 2 * o} strokeLinecap="round" />
        <line x1={x1} y1={dy} x2={x2} y2={dy - 2} stroke={RENK.beyaz} strokeWidth={w} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${acı})`}>
      <g transform={`scale(${TEL_OLCEK * 0.9} ${TEL_OLCEK})`}><ModernTelefon yuz="sirt" id="s1sirt" /></g>
      {([1, -1] as const).map((t) => [parmak(t, 10, 9), parmak(t, 22, 11), parmak(t, 34, 9)])}
    </g>
  );
};

/** Oda + Nod (dünya). */
const DunyaCekimi: React.FC<{ k: number; kam: Kamera; sars: V }> = ({ k, kam, sars }) => {
  const n = nodDurumu(k);
  const olc = kam.zoom * S;
  const g = `translate(${GENISLIK / 2 + sars.x} ${YUKSEKLIK / 2 + sars.y}) scale(${olc}) translate(${-kam.x} ${-kam.y})`;
  const yer = (p: V): V => ({ x: NOD_X + p.x, y: p.y - n.zipla });
  const avucSag = yer(elKonumu(n.poz, 'sol').avuc); // uzak kol telefonun sağ kenarında
  const avucSol = yer(elKonumu(n.poz, 'sag').avuc);
  const kafa = kafaKonumu(n.poz);
  const ekran = (p: V): V => ({ x: GENISLIK / 2 + (p.x - kam.x) * olc + sars.x, y: YUKSEKLIK / 2 + (p.y - kam.y) * olc + sars.y });
  const agizE = ekran(yer(kafa.agiz));
  const kafaE = ekran(yer(kafa.merkez));
  return (
    <g>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      <g transform={g}>
        <Oda />
        <ellipse cx={NOD_X + 40} cy={2} rx={70} ry={8} fill={RENK.golge} />
        <Nod id="s1" x={NOD_X} y={-n.zipla} olcek={1} poz={n.poz} duygu={n.duygu} oncekiDuygu={n.onceki} gecis={n.gecis}
          kare={k} bak={n.bak} bas={n.bas} agiz={n.agiz} kirp={n.kirp} atkiDurum={n.atkiDurum} golge={false}
          sagNesne={<g />} solNesne={<g />} />
        <TutulanTelefon avucSag={avucSag} avucSol={avucSol} kare={k} />
      </g>
      {k >= Z.balon && (
        <Balon tip="bagirma" metin="WAIT... 1%?! NO NO NO!" x={kafaE.x + 560} y={kafaE.y - 170} hedef={agizE}
          kare={k} baslangic={Z.balon} sure={SURE - Z.balon - 8} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------- omuz üstü çekim (ekran uzayında kurulur)
/** Telefonu tutan eldivenler, telefon biriminde (ekran tarafından görünüş): avuçlar arkada, başparmaklar ekranda. */
const OTS = { telX: 1180, telY: 520, olcek: 4.3, kafa: { x: 250, y: 650 }, nodOlcek: 4.0 } as const;
// yakın çekimde eldivenler telefona göre bir miktar küçültülür (perspektif: telefon kameraya daha yakın)
const EL_OTS = 0.62;
const BIRIM = (OLCU.elOlcek / TEL_OLCEK) * EL_OTS; // eldiven ölçüsü (telefon biriminde)

function eldivenler(katman: 'arka' | 'on') {
  const r = (AVUC_R / TEL_OLCEK) * EL_OTS;
  const o = CIZGI.eldiven * BIRIM;
  const w = 6.5 * BIRIM;
  const K = RENK.murekkep, B = RENK.beyaz;
  return ([1, -1] as const).map((t) => {
    const avuc = { x: t * (TELEFON.gen / 2 + 7), y: 66 };
    const bilek = { x: avuc.x + t * 9, y: avuc.y + 14 * BIRIM };
    if (katman === 'arka') {
      // kollar ön plandaki gövdeden (sol alt) gelir
      const dirsek = t < 0 ? { x: -190, y: 175 } : { x: -40, y: 185 };
      return (
        <g key={t}>
          {/* kol: aşağıdan (Nod'un gövdesinden) gelir */}
          <line x1={dirsek.x} y1={dirsek.y} x2={bilek.x} y2={bilek.y} stroke={K} strokeWidth={OLCU.kolKalinlik / TEL_OLCEK} strokeLinecap="round" />
          <circle cx={avuc.x} cy={avuc.y} r={r + o} fill={K} />
          <circle cx={avuc.x} cy={avuc.y} r={r} fill={B} />
          {/* bileklik */}
          <g transform={`translate(${bilek.x} ${bilek.y}) rotate(${t * -16}) scale(${BIRIM})`}>
            <rect x="-10" y="-5" width="20" height="10" rx="3" fill={RENK.bileklik} stroke={K} strokeWidth={CIZGI.bileklik} />
            <path d="M-7.5 -2.5H7.5" stroke="#8cc4f2" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </g>
      );
    }
    // ekran tarafından yalnız başparmaklar görünür: alt köşelerde ekranın kenarına biner
    const bp1 = { x: t * (TELEFON.gen / 2 + 4), y: 64 }, bp2 = { x: t * (TELEFON.gen / 2 - 5), y: 54 };
    return (
      <g key={t}>
        <line x1={bp1.x} y1={bp1.y} x2={bp2.x} y2={bp2.y} stroke={K} strokeWidth={w + 2 * o} strokeLinecap="round" />
        <line x1={bp1.x} y1={bp1.y} x2={bp2.x} y2={bp2.y} stroke={B} strokeWidth={w} strokeLinecap="round" />
      </g>
    );
  });
}

const OmuzUstu: React.FC<{ k: number }> = ({ k }) => {
  const gl = gulme(k);
  // gülerken eller/telefon ve omuzlar farklı fazda titrer
  const telDy = 7 * gl.v + 1.5 * Math.sin(k * 0.21);
  const telDx = 2 * Math.sin(k * 1.7) * gl.g;
  const nodDy = 10 * Math.abs(Math.sin(k * 0.95 + 0.5)) * gl.g;
  // uyarı: hafif itme (zoom), bildirim yayla iner
  const uyT = k - Z.uyari;
  const uyari = uyT < 0 ? 0 : Math.min(1, 1 - Math.pow(1 - sinirla(uyT / 7), 3));
  const itme = 1 + 0.07 * yumusak(aralik(k, Z.uyari, Z.uyari + 20));
  const n = nodDurumu(k);
  return (
    <g>
      <defs>
        <filter id="s1bulanik" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="s1bulanik2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <g transform={`translate(${GENISLIK / 2} ${YUKSEKLIK / 2}) scale(${itme}) translate(${-GENISLIK / 2} ${-YUKSEKLIK / 2})`}>
        {/* arka plan: odanın karşı duvarı ve zemin, odak dışı */}
        <g filter="url(#s1bulanik2)">
          <rect x={-100} y={-100} width={2200} height={1400} fill="#f4f5f8" />
          <rect x={-100} y={820} width={2200} height={400} fill="#e3e8ef" />
          <rect x={-100} y={790} width={2200} height={30} fill="#ffffff" stroke={RENK.murekkep} strokeWidth={4} />
          <ellipse cx={1500} cy={120} rx={420} ry={160} fill="#fff6dc" />
          {/* dizler (kanepede oturan Nod'un bacakları) */}
          <path d="M760 1200L900 960M1380 1200L1260 960" stroke={RENK.murekkep} strokeWidth={70} strokeLinecap="round" />
        </g>
        {/* telefon + eller (net) */}
        <g transform={`translate(${OTS.telX + telDx} ${OTS.telY + telDy}) rotate(-3) scale(${OTS.olcek})`}>
          {eldivenler('arka')}
          <ModernTelefon yuz="ekran" kare={k} pil={1} uyari={uyari} yanip={k >= Z.uyari} id="s1ekran" />
          {eldivenler('on')}
        </g>
        {/* ön plan: Nod'un kafasının arkası, atkısı ve omzu (bulanık, kenarda) */}
        <g filter="url(#s1bulanik)">
          <g transform={`translate(${OTS.kafa.x} ${OTS.kafa.y + nodDy})`}>
            <Nod id="s1arka" x={0} y={-(OLCU.kafaY) * OTS.nodOlcek} olcek={OTS.nodOlcek} poz={AYAKTA.arka}
              duygu={n.duygu} kare={k} golge={false} kaynama={false} bas={-0.1 * gl.v} />
          </g>
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- sahne
/** Çekim geçişi: eski çekim sola savrulur, yenisi sağdan gelir (bulanıklık yok). */
function savrulma(k: number, bas: number) {
  const t = sinirla((k - bas) / GECIS);
  const e = t * t * (3 - 2 * t);
  return { eski: -GENISLIK * e, yeni: GENISLIK * (1 - e), aktif: k >= bas && k < bas + GECIS };
}

export const Sahne: React.FC<{ kare: number }> = ({ kare: k }) => {
  const kam = kamera(k);
  const sars = sarsinti(k);
  const dunya = (kk: number, kk2 = kk) => <DunyaCekimi k={kk} kam={kamera(kk2)} sars={sars} />;
  let icerik: React.ReactNode;
  const g1 = savrulma(k, Z.gecis1), g2 = savrulma(k, Z.gecis2);
  if (k < Z.gecis1) icerik = dunya(k);
  else if (g1.aktif) icerik = (
    <>
      <g transform={`translate(${g1.eski} 0)`}>{dunya(k)}</g>
      <g transform={`translate(${g1.yeni} 0)`}><OmuzUstu k={k} /></g>
    </>
  );
  else if (k < Z.gecis2) icerik = <OmuzUstu k={k} />;
  else if (g2.aktif) icerik = (
    <>
      <g transform={`translate(${g2.eski} 0)`}><OmuzUstu k={k} /></g>
      <g transform={`translate(${g2.yeni} 0)`}>{dunya(k, Z.on)}</g>
    </>
  );
  else icerik = <DunyaCekimi k={k} kam={kam} sars={sars} />;
  return (
    <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      {icerik}
    </svg>
  );
};

/** Ses efektleri (assets/sfx/*.wav). */
export const SESLER: { kare: number; dosya: string; ses?: number }[] = [
  { kare: Z.gecis1 - 2, dosya: 'whoosh', ses: 0.7 },
  { kare: Z.uyari, dosya: 'dusuk-pil' },
  { kare: Z.uyari + 14, dosya: 'dusuk-pil', ses: 0.6 },
  { kare: Z.gecis2 - 2, dosya: 'whoosh', ses: 0.7 },
  { kare: Z.sok - 3, dosya: 'dun-dun' },
  { kare: Z.balon, dosya: 'pop', ses: 0.8 },
];
