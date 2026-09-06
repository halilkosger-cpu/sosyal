import { NextResponse } from 'next/server';

/**
 * Yonetici oturumunu kapatir.
 *
 * ─── PAROLA ILE GIRIS KALDIRILDI ──────────────────────────────────────
 *
 * Bu dosyada bir POST ucu vardi: gövdedeki parolayi ADMIN_PASSWORD ortam
 * degiskeniyle karsilastirip, OTP akisinin urettigiyle BIREBIR AYNI
 * { admin: true } jetonunu veriyordu. Uc sorunluydu:
 *
 *  1. Iki faktorlu dogrulamayi tamamen atliyordu. E-postaya kod gonderme,
 *     kodun ozetle saklanmasi, 5 deneme siniri, denetim kaydi - hepsi
 *     (api/admin/otp-request, otp-verify, lib/otp.ts) bu uc dururken
 *     istege bagli bir susten ibaretti.
 *  2. Hiz siniri yoktu. Sitedeki tek sinirsiz kimlik dogrulama ucuydu;
 *     tek bir IP'den sinirsiz parola denemesi yapilabiliyordu. Giris
 *     denemeleri denetim gunlugune de yazilmiyordu, yani iz birakmiyordu.
 *  3. Parola duz metin karsilastiriliyor ve ortamda duz metin
 *     tutuluyordu; ustelik uretilen jetonun bir kismi ve Set-Cookie
 *     basligini iceren yanit basliklari console.log ile kayitlara
 *     yaziliyordu.
 *
 * Yonetim paneli giris sayfasi (app/admin/login/page.tsx) bu ucu zaten
 * cagirmiyor; yalnizca OTP akisini kullaniyor. Uc olulmustu ama acik
 * duruyordu.
 *
 * Cikis ucu duruyor: panel cikis dugmesi bunu cagiriyor.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin-token');
  return res;
}
