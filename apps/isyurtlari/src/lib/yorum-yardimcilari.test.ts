import { describe, it, expect } from 'vitest';
import { kisaltilmisAd, notlardakiAd, yorumGovdesiniDogrula } from './yorum-yardimcilari';

describe('kisaltilmisAd', () => {
  it('soyadını baş harfe indirir', () => {
    expect(kisaltilmisAd('Özlem Gürbüz')).toBe('Özlem G.');
    expect(kisaltilmisAd('Ayşe Nur ışık')).toBe('Ayşe Nur I.');
  });
  it('tek kelime ve boş girdiyi işler', () => {
    expect(kisaltilmisAd('Ayşe')).toBe('Ayşe');
    expect(kisaltilmisAd('   ')).toBe('Müşteri');
  });
});

describe('notlardakiAd', () => {
  it('sipariş notundan müşteri adını çıkarır', () => {
    expect(notlardakiAd('Müşteri: Ayşe Yılmaz | Email: a@b.com | Telefon: 0532')).toBe('Ayşe Yılmaz');
  });
  it('not yoksa ya da biçim farklıysa boş döner', () => {
    expect(notlardakiAd(null)).toBe('');
    expect(notlardakiAd('serbest metin')).toBe('');
  });
});

describe('yorumGovdesiniDogrula', () => {
  const uygun = { rating: 5, title: 'Harika', text: 'Çok lezzetli bir ürün, tavsiye ederim.' };

  it('geçerli gövdeyi temizlenmiş hâliyle döndürür', () => {
    expect(yorumGovdesiniDogrula({ ...uygun, rating: '4', title: '  Güzel  ' })).toEqual({
      gecerli: true,
      rating: 4,
      title: 'Güzel',
      text: uygun.text,
    });
  });

  it('boş başlığı null yapar', () => {
    expect(yorumGovdesiniDogrula({ ...uygun, title: '   ' })).toMatchObject({ gecerli: true, title: null });
  });

  it('puan 1-5 dışındaysa reddeder', () => {
    for (const rating of [0, 6, 'x', null, undefined]) {
      expect(yorumGovdesiniDogrula({ ...uygun, rating })).toMatchObject({ gecerli: false });
    }
  });

  it('metin çok kısa ya da çok uzunsa reddeder', () => {
    expect(yorumGovdesiniDogrula({ ...uygun, text: 'kısa' })).toMatchObject({ gecerli: false });
    expect(yorumGovdesiniDogrula({ ...uygun, text: 'a'.repeat(2001) })).toMatchObject({ gecerli: false });
  });

  it('gövde nesne değilse reddeder', () => {
    expect(yorumGovdesiniDogrula(null)).toMatchObject({ gecerli: false });
    expect(yorumGovdesiniDogrula('metin')).toMatchObject({ gecerli: false });
  });
});
