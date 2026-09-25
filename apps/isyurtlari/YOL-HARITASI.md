# isyurtlari.com.tr — Yol Haritası

Son güncelleme: 25 Eylül 2026 · Sıradaki iş: **Aşama 2**

Bu dosya, konuşma bağlamı kaybolduğunda doğru zemini bulmak için var.
Buradaki her sayı ve iddia canlı sitede ya da kaynak kodda **ölçülerek**
yazıldı; tahmin yok. Yeni bir iddia eklenecekse önce doğrulanmalı.

---

## Doğrulanmış mevcut durum (25 Eylül 2026)

**Katalog (canlı `/api/products` ve `/sitemap.xml` ile ölçüldü)**

| | Değer |
|---|---|
| Veritabanındaki ürün | 63 |
| Vitrinde görünen ürün | 49 |
| Fotoğrafsız ürün | 14 |
| Görünen kategori | 3 — Gıda (27), Hediyelik (21), Peyzaj (1) |
| Gizlenen kategori | 3 — Temizlik ve Kozmetik (11), Tekstil (2), Ahşap (1) |

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
