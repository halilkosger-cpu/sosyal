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
    // Varsayılan: 0 (Tüm Zamanlar) böylece veriler boş görünmez, kullanıcı isterse 30/90 gün seçebilir
    const daysParam = parseInt(searchParams.get('days') ?? '0', 10);

    const whereOrder: any = {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    };
    const whereExpense: any = {};
    const whereFatura: any = {
      orderId: null, // Sipariş faturalarıyla çift sayımı engellemek için sadece bağımsız faturalar
      durum: { not: 'IPTAL' },
    };

    if (daysParam > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysParam);
      whereOrder.createdAt = { gte: startDate };
      whereExpense.date = { gte: startDate };
      whereFatura.tarih = { gte: startDate };
    }

    // 1. Siparişleri ve Sipariş Kalemlerini Çek
    const orders = await prisma.order.findMany({
      where: whereOrder,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                vatRate: true,
                purchasePrice: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Giderleri Çek
    const expenses = await prisma.expense.findMany({
      where: whereExpense,
      orderBy: { date: 'desc' },
    });

    // 3. Manuel Düzenlenen Bağımsız Faturaları Çek
    const manuelFaturalar = await prisma.fatura.findMany({
      where: whereFatura,
      include: { satirlar: true },
      orderBy: { tarih: 'desc' },
    });

    // ─── HESAPLAMALAR ──────────────────────────────────────────
    let toplamSatisBrut = 0;       // KDV Dahil Ciro
    let toplamSatisKdv = 0;        // Hesaplanan KDV (Müşteriden tahsil edilen)
    let toplamSatisNetMatrah = 0;  // KDV Hariç Net Satış Hasılatı
    let satilanMalinMaliyeti = 0;   // SMM (Satılan ürünlerin alış maliyeti)

    // Ürün bazlı kârlılık haritası
    const urunKarlilikMap: Record<string, {
      id: string;
      name: string;
      quantitySold: number;
      totalRevenue: number;
      totalCost: number;
      grossProfit: number;
      margin: number;
    }> = {};

    orders.forEach((order) => {
      toplamSatisBrut += order.totalAmount;

      order.items.forEach((item) => {
        const vatRate = item.product?.vatRate ?? 20;
        const lineTotal = item.price * item.quantity;
        const lineMatrah = lineTotal / (1 + vatRate / 100);
        const lineKdv = lineTotal - lineMatrah;

        toplamSatisNetMatrah += lineMatrah;
        toplamSatisKdv += lineKdv;

        // Maliyet: Sipariş anındaki maliyet > ürünün güncel maliyeti > satış fiyatının %55'i varsayılan girdi
        const unitCost =
          item.purchasePrice > 0
            ? item.purchasePrice
            : item.product?.purchasePrice && item.product.purchasePrice > 0
            ? item.product.purchasePrice
            : Math.round(item.price * 0.55 * 100) / 100;

        const lineCost = unitCost * item.quantity;
        satilanMalinMaliyeti += lineCost;

        // Ürün kârlılık dökümü
        const prodKey = item.productId || item.product?.name || 'Bilinmeyen Ürün';
        const prodName = item.product?.name || 'Ürün';

        if (!urunKarlilikMap[prodKey]) {
          urunKarlilikMap[prodKey] = {
            id: prodKey,
            name: prodName,
            quantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
            grossProfit: 0,
            margin: 0,
          };
        }
        urunKarlilikMap[prodKey].quantitySold += item.quantity;
        urunKarlilikMap[prodKey].totalRevenue += lineTotal;
        urunKarlilikMap[prodKey].totalCost += lineCost;
        urunKarlilikMap[prodKey].grossProfit += (lineTotal - lineCost);
      });
    });

    // Bağımsız Manuel Satış Faturalarını Ekle
    manuelFaturalar.forEach((f) => {
      if (f.tur === 'SATIS') {
        toplamSatisBrut += f.genelToplam;
        toplamSatisNetMatrah += f.matrah;
        toplamSatisKdv += f.kdvTutari;

        // Satır maliyetleri
        f.satirlar.forEach((s) => {
          const unitCost = Math.round(s.birimFiyat * 0.55 * 100) / 100;
          const lineCost = unitCost * s.miktar;
          satilanMalinMaliyeti += lineCost;

          const key = s.aciklama;
          if (!urunKarlilikMap[key]) {
            urunKarlilikMap[key] = {
              id: key,
              name: s.aciklama,
              quantitySold: 0,
              totalRevenue: 0,
              totalCost: 0,
              grossProfit: 0,
              margin: 0,
            };
          }
          urunKarlilikMap[key].quantitySold += s.miktar;
          urunKarlilikMap[key].totalRevenue += s.satirToplam;
          urunKarlilikMap[key].totalCost += lineCost;
          urunKarlilikMap[key].grossProfit += (s.satirToplam - lineCost);
        });
      }
    });

    // Kârlılık marjlarını hesapla ve sırala
    const productProfitability = Object.values(urunKarlilikMap)
      .map((p) => ({
        ...p,
        totalRevenue: ikiHane(p.totalRevenue),
        totalCost: ikiHane(p.totalCost),
        grossProfit: ikiHane(p.grossProfit),
        margin: p.totalRevenue > 0 ? ikiHane((p.grossProfit / p.totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.grossProfit - a.grossProfit);

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
      manualInvoiceCount: manuelFaturalar.length,
      expenseCount: expenses.length,
      criticalStockCount: kritikStokAdedi,
      productProfitability: productProfitability.slice(0, 10), // En kârlı ilk 10 ürün
    });
  } catch (error) {
    console.error('Ön muhasebe özet hatası:', error);
    return NextResponse.json({ error: 'Özet verileri alınamadı' }, { status: 500 });
  }
}
