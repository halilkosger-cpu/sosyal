import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { csvAyristir, csvOlustur, fiyatiCoz } from '@/lib/csv';
import { icerikTazele } from '@/lib/kategoriler';

export const dynamic = 'force-dynamic';

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' };
const MAKUL_UST_SINIR = 1_000_000; // 1 milyon TL uzeri neredeyse kesin yazim hatasi

/** Toplu fiyat, maliyet ve KDV girisi icin urun listesini CSV olarak indirir. */
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const urunler = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  const satirlar: (string | number)[][] = [
    ['slug', 'urun_adi', 'kategori', 'stok', 'satis_fiyati', 'alis_maliyeti', 'kdv_orani'],
    ...urunler.map((u) => [
      u.slug,
      u.name,
      u.category?.name ?? '',
      u.quantity,
      u.price > 0 ? String(u.price).replace('.', ',') : '',
      (u.purchasePrice ?? 0) > 0 ? String(u.purchasePrice).replace('.', ',') : '',
      u.vatRate ?? 20,
    ]),
  ];

  return new NextResponse(csvOlustur(satirlar), {
    headers: {
      ...NO_CACHE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="isyurtlari-fiyat-ve-maliyetler.csv"',
    },
  });
}

/**
 * Yuklenen CSV'yi ayristirip ONIZLEME dondurur. Hicbir sey yazmaz.
 * Kullanici onaylayinca PUT ile uygulanir.
 */
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const { csv } = await req.json();
  if (typeof csv !== 'string' || csv.trim() === '') {
    return NextResponse.json({ error: 'Dosya boş görünüyor' }, { status: 400 });
  }

  const satirlar = csvAyristir(csv);
  if (satirlar.length < 2) {
    return NextResponse.json({ error: 'Dosyada veri satırı bulunamadı' }, { status: 400 });
  }

  const baslik = satirlar[0].map((h) => h.trim().toLowerCase());
  const slugSutun = baslik.findIndex((h) => h === 'slug');
  const fiyatSutun = baslik.findIndex(
    (h) => h === 'fiyat' || h === 'price' || h === 'satis_fiyati' || h === 'satis'
  );
  const maliyetSutun = baslik.findIndex(
    (h) => h === 'alis_maliyeti' || h === 'maliyet' || h === 'purchase_price' || h === 'girdi_fiyati'
  );
  const kdvSutun = baslik.findIndex(
    (h) => h === 'kdv_orani' || h === 'kdv' || h === 'vat_rate' || h === 'vat'
  );

  if (slugSutun === -1 || (fiyatSutun === -1 && maliyetSutun === -1)) {
    return NextResponse.json(
      { error: "Başlık satırında en az 'slug' ve 'satis_fiyati' (veya 'alis_maliyeti') bulunmalıdır." },
      { status: 400 }
    );
  }

  const mevcut = await prisma.product.findMany({
    select: { slug: true, name: true, price: true, purchasePrice: true, vatRate: true },
  });
  const slugMap = new Map(mevcut.map((u) => [u.slug, u]));

  const degisecek: {
    slug: string;
    ad: string;
    eskiFiyat: number;
    yeniFiyat?: number;
    eskiMaliyet: number;
    yeniMaliyet?: number;
    eskiKdv: number;
    yeniKdv?: number;
  }[] = [];
  const sorunlar: { satir: number; slug: string; sebep: string }[] = [];
  const atlanan: string[] = [];

  for (let i = 1; i < satirlar.length; i++) {
    const r = satirlar[i];
    const slug = (r[slugSutun] ?? '').trim();
    const hamFiyat = fiyatSutun !== -1 ? (r[fiyatSutun] ?? '').trim() : '';
    const hamMaliyet = maliyetSutun !== -1 ? (r[maliyetSutun] ?? '').trim() : '';
    const hamKdv = kdvSutun !== -1 ? (r[kdvSutun] ?? '').trim() : '';

    if (!slug) {
      sorunlar.push({ satir: i + 1, slug: '', sebep: 'slug boş' });
      continue;
    }

    const urun = slugMap.get(slug);
    if (!urun) {
      sorunlar.push({ satir: i + 1, slug, sebep: 'bu slug ile ürün bulunamadı' });
      continue;
    }

    let yeniFiyat: number | undefined = undefined;
    if (hamFiyat !== '') {
      const p = fiyatiCoz(hamFiyat);
      if (p === null) {
        sorunlar.push({ satir: i + 1, slug, sebep: `Fiyat "${hamFiyat}" sayıya çevrilemedi` });
      } else if (p > MAKUL_UST_SINIR) {
        sorunlar.push({ satir: i + 1, slug, sebep: `${p} TL fazla yüksek, yazım hatası olabilir` });
      } else if (p !== urun.price) {
        yeniFiyat = p;
      }
    }

    let yeniMaliyet: number | undefined = undefined;
    if (hamMaliyet !== '') {
      const c = fiyatiCoz(hamMaliyet);
      if (c === null) {
        sorunlar.push({ satir: i + 1, slug, sebep: `Maliyet "${hamMaliyet}" sayıya çevrilemedi` });
      } else if (c > MAKUL_UST_SINIR) {
        sorunlar.push({ satir: i + 1, slug, sebep: `${c} TL maliyet fazla yüksek` });
      } else if (c !== (urun.purchasePrice ?? 0)) {
        yeniMaliyet = c;
      }
    }

    let yeniKdv: number | undefined = undefined;
    if (hamKdv !== '') {
      const k = parseInt(hamKdv, 10);
      if (k === 1 || k === 20 || k === 10 || k === 8) {
        if (k !== (urun.vatRate ?? 20)) {
          yeniKdv = k;
        }
      }
    }

    if (yeniFiyat !== undefined || yeniMaliyet !== undefined || yeniKdv !== undefined) {
      degisecek.push({
        slug,
        ad: urun.name,
        eskiFiyat: urun.price,
        yeniFiyat,
        eskiMaliyet: urun.purchasePrice ?? 0,
        yeniMaliyet,
        eskiKdv: urun.vatRate ?? 20,
        yeniKdv,
      });
    } else {
      atlanan.push(slug);
    }
  }

  return NextResponse.json(
    { degisecek, sorunlar, atlananSayisi: atlanan.length, toplamSatir: satirlar.length - 1 },
    { headers: NO_CACHE }
  );
}

/** Onaylanan fiyat ve maliyetleri uygular. */
export async function PUT(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const { updates } = await req.json();
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Güncellenecek veri yok' }, { status: 400 });
  }

  const gecerli: {
    slug: string;
    price?: number;
    purchasePrice?: number;
    vatRate?: number;
  }[] = [];

  for (const u of updates) {
    const slug = String(u?.slug ?? '').trim();
    if (!slug) continue;

    const data: { price?: number; purchasePrice?: number; vatRate?: number } = {};

    if (u?.price !== undefined) {
      const price = Number(u.price);
      if (Number.isFinite(price) && price >= 0 && price <= MAKUL_UST_SINIR) {
        data.price = Math.round(price * 100) / 100;
      }
    }

    if (u?.purchasePrice !== undefined) {
      const purchasePrice = Number(u.purchasePrice);
      if (Number.isFinite(purchasePrice) && purchasePrice >= 0 && purchasePrice <= MAKUL_UST_SINIR) {
        data.purchasePrice = Math.round(purchasePrice * 100) / 100;
      }
    }

    if (u?.vatRate !== undefined) {
      const vatRate = Number(u.vatRate);
      if (vatRate === 1 || vatRate === 20 || vatRate === 10 || vatRate === 8) {
        data.vatRate = vatRate;
      }
    }

    if (Object.keys(data).length > 0) {
      gecerli.push({ slug, ...data });
    }
  }

  if (gecerli.length === 0) {
    return NextResponse.json({ error: 'Geçerli veri bulunamadı' }, { status: 400 });
  }

  // Tek islemde uygula: yarim kalmis guncelleme olmasin
  await prisma.$transaction(
    gecerli.map((g) => {
      const updateData: any = {};
      if (g.price !== undefined) updateData.price = g.price;
      if (g.purchasePrice !== undefined) updateData.purchasePrice = g.purchasePrice;
      if (g.vatRate !== undefined) updateData.vatRate = g.vatRate;

      return prisma.product.updateMany({
        where: { slug: g.slug },
        data: updateData,
      });
    })
  );

  icerikTazele();

  return NextResponse.json({ success: true, guncellenen: gecerli.length }, { headers: NO_CACHE });
}
