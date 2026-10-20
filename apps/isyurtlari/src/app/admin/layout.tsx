'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LuLayoutDashboard, LuPackage, LuTag, LuShoppingBag,
  LuLogOut, LuMenu, LuMail, LuActivity, LuBell, LuTag as LuPrice, LuImage, LuDatabase,
  LuRotateCcw, LuTicket, LuFileText, LuShieldCheck,
} from 'react-icons/lu';
import { useState } from 'react';

const navItems = [
  { href: '/admin',            label: 'Dashboard',   Icon: LuLayoutDashboard },
  { href: '/admin/urunler',    label: 'Ürünler',     Icon: LuPackage         },
  { href: '/admin/fiyatlar',   label: 'Fiyatlar',    Icon: LuPrice           },
  { href: '/admin/gorseller',  label: 'Görseller',   Icon: LuImage           },
  { href: '/admin/aciklamalar', label: 'Açıklamalar', Icon: LuFileText       },
  { href: '/admin/kategoriler', label: 'Kategoriler', Icon: LuTag            },
  { href: '/admin/muhasebe',   label: 'Ön Muhasebe & Kâr', Icon: LuLayoutDashboard },
  { href: '/admin/siparisler', label: 'Siparişler',  Icon: LuShoppingBag    },
  { href: '/admin/on-talepler', label: 'Ön Talepler', Icon: LuBell          },
  { href: '/admin/iadeler',    label: 'İadeler',      Icon: LuRotateCcw      },
  { href: '/admin/email',      label: 'Email Gönder', Icon: LuMail          },
  { href: '/admin/kuponlar',   label: 'Kuponlar',    Icon: LuTicket         },
  { href: '/admin/audit-logs', label: 'Denetim Günlüğü', Icon: LuActivity    },
  { href: '/admin/yedek',      label: 'Yedek',       Icon: LuDatabase       },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === '/admin/login' || pathname === '/admin/logout') return <>{children}</>;

  const handleLogout = () => {
    window.location.href = '/admin/logout';
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64 flex-shrink-0'}`}>
      {/* Logo */}
      <div className="p-5 border-b border-blue-900/50">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-white rounded-xl p-1.5">
            <Image src="/logo.jpg" alt="Logo" width={80} height={30} className="object-contain h-7 w-auto" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">Admin Paneli</p>
            <p className="text-blue-400 text-[10px]">isyurtlari.com.tr</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#CC4E00] text-white shadow-lg shadow-orange-900/30'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Alt Bölüm & Güvenli Çıkış */}
      <div className="p-4 border-t border-blue-900/50 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2 text-blue-400 hover:text-white text-xs transition-colors rounded-lg hover:bg-white/5"
        >
          <LuPackage size={15} />
          Siteyi Görüntüle
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <LuLogOut size={16} />
          {loggingOut ? 'Çıkış Yapılıyor...' : 'Güvenli Çıkış Yap'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex bg-[#0F2040] w-64 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0F2040] flex flex-col">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content & Top Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Üst Yönetici Barı (Header) */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menüyü Aç"
            >
              <LuMenu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                2FA Korumalı Oturum Aktif
              </span>
            </div>
          </div>

          {/* Sağ Üst: Belirgin Güvenli Çıkış Butonu */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Yetkili: <strong className="text-gray-800">Yönetici</strong>
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 text-red-700 hover:text-white font-bold rounded-xl text-xs transition-all shadow-xs"
              title="Oturumu güvenle kapat ve çerezleri temizle"
            >
              <LuLogOut size={15} />
              {loggingOut ? 'Çıkılıyor...' : 'Güvenli Çıkış'}
            </button>
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
