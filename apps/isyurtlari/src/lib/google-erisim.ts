import { createSign } from 'crypto';

/**
 * Google servis hesabı ile erişim jetonu.
 *
 * GOOGLE_SERVICE_ACCOUNT_KEY, servis hesabı JSON dosyasının içeriğidir.
 * Jeton, JWT (RS256) imzalanıp Google'ın token uç noktasında takas edilerek
 * alınır. Ek bağımlılık gerektirmez.
 *
 * Servis hesabının e-postası GA4 mülkünde ve Merchant hesabında yetkili
 * olmalıdır; aksi halde Google 403 döner.
 */

export interface ServisHesabi {
  client_email: string;
  private_key: string;
}

const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const JETON_OMRU_SN = 3600;

export function servisHesabiniCoz(ham: string): ServisHesabi {
  let veri: Partial<ServisHesabi>;
  try {
    veri = JSON.parse(ham);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY geçerli JSON değil');
  }
  if (!veri.client_email || !veri.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY içinde client_email veya private_key yok');
  }
  return {
    client_email: veri.client_email,
    // Ortam değişkenine yapıştırılırken satır sonları "\n" olarak kaçabiliyor.
    private_key: veri.private_key.replace(/\\n/g, '\n'),
  };
}

const base64url = (s: string | Buffer) => Buffer.from(s).toString('base64url');

/** Verilen kapsamlar için imzalı JWT üretir. */
export function jwtOlustur(hesap: ServisHesabi, kapsamlar: string[], simdiSn = Math.floor(Date.now() / 1000)) {
  const baslik = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const govde = base64url(
    JSON.stringify({
      iss: hesap.client_email,
      scope: kapsamlar.join(' '),
      aud: TOKEN_URI,
      iat: simdiSn,
      exp: simdiSn + JETON_OMRU_SN,
    })
  );
  const imzalayici = createSign('RSA-SHA256');
  imzalayici.update(`${baslik}.${govde}`);
  const imza = imzalayici.sign(hesap.private_key).toString('base64url');
  return `${baslik}.${govde}.${imza}`;
}

const onbellek = new Map<string, { jeton: string; sonKullanma: number }>();

/** Erişim jetonunu alır; süresi dolana kadar aynı kapsam için önbellekte tutar. */
export async function googleErisimJetonu(kapsamlar: string[]): Promise<string> {
  const anahtar = [...kapsamlar].sort().join(' ');
  const simdi = Date.now();
  const onceki = onbellek.get(anahtar);
  if (onceki && onceki.sonKullanma > simdi + 60_000) return onceki.jeton;

  const ham = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!ham) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY tanımlı değil');

  const hesap = servisHesabiniCoz(ham);
  const assertion = jwtOlustur(hesap, kapsamlar);

  const yanit = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!yanit.ok) {
    throw new Error(`Google jeton alınamadı: ${yanit.status} ${await yanit.text()}`);
  }
  const veri = (await yanit.json()) as { access_token: string; expires_in: number };
  onbellek.set(anahtar, { jeton: veri.access_token, sonKullanma: simdi + veri.expires_in * 1000 });
  return veri.access_token;
}
