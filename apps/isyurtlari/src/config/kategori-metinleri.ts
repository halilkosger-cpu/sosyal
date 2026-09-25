/**
 * Kategori sayfalarinin acilis metinleri.
 *
 * ─── NEDEN VAR ────────────────────────────────────────────────────────
 *
 * Kategori sayfalarinda gercek bir metin yoktu: baslik, kisa bir aciklama
 * ve urun izgarasi. Google'in bir liste sayfasini "bu konuda bilgi veren
 * sayfa" saymasi icin ozgun metin gerekiyor; olmadiginda sayfa yalnizca
 * urun adlarindan olusan bir dizin olarak okunuyor.
 *
 * ─── NEDEN IZGARANIN ALTINDA ──────────────────────────────────────────
 *
 * Metin urun izgarasinin ALTINA ciziliyor. Ustte olsaydi musteri urunu
 * gormeden metin okumak zorunda kalirdi; arama motoru icin de konum fark
 * etmiyor, sayfada bulunmasi yeterli.
 *
 * ─── IDDIA DENETIMI ───────────────────────────────────────────────────
 *
 * Metinlerde yalnizca dogrulanabilir seyler var: urunlerin nerede
 * uretildigi, hukumlulerin ucret karsiligi calisip meslek ogrendigi,
 * sitenin bagimsiz oldugu, ve genel bakim/saklama bilgisi. Katki maddesi,
 * saglik, "devlet garantili" ya da kar amaci gutmeme imasi bilerek yok.
 */

export interface KategoriBolumu {
  baslik: string;
  paragraflar: string[];
}

export const KATEGORI_METINLERI: Record<string, KategoriBolumu[]> = {
  gida: [
    {
      baslik: 'Cezaevi işyurtlarında üretilen gıda ürünleri',
      paragraflar: [
        'Bu sayfadaki zeytinyağı, reçel, salça, pekmez, bal, kuruyemiş ve bakliyat ürünlerinin tamamı Adalet Bakanlığı İşyurtları Genel Müdürlüğü’ne bağlı atölyelerde üretiliyor. Üretim tek bir yerde değil: zeytinyağı bir presten, salça bir konserve atölyesinden, kuru bakliyat bir tarım işletmesinden çıkıyor. Ürünün üzerindeki marka hangi işyurdunda üretildiğini gösteriyor.',
      ],
    },
    {
      baslik: 'Bu ürünleri kimler üretiyor',
      paragraflar: [
        'Atölyelerde çalışanlar ceza infaz kurumlarındaki hükümlüler. Çalışma ücret karşılığı; kişi hem bir gelir elde ediyor hem de tahliye sonrasında işine yarayacak bir meslek öğreniyor. Bir konserve hattında çalışan biri gıda üretiminin hijyen kurallarını, bir zeytin işletmesinde çalışan biri hasat ve presleme sürecini öğrenerek çıkıyor.',
      ],
    },
    {
      baslik: 'Nasıl saklanır',
      paragraflar: [
        'Reçel, salça ve pekmez gibi kavanoz ürünler açılmadan önce serin ve karanlık bir yerde, açıldıktan sonra buzdolabında saklanıyor. Salçanın üzerine ince bir tabaka zeytinyağı gezdirilmesi yüzeyinin kurumasını geciktirir. Zeytinyağı ışıktan uzak tutulduğunda tadını daha uzun koruyor; soğukta bulanıklaşması normaldir, oda sıcaklığında eski haline döner. Kuruyemiş ve bakliyat ağzı kapalı bir kapta, nemden uzakta bekletilmeli.',
        'Ürünlerin net miktarı, üretim yeri ve son tüketim tarihi ambalajın üzerinde yazıyor. Ambalajda yazmayan bir bilgiye ihtiyacınız olursa bize yazın; üreticisi olan işyurduna sorup size dönelim.',
      ],
    },
    {
      baslik: 'Sipariş ve teslimat',
      paragraflar: [
        'Siparişler kargoyla gönderiliyor. Cam kavanoz ve şişe içeren gönderilerde kırılmaya karşı ek ambalaj kullanılıyor. Teslim tarihinden itibaren 14 gün içinde cayma hakkınız var; gıda ürünlerinde ambalajın açılmamış olması gerekiyor.',
      ],
    },
  ],

  hediyelik: [
    {
      baslik: 'El emeğiyle üretilen hediyelik eşyalar',
      paragraflar: [
        'Çini, bakır, gümüş, ahşap, oltu taşı ve dokuma — bu sayfadaki ürünlerin her biri bir zanaatın ürünü ve tek tek elde yapılıyor. Çini bir tabak fırına girmeden önce desenini elle alıyor; bakır bir sahan çekiçle dövülüyor; namazlık bir dokuma tezgâhında sıra sıra atılıyor. Bu yüzden aynı ürünün iki adedi birebir aynı olmuyor: desende, tonda ve ölçüde küçük farklar bulunabilir. Bu bir kusur değil, elde üretimin doğal sonucu.',
      ],
    },
    {
      baslik: 'Zanaat öğrenmek',
      paragraflar: [
        'Bu atölyelerin amacı yalnızca üretim değil. Ceza infaz kurumlarındaki hükümlüler atölyelerde ücret karşılığı çalışıyor ve bir zanaat öğreniyor. Çinicilik, bakır işlemeciliği, gümüş kuyumculuk ve dokuma, tahliye sonrasında gerçekten iş bulunabilen alanlar. Bir tesbihin ya da bir çini vazonun arkasında, o işi yeni öğrenmiş bir el var.',
      ],
    },
    {
      baslik: 'Hediye olarak',
      paragraflar: [
        'Bu ürünler en çok hediye olarak alınıyor: çini çay seti ve kahve seti ev hediyesi olarak, gümüş takı seti ve yüzükler özel günler için, oltu tesbih ve sedef kaplamalı satranç seti ise koleksiyon değeri taşıyan hediyeler olarak tercih ediliyor. Ahşap raf ve lamba gibi ürünler daha çok kendi evi için alanların tercihi.',
      ],
    },
    {
      baslik: 'Bakım',
      paragraflar: [
        'Çini ürünler bulaşık makinesine girmemeli; ılık suyla, aşındırıcı olmayan bir süngerle elde yıkanmalı. Bakır ürünler zamanla doğal olarak kararır — bu bir bozulma değildir; limon ve tuzla ya da bakır parlatıcıyla eski haline döner. Gümüş takılar kullanılmadığında ağzı kapalı bir kutuda saklandığında daha geç kararır. Dokuma ürünler yıkanmadan önce etiketindeki talimat okunmalı.',
      ],
    },
  ],

  peyzaj: [
    {
      baslik: 'İşyurdu fidanlıklarında yetiştirilen fidanlar',
      paragraflar: [
        'Bu sayfadaki fidanlar Adalet Bakanlığı İşyurtları’na bağlı tarım işletmelerinde yetiştiriliyor. Fidanlar saksılı olarak gönderiliyor, yani köklü ve dikime hazır halde geliyor.',
      ],
    },
    {
      baslik: 'Dikim ve ilk bakım',
      paragraflar: [
        'Meyve fidanı dikmek için en uygun zaman, yaprak dökümünden sonraki sonbahar ile tomurcuklar patlamadan önceki erken ilkbahar arası. Dikim çukuru kök topundan belirgin biçimde geniş açılmalı; fidan, saksıdaki toprak seviyesinden daha derine gömülmemeli. Dikimden hemen sonra bol su verilmeli ve ilk yıl boyunca düzenli sulama sürdürülmeli.',
        'Meyve fidanları güneş alan bir yerde daha verimli oluyor. İlk birkaç yıl rüzgârdan korunmaları için bir herek faydalı olur. Budama genellikle kış sonunda yapılıyor; ilk yıllarda amaç meyve almak değil, ağacın taç yapısını oluşturmak.',
      ],
    },
    {
      baslik: 'Sipariş ve teslimat',
      paragraflar: [
        'Fidanlar kök bölgesi nemli tutularak gönderiliyor. Elinize ulaştığında mümkün olan en kısa sürede dikilmeli; hemen dikilemeyecekse gölge bir yerde, kökü kurumayacak şekilde bekletilmeli. Canlı bitki olduğu için teslimattan sonraki bakım koşulları ürünün durumunu doğrudan etkiliyor.',
      ],
    },
  ],
};
