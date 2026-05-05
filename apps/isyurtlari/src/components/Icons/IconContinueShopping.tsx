interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconContinueShopping({ className = "w-6 h-6", ariaLabel = "Al??veri?e Devam Et" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/19_continue_shopping_alisverise_devam_et.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
