import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { kuponuDogrula } from '@/lib/kupon';
import { oturumdakiMusteri } from '@/lib/musteri-auth';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { siparisToplami } from '@/lib/fiyat';

export const dynamic = 'force-dynamic';

/**
 * Ödeme sayfasındaki "kuponu uygula".
 *
 * ─── SEPET TUTARI İSTEMCİDEN ALINMIYOR ────────────────────────────────
 *
 * Gövdede yalnızca ürün kimlikleri ve adetler var; tutar sunucuda
 * yeniden hesaplanıyor. İstemciden gelen bir toplama güvenseydik,
 * "asgari sepet tutarı" koşulu bir sayı uydurmakla aşılabilirdi.
 *
 * ─── DOĞRULANMASI SİPARİŞTE GEÇERLİ OLACAĞI ANLAMINA GELMEZ ───────────
 *
 * Bu uç yalnızca müşteriye tutarı gösteriyor. Sipariş ucu doğrulamayı
 * kendisi tekrar yapıyor; kupon o arada tükenmiş olabilir.
 */
export async function POST(req: NextRequest) {
  // Kod deneyerek geçerli kuponları bulmaya çalışmak yavaşlatılıyor.
  const sinir = await hizSiniriGuard(req, 'kupon-dogrula', 20, 600);
  if (sinir) return sinir;

  try {
    const govde: {
      kod?: string;
      kalemler?: { id?: string; adet?: number }[];
      eposta?: string;
    } = await req.json();

    const istenen = Array.isArray(govde.kalemler) ? govde.kalemler.slice(0, 100) : [];
    const adetler = new Map<string, number>();
    for (const k of istenen) {
      const id = typeof k?.id === 'string' ? k.id : null;
      const adet = Math.floor(Number(k?.adet));
      if (!id || !Number.isFinite(adet) || adet < 1) continue;
      adetler.set(id, (adetler.get(id) ?? 0) + Math.min(99, adet));
    }

    if (adetler.size === 0) {
      return NextResponse.json({ gecerli: false, indirim: 0, mesaj: 'Sepetiniz boş' });
    }

    const simdi = new Date();
    const urunler = await prisma.product.findMany({
      where: { id: { in: [...adetler.keys()] } },
      select: {
        id: true,
        price: true,
        category: { select: { kdvOrani: true } },
        campaigns: {
          where: { campaign: { active: true, startDate: { lte: simdi }, endDate: { gte: simdi } } },
          select: { discount: true },
        },
      },
    });

    // Tutar sipariş ucundakiyle aynı kurallara göre: kampanya indirimi
    // uygulanmış, KDV dahil.
    const kalemler = urunler
      .filter((u) => u.price > 0)
      .map((u) => {
        const indirim = u.campaigns[0]?.discount ?? 0;
        const birim = Math.round(u.price * (1 - indirim / 100) * 100) / 100;
        return {
          tutar: birim * (adetler.get(u.id) ?? 0),
          kdvOrani: u.category?.kdvOrani ?? null,
        };
      });

    const urunToplami = siparisToplami(kalemler).urunToplami;

    const musteri = await oturumdakiMusteri();
    const sonuc = await kuponuDogrula({
      kod: String(govde.kod ?? ''),
      urunToplami,
      customerId: musteri?.id ?? null,
      eposta: musteri?.email ?? (typeof govde.eposta === 'string' ? govde.eposta : null),
    });

    return NextResponse.json({
      gecerli: sonuc.gecerli,
      indirim: sonuc.indirim,
      mesaj: sonuc.mesaj,
      urunToplami,
      // Kuponun kendi ayrıntıları dışarı verilmiyor: kod deneyen birine
      // kuponun ne olduğunu anlatmanın gereği yok.
      kod: sonuc.gecerli ? sonuc.kupon?.kod : undefined,
    });
  } catch (error) {
    console.error('Kupon doğrulanamadı:', error);
    return NextResponse.json({ error: 'Kupon kontrol edilemedi' }, { status: 500 });
  }
}
