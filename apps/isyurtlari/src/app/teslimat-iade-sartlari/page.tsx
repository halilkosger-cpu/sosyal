import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teslimat ve İade Şartları',
  description: 'İşyurtları teslimat süreleri, kargo koşulları, cayma hakkı ve iade süreci. Siparişiniz Türkiye geneline hızlı kargo ile gönderilir.',
  alternates: { canonical: '/teslimat-iade-sartlari' },
  openGraph: {
    title: 'Teslimat ve İade Şartları',
    description: 'İşyurtları teslimat süreleri, kargo koşulları, cayma hakkı ve iade süreci. Siparişiniz Türkiye geneline hızlı kargo ile gönderilir.',
    url: '/teslimat-iade-sartlari',
  },
};
import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#BA4700] flex items-center gap-1 transition-colors">
              <LuHouse size={14} /> Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Teslimat ve İade Şartları</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Teslimat ve İade Şartları</h1>
          <p className="text-gray-600 mb-12">Son güncelleme: Nisan 2026</p>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">

            {/* Teslimat Şartları */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Teslimat Şartları</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">1.1 Teslimat Süresi</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Siparişleriniz onaylandıktan sonra 2-7 iş günü içinde kargo ile gönderilir. Bayram dönemleri ve yoğun satış dönemlerinde teslimat süresi 10 iş gününe kadar uzayabilir.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">1.2 Teslimat Adresi</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Teslimat, sipariş sırasında bildirdiğiniz adrese yapılır. Adres değişikliğini kargo gönderimine kadar bilgilendirebilirsiniz.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">1.3 Teslimat Ücreti</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Teslimat ücreti ürün seçimine göre değişebilir ve checkout sayfasında gösterilir. Belirli sipariş tutarlarında ücretsiz teslimat sunulabilir.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">1.4 Teslim Edilemeyen Kargo</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kargo adresinde bulunamazsa, kargo şirketinin kurallarına uygun olarak 3 gün daha teslimat denenir. Bu müddet sonunda ödemeniz iade edilir.
              </p>
            </section>

            {/* İade Şartları */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. İade ve Değişim Şartları</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.1 İade Hakkı</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Satın aldığınız ürünü, teslim tarihinden itibaren 14 gün içinde hiçbir neden belirtmeksizin iade edebilirsiniz. Ürün orijinal ambalajında, kullanılmamış ve hasar görmemiş durumda olmalıdır.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.2 İade Süreci</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                İade talebinizi bize ulaşarak başlatabilirsiniz. İade edilen ürün kontrol edildikten sonra (3-5 iş günü), ödemeniz orijinal ödeme yöntemine iade edilir.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.3 İade Edemeceğiniz Ürünler</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Kullanılmış, açılmış veya hasar görmüş ürünler</li>
                <li>Kargo maliyetini müşteri üstlenemeyecek ürünler için iş yurtlarının rızası gerekir</li>
                <li>Özel sipariş veya kişiye özel üretilen ürünler</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.4 Değişim</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ürünün bozuk veya kusurlu gelmesi durumunda değişimi talep edebilirsiniz. Değişim için ürünü orijinal ambalajında ve hasar görmemiş durumda bize ulaştırmalısınız.
              </p>
            </section>

            {/* Garantisi */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Ürün Garantisi</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                İşyurtlarında üretilen tüm ürünler kalite kontrol sürecinden geçmiştir. Ürünlerin garantisi ve kullanım koşulları ürün bilgisinde belirtilmiştir.
              </p>
            </section>

            {/* İletişim */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sorularınız mı var?</h3>
              <p className="text-gray-700 mb-4">
                Teslimat, iade veya değişim hakkında sorularınız varsa lütfen <Link href="/bize-ulasin" className="text-[#BA4700] font-semibold hover:text-[#cc4e00]">bizimle iletişime geçin</Link>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
