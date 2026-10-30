import { prisma } from '@isyurtlari/database';

/** Admin listesi ve Excel disa aktarimi ayni durum hesabini kullansin diye ortak. */
export async function terkEdilmisSepetleriListele(adet = 200) {
  const sepetler = await prisma.cart.findMany({
    where: {
      items: { some: {} },
    },
    orderBy: { updatedAt: 'desc' },
    take: adet,
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

  return {
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
  };
}
