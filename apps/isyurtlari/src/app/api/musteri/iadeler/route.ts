import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { IADE_SEBEPLERI, MUSTERI_IPTAL_EDEBILIR, iadeUygunlugu } from '@/lib/iade';

export const dynamic = 'force-dynamic';

/**
 * Müşterinin iade talepleri.
 *
 * GET  — kendi taleplerini listeler
 * POST — yeni talep oluşturur
 * PATCH — kendi talebini iptal eder (yalnızca iptal; durum değiştirmek
 *         yöneticiye ait)
 */

const SECIM = {
  id: true,
  returnNumber: true,
  status: true,
  reason: true,
  note: true,
  adminNote: true,
  refundAmount: true,
  refundedAt: true,
  createdAt: true,
  order: { select: { orderNumber: true } },
  items: {
    select: {
      quantity: true,
      orderItem: {
        select: { price: true, product: { select: { name: true, slug: true, imageUrl: true } } },
      },
    },
  },
} as const;

export async function GET() {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const iadeler = await prisma.return.findMany({
      where: { customerId: musteri.id },
      orderBy: { createdAt: 'desc' },
      select: SECIM,
    });
    return NextResponse.json({ iadeler });
  } catch (error) {
    console.error('İadeler okunamadı:', error);
    return NextResponse.json({ error: 'İade talepleriniz getirilemedi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'iade-talep', 10, 3600);
  if (sinir) return sinir;

  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const govde: {
      orderId?: string;
      reason?: string;
      note?: string;
      kalemler?: { orderItemId: string; adet: number }[];
    } = await req.json();

    const reason = String(govde.reason ?? '').trim();
    if (!govde.orderId || !reason) {
      return NextResponse.json({ error: 'Sipariş ve iade sebebi gerekli' }, { status: 400 });
    }
    if (!IADE_SEBEPLERI.includes(reason as (typeof IADE_SEBEPLERI)[number])) {
      return NextResponse.json({ error: 'Geçersiz iade sebebi' }, { status: 400 });
    }

    /**
     * Sipariş bu müşteriye ait mi?
     *
     * Kimlik URL'den değil oturumdan geliyor, ama sipariş kimliği
     * gövdeden. Sahiplik kontrolü olmasaydı başkasının sipariş kimliğini
     * yazan biri onun siparişi için iade açabilirdi.
     */
    const siparis = await prisma.order.findFirst({
      where: { id: govde.orderId, customerId: musteri.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        items: { select: { id: true, quantity: true, price: true } },
      },
    });

    if (!siparis) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    const uygunluk = iadeUygunlugu(siparis);
    if (!uygunluk.uygun) {
      return NextResponse.json({ error: uygunluk.sebep }, { status: 400 });
    }

    // Aynı sipariş için sürmekte olan bir talep varsa ikincisi açılmasın.
    const acikTalep = await prisma.return.findFirst({
      where: {
        orderId: siparis.id,
        status: { in: ['TALEP', 'ONAYLANDI', 'URUN_ULASTI'] },
      },
      select: { returnNumber: true },
    });

    if (acikTalep) {
      return NextResponse.json(
        { error: `Bu sipariş için sürmekte olan bir iade talebiniz var (${acikTalep.returnNumber}).` },
        { status: 409 }
      );
    }

    /**
     * Kalemler: verilmemişse siparişin tamamı iade ediliyor sayılıyor.
     * Verilmişse yalnızca o siparişe ait kalemler ve sipariş adedini
     * aşmayan miktarlar kabul ediliyor.
     */
    const siparisKalemleri = new Map(siparis.items.map((k) => [k.id, k]));
    const istenen =
      Array.isArray(govde.kalemler) && govde.kalemler.length > 0
        ? govde.kalemler
        : siparis.items.map((k) => ({ orderItemId: k.id, adet: k.quantity }));

    const yazilacak: { orderItemId: string; quantity: number }[] = [];
    let tahminiTutar = 0;

    for (const kalem of istenen) {
      const siparisKalemi = siparisKalemleri.get(kalem?.orderItemId);
      if (!siparisKalemi) {
        return NextResponse.json(
          { error: 'İade edilmek istenen ürün bu siparişte yok' },
          { status: 400 }
        );
      }
      const adet = Math.floor(Number(kalem.adet));
      if (!Number.isFinite(adet) || adet < 1 || adet > siparisKalemi.quantity) {
        return NextResponse.json(
          { error: 'İade adedi sipariş adedinden fazla olamaz' },
          { status: 400 }
        );
      }
      yazilacak.push({ orderItemId: siparisKalemi.id, quantity: adet });
      tahminiTutar += siparisKalemi.price * adet;
    }

    /**
     * İade numarası, sipariş numarasıyla aynı kalıpta üretiliyor
     * ("IA-2026-001") ve çakışma durumunda birkaç kez deneniyor -
     * sipariş ucundaki ile aynı yaklaşım.
     */
    const yil = new Date().getFullYear();
    let olusan: { returnNumber: string } | null = null;

    for (let deneme = 0; deneme < 5; deneme++) {
      const sonuncu = await prisma.return.findFirst({
        where: { returnNumber: { startsWith: `IA-${yil}-` } },
        orderBy: { createdAt: 'desc' },
        select: { returnNumber: true },
      });

      const eslesme = sonuncu?.returnNumber?.match(/IA-\d+-(\d+)/);
      const sonraki = (eslesme ? parseInt(eslesme[1], 10) : 0) + 1 + deneme;
      const returnNumber = `IA-${yil}-${String(sonraki).padStart(3, '0')}`;

      try {
        olusan = await prisma.return.create({
          data: {
            returnNumber,
            orderId: siparis.id,
            customerId: musteri.id,
            reason,
            note: String(govde.note ?? '').trim() || null,
            // Tutar yönetici kararında kesinleşiyor; bu yalnızca tahmin.
            refundAmount: Math.round(tahminiTutar * 100) / 100,
            items: { create: yazilacak },
          },
          select: { returnNumber: true },
        });
        break;
      } catch (e) {
        if ((e as { code?: string })?.code === 'P2002' && deneme < 4) continue;
        throw e;
      }
    }

    if (!olusan) {
      return NextResponse.json(
        { error: 'İade numarası üretilemedi, lütfen tekrar deneyin' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        returnNumber: olusan.returnNumber,
        mesaj: `İade talebiniz ${olusan.returnNumber} numarasıyla alındı. İncelenip size dönüş yapılacak.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('İade talebi oluşturulamadı:', error);
    return NextResponse.json({ error: 'İade talebi oluşturulamadı' }, { status: 500 });
  }
}

/** Müşteri kendi talebini iptal eder. Başka durum değişikliği yönetici işi. */
export async function PATCH(req: NextRequest) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const { returnId } = await req.json();
    if (!returnId) {
      return NextResponse.json({ error: 'İade talebi belirtilmedi' }, { status: 400 });
    }

    const talep = await prisma.return.findFirst({
      where: { id: returnId, customerId: musteri.id },
      select: { id: true, status: true },
    });

    if (!talep) {
      return NextResponse.json({ error: 'İade talebi bulunamadı' }, { status: 404 });
    }
    if (!MUSTERI_IPTAL_EDEBILIR.includes(talep.status)) {
      return NextResponse.json(
        { error: 'Bu aşamadaki bir talebi iptal edemezsiniz. Lütfen bizimle iletişime geçin.' },
        { status: 400 }
      );
    }

    await prisma.return.update({ where: { id: talep.id }, data: { status: 'IPTAL' } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('İade talebi iptal edilemedi:', error);
    return NextResponse.json({ error: 'İşlem tamamlanamadı' }, { status: 500 });
  }
}
