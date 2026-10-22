'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface CartDrawerContextValue {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export interface CartDrawerProviderProps {
  children: React.ReactNode;
  initialOpen?: boolean;
}

/**
 * CartDrawerProvider
 *
 * Sepet çekmecesinin (CartDrawer) ve arkaplan itme (PushBackLayout) efektinin
 * tüm site genelinde senkronize çalışmasını sağlayan global durum yöneticisi.
 */
export function CartDrawerProvider({
  children,
  initialOpen = false,
}: CartDrawerProviderProps) {
  const [isCartOpen, setIsCartOpen] = useState(initialOpen);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [isCartOpen, openCart, closeCart, toggleCart]
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

/**
 * useCartDrawer
 *
 * Sepet durumu ve açma/kapatma aksiyonlarına erişim kancası.
 */
const defaultContextValue: CartDrawerContextValue = {
  isCartOpen: false,
  setIsCartOpen: () => {},
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
};

export function useCartDrawer(): CartDrawerContextValue {
  const context = useContext(CartDrawerContext);
  return context || defaultContextValue;
}
