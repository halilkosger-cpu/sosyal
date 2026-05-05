interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconWeaving({ className = "w-6 h-6", ariaLabel = "Dokuma" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/04_weaving_dokuma.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
