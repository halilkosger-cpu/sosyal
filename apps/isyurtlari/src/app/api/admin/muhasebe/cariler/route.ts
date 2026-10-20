import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Cari Hesapları Listele
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const tur = searchParams.get('tur'); // 'ALICI' veya 'SATICI'
    const q = searchParams.get('q');

    const where: any = {};
    if (tur) where.tur = tur;
    if (q) {
      where.OR = [
        { unvan: { contains: q, mode: 'insensitive' } },
        { kod: { contains: q, mode: 'insensitive' } },
        { eposta: { contains: q, mode: 'insensitive' } },
      ];
    }

    const cariler = await prisma.cariKart.findMany({
      where,
      include: {
        _count: {
          select: { faturalar: true, hareketler: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(cariler);
  } catch (error) {
    console.error('Cari listeleme hatası:', error);
    return NextResponse.json({ error: 'Cari hesaplar alınamadı' }, { status: 500 });
  }
}

// POST: Yeni Cari Kart Aç (Manuel)
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { unvan, tur, vergiTcNo, vergiDairesi, eposta, telefon, adres, sehir, muhasebeKodu } = body;

    if (!unvan) {
      return NextResponse.json({ error: 'Cari unvan zorunludur' }, { status: 400 });
    }

    const cariTur = tur === 'SATICI' ? 'SATICI' : 'ALICI';
    const prefix = cariTur === 'ALICI' ? 'CH-120' : 'CH-320';

    // Sıradaki kodu bul
    const sonCari = await prisma.cariKart.findFirst({
      where: { kod: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { kod: true },
    });

    let sonrakiNo = 1;
    if (sonCari?.kod) {
      const match = sonCari.kod.match(/CH-(120|320)-(\d+)/);
      if (match) sonrakiNo = parseInt(match[2], 10) + 1;
    }
    const kod = `${prefix}-${String(sonrakiNo).padStart(4, '0')}`;

    const cari = await prisma.cariKart.create({
      data: {
        kod,
        unvan: unvan.trim(),
        tur: cariTur,
        muhasebeKodu: muhasebeKodu || (cariTur === 'ALICI' ? `120.01.${String(sonrakiNo).padStart(3, '0')}` : `320.01.${String(sonrakiNo).padStart(3, '0')}`),
        vergiTcNo: vergiTcNo?.trim() || null,
        vergiDairesi: vergiDairesi?.trim() || null,
        eposta: eposta?.trim() || null,
        telefon: telefon?.trim() || null,
        adres: adres?.trim() || null,
        sehir: sehir?.trim() || null,
      },
    });

    return NextResponse.json(cari, { status: 201 });
  } catch (error) {
    console.error('Cari oluşturma hatası:', error);
    return NextResponse.json({ error: 'Cari kart oluşturulamadı' }, { status: 500 });
  }
}
