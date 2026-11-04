import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const productFindUnique = vi.fn();
const reviewFindMany = vi.fn();

vi.mock('@isyurtlari/database', () => ({
  prisma: {
    product: { findUnique: (...a: unknown[]) => productFindUnique(...a) },
    review: { findMany: (...a: unknown[]) => reviewFindMany(...a) },
  },
}));
vi.mock('@/lib/hiz-siniri', () => ({ hizSiniriGuard: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/musteri-auth', () => ({ oturumdakiMusteri: vi.fn() }));

import { GET } from './route';

const istek = () => new NextRequest('https://isyurtlari.com.tr/api/products/siyah-zeytin/reviews');
const baglam = { params: Promise.resolve({ slug: 'siyah-zeytin' }) };

describe('GET /api/products/[slug]/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productFindUnique.mockResolvedValue({ id: 'u1' });
  });

  it('yalnızca onaylı yorumları getirir', async () => {
    reviewFindMany.mockResolvedValue([]);
    await GET(istek(), baglam);
    expect(reviewFindMany.mock.calls[0][0].where).toEqual({ productId: 'u1', approved: true });
  });

  it('CDN önbelleği kısa: yönetici onayladıktan sonra yorum en geç ~1,5 dakikada görünür', async () => {
    reviewFindMany.mockResolvedValue([]);
    const yanit = await GET(istek(), baglam);
    const kontrol = yanit.headers.get('Cache-Control') ?? '';
    const sMaxAge = Number(/s-maxage=(\d+)/.exec(kontrol)?.[1]);
    const swr = Number(/stale-while-revalidate=(\d+)/.exec(kontrol)?.[1]);
    expect(sMaxAge).toBeLessThanOrEqual(30);
    expect(sMaxAge + swr).toBeLessThanOrEqual(90);
  });

  it('yazar adını kısaltır, e-posta ve telefon alanlarını yanıta koymaz; misafir adını kullanır', async () => {
    reviewFindMany.mockResolvedValue([
      {
        id: 'y1',
        rating: 5,
        title: null,
        text: 'Çok güzel bir ürün.',
        helpfulCount: 0,
        createdAt: new Date('2026-11-03T08:00:00Z'),
        orderItemId: 'k1',
        customer: null,
        user: null,
        misafirAd: 'Birsen Karakaya',
      },
    ]);
    const veri = await (await GET(istek(), baglam)).json();
    expect(veri[0]).toMatchObject({ yazar: 'Birsen K.', dogrulanmis: true });
    expect(JSON.stringify(veri)).not.toMatch(/@|telefon|email/i);
  });
});
