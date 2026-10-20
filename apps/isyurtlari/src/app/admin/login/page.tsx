'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LuMail, LuLock, LuLoader, LuArrowRight, LuShieldCheck, LuRotateCcw } from 'react-icons/lu';

export default function AdminLoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('halil.kosger@gmail.com');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Adım: E-postaya 6 Haneli OTP Doğrulama Kodu İste
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('6 haneli güvenlik kodu e-posta adresinize gönderildi.');
        setStep('otp');
      } else {
        setError(data.error || 'Kod gönderilemedi. Lütfen yetkili e-posta adresinizi kontrol ediniz.');
      }
    } catch {
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Adım: OTP Kodunu Doğrula ve Güvenli Oturum Aç
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otp.replace(/\D/g, '').trim();

    if (cleanCode.length !== 6) {
      setError('Lütfen 6 haneli kodu eksiksiz giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Doğrulama başarılı! Yönetici paneline aktarılıyorsunuz...');

        if (data.token) {
          try {
            const isHttps = window.location.protocol === 'https:';
            // Çerezi hem HTTP hem JS katmanında mühürle
            document.cookie = `admin-token=${encodeURIComponent(data.token)}; path=/; max-age=14400; SameSite=Lax;${isHttps ? ' Secure;' : ''}`;
            localStorage.setItem('admin_token', data.token);
            sessionStorage.setItem('admin_token', data.token);
          } catch {}
        }

        setTimeout(() => {
          window.location.href = '/admin';
        }, 150);
      } else {
        setError(data.error || 'Geçersiz veya süresi dolmuş kod.');
      }
    } catch {
      setError('Doğrulama sırasında bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Kurumsal Başlık & Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-6 py-3.5 mb-4 shadow-xl">
            <Image
              src="/logo.jpg"
              alt="İşyurtları Kurumu"
              width={140}
              height={50}
              className="object-contain h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-white text-2xl font-bold flex items-center justify-center gap-2">
            <LuShieldCheck className="text-orange-500" size={26} />
            Yönetici Doğrulama Portalı
          </h1>
          <p className="text-blue-200 text-xs mt-1.5 font-medium tracking-wide">
            2FA Çift Aşamalı Kriptografik Kimlik Doğrulama
          </p>
        </div>

        {/* Ana Doğrulama Kartı */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-950/20">
          {step === 'email' ? (
            /* ADIM 1: E-POSTA ADRESİ GİRİŞİ */
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Yetkili E-Posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuMail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="halil.kosger@gmail.com"
                    required
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Yalnızca yetkili yönetici e-posta adresine tek kullanımlık güvenlik kodu gönderilir.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-900/20 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <LuLoader size={18} className="animate-spin" />
                    Kod Gönderiliyor...
                  </>
                ) : (
                  <>
                    Güvenlik Kodu Gönder
                    <LuArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ADIM 2: 6 HANELİ GÜVENLİK KODU ONAYI */
            <form onSubmit={handleOTPSubmit}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    6 Haneli Güvenlik Kodu
                  </label>
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    15 Dakika Geçerli
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuLock size={20} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-2xl text-center font-mono tracking-[0.35em] font-extrabold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <p className="text-[12px] text-gray-600 mt-2.5 text-center leading-relaxed">
                  <strong className="text-gray-900">{email}</strong> adresinize gönderilen kodu giriniz.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-900/20 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <LuLoader size={18} className="animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    Kodu Onayla ve Giriş Yap
                    <LuArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  className="hover:text-orange-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  <LuRotateCcw size={13} />
                  Kodu Yeniden Gönder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setMessage('');
                  }}
                  className="hover:text-gray-900 font-semibold transition-colors"
                >
                  E-postayı Değiştir
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <a
              href="/"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
            >
              ← Mağaza Vitrinine Dön
            </a>
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] text-blue-300/60">
          Güvenli Yönetim Sistemi &bull; ISO 27001 &amp; KVKK Uyumlu
        </div>
      </div>
    </div>
  );
}
