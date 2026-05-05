'use client';

import Link from 'next/link';

export default function SecureShoppingPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Geri
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Güvenli Alışveriş</h1>
          <p className="text-gray-600 mt-2">Sizin güvenliğiniz bizim önceliğimiz</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Ödeme Güvenliği */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex gap-4 mb-4">
              <span className="text-4xl">🔒</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ödeme Güvenliği</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Tüm ödeme işlemleri şifreli ve güvenli bağlantılar üzerinden yapılır.
                  Kredi kartı bilgileriniz hiçbir şekilde sunucularımızda saklanmaz.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>SSL 256-bit şifreleme ile korunan bağlantı</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>PCI DSS sertifikası ile uyum</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Türkiye'nin güvenilen ödeme sağlayıcısı Iyzico ile işbirliği</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>3D Secure güvenli ödeme sistemi</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Kişisel Veri Güvenliği */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex gap-4 mb-4">
              <span className="text-4xl">🛡️</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Kişisel Veri Güvenliği</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Sizin kişisel ve teslim bilgileriniz KVKK mevzuatı çerçevesinde en yüksek
                  güvenlik standartları ile korunmaktadır.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Güvenli veri tabanı yedeklemeleri</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Erişim kontrolleri ve izin yönetimi</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Düzenli güvenlik denetimleri</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Veri ihlali durumunda ivedi bildirim</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Teslimat Güvenliği */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex gap-4 mb-4">
              <span className="text-4xl">📦</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Teslimat Güvenliği</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Siparişleriniz güvenilir kargo ortaklarımız tarafından takip edilebilir şekilde gönderilir.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Gerçek zamanlı sipariş takibi</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Sorun halinde para iadesi garantisi</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Paketlenmiş ürünler hasarsız teslimat için kontrol edilir</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Güvenli paketleme ve taşıma</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Gizlilik */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex gap-4 mb-4">
              <span className="text-4xl">🔐</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gizlilik ve Güven</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Verilerinizin gizliliği ve güvenliği bizim en büyük sorumluluğudur.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Verileriniz asla üçüncü taraflarla satılmaz</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Bülten aboneliği tamamen gönüllülüktür</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>İstediğiniz zaman abonelikten çıkabilirsiniz</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Detaylı gizlilik politikamız her zaman accessible</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sınırlamalar ve Tanımlama */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex gap-4 mb-4">
              <span className="text-4xl">⚠️</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sorumluluğun Sınırları</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Aşağıdaki durumlarda İsyurtları sorumluluk taşımaz:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Kullanıcının parolasının paylaşılması veya başkası tarafından kullanılması</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Bilgisayarınıza yüklenen kötü amaçlı yazılımlardan kaynaklanan hasarlar</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Kargo şirketi tarafından meydana gelen kayıp veya hasar</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Doğal afetler veya mücbir sebepler</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Güvenlik Hakkında Soru</h3>
            <p className="text-gray-600 mb-4">
              Güvenli alışveriş hakkında sorularınız varsa bizimle iletişime geçin:
            </p>
            <a href="mailto:info@isyurtlari.com.tr" className="text-blue-600 hover:text-blue-700 font-medium">
              info@isyurtlari.com.tr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
