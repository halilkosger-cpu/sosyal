import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { tabloyuHazirla } from '@/lib/analitik-db';
import { botMu, cihazCozumle, kaynakCozumle, konumCozumle } from '@/lib/analitik-parser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await tabloyuHazirla();
    const countRaw: any = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as c FROM "ZiyaretKaydi"');
    const sonKayitlar: any = await prisma.$queryRawUnsafe('SELECT * FROM "ZiyaretKaydi" ORDER BY "olusturulma" DESC LIMIT 5');
    return NextResponse.json({
      status: 'ok',
      tablo: 'ZiyaretKaydi hazir',
      toplamKayit: countRaw?.[0]?.c ?? 0,
      sonKayitlar,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      mesaj: error?.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
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
      olay = 'pageview',
    } = body;

    // Admin ve dahili API rotalarını kaydetme
    if (!sayfa || sayfa.startsWith('/admin') || sayfa.startsWith('/api')) {
      return NextResponse.json({ skipped: true, reason: 'admin_or_api' });
    }

    // IP Tespiti
    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
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

    // Tablonun varlığını garanti et
    await tabloyuHazirla();

    const id = `zk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Süre güncellemesi ise
    if (olay === 'duration' && oturumId && sureSaniye > 0) {
      if ((prisma as any).ziyaretKaydi) {
        await (prisma as any).ziyaretKaydi.updateMany({
          where: { oturumId, sayfa },
          data: { sureSaniye: Math.min(Math.round(sureSaniye), 3600) },
        }).catch(() => {});
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "ZiyaretKaydi" SET "sureSaniye" = GREATEST("sureSaniye", $1) WHERE "oturumId" = $2 AND "sayfa" = $3`,
          Math.min(Math.round(sureSaniye), 3600),
          oturumId,
          sayfa
        ).catch(() => {});
      }
      return NextResponse.json({ ok: true, type: 'duration_updated' });
    }

    // Yeni sayfa ziyareti
    if ((prisma as any).ziyaretKaydi) {
      await (prisma as any).ziyaretKaydi.create({
        data: {
          id,
          ziyaretciId: ziyaretciId || id,
          oturumId: oturumId || id,
          sayfa: sayfa.substring(0, 500),
          baslik: baslik ? baslik.substring(0, 300) : null,
          kaynak: kaynakKodu,
          tamKaynak: referrer ? referrer.substring(0, 1000) : null,
          aramaMotoru: isBot ? (botAdi || 'Bot') : (aramaMotoru || null),
          aramaKelimesi: aramaKelimesi ? aramaKelimesi.substring(0, 200) : null,
          ip: ip.substring(0, 60),
          ulke: ulke.substring(0, 60),
          sehir: sehir.substring(0, 80),
          bolge: bolge.substring(0, 80),
          cihaz,
          tarayici,
          isletimSistemi,
          ekran: ekran ? ekran.substring(0, 30) : null,
          dil: dil ? dil.substring(0, 20) : null,
          sureSaniye: 0,
          isBot,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ZiyaretKaydi" (
          "id", "ziyaretciId", "oturumId", "sayfa", "baslik",
          "kaynak", "tamKaynak", "aramaMotoru", "aramaKelimesi",
          "ip", "ulke", "sehir", "bolge",
          "cihaz", "tarayici", "isletimSistemi", "ekran", "dil",
          "sureSaniye", "isBot", "olusturulma"
        ) VALUES (
          '${id}', '${ziyaretciId || id}', '${oturumId || id}', '${sayfa.replace(/'/g, "''")}',
          ${baslik ? `'${baslik.replace(/'/g, "''")}'` : 'NULL'},
          '${kaynakKodu}', ${referrer ? `'${referrer.replace(/'/g, "''")}'` : 'NULL'},
          ${aramaMotoru ? `'${aramaMotoru}'` : 'NULL'},
          ${aramaKelimesi ? `'${aramaKelimesi.replace(/'/g, "''")}'` : 'NULL'},
          '${ip}', '${ulke}', '${sehir}', '${bolge}',
          '${cihaz}', '${tarayici}', '${isletimSistemi}',
          ${ekran ? `'${ekran}'` : 'NULL'}, ${dil ? `'${dil}'` : 'NULL'},
          0, ${isBot ? 'true' : 'false'}, NOW()
        )`
      );
    }

    return NextResponse.json({ ok: true, id, sayfa });
  } catch (error: any) {
    console.error('[TRACK API HATASI]:', error?.message);
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });
  }
}
