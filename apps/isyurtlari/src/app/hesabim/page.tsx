'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuUser, LuPackage, LuHeart, LuSettings } from 'react-icons/lu';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  createdAt: string;
}

export default function MyAccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID and mock user data (future: from session/auth)
    const mockUserId = localStorage.getItem('userId');
    if (mockUserId) {
      setUserId(mockUserId);
      // Mock user data (in real app, fetch from /api/user/me)
      setUser({
        name: 'Ziyaretçi Kullanıcı',
        email: 'user@example.com',
        phone: '+90 (5XX) XXX XX XX',
        city: 'İstanbul',
        createdAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('cart');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#FF6000] hover:text-[#e55500] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Geri
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6000] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.name.charAt(0) || 'K'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hesabım</h1>
              <p className="text-sm text-gray-500">{user?.email || 'Yükle...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]"></div>
          </div>
        ) : !userId ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <span className="text-6xl block mb-4">🔐</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
            <p className="text-gray-600 mb-6">Hesabını görmek için giriş yapmalısın</p>
            <Link
              href="/"
              className="inline-block bg-[#FF6000] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e55500] transition"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuUser size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Kişisel Bilgiler</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ad Soyad</p>
                    <p className="text-gray-900 font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">E-posta</p>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Telefon</p>
                    <p className="text-gray-900 font-medium">{user?.phone || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Şehir</p>
                    <p className="text-gray-900 font-medium">{user?.city || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Üye Tarihi</p>
                    <p className="text-gray-900 font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </p>
                  </div>
                </div>

                <button className="w-full mt-6 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 rounded-lg transition">
                  Bilgileri Düzenle
                </button>
              </div>

              {/* Security */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <LuSettings size={20} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Güvenlik</h2>
                </div>

                <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium py-2 rounded-lg transition mb-3">
                  Şifreyi Değiştir
                </button>
                <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition">
                  Çıkış Yap
                </button>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-4">
              {/* Orders Card */}
              <Link
                href="/siparislerim"
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <LuPackage size={20} />
                  </div>
                  <h3 className="text-lg font-bold">Siparişlerim</h3>
                </div>
                <p className="text-blue-100 text-sm">Tüm siparişlerini görmek</p>
              </Link>

              {/* Favorites Card */}
              <Link
                href="/favoriler"
                className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <LuHeart size={20} />
                  </div>
                  <h3 className="text-lg font-bold">Favorilerim</h3>
                </div>
                <p className="text-red-100 text-sm">Kayıtlı ürünleriniz</p>
              </Link>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <p className="text-sm text-blue-900">
                  <span className="font-bold">💡 İpucu:</span> Daha iyi bir alışveriş deneyimi için hesap bilgilerini güncel tut.
                </p>
              </div>

              {/* Help */}
              <Link
                href="/bize-ulasin"
                className="block bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg text-center transition"
              >
                Yardım & Destek
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
