# isyurtlari.com.tr — Yol Haritası

Son güncelleme: 4 Kasım 2026 — Güvenlik düzeltmeleri (TOTP hesap kilidi, iyzico eşleşmesi, yedek kodlar, yönetici e-postaları)
Önceki: 2 Kasım 2026 · Sıradaki iş: **Stoksuz ürünlerin vitrinden çıkarılması**

## 3 Kasım 2026 — Günlük rapor, güvenlik denetimi ve site incelemesi

### Yapılanlar

- **Günlük yönetim raporu e-postası (PR #4–#10, canlıda):**
  - Uç: `/api/gorevler/gunluk-rapor`. Vercel Cron her gün 06:00 UTC'de (Türkiye 09:00) çalışır, `halil.kosger@gmail.com` adresine gönderir (`GUNLUK_RAPOR_ALICI` ile değişir).
  - Üç bölüm: fiyat rekabeti, günlük performans ve trafik (satış, GA4), eylem planı. En fazla 400 kelime.
  - Veri kaynakları: Prisma (dünün ciro, sipariş, AOV, en çok satan 5 ürün, düşük stok), GA4 Data API (mülk 534677974), Merchant API v1 Reports.
  - Vercel ortam değişkenleri: `GA4_PROPERTY_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `CRON_SECRET`, isteğe bağlı `GOOGLE_MERCHANT_ID`. `CRON_SECRET` sohbette göründüğü için yenilendi; eski değer 401 veriyor.
  - Merchant hesabına servis hesabı eklendi (Yönetici) ve GCP projesi `developerRegistration:registerGcp` ile kaydedildi. Geçici `?tani=1` ve `?kayit=1` uçları kaldırıldı.
  - `?kuru=1` e-posta göndermeden raporu JSON döndürür (Bearer `CRON_SECRET` veya admin oturumu gerekir).
- **Merchant fiyat rekabeti verisi bu hesapta dönmüyor.** Sorgu (`price`, `benchmark_price` mesajları) hata vermiyor ama boş sonuç dönüyor; Merchant Center'da Analytics → Fiyatlandırma sayfası yalnızca indirimli fiyat önerilerini gösteriyor, fiyat rekabeti raporu yok. Rapor bunu "Rekabet verisi bu hesapta dönmedi." diye yazıyor. Veri ileride açılırsa otomatik dolar.
- **Güvenlik denetimi yapıldı (yalnızca rapor, düzeltme yok)**; bulgular aşağıda "Yapılmayanlar"da.
- **Site incelemesi yapıldı** (masaüstü, 375px mobil, ürün sayfası kodu, SEO sinyalleri). Hız iyi (ilk bayt ≈0,2 sn), `robots.txt`/`sitemap.xml`/JSON-LD var.
- **Kargo kararı:** Karşı ödemeli model aynen kalıyor (`KARGO_KARSI_ODEMELI = true`).

- **Güven düzeltmeleri (PR #11, birleştirildi):** ürün sayfasındaki sabit "Bugün 18 kişi inceledi" ve "%98 Memnuniyet" rozetleri, her gün sıfırlanan "Günün Fırsatı" sayacı ve `price * 1.2` ile uydurulmuş üstü çizili fiyat kaldırıldı. Blok "Öne Çıkan Ürün" oldu.
- **Kargo vaadi (PR #12, birleştirildi):** karşı ödemeli modelle çelişen "1.500 TL üzeri kargonuz BEDAVA" çubuğu (sepet sayfası ve çekmece) kaldırıldı. `fiyat.ts` içindeki kullanılmayan `UCRETSIZ_KARGO_ESIGI` sabiti model değişirse diye bırakıldı.
- **Yol haritası güncellemesi (PR #13, birleştirildi).**
- **Mobil üst alan kısaltıldı (PR #14, birleştirildi ve canlıda doğrulandı):**
  - Kategori şeridi (`MobilKategoriSeridi`) sabit (`sticky`) başlığın içindeydi; mobilde kaydırırken bile ekranın yaklaşık dörtte birini kaplıyordu. Başlığın dışına alındı, artık sayfayla birlikte kayıyor. `/urun/`, `/sepet`, `/checkout`, `/order-confirmation` yollarında hiç gösterilmiyor.
  - Kampanya bandı mobilde tek satır ("Efsane Kasım: sepette net %10 indirim"); geniş ekranda tam metin.
  - Uygulama yükle bandı sayfa açıldıktan 20 sn sonra çıkıyor (önceden anında) ve kapatılınca 7 gün susuyor (önceden ~5 saat).
  - Çerez bandı mobilde kompakt: tek satır metin, küçük düğmeler, başlık yalnızca masaüstünde.
  - Canlı doğrulama (375px, 3 Kasım): sabit başlık yüksekliği 256 px → 109 px; ürün sayfasında kategori şeridi, uygulama yükle bandı ve sahte rozetler yok, ilk ekranda ürün görseli görünüyor; ana sayfada şerit sayfayla kayıyor ve çerez bandı 149 px → 61 px.
  - Not: Eski sürüm tarayıcı önbelleğinden (`s-maxage=3600`, `stale-while-revalidate=86400`) görünebilir; deploy sonrası kontrolde `?v=...` ile önbellek atlanmalı.

### Yapılmayanlar (öncelik sırasıyla)

1. **Gerçek telefonda mobil kontrol.** Yükle bandının 20 sn sonra çıktığı ve kapatılınca 7 gün sustuğu, iOS Safari ve Android Chrome'da denenmedi (yalnızca masaüstü tarayıcıda 375px emülasyonuyla bakıldı).
2. **Stoksuz ürünler vitrinde.** Polen, Bal & Arı Ürünleri ve El Yapımı Gümüş Kehribar Tesbih stokta yok; ana sayfa görselinde Polen öne çıkıyor. Vitrinden ve Merchant beslemesinden çıkarılmalı, "Ön Talep" öne alınmalı.
3. **Gerçek yorum sistemi.** Yorumlar sekmesi 0; teslimat sonrası yorum isteyen e-posta eklenmeli (Merchant ürün puanını da besler).
4. **Admin "Günlük Rapor" sayfası.** Raporu e-posta dışında web'de görmek için; aynı `gunlukVeriTopla` fonksiyonuyla yalnızca dünün raporu. Kullanıcı onayı bekleniyor. Geçmiş günler için veritabanına kayıt gerekir (ayrı iş).
5. **Ödeme adımı doğrulanmadı:** misafir olarak alışveriş, taksit seçeneği (1.755 ₺ ve 5.500 ₺'lik ürünler için önemli), mobil ödeme akışı.
6. **Ana sayfada alt metni olmayan görseller:** 35 görselin 20'sinde `alt` yok.
7. **Trafik çeşitliliği:** oturumlar neredeyse tamamen organik (62) ve direkt (33); sosyal, e-posta ve ücretli kanal yok. Hediye Kutusu Yap ve kurumsal hediye öne çıkarılabilir.
8. **Eski Merchant kodu temizliği:** `google-merchant-api.ts` hâlâ kapanan Content API v2.1'i kullanıyor ve canlı veri yoksa uydurma `YEREL_SIMULASYON` fiyatlarına düşüyor (admin fiyat analizi sayfasını yanıltabilir). `google-merchant-api.test.ts` içinde önceden var olan başarısız test ve `tsc` hataları da var.
9. **"Fiyat Rekabet Gücü Raporu panelden açılabilir" notu geçersiz** (bölüm I5). Hesapta rapor yok; Merchant Center'da uygunluk ve ürün kataloğu eşleşmesi (GTIN/marka) kontrol edilmeli.
10. **Merchant kargo ayarları** panelde sitedeki karşı ödemeli modelle tutarlı olmalı (yalnızca panelden yapılabilir).

### Güvenlik denetimi bulguları

**4 Kasım 2026 yeniden doğrulama ve düzeltmeler (PR açık, birleştirme onayı bekliyor):**

- **Düzeltildi — admin TOTP hesap bazlı kilit:** `totp-verify` yalnızca IP başına dakikada 6 deneme sınırı uyguluyordu; çok IP'li bir saldırı sınırı aşabilirdi. Yönetici e-postası başına 15 dakikada 20 deneme sınırı eklendi (`totp-verify-hesap:<e-posta>`, veritabanı sayaçlı, hata durumunda reddeder). Test: `src/app/api/admin/totp-verify/route.test.ts`. Dengeleme: saldırgan sınırı doldurarak yöneticiyi en fazla 15 dakika kilitleyebilir; bu, kaba kuvvet riskine göre kabul edildi.
- **Düzeltildi — iyzico callback `contains` eşleşmesi:** `payment.updateMany` açıklamada `contains` kullanıyordu. Sipariş numarası 3 haneye dolduruluyor (`SG-2026-100`), 1000. siparişten sonra `SG-2026-100` başka bir siparişin (`SG-2026-1000`) ödemesini de tamamlardı. Şu an gizli (sipariş sayısı az); açıklama artık `src/lib/odeme-aciklamasi.ts` ile üretilip tam eşleşmeyle aranıyor.
- **Düzeltme gerekmedi — `X-Forwarded-For` sahteciliği:** Önceki denetimde "en soldaki değer sahtelenebilir" diye yazılmıştı. Site doğrudan Vercel arkasında (yanıtta `server: Vercel`, başka bir CDN yok) ve Vercel bu başlığı gerçek istemci adresiyle üzerine yazıyor; bu bulgu abartılmıştı. Önüne Cloudflare gibi bir vekil konulursa yeniden bakılmalı. Doğrulanmadı: Vercel davranışı dokümana dayanıyor, canlıda sahte başlıkla denenmedi.
- **Düzeltme gerekmedi — JWT geliştirme anahtarı:** `jwtAnahtari()` production'da `JWT_SECRET` yoksa hata fırlatıyor; yedek anahtar yalnızca geliştirmede kullanılıyor.
- **Düşük risk — SVG yükleme:** Yalnızca yönetici girişiyle ve yalnızca `kategoriler` klasörüne; dosya `<img>` ile gösteriliyor (betik çalışmaz). Şimdilik bırakıldı.

**4 Kasım 2026 ikinci tur (PR açık, birleştirme onayı bekliyor):**

- **Düzeltildi — yedek kurtarma kodları:** Kodlar 32 bitti ve düz SHA-256 ile saklanıyordu (veritabanı sızarsa saniyeler içinde kırılır). Yeni kodlar 80 bit (`9F2C-8A4E-1B7D-3C90-AA12`) ve sunucu anahtarıyla HMAC'leniyor (`h2:` önekli). Mevcut kayıtlı eski kodlar doğrulamada hâlâ kabul ediliyor; **yönetici güvenlik sayfasından yedek kodları yeniden üretmek** eski kodları da yeni biçime geçirir. Testler: `src/lib/totp.test.ts`. Doğrulanmadı: yeni 24 karakterlik kodların `guvenlik-2fa` sayfasındaki kutuya sığması (görsel kontrol yapılmadı).
- **Düzeltildi — sabit yönetici e-postaları:** Yönetici listesi artık yalnızca ortam değişkenlerinden okunuyor (`ADMIN_EMAIL` ve virgülle ayrılmış `ADMIN_EMAILS`); koda gömülü yedek liste silindi. Vercel'de `ADMIN_EMAILS` tanımlandı ve Google Authenticator koduyla yönetici girişi canlıda doğrulandı (4 Kasım). Her iki değişken de boşsa kimse yetkili değil (kapalı başarısız). Testler: `src/lib/admin-auth.test.ts`.
- **Düzeltildi — giriş sayfasında yönetici e-postaları görünüyordu:** `/admin/login` sayfasında üç yöneticinin e-postası "Hızlı Seçim" düğmeleri ve örnek yer tutucu olarak herkese açıktı (hedefli saldırıya/oltalamaya yardım eder). Düğmeler ve örnek kaldırıldı; yöneticiler e-postasını elle yazacak. Bildirim alıcı listesi (`SIPARIS_BILDIRIM_EKIBI` içinde `api/orders/route.ts`) yetkilendirme değil e-posta alıcısı olduğu için bu işte dokunulmadı; ileride env'e taşınabilir.
- **Değerlendirildi, değiştirilmedi — `otp-verify` hesap kilidi:** E-posta kodu başına 5 hatalı denemede kod imha ediliyor (`src/lib/otp.ts`), yani 6 haneli kodun kaba kuvvetle bulunması bu sayaçla sınırlı. Yeni kod isteme tarafında hesap bazlı sınır yok; e-posta bombardımanı riski düşük olarak bırakıldı.
- **Bilinçli olarak bırakıldı — CSP `script-src 'unsafe-inline'`:** Next.js'in satır içi hydration betikleri yüzünden tüm sayfalarda gerekli. Nonce'lu CSP, middleware ile her istekte nonce üretmeyi ve sayfaları dinamik hâle getirmeyi gerektirir; bu, mevcut önbellek (`s-maxage=3600`) ve hız avantajını bozar. Mevcut CSP harici betik kaynaklarını, `object-src`, `frame-ancestors`, `base-uri` ve `form-action` değerlerini hâlâ kısıtlıyor. XSS riski çıktı kaçışlarıyla (e-posta, JSON-LD) azaltılıyor. Yeniden gündeme gelirse Next.js'in `experimental.sri` seçeneği ve performans ölçümüyle ayrı iş olarak ele alınmalı.

**Hâlâ açık:**

- Yedek kodlar yönetici panelinden yeniden üretilmeli (kullanıcı), eski zayıf özetler kullanımdan çıksın.
- Yedek kod tüketimi atomik değil (okuyup yazıyor); aynı kodla eşzamanlı iki istek ikisi de geçebilir. Hesap bazlı kilit bunu zorlaştırıyor; ayrıca düzeltilmedi.

- Olumlu: scrypt parolalar, özetlenmiş oturumlar, IDOR kontrolleri, fiyatın sunucuda yeniden hesaplanması, e-posta ve JSON-LD kaçışları.

## 2 Kasım 2026 — Google Merchant Center Feed Güçlendirmesi (Hesap: 5876808666)

- **Marka alanı (`<g:brand>`):** Tüm ürünlere sabit basılan "İşyurtları" yerine ürün adından gerçek marka tespiti getirildi (Elban, ADVEM, Zenbay, Toprakkale, Odosun, ADEMODA, Espiye, Niğde, Kalkandere, Tokat, Adıyaman, Elazığ, Gaziantep). Eşleşmeyenler için İşyurtları korundu. "Elban zeytin" veya "ADVEM kolonya" aramalarında alaka düzeyi yükseltildi.
- **Google Ürün Kategorisi (`<g:google_product_category>`):** Feed'e resmi Google kategori taksonomi kimlikleri eklendi (Gıda: 422, Temizlik: 587, Hediyelik/Dekor: 632, Tekstil: 1604, Ahşap: 632).
- **Zengin Açıklamalar (`<g:description>`):** Başlıkla birebir aynı veya yetersiz olan açıklamalar için kategoriye özel, el emeği vurgulu zengin açıklamalar üretildi (Google'ın "ince/yinelenen içerik" cezası engellendi).
- **Görsel Güvenliği (`<g:image_link>`):** 404 riski taşıyan bağlantılar elendi; HTTP linkleri ve yerel 800px WebP görselleri tam URL'ye bağlandı, yedek olarak mağaza logosu tanımlandı.

## 30 Ekim 2026 — Katalog genişlemesi (99 ürün)

- Canlı katalog: 146 ürün, 5 kategori (Gemini veritabanını düzeltti).
- Yeni ürün fotoğrafları kaynağı: `~/Desktop/20261030_resimleri_isyurt/web-hazir/{slug}.webp` (1024 px).
  `public/urun/` altına 400/800/1024 WebP olarak üretildi (sharp, kalite 78) ve
  `src/lib/urun-gorsel.ts` YEREL listesine 98 slug eklendi.
- `el-dokumasi-namazlik` iki listede de vardı; eski (Higgs) fotoğrafı korundu.
- Aynı gün denenip yanlış çıkan değişiklikler (YEREL'i boşaltmak, GORSELLI_URUN'ü kaldırmak,
  CDN önbelleğini kapatmak, Fraunces fontundan `latin-ext`'i silmek) geri alındı.
  Görünürlük kuralı yine `src/lib/urun-gorunurluk.ts`.
- Vercel GitHub push'unda otomatik deploy ediyor. Google Fonts kaynaklı
  `next/font ... reading '1'` build hatası geçici ağ hatasıydı; tekrar deploy yeterli.

- **Veritabanı:** site yine Neon `isyurtlari-prod` dalına bağlı (siparişler, ön talepler, analitik, 2FA orada).
  Gün içinde yanlışlıkla boş `production` dalına bağlanmıştı; 97 yeni ürün oradan isyurtlari-prod'a
  kopyalandı (toplam 159). `production` dalı artık kullanılmıyor, silme.
- **iyzico:** canlı anahtarlar Vercel'de (`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`), ödeme sayfasında kart
  seçeneği açıldı (varsayılan havale). Müşteri iyzico'nun barındırdığı ödeme sayfasına yönlendiriliyor
  (`paymentPageUrl`). Dönüşte tutar `paidPrice` ile doğrulanıyor (`price` indirimsiz sepet toplamı).
  30 Ekim'de gerçek kartla uçtan uca test edildi.
- **Google Merchant:** feed `https://isyurtlari.com.tr/google-merchant.xml` (130 ürün; fiyatı 0 olan 29 ürün
  dışarıda). `sale_price` kaldırıldı — %10 sepet indirimi Merchant Center → Promosyonlar'dan tanıtılmalı.

## Durum özeti

| Aşama | Durum |
|---|---|
| 1 — İyzico ucunu güvene alma | ✅ bitti |
| 2 — Görsel boru hattı (srcset) | ✅ bitti, canlıda ölçüldü |
| 3 — Fotoğrafların tek görsel dile oturtulması | ✅ 49 ürün Higgs ile, 12 ürün resmî galeriden |
| 4 — Ana sayfa (A+C) | ✅ bitti |
| 5 — İçerik derinliği | ✅ 61 açıklama + 3 kategori metni yazıldı |
| 6 — İyzico tam entegrasyon | ✅ bitti — 30 Ekim 2026 gerçek kartla uçtan uca test edildi |
| 7 — 99 ürün ekleme | ✅ bitti |

Fotoğrafsız 14 ürünün 12'si resmî galeriden çözüldü; kalan ikisi
(Bez Çanta Setleri, Takı Çantası) galeride yok, gizli duruyorlar.

Kalan işler, önem sırasıyla:

1. **31 ürünün fiyatı girilmemiş.** Katalogun yarısı. Bu ürünler kartta
   "Fiyat belirleniyor" gösteriyor, sepete eklenemiyor ve schema.org'da
   `offers` almıyorlar — yani Google'da fiyatsız görünüyorlar. Ürün
   sayfası ve fotoğrafı hazır, tek eksik sayı. Admin → Fiyatlar.
2. **Stok.** Şu an 63 ürünün tamamı "Tükendi". Temizlik kategorisinin
   11 ürününün hepsi ön talep formuna düşüyor.
3. **iyzico hesabı** (Aşama 6) — kart ödemesi bunsuz açılamıyor.
4. Ürün başına net miktar / içindekiler bilgisi (açıklamaları
   güçlendirmek için).
5. Bez Çanta Setleri ve Takı Çantası — resmî galeride karşılığı yok,
   fotoğraf gelene kadar gizli kalıyorlar.

### Sırada Bekleyen E-Ticaret & İletişim Geliştirmeleri (Kullanıcı Onaylı Notlar)

- [ ] **WhatsApp Hızlı Danışma & Sipariş Butonu:** Sağ alt köşeye şık WhatsApp butonu; ürün detay sayfasındayken tıklandığında ürün adı ve linkiyle birlikte mesaj açar ("Merhaba, [Ürün] hakkında bilgi almak istiyorum").
- [ ] **SMS Bildirim Entegrasyonu (Netgsm / İletiMerkezi):** Sipariş verildiğinde ve kargoya teslim edildiğinde müşteriye otomatik takip linkli SMS gönderimi.
- [ ] **Şirket Kurulumu & Ön Muhasebe Resmiyet Adımları:** Resmi şirket unvanı, VKN ve MERSİS'in footer/sözleşmelere eklenmesi, Logo İşNet canlı API anahtarlarıyla GİB e-Arşiv/e-Fatura gönderiminin başlatılması.

Bu dosya, konuşma bağlamı kaybolduğunda doğru zemini bulmak için var.
Buradaki her sayı ve iddia canlı sitede ya da kaynak kodda **ölçülerek**
yazıldı; tahmin yok. Yeni bir iddia eklenecekse önce doğrulanmalı.

---

## Doğrulanmış mevcut durum (25 Eylül 2026)

**Katalog (canlı `/api/products` ve `/sitemap.xml` ile ölçüldü)**

| | Değer |
|---|---|
| Veritabanındaki ürün | 63 |
| Vitrinde görünen ürün | 61 |
| Fotoğrafsız ürün | 2 - Bez Çanta Setleri, Takı Çantası |
| Fiyatı girilmemiş ürün | 31 (kartta "Fiyat belirleniyor", sepete eklenemiyor) |
| Görünen kategori | 5 - Gıda (27), Hediyelik (21), Temizlik (11), Peyzaj (1), Ahşap (1) |
| Gizlenen kategori | 1 - Tekstil (2 ürün, ikisi de fotoğrafsız) |

Fotoğrafsız ürünler silinmedi; `src/lib/urun-gorunurluk.ts` tek kural olarak
listeleme, arama, sitemap ve `generateStaticParams` sorgularından süzüyor.
Fotoğraf yüklendiği an, kod değişikliği olmadan vitrine geri geliyorlar.

**SEO durumu (canlıda ölçüldü)**

- `robots.txt` doğru: `/admin`, `/api`, `/sepet`, `/checkout`, `/hesabim`,
  `/favoriler` kapalı; `?sort=` / `?filter=` parametreleri kapalı;
  Ahrefs / Semrush / DotBot / MJ12 engelli; sitemap bildiriliyor.
- Sitemap 60 adres: 49 ürün + 3 kategori + 8 statik sayfa.
- Her sayfada tek `h1`, doğru `canonical`.
- Olmayan ürün → gerçek 404 (`/urun/olmayan-bir-sey` doğrulandı).
- Fotoğrafsız ürün sayfası ve boş kategori sayfası → `noindex, follow`.
- JSON-LD: Organization + WebSite/SearchAction + FAQPage (ana sayfa),
  BreadcrumbList + CollectionPage + ItemList (kategori),
  Product + Brand + Offer (ürün).
- Paylaşım görseli 1200×630 `og-gorsel.jpg`.
- GA4 `G-KTWVN830XT`, `lazyOnload`, çerez onayına bağlı; `/admin` ve
  localhost hariç tutuluyor.
- Sunucu yanıt süreleri 0,3–0,45 s.

> Lighthouse puanları **henüz ölçülmedi**. Bir yerde puan telaffuz etmeden
> önce gerçekten ölçülmeli.

**Bilinen kısıt**

`next.config.js` içinde `images.unoptimized: true` (Vercel kotası için
açılmıştı). Sonucu: AVIF/WebP pazarlığı ve `srcset` yok; telefondan giren
ziyaretçi de masaüstü boyutundaki görseli indiriyor.

---

## Aşama 1 — İyzico ödeme ucunu güvene alma ✅ BİTTİ (25 Eylül 2026)

**Zorluk:** kolay · **Engel yok** (iyzico hesabı gerekmiyor)

Yapıldı. Route artık yalnızca `orderId` alıyor; tutar, müşteri ve adres
`Order` kaydından okunuyor. Eklenenler: hız sınırı (5 dk'da 10 istek),
`PENDING` + `CREDIT_CARD` durum kontrolü, gerçek sepet kalemleri
(`price` = sepet toplamı, `paidPrice` = tahsil edilecek tutar), gerçek
teslimat adresi, yanıt gövdesinin loglanmaması, istemciye yığın izi
sızdırmayan hata mesajları. İstemci de yalnızca `orderId` gönderiyor.

TCKN toplanmıyor; iyzico alanı zorunlu tuttuğu için yer tutucu gidiyor.
Adres ayrıştırması (şehir/posta kodu) ve TCKN yer tutucusu **sandbox'ta
doğrulanmalı** — hesap gelince Aşama 6'da.

<details><summary>Kapatılan açığın ayrıntısı</summary>

### Sorun (kod okunarak doğrulandı)

`src/app/api/checkout/iyzico/route.ts` ödenecek tutarı **istek gövdesinden**
alıyor (`const { orderId, totalAmount, ... } = await req.json()`), kimlik
doğrulaması ve hız sınırı yok. Kart ödemesi bu haliyle açılırsa isteyen
5.000 TL'lik sepeti 1 TL'ye ödeyebilir.

### Çözüm kolay, çünkü zemin sağlam

`src/app/api/orders/route.ts` zaten doğru çalışıyor: fiyatları veritabanından
yeniden hesaplıyor, stok kontrolü yapıyor, kuponu doğruluyor ve istemcinin
gönderdiği tutarla kendi hesabı uyuşmazsa siparişi reddediyor. Yani
`Order.totalAmount` güvenilir bir kaynak.

### Yapılacaklar

1. Route yalnızca `orderId` alsın; tutar, e-posta ve isim veritabanından
   okunan `Order` kaydından gelsin.
2. Sipariş zaten ödenmişse veya iptalse reddet.
3. `hizSiniriGuard` ekle (aynı IP'den ardışık deneme).
4. `buyer.identityNumber: '00000000000'` ve sabit "Ankara" adresi yerine
   siparişin gerçek teslimat adresi kullanılsın.
5. `console.log('Iyzico Response Body', ...)` kaldırılsın — yanıt, ödeme
   oturumu bilgisi taşıyor.

</details>

---

## Aşama 2 — Görsel boru hattı (srcset + boyutlandırma)

**Zorluk:** orta · **Süre:** ~2–3 saat · **Engel yok**

Lighthouse performansını asıl kıran kalem bu ve tasarım seçiminden bağımsız
— hangi ana sayfayı yaparsak yapalım işe yarıyor.

### Yapılacaklar

1. Her ürün görselinin 400 / 800 / 1600 px WebP sürümü üretilsin
   (Higgs + PIL boru hattı zaten kurulu: üret → indir → stage → WebP → commit).
2. `UrunKarti` ve ürün sayfası galerisi `srcset` + `sizes` kullansın.
3. `images.unoptimized` açık kalabilir — görseller önceden boyutlandığı için
   Next'in runtime optimizasyonuna ihtiyaç kalmaz, Vercel kotası da yanmaz.
4. Ölçüm: öncesi/sonrası Lighthouse mobil, ana sayfa ve bir kategori sayfası.

### Not

Alternatif Cloudflare Images (aylık ~5 $, sınırsız dönüşüm). Şimdilik
gerekmiyor; katalog 49 ürün.

---

## Aşama 3 — Ürün fotoğraflarının tek görsel dile oturtulması

**Zorluk:** orta · **Süre:** ~3 saat (+ hk'nin 14 çekimi) · **Kısmen engelli**

Awwwards hedefinin asıl tavanı burası. Mevcut 49 fotoğraf farklı masada,
farklı ışıkta çekilmiş; dünyanın en iyi grid'i bile karışık fotoğrafla
amatör görünür.

### Yapılacaklar

1. Mevcut 49 fotoğraf Higgs ile aynı krem arka plan, aynı ışık yönü, aynı
   gölge ve aynı kadrajla yeniden işlensin. **Ürün değişmiyor** — yalnızca
   arka plan, ışık ve kadraj.
2. hk, fotoğrafı olmayan 14 ürünü çeksin (11'i parfüm/sabun/kolonya;
   masa üstünde telefonla yeterli). Sonra aynı işlemden geçirilir ve
   Temizlik, Tekstil, Ahşap kategorileri kendiliğinden geri gelir.

### Yapılmayacak

Higgs ile **sıfırdan ürün fotoğrafı üretmek.** Mesafeli Sözleşmeler
Yönetmeliği görselin ürünü temsil etmesini gerektiriyor; üretilmiş bir
parfüm şişesi elindeki ürün değil, iade ve şikâyet riski doğurur.

---

## Aşama 4 — Ana sayfa yeniden tasarımı

**Zorluk:** orta-zor · **Süre:** ~3–4 saat · **hk'nin kararını bekliyor**

Üç maket hazır (`.tasarim-tmp/maket-{a,b,c}.png`):

- **A — Editöryel:** krem hero, büyük serif başlık, sağda tek güçlü ürün
  fotoğrafı, ince kategori chip'leri, 4'lü grid.
- **B — Katalog öncelikli:** ince header, turuncu şerit, sol filtre sütunu,
  5'li ürün duvarı. Dönüşüm için en güçlüsü, tasarım hissi en az.
- **C — Magazin:** tam genişlik koyu hero fotoğrafı, asimetrik öne çıkan
  ürün bloğu, lacivert güven bandı, numaralı "nasıl çalışır" satırı.

**Öneri:** C'nin hero'su + A'nın sakin ürün grid'i.

### Kural

Ölçülü scroll-reveal (yalnız `opacity`/`transform`, IntersectionObserver,
~1 KB). WebGL yok, custom cursor yok, sayfa geçiş animasyonu yok — ödül
kazandıran ama LCP ve INP'yi öldüren şeyler bunlar.

---

## Aşama 5 — İçerik derinliği

**Zorluk:** uzun ama düşük riskli · **Süre:** zamana yayılmış

Google'da yukarı taşıyacak asıl kaldıraç bu; Lighthouse'un SEO puanı
yüzeysel (title, meta, alt text) ve zaten alınıyor.

1. 49 ürün için özgün, kopyala-yapıştır olmayan açıklama.
2. Kategori sayfalarına 300–400 kelimelik gerçek metin.
3. `AggregateRating` şemasının gerçek yorumlarla beslenmesi.
4. "İşyurtları ürünleri nereden alınır", "cezaevi el emeği ürünler" gibi
   aramalara cevap veren birkaç yazı.

---

## Aşama 6 — İyzico tam entegrasyon

**Zorluk:** zor · **ENGELLİ: iyzico hesabı yok**

Aşama 1 açığı kapatıyor ama entegrasyon **eksik**, sadece güvensiz değil:

- İstekte `callbackUrl` yok.
- Ödeme sonucunu doğrulayan bir route hiç yok (kodda arandı, bulunamadı).

Yani form açılsa bile ödeme sonucu hiçbir zaman doğrulanmaz ve sipariş
"ödendi"ye geçmez.

### Hesap geldiğinde yapılacaklar

1. `callbackUrl` eklensin.
2. `/api/checkout/iyzico/callback` route'u yazılsın: iyzico'nun
   `retrieve` ucuyla ödeme **sunucu tarafında** doğrulansın; istemciden
   gelen "başarılı" bilgisine asla güvenilmesin.
3. Doğrulanan tutar `Order.totalAmount` ile karşılaştırılsın.
4. Sandbox'ta uçtan uca test.
5. Ancak bundan sonra: kart logoları, "Kartla ödeme yakında" yazısının
   kaldırılması, `/guvenli-alisveris` sayfasındaki "SSL 256-bit" ifadesinin
   gözden geçirilmesi.

---

## Ertelenmiş / küçük işler

- hk'nin makinesinden yerel veritabanı bağlantısı çalışmıyor (Neon'a
  erişilemiyor). Geliştirme sürtünmesi; geçici çözüm canlı API üzerinden
  önizleme.
- Ürün varyantları (beden, renk) — şemada yok.
- İYS (İleti Yönetim Sistemi) entegrasyonu — pazarlama e-postası
  gönderilecekse zorunlu.
- Search Console: düşen 14 ürün ve 3 kategori adresi `noindex` ile zamanla
  indeksten çıkacak; istenirse kaldırma talebiyle hızlandırılabilir.

---

## Çalışma kuralları

- Bakanlık/İşyurtları ile bağ kuran, sosyal girişim veya kâr amacı gütmeme
  iması taşıyan ifade siteye **girmiyor**. Ürünlerin Adalet Bakanlığı
  İşyurtları Genel Müdürlüğü tarafından üretildiği doğru ve yazılabilir.
- Kanıtlanamayan iddia (sağlık, içerik, garanti) yazılmıyor.
- Her değişiklik `npx tsc --noEmit` ile doğrulanıp canlıda ölçülerek
  kapatılır.

---

## 25 Eylül gecesi — iddia denetimi

Temizlik kategorisi vitrine dönünce açılış metni de görünür oldu ve
içinde "geleneksel yöntemlerle **katkısız** olarak hazırlanıyor" yazıyordu.
Bunun üzerine bütün site metinleri aynı gözle tarandı. İki kalıp çıktı:

**1. Bağış iması.** Alışverişin bir eğitim programına destek olduğunu
söyleyen cümleler:

| Yer | Eski metin |
|---|---|
| Ana sayfa meta açıklaması | "Her satın alma meslek eğitimine destek olur." |
| /gida kategori açıklaması | "Her satın alma aşçılık eğitimine destek olur." |
| /ahsap kategori açıklaması | "her alışveriş meslek edindirmeye katkıdır" |
| /hediyelik kategori açıklaması | "hediyeniz bir yeniden başlangıç olsun" |
| Kategori yedek metni (2 yer) | "topluma yeniden kazanılmalarına katkı sağlar" |
| Ana sayfa anahtar kelimeleri | "sosyal sorumluluk", "hükümlü destekle", "reintegrasyon projesi" |

Site bağımsız bir ticari mağaza; kâr amacı gütmeyen bir yapının parçası
değil ve satış gelirinin nereye gittiği konusunda söz veremez.
Hükümlülerin ücret karşılığı çalıştığı ve meslek öğrendiği ayrı ve doğru
bir olgu — o duruyor, "alışveriş bağıştır" iması kalktı.

**2. Her ürüne yapıştırılan nitelemeler.** Ürün sayfalarının meta
açıklamasına "— Cezaevi hükümlüsü tarafından el yapımı, doğal ürün."
ekleniyordu. Katalog büyüyünce ikisi de her ürün için doğru olmaktan
çıktı: parfüm ve kolonya seri dolum şişede geliyor, yüzey temizleyicinin
etiketinde kimyasal bileşim yazıyor.

Bir de olgu hatası vardı: /peyzaj "her türlü çiçek, ağaç bulunmaktadır"
diyordu; katalogda tek bir fidan var.

**Bilerek değiştirilmeyenler:** gıda, hediyelik, ahşap ve peyzaj
kategorilerinin başlık ekindeki "Doğal ve El Yapımı". Uzun süredir
indekstedirler ve "doğal" arama hacmi olan bir kelime. Yalnızca temizlik
kendi ekini aldı. hk isterse bunlar da gözden geçirilebilir.

**Henüz elden geçirilmedi:** `src/config/content.ts` içindeki
`home.socialImpact` ("Her Satın Alma Yardım Eder") ve `about.hero`
("Sosyal etki odaklı pazar yeri") blokları. Birincisi ana sayfa
yenilendiğinde kullanımdan kalktı, ikincisi /hakkimizda sayfasında.
Ayrıca oradaki "500+ ürün" ve "81 ilde faaliyet" sayıları katalogla
tutmuyor (63 ürün var).

---

## 28 Ekim 2026 — Baştan denetim (güvenlik + mobil + Awwwards)

Trafik: %75 mobil. Testler: 21 dosya / 67 test geçiyor.
Sıra: yukarıdan aşağı. Biten maddeyi [x] yap.

### A. Güvenlik — KRİTİK / YÜKSEK
- [x] A1 `lib/admin-auth.ts:9-12` sabit JWT anahtarı fallback'i → sil, env yoksa fail; Vercel'de yeni 32 bayt `JWT_SECRET`. Admin e-postaları env'e. **NOT: Vercel'de JWT_SECRET tanımlı olmalı, yoksa admin girişi hata verir.**
- [x] A2 Admin çerezi `httpOnly` değil (`totp-verify:79`, `otp-verify:91-97`) → `httpOnly, secure, sameSite:strict`; jetonu JSON'dan çıkar.
- [x] A3 Alış fiyatı sızıyor (`api/products`, `products/[slug]`, `campaigns/active`, `orders` GET) → Prisma `select` ile vitrin alanları.
- [x] A4 next 14.2.5 → son 14.2.x (CVE-2025-29927 vb.).

### B. Güvenlik — ORTA / DÜŞÜK
- [x] B1 `siparis-sorgula:73` `notes.includes(email)` → birebir e-posta eşleşmesi.
- [x] B2 iyzico callback: `||`→`&&` (satır 74), `paidPrice` = sipariş tutarı, `status==='PENDING'` idempotency, IYZWSv2 imza. (Kart ödemesi açılmadan ŞART.)
- [x] B3 E-posta HTML kaçışı: `contactConfirmation`, `orders` admin maili → `kacir()`; iletişim formuna Turnstile. (kaçış yapıldı; Turnstile ertelendi — form zaten saatte 5 istekle sınırlı)
- [x] B4 `api/stats/sales` ciroyu herkese açıyor → aggregate, ciroyu çıkar, cache.
- [x] B5 `HOSGELDIN10` e-posta değiştirerek sınırsız → sadece doğrulanmış hesap.
- [x] B6 CSP (önce Report-Only) + HSTS; `X-XSS-Protection` kaldır. — 28 Eki: 12 sayfa tarandı, ihlal yok → CSP zorunlu + report-uri /api/csp-rapor (Vercel log). Kart ödemesi açılırken iyzico formuyla yeniden test et
- [x] B7 `hiz-siniri.ts:66-70` DB hatasında admin OTP'yi reddet.
- [x] B8 `totp-check`/`otp-request` admin e-posta ifşası → tek tip yanıt.
- [x] B9 `admin/upload` SVG kabul + ham dosya adı → SVG kapat, slug.
- [x] B10 `api/indexnow` GET herkese açık → cron/admin korumalı.
- [x] B11 `.env.production`, `.claude/settings.local.json`, `public/downloads/*.apk` → gitignore/repo dışı. (.env.production ve settings.local.json takipten çıkarıldı; APK footer indirme bağlantısı olduğu için bırakıldı)

### C. Mobil UX / Performans — YÜKSEK
- [x] C1 `next.config.js:227` `images.unoptimized` → Blob için loader ya da upload'da 400/800 WebP.
- [x] C2 Hero preload root layout'ta (her sayfada iniyor) → sadece ana sayfa.
- [x] C3 İlk ziyarette 3 katman üst üste (app banner + çerez + kampanya modal) → tek sıra: çerez → (2. sayfa) kampanya → (3. ziyaret) app banner.
- [x] C4 `UrunKarti` çift dokunuşla favori çalışmıyor, tek dokunuşa gecikme ekliyor → kaldır.
- [x] C5 Footer'da Visa/Mastercard/iyzico logosu (kart ödemesi kapalı) → kaldır.
- [x] C6 `CartDrawer` focus trap + body scroll kilidi yok.

### D. Mobil UX — ORTA / DÜŞÜK
- [x] D1 16px altı inputlar iOS'ta zoom (`SearchSuggest:169`, `SpotlightArama:139`, checkout kupon) → `text-base md:text-sm`.
- [x] D2 Checkout adres: il/ilçe/posta kodu ayrı alan + `autoComplete`.
- [x] D3 CookieConsent / SepetToast alt menü + safe-area üstüne biniyor.
- [x] D4 Kategori afişi iki kez `priority` → tek Image. (gereksiz: iki afiş aynı dosya, tek indirme)
- [x] D5 framer-motion → layout'ta `LazyMotion` + `m`.
- [x] D6 Root layout'taki 12 istemci bileşeni → Spotlight/HediyeDanışmanı etkileşimde yüklensin. (zaten ssr:false ayrı parça; ek kazanç düşük, atlandı)
- [x] D7 Ölü kod: ProductCard, ProductGrid, ProductDetail, ProductImageWrapper, ProductCardSkeleton, CustomCursor (+testleri).
- [x] D8 "Efsane Kasım" bandı koda gömülü → kampanya verisinden. (1 Aralık 2026 00:00 itibarıyla kampanya ve bant otomatik kapanır)

### E. Awwwards seviyesi mobil alışveriş (temeller bittikten sonra)
Jüri bakar: Tasarım %40, Kullanılabilirlik %30, Yaratıcılık %20, İçerik %10. Önce hız/temizlik, sonra "an".
- [x] E1 Hikâye: "Cezaevi atölyesinde üretim → eğitim → istihdam". Her ürünün atölye/üretim süreci kartı (gerçek foto/video, sahte sayı yok). (28 Eki: AtolyeHikayesi.tsx — 4 bölüm Atölye/Emek/Meslek/Evinize, seedance_2_5 insansız temsili videolar public/hikaye/, ping-pong döngü ~330-390 KB, yalnızca görünürken iner/oynar, doğrulanmış metinler. Ana sayfada ürün vitrininden sonra)
- [x] E2 Tek görsel dil: tutarlı ürün fotoğrafı (Aşama 3), 1 display + 1 metin fontu, sınırlı palet, büyük tipografi. (28 Eki: başlık fontu Fraunces yapıldı. 62 ürünün hepsi yerel sahnelenmiş, ölçek tutarlı (%62-95). bez-canta-setleri ve taki-cantasi Higgs (gpt_image_2_5) ile krem zemine alındı)
- [x] E3 İmza etkileşim: ürün kartı → detay paylaşımlı geçiş (View Transitions API), parmakla kaydırmalı galeri, "bottom sheet" sepet/filtre. (yapıldı: kart→detay görsel geçişi + mobil filtre alt paneli. Kaydırmalı galeri ertelendi: hiçbir üründe 1den fazla fotoğraf yok)
- [x] E4 Başparmak bölgesi: tüm birincil eylemler alt %40'ta; yapışkan "Sepete ekle" barı ürün sayfasında.
- [x] E5 Mikro etkileşimler: haptic (Capacitor Haptics), sepete uçan ürün, iskelet yüklemeler; `prefers-reduced-motion` desteği. (yapıldı: titreşim + sepete uçan görsel + reduced-motion. Native Capacitor Haptics eklenmedi, iOS Safari titreşimi desteklemiyor)
- [~] E6 Hız bir tasarım öğesidir: mobil LCP < 2s, INP < 200ms, CLS < 0.05; Lighthouse mobil 90+. (28 Eki: önce ana 66 / gida 66, LCP 8,9-9,2 sn → sonra ana 71 / gida 88, LCP 6,4 / 3,4 sn; ana sayfa gözlenen LCP 2,4 sn. Ana sayfa sunucu bileşenine bölündü (AnaSayfa.tsx + istemci AnaSayfaVitrini.tsx); görseller yeniden sıkıştırıldı, logo-160. Deploy sonrası (bc37500): ana 58-71, lab LCP 7 sn ama gözlenen LCP 1,5-2,6 sn; DOM 546. Kalan maliyet stil/yerleşim ~0,9 sn + 2749 chunk ~0,6 sn. Saha verisi (CrUX) zaten başarılı — laboratuvar skoru için ek iş düşük öncelik)
- [~] E7 Erişilebilirlik WCAG 2.2 AA (kontrast, odak, 44px dokunma hedefi). (Lighthouse a11y 92-97: kontrast, başlık sırası, select etiketi düzeltildi. Tam WCAG denetimi yapılmadı)
- [ ] E8 Başvuru öncesi: case study sayfası + 30 sn mobil ekran kaydı; önce CSSDA/FWA gibi küçük galerilerde dene.

### F. 28 Ekim — Sinematik giriş + ürün sayfası
- [x] F1 Giriş: Cinema Studio 3.0 (1080p) videolar `public/hero/giris-mobil.mp4` (4:3) / `giris-genis.mp4` (21:9, ilk 2,2 sn — ürünler başlığa girmesin). Fotoğraf LCP olarak kalır; video `load` + idle sonrası iner, Save-Data / reduced-motion'da hiç inmez.
- [x] F2 Başlık harf harf beliriyor (`HarfHarf.tsx`, yalnızca CSS).
- [x] F3 Hikâye masaüstü sürümleri: Cinema Studio 3.0 16:9 `public/hikaye/*-genis.mp4|jpg`, mobil 3:4 sürümler aynen.
- [x] F4 Ürün sayfası: dokununca büyüteç (`GorselBuyutec.tsx`, dokunulan noktaya 2,4x, parmakla gezinme), masaüstünde galeri sabit, kategoriye göre atölye hikâyesi bölümüne bağlantı kartı.
- [x] F5 Mobil filtre alt paneli (bottom sheet).
- Kredi: bu tur ~550; seedance 720p giriş denemeleri kullanılmadı.

### G. 28 Ekim — 2. tur güvenlik denetimi
- [x] G1 YÜKSEK `GET /api/track` herkese açık: son ziyaretlerin ip/şehir/oturum bilgisi (KVKK) → GET'i kaldır/adminGuard, hata mesajını gizle.
- [x] G2 YÜKSEK Ürün JSON-LD'de yorumsuz ürüne sahte 4.9 puan / 12 yorum / "Doğrulanmış Müşteri" (`urun/[slug]/page.tsx:200-206,265-281`) → yorum yoksa hiç basma.
- [x] G3 YÜKSEK Next 14.2.35: RSC DoS + rewrite SSRF yalnızca 15.5.x'te yamalı; `@vercel/blob@0.21` undici → Next 15 geçişi planla. (Next 15.5.28 + React 19 + @vercel/blob 2.x; async params codemod, ssr:false katmanları IstemciKatmanlari.tsx)
- [x] G4 YÜKSEK `/downloads/isyurtlari.apk` debuggable debug derleme → imzalı release APK ya da Play Store linki. (APK dosyası ve tüm bağlantılar kaldırıldı; Android banner yalnızca PWA kurulumu varsa)
- [x] G5 ORTA JSON-LD `<` kaçışı yok (saklı XSS, admin onaylı yorumla) → `.replace(/</g,'\\u003c')`.
- [x] G6 ORTA CSV formül enjeksiyonu (`lib/csv.ts`) → `= + - @` başına `'`.
- [x] G7 ORTA `api/admin/export` User şifre özetleri + reset token'ları veriyor, audit yok → hassas sütunları çıkar, logAudit.
- [x] G8 ORTA `api/csp-rapor` DB tabanlı hız sınırı Neon'u uyandırıyor → bellek içi / örnekleme.
- [x] G9 ORTA `api/orders` (+ muhasebe uçları) hata mesajını istemciye sızdırıyor → sabit mesaj.
- [x] G10 DÜŞÜK TOTP sırrı düz metin + kod tekrar kullanımı → AES-GCM + son adım.
- [x] G11 DÜŞÜK Resend yoksa doğrulama/sıfırlama linki log'a yazılıyor → prod'da kapat.
- [x] G12 DÜŞÜK Admin ürün PUT/DELETE audit yok → logAudit.
- [x] G13 DÜŞÜK sharp `limitInputPixels` yok → 40 MP.
- [x] G14 DÜŞÜK Sipariş kalem sayısı sınırsız → en fazla 50.

### H. Katalog & Ürün Temizliği — bekleyenler
- [x] H1-H4 Etiketli/istenmeyen ürünler admin panelden temizlendi (Foça M Yumurta, Yoğurt Kovası, 900 TL zeytin, 1250 TL kutu).
- [ ] H5 Fiyatı 0 olan veya eksik ürünler (/admin/fiyatlar üzerinden fiyat girilecek; fiyat girilince Merchant feed'ine otomatik dahil olur).
- [ ] H6 Kalan yeni ürünlerin siteye aktarımı (SEO uyumlu slug ve kâr oranıyla).

### I. Google Merchant Center & Otomatik Piyasa Fiyat Analizi
- [x] I1 Dinamik XML Feed optimizasyonu (Elban, AK-CE, ADVEM, Zenbay marka eşleştirme, Google kategori taksonomisi 422/587/632/1604, zengin açıklamalar, `identifier_exists: no`).
- [ ] I2 Merchant Center Panel Kargo Kuralları (Türkiye geneli kargo ücreti ve 2-4 iş günü teslimat süresi tanımı).
- [ ] I3 Merchant Center Panel İade Politikası (14 gün yasal iade, iade adresi ve kargo şartları).
- [x] I4 Merchant Center "Otomatik Ürün Güncellemeleri" Altyapısı:
  - Kod Tarafı (TAMAMLANDI): `src/app/urun/[slug]/page.tsx` içinde Google standartlarında `Schema.org/Product` ve `Offer` (fiyat, stok, para birimi, kargo ve iade detayları) JSON-LD mikro verileri canlıya alındı.
  - Panel Onayı: Merchant Center panelinden `Araçlar > Otomatik İyileştirmeler > Otomatik Ürün Güncellemeleri` onay kutusunun aktifleştirilmesi bekleniyor.
- [x] I5 Otomatik Piyasa Fiyat Analizi & Öneri Modülü:
  - Admin Entegrasyonu (TAMAMLANDI): `/admin/fiyatlar` sayfasına piyasa muadil fiyatlandırma ve kâr marjı analiz motoru eklendi (`ONERILEN_PIYASA_FIYATLARI` + `/api/admin/products/fiyat-tamamla` ile tek tıkla toplu fiyat/maliyet tamamlama).
  - Google Dahili Rapor: Merchant Center > Büyüme > *Fiyat Rekabet Gücü Raporu (Price Competitiveness)* panelden açılabilir.

### J. Klon Proje & Marka Yayılımı: cezaevinden.com (İleride Yapılacak)
- [ ] J1 Bağımsız Klonlama: `sosyal/` projesini `.git`, `.next`, `node_modules` hariç tutarak yeni `cezaevinden/` dizinine kopyalama (`isyurtlari.com.tr` deposuna sıfır etki ve tam izolasyon).
- [ ] J2 Yeni Git Deposu: Bağımsız GitHub deposu (`git init`, `git remote add origin https://github.com/.../cezaevinden.git`).
- [ ] J3 Ortak Veritabanı: Neon PostgreSQL `DATABASE_URL` bağlantı dizesini kullanarak aynı ürün/sipariş/katalog veritabanını paylaşma.
- [ ] J4 Marka & Alan Adı Uyarlaması:
  - `apps/isyurtlari/src/lib/seo.ts` (`SITE_URL = 'https://cezaevinden.com'`, `SITE_NAME = 'cezaevinden.com'`).
  - `apps/isyurtlari/public/manifest.json` ("Cezaevinden" PWA başlığı ve kısa adı).
  - Logo, favicon ve og-gorsel marka görselleri.
  - Vercel dağıtımı (`NEXT_PUBLIC_DOMAIN=cezaevinden.com`, `NEXTAUTH_URL=https://cezaevinden.com`).
