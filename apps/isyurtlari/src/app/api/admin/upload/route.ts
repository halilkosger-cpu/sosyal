import { put } from '@vercel/blob';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

// SVG ve WebP kategori ikonlari icin eklendi: mevcut kategori ikonlarinin
// tamami zaten SVG ve <img> ile gosteriliyor. Tarayici <img> icindeki SVG'de
// script calistirmadigi icin bu yol guvenli olanidir.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    console.log('Upload başladı:', { filename: file?.name, size: file?.size, type: file?.type });

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece JPG ve PNG formatları destekleniyor' },
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

    // Convert file to buffer for Vercel Blob
    const bytes = await file.arrayBuffer();
    const timestamp = Date.now();
    // Kategori ikonlari urun gorsellerinden ayri klasorde dursun; toplu
    // gorsel optimizasyonu urunleri tararken ikonlara dokunmasin.
    const istenenKlasor = formData.get('klasor');
    const klasor = istenenKlasor === 'kategoriler' ? 'kategoriler' : 'products';
    const filename = `${klasor}/${timestamp}-${file.name}`;

    console.log('Vercel Blob\'a yükleniyor:', filename);
    const blob = await put(filename, bytes, { access: 'public' });

    console.log('Upload başarılı:', blob.url);
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
