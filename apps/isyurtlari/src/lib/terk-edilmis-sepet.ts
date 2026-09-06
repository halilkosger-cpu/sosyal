import { prisma } from '@isyurtlari/database';
import { sepetHatirlatmaEpostasiGonder } from '@/lib/musteri-eposta';
import { iletiRetBaglantisi } from '@/lib/ileti-izni';

/**
 * Terk edilmiş sepet hatırlatması.
 *
 * ─── KİME GÖNDERİLMEZ ─────────────────────────────────────────────────
 *
 * Buradaki asıl iş göndermek değil, GÖNDERMEMEK. Elemeler sırayla:
 *
 *  1. İzin. Bu bir ticari elektronik ileti; Customer.iletiIzniAt boşsa
 *     gönderilmez. Kayıt sırasında bu onay ayrı ve isteğe bağlı alınıyor -
 *     KVKK onayıyla aynı şey değil, karıştırılmamalı.
 *  2. Doğrulanmamış e-posta. Adresin gerçekten müşteriye ait olduğunu
 *     bilmiyorsak pazarlama e-postası göndermeyiz.
 *  3. Kapalı hesap.
 *  4. Boş sepet.
 *  5. Çok taze sepet. Müşteri hâlâ alışveriş yapıyor olabilir; hemen
 *     e-posta atmak rahatsız edici.
 *  6. Çok eski sepet. İki hafta önce bırakılmış bir sepet için "ürünleriniz
 *     sizi bekliyor" demek sahte bir aciliyet.
 *  7. Zaten hatırlatılmış sepet. Sepete dokunulmadıkça ikinci e-posta yok.
 *  8. Sepetten sonra sipariş vermiş müşteri. Satın almış birine "sepetiniz
 *     duruyor" demek en kötüsü.
 *  9. Satın alınamayacak sepet. İçindeki ürünlerin hepsi tükendiyse ya da
 *     fiyatı girilmemişse müşteriyi çıkmaz sokağa çağırmış oluruz -
 *     üstelik bu sitede ürünlerin çoğu şu an stokta değil.
 */

/** Sepete son dokunuştan bu yana en az bu kadar süre geçmiş olmalı. */
export const EN_AZ_SAAT = 6;
/** Bundan daha eski sepetler için hatırlatma gönderilmiyor. */
export const EN_COK_GUN = 7;
/** Tek çalışmada gönderilecek azami e-posta. */
export const CALISMA_BASINA_AZAMI = 50;

export interface HatirlatmaSonucu {
  incelenen: number;
  gonderilen: number;
  atlanan: { sebep: string; adet: number }[];
}

export async function terkEdilmisSepetleriHatirlat(
  tabanAdresi: string,
  kuruCalisma = false
): Promise<HatirlatmaSonucu> {
  const simdi = Date.now();
  const enGec = new Date(simdi - EN_AZ_SAAT * 3600_000);
  const enErken = new Date(simdi - EN_COK_GUN * 86400_000);

  const atlananlar = new Map<string, number>();
  const atla = (sebep: string) => atlananlar.set(sebep, (atlananlar.get(sebep) ?? 0) + 1);

  const sepetler = await prisma.cart.findMany({
    where: {
      customerId: { not: null },
      updatedAt: { lte: enGec, gte: enErken },
      items: { some: {} },
      customer: {
        // 1, 2, 3 numaralı elemeler sorguda: izinsiz kaydı hiç çekmiyoruz.
        iletiIzniAt: { not: null },
        emailVerified: { not: null },
        status: 'ACTIVE',
      },
    },
    orderBy: { updatedAt: 'asc' },
    take: CALISMA_BASINA_AZAMI * 3,
    select: {
      id: true,
      updatedAt: true,
      hatirlatmaGonderildiAt: true,
      customerId: true,
      customer: { select: { id: true, name: true, email: true } },
      items: {
        select: {
          quantity: true,
          product: { select: { name: true, price: true, quantity: true } },
        },
      },
    },
  });

  let gonderilen = 0;

  for (const sepet of sepetler) {
    if (gonderilen >= CALISMA_BASINA_AZAMI) break;

    const musteri = sepet.customer;
    if (!musteri) {
      atla('müşteri yok');
      continue;
    }

    // 7 - sepete son dokunuştan sonra hatırlatma gitmiş mi?
    if (sepet.hatirlatmaGonderildiAt && sepet.hatirlatmaGonderildiAt >= sepet.updatedAt) {
      atla('zaten hatırlatılmış');
      continue;
    }

    // 8 - sepet terk edildikten sonra sipariş verilmiş mi?
    const sonrakiSiparis = await prisma.order.count({
      where: {
        customerId: musteri.id,
        createdAt: { gte: sepet.updatedAt },
        status: { not: 'CANCELLED' },
      },
    });
    if (sonrakiSiparis > 0) {
      atla('sonrasında sipariş vermiş');
      continue;
    }

    // 9 - sepette satın alınabilir en az bir ürün var mı?
    const alinabilir = sepet.items.filter((k) => k.product.quantity > 0 && k.product.price > 0);
    if (alinabilir.length === 0) {
      atla('sepetteki ürünler alınamıyor');
      continue;
    }

    if (kuruCalisma) {
      gonderilen++;
      continue;
    }

    const gitti = await sepetHatirlatmaEpostasiGonder(
      musteri.email,
      musteri.name,
      alinabilir.map((k) => k.product.name),
      `${tabanAdresi}/sepet`,
      iletiRetBaglantisi(tabanAdresi, musteri.id)
    );

    /**
     * Damga yalnızca e-posta gerçekten gittiyse yazılıyor.
     *
     * Gönderim başarısızken damgalasaydık, sağlayıcı geçici olarak
     * hata verdiğinde müşteri o sepet için hiç e-posta almayacaktı -
     * hata sessizce yutulurdu.
     */
    if (gitti) {
      await prisma.cart.update({
        where: { id: sepet.id },
        data: { hatirlatmaGonderildiAt: new Date() },
      });
      gonderilen++;
    } else {
      atla('e-posta gönderilemedi');
    }
  }

  return {
    incelenen: sepetler.length,
    gonderilen,
    atlanan: [...atlananlar.entries()].map(([sebep, adet]) => ({ sebep, adet })),
  };
}
