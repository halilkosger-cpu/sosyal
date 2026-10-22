import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PreOrderTimeline from './PreOrderTimeline';

describe('PreOrderTimeline UI & Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Durum: 5 aşamanın isimlerinin ekranda doğru render edilmesi
  it('1. 5 aşamanın (Sipariş Alındı, Tedarik, Kalite Kontrol, Kargo, Teslimat) ekranda doğru render edildiğini doğrular', () => {
    render(
      <PreOrderTimeline
        currentStepIndex={1}
        orderDate="2026-10-01T10:00:00Z"
      />
    );

    expect(screen.getByText('Sipariş Alındı')).toBeInTheDocument();
    expect(screen.getByText('Tedarik')).toBeInTheDocument();
    expect(screen.getByText('Kalite Kontrol')).toBeInTheDocument();
    expect(screen.getByText('Kargo')).toBeInTheDocument();
    expect(screen.getByText('Teslimat')).toBeInTheDocument();
  });

  // 2. Durum: Seçili aşamaya göre progress bar genişlik (%) hesabı
  it('2. seçili aşamaya göre motion.div ilerleme çubuğunun genişlik (% width) değerini doğru hesaplar', () => {
    // 5 aşama için:
    // index 0 -> %0
    // index 2 -> %50
    // index 4 -> %100
    const { rerender } = render(
      <PreOrderTimeline
        currentStepIndex={0}
        orderDate="2026-10-01T10:00:00Z"
      />
    );

    let progressBar = screen.getByTestId('preorder-progress-bar');
    expect(progressBar).toHaveAttribute('data-progress-percent', '0%');

    // 2. index: %50
    rerender(
      <PreOrderTimeline
        currentStepIndex={2}
        orderDate="2026-10-01T10:00:00Z"
      />
    );
    progressBar = screen.getByTestId('preorder-progress-bar');
    expect(progressBar).toHaveAttribute('data-progress-percent', '50%');

    // 4. index: %100 (Teslimat tamamlandı)
    rerender(
      <PreOrderTimeline
        currentStepIndex={4}
        orderDate="2026-10-01T10:00:00Z"
      />
    );
    progressBar = screen.getByTestId('preorder-progress-bar');
    expect(progressBar).toHaveAttribute('data-progress-percent', '100%');
  });

  // 3. Durum: prefers-reduced-motion aktifken animasyonların devre dışı kalması
  it('3. prefers-reduced-motion aktif olduğunda animasyonların devre dışı kaldığını (duration: 0) doğrular', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <PreOrderTimeline
        currentStepIndex={2}
        orderDate="2026-10-01T10:00:00Z"
      />
    );

    const timelineContainer = screen.getByTestId('preorder-timeline-container');
    expect(timelineContainer).toHaveAttribute('data-reduced-motion', 'true');

    const progressBar = screen.getByTestId('preorder-progress-bar');
    expect(progressBar).toHaveAttribute('data-transition-duration', '0');
  });
});
