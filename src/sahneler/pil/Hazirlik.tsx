// "1% Battery" hazırlık sayfası (tek PNG): oda + kanepede oturan Nod, 4 balon tipi, eşyalar.
// SAHNE=hazirlik npm run kareler -- 0 onizleme/karakter/pil-hazirlik.png
import React from 'react';
import { Nod } from '../../karakter/Nod';
import { RENK, ekranOlcegi } from '../../karakter/olculer';
import { elKonumu, kafaKonumu } from '../../karakter/hareketler';
import { Balon, sessizAgiz, type BalonTipi } from '../../karakter/Balon';
import { AkilliTelefon } from '../../esyalar/Telefon';
import { Adaptor, Kablo, KabloUcu, KabloYumagi } from '../../esyalar/Sarj';
import { kanepedeOturan } from '../NodPil';
import { ODA, Oda } from './Oda';

export const GENISLIK = 1920;
export const YUKSEKLIK = 1990;
const ODA_YUK = 1180;
const S = ekranOlcegi(1080, 0.5); // nod-temel ölçeği (video karesinde zoom 1)
const ZOOM = 0.86; // sayfada odanın tamamı sığsın diye geniş plan
const KAM = { x: 690, y: -560 };
const olc = ZOOM * S;
const ekran = (p: { x: number; y: number }) => ({ x: GENISLIK / 2 + (p.x - KAM.x) * olc, y: ODA_YUK / 2 + (p.y - KAM.y) * olc });

const YAZI = "'DejaVu Sans', sans-serif";
const Etiket: React.FC<{ x: number; y: number; children: React.ReactNode; boy?: number }> = ({ x, y, children, boy = 22 }) => (
  <text x={x} y={y} fontFamily={YAZI} fontSize={boy} fill="#555" textAnchor="middle">{children}</text>
);

const BALON_ORNEK: { tip: BalonTipi; metin: string; ad: string }[] = [
  { tip: 'normal', metin: 'Ahhh... finally.', ad: 'normal' },
  { tip: 'bagirma', metin: 'WAIT... 1%?! NO NO NO!', ad: 'bagirma (titrer)' },
  { tip: 'fisilti', metin: '...seriously?', ad: 'fisilti' },
  { tip: 'dusunce', metin: 'Charger...?', ad: 'dusunce' },
];

export const Sahne: React.FC<{ kare: number }> = ({ kare }) => {
  const k = kare + 200; // balonlar tam açık ve yazılmış
  const bas = k - 60;
  const poz = kanepedeOturan();
  const n0 = { x: ODA.oturX, y: 0 };
  const w = (p: { x: number; y: number }) => ({ x: n0.x + p.x, y: n0.y + p.y });
  const avuc = w(elKonumu(poz, 'sag').avuc);
  const kafa = ekran(w(kafaKonumu(poz).merkez));
  const agizE = ekran(w(kafaKonumu(poz).agiz));
  const ornek = 'Hmm... 1%?';
  const harf = 6; // yazılırken: ağız sessizce açılıp kapanır

  const satir2 = ODA_YUK + 40; // balon sırası
  const satir3 = ODA_YUK + 450; // eşyalar
  return (
    <svg width={GENISLIK} height={YUKSEKLIK} viewBox={`0 0 ${GENISLIK} ${YUKSEKLIK}`}>
      <rect width={GENISLIK} height={YUKSEKLIK} fill="#ffffff" />
      {/* 1) oda + kanepede oturan Nod (konuşuyor: balon yazılırken ağız hareketli) */}
      <svg x={0} y={0} width={GENISLIK} height={ODA_YUK} viewBox={`0 0 ${GENISLIK} ${ODA_YUK}`}>
        <g transform={`translate(${GENISLIK / 2} ${ODA_YUK / 2}) scale(${olc}) translate(${-KAM.x} ${-KAM.y})`}>
          <Oda />
          <ellipse cx={n0.x + 40} cy={2} rx={70} ry={8} fill={RENK.golge} />
          <Nod id="hz" x={n0.x} y={0} olcek={1} poz={poz} duygu="mutlu" kare={kare} golge={false}
            agiz={sessizAgiz(ornek, harf, kare)} sagNesne={<g />} solNesne={<g />} />
          <g transform={`translate(${avuc.x} ${avuc.y}) rotate(-8)`}><AkilliTelefon ekran="pil" uyari={1} /></g>
        </g>
        <Balon tip="normal" metin={ornek} x={kafa.x + 300} y={kafa.y - 150} hedef={agizE} kare={k} baslangic={k - (4 + Math.ceil(harf / 0.75))} sure={300} />
      </svg>
      <rect x={0} y={0} width={GENISLIK} height={ODA_YUK} fill="none" stroke="#bbb" strokeWidth={2} />
      <Etiket x={170} y={ODA_YUK - 24}>oda (tüm bölümlerde aynı)</Etiket>

      {/* 2) dört balon tipi */}
      {BALON_ORNEK.map((b, i) => {
        const cx = [250, 770, 1270, 1680][i], cy = satir2 + 150;
        const agiz = { x: cx - 110, y: cy + 190 }; // kuyruğun yöneldiği "ağız"
        return (
          <g key={b.tip}>
            <path d={`M${agiz.x - 14} ${agiz.y}Q${agiz.x} ${agiz.y + 10} ${agiz.x + 14} ${agiz.y}`} fill="none" stroke="#bbb" strokeWidth={4} strokeLinecap="round" />
            <Balon tip={b.tip} metin={b.metin} x={cx} y={cy} hedef={agiz} kare={k} baslangic={bas} sure={300} olcek={0.8} />
            <Etiket x={cx} y={satir2 + 390}>{b.ad}</Etiket>
          </g>
        );
      })}
      <path d={`M0 ${satir3 - 20}H${GENISLIK}`} stroke="#ddd" strokeWidth={2} />

      {/* 3) eşyalar */}
      <g transform={`translate(170 ${satir3 + 170}) scale(3.4)`}><AkilliTelefon ekran="pil" uyari={1} /></g>
      <Etiket x={170} y={satir3 + 340}>telefon: düşük pil</Etiket>
      <g transform={`translate(420 ${satir3 + 170}) scale(3.4)`}><AkilliTelefon ekran="sarj" /></g>
      <Etiket x={420} y={satir3 + 340}>telefon: şarjda</Etiket>
      <g transform={`translate(670 ${satir3 + 170}) scale(3.4)`}><AkilliTelefon ekran="karanlik" parlama={1} /></g>
      <Etiket x={670} y={satir3 + 340}>telefon: karanlıkta</Etiket>
      <g transform={`translate(960 ${satir3 + 160})`}><KabloYumagi r={120} /></g>
      <Etiket x={960} y={satir3 + 340}>düğümlü kablo yumağı</Etiket>
      {/* şarj aleti + kablo + fiş (usb-c) ve yanlış uç (usb-a) */}
      <g transform={`translate(1250 ${satir3 + 150}) scale(2.2)`}>
        <Adaptor />
        <Kablo noktalar={[{ x: -44, y: 2 }, { x: -70, y: 40 }, { x: 20, y: 60 }, { x: 110, y: 30 }, { x: 140, y: 0 }]} />
        <g transform="translate(166 0)"><KabloUcu tur="usbc" /></g>
      </g>
      <Etiket x={1430} y={satir3 + 340}>şarj aleti + kablo + fiş (usb-c)</Etiket>
      <g transform={`translate(1790 ${satir3 + 150}) scale(2.2)`}><KabloUcu tur="usba" /></g>
      <Etiket x={1760} y={satir3 + 340}>yanlış uç (usb-a)</Etiket>
    </svg>
  );
};
