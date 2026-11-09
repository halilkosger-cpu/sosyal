import { describe, expect, it } from 'vitest';
import { sssJsonLd, urunIcerigi } from './urun-icerik';

const SLUGLAR = ['biber-salcasi', 'domates-salcasi', 'cilek-receli', 'biber-receli', 'el-yapimi-dogal-sabun'];

describe('urunIcerigi', () => {
  it.each(SLUGLAR)('%s icin tam icerik var', (slug) => {
    const i = urunIcerigi(slug);
    expect(i).not.toBeNull();
    expect(i!.giris.length).toBeGreaterThan(80);
    expect(i!.kullanim.length).toBeGreaterThanOrEqual(3);
    expect(i!.saklama.length).toBeGreaterThan(40);
    expect(i!.sss.length).toBeGreaterThanOrEqual(3);
  });

  it('saglik/tedavi iddiasi icermez', () => {
    const yasak = /tedavi|şifa|hastalık|kanser|iyileştir|bağışıklık|kolesterol/i;
    for (const slug of SLUGLAR) {
      expect(JSON.stringify(urunIcerigi(slug))).not.toMatch(yasak);
    }
  });

  it('bilinmeyen slug null doner', () => {
    expect(urunIcerigi('yok')).toBeNull();
    expect(sssJsonLd(null, 'https://x')).toBeNull();
  });

  it('FAQPage semasi uretir', () => {
    const j = sssJsonLd(urunIcerigi('biber-salcasi'), 'https://x/urun/biber-salcasi');
    expect(j?.['@type']).toBe('FAQPage');
    expect(j?.mainEntity.length).toBe(3);
  });
});
