import { put } from '@vercel/blob';
import { guvenliDosyaAdi, webpSurumleri } from '@/lib/gorsel-uret';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

const RASTER = ['image/jpeg', 'image/png', 'image/webp'];
// SVG yalnizca kategori ikonlari icin; <img> icinde script calismaz.
const SVG = 'image/svg+xml';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const istenenKlasor = formData.get('klasor');
    const klasor = istenenKlasor === 'kategoriler' ? 'kategoriler' : 'products';
    const svgIzinli = klasor === 'kategoriler' && file.type === SVG;
    if (!RASTER.includes(file.type) && !svgIzinli) {
      return NextResponse.json(
        { error: 'Sadece JPG, PNG ve WebP destekleniyor (SVG yalnızca kategori ikonu)' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const taban = `${klasor}/${Date.now()}-${guvenliDosyaAdi(file.name)}`;

    if (svgIzinli) {
      const blob = await put(`${taban}.svg`, new Blob([bytes]), { access: 'public', contentType: SVG });
      return NextResponse.json({ url: blob.url });
    }

    const surumler = await webpSurumleri(bytes);
    const yuklenenler = await Promise.all(
      surumler.map((s) =>
        put(`${taban}-${s.genislik}.webp`, new Blob([new Uint8Array(s.veri)]), {
          access: 'public',
          contentType: 'image/webp',
          addRandomSuffix: false,
          cacheControlMaxAge: 31536000,
        })
      )
    );
    return NextResponse.json({ url: yuklenenler[yuklenenler.length - 1].url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
