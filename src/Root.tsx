import React from 'react';
import {Composition} from 'remotion';
import {MiniDisc, WIDTH, HEIGHT, FPS, DURATION_FRAMES} from './MiniDisc';
import * as V from './Vinyl';
import * as F from './FlowerDisc';
import * as E from './EchoAfter';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EchoAfterIntro" component={E.EchoIntro} width={E.WIDTH} height={E.HEIGHT} fps={E.FPS} durationInFrames={E.INTRO_FRAMES} />
    <Composition id="EchoAfterOutro" component={E.EchoOutro} width={E.WIDTH} height={E.HEIGHT} fps={E.FPS} durationInFrames={E.OUTRO_FRAMES} />
    <Composition id="Plak" component={F.FlowerDisc} width={F.WIDTH} height={F.HEIGHT} fps={F.FPS} durationInFrames={F.DURATION_FRAMES} />
    <Composition id="Vinyl" component={V.Vinyl} width={V.WIDTH} height={V.HEIGHT} fps={V.FPS} durationInFrames={V.DURATION_FRAMES} />
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
