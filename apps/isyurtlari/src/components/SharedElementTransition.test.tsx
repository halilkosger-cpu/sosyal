import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCard from './ProductCard';
import ProductDetail from './ProductDetail';
import Template from '../app/template';

describe('Shared Element Transition (layoutId) TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: '123',
    name: 'El Yapımı Deri Defter',
    price: 350,
    imageUrl: '/images/deri-defter.jpg',
    slug: 'el-yapimi-deri-defter',
  };

  // 1. Test: Her iki bileşendeki motion.img elemanlarının dışarıdan gelen aynı benzersiz 'layoutId' değerini aldığını doğrula
  it('1. ProductCard ve ProductDetail bileşenlerindeki motion.img elemanlarının aynı benzersiz layoutId değerini aldığını doğrular', () => {
    const sharedLayoutId = 'product-img-123';

    // 1.a: Ürün Listesi Kartı (ProductCard)
    const { unmount } = render(
      <ProductCard
        {...mockProduct}
        layoutId={sharedLayoutId}
        data-testid="product-card"
      />
    );

    const cardImage = screen.getByAltText(mockProduct.name);
    expect(cardImage).toBeInTheDocument();
    expect(cardImage).toHaveAttribute('data-layoutid', sharedLayoutId);

    unmount();

    // 1.b: Ürün Detay Sayfası (ProductDetail)
    render(
      <ProductDetail
        {...mockProduct}
        layoutId={sharedLayoutId}
        data-testid="product-detail"
      />
    );

    const detailImage = screen.getByAltText(mockProduct.name);
    expect(detailImage).toBeInTheDocument();
    expect(detailImage).toHaveAttribute('data-layoutid', sharedLayoutId);
  });

  // 2. Test: Next.js App Router yapısında rota geçiş animasyonlarının çalışması için gereken template.tsx yapılandırmasını test et
  it('2. App Router rota geçişlerinde Framer Motion sayfa geçişini sağlayan template.tsx sarmalayıcısını doğrular', () => {
    render(
      <Template>
        <div data-testid="test-child-page">Ürün Detay Sayfası İçeriği</div>
      </Template>
    );

    const templateWrapper = screen.getByTestId('page-template-wrapper');
    expect(templateWrapper).toBeInTheDocument();
    expect(screen.getByTestId('test-child-page')).toBeInTheDocument();
    expect(screen.getByText('Ürün Detay Sayfası İçeriği')).toBeInTheDocument();
  });
});
