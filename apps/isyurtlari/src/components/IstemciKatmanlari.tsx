'use client';

import dynamic from 'next/dynamic';

// Yalnizca tarayicida calisan katmanlar; Next 15'te ssr:false yalnizca istemci bileseninde kullanilabilir.
export const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
export const KargoTakipModal = dynamic(() => import('@/components/KargoTakipModal'), { ssr: false });
export const SenkronKopru = dynamic(() => import('@/components/SenkronKopru'), { ssr: false });
export const MobilKopru = dynamic(() => import('@/components/MobilKopru'), { ssr: false });
export const AltGezinme = dynamic(() => import('@/components/AltGezinme'), { ssr: false });
export const KampanyaModal = dynamic(() => import('@/components/KampanyaModal'), { ssr: false });
export const SepetToastBildirimi = dynamic(() => import('@/components/SepetToastBildirimi'), { ssr: false });
export const HediyeDanismaniModal = dynamic(() => import('@/components/HediyeDanismaniModal'), { ssr: false });
export const MobilUygulamaBanneri = dynamic(() => import('@/components/MobilUygulamaBanneri'), { ssr: false });
export const SpotlightArama = dynamic(() => import('@/components/SpotlightArama'), { ssr: false });
