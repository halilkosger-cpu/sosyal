import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProductCard from './ProductCard';
import ProductGrid from './ProductGrid';
import ProductCardSkeleton from './ProductCardSkeleton';

describe('Core Web Vitals Optimization TDD Tests (CLS, LCP & Video Debounce)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: 'test-1',
    name: 'El Yapımı Çini Vazo',
    price: 750,
    imageUrl: '/images/vazo.jpg',
    videoUrl: '/videos/vazo.webm',
    slug: 'el-yapimi-cini-vazo',
  };

  // 1. CLS Optimizasyonu: İskelet kartın görsel alanının gerçek ProductCard ile 1:1 aspect-square eşleşmesi
  it('1. CLS Optimizasyonu: ProductCardSkeleton görsel alanının aspect-square sınıfı ile layout shift sıfırladığını doğrular', () => {
    render(<ProductCardSkeleton data-testid="product-card-skeleton" />);

    const skeletonImg = screen.getByTestId('skeleton-image-container');
    expect(skeletonImg).toBeInTheDocument();
    // CLS sıfırlama için 1:1 aspect-square oranı uygulanmalı
    expect(skeletonImg).toHaveClass('aspect-square', 'w-full');
  });

  // 2. LCP Optimizasyonu: ProductCard priority prop'u ile fetchPriority="high" ve loading="eager" uygulanması
  it('2. LCP Optimizasyonu: priority=true olduğunda görselin fetchPriority="high" ve loading="eager" aldığını doğrular', () => {
    const { rerender } = render(
      <ProductCard {...mockProduct} priority={true} data-testid="product-card-lcp" />
    );

    const imageWithPriority = screen.getByAltText(mockProduct.name);
    expect(imageWithPriority).toHaveAttribute('data-priority', 'true');
    expect(imageWithPriority).toHaveAttribute('loading', 'eager');
    expect(imageWithPriority).toHaveAttribute('fetchpriority', 'high');

    // priority=false olduğunda lazy ve auto olmalı
    rerender(<ProductCard {...mockProduct} priority={false} data-testid="product-card-lcp" />);
    const imageWithoutPriority = screen.getByAltText(mockProduct.name);
    expect(imageWithoutPriority).toHaveAttribute('data-priority', 'false');
    expect(imageWithoutPriority).toHaveAttribute('loading', 'lazy');
  });

  // 3. LCP Optimizasyonu: ProductGrid ilk 4 elemana otomatik priority=true ataması
  it('3. LCP Optimizasyonu: ProductGrid ilk priorityFirstCount (4) karta otomatik priority atayıp sonrakilere lazy atadığını doğrular', () => {
    const productsList = Array.from({ length: 6 }).map((_, idx) => ({
      id: `p-${idx + 1}`,
      name: `Ürün ${idx + 1}`,
      price: 100 * (idx + 1),
      imageUrl: `/images/p-${idx + 1}.jpg`,
      slug: `urun-${idx + 1}`,
    }));

    render(<ProductGrid products={productsList} priorityFirstCount={4} data-testid="grid-lcp" />);

    // İlk 4 ürün (above the fold) priority almalı
    for (let i = 1; i <= 4; i++) {
      const img = screen.getByAltText(`Ürün ${i}`);
      expect(img).toHaveAttribute('data-priority', 'true');
      expect(img).toHaveAttribute('loading', 'eager');
    }

    // 5. ve 6. ürünler lazy olmalı
    const img5 = screen.getByAltText('Ürün 5');
    const img6 = screen.getByAltText('Ürün 6');
    expect(img5).toHaveAttribute('data-priority', 'false');
    expect(img5).toHaveAttribute('loading', 'lazy');
    expect(img6).toHaveAttribute('data-priority', 'false');
    expect(img6).toHaveAttribute('loading', 'lazy');
  });

  // 4. Video Debounce Optimizasyonu: Hızlı fare geçişlerinde (hover spamming) video yüklenmemesi
  describe('Video Debounce Testleri', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('4. Video Debounce: 150ms dolmadan fareden çıkılırsa video yüklenmez, 150ms üzerinde kalınırsa lazy yüklenir', () => {
      render(
        <ProductCard
          {...mockProduct}
          hoverDelay={150}
          data-testid="product-card-debounce"
        />
      );

      const card = screen.getByTestId('product-card-debounce');

      // 4.a: Farenin kart üzerine gelip 80ms sonra hızla çıkması (hover spamming simülasyonu)
      fireEvent.mouseEnter(card);
      act(() => {
        vi.advanceTimersByTime(80);
      });
      fireEvent.mouseLeave(card);
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Video DOM'a ASLA eklenmemeli
      expect(screen.queryByTestId('product-card-video')).not.toBeInTheDocument();

      // 4.b: Farenin kart üzerinde 150ms'den uzun kalması (bilinçli hover)
      fireEvent.mouseEnter(card);
      expect(screen.queryByTestId('product-card-video')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // 150ms dolunca video DOM'a eklenmeli
      expect(screen.getByTestId('product-card-video')).toBeInTheDocument();
    });
  });
});
