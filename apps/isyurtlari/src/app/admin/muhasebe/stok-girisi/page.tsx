'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuPackagePlus, LuArrowLeft, LuHistory, LuTriangleAlert, LuCheck } from 'react-icons/lu';

export default function StokGirisiSayfasi() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: 'basari' | 'hata'; text: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    invoiceNo: '',
    supplier: '',
    notes: '',
  });

  const seciliUrun = products.find((p) => p.id === form.productId);

  const yukle = async () => {
    setLoading(true);
    try {
      const [resProd, resMov] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/muhasebe/stok-hareketleri').then((r) => r.json()),
      ]);

      setProducts(Array.isArray(resProd) ? resProd : []);
      setMovements(Array.isArray(resMov) ? resMov : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    yukle();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.unitCost) return;

    setSubmitting(true);
    setMesaj(null);
    try {
      const res = await fetch('/api/admin/muhasebe/stok-hareketleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (res.ok) {
        setMesaj({
          tur: 'basari',
          text: `Stok başarıyla eklendi! Yeni Ağırlıklı Ortalama Maliyet: ${json.product?.purchasePrice} ₺`,
        });
        setForm({
          productId: '',
          quantity: '',
          unitCost: '',
          invoiceNo: '',
          supplier: '',
          notes: '',
        });
        yukle();
      } else {
        setMesaj({ tur: 'hata', text: json.error || 'Stok girişi başarısız oldu' });
      }
    } catch {
      setMesaj({ tur: 'hata', text: 'Sunucuya bağlanılamadı' });
    } finally {
      setSubmitting(false);
    }
  };

  const paraFormat = (val: number) =>
    (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/muhasebe"
          className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition-colors"
        >
          <LuArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mal Alış & Stok Girişi (WAV)</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            İşyurtları tesislerinden gelen ürünlerin irsaliye/fatura girişini yapın. Sistem birim maliyeti otomatik hesaplar.
          </p>
        </div>
      </div>

      {mesaj && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            mesaj.tur === 'basari' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mesaj.tur === 'basari' ? <LuCheck size={18} /> : <LuTriangleAlert size={18} />}
          <span>{mesaj.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Mal Giriş Formu */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LuPackagePlus className="text-[#CC4E00]" /> Yeni Mal / Stok Kabulü
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Seçin *</label>
              <select
                required
                value={form.productId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const prod = products.find((p) => p.id === pid);
                  setForm({
                    ...form,
                    productId: pid,
                    unitCost: prod?.purchasePrice ? String(prod.purchasePrice) : '',
                  });
                }}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
              >
                <option value="">— Ürün Seçin —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Mevcut Stok: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            {seciliUrun && (
              <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-600 border border-gray-100">
                <p>
                  Mevcut Stok: <strong>{seciliUrun.quantity} adet</strong>
                </p>
                <p>
                  Mevcut Alış Maliyeti: <strong>{paraFormat(seciliUrun.purchasePrice)}</strong>
                </p>
                <p>
                  Satış Fiyatı: <strong>{paraFormat(seciliUrun.price)}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gelen Adet *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Örn: 20"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Birim Alış Fiyatı (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  placeholder="0.00"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">İrsaliye / Fatura No</label>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                  placeholder="IRS-2026-01"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tedarikçi / İşyurdu</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Örn: Isparta İşyurdu"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notlar</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Parti/parti no vb..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
            >
              <LuPackagePlus size={18} /> {submitting ? 'Hesaplanıyor...' : 'Stok Girişini Kaydet'}
            </button>
          </form>
        </div>

        {/* Sağ Kolon: Geçmiş Stok Hareketleri Tablosu */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LuHistory className="text-gray-400" /> Son Stok Kabul Hareketleri
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Hareketler yükleniyor...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">
              Henüz mal alış / stok kabul hareketi kaydedilmemiş.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Ürün</th>
                    <th className="py-3 px-3 text-right">Giriş Adedi</th>
                    <th className="py-3 px-3 text-right">Giriş Maliyeti</th>
                    <th className="py-3 px-3 text-right">Toplam Tutar</th>
                    <th className="py-3 px-3">Belge / Tedarikçi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {mov.product?.name || 'Ürün'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        +{mov.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700">
                        {paraFormat(mov.unitCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        {paraFormat(mov.totalCost)}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        {mov.supplier || '—'} {mov.invoiceNo ? `• ${mov.invoiceNo}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
