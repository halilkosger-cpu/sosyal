/**
 * Vercel derlemesi sirasinda calisir (vercel.json -> buildCommand).
 *
 * Iki is yapar:
 *   1. Baglanilan veritabaninin SUNUCU ADINI derleme gunlugune yazar.
 *      Sifre yazilmaz. Canli DATABASE_URL Vercel'de "Sensitive" oldugu icin
 *      disaridan okunamiyor; veritabaninin nerede oldugunu boyle ogreniyoruz.
 *   2. PreOrder tablosunu olusturur (prisma/sql/preorder.sql).
 *      Betik tekrar calistirilabilir, ikinci deploy'da zarar vermez.
 *
 * DATABASE_URL tanimli degilse sessizce atlar - yerel derlemeler ve
 * degiskenin verilmedigi ortamlar bu yuzden kirilmaz.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const SEMA = path.join(__dirname, '..', '..', '..', 'packages', 'database', 'prisma', 'schema.prisma');
const SQL = path.join(__dirname, '..', '..', '..', 'packages', 'database', 'prisma', 'sql', 'preorder.sql');

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

// ─── 2. PreOrder tablosunu olustur ───
console.log('[db-setup] PreOrder tablosu kuruluyor...');
try {
  // Prisma CLI'yi npx uzerinden degil dogrudan cagiriyoruz: npx isletim
  // sistemine gore farkli davraniyor (Windows'ta npx.cmd) ve gereksiz yere
  // paket indirmeye kalkisabiliyor. require.resolve kurulu surumu bulur.
  const prismaCli = require.resolve('prisma/build/index.js', {
    paths: [__dirname, path.join(__dirname, '..'), path.join(__dirname, '..', '..', '..')],
  });

  execFileSync(
    process.execPath,
    [prismaCli, 'db', 'execute', '--schema', SEMA, '--file', SQL],
    { stdio: 'inherit' }
  );
  console.log('[db-setup] Tamam.');
} catch (e) {
  console.error('[db-setup] BASARISIZ: PreOrder tablosu kurulamadi.');
  console.error('[db-setup] Derleme durduruluyor; canli site mevcut haliyle calismaya devam eder.');
  process.exit(1);
}
