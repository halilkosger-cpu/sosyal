# isyurtlari.com.tr - Vercel Deployment Checklist

**Tarih:** 2026-04-24  
**Durum:** ✅ DEPLOYMENT HAZIR

---

## 🚀 PRE-DEPLOYMENT YAPILMIŞLAR

### ✅ Code Changes
- [x] Iyzico payment integration devre dışı bırakıldı (sadece Havale/EFT aktif)
- [x] Iyzico production API endpoint eklendi (conditional logic)
- [x] `.env.production` güvenlik değerleri düzeltildi
- [x] Admin panel authentication middleware kontrol edildi
- [x] Order API production hazır
- [x] Order confirmation page çalışıyor

---

## 📋 VERCEL DASHBOARD - AYARLANACAK ORTAM DEĞİŞKENLERİ

### **1️⃣ Database**
```
DATABASE_URL = postgresql://[user]:[password]@[host]/[db]?sslmode=require&channel_binding=require
```
**Not:** Neon.tech'ten kopyalayın. Zaten test edilmiş DATABASE_URL kullanılabilir.

### **2️⃣ Authentication (NextAuth)**
```
NEXTAUTH_SECRET = [GÜVENLI RASTGELE ANAHTAR OLUŞTURUN]
```
**Nasıl oluşturmalı:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **3️⃣ Admin Panel Credentials**
```
ADMIN_PASSWORD = [GÜVENLI ŞIFRE BELIRLEYIN]
ADMIN_TOKEN = [RASTGELE TOKEN OLUŞTURUN]
```
**Token oluşturma:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **4️⃣ Bank Account Details (Havale ödemeleri için)**
```
BANK_ACCOUNT_NAME = [Banka Hesap Sahibi Adı]
BANK_ACCOUNT_IBAN = [IBAN Kodu]
BANK_ACCOUNT_BRANCH = [Şube Adı]
BANK_ACCOUNT_NO = [Hesap Numarası]
```

### **5️⃣ Analytics (Optional, şu anda aktif)**
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = G-TQBZ9JDV5T
NEXT_PUBLIC_DOMAIN = isyurtlari.com.tr
```

---

## 🌐 VERCEL DEPLOYMENT STEPS

### 1. Vercel Project Oluşturma
- [ ] Vercel.com'e giriş yapın
- [ ] **Add New → Project**
- [ ] GitHub repository seçin: `C--sosyal`
- [ ] Framework: **Next.js**
- [ ] Root Directory: `./apps/isyurtlari`

### 2. Build Settings
Vercel otomatik algılamalı, ama kontrol edin:

**Build Command:**
```
npx prisma generate --schema=../../packages/database/prisma/schema.prisma && next build
```

**Install Command:**
```
cd ../.. && npm install
```

**Output Directory:** `.next` (default)

### 3. Environment Variables Ayarlama
Settings → Environment Variables seçerek tüm yukarıdaki değişkenleri ekleyin:
- Development: DATABASE_URL vb.
- Preview: (aynı)
- Production: (tüm hassas değerler BURAYA girilecek)

### 4. Domain Configuration
- [ ] Domains → Add Domain
- [ ] `isyurtlari.com.tr` ekleyin
- [ ] DNS records güncelleyin (Vercel'in verdiği CNAME'leri kullanın)

---

## ✅ POST-DEPLOYMENT TESTING

### Yapılacak Testler
- [ ] Ana sayfa yüklenebiliyor mu?
- [ ] Ürün listeleme çalışıyor mu?
- [ ] Sepete ürün eklenebiliyor mu?
- [ ] Checkout sayfası açılabiliyor mu?
- [ ] Havale seçeneği görünüyor, Kredi Kartı devre dışı mı?
- [ ] Sipariş oluşturulabiliyor mu?
- [ ] Admin panele girebiliyor muz? (`/admin/login`)
- [ ] Database bağlantısı çalışıyor mu?

### Admin Panel Test
```
URL: https://isyurtlari.com.tr/admin/login
Kullanıcı adı: (admin password olarak ayarladığınız değer)
```

---

## 🔒 SECURITY CHECKLIST

- [x] `.env.production` dosyasında açık şifre yok
- [x] NextAuth secret güvenli (Vercel'de ayarlanacak)
- [x] Admin token güvenli (Vercel'de ayarlanacak)
- [x] API endpoints input validation yapıyor
- [x] Middleware admin paneli koruyuyor
- [x] Iyzico credentials devre dışı (sonraya alındı)

---

## 📞 SONRAKI AŞAMALAR

### PHASE 2: Iyzico Payment Integration
- [ ] Iyzico API KEY ve SECRET KEY alınacak
- [ ] Production ortam değişkenleri Vercel'e eklenecek
- [ ] Checkout sayfası güncelleme (kredi kartı seçeneği etkinleştirilecek)
- [ ] Test ödemeleri yapılacak
- [ ] Iyzico webhook'ları konfigüre edilecek

### PHASE 3: Monitoring & Analytics
- [ ] Google Analytics kontrol edilecek
- [ ] Vercel Analytics etkinleştirilecek
- [ ] Error logging kurulacak

---

## 📱 CONTACT & SUPPORT

**Admin Email:** [Belirlenecek]  
**Support Email:** [Belirlenecek]

---

**Hazırlayanı:** Claude Code  
**Hazırlık Tarihi:** 2026-04-24  
**Durum:** ✅ DEPLOYMENT'A HAZIR
