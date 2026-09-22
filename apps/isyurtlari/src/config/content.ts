// Website Content Configuration
// Tüm metin içerikler bu dosyada merkezi olarak yönetilir

export const content = {
  // Home Page
  home: {
    announcements: [
      'Her satın alma bir ikinci şansa dönüşür',
      'El emeği, gerçek değer',
      'Beceri kazanan insanları birlikte destekleyin',
      'Kaliteli ürünler, insan odaklı üretim',
    ],
    hero: {
      badge: 'Hükümlü El Emeği Ürünler',
      title: 'Beceri',
      titleHighlight: 'Değer',
      // "Yaratan" kaldirildi: yaratmak Allah'a mahsus kabul edildigi icin
      // yanlis anlasiliyordu. Tek basina "Yaratıcı." da ayni sebeple
      // ("Yaratıcı" = Allah) secilmedi.
      titleSuffix: 'Doğal',
      subtitle: 'Hükümlülerin el emeğiyle üretilen ürünler. Her satın alma, bireyin yeniden başlamasına ve topluma kazanılmasına yardım eder.',
      ctaPrimary: 'Değiştir. Satın Al. Destekle.',
      ctaSecondary: 'Misyon & Vizyon',
    },
    stats: [
      { value: '70.000+', label: 'İşyurtlarında' },
      { value: '500+', label: 'Ürün & Hizmet' },
      { value: '14 gün', label: 'Cayma Hakkı' },
    ],
    impactCards: [
      {
        value: '70.000+',
        title: 'Hükümlü Çalışmakta',
        description: 'İşyurtlarında aktif olarak istihdam',
      },
      {
        value: '500+',
        title: 'Ürün & Hizmet',
        description: 'El yapımı, kaliteli ürünler',
      },
      {
        value: '14 gün',
        title: 'Cayma Hakkı',
        description: 'Teslimden itibaren iade imkânı',
      },
    ],
    socialImpact: [
      {
        title: 'Hükümlü Rehabilitasyonu',
        description: 'Meslek eğitimi ve yeniden başlama',
      },
      {
        title: 'El Emeği Üretim',
        description: 'Meslek eğitimi sürecinde üretilen ürünler',
      },
      {
        title: 'Her Satın Alma Yardım Eder',
        description: 'Hükümlülerin topluma kazanılması',
      },
    ],
    productsHeading: {
      subtitle: 'El Yapımı Ürünler',
      title: 'Hükümlülerin Eğitimi Sayesinde Üretildi',
    },
  },

  about: {
    hero: {
      badge: 'Sosyal etki odaklı pazar yeri',
      title: 'İşyurtları ürünleriyle',
      titleHighlight: 'gerçek değer',
      titleSuffix: 'katın',
      description: 'Emekle üretilen ürünleri görünür kılan, alışverişi rehabilitasyon ve yeniden başlangıç hikayesine dönüştüren online mağaza.',
    },
    stats: [
      { value: '81', label: 'İlde faaliyet' },
      { value: '500+', label: 'Ürün çeşidi' },
      { value: '6', label: 'Ana kategori' },
    ],
    sections: {
      whatIsWorkshop: {
        title: 'İşyurtları nedir?',
        content: 'İşyurtları, ceza infaz kurumları bünyesinde mesleki üretim yapan ve hükümlülerin çalışma disiplini, beceri ve özgüven kazanmasını destekleyen üretim alanlarıdır.',
        content2: 'Bu platform, üretilen ürünleri daha çağdaş, erişilebilir ve güven veren bir alışveriş deneyimiyle insanlara ulaştırmayı hedefler.',
        socialImpactQuote: 'Alışveriş yalnızca bir ürün seçimi değil, yeniden başlama ihtimaline verilen destektir.',
      },
      mission: {
        title: 'Misyonumuz',
        content: 'Nitelikli el emeğini görünür kılmak, üretim hikayesini şeffaf biçimde anlatmak ve bu ürünleri daha çok insana ulaştırmak.',
      },
      vision: {
        title: 'Vizyonumuz',
        content: 'Türkiye’nin en güven veren el emeği ürünleri alışveriş deneyimini inşa ederek işyurtları üretimini daha modern, ulaşılabilir ve sürdürülebilir hale getirmek.',
      },
      values: [
        { title: 'Kalite', description: 'Ürün, sunum ve hizmette tutarlı bir standart.' },
        { title: 'Güven', description: 'Açık bilgi, sade süreç ve şeffaf iletişim.' },
        { title: 'El Emeği', description: 'Meslek eğitimi sürecinde üretilen ürünleri öne çıkarma.' },
        { title: 'Sürdürülebilirlik', description: 'Yerel üretime ve uzun vadeli etkiye odaklanan yaklaşım.' },
      ],
    },
    contact: {
      title: 'Bir fikriniz veya sorunuz mu var?',
      subtitle: 'Platformu birlikte daha güçlü hale getirelim.',
      cta: 'Bize ulaşın',
    },
    legalDisclaimer: 'isyurtlari.com.tr bağımsız bir online satış platformudur. Ürün, içerik ve satış süreçleri platform sorumluluğunda yürütülür; kurumlarla resmi temsil ilişkisi bulunduğu anlamına gelmez.',
  },
};
