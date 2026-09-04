'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LuChevronLeft, LuSave, LuUpload, LuX } from 'react-icons/lu';
import { gorseliKucult } from '@/lib/gorsel';

interface Category { id: string; name: string; slug: string; }

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', categoryId: '',
    price: '', quantity: '', imageUrl: '',
  });

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => r.json()).then((d) => {
      setCategories(Array.isArray(d) ? d : []);
    });
  }, []);

  const set = (k: string, v: string) => {
    setForm((f) => ({
      ...f,
      [k]: v,
      ...(k === 'name' ? { slug: slugify(v) } : {}),
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError('');

    // Yuklemeden once tarayicida kucult. images.unoptimized acik oldugu icin
    // Blob'a ne konursa ziyaretciye aynen o gidiyor; elle yuklenen fotograflar
    // 1200x800 ve 500-600 KB geliyordu.
    const { dosya: kucuk } = await gorseliKucult(file);

    const formData = new FormData();
    formData.append('file', kucuk);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Dosya yüklenirken hata oluştu');
        return;
      }

      const data = await res.json();
      set('imageUrl', data.url);
    } catch (err) {
      setError('Dosya yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/admin/urunler');
    } else {
      const d = await res.json();
      setError(d.error || 'Hata oluştu');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/urunler" className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
          <LuChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Yeni Ürün</h1>
          <p className="text-gray-500 text-sm">Kataloğa yeni ürün ekleyin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ürün Adı *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000]"
              placeholder="Zeytinyağı 1L" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug *</label>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000] font-mono"
              placeholder="zeytinyagi-1l" />
            <p className="text-xs text-gray-400 mt-1">URL: /urun/{form.slug || '...'}</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Açıklama *</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000] resize-none"
              placeholder="Ürün açıklaması..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori *</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] bg-white"
            >
              <option value="">Seçin...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fiyat (₺)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000]"
              placeholder="0.00" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok Adedi</label>
            <input type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000]"
              placeholder="0" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ürün Resmi</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative w-full px-4 py-8 border-2 border-dashed rounded-xl transition-colors ${
                dragActive ? 'border-[#FF6000] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {form.imageUrl ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 mb-3">
                    <Image
                      src={form.imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set('imageUrl', '')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors text-sm font-medium"
                  >
                    <LuX size={16} /> Resmi Kaldır
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center text-center">
                    <LuUpload size={32} className={uploading ? 'text-orange-400' : 'text-gray-400'} />
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      {uploading ? 'Yükleniyor...' : 'Resmi buraya sürükleyin veya seçin'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">JPG veya PNG • Max 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/admin/urunler"
            className="flex-1 text-center border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            İptal
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <LuSave size={16} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
