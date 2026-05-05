interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconFastShipping({ className = "w-6 h-6", ariaLabel = "H?zl? Kargo" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/21_fast_shipping_hizli_kargo.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
