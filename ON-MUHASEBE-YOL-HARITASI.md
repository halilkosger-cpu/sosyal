# 📊 isyurtlari.com.tr — Ön Muhasebe ve Finansal Yönetim Yol Haritası

Bu doküman, **isyurtlari.com.tr** e-ticaret platformunda yöneticinin operasyonel kârlılık, mal girdi maliyeti, giderler, stok eşikleri, Türk vergi mevzuatına uygun KDV dengesi ve mali müşavir raporlamasını tek bir merkezden yürütebilmesi için hazırlanan **Ön Muhasebe & Finans Yönetim Sistemi**nin tüm aşamalarını, tamamlanan işlerini ve gelecek adımlarını içerir.

---

## 🎯 Temel Prensipler ve Yasal/Finansal Çerçeve

1. **Yasal Şirket Statüsü:** LTD. ŞTİ. / A.Ş. yapısına uygun matrah, maliyet ve KDV ayrıştırması.
2. **KDV Rejimi:** 
   * Gıda ürünleri grubu: **%1**
   * Temizlik, Hediyelik, Ahşap ve diğer ürünler: **%20**
   * Fiyatlar KDV dahil girilir; sistem faturaya ve rapora esas matrahı (`Tutar / (1 + KDV Oranı / 100)`) ve KDV'yi kuruşu kuruşuna ayırır.
3. **Stok Değerleme & Maliyet Yöntemi:** **Ağırlıklı Ortalama Maliyet (WAV - Weighted Average Cost)**. Yeni parti mal girdiğinde eski stokla harmanlanıp yeni birim maliyet üretilir.
4. **Stok Alarm Eşiği:** Ürün bazlı minimum stok seviyesi (`minStockLevel`), eşik altına indiğinde arayüzde kırmızı alarm + yöneticiye Resend üzerinden anlık e-posta bildirimi.
5. **Gider Grupları:** Kargo/Paketleme (`SHIPPING`), Reklam/Pazarlama (`MARKETING`), Sanal POS/Banka Komisyonları (`COMMISSION`), Genel İşletme/Ofis/Kira (`OPERATIONAL`).
6. **Finansal Göstergeler:** Net Satış Hasılatı, Satılan Malın Maliyeti (SMM / COGS), Brüt Kâr, Faaliyet Giderleri, Dönem Net Kârı ve KDV Dengesi (Hesaplanan KDV vs İndirilecek KDV).

---

## 📋 Geliştirme Aşamaları ve Durum Takibi

### 🟢 Aşama 1: Veritabanı Modelleri & Altyapı
- [x] `packages/database/prisma/schema.prisma` dosyasının yapılandırılması:
  - `Product` modeline: `purchasePrice` (birim alış maliyeti), `vatRate` (KDV oranı), `minStockLevel` (kritik stok eşiği).
  - `OrderItem` modeline: `purchasePrice` (sipariş anındaki birim maliyet - kâr geçmişinin korunması için).
  - `Expense` (Gider) modeli: `date`, `title`, `category`, `amount`, `vatRate`, `invoiceNo`, `supplier`, `notes`.
  - `ExpenseCategory` enum tanımı (`SHIPPING`, `MARKETING`, `COMMISSION`, `OPERATIONAL`).
  - `StockMovement` (Stok Kabul) modeli: Parti mal giriş adedi, birim maliyeti, fatura no, tedarikçi ve WAV geçmişi.
- [x] Prisma Client üretimi (`prisma generate`) ve derleme uyumluluk testi.
- [x] Canlı veritabanı senkronizasyonu için `packages/database/prisma/sql/on-muhasebe.sql` oluşturuldu (Vercel deploy anında otomatik, hatasız ve veri kayıpsız çalışır).

---

### 🟢 Aşama 2: Backend API Rotaları
- [x] **`/api/admin/muhasebe/ozet`**: Günlük/Aylık/Yıllık bazda Gelir Tablosu (P&L), Net Hasılat, SMM, Brüt Kâr, Faaliyet Giderleri, Net Kâr ve KDV Dengesi (Hesaplanan KDV, İndirilecek KDV, Ödenecek/Devreden KDV).
- [x] **`/api/admin/muhasebe/giderler`**: Gider fişi/faturası ekleme (POST), listeleme (GET), silme (DELETE).
- [x] **`/api/admin/muhasebe/stok-hareketleri`**: Mal alış irsaliyesi/faturası girişi (POST) ve Ağırlıklı Ortalama Maliyet (WAV) hesaplayıp ürünün fiyatını ve stoğunu güncelleyen motor.
- [x] **`/api/admin/muhasebe/kritik-stok`**: Stoğu minimum eşiğe (`quantity <= minStockLevel`) eşit veya altına inen ürünlerin anlık listesi.
- [x] **`/api/admin/muhasebe/export`**: Mali müşavir / resmi muhasebe için tek tıkla Excel ve Türkçe karakter uyumlu (UTF-8 BOM) Satış & KDV ve Gider Faturaları CSV çıktısı.
- [x] **Sipariş Entegrasyonu (`/api/orders` & `/api/admin/orders`)**: Sipariş verildiğinde alış maliyetinin `OrderItem` satırına işlenmesi ve admin sipariş detayında sipariş bazlı brüt kârın sunulması.

---

### 🟢 Aşama 3: Tek Ekran Sekmeli (Tab Bar) Yönetici Arayüzü
- [x] **Sol Menü Sadeleştirmesi:** Soldaki ana menüdeki dağınık linkler yerine tek bir **"Ön Muhasebe & Kâr"** merkezi bağlantısı bırakıldı.
- [x] **Tek Ekran + Üst Sekme (Tab) Mimarisi (`/admin/muhasebe`)**: Sayfa yenilenmeden tek ekrandan tüm finansal süreçlerin yönetimi:
  - **Sekme 1: 📈 Gelir Tablosu & Kârlılık (P&L):** Net Hasılat, SMM, Brüt Kâr, Net Faaliyet Kârı kartları; Gelir Tablosu dökümü; KDV Dengesi kartı; Kategori bazlı gider dağılımı.
  - **Sekme 2: 🧾 İşletme Giderleri:** Fatura/fiş ekleme formu (KDV oranı, kategori, tutar, fatura no, tedarikçi) ve filtrelenebilir gider listesi.
  - **Sekme 3: 📦 Mal Kabul & Stok Girişi (WAV):** Ürün seçimi, gelen adet ve birim alış fiyatı ile otomatik ortalama maliyet hesaplama ve geçmiş mal kabul hareketleri dökümü.
  - **Sekme 4: ⚠️ Kritik Stok Uyarısı:** Stoğu tükenen veya eşiğin altına düşen ürünlerin listesi, kırmızı rozetler ve tek tıkla "Hemen Stok Gir" aksiyonu.
- [x] **Muhasebe Excel İndir Menüsü:** Sağ üst köşeden tarih aralığına göre:
  - *📊 Satış & KDV Raporu (.csv)*
  - *🧾 Gider Faturaları Raporu (.csv)* indirme düğmeleri.

---

### 🟢 Aşama 4: Kritik Stok Alarm & E-posta Bildirim Motoru
- [x] Müşteri siparişi tamamlandığında stok anlık düşürülürken `quantity <= minStockLevel` kontrolünün otomatik çalışması.
- [x] Eşiğin altına düşen ürün olduğunda `/admin/muhasebe` ekranında dikkat çekici uyarı rozeti ve banner gösterimi.
- [x] Resend üzerinden yönetici e-posta adresine (`info@isyurtlari.com.tr` / `halil.kosger@gmail.com`) şık HTML formatında ürün adı, kalan stok ve eşik bilgisini içeren **"Kritik Stok Uyarısı"** e-postası iletimi.

---

### 🟢 Aşama 5: Test, Güvenlik ve Canlıya Dağıtım (Deployment)
- [x] Next.js derleme (`next build`) doğrulaması yapıldı: 51 sayfa (SSR, SSG, Static) sıfır hatayla derlendi.
- [x] Veritabanı canlı migrasyon SQL dosyası hazırlandı.
- [x] Git geçmişi commit edildi (`20b9e92`) ve GitHub `main` branch'ine başarıyla gönderildi (Vercel otomatik canlıya aldı).

---

### ⚪ Aşama 6: Gelecek Geliştirmeler & Kalan Eksikler
- [ ] **Katalog Fiyat & Maliyet Girişi:** Fiyatı 0 olan 31 ürünün satış fiyatı ve girdi maliyetlerinin `/admin/fiyatlar` ekranından tamamlanması.
- [ ] **Sipariş Başı Tahmini Kargo Gideri:** Sabit kargo anlaşması tutarının sipariş oluşturulurken otomatik gider olarak işletilmesi opsiyonu.
- [ ] **iyzico Canlı Entegrasyonu:** Kartlı ödeme için callback rotasının yazılması ve canlı API anahtarlarının bağlanması.
- [ ] **Görselleri Eksik 2 Ürün:** *Bez Çanta Setleri* ve *Takı Çantası* fotoğraflarının eklenerek vitrinde yayına alınması.

---

## 📌 Durum Özeti
* **Mevcut Durum:** ✅ Ön Muhasebe, Gider Yönetimi, Mal Kabulü (WAV), Tek Ekran Sekmeli Arayüz ve Excel Export başarıyla tamamlandı ve canlıya alındı.
* **Canlı Erişim:** `https://isyurtlari.com.tr/admin/muhasebe`
* **Son Güncelleme:** 20 Ekim 2026
