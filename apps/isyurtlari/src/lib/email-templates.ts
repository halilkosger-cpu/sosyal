// Responsive HTML email templates

export const emailTemplates = {
  orderConfirmation: (data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    bankName: string;
    accountName: string;
    iban: string;
  }) => `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sipariş Onayı</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #FF6000 0%, #ff7f2e 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #FF6000; }
        .order-number { font-size: 24px; font-weight: bold; color: #FF6000; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #eee; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total-row { background: #f9f9f9; font-weight: bold; font-size: 16px; }
        .total-row td:last-child { color: #FF6000; font-size: 20px; }
        .bank-info { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .bank-info p { margin: 10px 0; }
        .label { font-weight: 600; color: #333; }
        .value { color: #666; word-break: break-all; }
        .iban-code { background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-weight: bold; letter-spacing: 1px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        .button { display: inline-block; padding: 12px 30px; background: #FF6000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        @media (max-width: 600px) {
          .container { width: 100%; }
          table { font-size: 13px; }
          th, td { padding: 8px; }
          .header h1 { font-size: 22px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Siparişiniz Onaylandı</h1>
          <p>Teşekkürler, ${data.customerName}!</p>
        </div>

        <div class="content">
          <div class="section">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>
            <p style="margin-top: 10px;">Siparişiniz başarıyla oluşturulmuştur. İşlem detaylarını aşağıda bulabilirsiniz.</p>
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #FF6000;">
              <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Sipariş Numarası</p>
              <p class="order-number">#${data.orderNumber}</p>
            </div>
          </div>

          <div class="section">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">Sipariş Özeti</h2>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th style="text-align: right;">Fiyat</th>
                </tr>
              </thead>
              <tbody>
                ${data.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}x</td>
                    <td style="text-align: right;">₺${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
                <tr class="total-row">
                  <td colspan="2">TOPLAM</td>
                  <td style="text-align: right;">₺${data.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">💳 Ödeme Bilgileri</h2>
            <div class="bank-info">
              <p><span class="label">Banka:</span> <span class="value">${data.bankName}</span></p>
              <p><span class="label">Hesap Sahibi:</span> <span class="value">${data.accountName}</span></p>
              <p><span class="label">IBAN:</span></p>
              <div class="iban-code">${data.iban}</div>
              <p style="margin-top: 15px; font-size: 12px; color: #666;">
                <strong>⚠️ Önemli:</strong> Lütfen havale yaparken açıklama kısmına sipariş numarasını yazınız: <strong>#${data.orderNumber}</strong>
              </p>
            </div>
          </div>

          <div class="section">
            <p style="margin-bottom: 15px;"><strong>❓ Sorularınız mı var?</strong></p>
            <p>Herhangi bir sorunuz veya sorunuz için <strong>info@isyurtlari.com.tr</strong> adresine yazabilirsiniz.</p>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>Müşteri Desteği Saatleri:</strong> Pazartesi - Cuma 09:00 - 18:00
            </p>
          </div>
        </div>

        <div class="footer">
          <p>© 2024 isyurtlari.com.tr - Sosyal Girişim. Tüm hakları saklıdır.</p>
          <p style="margin-top: 10px; color: #bbb;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  contactConfirmation: (data: { name: string; email: string }) => `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>İletişim Alındı</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #FF6000 0%, #ff7f2e 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #FF6000; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ İletişim Formunuz Alındı</h1>
        </div>

        <div class="content">
          <div class="section">
            <p>Merhaba <strong>${data.name}</strong>,</p>
            <p style="margin-top: 15px;">İletişim formunuz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.</p>
            <p style="margin-top: 15px;">Gönderdiğiniz email adresine yanıt göndereceğiz: <strong>${data.email}</strong></p>
          </div>

          <div class="section">
            <p><strong>💬 Neler beklediğinizi merak ediyorsunuz?</strong></p>
            <ul style="margin: 15px 0 0 20px;">
              <li>Hızlı yanıt: 24 saat içinde</li>
              <li>Uzman ekibimiz: Deneyimli danışmanlar</li>
              <li>Çözüm odaklı: Sorununuza hızlı çözüm</li>
            </ul>
          </div>

          <div class="section">
            <p style="font-size: 14px; color: #666;">
              <strong>İletişim bilgileri:</strong><br>
              📧 Email: info@isyurtlari.com.tr<br>
              🕒 Çalışma Saatleri: Pazartesi - Cuma 09:00 - 18:00
            </p>
          </div>
        </div>

        <div class="footer">
          <p>© 2024 isyurtlari.com.tr - Sosyal Girişim.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  adminNotification: (data: { subject: string; message: string; timestamp: string }) => `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #0F2040; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: white; }
        .section { border-left: 4px solid #FF6000; padding: 15px; margin: 15px 0; background: #f9f9f9; border-radius: 4px; }
        .timestamp { font-size: 12px; color: #999; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 ${data.subject}</h2>
        </div>

        <div class="content">
          <div class="section">
            ${data.message}
          </div>
          <div class="timestamp">
            <strong>Tarih:</strong> ${data.timestamp}
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
};

export type TemplateKey = keyof typeof emailTemplates;
