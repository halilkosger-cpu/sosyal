import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import {
  epostaGecerli,
  epostaNormalize,
  istekBilgisi,
  oturumAc,
  oturumlariTemizle,
  sifreKuralHatasi,
  sifreOzetle,
  tekKullanimlikJeton,
} from '@/lib/musteri-auth';
import { dogrulamaEpostasiGonder, epostaTabanAdresi } from '@/lib/musteri-eposta';

export const dynamic = 'force-dynamic';

interface KayitIstegi {
  ad?: string;
  eposta?: string;
  sifre?: string;
  telefon?: string;
  /** KVKK aydinlatma metni onayi. Zorunlu. */
  kvkkOnayi?: boolean;
  /** Ticari elektronik ileti izni. Istege bagli. */
  iletiIzni?: boolean;
}

export async function POST(req: NextRequest) {
  // Ayni adresten saatte 5 kayit. Kayit ucu e-posta gonderiyor ve kalici
  // kayit olusturuyor; sinirsiz birakilirsa hem e-posta kotasi tukenir hem
  // tablo sahte hesaplarla dolar.
  const sinir = await hizSiniriGuard(req, 'musteri-kayit', 5, 3600);
  if (sinir) return sinir;

  try {
    const govde: KayitIstegi = await req.json();
    // Not: govde ad, e-posta, telefon ve sifre iceriyor; gunluge basilmiyor.

    const ad = (govde.ad ?? '').trim();
    const eposta = epostaNormalize(govde.eposta ?? '');
    const sifre = govde.sifre ?? '';
    const telefon = (govde.telefon ?? '').trim() || null;

    if (ad.length < 2) {
      return NextResponse.json({ error: 'Ad soyad en az 2 karakter olmalı' }, { status: 400 });
    }
    if (!epostaGecerli(eposta)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }

    const sifreHatasi = sifreKuralHatasi(sifre);
    if (sifreHatasi) {
      return NextResponse.json({ error: sifreHatasi }, { status: 400 });
    }

    // KVKK aydinlatma onayi olmadan kisisel veri islenmiyor: onay alani
    // veritabaninda zorunlu, bu yuzden burada da zorunlu.
    if (govde.kvkkOnayi !== true) {
      return NextResponse.json(
        { error: 'Devam etmek için KVKK aydınlatma metnini onaylamanız gerekiyor' },
        { status: 400 }
      );
    }

    const mevcut = await prisma.customer.findUnique({ where: { email: eposta }, select: { id: true } });
    if (mevcut) {
      // Hesabin varligi burada gizlenmiyor: kayit formunda "bir sey ters
      // gitti" demek kullaniciyi cikmaza sokar. Kotuye kullanimi hiz siniri
      // dengeliyor.
      return NextResponse.json(
        { error: 'Bu e-posta ile kayıtlı bir hesap var. Giriş yapabilir ya da şifrenizi sıfırlayabilirsiniz.' },
        { status: 409 }
      );
    }

    const simdi = new Date();
    const musteri = await prisma.customer.create({
      data: {
        email: eposta,
        name: ad,
        phone: telefon,
        passwordHash: await sifreOzetle(sifre),
        kvkkOnayAt: simdi,
        iletiIzniAt: govde.iletiIzni === true ? simdi : null,
      },
      select: { id: true, email: true, name: true, phone: true, emailVerified: true },
    });

    // Dogrulama e-postasi gonderiliyor ama alisveris icin sart degil: musteri
    // hemen giris yapmis sayiliyor. Dogrulama, e-posta degistirme gibi hassas
    // islemler icin aranacak.
    const jeton = await tekKullanimlikJeton(musteri.id, 'EMAIL_DOGRULAMA', 24 * 60);
    await dogrulamaEpostasiGonder(musteri.email, musteri.name, jeton, epostaTabanAdresi(req));

    const { ip, userAgent } = istekBilgisi(req);
    await oturumAc(musteri.id, { ip, userAgent });
    await oturumlariTemizle();

    return NextResponse.json({ musteri }, { status: 201 });
  } catch (error) {
    console.error('Müşteri kaydı hatası:', error);
    return NextResponse.json({ error: 'Hesap oluşturulamadı, lütfen tekrar deneyin' }, { status: 500 });
  }
}
