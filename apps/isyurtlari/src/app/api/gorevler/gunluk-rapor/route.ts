import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isAdminRequest } from '@/lib/admin-auth';
import { gunlukRaporMetniOlustur } from '@/lib/gunluk-rapor';
import { gunlukVeriTopla } from '@/lib/gunluk-rapor-veri';
import { merchantTaniGetir } from '@/lib/merchant-fiyat-raporu';

export const dynamic = 'force-dynamic';
/** Üç dış kaynak sırayla çağrılıyor; varsayılan süre yetmeyebilir. */
export const maxDuration = 120;

const VARSAYILAN_ALICI = 'halil.kosger@gmail.com';

/**
 * Zamanlanmış görev: dünün günlük yönetim raporu e-postası.
 *
 * ─── KİM ÇAĞIRABİLİR ──────────────────────────────────────────────────
 *
 *  - Vercel Cron: `Authorization: Bearer $CRON_SECRET`. CRON_SECRET
 *    tanımlı değilse uç KAPALI kalır.
 *  - Yönetici oturumu: panelden elle tetikleme ve kuru çalıştırma için.
 *
 * `?kuru=1` e-posta göndermeden raporu JSON olarak döner.
 */
export async function GET(req: NextRequest) {
  const gizli = process.env.CRON_SECRET;
  const baslik = req.headers.get('authorization');
  const cronYetkili = Boolean(gizli) && baslik === `Bearer ${gizli}`;

  if (!cronYetkili && !isAdminRequest(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  if (req.nextUrl.searchParams.get('tani') === '1') {
    // Geçici tanı: Merchant kimlik doğrulamasını basit bir raporla dener.
    return NextResponse.json(await merchantTaniGetir());
  }

  try {
    const { veri, uyarilar } = await gunlukVeriTopla();
    const metin = gunlukRaporMetniOlustur(veri);
    const govde = uyarilar.length > 0 ? `${metin}\n\nVeri uyarıları:\n${uyarilar.map((u) => `- ${u}`).join('\n')}` : metin;

    if (req.nextUrl.searchParams.get('kuru') === '1') {
      return NextResponse.json({ metin: govde, uyarilar });
    }

    const anahtar = process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY;
    if (!anahtar) {
      return NextResponse.json({ error: 'E-posta sağlayıcısı yapılandırılmamış' }, { status: 503 });
    }

    const sonuc = await new Resend(anahtar).emails.send({
      from: 'info@isyurtlari.com.tr',
      to: process.env.GUNLUK_RAPOR_ALICI || VARSAYILAN_ALICI,
      subject: `Günlük Rapor — ${veri.etiket}`,
      text: govde,
    });

    if (sonuc.error) {
      console.error('Günlük rapor e-postası gönderilemedi:', sonuc.error);
      return NextResponse.json({ error: 'E-posta gönderilemedi', uyarilar }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: sonuc.data?.id, uyarilar });
  } catch (error) {
    console.error('Günlük rapor hatası:', error);
    return NextResponse.json({ error: 'Rapor üretilemedi' }, { status: 500 });
  }
}
