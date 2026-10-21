import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { tabloyuHazirla } from '@/lib/analitik-db';
import { botMu, cihazCozumle, kaynakCozumle, konumCozumle } from '@/lib/analitik-parser';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // Beacon text/plain payload
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const {
      ziyaretciId,
      oturumId,
      sayfa = '/',
      baslik = '',
      referrer = '',
      ekran = '',
      dil = 'tr-TR',
      sureSaniye = 0,
      olay = 'pageview', // pageview | ping | duration
    } = body;

    // Admin sayfalarını ve geçersiz rotaları kaydetme
    if (!sayfa || sayfa.startsWith('/admin') || sayfa.startsWith('/api')) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Bot tespiti
    const { isBot, botAdi } = botMu(userAgent);

    // Cihaz ve OS
    const { cihaz, tarayici, isletimSistemi } = cihazCozumle(userAgent);

    // Kaynak ve Arama Motoru
    const { kaynakKodu, aramaMotoru, aramaKelimesi } = kaynakCozumle(referrer);

    // Coğrafi Konum (Vercel / Cloudflare IP)
    const { ulke, sehir, bolge } = konumCozumle(req.headers);

    // Tabloyu arka planda hazırla
    await tabloyuHazirla();

    // Süre güncellemesi ise son kaydı güncelle, yeni ziyaret ise ekle
    if (olay === 'duration' && oturumId && sureSaniye > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "ZiyaretKaydi"
         SET "sureSaniye" = GREATEST("sureSaniye", $1)
         WHERE "oturumId" = $2 AND "sayfa" = $3`,
        Math.min(Math.round(sureSaniye), 3600),
        oturumId,
        sayfa
      ).catch(() => {});

      return new NextResponse(null, { status: 204 });
    }

    // Yeni sayfa görüntüleme kaydı
    const id = `zk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "ZiyaretKaydi" (
        "id", "ziyaretciId", "oturumId", "sayfa", "baslik",
        "kaynak", "tamKaynak", "aramaMotoru", "aramaKelimesi",
        "ip", "ulke", "sehir", "bolge",
        "cihaz", "tarayici", "isletimSistemi", "ekran", "dil",
        "sureSaniye", "isBot", "olusturulma"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, NOW()
      )`,
      id,
      ziyaretciId || id,
      oturumId || id,
      sayfa.substring(0, 500),
      baslik ? baslik.substring(0, 300) : null,
      kaynakKodu,
      referrer ? referrer.substring(0, 1000) : null,
      isBot ? (botAdi || 'Bot') : (aramaMotoru || null),
      aramaKelimesi ? aramaKelimesi.substring(0, 200) : null,
      ip.substring(0, 60),
      ulke.substring(0, 60),
      sehir.substring(0, 80),
      bolge.substring(0, 80),
      cihaz,
      tarayici,
      isletimSistemi,
      ekran ? ekran.substring(0, 30) : null,
      dil ? dil.substring(0, 20) : null,
      0,
      isBot
    ).catch((err) => {
      console.warn('[TRACK] Kayıt ekleme uyarısı:', err?.message);
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse(null, { status: 204 });
  }
}
