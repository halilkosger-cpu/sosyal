'use client';

import React from 'react';
import { IconCart } from '@/components/Icons';
import CartBadge from '@/components/CartBadge';
import { useCartDrawer } from '@/context/CartDrawerContext';

export interface CartTriggerProps {
  className?: string;
}

/**
 * CartTrigger - Üst Başlık (Header) Sepet Çekmecesi Tetikleyicisi
 *
 * Tıklandığında sayfa yenilemeden modern PushBackLayout ve CartDrawer
 * çekmecesini açar.
 */
export default function CartTrigger({ className = '' }: CartTriggerProps) {
  const { toggleCart } = useCartDrawer();

  return (
    <button
      type="button"
      onClick={toggleCart}
      data-sepet-hedef
      aria-label="Alışveriş sepetini aç"
      className={`relative flex items-center gap-2 text-gray-800 hover:text-[#CC4E00] transition-colors flex-shrink-0 cursor-pointer ${className}`}
    >
      <div className="relative">
        <IconCart className="w-6 h-6" />
        <CartBadge />
      </div>
      <span className="hidden sm:inline text-sm font-medium">Sepetim</span>
    </button>
  );
}
