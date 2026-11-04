'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuMessageSquare, LuStar, LuCheck, LuX, LuTrash2, LuBadgeCheck } from 'react-icons/lu';

/**
 * Yönetim: ürün yorumları moderasyonu.
 *
 * Müşteri yorumları onay bekleyen olarak kaydedilir ve yalnızca burada
 * onaylandıktan sonra ürün sayfasında ve puan özetinde görünür.
 */

interface Yorum {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  approved: boolean;
  createdAt: string;
  dogrulanmis: boolean;
  product: { name: string; slug: string };
  customer: { name: string; email: string } | null;
}

type Durum = 'bekleyen' | 'yayinda' | 'hepsi';

const SEKMELER: { id: Durum; ad: string }[] = [
  { id: 'bekleyen', ad: 'Onay bekleyen' },
  { id: 'yayinda', ad: 'Yayında' },
  { id: 'hepsi', ad: 'Tümü' },
];

export default function YorumlarSayfasi() {
  const [durum, setDurum] = useState<Durum>('bekleyen');
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [islemde, setIslemde] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const res = await fetch(`/api/admin/yorumlar?durum=${durum}`);
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error || 'Yorumlar getirilemedi');
      setYorumlar(veri.yorumlar ?? []);
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yorumlar getirilemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [durum]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const onayla = async (id: string, onayli: boolean) => {
    setIslemde(id);
    setHata('');
    try {
      const res = await fetch('/api/admin/yorumlar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, onayli }),
      });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error || 'İşlem başarısız');
      await yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setIslemde(null);
    }
  };

  const sil = async (id: string) => {
    if (!window.confirm('Bu yorum kalıcı olarak silinsin mi?')) return;
    setIslemde(id);
    setHata('');
    try {
      const res = await fetch(`/api/admin/yorumlar?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error || 'Silinemedi');
      await yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setIslemde(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <LuMessageSquare size={20} className="text-[#BA4700]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yorumları</h1>
            <p className="text-sm text-gray-500">{yukleniyor ? '...' : `${yorumlar.length} kayıt`}</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={durum === s.id}
              onClick={() => setDurum(s.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                durum === s.id ? 'bg-white text-[#BA4700] shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s.ad}
            </button>
          ))}
        </div>
      </div>

      {hata && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 font-semibold">{hata}</div>
      )}

      {!yukleniyor && yorumlar.length === 0 && !hata && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
          {durum === 'bekleyen' ? 'Onay bekleyen yorum yok.' : 'Bu görünümde yorum yok.'}
        </div>
      )}

      <div className="space-y-4">
        {yorumlar.map((y) => (
          <div key={y.id} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <a
                  href={`/urun/${y.product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-gray-900 hover:text-[#BA4700]"
                >
                  {y.product.name}
                </a>
                <p className="text-sm text-gray-500 mt-0.5">
                  {y.customer?.name ?? 'Müşteri'}
                  {y.customer?.email ? ` · ${y.customer.email}` : ''} · {new Date(y.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {y.dogrulanmis && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <LuBadgeCheck size={13} /> Doğrulanmış alışveriş
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    y.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {y.approved ? 'Yayında' : 'Onay bekliyor'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 mb-2" aria-label={`${y.rating} yıldız`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <LuStar key={n} size={16} className={n <= y.rating ? 'text-[#E8620C] fill-[#E8620C]' : 'text-gray-300'} />
              ))}
            </div>
            {y.title && <p className="font-semibold text-gray-900">{y.title}</p>}
            <p className="text-gray-700 text-sm whitespace-pre-wrap mt-1">{y.text}</p>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {!y.approved ? (
                <button
                  onClick={() => onayla(y.id, true)}
                  disabled={islemde === y.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <LuCheck size={16} /> Yayına al
                </button>
              ) : (
                <button
                  onClick={() => onayla(y.id, false)}
                  disabled={islemde === y.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold disabled:opacity-50"
                >
                  <LuX size={16} /> Yayından kaldır
                </button>
              )}
              <button
                onClick={() => sil(y.id)}
                disabled={islemde === y.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-50"
              >
                <LuTrash2 size={16} /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
