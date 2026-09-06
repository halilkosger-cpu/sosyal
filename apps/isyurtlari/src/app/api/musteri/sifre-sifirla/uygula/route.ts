import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import {
  istekBilgisi,
  jetonuKullan,
  oturumAc,
  sifreKuralHatasi,
  sifreOzetle,
  tumOturumlariKapat,
} from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/** Sifirlama jetonuyla yeni sifreyi belirler. */
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'musteri-sifre-uygula', 10, 3600);
  if (sinir) return sinir;

  try {
    const govde: { jeton?: string; sifre?: string } = await req.json();
    const jeton = (govde.jeton ?? '').trim();
    const sifre = govde.sifre ?? '';

    if (!jeton) {
      return NextResponse.json({ error: 'Sıfırlama bağlantısı geçersiz' }, { status: 400 });
    }

    const sifreHatasi = sifreKuralHatasi(sifre);
    if (sifreHatasi) {
      return NextResponse.json({ error: sifreHatasi }, { status: 400 });
    }

    const sonuc = await jetonuKullan(jeton, 'SIFRE_SIFIRLAMA');
    if (!sonuc) {
      return NextResponse.json(
        { error: 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeni bir sıfırlama bağlantısı isteyin.' },
        { status: 400 }
      );
    }

    await prisma.customer.update({
      where: { id: sonuc.customerId },
      data: { passwordHash: await sifreOzetle(sifre) },
    });

    /**
     * Sifre degisince BUTUN oturumlar kapatiliyor.
     *
     * Sifreyi sifirlamanin yaygin sebebi hesabin baskasinin eline gectigi
     * suphesidir. Eski oturumlar acik kalsaydi sifre degistirmek o kisiyi
     * disari atmazdi.
     */
    await tumOturumlariKapat(sonuc.customerId);

    // Kullanici yeni sifresiyle bu cihazda oturumu acik bulsun; sifirlamadan
    // hemen sonra bir de giris yapmak zorunda kalmasin.
    const { ip, userAgent } = istekBilgisi(req);
    await oturumAc(sonuc.customerId, { ip, userAgent });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json({ error: 'Şifre güncellenemedi, lütfen tekrar deneyin' }, { status: 500 });
  }
}
