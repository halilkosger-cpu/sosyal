import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '@isyurtlari/database';
import * as adminAuth from '@/lib/admin-auth';

// Mock dependencies
vi.mock('@isyurtlari/database', () => ({
  prisma: {
    preOrder: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/admin-auth', () => ({
  adminGuard: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: 'mock-mail-id' }),
    };
  },
}));

describe('POST /api/admin/preorders/stage-notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
  });

  it('1. yetkisiz istekleri engeller (adminGuard)', async () => {
    const mockRedirect = new Response(null, { status: 401 });
    vi.mocked(adminAuth.adminGuard).mockReturnValue(mockRedirect as any);

    const req = new NextRequest('http://localhost:3000/api/admin/preorders/stage-notify', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-1', stage: 2 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('2. eksik parametrelerde 400 hatası döndürür', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/preorders/stage-notify', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('zorunludur');
  });

  it('3. ön talep bulunamadığında 404 hatası döndürür', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(null);
    vi.mocked(prisma.preOrder.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/preorders/stage-notify', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-non-existent', stage: 1 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('4. geçerli istekte aşama bildirim e-postasını gönderir ve 200 döner', async () => {
    vi.mocked(adminAuth.adminGuard).mockReturnValue(null);
    vi.mocked(prisma.preOrder.findUnique).mockResolvedValue({
      id: 'po-1',
      name: 'Mehmet Demir',
      email: 'mehmet@example.com',
      product: {
        name: 'El Yapımı Çini Vazo',
        slug: 'el-yapimi-cini-vazo',
      },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/admin/preorders/stage-notify', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-1', stage: 2 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
