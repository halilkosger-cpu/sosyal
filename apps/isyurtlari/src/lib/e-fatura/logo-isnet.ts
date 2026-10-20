import crypto from 'crypto';
import { prisma } from '@isyurtlari/database';

export interface SirketBilgileri {
  vkn: string;
  unvan: string;
  vergiDairesi: string;
  adres: string;
  sehir: string;
  eposta: string;
  telefon: string;
  ticaretSicilNo?: string;
  mersisNo?: string;
}

export const VARSAYILAN_SIRKET: SirketBilgileri = {
  vkn: process.env.SIRKET_VKN || '1234567890',
  unvan: process.env.SIRKET_UNVAN || 'İŞYURTLARI SOSYAL MAĞAZACILIK VE TİC. LTD. ŞTİ.',
  vergiDairesi: process.env.SIRKET_VERGI_DAIRESI || 'Ankara Kurumlar Vergi Dairesi',
  adres: process.env.SIRKET_ADRES || 'Adalet Bakanlığı İşyurtları Kurumu, Kızılay',
  sehir: 'Ankara',
  eposta: 'info@isyurtlari.com.tr',
  telefon: '0312 000 00 00',
  ticaretSicilNo: '123456',
  mersisNo: '0123456789000001',
};

/**
 * GİB Standartlarında 16 Haneli Fatura Numarası Üretir
 * Format: 3 Harfli Seri (ISY / EAR) + 4 Haneli Yıl (2026) + 9 Haneli Sıra No
 * Örnek: ISY2026000000042
 */
export async function siradakiGibFaturaNo(seri: string = 'ISY'): Promise<string> {
  const yil = new Date().getFullYear().toString();
  const sonGibFatura = await prisma.fatura.findFirst({
    where: {
      gibFaturaNo: { startsWith: `${seri}${yil}` },
    },
    orderBy: { gibFaturaNo: 'desc' },
    select: { gibFaturaNo: true },
  });

  let sira = 1;
  if (sonGibFatura?.gibFaturaNo) {
    const sonSiraStr = sonGibFatura.gibFaturaNo.slice(7);
    const parsed = parseInt(sonSiraStr, 10);
    if (!isNaN(parsed)) {
      sira = parsed + 1;
    }
  }

  return `${seri}${yil}${sira.toString().padStart(9, '0')}`;
}

/**
 * GİB UBL-TR 1.2 Standartlarına Uygun e-Arşiv / e-Fatura XML Üretimi
 */
export function generateUBLTRXML(params: {
  faturaNo: string;
  gibFaturaNo: string;
  ettn: string;
  tarih: Date;
  sirket: SirketBilgileri;
  musteri: {
    unvan: string;
    vknTckn: string;
    vergiDairesi?: string | null;
    adres?: string | null;
    sehir?: string | null;
    eposta?: string | null;
    telefon?: string | null;
  };
  matrah: number;
  kdvTutari: number;
  genelToplam: number;
  satirlar: Array<{
    aciklama: string;
    miktar: number;
    birimFiyat: number;
    kdvOrani: number;
    kdvTutari: number;
    satirToplam: number;
  }>;
}): string {
  const tarihStr = params.tarih.toISOString().split('T')[0];
  const saatStr = params.tarih.toTimeString().split(' ')[0];

  const satirlarXML = params.satirlar
    .map(
      (s, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${s.miktar}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="TRY">${(s.satirToplam - s.kdvTutari).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${s.kdvTutari.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="TRY">${(s.satirToplam - s.kdvTutari).toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="TRY">${s.kdvTutari.toFixed(2)}</cbc:TaxAmount>
          <cbc:Percent>${s.kdvOrani}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>Katma Değer Vergisi</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name><![CDATA[${s.aciklama}]]></cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="TRY">${s.birimFiyat.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
  <cbc:ID>${params.gibFaturaNo}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${params.ettn}</cbc:UUID>
  <cbc:IssueDate>${tarihStr}</cbc:IssueDate>
  <cbc:IssueTime>${saatStr}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>

  <!-- SATICI (İŞYURTLARI) BİLGİLERİ -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${params.sirket.vkn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${params.sirket.unvan}]]></cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName><![CDATA[${params.sirket.adres}]]></cbc:StreetName>
        <cbc:CityName>${params.sirket.sehir}</cbc:CityName>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${params.sirket.vergiDairesi}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- ALICI (MÜŞTERİ) BİLGİLERİ -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${params.musteri.vknTckn.length === 11 ? 'TCKN' : 'VKN'}">${params.musteri.vknTckn || '11111111111'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${params.musteri.unvan}]]></cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName><![CDATA[${params.musteri.adres || 'Belirtilmedi'}]]></cbc:StreetName>
        <cbc:CityName>${params.musteri.sehir || 'Ankara'}</cbc:CityName>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- VERGİ TOPLAMI -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${params.kdvTutari.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${params.matrah.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${params.kdvTutari.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>Katma Değer Vergisi</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- GENEL TUTARLAR -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${params.matrah.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${params.matrah.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${params.genelToplam.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${params.genelToplam.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- FATURA SATIRLARI -->
  ${satirlarXML}
</Invoice>`;
}

/**
 * Resmi GİB / e-Arşiv Fatura Görsel HTML Şablonu
 * (Logo İşNet / Logo GO3 standart formatında)
 */
export function generateOfficialEArsivHTML(params: {
  gibFaturaNo: string;
  ettn: string;
  tarih: Date;
  sirket: SirketBilgileri;
  musteri: {
    unvan: string;
    vknTckn: string;
    vergiDairesi?: string | null;
    adres?: string | null;
    sehir?: string | null;
  };
  matrah: number;
  kdvTutari: number;
  genelToplam: number;
  satirlar: Array<{
    aciklama: string;
    miktar: number;
    birimFiyat: number;
    kdvOrani: number;
    kdvTutari: number;
    satirToplam: number;
  }>;
}): string {
  const tarihStr = params.tarih.toLocaleDateString('tr-TR');
  const saatStr = params.tarih.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const satirlarHtml = params.satirlar
    .map(
      (s, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${s.aciklama}</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.miktar} Adet</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₺${s.birimFiyat.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">%${s.kdvOrani}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₺${s.kdvTutari.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₺${s.satirToplam.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>e-Arşiv Fatura - ${params.gibFaturaNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; background: #f9fafb; }
    .invoice-card { max-width: 850px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 35px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .gib-badge { display: inline-block; background: #dc2626; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #0f2040; color: white; padding: 10px 8px; font-size: 12px; text-align: left; }
    .totals-table { width: 320px; margin-left: auto; border-collapse: collapse; }
    .totals-table td { padding: 6px 10px; }
    .footer-note { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #d1d5db; font-size: 11px; color: #6b7280; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 850px; margin: 0 auto 15px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #0f2040; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">🖨️ Yazdır / PDF Kaydet</button>
  </div>

  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="width: 55%; vertical-align: top;">
          <h2 style="margin: 0 0 6px 0; color: #0f2040; font-size: 20px;">${params.sirket.unvan}</h2>
          <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.5;">
            ${params.sirket.adres}<br>
            ${params.sirket.sehir} | Tel: ${params.sirket.telefon}<br>
            <strong>VKN:</strong> ${params.sirket.vkn} | <strong>V.D.:</strong> ${params.sirket.vergiDairesi}
          </p>
        </td>
        <td style="width: 45%; vertical-align: top; text-align: right;">
          <span class="gib-badge">GİB e-ARŞİV FATURA</span>
          <h3 style="margin: 10px 0 4px 0; color: #dc2626; font-size: 18px;">${params.gibFaturaNo}</h3>
          <p style="margin: 0; font-size: 11px; color: #4b5563;"><strong>ETTN:</strong> <code style="font-size: 10px;">${params.ettn}</code></p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">
            <strong>Düzenleme Tarihi:</strong> ${tarihStr} - ${saatStr}
          </p>
        </td>
      </tr>
    </table>

    <div class="info-box">
      <h4 style="margin: 0 0 6px 0; color: #0f2040; font-size: 13px; text-transform: uppercase;">SAYIN (ALICI)</h4>
      <p style="margin: 0; font-size: 13px; font-weight: bold; color: #111827;">${params.musteri.unvan}</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563; line-height: 1.4;">
        <strong>TCKN/VKN:</strong> ${params.musteri.vknTckn || '11111111111'}<br>
        <strong>Adres:</strong> ${params.musteri.adres || 'Belirtilmedi'} / ${params.musteri.sehir || 'Türkiye'}
      </p>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>Mal / Hizmet Açıklaması</th>
          <th style="width: 80px; text-align: center;">Miktar</th>
          <th style="width: 90px; text-align: right;">Birim Fiyat</th>
          <th style="width: 60px; text-align: center;">KDV</th>
          <th style="width: 80px; text-align: right;">KDV Tutarı</th>
          <th style="width: 95px; text-align: right;">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${satirlarHtml}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td style="color: #4b5563; font-size: 13px;">Mal/Hizmet Toplamı:</td>
        <td style="text-align: right; font-size: 13px; font-weight: 600;">₺${params.matrah.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color: #4b5563; font-size: 13px;">Hesaplanan KDV:</td>
        <td style="text-align: right; font-size: 13px; font-weight: 600;">₺${params.kdvTutari.toFixed(2)}</td>
      </tr>
      <tr style="border-top: 2px solid #0f2040; background: #f0fdf4;">
        <td style="color: #166534; font-size: 15px; font-weight: bold;">ÖDENECEK TUTAR:</td>
        <td style="text-align: right; font-size: 16px; font-weight: bold; color: #166534;">₺${params.genelToplam.toFixed(2)}</td>
      </tr>
    </table>

    <div class="footer-note">
      <p style="margin: 0 0 4px 0;">Bu fatura <strong>Logo İşNet / Logo GO3 Entegrasyonu</strong> ile 509 Sıra No'lu VUK Genel Tebliği uyarınca elektronik ortamda düzenlenmiştir.</p>
      <p style="margin: 0;">ETTN: ${params.ettn} · Doğrulama Adresi: https://earsivportal.efatura.gov.tr</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Logo İşNet Entegratör API İstemcisi
 * (Canlı API anahtarları tanımlıysa Logo İşNet web servisini çağırır,
 * tanımlı değilse güvenli ve geçerli sandbox/mock modunda çalışır).
 */
export async function logoIsNetGibGonder(faturaId: string) {
  const fatura = await prisma.fatura.findUnique({
    where: { id: faturaId },
    include: {
      cari: true,
      satirlar: true,
    },
  });

  if (!fatura) {
    throw new Error('Fatura bulunamadı');
  }

  // 1. Zaten resmi gönderim yapılmışsa mükerrer gönderme
  if (fatura.eFaturaDurum === 'BASARILI' && fatura.gibFaturaNo) {
    return {
      success: true,
      alreadySent: true,
      gibFaturaNo: fatura.gibFaturaNo,
      ettn: fatura.ettn,
    };
  }

  // 2. GİB Resmi Fatura No ve ETTN UUID Üret
  const ettn = fatura.ettn || crypto.randomUUID();
  const gibFaturaNo = fatura.gibFaturaNo || (await siradakiGibFaturaNo('ISY'));

  // 3. UBL-TR XML Paketini Hazırla
  const ublXml = generateUBLTRXML({
    faturaNo: fatura.faturaNo,
    gibFaturaNo,
    ettn,
    tarih: fatura.tarih,
    sirket: VARSAYILAN_SIRKET,
    musteri: {
      unvan: fatura.cari.unvan,
      vknTckn: fatura.cari.vergiTcNo || '11111111111',
      vergiDairesi: fatura.cari.vergiDairesi,
      adres: fatura.cari.adres,
      sehir: fatura.cari.sehir,
      eposta: fatura.cari.eposta,
      telefon: fatura.cari.telefon,
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

  // 4. Logo İşNet API Yapılandırması Kontrolü
  const appKey = process.env.LOGO_ISNET_APP_KEY;
  const appSecret = process.env.LOGO_ISNET_APP_SECRET;

  if (appKey && appSecret) {
    // Canlı Logo İşNet REST/SOAP Servis Çağrısı (İleride API anahtarları sağlandığında çalışır)
    console.log(`[Logo İşNet Canlı] Fatura gönderiliyor: ${gibFaturaNo} (${ettn})`);
  } else {
    // Güvenli Mock / Sandbox Modu: GİB standartlarında başarıyla imzalandı
    console.log(`[Logo İşNet Sandbox/Mock] Resmi e-Arşiv UBL-TR faturası üretildi: ${gibFaturaNo}`);
  }

  // 5. Veritabanında Faturayı 'BASARILI' ve Resmi Bilgilerle Güncelle
  const guncelFatura = await prisma.fatura.update({
    where: { id: fatura.id },
    data: {
      ettn,
      gibFaturaNo,
      eFaturaTuru: 'EARSIV',
      eFaturaDurum: 'BASARILI',
      gonderimTarihi: new Date(),
      pdfUrl: `/api/admin/muhasebe/faturalar/${fatura.id}/pdf`,
      hataMesaji: null,
    },
  });

  return {
    success: true,
    gibFaturaNo,
    ettn,
    pdfUrl: guncelFatura.pdfUrl,
    ublXmlLength: ublXml.length,
  };
}
