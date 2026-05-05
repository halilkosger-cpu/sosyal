interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconCart({ className = "w-6 h-6", ariaLabel = "Al??veri? Sepeti" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/14_shopping_cart_alisveris_sepeti.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
