'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuPlus, LuTrash2, LuReceipt, LuArrowLeft, LuFilter } from 'react-icons/lu';

const KATEGORI_ETIKETLERI: Record<string, string> = {
  SHIPPING: '🚚 Kargo ve Paketleme',
  MARKETING: '📢 Reklam & Pazarlama',
  COMMISSION: '💳 POS & Komisyon',
  OPERATIONAL: '🏢 Genel İşletme & Ofis',
};

export default function GiderlerSayfasi() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seciliKategori, setSeciliKategori] = useState<string>('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'SHIPPING',
    amount: '',
    vatRate: '20',
    invoiceNo: '',
    supplier: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const yukle = () => {
    setLoading(true);
    const url = seciliKategori
      ? `/api/admin/muhasebe/giderler?category=${seciliKategori}`
      : '/api/admin/muhasebe/giderler';

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setExpenses(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    yukle();
  }, [seciliKategori]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/muhasebe/giderler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          title: '',
          category: 'SHIPPING',
          amount: '',
          vatRate: '20',
          invoiceNo: '',
          supplier: '',
          notes: '',
          date: new Date().toISOString().split('T')[0],
        });
        yukle();
      } else {
        alert('Gider kaydedilirken bir hata oluştu');
      }
    } catch (error) {
      console.error(error);
      alert('İstek gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSil = async (id: string) => {
    if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/admin/muhasebe/giderler?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Silme işlemi başarısız');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const paraFormat = (val: number) =>
    val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Geri Dönüş */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/muhasebe"
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition-colors"
          >
            <LuArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">İşletme Giderleri Yönetimi</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Kargo, komisyon, reklam ve genel gider faturalarını kaydedin ve KDV indirimini takip edin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Yeni Gider Ekleme Formu */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LuReceipt className="text-[#CC4E00]" /> Yeni Gider Fişi / Faturası
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama / Harcama Adı *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Örn: Ekim Ayı Yurtiçi Kargo Faturası"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gider Kategorisi *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                >
                  <option value="SHIPPING">🚚 Kargo & Paketleme</option>
                  <option value="MARKETING">📢 Reklam & Pazarlama</option>
                  <option value="COMMISSION">💳 POS & Komisyon</option>
                  <option value="OPERATIONAL">🏢 Genel İşletme & Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">KDV Oranı (%) *</label>
                <select
                  value={form.vatRate}
                  onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                >
                  <option value="20">%20 (Standart)</option>
                  <option value="10">%10 (Özel)</option>
                  <option value="1">%1 (Gıda/Tarımsal)</option>
                  <option value="0">%0 (KDV'siz / Muaf)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tutar (KDV Dahil ₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Belge Tarihi *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fatura / Fiş No</label>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                  placeholder="GIB2026000001"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tedarikçi / Kurum</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Örn: Yurtiçi Kargo A.Ş."
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
                placeholder="Ödeme dekontu vb. detaylar..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
            >
              <LuPlus size={18} /> {submitting ? 'Kaydediliyor...' : 'Gideri Kaydet'}
            </button>
          </form>
        </div>

        {/* Sağ Kolon: Kayıtlı Giderler Tablosu */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-gray-900">Kayıtlı Giderler Listesi</h2>
            <div className="flex items-center gap-2">
              <LuFilter size={16} className="text-gray-400" />
              <select
                value={seciliKategori}
                onChange={(e) => setSeciliKategori(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="SHIPPING">🚚 Kargo</option>
                <option value="MARKETING">📢 Reklam</option>
                <option value="COMMISSION">💳 Komisyon</option>
                <option value="OPERATIONAL">🏢 Genel İşletme</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Giderler yükleniyor...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">
              Henüz kaydedilmiş bir gider bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Açıklama / Tedarikçi</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-right">KDV Matrahı</th>
                    <th className="py-3 px-3 text-right">KDV</th>
                    <th className="py-3 px-3 text-right">Toplam (₺)</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((exp) => {
                    const vatRate = exp.vatRate ?? 20;
                    const matrah = exp.amount / (1 + vatRate / 100);
                    const kdv = exp.amount - matrah;

                    return (
                      <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(exp.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-gray-900 leading-tight">{exp.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {exp.supplier || '—'} {exp.invoiceNo ? `• Fatura: ${exp.invoiceNo}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-xs whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium text-[11px]">
                            {KATEGORI_ETIKETLERI[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-gray-600 font-medium">
                          {paraFormat(matrah)}
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-purple-600 font-medium">
                          %{vatRate} ({paraFormat(kdv)})
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          {paraFormat(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleSil(exp.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
