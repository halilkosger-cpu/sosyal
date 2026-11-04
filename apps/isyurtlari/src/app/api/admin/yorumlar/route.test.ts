import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const findMany = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const del = vi.fn();
const revalidatePath = vi.fn();
const adminGuard = vi.fn();

vi.mock('@isyurtlari/database', () => ({
  prisma: { review: { findMany: (...a: unknown[]) => findMany(...a), findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => update(...a), delete: (...a: unknown[]) => del(...a) } },
}));
vi.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock('@/lib/admin-auth', () => ({
  adminGuard: (...a: unknown[]) => adminGuard(...a),
  adminEpostasi: () => 'yonetici@ornek.com',
}));
vi.mock('@/lib/audit-log', () => ({ logAudit: vi.fn() }));

import { GET, PATCH, DELETE } from './route';

const istek = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`https://isyurtlari.com.tr${url}`, init);

describe('/api/admin/yorumlar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminGuard.mockReturnValue(null);
  });

  it('yönetici oturumu yoksa hiçbir işlem yapmaz', async () => {
    adminGuard.mockReturnValue(NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 }));

    expect((await GET(istek('/api/admin/yorumlar'))).status).toBe(401);
    expect((await PATCH(istek('/api/admin/yorumlar', { method: 'PATCH', body: '{}' }))).status).toBe(401);
    expect((await DELETE(istek('/api/admin/yorumlar?id=y1', { method: 'DELETE' }))).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('varsayılan olarak yalnızca onay bekleyenleri listeler', async () => {
    findMany.mockResolvedValue([]);
    await GET(istek('/api/admin/yorumlar'));
    expect(findMany.mock.calls[0][0].where).toEqual({ approved: false });
  });

  it('durum=yayinda yayındakileri, durum=hepsi tümünü getirir', async () => {
    findMany.mockResolvedValue([]);
    await GET(istek('/api/admin/yorumlar?durum=yayinda'));
    expect(findMany.mock.calls[0][0].where).toEqual({ approved: true });
    await GET(istek('/api/admin/yorumlar?durum=hepsi'));
    expect(findMany.mock.calls[1][0].where).toEqual({});
  });

  it('onaylayınca yorumu yayına alır ve ürün sayfasını yeniler', async () => {
    findUnique.mockResolvedValue({ id: 'y1', product: { slug: 'siyah-zeytin' } });
    update.mockResolvedValue({});

    const yanit = await PATCH(istek('/api/admin/yorumlar', { method: 'PATCH', body: JSON.stringify({ id: 'y1', onayli: true }) }));

    expect(yanit.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'y1' }, data: { approved: true } });
    expect(revalidatePath).toHaveBeenCalledWith('/urun/siyah-zeytin');
  });

  it('onayli alanı boolean değilse 400 döner', async () => {
    const yanit = await PATCH(istek('/api/admin/yorumlar', { method: 'PATCH', body: JSON.stringify({ id: 'y1', onayli: 'evet' }) }));
    expect(yanit.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('olmayan yorum için 404 döner', async () => {
    findUnique.mockResolvedValue(null);
    const yanit = await PATCH(istek('/api/admin/yorumlar', { method: 'PATCH', body: JSON.stringify({ id: 'yok', onayli: true }) }));
    expect(yanit.status).toBe(404);
  });

  it('silince yorumu kaldırır ve ürün sayfasını yeniler', async () => {
    findUnique.mockResolvedValue({ id: 'y1', product: { slug: 'siyah-zeytin' } });
    del.mockResolvedValue({});

    const yanit = await DELETE(istek('/api/admin/yorumlar?id=y1', { method: 'DELETE' }));

    expect(yanit.status).toBe(200);
    expect(del).toHaveBeenCalledWith({ where: { id: 'y1' } });
    expect(revalidatePath).toHaveBeenCalledWith('/urun/siyah-zeytin');
  });

  it('id verilmeden silme isteği 400 döner', async () => {
    const yanit = await DELETE(istek('/api/admin/yorumlar', { method: 'DELETE' }));
    expect(yanit.status).toBe(400);
    expect(del).not.toHaveBeenCalled();
  });
});
