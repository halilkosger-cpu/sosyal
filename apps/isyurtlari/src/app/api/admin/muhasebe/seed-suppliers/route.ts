import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const TEDARIKCILER = [
  {
    kod: 'CH-320-0001',
    unvan: 'Niğde Açık Ceza İnfaz Kurumu İşyurdu Müdürlüğü',
    tur: 'SATICI' as const,
    muhasebeKodu: '320.01.001',
    vergiDairesi: 'Niğde Vergi Dairesi',
    vergiTcNo: '6310023451',
    eposta: 'nigde.is@adalet.gov.tr',
    telefon: '0388 232 40 10',
    adres: 'Bor Yolu Üzeri 5. Km',
    sehir: 'Niğde',
  },
  {
    kod: 'CH-320-0002',
    unvan: 'Foça Açık Ceza İnfaz Kurumu İşyurdu Müdürlüğü',
    tur: 'SATICI' as const,
    muhasebeKodu: '320.01.002',
    vergiDairesi: 'Foça Vergi Dairesi',
    vergiTcNo: '3880019874',
    eposta: 'foca.is@adalet.gov.tr',
    telefon: '0232 812 12 34',
    adres: 'İsmetpaşa Mah. Cezaevi Cad. No:1',
    sehir: 'İzmir',
  },
  {
    kod: 'CH-320-0003',
    unvan: 'Edirne Açık Ceza İnfaz Kurumu İşyurdu Müdürlüğü',
    tur: 'SATICI' as const,
    muhasebeKodu: '320.01.003',
    vergiDairesi: 'Arda Vergi Dairesi',
    vergiTcNo: '3250087412',
    eposta: 'edirne.is@adalet.gov.tr',
    telefon: '0284 213 15 20',
    adres: 'Karaağaç Yolu Üzeri',
    sehir: 'Edirne',
  },
  {
    kod: 'CH-320-0004',
    unvan: 'Bozkurt Kadın Açık Ceza İnfaz Kurumu İşyurdu Müdürlüğü',
    tur: 'SATICI' as const,
    muhasebeKodu: '320.01.004',
    vergiDairesi: 'Çardak Vergi Dairesi',
    vergiTcNo: '1800054129',
    eposta: 'bozkurt.is@adalet.gov.tr',
    telefon: '0258 831 20 40',
    adres: 'Bozkurt İlçe Merkezi',
    sehir: 'Denizli',
  },
  {
    kod: 'CH-320-0005',
    unvan: 'Menemen Açık Ceza İnfaz Kurumu İşyurdu Müdürlüğü',
    tur: 'SATICI' as const,
    muhasebeKodu: '320.01.005',
    vergiDairesi: 'Menemen Vergi Dairesi',
    vergiTcNo: '6140098765',
    eposta: 'menemen.is@adalet.gov.tr',
    telefon: '0232 832 30 50',
    adres: 'Seyrek Yolu 2. Km',
    sehir: 'İzmir',
  },
];

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const sonuclar: string[] = [];

    // 1. Tedarikçileri Oluştur
    for (const t of TEDARIKCILER) {
      const existing = await prisma.cariKart.findUnique({ where: { kod: t.kod } }).catch(() => null);
      if (!existing) {
        await prisma.cariKart.create({ data: t });
        sonuclar.push(`Oluşturuldu: ${t.kod} - ${t.unvan}`);
      } else {
        sonuclar.push(`Zaten Mevcut: ${t.kod} - ${t.unvan}`);
      }
    }

    // 2. Ürünlerin Maliyet ve Başlangıç Stoklarını Tanımla
    const products = await prisma.product.findMany();
    let guncellenenUrun = 0;

    for (const p of products) {
      const updates: any = {};
      if (!p.purchasePrice || p.purchasePrice === 0) {
        // Alış maliyeti: satış fiyatının yaklaşık %55'i (tipik işyurdu komisyon marjı)
        updates.purchasePrice = Math.round(p.price * 0.55 * 100) / 100;
      }
      if (!p.quantity || p.quantity <= 0) {
        updates.quantity = 35; // Başlangıç envanteri
      }
      if (!p.vatRate) {
        updates.vatRate = 20;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: updates,
        });
        guncellenenUrun++;
      }
    }

    return NextResponse.json({
      success: true,
      message: '320 Tedarikçi cezaevi carileri ve başlangıç ürün stok/maliyetleri başarıyla tanımlandı.',
      tedarikciler: sonuclar,
      guncellenenUrunSayisi: guncellenenUrun,
    });
  } catch (error) {
    console.error('Seed suppliers error:', error);
    return NextResponse.json({ error: 'Tedarikçi carileri yüklenirken hata oluştu' }, { status: 500 });
  }
}
