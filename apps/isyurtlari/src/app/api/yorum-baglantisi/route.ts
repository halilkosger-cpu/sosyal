import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { siparisEpostasiUyuyor } from '@/lib/siparis-eposta';
import { yorumBaglantisiOlustur } from '@/lib/yorum-baglantisi';

export const dynamic = 'force-dynamic';

/**
 * Misafir yorum bağlantısı üretir.
 *
 * Hesapsız (misafir) müşteri, Siparişlerim sayfasında sipariş numarası ve
 * e-postasıyla siparişini sorgular; teslim edilmiş siparişin bir ürününde
 * "Değerlendir"e basınca bu uç o sipariş kalemi için imzalı, süreli bir yorum
 * bağlantısı döndürür. Sahiplik kanıtı /api/siparis-sorgula ile aynıdır:
 * sipariş numarası VE sipariş e-postası.
 */
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'yorum-baglantisi', 20, 3600);
  if (sinir) return sinir;

  try {
    const govde = await req.json();
    const siparisNo = String(govde?.siparisNo ?? '').trim().toUpperCase();
    const email = String(govde?.email ?? '').trim().toLowerCase();
    const orderItemId = String(govde?.orderItemId ?? '').trim();

    if (!siparisNo || !email || !orderItemId) {
      return NextResponse.json({ error: 'Sipariş numarası, e-posta ve ürün gereklidir' }, { status: 400 });
    }

    const siparis = await prisma.order.findUnique({
      where: { orderNumber: siparisNo },
      select: {
        status: true,
        notes: true,
        customer: { select: { email: true } },
        items: { select: { id: true } },
      },
    });

    // Bulunamadı, e-posta uyuşmadı ve ürün bu siparişin değil: aynı yanıt
    // (hangi sipariş numaralarının var olduğu sızmasın).
    const gecerli =
      siparis &&
      siparisEpostasiUyuyor(email, siparis.notes, siparis.customer?.email) &&
      siparis.items.some((k) => k.id === orderItemId);
    if (!siparis || !gecerli) {
      return NextResponse.json({ error: 'Bu bilgilerle bir sipariş bulunamadı' }, { status: 404 });
    }

    if (siparis.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Ürünü teslim aldıktan sonra değerlendirebilirsiniz.' },
        { status: 409 }
      );
    }

    const mevcut = await prisma.review.findFirst({ where: { orderItemId }, select: { id: true } });
    if (mevcut) {
      return NextResponse.json({ error: 'Bu ürün için zaten yorum yazılmış. Teşekkür ederiz!' }, { status: 409 });
    }

    return NextResponse.json({ url: `/yorum/${yorumBaglantisiOlustur(orderItemId)}` });
  } catch (error) {
    console.error('Yorum bağlantısı üretilemedi:', error);
    return NextResponse.json({ error: 'Bağlantı oluşturulamadı' }, { status: 500 });
  }
}
