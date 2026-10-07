import React from 'react';
import {Composition} from 'remotion';
import {MiniDisc, WIDTH, HEIGHT, FPS, DURATION_FRAMES} from './MiniDisc';
import * as V from './Vinyl';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Plak" component={V.Vinyl} width={V.WIDTH} height={V.HEIGHT} fps={V.FPS} durationInFrames={V.DURATION_FRAMES} />
    <Composition
      id="MiniDisc"
      component={MiniDisc}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={DURATION_FRAMES}
    />
  </>
);
