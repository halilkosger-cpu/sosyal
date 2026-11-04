import { describe, it, expect } from 'vitest';

process.env.JWT_SECRET = 'test-anahtari';

import { yorumBaglantisiOlustur, yorumBaglantisiniCoz, YORUM_BAGLANTISI_GECERLILIK_GUN } from './yorum-baglantisi';

const GUN_MS = 24 * 60 * 60 * 1000;
const simdi = new Date('2026-11-10T12:00:00Z').getTime();

describe('yorum bağlantısı', () => {
  it('60 gün geçerlidir', () => {
    expect(YORUM_BAGLANTISI_GECERLILIK_GUN).toBe(60);
  });

  it('sipariş kalemini imzalı jetonla taşır ve geri çözer', () => {
    const jeton = yorumBaglantisiOlustur('kalem-123', simdi);
    expect(jeton).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(yorumBaglantisiniCoz(jeton, simdi)).toEqual({ orderItemId: 'kalem-123' });
  });

  it('süresi dolunca geçersizdir', () => {
    const jeton = yorumBaglantisiOlustur('kalem-123', simdi);
    expect(yorumBaglantisiniCoz(jeton, simdi + 59 * GUN_MS)).not.toBeNull();
    expect(yorumBaglantisiniCoz(jeton, simdi + 61 * GUN_MS)).toBeNull();
  });

  it('içeriği değiştirilmiş jetonu reddeder (başka kalem için imza geçmez)', () => {
    const [yuk, imza] = yorumBaglantisiOlustur('kalem-123', simdi).split('.');
    const baskasi = Buffer.from(JSON.stringify({ k: 'kalem-999', e: simdi + 10 * GUN_MS })).toString('base64url');
    expect(yorumBaglantisiniCoz(`${baskasi}.${imza}`, simdi)).toBeNull();
    expect(yorumBaglantisiniCoz(`${yuk}.${imza.slice(0, -2)}AA`, simdi)).toBeNull();
  });

  it('bozuk girdileri reddeder', () => {
    for (const kotu of ['', 'abc', 'a.b.c', '.', 'x.y', '{"k":"1"}']) {
      expect(yorumBaglantisiniCoz(kotu, simdi)).toBeNull();
    }
    expect(yorumBaglantisiniCoz(undefined as never, simdi)).toBeNull();
  });

  it('farklı sunucu anahtarıyla üretilmiş jetonu reddeder', () => {
    const jeton = yorumBaglantisiOlustur('kalem-123', simdi);
    process.env.JWT_SECRET = 'baska-anahtar';
    try {
      expect(yorumBaglantisiniCoz(jeton, simdi)).toBeNull();
    } finally {
      process.env.JWT_SECRET = 'test-anahtari';
    }
  });
});
