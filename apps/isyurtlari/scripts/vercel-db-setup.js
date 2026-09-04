/**
 * Vercel derlemesi sirasinda calisir (vercel.json -> buildCommand).
 *
 * Iki is yapar:
 *   1. Baglanilan veritabaninin SUNUCU ADINI derleme gunlugune yazar.
 *      Sifre yazilmaz. Canli DATABASE_URL Vercel'de "Sensitive" oldugu icin
 *      disaridan okunamiyor; veritabaninin nerede oldugunu boyle ogreniyoruz.
 *   2. prisma/sql/ altindaki TUM .sql dosyalarini ad sirasiyla calistirir.
 *      Onceden yalnizca preorder.sql calisiyordu; yeni bir tablo gerektiginde
 *      betigi de degistirmek gerekiyordu. Artik klasore dosya eklemek yetiyor.
 *      Dosyalar her derlemede tekrar calistigi icin "IF NOT EXISTS" gibi
 *      tekrar calistirilabilir ifadeler kullanmalari sart.
 *
 * DATABASE_URL tanimli degilse sessizce atlar - yerel derlemeler ve
 * degiskenin verilmedigi ortamlar bu yuzden kirilmaz.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SEMA = path.join(__dirname, '..', '..', '..', 'packages', 'database', 'prisma', 'schema.prisma');
const SQL_KLASORU = path.join(__dirname, '..', '..', '..', 'packages', 'database', 'prisma', 'sql');

const url = process.env.DATABASE_URL;

if (!url) {
  console.log('[db-setup] DATABASE_URL tanimli degil, veritabani adimi atlandi.');
  process.exit(0);
}

// ─── 1. Sunucu adini yaz (sifre olmadan) ───
try {
  const u = new URL(url);
  console.log('[db-setup] ------------------------------------------------');
  console.log('[db-setup] VERITABANI SUNUCUSU : ' + u.hostname);
  console.log('[db-setup] VERITABANI ADI      : ' + u.pathname.slice(1).split('?')[0]);
  console.log('[db-setup] KULLANICI           : ' + u.username);
  console.log('[db-setup] ------------------------------------------------');
} catch {
  console.log('[db-setup] DATABASE_URL cozumlenemedi, adres yazilamadi.');
}

// ─── 2. SQL dosyalarini calistir ───
// Prisma CLI'yi npx uzerinden degil dogrudan cagiriyoruz: npx isletim
// sistemine gore farkli davraniyor (Windows'ta npx.cmd) ve gereksiz yere
// paket indirmeye kalkisabiliyor. require.resolve kurulu surumu bulur.
const prismaCli = require.resolve('prisma/build/index.js', {
  paths: [__dirname, path.join(__dirname, '..'), path.join(__dirname, '..', '..', '..')],
});

const dosyalar = fs
  .readdirSync(SQL_KLASORU)
  .filter((d) => d.endsWith('.sql'))
  .sort();

console.log('[db-setup] ' + dosyalar.length + ' SQL dosyasi calistirilacak.');

for (const dosya of dosyalar) {
  console.log('[db-setup]   -> ' + dosya);
  try {
    execFileSync(
      process.execPath,
      [prismaCli, 'db', 'execute', '--schema', SEMA, '--file', path.join(SQL_KLASORU, dosya)],
      { stdio: 'inherit' }
    );
  } catch {
    console.error('[db-setup] BASARISIZ: ' + dosya + ' calistirilamadi.');
    console.error('[db-setup] Derleme durduruluyor; canli site mevcut haliyle calismaya devam eder.');
    process.exit(1);
  }
}

console.log('[db-setup] Tamam.');
