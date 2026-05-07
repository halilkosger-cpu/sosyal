interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconSocialContribution({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/23_social_contribution_sosyal_katki.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
