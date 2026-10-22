import React from 'react';
import { Composition } from 'remotion';
import { OAuth2Promo } from './OAuth2Promo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OAuth2Promo"
        component={OAuth2Promo}
        durationInFrames={450} // 15 saniye @ 30 FPS
        fps={30}
        width={1080}
        height={1920} // 9:16 Dikey Format (Reels / Shorts / TikTok)
      />
    </>
  );
};
