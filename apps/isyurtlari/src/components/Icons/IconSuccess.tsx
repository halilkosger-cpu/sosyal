interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconSuccess({ className = "w-6 h-6", ariaLabel = "Ba?ar?l?" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/18_success_basarili.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
