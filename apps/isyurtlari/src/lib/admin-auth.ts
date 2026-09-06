import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * ─── URETIMDE VARSAYILAN ANAHTAR KULLANILMIYOR ────────────────────────
 *
 * Burada `process.env.JWT_SECRET || 'dev-secret-key-change-in-production'`
 * yaziyordu. Degisken uretimde tanimsiz kalsaydi - Vercel'de silinse,
 * yanlis yazilsa ya da bir preview ortaminda eksik olsa - uygulama
 * hatasiz acilir ve imza anahtari kaynak kodda yazan, herkesin
 * gorebilecegi bu sabit dize olurdu. O durumda tek satirlik bir jetonla,
 * parolasiz, OTP'siz ve iz birakmadan yonetici olunabilirdi.
 *
 * Artik uretimde degisken yoksa anahtar YOK sayiliyor ve her yonetici
 * istegi reddediliyor. Sessizce zayif bir anahtara dusmektense kapali
 * kalmak dogru: eksik yapilandirma fark edilir, sessiz acik kapi
 * edilmez.
 */
const GELISTIRME_ANAHTARI = 'dev-secret-key-change-in-production';

function jwtAnahtari(): string | null {
  const anahtar = process.env.JWT_SECRET;
  if (anahtar) return anahtar;
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET tanımlı değil: yönetici erişimi kapatıldı.');
    return null;
  }
  return GELISTIRME_ANAHTARI;
}

/**
 * /api/admin/* uçlarında admin oturumunu doğrular.
 *
 * middleware.ts yalnızca /admin/* sayfalarını koruyor; API uçları kapsam dışı.
 * Bu yüzden hassas API uçlarının kendi kontrolünü yapması gerekiyor.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return false;

  const anahtar = jwtAnahtari();
  if (!anahtar) return false;

  try {
    const payload = jwt.verify(token, anahtar);
    return typeof payload === 'object' && payload !== null && (payload as any).admin === true;
  } catch {
    return false;
  }
}

/** Yetkisiz istekler icin ortak 401 yaniti. */
export function yetkisiz() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}

/**
 * Korumali admin uclarinin basinda cagrilir.
 * Yetki yoksa hazir 401 yanitini, varsa null dondurur:
 *
 *   const red = adminGuard(req);
 *   if (red) return red;
 */
export function adminGuard(req: NextRequest) {
  return isAdminRequest(req) ? null : yetkisiz();
}

/**
 * Oturumdaki yöneticinin e-postası.
 *
 * Denetim günlüğü "kim" sorusunu cevaplayabilmeli. Kayıtlar önceden
 * sabit "admin" dizesiyle yazılıyordu; jeton zaten e-postayı taşıyor
 * (bkz. api/admin/otp-verify), okumamak için bir sebep yok.
 *
 * Jeton yoksa ya da geçersizse null döner - çağıran taraf bunu
 * "bilinmeyen" olarak yazar. Yetki kontrolü bu işlevin görevi değil;
 * onun için adminGuard var.
 */
export function adminEpostasi(req: NextRequest): string | null {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return null;

  const anahtar = jwtAnahtari();
  if (!anahtar) return null;

  try {
    const payload = jwt.verify(token, anahtar);
    if (typeof payload !== 'object' || payload === null) return null;
    const eposta = (payload as { email?: unknown }).email;
    return typeof eposta === 'string' && eposta ? eposta : null;
  } catch {
    return null;
  }
}
