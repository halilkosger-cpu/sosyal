import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import ActiveStageIcon from './ActiveStageIcon';

// Framer motion modülü için spy / mock
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

describe('ActiveStageIcon TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Varsayılan: Animasyonlar açık (useReducedMotion = false)
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  // 1. Durum: isActive ve effectType proplarının DOM'a doğru yansıması
  it('1. isActive ve effectType proplarını doğru şekilde DOM özniteliklerine yansıtır', () => {
    render(
      <ActiveStageIcon isActive={true} effectType="shake" data-testid="active-icon-wrapper">
        <span>İkon</span>
      </ActiveStageIcon>
    );

    const wrapper = screen.getByTestId('active-icon-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('data-is-active', 'true');
    expect(wrapper).toHaveAttribute('data-effect-type', 'shake');
  });

  // 2. Durum: isActive true olduğunda animate prop'una 'active' durumunun tetiklenmesi
  it('2. isActive true olduğunda Framer Motion animate durumunun "active" olarak tetiklendiğini doğrular', () => {
    render(
      <ActiveStageIcon isActive={true} effectType="pulse" data-testid="active-icon-wrapper">
        <span>Aktif İkon</span>
      </ActiveStageIcon>
    );

    const wrapper = screen.getByTestId('active-icon-wrapper');
    expect(wrapper).toHaveAttribute('data-animate-state', 'active');
  });

  // 3. Durum: ERİŞİLEBİLİRLİK (prefers-reduced-motion: reduce)
  it('3. useReducedMotion true olduğunda isActive true olsa bile animate durumunu "inactive" olarak zorlar', () => {
    // Kullanıcının işletim sisteminde animasyonlar kapalı
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    render(
      <ActiveStageIcon isActive={true} effectType="pulse" data-testid="active-icon-wrapper">
        <span>Erişilebilir İkon</span>
      </ActiveStageIcon>
    );

    const wrapper = screen.getByTestId('active-icon-wrapper');
    // Animasyon kapalıysa zorunlu olarak inactive olmalı
    expect(wrapper).toHaveAttribute('data-animate-state', 'inactive');
  });

  // 4. Durum: Yalnızca effectType='pulse' ve isActive=true iken glow (parlama) katmanının render edilmesi
  it('4. yalnızca effectType="pulse" ve isActive=true olduğunda glow (parlama) katmanının render edildiğini doğrular', () => {
    // 4.a: pulse + isActive=true -> Glow render EDİLMELİ
    const { rerender } = render(
      <ActiveStageIcon isActive={true} effectType="pulse" data-testid="active-icon-wrapper">
        <span>Pulse İkon</span>
      </ActiveStageIcon>
    );
    expect(screen.getByTestId('active-stage-glow')).toBeInTheDocument();

    // 4.b: shake + isActive=true -> Glow render EDİLMEMELİ
    rerender(
      <ActiveStageIcon isActive={true} effectType="shake" data-testid="active-icon-wrapper">
        <span>Shake İkon</span>
      </ActiveStageIcon>
    );
    expect(screen.queryByTestId('active-stage-glow')).not.toBeInTheDocument();

    // 4.c: pulse + isActive=false -> Glow render EDİLMEMELİ
    rerender(
      <ActiveStageIcon isActive={false} effectType="pulse" data-testid="active-icon-wrapper">
        <span>Pasif İkon</span>
      </ActiveStageIcon>
    );
    expect(screen.queryByTestId('active-stage-glow')).not.toBeInTheDocument();
  });
});
