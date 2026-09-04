'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuPackage, LuTag, LuShoppingBag, LuClock, LuArrowRight } from 'react-icons/lu';

interface Stats { products: number; categories: number; orders: number; pendingOrders: number; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
  }, []);

  const cards = [
    { label: 'Toplam Ürün',      value: stats?.products,      Icon: LuPackage,     href: '/admin/urunler',    color: 'bg-blue-500'   },
    { label: 'Kategori',         value: stats?.categories,    Icon: LuTag,         href: '/admin/kategoriler', color: 'bg-violet-500' },
    { label: 'Toplam Sipariş',   value: stats?.orders,        Icon: LuShoppingBag, href: '/admin/siparisler', color: 'bg-emerald-500' },
    { label: 'Bekleyen Sipariş', value: stats?.pendingOrders, Icon: LuClock,       href: '/admin/siparisler', color: 'bg-[#CC4E00]'  },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Hoş geldiniz. Genel durum özeti aşağıda.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, Icon, href, color }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={20} color="white" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/urunler/yeni',   label: 'Yeni Ürün Ekle',      desc: 'Kataloğa yeni ürün ekleyin',      color: 'bg-blue-50 border-blue-200'    },
          { href: '/admin/kategoriler',    label: 'Kategori Yönet',       desc: 'Kategorileri düzenleyin',         color: 'bg-violet-50 border-violet-200' },
          { href: '/admin/siparisler',     label: 'Siparişleri Görüntüle', desc: 'Bekleyen siparişleri inceleyin', color: 'bg-orange-50 border-orange-200' },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href}
            className={`${color} border rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow group`}
          >
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
            </div>
            <LuArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
