/**
 * Middleware (Edge) icin HS256 JWT dogrulamasi. jsonwebtoken Edge'de calismaz,
 * bu yuzden Web Crypto kullanilir. admin-auth.ts ile ayni anahtari kullanir.
 */
const b64urlBytes = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export async function adminTokenGecerliMi(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const anahtar = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!anahtar) return false;

  const parcalar = token.split('.');
  if (parcalar.length !== 3) return false;
  const [baslik, yuk, imza] = parcalar;

  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlBytes(baslik)));
    if (header.alg !== 'HS256') return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(anahtar),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlBytes(imza) as BufferSource,
      new TextEncoder().encode(`${baslik}.${yuk}`),
    );
    if (!ok) return false;

    const payload = JSON.parse(new TextDecoder().decode(b64urlBytes(yuk)));
    if (payload.admin !== true) return false;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
