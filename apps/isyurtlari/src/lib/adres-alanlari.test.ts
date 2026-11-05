import { describe, it, expect } from 'vitest';
import { acikAdresOlustur } from './adres-alanlari';
import { adresiDogrula } from './adres-dogrulama';

describe('acikAdresOlustur', () => {
  it('tum parcalar doluysa sirali tek satir uretir', () => {
    expect(
      acikAdresOlustur({ sokak: 'Atatürk Caddesi', binaSite: 'Güneş Sitesi', kat: '3', daireNo: '12' })
    ).toBe('Atatürk Caddesi, Bina/Site: Güneş Sitesi, Kat: 3, Kapı No: 12');
  });

  it('opsiyonel bina ve kat bos ise atlar', () => {
    expect(acikAdresOlustur({ sokak: 'Lale Sokak', binaSite: '', kat: null, daireNo: '5' })).toBe(
      'Lale Sokak, Kapı No: 5'
    );
  });
});

describe('adresiDogrula (yapilandirilmis mod)', () => {
  const temel = {
    title: 'Ev',
    fullName: 'Ayşe Demir',
    phone: '0532 123 45 67',
    city: 'Ankara',
    district: 'Çankaya',
    neighborhood: 'Kızılay Mahallesi',
    postalCode: '06420',
  };

  it('sokak ve kapi no ile addressLine uretir', () => {
    const sonuc = adresiDogrula({ ...temel, sokak: 'Atatürk Bulvarı', kat: '2', daireNo: '7' });
    expect(sonuc.hata).toBeUndefined();
    expect(sonuc.adres?.addressLine).toBe('Atatürk Bulvarı, Kat: 2, Kapı No: 7');
    expect(sonuc.adres?.sokak).toBe('Atatürk Bulvarı');
  });

  it('kapi no eksikse hata verir', () => {
    const sonuc = adresiDogrula({ ...temel, sokak: 'Atatürk Bulvarı', daireNo: '' });
    expect(sonuc.hata).toBe('Kapı no gerekli');
  });

  it('mahalle eksikse hata verir', () => {
    const sonuc = adresiDogrula({ ...temel, neighborhood: '', sokak: 'Atatürk Bulvarı', daireNo: '7' });
    expect(sonuc.hata).toBe('Mahalle bilgisi gerekli');
  });
});
