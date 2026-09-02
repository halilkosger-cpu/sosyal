import { LuBell } from 'react-icons/lu';

/**
 * Stokta olmayan ürün kartlarında "Tükendi" rozetinin altında görünür.
 *
 * Bilinçli olarak buton değil: ürün kartının tamamı zaten ürün sayfasına
 * giden bir <Link>. İçine ikinci bir tıklanabilir öğe koymak iç içe
 * interaktif eleman oluşturur ve mobilde yanlış tıklamaya yol açar.
 * Karta tıklayan zaten ön talep formunun bulunduğu sayfaya gidiyor.
 */
export default function PreOrderBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#FF6000] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm whitespace-nowrap ${className}`}
    >
      <LuBell size={11} strokeWidth={2.5} aria-hidden="true" />
      Ön Talep Ver
    </span>
  );
}
