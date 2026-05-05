'use client';

import { useEffect, useState } from 'react';
import { LuActivity, LuCheck, LuX, LuLoader, LuFilter } from 'react-icons/lu';

interface AuditLog {
  timestamp: string;
  action: string;
  email: string;
  ip?: string;
  status: 'success' | 'failed';
  details?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=100');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <LuActivity className="text-blue-600" size={24} />
            </div>
            Audit Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tüm admin giriş denemelerini izleyin</p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Yenile
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(['all', 'success', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? status === 'success'
                  ? 'bg-green-100 text-green-700'
                  : status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all'
              ? `Tümü (${logs.length})`
              : status === 'success'
              ? `Başarılı (${logs.filter((l) => l.status === 'success').length})`
              : `Başarısız (${logs.filter((l) => l.status === 'failed').length})`}
          </button>
        ))}
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LuLoader className="inline animate-spin text-gray-400 mb-2" size={32} />
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <LuFilter className="inline text-gray-400 mb-2" size={32} />
            <p className="text-gray-500">Hiç log bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Tarih & Saat</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">İşlem</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">IP Adresi</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Durum</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Detay</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 text-gray-700">{log.email}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{log.ip || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <>
                            <LuCheck className="text-green-600 bg-green-100 rounded-full p-1" size={18} />
                            <span className="text-green-700 font-medium">Başarılı</span>
                          </>
                        ) : (
                          <>
                            <LuX className="text-red-600 bg-red-100 rounded-full p-1" size={18} />
                            <span className="text-red-700 font-medium">Başarısız</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Toplam Deneme</p>
          <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Başarılı Girişler</p>
          <p className="text-3xl font-bold text-green-600">{logs.filter((l) => l.status === 'success').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Başarısız Denemeler</p>
          <p className="text-3xl font-bold text-red-600">{logs.filter((l) => l.status === 'failed').length}</p>
        </div>
      </div>
    </div>
  );
}
