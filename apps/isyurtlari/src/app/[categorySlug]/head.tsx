const categoryNames: Record<string, string> = {
  gida: 'Gıda Ürünleri',
  tekstil: 'Tekstil Ürünleri',
  ahsap: 'Ahşap Ürünler',
  dokuma: 'Dokuma Ürünleri',
  mobilya: 'Mobilya Ürünleri',
  metal: 'Metal İşleri',
  temizlik: 'Temizlik & Kozmetik',
  hediyelik: 'Hediyelik Eşyalar',
  'peyzaj-cicek': 'Peyzaj & Çiçekler',
};

const categoryDescriptions: Record<string, string> = {
  gida: 'Beslenme & Aşçılık Eğitimi alan hükümlüler tarafından el emeğiyle üretilen doğal gıda ürünleri.',
  tekstil: 'Derzillik Meslek Eğitimi alan hükümlüler tarafından el emeğiyle üretilen kaliteli tekstil ürünleri.',
  ahsap: 'Marangozluk Beceri Programı\'nın öğrencileri tarafından yapılan ahşap ürünler.',
  dokuma: 'Dokuma & Sanat Terapisi Programı\'nın katılımcıları tarafından üretilen dokuma ürünleri.',
  mobilya: 'Furniture Tasarım Eğitimi alan hükümlüler tarafından yapılan mobilya ürünleri.',
  metal: 'Metal İşleri Ustası Programı\'nın öğrencileri tarafından üretilen metal işleri.',
  temizlik: 'Temizlik & Kozmetik Eğitimi alan hükümlüler tarafından yapılan ürünler.',
  hediyelik: 'El Sanatları & Tasarım Programı\'nın öğrencileri tarafından yapılan hediyelik eşyalar.',
  'peyzaj-cicek': 'Peyzaj & Çiçek Tasarımı Eğitimi alan hükümlüler tarafından hazırlanan ürünler.',
};

export default async function Head({ params }: { params: { categorySlug: string } }) {
  const catName = categoryNames[params.categorySlug] || 'Ürünler';
  const catDesc = categoryDescriptions[params.categorySlug] || 'Adalet Bakanlığı Sosyal Girişimi ürünleri';
  const url = `https://isyurtlari.com.tr/${params.categorySlug}`;

  const title = `${catName} | isyurtlari.com.tr - Adalet Bakanlığı Sosyal Girişimi`;
  const description = `${catDesc} Her satın alma, hükümlülerin yeniden başlamasına ve topluma kazanılmasına yardım eder.`;

  const keywords = `${catName}, işyurtları, adalet bakanlığı, sosyal girişim, el yapımı, hükümlü ürünleri, rehabilitasyon`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org/',
              '@type': 'CollectionPage',
              name: catName,
              description: description,
              url: url,
              publisher: {
                '@type': 'Organization',
                name: 'Adalet Bakanlığı İşyurtları',
                url: 'https://isyurtlari.com.tr',
              },
            },
            {
              '@context': 'https://schema.org/',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Ana Sayfa',
                  item: 'https://isyurtlari.com.tr',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: catName,
                  item: url,
                },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
