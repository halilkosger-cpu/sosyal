import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { getAdminTotpRecord } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || '').toLowerCase().trim();

    if (!cleanEmail || !isAdminEmail(cleanEmail)) {
      return NextResponse.json({ hasTotp: false, validAdmin: false });
    }

    const record = await getAdminTotpRecord(cleanEmail);
    const hasTotp = Boolean(record && record.aktif);

    return NextResponse.json({
      hasTotp,
      validAdmin: true,
    });
  } catch (error) {
    return NextResponse.json({ hasTotp: false, validAdmin: false });
  }
}
