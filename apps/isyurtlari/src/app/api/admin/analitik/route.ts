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

    // Prisma Model üzerinden güvenli sorgulama (SQL Type Mismatch ve PgBouncer hatalarını engeller)
    let insanKayitlari: any[] = [];
    let botKayitlari: any[] = [];

    if ((prisma as any).ziyaretKaydi) {
      [insanKayitlari, botKayitlari] = await Promise.all([
        (prisma as any).ziyaretKaydi.findMany({
          where: {
            isBot: false,
            olusturulma: { gte: baslangicTarihi, lte: bitisTarihi },
          },
          orderBy: { olusturulma: 'desc' },
          take: 1000,
        }),
        (prisma as any).ziyaretKaydi.findMany({
          where: {
            isBot: true,
            olusturulma: { gte: baslangicTarihi, lte: bitisTarihi },
          },
          orderBy: { olusturulma: 'desc' },
          take: 200,
        }),
      ]);
    } else {
      // Raw fallback
      insanKayitlari = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ZiyaretKaydi"
        WHERE "isBot" = false
        ORDER BY "olusturulma" DESC
        LIMIT 500
      `);
      botKayitlari = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ZiyaretKaydi"
        WHERE "isBot" = true
        ORDER BY "olusturulma" DESC
        LIMIT 100
      `);
    }

    // Eğer 'bugün' seçildiğinde insan kaydı henüz 0 ise ama son 24 saatte kayıt varsa,
    // boş ekran göstermek yerine kullanıcıyı aydınlatmak için son 24 saatin kayıtlarını da topla
    let gosterilecekKayitlar = insanKayitlari;
    if (gosterilecekKayitlar.length === 0 && period === 'bugun') {
      const son24Saat = await (prisma as any).ziyaretKaydi?.findMany({
        where: {
          isBot: false,
          olusturulma: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { olusturulma: 'desc' },
        take: 500,
      }).catch(() => []);

      if (son24Saat && son24Saat.length > 0) {
        gosterilecekKayitlar = son24Saat;
      }
    }

    // 1. GENEL ZİYARET METRİKLERİ
    const toplamSayfa = gosterilecekKayitlar.length;
    const tekilZiyaretciler = new Set(gosterilecekKayitlar.map((k) => k.ziyaretciId));
    const tekilZiyaretci = tekilZiyaretciler.size;
    const oturumlar = new Set(gosterilecekKayitlar.map((k) => k.oturumId));
    const toplamOturum = oturumlar.size;
    const toplamSure = gosterilecekKayitlar.reduce((sum, k) => sum + (k.sureSaniye || 0), 0);
    const ortalamaSure = toplamSayfa > 0 ? Math.round(toplamSure / toplamSayfa) : 0;

    // 2. SAATLİK VEYA GÜNLÜK ZAMAN SERİSİ
    const zamanMap = new Map<string, { sayfa: number; tekiller: Set<string> }>();

    if (period === 'bugun' || period === 'dun') {
      for (let s = 0; s < 24; s++) {
        const saatStr = `${String(s).padStart(2, '0')}:00`;
        zamanMap.set(saatStr, { sayfa: 0, tekiller: new Set() });
      }

      gosterilecekKayitlar.forEach((k) => {
        const d = new Date(k.olusturulma);
        // Türkiye saatine göre saat dilimi
        const saatNum = (d.getUTCHours() + 3) % 24;
        const saatStr = `${String(saatNum).padStart(2, '0')}:00`;
        const entry = zamanMap.get(saatStr) || { sayfa: 0, tekiller: new Set() };
        entry.sayfa++;
        entry.tekiller.add(k.ziyaretciId);
        zamanMap.set(saatStr, entry);
      });
    } else {
      gosterilecekKayitlar.forEach((k) => {
        const d = new Date(k.olusturulma);
        const gunStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const entry = zamanMap.get(gunStr) || { sayfa: 0, tekiller: new Set() };
        entry.sayfa++;
        entry.tekiller.add(k.ziyaretciId);
        zamanMap.set(gunStr, entry);
      });
    }

    const zamanSerisi = Array.from(zamanMap.entries()).map(([etiket, v]) => ({
      etiket,
      sayfa: v.sayfa,
      tekil: v.tekiller.size,
    }));

    // 3. TRAFİK KAYNAKLARI
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

    const kaynakMap = new Map<string, { sayfa: number; tekiller: Set<string> }>();
    gosterilecekKayitlar.forEach((k) => {
      const kod = k.kaynak || 'direct';
      const entry = kaynakMap.get(kod) || { sayfa: 0, tekiller: new Set() };
      entry.sayfa++;
      entry.tekiller.add(k.ziyaretciId);
      kaynakMap.set(kod, entry);
    });

    const kaynaklar = Array.from(kaynakMap.entries())
      .map(([kaynak, v]) => ({
        kaynak,
        ad: kaynakAdlari[kaynak] || kaynak,
        sayfa: v.sayfa,
        tekil: v.tekiller.size,
        yuzde: tekilZiyaretci > 0 ? Math.round((v.tekiller.size / tekilZiyaretci) * 100) : 0,
      }))
      .sort((a, b) => b.tekil - a.tekil);

    // 4. ŞEHİRLER
    const sehirMap = new Map<string, { sayfa: number; tekiller: Set<string> }>();
    gosterilecekKayitlar.forEach((k) => {
      const sehir = k.sehir || 'Belirtilmedi';
      const entry = sehirMap.get(sehir) || { sayfa: 0, tekiller: new Set() };
      entry.sayfa++;
      entry.tekiller.add(k.ziyaretciId);
      sehirMap.set(sehir, entry);
    });

    const sehirler = Array.from(sehirMap.entries())
      .map(([sehir, v]) => ({
        sehir,
        sayfa: v.sayfa,
        tekil: v.tekiller.size,
      }))
      .sort((a, b) => b.tekil - a.tekil)
      .slice(0, 15);

    // 5. CİHAZ, TARAYICI VE İŞLETİM SİSTEMİ
    const cihazMap = new Map<string, Set<string>>();
    const osMap = new Map<string, Set<string>>();
    const tarayiciMap = new Map<string, Set<string>>();

    gosterilecekKayitlar.forEach((k) => {
      const c = k.cihaz || 'MASAUSTU';
      if (!cihazMap.has(c)) cihazMap.set(c, new Set());
      cihazMap.get(c)!.add(k.ziyaretciId);

      const os = k.isletimSistemi || 'Diğer';
      if (!osMap.has(os)) osMap.set(os, new Set());
      osMap.get(os)!.add(k.ziyaretciId);

      const t = k.tarayici || 'Diğer';
      if (!tarayiciMap.has(t)) tarayiciMap.set(t, new Set());
      tarayiciMap.get(t)!.add(k.ziyaretciId);
    });

    const cihazlar = Array.from(cihazMap.entries()).map(([cihaz, set]) => ({
      cihaz,
      tekil: set.size,
    })).sort((a, b) => b.tekil - a.tekil);

    const isletimSistemleri = Array.from(osMap.entries()).map(([os, set]) => ({
      os,
      tekil: set.size,
    })).sort((a, b) => b.tekil - a.tekil);

    const tarayicilar = Array.from(tarayiciMap.entries()).map(([tarayici, set]) => ({
      tarayici,
      tekil: set.size,
    })).sort((a, b) => b.tekil - a.tekil);

    // 6. POPÜLER SAYFALAR
    const sayfaMap = new Map<string, { baslik?: string; goruntuleme: number; tekiller: Set<string>; toplamSure: number }>();
    gosterilecekKayitlar.forEach((k) => {
      const s = k.sayfa || '/';
      const entry = sayfaMap.get(s) || { baslik: k.baslik, goruntuleme: 0, tekiller: new Set(), toplamSure: 0 };
      entry.goruntuleme++;
      entry.tekiller.add(k.ziyaretciId);
      entry.toplamSure += (k.sureSaniye || 0);
      if (k.baslik) entry.baslik = k.baslik;
      sayfaMap.set(s, entry);
    });

    const sayfalar = Array.from(sayfaMap.entries())
      .map(([sayfa, v]) => ({
        sayfa,
        baslik: v.baslik,
        goruntuleme: v.goruntuleme,
        tekil: v.tekiller.size,
        ortalamaSure: v.goruntuleme > 0 ? Math.round(v.toplamSure / v.goruntuleme) : 0,
      }))
      .sort((a, b) => b.goruntuleme - a.goruntuleme)
      .slice(0, 15);

    // 7. CANLI AKIŞ (HER ZAMAN EN SON 30 GERÇEK ZİYARETÇİ)
    let canliAkis: any[] = [];
    let toplamVeritabaniKaydi = gosterilecekKayitlar.length;

    try {
      if ((prisma as any).ziyaretKaydi) {
        [canliAkis, toplamVeritabaniKaydi] = await Promise.all([
          (prisma as any).ziyaretKaydi.findMany({
            where: { isBot: false },
            orderBy: { olusturulma: 'desc' },
            take: 30,
          }),
          (prisma as any).ziyaretKaydi.count({
            where: { isBot: false },
          }),
        ]);
      } else {
        canliAkis = gosterilecekKayitlar.slice(0, 30);
      }
    } catch {
      canliAkis = gosterilecekKayitlar.slice(0, 30);
    }

    // 8. BOT TARAMALARI
    const botMap = new Map<string, { taramaSayisi: number; sonTarama: Date }>();
    botKayitlari.forEach((b) => {
      const botAdi = b.aramaMotoru || 'Bot';
      const entry = botMap.get(botAdi) || { taramaSayisi: 0, sonTarama: new Date(b.olusturulma) };
      entry.taramaSayisi++;
      if (new Date(b.olusturulma) > entry.sonTarama) entry.sonTarama = new Date(b.olusturulma);
      botMap.set(botAdi, entry);
    });

    const botTaramalari = Array.from(botMap.entries()).map(([bot, v]) => ({
      bot,
      taramaSayisi: v.taramaSayisi,
      sonTarama: v.sonTarama.toISOString(),
    })).sort((a, b) => b.taramaSayisi - a.taramaSayisi);

    // 9. DÖNÜŞÜM VE MÜŞTERİ DEMOGRAFİSİ (SİPARİŞLERDEN)
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
    }).catch(() => []);

    const siparisSayisi = siparisler.length;
    const toplamCiro = siparisler.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const donusumOrani = tekilZiyaretci > 0
      ? Number(((siparisSayisi / tekilZiyaretci) * 100).toFixed(2))
      : 0;

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
        toplamVeritabaniKaydi,
      },
      zamanSerisi,
      kaynaklar,
      sehirler,
      cihazlar,
      isletimSistemleri,
      tarayicilar,
      sayfalar,
      canliAkis,
      botTaramalari,
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
