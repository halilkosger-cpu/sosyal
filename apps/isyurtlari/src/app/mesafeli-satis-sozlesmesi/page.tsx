import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi',
  description: 'İşyurtları mesafeli satış sözleşmesi: sipariş, ödeme, teslimat, cayma hakkı ve iade süreçlerine ilişkin taraf hak ve yükümlülükleri.',
  alternates: { canonical: '/mesafeli-satis-sozlesmesi' },
  openGraph: {
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'İşyurtları mesafeli satış sözleşmesi: sipariş, ödeme, teslimat, cayma hakkı ve iade süreçlerine ilişkin taraf hak ve yükümlülükleri.',
    url: '/mesafeli-satis-sozlesmesi',
  },
};
import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';

export default function DistanceSalesPage() {
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
            <span className="text-gray-900 font-medium">Mesafeli Satış Sözleşmesi</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Mesafeli Satış Sözleşmesi</h1>
          <p className="text-gray-600 mb-12">Son güncelleme: Nisan 2026</p>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">

            {/* Taraflar */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Sözleşmenin Tarafları</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Satıcı (İşletmeci):</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Şirket Adı:</strong> isyurtlari.com.tr<br/>
                <strong>Türü:</strong> Hükümlü Sosyal Girişimi<br/>
                <strong>Web Sitesi:</strong> https://isyurtlari.com.tr<br/>
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Alıcı (Müşteri):</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Platform'dan ürün satın alan gerçek kişi
              </p>
            </section>

            {/* Tanımlar */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tanımlar</h2>
              <ul className="space-y-3 text-gray-700">
                <li><strong>Platform:</strong> isyurtlari.com.tr web sitesi ve mobil uygulamaları</li>
                <li><strong>Ürün:</strong> Platform'da sunulan tüm mal ve hizmetler</li>
                <li><strong>Sipariş:</strong> Alıcı tarafından Platform'da yapılan satın alma talebi</li>
                <li><strong>Mesafeli Satış:</strong> Taraf'ın fiziki mevcudiyeti olmaksızın yapılan satış</li>
              </ul>
            </section>

            {/* Sözleşmenin Konusu */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Sözleşmenin Konusu</h2>
              <p className="text-gray-700 leading-relaxed">
                Bu sözleşme, Alıcı'nın Platform'da seçtiği ürünü Satıcı'dan satın alması ve Satıcı'nın bu ürünü teslimatı taahhüt etmesine ilişkindir. Sipariş veya ödeme işlemi yapılması ile bu sözleşme otomatik olarak kabul edilmiş sayılır.
              </p>
            </section>

            {/* Ürün Bilgileri */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Ürün ve Hizmet Bilgileri</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Platform'da yer alan tüm ürün bilgileri (fiyat, açıklama, resim) doğru ve güncel bilgiler içermektedir. Ürün fiyatları TL cinsinden gösterilmektedir.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Fiyatlar değişikliğe tabi olabilir ancak siparişiniz onaylandıktan sonra fiyat değişikliği uygulanmaz.
              </p>
            </section>

            {/* Ödeme */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Ödeme ve Fiyatlandırma</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">5.1 Toplam Tutar</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Toplam tutar, ürün fiyatı + KDV + kargo ücreti olarak hesaplanır ve checkout sayfasında gösterilir.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">5.2 Ödeme Yöntemleri</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Kredi Kartı (Iyzico aracılığıyla)</li>
                <li>Banka Transferi / Havale</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">5.3 Ödeme Onayı</h3>
              <p className="text-gray-700 leading-relaxed">
                Ödeme onaylandıktan sonra siparişiniz işlenmeye başlar. Banka transferi seçerseniz, transfer yapıldıktan sonra manuel onay gerekir (1-2 gün).
              </p>
            </section>

            {/* Kargo ve Teslimat */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Kargo ve Teslimat</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Teslimat süresi, kargo firması tarafından verilen müddetlerdir ve garanti değildir. Taşıma sırasında oluşan hasarlardan kargo firması sorumludur.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Detaylı teslimat şartları için <Link href="/teslimat-iade-sartlari" className="text-[#BA4700] font-semibold hover:text-[#cc4e00]">Teslimat ve İade Şartları</Link> sayfasını ziyaret ediniz.
              </p>
            </section>

            {/* İade Hakkı */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. İade Hakkı</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                6502 sayılı Tüketicinin Korunması Hakkında Kanun'a göre, Alıcı teslim tarihinden itibaren 14 gün içinde herhangi bir neden belirtmeksizin satın almış olduğu ürünü iade edebilir. İade edilen ürün orijinal ambalajında, hasar görmemiş ve kullanılmamış durumda olmalıdır.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Detaylı işlem adımları için <Link href="/teslimat-iade-sartlari" className="text-[#BA4700] font-semibold hover:text-[#cc4e00]">Teslimat ve İade Şartları</Link> sayfasını ziyaret ediniz.
              </p>
            </section>

            {/* Sorumluluk */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Sorumluluk</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Satıcı, Platform'un kesintisiz erişimine veya ürün stoğunun devamlılığına garantü vermez. Ürün stoku bitmesi durumunda siparişi iptal eder ve ödemenizi iade eder.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Platform veya ürünlerden kaynaklanan dolaylı, özel veya cezai zararlardan sorumlu değildir.
              </p>
            </section>

            {/* Gizlilik */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Gizlilik</h2>
              <p className="text-gray-700 leading-relaxed">
                Kişisel verilerinizin işlenmesi hakkında detaylı bilgiler için <Link href="/gizlilik-sozlesmesi" className="text-[#BA4700] font-semibold hover:text-[#cc4e00]">Gizlilik Sözleşmesi</Link> sayfasını ziyaret ediniz.
              </p>
            </section>

            {/* Yasal Uyarı */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Yasal Uyarı</h2>
              <p className="text-gray-700 leading-relaxed">
                isyurtlari.com.tr, Adalet Bakanlığı veya İşyurtları Genel Müdürlüğü'nün resmi platformu değildir ve söz konusu kurumlarla hukuki bir bağı bulunmamaktadır. Platform, bağımsız olarak İşyurtları Genel Müdürlüğü tarafından üretilen ürünlerin satışını gerçekleştirmektedir.
              </p>
            </section>

            {/* Değişiklik Hakkı */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Sözleşmenin Değiştirilmesi</h2>
              <p className="text-gray-700 leading-relaxed">
                Satıcı, bu sözleşmeyi ve Platform hizmetlerini dilediği zaman değiştirme hakkını saklı tutar. Değişiklikler Platform'da yayınlandığı anda yürürlüğe girer.
              </p>
            </section>

            {/* İletişim */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Müşteri Destek</h3>
              <p className="text-gray-700 mb-4">
                Mesafeli satış hakkında sorularınız için lütfen <Link href="/bize-ulasin" className="text-[#BA4700] font-semibold hover:text-[#cc4e00]">bizimle iletişime geçin</Link>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
