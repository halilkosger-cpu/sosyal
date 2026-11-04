/**
 * Yorum ve teşekkür mesajları: tek kaynak.
 *
 * Metinler iş sahibiyle birlikte yazıldı ve onaylandı (4 Kasım 2026). Ürün
 * sayfası, yorum ucu, sipariş onay sayfası ve sipariş e-postası aynı metni
 * kullanır; biri değişirse diğerleri ayrışmasın diye burada duruyor.
 *
 * Kurallar (değiştirirken korunmalı):
 *  - Dürüst görüş istenir; olumlu yorum, 5 yıldız ya da ödül istenmez. Yorum
 *    karşılığı ödül tüketici mevzuatına ve Google/Merchant kurallarına aykırıdır.
 *  - Yayın güvence altına alınmaz: her yorum kısa bir kontrolden geçer.
 *  - Etki rakamı (kaç hükümlü, kaç saat vb.) yazılmaz; kanıtlanamıyor.
 */

/** Yorum yazmadan önce: gerginliği alan, motive eden. */
export const YORUM_ONCESI_METNI =
  'Ürünü denediniz, şimdi sıra sizde. Güzel ya da eksik, ne düşünüyorsanız yazın; ' +
  'her söz bir sonraki müşterimize yol gösterir.';

/** Yorum gönderildikten sonra: teşekkür; yayının kısa bir kontrole bağlı olduğunu söyler. */
export const YORUM_SONRASI_TESEKKUR =
  'Çok teşekkür ederiz! Bu paylaşım, İŞYURTLARI atölyelerinde özenle sürdürülen üretim ' +
  'süreçlerine katkı sağlıyor ve motivasyonumuzu artırıyor. ' +
  'Yorumunuzu kısa bir kontrolden sonra yayına alacağız.';

/** Sipariş tamamlanınca (onay sayfası ve e-postası): teşekkür ve görüş daveti. */
export const SIPARIS_TESEKKUR_METNI =
  'Ayırdığınız değerli zaman ve siparişiniz için çok teşekkür ederiz. Aldığınız her ürün ' +
  'bir İŞYURTLARI atölyesi ve/veya fabrikasında özenle hazırlanan üretim ve kalite ' +
  "süreçlerinden geçti. İŞYURTLARI'nda çalışma statüsü kazanan hükümlülerin ücret " +
  'karşılığı çalışıp meslek öğrenmesine, topluma kazandırılmasına katkı verdiniz. ' +
  'Ürünü deneyince düşüncelerinizi bizimle paylaşmanız, bizlere onur verecektir.';
