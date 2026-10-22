import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const CodeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pencere Giriş Yay Animasyonu
  const windowEntrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.9 },
  });

  // Çıkış Geçişi (Frame 190 - 210 arası)
  const exitOpacity = interpolate(frame, [190, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [190, 210], [1, 0.94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Kod satırlarının adım adım gelişi (Frame bazlı ilerleme)
  // Toplam 210 frame içinde satırları açıyoruz:
  const lineProgress = Math.min(10, Math.floor(frame / 16));

  const codeLines = [
    { num: 1, text: "import { useAuth } from '@myproject/core';", highlight: true },
    { num: 2, text: "", highlight: false },
    { num: 3, text: "export function LoginButton() {", highlight: false },
    { num: 4, text: "  const { loginWithOAuth2, user } = useAuth();", highlight: true },
    { num: 5, text: "", highlight: false },
    { num: 6, text: "  if (user) {", highlight: false },
    { num: 7, text: "    return <span>Hoş geldin, {user.name}! 👋</span>;", highlight: false },
    { num: 8, text: "  }", highlight: false },
    { num: 9, text: "", highlight: false },
    { num: 10, text: "  return (", highlight: false },
    { num: 11, text: "    <button onClick={() => loginWithOAuth2('google')}>", highlight: true },
    { num: 12, text: "      ⚡ Google ile Hızlı Giriş", highlight: false },
    { num: 13, text: "    </button>", highlight: false },
    { num: 14, text: "  );", highlight: false },
    { num: 15, text: "}", highlight: false },
  ];

  // İmleç Yanıp Sönmesi
  const cursorBlink = Math.floor(frame / 10) % 2 === 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 50px',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10,
      }}
    >
      {/* Üst Bilgi Başlığı */}
      <div
        style={{
          opacity: windowEntrance,
          transform: `translateY(${interpolate(windowEntrance, [0, 1], [-30, 0])}px)`,
          textAlign: 'center',
          marginBottom: '36px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00F0FF',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: '16px',
          }}
        >
          SADECE 2 SATIR KOD
        </div>
        <h2
          style={{
            fontSize: '52px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-1px',
          }}
        >
          Modern <span style={{ color: '#00F0FF' }}>useAuth()</span> Hook
        </h2>
      </div>

      {/* Kod Editör Penceresi (IDE Window) */}
      <div
        style={{
          opacity: windowEntrance,
          transform: `scale(${interpolate(windowEntrance, [0, 1], [0.88, 1])}) translateY(${interpolate(windowEntrance, [0, 1], [40, 0])}px)`,
          width: '980px',
          borderRadius: '28px',
          backgroundColor: '#0D1322',
          border: '2px solid rgba(0, 240, 255, 0.35)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 240, 255, 0.25)',
          overflow: 'hidden',
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        }}
      >
        {/* Pencere Üst Barı (Mac Style) */}
        <div
          style={{
            height: '70px',
            backgroundColor: '#080C16',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
          </div>

          <div
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '22px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📄</span>
            <span>AuthButton.tsx</span>
          </div>

          <div
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              color: '#00F0FF',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            TypeScript
          </div>
        </div>

        {/* Kod İçeriği */}
        <div
          style={{
            padding: '36px 32px',
            fontSize: '24px',
            lineHeight: '1.7',
            color: '#E2E8F0',
            minHeight: '620px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {codeLines.map((line, idx) => {
            const isVisible = idx <= lineProgress + 3;
            if (!isVisible) return null;

            return (
              <div
                key={line.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: line.highlight ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  borderLeft: line.highlight ? '4px solid #00F0FF' : '4px solid transparent',
                  paddingLeft: '14px',
                  borderRadius: '4px',
                  marginBottom: '2px',
                }}
              >
                {/* Satır Numarası */}
                <span
                  style={{
                    width: '45px',
                    color: line.highlight ? '#00F0FF' : 'rgba(255, 255, 255, 0.25)',
                    fontWeight: 600,
                    userSelect: 'none',
                  }}
                >
                  {line.num}
                </span>

                {/* Satır Metni (Basit Syntax Highlight) */}
                <span style={{ whiteSpace: 'pre', fontWeight: 500 }}>
                  {formatCodeLine(line.text)}
                </span>
              </div>
            );
          })}

          {/* Yanıp Sönen İmleç */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '63px', marginTop: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '28px',
                backgroundColor: cursorBlink ? '#00F0FF' : 'transparent',
                boxShadow: cursorBlink ? '0 0 10px #00F0FF' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Alt Rozetler */}
      <div
        style={{
          marginTop: '36px',
          display: 'flex',
          gap: '24px',
          opacity: windowEntrance,
        }}
      >
        <span
          style={{
            padding: '12px 24px',
            borderRadius: '999px',
            backgroundColor: 'rgba(39, 201, 63, 0.12)',
            border: '1px solid rgba(39, 201, 63, 0.4)',
            color: '#4ADE80',
            fontSize: '22px',
            fontWeight: 700,
          }}
        >
          ✓ Otomatik PKCE &amp; State Doğrulama
        </span>
        <span
          style={{
            padding: '12px 24px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00F0FF',
            fontSize: '22px',
            fontWeight: 700,
          }}
        >
          ⚡ Otomatik Yenileme (Refresh Token)
        </span>
      </div>
    </div>
  );
};

// Basit Sözdizimi Renklendirici Yardımcı Fonksiyon
function formatCodeLine(text: string): React.ReactNode {
  if (text.startsWith("import ")) {
    return (
      <>
        <span style={{ color: '#F472B6' }}>import </span>
        <span style={{ color: '#E2E8F0' }}>{'{ '}</span>
        <span style={{ color: '#00F0FF', fontWeight: 800 }}>useAuth</span>
        <span style={{ color: '#E2E8F0' }}>{' }'}</span>
        <span style={{ color: '#F472B6' }}> from </span>
        <span style={{ color: '#FBBF24' }}>&apos;@myproject/core&apos;</span>
        <span style={{ color: '#E2E8F0' }}>;</span>
      </>
    );
  }
  if (text.includes("const { loginWithOAuth2, user } = useAuth();")) {
    return (
      <>
        <span style={{ color: '#60A5FA' }}>  const </span>
        <span style={{ color: '#E2E8F0' }}>{'{ '}</span>
        <span style={{ color: '#38BDF8', fontWeight: 700 }}>loginWithOAuth2</span>
        <span style={{ color: '#E2E8F0' }}>, </span>
        <span style={{ color: '#38BDF8', fontWeight: 700 }}>user</span>
        <span style={{ color: '#E2E8F0' }}>{' } = '}</span>
        <span style={{ color: '#00F0FF', fontWeight: 800 }}>useAuth</span>
        <span style={{ color: '#E2E8F0' }}>();</span>
      </>
    );
  }
  if (text.includes("loginWithOAuth2('google')")) {
    return (
      <>
        <span style={{ color: '#E2E8F0' }}>    &lt;</span>
        <span style={{ color: '#F472B6' }}>button </span>
        <span style={{ color: '#A78BFA' }}>onClick</span>
        <span style={{ color: '#E2E8F0' }}>={'() => '}</span>
        <span style={{ color: '#38BDF8', fontWeight: 700 }}>loginWithOAuth2</span>
        <span style={{ color: '#E2E8F0' }}>(</span>
        <span style={{ color: '#FBBF24' }}>&apos;google&apos;</span>
        <span style={{ color: '#E2E8F0' }}>)&gt;</span>
      </>
    );
  }
  if (text.includes("export function")) {
    return (
      <>
        <span style={{ color: '#F472B6' }}>export function </span>
        <span style={{ color: '#60A5FA', fontWeight: 700 }}>LoginButton</span>
        <span style={{ color: '#E2E8F0' }}>() {'{'}</span>
      </>
    );
  }
  if (text.includes("if (user)")) {
    return (
      <>
        <span style={{ color: '#F472B6' }}>  if </span>
        <span style={{ color: '#E2E8F0' }}>(user) {'{'}</span>
      </>
    );
  }
  if (text.includes("return")) {
    return (
      <>
        <span style={{ color: '#F472B6' }}>  return </span>
        <span style={{ color: '#E2E8F0' }}>{text.replace('  return ', '')}</span>
      </>
    );
  }
  return <span style={{ color: '#CBD5E1' }}>{text}</span>;
}
