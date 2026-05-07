interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconWeekSpecial({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/16_week_special_bu_hafta_ozel.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
