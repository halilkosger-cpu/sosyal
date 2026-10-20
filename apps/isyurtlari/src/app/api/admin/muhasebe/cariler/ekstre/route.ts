import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const cariId = searchParams.get('cariId');

    if (!cariId) {
      return NextResponse.json({ error: 'Cari ID zorunludur' }, { status: 400 });
    }

    const [cari, hareketler] = await Promise.all([
      prisma.cariKart.findUnique({ where: { id: cariId } }),
      prisma.cariHareket.findMany({
        where: { cariId },
        orderBy: { tarih: 'asc' },
      }),
    ]);

    if (!cari) {
      return NextResponse.json({ error: 'Cari bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      cari,
      hareketler,
    });
  } catch (error) {
    console.error('Cari ekstre hatası:', error);
    return NextResponse.json({ error: 'Ekstre alınamadı' }, { status: 500 });
  }
}
