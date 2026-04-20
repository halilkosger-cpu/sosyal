'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Backend'e gönder
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Geri
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Bize Ulaşın</h1>
          <p className="text-gray-600 mt-2">Sorularınız ve önerileriniz için bizimle iletişime geçin</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* İletişim Bilgileri */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="flex items-center gap-3 font-bold text-gray-900 mb-2">
                <span className="text-2xl">📧</span> E-posta
              </h3>
              <a href="mailto:info@isyurtlari.com.tr" className="text-blue-600 hover:text-blue-700">
                info@isyurtlari.com.tr
              </a>
            </div>

            {/* Çalışma Saatleri */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="flex items-center gap-3 font-bold text-gray-900 mb-2">
                <span className="text-2xl">⏰</span> Çalışma Saatleri
              </h3>
              <p className="text-gray-600 text-sm">
                Pazartesi - Cuma: 09:00 - 17:00<br />
                Cumartesi - Pazar: Kapalı
              </p>
            </div>
          </div>

          {/* İletişim Formu */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mesaj Gönderin</h2>

              {submitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
                  ✓ Mesajınız başarıyla alındı. Kısa sürede dönüş yapacağız.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adınız Soyadınız"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+90 (5XX) XXX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesajınız *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mesajınızı yazın..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Mesaj Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
