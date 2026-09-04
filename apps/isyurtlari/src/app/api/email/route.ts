import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

/**
 * Serbest e-posta gonderimi. YALNIZCA admin paneli kullanir (/admin/email).
 *
 * Bu uc kimlik dogrulamasi yapmiyordu: internetteki herkes govdeye alici,
 * konu ve HTML koyup info@isyurtlari.com.tr adresinden e-posta
 * gonderebiliyordu. Yani acik bir posta rolesiydi - dolandiricilik amacli
 * kimlige burunme, alan adinin gonderim itibarinin yanmasi ve Resend
 * hesabinin askiya alinmasi riski vardi.
 */
export async function POST(request: NextRequest) {
  const red = adminGuard(request);
  if (red) return red;

  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and (html or text)' },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to,
      subject,
      ...(html && { html }),
      ...(text && { text }),
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id: result.data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
