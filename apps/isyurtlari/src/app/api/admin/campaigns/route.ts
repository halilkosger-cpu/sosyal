import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
/**
 * Paylasilan istemci kullaniliyor.
 *
 * Burada `new PrismaClient()` vardi. Uygulama sunucusuz calisiyor: her modul
 * ornegi kendi baglanti havuzunu aciyor ve Neon'un baglanti siniri hizla
 * doluyor. Ayni duzeltme yorum ve urun uclarinda da yapilmisti.
 */
import { prisma } from '@isyurtlari/database';
import { icerikTazele } from '@/lib/kategoriler';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const campaigns = await prisma.campaign.findMany({
      include: { products: { include: { product: true } } },
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { name, startDate, endDate, products } = await req.json();

    const campaign = await prisma.campaign.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        products: {
          create: products.map((p: { id: string; discount: number }) => ({
            productId: p.id,
            discount: p.discount,
          })),
        },
      },
      include: { products: { include: { product: true } } },
    });

    // Kampanya indirimi ana sayfada ve urun kartlarinda gorunuyor; sayfalar
    // ISR ile saklandigi icin tazelenmezse indirim bes dakikaya kadar
    // gorunmez kalirdi.
    icerikTazele();

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
