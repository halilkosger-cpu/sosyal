import { describe, it, expect, vi } from 'vitest';

vi.mock('@isyurtlari/database', () => ({ prisma: {} }));
process.env.JWT_SECRET = 'test-anahtari';

import { sirriSifrele, sirriCoz, eslesenTotpAdimi, generateTotpCode, generateTotpSecret } from './totp';

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
