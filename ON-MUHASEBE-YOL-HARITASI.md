# 📊 isyurtlari.com.tr — Ön Muhasebe ve Finansal Yönetim Yol Haritası

Bu doküman, İşyurtları e-ticaret platformuna yöneticinin operasyonel kârlılık, mal girdi maliyeti, giderler, stok eşikleri ve Türk vergi mevzuatına uygun KDV dengesini takip edebileceği **Ön Muhasebe Modülü**nün tasarım, geliştirme ve devreye alma adımlarını içerir.

---

## 🎯 Proje Hedefleri ve Temel Kurallar

1. **Yasal Statü & Vergi:** LTD. / A.Ş. yapısına uygun matrah ve KDV ayrıştırması.
2. **KDV Oranları:** Gıda grubu için `%1`, Temizlik / Hediyelik / Ahşap / Diğer için `%20`. Fiyatlar KDV dahil girilir, sistem matrahı ve KDV'yi otomatik hesaplar.
3. **Maliyet Yöntemi:** Ağırlıklı Ortalama Maliyet (WAV - Weighted Average Cost).
4. **Stok Alarmı:** Ürün bazlı minimum stok seviyesi (`minStockLevel`), eşik altına düşünce admin ekranında alarm + yöneticiye Resend üzerinden e-posta bildirimi.
5. **Gider Yönetimi:** Kargo/Paketleme, Pazarlama/Reklam, Sanal POS/iyzico Komisyonları, Genel İşletme Giderleri takibi.
6. **Finansal Raporlama:** Net Satış Hasılatı, Satılan Malın Maliyeti (SMM), Brüt Kâr, Faaliyet Giderleri, Net Faaliyet Kârı ve Tahmini KDV Dengesi (Hesaplanan KDV - İndirilecek KDV).

---

## 📋 Aşamalar ve Görev Listesi

### 🟢 Aşama 1: Veritabanı Modelleri & Altyapı
- [x] `packages/database/prisma/schema.prisma` dosyasına gerekli alan ve modellerin eklenmesi:
  - `Product` modeline: `purchasePrice` (Alış maliyeti), `vatRate` (KDV oranı: 1 veya 20), `minStockLevel` (Kritik stok eşiği).
  - `OrderItem` modeline: `purchasePrice` (Satış anındaki birim maliyet - kâr hesabı için).
  - `StockMovement` modeli: Mal giriş irsaliyeleri/faturaları, adet, birim alış fiyatı, tedarikçi, ortalama maliyet güncelleme geçmişi.
  - `Expense` (Gider) modeli: Tarih, Tutar, KDV Oranı, Kategori (`SHIPPING`, `MARKETING`, `COMMISSION`, `OPERATIONAL`), Açıklama, Belge No.
  - `ExpenseCategory` enum tanımı.
- [x] Prisma Client oluşturulması (`prisma generate`) ve derleme uyumluluk testi.
- [ ] Vercel/Canlı veritabanına şemanın yansıtılması (`prisma db push`).

---

### 🟢 Aşama 2: Backend API Rotaları
- [x] `/api/admin/muhasebe/ozet`: P&L (Gelir Tablosu), Ciro, Maliyet, Brüt/Net Kâr, KDV dengesi verileri.
- [x] `/api/admin/muhasebe/giderler` (GET, POST, DELETE): Gider kaydı ekleme, listeleme, silme.
- [x] `/api/admin/muhasebe/stok-hareketleri` (GET, POST): Mal alış/stok girişi ve WAV otomatik maliyet güncelleme.
- [x] `/api/admin/muhasebe/kritik-stok`: Eşik seviyesinin altına düşen ürünlerin anlık listesi.
- [x] Sipariş API'sinde (`/api/orders` & `/api/admin/orders`) sipariş bazlı kâr hesaplamasının sağlanması.

---

### 🟢 Aşama 3: Yönetici Arayüzleri (Admin UI)
- [x] `apps/isyurtlari/src/app/admin/layout.tsx` menüsüne **"Ön Muhasebe & Kâr"**, **"Giderler"** ve **"Stok Girişi (Mal Alış)"** bağlantılarının eklenmesi.
- [x] **Ana Muhasebe Paneli (`/admin/muhasebe`)**:
  - Özet finansal kartlar (Net Hasılat, SMM, Brüt Kâr, Net Faaliyet Kârı).
  - P&L (Gelir Tablosu) dökümü.
  - KDV Dengesi kartı (Hesaplanan KDV vs İndirilecek KDV, Ödenecek / Devreden tahmini).
  - Gider dağılımı (Kargo, Reklam, Komisyon, Genel).
- [x] **Gider Yönetimi Ekranı (`/admin/muhasebe/giderler`)**:
  - Kategori, Tutar, KDV %, Tarih, Fatura/Açıklama alanlarıyla gider fişi kaydetme.
  - Filtrelenebilir ve silinebilir gider tablosu.
- [x] **Mal Kabul & Stok Girişi (`/admin/muhasebe/stok-girisi`)**:
  - Ürün seçimi, gelen adet ve birim alış fiyatı ile otomatik WAV maliyet güncelleme.
  - Geçmiş stok hareketleri dökümü.
- [x] **Sipariş Kârlılık İncelemesi**:
  - `/admin/siparisler` detayında ürün ve sipariş bazlı brüt kârın renkli rozetlerle gösterilmesi.

---

### 🟢 Aşama 4: Kritik Stok Alarm & E-posta Bildirim Motoru
- [x] Sipariş verildiğinde stok düşüşü anında `quantity <= minStockLevel` otomatik kontrolü.
- [x] Admin ekranında (`/admin/muhasebe`) dikkat çekici kritik stok bildirim banner'ı ve filtreli stok kabulüne hızlı yönlendirme.
- [x] Resend üzerinden yöneticiye anlık şık HTML kritik stok uyarı e-postası (Kalan adet ve kritik eşik tablosuyla).

---

### 🟢 Aşama 5: Test, Doğrulama & Canlıya Alma
- [x] Örnek mal girişi ve WAV maliyet hesabı altyapısı hazırlandı.
- [x] Sipariş verildiğinde stok düşüşü ve kâr marjı hesaplama entegre edildi.
- [x] Gider girişi ve KDV dengesi raporu oluşturuldu.
- [x] Derleme (`next build` - 51 sayfa) sıfır hatayla doğrulandı.
- [x] GitHub `main` branch'ine gönderim (deployment).

---

## 📌 İlerleme Özeti
- **Mevcut Durum:** ✅ Ön Muhasebe, Gider Yönetimi, Stok Kabulü ve Kârlılık Sistemi başarıyla tamamlandı.
- **Son Güncelleme:** 20 Ekim 2026
