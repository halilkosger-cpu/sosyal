'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuUser, LuPackage, LuHeart, LuMapPin, LuRotateCcw, LuShieldCheck, LuLogOut, LuMailCheck, LuMail } from 'react-icons/lu';
import { cikisYap, useMusteri } from '@/lib/musteri-istemci';

/**
 * Hesabim.
 *
 * Bu sayfa daha once tamamen sahte veri gosteriyordu: localStorage'da bir
 * "userId" varsa ekrana "Ziyaretçi Kullanıcı / user@example.com / +90 (5XX)
 * XXX XX XX / İstanbul" basiliyordu. Hicbiri gercek degildi; sitede musteri
 * hesabi diye bir sey yoktu. Artik oturumdaki gercek musteriyi gosteriyor.
 */
export default function HesabimSayfasi() {
  const { musteri, yukleniyor } = useMusteri();
  const router = useRouter();
  const [cikiliyor, setCikiliyor] = useState(false);

  /**
   * Tanitim e-postasi tercihi.
   *
   * E-postadaki ret baglantisi yalniz KAPATABILIYOR (bkz.
   * api/musteri/ileti-izni). Acma yolu burasi: yoksa bir kez listeden
   * cikan musteri bir daha hicbir sekilde geri donemezdi.
   */
  const [izin, setIzin] = useState<boolean | null>(null);
  const [izinIsleniyor, setIzinIsleniyor] = useState(false);

  const izinDegistir = async (yeni: boolean) => {
    setIzinIsleniyor(true);
    try {
      const yanit = await fetch('/api/musteri/ileti-izni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ izin: yeni }),
      });
      if (yanit.ok) setIzin(yeni);
    } catch {
      // Sessiz gecmek yeterli: dugme eski halinde kalir.
    } finally {
      setIzinIsleniyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]" />
      </div>
    );
  }

  if (!musteri) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#BA4700] flex items-center justify-center mx-auto mb-5">
            <LuUser size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Giriş yapmanız gerekiyor</h1>
          <p className="text-sm text-gray-600 mb-6">
            Siparişlerinizi ve bilgilerinizi görmek için hesabınıza giriş yapın.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/giris?devam=/hesabim"
              className="bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
              Giriş Yap
            </Link>
            <Link href="/kayit?devam=/hesabim"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
              Hesap Oluştur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bilgiler: { etiket: string; deger: string }[] = [
    { etiket: 'Ad Soyad', deger: musteri.name },
    { etiket: 'E-posta', deger: musteri.email },
    // Bos alanlar "Belirtilmemis" diye yaziliyor; uydurma bir ornek deger
    // ("+90 (5XX) XXX XX XX") gostermek, kullaniciya kayitli bir telefonu
    // varmis izlenimi veriyordu.
    { etiket: 'Telefon', deger: musteri.phone || 'Belirtilmemiş' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#BA4700] hover:text-[#8F3700] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Alışverişe devam et
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#CC4E00] rounded-full flex items-center justify-center text-white font-bold text-lg">
              {musteri.name.trim().charAt(0).toLocaleUpperCase('tr-TR')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hesabım</h1>
              <p className="text-sm text-gray-600">{musteri.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <LuUser size={20} className="text-[#BA4700]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Kişisel Bilgiler</h2>
              </div>

              <dl className="space-y-4">
                {bilgiler.map((b) => (
                  <div key={b.etiket}>
                    <dt className="text-sm text-gray-600 mb-1">{b.etiket}</dt>
                    <dd className="text-gray-900 font-medium break-words">{b.deger}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {!musteri.emailVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <LuMailCheck size={20} className="text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">E-postanız henüz doğrulanmadı</p>
                    <p className="text-sm text-amber-800">
                      Kayıt olurken gönderdiğimiz doğrulama bağlantısını kullanabilirsiniz. Alışveriş
                      yapmanız için doğrulama gerekmiyor; hesap güvenliğiniz için öneriyoruz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tanitim e-postasi tercihi */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <LuMail size={20} className="text-blue-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">E-posta Tercihleri</h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Sepet hatırlatması ve kampanya duyurusu gibi tanıtım e-postaları. Sipariş
                onayı, kargo bilgisi ve şifre sıfırlama e-postaları bu tercihten
                etkilenmez; onlar tanıtım değil, siparişinizin işleyişidir.
              </p>

              {(() => {
                /**
                 * Izin gecerli mi? Ret ayri bir damgada tutuluyor; en son
                 * hangisi olduysa o gecerli (bkz. schema.prisma).
                 */
                const verildi = musteri.iletiIzniAt ? Date.parse(musteri.iletiIzniAt) : 0;
                const geriAlindi = musteri.iletiRetAt ? Date.parse(musteri.iletiRetAt) : 0;
                const acik = izin ?? (verildi > 0 && verildi > geriAlindi);
                return (
                  <button
                    onClick={() => izinDegistir(!acik)}
                    disabled={izinIsleniyor}
                    className={`text-sm font-semibold px-4 py-2.5 rounded-lg border transition disabled:opacity-50 ${
                      acik
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'border-[#FF6000] bg-[#CC4E00] text-white hover:bg-[#A63F00]'
                    }`}
                  >
                    {izinIsleniyor
                      ? 'İşleniyor...'
                      : acik
                        ? 'Tanıtım e-postalarını durdur'
                        : 'Tanıtım e-postalarını almak istiyorum'}
                  </button>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <LuShieldCheck size={20} className="text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Güvenlik</h2>
              </div>

              <Link href="/sifre-sifirla"
                className="block w-full text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition hover:bg-gray-50 mb-3">
                Şifremi Değiştir
              </Link>

              <button
                onClick={async () => {
                  setCikiliyor(true);
                  await cikisYap();
                  router.push('/');
                  router.refresh();
                }}
                disabled={cikiliyor}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-medium py-2.5 rounded-lg transition"
              >
                <LuLogOut size={16} /> {cikiliyor ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/siparislerim"
              className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#CC4E00] hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <LuPackage size={20} className="text-[#BA4700]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Siparişlerim</h3>
              </div>
              <p className="text-sm text-gray-600">Sipariş durumunu ve geçmişini görün</p>
            </Link>

            <Link href="/favoriler"
              className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#CC4E00] hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <LuHeart size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Favorilerim</h3>
              </div>
              <p className="text-sm text-gray-600">Kaydettiğiniz ürünler</p>
            </Link>

            <Link href="/adreslerim"
              className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#CC4E00] hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <LuMapPin size={20} className="text-[#BA4700]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Adreslerim</h3>
              </div>
              <p className="text-sm text-gray-600">Teslimat adreslerinizi yönetin</p>
            </Link>

            <Link href="/iadelerim"
              className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#CC4E00] hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <LuRotateCcw size={20} className="text-gray-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">İadelerim</h3>
              </div>
              <p className="text-sm text-gray-600">İade talebi oluşturun ve takip edin</p>
            </Link>

            <Link href="/bize-ulasin"
              className="block bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg text-center transition">
              Yardım & Destek
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
