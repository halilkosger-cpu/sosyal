'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LuCheck, LuArrowRight, LuX, LuShoppingBag } from 'react-icons/lu';
import { SEPETE_EKLENDI_OLAYI } from '@/lib/cart';
import { useCartDrawer } from '@/context/CartDrawerContext';

interface EklenenUrun {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  slug?: string;
}

export default function SepetToastBildirimi() {
  const [bildirim, setBildirim] = useState<EklenenUrun | null>(null);
  const { openCart } = useCartDrawer();
  const zamanlayiciRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEklendi = (e: Event) => {
      const customEvent = e as CustomEvent<EklenenUrun>;
      if (!customEvent.detail) return;

      setBildirim(customEvent.detail);

      if (zamanlayiciRef.current) {
        clearTimeout(zamanlayiciRef.current);
      }
      zamanlayiciRef.current = setTimeout(() => {
        setBildirim(null);
      }, 3200);
    };

    window.addEventListener(SEPETE_EKLENDI_OLAYI, handleEklendi);
    return () => {
      window.removeEventListener(SEPETE_EKLENDI_OLAYI, handleEklendi);
      if (zamanlayiciRef.current) clearTimeout(zamanlayiciRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {bildirim && (
        <motion.aside
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 max-w-sm md:max-w-md w-auto mx-auto md:mx-0 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-gray-200/90 text-gray-900 pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            {/* Ürün Görseli / İkonu */}
            <div className="relative w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden shrink-0">
              {bildirim.imageUrl ? (
                <Image
                  src={bildirim.imageUrl}
                  alt={bildirim.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <LuShoppingBag className="text-[#CC4E00]" size={20} />
              )}
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                <LuCheck size={10} strokeWidth={3} />
              </span>
            </div>

            {/* Metin */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <span>Sepete Eklendi</span>
              </div>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {bildirim.name}
              </p>
              <p className="text-[11px] font-bold text-[#BA4700]">
                ₺{bildirim.price.toFixed(2)}
              </p>
            </div>

            {/* Sepeti Aç Butonu */}
            <button
              onClick={() => {
                setBildirim(null);
                openCart();
              }}
              className="flex items-center gap-1 px-3 py-2 bg-[#0F2040] hover:bg-[#CC4E00] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <span>Sepet</span>
              <LuArrowRight size={13} />
            </button>

            {/* Kapat */}
            <button
              onClick={() => setBildirim(null)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              aria-label="Kapat"
            >
              <LuX size={14} />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
