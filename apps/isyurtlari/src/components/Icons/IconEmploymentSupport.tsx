interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconEmploymentSupport({ className = "w-6 h-6", ariaLabel = "?stihdam Deste?i" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/10_employment_support_istihdam_destegi.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
