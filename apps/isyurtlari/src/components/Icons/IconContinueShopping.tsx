interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconContinueShopping({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/19_continue_shopping_alisverise_devam_et.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
