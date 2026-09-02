'use client';

import { useState } from 'react';
import { LuShoppingCart, LuCheck } from 'react-icons/lu';
import { sepeteEkle, sepeteEklenebilir, type SepeteEklenebilirUrun } from '@/lib/cart';

/**
 * Urun kartlarindaki sepet butonu.
 *
 * Kart butunuyle bir <Link> oldugu icin tiklamanin yukari kabarmasini
 * durduruyoruz; aksi halde sepete eklerken ayni anda urun sayfasina gidiyor.
 *
 * Fiyati girilmemis urunlerde pasif kaliyor: fiyatsiz urun sepete eklenirse
 * sepet ve odeme toplami 0 TL cikar.
 */
export default function AddToCartButton({ product }: { product: SepeteEklenebilirUrun }) {
  const [eklendi, setEklendi] = useState(false);
  const uygun = sepeteEklenebilir(product);

  if (product.quantity <= 0) return null; // stok yok - kartta on talep rozeti var

  const tikla = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Not: "eklendi" yalnizca gorsel geri bildirim; tiklamayi engellemiyor ki
    // ust uste basan kullanici birden fazla adet ekleyebilsin.
    if (!uygun) return;
    if (sepeteEkle(product, 1)) {
      setEklendi(true);
      setTimeout(() => setEklendi(false), 1800);
    }
  };

  if (!uygun) {
    return (
      <span
        className="w-8 h-8 bg-gray-200 text-gray-400 rounded-lg flex items-center justify-center cursor-not-allowed"
        title="Bu ürünün fiyatı henüz belirlenmedi"
        aria-label="Fiyat belirlenmediği için sepete eklenemiyor"
      >
        <LuShoppingCart size={15} strokeWidth={2} />
      </span>
    );
  }

  return (
    <button
      onClick={tikla}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-white ${
        eklendi ? 'bg-green-600' : 'bg-[#FF6000] hover:bg-[#e55500]'
      }`}
      aria-label={eklendi ? 'Sepete eklendi' : 'Sepete ekle'}
      title={eklendi ? 'Sepete eklendi' : 'Sepete ekle'}
    >
      {eklendi ? <LuCheck size={15} strokeWidth={3} /> : <LuShoppingCart size={15} strokeWidth={2} />}
    </button>
  );
}
