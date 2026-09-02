import { put } from '@vercel/blob';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
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
    const filename = `products/${timestamp}-${file.name}`;

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
