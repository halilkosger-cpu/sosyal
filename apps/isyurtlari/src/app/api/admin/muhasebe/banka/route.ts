import { prisma } from '@isyurtlari/database';
import { KullaniciHatasi, guvenliHataMesaji } from '@/lib/kullanici-hatasi';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Banka Hesaplarını ve Hareketlerini Listele
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const hesaplar = await prisma.bankaHesabi.findMany({
      include: {
        hareketler: {
          include: { cari: { select: { unvan: true, kod: true } } },
          orderBy: { tarih: 'desc' },
          take: 50,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(hesaplar);
  } catch (error) {
    console.error('Banka hesapları listeleme hatası:', error);
    return NextResponse.json({ error: 'Banka hesapları alınamadı' }, { status: 500 });
  }
}

// POST: Yeni Banka Hesabı Tanımla veya Yeni Banka Hareketi (Tahsilat / Ödeme) İşle
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { islem, hesapAdi, bankaAdi, iban, bankaHesapId, tur, tutar, cariId, belgeNo, aciklama } = body;

    // A) Yeni Hesap Tanımlama
    if (islem === 'YENI_HESAP') {
      if (!hesapAdi || !bankaAdi) {
        return NextResponse.json({ error: 'Hesap adı ve banka adı zorunludur' }, { status: 400 });
      }

      const hesap = await prisma.bankaHesabi.create({
        data: {
          hesapAdi: hesapAdi.trim(),
          bankaAdi: bankaAdi.trim(),
          iban: iban?.trim() || null,
        },
      });

      return NextResponse.json(hesap, { status: 201 });
    }

    // B) Banka Hareketi İşleme (Tahsilat / Ödeme / Havale Onayı)
    if (!bankaHesapId || !tur || tutar === undefined || tutar <= 0) {
      return NextResponse.json({ error: 'Banka hesabı, hareket türü ve geçerli bir tutar zorunludur' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const hesap = await tx.bankaHesabi.findUnique({ where: { id: bankaHesapId } });
      if (!hesap) throw new KullaniciHatasi('Banka hesabı bulunamadı');

      const hareketTutari = parseFloat(tutar);
      const yeniHesapBakiye = tur === 'GIRIS'
        ? hesap.bakiye + hareketTutari
        : hesap.bakiye - hareketTutari;

      // 1. Banka bakiyesini güncelle
      await tx.bankaHesabi.update({
        where: { id: bankaHesapId },
        data: { bakiye: yeniHesapBakiye },
      });

      // 2. Banka hareketini kaydet
      const hareket = await tx.bankaHareketi.create({
        data: {
          bankaHesapId,
          tur,
          tutar: hareketTutari,
          cariId: cariId || null,
          belgeNo: belgeNo?.trim() || null,
          aciklama: aciklama || (tur === 'GIRIS' ? 'Havale / Tahsilat' : 'Havale / Ödeme'),
          durum: 'ONAYLANDI',
        },
      });

      // 3. Eğer bir cariye bağlıysa Cari Hesabı da otomatik kapat (Tahsilat = Müşteri Alacaklanır / Ödeme = Satıcı Borçlanır)
      if (cariId) {
        const cari = await tx.cariKart.findUnique({ where: { id: cariId } });
        if (cari) {
          const borcTutari = tur === 'CIKIS' ? hareketTutari : 0;
          const alacakTutari = tur === 'GIRIS' ? hareketTutari : 0;
          const yeniCariBakiye = cari.bakiye + (borcTutari - alacakTutari);

          await tx.cariKart.update({
            where: { id: cariId },
            data: { bakiye: yeniCariBakiye },
          });

          await tx.cariHareket.create({
            data: {
              cariId,
              islemTuru: tur === 'GIRIS' ? 'BANKA_TAHSILAT' : 'BANKA_ODEME',
              belgeNo: belgeNo?.trim() || hareket.id,
              aciklama: aciklama || `${hesap.hesapAdi} üzerinden banka işlemi`,
              borc: borcTutari,
              alacak: alacakTutari,
              bakiye: yeniCariBakiye,
            },
          });
        }
      }

      return hareket;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Banka işlemi hatası:', error);
    return NextResponse.json({ error: guvenliHataMesaji(error, 'İşlem gerçekleştirilemedi') }, { status: 500 });
  }
}
