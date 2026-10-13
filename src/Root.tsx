import React from 'react';
import {Composition} from 'remotion';
import {Ana} from './Ana';

export const RemotionRoot: React.FC = () => (
  <Composition id="Ana" component={Ana} durationInFrames={150} fps={30} width={1920} height={1080} />
);
