'use client';

import { useEffect, useState } from 'react';
import { LuPlus, LuTrash2, LuPencil } from 'react-icons/lu';

interface CampaignProduct {
  productId: string;
  discount: number;
  product: { name: string; price: number };
}

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  products: CampaignProduct[];
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; discount: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/campaigns').then(r => r.json()).then(setCampaigns);
    fetch('/api/products?limit=100').then(r => r.json()).then(setProducts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Tarih kontrolü
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError('❌ Bitiş tarihi başlangıç tarihinden sonra olmalı!');
      return;
    }

    // Ürün kontrolü
    if (selectedProducts.length === 0) {
      setError('❌ En az 1 ürün seçmelisin!');
      return;
    }

    const payload = {
      name,
      startDate,
      endDate,
      ...(editId && { active: true }),
      products: selectedProducts // { id, discount } array
    };

    const res = await fetch(
      editId ? `/api/admin/campaigns/${editId}` : '/api/admin/campaigns',
      {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      if (editId) {
        setCampaigns(campaigns.map(c => c.id === editId ? updated : c));
      } else {
        setCampaigns([updated, ...campaigns]);
      }
      resetForm();
    } else {
      setError('❌ Kampanya oluşturulamadı!');
    }
  };

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setSelectedProducts([]);
    setEditId(null);
    setFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Kampanyayı sil?')) {
      await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kampanyalar</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-[#FF6000] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e55500] flex items-center gap-2"
        >
          <LuPlus size={18} /> Yeni Kampanya
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Kampanya adı"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Product Selector */}
            <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
              <p className="text-sm font-semibold mb-3">Ürünleri Seç:</p>
              {products.map(p => {
                const selected = selectedProducts.find(sp => sp.id === p.id);
                return (
                  <div key={p.id} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, { id: p.id, discount: 20 }]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(sp => sp.id !== p.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{p.name} (₺{p.price})</span>
                    </label>
                    {selected && (
                      <div className="ml-6 flex items-center gap-2">
                        <label className="text-xs text-gray-600">İndirim %:</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selected.discount}
                          onChange={e => {
                            setSelectedProducts(selectedProducts.map(sp =>
                              sp.id === p.id ? { ...sp, discount: parseFloat(e.target.value) || 0 } : sp
                            ));
                          }}
                          className="w-16 px-2 py-1 border rounded text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600">
                {editId ? 'Güncelle' : 'Oluştur'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(c.startDate).toLocaleDateString('tr-TR')} - {new Date(c.endDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {c.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            <div className="mb-3 text-sm">
              <p className="font-semibold text-gray-700 mb-2">{c.products.length} ürün:</p>
              <div className="text-gray-600 text-xs space-y-1">
                {c.products.map(cp => (
                  <div key={cp.productId}>
                    {cp.product.name} - {cp.discount}% indirim (₺{(cp.product.price * (1 - cp.discount / 100)).toFixed(2)})
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(c.id);
                  setName(c.name);
                  setStartDate(c.startDate.slice(0, 16));
                  setEndDate(c.endDate.slice(0, 16));
                  setSelectedProducts(c.products.map(cp => ({ id: cp.productId, discount: cp.discount })));
                  setFormOpen(true);
                }}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                <LuPencil size={14} /> Düzenle
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
              >
                <LuTrash2 size={14} /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
