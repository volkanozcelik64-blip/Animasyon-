import React from 'react';
import {Composition, Still} from 'remotion';
import {Ana} from './Ana';
import {Karakter} from './Karakter/Karakter';
import {DUYGU_LISTESI, Duygu} from './Karakter/pozlar';
import {DuyguIzgarasi, Karsilastirma, Referans, YanYana} from './DuyguIzgarasi';
import {DuyguTesti} from './DuyguTesti';
import {HareketOrnekleri} from './HareketOrnekleri';
import {Kagit} from './Kagit';
import './font';

const TekKarakter: React.FC<{duygu: Duygu}> = ({duygu}) => (
  <>
    <Kagit />
    <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <Karakter duygu={duygu} width={600} height={800} />
    </div>
  </>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ana" component={Ana} durationInFrames={150} fps={30} width={1920} height={1080} />

    {/* Duygular: referansla karşılaştırma */}
    <Still id="DuyguIzgarasi" component={DuyguIzgarasi} width={1920} height={1080} />
    <Still id="Referans" component={Referans} width={1920} height={1080} />
    <Still id="YanYana" component={YanYana} width={1920} height={1080} />
    <Composition id="Karsilastirma" component={Karsilastirma} durationInFrames={180} fps={30} width={1920} height={1080} />

    {/* Hareket sistemi: yuru / otur / kalk / zipla */}
    <Composition id="HareketOrnekleri" component={HareketOrnekleri} durationInFrames={120} fps={30} width={1920} height={1080} />

    {/* Animasyon testi (dikey): yürü → otur → düşünceli → kalk → heyecanlı → 2× zıpla */}
    <Composition id="DuyguTesti" component={DuyguTesti} durationInFrames={300} fps={30} width={1080} height={1920} />

    {DUYGU_LISTESI.map((d) => (
      <Composition
        key={d}
        id={`Karakter-${d}`}
        component={TekKarakter}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{duygu: d}}
      />
    ))}
  </>
);
