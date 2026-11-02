'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PwaKayit() {
  const pathname = usePathname();

  useEffect(() => {
    // Admin sayfasında PWA service worker kurulmaz
    if (pathname?.startsWith('/admin')) return;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PWA Service Worker registered:', reg.scope);
            }
          })
          .catch((err) => {
            console.warn('PWA Service Worker registration failed:', err);
          });
      });
    }
  }, [pathname]);

  return null;
}
