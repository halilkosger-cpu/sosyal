import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';
import { adresiDogrula } from '@/lib/adres-dogrulama';

export const dynamic = 'force-dynamic';

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

/**
 * Adresin bu musteriye ait oldugunu dogrular.
 *
 * Kimlik URL'den geliyor; sahiplik kontrolu yapilmasaydi baska bir
 * musterinin adres kimligini yazan biri onun adresini okuyup
 * degistirebilirdi. Bulunamadi ile "senin degil" ayni yanit: var olup
 * olmadigi da disariya sizmasin.
 */
async function sahipMi(adresId: string, customerId: string): Promise<boolean> {
  const adres = await prisma.address.findFirst({
    where: { id: adresId, customerId },
    select: { id: true },
  });
  return Boolean(adres);
}

const bulunamadi = () => NextResponse.json({ error: 'Adres bulunamadı' }, { status: 404 });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    if (!(await sahipMi(params.id, musteri.id))) return bulunamadi();

    const govde = await req.json();

    /**
     * Yalnizca varsayilan isaretini degistiren istek.
     *
     * Adres kartindaki "varsayilan yap" dugmesi butun adres alanlarini
     * gondermek zorunda kalmasin diye ayri ele aliniyor.
     */
    const yalnizVarsayilan =
      govde?.addressLine === undefined &&
      (govde?.isDefaultShipping !== undefined || govde?.isDefaultBilling !== undefined);

    const guncel = await prisma.$transaction(async (tx) => {
      if (govde?.isDefaultShipping === true) {
        await tx.address.updateMany({
          where: { customerId: musteri.id },
          data: { isDefaultShipping: false },
        });
      }
      if (govde?.isDefaultBilling === true) {
        await tx.address.updateMany({
          where: { customerId: musteri.id },
          data: { isDefaultBilling: false },
        });
      }

      if (yalnizVarsayilan) {
        return tx.address.update({
          where: { id: params.id },
          data: {
            ...(govde.isDefaultShipping !== undefined
              ? { isDefaultShipping: govde.isDefaultShipping === true }
              : {}),
            ...(govde.isDefaultBilling !== undefined
              ? { isDefaultBilling: govde.isDefaultBilling === true }
              : {}),
          },
          select: SECIM,
        });
      }

      const { hata, adres } = adresiDogrula(govde ?? {});
      if (hata || !adres) throw new Error(hata ?? 'Adres bilgileri eksik');

      return tx.address.update({
        where: { id: params.id },
        data: {
          ...adres,
          ...(govde.isDefaultShipping !== undefined
            ? { isDefaultShipping: govde.isDefaultShipping === true }
            : {}),
          ...(govde.isDefaultBilling !== undefined
            ? { isDefaultBilling: govde.isDefaultBilling === true }
            : {}),
        },
        select: SECIM,
      });
    });

    return NextResponse.json({ adres: guncel });
  } catch (error) {
    // Dogrulama hatalari islem icinden firlatiliyor; musteriye gosterilecek
    // metni tasiyorlar.
    const mesaj = error instanceof Error ? error.message : 'Adres güncellenemedi';
    const dogrulamaHatasi = mesaj !== 'Adres güncellenemedi' && mesaj.length < 120;

    if (!dogrulamaHatasi) console.error('Adres güncellenemedi:', error);
    return NextResponse.json(
      { error: dogrulamaHatasi ? mesaj : 'Adres güncellenemedi' },
      { status: dogrulamaHatasi ? 400 : 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const adres = await prisma.address.findFirst({
      where: { id: params.id, customerId: musteri.id },
      select: { id: true, isDefaultShipping: true, isDefaultBilling: true },
    });
    if (!adres) return bulunamadi();

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: adres.id } });

      /**
       * Silinen adres varsayilansa, kalanlardan en eskisi varsayilan
       * oluyor. Aksi halde musterinin adresleri var ama hicbiri varsayilan
       * degil - odeme sayfasi bos secimle acilirdi.
       */
      if (adres.isDefaultShipping || adres.isDefaultBilling) {
        const kalan = await tx.address.findFirst({
          where: { customerId: musteri.id },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        if (kalan) {
          await tx.address.update({
            where: { id: kalan.id },
            data: {
              ...(adres.isDefaultShipping ? { isDefaultShipping: true } : {}),
              ...(adres.isDefaultBilling ? { isDefaultBilling: true } : {}),
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Adres silinemedi:', error);
    return NextResponse.json({ error: 'Adres silinemedi' }, { status: 500 });
  }
}
