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
