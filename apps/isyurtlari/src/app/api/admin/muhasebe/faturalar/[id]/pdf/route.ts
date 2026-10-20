import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { generateOfficialEArsivHTML, VARSAYILAN_SIRKET } from '@/lib/e-fatura/logo-isnet';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fatura = await prisma.fatura.findUnique({
      where: { id: params.id },
      include: {
        cari: true,
        satirlar: true,
      },
    });

    if (!fatura) {
      return new NextResponse('Fatura bulunamadı', { status: 404 });
    }

    const html = generateOfficialEArsivHTML({
      gibFaturaNo: fatura.gibFaturaNo || fatura.faturaNo,
      ettn: fatura.ettn || '00000000-0000-0000-0000-000000000000',
      tarih: fatura.tarih,
      sirket: VARSAYILAN_SIRKET,
      musteri: {
        unvan: fatura.cari.unvan,
        vknTckn: fatura.cari.vergiTcNo || '11111111111',
        vergiDairesi: fatura.cari.vergiDairesi,
        adres: fatura.cari.adres,
        sehir: fatura.cari.sehir,
      },
      matrah: fatura.matrah,
      kdvTutari: fatura.kdvTutari,
      genelToplam: fatura.genelToplam,
      satirlar: fatura.satirlar.map((s) => ({
        aciklama: s.aciklama,
        miktar: s.miktar,
        birimFiyat: s.birimFiyat,
        kdvOrani: s.kdvOrani,
        kdvTutari: s.kdvTutari,
        satirToplam: s.satirToplam,
      })),
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Fatura HTML render hatası:', error);
    return new NextResponse('Fatura görüntülenirken hata oluştu', { status: 500 });
  }
}
