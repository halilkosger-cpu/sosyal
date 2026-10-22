import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KargoTakipModal from './KargoTakipModal';
import UrunKarti from './UrunKarti';

describe('KargoTakipModal and PreOrderTimeline Integration Tests', () => {
  it('renders trigger button and opens modal with tracking interface', () => {
    render(<KargoTakipModal />);

    // Trigger button should be rendered
    const trigger = screen.getByRole('button', { name: /kargom nerede\?/i });
    expect(trigger).toBeInTheDocument();

    // Click trigger
    fireEvent.click(trigger);

    // Modal title should be present
    expect(screen.getByText('Hızlı Sipariş ve Gönderi Sorgulama')).toBeInTheDocument();
  });

  it('renders HarvestBadge in UrunKarti when harvestSeason is passed', () => {
    const mockUrun = {
      id: 'prod-1',
      name: 'Eğirdir Elması ve Organik Bal',
      slug: 'egirdir-elmasi-bal',
      price: 180,
      quantity: 10,
    };

    render(
      <UrunKarti
        urun={mockUrun}
        harvestSeason="taze-hasat"
      />
    );

    const badge = screen.getByTestId('harvest-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Taze Hasat');
  });

  it('renders on-siparis PreOrderBadge in UrunKarti when quantity is 0', () => {
    const mockUrun = {
      id: 'prod-2',
      name: 'Yeni Sezon Zeytinyağı',
      slug: 'yeni-sezon-zeytinyagi',
      price: 450,
      quantity: 0,
    };

    render(
      <UrunKarti
        urun={mockUrun}
        harvestSeason="on-siparis"
      />
    );

    // When quantity is 0, PreOrderBadge is rendered in overlay
    expect(screen.getByText(/ön talep/i)).toBeInTheDocument();
  });
});
