// Google Merchant & Schema.org Marka Çözümleme ve Başlık Zenginleştirme Modülü

export interface FeedOzellestirme {
  baslik?: string;
  marka?: string;
}

// Jenerik veya eski ürünlerin Google Merchant için optimize edilmiş başlık ve markaları
export const FEED_OZELLESTIRMELERI: Record<string, FeedOzellestirme> = {
  // Gıda
  'kavurma': {
    baslik: 'Elban Geleneksel Vakumlu Dana Kavurma 250 gr',
    marka: 'Elban',
  },
  'yesil-zeytin': {
    baslik: 'AK-CE Doğal Salamura Yeşil Zeytin 1000 gr',
    marka: 'AK-CE',
  },
  'siyah-zeytin': {
    baslik: 'AK-CE Doğal Gemlik Siyah Zeytin 1000 gr',
    marka: 'AK-CE',
  },
  'peynir': {
    baslik: 'Elban Tam Yağlı Beyaz Peynir 1000 gr',
    marka: 'Elban',
  },
  'tereyag': {
    baslik: 'Elban Geleneksel Köy Tereyağı 1000 gr',
    marka: 'Elban',
  },
  'cilek-receli': {
    baslik: 'Elban Geleneksel Çilek Reçeli 1000 gr',
    marka: 'Elban',
  },
  'zeytinyagi': {
    baslik: 'Elban Soğuk Sıkım Naturel Sızma Zeytinyağı 1 lt',
    marka: 'Elban',
  },
  'bal-ari-urunleri': {
    baslik: 'Elban Doğal Bal Çiçek Balı 850 gr',
    marka: 'Elban',
  },
  'polen': {
    baslik: 'Elban Doğal Arı Poleni 250 gr',
    marka: 'Elban',
  },
  'domates-salcasi': {
    baslik: 'Elban Geleneksel Ev Tipi Domates Salçası 1000 gr',
    marka: 'Elban',
  },
  'biber-salcasi': {
    baslik: 'Elban Doğal Acı Biber Salçası 1000 gr',
    marka: 'Elban',
  },
  'biber-receli': {
    baslik: 'Elban Geleneksel Tatlı Biber Reçeli 420 gr',
    marka: 'Elban',
  },
  'incir-receli': {
    baslik: 'Elban Geleneksel İncir Reçeli 420 gr',
    marka: 'Elban',
  },
  'recel-cesitleri': {
    baslik: "Elban Karışık Geleneksel Reçel Paketi 3'lü",
    marka: 'Elban',
  },
  'kavala-kurabiyesi': {
    baslik: 'Elban Bademli Kavala Kurabiyesi 350 gr',
    marka: 'Elban',
  },
  'findik': {
    baslik: 'Espiye Doğal İç Fındık Kavrulmuş 250 gr',
    marka: 'Espiye',
  },
  'sari-uzum': {
    baslik: 'Elban Besni Sarı Kuru Üzüm 500 gr',
    marka: 'Elban',
  },
  'siyah-uzum': {
    baslik: 'Elban Doğal Siyah Kuru Çekirdeksiz Üzüm 500 gr',
    marka: 'Elban',
  },
  'pirinc': {
    baslik: 'Elban Baldo Pirinç 1 kg',
    marka: 'Elban',
  },
  'cekirdek': {
    baslik: 'Toprakkale Çifte Kavrulmuş Siyah Ayçekirdeği 250 gr',
    marka: 'Toprakkale',
  },
  'yogurt-4-kg-kovasi': {
    baslik: 'Foça Doğal Tava Yoğurdu 4 kg (Kova)',
    marka: 'İşyurtları',
  },
  'kahramanmaras-susamli-cubuk-450-gr': {
    baslik: 'Elban Kahramanmaraş Susamlı Tuzlu Çubuk 450 gr',
    marka: 'Elban',
  },
  'yoresel-kahramanmaras-coregi-450-gr': {
    baslik: 'Elban Yöresel Kahramanmaraş Çöreği 450 gr',
    marka: 'Elban',
  },
  'elazig-dut-kurusu-500-gr': {
    baslik: 'Elazığ Doğal Beyaz Dut Kurusu 500 gr',
    marka: 'Elazığ',
  },
  'elazig-gunkurusu-kayisi-500-gr': {
    baslik: 'Elazığ Doğal Günkurusu Kayısı 500 gr',
    marka: 'Elazığ',
  },

  // Temizlik & Kozmetik
  'el-kremi-beyaz-kavanoz': {
    baslik: 'ADVEM Doğal Gliserinli Nemlendirici El Kremi 150 ml',
    marka: 'ADVEM',
  },

  // Tekstil
  'el-dokumasi-namazlik': {
    baslik: 'ADEMODA İpek Dokulu Saçaklı El Dokuması Namazlık',
    marka: 'ADEMODA',
  },

  // Ahşap
  'ahsap-fici-kumbara': {
    baslik: 'İşyurtları El Yapımı Doğal Ahşap Fıçı Kumbara',
    marka: 'İşyurtları',
  },
  'ahsap-oyma-kutu': {
    baslik: 'İşyurtları Usta İşi El Oyması Ahşap Mücevher Kutusu',
    marka: 'İşyurtları',
  },

  // Hediyelik & El Sanatları
  'el-yapimi-porselen-cini-cay-seti': {
    baslik: 'Zenbay Kütahya El Yapımı Çini Porselen Çay Seti 6 Kişilik',
    marka: 'Zenbay',
  },
  'el-yapimi-cini-tabak': {
    baslik: 'Zenbay Kütahya Kadife Kutulu El Yapımı Çini Tabak 80 cm',
    marka: 'Zenbay',
  },
  'elazig-mermer-kosk-saat-kucuk': {
    baslik: 'Elazığ El Yapımı Doğal Mermer Köşk Masa Saati (Küçük Boy)',
    marka: 'Elazığ',
  },
  'elazig-mermer-islemeli-ahsap-kutu': {
    baslik: 'Elazığ Mermer İşlemeli Doğal Ahşap Kutu',
    marka: 'Elazığ',
  },
  'kutulu-cini-tabak-sari-desenli-kadife-kutu': {
    baslik: 'Zenbay Kütahya Kadife Kutulu Sarı Desenli Çini Tabak',
    marka: 'Zenbay',
  },
  'mermer-taraftar-plaketi-fenerbahce': {
    baslik: 'Elazığ Doğal Mermer Masa Üstü Taraftar Plaketi (Fenerbahçe)',
    marka: 'Elazığ',
  },
  'mina-bebek-oyuncak-bebek-geleneksel-kiyafetli': {
    baslik: 'ADEMODA El Yapımı Geleneksel Kıyafetli Mina Bez Bebek',
    marka: 'ADEMODA',
  },
  'cini-fincan-seti-kirmizi-kutulu': {
    baslik: 'Zenbay Kütahya Kadife Kutulu El Sanatı Çini Kahve Fincan Seti',
    marka: 'Zenbay',
  },
  'cini-kutulu-set-kirmizi-kadife-kutu-fincan-kase': {
    baslik: 'Zenbay Kütahya Kırmızı Kadife Kutulu Çini Fincan ve Kase Takımı',
    marka: 'Zenbay',
  },
};

// Ürün başlığından bilinen markayı tespit et
export function markaBul(ad: string, slug?: string): string {
  if (slug && FEED_OZELLESTIRMELERI[slug]?.marka) {
    return FEED_OZELLESTIRMELERI[slug].marka!;
  }
  const markalar = [
    'AK-CE',
    'Elban',
    'ADVEM',
    'Zenbay',
    'Toprakkale',
    'Odosun',
    'ADEMODA',
    'Espiye',
    'Niğde',
    'Kalkandere',
    'Tokat',
    'Adıyaman',
    'Elazığ',
    'Gaziantep',
  ];
  for (const m of markalar) {
    if (new RegExp(`(^|[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ])${m}([^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]|$)`, 'i').test(ad)) {
      return m;
    }
  }
  return 'İşyurtları';
}
