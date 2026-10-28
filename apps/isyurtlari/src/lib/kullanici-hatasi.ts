/** Kullaniciya gosterilmesi guvenli is kurali hatasi; diger hatalar istemciye sabit mesajla doner. */
export class KullaniciHatasi extends Error {}

export const guvenliHataMesaji = (hata: unknown, sabit: string) =>
  hata instanceof KullaniciHatasi ? hata.message : sabit;
