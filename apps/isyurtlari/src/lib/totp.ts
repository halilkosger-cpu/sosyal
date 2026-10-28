import { createHmac, randomBytes, createHash, timingSafeEqual, createCipheriv, createDecipheriv } from 'crypto';
import { prisma } from '@isyurtlari/database';
import { generateQrSvg } from './qr-generator';
import { jwtAnahtari } from './admin-auth';

// Gizli anahtar veritabaninda AES-256-GCM ile sifreli durur ("enc:v1:iv:tag:veri").
// Eski duz metin kayitlar okunur ve ilk basarili giriste sifreli bicime gecirilir.
const SIFRE_ONEK = 'enc:v1:';
const sifreAnahtari = () => createHash('sha256').update('admin-totp:' + jwtAnahtari()).digest();

export function sirriSifrele(sir: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', sifreAnahtari(), iv);
  const veri = Buffer.concat([c.update(sir, 'utf8'), c.final()]);
  return SIFRE_ONEK + [iv, c.getAuthTag(), veri].map((b) => b.toString('base64')).join(':');
}

export function sirriCoz(kayit: string): string {
  if (!kayit.startsWith(SIFRE_ONEK)) return kayit;
  const [iv, etiket, veri] = kayit.slice(SIFRE_ONEK.length).split(':').map((p) => Buffer.from(p, 'base64'));
  const d = createDecipheriv('aes-256-gcm', sifreAnahtari(), iv);
  d.setAuthTag(etiket);
  return Buffer.concat([d.update(veri), d.final()]).toString('utf8');
}

/**
 * Google Authenticator (TOTP - RFC 6238) ve Yedek Kurtarma Kodları Motoru.
 *
 * Güvenlik Standartları:
 * 1. RFC 6238 (Time-Based One-Time Password Algorithm) - 30 saniye periyot, 6 hane, HMAC-SHA1.
 * 2. RFC 4648 Base32 Secret Encoding.
 * 3. ±1 adım (30 saniye önce / sonra) saat kayması toleransı (Clock Drift Protection).
 * 4. Yedek Kurtarma Kodları (Backup Codes) veritabanında ASLA düz metin saklanmaz, SHA-256 ile özetlenir.
 * 5. Tek kullanımlık kullanılan kurtarma kodu anında veritabanından silinir.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

export function base32Decode(base32: string): Buffer {
  let bits = '';
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/[\s-]/g, '');
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) throw new Error('Geçersiz Base32 karakteri: ' + clean[i]);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * 20 Bayt (160 Bit) Kriptografik Rastgele Gizli Anahtar Üretir.
 * Google Authenticator için önerilen standart 32 karakterlik Base32 dizesidir.
 */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Google Authenticator ve diğer TOTP uygulamaları için URI üretir.
 */
export function getTotpUri(email: string, secret: string, issuer = 'isyurtlari.com.tr'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Belirli bir zaman adımı için 6 haneli TOTP kodu üretir.
 */
export function generateTotpCode(secret: string, step = 30, windowOffset = 0): string {
  const counter = Math.floor(Date.now() / 1000 / step) + windowOffset;
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const key = base32Decode(secret);
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

/** Kod gecerliyse eslesen zaman adimini, degilse null dondurur (±30 sn tolerans). */
export function eslesenTotpAdimi(token: string, secret: string, step = 30, window = 1): number | null {
  const cleanToken = token.replace(/\D/g, '').trim();
  if (cleanToken.length !== 6) return null;
  const simdikiAdim = Math.floor(Date.now() / 1000 / step);
  for (let offset = -window; offset <= window; offset++) {
    const expected = generateTotpCode(secret, step, offset);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(cleanToken))) return simdikiAdim + offset;
  }
  return null;
}

export function verifyTotpCode(token: string, secret: string, step = 30, window = 1): boolean {
  return eslesenTotpAdimi(token, secret, step, window) !== null;
}

/**
 * 5 adet okunabilir tek kullanımlık kurtarma kodu üretir (örn: 9F2C-8A4E).
 */
export function generateBackupCodes(count = 5): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.substring(0, 4)}-${raw.substring(4, 8)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return createHash('sha256').update(clean).digest('hex');
}

// ─── VERİTABANI İŞLEMLERİ ──────────────────────────────────────────

export async function ensureAdminTotpTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminTotp" (
        "email"        TEXT NOT NULL,
        "secret"       TEXT NOT NULL,
        "backupCodes"  TEXT NOT NULL DEFAULT '[]',
        "aktif"        BOOLEAN NOT NULL DEFAULT false,
        "olusturma"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sonGiris"     TIMESTAMP(3),

        CONSTRAINT "AdminTotp_pkey" PRIMARY KEY ("email")
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdminTotp" ADD COLUMN IF NOT EXISTS "sonAdim" BIGINT`);
  } catch (err) {
    console.error('AdminTotp tablosu kontrol hatası:', err);
  }
}

export interface AdminTotpRecord {
  email: string;
  secret: string;
  backupCodes: string[]; // SHA-256 hash listesi
  aktif: boolean;
  sifreli: boolean;
  sonAdim: number | null;
  olusturma: Date;
  sonGiris?: Date | null;
}

export async function getAdminTotpRecord(email: string): Promise<AdminTotpRecord | null> {
  await ensureAdminTotpTable();
  const cleanEmail = email.toLowerCase().trim();

  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AdminTotp" WHERE "email" = $1 LIMIT 1`,
      cleanEmail
    );

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    let backupCodes: string[] = [];
    try {
      backupCodes = JSON.parse(r.backupCodes || '[]');
    } catch {
      backupCodes = [];
    }

    let secret = '';
    try {
      secret = sirriCoz(r.secret);
    } catch {
      console.error('AdminTotp anahtari cozulemedi (JWT_SECRET degismis olabilir)');
    }

    return {
      email: r.email,
      secret,
      sifreli: String(r.secret).startsWith(SIFRE_ONEK),
      sonAdim: r.sonAdim == null ? null : Number(r.sonAdim),
      backupCodes,
      aktif: Boolean(r.aktif),
      olusturma: r.olusturma,
      sonGiris: r.sonGiris,
    };
  } catch (error) {
    console.error('AdminTotp okunamadı:', error);
    return null;
  }
}

/**
 * İlk kurulum aşamasını başlatır.
 * Yeni gizli anahtar ve kurtarma kodları üretir, `aktif: false` olarak kaydeder.
 * Kullanıcı QR kodu tarayıp ilk kodu doğrulayana kadar aktifleşmez.
 */
export async function setupAdminTotp(email: string) {
  await ensureAdminTotpTable();
  const cleanEmail = email.toLowerCase().trim();

  const secret = generateTotpSecret();
  const rawBackupCodes = generateBackupCodes(5);
  const hashedBackupCodes = rawBackupCodes.map(hashBackupCode);

  const backupCodesJson = JSON.stringify(hashedBackupCodes);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "AdminTotp" ("email", "secret", "backupCodes", "aktif", "olusturma")
     VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
     ON CONFLICT ("email")
     DO UPDATE SET "secret" = $2, "backupCodes" = $3, "aktif" = false, "sonAdim" = NULL, "olusturma" = CURRENT_TIMESTAMP`,
    cleanEmail,
    sirriSifrele(secret),
    backupCodesJson
  );

  const uri = getTotpUri(cleanEmail, secret);
  const qrSvg = generateQrSvg(uri, 220);

  return {
    secret,
    uri,
    qrSvg,
    backupCodes: rawBackupCodes, // Yalnızca kullanıcıya bir kerelik gösterilecek düz metin kodlar
  };
}

/**
 * Kullanıcının telefondan girdiği ilk kod ile kurulumu tamamlar ve aktifleştirir.
 */
export async function confirmAdminTotp(email: string, code: string): Promise<boolean> {
  const record = await getAdminTotpRecord(email);
  if (!record || !record.secret) return false;

  const valid = verifyTotpCode(code, record.secret);
  if (!valid) return false;

  await prisma.$executeRawUnsafe(
    `UPDATE "AdminTotp" SET "aktif" = true, "sonGiris" = CURRENT_TIMESTAMP WHERE "email" = $1`,
    email.toLowerCase().trim()
  );

  return true;
}

/**
 * Giriş sırasında kullanıcının girdiği TOTP kodunu veya Yedek Kurtarma Kodunu doğrular.
 */
export async function verifyAdminTotpOrBackup(
  email: string,
  inputCode: string
): Promise<{ success: boolean; method?: 'totp' | 'backup'; remainingBackupCodes?: number; message?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const record = await getAdminTotpRecord(cleanEmail);

  if (!record || !record.aktif) {
    return { success: false, message: 'Bu yönetici için Google Authenticator aktif değil.' };
  }

  const cleanInput = inputCode.trim();

  // 1. Önce 6 haneli standart TOTP kodu mu kontrol et
  if (/^\d{6}$/.test(cleanInput) && record.secret) {
    const adim = eslesenTotpAdimi(cleanInput, record.secret);
    if (adim !== null) {
      // Ayni kod (ya da daha eski adim) ikinci kez kullanilamaz; guncelleme atomik.
      const guncellenen = await prisma.$executeRawUnsafe(
        `UPDATE "AdminTotp" SET "sonGiris" = CURRENT_TIMESTAMP, "sonAdim" = $2${record.sifreli ? '' : ', "secret" = $3'}
         WHERE "email" = $1 AND ("sonAdim" IS NULL OR "sonAdim" < $2)`,
        cleanEmail,
        adim,
        ...(record.sifreli ? [] : [sirriSifrele(record.secret)])
      );
      if (guncellenen > 0) return { success: true, method: 'totp' };
      return { success: false, message: 'Bu kod zaten kullanıldı. Yeni kodu bekleyin.' };
    }
  }

  // 2. TOTP eşleşmediyse veya kod formatı kurtarma koduna benziyorsa Yedek Kurtarma Kodlarını kontrol et
  const inputHash = hashBackupCode(cleanInput);
  const codeIndex = record.backupCodes.indexOf(inputHash);

  if (codeIndex !== -1) {
    // Eşleşti! Bu tek kullanımlık kurtarma kodunu listeden sil
    const updatedCodes = [...record.backupCodes];
    updatedCodes.splice(codeIndex, 1);

    await prisma.$executeRawUnsafe(
      `UPDATE "AdminTotp" SET "backupCodes" = $1, "sonGiris" = CURRENT_TIMESTAMP WHERE "email" = $2`,
      JSON.stringify(updatedCodes),
      cleanEmail
    );

    return {
      success: true,
      method: 'backup',
      remainingBackupCodes: updatedCodes.length,
      message: `Yedek kurtarma koduyla giriş yapıldı. Kalan yedek kodunuz: ${updatedCodes.length}`,
    };
  }

  return { success: false, message: 'Geçersiz doğrulama veya kurtarma kodu.' };
}

/**
 * Google Authenticator'ı devre dışı bırakır.
 */
export async function disableAdminTotp(email: string): Promise<boolean> {
  await ensureAdminTotpTable();
  const cleanEmail = email.toLowerCase().trim();

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "AdminTotp" SET "aktif" = false WHERE "email" = $1`,
      cleanEmail
    );
    return true;
  } catch {
    return false;
  }
}
