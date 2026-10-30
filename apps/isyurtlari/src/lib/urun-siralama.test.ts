import { describe, expect, it } from 'vitest';
import { varsayilanSirala } from './urun-siralama';

const urun = (id: string, price: number, quantity: number, gun: number) => ({
  id, price, quantity, createdAt: new Date(2026, 9, gun),
});

describe('varsayilanSirala', () => {
  it('ayni kademede cok on talep alan urunu one alir, esitlikte en yeni once', () => {
    const urunler = [urun('yeni', 50, 10, 30), urun('az-talep', 50, 10, 1), urun('cok-talep', 50, 10, 2), urun('esit', 50, 10, 29)];
    const talepler = new Map([['cok-talep', 7], ['az-talep', 2]]);
    expect(varsayilanSirala(urunler, talepler).map((u) => u.id)).toEqual(['cok-talep', 'az-talep', 'yeni', 'esit']);
  });

  it('talep kademenin onune gecmez: fiyatsiz urun ne kadar istenirse istensin sonda kalir', () => {
    const urunler = [urun('fiyatsiz', 0, 10, 5), urun('stoksuz', 40, 0, 5), urun('satilabilir', 40, 5, 1)];
    const talepler = new Map([['fiyatsiz', 50], ['stoksuz', 20]]);
    expect(varsayilanSirala(urunler, talepler).map((u) => u.id)).toEqual(['satilabilir', 'stoksuz', 'fiyatsiz']);
  });

  it('girdi dizisini degistirmez', () => {
    const urunler = [urun('a', 10, 1, 1), urun('b', 10, 1, 2)];
    varsayilanSirala(urunler, new Map([['a', 3]]));
    expect(urunler.map((u) => u.id)).toEqual(['a', 'b']);
  });
});
