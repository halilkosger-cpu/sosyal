import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Yavaşça dönen ve nefes alan neon ışıma
  const pulse = interpolate(Math.sin(frame / 20), [-1, 1], [0.8, 1.2]);
  const gradientAngle = (frame * 0.4) % 360;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#070B14',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* İnce Siber Izgara (Cyber Grid) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(circle 800px at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle 800px at center, black 40%, transparent 80%)',
        }}
      />

      {/* Üst Neon Mavi / Camgöbeği Işıma Küresi */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: `translateX(-50%) scale(${pulse})`,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.22) 0%, rgba(0, 112, 243, 0.08) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Alt Derin Mavi / Mor Işıma */}
      <div
        style={{
          position: 'absolute',
          bottom: -250,
          right: -100,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(99, 102, 241, 0.1) 45%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Dinamik Dönen Işık Halkası */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 1200,
          height: 1200,
          transform: `translate(-50%, -50%) rotate(${gradientAngle}deg)`,
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 240, 255, 0.06) 90deg, transparent 180deg, rgba(56, 189, 248, 0.05) 270deg, transparent 360deg)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
