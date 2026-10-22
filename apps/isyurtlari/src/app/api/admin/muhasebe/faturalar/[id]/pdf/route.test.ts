import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@isyurtlari/database';
import * as adminAuth from '@/lib/admin-auth';

vi.mock('@isyurtlari/database', () => ({
  prisma: {
    fatura: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/admin-auth', () => ({
  adminGuard: vi.fn(),
}));

describe('GET /api/admin/muhasebe/faturalar/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Yetkisiz isteklerde adminGuard tarafindan engellenir (401)', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(
      new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401 }) as any
    );

    const req = new NextRequest('http://localhost:3000/api/admin/muhasebe/faturalar/fat-123/pdf');
    const res = await GET(req, { params: { id: 'fat-123' } });

    expect(res.status).toBe(401);
  });

  it('2. Fatura veritabaninda bulunamadiginda 404 doner', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(null as any);
    vi.mocked(prisma.fatura.findUnique).mockResolvedValue(null as any);

    const req = new NextRequest('http://localhost:3000/api/admin/muhasebe/faturalar/fat-999/pdf');
    const res = await GET(req, { params: { id: 'fat-999' } });

    expect(res.status).toBe(404);
  });

  it('3. Fatura bulundugunda resmi e-Arsiv HTML icerigini basariyla dondurur', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(null as any);
    vi.mocked(prisma.fatura.findUnique).mockResolvedValue({
      id: 'fat-101',
      faturaNo: 'FAT2026001',
      gibFaturaNo: 'ISY2026000000001',
      ettn: '11111111-2222-3333-4444-555555555555',
      tarih: new Date('2026-10-15'),
      matrah: 1000,
      kdvTutari: 100,
      genelToplam: 1100,
      cari: {
        unvan: 'Örnek Müşteri Ltd. Şti.',
        vergiTcNo: '1234567890',
        vergiDairesi: 'Çankaya',
        adres: 'Kızılay',
        sehir: 'Ankara',
      },
      satirlar: [
        {
          aciklama: 'Karakovan Balı',
          miktar: 2,
          birimFiyat: 500,
          kdvOrani: 10,
          kdvTutari: 100,
          satirToplam: 1100,
        },
      ],
    } as any);

    const req = new NextRequest('http://localhost:3000/api/admin/muhasebe/faturalar/fat-101/pdf');
    const res = await GET(req, { params: { id: 'fat-101' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const htmlText = await res.text();
    expect(htmlText).toContain('ISY2026000000001');
    expect(htmlText).toContain('Örnek Müşteri Ltd. Şti.');
  });
});
