import { NextResponse } from 'next/server';
import { oturumdakiMusteri } from '@/lib/musteri-auth';

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
  return NextResponse.json({ musteri });
}
