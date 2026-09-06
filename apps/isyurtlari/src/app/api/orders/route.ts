import { NextRequest, NextResponse } from 'next/server';
import { bankaBilgileri, bankaBilgisiTam } from '@/lib/bank';
import { Resend } from 'resend';
import { prisma } from '@isyurtlari/database';
import { emailTemplates } from '@/lib/email-templates';
import { siparisToplami } from '@/lib/fiyat';
import { indirimiKalemlereDagit, kuponuDogrula } from '@/lib/kupon';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { oturumdakiMusteri } from '@/lib/musteri-auth';
import { adresiYazdir } from '@/lib/adres-dogrulama';

// Email sending function
async function sendOrderEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  totalAmount: number,
  items: any[],
  kdvTutari: number
) {
  try {
    const recipientEmail = process.env.EMAIL_RECIPIENT || 'halil.kosger@gmail.com';
    const banka = bankaBilgileri();
    const bankName = banka.bankName;
    const accountName = banka.accountName;
    const iban = banka.iban;

    const itemsHtml = items
      .map(
        (item: any) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || 'Ürün'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₺${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
      )
      .join('');

    const emailContent = `
      <h2 style="color: #FF6000;">🎉 YENİ SİPARİŞ GELDİ!</h2>
      <hr style="border: none; border-top: 2px solid #FF6000; margin: 20px 0;">

      <h3>Müşteri Bilgileri:</h3>
      <p><strong>Adı Soyadı:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Telefon:</strong> ${customerPhone}</p>
      <p><strong>Teslimat Adresi:</strong> ${shippingAddress}</p>
      <p><strong>Sipariş Numarası:</strong> ${orderNumber}</p>

      <h3>Sipariş Detayları:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Ürün Adı</th>
            <th style="padding: 8px; text-align: center;">Miktar</th>
            <th style="padding: 8px; text-align: right;">Fiyat</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="margin-top: 20px;">Ödeme Bilgileri:</h3>
      <p><strong>Toplam Tutar:</strong> <span style="font-size: 18px; color: #FF6000;">₺${totalAmount.toFixed(2)}</span></p>
      <p style="color: #666; font-size: 13px;">Fiyatlara KDV dahildir (₺${kdvTutari.toFixed(2)}). Kargo karşı ödemelidir.</p>
      <p><strong>Ödeme Yöntemi:</strong> Havale/EFT</p>

      <h3>Havale Detayları:</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6000;">
        <p><strong>Banka:</strong> ${bankName}</p>
        <p><strong>Hesap Sahibi:</strong> ${accountName}</p>
        <p><strong>IBAN:</strong> <code style="background: #eee; padding: 5px;">${iban}</code></p>
        <p style="color: #666; font-size: 12px;"><em>Havale açıklamasına sipariş numarasını yazınız: ${orderNumber}</em></p>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">Bu email isyurtlari.com.tr otomatik sipariş bildirimi sistemi tarafından gönderilmiştir.</p>
    `;

    // Using Resend SDK - send to admin
    if (process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

      // Admin notification
      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: recipientEmail,
        subject: `📦 Yeni Sipariş: ${orderNumber}`,
        html: emailContent,
      });

      // Customer confirmation email with template
      const customerEmailHtml = emailTemplates.orderConfirmation({
        orderNumber,
        customerName,
        items: items.map((item: any) => ({
          name: item.product?.name || 'Ürün',
          quantity: item.quantity,
          price: item.price,
        })),
        total: totalAmount,
        kdv: kdvTutari,
        bankName,
        accountName,
        iban,
      });

      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: customerEmail,
        subject: `✅ Siparişiniz Onaylandı - #${orderNumber}`,
        html: customerEmailHtml,
      });
    } else {
      // Fallback: log to console
      console.log(`📧 Email would be sent to ${recipientEmail}: Order ${orderNumber}`);
    }
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the order if email fails
  }
}

export const dynamic = 'force-dynamic';

interface OrderRequest {
  customerName: string;
  email: string;
  phone: string;
  /** Serbest metin adres. Kayitli adres secildiyse gonderilmiyor. */
  shippingAddress?: string;
  /** Musterinin adres defterindeki adresin kimligi. */
  addressId?: string;
  items: { id: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: 'CREDIT_CARD' | 'TRANSFER';
  /** Kupon kodu. İndirim istemciden ALINMIYOR; sunucuda hesaplanıyor. */
  kuponKodu?: string;
}

// Constants for impact calculations
const TRAINING_HOURS_PER_ITEM = 5;
const PRISONERS_PER_ITEM = 0.5; // 1 prisoner supported per 2 items

/** Islem icinde kuponun hakki dolduysa firlatilir. */
class KuponTukendi extends Error {
  constructor() {
    super('Kupon kullanim hakki doldu');
  }
}

/** Islem icinde stok yetmediginde firlatilir; islemin geri alinmasini saglar. */
class StokYetersiz extends Error {
  constructor(public urunAdi: string) {
    super('Yetersiz stok: ' + urunAdi);
  }
}

export async function POST(req: NextRequest) {
  // Hiz siniri: ayni adresten saatte 10 siparis. Her siparis iki e-posta
  // gonderiyor ve stok dusuyor; sinirsiz birakilmasi kotayi tuketebilir ve
  // sahte siparislerle stogu kilitleyebilirdi.
  const sinir = await hizSiniriGuard(req, 'siparis', 10, 3600);
  if (sinir) return sinir;

  try {
    const body: OrderRequest = await req.json();
    // Not: istek govdesi musteri adi, e-posta, telefon ve adres iceriyor;
    // gunluge basilmiyor.

    // Validate input
    if (!body.customerName || !body.email || !body.phone || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }
    if (!body.addressId && !body.shippingAddress?.trim()) {
      return NextResponse.json({ error: 'Teslimat adresi gerekli' }, { status: 400 });
    }

    /**
     * Fiyat sunucuda hesaplaniyor.
     *
     * Onceden siparis, istemciden gelen item.price ve body.totalAmount
     * degerleriyle olusturuluyordu; stok kontrolu icin urun veritabanindan
     * cekiliyor ama fiyati hic karsilastirilmiyordu. Yani istegi elle
     * duzenleyen biri herhangi bir urunu istedigi fiyata - ornegin 1 TL -
     * satin alabilirdi. Istemciden gelen fiyat artik tamamen yok sayiliyor.
     *
     * Kampanya indirimi de burada uygulaniyor, boylece sepette gorulen fiyat
     * ile siparise yazilan fiyat ayni kaynaktan geliyor.
     */
    /**
     * Siparis bir musteri hesabina bagli mi?
     *
     * Giris yapmis musterinin siparisi hesabina yaziliyor; misafir siparisi
     * eskisi gibi calismaya devam ediyor (customerId bos kaliyor). Bunu
     * simdiden yazmak onemli: hesaba baglanmamis siparisleri sonradan
     * eslestirmenin guvenilir bir yolu yok.
     */
    const musteri = await oturumdakiMusteri();

    /**
     * Teslimat adresi.
     *
     * Kayitli adres secildiyse metin VERITABANINDAKI kayittan uretiliyor,
     * istemciden gelenden degil. Istemcinin gonderdigi metne guvenilseydi,
     * istegi elle duzenleyen biri "kayitli adresim" diyip bambaska bir
     * adres yazdirabilirdi. Adresin secen musteriye ait oldugu da burada
     * dogrulaniyor.
     */
    let teslimatAdresi = (body.shippingAddress ?? '').trim();

    if (body.addressId) {
      if (!musteri) {
        return NextResponse.json(
          { error: 'Kayıtlı adres kullanmak için giriş yapmalısınız' },
          { status: 401 }
        );
      }

      const adres = await prisma.address.findFirst({
        where: { id: body.addressId, customerId: musteri.id },
      });

      if (!adres) {
        return NextResponse.json({ error: 'Seçilen adres bulunamadı' }, { status: 400 });
      }

      teslimatAdresi = adresiYazdir(adres);
    }

    if (!teslimatAdresi) {
      return NextResponse.json({ error: 'Teslimat adresi gerekli' }, { status: 400 });
    }

    const simdi = new Date();
    const kalemler: {
      id: string;
      adet: number;
      birimFiyat: number;   // kampanya indirimi uygulanmis, KDV dahil
      listeFiyati: number;  // indirimsiz liste fiyati; indirim toplami icin
      kdvOrani: number | null;
      ad: string;
    }[] = [];

    for (const item of body.items) {
      const adet = Math.floor(Number(item.quantity));
      if (!Number.isFinite(adet) || adet < 1) {
        return NextResponse.json({ error: 'Geçersiz ürün adedi' }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: item.id },
        include: {
          // KDV orani kategoriden geliyor: fiyatlar KDV dahil oldugu icin bu
          // oran toplami degistirmiyor, siparise yazilan KDV kirilimini
          // dogru uretmeye yariyor.
          category: { select: { kdvOrani: true } },
          campaigns: {
            where: {
              campaign: { active: true, startDate: { lte: simdi }, endDate: { gte: simdi } },
            },
            include: { campaign: true },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: `Ürün bulunamadı: ${item.id}` }, { status: 400 });
      }
      if (product.price <= 0) {
        return NextResponse.json(
          { error: `${product.name} için fiyat belirlenmemiş` },
          { status: 400 }
        );
      }
      if (product.quantity < adet) {
        return NextResponse.json(
          { error: `${product.name} için yeterli stok yok (Mevcut: ${product.quantity})` },
          { status: 400 }
        );
      }

      const indirim = product.campaigns[0]?.discount ?? 0;
      const birimFiyat = Math.round(product.price * (1 - indirim / 100) * 100) / 100;

      kalemler.push({
        id: product.id,
        adet,
        birimFiyat,
        listeFiyati: product.price,
        kdvOrani: product.category?.kdvOrani ?? null,
        ad: product.name,
      });
    }

    /**
     * Tutar hesabi lib/fiyat.ts'te; sepet ve odeme sayfasi da ayni fonksiyonu
     * cagiriyor, boylece musteriye gosterilen tutar ile siparise yazilan tutar
     * tek kaynaktan geliyor.
     *
     * Fiyatlar KDV DAHILDIR: KDV toplama eklenmiyor, kalemlerin icinden kendi
     * kategori oraniyla hesaplanip kirilim olarak saklaniyor. Onceden bu uc
     * tum urunlere %10 EKLIYORDU; kartta 100 TL goren musteri 110 TL
     * odiyordu ve bu, sitenin kendi "fiyatlar KDV dahildir" metinleriyle
     * celisiyordu.
     */
    const fiyatKalemleri = kalemler.map((k) => ({
      tutar: k.birimFiyat * k.adet,
      kdvOrani: k.kdvOrani,
    }));

    /**
     * ─── KUPON ──────────────────────────────────────────────────────
     *
     * Doğrulama BURADA yeniden yapılıyor. Ödeme sayfası kuponu daha önce
     * doğrulamış olabilir ama o an ile bu an arasında kupon tükenmiş,
     * süresi dolmuş ya da kapatılmış olabilir. Gövdeden yalnızca KOD
     * alınıyor; indirim tutarı istemciden asla kabul edilmiyor.
     *
     * İndirim kalemlere orantılı dağıtılıyor: fiyatlar KDV dahil ve oran
     * kategoriye göre değişebiliyor, indirimi toplamdan düşüp KDV'yi
     * indirimsiz tutardan hesaplasaydık siparişe gerçekte tahsil
     * edilmeyen bir KDV yazılırdı.
     */
    const kuponKodu = String(body.kuponKodu ?? '').trim();
    let kuponIndirimi = 0;
    let kuponKimligi: string | null = null;
    let kuponYazilanKod: string | null = null;

    if (kuponKodu) {
      const indirimsizToplam = siparisToplami(fiyatKalemleri).urunToplami;
      const kuponSonucu = await kuponuDogrula({
        kod: kuponKodu,
        urunToplami: indirimsizToplam,
        customerId: musteri?.id ?? null,
        eposta: body.email,
      });

      if (!kuponSonucu.gecerli) {
        // Sipariş sessizce kuponsuz oluşturulmuyor: müşteri indirimli tutarı
        // görüp onayladı, farklı bir tutar tahsil etmek doğru olmaz.
        return NextResponse.json({ error: kuponSonucu.mesaj }, { status: 400 });
      }

      kuponIndirimi = kuponSonucu.indirim;
      kuponKimligi = kuponSonucu.kupon?.id ?? null;
      kuponYazilanKod = kuponSonucu.kupon?.kod ?? null;
    }

    const tutar = siparisToplami(
      indirimiKalemlereDagit(fiyatKalemleri, kuponIndirimi).map((k) => ({
        tutar: k.indirimliTutar,
        kdvOrani: k.kdvOrani,
      }))
    );
    const gercekToplam = tutar.toplam;
    const indirimToplami =
      Math.round(
        kalemler.reduce((t, k) => t + (k.listeFiyati - k.birimFiyat) * k.adet, 0) * 100
      ) / 100;

    // Calculate impact metrics
    const totalItemsCount = kalemler.reduce((sum, k) => sum + k.adet, 0);
    const trainingHoursFunded = totalItemsCount * TRAINING_HOURS_PER_ITEM;
    const prisonersSupportedCount = Math.ceil(totalItemsCount * PRISONERS_PER_ITEM);

    /**
     * Siparis, kalemleri, stok dususu ve odeme kaydi tek islemde yaziliyor.
     *
     * Onceden hepsi ayri ayri yapiliyordu ve iki sorun vardi:
     *
     * 1) Asiri satis. Stok kontrolu ile stok dususu arasinda baska bir siparis
     *    araya girebiliyordu; ayni anda gelen iki siparis son urunu ikisi
     *    birden satabiliyordu. Dusum artik "yeterli stok varsa dus" seklinde
     *    tek ifadeyle yapiliyor (updateMany + quantity >= adet kosulu); kosul
     *    tutmazsa hicbir satir guncellenmiyor ve islem geri aliniyor.
     *
     * 2) Yarim kalan siparis. Araya bir hata girerse siparis yazilmis ama
     *    stok dusulmemis ya da odeme kaydi olusmamis olabiliyordu. Artik ya
     *    hepsi yazilir ya hicbiri.
     */
    const siparisiOlustur = async (orderNumber: string) =>
      prisma.$transaction(async (tx) => {
        for (const k of kalemler) {
          const sonuc = await tx.product.updateMany({
            where: { id: k.id, quantity: { gte: k.adet } },
            data: { quantity: { decrement: k.adet } },
          });
          if (sonuc.count === 0) {
            throw new StokYetersiz(k.ad);
          }
        }

        const order = await tx.order.create({
          data: {
            orderNumber,
            status: 'PENDING',
            customerId: musteri?.id ?? null,
            totalAmount: gercekToplam,
            itemsTotal: tutar.urunToplami,
            taxTotal: tutar.kdv,
            shippingCost: tutar.kargo,
            discountTotal: indirimToplami,
            kuponKodu: kuponYazilanKod,
            kuponIndirimi,
            paymentMethod: body.paymentMethod,
            shippingAddress: teslimatAdresi,
            notes: `Müşteri: ${body.customerName} | Email: ${body.email} | Telefon: ${body.phone}`,
            items: {
              create: kalemler.map((k) => ({
                productId: k.id,
                quantity: k.adet,
                price: k.birimFiyat,
              })),
            },
          },
          include: { items: { include: { product: true } } },
        });

        /**
         * Kupon kullanımı sipariş ile AYNI işlemde yazılıyor.
         *
         * Ayrı yazılsaydı, araya bir hata girdiğinde kupon kullanılmış
         * sayılmadan sipariş oluşabilir ya da tersi olabilirdi. Aynı anda
         * gelen iki sipariş son kullanım hakkını birlikte tüketebilir;
         * bunu tamamen kapatmak kupon satırını kilitlemeyi gerektirir ve
         * bu ölçekte gereksiz. Sayım işlem içinde tekrar edilerek pencere
         * milisaniyelere indiriliyor.
         */
        if (kuponKimligi) {
          const kupon = await tx.kupon.findUnique({
            where: { id: kuponKimligi },
            select: { azamiKullanim: true },
          });
          if (typeof kupon?.azamiKullanim === 'number') {
            const kullanilan = await tx.kuponKullanimi.count({
              where: { kuponId: kuponKimligi },
            });
            if (kullanilan >= kupon.azamiKullanim) {
              throw new KuponTukendi();
            }
          }

          await tx.kuponKullanimi.create({
            data: {
              kuponId: kuponKimligi,
              orderId: order.id,
              customerId: musteri?.id ?? null,
              eposta: String(body.email).toLowerCase(),
              indirim: kuponIndirimi,
            },
          });
        }

        await tx.payment.create({
          data: {
            amount: gercekToplam,
            currency: 'TRY',
            method: body.paymentMethod,
            status: 'PENDING',
            description: `Sipariş #${orderNumber}`,
          },
        });

        return order;
      });

    /**
     * Siparis numarasi uretimi.
     *
     * Numara "en son siparisi bul, bir artir" seklinde uretiliyor; ayni anda
     * gelen iki siparis ayni numarayi uretebiliyor ve orderNumber benzersiz
     * oldugu icin ikincisi hata aliyordu. Cakisma durumunda birkac kez
     * yeniden deneniyor.
     */
    let orderWithItems: Awaited<ReturnType<typeof siparisiOlustur>> | null = null;
    let orderNumber = '';

    for (let deneme = 0; deneme < 5; deneme++) {
      const sonSiparis = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      const eslesme = sonSiparis?.orderNumber?.match(/SG-\d+-(\d+)/);
      const sonraki = (eslesme ? parseInt(eslesme[1], 10) : 0) + 1 + deneme;
      orderNumber = `SG-${new Date().getFullYear()}-${String(sonraki).padStart(3, '0')}`;

      try {
        orderWithItems = await siparisiOlustur(orderNumber);
        break;
      } catch (e) {
        if (e instanceof StokYetersiz) {
          return NextResponse.json(
            { error: `${e.urunAdi} için yeterli stok kalmadı` },
            { status: 409 }
          );
        }
        if (e instanceof KuponTukendi) {
          return NextResponse.json(
            { error: 'Kuponun kullanım hakkı bu sırada doldu. Kuponu kaldırıp tekrar deneyin.' },
            { status: 409 }
          );
        }
        // P2002 = benzersizlik ihlali; numara kapilmis, bir sonrakini dene
        if ((e as { code?: string })?.code === 'P2002' && deneme < 4) continue;
        throw e;
      }
    }

    if (!orderWithItems) {
      return NextResponse.json(
        { error: 'Sipariş numarası üretilemedi, lütfen tekrar deneyin' },
        { status: 503 }
      );
    }

    // Send email notification
    await sendOrderEmail(
      orderNumber,
      body.customerName,
      body.email,
      body.phone,
      teslimatAdresi,
      gercekToplam,
      orderWithItems?.items || [],
      tutar.kdv
    );

    return NextResponse.json({
      success: true,
      id: orderWithItems?.id,
      orderId: orderWithItems?.id,
      orderNumber: orderWithItems?.orderNumber,
      status: orderWithItems?.status,
      totalAmount: orderWithItems?.totalAmount,
      itemsTotal: orderWithItems?.itemsTotal,
      taxTotal: orderWithItems?.taxTotal,
      shippingCost: orderWithItems?.shippingCost,
      discountTotal: orderWithItems?.discountTotal,
      kuponKodu: orderWithItems?.kuponKodu,
      kuponIndirimi: orderWithItems?.kuponIndirimi,
      paymentMethod: orderWithItems?.paymentMethod,
      shippingAddress: orderWithItems?.shippingAddress,
      items: orderWithItems?.items || [],
      orderItems: orderWithItems?.items || [],
      impact: {
        trainingHoursFunded,
        prisonersSupportedCount,
        totalItemsCount,
        missionMessage: `🎉 Tebrikler! Sosyal Girişim'e katkı sağladın: ${trainingHoursFunded} saat meslek eğitimi ve ${prisonersSupportedCount} hükümlünün yeniden başlamasını destekledin.`,
      },
      paymentRequired: body.paymentMethod === 'CREDIT_CARD',
      bankDetails:
        body.paymentMethod === 'TRANSFER'
          ? {
              ...bankaBilgileri(),
              eksik: !bankaBilgisiTam(),
              message: `Lütfen havale açıklamasına sipariş numarasını yazınız: ${orderNumber}`,
            }
          : undefined,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('id');

    if (!orderId || orderId === 'undefined') {
      return NextResponse.json({ error: 'Sipariş ID gerekli' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Bu uc kimlik dogrulamasi istemiyor: misafir siparisi veren musteri de
    // onay sayfasini gorebilmeli. Erisim, tahmin edilmesi zor siparis
    // kimligine dayaniyor. Bu yuzden yaniti sayfanin ihtiyaci kadar
    // tutuyoruz - `...order` ile tum kaydi dokmek userId, paymentId gibi
    // sayfanin kullanmadigi alanlari da disari veriyordu.
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemsTotal: order.itemsTotal,
      taxTotal: order.taxTotal,
      shippingCost: order.shippingCost,
      discountTotal: order.discountTotal,
      kuponKodu: order.kuponKodu,
      kuponIndirimi: order.kuponIndirimi,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items || [],
      orderItems: order.items || [],
      bankDetails: order.paymentMethod === 'TRANSFER'
        ? {
            ...bankaBilgileri(),
            eksik: !bankaBilgisiTam(),
          }
        : undefined,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Sipariş getirilemedi' }, { status: 500 });
  }
}
