import { prisma } from '@isyurtlari/database';
import { randomUUID } from 'crypto';
import {
  hediyeKoduUret,
  hediyeNotu,
  hediyeUygunlugu,
  telefonuNormallestir,
  epostayiNormallestir,
  type HediyeSonucu,
} from './hediye';
import { notlardakiEposta } from './siparis-eposta';

/**
 * Hediye kodu veritabanı işlemleri (tablolar: prisma/sql/hediye-ve-yorum.sql).
 *
 * Tablolar ham SQL ile okunur/yazılır. Hiçbir işlev siparişi engellemez:
 * çağıran taraf hataları yakalayıp siparişe devam eder. Tablo bir nedenle
 * yoksa hediye özelliği sessizce devre dışı kalır, satış etkilenmez.
 */

type SqlIstemci = Pick<typeof prisma, '$queryRawUnsafe' | '$executeRawUnsafe'>;

/** Bir siparişe ait yeni hediye kodu üretir ve kaydeder; çakışırsa yeniden dener. */
export async function siparisIcinKodOlustur(db: SqlIstemci, siparisId: string): Promise<string | null> {
  // Aynı siparişin kodu zaten varsa onu döndür (tekrar çağrı güvenli).
  const mevcut = await db.$queryRawUnsafe<{ kod: string }[]>(
    `SELECT "kod" FROM "HediyeKodu" WHERE "kaynakSiparisId" = $1`,
    siparisId
  );
  if (mevcut[0]) return mevcut[0].kod;

  for (let deneme = 0; deneme < 5; deneme++) {
    const kod = hediyeKoduUret();
    const eklenen = await db.$queryRawUnsafe<{ kod: string }[]>(
      `INSERT INTO "HediyeKodu" ("kod", "kaynakSiparisId") VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING "kod"`,
      kod,
      siparisId
    );
    if (eklenen[0]) return eklenen[0].kod;
  }
  return null;
}

/** Siparişin kendi hediye kodunu getirir (yoksa null). */
export async function siparisinKodu(db: SqlIstemci, siparisId: string): Promise<string | null> {
  const satir = await db.$queryRawUnsafe<{ kod: string }[]>(
    `SELECT "kod" FROM "HediyeKodu" WHERE "kaynakSiparisId" = $1`,
    siparisId
  );
  return satir[0]?.kod ?? null;
}

const notlardakiTelefon = (notes: string | null | undefined): string => {
  const esles = notes?.match(/Telefon:\s*([^|]+)/i);
  return esles ? telefonuNormallestir(esles[1]) : '';
};

export interface HediyeDegerlendirmeGirdisi {
  kod: string;
  eposta: string;
  telefon: string;
  /** Kupon ve kampanya indirimi düşülmüş, müşterinin ödeyeceği tutar. */
  odenecekTutar: number;
}

/** Kodu ve alıcıyı veritabanına karşı değerlendirir; hiçbir şey yazmaz. */
export async function hediyeKodunuDegerlendir(g: HediyeDegerlendirmeGirdisi): Promise<HediyeSonucu> {
  const eposta = epostayiNormallestir(g.eposta);
  const telefon = telefonuNormallestir(g.telefon);

  const kodSatiri = await prisma.$queryRawUnsafe<{ kaynakSiparisId: string }[]>(
    `SELECT "kaynakSiparisId" FROM "HediyeKodu" WHERE "kod" = $1`,
    g.kod
  );
  const kaynakSiparisId = kodSatiri[0]?.kaynakSiparisId;

  let kendiKodu = false;
  if (kaynakSiparisId) {
    const kaynak = await prisma.order.findUnique({ where: { id: kaynakSiparisId }, select: { notes: true } });
    kendiKodu =
      (!!eposta && notlardakiEposta(kaynak?.notes) === eposta) ||
      (!!telefon && notlardakiTelefon(kaynak?.notes) === telefon);
  }

  // "Ilk siparis": bu e-postayla verilmis iptal edilmemis siparis var mi?
  // Telefon bicimleri serbest yazildigi icin burada yalnizca e-posta eslesir;
  // telefon tekrari kullanim tablosundaki benzersiz kisitla yakalanir.
  const oncekiSiparisSayisi = eposta
    ? await prisma.order.count({
        where: { status: { not: 'CANCELLED' }, notes: { contains: `Email: ${eposta} |`, mode: 'insensitive' } },
      })
    : 0;

  const kullanilmis = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "HediyeKullanimi" WHERE "eposta" = $1 OR ($2 <> '' AND "telefon" = $2) LIMIT 1`,
    eposta,
    telefon
  );

  return hediyeUygunlugu({
    kodVar: Boolean(kaynakSiparisId),
    kendiKodu,
    oncekiSiparisSayisi,
    kullanilmis: kullanilmis.length > 0,
    odenecekTutar: g.odenecekTutar,
  });
}

/**
 * Hediyeyi siparişe işler: kullanımı kaydeder (benzersizlik kısıtı yarışı
 * kapatır) ve sipariş notuna ibareyi ekler. Kayıt başarısızsa false.
 */
export async function hediyeyiSipariseUygula(g: {
  kod: string;
  siparisId: string;
  mevcutNot: string | null;
  eposta: string;
  telefon: string;
}): Promise<boolean> {
  const eklenen = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO "HediyeKullanimi" ("id", "kod", "siparisId", "eposta", "telefon")
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING "id"`,
    randomUUID(),
    g.kod,
    g.siparisId,
    epostayiNormallestir(g.eposta),
    telefonuNormallestir(g.telefon)
  );
  if (!eklenen[0]) return false;

  const not = g.mevcutNot ? `${g.mevcutNot} | ${hediyeNotu(g.kod)}` : hediyeNotu(g.kod);
  await prisma.order.update({ where: { id: g.siparisId }, data: { notes: not } });
  return true;
}
