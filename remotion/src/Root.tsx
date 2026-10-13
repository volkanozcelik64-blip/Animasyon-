import React from 'react';
import {Composition, Still} from 'remotion';
import {Karakter} from './Karakter/Karakter';
import {DUYGU_LISTESI, Duygu} from './Karakter/pozlar';
import {DuyguGalerisi} from './DuyguGalerisi';
import {DuyguTesti} from './DuyguTesti';
import {Kagit} from './Kagit';
import './font';

const TekKarakter: React.FC<{duygu: Duygu}> = ({duygu}) => (
  <>
    <Kagit />
    <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <Karakter duygu={duygu} width={600} />
    </div>
  </>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DuyguTesti" component={DuyguTesti} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Still id="DuyguGalerisi" component={DuyguGalerisi} width={1920} height={1280} />
    {DUYGU_LISTESI.map((d) => (
      <Still key={d} id={`Karakter-${d}`} component={TekKarakter} width={1080} height={1080} defaultProps={{duygu: d}} />
    ))}
  </>
);
