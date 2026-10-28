import sharp from 'sharp';
import { GORSEL_BOYUTLARI } from '@/lib/urun-gorsel';

export function guvenliDosyaAdi(ad: string): string {
  const harita: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  const govde = ad.replace(/\.[^.]+$/, '').toLocaleLowerCase('tr-TR');
  const temiz = govde
    .replace(/[çğıöşü]/g, (h) => harita[h])
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return temiz || 'gorsel';
}

export async function webpSurumleri(girdi: Buffer): Promise<{ genislik: number; veri: Buffer }[]> {
  return Promise.all(
    GORSEL_BOYUTLARI.map(async (genislik) => ({
      genislik,
      // 40 MP ustu (dekompresyon bombasi) reddedilir.
      veri: await sharp(girdi, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: genislik, height: genislik, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer(),
    }))
  );
}
