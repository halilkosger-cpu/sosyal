import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

export const dynamic = 'force-dynamic';

/**
 * Misafir siparis sorgulama.
 *
 * Bu uc, kaldirilan /api/user/orders'in yerini aliyor. Eskisi ?userId=X ile
 * calisiyordu ve hicbir kimlik dogrulamasi yapmiyordu: kimlik bilen herkes o
 * kullanicinin siparislerini, teslimat adresleriyle birlikte okuyabiliyordu.
 * Ustelik pratikte hic calismiyordu - "userId" istemcide uretilen sahte bir
 * degerdi ("guest-user-<zaman>"), gercek bir kullanici kimligi degildi.
 *
 * Sitede musteri hesabi yok, siparislerin tamami misafir siparisi. Bu yuzden
 * sahiplik kaniti olarak iki bilgi birden isteniyor: siparis numarasi VE
 * sipariste kullanilan e-posta. Ikisi de dogruysa yalnizca o siparis
 * donduruluyor.
 *
 * Siparis numaralari sirali oldugu icin (SG-2026-001...) tek basina tahmin
 * edilebilir; e-posta sarti bunu kapatiyor, hiz siniri da deneme yapmayi
 * yavaslatiyor.
 */
export async function POST(req: NextRequest) {
  // Kaba kuvvet denemelerini yavaslat
  const sinir = await hizSiniriGuard(req, 'siparis-sorgula', 10, 600);
  if (sinir) return sinir;

  try {
    const govde = await req.json();
    const siparisNo = String(govde.siparisNo || '').trim().toUpperCase();
    const email = String(govde.email || '').trim().toLowerCase();

    if (!siparisNo || !email) {
      return NextResponse.json(
        { error: 'Sipariş numarası ve e-posta zorunludur' },
        { status: 400 }
      );
    }

    const siparis = await prisma.order.findUnique({
      where: { orderNumber: siparisNo },
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        notes: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { name: true, slug: true, imageUrl: true } },
          },
        },
      },
    });

    /**
     * Bulunamadi ile e-posta uyusmadi ayni yaniti veriyor.
     *
     * Farkli yanit verilseydi, saldirgan hangi siparis numaralarinin var
     * oldugunu ogrenebilirdi.
     */
    const epostaUyuyor = siparis?.notes?.toLowerCase().includes(email) ?? false;

    if (!siparis || !epostaUyuyor) {
      return NextResponse.json(
        { error: 'Bu bilgilerle bir sipariş bulunamadı' },
        { status: 404 }
      );
    }

    // notes musteri adi, e-posta ve telefonu iceriyor; disari verilmiyor.
    const { notes, ...disariVerilebilir } = siparis;

    return NextResponse.json({
      ...disariVerilebilir,
      urunAdedi: siparis.items.reduce((t, k) => t + k.quantity, 0),
    });
  } catch (error) {
    console.error('Siparis sorgulama hatasi:', error);
    return NextResponse.json({ error: 'Sorgu yapılamadı' }, { status: 500 });
  }
}
