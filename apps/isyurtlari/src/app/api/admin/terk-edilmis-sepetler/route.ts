import { NextRequest, NextResponse } from 'next/server';
import { guvenliHataMesaji } from '@/lib/kullanici-hatasi';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { sepetHatirlatmaEpostasiGonder, epostaTabanAdresi } from '@/lib/musteri-eposta';
import { iletiRetBaglantisi } from '@/lib/ileti-izni';
import { terkEdilmisSepetleriHatirlat } from '@/lib/terk-edilmis-sepet';
import { terkEdilmisSepetleriListele } from '@/lib/terk-edilmis-sepet-listesi';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  try {
    return NextResponse.json(await terkEdilmisSepetleriListele());
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
