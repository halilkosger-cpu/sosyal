import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const tur = searchParams.get('tur') || 'satislar'; // 'satislar' veya 'giderler'
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysParam);

    if (tur === 'giderler') {
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'desc' },
      });

      // CSV Başlıkları
      let csv = 'ID;Tarih;Kategori;Aciklama;Tedarikci;Fatura No;KDV Orani (%);KDV Matrahi (TL);KDV Tutari (TL);Toplam Tutar (TL);Notlar\n';

      for (const e of expenses) {
        const vatRate = e.vatRate ?? 20;
        const matrah = e.amount / (1 + vatRate / 100);
        const kdv = e.amount - matrah;
        const dateStr = new Date(e.date).toLocaleDateString('tr-TR');

        csv += `"${e.id}";"${dateStr}";"${e.category}";"${(e.title || '').replace(/"/g, '""')}";"${(e.supplier || '').replace(/"/g, '""')}";"${(e.invoiceNo || '').replace(/"/g, '""')}";${vatRate};${matrah.toFixed(2)};${kdv.toFixed(2)};${e.amount.toFixed(2)};"${(e.notes || '').replace(/"/g, '""')}"\n`;
      }

      return new NextResponse('\uFEFF' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="giderler_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Varsayılan: Satışlar Raporu
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, vatRate: true, purchasePrice: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let csv = 'Siparis No;Tarih;Musteri;Durum;Odeme Yontemi;Urun Adi;Adet;Birim Satis (KDV Dahil);Birim Alis Maliyeti;Toplam Satis;Toplam Maliyet;Brut Kar;KDV Orani (%);KDV Tutari\n';

    for (const o of orders) {
      const dateStr = new Date(o.createdAt).toLocaleDateString('tr-TR');
      const custStr = (o.notes || '').replace(/[\r\n;]/g, ' ');

      for (const it of o.items) {
        const vatRate = it.product?.vatRate ?? 20;
        const lineTotal = it.price * it.quantity;
        const lineMatrah = lineTotal / (1 + vatRate / 100);
        const lineKdv = lineTotal - lineMatrah;
        const unitCost = it.purchasePrice > 0 ? it.purchasePrice : (it.product?.purchasePrice ?? 0);
        const totalCost = unitCost * it.quantity;
        const profit = lineTotal - totalCost;

        csv += `"${o.orderNumber}";"${dateStr}";"${custStr}";"${o.status}";"${o.paymentMethod}";"${(it.product?.name || 'Ürün').replace(/"/g, '""')}";${it.quantity};${it.price.toFixed(2)};${unitCost.toFixed(2)};${lineTotal.toFixed(2)};${totalCost.toFixed(2)};${profit.toFixed(2)};${vatRate};${lineKdv.toFixed(2)}\n`;
      }
    }

    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="satis_muhasebe_raporu_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Muhasebe dışa aktarma hatası:', error);
    return NextResponse.json({ error: 'Rapor oluşturulamadı' }, { status: 500 });
  }
}
