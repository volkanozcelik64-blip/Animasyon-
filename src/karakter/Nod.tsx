import React from 'react';
import { random } from 'remotion';
import { RENK, OLCU, CIZGI, ATKI, GORUNUS, KAYNAMA, type Agiz, type Bakis } from './olculer';
import {
  Tanimlar, El, Ayakkabi, AtkiSarili, AtkiOn, AtkiUcu, AtkiDugumArka, atkiUcNoktasi,
  type Gorunus, type ElPozu,
} from './parcalar';
import { YuzOzellikleri, YuzTonu, Ekler, bakisKafa, type Duygu } from './yuz';
import { AYAKTA, DUYGU_POZLARI, type Poz, type Kol, type Bacak } from './poz';
import { atkiSekli, atkiKaristir, atkiSalinim, atkiRuzgar, bezierParcalari, type AtkiDurumAdi, type AtkiSekli } from './atkiTepki';
import { Ampul } from '../esyalar/Ampul';

export type { Gorunus, ElPozu, Duygu, Poz, Agiz, Bakis };

// kalça merkezine göre yerel yükseklikler
const BOYUN = OLCU.boyunY - OLCU.kalcaY;
const OMUZ = OLCU.omuzY - OLCU.kalcaY;
const KAFA = OLCU.kafaY - OLCU.kalcaY;

export interface NodProps {
  poz?: Poz;
  gorunus?: Gorunus; // poz verilmezse ayakta pozu bu görünüşte
  duygu?: Duygu;
  /** duygu geçişi: önceki duygu ve 0..1 ilerleme (bkz. duyguAt) */
  oncekiDuygu?: Duygu;
  gecis?: number;
  /** ekler (gözyaşı, ?, zz, kalpler, titreme) için kare sayacı */
  kare?: number;
  /** tut el pozunda tutulan nesne */
  sagNesne?: React.ReactNode;
  solNesne?: React.ReactNode;
  golge?: boolean;
  id?: string;
  x?: number;
  y?: number;
  olcek?: number;
  /** bakış (§2): önden göz bebekleri kayar; yan/3/4'te 'sol' karakteri sola döndürür (aynalar) */
  bak?: Bakis;
  /** yan/3/4 görünüşte sola bakar (aynalar); bak'tan bağımsız, böylece sola bakarken yukarı da bakabilir */
  sola?: boolean;
  /** konuşma ağzı (§8): duygunun üstüne uygulanır; 'kapali' = duygunun kendi ağzı */
  agiz?: Agiz;
  /** fikir anı: ampul belirir, atkı ucu ünlem gibi dikleşir */
  fikir?: boolean;
  /** atkı ucu duyguya tepki versin mi (§4). Vars. açık; kapalıyken düz sarkar (yalnızca follow-through). */
  atkiTepki?: boolean;
  /** göz kırpma 0 (açık) … 1 (kapalı) */
  kirp?: number;
  /** kafa öne/arkaya (onay sallaması): -1 … 1; + = öne (yüz aşağı kayar) */
  bas?: number;
  /** kafanın sağa-sola dönüşü (radyan; "hayır" sallaması / giriş) */
  kafaDonus?: number;
  /** ampulün belirmesi 0 … 1 (fikir anı) */
  fikirParlama?: number;
  /** fikir anında atkı ucu ünlem gibi dikleşsin (vars. fikir ile aynı) */
  atkiUnlem?: boolean;
  /** havadayken atkı ucu yukarı savrulur: 0 … 1 */
  atkiHavada?: number;
  /** hata ayıklama: atkı ucunun bezier kontrol noktalarını göster */
  atkiKontrol?: boolean;
  /** çizgi kaynaması (§6): konturlar her 4 karede 1-2px değişir. Vars. açık. */
  kaynama?: boolean;
  /** pozdaki el şeklini her iki el için ezer */
  el?: ElPozu;
}

// ---------------------------------------------------------------- uzuvlar
const Tup: React.FC<{ L: number; w: number }> = ({ L, w }) => (
  <line x1="0" y1="0" x2="0" y2={L} stroke={RENK.murekkep} strokeWidth={w} strokeLinecap="round" />
);

type KolKatmani = 'tup' | 'el' | 'hepsi';

function KolCiz({ kol, x, s, katman, nesne }: { kol: Kol; x: number; s: number; katman: KolKatmani; nesne?: React.ReactNode }) {
  const tup = katman !== 'el';
  const el = katman !== 'tup' && !kol.arkada; // arkadaki el gövdenin arkasında kalır, görünmez
  return (
    <g transform={`translate(${x} ${OMUZ}) rotate(${kol.omuz})`}>
      {tup && <Tup L={OLCU.ustKol} w={OLCU.kolKalinlik} />}
      <g transform={`translate(0 ${OLCU.ustKol}) rotate(${kol.dirsek})`}>
        {tup && <Tup L={OLCU.onKol} w={OLCU.kolKalinlik} />}
        <g transform={`translate(0 ${OLCU.onKol}) rotate(${kol.bilek})`}>
          {el && <g transform={`scale(${OLCU.elOlcek})`}><El poz={kol.el} s={kol.ayna ? -s : s} nesne={nesne} /></g>}
        </g>
      </g>
    </g>
  );
}

function BacakCiz({ bacak, x, s, gorunus }: { bacak: Bacak; x: number; s: number; gorunus: Gorunus }) {
  const ayakDuz = (bacak.ayak ?? 0) - bacak.kalca - bacak.diz;
  return (
    <g transform={`translate(${x} 0) rotate(${bacak.kalca})`}>
      <Tup L={OLCU.ustBacak} w={OLCU.bacakKalinlik} />
      <g transform={`translate(0 ${OLCU.ustBacak}) rotate(${bacak.diz})`}>
        <Tup L={OLCU.altBacak} w={OLCU.bacakKalinlik} />
        <g transform={`translate(0 ${OLCU.altBacak}) rotate(${ayakDuz})`}>
          <Ayakkabi gorunus={gorunus} s={s} />
        </g>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- kafa
const Kafa: React.FC<{
  id: string; yaw: number; duygu: Duygu; onceki?: Duygu; t: number; kare: number;
  bak: Bakis; agiz: Agiz; ayna: boolean; arka: boolean;
  kirp: number; bas: number; kafaDonus: number;
}> = ({ id, yaw, duygu, onceki, t, kare, bak, agiz, ayna, arka, kirp, bas, kafaDonus }) => {
  const R = OLCU.kafaR;
  const sikis = 1 - 0.28 * Math.sin(Math.PI * t); // geçişte yüz hafifçe büzülüp açılır (kırpışma)
  const [donus, egim] = bakisKafa(bak); // bakış yönüne kafa ~5° döner/eğilir
  const katman = (d: Duygu, op: number, key: string) =>
    op <= 0.001 ? null : (
      <g key={key} opacity={op}>
        {!arka && <g clipPath={`url(#${id}-kafa)`}><YuzTonu duygu={d} id={id} /></g>}
        {!arka && <g clipPath={`url(#${id}-kafa)`}><g transform={`translate(0 ${2 + egim + bas * 10}) scale(1.12 ${1.12 * sikis})`}><YuzOzellikleri duygu={d} id={id} yaw={yaw + donus + kafaDonus} bak={bak} agiz={agiz} kirp={kirp} /></g></g>}
      </g>
    );
  const ek = (d: Duygu, op: number, key: string) =>
    op <= 0.001 ? null : <g key={key} opacity={op}><Ekler duygu={d} kare={kare} yaw={arka ? 0 : yaw} ayna={ayna} /></g>;
  const gecisVar = onceki && onceki !== duygu && t < 1;
  return (
    <g>
      <circle r={R} fill={RENK.beyaz} />
      {/* iç gölge: sol alt kenarda ince gri hilal */}
      <g clipPath={`url(#${id}-kafa)`}>
        <circle r={R} fill={RENK.kafaGolge} />
        <circle cx="5" cy="-6" r={R - 2} fill={RENK.beyaz} />
      </g>
      {gecisVar && katman(onceki!, 1 - t, 'o')}
      {katman(duygu, gecisVar ? t : 1, 'y')}
      <circle r={R} fill="none" stroke={RENK.murekkep} strokeWidth={CIZGI.kafa} />
      {gecisVar && ek(onceki!, 1 - t, 'eo')}
      {ek(duygu, gecisVar ? t : 1, 'ey')}
    </g>
  );
};

/** Atkı ucunun bezier iskeleti: çapalar (dolu), tutamaçlar (boş), tutamaç çizgileri. */
const BezierIskelet: React.FC<{ sekil: AtkiSekli }> = ({ sekil }) => (
  <g opacity="0.9">
    {bezierParcalari(sekil.kontrol).map(([a, b, c, d], i) => (
      <g key={i}>
        <path d={`M${a.x} ${a.y}L${b.x} ${b.y}M${d.x} ${d.y}L${c.x} ${c.y}`} stroke="#1e90ff" strokeWidth="0.8" />
        <circle cx={b.x} cy={b.y} r="1.6" fill="#fff" stroke="#1e90ff" strokeWidth="0.8" />
        <circle cx={c.x} cy={c.y} r="1.6" fill="#fff" stroke="#1e90ff" strokeWidth="0.8" />
      </g>
    ))}
    {sekil.kontrol.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="#1e90ff" />)}
  </g>
);

// ---------------------------------------------------------------- karakter
export const Nod: React.FC<NodProps> = (p) => {
  const id = (p.id ?? 'k').replace(/[^a-zA-Z0-9_-]/g, '');
  const duygu = p.duygu ?? 'sakin';
  // poz verilmezse: ek duygunun kendi pozu (önden), yoksa ayakta
  const temel = p.poz ?? (p.gorunus && p.gorunus !== 'on' ? AYAKTA[p.gorunus] : DUYGU_POZLARI[duygu] ?? AYAKTA[p.gorunus ?? 'on']);
  const poz: Poz = p.el ? { ...temel, sagKol: { ...temel.sagKol, el: p.el }, solKol: { ...temel.solKol, el: p.el } } : temel;
  const g = poz.gorunus;
  const A = GORUNUS[g];
  const t = p.gecis ?? 1;
  const kare = p.kare ?? 0;
  const bak: Bakis = p.bak ?? 'izleyici';
  // yan/3/4'te sola bakma: açıkça `sola` ile ya da bak="sol" ile
  const ayna = g !== 'on' && g !== 'arka' && (p.sola ?? bak === 'sol');
  const gozBak: Bakis = g === 'on' ? bak : bak === 'yukari' || bak === 'asagi' ? bak : 'izleyici';
  const [ux, uy] = atkiUcNoktasi(g);

  // önden: karakterin sağ ayakkabısı ekranın soluna döner; arkadan tersi
  const ayakS = { sag: g === 'on' ? -1 : g === 'arka' ? 1 : 1, sol: g === 'arka' ? -1 : 1 };
  // başparmak gövdeye doğru
  const elS = { sag: g === 'arka' ? -1 : 1, sol: g === 'on' ? -1 : 1 };

  const bacak = (taraf: 'sag' | 'sol') => (
    <BacakCiz key={`b${taraf}`} bacak={taraf === 'sag' ? poz.sagBacak : poz.solBacak}
      x={A.kalcaX[taraf]} s={ayakS[taraf]} gorunus={g} />
  );
  const kolAl = (taraf: 'sag' | 'sol') => (taraf === 'sag' ? poz.sagKol : poz.solKol);
  const kol = (taraf: 'sag' | 'sol', katman: KolKatmani) => (
    <KolCiz key={`k${taraf}${katman}`} kol={kolAl(taraf)} x={A.omuzX[taraf]}
      s={elS[taraf]} katman={katman} nesne={taraf === 'sag' ? p.sagNesne : p.solNesne} />
  );
  const yakinlar: ('sag' | 'sol')[] = A.uzak ? [A.uzak === 'sag' ? 'sol' : 'sag'] : ['sag', 'sol'];
  // eller arkada olan kollar gövdenin arkasına
  const arkaKollar = [...(A.uzak ? [A.uzak] : []), ...yakinlar.filter((tf) => kolAl(tf).arkada)];
  const onKollar = yakinlar.filter((tf) => !kolAl(tf).arkada);

  const atkiDonus = g === 'ucdort' ? `translate(4 0) scale(${ATKI.ucdortOlcek} 1)` : g === 'yan' ? '' : `scale(${ATKI.onOlcek} 1)`;
  const atkiGorunus: Gorunus = g === 'yan' ? 'yan' : g === 'arka' ? 'arka' : 'on';
  const govdeYari = A.govdeG / 2;

  // atkı ucu: duygu biçimi (geçişte karışır) + follow-through salınımı; dünya dikeyine göre (egim telafisi)
  const tepki = p.atkiTepki ?? true;
  const unlem = p.atkiUnlem ?? !!p.fikir;
  const durum: AtkiDurumAdi = unlem ? 'fikir' : tepki ? duygu : 'notr';
  const gecisVar = tepki && !unlem && p.oncekiDuygu && p.oncekiDuygu !== duygu && t < 1;
  const sekil0 = atkiSekli(durum, kare, g);
  const sekil1a = gecisVar ? atkiKaristir(atkiSekli(p.oncekiDuygu!, kare, g), sekil0, t) : sekil0;
  const sekil1 = p.atkiHavada ? atkiKaristir(sekil1a, atkiSekli('havada', kare, g), p.atkiHavada) : sekil1a;
  // güçlü geriye savrulmada (yürüme/koşma) uç uzar ve dalgalanır
  const ruzgar = Math.max(0, Math.min(1, (Math.abs(poz.atki.a1) - 25) / 40));
  const uc = atkiSalinim(atkiRuzgar(sekil1, ruzgar, kare), poz.atki.a1 - poz.egim, poz.atki.a2);
  const ucX = g === 'ucdort' ? ux * ATKI.ucdortOlcek + 4 : g === 'on' ? ux * ATKI.onOlcek : ux; // arka/yan: ölçeksiz

  // çizgi kaynaması: her KAYNAMA.aralik karede yeni bir gürültü; Remotion random(seed) ile deterministik
  const kaynama = p.kaynama ?? true;
  const adim = Math.floor(kare / KAYNAMA.aralik);
  const tohum = Math.floor(random(`${id}-kaynama-${adim}`) * 1000);
  const kayma = KAYNAMA.enFazla * (0.6 + 0.4 * random(`${id}-kayma-${adim}`)); // en fazla ~2 birim (1-2px)

  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.olcek ?? 1) * (ayna ? -1 : 1)} ${p.olcek ?? 1})`}>
      <Tanimlar id={id} />
      {kaynama && (
        <defs>
          <filter id={`${id}-kaynama`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={KAYNAMA.frekans} numOctaves="1" seed={tohum} />
            <feDisplacementMap in="SourceGraphic" scale={kayma} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      )}
      {(p.golge ?? true) && (
        <ellipse cx={poz.kok.x + A.golgeX} cy="2" rx={A.golgeRx} ry="8" fill={RENK.golge} />
      )}
      <g transform={`translate(${poz.kok.x} ${poz.kok.y})`} filter={kaynama ? `url(#${id}-kaynama)` : undefined}>
        {/* arka taraf: uzak bacak, uzak kol / arkadaki eller */}
        {A.uzak && bacak(A.uzak)}
        <g transform={`rotate(${poz.egim})`}>{arkaKollar.map((tf) => kol(tf, 'hepsi'))}</g>
        {/* bacaklar */}
        {yakinlar.map((tf) => bacak(tf))}
        <g transform={`rotate(${poz.egim})`}>
          {/* gövde paneli: atkının altından kalçaya */}
          <path
            d={`M${-govdeYari} ${BOYUN + 6}L${govdeYari} ${BOYUN + 6}L${govdeYari - 1} -6Q${govdeYari - 1} 6 ${govdeYari - 13} 6L${-govdeYari + 13} 6Q${-govdeYari + 1} 6 ${-govdeYari + 1} -6Z`}
            fill={RENK.beyaz} stroke={RENK.murekkep} strokeWidth={CIZGI.govde} strokeLinejoin="round" />
          {/* kollar (borular atkının arkasında) */}
          {onKollar.map((tf) => kol(tf, 'tup'))}
          {/* kafa */}
          <g transform={`translate(0 ${BOYUN}) rotate(${poz.kafaEgim}) translate(0 ${KAFA - BOYUN + (p.bas ?? 0) * 3})`}>
            <Kafa id={id} yaw={A.yaw} duygu={duygu} onceki={p.oncekiDuygu} t={t} kare={kare}
              kirp={p.kirp ?? 0} bas={p.bas ?? 0} kafaDonus={p.kafaDonus ?? 0}
              bak={gozBak} agiz={p.agiz ?? 'kapali'} ayna={ayna} arka={g === 'arka'} />
            {p.fikir && <g transform={`translate(0 ${-OLCU.kafaR - 20}) ${ayna ? 'scale(-1 1)' : ''}`}><Ampul parlama={p.fikirParlama ?? 1} /></g>}
          </g>
          {/* atkı: sarılı kısım, sarkan uç, önündeki kıvrım/düğüm (arkadan uç ve kıvrım görünmez) */}
          <g transform={`translate(0 ${BOYUN})`}>
            <g transform={atkiDonus}><AtkiSarili id={id} gorunus={atkiGorunus} /></g>
            {g === 'arka' ? (
              // arkadan: düğüm ensede, uç ondan sarkar (uç düğümün altından çıkar)
              <>
                <g transform={`translate(${ucX} ${uy})`}><AtkiUcu id={id} sekil={{ ...uc, onde: false }} /></g>
                <AtkiDugumArka id={id} />
              </>
            ) : (
              <>
                {!uc.onde && <g transform={`translate(${ucX} ${uy})`}><AtkiUcu id={id} sekil={uc} /></g>}
                <g transform={atkiDonus}><AtkiOn id={id} gorunus={atkiGorunus} /></g>
                {uc.onde && <g transform={`translate(${ucX} ${uy})`}><AtkiUcu id={id} sekil={uc} /></g>}
                {p.atkiKontrol && <g transform={`translate(${ucX} ${uy})`}><BezierIskelet sekil={uc} /></g>}
              </>
            )}
          </g>
          {/* eller en önde */}
          {onKollar.map((tf) => kol(tf, 'el'))}
        </g>
      </g>
    </g>
  );
};

export default Nod;
