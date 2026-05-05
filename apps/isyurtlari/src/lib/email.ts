interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

export function getOrderConfirmationEmail(orderNumber: string, customerName: string, total: number) {
  return {
    subject: `Siparişiniz Onaylandı - #${orderNumber}`,
    html: `
      <h2>Merhaba ${customerName},</h2>
      <p>Siparişiniz başarıyla oluşturulmuştur.</p>
      <p><strong>Sipariş Numarası:</strong> #${orderNumber}</p>
      <p><strong>Toplam Tutar:</strong> ₺${total.toFixed(2)}</p>
      <p>Kargo durumunuzu kontrol etmek için hesabınıza giriş yapabilirsiniz.</p>
      <p>Sorularınız için info@isyurtlari.com.tr adresine yazabilirsiniz.</p>
      <br />
      <p>Teşekkürler,<br />isyurtlari.com.tr Ekibi</p>
    `,
  };
}

export function getContactFormEmail(name: string, email: string, message: string) {
  return {
    subject: `Yeni İletişim Formu - ${name}`,
    html: `
      <p><strong>Gönderen:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mesaj:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };
}
