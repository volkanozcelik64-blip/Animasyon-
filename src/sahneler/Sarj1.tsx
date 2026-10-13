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
import { TelefonluEller, ONDEN, OMUZ_ARKASI, bilekYerel, telefonYeri, yereldenDunyaya } from '../karakter/TelefonTutus';
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
const A_UC = GORUNUS.ucdort;
/** Kalçaya göre telefon merkezi (önden): karın önünde, göğüs hizasının altında; atkıyı ve yüzü kapatmaz. */
const TEL_MERKEZ: V = { x: 26, y: -40 };

/** Bilekler telefonun yanlarında (kollar gövdenin yanından, dirsekler bükülü); telefon bileklere bağlı. */
function tutanPoz(titre: V = { x: 0, y: 0 }, yukari = 0): Poz {
  const p = otur(1, 'ucdort');
  const c = { x: TEL_MERKEZ.x + titre.x, y: TEL_MERKEZ.y - yukari + titre.y };
  const bSol = yereldenDunyaya(c, 0, bilekYerel(-1, ONDEN));
  const bSag = yereldenDunyaya(c, 0, bilekYerel(1, ONDEN));
  return {
    ...p, egim: 2, kafaEgim: 8,
    // uzak kol (sol omuz) telefonun sağ kenarını, yakın kol (sağ omuz) sol kenarını tutar
    solKol: kolHedef(A_UC.omuzX.sol, bSag, -90, 'acik'),
    sagKol: kolHedef(A_UC.omuzX.sag, bSol, 90, 'acik', true),
  };
}

/** Dünyadaki iki bilekten telefonun yeri + ön kol açıları (eldiven bileklikleri için). */
function telefonVeKollar(poz: Poz, yer: (p: V) => V) {
  const bSol = yer(elKonumu(poz, 'sag').bilek), bSag = yer(elKonumu(poz, 'sol').bilek);
  const onKol = (kol: Poz['sagKol']) => kol.omuz + kol.dirsek + poz.egim + 90;
  return { ...telefonYeri(bSol, bSag, ONDEN), onKolSol: onKol(poz.sagKol), onKolSag: onKol(poz.solKol) };
}

interface NodDurumu {
  poz: Poz; duygu: Duygu; onceki?: Duygu; gecis: number; bak: Bakis; bas: number; agiz: Agiz; kirp: number;
  atkiDurum?: AtkiDurumAdi; zipla: number; titre: V;
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
    zipla: 0, titre: { x: 0, y: 0 },
  };
  if (k < Z.don) {
    n.bas = 0.18 * gl.v;
    n.zipla = 4 * gl.v;
    n.agiz = gl.g > 0.3 ? (Math.floor(k / 3) % 2 === 0 ? 'A' : 'E') : 'kapali';
    n.poz = tutanPoz({ x: 0, y: 0 }, 4 * gl.v);
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
    // eller hafifçe titrer; telefon bileklere bağlı olduğu için onunla titrer
    const tt = t > 6 ? 1 : 0;
    n.titre = { x: tt * 2.4 * Math.sin(k * 2.3), y: tt * 1.8 * Math.cos(k * 3.1) };
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
  // geniş plan: oturan Nod ekran yüksekliğinin ~%50'si
  const genis: Kamera = { x: NOD_X + 120, y: -250, zoom: 1.2 };
  const yakin: Kamera = { x: NOD_X + 40, y: -250, zoom: 1.7 };
  if (k < Z.on) {
    const t = yumusak(aralik(k, Z.itme, Z.gecis1 + GECIS));
    return { x: lerp(genis.x, yakin.x, t), y: lerp(genis.y, yakin.y, t), zoom: Math.exp(lerp(Math.log(genis.zoom), Math.log(yakin.zoom), t)) };
  }
  // önden yüz: yarım yakın plan (kafa + telefonu tutan eller)
  return { x: NOD_X + 110, y: -270, zoom: 1.95 };
}

function sarsinti(k: number): V {
  const t = k - Z.sok;
  if (t < 0 || t >= 18) return { x: 0, y: 0 };
  const g = 22 * (1 - t / 18);
  return { x: (random(`s1x${k}`) - 0.5) * 2 * g, y: (random(`s1y${k}`) - 0.5) * 2 * g };
}

/** Oda + Nod (dünya). */
const DunyaCekimi: React.FC<{ k: number; kam: Kamera; sars: V }> = ({ k, kam, sars }) => {
  const n = nodDurumu(k);
  const olc = kam.zoom * S;
  const g = `translate(${GENISLIK / 2 + sars.x} ${YUKSEKLIK / 2 + sars.y}) scale(${olc}) translate(${-kam.x} ${-kam.y})`;
  const yer = (p: V): V => ({ x: NOD_X + p.x, y: p.y - n.zipla });
  const tel = telefonVeKollar(n.poz, yer);
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
          elleriGizle />
        {/* telefon bileklere bağlı: eller → telefon → parmaklar */}
        <g transform={`translate(${tel.x} ${tel.y}) rotate(${tel.aci})`}>
          <TelefonluEller yuz="sirt" kavrayis={ONDEN} aci={tel.aci} onKolSol={tel.onKolSol} onKolSag={tel.onKolSag} id="s1sirt" />
        </g>
      </g>
      {k >= Z.balon && (
        <Balon tip="bagirma" metin="WAIT... 1%?! NO NO NO!" x={kafaE.x + 560} y={kafaE.y - 170} hedef={agizE}
          kare={k} baslangic={Z.balon} sure={SURE - Z.balon - 8} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------- omuz arkası çekim (ekran uzayında kurulur)
// Sol altta Nod'un kafasının arkası + atkısı (kadrajın ~%35'i, hafif bulanık); kollar omuzlardan çıkıp
// telefona uzanır (sol kol kafanın altından, sağ kol sağ alttan); telefon sağ-ortada, Nod'a doğru ~7° eğik.
const OTS = {
  tel: { x: 1200, y: 440 }, telOlcek: 6.0, telAci: -7,
  kafa: { x: 280, y: 440 }, nodOlcek: 4.0,
} as const;

const OmuzUstu: React.FC<{ k: number }> = ({ k }) => {
  const gl = gulme(k);
  // gülerken eller/telefon ve omuzlar farklı fazda titrer
  const telD = { x: 2 * Math.sin(k * 1.7) * gl.g, y: 7 * gl.v + 1.5 * Math.sin(k * 0.21) };
  const nodDy = 10 * Math.abs(Math.sin(k * 0.95 + 0.5)) * gl.g;
  // uyarı: hafif itme (zoom), bildirim yayla iner
  const uyT = k - Z.uyari;
  const uyari = uyT < 0 ? 0 : Math.min(1, 1 - Math.pow(1 - sinirla(uyT / 7), 3));
  const itme = 1 + 0.07 * yumusak(aralik(k, Z.uyari, Z.uyari + 20));
  const n = nodDurumu(k);

  // telefon (ekran uzayı): merkez, açı, ölçek; bilekler telefona bağlı
  const tc = { x: OTS.tel.x + telD.x, y: OTS.tel.y + telD.y };
  const P = OTS.telOlcek;
  const bilek = (t: 1 | -1) => { const b = bilekYerel(t, OMUZ_ARKASI); return yereldenDunyaya(tc, OTS.telAci, { x: b.x * P, y: b.y * P }); };
  const bSol = bilek(-1), bSag = bilek(1);

  // omuzlar (arka görünüş: Nod'un solu ekranın solunda)
  const N = OTS.nodOlcek;
  const H = { x: OTS.kafa.x, y: OTS.kafa.y + nodDy };
  const omuzY = H.y + (OLCU.omuzY - OLCU.kafaY) * N;
  const omuzSol = { x: H.x + GORUNUS.arka.omuzX.sol * N, y: omuzY };
  const omuzSag = { x: H.x + GORUNUS.arka.omuzX.sag * N, y: omuzY };
  // üst kol: omuzdan bileğe doğru, dirsek aşağı bükülü (iki kemik, ekran uzayında)
  const ustL = OLCU.ustKol * N * 1.15;
  const dirsek = (o: V, b: V, buk: number) => {
    const a = Math.atan2(b.y - o.y, b.x - o.x) + buk;
    return { x: o.x + Math.cos(a) * ustL, y: o.y + Math.sin(a) * ustL, a };
  };
  const dSol = dirsek(omuzSol, bSol, 0.3), dSag = dirsek(omuzSag, bSag, 0.8);
  // Nod'un kendi üst kolu bu yöne döner (yonV: 0 = aşağı); ön kol üst kolun altına katlanır (görünmez)
  const kolAci = (d: { a: number }) => (Math.atan2(-Math.cos(d.a), Math.sin(d.a)) * 180) / Math.PI;
  const arkaPoz: Poz = {
    ...AYAKTA.arka,
    solKol: { omuz: kolAci(dSol), dirsek: 180, bilek: 0, el: 'acik' },
    sagKol: { omuz: kolAci(dSag), dirsek: 180, bilek: 0, el: 'acik' },
  };
  const onKol = (d: V, b: V) => (Math.atan2(b.y - d.y, b.x - d.x) * 180) / Math.PI;
  const kalin = OLCU.kolKalinlik * N;

  return (
    <g>
      <defs>
        <filter id="s1bulanik" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="s1bulanik2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <g transform={`translate(${GENISLIK / 2} ${YUKSEKLIK / 2}) scale(${itme}) translate(${-GENISLIK / 2} ${-YUKSEKLIK / 2})`}>
        {/* arka plan: odanın karşı duvarı ve zemin, odak dışı */}
        <g filter="url(#s1bulanik2)">
          <rect x={-100} y={-100} width={2200} height={1400} fill="#f4f5f8" />
          <rect x={-100} y={850} width={2200} height={400} fill="#e3e8ef" />
          <rect x={-100} y={820} width={2200} height={30} fill="#ffffff" stroke={RENK.murekkep} strokeWidth={4} />
          <ellipse cx={1600} cy={110} rx={420} ry={150} fill="#fff6dc" />
        </g>
        {/* ön kollar: dirsekten bileğe (telefona yakın, net) */}
        {[[dSol, bSol], [dSag, bSag]].map(([d, b], i) => (
          <line key={i} x1={d.x} y1={d.y} x2={b.x} y2={b.y} stroke={RENK.murekkep} strokeWidth={kalin * 0.92} strokeLinecap="round" />
        ))}
        {/* telefon + kavrayan eller (bileklere bağlı) */}
        <g transform={`translate(${tc.x} ${tc.y}) rotate(${OTS.telAci}) scale(${P})`}>
          <TelefonluEller yuz="ekran" kavrayis={OMUZ_ARKASI} aci={OTS.telAci}
            onKolSol={onKol(dSol, bSol)} onKolSag={onKol(dSag, bSag)}
            kare={k} pil={1} uyari={uyari} yanip={k >= Z.uyari} id="s1ekran" />
        </g>
        {/* ön plan: kafanın arkası, atkı, omuzlar ve üst kollar (bulanık) */}
        <g filter="url(#s1bulanik)">
          <g transform={`translate(${H.x} ${H.y})`}>
            <Nod id="s1arka" x={0} y={-(OLCU.kafaY) * N} olcek={N} poz={arkaPoz} elleriGizle
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
