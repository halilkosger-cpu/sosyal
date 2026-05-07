interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconOrderTracking({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/26_order_tracking_siparis_takibi.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
