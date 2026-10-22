import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as framerMotion from 'framer-motion';
import { CartDrawerProvider, useCartDrawer } from '../context/CartDrawerContext';
import PushBackLayout from './PushBackLayout';
import CartDrawer from './CartDrawer';

// Mock framer-motion useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof framerMotion>('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(),
  };
});

// Test harness bileşeni
function TestHarness({
  defaultOpen = false,
  children = <div>Ana Sayfa İçeriği</div>,
}: {
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <CartDrawerProvider initialOpen={defaultOpen}>
      <TestContent>{children}</TestContent>
    </CartDrawerProvider>
  );
}

function TestContent({ children }: { children: React.ReactNode }) {
  const { isCartOpen, toggleCart } = useCartDrawer();
  return (
    <>
      <button data-testid="cart-toggle-btn" onClick={toggleCart}>
        Sepeti {isCartOpen ? 'Kapat' : 'Aç'}
      </button>
      <PushBackLayout data-testid="push-back-main">
        {children}
      </PushBackLayout>
      <CartDrawer data-testid="cart-drawer-root" />
    </>
  );
}

describe('PushBackLayout & CartDrawer TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  // 1. Test: isCartOpen true olduğunda scale: 0.95, borderRadius: 24px, opacity kısılması
  it('1. isCartOpen true olduğunda PushBackLayout motion.main animasyonunda scale 0.95, border-radius 24px ve opacity kısıldığını doğrular', () => {
    render(<TestHarness defaultOpen={true} />);

    const mainElement = screen.getByTestId('push-back-main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveAttribute('data-is-cart-open', 'true');

    // scale: 0.95, borderRadius: 24px, opacity < 1
    expect(mainElement).toHaveAttribute('data-scale', '0.95');
    expect(mainElement).toHaveAttribute('data-border-radius', '24px');
    const opacityValue = Number(mainElement.getAttribute('data-opacity'));
    expect(opacityValue).toBeLessThan(1);
    expect(opacityValue).toBeGreaterThan(0.7);

    // CSS transformOrigin kontrolü
    expect(mainElement).toHaveStyle({ transformOrigin: 'top center' });
  });

  // 2. Test: CartDrawer bileşeninin x: 100% -> x: 0 şeklinde ekrana girmesi
  it('2. isCartOpen true iken CartDrawer ekranın sağından x: 100% -> x: 0 ile içeri girdiğini doğrular', () => {
    render(<TestHarness defaultOpen={true} />);

    const drawer = screen.getByTestId('cart-drawer-root');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('data-is-open', 'true');
    expect(drawer).toHaveAttribute('data-animation-mode', 'slide');
    expect(drawer).toHaveAttribute('data-target-x', '0');
  });

  // 3. Test: isCartOpen false olduğunda ana sayfanın scale: 1 durumuna geri dönmesi
  it('3. isCartOpen false olduğunda ana sayfanın scale: 1 ve border-radius: 0px durumuna geri döndüğünü doğrular', () => {
    render(<TestHarness defaultOpen={false} />);

    const mainElement = screen.getByTestId('push-back-main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveAttribute('data-is-cart-open', 'false');
    expect(mainElement).toHaveAttribute('data-scale', '1');
    expect(mainElement).toHaveAttribute('data-border-radius', '0px');
    expect(mainElement).toHaveAttribute('data-opacity', '1');

    // Drawer başlangıçta DOM'da olmamalı veya kapalı olmalı
    const drawer = screen.queryByTestId('cart-drawer-root');
    expect(drawer).not.toBeInTheDocument();
  });

  // 4. Test: ERİŞİLEBİLİRLİK - useReducedMotion aktifken scale iptal edilip sadece opacity (0 -> 1) ile sepetin belirmesi
  it('4. useReducedMotion aktifken scale küçülme efektinin iptal edildiğini (scale: 1) ve sepetin sadece opacity ile belirdiğini doğrular', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    render(<TestHarness defaultOpen={true} />);

    const mainElement = screen.getByTestId('push-back-main');
    // Animasyon kapalıysa sayfa ASLA küçülmemeli (scale: 1)
    expect(mainElement).toHaveAttribute('data-reduced-motion', 'true');
    expect(mainElement).toHaveAttribute('data-scale', '1');
    expect(mainElement).toHaveAttribute('data-border-radius', '0px');

    // Sepet çekmecesi x hareketi yerine sadece opacity ile belirmeli
    const drawer = screen.getByTestId('cart-drawer-root');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('data-reduced-motion', 'true');
    expect(drawer).toHaveAttribute('data-animation-mode', 'opacity');
  });

  // 5. Test: Sepette ürün varsa CartDrawer içinde ürün bilgilerini ve toplam tutarı listeler
  it('5. sepette ürün olduğunda CartDrawer içinde ürün adını, adedini ve toplam tutarı listeler', () => {
    const mockCart = [
      {
        id: 'p-100',
        name: 'Soğuk Sıkım Zeytinyağı 5L',
        price: 950,
        quantity: 2,
        slug: 'soguk-sikim-zeytinyagi-5l',
        imageUrl: '/images/zeytinyagi.jpg',
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    render(<TestHarness defaultOpen={true} />);

    expect(screen.getByText('Soğuk Sıkım Zeytinyağı 5L')).toBeInTheDocument();
    expect(screen.getByText('2 adet')).toBeInTheDocument();
    expect(screen.getAllByText('₺1.900,00')).toHaveLength(2);
  });
});
