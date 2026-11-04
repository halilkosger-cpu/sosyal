/**
 * Ödeme kaydının açıklama metni. Sipariş oluşturulurken yazılır, iyzico
 * dönüşünde aynı metinle tam eşleşme yapılarak ilgili ödeme bulunur.
 *
 * Eşleşme `contains` ile yapılmamalı: SG-2026-100, SG-2026-1000'in
 * açıklamasının da öneki olduğu için yanlış siparişin ödemesi tamamlanırdı.
 */
export function odemeAciklamasi(orderNumber: string): string {
  return `Sipariş #${orderNumber}`;
}
