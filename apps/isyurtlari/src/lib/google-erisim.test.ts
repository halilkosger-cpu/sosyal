import { describe, it, expect } from 'vitest';
import { generateKeyPairSync, createVerify } from 'crypto';
import { jwtOlustur, servisHesabiniCoz } from './google-erisim';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const hesap = {
  client_email: 'rapor@proje.iam.gserviceaccount.com',
  private_key: pem,
};

describe('jwtOlustur', () => {
  it('RS256 ile imzalanmış, doğru iddialara sahip JWT üretir', () => {
    const simdi = 1_700_000_000;
    const jwt = jwtOlustur(hesap, ['https://www.googleapis.com/auth/content'], simdi);
    const [baslik, govde, imza] = jwt.split('.');

    const dogrulayici = createVerify('RSA-SHA256');
    dogrulayici.update(`${baslik}.${govde}`);
    expect(dogrulayici.verify(publicKey, Buffer.from(imza, 'base64url'))).toBe(true);

    const iddialar = JSON.parse(Buffer.from(govde, 'base64url').toString());
    expect(iddialar.iss).toBe(hesap.client_email);
    expect(iddialar.scope).toBe('https://www.googleapis.com/auth/content');
    expect(iddialar.aud).toBe('https://oauth2.googleapis.com/token');
    expect(iddialar.iat).toBe(simdi);
    expect(iddialar.exp).toBe(simdi + 3600);
  });
});

describe('servisHesabiniCoz', () => {
  it('JSON metnini okur ve private_key içindeki kaçış karakterlerini düzeltir', () => {
    const ham = JSON.stringify({ client_email: hesap.client_email, private_key: pem.replace(/\n/g, '\\n') });
    const cozulen = servisHesabiniCoz(ham);
    expect(cozulen.private_key).toBe(pem);
  });

  it('geçersiz JSON\'da açık hata verir', () => {
    expect(() => servisHesabiniCoz('{bozuk')).toThrow(/GOOGLE_SERVICE_ACCOUNT_KEY/);
  });
});
