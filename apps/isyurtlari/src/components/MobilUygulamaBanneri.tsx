'use client';

import React, { useEffect, useState } from 'react';
import { uygulamaBanneriGosterilebilir } from '@/lib/katman-sirasi';
import Image from 'next/image';
import { LuX, LuShare, LuSquarePlus, LuDownload } from 'react-icons/lu';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobilUygulamaBanneri() {
  const [gorunur, setGorunur] = useState(false);
  const [cihaz, setCihaz] = useState<'ios' | 'android' | 'other'>('other');
  const [iosRehberAcik, setIosRehberAcik] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Standalone (zaten yuklenmis PWA veya Capacitor native uygulamada) gosterme
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Kullanici daha once kapattiysa 7 gun boyunca tekrar rahatsiz etme
    const kapatilmaZamani = localStorage.getItem('app_banner_dismissed_at');
    if (kapatilmaZamani) {
      const gecenGun = (Date.now() - parseInt(kapatilmaZamani, 10)) / (1000 * 60 * 60 * 24);
      if (gecenGun < 7) return;
    }

    // Cihaz tespiti
    const ua = navigator.userAgent || navigator.vendor || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroid = /android/i.test(ua);

    if (isIOS) setCihaz('ios');
    else if (isAndroid) setCihaz('android');
    else setCihaz('other');

    // Sadece mobilde goster
    if ((isIOS || isAndroid) && uygulamaBanneriGosterilebilir()) {
      setGorunur(true);
    }

    // Android Chrome PWA native prompt yakalama
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const kapat = () => {
    setGorunur(false);
    localStorage.setItem('app_banner_dismissed_at', Date.now().toString());
  };

  const handleAksiyon = async () => {
    if (cihaz === 'ios') {
      setIosRehberAcik(true);
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setGorunur(false);
        }
      } catch {
        // Fallback: APK indirme
        window.location.href = '/downloads/isyurtlari.apk';
      }
    } else {
      // Dogrudan APK indir
      window.location.href = '/downloads/isyurtlari.apk';
    }
  };

  if (!gorunur) return null;

  return (
    <>
      {/* Sabit Ust Akıllı Banner (Mobilde) */}
      <div className="md:hidden bg-gradient-to-r from-[#0F2040] via-[#162B54] to-[#0F2040] text-white px-3 py-2 flex items-center justify-between gap-2 border-b border-white/10 shadow-sm relative z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={kapat}
            className="p-1 -ml-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <LuX size={16} />
          </button>
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 shrink-0">
            <Image src="/logo.webp" alt="İsyurtları" fill className="object-contain p-0.5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-white truncate">İsyurtları Mobil Mağaza</p>
            <p className="text-[10px] text-gray-300 truncate">
              {cihaz === 'ios' ? 'Safari ile Ana Ekrana Ekle' : 'Daha Hızlı Alışveriş İçin Yükle'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAksiyon}
          className="shrink-0 bg-[#CC4E00] hover:bg-[#BA4700] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          {cihaz === 'ios' ? (
            <>
              <LuSquarePlus size={13} />
              <span>Yükle</span>
            </>
          ) : (
            <>
              <LuDownload size={13} />
              <span>APK İndir</span>
            </>
          )}
        </button>
      </div>

      {/* iOS Safari Ana Ekrana Ekleme Rehberi Modalı */}
      {iosRehberAcik && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-100 text-gray-900 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Image src="/logo.webp" alt="Logo" width={24} height={24} className="object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">İsyurtları Uygulamasını Ekle</h3>
                  <p className="text-[10px] text-gray-500">iPhone Ana Ekranına Kolay Kurulum</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIosRehberAcik(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <LuShare size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">1. Paylaş Simgesine Dokunun</p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Safari ekranının en altındaki kare içinde yukarı ok <strong>[Paylaş]</strong> simgesine dokunun.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="p-2 bg-orange-100 text-[#CC4E00] rounded-lg shrink-0">
                  <LuSquarePlus size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">2. &apos;Ana Ekrana Ekle&apos;yi Seçin</p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Açılan menüde aşağı kaydırıp <strong>&apos;Ana Ekrana Ekle&apos;</strong> butonuna ve sağ üstten <strong>&apos;Ekle&apos;</strong>ye dokunun.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIosRehberAcik(false)}
              className="w-full py-2.5 rounded-xl bg-[#0F2040] text-white font-bold text-xs hover:bg-[#162B54] transition-colors"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
