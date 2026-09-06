import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Musterinin sunucudaki sepeti.
 *
 * ─── CALISMA BICIMI ───────────────────────────────────────────────────
 *
 * Sepetin calisan kopyasi tarayicida kaliyor (lib/cart.ts, localStorage);
 * burasi onun aynasi. Sebep: sepete ekleme sitede bes ayri yerden yapiliyor
 * ve hepsi es zamansiz olmayan bir fonksiyondan geciyor. Sepeti tamamen
 * sunucuya tasimak butun o cagri zincirini asenkron hale getirmeyi
 * gerektirirdi; kazanci ise ayni: giris yapan musteri sepetini baska
 * cihazda bulur.
 *
 * Bu yuzden uc yalnizca iki islem tanir: oku (GET) ve tumunu yaz (PUT).
 * Istemci giriste iki tarafi birlestirip sonucu PUT ediyor, sonraki her
 * degisiklikte de gecikmeli olarak yeniden PUT ediyor.
 *
 * ─── FIYAT BURADA TUTULMUYOR ──────────────────────────────────────────
 *
 * Sepette yalnizca urun kimligi ve adet saklaniyor. Fiyat her zaman
 * urunun o anki fiyatindan hesaplaniyor - siparis ucu de oyle yapiyor.
 * Sepete yazilan fiyat saklansaydi, fiyat degistiginde musteri eski
 * tutari gormeye devam ederdi.
 */

/** Sepette en fazla bu kadar farkli urun ve urun basina bu kadar adet. */
const AZAMI_KALEM = 100;
const AZAMI_ADET = 99;

interface Kalem {
  productId: string;
  adet: number;
}

/**
 * Sepeti urun bilgileriyle birlikte dondurur.
 *
 * Yalnizca kimlik ve adet donseydi, istemcinin baska bir cihazda eklenmis
 * urunlerin adini ve fiyatini ogrenmek icin ayrica butun katalogu cekmesi
 * gerekirdi. Kalemler dogrudan lib/cart.ts'teki SepetUrunu bicimine uygun
 * geliyor; istemci birlestirdigi listeyi oldugu gibi kullanabiliyor.
 */
async function sepetiOku(customerId: string) {
  const sepet = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { kdvOrani: true } },
              campaigns: {
                where: {
                  campaign: { active: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
                },
                include: { campaign: true },
              },
            },
          },
        },
      },
    },
  });

  return (sepet?.items ?? []).map((k) => {
    const kampanya = k.product.campaigns[0];
    return {
      id: k.product.id,
      name: k.product.name,
      slug: k.product.slug,
      // Fiyat her zaman urunun o anki fiyatindan geliyor; sepete yazilmiyor.
      price: k.product.price,
      quantity: k.quantity,
      imageUrl: k.product.imageUrl,
      kdvOrani: k.product.category?.kdvOrani ?? null,
      campaign: kampanya
        ? {
            id: kampanya.campaign.id,
            name: kampanya.campaign.name,
            discount: kampanya.discount,
            discountedPrice: Math.round(k.product.price * (1 - kampanya.discount / 100) * 100) / 100,
          }
        : null,
      /** Urunun o anki stogu; istemci tukenmis kalemi isaretleyebilsin. */
      stok: k.product.quantity,
    };
  });
}

export async function GET() {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    return NextResponse.json({ kalemler: await sepetiOku(musteri.id) });
  } catch (error) {
    console.error('Sepet okunamadı:', error);
    return NextResponse.json({ error: 'Sepet okunamadı' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const govde: { kalemler?: Kalem[] } = await req.json();
    const gelen = Array.isArray(govde.kalemler) ? govde.kalemler.slice(0, AZAMI_KALEM) : [];

    // Ayni urun birden fazla kez gelirse en buyuk adet gecerli olsun.
    const adetler = new Map<string, number>();
    for (const kalem of gelen) {
      const id = typeof kalem?.productId === 'string' ? kalem.productId : null;
      const adet = Math.floor(Number(kalem?.adet));
      if (!id || !Number.isFinite(adet) || adet < 1) continue;
      adetler.set(id, Math.min(AZAMI_ADET, Math.max(adetler.get(id) ?? 0, adet)));
    }

    /**
     * Var olmayan urunler sessizce atiliyor, istek reddedilmiyor.
     *
     * Sepet aylarca tarayicida bekleyebiliyor; bu arada bir urun silinmis
     * olabilir. Butun senkronu hataya dusurmek, musterinin gecerli
     * kalemlerini de kaybettirir.
     */
    const gecerliler =
      adetler.size > 0
        ? await prisma.product.findMany({
            where: { id: { in: [...adetler.keys()] } },
            select: { id: true },
          })
        : [];

    const yazilacak = gecerliler.map((u) => ({ productId: u.id, quantity: adetler.get(u.id)! }));

    // Tek islemde: sepeti bul ya da olustur, kalemleri tamamen degistir.
    await prisma.$transaction(async (tx) => {
      const sepet = await tx.cart.upsert({
        where: { customerId: musteri.id },
        create: { customerId: musteri.id },
        update: {},
        select: { id: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: sepet.id } });

      if (yazilacak.length > 0) {
        await tx.cartItem.createMany({
          data: yazilacak.map((k) => ({ cartId: sepet.id, ...k })),
        });
      }

      await tx.cart.update({ where: { id: sepet.id }, data: { updatedAt: new Date() } });
    });

    // Yazdiktan sonra sepeti urun bilgileriyle geri donuyoruz: istemci
    // yazdigini ayrica okumak zorunda kalmasin.
    return NextResponse.json({ kalemler: await sepetiOku(musteri.id) });
  } catch (error) {
    console.error('Sepet yazılamadı:', error);
    return NextResponse.json({ error: 'Sepet kaydedilemedi' }, { status: 500 });
  }
}
