/**
 * Adres alanlarinin dogrulanmasi ve duzeltilmesi.
 *
 * Hem yeni adres hem guncelleme ucu ayni kurallari kullaniyor; iki yerde
 * ayri yazilsaydi biri degistiginde digeri sessizce eski kalirdi - bu
 * kod tabaninda daha once fiyat hesabinda tam bunun yasandigi bir yer
 * vardi (bkz. lib/fiyat.ts).
 */

export interface AdresGirdisi {
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string | null;
}

const kirp = (deger: unknown): string => (typeof deger === 'string' ? deger.trim() : '');

/**
 * Telefonu tek bicime indirger.
 *
 * Musteriler numarayi "0532 123 45 67", "+90 532 123 4567", "(532) 1234567"
 * gibi farkli bicimlerde giriyor. Kargo etiketine ve dogrulamaya girecek
 * numaranin tek bicimde olmasi gerekiyor. Ulke kodu yoksa Turkiye kabul
 * ediliyor.
 */
export function telefonuDuzenle(ham: string): string | null {
  const rakamlar = kirp(ham).replace(/\D/g, '');
  if (!rakamlar) return null;

  // 905321234567 / 05321234567 / 5321234567 -> +905321234567
  let govde = rakamlar;
  if (govde.startsWith('90') && govde.length === 12) govde = govde.slice(2);
  else if (govde.startsWith('0') && govde.length === 11) govde = govde.slice(1);

  if (govde.length !== 10) return null;
  return `+90${govde}`;
}

export interface DogrulamaSonucu {
  hata?: string;
  adres?: AdresGirdisi;
}

export function adresiDogrula(govde: Record<string, unknown>): DogrulamaSonucu {
  const title = kirp(govde.title) || 'Adresim';
  const fullName = kirp(govde.fullName);
  const city = kirp(govde.city);
  const district = kirp(govde.district);
  const addressLine = kirp(govde.addressLine);
  const neighborhood = kirp(govde.neighborhood) || null;
  const postalCode = kirp(govde.postalCode) || null;

  if (fullName.length < 2) return { hata: 'Ad soyad en az 2 karakter olmalı' };
  if (!city) return { hata: 'İl bilgisi gerekli' };
  if (!district) return { hata: 'İlçe bilgisi gerekli' };
  if (addressLine.length < 10) return { hata: 'Açık adres en az 10 karakter olmalı' };
  if (addressLine.length > 500) return { hata: 'Açık adres en fazla 500 karakter olabilir' };

  const phone = telefonuDuzenle(String(govde.phone ?? ''));
  if (!phone) {
    return { hata: 'Geçerli bir cep telefonu girin (örnek: 0532 123 45 67)' };
  }

  if (postalCode && !/^\d{5}$/.test(postalCode)) {
    return { hata: 'Posta kodu 5 haneli olmalı' };
  }

  return {
    adres: { title, fullName, phone, city, district, neighborhood, addressLine, postalCode },
  };
}

/** Adresi kargo etiketinde ve siparis kaydinda kullanilan tek satira cevirir. */
export function adresiYazdir(adres: {
  fullName: string;
  phone: string;
  addressLine: string;
  neighborhood?: string | null;
  district: string;
  city: string;
  postalCode?: string | null;
}): string {
  const parcalar = [
    adres.addressLine,
    adres.neighborhood,
    `${adres.district} / ${adres.city}`,
    adres.postalCode,
  ].filter(Boolean);

  return `${adres.fullName} (${adres.phone})\n${parcalar.join(', ')}`;
}
