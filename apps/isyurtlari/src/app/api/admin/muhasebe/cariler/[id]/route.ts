import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Tek bir cari kartın tüm detaylarını getir
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const red = adminGuard(req);
  if (red) return red;

  try {
    const cari = await prisma.cariKart.findUnique({
      where: { id: params.id },
      include: {
        faturalar: {
          orderBy: { tarih: 'desc' },
          take: 20,
        },
        hareketler: {
          orderBy: { tarih: 'desc' },
          take: 20,
        },
        _count: {
          select: { faturalar: true, hareketler: true },
        },
      },
    });

    if (!cari) {
      return NextResponse.json({ error: 'Cari kart bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(cari);
  } catch (error) {
    console.error('Cari getirme hatası:', error);
    return NextResponse.json({ error: 'Cari kart bilgileri alınamadı' }, { status: 500 });
  }
}

// PUT: Cari kart bilgilerini güncelle
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { unvan, tur, vergiTcNo, vergiDairesi, eposta, telefon, adres, sehir, muhasebeKodu } = body;

    if (!unvan || !unvan.trim()) {
      return NextResponse.json({ error: 'Unvan zorunludur' }, { status: 400 });
    }

    const guncel = await prisma.cariKart.update({
      where: { id: params.id },
      data: {
        unvan: unvan.trim(),
        tur: tur === 'SATICI' ? 'SATICI' : 'ALICI',
        vergiTcNo: vergiTcNo?.trim() || null,
        vergiDairesi: vergiDairesi?.trim() || null,
        eposta: eposta?.trim() || null,
        telefon: telefon?.trim() || null,
        adres: adres?.trim() || null,
        sehir: sehir?.trim() || null,
        muhasebeKodu: muhasebeKodu?.trim() || null,
      },
    });

    return NextResponse.json(guncel);
  } catch (error) {
    console.error('Cari güncelleme hatası:', error);
    return NextResponse.json({ error: 'Cari kart güncellenemedi' }, { status: 500 });
  }
}

// DELETE: Cari kartı sil (bağlı hareket veya fatura yoksa)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const red = adminGuard(req);
  if (red) return red;

  try {
    const cari = await prisma.cariKart.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { faturalar: true, hareketler: true } },
      },
    });

    if (!cari) {
      return NextResponse.json({ error: 'Cari kart bulunamadı' }, { status: 404 });
    }

    if (cari._count.faturalar > 0 || cari._count.hareketler > 0) {
      return NextResponse.json(
        { error: `Bu cari karta ait ${cari._count.faturalar} fatura ve ${cari._count.hareketler} hareket bulunmaktadır. Muhasebe bütünlüğü için silinemez.` },
        { status: 400 }
      );
    }

    await prisma.cariKart.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Cari kart silindi' });
  } catch (error) {
    console.error('Cari silme hatası:', error);
    return NextResponse.json({ error: 'Cari kart silinemedi' }, { status: 500 });
  }
}
