import { describe, it, expect } from 'vitest';
import { vitrinUrunu } from './vitrin';

describe('vitrinUrunu', () => {
  it('alış fiyatını ve stok eşiğini çıkarır, diğer alanları korur', () => {
    const urun = { id: '1', name: 'Kilim', price: 500, purchasePrice: 200, minStockLevel: 5, quantity: 3 };
    const sonuc = vitrinUrunu(urun);
    expect(sonuc).toEqual({ id: '1', name: 'Kilim', price: 500, quantity: 3 });
    expect(urun.purchasePrice).toBe(200);
  });
});
