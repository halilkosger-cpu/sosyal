import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as framerMotion from 'framer-motion';
import ProductGrid from './ProductGrid';
import type { ProductCardProps } from './ProductCard';

// Framer Motion spy
const lazyMotionSpy = vi.fn();

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    LazyMotion: vi.fn((props: any) => {
      lazyMotionSpy(props);
      return <actual.LazyMotion {...props} />;
    }),
  };
});

describe('ProductGrid & ProductCard LazyMotion (m.div) Refactoring TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProducts: ProductCardProps[] = [
    {
      id: 'p1',
      name: 'Sedef Sandık',
      price: 1500,
      imageUrl: '/images/sandik.jpg',
      slug: 'sedef-sandik',
      layoutId: 'product-img-p1',
    },
    {
      id: 'p2',
      name: 'Deri Çanta',
      price: 850,
      imageUrl: '/images/canta.jpg',
      slug: 'deri-canta',
      layoutId: 'product-img-p2',
    },
  ];

  // 1. Durum: Bileşenlerde artık 'motion.div' veya 'motion.img' KULLANILMADIĞINI,
  // bunun yerine hafif 'm.div' ve 'm.img' bileşenlerinin kullanıldığını statik olarak doğrula
  it('1. kaynak kodlarda motion.div/motion.img yerine optimize edilmiş m.div ve m.img kullanıldığını doğrular', () => {
    const productGridPath = path.resolve(__dirname, 'ProductGrid.tsx');
    const productCardPath = path.resolve(__dirname, 'ProductCard.tsx');

    const productGridSource = fs.readFileSync(productGridPath, 'utf8');
    const productCardSource = fs.readFileSync(productCardPath, 'utf8');

    // ProductGrid kontrolleri:
    expect(productGridSource).not.toMatch(/motion\.div/);
    expect(productGridSource).toMatch(/m\.div/);

    // ProductCard kontrolleri:
    expect(productCardSource).not.toMatch(/motion\.img/);
    expect(productCardSource).not.toMatch(/motion\.div/);
    expect(productCardSource).toMatch(/m\.img/);
  });

  // 2. Durum: Bileşen ağacında '<LazyMotion features={domAnimation} strict>' sarmalayıcısının varlığını doğrula
  it('2. bileşen ağacının kökünde LazyMotion sarmalayıcısının features ve strict={true} ile render edildiğini doğrular', () => {
    render(<ProductGrid products={mockProducts} data-testid="lazy-product-grid" />);

    expect(lazyMotionSpy).toHaveBeenCalled();
    const lazyProps = lazyMotionSpy.mock.calls[0][0];

    // strict modun ve features (domAnimation) özelliğinin sağlandığını doğrula
    expect(lazyProps.strict).toBe(true);
    expect(lazyProps.features).toBeDefined();

    const grid = screen.getByTestId('lazy-product-grid');
    expect(grid).toBeInTheDocument();
  });

  // 3. Durum: Filtreleme (layout) ve paylaşılan eleman (layoutId) animasyonlarının m.div/m.img mimarisinde de eksiksiz çalıştığını doğrula
  it('3. filtreleme (layout) ve paylaşılan eleman (layoutId) animasyonlarının m mimarisinde kırılmadan çalıştığını doğrular', () => {
    const { rerender } = render(
      <ProductGrid products={mockProducts} data-testid="lazy-product-grid" />
    );

    // İlk durum: İki ürün de render edilmiş ve m.img layoutId'ye sahip
    const card1Img = screen.getByAltText('Sedef Sandık');
    expect(card1Img).toHaveAttribute('data-layoutid', 'product-img-p1');

    const card2Img = screen.getByAltText('Deri Çanta');
    expect(card2Img).toHaveAttribute('data-layoutid', 'product-img-p2');

    // Filtreleme: p2 diziden çıkarılıyor
    act(() => {
      rerender(<ProductGrid products={[mockProducts[0]]} data-testid="lazy-product-grid" />);
    });

    // Kalan ürün (p1) layout prop'unu korur
    const remainingItem = screen.getByTestId('product-grid-item-p1');
    expect(remainingItem).toHaveAttribute('data-layout', 'true');

    // Çıkan ürün (p2) AnimatePresence içinde exit prop'unu tetikler
    const exitingItem = screen.getByTestId('product-grid-item-p2');
    expect(exitingItem).toHaveAttribute('data-has-exit', 'true');
  });
});
