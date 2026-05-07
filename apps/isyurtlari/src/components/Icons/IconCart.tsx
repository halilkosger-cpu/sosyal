interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconCart({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/14_shopping_cart_alisveris_sepeti.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
