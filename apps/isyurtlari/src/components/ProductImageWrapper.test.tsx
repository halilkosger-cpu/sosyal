import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductImageWrapper from './ProductImageWrapper';

describe('ProductImageWrapper Shared Element Transition Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Durum: layoutId prop'unun aktarımı
  it('1. bileşenin dışarıdan benzersiz bir layoutId propu aldığını ve bunu taşıdığını doğrular', () => {
    const testLayoutId = 'product-image-urun-123';
    render(
      <ProductImageWrapper layoutId={testLayoutId} data-testid="product-transition-wrapper">
        <img src="/test-urun.jpg" alt="Test Ürün" />
      </ProductImageWrapper>
    );

    const wrapper = screen.getByTestId('product-transition-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('data-layoutid', testLayoutId);
    expect(screen.getByAltText('Test Ürün')).toBeInTheDocument();
  });

  // 2. Durum: Normal animasyon propları (initial, animate, exit)
  it('2. animasyon aktifken initial, animate ve exit durumlarının doğru tanımlandığını doğrular', () => {
    // prefers-reduced-motion: false durumu
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ProductImageWrapper layoutId="product-anim-test" data-testid="product-transition-wrapper">
        <div>Ürün İçeriği</div>
      </ProductImageWrapper>
    );

    const wrapper = screen.getByTestId('product-transition-wrapper');
    expect(wrapper).toHaveAttribute('data-reduced-motion', 'false');
    expect(wrapper.getAttribute('data-initial')).toBe(JSON.stringify({ opacity: 0, y: 15 }));
    expect(wrapper.getAttribute('data-animate')).toBe(JSON.stringify({ opacity: 1, y: 0 }));
    expect(wrapper.getAttribute('data-exit')).toBe(JSON.stringify({ opacity: 0, y: -15 }));
  });

  // 3. Durum: prefers-reduced-motion aktifken animasyonların devre dışı bırakılması
  it('3. prefers-reduced-motion aktif olduğunda animasyonları kapatıp anında yüklendiğini (opacity: 1, y: 0) doğrular', () => {
    // prefers-reduced-motion: reduce durumu
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ProductImageWrapper layoutId="product-reduced-test" data-testid="product-transition-wrapper">
        <div>Erişilebilir Ürün</div>
      </ProductImageWrapper>
    );

    const wrapper = screen.getByTestId('product-transition-wrapper');
    expect(wrapper).toHaveAttribute('data-reduced-motion', 'true');
    expect(wrapper.getAttribute('data-initial')).toBe(JSON.stringify({ opacity: 1, y: 0 }));
    expect(wrapper.getAttribute('data-animate')).toBe(JSON.stringify({ opacity: 1, y: 0 }));
    expect(wrapper.getAttribute('data-exit')).toBe(JSON.stringify({ opacity: 1, y: 0 }));
  });
});
