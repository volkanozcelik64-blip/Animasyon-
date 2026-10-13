import React from 'react';
import { AbsoluteFill, Composition, useCurrentFrame } from 'remotion';
import { Sahne, GENISLIK, YUKSEKLIK, FPS, SURE } from './sahneler/NodTemel';

/** nod-temel: onaylanmış temel sahne. Yeni videolar src/karakter (Nod, hareketler) ve bu sahnenin
 *  yapısı (saf kare fonksiyonu + zaman çizelgesi) üzerine kurulur. */
const NodTemel: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Sahne kare={kare} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="NodTemel" component={NodTemel} durationInFrames={SURE} fps={FPS} width={GENISLIK} height={YUKSEKLIK} />
);
