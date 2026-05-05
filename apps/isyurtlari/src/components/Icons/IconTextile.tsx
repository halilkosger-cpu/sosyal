interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconTextile({ className = "w-6 h-6", ariaLabel = "Tekstil" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/02_textile_tekstil.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
