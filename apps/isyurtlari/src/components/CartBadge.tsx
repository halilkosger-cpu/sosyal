'use client';

import { useEffect, useState } from 'react';

interface CartItem {
  id: string;
  quantity: number;
}

export default function CartBadge() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // İlk yükleme
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const total = cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      setCount(total);
    };

    updateCount();

    // localStorage değişikliklerini dinle
    const handleStorageChange = () => {
      updateCount();
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event de dinle (aynı tab'da değişiklik için)
    window.addEventListener('cartUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {count}
    </span>
  );
}
