import { NextRequest, NextResponse } from 'next/server';
import { terkEdilmisSepetleriHatirlat } from '@/lib/terk-edilmis-sepet';
import { isAdminRequest } from '@/lib/admin-auth';
import { epostaTabanAdresi } from '@/lib/musteri-eposta';

export const dynamic = 'force-dynamic';
/** E-posta göndermek zaman alabiliyor; varsayılan 10 saniye yetmez. */
export const maxDuration = 60;

/**
 * Zamanlanmış görev: terk edilmiş sepet hatırlatması.
 *
 * ─── KİM ÇAĞIRABİLİR ──────────────────────────────────────────────────
 *
 * Bu uç müşterilere e-posta gönderiyor; herkese açık olamaz. İki yol var:
 *
 *  - Vercel Cron. İsteğe `Authorization: Bearer $CRON_SECRET` başlığını
 *    ekliyor. CRON_SECRET tanımlı değilse uç KAPALI: "tanımlı değilse
 *    herkese açık" varsayılanı, ortam değişkeni unutulduğunda kimsenin
 *    fark etmeyeceği bir açık kapı bırakırdı.
 *  - Yönetici oturumu. Panelden elle tetiklemek ve kuru çalışma yapmak
 *    için.
 *
 * `?kuru=1` hiçbir e-posta göndermeden kaç sepetin uygun olduğunu döner -
 * kuralları canlıda gerçek e-posta atmadan denemek için.
 */
export async function GET(req: NextRequest) {
  const gizli = process.env.CRON_SECRET;
  const baslik = req.headers.get('authorization');
  const cronYetkili = Boolean(gizli) && baslik === `Bearer ${gizli}`;

  if (!cronYetkili && !isAdminRequest(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const kuru = req.nextUrl.searchParams.get('kuru') === '1';

  /**
   * Bekleme penceresi yalnızca kuru çalışmada değiştirilebiliyor. Gerçek
   * gönderimde serbest bırakılsaydı, "sepete son dokunuştan 6 saat sonra"
   * kuralı bir sorgu parametresiyle devre dışı kalırdı.
   */
  const saatHam = Number(req.nextUrl.searchParams.get('saat'));
  const saat = kuru && Number.isFinite(saatHam) && saatHam >= 0 ? saatHam : undefined;

  try {
    const sonuc = await terkEdilmisSepetleriHatirlat(epostaTabanAdresi(req), kuru, saat);
    return NextResponse.json({ ok: true, kuruCalisma: kuru, ...sonuc });
  } catch (error) {
    console.error('Terk edilmiş sepet görevi başarısız:', error);
    return NextResponse.json({ error: 'Görev tamamlanamadı' }, { status: 500 });
  }
}
