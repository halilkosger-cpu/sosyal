interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconReintegration({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/11_reintegration_reentegrasyon.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
