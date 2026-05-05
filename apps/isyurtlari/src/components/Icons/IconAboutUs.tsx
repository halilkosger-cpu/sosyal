interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconAboutUs({ className = "w-6 h-6", ariaLabel = "Hakk?m?zda" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/06_about_hakkimizda.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
