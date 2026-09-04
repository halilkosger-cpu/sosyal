'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';

const GA_KIMLIGI = 'G-KTWVN830XT';

/**
 * Google Analytics ve Vercel Speed Insights.
 *
 * Admin panelinde ikisi de calistirilmiyor. Iki sebep var:
 *
 * 1) Olcum kirliligi. Admin panelindeki islemler sitenin performans
 *    rakamlarina karisiyordu. Ornegin urun silme dugmesi window.confirm()
 *    kullaniyor; confirm ana is parcacigini bloke ettigi icin tarayici,
 *    diyalogun ekranda kaldigi tum sureyi tiklama isleyicisinin suresi
 *    sayiyor. Yonetici onay penceresini 1,7 saniye acik tuttugunda Speed
 *    Insights bunu 1.681 ms'lik INP olarak raporluyordu - oysa olculen sey
 *    kodun hizi degil, kullanicinin okuma suresiydi.
 *
 * 2) Ziyaretci istatistiklerine yoneticinin kendi gezinmesi karisiyordu.
 *
 * Genel sayfalarda davranis aynen korunuyor: betikler yine lazyOnload ile
 * yukleniyor ve analytics_storage cerez onayina bagli kaliyor.
 */
export default function Olcumler() {
  const yol = usePathname();

  if (yol?.startsWith('/admin')) return null;

  return (
    <>
      <Script
        id="gtag-consent-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            const storedConsent = localStorage.getItem('cookieConsent');
            gtag('consent', 'default', {
              'analytics_storage': storedConsent === 'accepted' ? 'granted' : 'denied',
              'ad_storage': 'denied'
            });
          `,
        }}
      />

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_KIMLIGI}`}
        strategy="lazyOnload"
        async
      />

      <Script
        id="gtag-config"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_KIMLIGI}', { 'anonymize_ip': true });
          `,
        }}
      />

      <SpeedInsights />
    </>
  );
}
