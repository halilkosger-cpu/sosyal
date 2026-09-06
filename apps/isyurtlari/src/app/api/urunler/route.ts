import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { urunAra } from '@/lib/arama';

export const dynamic = 'force-dynamic';

/**
 * Ürün listesi.
 *
 * ─── NEDEN YENİ BİR UÇ ────────────────────────────────────────────────
 *
 * /api/products sayfalama tanımıyor: her istekte tüm katalog, kampanya
 * ilişkileriyle birlikte dönüyor. Kategori sayfası da gelen tüm diziyi
 * tarayıcıda süzüyordu - fiyat ve stok filtresi istemcide çalışıyor,
 * filtrelenmiş sayfa paylaşılamıyor, arama motoru onu hiç görmüyordu.
 *
 * Bu uç süzme, sıralama ve sayfalamayı sunucuya alıyor ve yanıt biçimi
 * zenginleştiği için ayrı bir adreste duruyor; eski uç kırılmasın diye
 * olduğu gibi bırakıldı.
 *
 * ─── FASETLER ─────────────────────────────────────────────────────────
 *
 * Fiyat aralığı ve stok sayıları, uygulanan süzgeçlerin SONUCUNA değil,
 * o kategorinin/aramanın tamamına göre hesaplanıyor. Aksi halde fiyat
 * çubuğu kullanıcı süzdükçe daralır ve geri genişletmek imkânsızlaşırdı.
 */

const VARSAYILAN_ADET = 24;
const AZAMI_ADET = 60;
/**
 * Kimlik listesiyle çağrıldığında sayfa başına sınır daha yüksek: istek
 * zaten gönderilen kimlik sayısıyla sınırlı, sayfalamaya bölmek yalnızca
 * favoriler sayfasını iki isteğe çıkarırdı.
 */
const AZAMI_KIMLIK = 120;

type Sirala = 'varsayilan' | 'fiyat-artan' | 'fiyat-azalan' | 'isim' | 'yeni';

const SIRALAMALAR: Record<Sirala, true> = {
  varsayilan: true,
  'fiyat-artan': true,
  'fiyat-azalan': true,
  isim: true,
  yeni: true,
};

const sayi = (deger: string | null): number | null => {
  if (deger === null || deger.trim() === '') return null;
  const n = Number(deger);
  return Number.isFinite(n) ? n : null;
};

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  try {
    const kategoriSlug = p.get('kategori')?.trim() || null;
    const sorgu = p.get('ara')?.trim() || null;

    /**
     * Belirli ürünleri kimliğe göre getirme.
     *
     * Favoriler sayfası eskiden TÜM kataloğu çekip içinden favorileri
     * ayıklıyordu - katalog büyüdükçe her ziyarette boşuna indirilen veri.
     * Bu parametreyle yalnızca istenen ürünler dönüyor ve sıra korunuyor:
     * müşteri favoriye ekleme sırasını bekliyor, veritabanı sırasını değil.
     */
    const kimlikler = (p.get('kimlikler') || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, AZAMI_KIMLIK);
    const stok = p.get('stok'); // 'var' | 'yok' | null
    const minFiyat = sayi(p.get('minFiyat'));
    const maxFiyat = sayi(p.get('maxFiyat'));

    const siralaHam = (p.get('sirala') || 'varsayilan') as Sirala;
    const sirala: Sirala = SIRALAMALAR[siralaHam] ? siralaHam : 'varsayilan';

    const sayfa = Math.max(1, Math.floor(sayi(p.get('sayfa')) ?? 1));
    const azamiAdet = kimlikler.length > 0 ? AZAMI_KIMLIK : AZAMI_ADET;
    const adet = Math.min(azamiAdet, Math.max(1, Math.floor(sayi(p.get('adet')) ?? VARSAYILAN_ADET)));

    // ── Arama ──
    let aramaKimlikleri: string[] | null = null;
    let aramaPuanlari: Map<string, number> | null = null;

    if (sorgu) {
      const sonuc = await urunAra(sorgu);
      if (sonuc.kimlikler.length === 0) {
        return NextResponse.json({
          urunler: [],
          toplam: 0,
          sayfa: 1,
          sayfaSayisi: 0,
          fasetler: { fiyat: { min: 0, max: 0 }, stok: { var: 0, yok: 0 }, kategoriler: [] },
        });
      }
      aramaKimlikleri = sonuc.kimlikler;
      aramaPuanlari = sonuc.puanlar;
    }

    // Kimlik listesi verildiyse boş liste boş sonuç demek; tüm katalog değil.
    if (p.has('kimlikler') && kimlikler.length === 0) {
      return NextResponse.json({
        urunler: [],
        toplam: 0,
        sayfa: 1,
        sayfaSayisi: 0,
        fasetler: { fiyat: { min: 0, max: 0 }, stok: { var: 0, yok: 0 }, kategoriler: [] },
      });
    }

    /** Faset sayımlarının temeli: süzgeçler UYGULANMADAN önceki küme. */
    const temelKosul = {
      ...(kategoriSlug ? { category: { slug: kategoriSlug } } : {}),
      ...(aramaKimlikleri ? { id: { in: aramaKimlikleri } } : {}),
      ...(kimlikler.length > 0 ? { id: { in: kimlikler } } : {}),
    };

    /** Listelenen ürünler: temel küme + kullanıcının süzgeçleri. */
    const kosul = {
      ...temelKosul,
      ...(stok === 'var' ? { quantity: { gt: 0 } } : {}),
      ...(stok === 'yok' ? { quantity: { lte: 0 } } : {}),
      // Fiyatı girilmemiş (0) ürünler fiyat süzgecinin dışında tutuluyor:
      // "en az 100 TL" diyen müşteriye fiyatı belli olmayan ürünü göstermek
      // de gizlemek de yanlış olurdu; süzgeç kullanılmadıkça görünüyorlar.
      ...(minFiyat !== null || maxFiyat !== null
        ? {
            price: {
              ...(minFiyat !== null ? { gte: minFiyat } : {}),
              ...(maxFiyat !== null ? { lte: maxFiyat } : {}),
              gt: 0,
            },
          }
        : {}),
    };

    const simdi = new Date();
    const kampanyaIliskisi = {
      where: { campaign: { active: true, startDate: { lte: simdi }, endDate: { gte: simdi } } },
      include: { campaign: true },
    };

    /**
     * Bazı sıralamalar veritabanında yapılamıyor; onlar bellekte sıralanıp
     * sayfalanıyor:
     *
     *  - Alaka: puan veritabanında değil, arama sonucunda.
     *  - Fiyat: fiyatı girilmemiş ürünler price = 0 taşıyor. Düz "price ASC"
     *    onları en ucuz sanıp başa alıyordu; müşteri "Fiyat belirleniyor"
     *    yazan bir yığınla karşılaşıyordu. Fiyatsız ürünler her iki yönde de
     *    sona atılıyor.
     *
     * İkisi de eşleşen kümenin tamamını gerektiriyor, ama çekilen alanlar
     * yalnızca sıralama için gerekli olanlar; ürün gövdeleri sayfalama
     * sonrası yükleniyor.
     */
    const fiyatSiralamasi = sirala === 'fiyat-artan' || sirala === 'fiyat-azalan';
    /** Kimlikle çağrıldığında istenen sıra korunuyor (favori ekleme sırası). */
    const kimlikSirasi = kimlikler.length > 0 && sirala === 'varsayilan';
    const bellekteSirala =
      (Boolean(aramaPuanlari) && sirala === 'varsayilan') || fiyatSiralamasi || kimlikSirasi;

    const siralamaOlcutu =
      sirala === 'isim'
        ? [{ name: 'asc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [toplam, fasetKume, kategoriSayimlari, urunlerHam] = await Promise.all([
      prisma.product.count({ where: kosul }),

      // Faset: fiyat aralığı ve stok sayıları
      prisma.product.aggregate({
        where: { ...temelKosul, price: { gt: 0 } },
        _min: { price: true },
        _max: { price: true },
      }),

      prisma.product.groupBy({
        by: ['categoryId'],
        where: temelKosul,
        _count: { _all: true },
      }),

      bellekteSirala
        ? prisma.product.findMany({ where: kosul, select: { id: true, price: true } })
        : prisma.product.findMany({
            where: kosul,
            include: { category: true, campaigns: kampanyaIliskisi },
            orderBy: siralamaOlcutu,
            skip: (sayfa - 1) * adet,
            take: adet,
          }),
    ]);

    let urunler = urunlerHam as any[];

    if (bellekteSirala) {
      const hepsi = urunlerHam as { id: string; price: number }[];

      const sirali = [...hepsi].sort((a, b) => {
        if (fiyatSiralamasi) {
          const aFiyatsiz = a.price <= 0;
          const bFiyatsiz = b.price <= 0;
          // Fiyatı belirlenmemiş ürünler her iki yönde de sonda.
          if (aFiyatsiz !== bFiyatsiz) return aFiyatsiz ? 1 : -1;
          if (aFiyatsiz && bFiyatsiz) return 0;
          return sirala === 'fiyat-artan' ? a.price - b.price : b.price - a.price;
        }
        if (kimlikSirasi) {
          return kimlikler.indexOf(a.id) - kimlikler.indexOf(b.id);
        }
        return (aramaPuanlari?.get(b.id) ?? 0) - (aramaPuanlari?.get(a.id) ?? 0);
      });

      const sayfaKimlikleri = sirali.slice((sayfa - 1) * adet, sayfa * adet).map((u) => u.id);

      const govdeler = await prisma.product.findMany({
        where: { id: { in: sayfaKimlikleri } },
        include: { category: true, campaigns: kampanyaIliskisi },
      });

      // findMany sırayı korumuyor; yukarıda hesaplanan sıra geri uygulanıyor.
      const govdeHaritasi = new Map(govdeler.map((u) => [u.id, u]));
      urunler = sayfaKimlikleri.map((id) => govdeHaritasi.get(id)).filter(Boolean) as any[];
    }

    // Stok fasetleri
    const [stoktaVar, stoktaYok] = await Promise.all([
      prisma.product.count({ where: { ...temelKosul, quantity: { gt: 0 } } }),
      prisma.product.count({ where: { ...temelKosul, quantity: { lte: 0 } } }),
    ]);

    const kategoriler = await prisma.productCategory.findMany({
      where: { id: { in: kategoriSayimlari.map((k) => k.categoryId) } },
      select: { id: true, name: true, slug: true },
    });

    const kategoriAdlari = new Map(kategoriler.map((k) => [k.id, k]));

    /**
     * Puan ortalamaları.
     *
     * Kartlarda daha önce her ürüne sabit beş yıldız ve "5.0" basılıyordu;
     * hiçbir veriden gelmiyordu, Review tablosu boşken de aynı puan
     * çıkıyordu (bkz. components/UrunKarti.tsx). Gerçek ortalama artık
     * burada hesaplanıyor - ve YALNIZCA onaylı yorumlardan.
     *
     * Yorumu olmayan ürün için hiçbir puan alanı dönmüyor; kart da o zaman
     * puan göstermiyor. "Henüz yorum yok" ile "puanı düşük" farklı şeyler.
     */
    const puanlar = urunler.length
      ? await prisma.review.groupBy({
          by: ['productId'],
          where: { productId: { in: urunler.map((u: any) => u.id) }, approved: true },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];

    const puanHaritasi = new Map(
      puanlar.map((p) => [
        p.productId,
        {
          ortalama: Math.round((p._avg.rating ?? 0) * 10) / 10,
          adet: p._count._all,
        },
      ])
    );

    return NextResponse.json({
      urunler: urunler.map((u: any) => {
        const kampanya = u.campaigns?.[0];
        const puan = puanHaritasi.get(u.id);
        return {
          id: u.id,
          name: u.name,
          slug: u.slug,
          description: u.description,
          price: u.price,
          quantity: u.quantity,
          imageUrl: u.imageUrl,
          category: u.category
            ? { name: u.category.name, slug: u.category.slug, kdvOrani: u.category.kdvOrani }
            : null,
          campaign: kampanya
            ? {
                id: kampanya.campaign.id,
                name: kampanya.campaign.name,
                discount: kampanya.discount,
                discountedPrice: Math.round(u.price * (1 - kampanya.discount / 100) * 100) / 100,
              }
            : null,
          // Yorumu olmayan üründe bu alanlar hiç dönmüyor.
          puan: puan?.ortalama ?? null,
          yorumSayisi: puan?.adet ?? 0,
        };
      }),
      toplam,
      sayfa,
      sayfaSayisi: Math.ceil(toplam / adet),
      fasetler: {
        fiyat: {
          min: Math.floor(fasetKume._min.price ?? 0),
          max: Math.ceil(fasetKume._max.price ?? 0),
        },
        stok: { var: stoktaVar, yok: stoktaYok },
        kategoriler: kategoriSayimlari
          .map((k) => ({
            slug: kategoriAdlari.get(k.categoryId)?.slug ?? '',
            name: kategoriAdlari.get(k.categoryId)?.name ?? '',
            adet: k._count._all,
          }))
          .filter((k) => k.slug)
          .sort((a, b) => b.adet - a.adet),
      },
    });
  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    return NextResponse.json({ error: 'Ürünler yüklenemedi' }, { status: 500 });
  }
}
