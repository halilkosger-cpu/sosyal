'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuMapPin, LuPlus, LuInfo, LuPencil, LuTrash2, LuCheck } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';

interface Adres {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

const BOS_FORM = {
  title: '',
  fullName: '',
  phone: '',
  city: '',
  district: '',
  neighborhood: '',
  addressLine: '',
  postalCode: '',
};

export default function AdreslerimSayfasi() {
  const { musteri, yukleniyor } = useMusteri();
  const [adresler, setAdresler] = useState<Adres[]>([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [form, setForm] = useState(BOS_FORM);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      const yanit = await fetch('/api/musteri/adresler', { cache: 'no-store' });
      if (!yanit.ok) {
        setAdresler([]);
        return;
      }
      const veri = await yanit.json();
      setAdresler(Array.isArray(veri?.adresler) ? veri.adresler : []);
    } catch {
      setHata('Adresler yüklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setListeYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (yukleniyor) return;
    if (!musteri) {
      setListeYukleniyor(false);
      return;
    }
    yukle();
  }, [musteri, yukleniyor, yukle]);

  const alan = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((onceki) => ({ ...onceki, [e.target.name]: e.target.value }));

  const formuAc = (adres?: Adres) => {
    setHata('');
    if (adres) {
      setDuzenlenen(adres.id);
      setForm({
        title: adres.title,
        fullName: adres.fullName,
        phone: adres.phone,
        city: adres.city,
        district: adres.district,
        neighborhood: adres.neighborhood ?? '',
        addressLine: adres.addressLine,
        postalCode: adres.postalCode ?? '',
      });
    } else {
      setDuzenlenen(null);
      // Yeni adreste ad ve telefon hesaptan on dolduruluyor; musteri
      // kendi adresini yazarken bunlari yeniden girmek zorunda kalmasin.
      setForm({ ...BOS_FORM, fullName: musteri?.name ?? '', phone: musteri?.phone ?? '' });
    }
    setFormAcik(true);
  };

  const kaydet = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');
    setGonderiliyor(true);

    try {
      const yanit = await fetch(
        duzenlenen ? `/api/musteri/adresler/${duzenlenen}` : '/api/musteri/adresler',
        {
          method: duzenlenen ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'Adres kaydedilemedi');
        return;
      }

      setFormAcik(false);
      setDuzenlenen(null);
      setForm(BOS_FORM);
      await yukle();
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setGonderiliyor(false);
    }
  };

  const varsayilanYap = async (id: string) => {
    setHata('');
    const yanit = await fetch(`/api/musteri/adresler/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefaultShipping: true }),
    });
    if (!yanit.ok) {
      setHata('Varsayılan adres değiştirilemedi');
      return;
    }
    await yukle();
  };

  const sil = async (id: string) => {
    setHata('');
    const yanit = await fetch(`/api/musteri/adresler/${id}`, { method: 'DELETE' });
    if (!yanit.ok) {
      setHata('Adres silinemedi');
      return;
    }
    await yukle();
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
            <LuMapPin size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Giriş yapmanız gerekiyor</h1>
          <p className="text-sm text-gray-600 mb-6">Adres defterinizi görmek için hesabınıza girin.</p>
          <Link href="/giris?devam=/adreslerim"
            className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/hesabim" className="flex items-center gap-2 text-[#BA4700] hover:text-[#8F3700] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Hesabım
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <LuMapPin size={20} className="text-[#BA4700]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Adreslerim</h1>
                <p className="text-sm text-gray-600">
                  {listeYukleniyor ? '...' : `${adresler.length} kayıtlı adres`}
                </p>
              </div>
            </div>
            {!formAcik && (
              <button onClick={() => formuAc()}
                className="flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-5 py-2.5 rounded-lg font-semibold transition">
                <LuPlus size={18} /> Yeni Adres
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {hata && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
            <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
            <div>{hata}</div>
          </div>
        )}

        {formAcik && (
          <form onSubmit={kaydet} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {duzenlenen ? 'Adresi Düzenle' : 'Yeni Adres'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Adres başlığı</label>
                <input id="title" name="title" value={form.title} onChange={alan}
                  className="store-input" placeholder="Ev, İş..." />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                <input id="fullName" name="fullName" required value={form.fullName} onChange={alan}
                  className="store-input" placeholder="Teslim alacak kişi" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Cep telefonu</label>
                <input id="phone" name="phone" type="tel" required value={form.phone} onChange={alan}
                  className="store-input" placeholder="0532 123 45 67" />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Posta kodu <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input id="postalCode" name="postalCode" value={form.postalCode} onChange={alan}
                  className="store-input" placeholder="34000" inputMode="numeric" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">İl</label>
                <input id="city" name="city" required value={form.city} onChange={alan}
                  className="store-input" placeholder="İstanbul" />
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">İlçe</label>
                <input id="district" name="district" required value={form.district} onChange={alan}
                  className="store-input" placeholder="Kadıköy" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input id="neighborhood" name="neighborhood" value={form.neighborhood} onChange={alan}
                  className="store-input" placeholder="Caferağa Mahallesi" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-2">Açık adres</label>
                <textarea id="addressLine" name="addressLine" required rows={3} value={form.addressLine} onChange={alan}
                  className="store-input" placeholder="Sokak, bina no, daire no" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={gonderiliyor}
                className="bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg font-semibold transition">
                {gonderiliyor ? 'Kaydediliyor...' : duzenlenen ? 'Güncelle' : 'Adresi Kaydet'}
              </button>
              <button type="button"
                onClick={() => { setFormAcik(false); setDuzenlenen(null); setForm(BOS_FORM); setHata(''); }}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                Vazgeç
              </button>
            </div>
          </form>
        )}

        {listeYukleniyor ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
          </div>
        ) : adresler.length === 0 && !formAcik ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-5">
              <LuMapPin size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Kayıtlı adresiniz yok</h2>
            <p className="text-sm text-gray-600 mb-6">
              Adres eklerseniz sonraki siparişlerinizde baştan yazmak zorunda kalmazsınız.
            </p>
            <button onClick={() => formuAc()}
              className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
              <LuPlus size={18} /> İlk Adresi Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adresler.map((adres) => (
              <div key={adres.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col ${
                  adres.isDefaultShipping ? 'border-[#CC4E00] ring-1 ring-[#CC4E00]/20' : 'border-gray-200'
                }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900">{adres.title}</h3>
                  {adres.isDefaultShipping && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-[#BA4700] px-2 py-1 rounded-full flex-shrink-0">
                      <LuCheck size={11} /> Varsayılan
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700 space-y-1 flex-1">
                  <p className="font-medium text-gray-900">{adres.fullName}</p>
                  <p className="text-gray-600">{adres.phone}</p>
                  <p className="leading-relaxed">
                    {adres.addressLine}
                    {adres.neighborhood ? `, ${adres.neighborhood}` : ''}
                  </p>
                  <p className="text-gray-600">
                    {adres.district} / {adres.city}
                    {adres.postalCode ? ` · ${adres.postalCode}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button onClick={() => formuAc(adres)}
                    className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-[#BA4700] font-medium transition">
                    <LuPencil size={14} /> Düzenle
                  </button>
                  {!adres.isDefaultShipping && (
                    <button onClick={() => varsayilanYap(adres.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-[#BA4700] font-medium transition ml-4">
                      <LuCheck size={14} /> Varsayılan yap
                    </button>
                  )}
                  <button onClick={() => sil(adres.id)}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition ml-auto">
                    <LuTrash2 size={14} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
