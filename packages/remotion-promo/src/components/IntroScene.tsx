import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Giriş Yay Animasyonları
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const badgeEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const shieldEntrance = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, stiffness: 130 },
  });

  // Çıkış Geçişi (Frame 75 - 90 arası yumuşak sönümleme)
  const exitOpacity = interpolate(frame, [72, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [72, 90], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Neon Nabız & Dönüş
  const glowPulse = interpolate(Math.sin(frame / 6), [-1, 1], [0.85, 1.15]);
  const ringRotation = frame * 1.5;

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
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10,
      }}
    >
      {/* 1. Üst Rozet */}
      <div
        style={{
          opacity: badgeEntrance,
          transform: `translateY(${interpolate(badgeEntrance, [0, 1], [-40, 0])}px)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 28px',
          borderRadius: '999px',
          backgroundColor: 'rgba(0, 240, 255, 0.08)',
          border: '1.5px solid rgba(0, 240, 255, 0.4)',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
          marginBottom: '50px',
        }}
      >
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#00F0FF',
            boxShadow: '0 0 14px #00F0FF',
          }}
        />
        <span
          style={{
            color: '#00F0FF',
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          v2.0 GÜNCELLEMESİ
        </span>
      </div>

      {/* 2. Merkez Kalkan / Kilit Neon Grafiği */}
      <div
        style={{
          opacity: shieldEntrance,
          transform: `scale(${shieldEntrance * glowPulse})`,
          position: 'relative',
          width: '260px',
          height: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '60px',
        }}
      >
        {/* Dönen Dış Neon Çerçeve */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '42px',
            border: '2px dashed rgba(0, 240, 255, 0.6)',
            transform: `rotate(${ringRotation}deg)`,
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
          }}
        />

        {/* İç Neon Kartuş */}
        <div
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(7, 11, 20, 0.9) 100%)',
            border: '2px solid rgba(0, 240, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 30px rgba(0, 240, 255, 0.3), 0 0 50px rgba(0, 240, 255, 0.4)',
          }}
        >
          {/* SVG Siber Kilit / Kalkan */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 12px #00F0FF)',
            }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" fill="#00F0FF" />
          </svg>
        </div>
      </div>

      {/* 3. Ana Başlık */}
      <div
        style={{
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [50, 0])}px)`,
          textAlign: 'center',
          maxWidth: '900px',
        }}
      >
        <h2
          style={{
            fontSize: '38px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.75)',
            letterSpacing: '1px',
            margin: '0 0 16px 0',
          }}
        >
          Yeni Özellik
        </h2>
        <h1
          style={{
            fontSize: '68px',
            fontWeight: 900,
            lineHeight: 1.15,
            margin: 0,
            background: 'linear-gradient(135deg, #FFFFFF 20%, #00F0FF 65%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 35px rgba(0, 240, 255, 0.5))',
            letterSpacing: '-1.5px',
          }}
        >
          Hızlı &amp; Güvenli<br />OAuth2
        </h1>

        <p
          style={{
            marginTop: '32px',
            fontSize: '26px',
            fontWeight: 500,
            color: 'rgba(148, 163, 184, 0.9)',
            lineHeight: 1.4,
          }}
        >
          Tek tıkla sosyal giriş, PKCE koruması ve anında oturum yönetimi
        </p>
      </div>
    </div>
  );
};
