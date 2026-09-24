/**
 * Vitrinde gorunecek urunlerin ortak kosulu.
 *
 * Fotografi olmayan urun musteriye hicbir sey anlatmiyor: kartta gri bir
 * kutu, urun sayfasinda bos bir galeri kaliyor. Listeyi de bozuyor -
 * duzgun cekilmis 30 urunun arasindaki 14 bos kutu butun sayfayi yarim
 * birakilmis gosteriyor. Google tarafinda da ayni sorun: gorseli olmayan
 * urun sayfasi "ince icerik" sayiliyor ve kategoriyi asagi cekiyor.
 *
 * Urunler veritabanindan silinmiyor, yalnizca listelerden ve sitemap'ten
 * cikariliyor. Admin panelinde gorunmeye devam ediyorlar; fotograf
 * yuklendigi anda hicbir kod degisikligi olmadan vitrine geri geliyorlar.
 */
export const GORSELLI_URUN = {
  AND: [{ imageUrl: { not: null } }, { imageUrl: { not: '' } }],
};

/** Ayni kural bellekte suzmek icin (sunucudan gelen listeler). */
export const gorselliMi = (u: { imageUrl?: string | null }) =>
  typeof u.imageUrl === 'string' && u.imageUrl.length > 0;
