/**
 * Havale/EFT banka bilgileri.
 *
 * Bilgiler yalnizca ortam degiskenlerinden okunur. Kodda varsayilan deger
 * TUTULMAZ: onceden burada gercek bir kisi adi ve IBAN gomuluydu, env
 * tanimli olmadiginda musteriye o gosteriliyordu.
 *
 * Bilgi eksikse uydurma bir deger uretmek yerine bos donuyoruz; arayuz
 * "henuz tanimlanmadi" mesajini gosterip musteriyi iletisime yonlendiriyor.
 */

export interface BankaBilgisi {
  bankName: string;
  accountName: string;
  iban: string;
  branch: string;
  accountNo: string;
}

export const BANKA_BILGISI_YOK_MESAJI =
  'Banka bilgileri henüz tanımlanmamıştır. Lütfen info@isyurtlari.com.tr adresinden bizimle iletişime geçin.';

export function bankaBilgileri(): BankaBilgisi {
  return {
    bankName: (process.env.BANK_NAME || '').trim(),
    accountName: (process.env.BANK_ACCOUNT_NAME || '').trim(),
    iban: (process.env.BANK_ACCOUNT_IBAN || '').trim(),
    branch: (process.env.BANK_ACCOUNT_BRANCH || '').trim(),
    accountNo: (process.env.BANK_ACCOUNT_NO || '').trim(),
  };
}

/** Havale talimati verebilmek icin en azindan hesap adi ve IBAN gerekli. */
export function bankaBilgisiTam(b: BankaBilgisi = bankaBilgileri()): boolean {
  return b.accountName.length > 0 && b.iban.length > 0;
}
