'use client';

import Link from 'next/link';

export default function KVKKPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Geri
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Kişisel Verilerin Korunması</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-8 max-w-4xl">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-900 text-sm">
              <strong>Son Güncelleme:</strong> 1 Şubat 2026
            </p>
          </div>

          {/* İntroduktion */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giriş</h2>
            <p className="text-gray-600 leading-relaxed">
              İsyurtları (bundan sonra "Şirket"), 6698 sayılı Kişisel Verilerin Korunması Kanunu
              (KVKK) ve ilgili tüm mevzuata uygun olarak kişisel verilerinizi işlemektedir.
              Bu gizlilik politikası, verilerinizin nasıl toplandığı, kullanıldığı, korunduğu
              ve haklarınız hakkında bilgi vermektedir.
            </p>
          </section>

          {/* Veri Toplama */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Toplanan Kişisel Veriler</h2>
            <p className="text-gray-600 mb-4">Aşağıdaki kişisel verileriniz toplanabilir:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex gap-3">
                <span>•</span>
                <span>Ad, soyad, e-posta adresi, telefon numarası</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Teslimat adresi ve ödeme bilgileri</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>IP adresi, çerez (cookie) verisi, tarayıcı bilgileri</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Satın alma geçmişi ve tercihleriniz</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>İletişim yoluyla paylaştığınız bilgiler</span>
              </li>
            </ul>
          </section>

          {/* Veri Kullanımı */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kişisel Verilerin Kullanımı</h2>
            <p className="text-gray-600 mb-4">Kişisel verileriniz aşağıdaki amaçlarla kullanılır:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex gap-3">
                <span>•</span>
                <span>Sipariş işleme ve teslimat</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Müşteri hizmetleri ve destek sağlama</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Yasal yükümlülüklerimizi yerine getirme</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Hizmetlerimizi iyileştirme ve geliştirme</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Pazarlama ve istatistiksel analiz (izniniz ile)</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Dolandırıcılık ve güvenlik tehditleri ile mücadele</span>
              </li>
            </ul>
          </section>

          {/* Veri Paylaşımı */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Veri Paylaşımı</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verileriniz aşağıdaki durumlarda üçüncü kişilerle paylaşılabilir:
            </p>
            <ul className="space-y-2 text-gray-600 mt-4">
              <li className="flex gap-3">
                <span>•</span>
                <span>Kargo ve lojistik hizmetleri sağlayıcıları</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Ödeme işlem sağlayıcıları (Iyzico vb.)</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Yasal gereklilikler veya mahkeme kararları gereği</span>
              </li>
            </ul>
          </section>

          {/* Veri Güvenliği */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Veri Güvenliği</h2>
            <p className="text-gray-600 leading-relaxed">
              Verilerinizin güvenliğini sağlamak için endüstri standartlarında güvenlik
              önlemleri alınmaktadır. Bunlar SSL/TLS şifreleme, düzenli güvenlik denetimleri
              ve erişim kontrolleri içerir. Ancak internet üzerinde hiçbir iletim %100 güvenli
              değildir.
            </p>
          </section>

          {/* Veri Saklama */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Veri Saklama Süresi</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verileriniz toplandığı amaçlar gerçekleştirilene kadar, yasal yükümlülükler
              gereği gerekli olduğu sürece veya hukuki iddiaların zamanaşımına uğraması kadar
              saklanacaktır.
            </p>
          </section>

          {/* Haklarınız */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kişisel Verileri Koruma Kanunu Kapsamındaki Haklarınız</h2>
            <p className="text-gray-600 mb-4">KVKK uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex gap-3">
                <span>•</span>
                <span>Verilerinizin işlenip işlenmediğini ve nasıl işlendiğini öğrenme</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Verilerinizin düzeltilmesini talep etme</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Verilerinizin silinmesini talep etme</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Veri işlemeyi sınırlandırma talebinde bulunma</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Verilerinizi taşınabilir bir formatta alma</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Otomatik karar alma ve profillemeye karşı itiraz etme</span>
              </li>
            </ul>
            <p className="text-gray-600 mt-4">
              Bu haklarınızı kullanmak için <a href="mailto:info@isyurtlari.com.tr" className="text-blue-600 hover:text-blue-700">
                info@isyurtlari.com.tr
              </a> adresine başvurabilirsiniz.
            </p>
          </section>

          {/* İletişim */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">İletişim</h2>
            <p className="text-gray-600 mb-2">
              Gizlilik politikamız hakkında sorularınız varsa lütfen bizimle iletişime geçin:
            </p>
            <p className="text-gray-600">
              <strong>E-posta:</strong> <a href="mailto:info@isyurtlari.com.tr" className="text-blue-600 hover:text-blue-700">
                info@isyurtlari.com.tr
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
