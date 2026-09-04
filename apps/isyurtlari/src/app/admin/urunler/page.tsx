'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuPlus, LuPencil, LuTrash2, LuSearch } from 'react-icons/lu';

interface Product {
  id: string; name: string; slug: string; price: number;
  quantity: number; imageUrl?: string;
  category: { name: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/products').then((r) => r.json()).then((d) => {
      setProducts(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" silinecek. Emin misiniz?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
    setDeleting(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ürünler</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} ürün</p>
        </div>
        <Link href="/admin/urunler/yeni"
          className="bg-[#CC4E00] hover:bg-[#A63F00] text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors"
        >
          <LuPlus size={17} strokeWidth={2.5} /> Yeni Ürün
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 flex items-center gap-3 px-4">
        <LuSearch size={16} color="#9CA3AF" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün veya kategori ara..."
          className="flex-1 py-3 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Ürün bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ürün</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fiyat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Stok</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          : <span className="text-lg">📦</span>
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-gray-400 text-xs">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{product.category.name}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#CC4E00]">
                    {product.price > 0 ? `₺${product.price.toFixed(2)}` : <span className="text-gray-400 font-normal italic text-xs">Belirsiz</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {product.quantity > 0 ? `${product.quantity} adet` : 'Tükendi'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/urunler/${product.id}`}
                        className="w-8 h-8 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <LuPencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleting === product.id}
                        className="w-8 h-8 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
