import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { tabloyuHazirla } from '@/lib/analitik-db';
import { isimdenCinsiyetTahminEt } from '@/lib/analitik-parser';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Yalnızca yetkili yöneticiler görebilir (JWT Admin Token koruması)
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  try {
    await tabloyuHazirla();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'bugun'; // bugun | dun | 7gun | 30gun | tum-zamanlar

    const simdi = new Date();
    let baslangicTarihi: Date;
    let bitisTarihi: Date = simdi;

    // Türkiye Saati (UTC+3) gün başı
    const trTarihStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(simdi);
    const trBugunBaslangic = new Date(`${trTarihStr}T00:00:00+03:00`);

    if (period === 'bugun') {
      baslangicTarihi = trBugunBaslangic;
    } else if (period === 'dun') {
      baslangicTarihi = new Date(trBugunBaslangic.getTime() - 24 * 60 * 60 * 1000);
      bitisTarihi = new Date(trBugunBaslangic.getTime() - 1);
    } else if (period === '7gun') {
      baslangicTarihi = new Date(simdi.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30gun') {
      baslangicTarihi = new Date(simdi.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // tum-zamanlar
      baslangicTarihi = new Date(2025, 0, 1);
    }

    // 1. GENEL ZİYARETÇİ METRİKLERİ (İNSAN TRAFİĞİ)
    const [ozetMetriklerRaw]: any = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS "toplamSayfa",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekilZiyaretci",
        COUNT(DISTINCT "oturumId")::int AS "toplamOturum",
        COALESCE(ROUND(AVG("sureSaniye")), 0)::int AS "ortalamaSure"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
    `, baslangicTarihi, bitisTarihi);

    const toplamSayfa = ozetMetriklerRaw?.toplamSayfa || 0;
    const tekilZiyaretci = ozetMetriklerRaw?.tekilZiyaretci || 0;
    const toplamOturum = ozetMetriklerRaw?.toplamOturum || 0;
    const ortalamaSure = ozetMetriklerRaw?.ortalamaSure || 0;

    // 2. SAATLİK VEYA GÜNLÜK ZAMAN SERİSİ (GRAFİK İÇİN)
    let zamanSerisi: any[] = [];
    if (period === 'bugun' || period === 'dun') {
      // Saat bazlı 00:00 - 23:00
      const saatlerRaw: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          TO_CHAR("olusturulma", 'HH24:00') AS "saat",
          COUNT(*)::int AS "sayfa",
          COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
        FROM "ZiyaretKaydi"
        WHERE "isBot" = false
          AND "olusturulma" >= $1 AND "olusturulma" <= $2
        GROUP BY 1
        ORDER BY 1 ASC
      `, baslangicTarihi, bitisTarihi);

      // 24 saati doldur
      const saatMap = new Map(saatlerRaw.map((r) => [r.saat, r]));
      for (let s = 0; s < 24; s++) {
        const saatStr = `${String(s).padStart(2, '0')}:00`;
        const kayit = saatMap.get(saatStr);
        zamanSerisi.push({
          etiket: saatStr,
          sayfa: kayit?.sayfa || 0,
          tekil: kayit?.tekil || 0,
        });
      }
    } else {
      // Gün bazlı
      const gunlerRaw: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          TO_CHAR("olusturulma", 'YYYY-MM-DD') AS "gun",
          COUNT(*)::int AS "sayfa",
          COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
        FROM "ZiyaretKaydi"
        WHERE "isBot" = false
          AND "olusturulma" >= $1 AND "olusturulma" <= $2
        GROUP BY 1
        ORDER BY 1 ASC
      `, baslangicTarihi, bitisTarihi);

      zamanSerisi = gunlerRaw.map((r) => ({
        etiket: r.gun.split('-').slice(1).join('/'),
        sayfa: r.sayfa,
        tekil: r.tekil,
      }));
    }

    // 3. TRAFİK KAYNAKLARI (Arama Motorları, Sosyal Medya, Doğrudan)
    const kaynaklarRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        "kaynak",
        COUNT(*)::int AS "sayfa",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "tekil" DESC
      LIMIT 10
    `, baslangicTarihi, bitisTarihi);

    const kaynakAdlari: Record<string, string> = {
      google: 'Google Arama',
      bing: 'Bing Arama',
      yandex: 'Yandex Arama',
      duckduckgo: 'DuckDuckGo',
      yahoo: 'Yahoo Arama',
      instagram: 'Instagram',
      facebook: 'Facebook',
      x: 'X (Twitter)',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      direct: 'Doğrudan Giriş',
      referral: 'Diğer Web Siteleri',
      internal: 'Site İçi Dolaşım',
    };

    const kaynaklar = kaynaklarRaw.map((k) => ({
      kaynak: k.kaynak,
      ad: kaynakAdlari[k.kaynak] || k.kaynak,
      sayfa: k.sayfa,
      tekil: k.tekil,
      yuzde: tekilZiyaretci > 0 ? Math.round((k.tekil / tekilZiyaretci) * 100) : 0,
    }));

    // 4. ŞEHİR VE COĞRAFİ DAĞILIM (TÜRKİYE İLLERİ)
    const sehirlerRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("sehir", 'Belirtilmedi') AS "sehir",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil",
        COUNT(*)::int AS "sayfa"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "tekil" DESC
      LIMIT 12
    `, baslangicTarihi, bitisTarihi);

    // 5. CİHAZ, TARAYICI VE İŞLETİM SİSTEMİ DAĞILIMI
    const cihazlarRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        "cihaz",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "tekil" DESC
    `, baslangicTarihi, bitisTarihi);

    const isletimSistemiRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("isletimSistemi", 'Diğer') AS "os",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "tekil" DESC
      LIMIT 6
    `, baslangicTarihi, bitisTarihi);

    const tarayiciRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("tarayici", 'Diğer') AS "tarayici",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "tekil" DESC
      LIMIT 6
    `, baslangicTarihi, bitisTarihi);

    // 6. EN ÇOK ZİYARET EDİLEN SAYFALAR VE ÜRÜNLER
    const sayfalarRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        "sayfa",
        MAX("baslik") AS "baslik",
        COUNT(*)::int AS "goruntuleme",
        COUNT(DISTINCT "ziyaretciId")::int AS "tekil",
        COALESCE(ROUND(AVG("sureSaniye")), 0)::int AS "ortalamaSure"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "goruntuleme" DESC
      LIMIT 15
    `, baslangicTarihi, bitisTarihi);

    // 7. GERÇEK ZAMANLI CANLI ZİYARETÇİ AKIŞI (SON 30 ZİYARET)
    const canliAkisRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        "id",
        "ziyaretciId",
        "sayfa",
        "baslik",
        "kaynak",
        "aramaMotoru",
        "ip",
        "ulke",
        "sehir",
        "cihaz",
        "tarayici",
        "isletimSistemi",
        "sureSaniye",
        "isBot",
        "olusturulma"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = false
      ORDER BY "olusturulma" DESC
      LIMIT 30
    `);

    // 8. BOT VE ARAMA MOTORU TARAMALARI (GOOGLEBOT, BINGBOT...)
    const botlarRaw: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("aramaMotoru", 'Bot') AS "bot",
        COUNT(*)::int AS "taramaSayisi",
        MAX("olusturulma") AS "sonTarama"
      FROM "ZiyaretKaydi"
      WHERE "isBot" = true
        AND "olusturulma" >= $1 AND "olusturulma" <= $2
      GROUP BY 1
      ORDER BY "taramaSayisi" DESC
    `, baslangicTarihi, bitisTarihi);

    // 9. DÖNÜŞÜM VE MÜŞTERİ DEMOGRAFİK ANALİTİĞİ (SİPARİŞLERDEN)
    const siparisler = await prisma.order.findMany({
      where: {
        createdAt: { gte: baslangicTarihi, lte: bitisTarihi },
      },
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        city: true,
        createdAt: true,
      },
    });

    const siparisSayisi = siparisler.length;
    const toplamCiro = siparisler.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const donusumOrani = tekilZiyaretci > 0
      ? Number(((siparisSayisi / tekilZiyaretci) * 100).toFixed(2))
      : 0;

    // Cinsiyet Dağılımı Tahmini (Türk İsim Sözlüğü ile)
    let kadinSayisi = 0;
    let erkekSayisi = 0;
    let belirsizSayisi = 0;

    siparisler.forEach((s) => {
      const cinsiyet = isimdenCinsiyetTahminEt(s.customerName);
      if (cinsiyet === 'KADIN') kadinSayisi++;
      else if (cinsiyet === 'ERKEK') erkekSayisi++;
      else belirsizSayisi++;
    });

    const toplamCinsiyetli = kadinSayisi + erkekSayisi + belirsizSayisi;
    const demografi = {
      kadinYuzde: toplamCinsiyetli > 0 ? Math.round((kadinSayisi / toplamCinsiyetli) * 100) : 52,
      erkekYuzde: toplamCinsiyetli > 0 ? Math.round((erkekSayisi / toplamCinsiyetli) * 100) : 44,
      kurumsalYuzde: toplamCinsiyetli > 0 ? Math.round((belirsizSayisi / toplamCinsiyetli) * 100) : 4,
      kadinAdet: kadinSayisi,
      erkekAdet: erkekSayisi,
      toplamSiparisVeren: siparisSayisi,
      ortalamaSepet: siparisSayisi > 0 ? Math.round(toplamCiro / siparisSayisi) : 0,
    };

    return NextResponse.json({
      success: true,
      period,
      ozet: {
        tekilZiyaretci,
        toplamSayfa,
        toplamOturum,
        ortalamaSure,
        sayfaBasiOturum: toplamOturum > 0 ? Number((toplamSayfa / toplamOturum).toFixed(1)) : 1,
        siparisSayisi,
        toplamCiro,
        donusumOrani,
      },
      zamanSerisi,
      kaynaklar,
      sehirler: sehirlerRaw,
      cihazlar: cihazlarRaw,
      isletimSistemleri: isletimSistemiRaw,
      tarayicilar: tarayiciRaw,
      sayfalar: sayfalarRaw,
      canliAkis: canliAkisRaw,
      botTaramalari: botlarRaw,
      demografi,
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json(
      { error: 'Analitik verileri derlenirken hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}
