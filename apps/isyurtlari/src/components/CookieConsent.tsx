'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const updateAnalyticsConsent = (analyticsStorage: 'granted' | 'denied') => {
  window.gtag?.('consent', 'update', {
    analytics_storage: analyticsStorage,
    ad_storage: 'denied',
  });
};

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Defer showing banner to avoid layout shift during hydration
      requestAnimationFrame(() => {
        setShowBanner(true);
      });
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateAnalyticsConsent('granted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateAnalyticsConsent('denied');
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1 text-gray-900">Çerez Politikası</h3>
          <p className="text-xs text-gray-600">
            Site deneyiminizi iyileştirmek için çerezler kullanıyoruz.
            <Link href="/gizlilik-sozlesmesi" className="text-[#FF6000] underline hover:no-underline ml-1 font-semibold">Detaylı bilgi</Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Çerezleri reddet"
          >
            Reddet
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#FF6000] hover:bg-[#CC4E00] rounded-lg transition-colors"
            aria-label="Tüm çerezleri kabul et"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
