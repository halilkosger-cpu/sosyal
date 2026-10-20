'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LuMail, LuLock, LuKey, LuLoader, LuArrowRight, LuShieldCheck } from 'react-icons/lu';

type LoginMode = 'password' | 'otp';

export default function AdminLoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('halil.kosger@gmail.com');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Şifre ile Doğrudan Giriş
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz...');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 300);
      } else {
        setError(data.error || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
      }
    } catch {
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  // OTP E-posta Kodu İsteği
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('6 haneli doğrulama kodu e-posta adresinize gönderildi.');
        setStep('otp');
      } else {
        setError(data.error || 'E-posta kodu gönderilemedi. Dilerseniz şifre ile giriş yapabilirsiniz.');
      }
    } catch {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // OTP Kodunu Doğrula
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });

      if (res.ok) {
        setMessage('Doğrulandı! Yönetim paneline yönlendiriliyorsunuz...');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 300);
      } else {
        const data = await res.json();
        setError(data.error || 'Hatalı veya süresi dolmuş kod.');
      }
    } catch {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F2040] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Başlık */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-2xl px-5 py-3 mb-4 shadow-md">
            <Image src="/logo.jpg" alt="İşyurtları" width={130} height={48} className="object-contain h-11 w-auto" />
          </div>
          <h1 className="text-white text-2xl font-bold flex items-center justify-center gap-2">
            <LuShieldCheck className="text-orange-400" /> Yönetici Girişi
          </h1>
          <p className="text-blue-200 text-xs mt-1">İşyurtları Kurumu &amp; Logo GO3 Muhasebe Portalı</p>
        </div>

        {/* Giriş Modu Sekmeleri */}
        <div className="flex bg-[#162a52] p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              mode === 'password'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            Yönetici Şifresi ile Giriş
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setStep('email'); setError(''); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              mode === 'otp'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            E-posta Kodu (OTP)
          </button>
        </div>

        {/* Form Kartı */}
        <div className="bg-white rounded-2xl p-7 shadow-2xl">
          {mode === 'password' ? (
            /* ŞİFRE İLE GİRİŞ FORMU */
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Yönetici E-Postası
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuMail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="halil.kosger@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Şifre
                  </label>
                  <span className="text-[11px] text-gray-400">Varsayılan: isyurtlari2026!</span>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuKey size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 font-medium">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 font-medium">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <LuLoader size={18} className="animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    Yönetim Paneline Giriş Yap
                    <LuArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP İLE GİRİŞ FORMU */
            <form onSubmit={step === 'email' ? handleEmailSubmit : handleOTPSubmit}>
              {step === 'email' ? (
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Yönetici E-Postası
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <LuMail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="halil.kosger@gmail.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Giriş kodu bu e-posta adresine iletilecektir.
                  </p>
                </div>
              ) : (
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    6 Haneli Giriş Kodu
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <LuLock size={18} />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-center font-mono tracking-widest font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    <strong>{email}</strong> adresinize gönderilen 6 haneli kodu giriniz.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 font-medium">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 font-medium">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <LuLoader size={18} className="animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    {step === 'email' ? 'Doğrulama Kodu Gönder' : 'Kodu Onayla ve Giriş Yap'}
                    <LuArrowRight size={18} />
                  </>
                )}
              </button>

              {step === 'otp' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setMessage('');
                  }}
                  className="w-full mt-3 text-xs text-gray-600 hover:text-gray-900 py-1 font-medium"
                >
                  ← E-posta adresini değiştir
                </button>
              )}
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <a
              href="/"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              ← Mağaza Vitrinine Dön
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
