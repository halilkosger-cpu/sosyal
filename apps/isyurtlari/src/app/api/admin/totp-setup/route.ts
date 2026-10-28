import { NextRequest, NextResponse } from 'next/server';
import { guvenliHataMesaji } from '@/lib/kullanici-hatasi';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import {
  getAdminTotpRecord,
  setupAdminTotp,
  confirmAdminTotp,
  disableAdminTotp,
} from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  const email = adminEpostasi(req);
  if (!email) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });

  const record = await getAdminTotpRecord(email);

  return NextResponse.json({
    email,
    enabled: Boolean(record && record.aktif),
    createdAt: record?.olusturma || null,
    lastUsed: record?.sonGiris || null,
    backupCodesCount: record?.backupCodes?.length ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const yetkiHatasi = adminGuard(req);
  if (yetkiHatasi) return yetkiHatasi;

  const email = adminEpostasi(req);
  if (!email) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });

  try {
    const { action, code } = await req.json();

    if (action === 'init') {
      const setup = await setupAdminTotp(email);
      return NextResponse.json({
        ok: true,
        secret: setup.secret,
        uri: setup.uri,
        qrSvg: setup.qrSvg,
        backupCodes: setup.backupCodes,
      });
    }

    if (action === 'confirm') {
      if (!code || String(code).trim().length !== 6) {
        return NextResponse.json({ error: 'Lütfen 6 haneli kodu eksiksiz giriniz.' }, { status: 400 });
      }

      const verified = await confirmAdminTotp(email, String(code).trim());
      if (!verified) {
        return NextResponse.json(
          { error: 'Kod doğrulanamadı. Lütfen telefonunuzdaki anlık kodu kontrol edip tekrar deneyiniz.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'Google Authenticator (TOTP) başarıyla etkinleştirildi!',
      });
    }

    if (action === 'disable') {
      await disableAdminTotp(email);
      return NextResponse.json({
        ok: true,
        message: 'Google Authenticator devre dışı bırakıldı.',
      });
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    console.error('TOTP setup hatası:', error);
    return NextResponse.json({ error: guvenliHataMesaji(error, 'İşlem gerçekleştirilemedi.') }, { status: 500 });
  }
}
