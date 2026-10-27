'use client';

import { useEffect, useState } from 'react';
import { initMobileBridge } from '@/lib/capacitor/mobileBridge';

export default function MobilKopru() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    initMobileBridge((isOnline) => {
      setIsOffline(!isOnline);
    });
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-16 left-4 right-4 z-[9999] flex items-center justify-between rounded-xl bg-amber-600/95 px-4 py-3 text-white shadow-xl backdrop-blur-md transition-all duration-300 md:bottom-6 md:left-auto md:right-6 md:w-96"
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 shrink-0 animate-pulse text-amber-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-6.364m0 0a9 9 0 012.828-6.364m4.243 4.243a5 5 0 00-1.414 3.536m0 0a5 5 0 001.414 3.536M3 3l18 18"
          />
        </svg>
        <span className="text-xs font-medium sm:text-sm">
          İnternet bağlantısı kesildi. Çevrimdışı moddasınız.
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-3 shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
