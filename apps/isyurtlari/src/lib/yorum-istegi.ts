import { prisma } from '@isyurtlari/database';
import { IZINLI_KOSULU, type HatirlatmaSonucu } from './terk-edilmis-sepet';
import { iletiRetBaglantisi } from './ileti-izni';
import { yorumBaglantisiOlustur } from './yorum-baglantisi';
import { yorumIstegiEpostasi } from './yorum-istegi-eposta';
import { yorumIstegiEpostasiGonder } from './musteri-eposta';
import { siparisinKodu } from './hediye-db';
import { whatsappPaylasimBaglantisi } from './hediye';

/**
 * Teslimden sonra yorum isteği e-postası.
 *
 * ─── KİME GÖNDERİLMEZ ─────────────────────────────────────────────────
 *
 *  1. İzin. Yorum isteği ticari elektronik ileti sayılabilir; yalnızca
 *     ticari ileti izni olan, e-postası doğrulanmış, açık hesaplı kayıtlı
 *     müşterilere gider (IZINLI_KOSULU, terk edilmiş sepet işiyle aynı).
 *     Misafirlerin izin kaydı yok: onlar yorum bağlantısını Siparişlerim
 *     sayfasından alır (bkz. /api/yorum-baglantisi).
 *  2. Teslim edilmemiş sipariş. `deliveredAt` yönetici "teslim edildi"
 *     işaretleyince yazılır; işaretlenmeyen sipariş için e-posta gitmez.
 *  3. Çok taze (5 günden yeni) ya da çok eski (14 günden eski) teslim.
 *     Eski sınır, çalışmayan günlerin ardından toplu "geç kalmış" e-posta
 *     yağmasını önler.
 *  4. İade kaydı olan sipariş: ürünü iade eden müşteriden yorum istenmez.
 *  5. Zaten davet edilmiş sipariş (YorumDavetKaydi).
 *  6. Tüm ürünleri zaten yorumlanmış sipariş.
 *
 * ─── ÇİFT GÖNDERİM ────────────────────────────────────────────────────
 *
 * "Gönderildi" kaydı e-postadan ÖNCE alınır (INSERT ... ON CONFLICT DO
 * NOTHING): aynı anda çalışan iki görev aynı siparişi gönderemez. Gönderim
 * başarısız olursa kayıt geri silinir ki bir sonraki çalışmada yeniden
 * denensin; hata sessizce yutulmaz.
 */

/** Teslimden en az bu kadar gün sonra gönderilir. */
export const TESLIMDEN_SONRA_GUN = 5;
/** Bundan daha eski teslimler için gönderilmez. */
export const EN_COK_GUN = 14;
/** Tek çalışmada gönderilecek azami e-posta. */
export const CALISMA_BASINA_AZAMI = 40;

const GUN_MS = 86_400_000;

export async function yorumIstekleriniGonder(
  tabanAdresi: string,
  kuruCalisma = false,
  simdi = Date.now()
): Promise<HatirlatmaSonucu> {
  const enGec = new Date(simdi - TESLIMDEN_SONRA_GUN * GUN_MS);
  const enErken = new Date(simdi - EN_COK_GUN * GUN_MS);

  const atlananlar = new Map<string, number>();
  const atla = (sebep: string) => atlananlar.set(sebep, (atlananlar.get(sebep) ?? 0) + 1);

  const siparisler = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { gte: enErken, lte: enGec },
      customerId: { not: null },
      // İade kaydı olan siparişten yorum istenmez.
      returns: { none: {} },
      // 1 numaralı eleme sorguda: izinsiz müşterinin siparişini hiç çekmiyoruz.
      customer: IZINLI_KOSULU,
    },
    orderBy: { deliveredAt: 'asc' },
    take: CALISMA_BASINA_AZAMI * 3,
    select: {
      id: true,
      orderNumber: true,
      customer: { select: { id: true, name: true, email: true } },
      items: { select: { id: true, product: { select: { name: true } } } },
    },
  });

  /** Kuru çalışmada elemelerin nerede daraldığını gösterir. */
  let tani: Record<string, number> | undefined;
  if (kuruCalisma) {
    const pencere = { status: 'DELIVERED' as const, deliveredAt: { gte: enErken, lte: enGec }, customerId: { not: null } };
    const [teslim, izinli, iadesiz] = await Promise.all([
      prisma.order.count({ where: pencere }),
      prisma.order.count({ where: { ...pencere, customer: IZINLI_KOSULU } }),
      prisma.order.count({ where: { ...pencere, customer: IZINLI_KOSULU, returns: { none: {} } } }),
    ]);
    tani = {
      'zaman penceresinde teslim edilmis (kayitli musteri)': teslim,
      'izinli ve dogrulanmis': izinli,
      'iade kaydi olmayan': iadesiz,
    };
  }

  // 5 - daha önce davet edilmiş siparişler tek sorguda.
  const siparisKimlikleri = siparisler.map((s) => s.id);
  const davetliKayitlar = siparisKimlikleri.length
    ? await prisma.$queryRawUnsafe<{ siparisId: string }[]>(
        `SELECT "siparisId" FROM "YorumDavetKaydi" WHERE "siparisId" = ANY($1::text[])`,
        siparisKimlikleri
      )
    : [];
  const davetli = new Set(davetliKayitlar.map((k) => k.siparisId));

  // 6 - zaten yorumlanmış sipariş kalemleri tek sorguda.
  const kalemKimlikleri = siparisler.flatMap((s) => s.items.map((k) => k.id));
  const yorumlananlar = new Set(
    (
      kalemKimlikleri.length
        ? await prisma.review.findMany({
            where: { orderItemId: { in: kalemKimlikleri } },
            select: { orderItemId: true },
          })
        : []
    ).map((y) => y.orderItemId)
  );

  let gonderilen = 0;

  for (const siparis of siparisler) {
    if (gonderilen >= CALISMA_BASINA_AZAMI) break;

    const musteri = siparis.customer;
    if (!musteri) {
      atla('müşteri yok');
      continue;
    }

    if (davetli.has(siparis.id)) {
      atla('zaten davet edilmiş');
      continue;
    }

    const sorulacak = siparis.items.filter((k) => !yorumlananlar.has(k.id));
    if (sorulacak.length === 0) {
      atla('tüm ürünler zaten yorumlanmış');
      continue;
    }

    if (kuruCalisma) {
      gonderilen++;
      continue;
    }

    // Kaydı göndermeden ÖNCE al: çakışırsa başka bir çalışma bu siparişi gönderiyor demektir.
    const alinan = await prisma.$queryRawUnsafe<{ siparisId: string }[]>(
      `INSERT INTO "YorumDavetKaydi" ("siparisId") VALUES ($1) ON CONFLICT DO NOTHING RETURNING "siparisId"`,
      siparis.id
    );
    if (alinan.length === 0) {
      atla('zaten davet edilmiş');
      continue;
    }

    // Hediye kodu okunamazsa (tablo yok vb.) e-posta yine gider, yalnızca paylaşım bloğu olmaz.
    let paylasim: string | null = null;
    try {
      const kod = await siparisinKodu(prisma, siparis.id);
      paylasim = kod ? whatsappPaylasimBaglantisi(tabanAdresi, kod) : null;
    } catch (e) {
      console.error('Yorum isteği: hediye kodu okunamadı:', e);
    }

    const { konu, html } = yorumIstegiEpostasi({
      ad: musteri.name,
      kalemler: sorulacak.map((k) => ({
        ad: k.product.name,
        baglanti: `${tabanAdresi}/yorum/${yorumBaglantisiOlustur(k.id)}`,
      })),
      paylasimBaglantisi: paylasim,
      retBaglantisi: iletiRetBaglantisi(tabanAdresi, musteri.id),
    });

    const gitti = await yorumIstegiEpostasiGonder(musteri.email, konu, html);

    if (gitti) {
      gonderilen++;
    } else {
      // Gönderilemedi: kaydı geri al, bir sonraki çalışmada yeniden denensin.
      await prisma.$executeRawUnsafe(`DELETE FROM "YorumDavetKaydi" WHERE "siparisId" = $1`, siparis.id);
      atla('e-posta gönderilemedi');
    }
  }

  return {
    incelenen: siparisler.length,
    gonderilen,
    atlanan: [...atlananlar.entries()].map(([sebep, adet]) => ({ sebep, adet })),
    ...(tani ? { tani } : {}),
  };
}
