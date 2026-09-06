import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { csvAyristir, csvOlustur, fiyatiCoz } from '@/lib/csv';
import { icerikTazele } from '@/lib/kategoriler';

export const dynamic = 'force-dynamic';

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' };
const MAKUL_UST_SINIR = 1_000_000; // 1 milyon TL uzeri neredeyse kesin yazim hatasi

/** Toplu fiyat girisi icin urun listesini CSV olarak indirir. */
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const urunler = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  const satirlar: (string | number)[][] = [
    ['slug', 'urun_adi', 'kategori', 'stok', 'fiyat'],
    ...urunler.map((u) => [
      u.slug,
      u.name,
      u.category?.name ?? '',
      u.quantity,
      u.price > 0 ? String(u.price).replace('.', ',') : '',
    ]),
  ];

  return new NextResponse(csvOlustur(satirlar), {
    headers: {
      ...NO_CACHE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="isyurtlari-fiyatlar.csv"',
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
  const fiyatSutun = baslik.findIndex((h) => h === 'fiyat' || h === 'price');

  if (slugSutun === -1 || fiyatSutun === -1) {
    return NextResponse.json(
      { error: "Başlık satırında 'slug' ve 'fiyat' sütunları bulunamadı" },
      { status: 400 }
    );
  }

  const mevcut = await prisma.product.findMany({ select: { slug: true, name: true, price: true } });
  const slugMap = new Map(mevcut.map((u) => [u.slug, u]));

  const degisecek: { slug: string; ad: string; eskiFiyat: number; yeniFiyat: number }[] = [];
  const sorunlar: { satir: number; slug: string; sebep: string }[] = [];
  const atlanan: string[] = [];

  for (let i = 1; i < satirlar.length; i++) {
    const r = satirlar[i];
    const slug = (r[slugSutun] ?? '').trim();
    const hamFiyat = (r[fiyatSutun] ?? '').trim();

    if (!slug) { sorunlar.push({ satir: i + 1, slug: '', sebep: 'slug boş' }); continue; }

    const urun = slugMap.get(slug);
    if (!urun) { sorunlar.push({ satir: i + 1, slug, sebep: 'bu slug ile ürün bulunamadı' }); continue; }

    if (hamFiyat === '') { atlanan.push(slug); continue; }

    const fiyat = fiyatiCoz(hamFiyat);
    if (fiyat === null) {
      sorunlar.push({ satir: i + 1, slug, sebep: `"${hamFiyat}" sayıya çevrilemedi` });
      continue;
    }
    if (fiyat > MAKUL_UST_SINIR) {
      sorunlar.push({ satir: i + 1, slug, sebep: `${fiyat} TL fazla yüksek, yazım hatası olabilir` });
      continue;
    }
    if (fiyat === urun.price) { atlanan.push(slug); continue; }

    degisecek.push({ slug, ad: urun.name, eskiFiyat: urun.price, yeniFiyat: fiyat });
  }

  return NextResponse.json(
    { degisecek, sorunlar, atlananSayisi: atlanan.length, toplamSatir: satirlar.length - 1 },
    { headers: NO_CACHE }
  );
}

/** Onaylanan fiyatlari uygular. */
export async function PUT(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const { updates } = await req.json();
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Güncellenecek fiyat yok' }, { status: 400 });
  }

  const gecerli: { slug: string; price: number }[] = [];
  for (const u of updates) {
    const slug = String(u?.slug ?? '').trim();
    const price = Number(u?.price);
    if (!slug) continue;
    if (!Number.isFinite(price) || price < 0 || price > MAKUL_UST_SINIR) continue;
    gecerli.push({ slug, price: Math.round(price * 100) / 100 });
  }

  if (gecerli.length === 0) {
    return NextResponse.json({ error: 'Geçerli fiyat bulunamadı' }, { status: 400 });
  }

  // Tek islemde uygula: yarim kalmis guncelleme olmasin
  await prisma.$transaction(
    gecerli.map((g) =>
      prisma.product.updateMany({ where: { slug: g.slug }, data: { price: g.price } })
    )
  );

  /**
   * Fiyat degisikligi ana sayfada, kategori ve urun sayfalarinda gorunuyor.
   * Bu uc icerikTazele()'yi hic cagirmiyordu; sayfalar force-dynamic oldugu
   * icin fark edilmiyordu. ISR'ye gecince cagrilmasi sart oldu.
   */
  icerikTazele();

  return NextResponse.json({ success: true, guncellenen: gecerli.length }, { headers: NO_CACHE });
}
