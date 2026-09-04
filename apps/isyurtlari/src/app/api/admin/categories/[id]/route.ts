import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { icerikTazele } from '@/lib/kategoriler';
import { gecerliGorselAdresi } from '@/lib/dogrulama';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Kategorinin ikonunu belirler. imageUrl null gonderilirse ikon kaldirilir ve
 * kategori yerlesik ikon esleme tablosuna geri doner.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const { imageUrl } = await req.json();

  if (imageUrl !== null && !gecerliGorselAdresi(imageUrl)) {
    return NextResponse.json({ error: 'Geçerli bir ikon adresi gerekli' }, { status: 400 });
  }

  const category = await prisma.productCategory.update({
    where: { id: params.id },
    data: { imageUrl },
    select: { id: true, name: true, slug: true, imageUrl: true },
  });

  icerikTazele();

  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  await prisma.productCategory.delete({ where: { id: params.id } });

  // Silinen kategori baslik cubugunda olu bag olarak kalmasin.
  icerikTazele();

  return NextResponse.json({ ok: true });
}
