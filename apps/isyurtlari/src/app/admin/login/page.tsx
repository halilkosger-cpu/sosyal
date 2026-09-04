'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LuMail, LuLock, LuLoader, LuArrowRight } from 'react-icons/lu';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Giriş kodu email adresinize gönderilmiştir');
        setStep('otp');
      } else {
        setError(data.error || 'Email gönderilemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Hatalı kod');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F2040] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-4 py-3 mb-4">
            <Image src="/logo.jpg" alt="İsyurtları" width={120} height={44} className="object-contain h-11 w-auto" />
          </div>
          <h1 className="text-white text-2xl font-bold">Admin Paneli</h1>
          <p className="text-blue-300 text-sm mt-1">
            {step === 'email' ? 'Email adresinizi girin' : 'Giriş kodunu girin'}
          </p>
        </div>

        <form onSubmit={step === 'email' ? handleEmailSubmit : handleOTPSubmit} className="bg-white rounded-2xl p-8 shadow-2xl">
          {step === 'email' ? (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Adresi
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <LuMail size={18} color="#9CA3AF" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000] transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giriş Kodu
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <LuLock size={18} color="#9CA3AF" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-center font-mono tracking-widest focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000] transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{email} adresine gönderilen kodu girin</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-5">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LuLoader size={18} className="animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                Devam Et
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
              className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Email'i değiştir
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
