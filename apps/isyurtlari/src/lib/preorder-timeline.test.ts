import { describe, it, expect } from 'vitest';
import { calculateDeliveryDate } from './preorder-timeline';

describe('PreOrderTimeline - calculateDeliveryDate business logic', () => {
  // 1. Standart 5 aşamalı süre (1 + 3 + 1 + 2 + 0 = 7 gün)
  it('1. standart siparişin 5 aşamalı süresini (1+3+1+2+0 gün) doğru hesaplar', () => {
    // 2026-10-01 (Perşembe) başlangıç tarihi
    const baseDate = new Date('2026-10-01T10:00:00.000Z');
    const stepDays = [1, 3, 1, 2, 0]; // Toplam 7 gün

    // skipWeekends: false, hasDelay: false
    const deliveryDate = calculateDeliveryDate(baseDate, stepDays, false, false);

    // 2026-10-01 + 7 gün = 2026-10-08
    expect(deliveryDate.toISOString().slice(0, 10)).toBe('2026-10-08');
  });

  // 2. skipWeekends aktifken hafta sonu atlama mantığı
  it('2. skipWeekends aktifken cumartesi/pazar günlerini atlayarak teslimat tarihini öteler', () => {
    // 2026-10-02 (Cuma) başlangıç
    const baseDate = new Date('2026-10-02T10:00:00.000Z');
    // 3 iş günü: Pazartesi (5 Ekim), Salı (6 Ekim), Çarşamba (7 Ekim)
    const stepDays = [3];

    const deliveryDate = calculateDeliveryDate(baseDate, stepDays, false, true);

    // Cuma + 3 iş günü = Çarşamba (7 Ekim 2026)
    expect(deliveryDate.toISOString().slice(0, 10)).toBe('2026-10-07');
    expect(deliveryDate.getUTCDay()).toBe(3); // Çarşamba (0=Pazar, 6=Cumartesi)
  });

  // 3. hasDelay (üretim gecikmesi) parametresi girildiğinde (+2 veya +4 gün)
  it('3. hasDelay girildiğinde ek gecikme günlerini hesaba katar', () => {
    const baseDate = new Date('2026-10-01T10:00:00.000Z');
    const stepDays = [1, 3, 1, 2, 0]; // 7 gün

    // hasDelay: 4 gün gecikme -> 7 + 4 = 11 gün
    const withNumericDelay = calculateDeliveryDate(baseDate, stepDays, 4, false);
    expect(withNumericDelay.toISOString().slice(0, 10)).toBe('2026-10-12');

    // hasDelay: true (varsayılan +2 gün gecikme) -> 7 + 2 = 9 gün
    const withBooleanDelay = calculateDeliveryDate(baseDate, stepDays, true, false);
    expect(withBooleanDelay.toISOString().slice(0, 10)).toBe('2026-10-10');
  });
});
