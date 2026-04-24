# 🚀 isyurtlari.com.tr - Vercel Deployment Guide

## YAPILMIŞLAR (2026-04-24)

### 1. ✅ Code Optimizations
```
✓ Checkout page: Kredi kartı devre dışı, sadece Havale/EFT aktif
✓ Iyzico API: Production endpoint (conditional)
✓ .env.production: Güvenlik değerleri düzeltildi
✓ Admin middleware: Kontrol edildi ve hazır
```

### 2. ✅ Files Updated
```
- apps/isyurtlari/src/app/checkout/page.tsx
  → Default payment method TRANSFER olarak ayarlandı
  → Kredi kartı seçeneği devre dışı bırakıldı

- apps/isyurtlari/src/app/api/checkout/iyzico/route.ts
  → Production API endpoint eklendi (NODE_ENV check'i ile)

- .env.production
  → Ortam değişkenleri template olarak ayarlandı
  → Bank transfer detayları eklendi
```

---

## 🎯 VERCEL'DE YAPILACAK (IMMEDIATE)

### Step 1: Vercel Projesi Bağla
```
1. https://vercel.com → "Add New" → "Project"
2. Repository seç: "anthropics/claude-code"
3. Import
```

### Step 2: Build Settings Konfigüre Et
**Project Settings → Build & Development Settings:**

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npx prisma generate --schema=../../packages/database/prisma/schema.prisma && next build` |
| Install Command | `cd ../.. && npm install` |
| Output Directory | `.next` |
| **Root Directory** | **`./apps/isyurtlari`** |

### Step 3: Environment Variables Ekle
**Settings → Environment Variables:**

Aşağıdaki değişkenleri **Production** için ayarla:

```env
# ⚠️ KRITIK - Değiştirilmesi ZORUNLU:
DATABASE_URL=postgresql://neondb_owner:npg_dtFmefM2DuB1@ep-sweet-mouse-ab2xx9ud-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEXTAUTH_SECRET=<RandonKriptografiBu32KarakterRastgeleSirKey123>

ADMIN_PASSWORD=<GüvenliAdminSifresiburada>

ADMIN_TOKEN=<32KarakterRastgeleAdminToken>

BANK_ACCOUNT_NAME=Adalet Bakanlığı
BANK_ACCOUNT_IBAN=TR...
BANK_ACCOUNT_BRANCH=Ankara Şubesi
BANK_ACCOUNT_NO=...

# Public (güvenli - açıkta olabilir):
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-TQBZ9JDV5T
NEXT_PUBLIC_DOMAIN=isyurtlari.com.tr
NEXTAUTH_URL=https://isyurtlari.com.tr
NODE_ENV=production
```

### Step 4: Domain Bağla
**Domains → Add Domain:**
- Domain: `isyurtlari.com.tr`
- DNS records'u Vercel'in önerdiği CNAME'lerle güncellemek

---

## 🧪 TEST CHECKLIST

Production deploy'dan sonra şunları test et:

```
□ https://isyurtlari.com.tr/ açılıyor mu?
□ Anasayfa ve ürünler görünüyor mu?
□ Sepet çalışıyor mu?
□ Checkout sayfasına gidebiliyor musun?
□ Havale seçeneği gösteriliyor mu?
□ Kredi kartı seçeneği devre dışı mı?
□ Admin panele giriş yapabiliyorsun mu?
  → https://isyurtlari.com.tr/admin/login
  → Password: (ayarladığın değer)
□ Database'den veri çekiliyor mu?
□ Sipariş oluşturulabiliyor mu?
□ Order confirmation sayfası açılıyor mu?
```

---

## 📱 VERCEL DEPLOYMENT PUSH

```bash
# Bu komutlar kişisel terminalinde çalıştırılmalı:

# 1. Git changes push et
git add .
git commit -m "Prepare: isyurtlari.com.tr for Vercel deployment

- Disable Iyzico payment temporarily (Phase 2)
- Enable bank transfer (TRANSFER) payment only
- Add production API endpoint logic
- Configure environment variables
- Add deployment checklist and guide"

git push origin main

# 2. Vercel otomatik deploy eder
# → https://vercel.com/anthropics/claude-code → Deployments bölümünde görürsün
```

---

## ⚠️ HATIRLATMA

### Iyzico Şu An DEVRE DIŞI
- Production API endpoint kodu var ama credentials yok
- PHASE 2'de aktifleştirilecek
- Şu an sadece TRANSFER (Havale/EFT) çalışıyor ✅

### Critical Environment Variables
Bu üç variable **MUTLAKA** güvenli değerlerle set edilmeli:
1. `DATABASE_URL` - Neon.tech'ten kopyala
2. `NEXTAUTH_SECRET` - Random 32 hex character
3. `ADMIN_PASSWORD` / `ADMIN_TOKEN` - Güvenli, rastgele

---

## 📞 Sorular?

- Environment Variable format hata? → Check `.env.production`
- Build fail? → Vercel build logs'u kontrol et
- Domain problem? → DNS records'u 24-48 saat beklemelisin

---

**Prepared:** 2026-04-24  
**By:** Claude Code  
**Status:** ✅ READY FOR DEPLOYMENT
