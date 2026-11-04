import { NextRequest, NextResponse } from 'next/server';
import { yorumIstekleriniGonder } from '@/lib/yorum-istegi';
import { isAdminRequest } from '@/lib/admin-auth';
import { epostaTabanAdresi } from '@/lib/musteri-eposta';

export const dynamic = 'force-dynamic';
/** E-posta göndermek zaman alabiliyor; varsayılan 10 saniye yetmez. */
export const maxDuration = 60;

/**
 * Zamanlanmış görev: teslimden 5 gün sonra yorum isteği e-postası.
 *
 * ─── KİM ÇAĞIRABİLİR ──────────────────────────────────────────────────
 *
 * Bu uç müşterilere e-posta gönderiyor; herkese açık olamaz (terk edilmiş
 * sepet görevindeki kuralların aynısı):
 *
 *  - Vercel Cron: `Authorization: Bearer $CRON_SECRET`. CRON_SECRET tanımlı
 *    değilse uç KAPALI kalır.
 *  - Yönetici oturumu: panelden elle tetikleme ve kuru çalışma için.
 *
 * `?kuru=1` hiçbir e-posta göndermeden, kayıt yazmadan kaç siparişin uygun
 * olduğunu ve elemelerin nerede daraldığını döner. Zaman penceresi
 * (5-14 gün) sorgu parametresiyle DEĞİŞTİRİLEMEZ: kuralı devre dışı bırakmanın
 * bir yolu olmasın.
 */
export async function GET(req: NextRequest) {
  const gizli = process.env.CRON_SECRET;
  const baslik = req.headers.get('authorization');
  const cronYetkili = Boolean(gizli) && baslik === `Bearer ${gizli}`;

  if (!cronYetkili && !isAdminRequest(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const kuru = req.nextUrl.searchParams.get('kuru') === '1';

  try {
    const sonuc = await yorumIstekleriniGonder(epostaTabanAdresi(req), kuru);
    return NextResponse.json({ ok: true, kuruCalisma: kuru, ...sonuc });
  } catch (error) {
    console.error('Yorum isteği görevi başarısız:', error);
    return NextResponse.json({ error: 'Görev tamamlanamadı' }, { status: 500 });
  }
}
