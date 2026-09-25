import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@isyurtlari/database';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

/**
 * Iyzico odeme formu baslatma.
 *
 * ─── NEDEN TUTAR ISTEKTEN ALINMIYOR ───────────────────────────────────
 *
 * Bu uc onceden odenecek tutari istek govdesinden aliyordu:
 *
 *   const { orderId, totalAmount, customerEmail, customerName } = await req.json();
 *
 * Kimlik dogrulamasi da yoktu. Yani herhangi biri 5.000 TL'lik bir siparis
 * olusturup bu uca totalAmount: 1 gonderebilir ve siparisi 1 TL'ye
 * odeyebilirdi. Odeme ucunda istemciden gelen tutara guvenmek, kasayi
 * musteriye teslim etmektir.
 *
 * Artik yalnizca orderId aliniyor; tutar, musteri ve adres siparis
 * kaydindan okunuyor. Zemin saglam: /api/orders siparisi olustururken
 * fiyatlari veritabanindan yeniden hesapliyor, stogu ve kuponu dogruluyor
 * ve istemcinin bildirdigi tutar kendi hesabiyla uyusmazsa siparisi
 * reddediyor. Yani Order.totalAmount guvenilir tek kaynak.
 *
 * ─── EKSIK KALAN ──────────────────────────────────────────────────────
 *
 * Bu uc odeme formunu baslatiyor ama SONUCU DOGRULAMIYOR: istekte
 * callbackUrl yok ve iyzico'nun sonucu bildirecegi bir uc yazilmadi.
 * Yani kart odemesi bu haliyle acilamaz - form acilsa bile odeme
 * dogrulanmaz ve siparis "odendi"ye gecmez. Bkz. YOL-HARITASI.md,
 * Asama 6. Iyzico hesabi acildiginda once o tamamlanmali.
 */

export const dynamic = 'force-dynamic';

function imzaUret(istek: string, gizliAnahtar: string): string {
  return crypto.createHmac('sha1', gizliAnahtar).update(istek).digest('base64');
}

/** Kurus farklarinin birikmemesi icin her tutar iki haneye yuvarlaniyor. */
const ikiHane = (n: number) => Math.round(n * 100) / 100;

/**
 * Siparisteki musteri adi/e-postasi ayri sutunlarda degil: kayitli
 * musteride Customer iliskisinde, misafir siparisinde notes alaninda
 * "Musteri: X | Email: Y | Telefon: Z" bicimindeki metinde duruyor.
 */
function notlardanCek(notes: string | null, etiket: string): string {
  if (!notes) return '';
  const esles = notes.match(new RegExp(`${etiket}:\\s*([^|]+)`, 'i'));
  return esles ? esles[1].trim() : '';
}

/**
 * Teslimat adresi tek bir metin olarak saklaniyor (bkz.
 * lib/adres-dogrulama.ts, adresiYazdir):
 *
 *   Ad Soyad (+905321234567)
 *   Acik adres, Mahalle, Ilce / Sehir, 34000
 *
 * Iyzico sehri ayri istiyor; cozumlenemezse istek reddedilmiyor, alan
 * bos birakilmiyor ve gercek adres yine address alaninda gidiyor.
 */
function adresiCozumle(ham: string) {
  const satirlar = ham.split('\n');
  const baslik = satirlar[0] ?? '';
  const govde = (satirlar.slice(1).join(', ') || baslik).trim();

  const adTelefon = baslik.match(/^(.*?)\s*\((.+?)\)\s*$/);
  const sehir = govde.match(/\/\s*([^,]+)/);
  const postaKodu = govde.match(/\b(\d{5})\b/);

  return {
    ad: adTelefon ? adTelefon[1].trim() : '',
    telefon: adTelefon ? adTelefon[2].replace(/\s/g, '') : '',
    sehir: sehir ? sehir[1].trim() : 'Belirtilmedi',
    postaKodu: postaKodu ? postaKodu[1] : '00000',
    satir: govde || 'Belirtilmedi',
  };
}

export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'iyzico-baslat', 10, 300);
  if (sinir) return sinir;

  try {
    const govde = await req.json().catch(() => ({}));
    const orderId = typeof govde?.orderId === 'string' ? govde.orderId : '';

    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş kimliği eksik' }, { status: 400 });
    }

    const apiAnahtari = process.env.IYZICO_API_KEY;
    const gizliAnahtar = process.env.IYZICO_SECRET_KEY;

    if (!apiAnahtari || !gizliAnahtar) {
      return NextResponse.json({ error: 'Ödeme sağlayıcı yapılandırılmamış' }, { status: 503 });
    }

    const siparis = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true, category: { select: { name: true } } } } } },
        customer: { select: { name: true, email: true, phone: true } },
      },
    });

    /**
     * Bulunamayan siparis ile odenemez durumdaki siparis ayni yaniti
     * aliyor. Farkli yanit vermek, siparis kimligi deneyen birine
     * "bu kimlik var ama odenmis" bilgisini verirdi.
     */
    if (!siparis || siparis.status !== 'PENDING') {
      return NextResponse.json({ error: 'Bu sipariş için ödeme başlatılamıyor' }, { status: 404 });
    }

    if (siparis.paymentMethod !== 'CREDIT_CARD') {
      return NextResponse.json(
        { error: 'Bu sipariş kartla ödeme için oluşturulmamış' },
        { status: 409 }
      );
    }

    if (!(siparis.totalAmount > 0)) {
      return NextResponse.json({ error: 'Sipariş tutarı geçersiz' }, { status: 409 });
    }

    const adres = adresiCozumle(siparis.shippingAddress);

    const adSoyad =
      siparis.customer?.name || notlardanCek(siparis.notes, 'Müşteri') || adres.ad || 'Alıcı';
    const eposta = siparis.customer?.email || notlardanCek(siparis.notes, 'Email');
    const telefon =
      siparis.customer?.phone || notlardanCek(siparis.notes, 'Telefon') || adres.telefon;

    if (!eposta) {
      return NextResponse.json({ error: 'Siparişte e-posta bulunamadı' }, { status: 409 });
    }

    const [ad, ...soyadParcalari] = adSoyad.split(' ');
    const soyad = soyadParcalari.join(' ') || ad;

    /**
     * Sepet kalemleri gercek siparis kalemlerinden uretiliyor; tek satirlik
     * "Siparis #123" yerine urun adlari gidiyor (iyzico paneli, itiraz ve
     * iade sureclerinde okunabilir olmasi icin).
     *
     * price ile paidPrice bilerek farkli olabiliyor: iyzico price alanini
     * sepet kalemlerinin toplamiyla ESIT gormek istiyor, kupon indirimi ise
     * toplamdan dusuluyor. Fark paidPrice'ta gosteriliyor - alani tam da
     * bunun icin var.
     */
    const sepet = siparis.items.map((k) => ({
      id: k.id,
      name: k.product.name.slice(0, 200),
      category1: k.product.category?.name ?? 'El Emeği Ürünleri',
      itemType: 'PHYSICAL' as const,
      price: ikiHane(k.price * k.quantity).toFixed(2),
    }));

    if (siparis.shippingCost > 0) {
      sepet.push({
        id: `${siparis.id}-kargo`,
        name: 'Kargo',
        category1: 'Kargo',
        itemType: 'PHYSICAL' as const,
        price: ikiHane(siparis.shippingCost).toFixed(2),
      });
    }

    const sepetToplami = ikiHane(sepet.reduce((t, k) => t + Number(k.price), 0));
    const odenecek = ikiHane(siparis.totalAmount);

    /**
     * Odenecek tutar sepet toplamindan BUYUK olamaz. Olursa bir hesap
     * hatasi var demektir; iyzico'ya gondermek yerine duruyoruz.
     */
    if (odenecek > sepetToplami + 0.01) {
      console.error('Iyzico: odenecek tutar sepet toplamini asiyor', {
        orderId: siparis.id,
        odenecek,
        sepetToplami,
      });
      return NextResponse.json({ error: 'Sipariş tutarı doğrulanamadı' }, { status: 409 });
    }

    const istemciIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '127.0.0.1';

    const istekGovdesi = {
      locale: 'tr',
      conversationId: siparis.id,
      price: sepetToplami.toFixed(2),
      paidPrice: odenecek.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: siparis.orderNumber,
      paymentChannel: 'WEB',
      pageType: 'PRODUCT',
      clientIp: istemciIp,

      buyer: {
        id: siparis.customerId ?? siparis.orderNumber,
        name: ad,
        surname: soyad,
        gsmNumber: telefon || '+905000000000',
        email: eposta,
        /**
         * TC kimlik numarasi toplanmiyor ve toplanmamali: odeme icin
         * gerekli degil, sizdiginda telafisi olmayan bir veri. Iyzico
         * alani zorunlu tuttugu icin yer tutucu gidiyor. Hesap acildiginda
         * sandbox'ta dogrulanmali.
         */
        identityNumber: '11111111111',
        registrationAddress: adres.satir,
        ip: istemciIp,
        city: adres.sehir,
        country: 'Turkey',
        zipCode: adres.postaKodu,
      },

      billingAddress: {
        contactName: adSoyad,
        city: adres.sehir,
        country: 'Turkey',
        address: adres.satir,
        zipCode: adres.postaKodu,
      },

      shippingAddress: {
        contactName: adSoyad,
        city: adres.sehir,
        country: 'Turkey',
        address: adres.satir,
        zipCode: adres.postaKodu,
      },

      basketItems: sepet,
    };

    const istekMetni = JSON.stringify(istekGovdesi);
    const imza = imzaUret(istekMetni, gizliAnahtar);

    const ucAdresi =
      process.env.NODE_ENV === 'production'
        ? 'https://api.iyzipay.com/v2/checkoutform/initialize'
        : 'https://sandbox-api.iyzipay.com/v2/checkoutform/initialize';

    const yanit = await fetch(ucAdresi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiAnahtari}:${gizliAnahtar}`).toString('base64')}`,
        'X-IYZIPAY-REQUEST-SIGNATURE': imza,
      },
      body: istekMetni,
    });

    const yanitMetni = await yanit.text();

    let sonuc: any;
    try {
      sonuc = JSON.parse(yanitMetni);
    } catch {
      /**
       * Yanit govdesi loglanmiyor: odeme oturumu jetonu ve musteri
       * bilgisi tasiyor, Vercel loglari ise ekip disina da acilabiliyor.
       * Teshis icin durum kodu yeterli.
       */
      console.error('Iyzico yanıtı çözümlenemedi', { durum: yanit.status, orderId: siparis.id });
      return NextResponse.json({ error: 'Ödeme sağlayıcı yanıt vermedi' }, { status: 502 });
    }

    if (!yanit.ok || !sonuc?.checkoutFormContent) {
      console.error('Iyzico hatası', {
        durum: yanit.status,
        kod: sonuc?.errorCode,
        orderId: siparis.id,
      });
      return NextResponse.json(
        { error: sonuc?.errorMessage || 'Ödeme formu oluşturulamadı' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutFormContent: sonuc.checkoutFormContent,
      orderId: siparis.id,
    });
  } catch (error) {
    // Hata metni istemciye verilmiyor: yigin izi ve veritabani mesajlari
    // disari sizabiliyordu.
    console.error('Iyzico başlatma hatası:', error);
    return NextResponse.json({ error: 'Ödeme işlemi başlatılamadı' }, { status: 500 });
  }
}
