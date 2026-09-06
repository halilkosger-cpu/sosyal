import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/** Yöneticinin geçerli olarak atayabileceği durumlar. */
const GECERLI_DURUMLAR = ['TALEP', 'ONAYLANDI', 'REDDEDILDI', 'URUN_ULASTI', 'TAMAMLANDI', 'IPTAL'];

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const durum = req.nextUrl.searchParams.get('durum');

    const iadeler = await prisma.return.findMany({
      where: durum && GECERLI_DURUMLAR.includes(durum) ? { status: durum as never } : {},
      // Bekleyen talepler önce: kuyruk sırayla işlensin.
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        returnNumber: true,
        status: true,
        reason: true,
        note: true,
        adminNote: true,
        refundAmount: true,
        refundedAt: true,
        createdAt: true,
        order: {
          select: { orderNumber: true, totalAmount: true, shippingAddress: true, notes: true },
        },
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            quantity: true,
            orderItem: { select: { price: true, product: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json({ iadeler });
  } catch (error) {
    console.error('İadeler okunamadı:', error);
    return NextResponse.json({ error: 'İade talepleri getirilemedi' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { returnId, status, adminNote, refundAmount } = await req.json();

    if (!returnId || !GECERLI_DURUMLAR.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const mevcut = await prisma.return.findUnique({
      where: { id: returnId },
      select: { id: true, returnNumber: true, status: true },
    });

    if (!mevcut) {
      return NextResponse.json({ error: 'İade talebi bulunamadı' }, { status: 404 });
    }

    const tutar = refundAmount === undefined || refundAmount === null ? undefined : Number(refundAmount);
    if (tutar !== undefined && (!Number.isFinite(tutar) || tutar < 0)) {
      return NextResponse.json({ error: 'Geçersiz iade tutarı' }, { status: 400 });
    }

    const guncel = await prisma.return.update({
      where: { id: returnId },
      data: {
        status,
        ...(adminNote !== undefined ? { adminNote: String(adminNote).trim() || null } : {}),
        ...(tutar !== undefined ? { refundAmount: Math.round(tutar * 100) / 100 } : {}),
        // Para iadesi damgası yalnızca TAMAMLANDI'ya geçerken bir kez.
        ...(status === 'TAMAMLANDI' ? { refundedAt: new Date() } : {}),
      },
      select: { id: true, returnNumber: true, status: true },
    });

    /**
     * İade kararları paraya dokunuyor; kimin ne zaman ne yaptığı iz bırakmalı.
     *
     * UYARI: lib/audit-log.ts kaydı BELLEKTE tutuyor (modül düzeyinde bir
     * dizi). Uygulama sunucusuz çalışıyor, her istek ayrı bir örnekte
     * işlenebiliyor ve örnek kapanınca kayıt kayboluyor - yani bu iz
     * güvenilir değil. Aynı sorun hız sayacında yaşanmış ve sayaç
     * veritabanına taşınmıştı (bkz. IstekSayaci); denetim günlüğü de
     * taşınmalı. Para iadesi kararları için ayrıca önemli.
     */
    logAudit(
      'IADE_DURUM',
      'admin',
      'success',
      `${guncel.returnNumber}: ${mevcut.status} -> ${guncel.status}`
    );

    return NextResponse.json({ ok: true, iade: guncel });
  } catch (error) {
    console.error('İade güncellenemedi:', error);
    return NextResponse.json({ error: 'İade talebi güncellenemedi' }, { status: 500 });
  }
}
