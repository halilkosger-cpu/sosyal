import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Tek bir faturanın tüm detaylarını ve satırlarını getir
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const fatura = await prisma.fatura.findUnique({
      where: { id: params.id },
      include: {
        cari: true,
        satirlar: true,
      },
    });

    if (!fatura) {
      return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(fatura);
  } catch (error) {
    console.error('Fatura getirme hatası:', error);
    return NextResponse.json({ error: 'Fatura bilgileri alınamadı' }, { status: 500 });
  }
}

// PUT: Fatura bilgilerini güncelle (açıklama, durum veya satırlar)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const fatura = await prisma.fatura.findUnique({
      where: { id: params.id },
      include: { satirlar: true },
    });

    if (!fatura) {
      return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
    }

    const body = await req.json();
    const { aciklama, durum, faturaNo } = body;

    // Eğer resmi GİB gönderimi yapılmışsa numara ve parasal değerler değiştirilemez, sadece açıklama ve durum güncellenebilir
    const updateData: any = {};
    if (aciklama !== undefined) updateData.aciklama = aciklama;
    if (durum !== undefined) updateData.durum = durum;

    if (fatura.eFaturaDurum !== 'BASARILI' && faturaNo && faturaNo !== fatura.faturaNo) {
      // Fatura no benzersizlik kontrolü
      const varMi = await prisma.fatura.findUnique({ where: { faturaNo } });
      if (varMi && varMi.id !== fatura.id) {
        return NextResponse.json({ error: 'Bu fatura numarası zaten kullanımda' }, { status: 400 });
      }
      updateData.faturaNo = faturaNo;
    }

    const guncel = await prisma.fatura.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cari: true,
        satirlar: true,
      },
    });

    return NextResponse.json(guncel);
  } catch (error) {
    console.error('Fatura güncelleme hatası:', error);
    return NextResponse.json({ error: 'Fatura güncellenemedi' }, { status: 500 });
  }
}

// DELETE: Faturayı sil (resmi GİB gönderimi yapılmamışsa)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const fatura = await prisma.fatura.findUnique({
      where: { id: params.id },
      include: { cari: true },
    });

    if (!fatura) {
      return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
    }

    if (fatura.eFaturaDurum === 'BASARILI' && fatura.gibFaturaNo) {
      return NextResponse.json(
        { error: 'Resmi olarak GİB e-Arşiv sistemine onaylanmış faturalar doğrudan silinemez. Mevzuat gereği iptal faturası veya iade faturası kesilmelidir.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Bağlı cari hareket varsa sil ve cari bakiyesini düzelt
      const hareket = await tx.cariHareket.findFirst({
        where: { belgeNo: fatura.faturaNo, cariId: fatura.cariId },
      });

      if (hareket) {
        const cari = await tx.cariKart.findUnique({ where: { id: fatura.cariId } });
        if (cari) {
          const fark = fatura.tur === 'SATIS' ? -fatura.genelToplam : fatura.genelToplam;
          await tx.cariKart.update({
            where: { id: cari.id },
            data: { bakiye: (cari.bakiye || 0) + fark },
          });
        }
        await tx.cariHareket.delete({ where: { id: hareket.id } });
      }

      await tx.fatura.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true, message: 'Fatura başarıyla silindi' });
  } catch (error) {
    console.error('Fatura silme hatası:', error);
    return NextResponse.json({ error: 'Fatura silinemedi' }, { status: 500 });
  }
}
