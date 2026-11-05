import { describe, it, expect } from 'vitest';
import { siparisToplami, KARGO_UCRETI } from './fiyat';

describe('siparisToplami kargo', () => {
  it('kargo sabit 179 TL', () => {
    expect(KARGO_UCRETI).toBe(179);
  });

  it('kargoyu toplama ekler ve kargo satırında ayrıca döner', () => {
    const t = siparisToplami([{ tutar: 100 }]);
    expect(t.urunToplami).toBe(100);
    expect(t.kargo).toBe(179);
    expect(t.toplam).toBe(279);
  });

  it('tutar ne olursa olsun kargo 179 TL (ücretsiz eşik yok)', () => {
    expect(siparisToplami([{ tutar: 5000 }]).kargo).toBe(179);
    expect(siparisToplami([{ tutar: 5000 }]).toplam).toBe(5179);
  });

  it('boş sepette kargo alınmaz', () => {
    expect(siparisToplami([]).kargo).toBe(0);
    expect(siparisToplami([]).toplam).toBe(0);
  });

  it('KDV kalem kategorisine göre ürün toplamının içinden hesaplanır, toplama eklenmez', () => {
    const t = siparisToplami([{ tutar: 110, kdvOrani: 10 }]);
    expect(t.kdv).toBe(10);
    expect(t.kdvHaric).toBe(100);
    expect(t.toplam).toBe(289);
  });
});
