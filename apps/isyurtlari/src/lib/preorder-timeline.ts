/**
 * PreOrderTimeline - Ön Sipariş İlerleme ve Teslimat Hesaplama Mantığı
 */

export interface PreOrderStep {
  id: string;
  label: string;
  description: string;
  days: number;
}

export const PREORDER_STEPS: PreOrderStep[] = [
  { id: 'ordered', label: 'Sipariş Alındı', description: 'Ön sipariş kaydınız oluşturuldu', days: 1 },
  { id: 'sourcing', label: 'Tedarik', description: 'Hükümlü atölyelerinden ham madde ve üretim', days: 3 },
  { id: 'qc', label: 'Kalite Kontrol', description: 'El emeği ürünlerin hassas denetimi', days: 1 },
  { id: 'shipping', label: 'Kargo', description: 'PTT / Yurtiçi Kargo transferi', days: 2 },
  { id: 'delivery', label: 'Teslimat', description: 'Alıcı adresine teslimat', days: 0 },
];

/**
 * Teslimat tarihini aşama günleri, gecikme ve hafta sonu kurallarına göre hesaplar.
 *
 * @param baseDate Başlangıç tarihi (sipariş anı)
 * @param stepDays Her aşamanın gün dizisi [1, 3, 1, 2, 0] veya toplam gün sayısı
 * @param hasDelay Üretim gecikmesi (boolean ise varsayılan +2 gün, sayı ise belirtilen gün)
 * @param skipWeekends true ise cumartesi ve pazar günleri atlanarak iş günü hesabı yapılır
 */
export function calculateDeliveryDate(
  baseDate: Date | string,
  stepDays: number[] | number,
  hasDelay: boolean | number = false,
  skipWeekends: boolean = false
): Date {
  const current = new Date(baseDate);

  // Toplam temel gün sayısı
  const baseDays = Array.isArray(stepDays)
    ? stepDays.reduce((acc, d) => acc + d, 0)
    : stepDays;

  // Gecikme gün sayısı (+2 veya sayısal değer)
  let delayDays = 0;
  if (typeof hasDelay === 'number') {
    delayDays = hasDelay;
  } else if (hasDelay === true) {
    delayDays = 2; // Varsayılan gecikme payı
  }

  const totalDaysToAdd = baseDays + delayDays;

  if (!skipWeekends) {
    current.setUTCDate(current.getUTCDate() + totalDaysToAdd);
    return current;
  }

  // Hafta sonlarını (Cumartesi = 6, Pazar = 0) atlayarak ekle
  let added = 0;
  while (added < totalDaysToAdd) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayOfWeek = current.getUTCDay();
    // 0 = Pazar, 6 = Cumartesi
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return current;
}
