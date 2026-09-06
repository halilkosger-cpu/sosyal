import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { oturumdakiMusteri } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Ürün yorumları.
 *
 * ─── DÜZELTİLEN GÜVENLİK AÇIĞI ────────────────────────────────────────
 *
 * Bu uç yorumu yazan kişinin kimliğini İSTEK GÖVDESİNDEN alıyordu:
 *
 *     const { userId, rating, title, text } = await req.json();
 *
 * Yani isteği elle düzenleyen biri "userId" alanına başka birinin kimliğini
 * yazıp onun adına yorum bırakabiliyordu. Hemen altındaki "bu ürünü satın
 * almış mı" kontrolü de aynı sahte kimlikle yapıldığı için koruma
 * sağlamıyordu: sipariş vermiş herhangi bir kimliği yazmak yetiyordu.
 *
 * Kimlik artık yalnızca oturumdan geliyor; gövdedeki hiçbir kimlik alanı
 * okunmuyor.
 *
 * ─── DÜZELTİLEN BAĞLANTI SIZINTISI ────────────────────────────────────
 *
 * Dosya kendi PrismaClient'ını kuruyordu (`new PrismaClient()`). Uygulama
 * sunucusuz çalışıyor: her örnek ayrı bir bağlantı havuzu açıyor ve
 * veritabanının bağlantı sınırı hızla doluyor. Paylaşılan istemci
 * kullanılıyor artık - kod tabanının geri kalanı da öyle yapıyor.
 */

/** Yorum metni sınırları. */
const ASGARI_METIN = 10;
const AZAMI_METIN = 2000;

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const urun = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!urun) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const yorumlar = await prisma.review.findMany({
      where: { productId: urun.id, approved: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        helpfulCount: true,
        createdAt: true,
        orderItemId: true,
        customer: { select: { name: true } },
        user: { select: { name: true, avatar: true } },
      },
    });

    /**
     * Yorumcunun tam adı gösterilmiyor.
     *
     * Yorumlar herkese açık; ad soyadı olduğu gibi yayınlamak müşterinin
     * ne satın aldığını adıyla birlikte internete açmak demek. Pazaryerleri
     * de baş harfleri gösteriyor.
     */
    return NextResponse.json(
      yorumlar.map((y) => {
        const tamAd = (y.customer?.name || y.user?.name || '').trim();
        return {
          id: y.id,
          rating: y.rating,
          title: y.title,
          text: y.text,
          helpfulCount: y.helpfulCount,
          createdAt: y.createdAt,
          /** Sipariş kalemine bağlıysa "doğrulanmış alışveriş". */
          dogrulanmis: Boolean(y.orderItemId),
          yazar: kisaltilmisAd(tamAd),
          user: { name: kisaltilmisAd(tamAd), avatar: y.user?.avatar ?? null },
        };
      })
    );
  } catch (error) {
    console.error('Yorumlar okunamadı:', error);
    return NextResponse.json({ error: 'Yorumlar getirilemedi' }, { status: 500 });
  }
}

/** "Özlem Gürbüz" -> "Özlem G." */
function kisaltilmisAd(tamAd: string): string {
  const parcalar = tamAd.split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return 'Müşteri';
  if (parcalar.length === 1) return parcalar[0];
  const son = parcalar[parcalar.length - 1];
  return `${parcalar.slice(0, -1).join(' ')} ${son.charAt(0).toLocaleUpperCase('tr-TR')}.`;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const sinir = await hizSiniriGuard(req, 'yorum', 10, 3600);
  if (sinir) return sinir;

  try {
    // Kimlik yalnızca oturumdan. Gövdedeki hiçbir kimlik alanı okunmuyor.
    const musteri = await oturumdakiMusteri();
    if (!musteri) {
      return NextResponse.json(
        { error: 'Yorum yazmak için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const govde = await req.json();
    const rating = Math.floor(Number(govde?.rating));
    const text = String(govde?.text ?? '').trim();
    const title = String(govde?.title ?? '').trim() || null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Puan 1 ile 5 arasında olmalı' }, { status: 400 });
    }
    if (text.length < ASGARI_METIN) {
      return NextResponse.json(
        { error: `Yorum en az ${ASGARI_METIN} karakter olmalı` },
        { status: 400 }
      );
    }
    if (text.length > AZAMI_METIN) {
      return NextResponse.json(
        { error: `Yorum en fazla ${AZAMI_METIN} karakter olabilir` },
        { status: 400 }
      );
    }

    const urun = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!urun) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    /**
     * Satın alma kontrolü: yorum yazan, bu ürünü kendi hesabıyla sipariş
     * etmiş olmalı. İptal edilmiş siparişler saymıyor.
     */
    const siparisKalemi = await prisma.orderItem.findFirst({
      where: {
        productId: urun.id,
        order: { customerId: musteri.id, status: { not: 'CANCELLED' } },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!siparisKalemi) {
      return NextResponse.json(
        { error: 'Yalnızca satın aldığınız ürünlere yorum yazabilirsiniz' },
        { status: 403 }
      );
    }

    const mevcut = await prisma.review.findFirst({
      where: { productId: urun.id, customerId: musteri.id },
      select: { id: true },
    });

    if (mevcut) {
      return NextResponse.json(
        { error: 'Bu ürüne zaten yorum yazmışsınız' },
        { status: 409 }
      );
    }

    await prisma.review.create({
      data: {
        productId: urun.id,
        customerId: musteri.id,
        orderItemId: siparisKalemi.id,
        rating,
        title,
        text,
        // Onay bekliyor: yorumlar herkese açık ve moderasyondan geçmeli.
        approved: false,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        mesaj: 'Yorumunuz alındı. İncelendikten sonra yayınlanacak.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Yorum eklenemedi:', error);
    return NextResponse.json({ error: 'Yorum kaydedilemedi' }, { status: 500 });
  }
}
