import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@isyurtlari/database';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * Ürün yorumları moderasyonu.
 *
 * Müşteri yorumları `approved: false` ile kaydediliyor ve herkese açık
 * listede yalnızca onaylılar görünüyor; bu uç olmadan hiçbir yorum
 * yayınlanamıyordu. Yönetici bekleyenleri onaylar, yayındakini geri çeker
 * ya da siler.
 */

type Durum = 'bekleyen' | 'yayinda' | 'hepsi';

const DURUM_FILTRESI: Record<Durum, { approved?: boolean }> = {
  bekleyen: { approved: false },
  yayinda: { approved: true },
  hepsi: {},
};

/** Yorum değişince ürün sayfası (puan özeti, JSON-LD) önbellekten beklemeden yenilensin. */
async function urunSayfasiniYenile(yorumId: string): Promise<boolean> {
  const yorum = await prisma.review.findUnique({
    where: { id: yorumId },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!yorum) return false;
  if (yorum.product?.slug) revalidatePath(`/urun/${yorum.product.slug}`);
  return true;
}

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const istenen = req.nextUrl.searchParams.get('durum') as Durum | null;
    const durum: Durum = istenen && istenen in DURUM_FILTRESI ? istenen : 'bekleyen';

    const yorumlar = await prisma.review.findMany({
      where: DURUM_FILTRESI[durum],
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        approved: true,
        createdAt: true,
        orderItemId: true,
        product: { select: { name: true, slug: true } },
        customer: { select: { name: true, email: true } },
        misafirAd: true,
      },
    });

    return NextResponse.json({
      yorumlar: yorumlar.map((y) => ({ ...y, dogrulanmis: Boolean(y.orderItemId) })),
    });
  } catch (error) {
    console.error('Yorumlar okunamadı:', error);
    return NextResponse.json({ error: 'Yorumlar getirilemedi' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const govde = await req.json();
    const id = String(govde?.id ?? '');
    const onayli = govde?.onayli;

    if (!id || typeof onayli !== 'boolean') {
      return NextResponse.json({ error: 'id ve onayli (true/false) gereklidir' }, { status: 400 });
    }

    const mevcut = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!mevcut) return NextResponse.json({ error: 'Yorum bulunamadı' }, { status: 404 });

    await prisma.review.update({ where: { id }, data: { approved: onayli } });
    await urunSayfasiniYenile(id);
    await logAudit('YORUM_MODERASYON', adminEpostasi(req) || 'bilinmiyor', 'success', `${id} ${onayli ? 'yayına alındı' : 'yayından kaldırıldı'}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Yorum güncellenemedi:', error);
    return NextResponse.json({ error: 'Yorum güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 });

    // Sayfa yenileme silmeden ÖNCE ürünü bulmalı: silindikten sonra ilişki okunamaz.
    const yorum = await prisma.review.findUnique({
      where: { id },
      select: { id: true, product: { select: { slug: true } } },
    });
    if (!yorum) return NextResponse.json({ error: 'Yorum bulunamadı' }, { status: 404 });

    await prisma.review.delete({ where: { id } });
    if (yorum.product?.slug) revalidatePath(`/urun/${yorum.product.slug}`);
    await logAudit('YORUM_SIL', adminEpostasi(req) || 'bilinmiyor', 'success', `${id} silindi`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Yorum silinemedi:', error);
    return NextResponse.json({ error: 'Yorum silinemedi' }, { status: 500 });
  }
}
