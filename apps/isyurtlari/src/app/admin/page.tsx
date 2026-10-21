'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuPackage, LuTag, LuShoppingBag, LuClock, LuArrowRight, LuActivity, LuUsers, LuTrendingUp } from 'react-icons/lu';

interface Stats { products: number; categories: number; orders: number; pendingOrders: number; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analitikOzet, setAnalitikOzet] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
    fetch('/api/admin/analitik?period=bugun')
      .then((r) => r.json())
      .then((d) => setAnalitikOzet(d.ozet))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Bugün Tekil Ziyaretçi', value: analitikOzet?.tekilZiyaretci, Icon: LuUsers,        href: '/admin/analitik',   color: 'bg-indigo-600' },
    { label: 'Toplam Ürün',           value: stats?.products,              Icon: LuPackage,      href: '/admin/urunler',    color: 'bg-blue-500'   },
    { label: 'Kategori',              value: stats?.categories,            Icon: LuTag,          href: '/admin/kategoriler', color: 'bg-violet-500' },
    { label: 'Toplam Sipariş',        value: stats?.orders,                Icon: LuShoppingBag,  href: '/admin/siparisler', color: 'bg-emerald-500' },
    { label: 'Bekleyen Sipariş',      value: stats?.pendingOrders,         Icon: LuClock,        href: '/admin/siparisler', color: 'bg-[#CC4E00]'  },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Hoş geldiniz. Genel durum ve canlı trafik özeti aşağıda.</p>
        </div>
        <Link
          href="/admin/analitik"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2040] hover:bg-[#1a3360] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <LuActivity size={14} className="text-orange-400" />
          <span>Canlı Ziyaretçi & Trafik Analitiği</span>
          <LuArrowRight size={13} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(({ label, value, Icon, href, color }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={20} color="white" strokeWidth={2} />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/analitik',       label: 'Ziyaretçi Analitiği', desc: 'Arama motoru, IP ve konum takibi', color: 'bg-indigo-50 border-indigo-200' },
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
