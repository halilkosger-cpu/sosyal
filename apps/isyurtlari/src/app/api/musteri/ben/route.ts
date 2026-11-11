import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { oturumdakiMusteri, ipucuCereziniYaz, MUSTERI_IPUCU_CEREZI } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Oturumdaki musteri.
 *
 * Giris yoksa 401 degil, `{ musteri: null }` donuyor: bu uc her sayfada
 * "giris yapilmis mi" sorusunu cevaplamak icin cagriliyor ve giris yapmamis
 * olmak bir hata degil. 401 donseydi tarayici konsolu her ziyarette hata
 * gosterirdi.
 */
export async function GET() {
  const musteri = await oturumdakiMusteri();
  // Ipucu cerezi eklenmeden once acilmis oturumlar da bir sonraki ziyarette taninsin.
  if (musteri && !(await cookies()).get(MUSTERI_IPUCU_CEREZI)) {
    await ipucuCereziniYaz(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }
  return NextResponse.json({ musteri });
}
