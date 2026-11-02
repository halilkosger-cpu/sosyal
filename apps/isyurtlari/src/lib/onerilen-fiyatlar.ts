/**
 * Fiyatsız (0 TL) ve maliyetsiz kalan el emeği ve gıda ürünleri için
 * piyasa ortalamalarına ve katalog benchmark'larına göre belirlenmiş
 * önerilen satış fiyatı, girdi maliyeti ve KDV oranları sözlüğü.
 */

export interface OnerilenFiyatDetay {
  price: number;
  purchasePrice: number;
  vatRate: number;
}

export const ONERILEN_PIYASA_FIYATLARI: Record<string, OnerilenFiyatDetay> = {
  // ── Gıda Ürünleri (KDV %10) ──
  'elban-adiyaman-karisik-cerez-400-gr-paket': { price: 391.5, purchasePrice: 270, vatRate: 10 },
  'zeytinyagi-500ml': { price: 350.0, purchasePrice: 240, vatRate: 10 },
  'badem': { price: 240.0, purchasePrice: 165, vatRate: 10 },
  'tereyag': { price: 380.0, purchasePrice: 260, vatRate: 10 },
  'uzum-pekmezi': { price: 195.0, purchasePrice: 135, vatRate: 10 },
  'kuru-fasulye-tahillar': { price: 180.0, purchasePrice: 120, vatRate: 10 },
  'kuru-baklagyller': { price: 165.0, purchasePrice: 110, vatRate: 10 },
  'hasasezmesi': { price: 185.0, purchasePrice: 125, vatRate: 10 },
  'yerfistigi': { price: 145.0, purchasePrice: 95, vatRate: 10 },

  // ── Hediyelik & El Sanatları & Ahşap (KDV %20) ──
  'zenbay-kutahya-kucuk-cini-saksi': { price: 240.0, purchasePrice: 150, vatRate: 20 },
  'el-yapimi-porselen-cini-hediyelikler': { price: 320.0, purchasePrice: 200, vatRate: 20 },
  'el-yapimi-kahve-seti': { price: 480.0, purchasePrice: 310, vatRate: 20 },
  'el-yapimi-bakir-islemeler': { price: 650.0, purchasePrice: 420, vatRate: 20 },
  'el-yapimi-oltu-tesbihler': { price: 850.0, purchasePrice: 550, vatRate: 20 },
  'el-yapimi-cini-ibik-ve-altlik': { price: 580.0, purchasePrice: 370, vatRate: 20 },
  'el-yapimi-comlekler': { price: 220.0, purchasePrice: 140, vatRate: 20 },
  'el-yapimi-kaktus': { price: 180.0, purchasePrice: 110, vatRate: 20 },
  'el-yapimi-oyma-pipo': { price: 360.0, purchasePrice: 230, vatRate: 20 },
  'el-yapimi-cini-minik-vazolar': { price: 220.0, purchasePrice: 140, vatRate: 20 },
  'el-yapimi-akvaryum': { price: 750.0, purchasePrice: 480, vatRate: 20 },
  'el-yapimi-mumluk-samdan': { price: 280.0, purchasePrice: 180, vatRate: 20 },
  'el-yapimi-ahsap-kitaplik': { price: 1850.0, purchasePrice: 1200, vatRate: 20 },
  'el-yapimi-ahsap-lamba': { price: 750.0, purchasePrice: 480, vatRate: 20 },
  'el-yapimi-sedef-kaplamali-satranc-seti': { price: 2450.0, purchasePrice: 1600, vatRate: 20 },
  'el-yapimi-gumus-kehribar-tesbih': { price: 1450.0, purchasePrice: 950, vatRate: 20 },
  'el-dokumasi-namazlik': { price: 450.0, purchasePrice: 290, vatRate: 20 },
  'el-yapimi-gumus-yuzukler': { price: 550.0, purchasePrice: 350, vatRate: 20 },
  'el-yapimi-gumus-taki-seti': { price: 1650.0, purchasePrice: 1100, vatRate: 20 },
  'el-yapimi-cini-vazo': { price: 480.0, purchasePrice: 310, vatRate: 20 },
};
