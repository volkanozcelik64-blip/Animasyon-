// Gerçek telefona benzeyen akıllı telefon (Nod'un çizim tarzında: kalın siyah kontur, düz renk).
// Oranlar ~9:19.5. Tasarım birimi: 90 × 195, (0,0) telefonun merkezi. Dünyaya ölçeklenerek çizilir.
// Ekran: durum çubuğu (saat, Wi-Fi, pil + yüzde) ve "Just Nod" kanal sayfası; ilk video oynuyor.
// Video uygulaması sade ve geneldir (marka logosu yok); içerik bizim kanal.
import React from 'react';
import { Nod } from '../karakter/Nod';
import { RENK } from '../karakter/olculer';
import { EL_SALLAYAN, DUYGU_POZLARI } from '../karakter/poz';
import { YAZI_AILESI } from '../karakter/Balon';

export const TELEFON = { gen: 90, yuk: 195, r: 15, cerceve: 3.2 } as const;
/** Ekran alanı (telefon biriminde). */
export const EKRAN = { x: -TELEFON.gen / 2 + TELEFON.cerceve, y: -TELEFON.yuk / 2 + TELEFON.cerceve, gen: TELEFON.gen - 2 * TELEFON.cerceve, yuk: TELEFON.yuk - 2 * TELEFON.cerceve };

const K = RENK.murekkep;
const UI = "'DejaVu Sans', sans-serif";
const KREM = '#f6ecd3';
const KREM_KOYU = '#e9d9b4';
const GRI = '#6b6f78';
const MAVI = RENK.bileklik;
const KIRMIZI = '#e8322a';

export interface ModernTelefonProps {
  /** 'ekran' = ön yüz; 'sirt' = arka yüz (kamera modülü) */
  yuz?: 'ekran' | 'sirt';
  kare?: number;
  /** pil yüzdesi */
  pil?: number;
  /** "Low Battery - 1%" bildirimi: 0 = gizli … 1 = tam inmiş */
  uyari?: number;
  /** pil simgesi yanıp sönüyor mu (kırmızı yanar/söner) */
  yanip?: boolean;
  /** tutma: ekranın üstünde dokunma halkası (ilk video) */
  dokunma?: number;
  id?: string;
}

/** Wi-Fi simgesi (sol alt köşe 0,0). */
const Wifi: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={K} strokeWidth={1.1} strokeLinecap="round">
    <path d="M0 -4.2A6 6 0 0 1 7 -4.2" />
    <path d="M1.4 -2.6A4 4 0 0 1 5.6 -2.6" />
    <circle cx={3.5} cy={-0.6} r={0.7} fill={K} stroke="none" />
  </g>
);

/** Pil simgesi: dolgu oranı ve renk. */
const PilSimgesi: React.FC<{ x: number; y: number; oran: number; renk: string; gen?: number; yuk?: number }> = ({ x, y, oran, renk, gen = 9, yuk = 4.6 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={0} y={-yuk / 2} width={gen} height={yuk} rx={1.2} fill="#fff" stroke={renk === KIRMIZI ? KIRMIZI : K} strokeWidth={0.8} />
    <rect x={gen + 0.3} y={-yuk / 4} width={1} height={yuk / 2} rx={0.4} fill={renk === KIRMIZI ? KIRMIZI : K} />
    <rect x={0.9} y={-yuk / 2 + 0.9} width={Math.max(0.9, (gen - 1.8) * oran)} height={yuk - 1.8} rx={0.5} fill={renk} />
  </g>
);

/** Videodaki küçük sahne: krem fon, zemin, Nod el sallayıp seker (bizim kanalın videosu). */
const MiniVideo: React.FC<{ kare: number; id: string; gen: number; yuk: number; duygu?: 'mutlu' | 'korkmus' | 'heyecanli' | 'fikir'; sabit?: boolean }> = ({ kare, id, gen, yuk, duygu = 'mutlu', sabit }) => {
  const t = sabit ? 0 : kare;
  const zipla = Math.abs(Math.sin(t * 0.22)) * 5;
  const o = (yuk * 0.68) / 517;
  return (
    <g>
      <rect x={0} y={0} width={gen} height={yuk} fill={KREM} />
      {/* defter çizgileri: kanalın görünümü */}
      {[0.3, 0.55, 0.8].map((f) => <path key={f} d={`M0 ${yuk * f}H${gen}`} stroke="#c9d6ea" strokeWidth={0.35} />)}
      <path d={`M${gen * 0.1} 0V${yuk}`} stroke="#e8a3a3" strokeWidth={0.35} />
      <path d={`M0 ${yuk * 0.9}H${gen}`} stroke={K} strokeWidth={0.6} />
      <g transform={`translate(${gen * 0.5} ${yuk * 0.9 - zipla})`}>
        <Nod id={id} x={0} y={0} olcek={o} gorunus="on" duygu={duygu === 'fikir' ? 'mutlu' : duygu} kare={kare}
          fikir={duygu === 'fikir'} fikirParlama={duygu === 'fikir' ? 1 : 0} golge={false} kaynama={false}
          poz={sabit ? DUYGU_POZLARI[duygu === 'fikir' ? 'mutlu' : duygu] : EL_SALLAYAN} bas={sabit ? 0 : 0.15 * Math.sin(t * 0.44)} />
      </g>
    </g>
  );
};

export const ModernTelefon: React.FC<ModernTelefonProps> = ({ yuz = 'ekran', kare = 0, pil = 1, uyari = 0, yanip = false, dokunma = 0, id = 'tel' }) => {
  const { gen, yuk, r } = TELEFON;
  const x0 = -gen / 2, y0 = -yuk / 2;
  // yan düğmeler (gövdenin arkasında, kenardan taşar)
  const dugmeler = (ayna: number) => (
    <g fill="#2b2d33" stroke={K} strokeWidth={1.4}>
      <rect x={ayna * (gen / 2) - (ayna > 0 ? 0.6 : 2.2)} y={-48} width={2.8} height={22} rx={1.2} />
      <rect x={-ayna * (gen / 2) - (ayna > 0 ? 2.2 : 0.6)} y={-56} width={2.8} height={14} rx={1.2} />
      <rect x={-ayna * (gen / 2) - (ayna > 0 ? 2.2 : 0.6)} y={-38} width={2.8} height={14} rx={1.2} />
    </g>
  );

  if (yuz === 'sirt') {
    return (
      <g>
        {dugmeler(-1)}
        <rect x={x0} y={y0} width={gen} height={yuk} rx={r} fill="#2b2d33" stroke={K} strokeWidth={3.4} />
        <rect x={x0 + 3} y={y0 + 3} width={gen - 6} height={yuk - 6} rx={r - 3} fill="none" stroke="#4a4d57" strokeWidth={1.2} />
        {/* kamera modülü */}
        <rect x={x0 + 8} y={y0 + 8} width={30} height={34} rx={9} fill="#3a3d46" stroke={K} strokeWidth={2} />
        {[[17, 18], [17, 32], [29, 25]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={x0 + cx} cy={y0 + cy} r={i === 2 ? 2.2 : 5.2} fill="#16171b" stroke="#6d717c" strokeWidth={1.2} />
            {i < 2 && <circle cx={x0 + cx - 1.5} cy={y0 + cy - 1.5} r={1.3} fill="#7d8494" />}
          </g>
        ))}
        {/* ekranın ışığı kenardan sızar (telefon açık) */}
        <rect x={x0} y={y0} width={gen} height={yuk} rx={r} fill="none" stroke="#9fc6f0" strokeWidth={1} opacity={0.6} />
      </g>
    );
  }

  const E = EKRAN;
  const sol = E.x + 5, sag = E.x + E.gen - 5;
  const pilRenk = pil <= 5 ? KIRMIZI : '#2a9d4b';
  const pilGorunur = !yanip || Math.floor(kare / 8) % 2 === 0;
  // ekran yerleşimi (y)
  const Y = { durum: E.y + 9, bar: E.y + 18, banner: E.y + 25, bannerY: 25, avatar: E.y + 59, sekme: E.y + 80, video: E.y + 86 };
  const vidGen = E.gen - 6, vidYuk = vidGen * 9 / 16;
  const kucukGen = (E.gen - 9) / 2, kucukYuk = kucukGen * 9 / 16;
  const ilerleme = 0.38 + (kare % 900) / 900 * 0.3;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-ekran`}><rect x={E.x} y={E.y} width={E.gen} height={E.yuk} rx={r - 3} /></clipPath>
        <clipPath id={`${id}-vid`}><rect x={0} y={0} width={vidGen} height={vidYuk} rx={2.5} /></clipPath>
        <clipPath id={`${id}-kucuk`}><rect x={0} y={0} width={kucukGen} height={kucukYuk} rx={2} /></clipPath>
        <clipPath id={`${id}-avatar`}><circle cx={0} cy={0} r={10} /></clipPath>
      </defs>
      {dugmeler(1)}
      {/* gövde: ince siyah çerçeve */}
      <rect x={x0} y={y0} width={gen} height={yuk} rx={r} fill="#1d1e22" stroke={K} strokeWidth={3.4} />
      <g clipPath={`url(#${id}-ekran)`}>
        <rect x={E.x} y={E.y} width={E.gen} height={E.yuk} fill="#ffffff" />

        {/* durum çubuğu: saat · (kamera) · Wi-Fi, yüzde, pil */}
        <text x={sol + 1} y={Y.durum + 2.2} fontFamily={UI} fontWeight={700} fontSize={6} fill={K}>19:00</text>
        <Wifi x={sag - 28.5} y={Y.durum + 2.4} />
        {pilGorunur && <text x={sag - 12.5} y={Y.durum + 2.2} fontFamily={UI} fontWeight={700} fontSize={5.2} fill={pilRenk} textAnchor="end">{pil}%</text>}
        <PilSimgesi x={sag - 11} y={Y.durum} oran={pil / 100} renk={pilGorunur ? pilRenk : '#ffffff'} />

        {/* uygulama çubuğu (genel video uygulaması: geri, kanal adı, arama) */}
        <path d={`M${sol + 3} ${Y.bar - 2.5}L${sol} ${Y.bar}L${sol + 3} ${Y.bar + 2.5}`} fill="none" stroke={K} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        <text x={sol + 7} y={Y.bar + 2} fontFamily={UI} fontWeight={700} fontSize={5} fill={K}>justnod</text>
        <circle cx={sag - 3} cy={Y.bar - 0.6} r={2.3} fill="none" stroke={K} strokeWidth={1.1} />
        <path d={`M${sag - 1.4} ${Y.bar + 1}L${sag + 0.6} ${Y.bar + 3}`} stroke={K} strokeWidth={1.2} strokeLinecap="round" />

        {/* banner: krem, "Just Nod - Relatable stickman comedy" */}
        <g transform={`translate(${E.x + 3} ${Y.banner})`}>
          <rect x={0} y={0} width={E.gen - 6} height={22} rx={3} fill={KREM} stroke={KREM_KOYU} strokeWidth={0.6} />
          <text x={6} y={10.5} fontFamily={`${YAZI_AILESI}, sans-serif`} fontWeight={700} fontSize={10} fill={K} stroke={K} strokeWidth={0.25}>Just Nod</text>
          <text x={6} y={17.5} fontFamily={`${YAZI_AILESI}, sans-serif`} fontSize={5.4} fill={K}>Relatable stickman comedy</text>
          {/* banner köşesinde atkılı küçük Nod kafası */}
          <circle cx={E.gen - 17} cy={10} r={6.2} fill="#fff" stroke={K} strokeWidth={0.9} />
          <path d={`M${E.gen - 19.6} 9.2v1.2M${E.gen - 14.6} 9.2v1.2`} stroke={K} strokeWidth={0.9} strokeLinecap="round" />
          <path d={`M${E.gen - 19.5} 12.3Q${E.gen - 17} 14.4 ${E.gen - 14.5} 12.3`} fill="none" stroke={K} strokeWidth={0.8} strokeLinecap="round" />
          <rect x={E.gen - 22.5} y={15.6} width={11} height={3.6} rx={1.6} fill={RENK.atki} stroke={K} strokeWidth={0.6} />
        </g>

        {/* profil: yuvarlak resim, ad, kullanıcı adı */}
        <g transform={`translate(${sol + 10} ${Y.avatar})`}>
          <circle r={11.2} fill="#fff" stroke={K} strokeWidth={1} />
          <g clipPath={`url(#${id}-avatar)`}>
            <rect x={-12} y={-12} width={24} height={24} fill={KREM} />
            <g transform="translate(0 33)"><Nod id={`${id}-av`} x={0} y={0} olcek={0.078} gorunus="on" duygu="mutlu" kare={0} golge={false} kaynama={false} /></g>
          </g>
        </g>
        <text x={sol + 25} y={Y.avatar - 1} fontFamily={UI} fontWeight={700} fontSize={6.4} fill={K}>justnod</text>
        <text x={sol + 25} y={Y.avatar + 6.5} fontFamily={UI} fontSize={4.8} fill={GRI}>@JustNod51</text>

        {/* sekmeler */}
        {[['Home', 0], ['Videos', 1], ['Shorts', 2]].map(([ad, i]) => (
          <text key={ad} x={sol + 2 + (i as number) * 25} y={Y.sekme} fontFamily={UI} fontWeight={i === 1 ? 700 : 400} fontSize={4.8} fill={i === 1 ? K : GRI}>{ad}</text>
        ))}
        <rect x={sol + 25} y={Y.sekme + 1.8} width={19} height={1.2} rx={0.6} fill={K} />
        <path d={`M${E.x} ${Y.sekme + 3}H${E.x + E.gen}`} stroke="#e1e3e8" strokeWidth={0.5} />

        {/* 1. video: dokunulmuş, oynuyor */}
        <g transform={`translate(${E.x + 3} ${Y.video})`}>
          <g clipPath={`url(#${id}-vid)`}>
            <MiniVideo kare={kare} id={`${id}-v1`} gen={vidGen} yuk={vidYuk} />
            {/* ilerleme çubuğu */}
            <rect x={0} y={vidYuk - 1.6} width={vidGen} height={1.6} fill="rgba(0,0,0,0.25)" />
            <rect x={0} y={vidYuk - 1.6} width={vidGen * ilerleme} height={1.6} fill={MAVI} />
          </g>
          <circle cx={vidGen * ilerleme} cy={vidYuk - 0.8} r={1.8} fill={MAVI} stroke="#fff" strokeWidth={0.5} />
          <rect x={0} y={0} width={vidGen} height={vidYuk} rx={2.5} fill="none" stroke={K} strokeWidth={0.8} />
          {dokunma > 0 && (
            <circle cx={vidGen * 0.62} cy={vidYuk * 0.45} r={4 + 12 * dokunma} fill="rgba(255,255,255,0.5)" opacity={1 - dokunma} />
          )}
          <text x={0.5} y={vidYuk + 7} fontFamily={UI} fontWeight={700} fontSize={5} fill={K}>1% Battery</text>
          <text x={0.5} y={vidYuk + 12.6} fontFamily={UI} fontSize={4.2} fill={GRI}>justnod · now playing</text>
        </g>

        {/* diğer videolar: küçük resimler */}
        {[{ ad: 'The Chair', duygu: 'heyecanli' as const }, { ad: 'Big Idea', duygu: 'fikir' as const }].map((v, i) => (
          <g key={v.ad} transform={`translate(${E.x + 3 + i * (kucukGen + 3)} ${Y.video + vidYuk + 17})`}>
            <g clipPath={`url(#${id}-kucuk)`}><MiniVideo kare={0} id={`${id}-k${i}`} gen={kucukGen} yuk={kucukYuk} duygu={v.duygu} sabit /></g>
            <rect x={0} y={0} width={kucukGen} height={kucukYuk} rx={2} fill="none" stroke={K} strokeWidth={0.7} />
            <text x={0.5} y={kucukYuk + 6} fontFamily={UI} fontWeight={700} fontSize={4.4} fill={K}>{v.ad}</text>
          </g>
        ))}

        {/* düşük pil bildirimi: üstten iner */}
        {uyari > 0 && (
          <g transform={`translate(0 ${-34 + 42 * uyari})`} opacity={Math.min(1, uyari * 1.5)}>
            <rect x={E.x + 3} y={E.y + 4} width={E.gen - 6} height={24} rx={6} fill="#fff" stroke={K} strokeWidth={1.4} />
            <PilSimgesi x={E.x + 7} y={E.y + 16} oran={0.01} renk={KIRMIZI} gen={10} yuk={6} />
            <text x={E.x + 21} y={E.y + 14.6} fontFamily={UI} fontWeight={700} fontSize={5.4} fill={KIRMIZI}>Low Battery - 1%</text>
            <text x={E.x + 21} y={E.y + 22} fontFamily={UI} fontSize={4.3} fill={GRI}>Connect your charger.</text>
          </g>
        )}
      </g>
      {/* ekranın içinde kamera deliği (çentik) */}
      <rect x={-6} y={Y.durum - 2.6} width={12} height={5.2} rx={2.6} fill="#0d0d10" />
      <circle cx={3} cy={Y.durum} r={1.3} fill="#2c3550" />
      {/* çerçeve konturu en üstte */}
      <rect x={x0} y={y0} width={gen} height={yuk} rx={r} fill="none" stroke={K} strokeWidth={3.4} />
    </g>
  );
};
