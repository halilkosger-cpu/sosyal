import { LuDownload } from 'react-icons/lu';

type Tur = 'siparisler' | 'on-talepler' | 'terk-edilmis-sepetler';

export default function ExcelIndirDugmesi({ tur }: { tur: Tur }) {
  return (
    <a
      href={`/api/admin/excel?tur=${tur}`}
      download
      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
    >
      <LuDownload size={16} /> Excel&apos;e aktar
    </a>
  );
}
