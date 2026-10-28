import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { guvenliDosyaAdi, webpSurumleri } from './gorsel-uret';
import { yuklenenSrcSet, urunSrcSet } from './urun-gorsel';

describe('gorsel uretimi', () => {
  it('dosya adini guvenli slug yapar', () => {
    expect(guvenliDosyaAdi('Çini Vazo (1)<script>.JPG')).toBe('cini-vazo-1-script');
    expect(guvenliDosyaAdi('../../.png')).toBe('gorsel');
  });

  it('400/800/1024 webp uretir, buyutmez', async () => {
    const kaynak = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#fff' } }).jpeg().toBuffer();
    const surumler = await webpSurumleri(kaynak);
    const genislikler = await Promise.all(surumler.map(async (s) => (await sharp(s.veri).metadata()).width));
    expect(surumler.map((s) => s.genislik)).toEqual([400, 800, 1024]);
    expect(genislikler).toEqual([400, 800, 900]);
  });

  it('yuklenen gorsel icin srcset kurar, eskilere dokunmaz', () => {
    const url = 'https://x.public.blob.vercel-storage.com/products/1-vazo-1024.webp';
    expect(yuklenenSrcSet(url)).toBe(
      'https://x.public.blob.vercel-storage.com/products/1-vazo-400.webp 400w, https://x.public.blob.vercel-storage.com/products/1-vazo-800.webp 800w, https://x.public.blob.vercel-storage.com/products/1-vazo-1024.webp 1024w'
    );
    expect(urunSrcSet('bilinmeyen', 'https://x/eski.jpg')).toBeUndefined();
  });
});
