import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { jetonuKullan } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * E-posta dogrulama jetonunu isler.
 *
 * POST: bagLanti bir sayfaya gidiyor, sayfa da bu ucu cagiriyor. Dogrudan
 * GET ile dogrulamak, e-posta istemcilerinin baglantilari onizleme icin
 * onceden acmasi yuzunden jetonu kullanici tiklamadan tuketebiliyor.
 */
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'musteri-eposta-dogrula', 20, 3600);
  if (sinir) return sinir;

  try {
    const govde: { jeton?: string } = await req.json();
    const jeton = (govde.jeton ?? '').trim();

    if (!jeton) {
      return NextResponse.json({ error: 'Doğrulama bağlantısı geçersiz' }, { status: 400 });
    }

    const sonuc = await jetonuKullan(jeton, 'EMAIL_DOGRULAMA');
    if (!sonuc) {
      return NextResponse.json(
        { error: 'Bu bağlantı geçersiz ya da süresi dolmuş. Hesabım sayfasından yeni bir doğrulama isteyebilirsiniz.' },
        { status: 400 }
      );
    }

    await prisma.customer.update({
      where: { id: sonuc.customerId },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    return NextResponse.json({ error: 'Doğrulama tamamlanamadı' }, { status: 500 });
  }
}
