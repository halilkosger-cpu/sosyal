import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPreOrdersPage from './page';

// Mock global fetch
const mockPreOrders = [
  {
    id: 'pre-1',
    quantity: 2,
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '05551112233',
    note: '[AŞAMA: 2] Sedef kakma işçiliği devam ediyor',
    status: 'WAITING',
    notifiedAt: null,
    createdAt: '2026-10-15T10:00:00Z',
    product: {
      id: 'prod-101',
      name: 'Sedef Kakma Ceviz Sandık',
      slug: 'sedef-kakma-ceviz-sandik',
      quantity: 0,
    },
  },
];

const mockSummary = [
  {
    productId: 'prod-101',
    productName: 'Sedef Kakma Ceviz Sandık',
    productSlug: 'sedef-kakma-ceviz-sandik',
    currentStock: 0,
    waitingCount: 1,
    totalQuantity: 2,
  },
];

describe('AdminPreOrdersPage with Workshop Production Stages (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/api/admin/preorders')) {
        if (init?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ preOrders: mockPreOrders, summary: mockSummary }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('1. ön talepleri ve ürün başlıklarını doğru listeler', async () => {
    render(<AdminPreOrdersPage />);

    expect(screen.getByText('Yükleniyor…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Yükleniyor…')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('Sedef Kakma Ceviz Sandık')[0]).toBeInTheDocument();
    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('ahmet@example.com')).toBeInTheDocument();
  });

  it('2. atölye üretim aşaması göstergesini (stepper / timeline) kartta gösterir', async () => {
    render(<AdminPreOrdersPage />);

    await waitFor(() => {
      expect(screen.queryByText('Yükleniyor…')).not.toBeInTheDocument();
    });

    // Aşama seçici veya aşama etiketi bulunmalı
    const stageSelector = screen.getByLabelText(/üretim aşaması/i);
    expect(stageSelector).toBeInTheDocument();
    expect(stageSelector).toHaveValue('2');
  });

  it('3. aşama değiştirildiğinde PATCH isteği ile günceller', async () => {
    render(<AdminPreOrdersPage />);

    await waitFor(() => {
      expect(screen.queryByText('Yükleniyor…')).not.toBeInTheDocument();
    });

    const stageSelector = screen.getByLabelText(/üretim aşaması/i);
    fireEvent.change(stageSelector, { target: { value: '3' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/preorders',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"stage":3'),
        })
      );
    });
  });

  it('4. aşama bildirim butonuna tıklandığında stage-notify endpointine istek atar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminPreOrdersPage />);

    await waitFor(() => {
      expect(screen.queryByText('Yükleniyor…')).not.toBeInTheDocument();
    });

    const notifyBtn = screen.getByRole('button', { name: /aşama bildirimi gönder/i });
    expect(notifyBtn).toBeInTheDocument();

    fireEvent.click(notifyBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/preorders/stage-notify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"preOrderId":"pre-1"'),
        })
      );
    });
  });
});
