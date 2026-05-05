interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconSocialProject({ className = "w-6 h-6", ariaLabel = "Sosyal Proje" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/08_social_project_sosyal_proje.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
