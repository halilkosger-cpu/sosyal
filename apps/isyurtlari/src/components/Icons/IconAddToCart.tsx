interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconAddToCart({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/25_add_to_cart_sepete_ekle.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
