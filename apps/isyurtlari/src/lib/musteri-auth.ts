import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';

/**
 * Magaza musterisi kimlik dogrulamasi.
 *
 * ─── NEDEN JWT DEGIL ───────────────────────────────────────────────────
 *
 * Yonetici girisi JWT kullaniyor (lib/admin-auth.ts). Musteri tarafi icin
 * veritabaninda tutulan opak jeton tercih edildi:
 *
 *  - Iptal edilebiliyor. Sifre degistiginde butun oturumlar kapatilabiliyor,
 *    musteri "diger cihazlardan cikis yap" diyebiliyor. JWT'de bunun karsiligi
 *    yok; jeton suresi dolana kadar gecerli kaliyor.
 *  - Yeni bagimlilik gerektirmiyor. jsonwebtoken paketi uygulamanin
 *    package.json'inda yazili degil (tek kaynagi calisma anindaki hoisting);
 *    musteri girisini oraya yaslamak istemedik.
 *
 * Jetonun kendisi degil SHA-256 ozeti saklaniyor - OtpKodu ile ayni kural:
 * veritabani okunsa bile yururlukteki oturumlar ele gecmesin.
 *
 * ─── NEDEN SCRYPT ──────────────────────────────────────────────────────
 *
 * Sifre ozeti icin bcrypt/argon2 yerine Node'un yerlesik scrypt'i
 * kullaniliyor: yeni bir paket kurulmasi gerekmiyor, sunucusuz ortamda
 * sorunsuz calisiyor ve OWASP'in kabul ettigi bir algoritma.
 *
 * ─── MIDDLEWARE ILE ILISKISI ───────────────────────────────────────────
 *
 * middleware.ts Edge calisma zamaninda; orada ne crypto ne prisma var.
 * Bu yuzden middleware yalnizca cerezin VARLIGINA bakip yonlendirme yapar,
 * gecerliligini burasi dogrular. Korunmasi gereken her uc musteriGuard()
 * cagirmak zorunda - middleware tek basina yeterli degil.
 */

const scrypt = promisify(scryptCb) as (
  parola: string | Buffer,
  tuz: string | Buffer,
  uzunluk: number,
  secenekler?: { N?: number; r?: number; p?: number; maxmem?: number }
) => Promise<Buffer>;

export const OTURUM_CEREZI = 'musteri-oturum';

/** Oturum suresi: 30 gun. Her kullanimda kayarak uzuyor. */
const OTURUM_SURESI_MS = 30 * 24 * 60 * 60 * 1000;

/** Son gorulme bu esikten eskiyse oturum suresi tazeleniyor (yazma yuku icin). */
const TAZELEME_ESIGI_MS = 24 * 60 * 60 * 1000;

/** scrypt parametreleri. Degistirilirse eski ozetler yine dogrulanir: ozet kendi parametrelerini tasiyor. */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const OZET_UZUNLUGU = 32;

// ─── SIFRE ────────────────────────────────────────────────────────────

/** Sifreyi scrypt ile ozetler. Sonuc kendi parametrelerini ve tuzunu tasir. */
export async function sifreOzetle(sifre: string): Promise<string> {
  const tuz = randomBytes(16);
  const ozet = await scrypt(sifre.normalize('NFKC'), tuz, OZET_UZUNLUGU, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${tuz.toString('base64')}$${ozet.toString('base64')}`;
}

/**
 * Sifreyi ozete karsi dogrular.
 *
 * Karsilastirma timingSafeEqual ile: normal === karsilastirmasi ilk farkli
 * baytta durur ve gecen sure uzerinden ozet hakkinda bilgi sizdirir.
 */
export async function sifreDogrula(sifre: string, kayitliOzet: string): Promise<boolean> {
  try {
    const parcalar = kayitliOzet.split('$');
    if (parcalar.length !== 6 || parcalar[0] !== 'scrypt') return false;

    const [, n, r, p, tuzB64, ozetB64] = parcalar;
    const beklenen = Buffer.from(ozetB64, 'base64');

    const uretilen = await scrypt(sifre.normalize('NFKC'), Buffer.from(tuzB64, 'base64'), beklenen.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });

    if (uretilen.length !== beklenen.length) return false;
    return timingSafeEqual(uretilen, beklenen);
  } catch {
    return false;
  }
}

/**
 * Sifre kurallari.
 *
 * Kasitli olarak sade: uzunluk her seyden onemli, karmasik karakter zorunlulugu
 * kullanicilari tahmin edilebilir kaliplara ("Sifre123!") itiyor.
 */
export function sifreKuralHatasi(sifre: string): string | null {
  if (sifre.length < 8) return 'Şifre en az 8 karakter olmalı';
  if (sifre.length > 200) return 'Şifre en fazla 200 karakter olabilir';
  if (!/[^\s]/.test(sifre)) return 'Şifre yalnızca boşluk olamaz';
  return null;
}

/** Kaba e-posta bicim kontrolu. Gercek dogrulama e-posta gondererek yapiliyor. */
export function epostaGecerli(eposta: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta);
}

/** E-postayi tek bicime indirger: kayit ve giris ayni anahtari uretsin. */
export function epostaNormalize(eposta: string): string {
  return eposta.trim().toLowerCase();
}

// ─── OTURUM ───────────────────────────────────────────────────────────

const jetonOzeti = (jeton: string) => createHash('sha256').update(jeton).digest('hex');

/**
 * Yeni oturum acar, cerezi yazar.
 *
 * Yalnizca Route Handler ve Server Action icinden cagrilabilir: cookies().set
 * baska yerde calismaz.
 */
export async function oturumAc(
  customerId: string,
  istek?: { userAgent?: string | null; ip?: string | null }
): Promise<void> {
  const jeton = randomBytes(32).toString('base64url');
  const sonKullanma = new Date(Date.now() + OTURUM_SURESI_MS);

  await prisma.customerSession.create({
    data: {
      customerId,
      tokenHash: jetonOzeti(jeton),
      expiresAt: sonKullanma,
      userAgent: istek?.userAgent?.slice(0, 500) ?? null,
      ip: istek?.ip ?? null,
    },
  });

  cookies().set(OTURUM_CEREZI, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: sonKullanma,
  });
}

export interface OturumdakiMusteri {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerified: Date | null;
  /** Ticari elektronik ileti izninin verildigi an. */
  iletiIzniAt: Date | null;
  /** Iznin geri alindigi an. Izinden yeniyse izin gecersizdir. */
  iletiRetAt: Date | null;
}

/**
 * Cerezdeki oturumu dogrular ve musteriyi dondurur; oturum yoksa null.
 *
 * Suresi gecmis ya da askiya alinmis hesaba ait oturumlar gecersiz sayilir.
 * Oturum son 24 saatte kullanilmadiysa suresi kayarak uzatiliyor - her
 * istekte yazmak, cok ziyaretci alan bir sitede gereksiz veritabani yuku.
 */
export async function oturumdakiMusteri(): Promise<OturumdakiMusteri | null> {
  const jeton = cookies().get(OTURUM_CEREZI)?.value;
  if (!jeton) return null;

  try {
    const oturum = await prisma.customerSession.findUnique({
      where: { tokenHash: jetonOzeti(jeton) },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            emailVerified: true,
            status: true,
            // Hesap sayfasindaki tanitim e-postasi tercihi bu alanlari okuyor.
            iletiIzniAt: true,
            iletiRetAt: true,
          },
        },
      },
    });

    if (!oturum) return null;
    if (oturum.expiresAt.getTime() < Date.now()) return null;
    if (oturum.customer.status !== 'ACTIVE') return null;

    if (Date.now() - oturum.lastSeenAt.getTime() > TAZELEME_ESIGI_MS) {
      await prisma.customerSession.update({
        where: { id: oturum.id },
        data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + OTURUM_SURESI_MS) },
      }).catch(() => {
        // Tazeleme basarisiz olursa oturum yine gecerli; sessiz gecilir.
      });
    }

    const { status: _status, ...musteri } = oturum.customer;
    return musteri;
  } catch (error) {
    // Veritabanina ulasilamiyorsa musteri "giris yapmamis" sayilir; sayfa
    // acilmaya devam eder.
    console.error('Oturum okunamadi:', error);
    return null;
  }
}

/** Bu cihazdaki oturumu kapatir. */
export async function oturumKapat(): Promise<void> {
  const jeton = cookies().get(OTURUM_CEREZI)?.value;
  cookies().delete(OTURUM_CEREZI);
  if (!jeton) return;

  await prisma.customerSession
    .deleteMany({ where: { tokenHash: jetonOzeti(jeton) } })
    .catch(() => {
      // Cerez zaten silindi; kayit kalsa da suresi dolunca temizlenir.
    });
}

/** Musterinin butun oturumlarini kapatir (sifre degisikligi, "her yerden cik"). */
export async function tumOturumlariKapat(customerId: string): Promise<void> {
  await prisma.customerSession.deleteMany({ where: { customerId } });
}

/**
 * Suresi gecmis oturum ve jetonlari siler.
 *
 * hiz-siniri.ts'teki sayaclariTemizle ile ayni kalip: her istekte calistirmak
 * gereksiz yuk, cagiran uclar dusuk olasilikla tetikliyor.
 */
export async function oturumlariTemizle(olasilik = 0.02): Promise<void> {
  if (Math.random() > olasilik) return;
  const simdi = new Date();
  try {
    await prisma.customerSession.deleteMany({ where: { expiresAt: { lt: simdi } } });
    await prisma.customerToken.deleteMany({ where: { expiresAt: { lt: simdi } } });
  } catch {
    // Temizlik basarisiz olursa islevsel bir etkisi yok.
  }
}

// ─── UC KORUMASI ──────────────────────────────────────────────────────

/** Yetkisiz musteri istekleri icin ortak 401 yaniti. */
export function girisGerekli() {
  return NextResponse.json({ error: 'Bu işlem için giriş yapmalısınız' }, { status: 401 });
}

/**
 * Korumali musteri uclarinin basinda cagrilir. adminGuard ile ayni kalip:
 *
 *   const musteri = await musteriGuard();
 *   if (!('id' in musteri)) return musteri;   // 401 yaniti
 */
export async function musteriGuard(): Promise<OturumdakiMusteri | NextResponse> {
  const musteri = await oturumdakiMusteri();
  return musteri ?? girisGerekli();
}

// ─── TEK KULLANIMLIK JETON ────────────────────────────────────────────

/**
 * E-posta dogrulama / sifre sifirlama jetonu uretir.
 * Dondurulen ham jeton yalnizca e-posta baglantisina konur; veritabaninda
 * ozeti durur.
 */
export async function tekKullanimlikJeton(
  customerId: string,
  type: 'EMAIL_DOGRULAMA' | 'SIFRE_SIFIRLAMA',
  gecerlilikDakika: number
): Promise<string> {
  const jeton = randomBytes(32).toString('base64url');

  // Ayni turden bekleyen eski jetonlar gecersiz kalsin: sifirlama baglantisi
  // isteyip vazgecen birinin eski baglantisi hala calisiyor olmamali.
  await prisma.customerToken.deleteMany({ where: { customerId, type, usedAt: null } });

  await prisma.customerToken.create({
    data: {
      customerId,
      type,
      tokenHash: jetonOzeti(jeton),
      expiresAt: new Date(Date.now() + gecerlilikDakika * 60 * 1000),
    },
  });

  return jeton;
}

/** Jetonu dogrular ve kullanilmis isaretler. Gecersizse null doner. */
export async function jetonuKullan(
  jeton: string,
  type: 'EMAIL_DOGRULAMA' | 'SIFRE_SIFIRLAMA'
): Promise<{ customerId: string } | null> {
  try {
    const kayit = await prisma.customerToken.findUnique({
      where: { tokenHash: jetonOzeti(jeton) },
    });

    if (!kayit) return null;
    if (kayit.type !== type) return null;
    if (kayit.usedAt) return null;
    if (kayit.expiresAt.getTime() < Date.now()) return null;

    // Tek kullanimlik: ayni jetonla ikinci istek bos donsun. updateMany +
    // "usedAt is null" kosulu, ayni anda gelen iki istegin ikisinin birden
    // gecmesini engelliyor.
    const sonuc = await prisma.customerToken.updateMany({
      where: { id: kayit.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (sonuc.count === 0) return null;

    return { customerId: kayit.customerId };
  } catch (error) {
    console.error('Jeton doğrulanamadı:', error);
    return null;
  }
}

/** Vercel arkasindaki gercek istemci adresi (hiz-siniri.ts ile ayni mantik). */
export function istekBilgisi(req: NextRequest) {
  const iletilen = req.headers.get('x-forwarded-for');
  return {
    ip: iletilen ? iletilen.split(',')[0].trim() : req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
  };
}
