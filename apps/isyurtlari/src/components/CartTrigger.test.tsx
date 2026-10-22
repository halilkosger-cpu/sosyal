import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CartTrigger from './CartTrigger';
import { CartDrawerProvider, useCartDrawer } from '../context/CartDrawerContext';

function TestWrapper() {
  const { isCartOpen } = useCartDrawer();
  return (
    <div>
      <CartTrigger />
      <div data-testid="cart-state">{isCartOpen ? 'AÇIK' : 'KAPALI'}</div>
    </div>
  );
}

describe('CartTrigger Component Tests', () => {
  it('1. Sepetim butonunu ve ikonunu render eder ve tıklandığında sepeti açar', () => {
    render(
      <CartDrawerProvider>
        <TestWrapper />
      </CartDrawerProvider>
    );

    expect(screen.getByText('Sepetim')).toBeInTheDocument();
    expect(screen.getByTestId('cart-state')).toHaveTextContent('KAPALI');

    const triggerBtn = screen.getByRole('button', { name: /alışveriş sepetini aç/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByTestId('cart-state')).toHaveTextContent('AÇIK');
  });
});
