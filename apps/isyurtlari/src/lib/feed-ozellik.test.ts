import { describe, it, expect } from 'vitest';
import { aromaBul, urunOzellikleri } from './feed-ozellik';

describe('feed ozellikleri', () => {
  it('recel adindan aromayi cikarir', () => {
    expect(aromaBul('Elban Gül Reçeli Cam Kavanoz 420 gr')).toBe('Gül');
    expect(aromaBul('Elban Geleneksel Tatlı Biber Reçeli 420 gr')).toBe('Tatlı Biber');
    expect(aromaBul('Elban Kızılcık Reçeli 420 gr')).toBe('Kızılcık');
  });
  it('karisik paket ve recel olmayanlar icin aroma vermez', () => {
    expect(aromaBul("Elban Karışık Geleneksel Reçel Paketi 3'lü")).toBeNull();
    expect(aromaBul('AK-CE Doğal Salamura Yeşil Zeytin 1000 gr')).toBeNull();
  });
  it('seker sadece dogrulanmis slug icin eklenir', () => {
    const cilek = urunOzellikleri('Elban Geleneksel Çilek Reçeli 1000 gr', 'cilek-receli');
    expect(cilek.map((o) => o.ad)).toEqual(['Aroma', 'Şeker İçeriği']);
    const vişne = urunOzellikleri('Elban Vişne Reçeli Cam Kavanoz 420 gr', 'visne-receli');
    expect(vişne.map((o) => o.ad)).toEqual(['Aroma']);
  });
});
