import { describe, it, expect } from 'vitest';
import {
  kargoUcretsizMi,
  kargoDurumuMetni,
  kargoEsigineKalan,
  siparisToplami,
  UCRETSIZ_KARGO_ESIGI,
} from './fiyat';

describe('kargoUcretsizMi', () => {
  it('eşik (2.000 ₺) ve üzerinde ücretsiz, altında değil', () => {
    expect(UCRETSIZ_KARGO_ESIGI).toBe(2000);
    expect(kargoUcretsizMi(1999.99)).toBe(false);
    expect(kargoUcretsizMi(2000)).toBe(true);
    expect(kargoUcretsizMi(2400)).toBe(true);
    expect(kargoUcretsizMi(0)).toBe(false);
  });
});

describe('kargoEsigineKalan', () => {
  it('eşiğe kalan tutarı verir, eşikte ve üstünde 0 döner', () => {
    expect(kargoEsigineKalan(1500)).toBe(500);
    expect(kargoEsigineKalan(1999.5)).toBe(0.5);
    expect(kargoEsigineKalan(2000)).toBe(0);
    expect(kargoEsigineKalan(3000)).toBe(0);
  });
});

describe('kargoDurumuMetni', () => {
  it('ücretsizse "Ücretsiz", değilse "Karşı ödemeli" yazar', () => {
    expect(kargoDurumuMetni(true)).toBe('Ücretsiz');
    expect(kargoDurumuMetni(false)).toBe('Karşı ödemeli');
  });
});

describe('siparisToplami kargo', () => {
  it('eşik, indirim sonrası ödenecek tutara bakar (ham 2.200 ₺ %10 ile 1.980 ₺ olur)', () => {
    const t = siparisToplami([{ tutar: 2200 }], true);
    expect(t.urunToplami).toBe(1980);
    expect(t.kargoUcretsiz).toBe(false);
  });

  it('indirim sonrası eşiği geçerse kargo ücretsiz işaretlenir; toplama kargo eklenmez', () => {
    const t = siparisToplami([{ tutar: 2300 }], true);
    expect(t.urunToplami).toBe(2070);
    expect(t.kargoUcretsiz).toBe(true);
    expect(t.kargo).toBe(0);
    expect(t.toplam).toBe(2070);
  });

  it('kampanya kapalıyken ham tutar eşiği belirler', () => {
    expect(siparisToplami([{ tutar: 2000 }], false).kargoUcretsiz).toBe(true);
    expect(siparisToplami([{ tutar: 1999 }], false).kargoUcretsiz).toBe(false);
  });
});
