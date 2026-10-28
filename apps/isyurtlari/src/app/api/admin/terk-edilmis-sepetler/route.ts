import { NextRequest, NextResponse } from 'next/server';
import { guvenliHataMesaji } from '@/lib/kullanici-hatasi';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { sepetHatirlatmaEpostasiGonder, epostaTabanAdresi } from '@/lib/musteri-eposta';
import { iletiRetBaglantisi } from '@/lib/ileti-izni';
import { terkEdilmisSepetleriHatirlat } from '@/lib/terk-edilmis-sepet';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  try {
    const sepetler = await prisma.cart.findMany({
      where: {
        items: { some: {} },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            iletiIzniAt: true,
            iletiRetAt: true,
            createdAt: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                slug: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    const simdi = Date.now();
    let toplamTerk = 0;
    let potansiyelCiro = 0;
    let hatirlatilanAdet = 0;
    let kurtarilanAdet = 0;
    let kurtarilanCiro = 0;

    const formatliSepetler = await Promise.all(
      sepetler.map(async (sepet) => {
        const kalemler = sepet.items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          fiyat: item.product.price,
          adet: item.quantity,
          toplam: item.product.price * item.quantity,
          imageUrl: item.product.imageUrl,
          slug: item.product.slug,
          stok: item.product.quantity,
        }));

        const sepetTutari = kalemler.reduce((acc, k) => acc + k.toplam, 0);

        // Sepetten sonra sipariş verilmiş mi?
        let sonrakiSiparis: { id: string; orderNumber: string; totalAmount: number; createdAt: Date } | null = null;
        if (sepet.customerId) {
          const siparis = await prisma.order.findFirst({
            where: {
              customerId: sepet.customerId,
              createdAt: { gte: sepet.updatedAt },
              status: { not: 'CANCELLED' },
            },
            select: { id: true, orderNumber: true, totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          });
          sonrakiSiparis = siparis;
        }

        const gecenSureDk = Math.round((simdi - new Date(sepet.updatedAt).getTime()) / 60000);

        // İletişim izni durumu
        const musteri = sepet.customer;
        const izinli = Boolean(
          musteri?.iletiIzniAt &&
          (!musteri.iletiRetAt || musteri.iletiRetAt < musteri.iletiIzniAt)
        );

        // Durum belirleme
        let durum: 'DONUSTU' | 'HATIRLATILDI' | 'TERK_EDILDI' | 'AKTIF';
        if (sonrakiSiparis) {
          durum = 'DONUSTU';
          kurtarilanAdet += 1;
          kurtarilanCiro += sonrakiSiparis.totalAmount || sepetTutari;
        } else if (sepet.hatirlatmaGonderildiAt && sepet.hatirlatmaGonderildiAt >= sepet.updatedAt) {
          durum = 'HATIRLATILDI';
          hatirlatilanAdet += 1;
          toplamTerk += 1;
          potansiyelCiro += sepetTutari;
        } else if (gecenSureDk < 30) {
          durum = 'AKTIF';
        } else {
          durum = 'TERK_EDILDI';
          toplamTerk += 1;
          potansiyelCiro += sepetTutari;
        }

        return {
          id: sepet.id,
          customerId: sepet.customerId,
          musteri: musteri
            ? {
                id: musteri.id,
                name: musteri.name,
                email: musteri.email,
                phone: musteri.phone,
                izinli,
                emailVerified: Boolean(musteri.emailVerified),
              }
            : null,
          kalemler,
          toplamTutar: sepetTutari,
          kalemSayisi: kalemler.reduce((acc, k) => acc + k.adet, 0),
          durum,
          gecenSureDk,
          updatedAt: sepet.updatedAt,
          createdAt: sepet.createdAt,
          hatirlatmaGonderildiAt: sepet.hatirlatmaGonderildiAt,
          sonrakiSiparis,
        };
      })
    );

    const toplamIncelenen = formatliSepetler.length;
    const donusumOrani = toplamIncelenen > 0 ? Math.round((kurtarilanAdet / (toplamTerk + kurtarilanAdet || 1)) * 100) : 0;

    return NextResponse.json({
      sepetler: formatliSepetler,
      ozet: {
        toplamIncelenen,
        toplamTerk,
        potansiyelCiro: Math.round(potansiyelCiro),
        hatirlatilanAdet,
        kurtarilanAdet,
        kurtarilanCiro: Math.round(kurtarilanCiro),
        donusumOrani,
      },
    });
  } catch (error: any) {
    console.error('Terk edilmiş sepetler listelenemedi:', error);
    return NextResponse.json({ error: guvenliHataMesaji(error, 'Veriler alınamadı') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  try {
    const body = await req.json();
    const { action, cartId } = body;

    const tabanAdresi = epostaTabanAdresi(req);

    if (action === 'tekil_hatirlat' && cartId) {
      const sepet = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { name: true, price: true } },
            },
          },
        },
      });

      if (!sepet || !sepet.customer) {
        return NextResponse.json({ error: 'Müşteri sepeti bulunamadı.' }, { status: 404 });
      }

      const musteri = sepet.customer;
      const urunAdlari = sepet.items.map((i) => i.product.name);
      const sepetBaglantisi = `${tabanAdresi}/sepet`;
      const retBaglantisi = iletiRetBaglantisi(musteri.id, musteri.email);

      const basarili = await sepetHatirlatmaEpostasiGonder(
        musteri.email,
        musteri.name,
        urunAdlari,
        sepetBaglantisi,
        retBaglantisi
      );

      if (basarili) {
        await prisma.cart.update({
          where: { id: cartId },
          data: { hatirlatmaGonderildiAt: new Date() },
        });

        return NextResponse.json({
          ok: true,
          message: `${musteri.email} adresine sepet hatırlatma e-postası başarıyla gönderildi.`,
        });
      } else {
        return NextResponse.json({ error: 'E-posta servisi iletilemedi.' }, { status: 500 });
      }
    }

    if (action === 'toplu_calistir') {
      const sonuc = await terkEdilmisSepetleriHatirlat(tabanAdresi, false);
      return NextResponse.json({ ok: true, sonuc });
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    console.error('İşlem başarısız:', error);
    return NextResponse.json({ error: guvenliHataMesaji(error, 'İşlem gerçekleştirilemedi.') }, { status: 500 });
  }
}
