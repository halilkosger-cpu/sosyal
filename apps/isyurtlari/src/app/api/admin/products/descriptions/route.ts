import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { icerikTazele } from '@/lib/kategoriler';

/**
 * Toplu urun aciklamasi guncelleme.
 *
 * ─── NEDEN AYRI BIR UC ────────────────────────────────────────────────
 *
 * 49 urunun aciklamasini yonetim panelinden tek tek girmek yarim gun
 * suren ve her seferinde tekrarlanan bir is. Fiyat guncellemede ayni
 * sorun icin ayni sekilde toplu bir uc yazilmisti
 * (api/admin/products/prices); bu onun aciklama karsiligi.
 *
 * ─── ONCE ONIZLEME, SONRA YAZMA ───────────────────────────────────────
 *
 * GET hicbir sey degistirmez: gonderilen kumeyi mevcut kayitlarla
 * karsilastirip neyin degisecegini dondurur. Yanlis bir slug ya da
 * beklenmedik bir uzunluk yazmadan once gorulur. Yazma yalnizca
 * POST ile ve `onayla: true` ile yapilir.
 */

export const dynamic = 'force-dynamic';

/** Aciklama icin makul sinirlar: bos birakma, sayfayi da sisirme. */
const ASGARI = 40;
const AZAMI = 2000;

type Girdi = { slug: string; aciklama: string };

function govdeyiCozumle(ham: unknown): { girdiler: Girdi[] } | { hata: string } {
  if (!ham || typeof ham !== 'object') return { hata: 'Gövde okunamadı' };
  const kayitlar = (ham as { kayitlar?: unknown }).kayitlar;

  if (!kayitlar || typeof kayitlar !== 'object' || Array.isArray(kayitlar)) {
    return { hata: 'kayitlar alanı { slug: açıklama } biçiminde olmalı' };
  }

  const girdiler: Girdi[] = [];
  for (const [slug, deger] of Object.entries(kayitlar as Record<string, unknown>)) {
    if (typeof deger !== 'string') return { hata: `${slug}: açıklama metin değil` };
    const aciklama = deger.replace(/\s+/g, ' ').trim();
    if (aciklama.length < ASGARI) return { hata: `${slug}: açıklama çok kısa (${aciklama.length})` };
    if (aciklama.length > AZAMI) return { hata: `${slug}: açıklama çok uzun (${aciklama.length})` };
    girdiler.push({ slug, aciklama });
  }

  if (girdiler.length === 0) return { hata: 'Hiç kayıt gönderilmedi' };
  return { girdiler };
}

/**
 * Gonderilen kumeyi mevcut kayitlarla karsilastirir. Yazma yapmaz.
 * Ayni govde POST'a da gonderilebilsin diye GET degil POST kullaniliyor;
 * onizleme ile yazmayi ayiran sey `onayla` bayragi.
 */
async function karsilastir(girdiler: Girdi[]) {
  const mevcut = await prisma.product.findMany({
    where: { slug: { in: girdiler.map((g) => g.slug) } },
    select: { slug: true, name: true, description: true },
  });
  const harita = new Map(mevcut.map((u) => [u.slug, u]));

  const degisecek: { slug: string; ad: string; eskiUzunluk: number; yeniUzunluk: number }[] = [];
  const ayni: string[] = [];
  const bulunamadi: string[] = [];

  for (const g of girdiler) {
    const urun = harita.get(g.slug);
    if (!urun) {
      bulunamadi.push(g.slug);
      continue;
    }
    if ((urun.description ?? '').trim() === g.aciklama) {
      ayni.push(g.slug);
      continue;
    }
    degisecek.push({
      slug: g.slug,
      ad: urun.name,
      eskiUzunluk: (urun.description ?? '').trim().length,
      yeniUzunluk: g.aciklama.length,
    });
  }

  return { degisecek, ayni, bulunamadi };
}

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  let ham: unknown;
  try {
    ham = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const cozum = govdeyiCozumle(ham);
  if ('hata' in cozum) return NextResponse.json({ error: cozum.hata }, { status: 400 });

  const rapor = await karsilastir(cozum.girdiler);
  const onayla = (ham as { onayla?: unknown }).onayla === true;

  /**
   * Bilinmeyen slug varsa hicbir sey yazilmiyor. Kismi yazma, hangi
   * urunun guncellendigini takip etmeyi zorlastirir; once slug
   * duzeltilsin, sonra tamami birlikte yazilsin.
   */
  if (rapor.bulunamadi.length > 0) {
    return NextResponse.json(
      { error: 'Bulunamayan slug var, hiçbir şey yazılmadı', ...rapor },
      { status: 400 }
    );
  }

  if (!onayla) {
    return NextResponse.json({ onizleme: true, ...rapor });
  }

  const harita = new Map(cozum.girdiler.map((g) => [g.slug, g.aciklama]));

  /**
   * Tek islemde yaziliyor: yarisi guncellenmis bir katalog, hic
   * guncellenmemis olandan daha kotu.
   */
  await prisma.$transaction(
    rapor.degisecek.map((d) =>
      prisma.product.update({
        where: { slug: d.slug },
        data: { description: harita.get(d.slug) as string },
      })
    )
  );

  // Urun ve kategori sayfalari ISR ile saklaniyor; tazelenmezse
  // degisiklik bes dakikaya kadar gorunmezdi.
  icerikTazele();

  return NextResponse.json({
    yazildi: rapor.degisecek.length,
    ayni: rapor.ayni.length,
    slugler: rapor.degisecek.map((d) => d.slug),
  });
}
