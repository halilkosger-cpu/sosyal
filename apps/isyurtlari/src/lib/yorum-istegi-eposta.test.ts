import { describe, it, expect } from 'vitest';
import { yorumIstegiEpostasi } from './yorum-istegi-eposta';

const temel = {
  ad: 'Ayşe',
  kalemler: [
    { ad: 'Siyah Zeytin 1000GR', baglanti: 'https://isyurtlari.com.tr/yorum/jeton-1' },
    { ad: 'Elban Gül Reçeli', baglanti: 'https://isyurtlari.com.tr/yorum/jeton-2' },
  ],
  paylasimBaglantisi: 'https://wa.me/?text=merhaba',
  retBaglantisi: 'https://isyurtlari.com.tr/ileti-tercihi?m=1&s=2',
};

describe('yorumIstegiEpostasi', () => {
  it('kararlaştırılan konu satırını kullanır', () => {
    expect(yorumIstegiEpostasi(temel).konu).toBe('Ürününüz nasıldı? Düşüncenizi duymak isteriz');
  });

  it('her ürün için ürün adını ve kendi yorum bağlantısını içerir', () => {
    const { html } = yorumIstegiEpostasi(temel);
    for (const k of temel.kalemler) {
      expect(html).toContain(k.ad);
      expect(html).toContain(`href="${k.baglanti}"`);
    }
  });

  it('dürüst görüş ister: olumlu yorum, 5 yıldız, ödül ya da indirim vaadi yok', () => {
    const { html } = yorumIstegiEpostasi(temel);
    expect(html).toContain('Güzel ya da eksik');
    expect(html.toLowerCase()).not.toMatch(/5 yıldız|olumlu yorum|ödül|indirim kazan/);
  });

  it('bağlantıların kişiye özel, tek kullanımlık ve süreli olduğunu söyler', () => {
    const { html } = yorumIstegiEpostasi(temel);
    expect(html).toContain('size özel');
    expect(html).toContain('bir kez');
    expect(html).toContain('60 gün');
  });

  it('paylaşım bağlantısı varsa paylaşım bloğunu ekler, yoksa eklemez', () => {
    expect(yorumIstegiEpostasi(temel).html).toContain('href="https://wa.me/?text=merhaba"');
    const kodsuz = yorumIstegiEpostasi({ ...temel, paylasimBaglantisi: null }).html;
    expect(kodsuz).not.toContain('wa.me');
    expect(kodsuz).not.toContain('WhatsApp');
  });

  it('ticari ileti dipnotu ve çıkış (ret) bağlantısı her zaman vardır', () => {
    const { html } = yorumIstegiEpostasi(temel);
    expect(html).toContain('ticari elektronik ileti');
    // Adres HTML özniteliğinde olduğundan "&" işareti "&amp;" olarak yazılır (doğru HTML).
    expect(html).toContain('href="https://isyurtlari.com.tr/ileti-tercihi?m=1&amp;s=2"');
  });

  it('kullanıcı/ürün adlarındaki HTML kaçırılır (e-postaya kod enjekte edilemez)', () => {
    const { html } = yorumIstegiEpostasi({
      ...temel,
      ad: '<img src=x onerror=alert(1)>',
      kalemler: [{ ad: '<script>alert(1)</script>', baglanti: temel.kalemler[0].baglanti }],
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });
});
