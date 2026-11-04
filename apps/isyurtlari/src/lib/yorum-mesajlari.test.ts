import { describe, it, expect } from 'vitest';
import { YORUM_ONCESI_METNI, YORUM_SONRASI_TESEKKUR, SIPARIS_TESEKKUR_METNI } from './yorum-mesajlari';
import { emailTemplates } from './email-templates';

describe('yorum ve teşekkür mesajları', () => {
  it('yorum öncesi metin dürüst görüş ister, olumlu yorum istemez', () => {
    expect(YORUM_ONCESI_METNI).toContain('Güzel ya da eksik');
    expect(YORUM_ONCESI_METNI.toLowerCase()).not.toMatch(/5 yıldız|olumlu|ödül|hediye/);
  });

  it('yorum sonrası teşekkür, yayını güvence altına almaz: kısa kontrolü belirtir', () => {
    expect(YORUM_SONRASI_TESEKKUR).toContain('kısa bir kontrolden sonra');
    expect(YORUM_SONRASI_TESEKKUR).toContain('Çok teşekkür ederiz');
  });

  it('sipariş teşekkürü yorum isteğini içerir ve ödül/indirim vaat etmez', () => {
    expect(SIPARIS_TESEKKUR_METNI).toContain('düşüncelerinizi bizimle paylaşmanız');
    expect(SIPARIS_TESEKKUR_METNI.toLowerCase()).not.toMatch(/5 yıldız|olumlu|ödül|indirim/);
  });
});

describe('sipariş onay e-postası', () => {
  it('teşekkür ve yorum isteği metnini içerir', () => {
    const html = emailTemplates.orderConfirmation({
      orderNumber: 'SG-2026-001',
      customerName: 'Ayşe',
      items: [{ name: 'Siyah Zeytin', quantity: 1, price: 350 }],
      total: 350,
      bankName: 'Banka',
      accountName: 'Hesap',
      iban: 'TR00',
    });
    expect(html).toContain('düşüncelerinizi bizimle paylaşmanız');
  });
});
