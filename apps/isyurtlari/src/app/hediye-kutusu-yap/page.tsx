'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LuGift,
  LuSparkles,
  LuCheck,
  LuPlus,
  LuTrash2,
  LuShoppingBag,
  LuShieldCheck,
  LuArrowRight,
  LuHeartHandshake,
  LuPackageCheck,
} from 'react-icons/lu';
import { sepeteEkle } from '@/lib/cart';

interface KutuSecenegi {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  kapasite: number;
  gorsel: string;
}

interface IcerikUrunu {
  id: string;
  ad: string;
  kategori: string;
  fiyat: number;
  gorsel: string;
}

const KUTULAR: KutuSecenegi[] = [
  {
    id: 'kutu-kraft',
    ad: 'Özel Tasarım Kraft Hediye Kutusu',
    aciklama: 'Keten kurdeleli, saman dolgulu çevre dostu şık hediye kutusu.',
    fiyat: 120,
    kapasite: 4,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
  },
  {
    id: 'kutu-ahsap',
    ad: 'El Oyması Ahşap Hatıra Sandığı',
    aciklama: 'İşyurtları marangoz atölyelerinden ceviz vernikli el yapımı ahşap sandık.',
    fiyat: 450,
    kapasite: 6,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426316977-badem-RlGZD3us6lcFfykxWV3opmLpGvkY4z.jpg',
  },
  {
    id: 'kutu-kese',
    ad: 'Doğal Ham Bez Hediye Torbası',
    aciklama: 'Büzgülü, geleneksel el dikimi bez çanta sunumu.',
    fiyat: 80,
    kapasite: 3,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
  },
];

const SECILEBILIR_URUNLER: IcerikUrunu[] = [
  {
    id: 'bal-ari-urunleri',
    ad: 'Doğal Yayla Balı (Süzme Çiçek)',
    kategori: 'Doğal Gıda',
    fiyat: 290,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426320257-bal-ari-urunleri-4MmrQbfLaPtjHUOTlgx7doMxvAB0sB.jpg',
  },
  {
    id: 'zeytinyagi-500ml',
    ad: 'Soğuk Sıkım Naturel Sızma Zeytinyağı',
    kategori: 'Doğal Gıda',
    fiyat: 350,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426323077-zeytinyagi-500ml-TX8Qvee7nsNhBqI2DUBM5RaYmwe91d.jpg',
  },
  {
    id: 'recel-cesitleri',
    ad: 'Geleneksel Reçel Çeşitleri (Vişne/İncir)',
    kategori: 'Doğal Gıda',
    fiyat: 160,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426321822-recel-cesitleri-70KHcaxT5s22UuJ9oD3smjsrI8NE9o.jpg',
  },
  {
    id: 'badem',
    ad: 'Yerli Doğal İç Badem',
    kategori: 'Kuruyemiş',
    fiyat: 240,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426316977-badem-RlGZD3us6lcFfykxWV3opmLpGvkY4z.jpg',
  },
  {
    id: 'taki-cantasi',
    ad: 'El Emeği Kadife Takı Çantası',
    kategori: 'El Sanatları',
    fiyat: 370,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426316977-badem-RlGZD3us6lcFfykxWV3opmLpGvkY4z.jpg',
  },
  {
    id: 'kuru-fasulye-tahillar',
    ad: 'Yöresel Kuru Fasulye & Bakliyat',
    kategori: 'Doğal Gıda',
    fiyat: 180,
    gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
  },
];

export default function HediyeKutusuYapPage() {
  const [seciliKutu, setSeciliKutu] = useState<KutuSecenegi>(KUTULAR[0]);
  const [seciliUrunler, setSeciliUrunler] = useState<IcerikUrunu[]>([SECILEBILIR_URUNLER[0], SECILEBILIR_URUNLER[1]]);
  const [hediyeNotu, setHediyeNotu] = useState<string>('');
  const [aliciAdi, setAliciAdi] = useState<string>('');
  const [eklendi, setEklendi] = useState(false);

  const urunToggle = (urun: IcerikUrunu) => {
    if (seciliUrunler.some((u) => u.id === urun.id)) {
      setSeciliUrunler(seciliUrunler.filter((u) => u.id !== urun.id));
    } else {
      if (seciliUrunler.length >= seciliKutu.kapasite) {
        alert(`Bu kutunun kapasitesi en fazla ${seciliKutu.kapasite} üründür. Lütfen önce bir ürünü çıkarın veya daha büyük bir kutu seçin.`);
        return;
      }
      setSeciliUrunler([...seciliUrunler, urun]);
    }
  };

  // Fiyat Hesaplama
  const araToplam = seciliKutu.fiyat + seciliUrunler.reduce((acc, u) => acc + u.fiyat, 0);
  // %10 Paket İndirimi
  const paketIndirimi = Math.round(araToplam * 0.1);
  const netTutar = araToplam - paketIndirimi;

  const sepetePaketEkle = () => {
    if (seciliUrunler.length === 0) {
      alert('Lütfen hediye kutunuzun içine en az 1 ürün ekleyiniz.');
      return;
    }

    const paketAdi = `Özel Hediye Paketi (${seciliKutu.ad} + ${seciliUrunler.length} Ürün)`;
    const basarili = sepeteEkle({
      id: `hediye_paketi_${Date.now()}`,
      name: paketAdi,
      price: netTutar,
      quantity: 50,
      slug: 'hediye-kutusu-yap',
      imageUrl: seciliKutu.gorsel,
    }, 1);

    if (basarili) {
      setEklendi(true);
      setTimeout(() => setEklendi(false), 3000);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
      {/* 1. ÜST HERO BAŞLIK */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-[#CC4E00] border border-orange-200">
          <LuSparkles /> 2026 ÖZEL KONSEPT
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Kendi Yöresel Hediye Kutunu Yap
        </h1>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Sevdikleriniz veya kurumunuz için cezaevi atölyelerinde üretilen doğal gıdalar ve el yapımı zanaat eserlerinden dilediğiniz hediye paketini oluşturun; <strong>%10 paket indirimiyle</strong> gönderelim.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SOL KOLON: ADIMLAR (8 Kolon) */}
        <div className="lg:col-span-8 space-y-8">
          {/* ADIM 1: KUTU SEÇİMİ */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0F2040] text-white text-sm font-bold flex items-center justify-center">1</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Hediye Kutusunu Seçin</h2>
                  <p className="text-xs text-gray-500">Ürünlerin içine yerleştirileceği özel ambalaj.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-400">Adım 1 / 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {KUTULAR.map((kutu) => {
                const isSelected = seciliKutu.id === kutu.id;
                return (
                  <div
                    key={kutu.id}
                    onClick={() => {
                      setSeciliKutu(kutu);
                      if (seciliUrunler.length > kutu.kapasite) {
                        setSeciliUrunler(seciliUrunler.slice(0, kutu.kapasite));
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#CC4E00] bg-orange-50/30 shadow-md'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 bg-gray-50">
                        <Image src={kutu.gorsel} alt={kutu.ad} fill sizes="200px" className="object-cover" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#CC4E00] text-white flex items-center justify-center shadow">
                            <LuCheck size={14} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{kutu.ad}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{kutu.aciklama}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                      <span className="text-[11px] font-bold text-gray-500">Maks: {kutu.kapasite} Ürün</span>
                      <span className="font-extrabold text-[#0F2040] text-sm">+{kutu.fiyat} ₺</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ADIM 2: İÇERİK ÜRÜNLERİ */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0F2040] text-white text-sm font-bold flex items-center justify-center">2</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Kutunun İçine Ürün Ekleyin</h2>
                  <p className="text-xs text-gray-500">
                    Kapasite: {seciliUrunler.length} / {seciliKutu.kapasite} ürün seçildi.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-400">Adım 2 / 3</span>
            </div>

            {/* Doluluk Çubuğu */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                style={{ width: `${(seciliUrunler.length / seciliKutu.kapasite) * 100}%` }}
                className="bg-[#CC4E00] h-full rounded-full transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
              {SECILEBILIR_URUNLER.map((urun) => {
                const seciliMi = seciliUrunler.some((u) => u.id === urun.id);
                return (
                  <div
                    key={urun.id}
                    onClick={() => urunToggle(urun)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      seciliMi
                        ? 'border-[#0F2040] bg-blue-50/30'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={urun.gorsel} alt={urun.ad} fill sizes="56px" className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-gray-400 block truncate">{urun.kategori}</span>
                      <h4 className="font-bold text-xs text-gray-900 truncate">{urun.ad}</h4>
                      <p className="font-extrabold text-[#CC4E00] text-xs mt-0.5">{urun.fiyat} ₺</p>
                    </div>

                    <button
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                        seciliMi
                          ? 'bg-[#0F2040] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      aria-label="Seç"
                    >
                      {seciliMi ? <LuCheck size={14} /> : <LuPlus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ADIM 3: ÖZEL NOT & TEBRİK KARTI */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0F2040] text-white text-sm font-bold flex items-center justify-center">3</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Özel Hediye Kartı & Tebrik Notu</h2>
                  <p className="text-xs text-gray-500">Kutunun içine mühürlü zarfla eklenecek ücretsiz tebrik kartı.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-400">Adım 3 / 3</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Alıcı İsmi (Kimin Adına Gönderilecek?)</label>
                <input
                  type="text"
                  value={aliciAdi}
                  onChange={(e) => setAliciAdi(e.target.value)}
                  placeholder="Örn: Değerli Ayşe Hanım'a..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#CC4E00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hediye Kartı Mesajınız (İsteğe Bağlı)</label>
                <textarea
                  rows={3}
                  value={hediyeNotu}
                  onChange={(e) => setHediyeNotu(e.target.value)}
                  placeholder="Sevdiklerinize iletmek istediğiniz iyi dileklerinizi yazabilirsiniz..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#CC4E00]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* SAĞ KOLON: CANLI KUTU ÖZETİ & SEPETE EKLE (4 Kolon) */}
        <div className="lg:col-span-4 sticky top-24 space-y-5">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl space-y-5">
            <div className="border-b pb-3">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                %10 PAKET İNDİRİMİ UYGULANDI
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 mt-2 flex items-center gap-2">
                <LuGift className="text-[#CC4E00]" /> Hediye Paketi Özeti
              </h3>
            </div>

            {/* Seçili Kutu */}
            <div className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-700 truncate pr-2">{seciliKutu.ad}</span>
              <span className="font-mono font-bold text-gray-900">+{seciliKutu.fiyat} ₺</span>
            </div>

            {/* Seçili Ürünler Listesi */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Kutu İçeriği ({seciliUrunler.length} / {seciliKutu.kapasite})
              </p>
              {seciliUrunler.length > 0 ? (
                seciliUrunler.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-gray-800 truncate pr-2">• {u.ad}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-semibold text-gray-900">{u.fiyat} ₺</span>
                      <button
                        onClick={() => urunToggle(u)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Çıkar"
                      >
                        <LuTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-2 text-center">Henüz ürün eklenmedi.</p>
              )}
            </div>

            {/* Fiyat Detayı */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Ürünler Toplamı</span>
                <span className="font-mono">{araToplam} ₺</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Paket İndirimi (%10)</span>
                <span className="font-mono">-{paketIndirimi} ₺</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t">
                <span>Toplam Fiyat</span>
                <span className="font-mono text-[#CC4E00]">{netTutar} ₺</span>
              </div>
            </div>

            {/* Sepete Ekle Butonu */}
            <button
              onClick={sepetePaketEkle}
              disabled={seciliUrunler.length === 0}
              className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                eklendi
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#CC4E00] hover:bg-[#a83f00] text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {eklendi ? (
                <>
                  <LuCheck size={18} /> Paket Sepete Eklendi!
                </>
              ) : (
                <>
                  <LuShoppingBag size={18} /> Hediye Paketini Sepete Ekle
                </>
              )}
            </button>

            {eklendi && (
              <Link
                href="/sepet"
                className="block text-center text-xs font-bold text-[#0F2040] hover:underline pt-1"
              >
                Sepete Git ve Siparişi Tamamla &rarr;
              </Link>
            )}

            {/* Güven Güvencesi */}
            <div className="pt-2 border-t border-gray-50 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <LuShieldCheck className="text-emerald-600 flex-shrink-0" size={15} />
                <span>Kırılmaya karşı özel korumalı ambalaj.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <LuHeartHandshake className="text-[#CC4E00] flex-shrink-0" size={15} />
                <span>Ceza infaz kurumu atölyesi garantili ürünler.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
