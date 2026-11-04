import { describe, it, expect } from 'vitest';
import {
  HEDIYE_EN_AZ_SIPARIS_TUTARI,
  hediyeKoduUret,
  hediyeKodunuNormallestir,
  telefonuNormallestir,
  epostayiNormallestir,
  hediyeUygunlugu,
  hediyeNotu,
  notHediyeIceriyor,
  hediyePaylasimMetni,
  whatsappPaylasimBaglantisi,
} from './hediye';

describe('hediyeKoduUret', () => {
  it('HD- önekli, okunaklı karakterlerden 5 haneli kod üretir', () => {
    for (let i = 0; i < 50; i++) {
      expect(hediyeKoduUret()).toMatch(/^HD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    }
  });

  it('kodlar birbirinden farklıdır', () => {
    expect(new Set(Array.from({ length: 200 }, () => hediyeKoduUret())).size).toBeGreaterThan(195);
  });
});

describe('hediyeKodunuNormallestir', () => {
  it('küçük harf ve boşlukları düzeltir, geçersiz biçimi reddeder', () => {
    expect(hediyeKodunuNormallestir(' hd-7k2m9 ')).toBe('HD-7K2M9');
    expect(hediyeKodunuNormallestir('HD7K2M9')).toBe('HD-7K2M9');
    expect(hediyeKodunuNormallestir('HD-7K2M')).toBeNull();
    expect(hediyeKodunuNormallestir('XX-7K2M9')).toBeNull();
    expect(hediyeKodunuNormallestir('HD-0O1I9')).toBeNull(); // karıştırılan karakterler yok
    expect(hediyeKodunuNormallestir('')).toBeNull();
    expect(hediyeKodunuNormallestir(undefined)).toBeNull();
  });
});

describe('telefon ve e-posta normalleştirme', () => {
  it('telefonu yalnız son 10 haneye indirir', () => {
    expect(telefonuNormallestir('0532 123 45 67')).toBe('5321234567');
    expect(telefonuNormallestir('+90 (532) 123-45-67')).toBe('5321234567');
    expect(telefonuNormallestir('905321234567')).toBe('5321234567');
    expect(telefonuNormallestir('123')).toBe('');
  });

  it('e-postayı küçük harfe çevirir ve kırpar', () => {
    expect(epostayiNormallestir('  Ayse@Ornek.COM ')).toBe('ayse@ornek.com');
  });
});

describe('hediyeUygunlugu', () => {
  const uygun = {
    kodVar: true,
    kendiKodu: false,
    oncekiSiparisSayisi: 0,
    kullanilmis: false,
    odenecekTutar: HEDIYE_EN_AZ_SIPARIS_TUTARI,
  };

  it('en az sipariş tutarı 2.000 ₺', () => {
    expect(HEDIYE_EN_AZ_SIPARIS_TUTARI).toBe(2000);
  });

  it('tüm koşullar sağlanınca geçerlidir', () => {
    expect(hediyeUygunlugu(uygun)).toEqual({ gecerli: true });
  });

  it('olmayan kodu reddeder', () => {
    expect(hediyeUygunlugu({ ...uygun, kodVar: false })).toMatchObject({ gecerli: false, sebep: 'kod-yok' });
  });

  it('kod sahibi kendi kodunu kullanamaz', () => {
    expect(hediyeUygunlugu({ ...uygun, kendiKodu: true })).toMatchObject({ gecerli: false, sebep: 'kendi-kodu' });
  });

  it('yalnızca ilk siparişte geçerlidir', () => {
    expect(hediyeUygunlugu({ ...uygun, oncekiSiparisSayisi: 1 })).toMatchObject({ gecerli: false, sebep: 'ilk-siparis-degil' });
  });

  it('kişi başı bir kez: daha önce hediye almış kişiye verilmez', () => {
    expect(hediyeUygunlugu({ ...uygun, kullanilmis: true })).toMatchObject({ gecerli: false, sebep: 'kullanilmis' });
  });

  it('2.000 ₺ altındaki siparişte geçerli değildir; mesaj eşiği söyler', () => {
    const s = hediyeUygunlugu({ ...uygun, odenecekTutar: 1999.99 });
    expect(s).toMatchObject({ gecerli: false, sebep: 'tutar-yetersiz' });
    expect((s as { mesaj: string }).mesaj).toContain('2.000');
  });
});

describe('hediye notu', () => {
  it('siparişe işlenen not hediye ibaresini içerir ve tanınır', () => {
    const not = hediyeNotu('HD-7K2M9');
    expect(not).toBe('HEDİYE EKLENECEKTİR (Kod: HD-7K2M9)');
    expect(notHediyeIceriyor(`Müşteri: Ayşe | Email: a@b.com | ${not}`)).toBe(true);
    expect(notHediyeIceriyor('Müşteri: Ayşe | Email: a@b.com')).toBe(false);
    expect(notHediyeIceriyor(null)).toBe(false);
  });
});

describe('hediye paylaşım metni', () => {
  it('kodu, bağlantıyı ve 2.000 ₺ koşulunu içerir (arkadaş şartı baştan bilsin)', () => {
    const metin = hediyePaylasimMetni('https://isyurtlari.com.tr', 'HD-7K2M9');
    expect(metin).toContain('HD-7K2M9');
    expect(metin).toContain('https://isyurtlari.com.tr/?hediye=HD-7K2M9');
    expect(metin).toContain('2.000');
  });

  it('WhatsApp bağlantısı metni kodlayarak taşır', () => {
    const url = whatsappPaylasimBaglantisi('https://isyurtlari.com.tr', 'HD-7K2M9');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe(
      hediyePaylasimMetni('https://isyurtlari.com.tr', 'HD-7K2M9')
    );
  });
});
