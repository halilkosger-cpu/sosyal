import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import MagneticButton from './MagneticButton';

// Mock framer-motion useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

describe('MagneticButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  // 2. Test: MagneticButton hover anında getBoundingClientRect ile merkez noktasını hesaplar ve imlece iletir
  it('2. MagneticButton üzerine gelindiğinde getBoundingClientRect ile merkezini hesaplar ve manyetik veriyi iletir', () => {
    const onMagneticHoverSpy = vi.fn();

    render(
      <MagneticButton
        data-testid="magnetic-button"
        onMagneticHover={onMagneticHoverSpy}
      >
        Manyetik İncele
      </MagneticButton>
    );

    const button = screen.getByTestId('magnetic-button');
    expect(button).toBeInTheDocument();

    // getBoundingClientRect mock
    const mockRect = {
      left: 100,
      top: 200,
      width: 150,
      height: 50,
      right: 250,
      bottom: 250,
      x: 100,
      y: 200,
      toJSON: () => {},
    };
    button.getBoundingClientRect = vi.fn().mockReturnValue(mockRect);

    // Fareyle butonun üzerine gelinir (onMouseEnter & onMouseMove)
    fireEvent.mouseEnter(button, { clientX: 175, clientY: 225 });

    // getBoundingClientRect'in çağrıldığını doğrula
    expect(button.getBoundingClientRect).toHaveBeenCalled();

    // Merkez noktası: left + width/2 = 175, top + height/2 = 225
    expect(onMagneticHoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        centerX: 175,
        centerY: 225,
        isHovered: true,
      })
    );
  });

  // 3. Test: ERİŞİLEBİLİRLİK - useReducedMotion aktifse manyetik çekim devre dışı kalır
  it('3. useReducedMotion aktif olduğunda manyetik çekim efektinin devre dışı kaldığını doğrular', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
    const onMagneticHoverSpy = vi.fn();

    render(
      <MagneticButton
        data-testid="magnetic-button"
        onMagneticHover={onMagneticHoverSpy}
      >
        Erişilebilir Buton
      </MagneticButton>
    );

    const button = screen.getByTestId('magnetic-button');

    fireEvent.mouseEnter(button, { clientX: 120, clientY: 180 });

    // Manyetik efekt devre dışı olduğu için data-magnetic-disabled veya yer değiştirmenin 0 olduğunu doğrula
    expect(button).toHaveAttribute('data-reduced-motion', 'true');
    expect(button).toHaveAttribute('data-magnetic-active', 'false');
  });
});
