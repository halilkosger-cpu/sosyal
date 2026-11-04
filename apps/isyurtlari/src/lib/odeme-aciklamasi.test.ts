import { describe, it, expect } from 'vitest';
import { odemeAciklamasi } from './odeme-aciklamasi';

describe('odemeAciklamasi', () => {
  it('sipariş numarasından ödeme açıklamasını üretir', () => {
    expect(odemeAciklamasi('SG-2026-001')).toBe('Sipariş #SG-2026-001');
  });

  it('numarası başka bir numaranın öneki olan siparişlerin açıklamaları birbirine eşit olmaz', () => {
    // contains ile eşleştirilseydi SG-2026-100, SG-2026-1000'in ödemesini de yakalardı.
    expect(odemeAciklamasi('SG-2026-100')).not.toBe(odemeAciklamasi('SG-2026-1000'));
    expect(odemeAciklamasi('SG-2026-1000').includes(odemeAciklamasi('SG-2026-100'))).toBe(true);
  });
});
