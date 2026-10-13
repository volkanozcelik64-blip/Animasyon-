import React from 'react';
import { AbsoluteFill, Composition, useCurrentFrame } from 'remotion';
import { Sahne, GENISLIK, YUKSEKLIK, FPS, SURE } from './sahneler/NodTest';

const NodTest: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Sahne kare={kare} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="NodTest" component={NodTest} durationInFrames={SURE} fps={FPS} width={GENISLIK} height={YUKSEKLIK} />
);
