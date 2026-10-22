import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductDetail from './ProductDetail';

describe('ProductDetail Component TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    id: 'prod-101',
    name: 'Karakovan Balı',
    price: 450,
    imageUrl: '/images/karakovan-ambalaj.jpg',
    slug: 'karakovan-bali',
    category: 'Gıda & Arıcılık',
    description: 'Doğal floradan elde edilen saf karakovan balı.',
  };

  // 1. Test: Shared Element Transition ve m.img kullanımı
  it('1. Shared element transition için m.img üzerinde doğru layoutId ve testid bulunduğunu doğrular', () => {
    render(
      <ProductDetail
        {...baseProps}
        layoutId="product-img-karakovan-bali"
        inStock={true}
      />
    );

    const image = screen.getByTestId('product-detail-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-layoutid', 'product-img-karakovan-bali');
    expect(screen.getByText('Sepete Ekle')).toBeEnabled();
  });

  // 2. Test: storyImage sağlandığında SensorySpotlight bileşeninin render edilmesi
  it('2. storyImage prop\'u verildiğinde SensorySpotlight bileşenini veya duyusal görünüm modunu render eder', () => {
    render(
      <ProductDetail
        {...baseProps}
        storyImage="/images/karakovan-petek-hasat.jpg"
        storyBadge="Saf Karakovan Hasadı"
      />
    );

    // SensorySpotlight bileşeninin sayfada bulunması
    expect(screen.getByTestId('sensory-spotlight')).toBeInTheDocument();
    expect(screen.getByText('Saf Karakovan Hasadı')).toBeInTheDocument();
  });

  // 3. Test: inStock={false} olduğunda PreOrderTimeline bileşeninin çizilmesi
  it('3. Ürün stokta olmadığında (inStock=false) PreOrderTimeline üretim takip çizelgesini ekranda gösterir', () => {
    render(
      <ProductDetail
        {...baseProps}
        inStock={false}
        currentStepIndex={1}
        orderDate="2026-10-15T09:00:00Z"
      />
    );

    // PreOrderTimeline bileşeni ve aşamaları ekranda olmalı
    expect(screen.getByTestId('preorder-timeline-container')).toBeInTheDocument();
    expect(screen.getByText('Ön Sipariş Takibi')).toBeInTheDocument();
    expect(screen.getByText('Tedarik')).toBeInTheDocument();
  });
});
