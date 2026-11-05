'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import HesapSekmeleri from '@/components/HesapSekmeleri';
import AdresFormu, { BOS_ADRES_FORMU, type AdresFormDegeri } from '@/components/AdresFormu';
import { LuMapPin, LuPlus, LuInfo, LuPencil, LuTrash2, LuCheck } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';
import { illeriGetir } from '@/lib/adres-alanlari';

interface Adres {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  sokak: string | null;
  binaSite: string | null;
  kat: string | null;
  daireNo: string | null;
  postalCode: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

/** "Ahmet Yılmaz Demir" -> { ad: "Ahmet Yılmaz", soyad: "Demir" } */
function adiBol(adSoyad: string): { ad: string; soyad: string } {
  const parcalar = adSoyad.trim().split(/\s+/).filter(Boolean);
  if (parcalar.length <= 1) return { ad: parcalar[0] ?? '', soyad: '' };
  const soyad = parcalar.pop() ?? '';
  return { ad: parcalar.join(' '), soyad };
}

export default function AdreslerimSayfasi() {
  const { musteri, yukleniyor } = useMusteri();
  const [adresler, setAdresler] = useState<Adres[]>([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [baslik, setBaslik] = useState('');
  const [telefon, setTelefon] = useState('');
  const [adresForm, setAdresForm] = useState<AdresFormDegeri>(BOS_ADRES_FORMU);
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

  const formuKapat = () => {
    setFormAcik(false);
    setDuzenlenen(null);
    setBaslik('');
    setTelefon('');
    setAdresForm(BOS_ADRES_FORMU);
    setHata('');
  };

  const formuAc = (adres?: Adres) => {
    setHata('');
    setFormAcik(true);

    if (!adres) {
      setDuzenlenen(null);
      // Yeni adreste ad, soyad ve telefon hesaptan on dolduruluyor.
      setBaslik('');
      setTelefon(musteri?.phone ?? '');
      setAdresForm({ ...BOS_ADRES_FORMU, ...adiBol(musteri?.name ?? '') });
      return;
    }

    setDuzenlenen(adres.id);
    setBaslik(adres.title);
    setTelefon(adres.phone);
    setAdresForm({
      ...adiBol(adres.fullName),
      ilKodu: '',
      il: adres.city,
      ilce: adres.district,
      mahalle: adres.neighborhood ?? '',
      // Eski kayitlarda parcalar yok; acik adres sokak alanina konur, musteri duzeltir.
      sokak: adres.sokak ?? adres.addressLine,
      binaSite: adres.binaSite ?? '',
      kat: adres.kat ?? '',
      daireNo: adres.daireNo ?? '',
      postaKodu: adres.postalCode ?? '',
    });

    // Kayitli adreste il adi kayitli; ilce/mahalle listesi icin koda ihtiyac var.
    illeriGetir()
      .then((liste) => {
        const kod = liste.find((i) => i.name === adres.city)?.code ?? '';
        setAdresForm((onceki) => (onceki.il === adres.city ? { ...onceki, ilKodu: kod } : onceki));
      })
      .catch(() => setHata('İl listesi yüklenemedi. Sayfayı yenileyin.'));
  };

  const kaydet = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');
    setGonderiliyor(true);

    const govde = {
      title: baslik,
      phone: telefon,
      fullName: `${adresForm.ad} ${adresForm.soyad}`.trim(),
      city: adresForm.il,
      district: adresForm.ilce,
      neighborhood: adresForm.mahalle,
      sokak: adresForm.sokak,
      binaSite: adresForm.binaSite,
      kat: adresForm.kat,
      daireNo: adresForm.daireNo,
      postalCode: adresForm.postaKodu,
    };

    try {
      const yanit = await fetch(
        duzenlenen ? `/api/musteri/adresler/${duzenlenen}` : '/api/musteri/adresler',
        {
          method: duzenlenen ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(govde),
        }
      );
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'Adres kaydedilemedi');
        return;
      }

      formuKapat();
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
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]" />
      </div>
    );
  }

  if (!musteri) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] py-12 px-4">
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
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="bg-gradient-to-b from-[#FBF6EF] to-[#FAFAF9] border-b border-orange-100/60">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <HesapSekmeleri />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white shadow-sm border border-orange-100 rounded-xl flex items-center justify-center">
                <LuMapPin size={20} className="text-[#BA4700]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141B2D]">Adreslerim</h1>
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

            <div className="space-y-4">
              <div>
                <label htmlFor="baslik" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adres adı <span className="text-gray-400 font-normal">(ör. Ev, İş)</span>
                </label>
                <input id="baslik" type="text" required value={baslik} onChange={(e) => setBaslik(e.target.value)}
                  className="store-input" placeholder="Ev, İş..." />
              </div>

              <AdresFormu value={adresForm} onChange={setAdresForm} idOneki="adres" />

              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1.5">Cep telefonu</label>
                <input id="telefon" type="tel" required value={telefon} onChange={(e) => setTelefon(e.target.value)}
                  className="store-input" placeholder="0532 123 45 67" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={gonderiliyor}
                className="bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg font-semibold transition">
                {gonderiliyor ? 'Kaydediliyor...' : duzenlenen ? 'Güncelle' : 'Adresi Kaydet'}
              </button>
              <button type="button" onClick={formuKapat}
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
                    {adres.neighborhood ? `${adres.neighborhood}, ` : ''}
                    {adres.addressLine}
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
