import { prisma } from '@isyurtlari/database';
import { dunTarihAraligi, type GunlukVeri, type SatisOzeti } from './gunluk-rapor';
import { ga4TrafikGetir } from './ga4-rapor';
import { merchantSatirlariGetir, fiyatOzetiOlustur } from './merchant-fiyat-raporu';

/** Ödemesi alınmış siparişler. PENDING (havale bekleyen) ve CANCELLED hariç. */
const ODENMIS_DURUMLAR = ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;

const SECIM_TOP = 5;
const SECIM_DUSUK_STOK = 10;

async function satisOzetiGetir(baslangic: Date, bitis: Date): Promise<SatisOzeti> {
  const siparisler = await prisma.order.findMany({
    where: {
      createdAt: { gte: baslangic, lt: bitis },
      status: { in: [...ODENMIS_DURUMLAR] },
    },
    select: { totalAmount: true },
  });

  const ciro = siparisler.reduce((t, s) => t + s.totalAmount, 0);
  const siparisSayisi = siparisler.length;

  const kalemler = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: baslangic, lt: bitis },
        status: { in: [...ODENMIS_DURUMLAR] },
      },
    },
    select: { quantity: true, product: { select: { name: true } } },
  });

  const adetler = new Map<string, number>();
  for (const k of kalemler) {
    const ad = k.product.name;
    adetler.set(ad, (adetler.get(ad) ?? 0) + k.quantity);
  }
  const enCokSatan = [...adetler.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, SECIM_TOP)
    .map(([baslik, adet]) => ({ baslik, adet }));

  return {
    ciro: Math.round(ciro * 100) / 100,
    siparis: siparisSayisi,
    aov: siparisSayisi > 0 ? Math.round((ciro / siparisSayisi) * 100) / 100 : 0,
    enCokSatan,
    dusukStok: [],
  };
}

async function dusukStokGetir(): Promise<{ baslik: string; stok: number }[]> {
  const urunler = await prisma.product.findMany({
    select: { name: true, quantity: true, minStockLevel: true },
  });
  return urunler
    .filter((u) => u.quantity <= u.minStockLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, SECIM_DUSUK_STOK)
    .map((u) => ({ baslik: u.name, stok: u.quantity }));
}

export interface VeriTopluSonucu {
  veri: GunlukVeri;
  /** Hangi kaynağın alınamadığını açıklayan notlar (e-postaya eklenir). */
  uyarilar: string[];
}

/**
 * Dünün üç kaynağını toplar. Bir kaynak başarısız olursa diğerleri yine
 * kullanılır; başarısız kaynak null kalır ve uyarı olarak kaydedilir.
 */
export async function gunlukVeriTopla(simdi: Date = new Date()): Promise<VeriTopluSonucu> {
  const dun = dunTarihAraligi(simdi);
  const oncekiGun = dunTarihAraligi(new Date(dun.baslangic.getTime() - 60 * 60 * 1000));
  const uyarilar: string[] = [];

  const satis = await satisOzetiGetir(dun.baslangic, dun.bitis)
    .then(async (s) => ({ ...s, dusukStok: await dusukStokGetir() }))
    .catch((e) => {
      uyarilar.push(`Satış verisi: ${String(e)}`);
      return null;
    });

  const onceki = await satisOzetiGetir(oncekiGun.baslangic, oncekiGun.bitis).catch((e) => {
    uyarilar.push(`Önceki gün satış verisi: ${String(e)}`);
    return null;
  });

  const trafik = await ga4TrafikGetir(dun.etiket.split('.').reverse().join('-')).catch((e) => {
    uyarilar.push(`GA4: ${String(e)}`);
    return null;
  });

  const fiyat = await merchantSatirlariGetir()
    .then((satirlar) => fiyatOzetiOlustur(satirlar))
    .catch((e) => {
      uyarilar.push(`Merchant: ${String(e)}`);
      return null;
    });

  return {
    veri: { etiket: dun.etiket, satis, onceki, trafik, fiyat },
    uyarilar,
  };
}
