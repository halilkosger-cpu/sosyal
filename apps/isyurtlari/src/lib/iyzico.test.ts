import { describe, expect, it } from 'vitest';
import { iyzicoSayfasiMi, odemeGecerli } from './iyzico';

describe('odemeGecerli', () => {
  const basarili = { status: 'success', paymentStatus: 'SUCCESS', fraudStatus: 1 };

  it('kampanya indiriminde price yerine tahsil edilen paidPrice ile dogrular', () => {
    expect(odemeGecerli({ ...basarili, price: '46.67', paidPrice: '42.00' }, 42)).toBe(true);
  });

  it('taksit vade farki eklenmis tahsilati kabul eder', () => {
    expect(odemeGecerli({ ...basarili, price: '46.67', paidPrice: '44.10' }, 42)).toBe(true);
  });

  it('eksik tahsilati, basarisiz ve fraud supheli odemeyi reddeder', () => {
    expect(odemeGecerli({ ...basarili, paidPrice: '41.00' }, 42)).toBe(false);
    expect(odemeGecerli({ ...basarili, paymentStatus: 'FAILURE', paidPrice: '42.00' }, 42)).toBe(false);
    expect(odemeGecerli({ ...basarili, fraudStatus: 0, paidPrice: '42.00' }, 42)).toBe(false);
    expect(odemeGecerli({ ...basarili }, 42)).toBe(false);
  });
});

describe('iyzicoSayfasiMi', () => {
  it('iyzico odeme sayfalarini kabul eder', () => {
    expect(iyzicoSayfasiMi('https://cpp.iyzipay.com?token=abc&lang=tr')).toBe(true);
    expect(iyzicoSayfasiMi('https://iyzipay.com/odeme')).toBe(true);
  });

  it('baska alan adlarini, http ve gecersiz degerleri reddeder', () => {
    expect(iyzicoSayfasiMi('https://iyzipay.com.kotu.site/odeme')).toBe(false);
    expect(iyzicoSayfasiMi('https://kotuiyzipay.com/odeme')).toBe(false);
    expect(iyzicoSayfasiMi('http://cpp.iyzipay.com')).toBe(false);
    expect(iyzicoSayfasiMi('javascript:alert(1)')).toBe(false);
    expect(iyzicoSayfasiMi(undefined)).toBe(false);
    expect(iyzicoSayfasiMi('')).toBe(false);
  });
});
