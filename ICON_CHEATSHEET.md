# 📌 İkon Tasarımı Hızlı Referans Kartı

## 🎯 ChatGPT Pro'ya Ne Yapıştır (Tek Mesaj)

```
Sosyal Giriş İşyurtları e-ticaret platformu için 23 profesyonel ikon tasarla.

MARKA BİLGİSİ:
- Renk: #FF6000 (orange), #0F2040 (navy/dark), #FFFFFF (white)
- Stil: Apple SF Symbols + Feather Icons (minimal, stroke-based, geometric+organic)
- Format: SVG 1024x1024px, 2px stroke, rounded corners, "currentColor" ile renklendirilebilir

İKONLAR:
1. Gıda - yaprak+tabak, doğallık
2. Tekstil - dokuma tezgahı/kumaş
3. Ahşap - ağaç+testere
4. Dokuma - iplikler, akış
5. Mobilya - modern sandalye
6. Hakkımızda - kalp+insan
7. Meslek Eğitimi - kişi+ışık
8. Sosyal Proje - birleşen eller
9. Adalet Bakanlığı - terazı+kalp
10. Istihdam - insan+grafik
11. Reentegrasyon - spiral ok
12. Eğitim Hedefi - ok+hedef
13. Ürün Kökeni - kişi+ürün
14. Sepet - modern sepet
15. Kampanya - şimşek+etiket
16. Bu Hafta Özel - şimşek+daire
17. Havale - kart+ok
18. BAŞARILI - roket uçuşu
19. Alışverişe Devam - kapı+ok
20. Havale Bilgileri - belge
21. Hızlı Kargo - kutu+ok
22. Kolay İade - kutu+geri
23. Sosyal Katkı - kalp+el

KURALLAR:
✓ Tüm ikonlar aynı tasarım dilini konuşmalı
✓ 48px'te net görülmeli
✓ Stroke weight tutarlı (2px)
✓ Max 4-5 şekil per icon
✓ Rounded corners 15-25%
✓ Insancıl, sıcak, güven verici

ÇIKTI: SVG kodlar + 3-4 alternatif var ise öner + Figma export linki
```

---

## 🔄 İterasyon İçin Template Cümleler

### Stil Düzeltmesi:
```
"[İkon adı] ikonunu [açıklama] yapar mısın?"

Örnekler:
- "Gıda ikonunu daha organik yapıştırarak yaprakları daha belirgin hale getirir misin?"
- "Textile ikonundaki iplik çizgilerini daha akan ve dinamik yapar mısın?"
- "Ahşap ikonunun granülleştirilmiş doku daha görünür olsun diye iyileştirir misin?"
- "BAŞARILI ikonuna kutlama hissi vermek için daha dinamik bir roket hareketi ekler misin?"
```

### Tutarlılık Düzeltmesi:
```
"[İkon 1], [İkon 2] ve [İkon 3] ikonlarının [özellik] farklı. Lütfen tüm ikonları tutarlı hale getirir misin?"

Örnekler:
- "...stroke width tutarlı olsun"
- "...rounded corners 20% olsun"
- "...organiklik seviyesi aynı olsun"
- "...negatif space (boş alan) oranı aynı olsun"
```

### Renk Varyasyonu:
```
"Tüm ikonlar için 3 versiyon ver: 
1. Outline (stroke: #0F2040, fill: none)
2. Orange (stroke: #FF6000, fill: #FF6000 %20)
3. White (stroke: #FFFFFF)"
```

### Export İstek:
```
"Lütfen tüm ikonları SVG + PNG (48px, 64px, 128px) olarak ver ve 
Figma link'i paylaş (edit etmek için)"
```

---

## 📁 Dosya Yapısı

### Dizin Ağacı:
```
apps/isyurtlari/
├── public/
│   └── icons/
│       ├── food.svg
│       ├── textile.svg
│       ├── wood.svg
│       ├── weaving.svg
│       ├── furniture.svg
│       ├── about-us.svg
│       ├── cart.svg
│       ├── campaign.svg
│       ├── meal-program.svg
│       ├── social-project.svg
│       ├── justice-ministry.svg
│       ├── employment-support.svg
│       ├── reintegration.svg
│       ├── product-origin.svg
│       ├── weekly-special.svg
│       ├── transfer.svg
│       ├── success.svg
│       ├── continue-shopping.svg
│       ├── transfer-info.svg
│       ├── fast-shipping.svg
│       ├── easy-return.svg
│       └── social-contribution.svg
│
└── src/
    ├── components/
    │   └── Icons/
    │       ├── index.ts
    │       ├── IconFood.tsx
    │       ├── IconTextile.tsx
    │       ├── IconWood.tsx
    │       ├── IconWeaving.tsx
    │       ├── IconFurniture.tsx
    │       ├── IconAboutUs.tsx
    │       ├── IconCart.tsx
    │       ├── IconCampaign.tsx
    │       ├── IconMealProgram.tsx
    │       ├── IconSocialProject.tsx
    │       ├── IconJusticeMinistry.tsx
    │       ├── IconEmploymentSupport.tsx
    │       ├── IconReintegration.tsx
    │       ├── IconProductOrigin.tsx
    │       ├── IconWeeklySpecial.tsx
    │       ├── IconTransfer.tsx
    │       ├── IconSuccess.tsx
    │       ├── IconContinueShopping.tsx
    │       ├── IconTransferInfo.tsx
    │       ├── IconFastShipping.tsx
    │       ├── IconEasyReturn.tsx
    │       └── IconSocialContribution.tsx
```

---

## 💻 Component Template

### SVG Component:
```tsx
// apps/isyurtlari/src/components/Icons/IconFood.tsx

export function IconFood({ 
  className = "w-6 h-6",
  strokeWidth = 2,
}: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* SVG Path'ler ChatGPT'den alacağın kod buraya gelecek */}
      <path d="M..." stroke="currentColor" fill="none" />
    </svg>
  );
}
```

### index.ts:
```tsx
// apps/isyurtlari/src/components/Icons/index.ts

export { IconFood } from './IconFood';
export { IconTextile } from './IconTextile';
export { IconWood } from './IconWood';
export { IconWeaving } from './IconWeaving';
export { IconFurniture } from './IconFurniture';
export { IconAboutUs } from './IconAboutUs';
export { IconCart } from './IconCart';
export { IconCampaign } from './IconCampaign';
export { IconMealProgram } from './IconMealProgram';
export { IconSocialProject } from './IconSocialProject';
export { IconJusticeMinistry } from './IconJusticeMinistry';
export { IconEmploymentSupport } from './IconEmploymentSupport';
export { IconReintegration } from './IconReintegration';
export { IconProductOrigin } from './IconProductOrigin';
export { IconWeeklySpecial } from './IconWeeklySpecial';
export { IconTransfer } from './IconTransfer';
export { IconSuccess } from './IconSuccess';
export { IconContinueShopping } from './IconContinueShopping';
export { IconTransferInfo } from './IconTransferInfo';
export { IconFastShipping } from './IconFastShipping';
export { IconEasyReturn } from './IconEasyReturn';
export { IconSocialContribution } from './IconSocialContribution';
```

---

## 🎨 Kullanım Örnekleri

### Layout'ta (Header/Footer):
```tsx
import { IconFood, IconTextile, IconCart, IconFastShipping } from '@/components/Icons';

// Kategori navbar'ında:
<IconFood className="w-4 h-4 text-[#0F2040]" />

// Footer'da:
<IconFastShipping className="w-8 h-8 text-[#FF6000]" />
```

### Hover Efektleri:
```tsx
<button className="group hover:text-[#FF6000] transition-colors">
  <IconCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
</button>
```

### Koşullu Rendering:
```tsx
{paymentSuccess ? (
  <IconSuccess className="w-20 h-20 text-[#FF6000] animate-bounce" />
) : (
  <IconTransfer className="w-12 h-12 text-[#0F2040]" />
)}
```

---

## 📊 Renk Paletesi Hızlı Referans

```
PRIMARY:    #FF6000  ← Ana orange (actionable, active)
SECONDARY:  #CC4E00  ← Darker orange (hover)
DARK:       #0F2040  ← Navy (default icon color)
LIGHT:      #FFFFFF  ← White (light backgrounds)
MUTED:      #808080  ← Gray (disabled, secondary)
```

**Tailwind Mapping:**
```
text-[#FF6000]   ← Active/primary
text-[#0F2040]   ← Default
text-white       ← Light
text-gray-400    ← Disabled
```

---

## ⚡ Hızlı Checklist

Tasarım bittikten sonra:

- [ ] SVG'ler indirildi
- [ ] `/public/icons/` klasörüne kopyalandı
- [ ] React components yazıldı
- [ ] `index.ts` tüm ikonları export ediyor
- [ ] `react-icons` imports'ları değiştirildi
- [ ] Test edildi (tüm sayfalar açılıyor)
- [ ] Hover states çalışıyor
- [ ] Mobile'de okunabilir (48px+)
- [ ] Lighthouse score yüksek (bundle size azaldı)

---

## 🚀 Pro Tips

1. **SVG Optimization:** ChatGPT'ye sor "SVG'leri SVGO ile optimize et"
2. **Font Size:** Tailwind classları: `w-4 h-4`, `w-6 h-6`, `w-8 h-8`
3. **Animation:** `animate-bounce`, `animate-spin`, `animate-pulse` kullan
4. **Dark Mode:** `dark:text-white` ile otomatik dark mode
5. **Accessibility:** Her ikona `aria-label` ekle
6. **Caching:** SVG'ler static, aggressive cache (1 yıl)

---

## 📞 Sorun Giderme

### SVG'ler siyah görünüyor:
```tsx
<svg ... stroke="currentColor" fill="none" />
```

### İkonlar boyutundan farklı görünüyor:
```tsx
className="w-6 h-6"  ← width + height aynı olmalı
```

### Hover rengine geçmiyor:
```tsx
className="hover:text-[#FF6000] transition-colors"
```

### Bundle size artmadı mı?
```bash
npm run build  ← Check next/bundle-analyzer
```

---

**Son Güncelleme:** 2026-05-04  
**Hazırlanmış:** isyurtlari.com.tr İkon Tasarımı İçin  
**Durum:** ✅ Hazır
