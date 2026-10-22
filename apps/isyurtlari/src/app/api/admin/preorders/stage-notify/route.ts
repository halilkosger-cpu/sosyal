import { prisma } from '@isyurtlari/database';
import { absoluteUrl } from '@/lib/seo';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';
import { adminGuard } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const resendApiKey = process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY || 're_mock_key';
const resend = new Resend(resendApiKey);

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

const ATOLYE_ASAMA_METINLERI: Record<number, { baslik: string; aciklama: string }> = {
  0: { baslik: 'Talep Alındı & Planlama', aciklama: 'Ön talep kaydınız alındı, atölye iş listesine eklendi.' },
  1: { baslik: 'Hammadde & Hasat Hazırlığı', aciklama: 'Ürününüz için kaliteli hammadde veya organik hasat süreci başlatıldı.' },
  2: { baslik: 'Atölyede Üretimde', aciklama: 'Usta öğreticiler ve hükümlüler tezgâh başında ürününüzün üretimine başladı.' },
  3: { baslik: 'Kalite Kontrol & Paketleme', aciklama: 'Ürününüz başarıyla tamamlandı, kalite testlerinden geçirildi ve paketlendi.' },
  4: { baslik: 'Stoğa Alındı / Sevk Hazır', aciklama: 'Ürününüz tamamen hazırlandı ve stoğa aktarıldı. Satın alma için hazır!' },
};

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: 'Servis kullanılamıyor' }, { status: 503 });
  }

  try {
    const { preOrderId, stage } = await req.json();

    if (!preOrderId || stage === undefined) {
      return NextResponse.json({ error: 'preOrderId ve stage parametreleri zorunludur' }, { status: 400 });
    }

    const stageNum = Number(stage);
    const stageInfo = ATOLYE_ASAMA_METINLERI[stageNum] || ATOLYE_ASAMA_METINLERI[0];

    const preOrder = await prisma.preOrder.findUnique({
      where: { id: preOrderId },
      include: {
        product: { select: { name: true, slug: true } },
      },
    });

    if (!preOrder) {
      return NextResponse.json({ error: 'Ön talep bulunamadı' }, { status: 404 });
    }

    const productUrl = absoluteUrl(`/urun/${preOrder.product?.slug || ''}`);

    try {
      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: preOrder.email,
        subject: `🔨 Atölye Güncellemesi: ${preOrder.product?.name || 'Ürününüz'} - ${stageInfo.baslik}`,
        html: emailTemplates.preOrderStageUpdate({
          name: preOrder.name,
          productName: preOrder.product?.name || 'Ürün',
          stageTitle: stageInfo.baslik,
          stageDescription: stageInfo.aciklama,
          productUrl,
        }),
      });

      return NextResponse.json({ success: true, message: 'Aşama bildirimi e-postası başarıyla gönderildi' });
    } catch (mailError) {
      console.error('Aşama e-postası gönderilemedi:', mailError);
      return NextResponse.json({ error: 'E-posta servisi hatası' }, { status: 502 });
    }
  } catch (error) {
    console.error('Stage notify hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
