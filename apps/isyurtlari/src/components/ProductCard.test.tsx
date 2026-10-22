import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import ProductCard from './ProductCard';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

describe('ProductCard with Lazy Video Hover TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    // jsdom HTMLMediaElement mock
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  const mockProduct = {
    name: 'El Yapımı Sedef Kakma Sandık',
    price: 1250,
    imageUrl: '/images/sedef-sandik.jpg',
    videoUrl: '/videos/sedef-sandik.webm',
    slug: 'el-yapimi-sedef-kakma-sandik',
  };

  // 1. Durum: Başlangıçta sadece statik görsel var, video DOM'da yok
  it('1. başlangıçta sadece statik ürün görselinin render edildiğini, WebM videonun DOMda olmadığını doğrular', () => {
    render(<ProductCard {...mockProduct} data-testid="product-card" />);

    // Statik görsel DOM'da olmalı
    const image = screen.getByAltText(mockProduct.name);
    expect(image).toBeInTheDocument();

    // WebM video başlangıçta DOM'da olmamalı
    const video = screen.queryByTestId('product-card-video');
    expect(video).not.toBeInTheDocument();
  });

  // 2. Durum: onMouseEnter ile videonun Lazy Load olarak DOM'a eklenmesi ve play çağrısı
  it('2. kartın üzerine gelindiğinde (onMouseEnter) videonun DOMa eklendiğini ve otomatik oynamaya başladığını doğrular', () => {
    render(<ProductCard {...mockProduct} data-testid="product-card" />);

    const card = screen.getByTestId('product-card');

    // Fare ile kartın üzerine gel (hover)
    fireEvent.mouseEnter(card);

    // Video lazy load ile DOM'a eklenmeli
    const video = screen.getByTestId('product-card-video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', mockProduct.videoUrl);
    expect(video).toHaveProperty('autoplay', true);
    expect(video).toHaveProperty('muted', true);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  // 3. Durum: useReducedMotion aktifken hover yapılsa bile videonun hiç yüklenmemesi
  it('3. useReducedMotion aktif olduğunda kartın üzerine gelinirse bile videonun hiç yüklenmediğini doğrular', () => {
    // Hareket kısıtlaması aktif
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    render(<ProductCard {...mockProduct} data-testid="product-card" />);

    const card = screen.getByTestId('product-card');

    // Fare ile kartın üzerine gel (hover)
    fireEvent.mouseEnter(card);

    // Video asla DOM'a eklenmemeli
    const video = screen.queryByTestId('product-card-video');
    expect(video).not.toBeInTheDocument();

    // play metodu hiç çağrılmamalı
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    // Statik görsel kalmaya devam etmeli
    expect(screen.getByAltText(mockProduct.name)).toBeInTheDocument();
  });

  // 4. Durum: harvestSeason prop'u verildiğinde HarvestBadge rozetinin render edilmesi
  it('4. harvestSeason prop\'u verildiğinde hasat sezon rozetini ekranda render eder', () => {
    render(
      <ProductCard
        {...mockProduct}
        harvestSeason="taze-hasat"
        data-testid="product-card"
      />
    );

    const badge = screen.getByTestId('harvest-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Taze Hasat');
  });
});
