interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconCustomerSupport({ className = "w-6 h-6", ariaLabel = "M??teri Destek" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/27_customer_support_musteri_destek.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
