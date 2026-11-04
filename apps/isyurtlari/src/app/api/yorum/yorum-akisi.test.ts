import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'test-anahtari';

const orderFindUnique = vi.fn();
const orderItemFindUnique = vi.fn();
const reviewFindFirst = vi.fn();
const reviewCreate = vi.fn();

vi.mock('@isyurtlari/database', () => ({
  prisma: {
    order: { findUnique: (...a: unknown[]) => orderFindUnique(...a) },
    orderItem: { findUnique: (...a: unknown[]) => orderItemFindUnique(...a) },
    review: { findFirst: (...a: unknown[]) => reviewFindFirst(...a), create: (...a: unknown[]) => reviewCreate(...a) },
  },
}));
vi.mock('@/lib/hiz-siniri', () => ({ hizSiniriGuard: vi.fn().mockResolvedValue(null) }));

import { POST as baglantiUret } from '../yorum-baglantisi/route';
import { GET as yorumOku, POST as yorumYaz } from './[token]/route';
import { yorumBaglantisiOlustur } from '@/lib/yorum-baglantisi';

const NOT = 'Müşteri: Ayşe Yılmaz | Email: ayse@ornek.com | Telefon: 0532 123 45 67 | Fatura: Bireysel';
const istek = (url: string, govde?: unknown) =>
  new NextRequest(`https://isyurtlari.com.tr${url}`, {
    method: govde === undefined ? 'GET' : 'POST',
    ...(govde === undefined ? {} : { body: JSON.stringify(govde) }),
  });
const bag = (token: string) => ({ params: Promise.resolve({ token }) });

const teslimSiparis = { status: 'DELIVERED', notes: NOT, customer: null, items: [{ id: 'kalem-1' }] };

describe('POST /api/yorum-baglantisi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewFindFirst.mockResolvedValue(null);
  });

  const govde = { siparisNo: 'sg-2026-001', email: 'Ayse@Ornek.com', orderItemId: 'kalem-1' };

  it('sahipliği kanıtlanmış, teslim edilmiş siparişin kalemi için bağlantı üretir', async () => {
    orderFindUnique.mockResolvedValue(teslimSiparis);
    const yanit = await baglantiUret(istek('/api/yorum-baglantisi', govde));
    expect(yanit.status).toBe(200);
    expect((await yanit.json()).url).toMatch(/^\/yorum\/.+\..+$/);
    expect(orderFindUnique.mock.calls[0][0].where).toEqual({ orderNumber: 'SG-2026-001' });
  });

  it('yanlış e-posta, olmayan sipariş ve başka siparişin kalemi aynı 404 yanıtını alır', async () => {
    orderFindUnique.mockResolvedValue(teslimSiparis);
    const yanlisEposta = await baglantiUret(istek('/api/yorum-baglantisi', { ...govde, email: 'baskasi@ornek.com' }));
    const baskaKalem = await baglantiUret(istek('/api/yorum-baglantisi', { ...govde, orderItemId: 'baska-kalem' }));
    orderFindUnique.mockResolvedValue(null);
    const yok = await baglantiUret(istek('/api/yorum-baglantisi', govde));

    for (const y of [yanlisEposta, baskaKalem, yok]) expect(y.status).toBe(404);
    const govdeler = await Promise.all([yanlisEposta, baskaKalem, yok].map((y) => y.json()));
    expect(new Set(govdeler.map((g) => g.error)).size).toBe(1);
  });

  it('teslim edilmemiş sipariş için bağlantı vermez', async () => {
    orderFindUnique.mockResolvedValue({ ...teslimSiparis, status: 'SHIPPED' });
    expect((await baglantiUret(istek('/api/yorum-baglantisi', govde))).status).toBe(409);
  });

  it('kalem için zaten yorum varsa bağlantı vermez (tek kullanım)', async () => {
    orderFindUnique.mockResolvedValue(teslimSiparis);
    reviewFindFirst.mockResolvedValue({ id: 'y1' });
    expect((await baglantiUret(istek('/api/yorum-baglantisi', govde))).status).toBe(409);
  });

  it('eksik alanlarda 400 döner', async () => {
    expect((await baglantiUret(istek('/api/yorum-baglantisi', { siparisNo: 'x' }))).status).toBe(400);
  });
});

describe('/api/yorum/[token]', () => {
  const kalem = {
    id: 'kalem-1',
    productId: 'urun-1',
    product: { name: 'Siyah Zeytin', slug: 'siyah-zeytin', imageUrl: null },
    order: { status: 'DELIVERED', notes: NOT, customerId: null },
  };
  const yorum = { rating: 5, title: 'Harika', text: 'Çok lezzetli bir ürün, tavsiye ederim.' };

  beforeEach(() => {
    vi.clearAllMocks();
    orderItemFindUnique.mockResolvedValue(kalem);
    reviewFindFirst.mockResolvedValue(null);
    reviewCreate.mockResolvedValue({});
  });

  it('geçersiz ya da süresi dolmuş jetonu 410 ile reddeder', async () => {
    expect((await yorumOku(istek('/api/yorum/sahte'), bag('sahte'))).status).toBe(410);
    expect((await yorumYaz(istek('/api/yorum/sahte', yorum), bag('sahte'))).status).toBe(410);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it('GET: ürünü ve daha önce yorumlanıp yorumlanmadığını döndürür', async () => {
    const jeton = yorumBaglantisiOlustur('kalem-1');
    const veri = await (await yorumOku(istek(`/api/yorum/${jeton}`), bag(jeton))).json();
    expect(veri).toEqual({ urun: kalem.product, yorumlandi: false });
  });

  it('POST: misafir yorumunu doğrulanmış alışveriş olarak, kısaltılmış adla ve onay bekleyen kaydeder', async () => {
    const jeton = yorumBaglantisiOlustur('kalem-1');
    const yanit = await yorumYaz(istek(`/api/yorum/${jeton}`, yorum), bag(jeton));

    expect(yanit.status).toBe(201);
    expect(reviewCreate).toHaveBeenCalledWith({
      data: {
        productId: 'urun-1',
        customerId: null,
        orderItemId: 'kalem-1',
        misafirAd: 'Ayşe Y.',
        rating: 5,
        title: 'Harika',
        text: yorum.text,
        approved: false,
      },
    });
  });

  it('POST: gövdedeki kimlik/ürün alanları yok sayılır (ürün jetondaki kalemden gelir)', async () => {
    const jeton = yorumBaglantisiOlustur('kalem-1');
    await yorumYaz(istek(`/api/yorum/${jeton}`, { ...yorum, productId: 'baska-urun', customerId: 'baskasi', approved: true }), bag(jeton));
    const data = reviewCreate.mock.calls[0][0].data;
    expect(data.productId).toBe('urun-1');
    expect(data.customerId).toBeNull();
    expect(data.approved).toBe(false);
  });

  it('POST: ikinci kullanımda 409 döner ve yeni yorum yazmaz', async () => {
    reviewFindFirst.mockResolvedValue({ id: 'y1' });
    const jeton = yorumBaglantisiOlustur('kalem-1');
    expect((await yorumYaz(istek(`/api/yorum/${jeton}`, yorum), bag(jeton))).status).toBe(409);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it('POST: sipariş teslim edilmiş değilse (iptal/iade) yorum yazılamaz', async () => {
    orderItemFindUnique.mockResolvedValue({ ...kalem, order: { ...kalem.order, status: 'CANCELLED' } });
    const jeton = yorumBaglantisiOlustur('kalem-1');
    expect((await yorumYaz(istek(`/api/yorum/${jeton}`, yorum), bag(jeton))).status).toBe(409);
  });

  it('POST: geçersiz puan/metin 400 döner', async () => {
    const jeton = yorumBaglantisiOlustur('kalem-1');
    expect((await yorumYaz(istek(`/api/yorum/${jeton}`, { ...yorum, rating: 9 }), bag(jeton))).status).toBe(400);
    expect((await yorumYaz(istek(`/api/yorum/${jeton}`, { ...yorum, text: 'kısa' }), bag(jeton))).status).toBe(400);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it('POST: kayıtlı müşterinin yorumunda misafir adı yazılmaz (ad hesaptan gelir)', async () => {
    orderItemFindUnique.mockResolvedValue({ ...kalem, order: { ...kalem.order, customerId: 'musteri-1' } });
    const jeton = yorumBaglantisiOlustur('kalem-1');
    await yorumYaz(istek(`/api/yorum/${jeton}`, yorum), bag(jeton));
    expect(reviewCreate.mock.calls[0][0].data).toMatchObject({ customerId: 'musteri-1', misafirAd: null });
  });
});
