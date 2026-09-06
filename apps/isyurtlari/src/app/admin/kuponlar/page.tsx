'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuTicket, LuInfo, LuPlus, LuTrash2 } from 'react-icons/lu';

/**
 * Yönetim: kuponlar.
 *
 * Kupon kodu oluşturulduktan sonra DEĞİŞTİRİLEMİYOR (bkz. uç). Kod
 * müşterinin elinde olabiliyor; değiştirmek dağıtılmış kuponu sessizce
 * çalışmaz hale getirirdi.
 */

interface Kupon {
  id: string;
  kod: string;
  tur: 'YUZDE' | 'TUTAR';
  deger: number;
  azamiIndirim: number | null;
  asgariTutar: number;
  aktif: boolean;
  baslangic: string | null;
  bitis: string | null;
  azamiKullanim: number | null;
  musteriBasina: number;
  hesapZorunlu: boolean;
  aciklama: string | null;
  kullanimAdedi: number;
}

const BOS_FORM = {
  kod: '',
  tur: 'YUZDE' as 'YUZDE' | 'TUTAR',
  deger: '',
  azamiIndirim: '',
  asgariTutar: '',
  azamiKullanim: '',
  musteriBasina: '1',
  hesapZorunlu: true,
  baslangic: '',
  bitis: '',
  aciklama: '',
};

export default function AdminKuponlar() {
  const [kuponlar, setKuponlar] = useState<Kupon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState(BOS_FORM);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/admin/kuponlar', { cache: 'no-store' });
      if (!yanit.ok) {
        setHata('Kuponlar getirilemedi');
        return;
      }
      const veri = await yanit.json();
      setKuponlar(Array.isArray(veri.kuponlar) ? veri.kuponlar : []);
      setHata('');
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setKaydediliyor(true);
    setHata('');
    try {
      const yanit = await fetch('/api/admin/kuponlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deger: Number(form.deger),
          azamiIndirim: form.azamiIndirim === '' ? null : Number(form.azamiIndirim),
          asgariTutar: form.asgariTutar === '' ? 0 : Number(form.asgariTutar),
          azamiKullanim: form.azamiKullanim === '' ? null : Number(form.azamiKullanim),
          musteriBasina: Number(form.musteriBasina || 1),
          baslangic: form.baslangic || null,
          bitis: form.bitis || null,
        }),
      });
      const veri = await yanit.json().catch(() => ({}));
      if (!yanit.ok) {
        setHata(veri.error || 'Kupon oluşturulamadı');
        return;
      }
      setForm(BOS_FORM);
      setFormAcik(false);
      await yukle();
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setKaydediliyor(false);
    }
  };

  const durumDegistir = async (kupon: Kupon) => {
    await fetch('/api/admin/kuponlar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: kupon.id, aktif: !kupon.aktif }),
    });
    yukle();
  };

  const sil = async (kupon: Kupon) => {
    const yanit = await fetch(`/api/admin/kuponlar?id=${encodeURIComponent(kupon.id)}`, {
      method: 'DELETE',
    });
    if (!yanit.ok) {
      const veri = await yanit.json().catch(() => ({}));
      setHata(veri.error || 'Kupon silinemedi');
      return;
    }
    yukle();
  };

  const alan = (etiket: string, ad: keyof typeof BOS_FORM, ek: Record<string, unknown> = {}) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{etiket}</label>
      <input
        value={String(form[ad] ?? '')}
        onChange={(e) => setForm((o) => ({ ...o, [ad]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        {...ek}
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <LuTicket size={20} className="text-[#BA4700]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kuponlar</h1>
            <p className="text-sm text-gray-500">
              {yukleniyor ? '...' : `${kuponlar.length} kupon`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setFormAcik((a) => !a)}
          className="flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          <LuPlus size={16} /> Yeni kupon
        </button>
      </div>

      {hata && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
          <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
          <div>{hata}</div>
        </div>
      )}

      {formAcik && (
        <form onSubmit={kaydet} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alan('Kod', 'kod', { placeholder: 'YAZ25', required: true })}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tür</label>
              <select
                value={form.tur}
                onChange={(e) => setForm((o) => ({ ...o, tur: e.target.value as 'YUZDE' | 'TUTAR' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="YUZDE">Yüzde (%)</option>
                <option value="TUTAR">Sabit tutar (₺)</option>
              </select>
            </div>
            {alan(form.tur === 'YUZDE' ? 'İndirim (%)' : 'İndirim (₺)', 'deger', {
              inputMode: 'decimal',
              required: true,
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.tur === 'YUZDE'
              ? alan('Azami indirim (₺, boş = sınırsız)', 'azamiIndirim', { inputMode: 'decimal' })
              : <div />}
            {alan('Asgari sepet tutarı (₺)', 'asgariTutar', { inputMode: 'decimal' })}
            {alan('Toplam kullanım hakkı (boş = sınırsız)', 'azamiKullanim', { inputMode: 'numeric' })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alan('Kişi başına hak', 'musteriBasina', { inputMode: 'numeric' })}
            {alan('Başlangıç', 'baslangic', { type: 'date' })}
            {alan('Bitiş', 'bitis', { type: 'date' })}
          </div>

          {alan('Açıklama (yalnızca panelde görünür)', 'aciklama')}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.hesapZorunlu}
              onChange={(e) => setForm((o) => ({ ...o, hesapZorunlu: e.target.checked }))}
              className="w-4 h-4 accent-[#FF6000]"
            />
            Yalnızca hesabı olan müşteriler kullanabilsin
          </label>
          <p className="text-xs text-gray-500 -mt-2">
            Misafir siparişlerinde kişi ancak e-postayla ayırt edilebiliyor; e-posta
            değiştirmek bedava olduğu için kişi başına sınır orada zayıf kalır.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={kaydediliyor}
              className="bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {kaydediliyor ? 'Kaydediliyor...' : 'Kuponu oluştur'}
            </button>
            <button
              type="button"
              onClick={() => setFormAcik(false)}
              className="text-sm px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
        </div>
      ) : kuponlar.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
          Henüz kupon yok.
        </div>
      ) : (
        <div className="space-y-3">
          {kuponlar.map((k) => {
            const suresiDoldu = k.bitis ? new Date(k.bitis) < new Date() : false;
            const hakkiDoldu =
              typeof k.azamiKullanim === 'number' && k.kullanimAdedi >= k.azamiKullanim;

            return (
              <div key={k.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 rounded-lg px-2.5 py-1">
                        {k.kod}
                      </span>
                      <span className="text-sm font-semibold text-[#BA4700]">
                        {k.tur === 'YUZDE' ? `%${k.deger}` : `₺${k.deger.toFixed(2)}`}
                      </span>
                      {!k.aktif && (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          Kapalı
                        </span>
                      )}
                      {k.aktif && suresiDoldu && (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                          Süresi dolmuş
                        </span>
                      )}
                      {k.aktif && !suresiDoldu && hakkiDoldu && (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                          Hakkı dolmuş
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      {k.kullanimAdedi} kullanım
                      {typeof k.azamiKullanim === 'number' ? ` / ${k.azamiKullanim}` : ''}
                      {' · kişi başına '}
                      {k.musteriBasina}
                      {k.asgariTutar > 0 ? ` · asgari ₺${k.asgariTutar.toFixed(2)}` : ''}
                      {k.tur === 'YUZDE' && k.azamiIndirim
                        ? ` · azami ₺${k.azamiIndirim.toFixed(2)}`
                        : ''}
                      {k.hesapZorunlu ? ' · hesap zorunlu' : ' · misafir kullanabilir'}
                    </p>

                    {(k.baslangic || k.bitis) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {k.baslangic ? new Date(k.baslangic).toLocaleDateString('tr-TR') : '—'}
                        {' → '}
                        {k.bitis ? new Date(k.bitis).toLocaleDateString('tr-TR') : '—'}
                      </p>
                    )}

                    {k.aciklama && <p className="text-sm text-gray-500 mt-1">{k.aciklama}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => durumDegistir(k)}
                      className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      {k.aktif ? 'Kapat' : 'Aç'}
                    </button>
                    {k.kullanimAdedi === 0 && (
                      <button
                        onClick={() => sil(k)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
                      >
                        <LuTrash2 size={14} /> Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
