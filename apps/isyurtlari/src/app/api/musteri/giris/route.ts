import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniri, hizSiniriGuard, istemciAdresi } from '@/lib/hiz-siniri';
import {
  epostaNormalize,
  istekBilgisi,
  oturumAc,
  oturumlariTemizle,
  sifreDogrula,
} from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Hesap yokken de sifre dogrulamasi calistirmak icin kullanilan sabit ozet.
 *
 * Kayitli olmayan bir e-posta icin hemen donseydik, yanit suresi kayitli ve
 * kayitsiz e-postalar arasinda gozle gorulur bicimde farklilasir ve hangi
 * adreslerin sistemde oldugu disaridan olculebilirdi. Bu ozet gecerli bir
 * scrypt ciktisi; icerigi onemsiz, amaci ayni hesaplama maliyetini
 * odemek.
 */
const SAHTE_OZET =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export async function POST(req: NextRequest) {
  // Adres bazli sinir: ayni adresten 15 dakikada 10 deneme.
  const sinir = await hizSiniriGuard(req, 'musteri-giris', 10, 900);
  if (sinir) return sinir;

  try {
    const govde: { eposta?: string; sifre?: string } = await req.json();
    const eposta = epostaNormalize(govde.eposta ?? '');
    const sifre = govde.sifre ?? '';

    if (!eposta || !sifre) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 });
    }

    /**
     * Hesap bazli sinir.
     *
     * Adres sinir tek basina yetmiyor: bir sifreyi binlerce adresten deneyen
     * saldiri (password spraying) her adreste sinirin altinda kalir ama tek
     * hesabi zorlar. Bu sayac hesabin kendisini koruyor: saatte 20 deneme.
     */
    const hesapSiniri = await hizSiniri(`musteri-giris-hesap:${eposta}`, 20, 3600);
    if (hesapSiniri.asildi) {
      return NextResponse.json(
        { error: 'Bu hesap için çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const musteri = await prisma.customer.findUnique({
      where: { email: eposta },
      select: { id: true, email: true, name: true, phone: true, emailVerified: true, passwordHash: true, status: true },
    });

    const dogru = await sifreDogrula(sifre, musteri?.passwordHash ?? SAHTE_OZET);

    // Hangisinin yanlis oldugu soylenmiyor: "e-posta bulunamadi" demek,
    // hangi adreslerin kayitli oldugunu disariya acar.
    if (!musteri || !dogru) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });
    }

    if (musteri.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bu hesap askıya alınmış. Lütfen bizimle iletişime geçin.' },
        { status: 403 }
      );
    }

    const { ip, userAgent } = istekBilgisi(req);
    await oturumAc(musteri.id, { ip: ip ?? istemciAdresi(req), userAgent });

    await prisma.customer
      .update({ where: { id: musteri.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {
        // Son giris damgasi yazilamazsa oturum yine acilmis olur.
      });

    await oturumlariTemizle();

    const { passwordHash: _ozet, status: _durum, ...acikMusteri } = musteri;
    return NextResponse.json({ musteri: acikMusteri });
  } catch (error) {
    console.error('Müşteri girişi hatası:', error);
    return NextResponse.json({ error: 'Giriş yapılamadı, lütfen tekrar deneyin' }, { status: 500 });
  }
}
