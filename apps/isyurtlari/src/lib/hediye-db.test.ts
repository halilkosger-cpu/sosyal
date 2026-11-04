import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryRaw = vi.fn();
const orderFindUnique = vi.fn();
const orderCount = vi.fn();
const orderUpdate = vi.fn();

vi.mock('@isyurtlari/database', () => ({
  prisma: {
    $queryRawUnsafe: (...a: unknown[]) => queryRaw(...a),
    $executeRawUnsafe: vi.fn(),
    order: {
      findUnique: (...a: unknown[]) => orderFindUnique(...a),
      count: (...a: unknown[]) => orderCount(...a),
      update: (...a: unknown[]) => orderUpdate(...a),
    },
  },
}));

import { hediyeKodunuDegerlendir, hediyeyiSipariseUygula, siparisIcinKodOlustur } from './hediye-db';

/** SQL metnine göre yanıt veren sahte veritabanı. */
function veritabani(kosullar: { kodSatiri?: { kaynakSiparisId: string } | null; kullanimSatiri?: { id: string } | null }) {
  queryRaw.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM "HediyeKodu"')) return kosullar.kodSatiri ? [kosullar.kodSatiri] : [];
    if (sql.includes('FROM "HediyeKullanimi"')) return kosullar.kullanimSatiri ? [kosullar.kullanimSatiri] : [];
    return [];
  });
}

const girdi = { kod: 'HD-7K2M9', eposta: 'Arkadas@Ornek.com', telefon: '0533 111 22 33', odenecekTutar: 2500 };
const kaynakNotu = 'Müşteri: Ayşe | Email: ayse@ornek.com | Telefon: 0532 123 45 67 | Fatura: Bireysel';

describe('hediyeKodunuDegerlendir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderFindUnique.mockResolvedValue({ notes: kaynakNotu });
    orderCount.mockResolvedValue(0);
  });

  it('yeni müşteri, ilk sipariş, yeterli tutar: geçerli', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' } });
    expect(await hediyeKodunuDegerlendir(girdi)).toEqual({ gecerli: true });
  });

  it('olmayan kod reddedilir', async () => {
    veritabani({ kodSatiri: null });
    expect(await hediyeKodunuDegerlendir(girdi)).toMatchObject({ gecerli: false, sebep: 'kod-yok' });
  });

  it('kod sahibi aynı e-postayla kullanamaz', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' } });
    const s = await hediyeKodunuDegerlendir({ ...girdi, eposta: 'AYSE@ornek.com' });
    expect(s).toMatchObject({ gecerli: false, sebep: 'kendi-kodu' });
  });

  it('kod sahibi aynı telefonla (farklı biçimde yazılsa da) kullanamaz', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' } });
    const s = await hediyeKodunuDegerlendir({ ...girdi, telefon: '+90 532 123 45 67' });
    expect(s).toMatchObject({ gecerli: false, sebep: 'kendi-kodu' });
  });

  it('daha önce siparişi olan e-posta ilk sipariş sayılmaz', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' } });
    orderCount.mockResolvedValue(2);
    expect(await hediyeKodunuDegerlendir(girdi)).toMatchObject({ gecerli: false, sebep: 'ilk-siparis-degil' });
    // Sipariş sayımı e-postayı tam eşleşmeyle (sonuna " |" koyarak) arar.
    expect(orderCount.mock.calls[0][0].where.notes.contains).toBe('Email: arkadas@ornek.com |');
  });

  it('daha önce hediye kullanmış kişiye ikinci hediye verilmez', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' }, kullanimSatiri: { id: 'k1' } });
    expect(await hediyeKodunuDegerlendir(girdi)).toMatchObject({ gecerli: false, sebep: 'kullanilmis' });
  });

  it('2.000 ₺ altında geçerli değil', async () => {
    veritabani({ kodSatiri: { kaynakSiparisId: 's1' } });
    expect(await hediyeKodunuDegerlendir({ ...girdi, odenecekTutar: 1999 })).toMatchObject({
      gecerli: false,
      sebep: 'tutar-yetersiz',
    });
  });
});

describe('hediyeyiSipariseUygula', () => {
  beforeEach(() => vi.clearAllMocks());

  it('kullanım kaydedilirse sipariş notuna hediye ibaresini ekler', async () => {
    queryRaw.mockResolvedValue([{ id: 'k1' }]);
    const sonuc = await hediyeyiSipariseUygula({
      kod: 'HD-7K2M9',
      siparisId: 's2',
      mevcutNot: 'Müşteri: Can | Email: can@ornek.com',
      eposta: 'Can@Ornek.com',
      telefon: '0533 111 22 33',
    });
    expect(sonuc).toBe(true);
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: 's2' },
      data: { notes: 'Müşteri: Can | Email: can@ornek.com | HEDİYE EKLENECEKTİR (Kod: HD-7K2M9)' },
    });
    // E-posta ve telefon normallestirilmis yazilir (benzersizlik kisiti bunlara dayanir).
    expect(queryRaw.mock.calls[0].slice(4)).toEqual(['can@ornek.com', '5331112233']);
  });

  it('benzersizlik kısıtı yarışı kaybedilirse (çakışma) not eklenmez ve false döner', async () => {
    queryRaw.mockResolvedValue([]);
    const sonuc = await hediyeyiSipariseUygula({
      kod: 'HD-7K2M9',
      siparisId: 's2',
      mevcutNot: 'x',
      eposta: 'can@ornek.com',
      telefon: '0533 111 22 33',
    });
    expect(sonuc).toBe(false);
    expect(orderUpdate).not.toHaveBeenCalled();
  });
});

describe('siparisIcinKodOlustur', () => {
  beforeEach(() => vi.clearAllMocks());

  it('siparişin kodu varsa yenisini üretmez', async () => {
    queryRaw.mockResolvedValueOnce([{ kod: 'HD-AAAAA' }]);
    expect(await siparisIcinKodOlustur({ $queryRawUnsafe: queryRaw, $executeRawUnsafe: vi.fn() } as never, 's1')).toBe('HD-AAAAA');
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('çakışan kodda yeniden dener ve sonunda eklenen kodu döndürür', async () => {
    queryRaw
      .mockResolvedValueOnce([]) // mevcut kod yok
      .mockResolvedValueOnce([]) // 1. deneme çakıştı
      .mockResolvedValueOnce([{ kod: 'HD-BBBBB' }]); // 2. deneme eklendi
    expect(await siparisIcinKodOlustur({ $queryRawUnsafe: queryRaw, $executeRawUnsafe: vi.fn() } as never, 's1')).toBe('HD-BBBBB');
    expect(queryRaw).toHaveBeenCalledTimes(3);
  });
});
