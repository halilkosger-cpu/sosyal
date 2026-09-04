'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LuLayoutDashboard, LuPackage, LuTag, LuShoppingBag,
  LuLogOut, LuMenu, LuFlame, LuMail, LuActivity, LuBell, LuTag as LuPrice, LuImage, LuDatabase,
} from 'react-icons/lu';
import { useState } from 'react';

const navItems = [
  { href: '/admin',            label: 'Dashboard',   Icon: LuLayoutDashboard },
  { href: '/admin/urunler',    label: 'Ürünler',     Icon: LuPackage         },
  { href: '/admin/fiyatlar',   label: 'Fiyatlar',    Icon: LuPrice           },
  { href: '/admin/gorseller',  label: 'Görseller',   Icon: LuImage           },
  { href: '/admin/kategoriler', label: 'Kategoriler', Icon: LuTag            },
  { href: '/admin/kampanyalar', label: 'Kampanyalar', Icon: LuFlame         },
  { href: '/admin/siparisler', label: 'Siparişler',  Icon: LuShoppingBag    },
  { href: '/admin/on-talepler', label: 'Ön Talepler', Icon: LuBell          },
  { href: '/admin/email',      label: 'Email Gönder', Icon: LuMail          },
  { href: '/admin/audit-logs', label: 'Audit Logs',  Icon: LuActivity       },
  { href: '/admin/yedek',      label: 'Yedek',       Icon: LuDatabase       },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
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
      <nav className="flex-1 p-4 space-y-1">
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

      {/* Footer */}
      <div className="p-4 border-t border-blue-900/50">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-2.5 text-blue-400 hover:text-white text-sm transition-colors mb-1">
          <LuPackage size={16} />
          Siteyi Görüntüle
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm transition-all"
        >
          <LuLogOut size={16} />
          Çıkış Yap
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-[#0F2040] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setOpen(true)} className="text-white">
            <LuMenu size={22} />
          </button>
          <p className="text-white font-bold text-sm">Admin Paneli</p>
          <div className="w-6" />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
