import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const gonder = vi.fn();
const isAdminRequest = vi.fn();

vi.mock('@/lib/yorum-istegi', () => ({ yorumIstekleriniGonder: (...a: unknown[]) => gonder(...a) }));
vi.mock('@/lib/admin-auth', () => ({ isAdminRequest: (...a: unknown[]) => isAdminRequest(...a) }));
vi.mock('@/lib/musteri-eposta', () => ({ epostaTabanAdresi: () => 'https://isyurtlari.com.tr' }));

import { GET } from './route';

const istek = (yol = '', baslik?: string) =>
  new NextRequest(`https://isyurtlari.com.tr/api/gorevler/yorum-istegi${yol}`, {
    headers: baslik ? { authorization: baslik } : {},
  });

describe('GET /api/gorevler/yorum-istegi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    isAdminRequest.mockReturnValue(false);
    gonder.mockResolvedValue({ incelenen: 0, gonderilen: 0, atlanan: [] });
  });

  it('CRON_SECRET tanımlı değilken ve oturum yokken kapalıdır (herkese açık değil)', async () => {
    expect((await GET(istek())).status).toBe(401);
    expect((await GET(istek('', 'Bearer '))).status).toBe(401);
    expect(gonder).not.toHaveBeenCalled();
  });

  it('yanlış gizli anahtarı reddeder, doğrusunu kabul eder', async () => {
    process.env.CRON_SECRET = 'dogru-anahtar';
    expect((await GET(istek('', 'Bearer yanlis'))).status).toBe(401);
    expect(gonder).not.toHaveBeenCalled();

    const yanit = await GET(istek('', 'Bearer dogru-anahtar'));
    expect(yanit.status).toBe(200);
    expect(gonder).toHaveBeenCalledWith('https://isyurtlari.com.tr', false);
  });

  it('yönetici oturumu da çalıştırabilir', async () => {
    isAdminRequest.mockReturnValue(true);
    expect((await GET(istek())).status).toBe(200);
  });

  it('?kuru=1 kuru çalışma yapar', async () => {
    isAdminRequest.mockReturnValue(true);
    const yanit = await GET(istek('?kuru=1'));
    expect(gonder).toHaveBeenCalledWith('https://isyurtlari.com.tr', true);
    expect(await yanit.json()).toMatchObject({ ok: true, kuruCalisma: true });
  });

  it('görev hata verirse ayrıntı sızdırmadan 500 döner', async () => {
    isAdminRequest.mockReturnValue(true);
    gonder.mockRejectedValue(new Error('veritabani sifresi: gizli'));
    const yanit = await GET(istek());
    expect(yanit.status).toBe(500);
    expect(JSON.stringify(await yanit.json())).not.toContain('gizli');
  });
});
