import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-anahtari';

const orderFindMany = vi.fn();
const orderCount = vi.fn();
const reviewFindMany = vi.fn();
const queryRaw = vi.fn();
const executeRaw = vi.fn();
const gonder = vi.fn();

vi.mock('@isyurtlari/database', () => ({
  Prisma: {},
  prisma: {
    customer: { fields: { iletiIzniAt: 'ALAN' } },
    order: { findMany: (...a: unknown[]) => orderFindMany(...a), count: (...a: unknown[]) => orderCount(...a) },
    review: { findMany: (...a: unknown[]) => reviewFindMany(...a) },
    $queryRawUnsafe: (...a: unknown[]) => queryRaw(...a),
    $executeRawUnsafe: (...a: unknown[]) => executeRaw(...a),
  },
}));
vi.mock('./musteri-eposta', () => ({
  yorumIstegiEpostasiGonder: (...a: unknown[]) => gonder(...a),
  sepetHatirlatmaEpostasiGonder: vi.fn(),
}));
vi.mock('./hediye-db', () => ({ siparisinKodu: vi.fn().mockResolvedValue('HD-ABCDE') }));

import {
  yorumIstekleriniGonder,
  TESLIMDEN_SONRA_GUN,
  EN_COK_GUN,
  CALISMA_BASINA_AZAMI,
} from './yorum-istegi';
import { IZINLI_KOSULU } from './terk-edilmis-sepet';

const GUN = 86_400_000;
const simdi = new Date('2026-11-10T12:00:00Z').getTime();
const TABAN = 'https://isyurtlari.com.tr';

const siparis = (id: string, kalemler: string[] = ['k1', 'k2']) => ({
  id,
  orderNumber: `SG-2026-${id}`,
  customer: { id: `m-${id}`, name: 'Ayşe Yılmaz', email: `ayse-${id}@ornek.com` },
  items: kalemler.map((k) => ({ id: `${id}-${k}`, product: { name: `Ürün ${k}` } })),
});

/** Veritabanı sahtesi: davetli siparişler ve "kayıt çakışması" ayarlanabilir. */
function veritabani({ davetli = [] as string[], cakisan = [] as string[] } = {}) {
  queryRaw.mockImplementation(async (sql: string, ...p: unknown[]) => {
    if (sql.includes('SELECT "siparisId"')) return (p[0] as string[]).filter((i) => davetli.includes(i)).map((siparisId) => ({ siparisId }));
    if (sql.includes('INSERT INTO "YorumDavetKaydi"')) return cakisan.includes(p[0] as string) ? [] : [{ siparisId: p[0] }];
    return [];
  });
}

describe('yorumIstekleriniGonder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderFindMany.mockResolvedValue([]);
    orderCount.mockResolvedValue(0);
    reviewFindMany.mockResolvedValue([]);
    gonder.mockResolvedValue(true);
    veritabani();
  });

  it('zaman penceresi: teslimden 5 gün sonra başlar, en fazla 14 gün öncesine bakar', async () => {
    expect(TESLIMDEN_SONRA_GUN).toBe(5);
    expect(EN_COK_GUN).toBe(14);
    await yorumIstekleriniGonder(TABAN, false, simdi);
    const where = orderFindMany.mock.calls[0][0].where;
    expect(where.deliveredAt.lte.getTime()).toBe(simdi - 5 * GUN);
    expect(where.deliveredAt.gte.getTime()).toBe(simdi - 14 * GUN);
  });

  it('yalnızca teslim edilmiş, iadesiz ve ticari ileti izni olan kayıtlı müşterilerin siparişlerini sorgular', async () => {
    await yorumIstekleriniGonder(TABAN, false, simdi);
    const where = orderFindMany.mock.calls[0][0].where;
    expect(where.status).toBe('DELIVERED');
    expect(where.customerId).toEqual({ not: null });
    expect(where.returns).toEqual({ none: {} });
    expect(where.customer).toBe(IZINLI_KOSULU);
  });

  it('her uygun sipariş için bir e-posta gönderir: ürün başına bağlantı, ret bağlantısı, hediye paylaşımı', async () => {
    orderFindMany.mockResolvedValue([siparis('001')]);
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);

    expect(sonuc).toMatchObject({ incelenen: 1, gonderilen: 1 });
    expect(gonder).toHaveBeenCalledTimes(1);
    const [eposta, konu, html] = gonder.mock.calls[0];
    expect(eposta).toBe('ayse-001@ornek.com');
    expect(konu).toBe('Ürününüz nasıldı? Düşüncenizi duymak isteriz');
    expect(html).toContain('Ürün k1');
    expect(html).toContain('Ürün k2');
    expect(html.match(/\/yorum\//g)).toHaveLength(2);
    expect(html).toContain('ileti-tercihi');
    expect(html).toContain('wa.me');
  });

  it('daha önce davet edilmiş siparişe ikinci e-posta göndermez', async () => {
    orderFindMany.mockResolvedValue([siparis('001'), siparis('002')]);
    veritabani({ davetli: ['001'] });
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);
    expect(sonuc.gonderilen).toBe(1);
    expect(sonuc.atlanan).toContainEqual({ sebep: 'zaten davet edilmiş', adet: 1 });
    expect(gonder.mock.calls[0][0]).toBe('ayse-002@ornek.com');
  });

  it('eşzamanlı çalışmada kaydı başkası aldıysa (çakışma) göndermez', async () => {
    orderFindMany.mockResolvedValue([siparis('001')]);
    veritabani({ cakisan: ['001'] });
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);
    expect(sonuc.gonderilen).toBe(0);
    expect(gonder).not.toHaveBeenCalled();
  });

  it('zaten yorumlanmış ürünler e-postaya girmez; hepsi yorumlanmışsa sipariş atlanır', async () => {
    orderFindMany.mockResolvedValue([siparis('001'), siparis('002', ['k1'])]);
    reviewFindMany.mockResolvedValue([{ orderItemId: '001-k1' }, { orderItemId: '002-k1' }]);
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);

    expect(sonuc.gonderilen).toBe(1);
    expect(sonuc.atlanan).toContainEqual({ sebep: 'tüm ürünler zaten yorumlanmış', adet: 1 });
    const html = gonder.mock.calls[0][2];
    expect(html).not.toContain('Ürün k1');
    expect(html).toContain('Ürün k2');
  });

  it('gönderim başarısızsa kaydı geri alır (sonraki çalışmada yeniden denensin)', async () => {
    orderFindMany.mockResolvedValue([siparis('001')]);
    gonder.mockResolvedValue(false);
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);

    expect(sonuc.gonderilen).toBe(0);
    expect(sonuc.atlanan).toContainEqual({ sebep: 'e-posta gönderilemedi', adet: 1 });
    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(String(executeRaw.mock.calls[0][0])).toContain('DELETE FROM "YorumDavetKaydi"');
  });

  it('kaydı göndermeden ÖNCE alır (çift gönderimi önler)', async () => {
    orderFindMany.mockResolvedValue([siparis('001')]);
    const sira: string[] = [];
    queryRaw.mockImplementation(async (sql: string, ...p: unknown[]) => {
      if (sql.includes('INSERT INTO "YorumDavetKaydi"')) {
        sira.push('kayit');
        return [{ siparisId: p[0] }];
      }
      return [];
    });
    gonder.mockImplementation(async () => {
      sira.push('gonder');
      return true;
    });
    await yorumIstekleriniGonder(TABAN, false, simdi);
    expect(sira).toEqual(['kayit', 'gonder']);
  });

  it('kuru çalışma: e-posta göndermez, kayıt yazmaz, elemelerin tanısını verir', async () => {
    orderFindMany.mockResolvedValue([siparis('001'), siparis('002')]);
    orderCount.mockResolvedValue(7);
    const sonuc = await yorumIstekleriniGonder(TABAN, true, simdi);

    expect(sonuc.gonderilen).toBe(2); // "gönderilecekti"
    expect(gonder).not.toHaveBeenCalled();
    expect(queryRaw.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO'))).toBe(false);
    expect(executeRaw).not.toHaveBeenCalled();
    expect(sonuc.tani).toBeDefined();
  });

  it('bir çalışmada en fazla 40 e-posta gönderir', async () => {
    expect(CALISMA_BASINA_AZAMI).toBe(40);
    orderFindMany.mockResolvedValue(Array.from({ length: 60 }, (_, i) => siparis(String(100 + i))));
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);
    expect(sonuc.gonderilen).toBe(40);
    expect(gonder).toHaveBeenCalledTimes(40);
  });

  it('hediye kodu okunamazsa e-posta yine gider (paylaşım bloğu olmadan)', async () => {
    const { siparisinKodu } = await import('./hediye-db');
    vi.mocked(siparisinKodu).mockRejectedValueOnce(new Error('tablo yok'));
    orderFindMany.mockResolvedValue([siparis('001')]);
    const sonuc = await yorumIstekleriniGonder(TABAN, false, simdi);
    expect(sonuc.gonderilen).toBe(1);
    expect(gonder.mock.calls[0][2]).not.toContain('wa.me');
  });
});
