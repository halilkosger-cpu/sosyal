interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconReintegration({ className = "w-6 h-6", ariaLabel = "Reentegrasyon" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/11_reintegration_reentegrasyon.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
