import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/** Başlangıç sahnesi: 1920×1080, 30 fps, 5 sn. */
export const Ana: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const giris = spring({frame: f, fps, config: {damping: 14, stiffness: 120}});
  return (
    <AbsoluteFill style={{backgroundColor: '#fbf6e9', justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          fontFamily: 'sans-serif',
          fontSize: 140,
          color: '#1d1b1b',
          opacity: giris,
          transform: `translateY(${(1 - giris) * 60}px)`,
        }}
      >
        Animasyon
      </div>
    </AbsoluteFill>
  );
};
