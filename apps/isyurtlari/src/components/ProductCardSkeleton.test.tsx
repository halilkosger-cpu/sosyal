import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCardSkeleton, { ProductGridSkeleton } from './ProductCardSkeleton';

describe('ProductCardSkeleton & ProductGridSkeleton TDD Tests', () => {
  // 1. Durum: CLS (Cumulative Layout Shift) önleme:
  // Kart ve görsel iskeletinin gerçek ürün kartıyla birebir aynı yapı ve oranlara (h-44, rounded-2xl, flex-col) sahip olması
  it('1. iskelet kart ve görsel alanının gerçek ürün kartıyla birebir aynı boyut ve aspect-ratio oranlarına sahip olduğunu doğrular', () => {
    render(<ProductCardSkeleton data-testid="product-card-skeleton" />);

    const card = screen.getByTestId('product-card-skeleton');
    expect(card).toBeInTheDocument();

    // Kart dış yapısı: flex flex-col rounded-2xl overflow-hidden border border-gray-200
    expect(card).toHaveClass('flex', 'flex-col', 'rounded-2xl', 'overflow-hidden', 'border');

    // Görsel alanı: CLS sıfırlama için gerçek karttaki varsayılan aspect-square ve relative kapsayıcısı
    const imageSkeleton = screen.getByTestId('skeleton-image-container');
    expect(imageSkeleton).toBeInTheDocument();
    expect(imageSkeleton).toHaveClass('relative', 'aspect-square', 'w-full');

    // İçerik gövdesi: gerçek karttaki gibi p-3.5 flex flex-col flex-1
    const bodySkeleton = screen.getByTestId('skeleton-body-container');
    expect(bodySkeleton).toBeInTheDocument();
    expect(bodySkeleton).toHaveClass('p-3.5', 'flex', 'flex-col', 'flex-1');
  });

  // 2. Durum: Tailwind animate-pulse sınıfının uygulanması
  it('2. iskelet bileşenin ve görsel/metin placeholder elemanlarının animate-pulse sınıfına sahip olduğunu doğrular', () => {
    render(<ProductCardSkeleton data-testid="product-card-skeleton" />);

    const card = screen.getByTestId('product-card-skeleton');
    // Kart genelinde veya placeholder elemanlarında animate-pulse olmalı
    expect(card).toHaveClass('animate-pulse');

    const imageSkeleton = screen.getByTestId('skeleton-image-container');
    expect(imageSkeleton).toHaveClass('bg-gray-200');
  });

  // 3. Durum: ProductGridSkeleton'ın belirtilen adet kadar kart render etmesi ve grid yapısı
  it('3. ProductGridSkeleton bileşeninin belirtilen count kadar iskelet kartı doğru responsive grid sınıflarıyla render ettiğini doğrular', () => {
    render(<ProductGridSkeleton count={6} data-testid="product-grid-skeleton" />);

    const grid = screen.getByTestId('product-grid-skeleton');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid');

    const cards = screen.getAllByTestId('product-card-skeleton');
    expect(cards).toHaveLength(6);
  });
});
