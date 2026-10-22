import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import ProductGrid from './ProductGrid';
import { ProductCardProps } from './ProductCard';

// Framer motion spy / mock
const animatePresenceSpy = vi.fn();

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    AnimatePresence: vi.fn((props: any) => {
      animatePresenceSpy(props);
      return <actual.AnimatePresence {...props} />;
    }),
  };
});

describe('ProductGrid Framer Motion Layout Animation TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProducts: ProductCardProps[] = [
    {
      id: 'prod-1',
      name: 'Sedef Kakma Sandık',
      price: 1500,
      imageUrl: '/images/sandik.jpg',
      slug: 'sedef-sandik',
    },
    {
      id: 'prod-2',
      name: 'Deri Evrak Çantası',
      price: 850,
      imageUrl: '/images/canta.jpg',
      slug: 'deri-canta',
    },
    {
      id: 'prod-3',
      name: 'Bakır Cezve Seti',
      price: 450,
      imageUrl: '/images/cezve.jpg',
      slug: 'bakir-cezve',
    },
  ];

  // 1. Test: Bileşenin 'AnimatePresence' kullandığını ve hızlı filtreleme için 'popLayout' modunda olduğunu doğrula
  it('1. bileşenin AnimatePresence kullandığını ve popLayout moduyla animasyon çakışmalarını önlediğini doğrular', () => {
    render(<ProductGrid products={mockProducts} data-testid="product-grid" />);

    const grid = screen.getByTestId('product-grid');
    expect(grid).toBeInTheDocument();

    // AnimatePresence'in çağrıldığını doğrula
    expect(animatePresenceSpy).toHaveBeenCalled();
    const lastCallProps = animatePresenceSpy.mock.calls[0][0];

    // Hızlı filtrelemelerde elemanların üst üste binmesini/çakışmasını önleyen 'popLayout' modu aktif olmalı
    expect(lastCallProps.mode).toBe('popLayout');
    expect(grid).toHaveAttribute('data-presence-mode', 'popLayout');

    // 3 ürünün de DOM'da olduğunu doğrula
    expect(screen.getByText('Sedef Kakma Sandık')).toBeInTheDocument();
    expect(screen.getByText('Deri Evrak Çantası')).toBeInTheDocument();
    expect(screen.getByText('Bakır Cezve Seti')).toBeInTheDocument();
  });

  // 2. Test: Filtreleme yapıldığında çıkan elemanların 'exit' prop'unu, kalan elemanların ise 'layout' prop'unu tetiklediğini doğrula
  it('2. ürün dizisi filtrelendiğinde çıkan elemanların exit propunu, kalan elemanların layout propunu tetiklediğini doğrular', () => {
    const { rerender } = render(<ProductGrid products={mockProducts} data-testid="product-grid" />);

    // Başlangıçta tüm elemanlar 'layout' ve 'exit' proplarını taşır
    const item1Before = screen.getByTestId('product-grid-item-prod-1');
    const item2Before = screen.getByTestId('product-grid-item-prod-2');
    const item3Before = screen.getByTestId('product-grid-item-prod-3');

    expect(item1Before).toHaveAttribute('data-layout', 'true');
    expect(item2Before).toHaveAttribute('data-layout', 'true');
    expect(item3Before).toHaveAttribute('data-layout', 'true');

    expect(item1Before).toHaveAttribute('data-has-exit', 'true');
    expect(item2Before).toHaveAttribute('data-has-exit', 'true');
    expect(item3Before).toHaveAttribute('data-has-exit', 'true');

    // Filtreleme: 'prod-2' diziden çıkarılıyor (çıkan eleman: prod-2, kalanlar: prod-1, prod-3)
    const filteredProducts = [mockProducts[0], mockProducts[2]];

    act(() => {
      rerender(<ProductGrid products={filteredProducts} data-testid="product-grid" />);
    });

    // 2.a: Kalan elemanlar (prod-1 ve prod-3) layout prop'unu korur ve yeni konuma pürüzsüz animasyonla kayar
    const item1After = screen.getByTestId('product-grid-item-prod-1');
    const item3After = screen.getByTestId('product-grid-item-prod-3');

    expect(item1After).toBeInTheDocument();
    expect(item1After).toHaveAttribute('data-layout', 'true');
    expect(item3After).toBeInTheDocument();
    expect(item3After).toHaveAttribute('data-layout', 'true');

    // 2.b: Çıkan eleman (prod-2) AnimatePresence içinde exit animasyonu tetiklenmiş olarak bulunur
    const exitingItem2 = screen.getByTestId('product-grid-item-prod-2');
    expect(exitingItem2).toBeInTheDocument();
    expect(exitingItem2).toHaveAttribute('data-has-exit', 'true');

    // Exit varyantının opacity: 0 ve scale/y animasyonu içerdiğini doğrula
    const exitVariantAttr = exitingItem2.getAttribute('data-exit-variants');
    expect(exitVariantAttr).toBeTruthy();
    const exitVariants = JSON.parse(exitVariantAttr || '{}');
    expect(exitVariants.opacity).toBe(0);
  });
});
