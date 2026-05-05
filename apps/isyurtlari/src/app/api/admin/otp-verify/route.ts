import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyOTP, getRemainingAttempts } from '@/lib/otp';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'halil.kosger@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      );
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Yetkisiz email' }, { status: 403 });
    }

    // Verify OTP
    const isValid = verifyOTP(email, code);

    if (!isValid) {
      const remaining = getRemainingAttempts(email);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Maksimum deneme sayısı aşıldı. Lütfen yeni kod isteyin.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Hatalı kod. Kalan deneme: ${remaining}` },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { admin: true, email, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set secure cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 saat
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Doğrulama başarısız' },
      { status: 500 }
    );
  }
}
