import { describe, it, expect } from 'vitest';
import { siparisEpostasiUyuyor } from './siparis-eposta';

const notlar = 'Müşteri: Ali Veli | Email: ali@ornek.com | Telefon: 0555';

describe('siparisEpostasiUyuyor', () => {
  it('birebir e-postayı kabul eder', () => {
    expect(siparisEpostasiUyuyor('ALI@ornek.com ', notlar)).toBe(true);
  });
  it('parça eşleşmeyi reddeder', () => {
    expect(siparisEpostasiUyuyor('@', notlar)).toBe(false);
    expect(siparisEpostasiUyuyor('i@ornek.com', notlar)).toBe(false);
    expect(siparisEpostasiUyuyor('Ali', notlar)).toBe(false);
  });
  it('hesap e-postasıyla da eşleşir', () => {
    expect(siparisEpostasiUyuyor('uye@ornek.com', null, 'Uye@ornek.com')).toBe(true);
  });
});
