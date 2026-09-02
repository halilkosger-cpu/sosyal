import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';
import { adminGuard } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

/**
 * Bir ürün stoğa girdiğinde, o ürünü bekleyen müşterilere bildirim gönderir.
 * Admin panelinden elle tetiklenir — otomatik çalışmaz.
 */
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;


  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: 'Servis kullanılamıyor' }, { status: 503 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Ürün bilgisi eksik' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true, quantity: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    if (product.quantity <= 0) {
      return NextResponse.json(
        { error: 'Ürün stokta değil. Bildirim göndermek için önce stok girin.' },
        { status: 409 }
      );
    }

    const waiting = await prisma.preOrder.findMany({
      where: { productId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });

    if (waiting.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'Bekleyen ön talep yok' });
    }

    const productUrl = `https://www.isyurtlari.com.tr/urun/${product.slug}`;
    const sentIds: string[] = [];
    const failed: string[] = [];

    // Resend'in toplu gönderim ucu çağrı başına en fazla 100 e-posta kabul eder.
    // Tek tek göndermek hem istek limitine takılır hem de çok sayıda bekleyen
    // müşteride fonksiyon zaman aşımına yol açar.
    const BATCH_SIZE = 100;

    for (let i = 0; i < waiting.length; i += BATCH_SIZE) {
      const chunk = waiting.slice(i, i + BATCH_SIZE);

      try {
        await resend.batch.send(
          chunk.map((pre) => ({
            from: 'info@isyurtlari.com.tr',
            to: pre.email,
            subject: `Stokta! ${product.name}`,
            html: emailTemplates.preOrderBackInStock({
              name: pre.name,
              productName: product.name,
              quantity: pre.quantity,
              productUrl,
            }),
          }))
        );
        sentIds.push(...chunk.map((pre) => pre.id));
      } catch (mailError) {
        console.error(
          `Stok bildirimi grubu gönderilemedi (${chunk.length} alıcı):`,
          mailError
        );
        failed.push(...chunk.map((pre) => pre.email));
      }
    }

    // Yalnızca gerçekten gönderilenleri NOTIFIED yap; kalanlar WAITING kalsın ki tekrar denenebilsin
    if (sentIds.length > 0) {
      await prisma.preOrder.updateMany({
        where: { id: { in: sentIds } },
        data: { status: 'NOTIFIED', notifiedAt: new Date() },
      });
    }

    logAudit(
      'PREORDER_NOTIFY',
      'admin',
      failed.length === 0 ? 'success' : 'failed',
      `${product.name}: ${sentIds.length} gönderildi, ${failed.length} başarısız`,
      ip
    );

    return NextResponse.json({
      success: true,
      sent: sentIds.length,
      failed: failed.length,
      failedEmails: failed,
    });
  } catch (error) {
    console.error('Ön talep bildirim hatası:', error);
    return NextResponse.json({ error: 'Bildirim gönderilemedi' }, { status: 500 });
  }
}
