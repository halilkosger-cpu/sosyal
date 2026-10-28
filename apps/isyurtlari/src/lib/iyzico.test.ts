import { describe, it, expect } from 'vitest';
import { odemeGecerli, generateIyzicoV2Auth } from './iyzico';

const basarili = { status: 'success', paymentStatus: 'SUCCESS', fraudStatus: 1, price: '250.00' };

describe('odemeGecerli', () => {
  it('basarili ve tutari tutan odemeyi kabul eder', () => {
    expect(odemeGecerli(basarili, 250)).toBe(true);
  });
  it('fraud onayi tek basina yetmez', () => {
    expect(odemeGecerli({ ...basarili, paymentStatus: 'FAILURE' }, 250)).toBe(false);
  });
  it('fraud incelemesindeki odemeyi reddeder', () => {
    expect(odemeGecerli({ ...basarili, fraudStatus: 0 }, 250)).toBe(false);
  });
  it('tutar uyusmazsa reddeder', () => {
    expect(odemeGecerli({ ...basarili, price: '1.00' }, 250)).toBe(false);
  });
});

describe('generateIyzicoV2Auth', () => {
  it('IYZWSv2 basligi uretir', () => {
    const { authorization } = generateIyzicoV2Auth('/x', { a: 1 }, 'k', 's');
    const icerik = Buffer.from(authorization.replace('IYZWSv2 ', ''), 'base64').toString();
    expect(icerik).toMatch(/^apiKey:k&randomKey:\d+&signature:[0-9a-f]{64}$/);
  });
});
