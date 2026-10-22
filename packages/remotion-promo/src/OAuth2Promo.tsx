import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Background } from './components/Background';
import { IntroScene } from './components/IntroScene';
import { CodeScene } from './components/CodeScene';
import { OutroScene } from './components/OutroScene';

export const OAuth2Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#070B14' }}>
      {/* Arka Plan Efektleri (Tüm video boyunca kesintisiz akar) */}
      <Background />

      {/* 1. Sahne: Giriş (0 - 3 sn / 0 - 90 frame) */}
      <Sequence from={0} durationInFrames={90} name="Intro">
        <IntroScene />
      </Sequence>

      {/* 2. Sahne: Kod Gösterimi (3 - 10 sn / 90 - 300 frame = 210 frame) */}
      <Sequence from={90} durationInFrames={210} name="Code">
        <CodeScene />
      </Sequence>

      {/* 3. Sahne: Kapanış & CTA (10 - 15 sn / 300 - 450 frame = 150 frame) */}
      <Sequence from={300} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
