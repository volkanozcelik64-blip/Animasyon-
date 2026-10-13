import React from 'react';
import { AbsoluteFill, Audio, Composition, staticFile, useCurrentFrame } from 'remotion';
import * as Temel from './sahneler/NodTemel';
import * as Konusma from './sahneler/NodKonusma';

/** nod-temel: onaylanmış temel sahne. Yeni videolar src/karakter (Nod, hareketler) ve bu sahnenin
 *  yapısı (saf kare fonksiyonu + zaman çizelgesi) üzerine kurulur. */
const NodTemel: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Temel.Sahne kare={kare} />
    </AbsoluteFill>
  );
};

/** Lip sync testi: assets/ses.mp3 (public dizini: assets). */
const NodKonusma: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Konusma.Sahne kare={kare} />
      <Audio src={staticFile(Konusma.SES_DOSYASI)} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="NodTemel" component={NodTemel} durationInFrames={Temel.SURE} fps={Temel.FPS} width={Temel.GENISLIK} height={Temel.YUKSEKLIK} />
    <Composition id="NodKonusma" component={NodKonusma} durationInFrames={Konusma.SURE} fps={Konusma.FPS} width={Konusma.GENISLIK} height={Konusma.YUKSEKLIK} />
  </>
);
