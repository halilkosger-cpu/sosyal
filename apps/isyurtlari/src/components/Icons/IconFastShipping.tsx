interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconFastShipping({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/21_fast_shipping_hizli_kargo.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
