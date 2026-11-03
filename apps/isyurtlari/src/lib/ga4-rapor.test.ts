import { describe, it, expect } from 'vitest';
import { ga4YanitiniAyristir } from './ga4-rapor';

describe('ga4YanitiniAyristir', () => {
  it('kanal satırlarını ve toplamları çıkarır, oranları yüzdeye çevirir', () => {
    const yanit = {
      rows: [
        {
          dimensionValues: [{ value: 'Organic Search' }],
          metricValues: [{ value: '600' }, { value: '12' }, { value: '0.41' }, { value: '0.02' }],
        },
        {
          dimensionValues: [{ value: 'Paid Social' }],
          metricValues: [{ value: '300' }, { value: '1' }, { value: '0.68' }, { value: '0.0033' }],
        },
      ],
    };

    const sonuc = ga4YanitiniAyristir(yanit);

    expect(sonuc.oturum).toBe(900);
    expect(sonuc.donusumOrani).toBeCloseTo((13 / 900) * 100, 2);
    expect(sonuc.kanallar[0]).toEqual({
      kanal: 'Organic Search',
      oturum: 600,
      donusumOrani: 2,
      bounceRate: 41,
    });
    expect(sonuc.kanallar[1].bounceRate).toBe(68);
  });

  it('satır yoksa sıfır özet döner', () => {
    const sonuc = ga4YanitiniAyristir({});
    expect(sonuc).toEqual({ oturum: 0, donusumOrani: 0, kanallar: [] });
  });
});
