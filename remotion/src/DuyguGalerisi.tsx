import React from 'react';
import {Karakter} from './Karakter/Karakter';
import {DUYGULAR, DUYGU_LISTESI} from './Karakter/pozlar';
import {Kagit} from './Kagit';
import {YAZI} from './font';

/** Tüm duyguları referans görseldeki gibi ızgarada gösterir (kontrol için). */
export const DuyguGalerisi: React.FC = () => (
  <>
    <Kagit />
    <div style={{position: 'absolute', left: 190, top: 30, fontFamily: YAZI, fontSize: 56, color: '#1d1b1b'}}>
      Duygular ve Mimikler
    </div>
    <div
      style={{
        position: 'absolute',
        left: 190,
        top: 120,
        right: 40,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        rowGap: 6,
      }}
    >
      {DUYGU_LISTESI.map((d) => (
        <div key={d} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Karakter duygu={d} width={200} height={240} zaman={8} />
          <div style={{fontFamily: YAZI, fontSize: 30, color: '#1d1b1b', marginTop: -6}}>{DUYGULAR[d].ad}</div>
        </div>
      ))}
    </div>
  </>
);
