// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Misafir ziyaretçiler her sayfa yüklemesinde /api/musteri/ben'e gitmesin
 * (Vercel fonksiyon çağrısı kotası). Yalnızca giriş ipucu çerezi varsa ya da
 * cihaz başına günde bir kez sorulur.
 */
async function yukle() {
  vi.resetModules();
  return import('./musteri-istemci');
}

describe('musteriGetir: sunucuya ne zaman sorulur', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'musteri_ipucu=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ musteri: { id: 'm1' } }) })));
  });

  it('ipucu çerezi varsa sorar', async () => {
    document.cookie = 'musteri_ipucu=1; path=/';
    localStorage.setItem('musteri_son_kontrol', String(Date.now()));
    const { musteriGetir } = await yukle();
    const m = await musteriGetir();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(m).toEqual({ id: 'm1' });
  });

  it('ipucu yok ve bugün kontrol edilmişse SORMAZ, misafir döner', async () => {
    localStorage.setItem('musteri_son_kontrol', String(Date.now()));
    const { musteriGetir } = await yukle();
    expect(await musteriGetir()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hiç kontrol edilmemişse (ilk ziyaret) bir kez sorar ve zamanı yazar', async () => {
    const { musteriGetir } = await yukle();
    await musteriGetir();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Number(localStorage.getItem('musteri_son_kontrol'))).toBeGreaterThan(0);
  });

  it('bir gün geçmişse yeniden sorar (ipucu çerezi eklenmeden önceki eski oturumlar için)', async () => {
    localStorage.setItem('musteri_son_kontrol', String(Date.now() - 25 * 60 * 60 * 1000));
    const { musteriGetir } = await yukle();
    await musteriGetir();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('aynı sayfa ömründe ikinci çağrı yeniden sormaz (önbellek)', async () => {
    document.cookie = 'musteri_ipucu=1; path=/';
    const { musteriGetir } = await yukle();
    await musteriGetir();
    await musteriGetir();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
