interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconAddToCart({ className = "w-6 h-6", ariaLabel = "Sepete Ekle" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/25_add_to_cart_sepete_ekle.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
