import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { epostaGecerli, epostaNormalize, tekKullanimlikJeton } from '@/lib/musteri-auth';
import { epostaTabanAdresi, sifirlamaEpostasiGonder } from '@/lib/musteri-eposta';

export const dynamic = 'force-dynamic';

/**
 * Sifre sifirlama baglantisi ister.
 *
 * Hesap olsa da olmasa da AYNI yaniti donuyor. Aksi halde bu uc, herhangi
 * bir e-postanin sitede kayitli olup olmadigini sorabilecegi bir arac haline
 * gelirdi - kayit ucundan farkli olarak burada kullaniciyi cikmaza sokan bir
 * durum da yok: "baglanti gonderildi" mesaji her iki durumda dogru davranisi
 * anlatiyor.
 */
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'musteri-sifre-sifirla', 5, 3600);
  if (sinir) return sinir;

  const basariliYanit = NextResponse.json({
    ok: true,
    mesaj: 'Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.',
  });

  try {
    const govde: { eposta?: string } = await req.json();
    const eposta = epostaNormalize(govde.eposta ?? '');

    if (!epostaGecerli(eposta)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }

    const musteri = await prisma.customer.findUnique({
      where: { email: eposta },
      select: { id: true, name: true, email: true, status: true },
    });

    if (musteri && musteri.status === 'ACTIVE') {
      const jeton = await tekKullanimlikJeton(musteri.id, 'SIFRE_SIFIRLAMA', 60);
      await sifirlamaEpostasiGonder(musteri.email, musteri.name, jeton, epostaTabanAdresi(req));
    }

    return basariliYanit;
  } catch (error) {
    console.error('Şifre sıfırlama isteği hatası:', error);
    // Hata durumunda bile ayni yanit: yanitin sekli hesabin varligini
    // ele vermemeli.
    return basariliYanit;
  }
}
