import { prisma } from '@isyurtlari/database';

interface SiparisMuhasebeGirdisi {
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress: string;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{
    productId?: string | null;
    name?: string;
    quantity: number;
    price: number;
    vatRate?: number;
  }>;
}

/**
 * 1. SİPARİŞ ANINDA OTOMATİK MUHASEBE KAYDI (Logo GO3 Mantığı)
 * - Müşteri 120 Cari Kartı oluşturulur / eşleştirilir.
 * - Satış Faturası (FTR-2026-xxxxx) kesilir ve satırları yazılır.
 * - Cari hesaba fatura tutarı kadar BORÇ işlenir.
 * - Anlaşmalı kargo maliyeti (varsayılan 75 TL) otomatik İŞLETME GİDERİ (SHIPPING) yazılır.
 */
export async function siparisMuhasebeyeIsle(girdi: SiparisMuhasebeGirdisi) {
  try {
    const eposta = (girdi.email || '').trim().toLowerCase();
    const telefon = (girdi.phone || '').trim();
    const adSoyad = (girdi.customerName || 'Bireysel Müşteri').trim();

    // 1. Cari Kart Bul veya Aç (120 Alıcılar)
    let cari = await prisma.cariKart.findFirst({
      where: {
        OR: [
          ...(eposta ? [{ eposta }] : []),
          ...(telefon ? [{ telefon }] : []),
        ],
      },
    });

    if (!cari) {
      const rastgeleKod = 'CH-120-' + Date.now().toString().slice(-6);
      cari = await prisma.cariKart.create({
        data: {
          kod: rastgeleKod,
          unvan: adSoyad,
          tur: 'ALICI',
          muhasebeKodu: '120.01.001',
          eposta: eposta || null,
          telefon: telefon || null,
          adres: girdi.shippingAddress || null,
          bakiye: 0,
        },
      });
    }

    // 2. Fatura Kontrolü - Zaten kesilmişse mükerrer yapma
    const mevcutFatura = await prisma.fatura.findUnique({
      where: { orderId: girdi.orderId },
    });

    if (!mevcutFatura) {
      // Fatura No üret: FTR-2026-XXXXX
      const temizNo = girdi.orderNumber.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0');
      const faturaNo = `FTR-2026-${temizNo}`;

      // Matrah ve KDV Ayrıştırması
      let toplamMatrah = 0;
      let toplamKdv = 0;

      const satirlar = girdi.items.map((it) => {
        const kdvOrani = it.vatRate ?? 20;
        const toplamBirim = it.price * it.quantity;
        const matrah = toplamBirim / (1 + kdvOrani / 100);
        const kdv = toplamBirim - matrah;

        toplamMatrah += matrah;
        toplamKdv += kdv;

        return {
          productId: it.productId || null,
          aciklama: it.name || 'Sipariş Ürünü',
          miktar: it.quantity,
          birimFiyat: it.price,
          kdvOrani,
          kdvTutari: Math.round((kdv + Number.EPSILON) * 100) / 100,
          satirToplam: Math.round((toplamBirim + Number.EPSILON) * 100) / 100,
        };
      });

      // Faturayı ve Satırlarını Kaydet
      await prisma.$transaction(async (tx) => {
        const fatura = await tx.fatura.create({
          data: {
            faturaNo,
            tur: 'SATIS',
            cariId: cari!.id,
            orderId: girdi.orderId,
            matrah: Math.round((toplamMatrah + Number.EPSILON) * 100) / 100,
            kdvTutari: Math.round((toplamKdv + Number.EPSILON) * 100) / 100,
            genelToplam: Math.round((girdi.totalAmount + Number.EPSILON) * 100) / 100,
            aciklama: `Sipariş #${girdi.orderNumber} Satış Faturası (${girdi.paymentMethod})`,
            durum: 'ONAYLANDI',
            satirlar: {
              create: satirlar,
            },
          },
        });

        // Cari Hareket: BORÇ İşleme
        const yeniBakiye = (cari!.bakiye || 0) + girdi.totalAmount;
        await tx.cariHareket.create({
          data: {
            cariId: cari!.id,
            islemTuru: 'SATIS_FATURASI',
            belgeNo: fatura.faturaNo,
            aciklama: `Sipariş #${girdi.orderNumber} Satış Faturası Borcu`,
            borc: girdi.totalAmount,
            alacak: 0,
            bakiye: yeniBakiye,
          },
        });

        await tx.cariKart.update({
          where: { id: cari!.id },
          data: { bakiye: yeniBakiye },
        });
      });
    }

    // 3. Sabit Kargo Maliyeti Otomatik Gider Kaydı
    // Sipariş başına varsayılan anlaşmalı kargo maliyeti: 75 TL (KDV Dahil)
    const kargoTutari = process.env.VARSAYILAN_KARGO_MALIYETI
      ? Number(process.env.VARSAYILAN_KARGO_MALIYETI)
      : 75;

    if (kargoTutari > 0) {
      const kargoGiderMevcut = await prisma.expense.findFirst({
        where: {
          invoiceNo: `KRG-${girdi.orderNumber}`,
        },
      });

      if (!kargoGiderMevcut) {
        await prisma.expense.create({
          data: {
            title: `Sipariş Kargo Maliyeti #${girdi.orderNumber}`,
            category: 'SHIPPING',
            amount: kargoTutari,
            vatRate: 20,
            invoiceNo: `KRG-${girdi.orderNumber}`,
            supplier: 'Anlaşmalı Kargo Firması',
            notes: `Sipariş #${girdi.orderNumber} için otomatik yansıtılan anlaşmalı kargo gönderim maliyeti.`,
          },
        });
      }
    }

    return { success: true, cariId: cari.id };
  } catch (err) {
    console.error('siparisMuhasebeyeIsle hatası:', err);
    return { success: false, error: err };
  }
}

/**
 * 2. TAHSİLAT ANINDA OTOMATİK MUHASEBE & CARİ KAPATMA (iyzico / Havale)
 * - Müşterinin 120 Cari hesabına ALACAK işlenir ve borç sıfırlanır/kapatılır.
 * - İlgili Banka/Kasa/POS hesabına GIRIS işlenir ve banka bakiyesi artırılır.
 * - Kartlı tahsilatta (iyzico) POS komisyon kesintisi otomatik GİDER (COMMISSION) olarak kaydedilir.
 */
export async function odemeTahsilatiIsle({
  orderId,
  orderNumber,
  paymentMethod,
  tutar,
  komisyonOrani = 2.99,
}: {
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  tutar: number;
  komisyonOrani?: number;
}) {
  try {
    // 1. İlgili Fatura ve Cariyi Bul
    const fatura = await prisma.fatura.findUnique({
      where: { orderId },
      include: { cari: true },
    });

    if (!fatura || !fatura.cari) {
      console.warn(`odemeTahsilatiIsle: Sipariş #${orderNumber} için fatura/cari bulunamadı.`);
      return { success: false, reason: 'Fatura veya cari bulunamadı' };
    }

    const cari = fatura.cari;

    // 2. Banka / POS Hesabı Bul veya Varsayılan Oluştur
    let bankaHesabi = await prisma.bankaHesabi.findFirst({
      where: {
        OR: [
          { hesapAdi: { contains: paymentMethod === 'CREDIT_CARD' ? 'iyzico' : 'Ziraat', mode: 'insensitive' } },
          { id: { not: '' } },
        ],
      },
    });

    if (!bankaHesabi) {
      bankaHesabi = await prisma.bankaHesabi.create({
        data: {
          hesapAdi: paymentMethod === 'CREDIT_CARD' ? 'iyzico Sanal POS Hesabı' : 'Ziraat Bankası Ticari',
          bankaAdi: paymentMethod === 'CREDIT_CARD' ? 'iyzico / Sanal POS' : 'T.C. Ziraat Bankası',
          subeKodu: 'Merkez',
          hesapNo: '1001-POS',
          iban: 'TR000000000000000000000000',
          bakiye: 0,
        },
      });
    }

    // 3. Komisyon Hesabı (Kredi Kartı / iyzico ise)
    const isKart = paymentMethod === 'CREDIT_CARD';
    const komisyonTutari = isKart ? Math.round(tutar * (komisyonOrani / 100) * 100) / 100 : 0;
    const netHesabaGecen = Math.round((tutar - komisyonTutari) * 100) / 100;

    await prisma.$transaction(async (tx) => {
      // Cari Kapatma: ALACAK Kaydı
      const yeniCariBakiye = Math.round((cari.bakiye - tutar) * 100) / 100;
      await tx.cariHareket.create({
        data: {
          cariId: cari.id,
          islemTuru: isKart ? 'KREDI_KARTI_TAHSILAT' : 'HAVALE_EFT_TAHSILAT',
          belgeNo: `THS-${orderNumber}`,
          aciklama: `Sipariş #${orderNumber} ${isKart ? 'iyzico Sanal POS' : 'Havale/EFT'} Tahsilatı`,
          borc: 0,
          alacak: tutar,
          bakiye: yeniCariBakiye,
        },
      });

      await tx.cariKart.update({
        where: { id: cari.id },
        data: { bakiye: yeniCariBakiye },
      });

      // Banka Girişi: Net Tutar Hesaba Giriş
      const yeniBankaBakiye = Math.round((bankaHesabi!.bakiye + netHesabaGecen) * 100) / 100;
      await tx.bankaHareketi.create({
        data: {
          bankaHesapId: bankaHesabi!.id,
          tur: 'GIRIS',
          tutar: netHesabaGecen,
          aciklama: `Sipariş #${orderNumber} Tahsilatı (${cari.unvan})`,
          belgeNo: `THS-${orderNumber}`,
          cariId: cari.id,
        },
      });

      await tx.bankaHesabi.update({
        where: { id: bankaHesabi!.id },
        data: { bakiye: yeniBankaBakiye },
      });

      // 4. Komisyon Kesintisini Otomatik Gider Yaz
      if (isKart && komisyonTutari > 0) {
        const komisyonMevcut = await tx.expense.findFirst({
          where: { invoiceNo: `KOM-${orderNumber}` },
        });

        if (!komisyonMevcut) {
          await tx.expense.create({
            data: {
              title: `iyzico POS Komisyon Kesintisi #${orderNumber}`,
              category: 'COMMISSION',
              amount: komisyonTutari,
              vatRate: 20,
              invoiceNo: `KOM-${orderNumber}`,
              supplier: 'iyzico / Ödeme Kuruluşu',
              notes: `Sipariş #${orderNumber} tahsilatından kesilen %${komisyonOrani} Sanal POS komisyonu.`,
            },
          });
        }
      }
    });

    return { success: true, netHesabaGecen, komisyonTutari };
  } catch (err) {
    console.error('odemeTahsilatiIsle hatası:', err);
    return { success: false, error: err };
  }
}
