/**
 * Yonetim uclarinda kullanilan kucuk dogrulayicilar.
 *
 * Gorsel ve ikon adresleri yalnizca yukleme ucundan donen https bagi olabilir;
 * istemciden gelen serbest metin dogrudan veritabanina yazilmamali.
 */
export function gecerliGorselAdresi(deger: unknown): deger is string {
  return typeof deger === 'string' && /^https:\/\/[^\s"']+$/.test(deger);
}
