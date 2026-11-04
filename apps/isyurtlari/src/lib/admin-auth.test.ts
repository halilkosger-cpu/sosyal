import { describe, it, expect } from 'vitest';
import { yetkiliAdminEpostalari, isAdminEmail } from './admin-auth';

describe('yetkiliAdminEpostalari', () => {
  it('ADMIN_EMAILS tanımlıysa yalnızca ortam değişkenlerindekileri döndürür', () => {
    const liste = yetkiliAdminEpostalari({
      ADMIN_EMAILS: ' Biri@Ornek.com , ikisi@ornek.com ,, ',
      ADMIN_EMAIL: 'ilk@ornek.com',
    });
    expect(liste).toEqual(['ilk@ornek.com', 'biri@ornek.com', 'ikisi@ornek.com']);
  });

  it('tekrarlanan adresleri tek sayar', () => {
    const liste = yetkiliAdminEpostalari({ ADMIN_EMAILS: 'a@x.com,A@x.com', ADMIN_EMAIL: 'a@x.com' });
    expect(liste).toEqual(['a@x.com']);
  });

  it('ortam değişkeni yoksa kimseyi yetkili saymaz (koda gömülü yedek liste yok)', () => {
    expect(yetkiliAdminEpostalari({})).toEqual([]);
    expect(yetkiliAdminEpostalari({ ADMIN_EMAILS: '  ,  ' })).toEqual([]);
  });

  it('yalnızca ADMIN_EMAIL tanımlıysa onu kabul eder', () => {
    expect(yetkiliAdminEpostalari({ ADMIN_EMAIL: 'Tek@Ornek.com' })).toEqual(['tek@ornek.com']);
  });
});

describe('isAdminEmail', () => {
  it('boş ve yabancı adresleri reddeder', () => {
    expect(isAdminEmail('')).toBe(false);
    expect(isAdminEmail('yabanci@ornek.com')).toBe(false);
  });
});
