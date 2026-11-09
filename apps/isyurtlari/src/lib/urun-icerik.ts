/**
 * Urune ozel zengin icerik (kullanim, saklama, secim ipuclari, SSS).
 *
 * Veritabanina alan eklemeden, slug ile eslesiyor. Icerik sunucuda
 * sayfaya basiliyor ve Product semasina bagli FAQPage olarak da veriliyor.
 *
 * KURALLAR: saglik/tedavi iddiasi yok; uretim yeri, hasat donemi, icerik
 * orani gibi dogrulanamayan bilgi yok. Bunlar atolyeden teyit edilince
 * `ek` alanina eklenir.
 */

export type UrunSss = { soru: string; cevap: string };

export type UrunIcerik = {
  /** Sayfada gorunen, urune ozel kisa tanitim paragrafi. */
  giris: string;
  /** "Nasil kullanilir" maddeleri. */
  kullanim: string[];
  /** Saklama ve raf omru bilgisi. */
  saklama: string;
  /** Alirken dikkat edilecekler / secim ipuclari. */
  ipuclari: string[];
  sss: UrunSss[];
};

const ICERIK: Record<string, UrunIcerik> = {
  'biber-salcasi': {
    giris:
      'Biber salçası, Türk mutfağında yemeğin tadını ve rengini belirleyen temel hazırlıklardan biridir. Bu salça, Adalet Bakanlığı İşyurtları atölyelerinde hazırlanır; sofrada hem pişirmede hem kahvaltılık olarak kullanabilirsiniz.',
    kullanim: [
      'Sebze yemeklerinde, çorbalarda ve et pişirmede, yağda hafifçe kavurduktan sonra ekleyin; kokusu ve rengi daha belirgin olur.',
      'Mercimek, bulgur pilavı ve makarna soslarına bir yemek kaşığı ekleyerek tat verebilirsiniz.',
      'Marinasyonlarda zeytinyağı ve baharatla karıştırıp et veya tavuğa sürün.',
      'Kahvaltıda zeytinyağıyla açarak ekmek banmalık sos olarak sunabilirsiniz.',
    ],
    saklama:
      'Açılmamış kavanozu serin ve kuru bir yerde saklayın. Açtıktan sonra kapağını sıkıca kapatıp buzdolabında tutun ve temiz bir kaşıkla alın. Yüzeyine ince bir kat zeytinyağı dökmek, saklama süresini uzatmaya yardımcı olur.',
    ipuclari: [
      'Ürün etiketindeki üretim ve son kullanma tarihine bakın.',
      'Acı veya tatlı tercihiniz varsa ürün adı ve açıklamasındaki bilgiyi kontrol edin.',
      'Salçayı doğrudan kavanozdan değil, temiz bir kaşıkla alın.',
    ],
    sss: [
      {
        soru: 'Biber salçası açıldıktan sonra ne kadar saklanır?',
        cevap:
          'Buzdolabında, kapağı sıkıca kapalı ve temiz kaşıkla kullanıldığında uzun süre saklanabilir. Yüzeyinde küf veya ekşi koku görürseniz tüketmeyin.',
      },
      {
        soru: 'Biber salçası ile domates salçası arasındaki fark nedir?',
        cevap:
          'Biber salçası biberden, domates salçası domatesten yapılır. Biber salçası daha yoğun ve baharatlı bir tat verir; ikisi birlikte de kullanılabilir.',
      },
      {
        soru: 'Bu ürün nerede üretiliyor?',
        cevap:
          'Ürün, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle üretilir. Satışından elde edilen gelir işyurtlarının üretimine katkı sağlar.',
      },
    ],
  },

  'domates-salcasi': {
    giris:
      'Domates salçası, çorbadan makarnaya, güveçten pilava kadar pek çok yemeğin temelidir. Adalet Bakanlığı İşyurtları atölyelerinde hazırlanan bu salçayı gündelik yemeklerinizde kullanabilirsiniz.',
    kullanim: [
      'Yemeğe başlarken soğan ve yağla birlikte kavurun; ham tadı gider, rengi ve aroması açılır.',
      'Çorba, kuru fasulye, nohut ve etli sebze yemeklerinde baz olarak kullanın.',
      'Makarna ve pizza soslarında taze domatesle birlikte yoğunluk katar.',
      'Sıcak suda açarak hızlı bir yemek sosu hazırlayabilirsiniz.',
    ],
    saklama:
      'Açılmamış kavanozu serin, kuru ve güneş görmeyen yerde saklayın. Açtıktan sonra buzdolabında, kapağı kapalı tutun ve temiz kaşıkla alın. Yüzeyine zeytinyağı dökmek hava temasını azaltır.',
    ipuclari: [
      'Etiketteki üretim ve son kullanma tarihine bakın.',
      'Yemeğe erken eklemek ve kavurmak ekşimsi tadı dengeler.',
      'Az miktarda kullanılan ürünlerde küçük kavanoz israfı azaltır.',
    ],
    sss: [
      {
        soru: 'Domates salçası yemeğe ne zaman eklenmeli?',
        cevap:
          'Soğan ve yağ kavrulduktan sonra, sıvı eklemeden önce. Birkaç dakika kavurmak çiğ tadı giderir.',
      },
      {
        soru: 'Açıldıktan sonra buzdolabına koymak gerekir mi?',
        cevap:
          'Evet. Açılan kavanozu buzdolabında saklamanız ve temiz kaşıkla almanız önerilir.',
      },
      {
        soru: 'Bu ürünü kim üretiyor?',
        cevap:
          'Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle üretilir.',
      },
    ],
  },

  'cilek-receli': {
    giris:
      'Çilek reçeli, kahvaltı sofrasının en sevilen reçellerinden biridir. Adalet Bakanlığı İşyurtları atölyelerinde hazırlanır; ekmek, tost, kek ve tatlılarda kullanabilirsiniz.',
    kullanim: [
      'Kahvaltıda ekmek, simit ve peynirle birlikte sunun.',
      'Krep, waffle, pankek ve sütlü tatlıların üzerine sos olarak ekleyin.',
      'Yoğurt, sütlaç veya dondurmayla birlikte tatlandırıcı olarak kullanın.',
      'Kurabiye ve kek hamurlarında dolgu olarak değerlendirin.',
    ],
    saklama:
      'Açılmamış kavanozu serin ve kuru bir yerde tutun. Açtıktan sonra buzdolabında saklayın, her seferinde temiz ve kuru bir kaşık kullanın; nem ve kırıntı küf riskini artırır.',
    ipuclari: [
      'Şeker oranı ve içerik bilgisi için ürün etiketine bakın.',
      'Hediye olarak tercih ediyorsanız yanında tereyağı veya kahvaltılık bir ürünle takım yapabilirsiniz.',
      'Kavanozun kapağında şişkinlik veya fermente kokusu varsa tüketmeyin.',
    ],
    sss: [
      {
        soru: 'Çilek reçeli açıldıktan sonra nasıl saklanır?',
        cevap:
          'Buzdolabında, kapağı kapalı biçimde ve temiz kaşıkla kullanılarak saklanmalıdır.',
      },
      {
        soru: 'Reçeli hangi yiyeceklerle kullanabilirim?',
        cevap:
          'Ekmek, tost, krep, yoğurt, sütlaç, dondurma ve kek-kurabiye dolgularında kullanılır.',
      },
      {
        soru: 'Hediye olarak gönderebilir miyim?',
        cevap:
          'Evet. Kavanoz ürünlerimiz hediye olarak tercih edilebilir; sepet adımında hediye seçeneklerini kullanabilirsiniz.',
      },
    ],
  },

  'biber-receli': {
    giris:
      'Biber reçeli, tatlı ve hafif acı dengesiyle peynir ve et yemeklerine eşlik eden farklı bir lezzettir. Adalet Bakanlığı İşyurtları atölyelerinde hazırlanır.',
    kullanim: [
      'Beyaz peynir, kaşar, labne ve krem peynirle kahvaltı veya meze tabağında sunun.',
      'Tost ve sandviçlerde sos yerine kullanın.',
      'Izgara et, tavuk veya köfte yanında tatlı-acı garnitür olarak servis edin.',
      'Peynirli börek ve krakerlerin üzerine ince bir kat sürün.',
    ],
    saklama:
      'Açılmamış kavanozu serin ve kuru bir yerde saklayın. Açtıktan sonra buzdolabında tutun ve temiz kaşıkla kullanın.',
    ipuclari: [
      'Acı derecesini ürün açıklamasından ve etiketten kontrol edin; ilk kez deneyecekseniz az miktarla başlayın.',
      'Peynir tabağında en iyi sonucu yumuşak ve tuzlu peynirlerle verir.',
      'Etiketteki tarih bilgisine dikkat edin.',
    ],
    sss: [
      {
        soru: 'Biber reçeli acı mıdır?',
        cevap:
          'Tadı tatlı ve hafif acı arasında değişebilir; kesin bilgi için ürün açıklaması ve etiketi geçerlidir.',
      },
      {
        soru: 'En çok hangi yiyeceklerle yenir?',
        cevap:
          'Beyaz peynir, labne, kaşar, tost, ızgara et ve tavukla birlikte tüketilir.',
      },
      {
        soru: 'Açıldıktan sonra nasıl saklanır?',
        cevap:
          'Buzdolabında, kapağı kapalı ve temiz kaşıkla kullanılarak saklanır.',
      },
    ],
  },

  'el-yapimi-dogal-sabun': {
    giris:
      'El yapımı sabunlar, seri üretimden farklı olarak küçük partiler hâlinde hazırlanır. Bu sabun, Adalet Bakanlığı İşyurtları atölyelerinde el emeğiyle üretilir; her parça boyut ve görünüm açısından küçük farklılıklar taşıyabilir.',
    kullanim: [
      'Elleri ve vücudu ıslatıp köpürtün, ardından bol suyla durulayın.',
      'Kullanım sonrasında sabunu suyun birikmediği, kuru bir sabunluğa koyun.',
      'Banyoda, mutfakta veya misafir lavabosunda el sabunu olarak kullanabilirsiniz.',
      'Hediye setlerinde ve dekoratif olarak banyo aksesuarı yanında sunulabilir.',
    ],
    saklama:
      'Sabunu kuru ve havadar bir yerde saklayın. Suda uzun süre bırakmak yumuşamasına ve çabuk erimesine neden olur. Doğrudan güneş ışığından ve nemden uzak tutun.',
    ipuclari: [
      'İçerik ve alerjen bilgisi için ürün etiketini okuyun; hassas ciltlerde önce küçük bir alanda deneyin.',
      'El yapımı üründe renk ve desen tonu partiden partiye değişebilir.',
      'Drenajlı bir sabunluk kullanmak ömrünü belirgin biçimde uzatır.',
    ],
    sss: [
      {
        soru: 'El yapımı sabun neden her seferinde aynı görünmüyor?',
        cevap:
          'Sabunlar küçük partiler hâlinde elle hazırlandığı için renk, desen ve şekilde küçük farklılıklar olabilir; bu üretim yönteminin doğal sonucudur.',
      },
      {
        soru: 'Sabunun ömrünü nasıl uzatırım?',
        cevap:
          'Kullandıktan sonra suyun süzüldüğü, kuru bir sabunlukta bekletin ve suda bırakmayın.',
      },
      {
        soru: 'Cilt hassasiyeti olanlar kullanabilir mi?',
        cevap:
          'İçerik bilgisi ürün etiketindedir. Hassasiyetiniz varsa kullanmadan önce etiketi inceleyin ve küçük bir alanda deneyin.',
      },
    ],
  },
};

/** Slug'a ait zengin icerik; yoksa null (sayfa eski haliyle calisir). */
export function urunIcerigi(slug: string): UrunIcerik | null {
  return ICERIK[slug] ?? null;
}

/** schema.org FAQPage; SSS yoksa null. */
export function sssJsonLd(icerik: UrunIcerik | null, sayfaUrl: string) {
  if (!icerik || icerik.sss.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${sayfaUrl}#sss`,
    mainEntity: icerik.sss.map((s) => ({
      '@type': 'Question',
      name: s.soru,
      acceptedAnswer: { '@type': 'Answer', text: s.cevap },
    })),
  };
}
