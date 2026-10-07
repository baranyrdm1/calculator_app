import React from 'react';
import {Composition} from 'remotion';
import {MiniDisc, WIDTH, HEIGHT, FPS, DURATION_FRAMES} from './MiniDisc';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MiniDisc"
    component={MiniDisc}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION_FRAMES}
  />
);
