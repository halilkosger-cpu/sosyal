interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconCustomerSupport({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/27_customer_support_musteri_destek.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
