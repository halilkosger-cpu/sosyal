import { prisma } from '@isyurtlari/database';

/**
 * Yönetim işlemlerinin izi.
 *
 * ─── NEDEN DEĞİŞTİ ────────────────────────────────────────────────────
 *
 * Bu dosya kayıtları BELLEKTE tutuyordu: modül düzeyinde bir dizi, son
 * 1000 satır. Uygulama Vercel'de sunucusuz çalışıyor; her istek ayrı bir
 * örnekte işlenebiliyor ve örnek kapanınca dizi yok oluyor. Sonuç: hangi
 * yöneticinin ne zaman giriş yaptığı, hangi iadeyi onayladığı, hangi
 * fiyatı değiştirdiği hiçbir yerde durmuyordu. /api/admin/audit-logs ucu
 * da çoğu zaman boş dönüyordu - istek başka bir örneğe düştüğü için.
 *
 * Aynı sorun hız sayacında yaşanmış ve sayaç veritabanına taşınmıştı
 * (bkz. lib/hiz-siniri.ts, IstekSayaci). Bu dosya aynı düzeltmenin
 * denetim günlüğü karşılığı.
 *
 * ─── İKİ KURAL ────────────────────────────────────────────────────────
 *
 * 1) Yazma AWAIT EDİLMELİ. Sunucusuz ortamda yanıt döndükten sonra
 *    başlayan iş tamamlanmayabilir; beklenmeyen bir söz (promise) sessizce
 *    düşer. Çağıran uçların hepsi zaten async.
 *
 * 2) Yazma HİÇBİR ZAMAN HATA FIRLATMAZ. Günlük tutulamadı diye iade
 *    onayı ya da yönetici girişi çökmemeli. Hata konsola yazılır ve iş
 *    devam eder.
 */

export type DenetimDurumu = 'success' | 'failed';

export interface AuditLog {
  timestamp: string;
  action: string;
  email: string;
  ip?: string;
  status: DenetimDurumu;
  details?: string;
}

/**
 * Saklama süresi.
 *
 * Para iadesi ve fiyat değişikliği kararlarının izi kısa ömürlü olmamalı;
 * iki yıl, tablonun sınırsız büyümesini engellerken kurumsal denetim için
 * yeterli bir aralık.
 */
const SAKLAMA_GUN = 730;

/** Uzun metinler tabloyu şişirmesin; hata dizeleri çok uzun olabiliyor. */
const AZAMI_AYRINTI = 1000;

const kirp = (deger: string | undefined | null, uzunluk: number): string | null => {
  if (!deger) return null;
  const t = String(deger).trim();
  if (!t) return null;
  return t.length > uzunluk ? `${t.slice(0, uzunluk - 1)}…` : t;
};

/**
 * Bir yönetim işlemini kaydeder.
 *
 * İmza eskisiyle aynı; tek fark artık async olması ve çağrıldığı yerde
 * await edilmesi gerekmesi.
 */
export async function logAudit(
  action: string,
  email: string,
  status: DenetimDurumu,
  details?: string,
  ip?: string
): Promise<void> {
  // Geliştirme sırasında akışı konsoldan izleyebilmek işe yarıyor.
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[DENETIM] ${new Date().toISOString()} | ${action} | ${email} | ${status}`,
      details ? `| ${details}` : ''
    );
  }

  try {
    await prisma.denetimKaydi.create({
      data: {
        islem: kirp(action, 100) ?? 'BILINMEYEN',
        eposta: kirp(email, 200) ?? 'bilinmeyen',
        durum: status === 'success' ? 'success' : 'failed',
        ayrinti: kirp(details, AZAMI_AYRINTI),
        ip: kirp(ip, 100),
      },
    });
  } catch (error) {
    // Kural 2: günlük yazılamadı diye işlem çökmesin.
    console.error('Denetim kaydı yazılamadı:', error);
  }

  await eskileriTemizle();
}

/**
 * Süresi geçmiş kayıtları siler.
 *
 * Her yazmada silmek gereksiz yük olurdu; düşük bir olasılıkla
 * tetikleniyor - sayaç temizliğiyle aynı yaklaşım (lib/hiz-siniri.ts).
 */
async function eskileriTemizle(olasilik = 0.01): Promise<void> {
  if (Math.random() > olasilik) return;
  try {
    await prisma.denetimKaydi.deleteMany({
      where: { olusturulma: { lt: new Date(Date.now() - SAKLAMA_GUN * 86400_000) } },
    });
  } catch {
    // Temizlik başarısız olursa sessiz geçilir; işlevsel bir etkisi yok.
  }
}

const bicimle = (k: {
  islem: string;
  eposta: string;
  durum: string;
  ayrinti: string | null;
  ip: string | null;
  olusturulma: Date;
}): AuditLog => ({
  timestamp: k.olusturulma.toISOString(),
  action: k.islem,
  email: k.eposta,
  status: k.durum === 'success' ? 'success' : 'failed',
  details: k.ayrinti ?? undefined,
  ip: k.ip ?? undefined,
});

const SECIM = {
  islem: true,
  eposta: true,
  durum: true,
  ayrinti: true,
  ip: true,
  olusturulma: true,
} as const;

/** En yeni kayıtlar önce. */
export async function getAuditLogs(limit = 100, atla = 0): Promise<AuditLog[]> {
  try {
    const kayitlar = await prisma.denetimKaydi.findMany({
      orderBy: { olusturulma: 'desc' },
      take: Math.min(500, Math.max(1, limit)),
      skip: Math.max(0, atla),
      select: SECIM,
    });
    return kayitlar.map(bicimle);
  } catch (error) {
    console.error('Denetim kayıtları okunamadı:', error);
    return [];
  }
}

export async function getAuditLogsByEmail(
  email: string,
  limit = 50,
  atla = 0
): Promise<AuditLog[]> {
  try {
    const kayitlar = await prisma.denetimKaydi.findMany({
      where: { eposta: email },
      orderBy: { olusturulma: 'desc' },
      take: Math.min(500, Math.max(1, limit)),
      skip: Math.max(0, atla),
      select: SECIM,
    });
    return kayitlar.map(bicimle);
  } catch (error) {
    console.error('Denetim kayıtları okunamadı:', error);
    return [];
  }
}

/** Toplam kayıt sayısı - sayfalama için. */
export async function denetimSayisi(where: { eposta?: string; islem?: string } = {}): Promise<number> {
  try {
    return await prisma.denetimKaydi.count({ where });
  } catch {
    return 0;
  }
}

/** Günlükte geçen işlem kodları - süzgeç listesi için. */
export async function denetimIslemleri(): Promise<string[]> {
  try {
    const satirlar = await prisma.denetimKaydi.groupBy({
      by: ['islem'],
      _count: { _all: true },
      orderBy: { _count: { islem: 'desc' } },
      take: 30,
    });
    return satirlar.map((s) => s.islem);
  } catch {
    return [];
  }
}
