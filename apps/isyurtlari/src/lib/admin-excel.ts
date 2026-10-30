import { TARIH_BICIMI, TL_BICIMI, type HucreDegeri, type Sutun } from '@/lib/excel';

export interface Tablo {
  sayfaAdi: string;
  sutunlar: Sutun[];
  satirlar: HucreDegeri[][];
}

const SIPARIS_DURUMU: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal',
};

const ODEME_YONTEMI: Record<string, string> = {
  CREDIT_CARD: 'Kredi kartı',
  TRANSFER: 'Havale / EFT',
};

const ON_TALEP_DURUMU: Record<string, string> = {
  WAITING: 'Bekliyor',
  NOTIFIED: 'Haber verildi',
  CONVERTED: 'Siparişe dönüştü',
  CANCELLED: 'İptal',
};

const SEPET_DURUMU: Record<string, string> = {
  AKTIF: 'Aktif (30 dk içinde)',
  TERK_EDILDI: 'Terk edildi',
  HATIRLATILDI: 'Hatırlatıldı',
  DONUSTU: 'Siparişe dönüştü',
};

/** Misafir siparisinde musteri bilgisi notes icinde "Müşteri: X | Email: Y | Telefon: Z" olarak duruyor. */
export function nottanCikar(notes: string | null | undefined, anahtar: string): string {
  if (!notes) return '';
  const eslesme = notes.match(new RegExp(`${anahtar}:\\s*([^|\\n]+)`, 'i'));
  return eslesme ? eslesme[1].trim() : '';
}

const urunOzeti = (kalemler: { adet: number; ad: string }[]) =>
  kalemler.map((k) => `${k.adet}× ${k.ad}`).join('; ');

export interface SiparisKaydi {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  itemsTotal: number | null;
  kuponKodu: string | null;
  kuponIndirimi: number;
  shippingCost: number;
  shippingAddress: string;
  notes: string | null;
  kargoFirmasi: string | null;
  kargoTakipNo: string | null;
  customer: { name: string; email: string; phone: string | null } | null;
  items: { quantity: number; product: { name: string } | null }[];
}

export function siparisTablosu(siparisler: SiparisKaydi[]): Tablo {
  return {
    sayfaAdi: 'Siparişler',
    sutunlar: [
      { baslik: 'Sipariş No', genislik: 16 },
      { baslik: 'Tarih', genislik: 17, bicim: TARIH_BICIMI },
      { baslik: 'Durum', genislik: 14 },
      { baslik: 'Ödeme', genislik: 14 },
      { baslik: 'Müşteri', genislik: 22 },
      { baslik: 'E-posta', genislik: 28 },
      { baslik: 'Telefon', genislik: 16 },
      { baslik: 'Teslimat Adresi', genislik: 45 },
      { baslik: 'Ürünler', genislik: 50 },
      { baslik: 'Ürün Toplamı', genislik: 14, bicim: TL_BICIMI },
      { baslik: 'Kupon', genislik: 12 },
      { baslik: 'Kupon İndirimi', genislik: 14, bicim: TL_BICIMI },
      { baslik: 'Kargo', genislik: 12, bicim: TL_BICIMI },
      { baslik: 'Toplam', genislik: 14, bicim: TL_BICIMI },
      { baslik: 'Kargo Firması', genislik: 14 },
      { baslik: 'Takip No', genislik: 18 },
    ],
    satirlar: siparisler.map((s) => [
      s.orderNumber,
      s.createdAt,
      SIPARIS_DURUMU[s.status] ?? s.status,
      ODEME_YONTEMI[s.paymentMethod] ?? s.paymentMethod,
      s.customer?.name || nottanCikar(s.notes, 'Müşteri'),
      s.customer?.email || nottanCikar(s.notes, 'Email') || nottanCikar(s.notes, 'E-posta'),
      s.customer?.phone || nottanCikar(s.notes, 'Telefon'),
      s.shippingAddress.replace(/\n/g, ', '),
      urunOzeti(s.items.map((k) => ({ adet: k.quantity, ad: k.product?.name ?? 'Ürün' }))),
      s.itemsTotal,
      s.kuponKodu,
      s.kuponIndirimi || null,
      s.shippingCost || null,
      s.totalAmount,
      s.kargoFirmasi,
      s.kargoTakipNo,
    ]),
  };
}

export interface OnTalepKaydi {
  createdAt: Date;
  status: string;
  quantity: number;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  notifiedAt: Date | null;
  product: { name: string } | null;
}

export function onTalepTablosu(talepler: OnTalepKaydi[]): Tablo {
  return {
    sayfaAdi: 'Ön Talepler',
    sutunlar: [
      { baslik: 'Tarih', genislik: 17, bicim: TARIH_BICIMI },
      { baslik: 'Durum', genislik: 16 },
      { baslik: 'Ürün', genislik: 40 },
      { baslik: 'Adet', genislik: 8 },
      { baslik: 'Ad Soyad', genislik: 22 },
      { baslik: 'E-posta', genislik: 28 },
      { baslik: 'Telefon', genislik: 16 },
      { baslik: 'Not', genislik: 40 },
      { baslik: 'Haber Verildi', genislik: 17, bicim: TARIH_BICIMI },
    ],
    satirlar: talepler.map((t) => [
      t.createdAt,
      ON_TALEP_DURUMU[t.status] ?? t.status,
      t.product?.name ?? '',
      t.quantity,
      t.name,
      t.email,
      t.phone,
      t.note,
      t.notifiedAt,
    ]),
  };
}

export interface SepetKaydi {
  updatedAt: Date;
  durum: string;
  musteri: { name: string; email: string; phone: string | null; izinli: boolean } | null;
  kalemler: { name: string; adet: number }[];
  kalemSayisi: number;
  toplamTutar: number;
  hatirlatmaGonderildiAt: Date | null;
  sonrakiSiparis: { orderNumber: string } | null;
}

export function sepetTablosu(sepetler: SepetKaydi[]): Tablo {
  return {
    sayfaAdi: 'Terk Edilmiş Sepetler',
    sutunlar: [
      { baslik: 'Son Güncelleme', genislik: 17, bicim: TARIH_BICIMI },
      { baslik: 'Durum', genislik: 18 },
      { baslik: 'Müşteri', genislik: 22 },
      { baslik: 'E-posta', genislik: 28 },
      { baslik: 'Telefon', genislik: 16 },
      { baslik: 'Ticari İleti İzni', genislik: 16 },
      { baslik: 'Ürünler', genislik: 50 },
      { baslik: 'Adet', genislik: 8 },
      { baslik: 'Sepet Tutarı', genislik: 14, bicim: TL_BICIMI },
      { baslik: 'Hatırlatma Gönderildi', genislik: 19, bicim: TARIH_BICIMI },
      { baslik: 'Sonraki Sipariş No', genislik: 18 },
    ],
    satirlar: sepetler.map((s) => [
      s.updatedAt,
      SEPET_DURUMU[s.durum] ?? s.durum,
      s.musteri?.name ?? 'Misafir',
      s.musteri?.email,
      s.musteri?.phone,
      s.musteri ? (s.musteri.izinli ? 'Var' : 'Yok') : '',
      urunOzeti(s.kalemler.map((k) => ({ adet: k.adet, ad: k.name }))),
      s.kalemSayisi,
      s.toplamTutar,
      s.hatirlatmaGonderildiAt,
      s.sonrakiSiparis?.orderNumber,
    ]),
  };
}
