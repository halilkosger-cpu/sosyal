import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnaSayfa from './AnaSayfa';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }));

const urun = (id: string, ad: string, slug: string, kategori: string, adet = 5) => ({
  id, name: ad, slug, price: 100, quantity: adet, imageUrl: `/urun/${slug}-800.webp`,
  category: { name: kategori, slug: kategori },
});

describe('AnaSayfa', () => {
  it('kategorileri ve urunleri sunucu verisinden cizer, mevsim filtresi calisir', () => {
    render(
      <AnaSayfa
        baslangicKategoriler={[{ id: 'k1', name: 'Gıda', slug: 'gida' }]}
        baslangicUrunler={[urun('1', 'Çam Balı', 'cam-bali', 'gida'), urun('2', 'Ahşap Kutu', 'ahsap-kutu', 'ahsap', 0)]}
        baslangicKampanyalar={[]}
      />
    );
    expect(screen.getAllByText('Gıda').length).toBeGreaterThan(0);
    const vitrin = within(document.getElementById('urunler')!);
    expect(vitrin.getByText('Çam Balı')).toBeInTheDocument();
    expect(vitrin.getByText('Ahşap Kutu')).toBeInTheDocument();

    fireEvent.click(vitrin.getByRole('tab', { name: /Ön Sipariş/i }));
    expect(vitrin.queryByText('Çam Balı')).not.toBeInTheDocument();
    expect(vitrin.getByText('Ahşap Kutu')).toBeInTheDocument();
  });
});
