import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { onTalepTablosu, sepetTablosu, siparisTablosu, type SiparisKaydi } from './admin-excel';
import { excelDosyasi } from './excel';

const siparis = (degisen: Partial<SiparisKaydi> = {}): SiparisKaydi => ({
  orderNumber: 'ISY-1001',
  createdAt: new Date('2026-10-30T10:00:00Z'),
  status: 'CONFIRMED',
  paymentMethod: 'CREDIT_CARD',
  totalAmount: 42,
  itemsTotal: 42,
  kuponKodu: null,
  kuponIndirimi: 0,
  shippingCost: 0,
  shippingAddress: 'Ayşe Yılmaz (+905321112233)\nAtatürk Cad. 5, Çankaya / Ankara, 06100',
  notes: null,
  kargoFirmasi: null,
  kargoTakipNo: null,
  customer: null,
  items: [
    { quantity: 2, product: { name: 'Elban Şalgam Suyu Acılı' } },
    { quantity: 1, product: { name: 'Ahşap Fıçı Kumbara' } },
  ],
  ...degisen,
});

describe('siparisTablosu', () => {
  it('misafir siparisinde musteri bilgisini nottan cikarir ve durumlari Turkce yazar', () => {
    const t = siparisTablosu([
      siparis({ notes: 'Müşteri: Ayşe Yılmaz | Email: ayse@ornek.com | Telefon: 05321112233' }),
    ]);
    const satir = t.satirlar[0];
    expect(satir[2]).toBe('Onaylandı');
    expect(satir[3]).toBe('Kredi kartı');
    expect(satir.slice(4, 7)).toEqual(['Ayşe Yılmaz', 'ayse@ornek.com', '05321112233']);
    expect(satir[7]).toBe('Ayşe Yılmaz (+905321112233), Atatürk Cad. 5, Çankaya / Ankara, 06100');
    expect(satir[8]).toBe('2× Elban Şalgam Suyu Acılı; 1× Ahşap Fıçı Kumbara');
    expect(satir).toHaveLength(t.sutunlar.length);
  });

  it('kayitli musteride Customer bilgisini kullanir', () => {
    const t = siparisTablosu([
      siparis({ customer: { name: 'Mehmet Kaya', email: 'mehmet@ornek.com', phone: null }, notes: 'Müşteri: Eski Ad' }),
    ]);
    expect(t.satirlar[0][4]).toBe('Mehmet Kaya');
  });
});

describe('onTalepTablosu ve sepetTablosu', () => {
  it('her satir sutun sayisiyla ayni uzunlukta ve durumlar Turkce', () => {
    const onTalep = onTalepTablosu([
      {
        createdAt: new Date(), status: 'WAITING', quantity: 3, name: 'Ali', email: 'ali@ornek.com',
        phone: null, note: null, notifiedAt: null, product: { name: 'Zeytinyağı' },
      },
    ]);
    expect(onTalep.satirlar[0][1]).toBe('Bekliyor');
    expect(onTalep.satirlar[0]).toHaveLength(onTalep.sutunlar.length);

    const sepet = sepetTablosu([
      {
        updatedAt: new Date(), durum: 'TERK_EDILDI', musteri: null, kalemler: [{ name: 'Bal', adet: 2 }],
        kalemSayisi: 2, toplamTutar: 300, hatirlatmaGonderildiAt: null, sonrakiSiparis: null,
      },
    ]);
    expect(sepet.satirlar[0].slice(1, 3)).toEqual(['Terk edildi', 'Misafir']);
    expect(sepet.satirlar[0]).toHaveLength(sepet.sutunlar.length);
  });
});

describe('excelDosyasi', () => {
  it('Turkce karakterleri ve formul gibi gorunen metni bozmadan okunabilir xlsx uretir', async () => {
    const t = siparisTablosu([siparis({ notes: 'Müşteri: =HYPERLINK("x") | Email: a@b.com' })]);
    const dosya = await excelDosyasi(t.sayfaAdi, t.sutunlar, t.satirlar);

    const kitap = new ExcelJS.Workbook();
    await kitap.xlsx.load(new Uint8Array(dosya).buffer);
    const sayfa = kitap.getWorksheet('Siparişler')!;
    expect(sayfa.getRow(1).getCell(1).value).toBe('Sipariş No');
    expect(sayfa.getRow(2).getCell(9).value).toBe('2× Elban Şalgam Suyu Acılı; 1× Ahşap Fıçı Kumbara');
    expect(sayfa.getRow(2).getCell(5).value).toBe('=HYPERLINK("x")');
    expect(sayfa.getRow(2).getCell(5).formula).toBeUndefined();
  });
});
