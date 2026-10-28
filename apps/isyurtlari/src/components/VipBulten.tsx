'use client';

import { useState } from 'react';
import { LuMail, LuCheck, LuCopy, LuSparkles, LuShieldCheck } from 'react-icons/lu';

export default function VipBulten() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const couponCode = 'HOSGELDIN10';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Bülten ve erken müşteri listesine kaydet
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'VIP Bülten Üyesi',
          email: email.trim(),
          message: `VIP Açılış Bülteni Kaydı — %10 Hoş Geldin Kuponu Talebi (Kod: ${couponCode})`,
        }),
      });

      setSubmitted(true);
    } catch {
      // Hata olsa dahi kullanıcı deneyimini bozmadan kuponu ver
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="my-12 max-w-screen-xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1F2E] via-[#2A1D17] to-[#141B2D] text-white p-8 md:p-12 shadow-xl border border-orange-500/20">
        {/* Arka plan süslemeleri */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#E8620C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#BA4700]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold mb-4">
            <LuSparkles size={14} className="text-orange-400" />
            <span>Erken Erişim &amp; Açılış Avantajı</span>
          </div>

          <h2 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Yeni Mahsul &amp; Taze Parti Ürünleri İlk Siz Öğrenin
          </h2>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8">
            Ceza infaz kurumları işyurtlarından sınırlı sayıda çıkan taze mahsul zeytinyağı, reçel, bal ve el emeği ürünlerden ilk siz haberdar olun. Hemen bültenimize katılın, ilk siparişinizde geçerli <strong className="text-orange-400 font-bold">%10 hoş geldin indirim kodunuzu</strong> anında alın.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <div className="relative flex-1">
                <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz..."
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8620C] focus:bg-white/15 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#CC4E00] hover:bg-[#E8620C] text-white font-bold text-sm tracking-wide transition-colors shadow-lg shadow-orange-950/40 disabled:opacity-50 shrink-0"
              >
                {loading ? 'Gönderiliyor...' : '%10 İndirim Kodumu Al'}
              </button>
            </form>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-orange-500/30 rounded-2xl p-6 max-w-md mx-auto animate-fadeIn">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <LuCheck size={18} /> Tebrikler! Kupon Kodunuz Tanımlandı
              </div>
              <p className="text-xs text-gray-300 mb-4">
                Üye girişi yaptıktan sonra aşağıdaki kodu ödeme sayfasında kullanarak ilk siparişinizde %10 indirim alabilirsiniz:
              </p>
              <div className="flex items-center justify-between bg-black/40 border border-orange-500/40 rounded-xl px-4 py-2.5">
                <span className="font-mono text-lg font-extrabold tracking-widest text-orange-400">
                  {couponCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
                >
                  {copied ? (
                    <>
                      <LuCheck size={14} /> Kopyalandı
                    </>
                  ) : (
                    <>
                      <LuCopy size={14} /> Kopyala
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <LuShieldCheck size={14} className="text-emerald-400" />
            <span>Spam göndermeyiz. Dilediğiniz an tek tıkla ayrılabilirsiniz.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
