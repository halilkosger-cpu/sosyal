interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconOrderTracking({ className = "w-6 h-6", ariaLabel = "Sipari? Takibi" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/26_order_tracking_siparis_takibi.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
