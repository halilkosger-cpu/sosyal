'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuShieldCheck, LuArrowRight, LuLoader } from 'react-icons/lu';

export default function AdminLogoutPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch('/api/admin/login', { method: 'DELETE' });
      } catch {}

      // Çerezi sıfırla
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0; SameSite=Lax;';
      setDone(true);

      // 1.5 saniye sonra otomatik login sayfasına aktar
      const timer = setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1500);

      return () => clearTimeout(timer);
    };

    doLogout();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-block bg-white rounded-2xl px-6 py-3.5 mb-6 shadow-xl">
          <Image
            src="/logo.jpg"
            alt="İşyurtları"
            width={140}
            height={50}
            className="object-contain h-12 w-auto"
            priority
          />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-950/20 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <LuShieldCheck className="text-emerald-600" size={32} />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Güvenli Çıkış Yapıldı
          </h1>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Yönetici oturumunuz başarıyla sonlandırıldı ve güvenlik çerezleri tarayıcınızdan temizlendi.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-orange-600 font-semibold mb-6">
            <LuLoader size={16} className="animate-spin" />
            <span>Giriş sayfasına aktarılıyorsunuz...</span>
          </div>

          <Link
            href="/admin/login"
            className="w-full bg-[#0F2040] hover:bg-[#162a52] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md"
          >
            Hemen Giriş Sayfasına Git
            <LuArrowRight size={14} />
          </Link>
        </div>

        <div className="text-center mt-6 text-[11px] text-blue-300/60">
          İşyurtları Kurumu &bull; Güvenli Yönetim Portalı
        </div>
      </div>
    </div>
  );
}
