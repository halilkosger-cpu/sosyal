import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Hatalı şifre' }, { status: 401 });
    }

    // Compare password (plain text for now)
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Hatalı şifre' }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { admin: true, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = NextResponse.json({ ok: true });
    console.log('Setting cookie with token:', token.substring(0, 20) + '...');
    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 saat
      path: '/',
    });
    console.log('Cookie set, response headers:', res.headers);
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş hatası' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin-token');
  return res;
}
