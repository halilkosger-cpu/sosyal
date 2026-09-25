import { YEREL_GORSELLI_SLUGLAR, yerelGorselVar } from './urun-gorsel';

/**
 * Vitrinde gorunecek urunlerin ortak kosulu.
 *
 * Fotografi olmayan urun musteriye hicbir sey anlatmiyor: kartta gri bir
 * kutu, urun sayfasinda bos bir galeri kaliyor. Listeyi de bozuyor -
 * duzgun cekilmis 30 urunun arasindaki bos kutular butun sayfayi yarim
 * birakilmis gosteriyor. Google tarafinda da ayni sorun: gorseli olmayan
 * urun sayfasi "ince icerik" sayiliyor ve kategoriyi asagi cekiyor.
 *
 * ─── IKI GORSEL KAYNAGI ───────────────────────────────────────────────
 *
 * Bir urunun fotografi iki yerden gelebiliyor:
 *
 *  1. Veritabanindaki `imageUrl` (Vercel Blob'a yuklenmis dosya),
 *  2. public/urun/ altindaki yerel WebP surumler (bkz. lib/urun-gorsel.ts).
 *
 * Ikinci kaynak eklendiginde kural tek basina `imageUrl`e bakiyordu ve
 * yerel gorseli olan ama veritabaninda `imageUrl`i bos duran urunler
 * vitrinde gorunmuyordu. Kosul bu yuzden iki kaynagi birlikte soruyor.
 * Boylece gorsel eklemek yine bir deploy meselesi; veri tasima isi degil.
 *
 * Urunler veritabanindan silinmiyor, yalnizca listelerden ve sitemap'ten
 * cikariliyor. Admin panelinde gorunmeye devam ediyorlar; fotograf
 * eklendigi anda vitrine geri geliyorlar.
 *
 * Ust duzey anahtar bilerek `AND`: cagri yerlerinin bir kismi kendi
 * `OR`unu ekliyor (ornegin lib/arama.ts). Kosul dogrudan `OR` olsaydi
 * yayilma sirasinda biri digerini eziyordu.
 */
export const GORSELLI_URUN = {
  AND: [
    {
      OR: [
        { AND: [{ imageUrl: { not: null } }, { imageUrl: { not: '' } }] },
        { slug: { in: YEREL_GORSELLI_SLUGLAR } },
      ],
    },
  ],
};

/** Ayni kural bellekte suzmek icin (sunucudan gelen listeler). */
export const gorselliMi = (u: { slug?: string | null; imageUrl?: string | null }) =>
  (typeof u.imageUrl === 'string' && u.imageUrl.length > 0) ||
  (typeof u.slug === 'string' && yerelGorselVar(u.slug));
