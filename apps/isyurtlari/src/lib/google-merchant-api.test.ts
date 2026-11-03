import { describe, it, expect } from 'vitest';
import { gunlukRaporMetniUret, type FiyatRekabetKalemi, type RekabetOzeti } from './google-merchant-api';

describe('Fiyat ve Piyasa Analizi Raporlama', () => {
  const mockItems: FiyatRekabetKalemi[] = [
    {
      id: '1',
      title: 'Zeytinyağı 1L',
      slug: 'zeytinyagi-1l',
      fiyat: 280,
      alisMaliyeti: 180,
      karMarji: 35.7,
      piyasaKiyaslamaFiyati: 320,
      farkTutari: -40,
      farkYuzdesi: -12.5,
      rekabetDurumu: 'ucuz',
      oneri: 'Fiyat avantajınız var (%12.5 daha ucuz). Satış hacmini artırmak için öne çıkarabilirsiniz.',
      kategori: 'Gıda',
      stok: 50,
      guncellenmeTarihi: '2026-11-03T10:00:00Z',
    },
    {
      id: '2',
      title: 'El Yapımı Deri Cüzdan',
      slug: 'deri-cuzdan',
      fiyat: 450,
      alisMaliyeti: 250,
      karMarji: 44.4,
      piyasaKiyaslamaFiyati: 380,
      farkTutari: 70,
      farkYuzdesi: 18.4,
      rekabetDurumu: 'pahali',
      oneri: 'Piyasadan %18.4 daha pahalısınız. Kampanya veya fiyat revizyonu önerilir.',
      kategori: 'Deri Ürünleri',
      stok: 12,
      guncellenmeTarihi: '2026-11-03T10:00:00Z',
    },
  ];

  const mockOzet: RekabetOzeti = {
    toplamUrun: 2,
    rekabetciUrunSayisi: 1,
    piyasaAltiUrunSayisi: 1,
    piyasaUstuUrunSayisi: 1,
    dengeliUrunSayisi: 0,
    fiyatsizUrunSayisi: 0,
    ortalamaFiyatFarki: 2.95,
    rekabetciOranYuzde: 50,
    ortalamaKarMarji: 40.05,
    analizZamani: '2026-11-03T10:00:00Z',
  };

  it('gunlukRaporMetniUret() düzgün özet ve ürün detayları oluşturmalıdır', () => {
    const rapor = gunlukRaporMetniUret(mockOzet, mockItems);

    expect(rapor).toContain('GÜNLÜK PİYASA VE FİYAT REKABET ANALİZ RAPORU');
    expect(rapor).toContain('Toplam İncelenen Ürün: 2');
    expect(rapor).toContain('Avantajlı / Ucuz: 1');
    expect(rapor).toContain('Riskli / Pahalı: 1');
    expect(rapor).toContain('Zeytinyağı 1L');
    expect(rapor).toContain('El Yapımı Deri Cüzdan');
  });
});

