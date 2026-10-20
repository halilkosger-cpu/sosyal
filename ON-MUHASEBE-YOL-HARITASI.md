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

### 🟢 Aşama 4: Logo GO3 ERP Ön Muhasebe Modülleri Entegrasyonu
- [x] **Logo GO3 Cari Hesap Modülü (120 Alıcılar / 320 Satıcılar):**
  - Kodlama standardı: `CH-120-XXXX` (Müşteriler / Alıcılar) ve `CH-320-XXXX` (Tedarikçi Cezaevleri & Toptancılar).
  - Muhasebe hesap planı kodları (`120.01.xxx`, `320.01.xxx`), Vergi Dairesi/TCKN, şehir ve anlık bakiye takibi.
  - Cari Hesap Ekstresi: Tarih sıralı Borç, Alacak ve Yürüyen Bakiye dökümü (`/api/admin/muhasebe/cariler/ekstre`).
  - Hızlı Cari Kart Oluşturma: Modal pencereden tek tıkla yeni müşteri veya tedarikçi kartı açma.
- [x] **Logo GO3 Fatura & İrsaliye Modülü:**
  - Satış Faturaları: `FTR-2026-XXXXX` seri numarası, KDV dahil genel toplam, net matrah ve KDV tutarı ayrıştırması.
  - Satınalma / Alış Faturaları: `ALIS-2026-XXXXX` seri numarası ile tedarikçi mal kabulleri.
  - Otomatik Cari Entegrasyonu: Fatura kaydedildiğinde Alıcı cari hesabına anında BORÇ, Satıcı cari hesabına ALACAK olarak işlenir; bakiye otomatik güncellenir.
- [x] **Logo GO3 Banka & Kasa Modülü:**
  - Banka Hesap Tanımları: Ziraat, İş Bankası, Vakıfbank vb. IBAN ve hesap adı tanımlama.
  - Havale / EFT Tahsilat & Ödeme: Cari seçimi ile bankaya giriş (tahsilat) veya bankadan çıkış (tedarikçi ödemesi).
  - Cari Bakiye Kapatma: Tahsilat yapıldığında müşterinin borcu düşer (ALACAK işlenir), banka bakiyesi artar; ödeme yapıldığında tedarikçinin alacağı kapatılır (BORÇ işlenir).

---

### 🟢 Aşama 5: Tek Ekran 7 Sekmeli (Tab Bar) Logo GO3 Yönetici Kokpiti
- [x] **Tek Ekran Sekmeli Mimari (`/admin/muhasebe`)**: Sayfa yenilenmeksizin sekmeler arasında anlık geçiş:
  - **Sekme 1: 📈 Gelir Tablosu & Kârlılık (P&L):** Net Hasılat, SMM, Brüt Kâr, Net Kâr; Gelir Tablosu; KDV Dengesi (Hesaplanan vs İndirilecek); Kategori bazlı gider pasta/bar dağılımı.
  - **Sekme 2: 👥 Cari Hesaplar (120 / 320):** Alıcı ve Satıcı listesi, anlık bakiyeler, borç/alacak durumu, tek tıkla **"Cari Ekstre İncele"** modalı ve **"Yeni Cari Aç"** penceresi.
  - **Sekme 3: 📑 Fatura & İrsaliye:** Satış ve Satınalma faturaları, matrah/KDV detayları, cari unvanı, durum rozetleri ve **"Yeni Fatura Kes"** modalı.
  - **Sekme 4: 🏦 Banka & Kasa:** Tanımlı banka hesapları, güncel bakiyeler, hesap hareketleri (Havale/EFT) ve **"Havale/EFT İşlemi Yap"** modalı.
  - **Sekme 5: 🧾 İşletme Giderleri:** Kargo, Reklam, Komisyon, Genel gider giriş formu ve filtrelenebilir döküm.
  - **Sekme 6: 📦 Mal Kabul & WAV:** Tedarikçiden gelen parti mal girişi, Ağırlıklı Ortalama Maliyet (WAV) hesaplayıcısı.
  - **Sekme 7: ⚠️ Kritik Stok Alarmı:** Stoğu kritik seviyenin (`minStockLevel`) altına inen ürünler ve anlık uyarılar.
- [x] **Muhasebe Excel İndir Menüsü:** Sağ üst köşeden tarih aralığına göre:
  - *📊 Satış & KDV Raporu (.csv)*
  - *🧾 Gider Faturaları Raporu (.csv)* indirme düğmeleri.

---

### 🟢 Aşama 6: Kritik Stok Alarm & E-posta Bildirim Motoru
- [x] Müşteri siparişi tamamlandığında stok anlık düşürülürken `quantity <= minStockLevel` kontrolünün otomatik çalışması.
- [x] Eşiğin altına düşen ürün olduğunda `/admin/muhasebe` ekranında dikkat çekici uyarı rozeti ve banner gösterimi.
- [x] Resend üzerinden yönetici e-posta adresine (`info@isyurtlari.com.tr` / `halil.kosger@gmail.com`) şık HTML formatında ürün adı, kalan stok ve eşik bilgisini içeren **"Kritik Stok Uyarısı"** e-postası iletimi.

---

### 🟢 Aşama 7: Test, Güvenlik ve Derleme Doğrulaması
- [x] Next.js derleme (`next build`) doğrulaması yapıldı: 51 sayfa ve 10 muhasebe API rotası sıfır hatayla derlendi.
- [x] Veritabanı canlı migrasyon SQL dosyası (`packages/database/prisma/sql/logo-go3-modulleri.sql`) hazırlandı.
- [x] Vercel deploy anında otomatik, hatasız ve veri kayıpsız çalışan SQL senkronizasyonu bağlandı.

---

### 🟢 Aşama 8: Otomatik Kargo Gideri & iyzico POS / Tahsilat Entegrasyonu
- [x] **Sipariş Başı Otomatik Kargo Maliyeti (`/lib/muhasebe-entegrasyonu.ts`):**
  - Her sipariş geldiğinde varsayılan 75 TL anlaşmalı kargo maliyeti `KRG-<siparisNo>` fişiyle anında `Expense` (`SHIPPING`) tablosuna işletilir.
  - P&L ve Gelir Tablosunda anlık kargo kâr/zarar dengesi otomatik görünür.
- [x] **iyzico Callback & Tahsilat & Komisyon Entegrasyonu (`/api/checkout/iyzico/callback`):**
  - iyzico ödeme formu tamamlandığında gelen `token` iyzico servisiyle doğrulanır.
  - Ödeme başarılı olduğunda sipariş `CONFIRMED`, `Payment` kaydı `COMPLETED` yapılır.
  - Müşteri 120 Cari Kartına satış faturası karşılığı ALACAK işlenerek cari bakiye kapatılır.
  - Banka/POS hesabına net tahsilat tutarı GIRIS olarak işlenir.
  - %2.99 Sanal POS komisyon kesintisi `KOM-<siparisNo>` fişiyle otomatik olarak `Expense` (`COMMISSION`) tablosuna kaydedilir.
- [x] **Havale/EFT Yönetici Onayı Tahsilat Entegrasyonu (`/api/admin/orders/[id]`):**
  - Yönetici panelden siparişi onayladığında (`PENDING` -> `CONFIRMED`), cari hesap tahsilatı ve banka hesabı bakiyesi otomatik güncellenir.

---

### ⚪ Aşama 9: Gelecek Geliştirmeler & Kalan Eksikler
- [ ] **Katalog Fiyat & Maliyet Girişi:** Fiyatı 0 olan 31 ürünün satış fiyatı ve girdi maliyetlerinin `/admin/fiyatlar` ekranından tamamlanması.
- [ ] **Görselleri Eksik 2 Ürün:** *Bez Çanta Setleri* ve *Takı Çantası* fotoğraflarının eklenerek vitrinde yayına alınması.
- [ ] **E-Fatura / E-Arşiv Entegrasyonu (İsteğe Bağlı):** Gelir İdaresi Başkanlığı (GİB) e-arşiv portalı veya özel entegratör (Logo, Paraşüt vb.) API bağlantısı.

---

## 📌 Durum Özeti
* **Mevcut Durum:** ✅ Logo GO3 ERP standardında Ön Muhasebe, Cari Kartlar (120/320), Fatura & İrsaliye, Banka & Kasa, Gider Yönetimi, Mal Kabulü (WAV), 7 Sekmeli Yönetici Kokpiti, Otomatik Kargo Gideri, iyzico Callback & POS Komisyon Kesintisi başarıyla tamamlandı ve derlendi.
* **Canlı Erişim:** `https://isyurtlari.com.tr/admin/muhasebe`
* **Son Güncelleme:** 20 Ekim 2026
