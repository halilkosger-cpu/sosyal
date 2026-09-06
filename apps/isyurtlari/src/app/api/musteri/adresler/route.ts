import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';
import { adresiDogrula } from '@/lib/adres-dogrulama';

export const dynamic = 'force-dynamic';

/**
 * Musterinin adres defteri.
 *
 * Onceden siparis adresi Order.shippingAddress alaninda tek parca duz metin
 * olarak duruyordu: ikinci kez alisveris yapan musteri adresini bastan
 * yaziyordu ve il/ilce ayristirilamadigi icin kargo entegrasyonu da
 * yapilamiyordu.
 */

/** Bir musterinin tutabilecegi azami adres sayisi. */
const AZAMI_ADRES = 20;

const SECIM = {
  id: true,
  title: true,
  fullName: true,
  phone: true,
  city: true,
  district: true,
  neighborhood: true,
  addressLine: true,
  postalCode: true,
  isDefaultShipping: true,
  isDefaultBilling: true,
  createdAt: true,
} as const;

export async function GET() {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const adresler = await prisma.address.findMany({
      where: { customerId: musteri.id },
      select: SECIM,
      // Varsayilan teslimat adresi basta dursun: odeme sayfasi ilk siradakini
      // secili getiriyor.
      orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ adresler });
  } catch (error) {
    console.error('Adresler okunamadı:', error);
    return NextResponse.json({ error: 'Adresler getirilemedi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const govde = await req.json();
    const { hata, adres } = adresiDogrula(govde ?? {});
    if (hata || !adres) {
      return NextResponse.json({ error: hata ?? 'Adres bilgileri eksik' }, { status: 400 });
    }

    const mevcutSayi = await prisma.address.count({ where: { customerId: musteri.id } });
    if (mevcutSayi >= AZAMI_ADRES) {
      return NextResponse.json(
        { error: `En fazla ${AZAMI_ADRES} adres kaydedebilirsiniz. Kullanmadığınız bir adresi silin.` },
        { status: 400 }
      );
    }

    /**
     * Ilk adres kendiliginden varsayilan oluyor.
     *
     * Aksi halde musteri tek adresi olmasina ragmen odeme sayfasinda
     * "varsayilan adres yok" durumuyla karsilasirdi.
     */
    const ilkAdres = mevcutSayi === 0;
    const teslimatVarsayilani = ilkAdres || govde?.isDefaultShipping === true;
    const faturaVarsayilani = ilkAdres || govde?.isDefaultBilling === true;

    const yeni = await prisma.$transaction(async (tx) => {
      if (teslimatVarsayilani) {
        await tx.address.updateMany({
          where: { customerId: musteri.id },
          data: { isDefaultShipping: false },
        });
      }
      if (faturaVarsayilani) {
        await tx.address.updateMany({
          where: { customerId: musteri.id },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.create({
        data: {
          customerId: musteri.id,
          ...adres,
          isDefaultShipping: teslimatVarsayilani,
          isDefaultBilling: faturaVarsayilani,
        },
        select: SECIM,
      });
    });

    return NextResponse.json({ adres: yeni }, { status: 201 });
  } catch (error) {
    console.error('Adres eklenemedi:', error);
    return NextResponse.json({ error: 'Adres kaydedilemedi' }, { status: 500 });
  }
}
