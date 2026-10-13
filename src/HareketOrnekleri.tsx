import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Karakter} from './Karakter/Karakter';
import {HareketAdimi} from './Karakter/hareketler';
import {Kagit} from './Kagit';
import {ETIKET} from './font';

// Her hareket tek başına (1920×1080, 4 sn). Kullanım örnekleri:
//   <Karakter duygu="mutlu" hareket="zipla" baslangic={30} />
//   <Karakter duygu="gulen" hareketler={[{hareket: 'otur', baslangic: 10}, {hareket: 'kalk', baslangic: 70}]} />

const ORNEKLER: {ad: string; kod: string; el: React.ReactNode}[] = [
  {
    ad: 'yuru',
    kod: 'hareket="yuru" baslangic={10}',
    el: <Karakter duygu="gulen" hareketler={[{hareket: 'yuru', baslangic: 10, x: -70, mesafe: 140, sure: 70}]} width={360} height={480} />,
  },
  {
    ad: 'otur → kalk',
    kod: 'otur @10, kalk @70',
    el: (
      <Karakter
        duygu="gulen"
        hareketler={[{hareket: 'otur', baslangic: 10}, {hareket: 'kalk', baslangic: 70}] satisfies HareketAdimi[]}
        width={360}
        height={480}
      />
    ),
  },
  {
    ad: 'zipla',
    kod: 'hareket="zipla" baslangic={30}',
    el: <Karakter duygu="mutlu" hareket="zipla" baslangic={30} width={360} height={480} />,
  },
  {
    ad: 'zipla → zipla',
    kod: 'zipla @20, zipla @52',
    el: (
      <Karakter
        duygu="heyecanli"
        hareketler={[{hareket: 'zipla', baslangic: 20}, {hareket: 'zipla', baslangic: 52, yukseklik: 80}]}
        width={360}
        height={480}
      />
    ),
  },
];

export const HareketOrnekleri: React.FC = () => (
  <AbsoluteFill>
    <Kagit />
    {ORNEKLER.map((o, i) => (
      <div key={o.ad} style={{position: 'absolute', left: 60 + i * 460, top: 330, width: 360}}>
        {o.el}
        <div style={{textAlign: 'center', fontFamily: ETIKET, fontSize: 40, color: '#1d1b1b', marginTop: 10}}>{o.ad}</div>
        <div style={{textAlign: 'center', fontFamily: 'monospace', fontSize: 20, color: '#555'}}>{o.kod}</div>
      </div>
    ))}
  </AbsoluteFill>
);
