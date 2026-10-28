import { describe, it, expect, beforeEach } from 'vitest';
import { kampanyaGosterilebilir, uygulamaBanneriGosterilebilir, sayfaGoruntulendi, ziyaretSayisi } from './katman-sirasi';

describe('katman sirasi', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('cerez karari yokken kampanya ve banner acilmaz', () => {
    expect(kampanyaGosterilebilir(5)).toBe(false);
    localStorage.setItem('isy_ziyaret_sayisi', '9');
    expect(uygulamaBanneriGosterilebilir()).toBe(false);
  });

  it('kampanya ancak oturumun 2. sayfasinda acilir', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    expect(kampanyaGosterilebilir(sayfaGoruntulendi())).toBe(false);
    expect(kampanyaGosterilebilir(sayfaGoruntulendi())).toBe(true);
  });

  it('ziyaret oturum basina bir kez sayilir, banner 3. ziyarette acilir', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    expect(ziyaretSayisi()).toBe(1);
    expect(ziyaretSayisi()).toBe(1);
    sessionStorage.clear();
    ziyaretSayisi();
    expect(uygulamaBanneriGosterilebilir()).toBe(false);
    sessionStorage.clear();
    expect(uygulamaBanneriGosterilebilir()).toBe(true);
  });
});
