'use client';

import { useEffect, useRef, useState } from 'react';
import { LuBadgeCheck, LuBell } from 'react-icons/lu';

interface PreOrderFormProps {
  productId: string;
  productName: string;
}

export default function PreOrderForm({ productId, productName }: PreOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const kokRef = useRef<HTMLDivElement | null>(null);

  // Urun kartindaki "On Talep Ver" rozetinden gelindiginde (?on-talep=1)
  // formu kendiliginden ac ve gorunur alana kaydir; kullanici ikinci kez
  // tiklamak zorunda kalmasin. window uzerinden okuyoruz ki sayfanin
  // statik/dinamik render bicimi degisirse de calismaya devam etsin.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('on-talep') !== '1') return;
    setOpen(true);
    const z = window.setTimeout(() => {
      kokRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    return () => window.clearTimeout(z);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/preorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, name, email, phone, note }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ön talebiniz kaydedilemedi. Lütfen tekrar deneyin.');
        return;
      }

      setDone(true);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
        <LuBadgeCheck size={32} strokeWidth={2} className="mx-auto text-green-600 mb-2" />
        <p className="font-bold text-green-800">Ön talebiniz alındı!</p>
        <p className="text-sm text-green-700 mt-1">
          <strong>{productName}</strong> stoğa girdiğinde <strong>{email}</strong> adresine
          haber vereceğiz. Onay e-postası gönderildi.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-3">
        <div className="w-full bg-gray-100 text-gray-500 py-3.5 rounded-xl font-bold text-center">
          Şu An Stokta Yok
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-[#FF6000] hover:bg-[#e55500] text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base"
        >
          <LuBell size={18} strokeWidth={2} /> Ön Talep Ver
        </button>
        <p className="text-xs text-gray-500 text-center">
          Ürün stoğa girdiğinde size haber verelim. Ön talep bir satın alma değildir,
          ödeme alınmaz.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000]';

  return (
    <div ref={kokRef}>
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-[#FF6000] bg-orange-50/50 p-5 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <LuBell size={18} strokeWidth={2} className="text-[#FF6000]" /> Ön Talep Formu
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          Ürün stoğa girdiğinde size e-posta ile haber vereceğiz. Gerekirse telefonla da ulaşabilmemiz için numaranızı istiyoruz.
        </p>
      </div>

      {/* Adet */}
      <div className="flex items-center gap-3">
        <label htmlFor="preorder-quantity" className="text-sm text-gray-700 font-medium">
          Kaç adet istiyorsunuz?
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Adet azalt"
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-bold"
          >−</button>
          <input
            id="preorder-quantity"
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
            className="w-14 text-center font-bold text-gray-900 bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQuantity(Math.min(500, quantity + 1))}
            aria-label="Adet artır"
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-bold"
          >+</button>
        </div>
      </div>

      {/* İletişim */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="preorder-name" className="block text-xs font-medium text-gray-700 mb-1">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input
            id="preorder-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Adınız Soyadınız"
          />
        </div>
        <div>
          <label htmlFor="preorder-email" className="block text-xs font-medium text-gray-700 mb-1">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            id="preorder-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="ornek@eposta.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="preorder-phone" className="block text-xs font-medium text-gray-700 mb-1">
          Cep Telefonu <span className="text-red-500">*</span>
        </label>
        <input
          id="preorder-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="05XX XXX XX XX"
        />
      </div>

      <div>
        <label htmlFor="preorder-note" className="block text-xs font-medium text-gray-700 mb-1">
          Notunuz <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
        </label>
        <textarea
          id="preorder-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          placeholder="Renk, ölçü gibi tercihleriniz varsa yazabilirsiniz"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-3 rounded-xl font-bold text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#FF6000] hover:bg-[#e55500] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors"
        >
          {submitting ? 'Gönderiliyor…' : 'Ön Talebimi Gönder'}
        </button>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Verdiğiniz bilgiler yalnızca bu ürünün stok bildirimi için kullanılır.
        Ön talep sizi satın almaya mecbur bırakmaz.
      </p>
    </form>
    </div>
  );
}
