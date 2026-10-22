import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import HarvestFilter from './HarvestFilter';

// Mock framer-motion useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

describe('HarvestFilter & HarvestBadge TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  // 1. Test: Filtre butonlarının (Tümü, Taze Hasat, Ön Sipariş, Dört Mevsim Zanaat) doğru render edilmesi
  it('1. 4 farklı hasat ve sezonluk filtre butonunu doğru etiketlerle render eder', () => {
    const handleFilterChange = vi.fn();

    render(
      <HarvestFilter
        activeSeason="tumu"
        onSeasonChange={handleFilterChange}
        data-testid="harvest-filter"
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tüm ürünler/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /taze hasat/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /yeni sezon ön sipariş/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dört mevsim atölye/i })).toBeInTheDocument();
  });

  // 2. Test: Filtre seçildiğinde onSeasonChange geri çağrımının doğru filtre tipiyle tetiklenmesi
  it('2. kullanıcı bir filtre sekmesine tıkladığında onSeasonChange fonksiyonunu seçilen sezon ile tetikler', () => {
    const handleFilterChange = vi.fn();

    render(
      <HarvestFilter
        activeSeason="tumu"
        onSeasonChange={handleFilterChange}
      />
    );

    const tazeHasatTab = screen.getByRole('tab', { name: /taze hasat/i });
    fireEvent.click(tazeHasatTab);

    expect(handleFilterChange).toHaveBeenCalledTimes(1);
    expect(handleFilterChange).toHaveBeenCalledWith('taze-hasat');
  });

  // 3. Test: Seçili sekmede aria-selected="true" ve Framer Motion layoutId animasyon belirteci bulunması
  it('3. seçili sekmede aria-selected="true" ve layoutId belirtecinin aktif olduğunu doğrular', () => {
    render(
      <HarvestFilter
        activeSeason="on-siparis"
        onSeasonChange={vi.fn()}
      />
    );

    const onSiparisTab = screen.getByRole('tab', { name: /yeni sezon ön sipariş/i });
    expect(onSiparisTab).toHaveAttribute('aria-selected', 'true');

    const tumuTab = screen.getByRole('tab', { name: /tüm ürünler/i });
    expect(tumuTab).toHaveAttribute('aria-selected', 'false');

    // Aktif arka plan belirteci (pill)
    const activeIndicator = screen.getByTestId('active-harvest-pill');
    expect(activeIndicator).toBeInTheDocument();
  });

  // 4. Test: useReducedMotion aktifken animasyon süresinin veya yay geçişinin güvenli olması
  it('4. useReducedMotion aktif olduğunda animasyonun devre dışı kaldığını ve layout geçişinin statik çalıştığını doğrular', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    render(
      <HarvestFilter
        activeSeason="taze-hasat"
        onSeasonChange={vi.fn()}
      />
    );

    const container = screen.getByTestId('harvest-filter-container');
    expect(container).toHaveAttribute('data-reduced-motion', 'true');
  });
});
