export interface AtolyeAsamasi {
  id: number;
  baslik: string;
  renk: string;
}

export const ATOLYE_ASAMALARI: AtolyeAsamasi[] = [
  { id: 0, baslik: 'Talep Alındı & Planlama', renk: 'text-gray-700 bg-gray-100 border-gray-200' },
  { id: 1, baslik: 'Hammadde & Hasat Hazırlığı', renk: 'text-amber-800 bg-amber-50 border-amber-200' },
  { id: 2, baslik: 'Atölyede Üretimde', renk: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
  { id: 3, baslik: 'Kalite Kontrol & Paketleme', renk: 'text-purple-800 bg-purple-50 border-purple-200' },
  { id: 4, baslik: 'Stoğa Alındı / Sevk Hazır', renk: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
];

export const parseStageFromNote = (note: string | null): number => {
  if (!note) return 0;
  const match = note.match(/\[AŞAMA:\s*(\d)\]/);
  return match ? parseInt(match[1], 10) : 0;
};
