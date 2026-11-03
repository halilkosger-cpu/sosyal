import { describe, it, expect } from 'vitest';
import { merchantSatirlariniAyristir, fiyatOzetiOlustur, type MerchantSatir } from './merchant-fiyat-raporu';

describe('merchantSatirlariniAyristir', () => {
  it('ürün fiyatı ve benchmark fiyatını mikro birimden TL\'ye çevirir', () => {
    const satirlar = merchantSatirlariniAyristir({
      results: [
        {
          priceCompetitivenessProductView: {
            id: 'tr~TR~feed~sku-1',
            title: 'Elban Peynir 1000 gr',
            price: { amountMicros: '300000000', currencyCode: 'TRY' },
            benchmarkPrice: { amountMicros: '250000000', currencyCode: 'TRY' },
          },
        },
      ],
    });

    expect(satirlar).toEqual([
      { id: 'tr~TR~feed~sku-1', baslik: 'Elban Peynir 1000 gr', fiyat: 300, benchmark: 250, paraBirimi: 'TRY' },
    ]);
  });

  it('benchmark yoksa null bırakır', () => {
    const satirlar = merchantSatirlariniAyristir({
      results: [
        {
          priceCompetitivenessProductView: {
            id: 'x',
            title: 'X',
            price: { amountMicros: '100000000', currencyCode: 'TRY' },
          },
        },
      ],
    });
    expect(satirlar[0].benchmark).toBeNull();
  });

  it('sonuç yoksa boş liste döner', () => {
    expect(merchantSatirlariniAyristir({})).toEqual([]);
  });
});

describe('fiyatOzetiOlustur', () => {
  const satir = (id: string, fiyat: number, benchmark: number | null): MerchantSatir => ({
    id,
    baslik: `Ürün ${id}`,
    fiyat,
    benchmark,
    paraBirimi: 'TRY',
  });

  it('%10 üstü pahalı ve %10 altı ucuz ürünleri ayırır', () => {
    const ozet = fiyatOzetiOlustur([
      satir('pahali', 114, 100), // +14%
      satir('ucuz', 88, 100), // -12%
      satir('dengeli', 105, 100), // +5%, listede yok
      satir('eksik', 50, null),
    ]);

    expect(ozet.pahaliSayi).toBe(1);
    expect(ozet.pahali[0]).toEqual({ baslik: 'Ürün pahali', fark: 14 });
    expect(ozet.ucuzSayi).toBe(1);
    expect(ozet.ucuz[0]).toEqual({ baslik: 'Ürün ucuz', fark: -12 });
    expect(ozet.eksikSayi).toBe(1);
    expect(ozet.feedSorunu).toContain('1');
  });

  it('eksik benchmark yoksa feedSorunu null olur', () => {
    const ozet = fiyatOzetiOlustur([satir('a', 100, 100)]);
    expect(ozet.feedSorunu).toBeNull();
  });
});
