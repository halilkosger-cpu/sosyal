# 🎯 İkon Tasarım & Implementasyon Rehberi

## 📝 ADIM ADIM KULLANIM

### **ADIM 1: ChatGPT Pro'da Prompt Yapıştır**

1. **ChatGPT Plus** veya **ChatGPT Pro**'ya git (claude.ai değil, openai.com)
2. **ICON_PROMPT_SHORT.txt** dosyasının içeriğini kopyala
3. Prompt'u yapıştır ve şu mesajı ekle:

```
Lütfen bu 23 ikon için profesyonel SVG tasarımlar yap. 
Her ikon için:
1. SVG kodu ver (1024x1024px base)
2. Stroke: 2px
3. Renk: #0F2040 (default), #FF6000 (highlight)

İstediğim en iyi 3-4 ikon tasarım alternatifleri vermene de değer veririm.
Bitirdikten sonra Figma'ya export etmemi söyle veya SVG linkini ver.
```

4. Enter'e bas ve başlasın!

---

### **ADIM 2: Feedback & İterasyon**

ChatGPT ikonları oluşturduktan sonra:

**Eğer beğenmezsen:**
```
"[İkon adı] ikonunu daha [açıklama] yapabilir misin?
Örn: Gıda ikonunu daha organik ve doğal görünmesi için yaprakları daha göze çarpmakta yap"
```

**Eğer bir grup ikonun stili off ise:**
```
"[İkon 1], [İkon 2] ve [İkon 3] ikonlarının stroke weight'ı birbirinden farklı görünüyor.
Lütfen tüm ikonları 2px stroke weight'a getir ve rounded corners'ı 20% yap"
```

---

### **ADIM 3: SVG İndirme & Export**

ChatGPT SVG kodu verdiğinde:

**Seçenek A: Manuel Kaydetme**
1. SVG kodu kopyala
2. Sağ tık → "Save as" → `icon-name.svg`
3. Folder'ı oluştur: `apps/isyurtlari/public/icons/`
4. Dosyaları kaydet

**Seçenek B: Figma'ya Import (Önerilen)**
1. figma.com'a git
2. Yeni file oluştur: "isyurtlari-icons"
3. ChatGPT'den SVG kodu kopyala
4. Figma'ya yapıştır (Ctrl+V)
5. Edit et, refine et
6. Export et: PNG (48px, 64px, 128px) + SVG

**Seçenek C: Online SVG Editor (Sürat)**
1. svgedit.netlify.app'a git
2. SVG kodunu yapıştır
3. Export et

---

### **ADIM 4: React Components'e Entegre Et**

İkonları React'de kullanmak için iki yol:

#### **YÖNTEMa: SVG Component Olarak**

```tsx
// apps/isyurtlari/src/components/Icons/IconFoods.tsx
export function IconFood() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
    </svg>
  );
}
```

**Kullanım:**
```tsx
<IconFood className="w-6 h-6 text-[#FF6000]" />
```

#### **YÖNTEMb: Static SVG Images**

```tsx
// apps/isyurtlari/src/app/page.tsx
import Image from 'next/image';

<Image 
  src="/icons/food.svg" 
  alt="Gıda Ürünleri" 
  width={48} 
  height={48}
  className="group-hover:text-[#FF6000]"
/>
```

---

### **ADIM 5: Proje Yapısı**

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
│       ├── education.svg
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
└── src/
    └── components/
        └── Icons/
            ├── index.ts (tüm ikonları export et)
            ├── IconFood.tsx
            ├── IconTextile.tsx
            └── ... (diğerleri)
```

---

### **ADIM 6: Kullanım Örnekleri**

#### **Anasayfa - Kategori Kartları**

**Mevcut (react-icons):**
```tsx
import { LuUtensils } from 'react-icons/lu';

<LuUtensils size={20} color="white" />
```

**Yeni (custom icons):**
```tsx
import { IconFood } from '@/components/Icons';

<IconFood className="w-5 h-5 text-white" />
```

#### **Layout - Kategori Barı**

```tsx
// apps/isyurtlari/src/app/layout.tsx

const categories = [
  { name: 'Gıda', slug: 'gida', Icon: IconFood },
  { name: 'Tekstil', slug: 'tekstil', Icon: IconTextile },
  { name: 'Ahşap', slug: 'ahsap', Icon: IconWood },
  // ...
];

{categories.map((cat) => (
  <Link key={cat.slug} href={`/${cat.slug}`}>
    <cat.Icon className="w-4 h-4" />
    <span>{cat.name}</span>
  </Link>
))}
```

#### **Footer - Güven İkonları**

```tsx
// apps/isyurtlari/src/app/layout.tsx

{[
  { Icon: IconFastShipping, title: 'Hızlı Kargo', sub: 'Türkiye geneli teslimat' },
  { Icon: IconEasyReturn, title: 'Kolay İade', sub: '14 gün iade hakkı' },
  { Icon: IconSocialContribution, title: 'Sosyal Katkı', sub: 'Her alışveriş fark yaratır' },
].map((item) => (
  <div key={item.title}>
    <item.Icon className="w-8 h-8 text-[#FF6000]" />
    <p>{item.title}</p>
  </div>
))}
```

#### **Ödeme Sayfası**

```tsx
// apps/isyurtlari/src/app/checkout/page.tsx

{paymentMethod === 'transfer' && (
  <>
    <IconTransfer className="w-12 h-12 text-[#FF6000]" />
    <p>Havale Bilgileri Aşağıda</p>
    <IconTransferInfo className="w-6 h-6" />
  </>
)}

{paymentSuccess && (
  <>
    <IconSuccess className="w-20 h-20 text-[#FF6000] animate-bounce" />
    <h2>BAŞARILI!</h2>
    <IconContinueShopping className="w-6 h-6" />
  </>
)}
```

---

### **ADIM 7: React Icons'tan Taşınma**

1. **Tüm react-icons import'larını bul:**
   ```bash
   grep -r "react-icons" apps/isyurtlari/src/
   ```

2. **One-by-one değiştir:**
   - `import { LuUtensils } from 'react-icons/lu'` 
   - ↓
   - `import { IconFood } from '@/components/Icons'`

3. **Component'leri güncelle:**
   - `<LuUtensils size={20} />`
   - ↓
   - `<IconFood className="w-5 h-5" />`

---

### **ADIM 8: Styling & Renk Varyasyonları**

```tsx
// apps/isyurtlari/src/components/Icons/index.ts

export function useIconColor(variant: 'default' | 'active' | 'light') {
  const colors = {
    default: '#0F2040',
    active: '#FF6000',
    light: '#FFFFFF',
  };
  return colors[variant];
}
```

**Kullanım:**
```tsx
<IconFood className={`w-6 h-6 ${isActive ? 'text-[#FF6000]' : 'text-[#0F2040]'}`} />
```

---

## ✅ KONTROL LİSTESİ

Aşağıdaki adımları tamamladığında siteyi yayınlamaya hazırsın:

### ChatGPT & Tasarım:
- [ ] Prompt'u ChatGPT'ye gönderdin
- [ ] 23 ikon tasarlandı
- [ ] Feedback verdin, iterasyon yaptırdın
- [ ] SVG'ler indirildi (high quality)
- [ ] Figma'da şeffaf background ile export ettirdin (PNG)

### Proje Yapısı:
- [ ] `/public/icons/` folder'ı oluşturdu
- [ ] Tüm SVG dosyaları buraya kopyalandı
- [ ] `/src/components/Icons/` folder'ı oluşturdu
- [ ] Icon React components'leri yazıldı
- [ ] `index.ts` dosyası tüm ikonları export ediyor

### Implementasyon:
- [ ] Layout.tsx'deki react-icons'lar taşındı
- [ ] Page.tsx'deki react-icons'lar taşındı
- [ ] API routes'larda ikonlara ihtiyaç yok (ama kontrol et)
- [ ] Tailwind CSS color classes'ları çalışıyor
- [ ] Hover ve active states'ler çalışıyor

### Testing:
- [ ] Anasayfa görünüyor (ikonlar doğru yeriyle)
- [ ] Kategori linleri tıklanabiliyor
- [ ] Footer ikonları görünüyor
- [ ] Mobil'de ikonlar okunabilir (48px+ olmalı)
- [ ] Dark/light theme değişimleri çalışıyor (varsa)

### Performance:
- [ ] SVG dosyaları gzip compression'a uygun
- [ ] Icon component'ler memoized mi?
- [ ] Bundle size kontrol edilen (react-icons çıkınca azalacak)
- [ ] Lighthouse performance score ↑

---

## 🎨 TASARIM TİPSLERİ

### Renk Varyasyonları Kullan:
```tsx
<IconFood className="text-[#FF6000]" />        {/* Orange (active) */}
<IconFood className="text-[#0F2040]" />        {/* Navy (default) */}
<IconFood className="text-white" />            {/* White (light) */}
<IconFood className="text-gray-400" />         {/* Disabled */}
```

### Size Varyasyonları:
```tsx
<IconFood className="w-4 h-4" />  {/* Very small - mobile */}
<IconFood className="w-6 h-6" />  {/* Small - navbar */}
<IconFood className="w-8 h-8" />  {/* Medium - footer */}
<IconFood className="w-12 h-12" /> {/* Large - hero */}
<IconFood className="w-20 h-20" /> {/* XL - success page */}
```

### Hover Efektleri:
```tsx
<button className="group hover:text-[#FF6000] transition-colors">
  <IconFood className="w-6 h-6 group-hover:scale-110 transition-transform" />
</button>
```

### Dark Mode Desteği:
```tsx
<IconFood className="text-[#0F2040] dark:text-white" />
```

---

## 📚 KAYNAKLAR

- **SVG Editör:** https://svgedit.netlify.app/
- **Figma:** https://www.figma.com/
- **Icon Tools:** https://www.svgator.com/
- **Optimization:** https://jakearchibald.github.io/svgomg/
- **React SVG Guide:** https://react.dev/reference/react-dom/components#image-components

---

## 🚀 SONRAKI ADIMLAR

İkonlar tamamlandıktan sonra:

1. **Animasyon Ekle:** Bazı ikonlara micro-animations (0.3-0.5s)
   - Ödeme success: scale + rotate
   - Campaign badge: pulse/glow
   - Arrow icons: slide animation

2. **Icon System Dokumentasyon:** Storybook setup
   ```bash
   npm install -D storybook @storybook/react
   npx storybook init
   ```

3. **Accessibility Audit:** WCAG 2.1 AA'ya uygunluk
   - SVG'lerde aria-label
   - Color contrast ratios
   - Keyboard navigation

4. **Figma Component Library:** Icon versioning ve management

---

**Yazı tarihi:** 2026-05-04  
**Versiyon:** 1.0  
**Durum:** Kullanıma hazır ✅
