import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Krem çizgili defter kağıdı: mavi satır çizgileri, kırmızı kenar boşluğu. */
export const Kagit: React.FC<{satir?: number; kenar?: number}> = ({satir = 64, kenar = 150}) => (
  <AbsoluteFill
    style={{
      backgroundColor: '#fbf6e9',
      backgroundImage: [
        `linear-gradient(90deg, transparent ${kenar}px, rgba(220,70,70,0.55) ${kenar}px, rgba(220,70,70,0.55) ${kenar + 3}px, transparent ${kenar + 3}px)`,
        `repeating-linear-gradient(180deg, transparent 0, transparent ${satir - 2}px, rgba(90,140,210,0.32) ${satir - 2}px, rgba(90,140,210,0.32) ${satir}px)`,
      ].join(','),
    }}
  />
);
