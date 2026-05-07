interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconProductOrigin({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/13_product_origin_bu_urun_kimden_geliyor.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
