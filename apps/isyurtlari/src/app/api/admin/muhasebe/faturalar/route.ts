import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Faturaları Listele
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const tur = searchParams.get('tur'); // 'SATIS' veya 'SATINALMA'

    const where: any = {};
    if (tur) where.tur = tur;

    const faturalar = await prisma.fatura.findMany({
      where,
      include: {
        cari: { select: { unvan: true, kod: true, vergiTcNo: true } },
        satirlar: true,
      },
      orderBy: { tarih: 'desc' },
      take: 100,
    });

    return NextResponse.json(faturalar);
  } catch (error) {
    console.error('Fatura listeleme hatası:', error);
    return NextResponse.json({ error: 'Faturalar alınamadı' }, { status: 500 });
  }
}

// POST: Siparişten Otomatik Satış Faturası Kes veya Manuel Fatura Oluştur
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { orderId, cariId, tur, satirlar, faturaNo: ozelFaturaNo, aciklama } = body;

    // 1. Sıradaki Fatura Numarasını Belirle
    let faturaNo = ozelFaturaNo;
    if (!faturaNo) {
      const year = new Date().getFullYear();
      const prefix = tur === 'SATINALMA' ? `ALIS-${year}` : `FTR-${year}`;
      const sonFatura = await prisma.fatura.findFirst({
        where: { faturaNo: { startsWith: prefix } },
        orderBy: { createdAt: 'desc' },
        select: { faturaNo: true },
      });

      let sonrakiNo = 1;
      if (sonFatura?.faturaNo) {
        const parts = sonFatura.faturaNo.split('-');
        if (parts.length >= 3) sonrakiNo = parseInt(parts[2], 10) + 1;
      }
      faturaNo = `${prefix}-${String(sonrakiNo).padStart(5, '0')}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalCariId = cariId;

      // Eğer siparişten geliyorsa ve cari yoksa otomatik müşteri carisi aç
      if (orderId && !finalCariId) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        });

        if (order) {
          const notes = order.notes || '';
          const emailMatch = notes.match(/Email:\s*([^|]+)/i);
          const nameMatch = notes.match(/Müşteri:\s*([^|]+)/i);

          const musteriEposta = order.user?.email || (emailMatch ? emailMatch[1].trim() : `musteri_${order.orderNumber}@isyurtlari.com.tr`);
          const musteriUnvan = order.user?.name || (nameMatch ? nameMatch[1].trim() : 'Perakende Müşteri');

          let cari = await tx.cariKart.findFirst({
            where: { eposta: musteriEposta },
          });

          if (!cari) {
            const count = await tx.cariKart.count({ where: { tur: 'ALICI' } });
            cari = await tx.cariKart.create({
              data: {
                kod: `CH-120-${String(count + 1).padStart(4, '0')}`,
                unvan: musteriUnvan,
                tur: 'ALICI',
                eposta: musteriEposta,
                adres: order.shippingAddress,
              },
            });
          }
          finalCariId = cari.id;
        }
      }

      if (!finalCariId) {
        throw new Error('Faturanın bağlanacağı cari kart bulunamadı');
      }

      // 2. Satırları ve Toplamları Hesapla
      let matrahToplam = 0;
      let kdvToplam = 0;
      let genelToplam = 0;

      const formatliSatirlar = (satirlar || []).map((s: any) => {
        const vatRate = s.kdvOrani !== undefined ? parseFloat(s.kdvOrani) : 20;
        const lineTotal = parseFloat(s.birimFiyat) * parseInt(s.miktar, 10);
        const lineMatrah = lineTotal / (1 + vatRate / 100);
        const lineKdv = lineTotal - lineMatrah;

        matrahToplam += lineMatrah;
        kdvToplam += lineKdv;
        genelToplam += lineTotal;

        return {
          productId: s.productId || null,
          aciklama: s.aciklama,
          miktar: parseInt(s.miktar, 10),
          birimFiyat: parseFloat(s.birimFiyat),
          kdvOrani: vatRate,
          kdvTutari: Math.round((lineKdv + Number.EPSILON) * 100) / 100,
          satirToplam: Math.round((lineTotal + Number.EPSILON) * 100) / 100,
        };
      });

      // 3. Faturayı Kaydet
      const fatura = await tx.fatura.create({
        data: {
          faturaNo,
          tur: tur === 'SATINALMA' ? 'SATINALMA' : 'SATIS',
          cariId: finalCariId,
          orderId: orderId || null,
          matrah: Math.round((matrahToplam + Number.EPSILON) * 100) / 100,
          kdvTutari: Math.round((kdvToplam + Number.EPSILON) * 100) / 100,
          genelToplam: Math.round((genelToplam + Number.EPSILON) * 100) / 100,
          aciklama: aciklama || (orderId ? `Sipariş Faturası` : 'Fatura'),
          satirlar: {
            create: formatliSatirlar,
          },
        },
      });

      // 4. Logo GO3 Cari Hareketi İşle (Satış faturası = Müşteri Borçlanır / Alış = Alacaklanır)
      const borcTutari = fatura.tur === 'SATIS' ? fatura.genelToplam : 0;
      const alacakTutari = fatura.tur === 'SATINALMA' ? fatura.genelToplam : 0;

      // Cari güncel bakiye
      const cari = await tx.cariKart.findUnique({ where: { id: finalCariId } });
      const yeniBakiye = (cari?.bakiye || 0) + (borcTutari - alacakTutari);

      await tx.cariKart.update({
        where: { id: finalCariId },
        data: { bakiye: yeniBakiye },
      });

      await tx.cariHareket.create({
        data: {
          cariId: finalCariId,
          islemTuru: fatura.tur === 'SATIS' ? 'SATIS_FATURASI' : 'ALIS_FATURASI',
          belgeNo: fatura.faturaNo,
          aciklama: `${fatura.faturaNo} nolu fatura kaydı`,
          borc: borcTutari,
          alacak: alacakTutari,
          bakiye: yeniBakiye,
        },
      });

      return fatura;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Fatura oluşturma hatası:', error);
    return NextResponse.json({ error: error.message || 'Fatura oluşturulamadı' }, { status: 500 });
  }
}
