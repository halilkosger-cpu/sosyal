'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuActivity, LuInfo, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

/**
 * Yönetim: denetim günlüğü.
 *
 * Kayıtlar veritabanında tutuluyor (bkz. lib/audit-log.ts); bu ekran
 * onları okunur hâle getiriyor. Önceden günlüğü gösteren bir ekran yoktu,
 * yalnızca /api/admin/audit-logs ucu vardı - ve o uç da bellekteki diziyi
 * okuduğu için çoğu zaman boş dönüyordu.
 *
 * Süzgeçler sunucuda çalışıyor: tablo zamanla büyüyecek, tamamını çekip
 * tarayıcıda süzmek aynı hatayı tekrarlamak olurdu.
 */

interface Kayit {
  id: string;
  timestamp: string;
  action: string;
  email: string;
  status: string;
  details?: string;
  ip?: string;
}

const SAYFA_ADEDI = 50;

/** İşlem kodlarının okunur karşılıkları. Listede olmayan kod olduğu gibi yazılır. */
const ISLEM_METNI: Record<string, string> = {
  OTP_REQUEST: 'Giriş kodu istendi',
  OTP_VERIFY: 'Giriş kodu doğrulandı',
  IADE_DURUM: 'İade durumu değiştirildi',
  PREORDER_NOTIFY: 'Ön talep bildirimi gönderildi',
};

export default function AdminDenetim() {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [islemler, setIslemler] = useState<string[]>([]);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaSayisi, setSayfaSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [islem, setIslem] = useState('');
  const [durum, setDurum] = useState('');
  const [eposta, setEposta] = useState('');
  /** Yazarken her tuşta istek atılmasın diye aramaya ayrı bir durum. */
  const [epostaTaslak, setEpostaTaslak] = useState('');

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const p = new URLSearchParams({ sayfa: String(sayfa), limit: String(SAYFA_ADEDI) });
      if (islem) p.set('islem', islem);
      if (durum) p.set('durum', durum);
      if (eposta) p.set('email', eposta);

      const yanit = await fetch(`/api/admin/audit-logs?${p.toString()}`, { cache: 'no-store' });
      if (!yanit.ok) {
        setHata(yanit.status === 401 ? 'Oturumunuz sona ermiş görünüyor.' : 'Kayıtlar getirilemedi');
        setKayitlar([]);
        return;
      }
      const veri = await yanit.json();
      setKayitlar(Array.isArray(veri.logs) ? veri.logs : []);
      setIslemler(Array.isArray(veri.islemler) ? veri.islemler : []);
      setToplam(veri.toplam ?? 0);
      setSayfaSayisi(veri.sayfaSayisi ?? 0);
      setHata('');
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  }, [sayfa, islem, durum, eposta]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  /** Süzgeç değişince ilk sayfaya dön; yoksa boş sayfada kalınabiliyor. */
  const suzgecDegistir = (uygula: () => void) => {
    setSayfa(1);
    uygula();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <LuActivity size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Denetim Günlüğü</h1>
          <p className="text-sm text-gray-500">
            {yukleniyor ? '...' : `${toplam} kayıt`}
          </p>
        </div>
      </div>

      {/* Süzgeçler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={islem}
          onChange={(e) => suzgecDegistir(() => setIslem(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tüm işlemler</option>
          {islemler.map((i) => (
            <option key={i} value={i}>
              {ISLEM_METNI[i] ?? i}
            </option>
          ))}
        </select>

        <select
          value={durum}
          onChange={(e) => suzgecDegistir(() => setDurum(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Başarılı + başarısız</option>
          <option value="success">Yalnızca başarılı</option>
          <option value="failed">Yalnızca başarısız</option>
        </select>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            suzgecDegistir(() => setEposta(epostaTaslak.trim()));
          }}
          className="flex gap-2"
        >
          <input
            value={epostaTaslak}
            onChange={(e) => setEpostaTaslak(e.target.value)}
            placeholder="E-posta ile süz"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56"
          />
          <button
            type="submit"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            Süz
          </button>
          {eposta && (
            <button
              type="button"
              onClick={() =>
                suzgecDegistir(() => {
                  setEposta('');
                  setEpostaTaslak('');
                })
              }
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Temizle
            </button>
          )}
        </form>
      </div>

      {hata && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
          <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
          <div>{hata}</div>
        </div>
      )}

      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
        </div>
      ) : kayitlar.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
          Bu süzgeçle eşleşen kayıt yok.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Zaman</th>
                  <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">İşlem</th>
                  <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Kim</th>
                  <th className="text-left font-semibold px-4 py-3">Ayrıntı</th>
                  <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody>
                {kayitlar.map((k) => (
                  <tr key={k.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(k.timestamp).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                          k.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        title={k.status === 'success' ? 'Başarılı' : 'Başarısız'}
                      />
                      <span className="font-medium text-gray-900">
                        {ISLEM_METNI[k.action] ?? k.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{k.email}</td>
                    <td className="px-4 py-3 text-gray-600 break-words max-w-md">
                      {k.details ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono text-xs">
                      {k.ip ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sayfaSayisi > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setSayfa((s) => Math.max(1, s - 1))}
                disabled={sayfa <= 1}
                className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <LuChevronLeft size={16} /> Önceki
              </button>
              <span className="text-sm text-gray-500">
                Sayfa {sayfa} / {sayfaSayisi}
              </span>
              <button
                onClick={() => setSayfa((s) => Math.min(sayfaSayisi, s + 1))}
                disabled={sayfa >= sayfaSayisi}
                className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Sonraki <LuChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
