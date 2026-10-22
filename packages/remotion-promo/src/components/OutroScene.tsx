import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Giriş Yayları
  const logoEntrance = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  const ctaEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 130 },
  });

  const featuresEntrance = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Işıma Nabzı
  const pulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.95, 1.05]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10,
      }}
    >
      {/* 1. Logo ve İkon */}
      <div
        style={{
          opacity: logoEntrance,
          transform: `scale(${logoEntrance * pulse})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '50px',
        }}
      >
        <div
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '40px',
            background: 'linear-gradient(135deg, #00F0FF 0%, #0070F3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 70px rgba(0, 240, 255, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.4)',
            marginBottom: '28px',
          }}
        >
          {/* Logo Sembolü */}
          <span style={{ fontSize: '84px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>
            ⚡
          </span>
        </div>

        <h3
          style={{
            fontSize: '44px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          @myproject/core
        </h3>
      </div>

      {/* 2. Ana CTA Başlığı */}
      <div
        style={{
          opacity: ctaEntrance,
          transform: `translateY(${interpolate(ctaEntrance, [0, 1], [30, 0])}px)`,
          textAlign: 'center',
          marginBottom: '36px',
        }}
      >
        <h2
          style={{
            fontSize: '60px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 16px 0',
            letterSpacing: '-1px',
          }}
        >
          Hemen Güncelleyin!
        </h2>
        <p
          style={{
            fontSize: '26px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}
        >
          Yeni nesil kimlik doğrulama altyapısına bugün geçiş yapın
        </p>
      </div>

      {/* 3. Terminal Komut Kutusu (CTA Box) */}
      <div
        style={{
          opacity: ctaEntrance,
          transform: `scale(${interpolate(ctaEntrance, [0, 1], [0.9, 1])})`,
          width: '900px',
          padding: '28px 40px',
          borderRadius: '24px',
          backgroundColor: '#0D1322',
          border: '2px solid #00F0FF',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          marginBottom: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{ color: '#00F0FF', fontSize: '32px', fontWeight: 800 }}>$</span>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '34px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            npm i @myproject/core
          </span>
        </div>

        <div
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: '#00F0FF',
            color: '#070B14',
            fontSize: '22px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>KOPYALA</span>
          <span>📋</span>
        </div>
      </div>

      {/* 4. Özellik Maddeleri */}
      <div
        style={{
          opacity: featuresEntrance,
          transform: `translateY(${interpolate(featuresEntrance, [0, 1], [30, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '900px',
        }}
      >
        {[
          '✓ Google, GitHub, Apple & Özel Sağlayıcılar',
          '✓ Sıfır Ek Konfigürasyon, Tak-Çalıştır API',
          '✓ PKCE Desteği & CSRF Korumalı Güvenlik',
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '24px',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px 24px',
              borderRadius: '16px',
            }}
          >
            <span style={{ color: '#00F0FF', fontSize: '26px' }}>●</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
