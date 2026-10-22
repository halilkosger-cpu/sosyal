import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import SensorySpotlight from './SensorySpotlight';

// Mock framer-motion useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

describe('SensorySpotlight Component TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    // Varsayılan: Masaüstü (pointer: fine)
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const mockImages = {
    packageImage: '/images/bal-kavanoz-ambalaj.jpg',
    storyImage: '/images/bal-hasat-petek.jpg',
    packageAlt: 'Karakovan Balı Dış Ambalaj',
    storyAlt: 'Karakovan Balı Doğal Petek Hasadı',
  };

  // 1. Test: Dış ambalaj ve iç doku/hasat katmanlarının üst üste absolute olarak konumlanması
  it('1. packageImage ve storyImage katmanlarını absolute position ile üst üste bindirir', () => {
    render(
      <SensorySpotlight
        {...mockImages}
        data-testid="sensory-spotlight"
      />
    );

    const container = screen.getByTestId('sensory-spotlight');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('relative');

    const packageImg = screen.getByAltText(mockImages.packageAlt);
    const storyImg = screen.getByAltText(mockImages.storyAlt);

    expect(packageImg).toBeInTheDocument();
    expect(storyImg).toBeInTheDocument();

    // İki görsel de absolute kapsayıcı içinde üst üste tam oturmalı
    expect(packageImg.parentElement).toHaveClass('absolute', 'inset-0');
    expect(storyImg.parentElement).toHaveClass('absolute', 'inset-0');
  });

  // 2. Test: Fare hareketinde (onMouseMove) koordinatların spring physics ile mask merkezine aktarılması
  it('2. fare hareketinde X ve Y koordinatlarını pürüzsüz yay fiziğiyle maske koordinatlarına yansıtır', () => {
    render(
      <SensorySpotlight
        {...mockImages}
        data-testid="sensory-spotlight"
      />
    );

    const container = screen.getByTestId('sensory-spotlight');

    container.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 50,
      top: 50,
      width: 400,
      height: 400,
      right: 450,
      bottom: 450,
      x: 50,
      y: 50,
      toJSON: () => {},
    });

    // Farenin container üzerinde (200, 200) noktasına gelmesi (relative: 150, 150)
    fireEvent.mouseEnter(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });

    const maskLayer = screen.getByTestId('sensory-mask-layer');
    expect(maskLayer).toBeInTheDocument();
    expect(maskLayer).toHaveAttribute('data-spotlight-active', 'true');
    expect(maskLayer).toHaveAttribute('data-mask-x', '150');
    expect(maskLayer).toHaveAttribute('data-mask-y', '150');

    // Fare ayrıldığında aktifliğin kapanması
    fireEvent.mouseLeave(container);
    expect(maskLayer).toHaveAttribute('data-spotlight-active', 'false');
  });

  // 3. Test: ERİŞİLEBİLİRLİK VE MOBİL - useReducedMotion veya pointer: coarse durumunda statik alternatif düzen
  it('3. useReducedMotion veya pointer: coarse aktifse maskelemeyi iptal edip şık alternatif statik düzen sunar', () => {
    // 3.a: useReducedMotion = true
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    const { rerender } = render(
      <SensorySpotlight
        {...mockImages}
        data-testid="sensory-spotlight"
      />
    );

    const fallbackView = screen.getByTestId('sensory-fallback-view');
    expect(fallbackView).toBeInTheDocument();
    expect(fallbackView).toHaveAttribute('data-fallback-mode', 'static');

    // Maskeleme katmanı render edilmemeli
    expect(screen.queryByTestId('sensory-mask-layer')).not.toBeInTheDocument();

    // 3.b: Mobil / Dokunmatik (pointer: coarse)
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    rerender(
      <SensorySpotlight
        {...mockImages}
        data-testid="sensory-spotlight"
      />
    );

    expect(screen.getByTestId('sensory-fallback-view')).toBeInTheDocument();
    expect(screen.queryByTestId('sensory-mask-layer')).not.toBeInTheDocument();
  });
});
