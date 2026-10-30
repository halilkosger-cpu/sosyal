import crypto from 'crypto';

export const IYZICO_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.iyzipay.com'
    : 'https://sandbox-api.iyzipay.com';

/**
 * iyzico V2 HMAC-SHA256 Authorization başlığı üretir.
 */
export function generateIyzicoV2Auth(
  uri: string,
  body: object,
  apiKey: string,
  secretKey: string
) {
  const randomKey = `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
  const jsonBody = JSON.stringify(body);
  const payloadToSign = `${randomKey}${uri}${jsonBody}`;
  const signature = crypto.createHmac('sha256', secretKey).update(payloadToSign).digest('hex');
  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  const base64Auth = Buffer.from(authString).toString('base64');

  return {
    authorization: `IYZWSv2 ${base64Auth}`,
    randomKey,
    jsonBody,
  };
}

export const IYZICO_YOLLARI = {
  formBaslat: '/payment/iyzipos/checkoutform/initialize/auth/ecom',
  formSonucu: '/payment/iyzipos/checkoutform/auth/ecom/detail',
} as const;

export async function iyzicoIstek(yol: string, govde: object, apiKey: string, secretKey: string): Promise<Response> {
  const { authorization, randomKey, jsonBody } = generateIyzicoV2Auth(yol, govde, apiKey, secretKey);
  return fetch(`${IYZICO_BASE_URL}${yol}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': randomKey,
    },
    body: jsonBody,
  });
}

/** Musteri yalnizca iyzico'nun kendi HTTPS alan adina yonlendirilir. */
export function iyzicoSayfasiMi(adres: unknown): adres is string {
  if (typeof adres !== 'string') return false;
  try {
    const u = new URL(adres);
    return u.protocol === 'https:' && (u.hostname === 'iyzipay.com' || u.hostname.endsWith('.iyzipay.com'));
  } catch {
    return false;
  }
}

/** Odeme gercekten tamamlandi mi ve tahsil edilen tutar siparisle ayni mi? */
export function odemeGecerli(sonuc: any, siparisTutari: number): boolean {
  if (sonuc?.status !== 'success' || sonuc?.paymentStatus !== 'SUCCESS') return false;
  if (sonuc?.fraudStatus !== undefined && sonuc.fraudStatus !== 1) return false;
  // price indirimsiz sepet toplami; tahsil edilen paidPrice. Taksit vade farki paidPrice'a eklendigi icin alt sinir kontrol ediliyor.
  const tahsilEdilen = Number(sonuc?.paidPrice);
  return Number.isFinite(tahsilEdilen) && tahsilEdilen >= siparisTutari - 0.01;
}
