import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { adminTokenGecerliMi } from './admin-jwt-edge';

beforeAll(() => { process.env.JWT_SECRET = 'test-anahtar'; });

describe('adminTokenGecerliMi', () => {
  it('gecerli admin tokeni kabul eder', async () => {
    const t = jwt.sign({ admin: true }, 'test-anahtar', { expiresIn: '1h' });
    expect(await adminTokenGecerliMi(t)).toBe(true);
  });
  it('yanlis imzayi reddeder', async () => {
    const t = jwt.sign({ admin: true }, 'baska', { expiresIn: '1h' });
    expect(await adminTokenGecerliMi(t)).toBe(false);
  });
  it('suresi dolmusu reddeder', async () => {
    const t = jwt.sign({ admin: true }, 'test-anahtar', { expiresIn: -10 });
    expect(await adminTokenGecerliMi(t)).toBe(false);
  });
  it('admin olmayan ve sahte tokeni reddeder', async () => {
    expect(await adminTokenGecerliMi(jwt.sign({ admin: false }, 'test-anahtar', { expiresIn: '1h' }))).toBe(false);
    expect(await adminTokenGecerliMi('abc')).toBe(false);
    expect(await adminTokenGecerliMi(undefined)).toBe(false);
  });
  it('alg none reddeder', async () => {
    const b = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    expect(await adminTokenGecerliMi(`${b({ alg: 'none' })}.${b({ admin: true, exp: 9999999999 })}.`)).toBe(false);
  });
});
