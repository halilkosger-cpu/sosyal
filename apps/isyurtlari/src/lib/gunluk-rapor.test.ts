import { describe, it, expect } from 'vitest';
import { dunTarihAraligi, gunlukRaporMetniOlustur, kelimeSayisi, type GunlukVeri } from './gunluk-rapor';

describe('dunTarihAraligi', () => {
  it('Türkiye saatine göre bir önceki günü verir', () => {
    // 06:00 UTC = 09:00 Türkiye, dün 2 Kasım
    const aralik = dunTarihAraligi(new Date('2026-11-03T06:00:00Z'));
    expect(aralik.etiket).toBe('02.11.2026');
    expect(aralik.baslangic.toISOString()).toBe('2026-11-01T21:00:00.000Z');
    expect(aralik.bitis.toISOString()).toBe('2026-11-02T21:00:00.000Z');
  });

  it('gece yarısını Türkiye saatine göre hesaplar', () => {
    // 21:30 UTC = 00:30 Türkiye (3 Kasım), dün hâlâ 2 Kasım
    const aralik = dunTarihAraligi(new Date('2026-11-02T21:30:00Z'));
    expect(aralik.etiket).toBe('02.11.2026');
  });
});

const tamVeri = (): GunlukVeri => ({
  etiket: '02.11.2026',
  satis: { ciro: 12500, siparis: 18, aov: 694.44, enCokSatan: [], dusukStok: [] },
  onceki: { ciro: 10000, siparis: 15, aov: 666.67, enCokSatan: [], dusukStok: [] },
  trafik: {
    oturum: 1240,
    donusumOrani: 1.45,
    kanallar: [
      { kanal: 'Organic Search', oturum: 600, donusumOrani: 2.1, bounceRate: 41 },
      { kanal: 'Paid Social', oturum: 300, donusumOrani: 0.4, bounceRate: 68 },
    ],
  },
  fiyat: {
    pahali: [{ baslik: 'Elban Tam Yağlı Beyaz Peynir 1000 gr', fark: 14 }],
    ucuz: [{ baslik: 'ADVEM El Kremi 150 ml', fark: -12 }],
    pahaliSayi: 1,
    ucuzSayi: 1,
    eksikSayi: 3,
    feedSorunu: null,
  },
});

describe('gunlukRaporMetniOlustur', () => {
  it('doğrudan 1. başlıkla başlar, giriş cümlesi içermez', () => {
    const metin = gunlukRaporMetniOlustur(tamVeri());
    expect(metin.startsWith('1. Fiyat Rekabet Analizi')).toBe(true);
  });

  it('beklenen üç bölümü sırayla içerir', () => {
    const metin = gunlukRaporMetniOlustur(tamVeri());
    const i1 = metin.indexOf('1. Fiyat Rekabet Analizi');
    const i2 = metin.indexOf('2. Günlük Performans ve Trafik Özeti');
    const i3 = metin.indexOf('3. Uzman Satış Stratejileri');
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
  });

  it('veri yoksa "veri alınamadı" yazar, rapor yine üretilir', () => {
    const veri: GunlukVeri = { ...tamVeri(), satis: null, onceki: null, trafik: null, fiyat: null };
    const metin = gunlukRaporMetniOlustur(veri);
    expect(metin).toContain('Satış verisi alınamadı');
    expect(metin).toContain('Trafik verisi alınamadı');
    expect(metin).toContain('Fiyat verisi alınamadı');
  });

  it('ürün listelerini 10 ile sınırlar ve 400 kelimeyi aşmaz', () => {
    const uzunBaslik = 'Çok uzun bir ürün adı '.repeat(10);
    const cokUrun = Array.from({ length: 40 }, (_, i) => ({ baslik: `${uzunBaslik}${i}`, fark: 20 + i }));
    const veri: GunlukVeri = {
      ...tamVeri(),
      trafik: {
        oturum: 1,
        donusumOrani: 1,
        kanallar: Array.from({ length: 30 }, (_, i) => ({ kanal: `K${i}`, oturum: 1, donusumOrani: 1, bounceRate: 50 })),
      },
      fiyat: { pahali: cokUrun, ucuz: cokUrun, pahaliSayi: 40, ucuzSayi: 40, eksikSayi: 0, feedSorunu: null },
    };
    const metin = gunlukRaporMetniOlustur(veri);
    expect(kelimeSayisi(metin)).toBeLessThanOrEqual(400);
    expect(metin.split('\n').filter((s) => s.startsWith('- ')).length).toBeLessThanOrEqual(60);
  });

  it('feed sorunu ve eksik fiyat sayısını Merchant bölümünde gösterir', () => {
    const veri = tamVeri();
    veri.fiyat = { ...veri.fiyat!, eksikSayi: 7, feedSorunu: 'Benchmark verisi yok: 7 ürün' };
    const metin = gunlukRaporMetniOlustur(veri);
    expect(metin).toContain('Benchmark verisi yok: 7 ürün');
  });
});
