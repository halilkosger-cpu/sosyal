'use client';

import { useState } from 'react';
import { LuMail, LuLoader } from 'react-icons/lu';

export default function EmailPage() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    html: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `✅ Email başarıyla gönderildi! (ID: ${data.id})` });
        setFormData({ to: '', subject: '', html: '' });
      } else {
        setMessage({ type: 'error', text: `❌ Hata: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Bağlantı hatası: ${String(error)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#CC4E00]/10 p-3 rounded-lg">
            <LuMail className="text-[#BA4700]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Gönder</h1>
            <p className="text-sm text-gray-500">info@isyurtlari.com.tr adresinden email gönder</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alıcı Email Adresi *
            </label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              placeholder="ornek@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6000] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konu *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Email konusu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6000] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İçerik (HTML) *
            </label>
            <textarea
              name="html"
              value={formData.html}
              onChange={handleChange}
              required
              rows={10}
              placeholder="<h1>Merhaba!</h1><p>Bu bir test emailidir.</p>"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6000] focus:border-transparent outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">HTML formatında yazabilirsiniz</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#CC4E00] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#E55A00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LuLoader size={18} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <LuMail size={18} />
                  Email Gönder
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 İpuçları:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• HTML kullanarak şık email'ler tasarla</li>
            <li>• Örnek: &lt;h1&gt;Başlık&lt;/h1&gt;&lt;p&gt;Paragraf&lt;/p&gt;</li>
            <li>• CSS inline style'lar da destekleniyor</li>
            <li>• Email ID'si başarı mesajında gösterilir</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
