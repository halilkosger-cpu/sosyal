import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Kurus farki olmamasi icin 2 basamak yuvarlama */
const ikiHane = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysParam);

    // 1. Siparişleri ve Sipariş Kalemlerini Çek (İptal edilmemiş siparişler)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                vatRate: true,
                purchasePrice: true,
              },
            },
          },
        },
      },
    });

    // 2. Giderleri Çek
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    // ─── HESAPLAMALAR ──────────────────────────────────────────
    // Satışlar & KDV & Maliyet
    let toplamSatisBrut = 0;       // KDV Dahil Ciro
    let toplamSatisKdv = 0;        // Hesaplanan KDV (Müşteriden tahsil edilen)
    let toplamSatisNetMatrah = 0;  // KDV Hariç Net Satış Hasılatı
    let satilanMalinMaliyeti = 0;   // SMM (Satılan ürünlerin alış maliyeti)

    orders.forEach((order) => {
      toplamSatisBrut += order.totalAmount;

      order.items.forEach((item) => {
        const vatRate = item.product?.vatRate ?? 20;
        const lineTotal = item.price * item.quantity;
        // KDV dahil tutardan matrah ve KDV ayrıştırma
        const lineMatrah = lineTotal / (1 + vatRate / 100);
        const lineKdv = lineTotal - lineMatrah;

        toplamSatisNetMatrah += lineMatrah;
        toplamSatisKdv += lineKdv;

        // Maliyet: Sipariş anındaki birim maliyet varsa onu, yoksa ürünün güncel alış fiyatını al
        const unitCost = item.purchasePrice > 0 ? item.purchasePrice : (item.product?.purchasePrice ?? 0);
        satilanMalinMaliyeti += unitCost * item.quantity;
      });
    });

    // Brüt Satış Kârı (Net Hasılat - SMM)
    const brutKar = toplamSatisNetMatrah - satilanMalinMaliyeti;
    const brutKarMarji = toplamSatisNetMatrah > 0 ? (brutKar / toplamSatisNetMatrah) * 100 : 0;

    // Giderler Dağılımı ve Gider KDV'si (İndirilecek KDV)
    let toplamGider = 0;
    let toplamGiderKdv = 0;
    const giderKategorileri: Record<string, number> = {
      SHIPPING: 0,
      MARKETING: 0,
      COMMISSION: 0,
      OPERATIONAL: 0,
    };

    expenses.forEach((exp) => {
      toplamGider += exp.amount;
      const vatRate = exp.vatRate ?? 20;
      const matrah = exp.amount / (1 + vatRate / 100);
      toplamGiderKdv += (exp.amount - matrah);

      if (giderKategorileri[exp.category] !== undefined) {
        giderKategorileri[exp.category] += exp.amount;
      }
    });

    // Net Faaliyet Kârı = Brüt Kâr - Faaliyet Giderleri (KDV hariç net işletme kârı)
    // Giderlerin KDV hariç matrahı:
    const netGiderler = toplamGider - toplamGiderKdv;
    const netFaaliyetKari = brutKar - netGiderler;
    const netKarMarji = toplamSatisNetMatrah > 0 ? (netFaaliyetKari / toplamSatisNetMatrah) * 100 : 0;

    // KDV Dengesi: Hesaplanan KDV (Satış) - İndirilecek KDV (Giderler + Alışlar)
    const tahminiOdenecekKdv = toplamSatisKdv - toplamGiderKdv;

    // Kritik Stok Sayısı
    const allProducts = await prisma.product.findMany({
      select: { id: true, quantity: true, minStockLevel: true },
    });
    const kritikStokAdedi = allProducts.filter((p) => p.quantity <= (p.minStockLevel ?? 5)).length;

    return NextResponse.json({
      periodDays: daysParam,
      metrics: {
        totalRevenue: ikiHane(toplamSatisBrut),         // KDV Dahil Ciro
        netRevenue: ikiHane(toplamSatisNetMatrah),       // KDV Hariç Ciro
        cogs: ikiHane(satilanMalinMaliyeti),             // Satılan Malın Maliyeti
        grossProfit: ikiHane(brutKar),                   // Brüt Kâr
        grossProfitMargin: ikiHane(brutKarMarji),        // Brüt Kâr Marjı %
        totalExpenses: ikiHane(toplamGider),             // Toplam Gider
        netProfit: ikiHane(netFaaliyetKari),             // Net Faaliyet Kârı
        netProfitMargin: ikiHane(netKarMarji),           // Net Kâr Marjı %
        vatSummary: {
          collectedVat: ikiHane(toplamSatisKdv),         // Satışlardan Hesaplanan KDV
          deductibleVat: ikiHane(toplamGiderKdv),        // Giderlerden İndirilecek KDV
          estimatedPayableVat: ikiHane(tahminiOdenecekKdv), // Devreden/Ödenecek Fark
        },
      },
      expensesByCategory: {
        shipping: ikiHane(giderKategorileri.SHIPPING),
        marketing: ikiHane(giderKategorileri.MARKETING),
        commission: ikiHane(giderKategorileri.COMMISSION),
        operational: ikiHane(giderKategorileri.OPERATIONAL),
      },
      orderCount: orders.length,
      expenseCount: expenses.length,
      criticalStockCount: kritikStokAdedi,
    });
  } catch (error) {
    console.error('Ön muhasebe özet hatası:', error);
    return NextResponse.json({ error: 'Özet verileri alınamadı' }, { status: 500 });
  }
}
