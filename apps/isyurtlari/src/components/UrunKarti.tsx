'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PreOrderBadge from '@/components/PreOrderBadge';
import FavoriteButton from '@/components/FavoriteButton';
import AddToCartButton from '@/components/AddToCartButton';

/**
 * Urun karti.
 *
 * Onceden dort ayri yerde (ana sayfa, kategori, arama, favoriler) elle
 * yazilmis dort kart vardi. Bir rozet ya da fiyat kurali degistiginde dort
 * dosyaya dokunmak gerekiyordu ve kartlar zamanla birbirinden ayrismisti.
 * Ayrisma sadece gorsel degildi, uc gercek hata birikmisti:
 *
 *  1) Ana sayfa kampanyayi hic gostermiyordu: kampanyali bir urunun
 *     kartinda indirimsiz fiyat yaziyor, musteri sepete atinca daha dusuk
 *     bir tutar goruyordu.
 *  2) Ana sayfa ve arama, stokta olan her urune "YENI" rozeti basiyordu.
 *     Urunun yeni olup olmadigina bakan bir sey yoktu. Kategori sayfasi
 *     ayni yerde dogru olani, "Stokta" yaziyordu; birlesik kart bunu
 *     kullaniyor.
 *  3) Arama sayfasi tukenmis urunlerde on talep baglantisini gostermiyordu.
 *
 * Kartin gorunumu sayfadan sayfaya degisebilsin diye farkliliklar prop
 * olarak disari alindi; karar mantigi (fiyat, stok, kampanya, baglanti
 * hedefi) tek yerde.
 *
 * BILINEN EKSIK (Faz 3): sarmalaLink acikken kart butunuyle bir <a>, favori
 * ve sepet butonlari da onun icinde kaliyor - <button> icinde <a> gecerli
 * HTML degil. Sitede zaten boyleydi, bu bilesen mevcut davranisi koruyor.
 * Dogru cozum kart govdesini <div> yapip baslik uzerine mutlak konumlu bir
 * ortu baglantisi koymak; kart yeniden tasarlanirken birlikte yapilacak.
 */

export interface KartUrunu {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Stok adedi. 0 ise kart "tukendi" durumunda cizilir. */
  quantity: number;
  description?: string;
  imageUrl?: string | null;
  category?: { name: string; slug: string; kdvOrani?: number } | null;
  campaign?: { discount: number; discountedPrice: number } | null;
  /** Onaylı yorumların ortalaması. Yorum yoksa null/undefined gelir. */
  puan?: number | null;
  /** Onaylı yorum sayısı. */
  yorumSayisi?: number;
}

export interface UrunKartiProps {
  urun: KartUrunu;
  /** Urunun gorseli yoksa cizilecek icerik (kategori ikonu, emoji vb.). */
  gorselYedek?: ReactNode;
  /** Gorsel alanina uygulanacak tailwind gradyan siniflari. */
  gorselArkaPlani?: string;
  /** Gorsel alaninin yuksekligi (tailwind sinifi). */
  gorselYuksekligi?: string;
  /** next/image sizes degeri. */
  gorselBoyutlari?: string;
  /** Ilk ekranda gorunen kartlarda true: gorsel oncelikli yuklenir. */
  gorselOncelikli?: boolean;
  /** Urun aciklamasini kartta goster. */
  aciklamaGoster?: boolean;
  /** Baslikin ustunde kategori adini goster. */
  kategoriGoster?: boolean;
  /** Gorselin sag alt kosesindeki etki rozeti metni. */
  etkiRozeti?: string;
  favoriButonu?: boolean;
  sepetButonu?: boolean;
  /** Kartin altina eklenecek serbest icerik (or. "favorilerden cikar"). */
  altAlan?: ReactNode;
  /**
   * Kartin tamami baglanti mi olsun?
   *
   * Favoriler sayfasinda kartin icinde kendi butonlari var; ic ice buton
   * ve baglanti gecerli HTML degil, o yuzden orada yalnizca baslik baglanti.
   */
  sarmalaLink?: boolean;
}

export default function UrunKarti({
  urun,
  gorselYedek,
  gorselArkaPlani = 'from-orange-100 to-amber-100',
  gorselYuksekligi = 'h-44',
  gorselBoyutlari = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  gorselOncelikli = false,
  aciklamaGoster = false,
  kategoriGoster = false,
  etkiRozeti,
  favoriButonu = true,
  sepetButonu = false,
  altAlan,
  sarmalaLink = true,
}: UrunKartiProps) {
  const tukendi = urun.quantity <= 0;
  const fiyatVar = urun.price > 0;
  const gecerliFiyat = urun.campaign?.discountedPrice ?? urun.price;

  // Tukenmis urunun baglantisi on talep formunu acik getiriyor: musteri
  // sayfaya varinca "stoga girince haber ver" adimi hazir olsun.
  const hedef = `/urun/${urun.slug}${tukendi ? '?on-talep=1' : ''}`;

  const gorsel = (
    <div className={`relative ${gorselYuksekligi} bg-gradient-to-br ${gorselArkaPlani} flex items-center justify-center overflow-hidden`}>
      {urun.imageUrl ? (
        <Image
          src={urun.imageUrl}
          alt={urun.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={gorselBoyutlari}
          quality={70}
          placeholder="empty"
          priority={gorselOncelikli}
          loading={gorselOncelikli ? undefined : 'lazy'}
        />
      ) : (
        gorselYedek ?? <span className="text-6xl select-none">📦</span>
      )}

      {tukendi && (
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Tükendi</span>
            <PreOrderBadge />
          </div>
        </div>
      )}

      {!tukendi && (
        <span className="absolute top-2 left-2 bg-[#CC4E00] text-white text-[10px] font-bold px-2 py-0.5 rounded">
          Stokta
        </span>
      )}

      {urun.campaign && (
        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          %{urun.campaign.discount} İndirim
        </span>
      )}

      {etkiRozeti && (
        <span className="absolute bottom-2 right-2 bg-[#0F2040] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full max-w-[150px] line-clamp-2">
          {etkiRozeti}
        </span>
      )}
    </div>
  );

  const baslik = (
    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] mb-1 group-hover:text-[#BA4700] transition-colors leading-snug">
      {urun.name}
    </h3>
  );

  const govde = (
    <div className="p-3.5 flex flex-col flex-1">
      {kategoriGoster && urun.category && (
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
          {urun.category.name}
        </p>
      )}

      {sarmalaLink ? baslik : <Link href={hedef}>{baslik}</Link>}

      {/* Puan.
          Burada bir zamanlar her urune sabit bes dolu yildiz ve "5.0"
          basiliyordu; hicbir veriden gelmiyordu. Simdi liste ucundan gelen
          gercek ortalama gosteriliyor ve YORUMU OLMAYAN URUNDE hic
          cizilmiyor: "henuz yorum yok" ile "puani dusuk" ayni sey degil. */}
      {typeof urun.puan === 'number' && (urun.yorumSayisi ?? 0) > 0 && (
        <div className="flex items-center gap-1 mb-2" aria-label={`5 üzerinden ${urun.puan}`}>
          <span className="flex" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((yildiz) => (
              <svg
                key={yildiz}
                viewBox="0 0 20 20"
                className={`w-3 h-3 ${yildiz <= Math.round(urun.puan!) ? 'text-[#FF6000]' : 'text-gray-300'}`}
                fill="currentColor"
              >
                <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
              </svg>
            ))}
          </span>
          <span className="text-[11px] font-semibold text-gray-700 ml-0.5">{urun.puan.toFixed(1)}</span>
          <span className="text-[11px] text-gray-400">({urun.yorumSayisi})</span>
        </div>
      )}

      {aciklamaGoster && urun.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1 leading-relaxed">
          {urun.description}
        </p>
      )}

      <div className="flex items-end justify-between gap-2 pt-2 mt-auto border-t border-gray-100">
        <div className="flex flex-col">
          {fiyatVar ? (
            urun.campaign ? (
              <>
                <span className="text-xs text-gray-400 line-through tracking-tight">
                  ₺{urun.price.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-red-600 tracking-tight">
                  ₺{gecerliFiyat.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-[#BA4700] tracking-tight">
                ₺{urun.price.toFixed(2)}
              </span>
            )
          ) : (
            <span className="text-xs text-gray-500 italic">Fiyat belirleniyor</span>
          )}
        </div>

        {(favoriButonu || sepetButonu) && (
          <div className="flex items-center gap-2">
            {favoriButonu && <FavoriteButton productId={urun.id} size="sm" />}
            {sepetButonu && (
              <AddToCartButton
                product={{
                  id: urun.id,
                  name: urun.name,
                  price: gecerliFiyat,
                  slug: urun.slug,
                  imageUrl: urun.imageUrl,
                  quantity: urun.quantity,
                  campaign: urun.campaign ?? null,
                  kdvOrani: urun.category?.kdvOrani ?? null,
                }}
              />
            )}
          </div>
        )}
      </div>

      {altAlan}
    </div>
  );

  const kartSiniflari =
    'group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col';

  if (!sarmalaLink) {
    return (
      <div className={kartSiniflari}>
        {gorsel}
        {govde}
      </div>
    );
  }

  return (
    <Link href={hedef} className={kartSiniflari}>
      {gorsel}
      {govde}
    </Link>
  );
}
