interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconEasyReturn({ className = "w-6 h-6", ariaLabel = "Kolay ?ade" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/22_easy_return_kolay_iade.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
