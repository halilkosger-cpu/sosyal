interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconFurniture({ className = "w-6 h-6", ariaLabel = "Mobilya" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/05_furniture_mobilya.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
