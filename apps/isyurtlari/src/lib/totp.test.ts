import { describe, it, expect, vi } from 'vitest';

vi.mock('@isyurtlari/database', () => ({ prisma: {} }));
process.env.JWT_SECRET = 'test-anahtari';

import { createHash } from 'crypto';
import {
  sirriSifrele,
  sirriCoz,
  eslesenTotpAdimi,
  generateTotpCode,
  generateTotpSecret,
  generateBackupCodes,
  hashBackupCode,
  yedekKoduIndeksi,
} from './totp';

describe('yedek kurtarma kodlari', () => {
  it('80 bit entropili, okunabilir ve her seferinde farkli kod uretir', () => {
    const kodlar = generateBackupCodes(5);
    expect(kodlar).toHaveLength(5);
    for (const kod of kodlar) {
      expect(kod).toMatch(/^[0-9A-F]{4}(-[0-9A-F]{4}){4}$/);
    }
    expect(new Set(kodlar).size).toBe(5);
  });

  it('ozet anahtarli: duz SHA-256 ile ayni degildir, bicim farkini yok sayar', () => {
    const duzOzet = createHash('sha256').update('9F2C8A4E1B7D3C90AA12').digest('hex');
    const ozet = hashBackupCode('9f2c-8a4e-1b7d-3c90-aa12');
    expect(ozet).not.toBe(duzOzet);
    expect(ozet.startsWith('h2:')).toBe(true);
    expect(hashBackupCode('9F2C8A4E1B7D3C90AA12')).toBe(ozet);
  });

  it('yeni kodu bulur ve eski (8 haneli, duz SHA-256) kayitli kodlari da kabul eder', () => {
    const yeni = generateBackupCodes(1)[0];
    const eskiOzet = createHash('sha256').update('9F2C8A4E').digest('hex');
    const kayitli = [eskiOzet, hashBackupCode(yeni)];

    expect(yedekKoduIndeksi(kayitli, yeni)).toBe(1);
    expect(yedekKoduIndeksi(kayitli, '9F2C-8A4E')).toBe(0);
    expect(yedekKoduIndeksi(kayitli, '0000-0000')).toBe(-1);
  });
});

describe('TOTP sirri sifreleme', () => {
  it('sifreler, cozer; duz metin eski kayit aynen okunur', () => {
    const sir = generateTotpSecret();
    const kayit = sirriSifrele(sir);
    expect(kayit.startsWith('enc:v1:')).toBe(true);
    expect(kayit).not.toContain(sir);
    expect(sirriCoz(kayit)).toBe(sir);
    expect(sirriCoz(sir)).toBe(sir);
  });

  it('bozulmus sifreli kayit hata verir', () => {
    const kayit = sirriSifrele('ABC');
    expect(() => sirriCoz(kayit.slice(0, -4) + 'AAAA')).toThrow();
  });

  it('gecerli kod icin zaman adimini dondurur', () => {
    const sir = generateTotpSecret();
    expect(eslesenTotpAdimi(generateTotpCode(sir), sir)).toBe(Math.floor(Date.now() / 30000));
    expect(eslesenTotpAdimi('000000', 'AAAAAAAAAAAAAAAA')).toBeNull();
  });
});
