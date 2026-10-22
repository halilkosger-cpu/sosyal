import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkshopDeliveryCommitment from './WorkshopDeliveryCommitment';

describe('WorkshopDeliveryCommitment Component (TDD)', () => {
  const mockItems = [
    {
      id: 'item-1',
      name: 'Sedef Kakma Ceviz Sandık',
      quantity: 1,
      price: 1850,
      slug: 'sedef-sandik',
    },
    {
      id: 'item-2',
      name: 'Eğirdir Organik Elma Sirkesi',
      quantity: 2,
      price: 95,
      slug: 'elma-sirkesi',
    },
  ];

  it('1. atölye teslimat taahhüdü başlığını ve tahmini kargo gün aralığını render eder', () => {
    render(<WorkshopDeliveryCommitment items={mockItems} />);

    expect(screen.getByText(/atölye teslimat taahhüdü/i)).toBeInTheDocument();
    expect(screen.getByText(/3\s*-\s*6\s*[iİ]ş\s*günü/i)).toBeInTheDocument();
  });

  it('2. el emeği ve taze hasat üretim güvencesi maddelerini listeler', () => {
    render(<WorkshopDeliveryCommitment items={mockItems} />);

    expect(screen.getByText(/atölye üretimi & taze hazırlık/i)).toBeInTheDocument();
    expect(screen.getByText(/hijyenik korumalı paketleme/i)).toBeInTheDocument();
    expect(screen.getByText(/adım adım canlı takip/i)).toBeInTheDocument();
  });

  it('3. boş sepet verildiğinde null döner veya sessizce render etmez', () => {
    const { container } = render(<WorkshopDeliveryCommitment items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
