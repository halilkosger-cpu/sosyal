interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconWeekSpecial({ className = "w-6 h-6", ariaLabel = "Bu Hafta ?zel" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/16_week_special_bu_hafta_ozel.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
