import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { getAuditLogs, getAuditLogsByEmail } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '100');

    let logs;
    if (email) {
      logs = await getAuditLogsByEmail(email, limit);
    } else {
      logs = await getAuditLogs(limit);
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.reverse(), // Most recent first
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Audit log getirilemedi' },
      { status: 500 }
    );
  }
}
