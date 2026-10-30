import { describe, expect, it } from 'vitest';
import { iyzicoSayfasiMi } from './iyzico';

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
