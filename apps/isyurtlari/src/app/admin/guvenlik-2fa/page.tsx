'use client';

import { useState, useEffect } from 'react';
import {
  LuShieldCheck,
  LuSmartphone,
  LuKeyRound,
  LuCopy,
  LuCheck,
  LuRefreshCw,
  LuTriangleAlert,
  LuLock,
  LuDownload,
  LuSparkles,
  LuShieldAlert,
} from 'react-icons/lu';

interface StatusData {
  email: string;
  enabled: boolean;
  createdAt: string | null;
  lastUsed: string | null;
  backupCodesCount: number;
}

interface SetupData {
  secret: string;
  uri: string;
  qrSvg: string;
  backupCodes: string[];
}

export default function AdminGuvenlik2faPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const durumYukle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/totp-setup');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Güvenlik durumu alınamadı');
      }
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || 'Durum bilgisi yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    durumYukle();
  }, []);

  const kurulumBaslat = async () => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kurulum başlatılamadı');
      setSetupData(data);
    } catch (err: any) {
      setError(err?.message || 'Kurulum başlatılırken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const kurulumuOnayla = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setError('Lütfen telefonunuzdaki 6 haneli kodu eksiksiz giriniz.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', code: cleanCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod doğrulanamadı');

      setMessage('Tebrikler! Google Authenticator (TOTP) başarıyla etkinleştirildi.');
      setSetupData(null);
      setVerifyCode('');
      durumYukle();
    } catch (err: any) {
      setError(err?.message || 'Doğrulama başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  const devreDisiBirak = async () => {
    if (!confirm('Google Authenticator korumasını devre dışı bırakmak istediğinize emin misiniz? Girişlerde tekrar e-posta kodu istenecektir.')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız');

      setMessage('Google Authenticator devre dışı bırakıldı.');
      durumYukle();
    } catch (err: any) {
      setError(err?.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  const anahtariKopyala = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const kodlariKopyala = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. ÜST HERO BAŞLIK */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-2xl bg-orange-50 text-[#CC4E00] flex items-center justify-center font-bold">
            <LuSmartphone size={26} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              2FA Güvenlik &amp; Google Authenticator
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Admin paneline e-posta kodu beklemeden telefonunuzdaki Authenticator ile anında ve güvenle giriş yapın.
            </p>
          </div>
        </div>

        <button
          onClick={durumYukle}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <LuRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
          Yenile
        </button>
      </div>

      {/* BİLDİRİM VE HATA MESAJLARI */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2">
          <LuTriangleAlert className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. MEVCUT DURUM KARTI */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Doğrulama Durumu</span>
            <div className="flex items-center gap-2.5 mt-1.5">
              {status?.enabled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                  <LuCheck size={14} /> Google Authenticator Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                  <LuLock size={14} /> Henüz Kurulmadı (E-Posta OTP Aktif)
                </span>
              )}
              <span className="text-xs text-gray-500 font-medium font-mono">({status?.email})</span>
            </div>
          </div>

          {!setupData && (
            <div>
              {status?.enabled ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={kurulumBaslat}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
                  >
                    Yeniden Kur / Anahtarı Değiştir
                  </button>
                  <button
                    onClick={devreDisiBirak}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all border border-red-200"
                  >
                    Devre Dışı Bırak
                  </button>
                </div>
              ) : (
                <button
                  onClick={kurulumBaslat}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-2xl bg-[#CC4E00] hover:bg-[#A63F00] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-900/20"
                >
                  <LuSparkles size={16} />
                  Google Authenticator Kurulumunu Başlat
                </button>
              )}
            </div>
          )}
        </div>

        {/* Kurulum Aktifken Bilgi Notu */}
        {status?.enabled && !setupData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Kalan Yedek Kurtarma Kodu</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">
                {status.backupCodesCount} Adet
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                Telefonunuz yanınızda olmadığında giriş için kullanılabilir.
              </p>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-xs text-emerald-800 font-bold block">Giriş Kolaylığı</span>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Giriş yaparken artık e-posta beklemenize gerek yoktur. Telefonunuzdaki <strong>Google Authenticator</strong> uygulamasını açarak anlık 6 haneli kod ile saniyeler içinde giriş yapabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* 3. KURULUM ADIMI (SETUP DATA MEVCUTSA) */}
        {setupData && (
          <div className="pt-2 space-y-6">
            <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-200/60 flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#CC4E00] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                1
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">QR Kodu Telefonunuzla Taratın</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Telefonunuzda <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> veya <strong>Apple Parolalar</strong> uygulamasını açıp aşağıdaki QR kodu okutun.
                </p>

                {/* QR Kod SVG ve Manuel Anahtar */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 p-4 bg-white rounded-2xl border border-gray-200">
                  <div
                    className="p-2 bg-white rounded-xl shadow-inner border border-gray-100"
                    dangerouslySetInnerHTML={{ __html: setupData.qrSvg }}
                  />

                  <div className="space-y-3 flex-1 w-full">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Veya Manuel Kurulum Anahtarı
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-3 py-2 bg-gray-100 rounded-xl font-mono text-xs font-bold text-gray-800 break-all select-all flex-1">
                          {setupData.secret}
                        </code>
                        <button
                          type="button"
                          onClick={() => anahtariKopyala(setupData.secret)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedKey ? <LuCheck size={14} className="text-emerald-600" /> : <LuCopy size={14} />}
                          {copiedKey ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                      </div>
                    </div>

                    <a
                      href={setupData.uri}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CC4E00] hover:underline"
                    >
                      <LuSmartphone size={14} /> Telefondaysanız Doğrudan Uygulamada Aç &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Kurtarma Kodları */}
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                2
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm">Yedek Kurtarma Kodlarınızı Kaydedin</h3>
                  <button
                    type="button"
                    onClick={() => kodlariKopyala(setupData.backupCodes)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    {copiedCodes ? <LuCheck size={13} className="text-emerald-600" /> : <LuCopy size={13} />}
                    {copiedCodes ? 'Kopyalandı' : 'Tümünü Kopyala'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Telefonunuzu kaybederseniz veya değiştirirseniz panele giriş yapabilmeniz için aşağıdaki kodları güvenli bir yere not ediniz:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                  {setupData.backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-white rounded-xl border border-amber-200 text-center font-mono font-bold text-xs text-gray-800 shadow-2xs select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kurulum Doğrulama Formu */}
            <form onSubmit={kurulumuOnayla} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0F2040] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  3
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Kurulumu Doğrulayın ve Aktifleştirin</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Telefonunuzdaki Google Authenticator uygulamasının ürettiği 6 haneli anlık kodu girerek kurulumu tamamlayınız.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000 000"
                  maxLength={6}
                  required
                  className="w-full sm:w-60 px-4 py-3 rounded-xl border border-gray-300 font-mono text-center text-xl font-bold tracking-widest focus:outline-none focus:border-[#CC4E00]"
                />

                <button
                  type="submit"
                  disabled={actionLoading || verifyCode.length !== 6}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#CC4E00] hover:bg-[#A63F00] text-white font-extrabold text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Doğrulanıyor...' : 'Kodu Onayla ve 2FA\'yı Aktifleştir'}
                </button>

                <button
                  type="button"
                  onClick={() => setSetupData(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-2"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
