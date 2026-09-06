-- Türkçe arama altyapısı.
--
-- SORUN: Arama "contains" ile düz metin eşleşmesi yapıyordu. "zeytinyagi"
-- yazan müşteri "Zeytinyağı"nı bulamıyordu - üstelik ürünün slug'ı birebir
-- "zeytinyagi" olmasına rağmen. Ölçüldü: /api/products?search=zeytinyagi
-- boş dizi dönüyordu.
--
-- ÇÖZÜM: Aramada hem metin hem sorgu aynı biçime indirgeniyor (küçük harf +
-- aksan/Türkçe karakter sadeleştirmesi) ve benzerlik sıralaması ekleniyor.
-- Harici bir arama servisine gerek yok; Postgres'in kendi eklentileri yeterli.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Metni aramaya uygun tek biçime indirger: "Zeytinyağı" -> "zeytinyagi".
--
-- unaccent() tek argümanlı hâliyle STABLE'dır (kullandığı sözlük çalışma
-- anında değişebilir), bu yüzden ifade indeksinde kullanılamaz. Sözlük adı
-- açıkça verildiğinde fonksiyon IMMUTABLE olarak işaretlenebiliyor -
-- Postgres belgelerinin önerdiği yol bu. İndeks kurabilmemizin tek koşulu.
CREATE OR REPLACE FUNCTION public.tr_normalize(metin text)
RETURNS text AS $$
  SELECT lower(public.unaccent('public.unaccent', COALESCE(metin, '')))
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

-- Trigram indeksleri: hem "içinde geçiyor" araması hem benzerlik sıralaması
-- bunları kullanıyor. Bunlar olmadan her arama tüm tabloyu tarardı.
CREATE INDEX IF NOT EXISTS "Product_ad_trgm_idx"
  ON "Product" USING gin (public.tr_normalize("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_aciklama_trgm_idx"
  ON "Product" USING gin (public.tr_normalize("description") gin_trgm_ops);

-- Liste sorgusu fiyata ve tarihe göre sıralanıyor; kategori süzgeciyle
-- birlikte kullanıldığı için bileşik indeks.
CREATE INDEX IF NOT EXISTS "Product_kategori_fiyat_idx"
  ON "Product" ("categoryId", "price");

CREATE INDEX IF NOT EXISTS "Product_kategori_olusturma_idx"
  ON "Product" ("categoryId", "createdAt" DESC);
