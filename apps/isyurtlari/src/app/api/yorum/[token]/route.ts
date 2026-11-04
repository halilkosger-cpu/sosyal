import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { yorumBaglantisiniCoz } from '@/lib/yorum-baglantisi';
import { kisaltilmisAd, notlardakiAd, yorumGovdesiniDogrula } from '@/lib/yorum-yardimcilari';
import { YORUM_SONRASI_TESEKKUR } from '@/lib/yorum-mesajlari';

export const dynamic = 'force-dynamic';

/**
 * Misafir yorum bağlantısıyla yorum.
 *
 * Kimlik jetondan gelir: imzalı jeton bir sipariş kalemini taşır, yorumun ürünü
 * ve "doğrulanmış alışveriş" bağı o kalemden türetilir. Gövdedeki hiçbir kimlik
 * alanı okunmaz. Kalem başına en fazla bir yorum yazılabilir; bağlantı bir kez
 * kullanılınca ikinci yorum reddedilir.
 */

async function kalemiGetir(orderItemId: string) {
  return prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      productId: true,
      product: { select: { name: true, slug: true, imageUrl: true } },
      order: { select: { status: true, notes: true, customerId: true } },
    },
  });
}

export async function GET(_req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const cozulen = yorumBaglantisiniCoz(token);
  if (!cozulen) {
    return NextResponse.json({ error: 'Bu bağlantı geçersiz ya da süresi dolmuş.' }, { status: 410 });
  }

  try {
    const kalem = await kalemiGetir(cozulen.orderItemId);
    if (!kalem) return NextResponse.json({ error: 'Bu bağlantı geçersiz.' }, { status: 410 });

    const mevcut = await prisma.review.findFirst({ where: { orderItemId: kalem.id }, select: { id: true } });
    return NextResponse.json({
      urun: { name: kalem.product.name, slug: kalem.product.slug, imageUrl: kalem.product.imageUrl },
      yorumlandi: Boolean(mevcut),
    });
  } catch (error) {
    console.error('Yorum bağlantısı okunamadı:', error);
    return NextResponse.json({ error: 'Bağlantı okunamadı' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const sinir = await hizSiniriGuard(req, 'yorum-misafir', 10, 3600);
  if (sinir) return sinir;

  const { token } = await props.params;
  const cozulen = yorumBaglantisiniCoz(token);
  if (!cozulen) {
    return NextResponse.json({ error: 'Bu bağlantı geçersiz ya da süresi dolmuş.' }, { status: 410 });
  }

  try {
    const dogrulama = yorumGovdesiniDogrula(await req.json().catch(() => null));
    if (!dogrulama.gecerli) return NextResponse.json({ error: dogrulama.hata }, { status: 400 });

    const kalem = await kalemiGetir(cozulen.orderItemId);
    if (!kalem) return NextResponse.json({ error: 'Bu bağlantı geçersiz.' }, { status: 410 });

    // Bağlantı üretildikten sonra sipariş iptal/iade edilmiş olabilir.
    if (kalem.order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Bu sipariş için yorum yazılamıyor.' }, { status: 409 });
    }

    const mevcut = await prisma.review.findFirst({ where: { orderItemId: kalem.id }, select: { id: true } });
    if (mevcut) {
      return NextResponse.json({ error: 'Bu ürün için zaten yorum yazılmış. Teşekkür ederiz!' }, { status: 409 });
    }

    const misafir = !kalem.order.customerId;
    try {
      await prisma.review.create({
        data: {
          productId: kalem.productId,
          customerId: kalem.order.customerId,
          orderItemId: kalem.id,
          misafirAd: misafir ? kisaltilmisAd(notlardakiAd(kalem.order.notes)) : null,
          rating: dogrulama.rating,
          title: dogrulama.title,
          text: dogrulama.text,
          // Onay bekliyor: yorumlar herkese açık ve moderasyondan geçmeli.
          approved: false,
        },
      });
    } catch (e) {
      // Kayıtlı müşteri bu ürüne başka bir siparişinden zaten yorum yazmış (benzersiz kısıt).
      if ((e as { code?: string })?.code === 'P2002') {
        return NextResponse.json({ error: 'Bu ürüne zaten yorum yazmışsınız.' }, { status: 409 });
      }
      throw e;
    }

    // Yorum onay bekliyor: ürün sayfası, yönetici onaylayınca (admin ucu) yenilenir.
    return NextResponse.json({ ok: true, mesaj: YORUM_SONRASI_TESEKKUR }, { status: 201 });
  } catch (error) {
    console.error('Misafir yorumu kaydedilemedi:', error);
    return NextResponse.json({ error: 'Yorum kaydedilemedi' }, { status: 500 });
  }
}
