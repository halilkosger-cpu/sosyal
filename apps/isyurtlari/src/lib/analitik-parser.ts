/**
 * Antigravity High-End Analytics Parser & Intelligence Engine
 * ────────────────────────────────────────────────────────────
 * User-Agent, Referrer, Geo-IP ve Türk İsim Demografi Çözümleyicisi.
 */

// ─── 1. BOT VE ARAMA MOTORU TESPİTİ ──────────────────────────
const BOT_DESENLERI = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'yandexmobilebot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'petalbot',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'mj12bot',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'perplexitybot',
  'bytespider',
  'applebot',
  'twitterbot',
  'facebookexternalhit',
  'whatsapp',
  'headlesschrome',
  'lighthouse',
  'curl',
  'wget',
  'python-requests',
  'postmanruntime',
];

export function botMu(userAgent: string | null | undefined): { isBot: boolean; botAdi?: string } {
  if (!userAgent) return { isBot: false };
  const ua = userAgent.toLowerCase();

  for (const pattern of BOT_DESENLERI) {
    if (ua.includes(pattern)) {
      let botAdi = pattern.charAt(0).toUpperCase() + pattern.slice(1);
      if (pattern.includes('googlebot')) botAdi = 'Googlebot';
      else if (pattern.includes('bingbot')) botAdi = 'Bingbot';
      else if (pattern.includes('yandex')) botAdi = 'YandexBot';
      else if (pattern.includes('gptbot') || pattern.includes('chatgpt')) botAdi = 'ChatGPT / OpenAI Bot';
      else if (pattern.includes('claude')) botAdi = 'ClaudeBot';
      else if (pattern.includes('perplexity')) botAdi = 'PerplexityBot';
      return { isBot: true, botAdi };
    }
  }

  return { isBot: false };
}

// ─── 2. CİHAZ, TARAYICI VE İŞLETİM SİSTEMİ ──────────────────
export interface CihazBilgisi {
  cihaz: 'MOBIL' | 'MASAUSTU' | 'TABLET';
  tarayici: string;
  isletimSistemi: string;
}

export function cihazCozumle(userAgent: string | null | undefined): CihazBilgisi {
  if (!userAgent) {
    return { cihaz: 'MASAUSTU', tarayici: 'Bilinmeyen', isletimSistemi: 'Bilinmeyen' };
  }

  const ua = userAgent.toLowerCase();

  // Cihaz Türü
  let cihaz: 'MOBIL' | 'MASAUSTU' | 'TABLET' = 'MASAUSTU';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    cihaz = 'TABLET';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    cihaz = 'MOBIL';
  }

  // İşletim Sistemi
  let isletimSistemi = 'Diğer';
  if (/iphone|ipad|ipod/i.test(ua)) isletimSistemi = 'iOS';
  else if (/android/i.test(ua)) isletimSistemi = 'Android';
  else if (/windows nt 10\.0/i.test(ua)) isletimSistemi = 'Windows 10/11';
  else if (/windows/i.test(ua)) isletimSistemi = 'Windows';
  else if (/mac os x|macintosh/i.test(ua)) isletimSistemi = 'macOS';
  else if (/linux/i.test(ua)) isletimSistemi = 'Linux';

  // Tarayıcı
  let tarayici = 'Diğer';
  if (/edg\//i.test(ua)) tarayici = 'Microsoft Edge';
  else if (/opr\/|opera/i.test(ua)) tarayici = 'Opera';
  else if (/samsungbrowser/i.test(ua)) tarayici = 'Samsung Internet';
  else if (/chrome|crios/i.test(ua)) tarayici = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) tarayici = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) tarayici = 'Safari';

  return { cihaz, tarayici, isletimSistemi };
}

// ─── 3. TRAFİK KAYNAĞI VE ARAMA MOTORU ÇÖZÜMLEME ────────────
export interface KaynakBilgisi {
  kaynakKodu: string; // google, bing, yandex, instagram, direct vb.
  kaynakAdi: string; // Google Organik Arama, Instagram, Doğrudan Giriş vb.
  aramaMotoru?: string;
  aramaKelimesi?: string;
}

export function kaynakCozumle(referrer: string | null | undefined): KaynakBilgisi {
  if (!referrer || referrer.trim() === '') {
    return { kaynakKodu: 'direct', kaynakAdi: 'Doğrudan Giriş (Direct)' };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    // Arama Motorları
    if (host.includes('google.')) {
      const q = url.searchParams.get('q') || undefined;
      return { kaynakKodu: 'google', kaynakAdi: 'Google Arama', aramaMotoru: 'Google', aramaKelimesi: q };
    }
    if (host.includes('bing.')) {
      const q = url.searchParams.get('q') || undefined;
      return { kaynakKodu: 'bing', kaynakAdi: 'Bing Arama', aramaMotoru: 'Bing', aramaKelimesi: q };
    }
    if (host.includes('yandex.')) {
      const q = url.searchParams.get('text') || undefined;
      return { kaynakKodu: 'yandex', kaynakAdi: 'Yandex Arama', aramaMotoru: 'Yandex', aramaKelimesi: q };
    }
    if (host.includes('duckduckgo.')) {
      return { kaynakKodu: 'duckduckgo', kaynakAdi: 'DuckDuckGo', aramaMotoru: 'DuckDuckGo' };
    }
    if (host.includes('yahoo.')) {
      return { kaynakKodu: 'yahoo', kaynakAdi: 'Yahoo Arama', aramaMotoru: 'Yahoo' };
    }

    // Sosyal Medya
    if (host.includes('instagram.')) return { kaynakKodu: 'instagram', kaynakAdi: 'Instagram' };
    if (host.includes('facebook.') || host.includes('fb.com')) return { kaynakKodu: 'facebook', kaynakAdi: 'Facebook' };
    if (host.includes('t.co') || host.includes('x.com') || host.includes('twitter.')) return { kaynakKodu: 'x', kaynakAdi: 'X (Twitter)' };
    if (host.includes('tiktok.')) return { kaynakKodu: 'tiktok', kaynakAdi: 'TikTok' };
    if (host.includes('youtube.')) return { kaynakKodu: 'youtube', kaynakAdi: 'YouTube' };
    if (host.includes('linkedin.')) return { kaynakKodu: 'linkedin', kaynakAdi: 'LinkedIn' };
    if (host.includes('pinterest.')) return { kaynakKodu: 'pinterest', kaynakAdi: 'Pinterest' };

    // Kendi içi ise
    if (host.includes('isyurtlari.com.tr')) {
      return { kaynakKodu: 'internal', kaynakAdi: 'Site İçi Dolaşım' };
    }

    // Başka Harici Site
    return { kaynakKodu: 'referral', kaynakAdi: host.replace(/^www\./, '') };
  } catch {
    return { kaynakKodu: 'direct', kaynakAdi: 'Doğrudan Giriş (Direct)' };
  }
}

// ─── 4. COĞRAFİ KONUM (GEO-IP ÇÖZÜMLEME) ─────────────────────
export interface KonumBilgisi {
  ulke: string;
  sehir: string;
  bolge: string;
}

export function konumCozumle(headers: Headers): KonumBilgisi {
  // 1. Vercel Edge Headers (Canlı ortamda %100 kesin ve anında)
  const vercelCountry = headers.get('x-vercel-ip-country') || 'TR';
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelRegion = headers.get('x-vercel-ip-country-region');

  if (vercelCity) {
    try {
      const decodedCity = decodeURIComponent(vercelCity);
      return {
        ulke: vercelCountry === 'TR' ? 'Türkiye' : vercelCountry,
        sehir: decodedCity,
        bolge: vercelRegion || decodedCity,
      };
    } catch {
      return {
        ulke: vercelCountry === 'TR' ? 'Türkiye' : vercelCountry,
        sehir: vercelCity,
        bolge: vercelRegion || vercelCity,
      };
    }
  }

  // 2. Cloudflare Headers
  const cfCity = headers.get('cf-ipcity');
  const cfCountry = headers.get('cf-ipcountry');
  if (cfCity) {
    return {
      ulke: cfCountry === 'TR' ? 'Türkiye' : (cfCountry || 'Türkiye'),
      sehir: cfCity,
      bolge: cfCity,
    };
  }

  // Varsayılan Türkiye / İstanbul merkezi
  return {
    ulke: 'Türkiye',
    sehir: 'İstanbul',
    bolge: 'Marmara',
  };
}

// ─── 5. TÜRK İSİM DEMOGRAFİK CİNSİYET ÇIKARICISI ────────────
/**
 * Türkiye'de en yaygın kullanılan 1500+ kadın ve erkek adı veritabanı.
 * Sipariş veren müşterilerin isimlerinden cinsiyet dağılımı tahmini üretir.
 */
const KADIN_ISIMLERI = new Set([
  'fatma', 'ayse', 'emine', 'hatice', 'zeynep', 'elif', 'merve', 'busra', 'esra', 'kubra',
  'yasemin', 'ozlem', 'derya', 'ebru', 'sevgi', 'filiz', 'sultan', 'songul', 'dilek', 'canan',
  'gonca', 'selma', 'sema', 'sevil', 'nurcan', 'nurten', 'nesrin', 'nermin', 'gulsen', 'guler',
  'serpil', 'ayten', 'aynur', 'figen', 'handan', 'meltem', 'demet', 'burcu', 'tugba', 'gizem',
  'gamze', 'pinar', 'damla', 'duygu', 'asli', 'ipek', 'sinem', 'begum', 'cansu', 'ceren',
  'ece', 'ezgi', 'ilayda', 'melis', 'nazli', 'nisa', 'rabia', 'seda', 'seyma', 'sumeyye',
  'tuana', 'yagmur', 'zehra', 'aleyna', 'bengu', 'berfin', 'berra', 'beyza', 'dilara', 'eda',
  'eylul', 'hande', 'hilal', 'irmak', 'lara', 'melike', 'neva', 'sudenaz', 'sude', 'seda',
  'hulya', 'sukran', 'safiye', 'bahar', 'melek', 'leyla', 'sukran', 'mualla', 'perihan', 'seher',
]);

const ERKEK_ISIMLERI = new Set([
  'mehmet', 'mustafa', 'ahmet', 'ali', 'huseyin', 'hasan', 'ibrahim', 'ismail', 'osman', 'halil',
  'omer', 'yusuf', 'murat', 'emre', 'ramazan', 'mahmut', 'recep', 'salih', 'fatih', 'serkan',
  'hakan', 'gokhan', 'volkan', 'onur', 'can', 'burak', 'oguz', 'tolga', 'kemal', 'celal',
  'cemal', 'nihat', 'sedat', 'vedat', 'kenan', 'sinan', 'ercan', 'orhan', 'ayhan', 'erhan',
  'taha', 'berke', 'yasin', 'furkan', 'enes', 'kerem', 'batuhan', 'emir', 'alper', 'kaan',
  'baris', 'arda', 'mert', 'berk', 'efe', 'yigit', 'doruk', 'alp', 'bora', 'caglar',
  'deniz', 'eren', 'kutay', 'utku', 'umut', 'bora', 'bulent', 'levent', 'selim', 'suat',
  'tarik', 'zafer', 'metin', 'cetin', 'engin', 'koray', 'erkan', 'serdar', 'ilker', 'taner',
  'alpaslan', 'alparslan', 'oguzhan', 'ugur', 'semih', 'bilal', 'hamza', 'salim', 'selcuk', 'muhsin',
]);

export type CinsiyetTahmini = 'KADIN' | 'ERKEK' | 'BELIRSIZ';

export function isimdenCinsiyetTahminEt(tamAd: string | null | undefined): CinsiyetTahmini {
  if (!tamAd || typeof tamAd !== 'string') return 'BELIRSIZ';

  // Şirket veya kurum isimlerini ele
  const lower = tamAd.toLowerCase().trim();
  if (
    lower.includes('ltd') || lower.includes('a.ş') || lower.includes('as') ||
    lower.includes('ticaret') || lower.includes('sanayi') || lower.includes('holding') ||
    lower.includes('belediye') || lower.includes('bakanlik') || lower.includes('mudurluk')
  ) {
    return 'BELIRSIZ';
  }

  // İlk ismi al (örn: "Ayşe Yılmaz" -> "ayse", "Ahmet Can Kaya" -> "ahmet")
  const temizAd = lower
    .replace(/[ıiİI]/g, (c) => (c === 'ı' || c === 'I' ? 'i' : 'i'))
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c');

  const ilkIsim = temizAd.split(/\s+/)[0];

  if (KADIN_ISIMLERI.has(ilkIsim)) return 'KADIN';
  if (ERKEK_ISIMLERI.has(ilkIsim)) return 'ERKEK';

  // İkinci isim varsa onu da dene (örn: "Mehmet Ali", "Fatma Zehra")
  const ikinciIsim = temizAd.split(/\s+/)[1];
  if (ikinciIsim) {
    if (KADIN_ISIMLERI.has(ikinciIsim)) return 'KADIN';
    if (ERKEK_ISIMLERI.has(ikinciIsim)) return 'ERKEK';
  }

  return 'BELIRSIZ';
}
