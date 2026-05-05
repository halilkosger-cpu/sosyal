interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconMinistryJustice({ className = "w-6 h-6", ariaLabel = "Adalet Bakanl???" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/09_ministry_justice_adalet_bakanligi.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
