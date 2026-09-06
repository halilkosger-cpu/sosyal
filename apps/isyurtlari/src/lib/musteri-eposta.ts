import { Resend } from 'resend';
import type { NextRequest } from 'next/server';
import { SITE_URL } from '@/lib/seo';

/**
 * Musteri hesabi e-postalari.
 *
 * Gonderim basarisiz olursa cagiran islem BOZULMUYOR: kayit acilir, sifre
 * sifirlama istegi alinir, yalnizca e-posta gitmez. Siparis ucu de ayni
 * yaklasimi kullaniyor - e-posta saglayicisinin kotasi dolduğunda musteri
 * hesabini acamamasi kabul edilebilir bir davranis degil.
 *
 * API anahtari tanimli degilse (yerel gelistirme) baglanti gunluge yaziliyor
 * ki akis elle denenebilsin.
 */

const GONDERICI = 'info@isyurtlari.com.tr';

/** SITE_URL'in kanonik alan adi; asagidaki izin listesinin cekirdegi. */
const KANONIK_HOST = new URL(SITE_URL).host;

const yerelMi = (host: string) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);

/**
 * E-posta baglantilarinin taban adresi.
 *
 * ─── NEDEN SITE_URL DOGRUDAN KULLANILMIYOR ────────────────────────────
 *
 * SITE_URL bilerek sabit: kanonik adres, arama motoru icin tek dogru
 * cevap olmali (bkz. lib/seo.ts'teki aciklama). Ama e-posta baglantisi
 * SEO degil, kullanicinin tikladigi yer: yerelde calisirken dogrulama
 * baglantisi canli siteye gidiyor ve akis hic denenemiyordu. Bu yuzden
 * baglanti istegin geldigi adresten uretiliyor, SITE_URL yalnizca yedek.
 *
 * ─── NEDEN HOST BASLIGINA KORU KORUNE GUVENILMIYOR ────────────────────
 *
 * Baglantiyi dogrudan Host basligindan kursaydik, sifre sifirlama
 * istegini sahte bir Host ile gonderen biri kurbanin gelen kutusuna
 * GECERLI bir sifirlama jetonu tasiyan ama kendi sunucusuna giden bir
 * baglanti dusurebilirdi; kurban tikladigi anda hesabi ele gecerdi.
 * (Host header injection.) Bu yuzden yalnizca beklenen adresler kabul
 * ediliyor: yerel gelistirme, kanonik alan adi ve Vercel onizleme
 * dagitimlari. Baska her sey SITE_URL'e dusuyor.
 */
export function epostaTabanAdresi(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return SITE_URL;

  if (yerelMi(host)) {
    return `${req.headers.get('x-forwarded-proto') || 'http'}://${host}`;
  }

  const izinli =
    host === KANONIK_HOST ||
    host === `www.${KANONIK_HOST}` ||
    host.endsWith('.vercel.app');

  return izinli ? `https://${host}` : SITE_URL;
}

function resendIstemcisi(): Resend | null {
  const anahtar = process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY;
  return anahtar ? new Resend(anahtar) : null;
}

function kalip(baslik: string, govde: string, dugmeMetni: string, baglanti: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937;">
    <h2 style="color:#CC4E00;font-size:20px;margin:0 0 16px;">${baslik}</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${govde}</p>
    <p style="margin:0 0 24px;">
      <a href="${baglanti}" style="display:inline-block;background:#CC4E00;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">${dugmeMetni}</a>
    </p>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 8px;">
      Düğme çalışmazsa bu adresi tarayıcınıza yapıştırabilirsiniz:<br>
      <span style="word-break:break-all;">${baglanti}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
      Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; hesabınızda hiçbir değişiklik olmaz.
      <br>isyurtlari.com.tr
    </p>
  </div>`;
}

export async function dogrulamaEpostasiGonder(
  eposta: string,
  ad: string,
  jeton: string,
  tabanAdresi: string
): Promise<void> {
  const baglanti = `${tabanAdresi}/eposta-dogrula?jeton=${encodeURIComponent(jeton)}`;
  const resend = resendIstemcisi();

  if (!resend) {
    console.log(`[musteri] E-posta doğrulama bağlantısı (${eposta}): ${baglanti}`);
    return;
  }

  try {
    await resend.emails.send({
      from: GONDERICI,
      to: eposta,
      subject: 'E-posta adresinizi doğrulayın',
      html: kalip(
        `Hoş geldiniz, ${ad}`,
        'Hesabınızı oluşturduğunuz için teşekkürler. E-posta adresinizi doğrulamak için aşağıdaki düğmeye tıklayın. Bağlantı 24 saat geçerlidir.',
        'E-postamı doğrula',
        baglanti
      ),
    });
  } catch (error) {
    console.error('Doğrulama e-postası gönderilemedi:', error);
  }
}

export async function sifirlamaEpostasiGonder(
  eposta: string,
  ad: string,
  jeton: string,
  tabanAdresi: string
): Promise<void> {
  const baglanti = `${tabanAdresi}/sifre-sifirla?jeton=${encodeURIComponent(jeton)}`;
  const resend = resendIstemcisi();

  if (!resend) {
    console.log(`[musteri] Şifre sıfırlama bağlantısı (${eposta}): ${baglanti}`);
    return;
  }

  try {
    await resend.emails.send({
      from: GONDERICI,
      to: eposta,
      subject: 'Şifre sıfırlama isteği',
      html: kalip(
        `Merhaba ${ad}`,
        'Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın. Bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.',
        'Şifremi sıfırla',
        baglanti
      ),
    });
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderilemedi:', error);
  }
}
