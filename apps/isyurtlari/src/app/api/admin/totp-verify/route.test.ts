import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const hizSiniriGuard = vi.fn();
const hizSiniri = vi.fn();
const verifyAdminTotpOrBackup = vi.fn();

vi.mock('@/lib/hiz-siniri', () => ({
  hizSiniriGuard: (...a: unknown[]) => hizSiniriGuard(...a),
  hizSiniri: (...a: unknown[]) => hizSiniri(...a),
}));
vi.mock('@/lib/totp', () => ({
  verifyAdminTotpOrBackup: (...a: unknown[]) => verifyAdminTotpOrBackup(...a),
}));
vi.mock('@/lib/audit-log', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({
  jwtAnahtari: () => 'test-anahtari',
  isAdminEmail: (e: string) => e === 'yonetici@ornek.com',
}));

import { POST } from './route';

const istek = (email: string, code = '123456') =>
  new NextRequest('https://isyurtlari.com.tr/api/admin/totp-verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });

describe('POST /api/admin/totp-verify hesap bazlı kilit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hizSiniriGuard.mockResolvedValue(null);
  });

  it('hesap başına deneme sınırı aşılınca farklı IP\'den gelse bile kodu doğrulamaz', async () => {
    hizSiniri.mockResolvedValue({ asildi: true, adet: 21 });

    const yanit = await POST(istek('yonetici@ornek.com'));

    expect(yanit.status).toBe(429);
    expect(verifyAdminTotpOrBackup).not.toHaveBeenCalled();
    expect(hizSiniri).toHaveBeenCalledWith('totp-verify-hesap:yonetici@ornek.com', 20, 900, true);
  });

  it('sınır aşılmadıysa kodu doğrulamaya devam eder', async () => {
    hizSiniri.mockResolvedValue({ asildi: false, adet: 1 });
    verifyAdminTotpOrBackup.mockResolvedValue({ success: false, message: 'Hatalı kod' });

    const yanit = await POST(istek('yonetici@ornek.com'));

    expect(yanit.status).toBe(401);
    expect(verifyAdminTotpOrBackup).toHaveBeenCalledOnce();
  });

  it('yönetici olmayan e-posta için sayaç satırı oluşturmaz', async () => {
    const yanit = await POST(istek('yabanci@ornek.com'));

    expect(yanit.status).toBe(403);
    expect(hizSiniri).not.toHaveBeenCalled();
  });
});
