import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { logoIsNetGibGonder } from '@/lib/e-fatura/logo-isnet';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const sonuc = await logoIsNetGibGonder(params.id);
    return NextResponse.json({
      success: true,
      message: 'Fatura Logo İşNet üzerinden GİB e-Arşiv sistemine başarıyla iletildi.',
      ...sonuc,
    });
  } catch (error: any) {
    console.error('Logo İşNet GİB Gönderim Hatası:', error);
    return NextResponse.json(
      { error: error?.message || 'Fatura GİB sistemine gönderilemedi' },
      { status: 500 }
    );
  }
}
