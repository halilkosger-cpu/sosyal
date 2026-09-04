import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Sözleşmesi',
  description: 'İşyurtları gizlilik sözleşmesi: topladığımız bilgiler, çerez kullanımı, verilerin saklanması ve üçüncü taraflarla paylaşım koşulları.',
  alternates: { canonical: '/gizlilik-sozlesmesi' },
  openGraph: {
    title: 'Gizlilik Sözleşmesi',
    description: 'İşyurtları gizlilik sözleşmesi: topladığımız bilgiler, çerez kullanımı, verilerin saklanması ve üçüncü taraflarla paylaşım koşulları.',
    url: '/gizlilik-sozlesmesi',
  },
};
import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#CC4E00] flex items-center gap-1 transition-colors">
              <LuHouse size={14} /> Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Gizlilik Sözleşmesi</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Gizlilik Sözleşmesi</h1>
          <p className="text-gray-600 mb-12">Son güncelleme: Nisan 2026</p>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">

            {/* Amaç */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Gizlilik Politikası Amacı</h2>
              <p className="text-gray-700 leading-relaxed">
                isyurtlari.com.tr ("Platform") tarafından sağlanan hizmetlerde kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklamaktır. Platformu kullanarak bu politikayı kabul etmiş sayılırsınız.
              </p>
            </section>

            {/* Toplanan Veriler */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Toplanan Kişisel Veriler</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.1 Sipariş Sırasında Toplanan Veriler</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Ad ve soyad</li>
                <li>E-posta adresi</li>
                <li>Telefon numarası</li>
                <li>Teslimat adresi</li>
                <li>Ödeme bilgileri (iyzico aracılığıyla)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">2.2 Otomatik Olarak Toplanan Veriler</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>IP adresi</li>
                <li>Tarayıcı türü ve versiyonu</li>
                <li>İşletim sistemi</li>
                <li>Ziyaret edilen sayfalar</li>
                <li>Tıklanan linkler</li>
              </ul>
            </section>

            {/* Veri Kullanımı */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Kişisel Verilerin Kullanılması</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla kullanılır:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Sipariş işleme ve teslimat</li>
                <li>Ödeme işlemleri</li>
                <li>Siparişiniz hakkında bilgilendirme</li>
                <li>Müşteri desteği sağlama</li>
                <li>Platform geliştirme ve iyileştirme</li>
                <li>Yasal yükümlülükleri yerine getirme</li>
              </ul>
            </section>

            {/* Veri Güvenliği */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Veri Güvenliği</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kişisel verileriniz şifreleme (SSL/HTTPS) ve diğer güvenlik önlemleri ile korunmaktadır. Ödeme bilgileri iyzico tarafından güvenli şekilde işlenir ve PCI DSS standartlarına uygun tutulur.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ancak internet üzerinden hiçbir veri aktarımı %100 güvenli değildir. Platform, makul güvenlik önlemleri almakla birlikte, veri ihlali riskinden tamamen sorumlu değildir.
              </p>
            </section>

            {/* Veri Saklama */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Veri Saklama Süresi</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Siparış verileriniz, sipariş tamamlandıktan sonra 3 yıl boyunca muhasebe ve yasal amaçlarla saklanır. Söz konusu süre sonunda verileriniz silinir.
              </p>
            </section>

            {/* Haklar */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Veri Sahibinin Hakları</h2>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                KVKK (Kişisel Verileri Koruma Kanunu) kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Verilerinizi silme</li>
                <li>Verilerinizi düzeltme</li>
                <li>Verilerinizin işlenmesine itiraz etme</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Bu haklarınızı kullanmak için lütfen <Link href="/bize-ulasin" className="text-[#CC4E00] font-semibold hover:text-[#cc4e00]">bizimle iletişime geçin</Link>.
              </p>
            </section>

            {/* İletişim */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Gizlilik Hakkında Sorularınız mı var?</h3>
              <p className="text-gray-700">
                Kişisel verilerinizin işlenmesi veya gizliliğiniz hakkında sorularınız varsa lütfen <Link href="/bize-ulasin" className="text-[#CC4E00] font-semibold hover:text-[#cc4e00]">bizimle iletişime geçin</Link>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
