interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconProductOrigin({ className = "w-6 h-6", ariaLabel = "?r?n Kayna??" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/13_product_origin_bu_urun_kimden_geliyor.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
