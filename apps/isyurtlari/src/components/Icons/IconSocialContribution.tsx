interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconSocialContribution({ className = "w-6 h-6", ariaLabel = "Sosyal Katk?" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/23_social_contribution_sosyal_katki.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
